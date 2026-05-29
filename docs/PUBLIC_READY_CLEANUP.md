# v2.5.2 — Public Ready Cleanup

This patch removes the visible tester-oriented flow and makes MavenLex feel like a usable public product rather than a private release project.

## What changed

- Removed the public Test Launch Feedback panel from the home page.
- Added a public FAQ block for normal users.
- Reworded launch readiness copy from “public launch” to “public launch”.
- Reworded Pricing checkout copy so mock/manual mode is presented as a safe payment mode, not a tester scenario.
- Updated launch checks, README and changelog to version `2.5.2`.
- Kept internal admin monitoring, billing foundation, health checks and backend feedback endpoint available for future support/internal use.

## Why

The site should now look ready for real users:

1. Upload a contract.
2. Get an AI analysis.
3. Ask questions.
4. View limits in Account.
5. Choose a plan.
6. Admin can monitor health, usage and billing readiness.

Live card charging remains disabled until YooKassa or Stripe keys and verified webhooks are configured.
