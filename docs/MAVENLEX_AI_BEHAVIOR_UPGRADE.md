# MavenLex AI Behavior Upgrade 1.3.0

This release focuses on making the assistant feel less like a template and more like a practical legal-support companion.

## What changed

- Product branding changed to **MavenLex**.
- Chat prompt now prioritizes direct, human answers instead of generic checklist-style responses.
- Assistant is instructed to solve the user's problem, not only summarize the contract.
- Stronger distinction between **before signing** and **already signed** situations.
- Better fallback answers when live AI is not connected: signing decision, action plan, negotiation message, lawyer questions, worst-case explanation, penalty/termination handling, and clause rewrite answers.
- Fallback responses now reference the detected contract excerpt when available, so the user understands why the answer was given.
- Live AI prompt uses MavenLex identity and stricter anti-template instructions.

## Safe positioning

MavenLex provides informational contract analysis and preparation support. It does not provide final legal advice and does not replace a licensed lawyer.
