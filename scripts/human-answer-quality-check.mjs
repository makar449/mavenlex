import fs from 'fs';

const server = fs.readFileSync('server.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const required = [
  'function legalAnswerQualityIssues',
  'function buildHumanCounselRepairPrompt',
  'function localHumanCounselFromQuestion',
  '/api/ai/human-quality-check',
  'ANSWER QUALITY BAR',
  'messy wording',
  'Human counsel answer quality gate'
];

const missing = required.filter(item => !server.includes(item));
if (pkg.version !== '6.0.1') missing.push('package version 6.0.1');

if (missing.length) {
  console.error('Human answer quality check failed. Missing:', missing.join(', '));
  process.exit(1);
}

console.log('Human answer quality check passed.');
