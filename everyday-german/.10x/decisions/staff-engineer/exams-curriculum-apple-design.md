# Staff Engineer Decisions: Exams Hub, Multi-Level Curriculum & Apple Design
Feature: exams-curriculum-apple-design
Date: 2026-11-04

## Standards & Patterns
- **No External Dependencies**: Keep zero client build dependencies; pure ECMAScript modules (`.js`) run natively in modern browsers.
- **State Integrity**: All user answers, scores, and review mistakes persist safely in `localStorage` under bounded schemas.
- **CSS Architecture**: Extend existing CSS custom properties with Apple design variables:
  `--surface-glass`, `--border-subtle`, `--radius-apple`, `--font-system`.
- **Accessibility & Contrast**: Ensure WCAG AA contrast standards across dark and light palettes even with frosted glass backdrops.
- **Test Integrity**: Provide automated node `--test` suites verifying exam structure, curriculum loading, and dictionary key parity.
