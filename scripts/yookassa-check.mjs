import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let ok = true;
function pass(x){ console.log(`OK   ${x}`); }
function warn(x){ console.log(`WARN ${x}`); }
function fail(x){ console.log(`MISS ${x}`); ok = false; }
function read(file){ return fs.readFileSync(path.join(root, file), 'utf8'); }

console.log('MavenLex v5.0.0 YooKassa go-live check');
const server = read('server.js');
for (const marker of [
  'billingLiveChecklist',
  'createYooKassaPayment',
  'verifyYooKassaWebhookObject',
  'refreshProviderPayment',
  'paymentAmountMatches',
  'paymentMetadataMatches',
  '/api/billing/yookassa/readiness',
  '/api/billing/payment/:id'
]) server.includes(marker) ? pass(marker) : fail(`missing ${marker}`);
const env = read('.env.example');
for (const marker of ['BILLING_PROVIDER=yookassa', 'PAYMENTS_ENABLED=true', 'YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY', 'YOOKASSA_CAPTURE=true', 'BILLING_STRICT_WEBHOOKS=true']) {
  env.includes(marker) ? pass(`env: ${marker}`) : warn(`env marker missing: ${marker}`);
}
if (process.env.API_URL) {
  const base = process.env.API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/api/billing/yookassa/readiness`);
  if (res.ok || res.status === 503) pass(`/api/billing/yookassa/readiness responded ${res.status}`);
  else fail(`/api/billing/yookassa/readiness returned ${res.status}`);
}
if (!ok) process.exit(1);
console.log('YooKassa go-live check passed.');
