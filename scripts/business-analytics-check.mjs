import fs from 'node:fs';

const API = process.env.API_URL || '';
if (API) {
  const base = API.replace(/\/$/, '');
  async function getJson(path) {
    const res = await fetch(`${base}${path}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${path} failed: ${res.status} ${data.error || ''}`);
    return data;
  }
  async function postJson(path, body = {}) {
    const res = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${path} failed: ${res.status} ${data.error || ''}`);
    return data;
  }
  const readiness = await getJson('/api/analytics/business/readiness');
  if (!readiness.ok || !readiness.features?.includes('conversion_funnel')) throw new Error('Business analytics readiness is incomplete');
  await postJson('/api/analytics/track', { type: 'page_view', path: '/ai-contract-analysis', payload: { source: 'business-analytics-check' } });
  await postJson('/api/analytics/track', { type: 'checkout_started', path: '/pricing', payload: { planId: 'pro' } });
  const overview = await getJson('/api/analytics/business');
  if (!overview.ok || !Array.isArray(overview.funnel) || overview.funnel.length < 5) throw new Error('Business analytics overview is incomplete');
  console.log(`business-analytics-check API OK: ${base}`);
} else {
  const server = fs.readFileSync('server.js', 'utf8');
  const src = fs.readFileSync('src/main.jsx', 'utf8');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const checks = ['businessAnalyticsOverview', '/api/analytics/business/readiness', '/api/admin/business-analytics', 'conversion_funnel', 'popularPages'];
  for (const check of checks) if (!server.includes(check)) throw new Error(`Missing business analytics server marker: ${check}`);
  for (const check of ['BUSINESS ANALYTICS', 'analytics?.funnel', 'analytics?.popularPages']) if (!src.includes(check)) throw new Error(`Missing business analytics UI marker: ${check}`);
  if (Number(pkg.version.split('.')[0]) < 4) throw new Error(`Expected version 4.4.x or later, got ${pkg.version}`);
  if (!pkg.scripts?.['business-analytics-check']) throw new Error('Missing business-analytics-check script');
  console.log('business-analytics-check local OK');
}
