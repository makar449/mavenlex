
## MavenLex v5.7.0 — Executive Quality Readiness

- Added stronger premium legal product polish for client review.
- Added legal review focus selection and user-side selection before contract analysis.
- Removed visible sample/demo-style fallback wording from reports.
- Added `/api/executive-quality/v5-7` and `npm run executive-quality-check`.
- Kept the personal-first no-workspace user journey.

# MavenLex v5.6.0 — Quality Launch Readiness

This build improves MavenLex as a premium AI legal SaaS for real users. It adds launch readiness pages, manual browser QA scenarios, PostgreSQL launch schema, payment readiness checks, legal specialization templates and a clearer first-value user flow.

Key routes:

- `/launch` — quality launch readiness center.
- `/qa` — browser QA scenarios.
- `/api/launch-readiness/v5-6` — technical launch status.
- `/api/legal/templates` — legal scenario templates.

Recommended checks:

```bash
npm install
npm run build
npm run quality-launch-check
npm run personal-first-check
npm run ui-language-check
npm run premium-user-polish-check
npm run production-hardening-check
node --check server.js
```

# MavenLex v5.4.0 — Premium User Polish

This release presents MavenLex as a polished user-facing AI legal product. Public UI copy avoids product preview/test wording, the main experience uses premium product language, and the home page has a more refined visual system with subtle motion and elevated cards.

# MavenLex v5.3.0 — Full UI Language Switch

- Full RU/EN interface switching for headings, buttons, nav, labels, placeholders and common SaaS states.
- Selected language updates `/ru`/`/en` routes immediately.
- Logged-in users sync `preferredLanguage` to the backend profile.
- Added `npm run ui-language-check` and docs/UI_LANGUAGE_SWITCH_V5_3_0.md.

## v5.2.0 — Real User Auth & Launch Readiness

- Improved auth/session production behavior and protected user states.
- Added account export and delete-account UI/API.
- Added real-user readiness endpoint and check script.
- Improved Trust Center visibility and privacy/user-rights copy.
- Added UI polish for real-user onboarding, account readiness and blocked states.

## v5.0.0 — Commercial SaaS Release

- Финальная коммерческая сборка MavenLex.
- Добавлен `npm run commercial-release-check`.
- Добавлен endpoint `/api/commercial-release-check`.
- Добавлен финальный checklist для продажи: AI, DB, YooKassa, email, auth, legal, SEO, export, team, support, abuse, reliability, admin.
- Документация: `docs/COMMERCIAL_SAAS_RELEASE_V5_0_0.md`.


### v4.8.0 — Brand UI System + Admin Console Pro

- Единая дизайн-система и UI tokens.
- Страница `/design-system`.
- Admin Console Pro: users, teams, billing, support, abuse, storage, AI costs, reliability.
- Новые проверки: `npm run brand-ui-check`, `npm run admin-console-pro-check`.


## v4.5.0 — AI Cost Management

MavenLex now includes internal AI cost management: feature-level AI usage events, estimated token/cost tracking, monthly budget alerts and admin-ready cost summaries. Run:

```bash
npm run ai-cost-check
```



## v3.6.0 — Professional Report Export

- Added professional report export: PDF/print, HTML, Word-compatible `.doc`, Markdown, TXT and JSON.
- Added professional comparison export in the same formats.
- Added export readiness endpoint: `GET /api/export/readiness`.
- Added `npm run export-check`.
- Export UI now shows remaining export limit and records export usage locally.

## v3.3.3 — Full Cookie Auth + E2E Auth QA

- Переведён основной auth-flow на HttpOnly cookie sessions.
- Frontend больше не сохраняет raw session token в localStorage.
- CSRF используется для POST/PUT/PATCH/DELETE при cookie-auth.
- Добавлен `/api/auth/full-cookie-auth-readiness`.
- Добавлен `npm run full-cookie-auth-e2e-check`.
- Добавлена документация `docs/FULL_COOKIE_AUTH_E2E_QA_V3_3_3.md`.


## v3.3.2 Auth Security Pack

This release strengthens account security with login/register rate limits, account suspension support, role foundation, logout-all, change-password, password reset foundation, email verification foundation and admin auth audit endpoints.

