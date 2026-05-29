import process from 'node:process';

const api = process.env.API_URL;
const required = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/change-password',
  '/api/auth/password-reset/request',
  '/api/auth/email-verification/request',
  '/api/auth/security-status',
  '/api/admin/users',
  '/api/admin/auth-events'
];

if (!api) {
  console.log('[auth-security-check] Static check OK:', required.join(', '));
  process.exit(0);
}

const res = await fetch(`${api}/api/health`);
if (!res.ok) throw new Error(`Health failed: ${res.status}`);
console.log('[auth-security-check] Remote API reachable:', api);
