# MavenLex v6.1.5 — Production Hardening

- Stabilized owner login recovery for Render JSON storage drift.
- Strengthened AI instructions so MavenLex answers directly and does not push users away to an external lawyer for ordinary legal questions.
- Clarified article category buttons: selecting “Долги”, “Аренда”, etc. auto-selects a relevant article and launches a practical AI explanation.
- Hardened upload area, header nav, account blocks, article cards and long-text wrapping.
- Added production-hardening-check script.

# Changelog

## 6.0.2 — ChatGPT-like Legal Reasoning
- Added adaptive legal answer depth for follow-ups, articles, contracts, drafts and complex situations.
- Added ChatGPT-like legal reasoning prompt layer.
- Added quality regeneration for weak, robotic or refusal-like AI answers.
- Improved local fallback for messy legal questions.
- Added `npm run chatgpt-like-legal-check`.

## v6.0.0 — Human Legal Counsel AI

- Reworked AI prompts to answer like a human legal analyst instead of a rigid template.
- Added chat memory for article/report follow-ups.
- Added weak/refusal answer rescue logic for legal questions.
- Improved local fallback answers with practical steps, warnings and clarifying questions.
- Added `npm run human-legal-counsel-check`.

## v5.9.6 — Admin Console UX Hotfix

- Reworked `/admin` into a clear product control center instead of a technical UI/design-system page.
- Fixed admin data auto-loading and removed a broken token reference.
- Improved Russian admin copy, cards, access-denied guidance and navy theme styling.
- Removed the design-system shortcut from the admin navigation to avoid confusion.


## v5.8.0 — Premium UI Polish

- Simplified the top navigation and moved secondary pages into a compact More menu.
- Added a saved Premium Dark Navy theme alongside the warm ivory theme.
- Increased card/cell sizing and text wrapping across tabs to reduce clipping.
- Rewrote the MavenLex FAQ copy in a clearer, more client-friendly style.
- Added premium UI polish documentation and a dedicated check command.


## v5.7.1 — Local and deployment clarity

- Made `npm run dev` run the backend in API-only mode to avoid accidentally opening stale built frontend from `dist`.
- Added `api:dev`, `local`, `serve:production-local`, and `deployment-version` scripts.
- Added clear documentation explaining the difference between `localhost:5173`, `localhost:3001`, and a public deployed URL.
- Updated `APP_VERSION` to `5.7.1-local-deploy-clarity` for easier deployment verification.


## MavenLex v5.7.0 — Executive Quality Readiness

- Added stronger premium legal product polish for client review.
- Added legal review focus selection and user-side selection before contract analysis.
- Removed visible sample/demo-style fallback wording from reports.
- Added `/api/executive-quality/v5-7` and `npm run executive-quality-check`.
- Kept the personal-first no-workspace user journey.

# Changelog

## v5.6.0 — Quality Launch Readiness

- Added a dedicated launch readiness page at `/launch` covering browser QA, database readiness, payment readiness, premium landing quality, legal specialization and ideal user flow.
- Added `/qa` with manual browser scenarios for the most important end-to-end paths.
- Added `/api/launch-readiness/v5-6`, `/api/legal/templates` and `/api/qa/user-flow`.
- Added `docs/sql/004_launch_ready_postgresql_schema.sql` for launch-level PostgreSQL tables.
- Improved the home page with a legal specialization showcase.
- Added `npm run quality-launch-check`.

# v5.4.0 — Premium User Polish

- Removed public-facing product preview/sample wording and replaced it with user-ready product language.
- Added premium visual polish to the home page: refined hero glow, card hover depth and result preview treatment.
- Reworded onboarding, report preview and admin billing labels so MavenLex feels like a real user product rather than a testing build.
- Kept RU/EN switching intact across the polished copy.

# MavenLex v5.3.0 — Full UI Language Switch

- Full RU/EN interface switching for headings, buttons, nav, labels, placeholders and common SaaS states.
- Selected language updates `/ru`/`/en` routes immediately.
- Logged-in users sync `preferredLanguage` to the backend profile.
- Added `npm run ui-language-check` and docs/UI_LANGUAGE_SWITCH_V5_3_0.md.



## 5.2.0 — Auth + Real User Readiness

- Added `/api/auth/access-state` for session, role, workspace, subscription and AI access gates.
- Added `/api/user/profile` for server-side profile updates.
- Added `/api/user/export` for account data export.
- Improved Account page with real-user readiness cards, profile sync, data export and delete-account flow.
- Hardened deleted-account sessions and fixed admin auto-promotion audit details.
- Added `docs/LAUNCH_READINESS_AUTH_REAL_USERS_V5_2_0.md` and `npm run launch-readiness-check`.
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


