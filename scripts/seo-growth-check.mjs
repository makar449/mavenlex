const API = process.env.API_URL || '';
if (API) {
  const base = API.replace(/\/$/, '');
  for (const path of ['/api/seo/readiness', '/sitemap.xml', '/robots.txt']) {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  }
  console.log('seo-growth-check API OK');
} else {
  const fs = await import('fs');
  const server = fs.readFileSync('server.js', 'utf8');
  const src = fs.readFileSync('src/main.jsx', 'utf8');
  for (const check of ['/sitemap.xml','/robots.txt','/api/seo/readiness','/ai-nda-analysis','/ai-service-agreement-analysis','/contract-penalty-analysis']) {
    if (!server.includes(check) && !src.includes(check)) throw new Error(`Missing SEO feature: ${check}`);
  }
  console.log('seo-growth-check local OK');
}
