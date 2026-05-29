
import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const main = fs.readFileSync('src/main.jsx', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const fails = [];
function need(name, ok){ if(!ok) fails.push(name); }
need('version is 6.1.3', pkg.version === '6.1.3' && server.includes('6.1.3-real-feature-completion'));
need('live AI only remains', server.includes('LIVE_AI_NOT_CONFIGURED') && !server.includes('local fallback answer'));
need('admin role assign endpoint exists', server.includes("/api/admin/users/assign-role"));
need('admin design settings endpoint exists', server.includes("/api/admin/design-settings"));
need('admin audit endpoint exists', server.includes("/api/admin/audit-events"));
need('admin AI test endpoint exists', server.includes("/api/admin/ai-test"));
need('password recovery endpoints exist', server.includes('/api/auth/password-reset/request') && server.includes('/api/auth/password-reset/confirm'));
need('onboarding endpoints exist', server.includes('/api/user/onboarding'));
need('history notes/favorites endpoints exist', server.includes('/api/user/history/:id') && server.includes("allowed = ['favorite', 'archived', 'folder', 'notes', 'title']"));
need('report copy/favorite/note handlers exist', main.includes('copyMessageBox') && main.includes('favoriteReport') && main.includes('savePersonalNote'));
need('admin AI test button exists', main.includes('onClick={testLiveAi}'));
need('home is compact', main.includes('Договор → риски → действия') && css.includes('launchTrustStrip{display:none'));
need('preview buttons are not fake clickable buttons', main.includes('buttonPreview') && css.includes('pointer-events:none'));
need('button pressed feedback exists', main.includes('mavenlex-pressed') && css.includes('button.mavenlex-pressed'));
need('dist exists', fs.existsSync('dist/index.html'));
if (fails.length) { console.error('Real feature completion check failed:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('Real feature completion check passed.');
