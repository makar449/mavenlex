const fs = require('fs');
const server = fs.readFileSync('server.js', 'utf8');
const src = fs.readFileSync('src/main.jsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const checks = [
  ['version', pkg.version === '6.1.5' && server.includes('6.1.5-production-hardening')],
  ['owner login repair', server.includes('owner_login_password_repaired')],
  ['ai no lawyer redirect instruction', server.includes('Do not redirect the user away from MavenLex')],
  ['article category explains auto selection', src.includes('Номер статьи знать не нужно')],
  ['dropzone hardening css', css.includes('writing-mode:horizontal-tb')],
  ['button disabled hardening css', css.includes('button[disabled]')]
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) { console.error('Failed checks:', failed.map(([name]) => name).join(', ')); process.exit(1); }
console.log('Production hardening checks passed for MavenLex v6.1.5');
