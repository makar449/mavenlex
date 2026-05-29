import fs from 'fs';
import path from 'path';

const files = [
  'docs/sql/001_init.sql',
  'docs/sql/002_production_database_schema.sql',
  'docs/sql/003_postgresql_database_foundation.sql'
];
const missing = files.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));
if (missing.length) {
  console.error('Missing SQL migration files:', missing.join(', '));
  process.exit(1);
}
console.log('MavenLex PostgreSQL migration order:');
files.forEach((file, index) => console.log(`${index + 1}. ${file}`));
console.log('\nRecommended production env:');
console.log('DATABASE_PROVIDER=postgresql');
console.log('DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require');
console.log('\nRun these SQL files in Supabase SQL editor, Neon SQL editor, or psql in the order above.');
