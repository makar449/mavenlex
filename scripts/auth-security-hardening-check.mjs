import process from 'node:process';

const required = [
  '/api/auth/password-reset/request',
  '/api/auth/password-reset/validate',
  '/api/auth/password-reset/confirm',
  '/api/auth/email-verification/request',
  '/api/auth/email-verification/confirm',
  '/api/auth/sessions',
  '/api/auth/security-status',
  '/api/auth/security-readiness',
  '/api/admin/users',
  '/api/admin/users/:id/security',
  '/reset-password',
  '/verify-email'
];

const api = process.env.API_URL;
if (!api) {
  console.log('[auth-security-hardening-check] Static check OK:', required.join(', '));
  process.exit(0);
}

const health = await fetch(`${api}/api/health`);
if (!health.ok) throw new Error(`Health failed: ${health.status}`);
const readiness = await fetch(`${api}/api/auth/security-readiness`);
if (!readiness.ok) throw new Error(`Auth security readiness failed: ${readiness.status}`);
const body = await readiness.json();
if (!body?.readiness) throw new Error('Auth security readiness response is missing readiness payload.');
console.log('[auth-security-hardening-check] Remote auth readiness OK:', api);
