import fs from 'node:fs';
const server = fs.readFileSync('server.js','utf8');
const required = ['MavenLex Legal Counsel Mode','isAiRefusalText','legal-counsel-mode','YANDEX_MAX_OUTPUT_TOKENS','AI_TIMEOUT_MS || 180000'];
const missing = required.filter(x => !server.includes(x));
if (missing.length) { console.error('Missing AI legal counsel markers:', missing.join(', ')); process.exit(1); }
console.log('AI legal counsel mode check passed.');
