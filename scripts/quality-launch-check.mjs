import fs from 'node:fs';
function requireInFile(file, needle) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(needle)) throw new Error(`${file} is missing ${needle}`);
}
const checks = [
  ['src/main.jsx', 'LaunchReadinessPage'],
  ['src/main.jsx', 'BrowserQaPage'],
  ['src/main.jsx', 'legalSpecializationShowcase'],
  ['src/main.jsx', '/launch'],
  ['src/main.jsx', '/qa'],
  ['server.js', '/api/launch-readiness/v5-6'],
  ['server.js', '/api/legal/templates'],
  ['server.js', '/api/qa/user-flow'],
  ['docs/QUALITY_LAUNCH_READINESS_V5_6_0.md', 'browser QA'],
  ['docs/sql/004_launch_ready_postgresql_schema.sql', 'CREATE TABLE IF NOT EXISTS legal_templates']
];
for (const [file, needle] of checks) requireInFile(file, needle);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.version.startsWith('5.7.')) throw new Error(`Expected package version 5.7.x, got ${pkg.version}`);
console.log('[quality-launch-check] Quality launch readiness v5.6 checks passed');
