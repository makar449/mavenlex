# Known Limitations

This release is a client-ready MVP, not a full production legal platform.

## Document processing

- TXT, DOCX and text-based PDF files are supported.
- Scanned PDFs are not OCR-supported.
- Very complex PDF layouts may extract imperfect text.
- Maximum file size is 15 MB.

## AI output

- AI output is informational and should be reviewed by a licensed lawyer.
- The assistant can identify potential risks, but it does not guarantee legal completeness or enforceability.
- Jurisdiction-specific conclusions require professional legal review.

## Export

- Report PDF export uses browser print / save-as-PDF.
- DOCX/PDF export quality may depend on the browser and operating system.

## Production readiness

Before public launch, the project should add:

- user authentication;
- secure document retention controls;
- production deployment settings;
- API usage monitoring;
- error logging;
- security review;
- legal review of all client-facing language.
