import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let ok = true;
function pass(x){ console.log(`OK   ${x}`); }
function warn(x){ console.log(`WARN ${x}`); }
function fail(x){ console.log(`MISS ${x}`); ok = false; }
function read(file){ return fs.readFileSync(path.join(root, file), 'utf8'); }

console.log('MavenLex deployment hardening check');
console.log('Project:', root);

const pkg = JSON.parse(read('package.json'));
Number(pkg.version.split('.')[0]) >= 4 ? pass(`package version ${pkg.version}`) : fail(`package version is ${pkg.version}`);
pkg.scripts?.start === 'node server.js' ? pass('start command is node server.js') : fail('start command should be node server.js');
pkg.scripts?.build ? pass('build script exists') : fail('build script missing');

const render = fs.existsSync(path.join(root, 'render.yaml')) ? read('render.yaml') : '';
for (const marker of ['buildCommand: npm install --legacy-peer-deps && npm run build', 'startCommand: npm start', 'healthCheckPath: /api/health', 'SERVE_FRONTEND', 'APP_BASE_URL', 'PUBLIC_APP_URL']) {
  render.includes(marker) ? pass(`render.yaml marker: ${marker}`) : fail(`render.yaml missing: ${marker}`);
}

const server = read('server.js');
for (const marker of ['5.1.0-production-hardening-commercial-polish', 'express.static', 'FRONTEND_DIST_DIR', 'SERVE_FRONTEND', '/api/billing/readiness', '/api/go-live-check', "app.get('*'"]) {
  server.includes(marker) ? pass(`server marker: ${marker}`) : fail(`server marker missing: ${marker}`);
}

const main = read('src/main.jsx');
main.includes("import.meta.env.DEV ? 'http://localhost:3001' : ''") ? pass('frontend uses same-origin API in production') : fail('frontend production API fallback is not same-origin');

const env = read('.env.example');
for (const marker of ['APP_BASE_URL', 'SERVE_FRONTEND', 'LAUNCH_MODE', 'ADMIN_EMAILS']) {
  env.includes(marker) ? pass(`env marker: ${marker}`) : warn(`env marker not found: ${marker}`);
}

if (fs.existsSync(path.join(root, 'dist'))) pass('dist exists'); else warn('dist missing. Run npm run build before production start.');

if (!ok) {
  console.error('\nDeployment check failed. Fix the missing items before deploying to .app.');
  process.exit(1);
}
console.log('\nDeployment hardening check passed.');