## v4.8.0 — Brand UI System + Admin Console Pro

- Единая дизайн-система и UI tokens.
- Страница `/design-system`.
- Admin Console Pro: users, teams, billing, support, abuse, storage, AI costs, reliability.
- Новые проверки: `npm run brand-ui-check`, `npm run admin-console-pro-check`.


## v4.5.0 — AI Cost Management Pack

- Added AI cost tracking for analysis, comparison, legal chat and law article search.
- Added monthly AI budget and threshold alerts.
- Added AI cost breakdown by feature, plan and provider.
- Added deep-analysis cost control for Free users.
- Added `/api/ai-cost/readiness`, `/api/ai-cost/overview`, `/api/admin/ai-cost`.
- Added `npm run ai-cost-check`.


## v3.12.0 — SEO Growth + Support + Abuse Protection Pack

- Added expanded SEO landing routes for NDA, service agreements, lease agreements, penalties and pre-signing checks.
- Added `/sitemap.xml`, `/robots.txt` and `/api/seo/readiness`.
- Added support ticket system with public support page and admin support queue.
- Added abuse/rate-limit protection for auth, AI, uploads and support endpoints.
- Added admin abuse overview and readiness endpoint.
- Added checks: `seo-growth-check`, `support-system-check`, `abuse-protection-check`.



## v3.6.0 — Professional Report Export

- Added professional report export: PDF/print, HTML, Word-compatible `.doc`, Markdown, TXT and JSON.
- Added professional comparison export in the same formats.
- Added export readiness endpoint: `GET /api/export/readiness`.
- Added `npm run export-check`.
- Export UI now shows remaining export limit and records export usage locally.


## v3.6.0 — Contract Comparison Pack

- Added `/compare` page for two-version contract comparison.
- Added `POST /api/compare-contracts`.
- Added risk delta, new/removed/worse risks, clause changes, negotiation focus and comparison export.
- Added `npm run contract-comparison-check`.
## v3.3.3 — Full Cookie Auth + E2E Auth QA

## v3.4.0 — Advanced Contract Intelligence

- Added contract type detection, analysis depth and advanced report intelligence.
- Added risk matrix for financial/legal/operational/termination/dispute/confidentiality risks.
- Added clause map, missing/weak clause detection and red flags.
- Strengthened YandexGPT prompt and local fallback structure.
- Added `/api/ai/advanced-analysis-readiness` and `npm run advanced-analysis-check`.


- Переведён основной auth-flow на HttpOnly cookie sessions.
- Frontend больше не сохраняет raw session token в localStorage.
- CSRF используется для POST/PUT/PATCH/DELETE при cookie-auth.
- Добавлен `/api/auth/full-cookie-auth-readiness`.
- Добавлен `npm run full-cookie-auth-e2e-check`.
- Добавлена документация `docs/FULL_COOKIE_AUTH_E2E_QA_V3_3_3.md`.


## v3.3.2 — Email Delivery + Cookie Session Security

- Added Resend-ready email delivery for password reset and email verification.
- Added HTML/text auth email templates and email delivery audit logs.
- Added HttpOnly cookie-session support and CSRF-ready cookie auth foundation.
- Added `/api/auth/email-readiness`, `/api/auth/cookie-session-readiness`, and admin email test endpoint.
- Added `npm run auth-email-cookie-check`.


## v3.3.1 — Auth Security Hardening

- Completed password reset token lifecycle.
- Completed email verification lifecycle.
- Hardened sessions with token hashing, session ids, last-seen, max sessions and revocation.
- Added Account Security UI.
- Added failed-login lockout and auth audit events.
- Added admin user security controls.
- Added `/api/auth/security-readiness` and `npm run auth-security-hardening-check`.


## v3.3.0 - Auth Security Pack

- Added auth rate limits.
- Added account status, roles and admin user management endpoints.
- Added logout, logout-all, change-password, password reset foundation and email verification foundation.
- Added auth audit events and `npm run auth-security-check`.


## v3.3.0 — YooKassa Live Payments

- Added YooKassa live payments go-live foundation.
- Added `/api/billing/yookassa/readiness`.
- Added `/api/billing/payment/:id`.
- Added `npm run yookassa-check`.
- Added YooKassa live checklist in Admin Launch Center.
- Added env guidance for `BILLING_PROVIDER=yookassa`, `PAYMENTS_ENABLED=true`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, strict webhooks and .app return URLs.
- Improved payment verification: provider payment id, amount, currency and metadata checks.

