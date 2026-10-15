-- SecondMeet profile gallery foundation.
-- Apply with the Supabase postgres migration role. This file has not been executed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'secondmeet-profile-photos',
  'secondmeet-profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.profile_photos (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  position smallint not null check (position between 0 and 7),
  created_at timestamptz not null default pg_catalog.now(),
  primary key (profile_id, position)
);

alter table public.profile_photos enable row level security;
revoke all on table public.profile_photos from public, anon, authenticated;
grant select, insert, update, delete on table public.profile_photos to authenticated;

drop policy if exists "Owners manage their profile photos" on public.profile_photos;
create policy "Owners manage their profile photos"
on public.profile_photos for all to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create or replace function public.can_read_discovery_photo(object_name text)
returns boolean
language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1
    from public.profile_photos as ph
    join public.profiles as p on p.id = ph.profile_id
    where ph.storage_path = object_name
      and p.id <> (select auth.uid())
      and p.discovery_id::text = (storage.foldername(object_name))[1]
      and p.is_discoverable is true
      and nullif(pg_catalog.btrim(p.display_name), '') is not null
      and p.date_of_birth <= (current_date - interval '18 years')::date
  );
$function$;

drop policy if exists "Discoverable profile photos can be downloaded" on storage.objects;
create policy "Discoverable profile photos can be downloaded"
on storage.objects for select to authenticated
using (
  bucket_id = 'secondmeet-profile-photos'
  and public.can_read_discovery_photo(name)
);

drop policy if exists "Owners upload profile photos" on storage.objects;
create policy "Owners upload profile photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'secondmeet-profile-photos'
  and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "Owners update profile photos" on storage.objects;
create policy "Owners update profile photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'secondmeet-profile-photos'
  and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'secondmeet-profile-photos'
  and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "Owners delete profile photos" on storage.objects;
create policy "Owners delete profile photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'secondmeet-profile-photos'
  and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )
);

-- New RPCs retain the existing discover_profiles() contract and never return Auth UUIDs.
create or replace function public.discover_profiles_with_photo_paths()
returns table (
  profile_id uuid,
  display_name text,
  age integer,
  gender text,
  interests text[],
  main_photo_path text
)
language sql stable security definer set search_path = ''
as $function$
  select p.discovery_id, p.display_name,
    extract(year from pg_catalog.age(current_date, p.date_of_birth))::integer,
    p.gender, p.interests,
    (select ph.storage_path from public.profile_photos as ph
      where ph.profile_id = p.id order by ph.position limit 1)
  from public.profiles as p
  where (select auth.uid()) is not null
    and p.id <> (select auth.uid())
    and p.is_discoverable is true
    and nullif(pg_catalog.btrim(p.display_name), '') is not null
    and p.date_of_birth <= (current_date - interval '18 years')::date
  order by p.created_at desc, p.discovery_id
  limit 50;
$function$;

create or replace function public.discover_profile_photo_paths(target_discovery_id uuid)
returns table (storage_path text, position smallint)
language sql stable security definer set search_path = ''
as $function$
  select ph.storage_path, ph.position
  from public.profiles as p
  join public.profile_photos as ph on ph.profile_id = p.id
  where (select auth.uid()) is not null
    and p.discovery_id = target_discovery_id
    and p.id <> (select auth.uid())
    and p.is_discoverable is true
    and nullif(pg_catalog.btrim(p.display_name), '') is not null
    and p.date_of_birth <= (current_date - interval '18 years')::date
  order by ph.position
  limit 8;
$function$;

create or replace function public.set_profile_photos(storage_paths text[])
returns void
language plpgsql security invoker set search_path = ''
as $function$
declare
  caller_id uuid := (select auth.uid());
  caller_discovery_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if storage_paths is null or pg_catalog.cardinality(storage_paths) > 8 then
    raise exception 'A profile can have up to eight photos.' using errcode = '22023';
  end if;
  select p.discovery_id into caller_discovery_id
  from public.profiles as p where p.id = caller_id;
  if caller_discovery_id is null then
    raise exception 'The authenticated user does not have a profile.' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from pg_catalog.unnest(storage_paths) as requested(path)
    where requested.path is null
      or requested.path not like caller_discovery_id::text || '/%'
  ) then
    raise exception 'A photo path does not belong to the authenticated profile.' using errcode = '22023';
  end if;
  if (select pg_catalog.count(distinct path) from pg_catalog.unnest(storage_paths) as requested(path))
      <> pg_catalog.cardinality(storage_paths) then
    raise exception 'Duplicate photos are not allowed.' using errcode = '22023';
  end if;

  delete from public.profile_photos where profile_id = caller_id;
  insert into public.profile_photos (profile_id, storage_path, position)
  select caller_id, requested.path, (requested.ordinality - 1)::smallint
  from pg_catalog.unnest(storage_paths) with ordinality as requested(path, ordinality);
end;
$function$;

-- These SECURITY DEFINER functions must be owned by a role able to read the
-- profile rows through owner-only RLS; execute this migration as postgres.
revoke execute on function public.discover_profiles_with_photo_paths() from public, anon;
grant execute on function public.discover_profiles_with_photo_paths() to authenticated;
revoke execute on function public.discover_profile_photo_paths(uuid) from public, anon;
grant execute on function public.discover_profile_photo_paths(uuid) to authenticated;
revoke execute on function public.set_profile_photos(text[]) from public, anon;
grant execute on function public.set_profile_photos(text[]) to authenticated;
revoke execute on function public.can_read_discovery_photo(text) from public, anon;
grant execute on function public.can_read_discovery_photo(text) to authenticated;
