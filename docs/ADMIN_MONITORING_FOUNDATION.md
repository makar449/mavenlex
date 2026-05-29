# MavenLex v2.2.0 — Admin + Monitoring Foundation

Internal launch-control layer for MavenLex. This version does not add new user-facing product tabs. It adds protected admin visibility for launch readiness.

## What is included

- Protected `/admin` SPA route.
- Protected backend endpoints:
  - `GET /api/admin/overview`
  - `GET /api/admin/health`
  - `GET /api/admin/errors`
- User statistics.
- Number of analyses.
- Number of AI/legal questions.
- Backend / database / YandexGPT status.
- Recent server errors.
- Usage overview by plan.
- Recent API request log.

## Admin access

Set `ADMIN_EMAILS` in `.env`:

```env
ADMIN_EMAILS=founder@example.com,admin@example.com
```

Then register or log in with that backend account from **Account**. The backend promotes matching emails to role `admin`.

## Notes

This is a foundation, not a full observability stack. JSON storage is enough for MVP testing. For production scale, move DB to Postgres/Supabase/Neon and external error monitoring in a later launch hardening step.
