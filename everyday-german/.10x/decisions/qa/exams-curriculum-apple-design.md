# QA Decisions: exams-curriculum-apple-design
Date: 2026-11-04

## Test Strategy & Coverage
- Added `test/curriculum-exams.test.mjs` verifying:
  1. Complete mock exam suites for Goethe A1, telc A1, telc A2, Goethe A2, telc B1, and Goethe B1.
  2. Level catalogue parity (A1-C1 + Fachsprache).
  3. 17 Topic packs metadata and preview consistency.
  4. 11 Real-world situations with valid German/English titles and descriptions.
  5. Local storage robustness for `sidebarLevel`.
- Ran full regression suite across all 32 automated tests with 100% pass rate.
