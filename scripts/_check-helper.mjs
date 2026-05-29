export const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
export async function getJson(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
export async function postJson(path, body = {}) {
  const res = await fetch(`${API_URL}${path}`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
