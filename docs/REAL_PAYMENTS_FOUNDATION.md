# MavenLex v2.3.0 — Real Payments Foundation

This release adds the first safe billing layer without forcing live payments too early.

## What is included

- Provider-ready billing configuration: `manual`, `mock`, `yookassa`, `stripe`.
- `GET /api/billing/plans` for frontend pricing and limits.
- `GET /api/billing/status` for the authenticated user's billing state.
- `POST /api/billing/checkout` to create a payment record and checkout session.
- `POST /api/billing/mock-complete` to test the paid-plan flow with no real charge.
- `POST /api/billing/webhook` to receive payment/subscription events and update user plans.
- Account page billing status.
- Pricing page checkout flow.
- Admin billing overview.

## Safe default

By default the app uses:

```env
BILLING_PROVIDER=manual
PAYMENTS_ENABLED=false
```

This lets you test the whole path: register -> pricing -> checkout -> mock complete -> plan update. No real money is charged.

## Provider readiness

Live provider variables are prepared in `.env.example`, but the release intentionally keeps the actual external API wiring conservative. Before selling subscriptions, wire the official YooKassa or Stripe server SDK/API, verify webhook signatures, and test cancellation / failed-payment states.

## Manual QA

1. Start backend and frontend with `npm run dev`.
2. Register a backend account in Account.
3. Open Pricing.
4. Click Pro or Business checkout.
5. Confirm that mock checkout activates the plan.
6. Open Account and refresh billing.
7. Open Admin and verify Billing Overview.

## Not included yet

- Real external payment API requests.
- Refunds.
- Invoices/acts for companies.
- Promo codes.
- Customer portal management.
- Team billing seats.
