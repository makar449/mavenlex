# v4.8.0 — Brand UI System + Admin Console Pro

Этот релиз объединяет v4.7.0 и v4.8.0 в один качественный пакет.

## Brand UI System

- единые design tokens;
- единые кнопки, карточки, формы, статусы и empty/error states;
- отдельная страница `/design-system`;
- readiness endpoint `/api/brand-ui/readiness`;
- проверка `npm run brand-ui-check`.

## Admin Console Pro

- единый операционный обзор продукта;
- пользователи, команды, платежи, поддержка, abuse, storage, AI costs, reliability;
- endpoint `/api/admin/console-pro`;
- блок Admin Console Pro в `/admin`;
- проверка `npm run admin-console-pro-check`.

## Проверки

```bash
npm run build
npm run brand-ui-check
npm run admin-console-pro-check
npm run check
```
