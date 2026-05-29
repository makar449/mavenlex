import fs from 'node:fs';
import path from 'node:path';
import { API_URL } from './_check-helper.mjs';

const root = process.cwd();
let ok = true;
function pass(label) { console.log(`OK   ${label}`); }
function warn(label) { console.log(`WARN ${label}`); }
function fail(label) { console.log(`MISS ${label}`); ok = false; }
function exists(file) { return fs.existsSync(path.join(root, file)); }

console.log('MavenLex production hardening check (v5.1+ compatible)');
console.log('Project:', root);

if (process.env.API_URL) {
  const res = await fetch(`${API_URL}/api/production-hardening-check`);
  const snapshot = await res.json();
  if (!res.ok) warn(`/api/production-hardening-check returned ${res.status}; inspect blockers before launch`);
  if (/5\.[1-9]\.|5\.1\.0|5\.2\.0/.test(String(snapshot.version || ''))) pass('API version reports v5.1+'); else fail(`API version is ${snapshot.version}`);
  if (Array.isArray(snapshot.checks) && snapshot.checks.length >= 7) pass('hardening checks returned'); else fail('hardening checks missing');
  if (Array.isArray(snapshot.blockers)) pass(`blockers array available (${snapshot.blockers.length})`); else fail('blockers array missing');
  console.log(`API hardening check inspected at ${API_URL}`);
  if (!ok) process.exit(1);
  process.exit(0);
}

for (const file of [
  'server.js',
  'src/main.jsx',
  'src/styles.css',
  'docs/PRODUCTION_HARDENING_COMMERCIAL_POLISH_V5_1_0.md',
  'scripts/production-hardening-check.mjs'
]) exists(file) ? pass(file) : fail(file);
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
String(pkg.version || '').startsWith('5.') && pkg.version !== '5.0.0' ? pass(`package version ${pkg.version}`) : fail(`package version is ${pkg.version}`);
for (const script of ['build','check','production-hardening-check','commercial-release-check','admin-console-pro-check','ai-cost-check']) {
  pkg.scripts?.[script] ? pass(`script configured: ${script}`) : fail(`script missing: ${script}`);
}
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
for (const needle of ['productionHardeningChecklist', '/api/production-hardening-check', 'userAiCostSnapshot', '/api/user/onboarding', 'AI_BUDGET_PRO_MONTHLY']) {
  server.includes(needle) ? pass(`server contains ${needle}`) : fail(`server missing ${needle}`);
}
const front = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
for (const needle of ['OnboardingFlow', "route === '/onboarding'", 'CLIENT ONBOARDING']) {
  front.includes(needle) ? pass(`frontend contains ${needle}`) : fail(`frontend missing ${needle}`);
}
if (!ok) process.exit(1);
console.log('\nProduction hardening package check passed.');
