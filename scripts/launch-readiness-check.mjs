import fs from 'fs';

const required = [
  ['server.js', '/api/auth/access-state'],
  ['server.js', '/api/user/profile'],
  ['server.js', '/api/user/export'],
  ['server.js', 'accountExportPayload'],
  ['src/main.jsx', 'REAL USER READINESS'],
  ['src/main.jsx', 'exportAccountData'],
  ['src/main.jsx', 'deleteAccountFlow'],
  ['src/styles.css', 'launchReadinessPanel'],
  ['docs/LAUNCH_READINESS_AUTH_REAL_USERS_V5_2_0.md', 'MavenLex v5.2.0']
];

const missing = [];
for (const [file, needle] of required) {
  if (!fs.existsSync(file)) missing.push(`${file} is missing`);
  else if (!fs.readFileSync(file, 'utf8').includes(needle)) missing.push(`${file} missing ${needle}`);
}

if (missing.length) {
  console.error('Launch readiness check failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}
console.log('Launch readiness check passed.');
