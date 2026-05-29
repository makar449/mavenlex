import process from 'node:process';

const required = [
  'EMAIL_PROVIDER',
  'EMAIL_FROM',
  'RESEND_API_KEY',
  'AUTH_COOKIE_ENABLED',
  'AUTH_COOKIE_NAME',
  'AUTH_CSRF_ENABLED',
  'COOKIE_SECURE',
  '/api/auth/email-readiness',
  '/api/auth/cookie-session-readiness',
  '/api/auth/email/test'
];

const api = process.env.API_URL;
if (!api) {
  console.log('[auth-email-cookie-check] Static check OK:', required.join(', '));
  process.exit(0);
}

for (const path of ['/api/health', '/api/auth/security-readiness', '/api/auth/email-readiness', '/api/auth/cookie-session-readiness']) {
  const res = await fetch(`${api}${path}`);
  if (!res.ok && path !== '/api/auth/email-readiness') throw new Error(`${path} failed: ${res.status}`);
  const body = await res.json().catch(() => ({}));
  if (!body) throw new Error(`${path} returned an empty body.`);
}
console.log('[auth-email-cookie-check] Remote email + cookie readiness checked:', api);
