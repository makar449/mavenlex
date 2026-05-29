# MavenLex v5.3.0 — Full UI Language Switch

## Goal
When a user selects Russian or English, the visible product interface should immediately follow that language: navigation, headings, buttons, state pages, labels, placeholders and common SaaS/status copy.

## What changed
- Added a global RU/EN UI translation dictionary in `src/main.jsx`.
- Added a DOM-level translation pass for hardcoded legacy labels that were not yet wrapped in `ru ? ... : ...`.
- Added translation of text nodes, placeholders, titles and aria labels.
- Language selection now updates the localized route immediately (`/ru/...` or `/en/...`).
- For logged-in users, the selected language is synced to `/api/user/profile` as `preferredLanguage`.
- Backend profile updates now allow `preferredLanguage`.

## Result
The site no longer mixes Russian and English across the main SaaS UI after language selection. Brand names, plan names and technical abbreviations such as API/AI/Pro/Business intentionally remain stable where appropriate.

## QA
Run:

```bash
npm run build
npm run ui-language-check
node --check server.js
```

Manual check:
1. Open `/ru`, browse Home, Account, Pricing, Analyze, Report and Settings.
2. Click `EN`; URL should switch to `/en...` and the interface should become English.
3. Click `RU`; URL should switch to `/ru...` and the interface should become Russian.
4. Log in and change language; `preferredLanguage` should be stored in the profile.
