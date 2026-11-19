# Senior Engineer Decisions: Exams Hub, Multi-Level Curriculum & Apple Design
Feature: exams-curriculum-apple-design
Date: 2026-11-04

## Implementation Approach
- Use `src/curriculum.js` as the canonical source for multi-level exams, word packs, and situations to keep `src/app.js` and `src/features.js` maintainable.
- Ensure all exam question shapes conform to standard objective types (`choice`, `input`) or productive review formats (`writing`, `speaking`), making them fully compatible with existing scoring functions `grade()`, `recordAttempt()`, and `objectiveResults()`.
- Add CSS class namespaces `.apple-card`, `.apple-pill`, `.apple-blur`, `.exam-card-grid`, `.situation-grid`, `.topics-grid` without breaking existing base styles.
- Support deep hash linking:
  - `#exams`
  - `#exams?lvl=a1`
  - `#mock?exam=telc-a1`
  - `#mock?exam=goethe-a1`
  - `#mock?exam=telc-a2`
  - `#mock?exam=goethe-a2`
  - `#mock?exam=telc-b1`
  - `#mock?exam=goethe-b1`
  - `#learn`
  - `#words`
  - `#words?topic=zahlen`
  - `#situations`
  - `#situations?scene=amt`