## v3.0.1 — Go-Live Deploy Pack

## v3.3.0 — PostgreSQL Database Foundation

- Added PostgreSQL-compatible schema migration `docs/sql/003_postgresql_database_foundation.sql`.
- Added `npm run db-health`, `npm run db-migration-plan`, and `npm run db-migrate`.
- Added `GET /api/db/migration-plan`.
- Updated database readiness to include real production DB migration requirements.
- Kept JSON mode for local development while preparing Supabase/Neon/PostgreSQL production storage.


- Updated version to `3.0.1`.
- Added `npm run go-live-check`.
- Added `GET /api/go-live-check`.
- Added production domain checks for `PUBLIC_APP_URL` and `APP_BASE_URL`.
- Updated `render.yaml` with `PUBLIC_APP_URL` and `GO_LIVE_STRICT` env placeholders.
- Added docs: `docs/GO_LIVE_DEPLOY_PACK_V3_0_1.md` and `docs/PRODUCTION_LAUNCH_CANDIDATE_V3_0_1.md`.
- Updated `npm run check` to include go-live validation.

## v3.0.0 — Production Launch Candidate

- Updated version to `3.0.0`.
- Added unified `npm run production-check`.
- Added `GET /api/production-check`.
- Converted Admin launch readiness into MavenLex Launch Center.
- Added final launch-candidate checks for public site, AI analysis, database, billing, legal pages, SEO pages, export actions and blockers.
- Updated launch/deploy/billing checks for v3.0.0.
- Added `docs/PRODUCTION_LAUNCH_CANDIDATE_V3_0_0.md`.

## v2.9.2 — Export + Checklist + Decision Helper

- Added Markdown/TXT report export alongside existing PDF/HTML export.
- Added copy actions for short summary, key risks, signing checklist and lawyer/counterparty questions.
- Added Decision Helper block with direct recommendation: do not sign / negotiate edits / final review.
- Added Pre-signing checklist in the report.
- Added export/copy actions in Account history for saved contract reports.
- Updated version to `2.9.2`.

## v2.9.1 — Payments QA + Production Billing Safety

- Added `/api/billing/readiness` for billing-specific production checks.
- Added production guard for mock billing: `BILLING_ALLOW_MOCK_IN_PRODUCTION=false`.
- Added stricter webhook mode via `BILLING_STRICT_WEBHOOKS=true`.
- Webhook activation now checks provider payment id, metadata, amount and currency before activating a plan.
- Duplicate successful payment events are idempotent and logged.
- Added billing audit events in Admin.
- Improved success/cancel payment status copy for users.
- Updated billing check scripts and environment documentation.

## v2.9.0 - User Account & History Polish

- Improved Account page from billing QA style to real user workspace style.
- Added account summary cards for current plan, saved analyses and remaining limits.
- Improved analysis history cards with type, date, risk status, risk score, file name and quick open/delete actions.
- Backend history now auto-loads after login.
- Local history delete/clear now syncs with backend endpoints.
- Admin overview now includes recent user analyses for operational visibility.
- Added `docs/USER_ACCOUNT_HISTORY_POLISH_V2_8_4.md`.
- Updated version to `2.9.0`.

## v2.8.3 - Analysis Report Quality Polish

- Added a stronger report mini-audit section.
- Added top-risk priority ladder and clearer next actions.
- Added lawyer/counterparty verification questions in the report.
- Reworked AI chat prompt chips around practical contract decisions.
- Strengthened the live AI analysis prompt for business mini-audit quality.
- Removed a public-facing mobile polish note from the analysis page.
- Added `docs/ANALYSIS_REPORT_QUALITY_POLISH_V2_8_3.md`.
- Updated version to `2.8.3`.

## v2.8.2 - Legal Pages + Public Trust Pack

- Added public `/privacy`, `/terms`, and `/security` pages.
- Added footer links to Privacy, Terms, Security, and FAQ.
- Strengthened document safety wording before upload.
- Kept technical provider/readiness details for admin endpoints instead of public UX.
- Updated launch/deploy checks for v2.8.2.
- Added `docs/LEGAL_PAGES_PUBLIC_TRUST_PACK_V2_8_2.md`.

## v2.8.1 - Public Launch Safety Polish

- Removed technical mock/manual wording from public pricing/account UX.
- Added public launch mode copy for safe plan activation.
- Improved document-upload safety messaging.
- Added `PUBLIC_LAUNCH_MODE` / `VITE_PUBLIC_LAUNCH_MODE` guidance.
- Added `npm run public-safety-check`.

# Changelog

