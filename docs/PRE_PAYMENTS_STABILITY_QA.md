# v2.2.2 — Pre-Payments Stability & QA

This release is a stability patch before real payments. It does not connect YooKassa, CloudPayments, Stripe or any other payment provider.

## Added

- Version updated to `2.2.2`.
- Admin Launch Blockers check:
  - missing `ADMIN_EMAILS`;
  - YandexGPT not configured or disabled;
  - JSON database warning for real launch;
  - manual payments warning;
  - high server error rate in the last 24 hours;
  - production mode requiring a production database.
- New admin endpoint: `GET /api/admin/launch-readiness`.
- Backend-side usage limit checks for signed-in users on:
  - `POST /api/analyze-contract`;
  - `POST /api/legal-chat`.
- Frontend sends the backend session token to analysis and AI chat requests when the user is signed in.
- Pricing copy now matches the backend limit model.

## Important behavior

Anonymous users can still test the product. Backend limits are enforced when a backend account is signed in. This keeps the product preview usable while preparing the subscription architecture.

## Recommended pre-payment QA

1. Set `ADMIN_EMAILS` in `.env`.
2. Register/login with that admin email.
3. Open `/admin`.
4. Check Launch Readiness.
5. Run:

```bash
npm run doctor
npm run build
npm run smoke
```

## Still intentionally not included

- Real payment provider checkout.
- Payment webhooks.
- Automatic plan upgrades after payment.
- Team billing.

Those belong to `v2.3.0 — Real Payments Foundation`.