Run:

```bash
npm run auth-security-check
```

# MavenLex AI Legal Assistant

## v3.3.2 PostgreSQL Database Foundation

New database commands:

```bash
npm run db-health
npm run db-migration-plan
npm run db-migrate
```

Production database env:

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require
```

Migration order:

1. `docs/sql/001_init.sql`
2. `docs/sql/002_production_database_schema.sql`
3. `docs/sql/003_postgresql_database_foundation.sql`

JSON storage remains available for local development. Use PostgreSQL/Supabase/Neon for real users.


## v3.0.1 Go-Live Deploy Pack

This release prepares MavenLex for deployment to the public `.app` domain.

### Main commands

```bash
npm install --legacy-peer-deps
npm run check
npm run go-live-check
npm start
```

After deployment, verify the live domain:

```bash
API_URL=https://your-site.app npm run go-live-check
```

Required hosting env variables:

```env
NODE_ENV=production
SERVE_FRONTEND=true
APP_BASE_URL=https://your-site.app
PUBLIC_APP_URL=https://your-site.app
ADMIN_EMAILS=your@email.com
YANDEX_API_KEY=***
YANDEX_PROJECT_ID=***
YANDEX_MODEL=gpt://.../yandexgpt/latest
DATABASE_PROVIDER=json
BILLING_PROVIDER=manual
PAYMENTS_ENABLED=false
PUBLIC_LAUNCH_MODE=true
```

See `docs/GO_LIVE_DEPLOY_PACK_V3_0_1.md`.

## v3.0.0 — Production Launch Candidate

- Final launch-candidate packaging for MavenLex.
- Added `npm run production-check`.
- Added `GET /api/production-check`.
- Updated Admin into **MavenLex Launch Center**.
- Launch Center now checks public site, AI analysis, database, billing, legal pages, SEO pages, export, errors and blockers.
- Updated `npm run check` to include the production check.
- See `docs/PRODUCTION_LAUNCH_CANDIDATE_V3_0_0.md`.

## v2.9.2 — Export + Checklist + Decision Helper

- Added `/api/billing/readiness` for billing-specific production checks.
- Added production guard for mock billing: `BILLING_ALLOW_MOCK_IN_PRODUCTION=false`.
- Added stricter webhook mode via `BILLING_STRICT_WEBHOOKS=true`.
- Webhook activation now checks provider payment id, metadata, amount and currency before activating a plan.
- Duplicate successful payment events are idempotent and logged.
- Added billing audit events in Admin.
- Improved success/cancel payment status copy for users.
- Updated billing check scripts and environment documentation.

## v2.9.0 User Account & History Polish

This release improves the user workspace: saved analysis history, clear limits, quick return to reports, backend history sync and admin visibility into recent analyses.

## v2.8.3 Analysis Report Quality Polish

This version improves the core report experience: reports now include a clearer mini-audit section, top risk priority ladder, next actions and practical questions to verify before signing. Public trust/legal pages from v2.8.2 remain included.

## v2.8.2 Legal Pages + Public Trust Pack

This release prepares MavenLex for real persistent storage without removing the safe JSON fallback. It adds production database readiness checks, a PostgreSQL-compatible schema, a DB check script and clearer deployment guidance for Supabase, Neon, Render PostgreSQL or any managed PostgreSQL provider.

### Database-ready commands

```bash
npm install --legacy-peer-deps
npm run build
npm run db-check
npm run deploy-check
npm run launch-check
npm start
```

For local development usage, `DATABASE_PROVIDER=json` still works. For real users, create a PostgreSQL-compatible database, run `docs/sql/002_production_database_schema.sql`, then set these hosting Environment Variables:

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
LAUNCH_MODE=production
```

Useful endpoints:

- `GET /api/db/status`
- `GET /api/db/readiness`
- `GET /api/launch-check`

See `docs/PRODUCTION_DATABASE_FOUNDATION_V2_8_0.md`.

## v2.7.0 Deployment + Production Hardening

This release prepares MavenLex for a real `.app` deployment: Render build/start commands, same-origin production API, Node serving the built frontend, deployment checks and production env documentation.

