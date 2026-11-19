# telc A1 format correction
Implemented per ADR005 and audit review2026-11-18. Modules: telc-format.js (block lifecycle, state validation, manual scoring), telc-ui.js (grouped tasks, cards, rubrics), versioned sixth dialogues in telc-exams.js. Existing app/state/audio/curriculum integration is narrow and keeps legacy exams readable.
51 automated tests and syntax checks pass; browser checks listed in review. Original PDF unchanged. No commits or deployment.
