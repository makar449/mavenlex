# MavenLex v5.5.0 — Personal First UX

This release removes workspace-first friction from the visible product experience.

## What changed

- The main navigation no longer exposes Team or Workspace sections.
- `/dashboard` is now presented as personal history rather than a workspace.
- Onboarding no longer asks the user to create a workspace or invite a team.
- The user path is now: account → use case → first AI rewrite → plan.
- The backend keeps a private personal space abstraction for history and limits, so existing data is not destroyed.
- Legacy workspace/team check scripts were removed from the public quality gate.

## Why

MavenLex is now optimized for a normal user who wants to open the product, upload or paste a legal document, and get an AI legal analysis without unnecessary corporate setup.

## Preserved internally

Some organization/team API endpoints still exist as a future Business-plan foundation. They are not exposed in the default UI and do not block the personal user flow.