### Deploy-ready commands

```bash
npm install --legacy-peer-deps
npm run build
npm run deploy-check
npm run launch-check
npm start
```

For Render, keep secrets in Environment Variables, not in code. See `docs/DEPLOYMENT_PRODUCTION_HARDENING.md`.


## v2.6.0 Public Launch Growth Pack

Этот релиз готовит сайт к публичному использованию: добавлены SEO/growth landing pages, FAQ-страница, внутренние public analytics events и понятные пути к анализу договора и тарифам.

### Что добавлено

- `/ai-contract-analysis` — посадочная страница AI-анализа договоров.
- `/contract-risk-analysis` — объяснение risk score и анализа рисков.
- `/business-contract-review` — страница для предпринимателей и команд.
- `/faq` — публичный FAQ.
- `POST /api/analytics/track` — внутренние события роста без внешней CRM.
- `GET /api/growth/overview` — краткая сводка growth events.

### Быстрый запуск

```bash
npm install
npm run doctor
npm run launch-check
npm run dev
```

### Проверка перед показом пользователям

```bash
npm run build
API_URL=http://localhost:3001 npm run launch-check
API_URL=http://localhost:3001 npm run smoke
```


## v2.5.2 Public Ready Cleanup

This version removes the visible tester-oriented flow and makes MavenLex feel ready for normal users.

- removed the public test-feedback panel from the home page;
- added a public FAQ block for safety, formats, AI limits and pricing;
- reworded Admin readiness from public launch to public launch;
- reworded Pricing checkout copy for safe manual/mock billing mode;
- kept admin monitoring, billing foundation, usage limits and health checks;
- live payments are still disabled by default until YooKassa/Stripe keys and verified webhooks are configured.

Recommended pre-launch commands:

```bash
npm install --legacy-peer-deps
npm run doctor
npm run launch-check
npm run build
npm run api
API_URL=http://localhost:3001 npm run launch-check
npm run smoke
```

See:

- `docs/PUBLIC_READY_CLEANUP.md`
- `docs/FINAL_LAUNCH_CHECKLIST.md`
- `docs/FINAL_LAUNCH_PACK.md`


This version strengthens the core user outcome after analysis: users can export a report as PDF/HTML/Markdown/TXT, copy a short summary, copy key risks, copy lawyer/counterparty questions, use a pre-signing checklist, and see a clearer decision helper before signing.

## Quick start

```bash
npm install --legacy-peer-deps
npm run dev
```

Open: `http://localhost:5173`

## Admin access

Set admin emails in `.env`:

```env
ADMIN_EMAILS=you@example.com
```

Then register or log in with that email in Account and open `/admin`.

## Billing mode

Safe default:

```env
BILLING_PROVIDER=manual
PAYMENTS_ENABLED=false
BILLING_MOCK_ENABLED=true
```

Real live payments should be enabled only after provider keys and webhook signature verification are configured.

## Product scope

MavenLex helps users upload contracts, identify risky clauses, understand complex legal language in plain words, prepare questions for a licensed lawyer, and review plan limits/account status.

Important: MavenLex provides informational AI support only. It does not replace a licensed lawyer.

## Deploy notes

- Render backend: `npm install --legacy-peer-deps` + `node server.js`
- Vercel frontend env:
  - `VITE_API_BASE_URL=https://your-render-backend.onrender.com`
  - `VITE_API_URL=https://your-render-backend.onrender.com`
- Never commit `.env`.
- Production DB foundation: see `docs/PRODUCTION_DATABASE_FOUNDATION.md`.

## Previous release notes

- v2.5.0 Final Launch Pack: launch check, SEO/meta, 404 fallback, admin readiness.
- v2.4.0 Mobile UX Polish: mobile-first layout for home, upload, report, AI chat, pricing, account and admin.
- v2.3.1 Billing QA + Conversion Polish: clearer pricing, account billing block and admin billing QA.
- v2.3.0 Real Payments Foundation: provider-ready billing architecture with manual/mock mode.
- v2.2.0 Admin + Monitoring Foundation: protected admin panel and monitoring endpoints.


## v2.8.1 Public Launch Safety Polish

