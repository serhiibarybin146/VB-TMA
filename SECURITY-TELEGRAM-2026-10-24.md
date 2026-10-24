# Verified Telegram access

The client sends signed Telegram initData, never an owner supplied by the caller.
The user-api function validates HMAC, auth_date (24 hours, 60 seconds future tolerance),
unique parameters and a positive safe integer Telegram ID before any database call.
Private database calls always constrain the owner to that verified ID. Permissions
include only granted records. Dates are validated on the server. Responses are not cached.

## Required secret

Set TELEGRAM_BOT_TOKEN for @My_NumerologistBot in Supabase Edge Function Secrets.
Do not put the token in source control or browser code. The database service key is
available only to Edge Functions. The public client key cannot access private tables
after cutover. Old local history is not migrated because its owner cannot be verified.

## Coordinated release

1. Deploy user-api, including _shared/telegram.mjs.
2. Configure the bot secret and test a real session opened from Telegram.
3. Deploy authenticated create-checkout and publish the matching app.js and
   supabase-client.js together (index.html contains cache version updates).
4. Apply private-access-cutover.sql as a recorded Supabase migration.
5. Verify anonymous reads/writes are denied and both test users retain only their own
   history and permissions; record unchanged existing row counts.

Never roll back by reopening anonymous policies. Fix the authenticated path instead.
The change does not add products or execute payments, or validate Stripe configuration.
Client-side calculators remain public code; hiding a card is not DRM for those formulas.

## Release verification, 2026-10-24

- GitHub release d18276f is being served by the production domain (all three client files checked).
- The configured bot token was checked server-side with getMe and matches My_NumerologistBot.
- user-api and create-checkout reject unsigned requests with HTTP 401.
- The protect_telegram_private_tables migration was applied successfully.
- Anonymous REST reads to users, calculations and user_permissions return HTTP 401;
  products remains readable (HTTP 200). Both anon and authenticated have no private
  table grants. service_role retains the required server privileges.
- Existing counts stayed unchanged during cutover: 7 users, 296 calculations,
  4 products and 7 permissions. No payments were initiated.
- Five automated security tests pass, including two synthetic signed identities and
  checkout owner substitution. Year and month calculation regressions pass.
- A real user session and history save through Telegram still require the user's
  device check; synthetic tests are not a substitute for that final end-to-end check.
- The Supabase advisor reports INFO for RLS without policies on the three private
  tables. This is intentional server-only, default-deny access; see
  https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Vercel management API denied deployment listing and no CLI was installed; release
  verification used the public production files rather than claiming dashboard access.
