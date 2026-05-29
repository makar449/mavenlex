import fs from 'node:fs';
const server = fs.readFileSync('server.js', 'utf8');
const main = fs.readFileSync('src/main.jsx', 'utf8');
const required = [
  '6.0.0-human-legal-counsel-ai',
  'MavenLex Human Legal Counsel AI',
  'humanLegalCounselBehaviorBlock',
  'normalizeChatHistory',
  'looksLikeWeakLegalAnswer',
  'live-yandexgpt-human-counsel',
  'history: chat.map',
  'history: articleChat.map'
];
const missing = required.filter(token => !server.includes(token) && !main.includes(token));
if (missing.length) {
  console.error('Human Legal Counsel check failed. Missing:', missing.join(', '));
  process.exit(1);
}
console.log('Human Legal Counsel AI check passed.');
