# Everyday German Handoff Context — 2026-11-04
Feature: exams-curriculum-apple-design
Status: Ready for Production

## Completed
1. Apple macOS visual styling implemented across the entire application with SF font stack, glassmorphic cards, and clean borders.
2. Sidebar navigation updated with PRÜFUNGEN level switcher (A1-C1) revealing Goethe, telc, DTZ, ÖIF options, and direct links to Lernen, Wortschatz, and Situationen.
3. Dedicated hub pages active:
   - `#exams`: All exam boards and levels catalogue.
   - `#learn`: Daily learning plan, CEFR paths A1-C1, Wort des Tages, grammar carousels.
   - `#words`: 17 thematic vocabulary packs, flashcards, word pairs, review mistakes, hard words.
   - `#situations`: 11 real-world high stakes situations (Amt, Arzt, Beruf, Wohnen, Wortfallen, level-specific verbs).
4. Goethe and telc mock exam engines configured for A1, A2, and B1.
5. All 32 automated tests passing cleanly.

## Latest handoff — 2026-11-18
Source-grounded telc A1 correction: ADR005 and review2026-11-18. Start a NEW telc A1 paper to use formatVersion2. Existing sessions/results intentionally remain legacy.20minlistening,45minsharedRW,15minseparateoral. Manual assessment must complete writing/speaking and any ambiguous form spelling before total60/threshold36 is shown. Audio completion now supports repeat sequencing and cancellation. Do not advertise official certification or real group administration. No publication/commit.
