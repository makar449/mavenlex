# MavenLex v1.9.9 — Real Auth + Database Foundation

This version adds the first real backend foundation for accounts and server-side history.

## Added

- `POST /api/auth/register` — create a user.
- `POST /api/auth/login` — login and receive a session token.
- `GET /api/auth/me` — read the current backend user.
- `POST /api/auth/logout` — remove the session.
- `GET /api/user/history` — load server-side history.
- `POST /api/user/history` — save an item to server-side history.
- `DELETE /api/user/history/:id` — delete one server history item.
- `DELETE /api/user/history` — clear server history.
- `GET /api/user/usage` — read monthly usage foundation.

## Storage

The MVP database is a JSON file:

```text
.data/mavenlex-db.json
```

This is intentionally excluded from Git through `.gitignore`.

## Important

This is a foundation, not final production auth. For a real paid public launch, replace JSON storage with PostgreSQL/Supabase/Firebase/Auth provider, add email verification, password reset, server-side rate limits, payment webhooks and secure session handling.
