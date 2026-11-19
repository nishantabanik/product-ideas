# Architect Decisions: Exams Hub, Multi-Level Curriculum & Apple Design
Feature: exams-curriculum-apple-design
Date: 2026-11-04

## Component Boundaries
1. `src/curriculum.js`:
   - `EXAMS_CATALOG`: Metadata for A1, A2, B1, B2, C1, Fachsprache, telc, Goethe, DTZ, ÖIF.
   - `MOCK_EXAMS`: Full structured test questions for telc A1, Goethe A1, telc A2, Goethe A2, telc B1, Goethe B1.
   - `WORD_TOPICS`: Thematic word collections (Zahlen, Familie, Essen, Verben, Adjektive, etc.) with card counts and exercises.
   - `SITUATIONS`: Scenario-based learning units (Wortfallen, A2/B1/B2 Verben, Auf dem Amt, Beim Arzt, Bei der Arbeit, Wohnen, Einkaufen).
2. `src/app.js`:
   - Render sidebar with level switch pills and expandable exam subnav.
   - Route dispatch for `#exams`, `#mock`, `#learn`, `#words`, `#situations`.
3. `src/styles.css`:
   - Apple design system tokens: glassmorphism, rounded corners, responsive layout grids, macOS-style segmented tabs and cards.
