-- Apply only after user-api and the verified client are live and tested in Telegram.
-- Existing data is preserved. Private access is server-only; service_role retains access.
begin;
drop policy if exists "Allow anonymous upsert on users" on public.users;
drop policy if exists "Allow anonymous access to calculations" on public.calculations;
drop policy if exists "Allow anonymous read user_permissions" on public.user_permissions;
revoke all privileges on public.users, public.calculations, public.user_permissions from anon, authenticated;
-- The catalogue is public read-only. TRUNCATE is not governed by row policies.
revoke all privileges on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
commit;