This version cleans public-facing copy before real users see the product: technical payment wording is hidden from normal users, upload trust copy is clearer, safe plan activation is presented professionally, and `npm run public-safety-check` was added.

## v2.8.3 Analysis Report Quality Polish

This version improves the core report experience: reports now include a clearer mini-audit section, top risk priority ladder, next actions and practical questions to verify before signing. Public trust/legal pages from v2.8.2 remain included.

## v2.8.2 Legal Pages + Public Trust Pack

Public launch trust layer added:

- `/privacy` explains document/account data handling.
- `/terms` explains service use and AI/legal-advice boundaries.
- `/security` explains safe uploads, secret handling and production readiness.
- Footer links now expose Privacy, Terms, Security and FAQ.
- Launch checks include public legal/trust markers.

MavenLex remains an informational AI-analysis tool and does not replace a licensed lawyer.


## v2.9.0 — Live Payments Foundation

- Added YooKassa-ready live checkout foundation.
- Added `/billing/success` and `/billing/cancel` pages.
- Added `POST /api/billing/confirm` for return-page payment status refresh.
- Improved `/api/billing/webhook` for provider events and payment activation.
- Added `npm run billing-check`.
- Kept manual/mock mode as a safe fallback.


## v3.3.2 — YooKassa Live Payments

Production payment flow is prepared for YooKassa. Keep all real keys in hosting Environment Variables only.

Required production env:

```env
BILLING_PROVIDER=yookassa
PAYMENTS_ENABLED=true
PUBLIC_APP_URL=https://your-site.app
APP_BASE_URL=https://your-site.app
BILLING_SUCCESS_PATH=/billing/success
BILLING_CANCEL_PATH=/billing/cancel
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
BILLING_WEBHOOK_SECRET=...
BILLING_WEBHOOK_VERIFY_WITH_PROVIDER=true
BILLING_STRICT_WEBHOOKS=true
BILLING_ALLOW_MOCK_IN_PRODUCTION=false
```

Checks:

```bash
npm run billing-check
npm run yookassa-check
API_URL=https://your-site.app npm run yookassa-check
```

Docs: `docs/YOOKASSA_LIVE_PAYMENTS_V3_2_0.md`.


## v3.3.2 Auth Security Hardening

Use this version for the hardened auth layer. New checks:

```bash
npm run auth-security-hardening-check
npm run check
```

New auth endpoints include password reset, email verification, session management and auth security readiness.


## v3.3.2 Auth Email + Cookie Session Security

This build adds Resend-ready password reset/email verification delivery, HttpOnly cookie session support, CSRF-ready authenticated requests, and production readiness checks. Use `npm run auth-email-cookie-check` before production deploy.


## v3.4.0 Advanced Contract Intelligence

Core analysis now includes contract type detection, risk matrix, clause map, missing/weak clauses and red flags. Run:

```bash
npm run advanced-analysis-check
```

The endpoint `GET /api/ai/advanced-analysis-readiness` reports available intelligence features.


## v3.6.0 Contract Comparison

Open `/compare` to upload an old and a new contract version. MavenLex returns risk delta, changed clauses, new/removed risks, negotiation focus and exportable comparison summary.

Check:

```bash
npm run contract-comparison-check
```

## v3.9.0 — Workspace + Subscriptions + Email Pack

This release combines three production-product layers:

- **Workspace Dashboard**: search, risk/type/folder filters, favorites, archive, notes, history actions and comparison history.
- **Subscriptions & Limits**: billing period, renewal date, usage meter, cancel/change subscription foundation and admin usage reset endpoint.
- **Email Notifications**: readiness checks and notification endpoints for report-ready and admin-alert emails using the existing `EMAIL_PROVIDER=console|resend|smtp` architecture.

Useful checks:

```bash
npm run workspace-check
npm run subscription-check
npm run email-notifications-check
npm run check
```


## v3.12.0 SEO + Support + Abuse Protection

New public/product readiness checks:

```bash
npm run seo-growth-check
npm run support-system-check
npm run abuse-protection-check
npm run check
```

