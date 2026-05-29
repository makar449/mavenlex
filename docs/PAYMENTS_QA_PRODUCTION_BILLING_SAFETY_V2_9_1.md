# v2.9.1 — Payments QA + Production Billing Safety

This patch hardens the live payments foundation before enabling real YooKassa checkout on the public `.app` deployment.

## What changed

- Added `/api/billing/readiness` for billing-specific production checks.
- Added `BILLING_ALLOW_MOCK_IN_PRODUCTION=false` guard.
- Added `BILLING_STRICT_WEBHOOKS=true` guard.
- Improved billing readiness output in Admin and `/api/launch-check`.
- Added stricter webhook handling:
  - unknown payments are ignored and logged;
  - duplicate successful payment events are idempotent;
  - provider payment id must match the local payment;
  - payment metadata must match `paymentId`, `userId`, and `planId` when present;
  - amount and currency must match before a plan is activated;
  - failed/cancelled/pending/waiting events are tracked separately.
- Added billing audit events:
  - `webhook_received`
  - `webhook_rejected`
  - `webhook_unknown_payment_ignored`
  - `payment_verification_failed`
  - `webhook_amount_mismatch_ignored`
  - `payment_succeeded_duplicate_ignored`
  - `subscription_activated`
- Improved success/cancel page copy so users see payment verification status instead of technical webhook language.

## Recommended live YooKassa setup

Set these only in hosting environment variables:

```env
LAUNCH_MODE=production
BILLING_PROVIDER=yookassa
PAYMENTS_ENABLED=true
APP_BASE_URL=https://your-domain.app
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
BILLING_WEBHOOK_SECRET=...
BILLING_WEBHOOK_VERIFY_WITH_PROVIDER=true
BILLING_STRICT_WEBHOOKS=true
BILLING_ALLOW_MOCK_IN_PRODUCTION=false
```

## Production checklist

1. Run `npm run billing-check`.
2. Run `npm run launch-check`.
3. Deploy to `.app`.
4. Open `/api/billing/readiness`.
5. Open `/api/launch-check`.
6. Make one low-value YooKassa test payment.
7. Check `/billing/success`.
8. Check Account plan and limits.
9. Check Admin billing events.
10. Confirm duplicate webhook delivery does not activate twice.

## Notes

This patch does not add refunds, invoices, promo codes, or complex subscription management. It focuses on safe activation of paid plans and visibility into payment events.
