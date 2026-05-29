# v3.4.0 — Advanced Contract Intelligence

This release improves the core value of MavenLex: the quality and structure of contract analysis.

## Added

- Contract type detection based on selected type and extracted text.
- Analysis depth field: quick, standard, deep.
- Risk matrix:
  - financial;
  - legal;
  - operational;
  - termination;
  - dispute;
  - confidentiality.
- Clause map for key sections:
  - payment;
  - term;
  - delivery;
  - acceptance;
  - liability;
  - termination;
  - dispute;
  - confidentiality;
  - IP.
- Missing/weak clause detection.
- Red flags with evidence and recommended action.
- Stronger YandexGPT prompt for structured mini-audit reports.
- Local fallback now also returns advanced intelligence fields.
- New readiness endpoint: `GET /api/ai/advanced-analysis-readiness`.
- New check command: `npm run advanced-analysis-check`.

## Goal

The report should not look like a generic AI answer. It should look like a practical contract mini-audit: what type of contract it is, where risk sits, which clauses are missing/weak, what to fix first, and what to ask a lawyer or counterparty.

## Notes

This is still informational AI analysis. It does not replace a licensed lawyer.
