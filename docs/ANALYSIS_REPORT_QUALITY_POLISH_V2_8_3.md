# MavenLex v2.8.3 — Analysis Report Quality Polish

This release improves the core product value: the contract analysis report.

## What changed

- Added a stronger mini-audit section inside the report.
- Added a clear risk priority ladder with the top 3 risks.
- Added clearer next actions after analysis.
- Added questions to verify with a lawyer or counterparty.
- Reworked AI chat prompt chips to focus on practical contract decisions.
- Removed a visible mobile-polish note from the public analysis page.
- Strengthened the live AI prompt so responses are structured as a business mini-audit, not generic AI text.

## Why it matters

A user may trust the landing page and upload a document, but the report is the real product. The report now makes it clearer:

- what is dangerous;
- why it matters;
- what should be changed;
- what to ask the counterparty;
- when a lawyer should review the document.

## Checks

Run:

```bash
npm run build
npm run launch-check
npm run public-safety-check
npm run smoke
```

The public site remains free of tester/mock wording, while admin and internal checks still keep operational details available.
