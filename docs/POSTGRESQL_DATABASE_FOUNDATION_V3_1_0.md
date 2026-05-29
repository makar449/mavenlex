# MavenLex v3.1.0 — PostgreSQL Database Foundation

Purpose: prepare MavenLex for real production storage on PostgreSQL-compatible providers such as Supabase, Neon or Render PostgreSQL.

## Added

- PostgreSQL migration file: `docs/sql/003_postgresql_database_foundation.sql`
- Migration bundle command: `npm run db-migrate`
- Migration order command: `npm run db-migration-plan`
- Database health command: `npm run db-health`
- API endpoint: `GET /api/db/migration-plan`
- Updated `/api/db/readiness`, `/api/health`, `/api/production-check`

## Recommended env

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require
```

For Supabase or Neon, use their PostgreSQL connection string as `DATABASE_URL`.

## Migration order

1. `docs/sql/001_init.sql`
2. `docs/sql/002_production_database_schema.sql`
3. `docs/sql/003_postgresql_database_foundation.sql`

You can create one combined migration file:

```bash
npm run db-migrate
```

It writes:

```txt
dist/mavenlex-postgresql-migrations.sql
```

Run that SQL in Supabase SQL editor, Neon SQL editor or psql.

## Important

This version does not remove JSON mode. JSON remains useful for local development.

For real users, configure PostgreSQL before heavy public usage.
