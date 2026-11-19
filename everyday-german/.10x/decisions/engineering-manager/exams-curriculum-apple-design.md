# Engineering Manager Decisions: Exams Hub, Multi-Level Curriculum & Apple Design
Feature: exams-curriculum-apple-design
Date: 2026-11-04

## Task Breakdown & Sequencing
1. **Task 1: Curriculum Data Architecture (`src/curriculum.js`)**
   - Create catalog data: levels (A1 to C1, Fachsprache), exam providers (telc, Goethe, DTZ, ÖIF).
   - Author multi-level mock exams: telc A1, Goethe A1, telc A2, Goethe A2, telc B1, Goethe B1 with Hören, Lesen, Schreiben, Sprechen sections.
   - Author 17 word topics and situational modules.
2. **Task 2: Apple Styling System (`src/styles.css`)**
   - Implement frosted glass background effects, rounded corner hierarchy, sleek pill badges, and refined typography.
   - Style level pill selector, responsive cards grid, and dashboard missions.
3. **Task 3: Navigation & Hubs (`src/app.js`, `src/features.js`)**
   - Overhaul sidebar: `Prüfungen` with level buttons [A1] [A2] [B1] [B2] [C1] and `Alle Niveaus`.
   - Implement `Prüfungen` Hub (`#exams`).
   - Implement `Lernen` Hub (`#learn`).
   - Implement `Wortschatz` Hub (`#words`).
   - Implement `Wörter in Situationen` Hub (`#situations`).
4. **Task 4: i18n & Review Storage**
   - Match German and English dictionary keys for all new hubs and actions.
   - Implement review mistakes and hard words tracking.
5. **Task 5: Verification & Quality Gates**
   - Run full unit tests (`npm test`) and syntax validation.
