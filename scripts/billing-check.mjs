import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let ok = true;
function pass(x){ console.log(`OK   ${x}`); }
function warn(x){ console.log(`WARN ${x}`); }
function fail(x){ console.log(`MISS ${x}`); ok = false; }
function read(file){ return fs.readFileSync(path.join(root, file), 'utf8'); }

console.log('MavenLex v5.0.0 YooKassa live payments check');
const pkg = JSON.parse(read('package.json'));
Number(pkg.version.split('.')[0]) >= 4 ? pass(`package version ${pkg.version}`) : fail(`package version is ${pkg.version}`);
const server = read('server.js');
for (const marker of [
  '5.1.0-production-hardening-commercial-polish',
  'createYooKassaPayment',
  'yookassaRequest',
  'YOOKASSA_CAPTURE',
  'YOOKASSA_ENABLE_RECEIPTS',
  'billingLiveChecklist',
  '/api/billing/checkout',
  '/api/billing/confirm',
  '/api/billing/webhook',
  '/api/billing/readiness',
  '/api/billing/yookassa/readiness',
  '/api/billing/payment/:id',
  'BILLING_ALLOW_MOCK_IN_PRODUCTION',
  'paymentAmountMatches',
  'paymentMetadataMatches',
  'webhook_unknown_payment_ignored',
  'BILLING_WEBHOOK_VERIFY_WITH_PROVIDER',
  'YOOKASSA_API_URL',
  'BILLING_STRICT_WEBHOOKS'
]) {
  server.includes(marker) ? pass(`server marker: ${marker}`) : fail(`server marker missing: ${marker}`);
}
const main = read('src/main.jsx');
for (const marker of ['BillingResult', '/billing/success', '/billing/cancel', 'secure payment page', 'downloadReportText', 'YooKassa']) {
  main.includes(marker) ? pass(`frontend marker: ${marker}`) : warn(`frontend marker not found: ${marker}`);
}
const env = read('.env.example');
for (const marker of ['BILLING_PROVIDER=yookassa', 'PAYMENTS_ENABLED=true', 'YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY', 'YOOKASSA_API_URL', 'YOOKASSA_CAPTURE', 'YOOKASSA_ENABLE_RECEIPTS', 'BILLING_STRICT_WEBHOOKS', 'BILLING_WEBHOOK_VERIFY_WITH_PROVIDER', 'BILLING_ALLOW_MOCK_IN_PRODUCTION=false', 'BILLING_SUCCESS_PATH=/billing/success', 'BILLING_CANCEL_PATH=/billing/cancel']) {
  env.includes(marker) ? pass(`env marker: ${marker}`) : warn(`env marker not found: ${marker}`);
}
if (process.env.API_URL) {
  const base = process.env.API_URL.replace(/\/$/, '');
  console.log(`\nChecking billing API at ${base}`);
  for (const endpoint of ['/api/billing/readiness', '/api/billing/yookassa/readiness', '/api/billing/plans']) {
    const res = await fetch(`${base}${endpoint}`);
    if (res.ok || res.status === 503) pass(`${endpoint} responded ${res.status}`);
    else fail(`${endpoint} returned ${res.status}`);
  }
}
if (!ok) {
  console.error('Billing check failed.');
  process.exit(1);
}
console.log('YooKassa live payments foundation check passed.');
