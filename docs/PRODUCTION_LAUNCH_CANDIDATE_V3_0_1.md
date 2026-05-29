# MavenLex v3.0.1 — Production Launch Candidate + Go-Live

v3.0.1 фиксирует запусковую сборку и добавляет go-live проверки для публичного домена.

## Главное

- Проект готовится к выкладке на `.app`.
- Backend умеет отдавать собранный frontend из `dist`.
- Production API работает same-origin.
- Добавлена отдельная проверка `/api/go-live-check`.
- Добавлена команда `npm run go-live-check`.

## Последовательность запуска

1. Распаковать ZIP.
2. Выполнить `npm install`.
3. Выполнить `npm run check`.
4. Выполнить `npm run go-live-check`.
5. Залить проект в GitHub.
6. Подключить Render/Vercel.
7. Добавить env-переменные на хостинге.
8. Задеплоить.
9. Выполнить `API_URL=https://your-site.app npm run go-live-check`.
10. Проверить анализ договора, AI-вопрос, кабинет, тарифы и админку.

## Не хранить в коде

- Yandex API key.
- YooKassa secret.
- Database URL.
- Admin secrets.

Все секреты — только в Environment Variables хостинга.
