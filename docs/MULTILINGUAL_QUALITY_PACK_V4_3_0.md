# v4.3.0 — Multilingual Quality Pack

Цель: сделать RU/EN поддержку не косметической, а рабочей частью продукта.

## Что входит

- Русский и английский интерфейс.
- Переключатель языка с сохранением выбора.
- Локализованные маршруты `/ru` и `/en`.
- Обновление `document.lang`, title, description и `og:locale`.
- Выбор языка исходного документа: auto / ru / en.
- Выбор языка отчёта: ru / en.
- Backend language detection для текста договора.
- AI prompt получает detected/source language и output language.
- Sitemap содержит hreflang alternate links.
- API readiness endpoints:
  - `GET /api/i18n/readiness`
  - `GET /api/i18n/languages`
  - `POST /api/i18n/detect-language`

## Проверка

```bash
npm run multilingual-check
npm run i18n-check
```

Для production:

```bash
API_URL=https://your-site.app npm run multilingual-check
```

## Env

```env
DEFAULT_LANGUAGE=ru
MULTILINGUAL_MODE=true
LANGUAGE_DETECTION_ENABLED=true
```

## Что важно

Перевод юридических выводов не должен выглядеть как машинная замена слов. Поэтому backend просит AI возвращать обе языковые версии, но делать выбранный язык отчёта более естественным и вычитанным.
