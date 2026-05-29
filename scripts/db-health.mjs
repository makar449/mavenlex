const apiUrl = (process.env.API_URL || '').replace(/\/$/, '');
const provider = String(process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || 'json').toLowerCase();
const hasUrl = Boolean(process.env.DATABASE_URL);

if (apiUrl) {
  const res = await fetch(`${apiUrl}/api/db/readiness`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok && process.env.DB_HEALTH_STRICT === 'true') {
    console.error('Remote database readiness failed:', body);
    process.exit(1);
  }
  console.log('Remote database readiness:', JSON.stringify(body, null, 2));
  process.exit(0);
}

const productionLike = process.env.NODE_ENV === 'production' || process.env.LAUNCH_MODE === 'production';
const postgresLike = ['postgres', 'postgresql', 'supabase', 'neon'].includes(provider);
const warnings = [];
const blockers = [];
if (productionLike && !postgresLike) blockers.push('Production launch should use DATABASE_PROVIDER=postgresql/supabase/neon.');
if (postgresLike && !hasUrl) blockers.push('DATABASE_URL is missing.');
if (!postgresLike) warnings.push('JSON database is OK for local development usage only.');

console.log(JSON.stringify({
  ok: blockers.length === 0,
  provider,
  hasDatabaseUrl: hasUrl,
  productionLike,
  requiredMigrations: [
    'docs/sql/001_init.sql',
    'docs/sql/002_production_database_schema.sql',
    'docs/sql/003_postgresql_database_foundation.sql'
  ],
  blockers,
  warnings
}, null, 2));
if (blockers.length && process.env.DB_HEALTH_STRICT === 'true') process.exit(1);
