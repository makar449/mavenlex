# MavenLex v2.9.0 — Live Payments Foundation

This release adds a YooKassa-ready live payment foundation while keeping manual/mock as a safe fallback.

## What changed

- Real provider-ready checkout flow for `BILLING_PROVIDER=yookassa`.
- Server-side YooKassa payment creation through `/v3/payments`.
- Redirect success and cancel pages: `/billing/success` and `/billing/cancel`.
- Payment confirmation endpoint: `POST /api/billing/confirm`.
- Webhook endpoint: `POST /api/billing/webhook`.
- Webhook verification foundation: shared secret fallback and optional provider status verification.
- Admin billing events continue to show checkout, webhook and payment outcomes.
- New script: `npm run billing-check`.

## YooKassa environment variables

```env
BILLING_PROVIDER=yookassa
PAYMENTS_ENABLED=true
APP_BASE_URL=https://your-app.example.app
BILLING_SUCCESS_PATH=/billing/success
BILLING_CANCEL_PATH=/billing/cancel
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
BILLING_WEBHOOK_SECRET=optional-shared-secret
BILLING_WEBHOOK_VERIFY_WITH_PROVIDER=true
```

## Webhook URL

Set this in the YooKassa dashboard:

```txt
https://your-app.example.app/api/billing/webhook
```

Subscribe to payment succeeded/canceled events.

## Safe rollout

1. Deploy with `BILLING_PROVIDER=mock` first.
2. Confirm `/api/health`, `/api/launch-check`, `/api/billing/plans`.
3. Add YooKassa keys in hosting environment variables.
4. Set `BILLING_PROVIDER=yookassa` and `PAYMENTS_ENABLED=true`.
5. Make a low-value test payment.
6. Confirm the user plan changes to Pro/Business in Account and Admin.

## Important

Do not put YooKassa keys in React code, `.env.example`, README, GitHub or localStorage. Keys belong only in backend hosting environment variables.
