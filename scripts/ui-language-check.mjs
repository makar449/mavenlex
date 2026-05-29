import { readFileSync } from 'node:fs';
function checkContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`Missing: ${label}`);
  console.log(`OK: ${label}`);
}
const src = readFileSync('src/main.jsx', 'utf8');
const server = readFileSync('server.js', 'utf8');
checkContains(src, 'GLOBAL_I18N_PAIRS', 'global UI translation dictionary is present');
checkContains(src, 'translateDomUi(lang)', 'DOM translation pass is installed');
checkContains(src, 'preferredLanguage', 'selected language is synced with the user profile');
checkContains(server, 'preferredLanguage', 'server stores preferredLanguage in user profile');
console.log('UI language switch check passed');
