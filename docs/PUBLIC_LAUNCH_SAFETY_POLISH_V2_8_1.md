# v2.8.1 Public Launch Safety Polish

This patch makes MavenLex feel safer and more production-ready for ordinary users while keeping technical diagnostics available for admins.

## What changed

- Public pricing and account copy no longer exposes `mock`, `manual`, `debug`, or tester-oriented payment language.
- Safe plan activation is shown to users as a normal, controlled billing state.
- Admin panels still show provider, webhook, database and readiness details.
- Upload trust copy now explicitly recommends removing personal data from confidential contracts before upload.
- The report sample is presented as a sample, not a preview/debug mode.
- Added `PUBLIC_LAUNCH_MODE=true` for hiding technical billing details from public UX.
- Added `npm run public-safety-check` to detect obvious public-facing technical wording regressions.

## Environment

Recommended for public preview:

```env
PUBLIC_LAUNCH_MODE=true
VITE_PUBLIC_LAUNCH_MODE=true
BILLING_PROVIDER=manual
BILLING_MOCK_ENABLED=true
```

Do not expose API keys in frontend variables. Keep YandexGPT and billing secrets only in hosting environment variables.

## Notes

This release still does not enable live money charging. It makes the public product experience cleaner while preserving the safe billing foundation for the next live-payment step.
