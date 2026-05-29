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
  const readiness = await getJson('/api/ai-cost/readiness');
  if (!readiness.ok || !readiness.checks?.budgetAlerts || !readiness.checks?.perFeatureBreakdown) throw new Error('AI cost readiness is incomplete');
  const overview = await getJson('/api/ai-cost/overview');
  if (!overview.ok || !overview.totals || !Array.isArray(overview.byFeature) || !overview.currency) throw new Error('AI cost overview is incomplete');
  console.log(`ai-cost-check API OK: ${base}`);
} else {
  const server = fs.readFileSync('server.js', 'utf8');
  const src = fs.readFileSync('src/main.jsx', 'utf8');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const checks = ['aiCostOverview', 'recordAiCostEvent', '/api/ai-cost/readiness', '/api/admin/ai-cost', 'AI_COST_MONTHLY_BUDGET'];
  for (const check of checks) if (!server.includes(check)) throw new Error(`Missing AI cost server marker: ${check}`);
  for (const check of ['AI COST MANAGEMENT', 'overview?.aiCost?.totals?.spendMonth', 'overview?.aiCost?.byFeature']) if (!src.includes(check)) throw new Error(`Missing AI cost UI marker: ${check}`);
  if (Number(pkg.version.split('.')[0]) < 4) throw new Error(`Expected version 4.x or later, got ${pkg.version}`);
  if (!pkg.scripts?.['ai-cost-check']) throw new Error('Missing ai-cost-check script');
  console.log('ai-cost-check local OK');
}
