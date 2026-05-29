# MavenLex v3.2.0 — YooKassa Live Payments

Цель версии: довести оплату Pro/Business до production-ready YooKassa flow без хранения ключей в коде.

## Что добавлено

- `BILLING_PROVIDER=yookassa` live mode.
- Создание платежа через YooKassa API `/v3/payments`.
- Redirect checkout на безопасную страницу YooKassa.
- Возврат пользователя на `/billing/success` или `/billing/cancel`.
- `POST /api/billing/confirm` для проверки платежа после возврата.
- `POST /api/billing/webhook` для обработки событий YooKassa.
- Проверка суммы, валюты, `paymentId`, `userId`, `planId`.
- Idempotent activation: повторный webhook не активирует тариф второй раз.
- `GET /api/billing/yookassa/readiness`.
- `GET /api/billing/payment/:id` для проверки статуса платежа пользователя.
- Admin Launch Center показывает YooKassa checklist и billing audit events.
- `npm run yookassa-check`.

## Env для Render / .app

```env
BILLING_PROVIDER=yookassa
PAYMENTS_ENABLED=true
PUBLIC_APP_URL=https://your-site.app
APP_BASE_URL=https://your-site.app
BILLING_SUCCESS_PATH=/billing/success
BILLING_CANCEL_PATH=/billing/cancel
BILLING_CURRENCY=RUB
YOOKASSA_API_URL=https://api.yookassa.ru/v3
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
BILLING_WEBHOOK_SECRET=your_random_shared_secret
BILLING_WEBHOOK_VERIFY_WITH_PROVIDER=true
BILLING_STRICT_WEBHOOKS=true
BILLING_ALLOW_MOCK_IN_PRODUCTION=false
YOOKASSA_CAPTURE=true
YOOKASSA_ENABLE_RECEIPTS=false
```

## Webhook в YooKassa

URL:

```txt
https://your-site.app/api/billing/webhook
```

События:

```txt
payment.succeeded
payment.canceled
payment.waiting_for_capture
```

Если используешь `BILLING_WEBHOOK_SECRET`, передавай его в header:

```txt
x-mavenlex-webhook-secret: your_random_shared_secret
```

Даже без shared secret включена provider verification: backend запрашивает платеж у YooKassa и сверяет id/status/metadata.

## Проверки

Локально:

```bash
npm run check
npm run billing-check
npm run yookassa-check
```

После деплоя:

```bash
API_URL=https://your-site.app npm run billing-check
API_URL=https://your-site.app npm run yookassa-check
API_URL=https://your-site.app npm run production-check
```

## Ручной go-live сценарий

1. Добавить env на хостинге.
2. Задеплоить проект.
3. Открыть `/api/billing/yookassa/readiness`.
4. Войти пользователем.
5. Выбрать Pro на `/pricing`.
6. Перейти на YooKassa checkout.
7. Завершить тестовую оплату.
8. Вернуться на `/billing/success`.
9. Проверить, что в `/account` тариф стал Pro.
10. Проверить в `/admin` billing events: `checkout_created`, `payment_succeeded`, `subscription_activated`.

## Важно

Ключи YooKassa не должны быть в frontend, GitHub, README с реальными значениями или ZIP. Только в Environment Variables хостинга.
