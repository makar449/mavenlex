import fs from 'node:fs';

const API = process.env.API_URL || '';
if (API) {
  const base = API.replace(/\/$/, '');
  const res = await fetch(`${base}/api/brand-ui/readiness`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(`Brand UI readiness failed: ${res.status}`);
  if (!Array.isArray(data.components) || data.components.length < 8) throw new Error('Brand UI components incomplete');
  if (!data.tokens?.colors?.length) throw new Error('Brand UI tokens missing');
  console.log(`brand-ui-check API OK: ${base}`);
} else {
  const server = fs.readFileSync('server.js','utf8');
  const src = fs.readFileSync('src/main.jsx','utf8');
  const css = fs.readFileSync('src/styles.css','utf8');
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
  for (const marker of ['brandUiReadiness','/api/brand-ui/readiness','Brand UI System']) if (!server.includes(marker) && !src.includes(marker)) throw new Error(`Missing Brand UI marker: ${marker}`);
  for (const marker of ['DesignSystemPage','/design-system','BRAND UI SYSTEM']) if (!src.includes(marker)) throw new Error(`Missing Design System UI marker: ${marker}`);
  for (const marker of ['--ui-ink','--ui-accent','adminProGrid','tokenGrid']) if (!css.includes(marker)) throw new Error(`Missing CSS token marker: ${marker}`);
  if (!String(pkg.version || '').startsWith('5.')) throw new Error(`Expected version 5.x, got ${pkg.version}`);
  console.log('brand-ui-check local OK');
}
