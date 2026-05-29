# v2.7.0 Deployment + Production Hardening

This release prepares MavenLex to run as a real `.app` deployment instead of only a local Vite product preview.

## What changed

- `render.yaml` now builds the frontend with `npm run build` and starts the Node server with `npm start`.
- `server.js` can serve the compiled frontend from `dist/` in production.
- The React app uses same-origin API calls in production when `VITE_API_URL` is not set.
- `/api/health` includes deployment metadata.
- Added `npm run deploy-check` for Render/.app readiness.
- Updated `npm run check` to include deployment checks.

## Local run

```bash
npm install --legacy-peer-deps
npm run dev
```

Open the frontend URL printed by Vite, usually `http://localhost:5173`.

## Production-style local run

```bash
npm install --legacy-peer-deps
npm run build
NODE_ENV=production SERVE_FRONTEND=true PORT=3101 npm start
```

Open:

```txt
http://localhost:3101
http://localhost:3101/api/health
http://localhost:3101/api/launch-check
```

## Render deployment

1. Push this folder to GitHub.
2. Connect the repository in Render.
3. Render should read `render.yaml` automatically.
4. Set required environment variables in Render, not in code.

Required production env variables:

```env
APP_BASE_URL=https://your-app-url.app
ADMIN_EMAILS=you@example.com
YANDEX_API_KEY=...
YANDEX_PROJECT_ID=...
YANDEX_MODEL=gpt://.../yandexgpt/latest
NODE_ENV=production
SERVE_FRONTEND=true
LAUNCH_MODE=public
BILLING_PROVIDER=manual
PAYMENTS_ENABLED=false
```

Optional aliases if your Yandex config uses these names:

```env
YANDEXGPT_API_KEY=...
YANDEXGPT_FOLDER_ID=...
```

## After deploy

Open:

```txt
https://your-app-url.app/api/health
https://your-app-url.app/api/launch-check
https://your-app-url.app/faq
https://your-app-url.app/admin
```

Then log in with an email from `ADMIN_EMAILS` and check `/admin`.

## Important

Do not put API keys into frontend code. Keep them in Render Environment Variables only.

JSON database is still acceptable for a very small first launch, but it is not a long-term production database. For real paid users, move to PostgreSQL/Supabase/Neon.
