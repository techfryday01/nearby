-- READ-ONLY verification. Still requires user approval before execution.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'secondmeet-profile-photos';
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where (schemaname = 'storage' and tablename = 'objects')
   or (schemaname = 'public' and tablename in ('profiles','profile_photos'));
select pg_catalog.to_regclass('public.profile_photos') as gallery_table,
 pg_catalog.to_regprocedure('public.set_profile_photos(text[])') as gallery_write_rpc,
 pg_catalog.to_regprocedure('public.discover_profiles_with_photo_paths()') as discovery_photos_rpc,
 pg_catalog.to_regprocedure('public.discover_profile_photo_paths(uuid)') as gallery_read_rpc;
select p.proname, r.rolname as owner, p.prosecdef, p.proconfig
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
join pg_catalog.pg_roles r on r.oid = p.proowner
where n.nspname = 'public' and p.proname in ('can_read_discovery_photo',
 'discover_profiles_with_photo_paths','discover_profile_photo_paths','set_profile_photos');
