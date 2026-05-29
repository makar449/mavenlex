# MavenLex v5.9.5 — Account Blank Screen Hotfix

Fixes a frontend crash on the Account/Cabinet page when a server session exists and the page tries to render billing refresh controls.

## Fixed

- Added the missing `loadBillingStatus()` function used by Account.
- Account can now load `/api/billing/status` safely.
- Account keeps rendering even when billing status request fails.

## Check

```bash
npm run build
npm run account-hotfix-check
node --check server.js
npm run deployment-version
```
