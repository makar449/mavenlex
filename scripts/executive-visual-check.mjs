import fs from 'node:fs';
const main = fs.readFileSync('src/main.jsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const requiredMain = [
  "['/home', ru?'Главная':'Home'], ['/analyze', ru?'Договор':'Contract'], ['/situation', ru?'Ситуация':'Situation'], ['/pricing', ru?'Тарифы':'Pricing'], ['/account', ru?'Кабинет':'Account']",
  'moreNavMenu',
  'Юридический AI-анализ до подписания договора',
  'Понятно перед первым анализом',
  'executiveReportKpis'
];
const requiredCss = [
  'PHASE 9 - Executive Visual Experience v5.9.0',
  '.topbarPanel',
  '.executiveFaqPanel',
  'body.theme-navy',
  '.executiveSummaryBand',
  'min-height:var(--exec-card-min)'
];
const missing = [];
for (const token of requiredMain) if (!main.includes(token)) missing.push(`src/main.jsx missing ${token}`);
for (const token of requiredCss) if (!css.includes(token)) missing.push(`src/styles.css missing ${token}`);
if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}
console.log('Executive visual check passed: simplified nav, stronger hero, larger cells, refined FAQ, report polish and navy theme are present.');
