# Real AI Assistant Upgrade

This release focuses on answer quality, not new UI features.

## What changed

- Contract analysis now tries to use live YandexGPT reasoning when `YANDEX_API_KEY` and `YANDEX_PROJECT_ID` are configured.
- The local fallback is now clearly marked as fallback, so the product does not pretend that product preview logic is live AI.
- AI analysis can take longer on purpose because the assistant is expected to read, reason, and produce a practical plan rather than return instant random-looking scores.
- AI Legal Chat now answers the exact user question based on the report and contract context.
- Chat no longer returns one generic sentence for every question.
- The prompt is tuned to act as a practical legal assistant: risks, consequences, what to do next, negotiation points, lawyer questions, safer wording, and worst-case scenarios.

## Legal positioning

The assistant must not claim to replace a licensed lawyer. It provides informational support and helps the user prepare for legal review.

## Recommended .env

```env
YANDEX_API_KEY=your_key
YANDEX_PROJECT_ID=your_project_id
YANDEX_MODEL=yandexgpt/rc
PORT=3001
AI_TIMEOUT_MS=115000
CHAT_TIMEOUT_MS=90000
ANALYSIS_MIN_MS=12000
CHAT_MIN_MS=2500
DISABLE_LIVE_AI=false
```

## How to verify

1. Run `npm install`.
2. Run `npm run dev`.
3. Open `http://localhost:5173`.
4. Upload `test-contracts/test_contract.txt`.
5. Check the report banner:
   - `Live AI reasoning активен` means YandexGPT answered.
   - `Fallback-анализ` means local fallback was used.
6. Ask the chat practical questions:
   - `Можно подписывать?`
   - `Что изменить в первую очередь?`
   - `Напиши сообщение второй стороне`
   - `Какие вопросы задать юристу?`
