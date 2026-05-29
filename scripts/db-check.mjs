import fs from 'node:fs';
import path from 'node:path';

const provider = String(process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || 'json').toLowerCase();
const databaseUrl = process.env.DATABASE_URL || '';
const launchMode = String(process.env.LAUNCH_MODE || 'public').toLowerCase();
const migrationFile = path.join(process.cwd(), 'docs', 'sql', '002_production_database_schema.sql');
const allowed = new Set(['json', 'postgres', 'postgresql', 'supabase', 'neon']);
const normalized = ['postgres', 'postgresql', 'supabase', 'neon'].includes(provider) ? provider : 'json';
const warnings = [];
const blockers = [];

if (!allowed.has(provider)) warnings.push(`Unknown DATABASE_PROVIDER=${provider}; app will fall back to json.`);
if (!fs.existsSync(migrationFile)) blockers.push('Missing docs/sql/002_production_database_schema.sql.');
if (normalized !== 'json' && !databaseUrl) blockers.push('DATABASE_PROVIDER is production-like, but DATABASE_URL is missing.');
if (launchMode === 'production' && (normalized === 'json' || !databaseUrl)) blockers.push('LAUNCH_MODE=production requires DATABASE_PROVIDER=postgresql/supabase/neon and DATABASE_URL.');
if (normalized === 'json') warnings.push('JSON database is OK for local development usage, but not recommended for real public traffic.');

const result = {
  ok: blockers.length === 0,
  provider: normalized,
  hasDatabaseUrl: Boolean(databaseUrl),
  launchMode,
  migrationFile: fs.existsSync(migrationFile) ? 'present' : 'missing',
  blockers,
  warnings,
  nextAction: normalized === 'json' ? 'For real users, create a PostgreSQL/Supabase/Neon database and run docs/sql/002_production_database_schema.sql.' : 'Run migrations, verify backups, then deploy with DATABASE_URL in hosting environment variables.'
};
console.log(JSON.stringify(result, null, 2));
if (blockers.length) process.exit(1);
