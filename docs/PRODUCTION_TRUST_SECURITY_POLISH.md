# MavenLex v2.1.0 — Production Trust + Security Polish

## Added
- Trust Center frontend page (`/legal`) with Terms, Privacy, AI disclaimer and document-processing drafts.
- API endpoint `/api/trust/status` for launch checklist and security status.
- Security headers on the Express backend:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restrictions
  - HSTS in production mode
- Navigation link to Legal / Правила.

## Notes
These legal texts are product drafts, not final legal documents. Before paid public launch, review them with a licensed lawyer and adapt them to your company, jurisdiction, payment provider and data retention policy.

## Secrets
Do not commit `.env` or API keys. Use Render Environment Variables for backend secrets and Vercel Environment Variables only for public frontend configuration.