## v2.8.0 — Production Database Foundation

- Added PostgreSQL-compatible production schema: `docs/sql/002_production_database_schema.sql`.
- Added `npm run db-check` for database readiness validation.
- Added `GET /api/db/readiness`.
- Expanded `/api/db/status`, `/api/health` and `/api/launch-check` with production database readiness details.
- Updated `.env.example` with production database variables.
- Updated version to `2.8.0`.
- Kept JSON storage as local development fallback; no risky live migration is forced.

## v2.7.0 — Deployment + Production Hardening

- Added production frontend serving from `dist/` via Express.
- Updated frontend API fallback to same-origin in production.
- Updated `render.yaml` for `.app` deployment: build frontend, start backend, health check.
- Added `npm run deploy-check`.
- Added deployment metadata to `/api/health`.
- Added `docs/DEPLOYMENT_PRODUCTION_HARDENING.md`.
- Updated version to `2.7.0`.


## v2.6.0 — Public Launch Growth Pack

- Added public SEO/growth landing pages: `/ai-contract-analysis`, `/contract-risk-analysis`, `/business-contract-review`, `/faq`.
- Added internal analytics endpoint: `POST /api/analytics/track`.
- Added growth overview endpoint: `GET /api/growth/overview`.
- Added home-page internal links block for SEO and conversion flow.
- Updated launch-check for v2.6.0.
- Added `docs/PUBLIC_LAUNCH_GROWTH_PACK.md`.
- Updated version to `2.6.0`.

## v2.5.2 — Public Ready Cleanup

- Removed the visible tester-feedback panel from the public home page.
- Added a public FAQ block for users.
- Reworded Admin readiness from `Ready for public launch` to `Ready for public launch`.
- Reworded Pricing checkout copy so manual/mock billing is presented as safe mode, not a tester scenario.
- Updated `npm run launch-check` for public-readiness markers.
- Added `docs/PUBLIC_READY_CLEANUP.md`.
- Updated version to `2.5.2`.

## v2.5.1 — Test Launch Fixes

- Added public-safe feedback endpoint: `POST /api/feedback`.
- Added feedback storage in JSON database under `testFeedback`.
- This public-ready cleanup hides the tester feedback panel from normal users.

## v2.5.0 — Final Launch Pack

- Added final launch checklist in `docs/FINAL_LAUNCH_CHECKLIST.md`.
- Added release notes in `docs/FINAL_LAUNCH_PACK.md`.
- Added `npm run launch-check` for local release sanity checks.
- Added public-safe `/api/launch-check` endpoint.
- Improved Admin readiness verdict.
- Added SEO and Open Graph metadata to `index.html`.
- Added SPA 404 fallback page for unknown routes.
- Kept live payments disabled by default; no real card charging added.

## v2.4.0 — Mobile UX Polish

- Added mobile-first polish for the home page, upload flow, report view, AI chat, pricing, account and admin.
- Improved tap targets, stacked mobile grids, readable legal text and mobile-safe billing/admin panels.
- Added `docs/MOBILE_UX_POLISH.md`.
- Kept live payments disabled; no new major user-facing modules.

## v2.3.1 — Billing QA + Conversion Polish

- Improved Pricing page copy, plan positioning and CTA clarity.
- Added visible plan limits on pricing cards from backend billing plan data.
- Improved checkout/login/provider error messages.
- Improved Account billing status with active plan, subscription status, provider and remaining usage.
- Added Admin Billing QA checks for paid plans, webhook secret, live payments and mock checkout.
- Extended backend launch readiness with billing checks.
- Added `docs/BILLING_QA_CONVERSION_POLISH.md`.

## v2.3.0 — Real Payments Foundation

- Added provider-ready billing architecture: manual/mock/YooKassa/Stripe modes.
- Added billing endpoints: `/api/billing/plans`, `/api/billing/status`, `/api/billing/checkout`, `/api/billing/mock-complete`, `/api/billing/webhook`.
- Added payment records, billing events and subscription activation in the JSON database foundation.
- Added pricing checkout flow with safe mock completion for paid plans.
- Added billing status block in Account.
- Added Billing Overview in Admin.
- Added provider readiness and webhook secret checks to launch readiness.
- Updated `.env.example` with billing provider variables.
- Added `docs/REAL_PAYMENTS_FOUNDATION.md`.

## v2.2.2 — Pre-Payments Stability & QA

- Added admin launch blockers and `GET /api/admin/launch-readiness`.
- Added backend-side usage limit checks for signed-in users.
- Frontend now sends backend session tokens to analysis and AI chat requests.
- Aligned public pricing copy with backend plan limits.
- Added `docs/PRE_PAYMENTS_STABILITY_QA.md`.
- Kept real payments intentionally disabled for v2.3.0.

