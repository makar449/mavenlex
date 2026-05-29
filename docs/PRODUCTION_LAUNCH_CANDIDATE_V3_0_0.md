# v3.0.0 — Production Launch Candidate

MavenLex v3.0.0 is the final launch-candidate packaging pass. It does not add another large user-facing module. It consolidates the product into a version that is easier to deploy, check and open to real users.

## What changed

- Version updated to `3.0.0`.
- Added one unified production command: `npm run production-check`.
- Added backend endpoint: `GET /api/production-check`.
- Updated Admin into **MavenLex Launch Center**.
- Launch Center now highlights public site, AI analysis, database, billing, legal pages, SEO pages, export actions, errors and blockers.
- Public wording was adjusted from feature-phase language to launch-candidate language.
- `npm run check` now includes the production check.
- Launch, deploy and billing checks were updated for v3.0.0.

## Final local verification

```bash
npm install
npm run check
npm run production-check
npm run build
```

For backend checks:

```bash
npm run dev
API_URL=http://localhost:3001 npm run production-check
API_URL=http://localhost:3001 npm run launch-check
API_URL=http://localhost:3001 npm run smoke
```

## Production deployment checklist

1. Push this release to the GitHub repository connected to hosting.
2. Confirm build command: `npm install --legacy-peer-deps && npm run build`.
3. Confirm start command: `npm start`.
4. Add hosting environment variables: `ADMIN_EMAILS`, `YANDEX_API_KEY`, `YANDEX_FOLDER_ID`, `APP_BASE_URL`, billing variables and database variables.
5. Deploy.
6. Check `/api/health`.
7. Check `/api/launch-check`.
8. Check `/api/production-check`.
9. Log in with an admin email and open `/admin`.
10. Run the full user path: account, upload, analysis, AI question, export, pricing, billing return page and history.

## Notes

- JSON database mode remains useful for local development use, but PostgreSQL/Supabase/Neon is recommended before high-traffic public use.
- Live YooKassa requires real credentials, webhook secret and successful webhook delivery.
- AI analysis requires backend-only YandexGPT secrets. Do not expose keys in frontend code.
