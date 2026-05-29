import fs from 'node:fs';
const src = fs.readFileSync('src/main.jsx','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const checks = [
  [pkg.version === '5.9.9', 'package version is 5.9.9'],
  [src.includes("['/law', ru?'Статьи':'Articles']"), 'Articles tab is restored in main navigation'],
  [src.includes('ARTICLE CHAT'), 'article chat panel exists'],
  [src.includes('/api/legal-chat'), 'article chat uses legal-chat endpoint'],
  [src.includes('Можно писать простыми словами'), 'broken/simple-language RU guidance exists'],
  [src.includes('articleChatQuestion'), 'article chat state exists']
];
let ok = true;
for (const [pass, label] of checks) {
  if (pass) console.log('ok -', label);
  else { console.error('fail -', label); ok = false; }
}
if (!ok) process.exit(1);
