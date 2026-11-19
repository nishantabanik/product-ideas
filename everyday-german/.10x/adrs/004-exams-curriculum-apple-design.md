# ADR-004: Unified Multi-Level Exam Engine, Modular Curriculum & Apple Design

**Status:** Accepted
**Date:** 2026-11-04
**Feature:** exams-curriculum-apple-design
**Author:** 10x-Team (Architect + Staff Engineer)

## Context
The application initially had only Telc A1 mock exams and a flat practice structure. The user requires:
1. Multi-level exam preparation covering both **telc** and **Goethe** certification bodies for A1, A2, and B1.
2. A clear hierarchy on the left navigation:
   - Prüfungen with level pills (A1-C1) revealing Goethe and telc exam links, plus an "Alle Niveaus" overview.
   - Lernen & Üben with Lernen (dashboard), Wortschatz (words by topic & flashcards), and Wörter in Situationen (real-world contextual German).
3. Apple / macOS style design polish (subtle frosted glass, SF typography, clean pill badges, sleek card elevation).
4. De-cluttering obsolete or redundant screens (standalone readiness check and preview levels) while retaining CV Studio and 100% free neural audio settings.

## Decision
1. **Curriculum & Exam Architecture (`src/curriculum.js`)**:
   - Centralize structured data for telc and Goethe exams across A1, A2, and B1 with standard sections: Hören, Lesen, Schreiben, Sprechen.
   - Provide 17 curated word topic packs with word counts, CEFR badges, and flashcard integration.
   - Provide situational modules (Bürgeramt/Formulare, Arztbesuch, Arbeit, Wohnung, Einkaufen, Wortfallen, Verb mastery packs).
2. **Navigation & Router Consolidation (`src/app.js`, `src/features.js`)**:
   - Modernize sidebar with level selector pills `[A1] [A2] [B1] [B2] [C1]` that dynamically reveal provider exams.
   - Implement route handlers for `#exams`, `#mock?provider=...&lvl=...`, `#learn`, `#words`, and `#situations`.
   - Maintain full backwards compatibility for `#practice`, `#vocabulary`, `#cv`, and `#settings`.
3. **Apple Design Language (`src/styles.css`)**:
   - Implement `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"` typography with balanced weight and tracking.
   - Utilize backdrop-filter blur, translucent borders, subtle surface gradients, and macOS-style segmented controls.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Heavy SPA framework (React/Vue) | Component library ecosystem | Build step required, slow loading, breaks zero-dependency pure web architecture | Rejected: vanilla JS runs instantly in browser and node test runner without compilation |
| Separate HTML pages per exam | Complete isolation | Duplicated shell/state, slower transitions, fractured localStorage sync | Rejected: single router with hash navigation preserves local progress seamlessly |
| Unified curriculum store | Fast instant client rendering, zero latency, offline ready | Bundle size in JS file | Selected: text curriculum is lightweight (< 150KB) and needs zero backend |

## Consequences
### Positive
- Users can simulate both telc and Goethe exams across A1, A2, and B1 with instant objective scoring.
- Visual clarity matching modern macOS software.
- High learning retention via topic-based vocabulary, flashcards, word pairs, and mistake review.

### Negative / Trade-offs
- More curriculum data bundled in browser bundle. Mitigated by clean JavaScript object structures.
