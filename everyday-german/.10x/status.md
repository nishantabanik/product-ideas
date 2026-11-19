# Everyday German Status — 2026-11-04
Phase: Delivery Complete
Feature: exams-curriculum-apple-design

## Progress
- Phase 0 (Brainstorming): Complete — Spec `.10x/specs/2026-11-04-exams-curriculum-apple-design.md` written and approved.
- Phase 1 (Strategy): Complete — CTO and Product Manager decisions written.
- Phase 2 (Design): Complete — ADR-004 written and approved. Architect and Staff Engineer decisions written.
- Phase 3 (Planning): Complete — EM and Senior Engineer task breakdown documented.
- Phase 4 (Implementation): Complete — SDE, DBA implementations completed and verified.
- Phase 5 (Verification): Complete — QA and Security sign-offs in `.10x/reviews/`. 32/32 tests passing.
- Phase 6 (Delivery): Complete — DevOps and SRE decisions written. All deliverables active.

## 2026-11-18 — telc A1 format alignment
Corrected all five telc A1 paper structures, canonical entry, block timers, listening repetitions, oral cards and manual marking.51tests pass; see `.10x/reviews/2026-11-18-telc-a1-format.md`. New version2sessions use corrected structure; legacy saved exams retain original section resolution. Human quality review remains pending; this is independent practice, not an official examination.

## 2026-11-18 — telc A2 format alignment
Added one original 39-task Start Deutsch 2 practice paper with official task structure, 20+50-minute written timing and separately started 15-minute oral practice. A2 scoring reflects the official written/oral pass thresholds; legacy A2 answer IDs remain readable. `npm run check` passed. Official-format evidence and known limits: `.10x/reviews/2026-11-18-telc-a2-format.md`. Teacher review and real audio quality remain pending.

## 2026-11-18 — telc B1 format alignment
Added an original B1 practice paper with 60 objective tasks, Sprachbausteine, four-point email, three speaking tasks, 90/30/30-minute timed written blocks and a 20-minute oral preparation period. B1 results use the separate 135/225 written and 45/75 oral pass thresholds. Current official format and implementation limits: `.10x/reviews/2026-11-18-telc-b1-format.md`. Items and synthetic listening audio still need qualified teacher review.
