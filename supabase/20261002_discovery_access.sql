-- Discovery access foundation.
-- Existing profiles remain undiscoverable unless a user explicitly opts in.

alter table public.profiles
  add column if not exists discovery_id uuid not null default pg_catalog.gen_random_uuid(),
  add column if not exists display_name text,
  add column if not exists is_discoverable boolean not null default false;

create unique index if not exists profiles_discovery_id_uidx
  on public.profiles (discovery_id);

-- Preserve direct access to the caller's own profile through the existing owner-only RLS policy.
-- Other users' profiles are available only through the narrowly scoped RPC below.

create or replace function public.discover_profiles()
returns table (
  profile_id uuid,
  display_name text,
  age integer,
  gender text,
  interests text[]
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.discovery_id,
    p.display_name,
    extract(year from pg_catalog.age(current_date, p.date_of_birth))::integer,
    p.gender,
    p.interests
  from public.profiles as p
  where (select auth.uid()) is not null
    and p.is_discoverable is true
    and nullif(pg_catalog.btrim(p.display_name), '') is not null
    and p.date_of_birth <= (current_date - interval '18 years')::date
    and p.id <> (select auth.uid())
  order by p.created_at desc, p.discovery_id
  limit 50;
$function$;

-- This function must be owned by a role that can read rows despite the owner-only RLS policy.
-- In Supabase, apply migrations with the postgres migration role so the definer can do so.
revoke execute on function public.discover_profiles() from public, anon;
grant execute on function public.discover_profiles() to authenticated;
