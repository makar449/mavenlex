import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let ok = true;
function pass(label) { console.log(`OK   ${label}`); }
function warn(label) { console.log(`WARN ${label}`); }
function fail(label) { console.log(`MISS ${label}`); ok = false; }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function exists(file) { return fs.existsSync(path.join(root, file)); }

console.log('MavenLex commercial release check');
console.log('Project:', root);

const API = process.env.API_URL || '';
if (API) {
  const base = API.replace(/\/$/, '');
  const endpoints = [
    '/api/health',
    '/api/launch-check',
    '/api/production-check',
    '/api/go-live-check',
    '/api/commercial-release-check',
    '/api/db/readiness',
    '/api/billing/readiness',
    '/api/billing/yookassa/readiness',
    '/api/auth/full-cookie-auth-readiness',
    '/api/auth/email-readiness',
    '/api/reliability/readiness',
    '/api/export/readiness',
    '/api/brand-ui/readiness'
  ];
  const softReadiness = new Set(['/api/billing/yookassa/readiness','/api/auth/email-readiness','/api/db/readiness']);
  for (const endpoint of endpoints) {
    const res = await fetch(`${base}${endpoint}`);
    const body = await res.text().catch(() => '');
    if (!res.ok && !softReadiness.has(endpoint)) fail(`${endpoint} returned ${res.status}`);
    else if (!res.ok && softReadiness.has(endpoint)) warn(`${endpoint} reachable but not fully configured: ${res.status}`);
    else pass(`${endpoint} OK`);
    if (body && !body.trim().startsWith('{') && !body.trim().startsWith('[')) warn(`${endpoint} did not return JSON-looking body`);
  }
  if (!ok) process.exit(1);
  console.log(`\nCommercial release API check passed: ${base}`);
  process.exit(0);
}

const requiredFiles = [
  'package.json', 'package-lock.json', 'server.js', 'src/main.jsx', 'src/styles.css', 'index.html',
  '.env.example', 'render.yaml',
  'docs/COMMERCIAL_SAAS_RELEASE_V5_0_0.md',
  'docs/BRAND_UI_ADMIN_CONSOLE_PRO_V4_8_0.md',
  'docs/YOOKASSA_LIVE_PAYMENTS_V3_2_0.md',
  'docs/POSTGRESQL_DATABASE_FOUNDATION_V3_1_0.md'
];
for (const file of requiredFiles) exists(file) ? pass(file) : fail(file);

const pkg = JSON.parse(read('package.json'));
String(pkg.version || '').startsWith('5.') ? pass(`package version ${pkg.version}`) : fail(`package version is ${pkg.version}`);
for (const script of ['check','build','production-check','go-live-check','commercial-release-check','billing-check','yookassa-check','db-health','full-cookie-auth-e2e-check','brand-ui-check','admin-console-pro-check']) {
  pkg.scripts?.[script] ? pass(`script configured: ${script}`) : fail(`script missing: ${script}`);
}

const server = read('server.js');
for (const marker of ['5.1.0-production-hardening-commercial-polish','commercialReleaseSnapshot','/api/commercial-release-check','/api/production-check','/api/go-live-check','/api/billing/yookassa/readiness','/api/auth/full-cookie-auth-readiness','/api/admin/console-pro']) {
  server.includes(marker) ? pass(`backend marker: ${marker}`) : fail(`backend marker missing: ${marker}`);
}

const main = read('src/main.jsx');
for (const marker of ['MavenLex Launch Center','ADMIN CONSOLE PRO','BRAND UI SYSTEM','/design-system','/admin','/pricing','/clauses','/rewrite']) {
  main.includes(marker) ? pass(`frontend marker: ${marker}`) : warn(`frontend marker not found: ${marker}`);
}

const env = read('.env.example');
for (const marker of ['PUBLIC_APP_URL','APP_BASE_URL','ADMIN_EMAILS','YANDEX_API_KEY','DATABASE_URL','DATABASE_PROVIDER','BILLING_PROVIDER','YOOKASSA_SHOP_ID','YOOKASSA_SECRET_KEY','EMAIL_PROVIDER','RESEND_API_KEY','SESSION_SECRET','JWT_SECRET','COOKIE_SECURE']) {
  env.includes(marker) ? pass(`env marker: ${marker}`) : warn(`env marker missing: ${marker}`);
}

if (!ok) {
  console.error('\nCommercial release check failed. Fix missing items before selling publicly.');
  process.exit(1);
}
console.log('\nCommercial release check passed. Deploy to .app and rerun with API_URL=https://your-domain.app.');