## v2.2.1 — Website Trust & UX Polish

- Improved homepage value proposition for first-time visitors.
- Added trust-before-upload messaging for document safety and legal clarity.
- Added static sample result preview before upload.
- Improved contract upload error guidance.
- Improved dashboard empty state.
- Made pricing limits more transparent before payments.
- Strengthened report disclaimer.
- Added Admin Launch Readiness panel.

## v2.2.0 — Admin + Monitoring Foundation

- Added protected internal `/admin` monitoring panel.
- Added admin-only backend endpoints for overview, health and server errors.
- Added API audit events and recent server error storage in JSON database.


## v2.9.0 — Live Payments Foundation

- Added YooKassa-ready live checkout foundation.
- Added `/billing/success` and `/billing/cancel` pages.
- Added `POST /api/billing/confirm` for return-page payment status refresh.
- Improved `/api/billing/webhook` for provider events and payment activation.
- Added `npm run billing-check`.
- Kept manual/mock mode as a safe fallback.

## v3.9.0 — Workspace + Subscriptions + Email Pack

- Added Workspace Dashboard with search, filters, folders, favorites, archive, notes and richer history management.
- Added subscription readiness, billing period, renewal date, usage meter, cancel/change subscription endpoints and admin usage reset foundation.
- Added email notification readiness and report/admin notification endpoints on top of the existing Resend/console email architecture.
- Added checks: `workspace-check`, `subscription-check`, `email-notifications-check`.

## v3.13.0 — Performance & Reliability Pack

- Added API timeout guardrails and slow request tracking.
- Added reliability readiness endpoint and admin reliability overview.
- Added memory/uptime/latency snapshot to health checks.
- Added static asset cache headers for production frontend serving.
- Added `npm run performance-check` and `npm run reliability-check`.


## v4.2.0 — Secure Storage + Team + Clause + Rewrite Pack

- Added secure file storage foundation with metadata-only default, local storage mode and retention cleanup.
- Added team workspace foundation: organizations, roles and invites.
- Added clause library with safer wording and negotiation recommendations.
- Added AI contract rewrite assistant with role/tone controls and counterparty message.
- Added pages `/team`, `/clauses`, `/rewrite`.
- Added checks: `storage-check`, `team-check`, `clause-library-check`, `rewrite-assistant-check`.

## v4.3.0 — Multilingual Quality Pack

- Добавлен полноценный RU/EN i18n-слой вместо поверхностного переключателя языка.
- Добавлены локализованные маршруты `/ru` и `/en` с сохранением языка в интерфейсе.
- Добавлены выбор языка документа и языка отчёта при анализе договора.
- Backend теперь определяет язык текста договора и передаёт это в AI-анализ.
- Добавлены `/api/i18n/readiness`, `/api/i18n/languages`, `/api/i18n/detect-language`.
- Sitemap получил hreflang-ссылки для RU/EN.
- Обновлены meta title/description/locale при смене языка.
- Добавлены проверки `npm run multilingual-check` и `npm run i18n-check`.


## v4.4.0 — Business Analytics Pack

- Added internal business analytics overview.
- Added conversion funnel: visit → signup → analysis → export → checkout → payment.
- Added revenue, active users, plan distribution, popular pages and daily series.
- Added `/api/analytics/business/readiness`, `/api/analytics/business`, `/api/admin/business-analytics`.
- Added `npm run business-analytics-check`.

## v5.1.0 — Production Hardening & Commercial Polish

- Added production hardening checklist endpoint and static package check.
- Added commercial onboarding route and server onboarding persistence endpoints.
- Upgraded billing status payload with lifecycle, warnings and AI budget data.
- Added per-plan daily/monthly AI budget enforcement for authenticated AI usage.
- Expanded AI cost overview with by-user and by-workspace groupings.
- Expanded business analytics with rewrites, language distribution and AI cost summary.
- Updated release docs, env example and validation scripts for v5.1.

## v5.9.0 — Executive Visual Experience

- Reduced header navigation noise and moved secondary tools into More.
- Improved the hero message for a clearer legal AI positioning.
- Rewrote the FAQ/client questions block in a more premium, understandable tone.
- Increased card, form, and content cell sizes across pages to reduce overflow.
- Added extra executive report polish for KPIs, decision bands, and risk blocks.
- Refined the dark navy theme with stronger contrast and calmer premium colors.
- Added `npm run executive-visual-check`.
