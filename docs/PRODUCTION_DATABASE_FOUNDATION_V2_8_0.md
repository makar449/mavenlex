# v2.8.0 — Production Database Foundation

This release prepares MavenLex for real persistent database usage while keeping the current JSON storage as a safe local development fallback.

## What changed

- Added PostgreSQL-compatible schema in `docs/sql/002_production_database_schema.sql`.
- Added `npm run db-check`.
- Added public-safe database readiness endpoint: `GET /api/db/readiness`.
- Expanded `/api/db/status`, `/api/health` and `/api/launch-check` with database readiness details.
- Updated `.env.example` for PostgreSQL/Supabase/Neon/Render PostgreSQL.

## Recommended production setup

Use one of:

- Supabase Postgres
- Neon Postgres
- Render PostgreSQL
- Railway Postgres
- Any managed PostgreSQL provider

Set these variables on the hosting platform, not in frontend code:

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
LAUNCH_MODE=production
```

Then run the SQL migration from:

```txt
docs/sql/002_production_database_schema.sql
```

## Important note

v2.8.0 is a foundation layer. It does not force a dangerous automatic migration of existing JSON data. The current JSON database still works for local development usage. Before real public traffic, export existing `.data/mavenlex-db.json`, create the production database, run the schema and migrate the data carefully.

## Checks

```bash
npm run db-check
npm run deploy-check
npm run launch-check
```

API checks:

```txt
/api/db/status
/api/db/readiness
/api/launch-check
```

## Next step after this release

After the database is connected and verified, the next logical release is `v2.9.0 Live Payments Integration` or `v2.9.0 SEO Content Expansion`, depending on whether the priority is monetization or traffic.
