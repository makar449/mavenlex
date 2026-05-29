# MavenLex v6.1.4 — Account + AI + Layout Fix

Focused hotfix based on live screenshots:

- Login now auto-recreates a missing account on deploy reset when the email is not found and the password satisfies policy. This prevents Render JSON storage resets from trapping valid users behind a wrong-password message.
- AI instructions were tightened so MavenLex answers directly and does not tell ordinary users to contact a lawyer.
- Law article category chips now trigger a real article explanation automatically. Users can click “Долги”, “Аренда”, “Работа”, etc. without knowing the article number.
- Contract upload/dropzone layout was hardened against vertical letter wrapping.
- Top navigation pills were hardened so titles fit inside their frame and scroll horizontally when needed.
- Account/security layout and long email text wrapping were reinforced.

Checks:

```bash
node --check server.js
npm run account-ai-layout-fix-check
npm run build
```
