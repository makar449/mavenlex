# MavenLex v3.3.1 — Auth Security Hardening

This release finishes the auth layer started in v3.3.0.

## Added

- Full password reset token lifecycle:
  - request token;
  - validate token;
  - confirm new password;
  - expire tokens;
  - mark used tokens;
  - revoke active sessions after reset.
- Email verification lifecycle:
  - token creation on registration;
  - resend verification;
  - GET/POST verification confirmation;
  - verified status in Account.
- Session hardening:
  - token hashing in storage;
  - session id;
  - last seen timestamp;
  - max sessions per user;
  - revoke session;
  - logout all devices.
- Account Security UI:
  - email status;
  - role/status;
  - active sessions;
  - change password;
  - request verification;
  - reset password page.
- Login abuse protection:
  - failed-login counter;
  - temporary account lock;
  - auth audit events.
- Admin security controls:
  - search/filter users;
  - suspend/unsuspend;
  - force logout;
  - reset usage;
  - view sessions/auth events per user.
- Production readiness:
  - `/api/auth/security-readiness`;
  - `npm run auth-security-hardening-check`;
  - stricter env checks for secrets/password policy/session TTL.

## Important env

```env
SESSION_SECRET=long_random_secret
AUTH_TOKEN_TTL_DAYS=30
AUTH_PASSWORD_MIN_LENGTH=8
AUTH_PASSWORD_COMPLEXITY=medium
AUTH_MAX_SESSIONS_PER_USER=10
AUTH_RESET_TOKEN_TTL_MINUTES=60
AUTH_VERIFY_TOKEN_TTL_HOURS=24
AUTH_FAILED_LOGIN_LIMIT=5
AUTH_FAILED_LOGIN_LOCK_MINUTES=15
EMAIL_PROVIDER=console
```

`EMAIL_PROVIDER=console` is acceptable for local/dev. Real email delivery should be implemented in the next email pack.
