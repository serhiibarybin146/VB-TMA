# One app, two runtime environments

Canonical source: this repository (`production-candidate`). Local and deployed UI,
calculators, services, profile, routing and access checks share the same files.
`design=cosmic` and `design=obsidian` select presentation only, never permissions.

## Local review

Run `npm run dev` (or `python dev/server.py 8081`) and open
http://127.0.0.1:8081/preview.html . The server serves this repository directly.
The preview shell in `dev/` provides two themes and two synthetic identities: regular user
(main calculator only) and owner (all four additional products).

The loopback server replaces the Telegram SDK tag with `/__dev/runtime.js` in the HTML
response. That adapter lives in `dev/runtime.js`, is excluded by `.vercelignore`, refuses non-loopback execution,
and intercepts Supabase requests before they reach the network. Local saves use per-test-
identity storage, and checkout is denied. No real Telegram identity or payment is used.
Neither a query parameter nor the preview role grants access on the live API.

The server refuses `/api/`, `/supabase/`, `/tests/`, `.git` and `.env` requests.
Use this server, not a static HTTP server in the old local folder. Old independent app
files and design studies are kept in `../tma-local/archive-before-unification`.

## Real data

Telegram initData verification and the server-only private database remain intact.
The profile uses verified session data; acquired products use permissions. Names and
prices come from the new authenticated `products` action. No migration is required.

Appointments and bespoke materials are not yet implemented. Their profile sections
use empty states; the services cards link to discussion with Viktoriia. Compatibility
keeps the agreed point-wise sum. The three existing math modules are unchanged.

## Release order (not performed during local review)

1. Review both themes and both access modes locally.
2. Deploy updated `user-api` with the authenticated products action and permission
   metadata, preserving the existing bot secret and signature verifier.
3. Publish the shared UI; never publish the preview runtime adapter.
4. Verify a real Telegram session and purchase access on a phone. Existing RLS and
   the Telegram administration job executor do not change in this release.

Tests: `npm run test:security` plus root year/month/reference regressions using
`FORECAST_TARGET=production-candidate`. Browser checks cover main save/reload,
paid-card locking for a regular user, profile access listing and three compatibility SVGs.
