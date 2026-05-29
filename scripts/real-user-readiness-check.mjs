import fs from 'node:fs';

const anyOf = (file, texts) => texts.some(text => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(text));
const required = [
  ['src/main.jsx', ['function AccessDeniedPage']],
  ['src/main.jsx', ['function SubscriptionRequiredPage']],
  ['src/main.jsx', ['exportAccountData']],
  ['src/main.jsx', ['deleteAccountFlow', 'submitDeleteAccount']],
  ['src/main.jsx', ['REAL USER READINESS']],
  ['server.js', ['/api/account/export', '/api/user/export']],
  ['server.js', ['/api/account/real-user-readiness']],
  ['server.js', ["['suspended','deleted']"]],
  ['server.js', ['admin_role_synced', 'admin_auto_promoted']],
  ['README.md', ['v5.2.0']],
  ['.env.example', ['ACCOUNT_EXPORT_ENABLED']]
];
const missing = [];
for (const [file, texts] of required) {
  if (!anyOf(file, texts)) missing.push(`${file} missing one of: ${texts.join(' | ')}`);
}
if (missing.length) {
  console.error('Real-user readiness check failed:');
  for (const m of missing) console.error(`- ${m}`);
  process.exit(1);
}
console.log('Real-user readiness check passed.');
