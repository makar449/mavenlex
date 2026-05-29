import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
let ok = true;
const strict = String(process.env.GO_LIVE_STRICT || 'false').toLowerCase() === 'true';
const apiUrl = String(process.env.API_URL || '').replace(/\/$/, '');
const publicAppUrl = String(process.env.PUBLIC_APP_URL || process.env.APP_BASE_URL || '').replace(/\/$/, '');

function pass(label) { console.log(`OK   ${label}`); }
function warn(label) { console.log(`WARN ${label}`); }
function fail(label) { console.log(`MISS ${label}`); ok = false; }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function exists(file) { return fs.existsSync(path.join(root, file)); }
async function checkUrl(url, label, allow503 = false) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    if (res.ok || (allow503 && res.status === 503) || (res.status >= 300 && res.status < 400)) pass(`${label} responded ${res.status}`);
    else fail(`${label} returned ${res.status}`);
  } catch (e) {
    fail(`${label} failed: ${e.message}`);
  }
}

console.log('MavenLex v5.0.0 go-live deploy check');
console.log('Project:', root);
console.log('Node:', process.version);

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'server.js',
  'index.html',
  'src/main.jsx',
  'src/styles.css',
  'render.yaml',
  '.env.example',
  'docs/GO_LIVE_DEPLOY_PACK_V3_0_1.md',
  'docs/PRODUCTION_LAUNCH_CANDIDATE_V3_0_1.md'
];
for (const file of requiredFiles) exists(file) ? pass(file) : fail(file);

const pkg = JSON.parse(read('package.json'));
Number(pkg.version.split('.')[0]) >= 4 ? pass(`package version ${pkg.version}`) : fail(`package version is ${pkg.version}`);
for (const script of ['start', 'build', 'doctor', 'launch-check', 'deploy-check', 'db-check', 'billing-check', 'public-safety-check', 'production-check', 'go-live-check']) {
  pkg.scripts?.[script] ? pass(`script configured: ${script}`) : fail(`script missing: ${script}`);
}
if (pkg.scripts?.start === 'node server.js') pass('production start command: node server.js'); else fail('start command should be node server.js');

const render = exists('render.yaml') ? read('render.yaml') : '';
for (const marker of ['buildCommand: npm install --legacy-peer-deps && npm run build', 'startCommand: npm start', 'healthCheckPath: /api/health', 'NODE_ENV', 'SERVE_FRONTEND', 'APP_BASE_URL', 'PUBLIC_APP_URL']) {
  render.includes(marker) ? pass(`render.yaml marker: ${marker}`) : fail(`render.yaml missing: ${marker}`);
}

const server = read('server.js');
for (const marker of ['5.1.0-production-hardening-commercial-polish', '/api/go-live-check', '/api/health', '/api/production-check', 'goLiveUrlReadiness', 'PUBLIC_APP_URL']) {
  server.includes(marker) ? pass(`backend marker: ${marker}`) : fail(`backend marker missing: ${marker}`);
}

const main = read('src/main.jsx');
for (const marker of ['MavenLex Launch Center', 'Ready for public use', '/privacy', '/terms', '/security', 'DECISION HELPER', 'SIGNING CHECKLIST', 'downloadReportText']) {
  main.includes(marker) ? pass(`frontend marker: ${marker}`) : fail(`frontend marker missing: ${marker}`);
}

const env = read('.env.example');
for (const marker of ['PUBLIC_APP_URL', 'APP_BASE_URL', 'SERVE_FRONTEND', 'ADMIN_EMAILS', 'YANDEX_API_KEY', 'DATABASE_PROVIDER', 'BILLING_PROVIDER', 'PAYMENTS_ENABLED']) {
  env.includes(marker) ? pass(`env marker: ${marker}`) : warn(`env marker missing: ${marker}`);
}

if (publicAppUrl) {
  try {
    const parsed = new URL(publicAppUrl);
    if (parsed.protocol === 'https:' || parsed.hostname.includes('localhost')) pass(`PUBLIC_APP_URL format: ${publicAppUrl}`);
    else fail('PUBLIC_APP_URL must use https for real go-live');
    if (/your-site|your-app|example/i.test(parsed.hostname)) warn('PUBLIC_APP_URL still looks like a placeholder');
  } catch (e) {
    fail(`PUBLIC_APP_URL invalid: ${publicAppUrl}`);
  }
} else if (strict) {
  fail('PUBLIC_APP_URL is required when GO_LIVE_STRICT=true');
} else {
  warn('PUBLIC_APP_URL not set for local check. Set it on hosting before real go-live.');
}

if (process.env.RUN_BUILD_CHECK === 'true') {
  console.log('\nRunning build because RUN_BUILD_CHECK=true');
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}

if (apiUrl) {
  console.log(`\nChecking live/local API at ${apiUrl}`);
  for (const endpoint of ['/api/health', '/api/launch-check', '/api/production-check', '/api/go-live-check', '/api/billing/readiness', '/api/billing/yookassa/readiness', '/api/db/readiness']) {
    await checkUrl(`${apiUrl}${endpoint}`, endpoint, endpoint === '/api/go-live-check' || endpoint === '/api/db/readiness');
  }
  for (const route of ['/', '/faq', '/privacy', '/terms', '/security', '/pricing']) {
    await checkUrl(`${apiUrl}${route}`, route);
  }
} else {
  warn('Live API checks skipped. Run API_URL=https://your-site.app npm run go-live-check after deploy.');
}

if (!ok) {
  console.error('\nGo-live check failed. Fix missing items before giving the .app link to users.');
  process.exit(1);
}
console.log('\nGo-live check passed. After deployment, run: API_URL=https://your-site.app npm run go-live-check');
