import fs from 'fs';
import path from 'path';

const migrationFiles = [
  'docs/sql/001_init.sql',
  'docs/sql/002_production_database_schema.sql',
  'docs/sql/003_postgresql_database_foundation.sql'
];
const outFile = process.env.DB_MIGRATION_BUNDLE || 'dist/mavenlex-postgresql-migrations.sql';
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const bundle = migrationFiles.map((file) => {
  const abs = path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) throw new Error(`Missing migration file: ${file}`);
  return `\n-- ============================================================\n-- ${file}\n-- ============================================================\n\n${fs.readFileSync(abs, 'utf8')}`;
}).join('\n');
fs.writeFileSync(outFile, bundle);
console.log(`Created migration bundle: ${outFile}`);
console.log('Apply this bundle in Supabase/Neon/PostgreSQL before switching production traffic to DB_PROVIDER=postgresql.');
