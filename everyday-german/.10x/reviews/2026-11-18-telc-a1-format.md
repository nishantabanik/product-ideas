# telc A1 format audit — 2026-11-18

## Evidence
- Current official page: https://www.telc.net/en/language-examinations/certificate-exams/german/start-german1-telc-german-a1/
- Current official download: https://www.telc.net/fileadmin/user_upload/mock_exams/Deutsch/telc_deutsch_a1.zip
- Downloaded archive's PDF is byte-for-byte identical to the user-supplied `telc_deutsch_a1_uebungstest_1.pdf` (10th edition2017). No newer task format was found in the currently linked official material.
- PDF page7 (printed5): timing and 60points/36threshold. Pages10–13 (printed8–11): listening6/4/5 with twice/once/twice. Pages16–21: reading task types. Pages22–23: writing. Pages26–29,33–35: oral cards and two rounds. Pages36–37 (printed34–35): writing10+form5, speaking3+6+6 and half marks.
- Selected source pages rendered and visually inspected, including picture choices and marking tables.

## Changed
- Corrected listening question6 in all five papers from an announcement/RF item to an original short conversation/three choices; old IDs retained for legacy answers/results.
- Default telc-a1 entry now resolves to corrected paper1 instead of a separate70minute generic simulation.
- Preserved reading5/5/5. Second sources in papers1–4 now use personal-message framing with original facts/answer keys retained; paper5 uses two original personal messages. Part2advertpairs and part3signs preserved.
- Preserved five form fields and three-point ~30word messages. Numeric answers accept harmless spacing; textual discrepancies require explicit human form review before a complete total.
- Speaking uses two word cards with two distinct themes and two original SVG picture cards. Existing self-introduction points and answer examples retained; minor model grammar correction.
- New sessions:20minute listening ->shared45minuteRW;15minuteoral starts separately without showing cards in advance. Navigation locks by block; absolute timers survive reload/away time.
- Listening button sequences its required repetitions. Interrupted attempts count; failed playback can be retried. Counts persist. This remains independent synthetic-audio practice, not the official continuously administered recording or a real group oral exam.
- Human rubric: writing3/1.5/0 per content point plus1/.5/0 design; oral intro3, two questions/answers6, two requests/responses6. Full result only after valid ratings and needed form decisions.36/60 is the practice threshold, not a certified result.

## Verification
51 automated tests pass, including content shape, 6/4/5 distribution, two sources, cards, timers, legacy/new persistence, half-mark threshold boundaries, numeric validation, manual form review and cancellable audio completion. JS syntax checks pass.
Browser: 20minute start and blocked other sections; question6selection survives reload; RW45minute timer, five form fields and draft persistence; oral-ready screen hides cards until separate start; oral15minute timer, two word cards and two SVGs; manual ratings survive reload and produce expected26/60 for deliberately incomplete answers; mobile390px card page has no horizontal overflow; once-only playback locks and remains locked after reload.
Physical mobile hardware and a teacher's linguistic/acoustic review of every original exercise are not verified. No unrelated feature, source PDF, secret, account, deployment or commit was changed.

Double-play dialogue browser check: automatic sequence reached2/2, then button disabled; browser console had no warnings/errors. No claim of independently verified audible quality.
