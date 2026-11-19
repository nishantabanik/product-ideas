# Product Manager Decisions: Exams Hub, Multi-Level Curriculum & Apple Design
Feature: exams-curriculum-apple-design
Date: 2026-11-04

## Scope & User Stories
1. **Exam Prep User**: Wants to take telc or Goethe exam for A1, A2, or B1. Clicks on level pill in sidebar or visits Prüfungen hub, picks provider, and enters realistic timed exam with complete scoring and explanations.
2. **Daily Learner**: Lands on `Lernen` to view streak, daily lesson, CEFR roadmap progress, Wort des Tages with context, and quick grammar drills.
3. **Vocabulary Builder**: Navigates to `Wortschatz` to explore thematic packs (Zahlen, Familie, Essen, Verben, etc.), practice with flashcards or pairs, and review difficult words and mistakes.
4. **Bureaucracy / Survival Specialist**: Visits `Wörter in Situationen` to master realistic moments: Bürgeramt, Arztbesuch, Bewerbung, Wohnungsbesichtigung, and false friends (Wortfallen).

## Success Criteria
- Instant client-side responsiveness (< 50ms route switch).
- Seamless navigation matching the screenshot structure.
- Clean typography and refined dark/light aesthetics reminiscent of macOS apps.
- Zero regression in existing tests; full unit test coverage for new curriculum.
