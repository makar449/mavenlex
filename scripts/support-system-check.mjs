const API = process.env.API_URL || '';
if (API) {
  const base = API.replace(/\/$/, '');
  async function json(path, options) {
    const res = await fetch(`${base}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${path} failed with ${res.status}: ${data.error || ''}`);
    return data;
  }
  await json('/api/support/readiness');
  await json('/api/support/tickets', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ category:'analysis', email:'check@example.com', subject:'Support check', message:'Support system readiness check message.' }) });
  console.log('support-system-check API OK');
} else {
  const fs = await import('fs');
  const server = fs.readFileSync('server.js', 'utf8');
  const src = fs.readFileSync('src/main.jsx', 'utf8');
  for (const check of ['/api/support/readiness','/api/support/tickets','/api/admin/support','SupportPage','HelpPage']) {
    if (!server.includes(check) && !src.includes(check)) throw new Error(`Missing support feature: ${check}`);
  }
  console.log('support-system-check local OK');
}
