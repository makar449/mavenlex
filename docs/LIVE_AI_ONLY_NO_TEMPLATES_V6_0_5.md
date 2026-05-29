# MavenLex v6.0.5 — Live AI Only, No Template Fallback

This release removes local/template fallback answers from user-facing AI flows.

## Changed

- Contract analysis now requires live AI. If YandexGPT is not configured or fails, MavenLex returns a clear `AI не работает` error instead of showing a local template report.
- Legal chat now requires live AI. Weak/refusal answers are retried once; if the model still fails, MavenLex says AI is not working rather than replacing it with a local template.
- Article chat/search now requires live AI. Local article templates are no longer shown as if they were AI.
- Admin AI status now says honestly whether AI is connected or not.
- User-facing wording was updated to avoid hiding AI failures behind fallback/demo behavior.

## Required environment for live AI

```env
DISABLE_LIVE_AI=false
YANDEX_API_KEY=...
YANDEX_PROJECT_ID=...
YANDEX_MODEL=gpt://<folder_id>/yandexgpt/latest
```
