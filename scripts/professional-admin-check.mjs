import fs from 'node:fs';
const main = fs.readFileSync('src/main.jsx','utf8');
const server = fs.readFileSync('server.js','utf8');
const css = fs.readFileSync('src/styles.css','utf8');
const required = [
  ['professionalAdminSuite', main],
  ['rolePreviewBoard', main],
  ['auditTrail', main],
  ['customLimits', server],
  ['Cannot remove the last owner', server],
  ['professional-admin-check', fs.readFileSync('package.json','utf8')],
  ['word-break', css]
];
const missing = required.filter(([needle, text]) => !text.includes(needle)).map(([needle]) => needle);
if (missing.length) {
  console.error('Missing professional admin markers:', missing.join(', '));
  process.exit(1);
}
console.log('Professional admin + invite system check passed.');
