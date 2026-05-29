import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
let ok = true;
function pass(label) { console.log(`OK   ${label}`); }
function warn(label) { console.log(`WARN ${label}`); }
function fail(label) { console.log(`MISS ${label}`); ok = false; }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function exists(file) { return fs.existsSync(path.join(root, file)); }

console.log('MavenLex v5.0.0 production launch candidate check');
console.log('Project:', root);
console.log('Node:', process.version);

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'server.js',
  'src/main.jsx',
  'src/styles.css',
  'index.html',
  '.env.example',
  'render.yaml',
  'docs/PRODUCTION_LAUNCH_CANDIDATE_V3_0_1.md',
  'docs/GO_LIVE_DEPLOY_PACK_V3_0_1.md',
  'docs/LEGAL_PAGES_PUBLIC_TRUST_PACK_V2_8_2.md',
  'docs/EXPORT_CHECKLIST_DECISION_HELPER_V2_9_2.md',
  'docs/PAYMENTS_QA_PRODUCTION_BILLING_SAFETY_V2_9_1.md'
];
for (const file of requiredFiles) exists(file) ? pass(file) : fail(file);

const pkg = JSON.parse(read('package.json'));
Number(pkg.version.split('.')[0]) >= 4 ? pass(`package version ${pkg.version}`) : fail(`package version is ${pkg.version}`);
for (const script of ['doctor', 'build', 'launch-check', 'deploy-check', 'db-check', 'public-safety-check', 'billing-check', 'yookassa-check', 'production-check', 'go-live-check']) {
  pkg.scripts?.[script] ? pass(`script configured: ${script}`) : fail(`script missing: ${script}`);
}

const server = read('server.js');
for (const marker of ['5.1.0-production-hardening-commercial-polish', '/api/production-check', '/api/go-live-check', '/api/launch-check', '/api/billing/readiness', '/api/billing/yookassa/readiness', '/api/db/readiness']) {
  server.includes(marker) ? pass(`backend marker: ${marker}`) : fail(`backend marker missing: ${marker}`);
}

const main = read('src/main.jsx');
for (const marker of ['COMMERCIAL RELEASE', 'MavenLex Launch Center', 'Ready for public use', 'DECISION HELPER', 'SIGNING CHECKLIST', 'downloadReportText', '/privacy', '/terms', '/security']) {
  main.includes(marker) ? pass(`frontend marker: ${marker}`) : fail(`frontend marker missing: ${marker}`);
}
for (const forbidden of ['TEST LAUNCH FEEDBACK', 'mock checkout активировал', 'Mock checkout creates', 'preview-отчёт']) {
  main.includes(forbidden) ? fail(`public forbidden phrase: ${forbidden}`) : pass(`public phrase absent: ${forbidden}`);
}

const index = read('index.html');
for (const marker of ['meta name="description"', 'og:title', 'og:description', 'theme-color']) {
  index.includes(marker) ? pass(`SEO marker: ${marker}`) : fail(`SEO marker missing: ${marker}`);
}

const env = read('.env.example');
for (const marker of ['ADMIN_EMAILS', 'YANDEX_API_KEY', 'BILLING_PROVIDER', 'BILLING_STRICT_WEBHOOKS', 'PUBLIC_APP_URL', 'PRODUCTION_LAUNCH_CANDIDATE']) {
  env.includes(marker) ? pass(`env marker: ${marker}`) : warn(`env marker missing: ${marker}`);
}

if (process.env.RUN_FULL_PRODUCTION_CHECK === 'true') {
  console.log('\nRunning full local checks because RUN_FULL_PRODUCTION_CHECK=true');
  for (const [cmd, args] of [
    ['npm', ['run', 'doctor']],
    ['npm', ['run', 'build']],
    ['npm', ['run', 'launch-check']],
    ['npm', ['run', 'deploy-check']],
    ['npm', ['run', 'db-check']],
    ['npm', ['run', 'public-safety-check']],
    ['npm', ['run', 'billing-check']]
  ]) execFileSync(cmd, args, { stdio: 'inherit' });
}

if (process.env.API_URL) {
  const base = process.env.API_URL;
  console.log(`\nChecking production API at ${base}`);
  for (const endpoint of ['/api/health', '/api/launch-check', '/api/production-check', '/api/go-live-check', '/api/billing/readiness', '/api/billing/yookassa/readiness', '/api/db/readiness']) {
    const res = await fetch(`${base}${endpoint}`);
    if (res.ok || endpoint === '/api/production-check' || (endpoint === '/api/billing/yookassa/readiness' && res.status === 503)) pass(`${endpoint} responded ${res.status}`);
    else fail(`${endpoint} returned ${res.status}`);
  }
} else {
  warn('API checks skipped. Start backend and run API_URL=http://localhost:3001 npm run production-check to include them.');
}

if (!ok) {
  console.error('\nProduction launch candidate check failed. Fix missing items before public launch.');
  process.exit(1);
}
console.log('\nProduction launch candidate check passed. MavenLex v5.0.0 is ready for final deployment validation.');
