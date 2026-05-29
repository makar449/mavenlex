# Final Public Launch Checklist

Use this before showing MavenLex to real users.

## Required environment

- [ ] `ADMIN_EMAILS` is configured.
- [ ] `YANDEX_API_KEY` / `YANDEXGPT_API_KEY` is configured.
- [ ] `YANDEX_FOLDER_ID` / `YANDEXGPT_FOLDER_ID` is configured.
- [ ] `DISABLE_LIVE_AI` is not `true` for real user sessions.
- [ ] Billing mode is understood: `manual`, `mock`, `yookassa`, or `stripe`.
- [ ] Live payments are disabled unless provider keys and webhook verification are ready.

## Local checks

```bash
npm run doctor
npm run launch-check
npm run build
```

With backend running:

```bash
API_URL=http://localhost:3001 npm run launch-check
npm run smoke
```

## Product path

- [ ] Home page explains value clearly.
- [ ] Contract upload works.
- [ ] AI analysis returns a readable report.
- [ ] AI chat works after analysis.
- [ ] Account shows plan, usage and limits.
- [ ] Pricing explains Free / Pro / Business clearly.
- [ ] Admin shows health, usage, billing and launch blockers.
- [ ] Mobile layout does not overflow.

## Public launch decision

The site is ready to show to users when:

- Admin says `Ready for public launch: Yes`, or every blocker is understood and accepted.
- YandexGPT works in the intended environment.
- You know whether payments are mock/manual or live.
- You can monitor errors and usage in `/admin`.
