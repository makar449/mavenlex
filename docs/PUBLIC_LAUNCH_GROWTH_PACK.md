# MavenLex v2.6.0 — Public Launch Growth Pack

Цель релиза: привести MavenLex к виду публичного сервиса для реальных посетителей, а не тестового проекта.

## Добавлено

- SEO/growth landing pages:
  - `/ai-contract-analysis`
  - `/contract-risk-analysis`
  - `/business-contract-review`
  - `/faq`
- Внутренние public analytics events:
  - `page_view`
  - `plan_selected`
  - `checkout_started`
- Backend endpoints:
  - `POST /api/analytics/track`
  - `GET /api/growth/overview`
- Internal links block на главной для SEO и понятной навигации.
- Более сильная структура публичного запуска: объяснение продукта, value proposition, FAQ, CTA к анализу договора и тарифам.

## Что не включено

- Реальное списание денег.
- CRM.
- Email-маркетинг.
- Командные аккаунты.
- Большой блог.

## Проверка

```bash
npm run doctor
npm run launch-check
npm run build
API_URL=http://localhost:3001 npm run launch-check
API_URL=http://localhost:3001 npm run smoke
```

## Дальше

После проверки сайта можно выбирать:

1. `v2.7.0 Live Payments` — если нужны реальные оплаты.
2. `v2.7.0 Production DB + Deploy Hardening` — если сначала нужен стабильный production hosting.
3. `v2.7.0 SEO Content Expansion` — если нужен трафик.
