# v3.3.2 — Email Delivery + Cookie Session Security

This release finishes the auth hardening layer with real email delivery architecture and secure cookie-session foundation.

## Added

- Resend-ready transactional email delivery for password reset and email verification.
- HTML/text email templates for reset and verification.
- Email delivery audit records in the JSON database foundation.
- Admin-only email delivery test endpoint: `POST /api/auth/email/test`.
- Email readiness endpoint: `GET /api/auth/email-readiness`.
- HttpOnly session cookie support: `mavenlex_session`.
- CSRF token foundation for cookie-based authenticated requests.
- Cookie session readiness endpoint: `GET /api/auth/cookie-session-readiness`.
- `credentials: include` frontend API calls for cookie-compatible auth.
- New check command: `npm run auth-email-cookie-check`.

## Production env

Use these on hosting, not in frontend code:

```env
EMAIL_PROVIDER=resend
EMAIL_FROM=MavenLex <no-reply@your-domain.com>
RESEND_API_KEY=...
SUPPORT_EMAIL=support@your-domain.com
SESSION_SECRET=long_random_secret
AUTH_COOKIE_ENABLED=true
AUTH_CSRF_ENABLED=true
COOKIE_SECURE=true
COOKIE_SAME_SITE=Lax
```

## Notes

- `EMAIL_PROVIDER=console` is fine locally but not for production.
- Bearer token auth remains supported for compatibility.
- Cookie auth is now available through HttpOnly cookies and CSRF headers.
- SMTP env fields are documented, but this build recommends Resend because it works without adding a mail transport dependency.
