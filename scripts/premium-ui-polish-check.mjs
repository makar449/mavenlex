import fs from 'node:fs';
const main = fs.readFileSync('src/main.jsx','utf8');
const css = fs.readFileSync('src/styles.css','utf8');
const requiredMain = [
  'const [theme, setTheme]',
  'themeToggle',
  'moreNav',
  'Questions about MavenLex',
  'Вопросы о MavenLex'
];
const requiredCss = [
  'theme-navy',
  'Premium UI Polish',
  '.moreNav',
  '.premiumFaqPanel',
  'min-height:132px'
];
const missing = [];
for (const token of requiredMain) if (!main.includes(token)) missing.push(`src/main.jsx missing ${token}`);
for (const token of requiredCss) if (!css.includes(token)) missing.push(`src/styles.css missing ${token}`);
if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}
console.log('Premium UI polish check passed: compact header, larger cards, improved FAQ and navy theme are present.');
