import fs from 'node:fs';

const API = process.env.API_URL || '';
if (API) {
  const base = API.replace(/\/$/, '');
  const res = await fetch(`${base}/api/admin/console-pro`);
  if ([401,403].includes(res.status)) {
    console.log(`admin-console-pro-check API auth-protected OK: ${base}`);
    process.exit(0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(`Admin Console Pro failed: ${res.status}`);
  if (!data.modules?.users || !data.modules?.billing || !data.modules?.system) throw new Error('Admin Console Pro modules missing');
  console.log(`admin-console-pro-check API OK: ${base}`);
} else {
  const server = fs.readFileSync('server.js','utf8');
  const src = fs.readFileSync('src/main.jsx','utf8');
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
  for (const marker of ['adminConsoleProSnapshot','/api/admin/console-pro','modules: {']) if (!server.includes(marker)) throw new Error(`Missing Admin Console Pro server marker: ${marker}`);
  for (const marker of ['ADMIN CONSOLE PRO','consolePro?.modules?.users','adminConsoleProPanel']) if (!src.includes(marker)) throw new Error(`Missing Admin Console Pro UI marker: ${marker}`);
  if (!pkg.scripts?.['admin-console-pro-check']) throw new Error('Missing admin-console-pro-check script');
  console.log('admin-console-pro-check local OK');
}
