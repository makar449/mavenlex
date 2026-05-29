import fs from 'node:fs';
const src = fs.readFileSync('src/main.jsx', 'utf8');
const required = ['async function loadBillingStatus', '/api/billing/status', 'route === \'/account\''];
const missing = required.filter(token => !src.includes(token));
if (missing.length) {
  console.error('[account-hotfix-check] Missing:', missing.join(', '));
  process.exit(1);
}
console.log('[account-hotfix-check] Account billing/status crash guard: OK');
