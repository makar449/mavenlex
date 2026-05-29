import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const startedServer = !process.env.API_URL;
const localPort = process.env.E2E_PORT || '3617';
const API = (process.env.API_URL || `http://localhost:${localPort}`).replace(/\/$/, '');
let child = null;
if (startedServer) {
  child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: localPort, LAUNCH_MODE: 'public', EMAIL_PROVIDER: 'console', AUTH_COOKIE_ENABLED: 'true', AUTH_CSRF_ENABLED: 'true', COOKIE_SECURE: 'false', MAVENLEX_DB_FILE: `.data/e2e-auth-${Date.now()}.json` }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', d => process.stdout.write(`[e2e-server] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[e2e-server] ${d}`));
  await new Promise(resolve => setTimeout(resolve, 1200));
}
process.on('exit', () => { if (child) child.kill(); });
const email = `cookie-e2e-${Date.now()}-${crypto.randomBytes(3).toString('hex')}@example.com`;
const password = `Pass${crypto.randomBytes(5).toString('hex')}A1`;
const newPassword = `New${crypto.randomBytes(5).toString('hex')}B2`;
let cookieJar = '';

function mergeCookies(headers) {
  const raw = headers.getSetCookie ? headers.getSetCookie() : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
  const map = new Map(cookieJar.split('; ').filter(Boolean).map(x => [x.split('=')[0], x]));
  for (const line of raw) {
    const cookie = String(line).split(';')[0];
    const name = cookie.split('=')[0];
    if (cookie.endsWith('=')) map.delete(name); else map.set(name, cookie);
  }
  cookieJar = [...map.values()].join('; ');
}
function csrf() {
  const match = cookieJar.match(/(?:^|; )mavenlex_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
async function request(path, { method = 'GET', body, csrfRequired = false } = {}) {
  const headers = { ...(cookieJar ? { Cookie: cookieJar } : {}) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrfRequired && csrf()) headers['X-CSRF-Token'] = csrf();
  const res = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  mergeCookies(res.headers);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}
function assert(ok, message) { if (!ok) throw new Error(message); }

console.log(`[full-cookie-auth-e2e] API=${API}`);

let r = await request('/api/auth/full-cookie-auth-readiness');
assert([200,503].includes(r.res.status), 'readiness endpoint did not respond');
console.log(`[full-cookie-auth-e2e] readiness=${r.res.status}`);

r = await request('/api/auth/register', { method: 'POST', body: { name: 'Cookie E2E', email, password } });
assert(r.res.ok, `register failed: ${r.res.status} ${JSON.stringify(r.data)}`);
assert(cookieJar.includes('mavenlex_session='), 'register did not set HttpOnly session cookie');
assert(cookieJar.includes('mavenlex_csrf='), 'register did not set CSRF cookie');
assert(!r.data.session?.token, 'register response exposed raw session token');
assert(r.data.session?.csrfToken, 'register response did not expose CSRF token');
console.log('[full-cookie-auth-e2e] register cookie session OK');

r = await request('/api/auth/me');
assert(r.res.ok && r.data.user?.email === email, 'cookie /me failed');
console.log('[full-cookie-auth-e2e] cookie /me OK');

r = await request('/api/user/history', { method: 'POST', body: { item: { type: 'e2e', summary: 'cookie auth e2e item' } } });
assert(r.res.status === 403, 'unsafe request without CSRF should be blocked');
console.log('[full-cookie-auth-e2e] CSRF blocking OK');

r = await request('/api/user/history', { method: 'POST', csrfRequired: true, body: { item: { type: 'e2e', summary: 'cookie auth e2e item' } } });
assert(r.res.ok, `unsafe request with CSRF failed: ${r.res.status} ${JSON.stringify(r.data)}`);
console.log('[full-cookie-auth-e2e] CSRF pass OK');

r = await request('/api/auth/change-password', { method: 'POST', csrfRequired: true, body: { currentPassword: password, newPassword } });
assert(r.res.ok, `change password failed: ${r.res.status} ${JSON.stringify(r.data)}`);
console.log('[full-cookie-auth-e2e] change password OK');

r = await request('/api/auth/me');
assert(r.res.status === 401, 'old session should be revoked after password change');
console.log('[full-cookie-auth-e2e] session revocation after password change OK');

cookieJar = '';
r = await request('/api/auth/login', { method: 'POST', body: { email, password: newPassword } });
assert(r.res.ok, `login with new password failed: ${r.res.status} ${JSON.stringify(r.data)}`);
assert(!r.data.session?.token, 'login response exposed raw session token');
console.log('[full-cookie-auth-e2e] login new password cookie session OK');

r = await request('/api/auth/logout-all', { method: 'POST', csrfRequired: true, body: {} });
assert(r.res.ok, `logout-all failed: ${r.res.status} ${JSON.stringify(r.data)}`);
console.log('[full-cookie-auth-e2e] logout-all OK');

console.log('[full-cookie-auth-e2e] OK');
if (child) child.kill();
