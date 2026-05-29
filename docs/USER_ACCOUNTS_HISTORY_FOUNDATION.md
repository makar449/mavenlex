# MavenLex User Accounts + History Foundation v1.9.8

This release adds a safe launch foundation for accounts and history without storing secrets or requiring a database.

## Included
- Local browser profile on the Account page.
- Local history for the latest 30 items.
- Usage counters for reviews, questions and exports.
- Dashboard metrics tied to history and selected plan.
- Ready path for future Auth + database + payments.

## Not included yet
- Real user registration.
- Real backend database.
- Real payment processing.
- Server-side usage enforcement.

## Production next steps
Use Supabase/Firebase/Postgres for accounts and history, then connect YooKassa/CloudPayments/Stripe and enforce limits on the backend.
