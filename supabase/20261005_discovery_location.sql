-- SecondMeet private location data and privacy-preserving Discovery filters.
-- Apply using the Supabase postgres migration role. This file has not been executed.
-- search_discover_profiles() must be owned by a role intentionally able to read
-- other users' private location/profile rows through owner-only RLS.

create table if not exists public.discovery_locations (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  city_label text,
  location_visible boolean not null default false,
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.discovery_locations enable row level security;
revoke all on table public.discovery_locations from public, anon, authenticated;
grant select, insert, update, delete on table public.discovery_locations to authenticated;
drop policy if exists "Owners manage their private discovery location" on public.discovery_locations;
create policy "Owners manage their private discovery location"
on public.discovery_locations for all to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create or replace function public.save_discovery_location(
  latitude double precision,
  longitude double precision,
  country_code text,
  city_label text,
  location_visible boolean
)
returns void language plpgsql security invoker set search_path = ''
as $function$
declare caller_id uuid := (select auth.uid());
begin
  if caller_id is null then raise exception 'Authentication is required.' using errcode = '28000'; end if;
  if latitude not between -90 and 90 or longitude not between -180 and 180
      or country_code !~ '^[A-Z]{2}$' then
    raise exception 'A valid location and country are required.' using errcode = '22023';
  end if;
  insert into public.discovery_locations(profile_id, latitude, longitude, country_code, city_label, location_visible, updated_at)
  values (caller_id, save_discovery_location.latitude, save_discovery_location.longitude,
    save_discovery_location.country_code, nullif(pg_catalog.btrim(save_discovery_location.city_label), ''),
    coalesce(save_discovery_location.location_visible, false), pg_catalog.now())
  on conflict (profile_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    country_code = excluded.country_code,
    city_label = excluded.city_label,
    location_visible = excluded.location_visible,
    updated_at = excluded.updated_at;
end;
$function$;

create or replace function public.search_discover_profiles(
  radius_km integer default 30,
  country_mode text default 'nearby',
  selected_country_code text default null
)
returns table (
  profile_id uuid,
  display_name text,
  age integer,
  gender text,
  interests text[]
)
language plpgsql stable security definer set search_path = ''
as $function$
declare
  caller_id uuid := (select auth.uid());
  origin public.discovery_locations%rowtype;
begin
  if caller_id is null then raise exception 'Authentication is required.' using errcode = '28000'; end if;
  if radius_km not in (8, 10, 30, 50) then raise exception 'Unsupported search radius.' using errcode = '22023'; end if;
  if country_mode not in ('nearby', 'my_country', 'worldwide') then raise exception 'Unsupported country filter.' using errcode = '22023'; end if;
  if country_mode in ('my_country', 'worldwide') and selected_country_code is not null and selected_country_code !~ '^[A-Z]{2}$' then
    raise exception 'Unsupported country code.' using errcode = '22023';
  end if;
  select loc.* into origin from public.discovery_locations as loc where loc.profile_id = caller_id;
  if country_mode = 'nearby' and (not found or origin.location_visible is not true) then
    raise exception 'Enable location visibility before using Nearby search.' using errcode = '42501';
  end if;
  if country_mode = 'my_country' and selected_country_code is null and origin.country_code is null then
    raise exception 'Choose your country before using My Country search.' using errcode = 'P0002';
  end if;

  return query
  select p.discovery_id, p.display_name,
    extract(year from pg_catalog.age(current_date, p.date_of_birth))::integer,
    p.gender, p.interests
  from public.profiles as p
  join public.discovery_locations as target_loc on target_loc.profile_id = p.id
  where p.id <> caller_id
    and p.is_discoverable is true
    and nullif(pg_catalog.btrim(p.display_name), '') is not null
    and p.date_of_birth <= (current_date - interval '18 years')::date
    and target_loc.location_visible is true
    and (country_mode <> 'my_country' or target_loc.country_code = coalesce(selected_country_code, origin.country_code))
    and (country_mode <> 'worldwide' or selected_country_code is null or target_loc.country_code = selected_country_code)
    and (country_mode <> 'nearby' or (
      6371.0 * pg_catalog.acos(least(1.0, greatest(-1.0,
        pg_catalog.sin(pg_catalog.radians(origin.latitude)) * pg_catalog.sin(pg_catalog.radians(target_loc.latitude))
        + pg_catalog.cos(pg_catalog.radians(origin.latitude)) * pg_catalog.cos(pg_catalog.radians(target_loc.latitude))
        * pg_catalog.cos(pg_catalog.radians(target_loc.longitude - origin.longitude))
      ))) <= radius_km
    ))
  order by p.created_at desc, p.discovery_id
  limit 50;
end;
$function$;

-- SECURITY DEFINER search returns only approved Discovery fields. Exact lat/lon
-- are read inside the function and never returned to clients.
revoke execute on function public.save_discovery_location(double precision, double precision, text, text, boolean) from public, anon;
grant execute on function public.save_discovery_location(double precision, double precision, text, text, boolean) to authenticated;
revoke execute on function public.search_discover_profiles(integer, text, text) from public, anon;
grant execute on function public.search_discover_profiles(integer, text, text) to authenticated;
