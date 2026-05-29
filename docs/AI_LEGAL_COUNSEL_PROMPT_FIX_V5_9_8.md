# MavenLex v5.9.8 — AI Legal Counsel Prompt Fix

This release strengthens the live AI behavior so MavenLex answers lawful legal questions as a serious legal AI analyst rather than a generic chatbot.

## Changes
- Stronger Legal Counsel Mode system prompt for contract analysis.
- Stronger legal chat prompt for disputes, law articles, contracts, employment, debts, fines, liability and business risks.
- Refusal detection for generic answers such as “I cannot discuss this topic”.
- Rescue prompt retry for YandexGPT refusals.
- Longer AI timeout defaults for deeper reasoning.
- More Russian law article references in the local legal database.
- New readiness endpoint: `/api/ai/legal-counsel-mode`.

## Important
MavenLex can analyze and explain law, but it should not claim to be a licensed lawyer. The product wording stays safe as informational AI analysis with lawyer verification for final decisions.
