-- Nearby likes and matches foundation.
-- This migration must be executed using the Supabase postgres migration role.
-- process_like() must be owned by a role intentionally authorized to bypass
-- the relevant RLS policies for its controlled reads/writes. Apply this
-- migration using Supabase's postgres migration role so SECURITY DEFINER runs
-- with those privileges. Do not weaken the profiles owner-only RLS policy or
-- add automatic ownership/privilege changes here.

create table if not exists public.likes (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint likes_action_allowed check (action in ('like', 'pass', 'super_like')),
  constraint likes_no_self_action check (from_profile_id <> to_profile_id),
  constraint likes_one_action_per_pair unique (from_profile_id, to_profile_id)
);

create table if not exists public.matches (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  profile_a_id uuid not null references public.profiles (id) on delete cascade,
  profile_b_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default pg_catalog.now(),
  constraint matches_canonical_pair check (profile_a_id < profile_b_id),
  constraint matches_one_per_pair unique (profile_a_id, profile_b_id)
);

alter table public.likes enable row level security;
alter table public.matches enable row level security;

revoke all privileges on table public.likes from public, anon, authenticated;
revoke all privileges on table public.matches from public, anon, authenticated;

-- Internal profile/Auth UUIDs are stored in these tables. The app currently
-- needs no direct read access; all client table privileges remain revoked.
drop policy if exists "Users can read their own outgoing likes" on public.likes;

drop policy if exists "Users can create their own outgoing likes" on public.likes;

drop policy if exists "Users can read their own matches" on public.matches;

-- target_profile_id is the public profiles.discovery_id returned by discover_profiles(),
-- never the other user's private Auth/profile ID. The function intentionally
-- uses its owner's privileges to access the private profile/like rows needed
-- for this operation; that owner must be authorized to bypass their RLS policies.
create or replace function public.process_like(target_profile_id uuid, action text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_profile_id uuid;
  resolved_target_profile_id uuid;
  profile_a uuid;
  profile_b uuid;
begin
  caller_profile_id := (select auth.uid());
  if caller_profile_id is null then
    raise exception 'Authentication is required to process a like.'
      using errcode = '28000';
  end if;

  if process_like.action is null
    or process_like.action not in ('like', 'pass', 'super_like') then
    raise exception 'Unsupported like action.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles as caller
    where caller.id = caller_profile_id
  ) then
    raise exception 'The authenticated user does not have a profile.'
      using errcode = 'P0002';
  end if;

  select target.id
    into resolved_target_profile_id
  from public.profiles as target
  where target.discovery_id = process_like.target_profile_id
    and target.id <> caller_profile_id
    and target.is_discoverable is true
    and nullif(pg_catalog.btrim(target.display_name), '') is not null
    and target.date_of_birth <= (current_date - interval '18 years')::date;

  if resolved_target_profile_id is null then
    raise exception 'The target profile is unavailable.'
      using errcode = 'P0002';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      least(caller_profile_id::text, resolved_target_profile_id::text)
        || ':' || greatest(caller_profile_id::text, resolved_target_profile_id::text),
      0
    )
  );

  insert into public.likes (from_profile_id, to_profile_id, action)
  values (caller_profile_id, resolved_target_profile_id, process_like.action)
  on conflict (from_profile_id, to_profile_id)
  do update set action = excluded.action;

  if process_like.action in ('like', 'super_like') and exists (
    select 1
    from public.likes as reverse_like
    where reverse_like.from_profile_id = resolved_target_profile_id
      and reverse_like.to_profile_id = caller_profile_id
      and reverse_like.action in ('like', 'super_like')
  ) then
    if caller_profile_id < resolved_target_profile_id then
      profile_a := caller_profile_id;
      profile_b := resolved_target_profile_id;
    else
      profile_a := resolved_target_profile_id;
      profile_b := caller_profile_id;
    end if;

    insert into public.matches (profile_a_id, profile_b_id)
    values (profile_a, profile_b)
    on conflict (profile_a_id, profile_b_id) do nothing;
  end if;

  return exists (
    select 1
    from public.matches as existing_match
    where existing_match.profile_a_id = least(caller_profile_id, resolved_target_profile_id)
      and existing_match.profile_b_id = greatest(caller_profile_id, resolved_target_profile_id)
  );
end;
$function$;

revoke execute on function public.process_like(uuid, text) from public, anon, authenticated;
grant execute on function public.process_like(uuid, text) to authenticated;
