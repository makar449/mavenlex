const API = process.env.API_URL || '';

async function getJson(url) {
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ms: Date.now() - started, data };
}

if (API) {
  const base = API.replace(/\/$/, '');
  for (const path of ['/api/health', '/api/reliability/readiness']) {
    const result = await getJson(`${base}${path}`);
    if (result.status !== 200) throw new Error(`${path} failed with ${result.status}`);
    if (result.ms > 5000) throw new Error(`${path} too slow: ${result.ms}ms`);
  }
  console.log('performance-check API OK');
} else {
  const fs = await import('fs');
  const server = fs.readFileSync('server.js', 'utf8');
  for (const check of ['RELIABILITY_API_TIMEOUT_MS','/api/reliability/readiness','recordSlowRequest','reliabilitySnapshot','STATIC_CACHE_MAX_AGE']) {
    if (!server.includes(check)) throw new Error(`Missing performance feature: ${check}`);
  }
  console.log('performance-check local OK');
}
