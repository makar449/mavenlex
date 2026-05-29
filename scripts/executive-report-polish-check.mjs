import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const src = fs.readFileSync('src/main.jsx','utf8');
const css = fs.readFileSync('src/styles.css','utf8');

const checks = [
  [pkg.version === '5.9.4', 'package version is 5.9.4'],
  [src.includes('EXECUTIVE ACTION BOARD'), 'executive action board exists'],
  [src.includes('emptyReportHero'), 'empty report state exists'],
  [src.includes('Юридический отчёт по договору'), 'Russian report title updated'],
  [css.includes('v5.9.4 Executive Report Polish'), 'v5.9.4 CSS block exists'],
  [css.includes('reportActionBoard'), 'report action board styles exist'],
  [css.includes('emptyReportHero'), 'empty report styles exist'],
  [css.includes('body.theme-navy .reportActionCard'), 'navy report action card styles exist']
];

let failed = false;
for (const [ok, label] of checks) {
  if (ok) console.log(`PASS ${label}`);
  else { console.error(`FAIL ${label}`); failed = true; }
}
if (failed) process.exit(1);
console.log('Executive report polish check passed.');
