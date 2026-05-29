import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
let ok = true;
const requiredFiles = [
  'package.json',
  'index.html',
  'server.js',
  'src/main.jsx',
  'src/styles.css',
  'docs/FINAL_LAUNCH_CHECKLIST.md',
  'docs/FINAL_LAUNCH_PACK.md',
  'docs/PUBLIC_READY_CLEANUP.md',
  'docs/PUBLIC_LAUNCH_GROWTH_PACK.md',
  'docs/DEPLOYMENT_PRODUCTION_HARDENING.md',
  '.env.example',
  'scripts/smoke.mjs',
  'scripts/doctor.mjs',
  'scripts/go-live-check.mjs',
  'docs/GO_LIVE_DEPLOY_PACK_V3_0_1.md'
];

function pass(label) { console.log(`OK   ${label}`); }
function warn(label) { console.log(`WARN ${label}`); }
function fail(label) { console.log(`MISS ${label}`); ok = false; }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

console.log('MavenLex production deployment launch check');
console.log('Project:', root);
console.log('Node:', process.version);

for (const file of requiredFiles) fs.existsSync(path.join(root, file)) ? pass(file) : fail(file);

const pkg = JSON.parse(read('package.json'));
Number(pkg.version.split('.')[0]) >= 4 ? pass(`package version ${pkg.version}`) : fail(`package version is ${pkg.version}`);
pkg.scripts?.doctor ? pass('doctor script configured') : fail('doctor script missing');
pkg.scripts?.smoke ? pass('smoke script configured') : fail('smoke script missing');
pkg.scripts?.build ? pass('build script configured') : fail('build script missing');
pkg.scripts?.['production-check'] ? pass('production-check script configured') : fail('production-check script missing');

const index = read('index.html');
for (const marker of ['AI-анализ договоров', 'meta name="description"', 'og:title', 'og:description', 'theme-color']) {
  index.includes(marker) ? pass(`SEO marker: ${marker}`) : fail(`SEO marker missing: ${marker}`);
}

const main = read('src/main.jsx');
for (const marker of ['function NotFound', 'MAVENLEX PLANS', 'GrowthLanding', 'SeoInternalLinks', 'PublicFaq', 'function LegalPage', 'PublicFooter', '/privacy', '/terms', '/security', 'reportQualityMemo', 'REPORT QUALITY', 'BillingResult', '/billing/success', '/billing/cancel', 'DECISION HELPER', 'SIGNING CHECKLIST', 'downloadReportText', 'MavenLex Launch Center', 'Ready for public use']) {
  main.includes(marker) ? pass(`frontend marker: ${marker}`) : fail(`frontend marker missing: ${marker}`);
}
if (main.includes('TestFeedbackPanel') || main.includes('TEST LAUNCH FEEDBACK')) {
  fail('public tester feedback panel still present');
} else {
  pass('public tester feedback panel removed');
}

const server = read('server.js');
for (const marker of ['5.1.0-production-hardening-commercial-polish', '/api/launch-check', '/api/admin/launch-readiness', '/api/analytics/track', '/api/growth/overview', '/api/db/readiness', '/api/production-check', '/api/go-live-check']) {
  server.includes(marker) ? pass(`backend marker: ${marker}`) : fail(`backend marker missing: ${marker}`);
}

const envExample = read('.env.example');
for (const marker of ['ADMIN_EMAILS', 'YANDEX_API_KEY', 'BILLING_PROVIDER', 'BILLING_WEBHOOK_SECRET']) {
  envExample.includes(marker) ? pass(`env marker: ${marker}`) : warn(`env marker not found: ${marker}`);
}

if (process.env.RUN_BUILD_CHECK === 'true') {
  console.log('\nRunning production build because RUN_BUILD_CHECK=true');
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}

if (process.env.API_URL || process.env.RUN_API_CHECKS === 'true') {
  const base = process.env.API_URL || 'http://localhost:3001';
  console.log(`\nChecking backend API at ${base}`);
  const endpoints = ['/api/health', '/api/diagnostics', '/api/trust/status', '/api/billing/plans', '/api/billing/readiness', '/api/launch-check', '/api/growth/overview', '/api/db/readiness', '/api/production-check', '/api/go-live-check'];
  for (const endpoint of endpoints) {
    const res = await fetch(`${base}${endpoint}`);
    if (!res.ok) fail(`${endpoint} returned ${res.status}`); else pass(`${endpoint} OK`);
  }
} else {
  warn('API checks skipped. Start backend and run API_URL=http://localhost:3001 npm run launch-check to include them.');
}

if (!ok) {
  console.error('\nPublic launch check failed. Fix the missing items before opening the site to users.');
  process.exit(1);
}
console.log('\nProduction deployment launch check passed. Use docs/DEPLOYMENT_PRODUCTION_HARDENING.md before updating .app.');
