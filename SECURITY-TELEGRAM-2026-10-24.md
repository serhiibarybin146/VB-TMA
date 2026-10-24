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
