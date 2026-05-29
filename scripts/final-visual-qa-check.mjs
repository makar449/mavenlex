import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const main = fs.readFileSync('src/main.jsx','utf8');
const css = fs.readFileSync('src/styles.css','utf8');
const required = [
  [pkg.version === '5.9.2', 'package version is 5.9.2'],
  [main.includes('JURISDICTION_OPTIONS'), 'localized jurisdiction options exist'],
  [main.includes('filePickerCard'), 'custom comparison file picker exists'],
  [main.includes('clauseLibraryHero'), 'polished clause library hero exists'],
  [main.includes('Сервис готов') && !main.includes('Backend готов'), 'user-facing backend copy removed'],
  [css.includes('v5.9.2 Final Visual QA Polish'), 'final visual QA CSS block exists'],
  [css.includes('.moreNavMenu'), 'more menu styling exists'],
  [css.includes('body.theme-navy .moreNavMenu'), 'navy dropdown styling exists'],
  [css.includes('.clauseRiskCard:hover'), 'premium clause card hover exists']
];
const failed = required.filter(([ok]) => !ok);
for (const [ok, label] of required) console.log(`${ok ? 'OK' : 'FAIL'} ${label}`);
if (failed.length) process.exit(1);
