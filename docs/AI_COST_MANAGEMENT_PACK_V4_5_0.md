# MavenLex v4.5.0 — AI Cost Management Pack

This release adds AI cost tracking and budget control for production use.

## Added

- AI cost event tracking for:
  - contract analysis;
  - contract comparison;
  - legal chat;
  - law article search.
- Token estimation from input/output characters.
- Cost calculation by provider, feature and plan.
- Monthly AI budget tracking.
- Budget threshold alerts.
- Deep-analysis control for Free users.
- Admin-ready AI cost overview.
- Public readiness endpoints.
- `npm run ai-cost-check`.

## Endpoints

- `GET /api/ai-cost/readiness`
- `GET /api/ai-cost/overview`
- `GET /api/admin/ai-cost`

## Environment variables

```env
AI_COST_TRACKING_ENABLED=true
AI_COST_CURRENCY=RUB
AI_COST_INPUT_PER_1K=0.12
AI_COST_OUTPUT_PER_1K=0.20
AI_COST_MONTHLY_BUDGET=3000
AI_COST_ALERT_THRESHOLD_PERCENT=80
AI_COST_DEEP_ANALYSIS_FREE_LIMIT=0
AI_COST_PROVIDER_MODEL=yandexgpt
```

## Notes

The cost engine estimates tokens from characters. It is intended for operational cost control and early warnings, not exact billing reconciliation.
