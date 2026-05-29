# MavenLex v2.0.0 — Production Database Foundation

This version keeps the existing JSON database for local MVP testing, but adds a production database foundation for PostgreSQL-compatible providers such as Supabase, Neon, Render PostgreSQL, or a VPS PostgreSQL instance.

## What changed

- Added production database environment model.
- Added SQL schema in `docs/sql/001_init.sql`.
- Added database status endpoint: `/api/db/status`.
- Added billing foundation endpoint: `/api/billing/plans`.
- Added subscription foundation endpoint: `/api/subscription/current`.
- Added plan limits foundation for Free / Pro / Business.
- Added `.data/` safety through `.gitignore`.

## Local mode

Default mode remains JSON storage:

```env
DATABASE_PROVIDER=json
```

The local DB file is:

```text
.data/mavenlex-db.json
```

Do not use JSON storage for real public users.

## Production mode

Recommended providers:

```text
Supabase
Neon
Render PostgreSQL
Railway PostgreSQL
```

Environment variables:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
```

Run the SQL migration from:

```text
docs/sql/001_init.sql
```

## Render environment variables

```env
YANDEX_API_KEY=your_new_key
YANDEX_PROJECT_ID=your_project_id
YANDEX_MODEL=gpt://your_project_id/yandexgpt/latest
DISABLE_LIVE_AI=false
NODE_VERSION=20
DATABASE_PROVIDER=json
```

For production database later:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://...
```

Do not add `PORT` on Render.

## Billing foundation

Current plans are prepared in backend:

```text
Free: 3 reviews, 20 AI questions, 3 exports
Pro: 30 reviews, 300 AI questions, 30 exports
Business: 200 reviews, 2000 AI questions, 200 exports
```

This version does not charge money yet. Payment integration should be the next stage after choosing a provider such as YooKassa, CloudPayments, Stripe, or manual invoice flow.

## New endpoints

```text
GET /api/db/status
GET /api/billing/plans
GET /api/subscription/current
```

## Important

This is a foundation stage, not final banking-grade production. Before public launch, add:

- PostgreSQL adapter implementation.
- Rate limiting.
- Password reset.
- Email verification.
- Payment webhooks.
- Legal pages.
- Monitoring and backups.
