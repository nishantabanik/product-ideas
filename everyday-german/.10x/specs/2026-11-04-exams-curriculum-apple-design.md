# Spec: Exams Hub, Multi-Level Curriculum, and Apple-grade Styling
Date: 2026-11-04
Feature: exams-curriculum-apple-design

## 1. Overview & Objectives
Transform Everyday German into a comprehensive, high-aesthetic German learning and exam preparation platform modelled on modern macOS/iOS human interface aesthetics.
- Deliver dedicated Prüfungen Hub (A1, A2, B1, B2, C1, Fachsprache) supporting telc and Goethe exam simulations.
- Provide a structured Sidebar with quick-level selector pills (A1-C1) revealing Goethe, telc, DTZ, ÖIF options, plus Alle Niveaus.
- Implement "Lernen & Üben" featuring:
  - Lernen (Learn dashboard: daily plan, streak, CEFR pathways A1-C1, Wort des Tages, grammar modules, drills)
  - Wortschatz (Words hub: 17+ topic packs, Flashcards, Pairs, Review Mistakes, Hard Words)
  - Wörter in Situationen (Contextual situational German: Amt, Arzt, Arbeit, Wohnen, Einkaufen, Wortfallen, A2/B1/B2 Verben)
- Retain CV Studio and Audioeinstellungen (100% free neural voices). Remove redundant older modules.
- Upgrade typography, elevation, glassmorphism, rounded corners, and micro-interactions to Apple standards.

## 2. Information Architecture & Navigation
- `/` or `#home` -> Apple-grade dashboard with quick overview and daily lesson.
- `#exams` -> Prüfungen overview hub with level cards (A1-C1, Fachsprache) and exam provider badges (telc, Goethe, ÖIF, DTZ).
- `#exams?provider=telc&lvl=a1` (or `#mock?provider=goethe&lvl=a2`) -> Full timed mock exams with Hören, Lesen, Schreiben, Sprechen.
- `#learn` -> Learning path view (Today's lesson, streak, CEFR progression bars A1-C1, Wort des Tages, Grammar topics, quick drills).
- `#words` -> Vocabulary center with topic cards (Zahlen, Familie, Essen, Verben, etc.), filter pills (A1-C1, Beruf, Redewendungen), Flashcards, Pairs, Hard words, Mistakes.
- `#situations` -> Situational training hub (Amtsdeutsch, Arztbesuch, Büro & Job, Wohnungsberatung, Einkaufen, Wortfallen).
- `#cv` -> CV Studio (retained).
- `#settings` -> Audioeinstellungen (retained, 5 free neural voices).

## 3. UI/UX & Apple Design Specifications
- SF Pro / system font stack with subtle tracking and relaxed line-height.
- Semi-transparent surfaces with backdrop blur (`rgba(255,255,255,0.06)` or `rgba(255,255,255,0.85)` in light themes).
- 12px to 18px border radius on cards, pills, and action segments.
- Soft concentric borders (`1px solid rgba(255,255,255,0.08)`).
- Distinct high-contrast typography hierarchy with clean badges and indicators.

## 4. Verification & Testing
- Unit tests for all new curriculum modules, word topics, situations, and exam grading.
- Full parity between German and English i18n dictionaries.
- Local-first persistence in localStorage with graceful fallbacks.