Public routes added: `/support`, `/help`, `/ai-nda-analysis`, `/ai-service-agreement-analysis`, `/ai-lease-analysis`, `/contract-penalty-analysis`, `/check-contract-before-signing`.

Production SEO endpoints: `/sitemap.xml`, `/robots.txt`, `/api/seo/readiness`.

Support/abuse endpoints: `/api/support/readiness`, `/api/support/tickets`, `/api/abuse/readiness`, `/api/admin/support`, `/api/admin/abuse`.

## v3.13.0 Performance & Reliability

Run production reliability checks:

```bash
npm run performance-check
npm run reliability-check
```

Useful endpoints:

- `GET /api/reliability/readiness`
- `GET /api/admin/reliability`


## v4.2.0 — Secure Storage + Team + Clause + Rewrite Pack

- Added secure file storage foundation with metadata-only default, local storage mode and retention cleanup.
- Added team workspace foundation: organizations, roles and invites.
- Added clause library with safer wording and negotiation recommendations.
- Added AI contract rewrite assistant with role/tone controls and counterparty message.
- Added pages `/team`, `/clauses`, `/rewrite`.
- Added checks: `storage-check`, `team-check`, `clause-library-check`, `rewrite-assistant-check`.

## v4.3.0 Multilingual Quality Pack

MavenLex поддерживает русский и английский режимы:

- интерфейс RU/EN;
- локализованные публичные маршруты `/ru` и `/en`;
- выбор языка документа: auto / ru / en;
- выбор языка отчёта: ru / en;
- backend language detection для текста договора;
- hreflang sitemap;
- локализованные meta title/description;
- i18n readiness endpoints.

Проверки:

```bash
npm run multilingual-check
npm run i18n-check
```

На живом домене:

```bash
API_URL=https://your-site.app npm run multilingual-check
```


## v4.4.0 — Business Analytics Pack

- Added internal business analytics overview.
- Added conversion funnel: visit → signup → analysis → export → checkout → payment.
- Added revenue, active users, plan distribution, popular pages and daily series.
- Added `/api/analytics/business/readiness`, `/api/analytics/business`, `/api/admin/business-analytics`.
- Added `npm run business-analytics-check`.

## MavenLex v5.1.0 Production Hardening

This package includes the v5.1.0 commercial polish layer. New checks:

```bash
npm install
npm run build
npm run production-hardening-check
```

New product route: `/onboarding`.
New API endpoints: `/api/production-hardening-check`, `/api/user/onboarding`.


## v5.2.0 Auth + Real User Readiness

This build adds a stronger launch-readiness layer for real SaaS users:

- account access-state API for workspace/subscription/admin/AI gates;
- server profile update endpoint;
- account data export endpoint;
- user-visible export and delete-account controls;
- clearer Account page readiness cards;
- additional launch readiness check: `npm run launch-readiness-check`.

For review, run:

```bash
npm install
npm run build
npm run launch-readiness-check
npm run dev
```

## Local run — important

For normal development, run:

```bash
npm install
npm run dev
```

Open the app here:

```text
http://localhost:5173
```

The backend runs separately on `http://localhost:3001`, but in development it is API-only. Use it for `http://localhost:3001/api/health`, not as the main app page.

To test the production build locally, run:

```bash
npm run serve:production-local
```

Then open `http://localhost:3001`.

A downloaded ZIP does not update an old deployed site automatically. To update a public URL, upload/push this new project version to the deployment provider and redeploy it.

See `docs/LOCAL_AND_DEPLOYMENT_CLARITY_V5_7_1.md`.


### v5.8.0 Premium UI Polish

This build focuses on visual quality: cleaner navigation, larger cards, improved FAQ text, stronger wrapping for Russian UI text, and a Premium Dark Navy theme switch.

Run:

```bash
npm run premium-ui-polish-check
```


## MavenLex v5.9.0 — Executive Visual Experience

This version adds a premium visual polish layer:

- quieter top navigation;
- larger cards and form cells;
- improved MavenLex question/FAQ copy;
- stronger first-screen positioning;
- refined executive report UX;
- polished dark navy mode;
- `npm run executive-visual-check`.

Run locally:

```bash
npm install
npm run dev
```

Open the frontend at:

```text
http://localhost:5173
```
