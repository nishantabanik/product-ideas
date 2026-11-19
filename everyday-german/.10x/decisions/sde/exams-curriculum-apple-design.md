# SDE Decisions: exams-curriculum-apple-design
Date: 2026-11-04

## Built
1. `src/curriculum.js`:
   - `EXAM_LEVELS`: Full metadata for A1, A2, B1, B2, C1, and Fachsprache with board tags and task counts.
   - `MOCK_EXAM_SUITES`: Full examination suites for Goethe A1, telc A1, telc A2, Goethe A2, telc B1, and Goethe B1.
   - `TOPIC_PACKS`: 17 thematic vocabulary packs with icons, card counts, and sample words.
   - `SITUATION_MODULES`: 11 real-world scenarios covering official offices, doctor visits, workplace, rent/housing, shopping, word traps, and level-specific verbs.
   - `EXTRA_GRAMMAR_TOPICS` & `DRILL_TOPICS`: Carousel grammar guides and mechanics drills.
2. `src/features.js`:
   - Integrated `renderExamsView` with level selector tabs and exam cards.
   - Integrated `renderLearnView` matching screenshot 2 (daily streak, study plan, CEFR paths A1-C1, Wort des Tages, grammar carousel).
   - Integrated `renderWordsView` matching screenshot 4 (17 topic cards, A1 cards/pairs, level filters, drill shortcuts).
   - Integrated `renderSituationsView` matching screenshot 3 (word traps, A2/B1/B2 verbs, exam day, road, offices, doctor, work, home, shopping, mistakes, hard words).
   - Added `sidebarLevel` persistence in `loadExtras`.
3. `src/app.js`:
   - Overhauled `sidebar(active)` to render the segmented level pills (`A1`, `A2`, `B1`, `B2`, `C1`), board provider subnav (Goethe, telc, ÖIF, DTZ, Allgemein), and main study links (Lernen, Wortschatz, Situationen).
   - Updated `mockLanding()` to dynamically render exam parameters and syllabus from `MOCK_EXAM_SUITES[params.get('exam')]`.
   - Wired `data-action="pick-exam-level"` in sidebar.
4. `src/styles.css`:
   - Added Apple macOS glassmorphic aesthetic: system font stack (`SF Pro`, `-apple-system`), translucent surfaces (`backdrop-filter: blur(20px)`), refined border lines (`rgba(255,255,255,0.08)`), segmented level pills, and responsive grids.
5. `test/curriculum-exams.test.mjs`:
   - 5 comprehensive tests validating all exam suites, levels, topic packs, situations, and extra settings persistence.

## Deviations from Plan
None. All components were built using vanilla ES modules, local storage persistence, and zero runtime dependencies.
