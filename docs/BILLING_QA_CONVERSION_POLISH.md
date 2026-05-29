# v2.3.1 — Billing QA + Conversion Polish

This patch improves the payment foundation before mobile polish or live payment activation.

## What changed

- Pricing page now explains each plan by audience and value, not only limits.
- Checkout messages are clearer for login, provider configuration and mock completion.
- Account billing block now shows the active plan, subscription status, provider, usage limits and remaining monthly quota.
- Admin has a Billing QA panel with paid plan, webhook, live payments, checkout endpoint and mock checkout checks.
- Backend launch readiness now returns `billingChecks` for live-payment preparation.
- Documentation now includes a live payments checklist.

## QA path

1. Start the app with `npm run dev`.
2. Register or log in from Account.
3. Open Pricing.
4. Choose Pro or Business.
5. In manual/mock mode, checkout completes without real money.
6. Open Account and verify plan, status and usage limits.
7. Open Admin and verify Billing QA / Launch Readiness.

## Before live payments

- Choose `BILLING_PROVIDER=yookassa` or `BILLING_PROVIDER=stripe`.
- Add provider live API keys.
- Set `BILLING_WEBHOOK_SECRET`.
- Verify webhook delivery in the provider dashboard.
- Set `PAYMENTS_ENABLED=true` only after successful webhook testing.
- Run a test payment and confirm subscription activation, failed payment handling and cancellation.

## What is intentionally not added

- No real card charging in this patch.
- No refunds, promo codes, invoices or accounting documents.
- No team billing seats yet.
