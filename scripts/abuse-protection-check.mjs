const API = process.env.API_URL || '';
if (API) {
  const res = await fetch(`${API.replace(/\/$/, '')}/api/abuse/readiness`);
  if (!res.ok) throw new Error(`abuse readiness failed with ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error('abuse readiness returned not ok');
  console.log('abuse-protection-check API OK');
} else {
  const fs = await import('fs');
  const server = fs.readFileSync('server.js', 'utf8');
  for (const check of ['ABUSE_RATE_LIMIT_ENABLED','abuseBuckets','/api/abuse/readiness','/api/admin/abuse']) {
    if (!server.includes(check)) throw new Error(`Missing abuse protection feature: ${check}`);
  }
  console.log('abuse-protection-check local OK');
}
