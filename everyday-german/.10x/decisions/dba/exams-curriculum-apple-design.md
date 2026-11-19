# DBA Decisions: exams-curriculum-apple-design
Date: 2026-11-04

## Client Storage Model
- Added `sidebarLevel` ('a1' | 'a2' | 'b1' | 'b2' | 'c1') to `everyday-german:extras`.
- Sanitized in `loadExtras` against allowed enum values with default `'a1'`.
- All curriculum packs, situations, and mock exam structures are read-only static modules with O(1) in-memory lookup.
- Zero database migrations or server persistence changes needed.
