# MavenLex v3.3.3 — Full Cookie Auth + E2E Auth QA

## Цель

Довести auth до более безопасного production-подхода: браузер больше не должен хранить сырой session token во frontend storage. Основной режим — HttpOnly cookie session + CSRF для небезопасных запросов.

## Что добавлено

- Полный cookie-auth режим для login/register/authenticated API.
- Backend ставит HttpOnly session cookie `mavenlex_session`.
- Frontend больше не сохраняет raw session token в `localStorage`.
- Frontend хранит только публичные данные сессии: `id`, `expiresAt`, `csrfToken`, `mode`.
- `Authorization: Bearer ...` оставлен только как legacy fallback.
- CSRF token обязателен для unsafe requests при cookie-auth.
- `/api/auth/me` восстанавливает сессию по cookie после перезагрузки страницы.
- `/api/auth/full-cookie-auth-readiness` показывает готовность cookie-auth.
- Добавлен E2E auth QA сценарий.

## Новая команда

```bash
npm run full-cookie-auth-e2e-check
```

Проверяет:

1. register;
2. HttpOnly cookie set;
3. CSRF cookie set;
4. отсутствие raw token в JSON response;
5. `/api/auth/me` по cookie;
6. блокировку unsafe request без CSRF;
7. успешный unsafe request с CSRF;
8. change password;
9. revoke старой сессии;
10. login с новым паролем;
11. logout all.

## Production env

```env
AUTH_COOKIE_ENABLED=true
AUTH_CSRF_ENABLED=true
COOKIE_SECURE=true
COOKIE_SAME_SITE=Lax
SESSION_SECRET=long-random-secret
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
EMAIL_FROM=MavenLex <no-reply@your-domain.app>
PUBLIC_APP_URL=https://your-site.app
APP_BASE_URL=https://your-site.app
```

## Важно

Это не заменяет внешний security audit, но закрывает главную проблему frontend token storage и добавляет реальный E2E auth сценарий.
