import fs from 'node:fs';
function requireInFile(file, needle) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(needle)) throw new Error(`${file} is missing ${needle}`);
}
const checks = [
  ['package.json', '5.7.0'],
  ['server.js', '5.7.0-executive-quality-readiness'],
  ['server.js', '/api/executive-quality/v5-7'],
  ['src/main.jsx', 'legalScenarioChooser'],
  ['src/main.jsx', 'reviewSide'],
  ['src/main.jsx', 'EXECUTIVE QUALITY v5.7'],
  ['src/main.jsx', 'DOCUMENT'],
  ['src/styles.css', 'legalScenarioChooser'],
  ['docs/EXECUTIVE_QUALITY_READINESS_V5_7_0.md', 'Premium first impression']
];
for (const [file, needle] of checks) requireInFile(file, needle);
const main = fs.readFileSync('src/main.jsx', 'utf8');
for (const forbidden of ['Sample report', 'DEMO', 'AI workspace']) {
  if (main.includes(forbidden)) throw new Error(`Visible public copy still contains: ${forbidden}`);
}
console.log('[executive-quality-check] MavenLex v5.7 executive quality checks passed');
