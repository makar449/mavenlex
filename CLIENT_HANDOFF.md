# Client Handoff

## Product

MavenLex is a legal-tech MVP for contract analysis and contract template preparation.

It helps users:

- upload TXT, DOCX or text-based PDF contracts;
- identify possible risks and red flags;
- understand contract clauses in plain language;
- prepare questions for a licensed lawyer;
- generate draft contract templates for further review.

This tool provides informational AI support only. It is not a substitute for a licensed lawyer.

## What to show in a product preview

1. Open the Home page.
2. Explain the two main actions:
   - Analyze an existing contract.
   - Build a draft contract template.
3. Go to Analyze.
4. Upload `test-contracts/test_contract.txt`.
5. Run the analysis.
6. Show the risk score, red flags, plain-language explanation and action plan.
7. Open the Report page.
8. Show the report export flow.
9. Go to Builder.
10. Complete the questionnaire and generate a draft.

## Required setup

Create a `.env` file next to `package.json`:

```env
YANDEX_API_KEY=your_yandex_api_key_here
YANDEX_PROJECT_ID=your_project_or_folder_id_here
YANDEX_MODEL=yandexgpt/rc
PORT=3001
```

Do not share real API keys in screenshots, chats or public repositories.

## Commands

Install dependencies:

```powershell
npm install
```

Run frontend and backend:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

Check project setup:

```powershell
npm run doctor
```

Run backend smoke test after `npm run dev` is active:

```powershell
npm run smoke
```

## Recommended production work before public launch

- Add authentication.
- Add secure file storage policy.
- Add rate limiting and billing controls.
- Add production logging and monitoring.
- Add deployment configuration.
- Add legal review of all public-facing disclaimers.
