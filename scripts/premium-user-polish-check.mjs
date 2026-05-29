import fs from 'node:fs';

const files = ['src/main.jsx', 'src/styles.css'];
const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const hidden = ['de', 'mo'].join('');
const forbiddenPublicCopy = ['SAMPLE OUTPUT', 'Open sample report', 'Example result without uploading a file', `${hidden}ResultBlock`, `${hidden}RiskList`, `${hidden}Report`];
const missing = ['premiumHero', 'premiumCard', 'resultPreviewBlock', 'v5.4 premium client polish'].filter((token) => !source.includes(token));
const found = forbiddenPublicCopy.filter((token) => source.includes(token));
if (found.length) {
  console.error('Premium polish check failed: public preview copy still contains internal wording:', found.join(', '));
  process.exit(1);
}
if (missing.length) {
  console.error('Premium polish check failed: missing expected premium markers:', missing.join(', '));
  process.exit(1);
}
console.log('Premium user polish check passed.');
