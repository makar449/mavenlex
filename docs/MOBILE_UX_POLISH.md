# MavenLex v2.4.0 — Mobile UX Polish

This release improves the mobile experience without adding new major product areas or enabling live payments.

## Scope

- Mobile-first navigation: compact menu on phones, full premium topbar on desktop.
- Home page: stacked task cards, readable hero, full-width calls to action.
- Contract upload: larger tap targets, clearer dropzone, one-column controls, visible step-by-step progress.
- Analysis result: readable risk cards, stacked KPIs, mobile-safe long legal text, sticky chat input.
- AI chat: full-width input and send button on phones, readable messages, clearer spacing.
- Pricing: plans stack vertically, limits remain visible, CTAs are full width.
- Account: billing status, limits and history are easier to scan on phones.
- Admin: monitoring, launch readiness and billing QA do not overflow on smaller screens.

## What intentionally stayed out

- No live YooKassa/Stripe charging.
- No new user-facing product tabs.
- No new tariff model.
- No email notifications or team accounts.

## Manual QA checklist

Use browser responsive mode and test at 390px, 430px, 768px and desktop width.

1. Home → task cards are readable and buttons are easy to tap.
2. Contract upload → choose file button works without drag-and-drop.
3. Contract analysis → progress steps remain readable.
4. Report → risks, KPIs and chat are readable without horizontal overflow.
5. Pricing → Free/Pro/Business cards stack vertically and CTAs are clear.
6. Account → billing status and usage rows fit the screen.
7. Admin → launch readiness, health, billing QA and recent logs fit without layout breakage.
8. Navigation → mobile menu opens/closes and does not cover critical content after navigation.

## Release note

v2.4.0 prepares the product for real mobile users before the final launch pack. It is a polish/stability release, not a feature expansion.
