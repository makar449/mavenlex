# Final QA Checklist

## Launch

- [ ] `npm install` finishes successfully
- [ ] `npm run doctor` passes
- [ ] `npm run build` passes
- [ ] `npm run dev` starts frontend and backend
- [ ] `http://localhost:5173` opens
- [ ] `http://localhost:3001/api/health` returns JSON

## Analyze

- [ ] TXT upload works
- [ ] DOCX upload works
- [ ] Text-based PDF upload works
- [ ] Large file error is clear
- [ ] Unsupported file error is clear
- [ ] Report is created after analysis

## Report

- [ ] Risk score is visible
- [ ] Red flags are readable
- [ ] Plain-language explanations are readable
- [ ] Worst-case scenarios are useful
- [ ] Action plan is visible
- [ ] Lawyer questions are visible
- [ ] Export opens cleanly

## Builder

- [ ] Questionnaire is understandable
- [ ] Empty fields show helpful validation
- [ ] Draft is generated
- [ ] Instructions are visible
- [ ] Export options are visible

## Mobile

- [ ] Navigation fits mobile width
- [ ] Buttons are easy to tap
- [ ] Long contract text does not overflow
- [ ] Report cards remain readable
- [ ] Builder form remains usable

## Legal-safe copy

- [ ] No “replaces lawyer” claim
- [ ] No “legal advice” claim
- [ ] No “guaranteed compliance” claim
- [ ] Disclaimer is visible
