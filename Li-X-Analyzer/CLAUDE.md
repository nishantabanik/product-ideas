# Working on Li X Analyzer

- Read `EXPORT_INSTRUCTIONS.md` first. It is the full handover document (architecture, data, features, decisions, problems solved, runbook). When a change alters the architecture, a table, a threshold or a working rule, update that document in the same change.

- When a feature is added or changed, update `lib/features-catalog.ts`: name, what it does, where it is, and how to enable it. The Features page in the app is generated from it, and a test fails if a link is dead or the enable text is missing. Also add or change the matching line in the README table.
- Tests: `npm test`. Types: `npm run typecheck`. Keep logic that needs tests in files that import siblings with a `.ts` extension, so the Node test runner can load them.
- Secrets never go into the repo. Keep real values in `.env.local` (ignored) and in Vercel.
- Texts shown in the app use plain words and "we" and "our".
