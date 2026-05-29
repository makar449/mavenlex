# v3.5.0 — Contract Comparison Pack

Добавлено сравнение двух версий договора.

## Что умеет

- загрузка старой и новой версии договора;
- risk score до/после;
- risk delta;
- новые, удалённые и ухудшившиеся риски;
- карта изменённых пунктов;
- фокус переговоров;
- сообщение контрагенту;
- экспорт сравнения в Markdown/TXT;
- история сравнения в кабинете.

## Endpoints

- `GET /api/ai/contract-comparison-readiness`
- `POST /api/compare-contracts`

## Проверка

```bash
npm run contract-comparison-check
npm run check
```
