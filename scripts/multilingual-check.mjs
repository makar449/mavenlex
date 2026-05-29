import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';

const API = process.env.API_URL || '';
const requiredFiles = ['src/main.jsx', 'server.js', 'package.json'];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
const src = fs.readFileSync('src/main.jsx', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mustContain = [
  ['src/main.jsx', src, 'SUPPORTED_LANGUAGES'],
  ['src/main.jsx', src, 'languageFromPath'],
  ['src/main.jsx', src, 'documentLanguage'],
  ['src/main.jsx', src, 'reportLanguage'],
  ['src/main.jsx', src, 'localizedContractTypes'],
  ['server.js', server, '/api/i18n/readiness'],
  ['server.js', server, 'detectTextLanguage'],
  ['server.js', server, 'hreflang'],
  ['package.json', JSON.stringify(pkg), 'multilingual-check']
];
for (const [file, body, needle] of mustContain) {
  if (!body.includes(needle)) throw new Error(`${file} is missing ${needle}`);
}
if (!Number(pkg.version.split('.')[0]) >= 4) throw new Error(`Expected version 4.4.x or later, got ${pkg.version}`);

function getJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`${url} returned ${res.statusCode}: ${data.slice(0, 160)}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`${url} did not return JSON`)); }
      });
    });
    req.setTimeout(8000, () => req.destroy(new Error(`Timeout: ${url}`)));
    req.on('error', reject);
  });
}

if (API) {
  const readiness = await getJson(`${API}/api/i18n/readiness`);
  if (!readiness.ok || !readiness.supportedLanguages?.includes('ru') || !readiness.supportedLanguages?.includes('en')) throw new Error('i18n readiness is not OK');
  const languages = await getJson(`${API}/api/i18n/languages`);
  if (!languages.languages?.some(x => x.code === 'ru') || !languages.languages?.some(x => x.code === 'en')) throw new Error('Language list is incomplete');
}
console.log('multilingual-check OK');
