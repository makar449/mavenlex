# v3.12.0 — SEO Growth + Support + Abuse Protection Pack

This release combines three practical production layers after v3.9.0.

## SEO Growth

Added public routes for high-intent search pages:

- `/ai-nda-analysis`
- `/ai-service-agreement-analysis`
- `/ai-lease-analysis`
- `/contract-penalty-analysis`
- `/check-contract-before-signing`

Added machine-readable endpoints/files:

- `/sitemap.xml`
- `/robots.txt`
- `/api/seo/readiness`

## Support System

Added a public support page and support ticket API:

- `/support`
- `/help`
- `POST /api/support/tickets`
- `GET /api/support/readiness`
- `GET /api/admin/support`
- `PATCH /api/admin/support/:id`

Ticket statuses: `new`, `in_progress`, `resolved`.

## Abuse Protection

Added in-memory rate-limit foundation for:

- auth endpoints
- AI/chat endpoints
- upload/compare endpoints
- support endpoints
- general API requests

Production env:

```env
ABUSE_RATE_LIMIT_ENABLED=true
ABUSE_DEFAULT_MAX=240
ABUSE_AUTH_MAX=20
ABUSE_AI_MAX_PER_HOUR=80
ABUSE_UPLOAD_MAX_PER_HOUR=30
SUPPORT_EMAIL=support@example.com
```

For multi-instance production, move rate-limit state to Redis/PostgreSQL.

## Checks

```bash
npm run seo-growth-check
npm run support-system-check
npm run abuse-protection-check
npm run check
```
