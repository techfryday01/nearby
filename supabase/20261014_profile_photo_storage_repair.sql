-- SecondMeet private gallery Storage repair. Do not execute automatically.
-- Execute manually as the Supabase postgres migration role after review.
-- Prerequisite: 20261004_profile_gallery.sql (gallery metadata + RPCs).
-- The SECURITY DEFINER helper must be owned by a role intentionally able to
-- bypass profiles RLS. No profile RLS or discovery/matching RPC changes.
-- Re-runnable; preserves existing profiles, metadata and Storage objects.
begin;
do $check$
begin
  if pg_catalog.to_regclass('public.profile_photos') is null
     or pg_catalog.to_regprocedure('public.set_profile_photos(text[])') is null then
    raise exception 'Apply 20261004_profile_gallery.sql first, then rerun this migration.';
  end if;
end;
$check$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'secondmeet-profile-photos',
  'secondmeet-profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_read_discovery_photo(object_name text)
returns boolean
language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1
    from public.profile_photos as ph
    join public.profiles as p on p.id = ph.profile_id
    where (select auth.uid()) is not null
      and ph.storage_path = object_name
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


drop policy if exists "Owners read profile photos" on storage.objects;
create policy "Owners read profile photos" on storage.objects
for select to authenticated
using (bucket_id = 'secondmeet-profile-photos' and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  ));

revoke execute on function public.can_read_discovery_photo(text) from public, anon, authenticated;
grant execute on function public.can_read_discovery_photo(text) to authenticated;

-- Supabase enables Storage RLS. Restrictive boundaries guard this bucket even
-- when other permissive Storage policies exist. Other buckets are unaffected.
-- Signed URLs issued by the app expire after one hour; already issued URLs may
-- remain usable until expiry after discoverability is turned off.

drop policy if exists "SecondMeet photo select boundary" on storage.objects;
create policy "SecondMeet photo select boundary" on storage.objects
as restrictive for select to authenticated
using (bucket_id <> 'secondmeet-profile-photos' or ((select auth.uid()) is not null and (exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  ) or public.can_read_discovery_photo(name))))
;

drop policy if exists "SecondMeet photo insert boundary" on storage.objects;
create policy "SecondMeet photo insert boundary" on storage.objects
as restrictive for insert to authenticated
with check (bucket_id <> 'secondmeet-profile-photos' or ((select auth.uid()) is not null and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )))
;

drop policy if exists "SecondMeet photo update boundary" on storage.objects;
create policy "SecondMeet photo update boundary" on storage.objects
as restrictive for update to authenticated
using (bucket_id <> 'secondmeet-profile-photos' or ((select auth.uid()) is not null and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )))
with check (bucket_id <> 'secondmeet-profile-photos' or ((select auth.uid()) is not null and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )))
;

drop policy if exists "SecondMeet photo delete boundary" on storage.objects;
create policy "SecondMeet photo delete boundary" on storage.objects
as restrictive for delete to authenticated
using (bucket_id <> 'secondmeet-profile-photos' or ((select auth.uid()) is not null and exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.discovery_id::text = (storage.foldername(name))[1]
  )))
;

drop policy if exists "SecondMeet photos deny anonymous access" on storage.objects;
create policy "SecondMeet photos deny anonymous access" on storage.objects
as restrictive for all to anon
using (bucket_id <> 'secondmeet-profile-photos')
with check (bucket_id <> 'secondmeet-profile-photos');
commit;
