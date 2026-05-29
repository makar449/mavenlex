# MavenLex v3.0.1 — Go-Live Deploy Pack

Цель релиза — подготовить MavenLex к нормальному запуску на публичном `.app` домене.

## Что добавлено

- `npm run go-live-check` — финальная проверка перед публикацией ссылки.
- `GET /api/go-live-check` — backend endpoint для проверки живого домена.
- Проверка `PUBLIC_APP_URL` и `APP_BASE_URL`.
- Проверка production routes и API endpoints после деплоя.
- Обновлён `render.yaml` для Render-style deploy.
- Документация для выката на `.app`.

## Команды для локальной проверки

```bash
npm install
npm run build
npm run check
npm run go-live-check
```

## Команда после деплоя

```bash
API_URL=https://your-site.app npm run go-live-check
```

## Environment variables на хостинге

Минимально:

```env
NODE_ENV=production
SERVE_FRONTEND=true
APP_BASE_URL=https://your-site.app
PUBLIC_APP_URL=https://your-site.app
ADMIN_EMAILS=your@email.com
YANDEX_API_KEY=***
YANDEX_PROJECT_ID=***
YANDEX_MODEL=gpt://.../yandexgpt/latest
DATABASE_PROVIDER=json
BILLING_PROVIDER=manual
PAYMENTS_ENABLED=false
PUBLIC_LAUNCH_MODE=true
```

Для реального роста заменить `DATABASE_PROVIDER=json` на PostgreSQL/Supabase/Neon.

## Что проверить на `.app`

- `/`
- `/faq`
- `/privacy`
- `/terms`
- `/security`
- `/pricing`
- `/account`
- `/admin`
- `/api/health`
- `/api/launch-check`
- `/api/production-check`
- `/api/go-live-check`

## Go-live правило

Не давать ссылку пользователям, пока:

- `npm run go-live-check` проходит локально;
- `API_URL=https://your-site.app npm run go-live-check` проходит после деплоя;
- `/admin` открывается для email из `ADMIN_EMAILS`;
- AI-анализ реально отвечает на `.app`.
