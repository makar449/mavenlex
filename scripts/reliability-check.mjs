const API = process.env.API_URL || '';

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

if (API) {
  const base = API.replace(/\/$/, '');
  const result = await getJson(`${base}/api/reliability/readiness`);
  if (result.status !== 200) throw new Error(`Reliability readiness failed: ${result.status}`);
  if (!result.data?.ok) throw new Error('Reliability readiness is not OK');
  const rel = result.data.reliability || {};
  if (!Number.isFinite(Number(rel.uptimeSeconds))) throw new Error('Missing uptimeSeconds');
  if (!rel.memory || !Number.isFinite(Number(rel.memory.rssMb))) throw new Error('Missing memory snapshot');
  if (!Array.isArray(rel.blockers)) throw new Error('Missing blockers list');
  console.log('reliability-check API OK');
} else {
  const fs = await import('fs');
  const server = fs.readFileSync('server.js', 'utf8');
  for (const check of ['/api/admin/reliability','slowRequests','errorsLast24h','p95DurationMs','HEALTH_PROBE_STRICT']) {
    if (!server.includes(check)) throw new Error(`Missing reliability feature: ${check}`);
  }
  console.log('reliability-check local OK');
}
