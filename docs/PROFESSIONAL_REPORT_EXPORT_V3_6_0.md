# v3.6.0 — Professional Report Export

Цель: превратить результат MavenLex в нормальный рабочий документ, который можно сохранить, отправить юристу, контрагенту или партнёру.

## Добавлено

- Профессиональный HTML/PDF-print отчёт по договору.
- Word-compatible экспорт `.doc` без дополнительных серверных зависимостей.
- Markdown, TXT и JSON экспорт.
- Улучшенный export layout: cover, risk score, decision helper, risk matrix, risk table, signing checklist, lawyer questions, negotiation message, detailed review, disclaimer.
- Watermark/label для Free export.
- Учёт лимита export по тарифу на frontend usage meter.
- Профессиональный экспорт сравнения договоров: PDF/print, HTML, Word, Markdown, TXT, JSON.
- Новый endpoint: `GET /api/export/readiness`.
- Новая проверка: `npm run export-check`.

## Почему PDF через print

В v3.6.0 PDF делается через browser print-to-PDF. Это надёжнее для текущей Vite/Express архитектуры, не требует тяжёлого headless Chromium на хостинге и работает на `.app` без отдельного PDF-сервиса.

## Следующий уровень

Для v3.6.x/v3.7 можно добавить серверный PDF-renderer, если нужен пиксельный PDF без участия браузера.
