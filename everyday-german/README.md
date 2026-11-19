# Everyday German

A responsive desktop/mobile website for adults preparing for telc A1, A2 and B1. English/German interface, explanations and lessons; German-only exam prompts, choices, scripts and model answers.

## Run locally

Requires Node.js 22 or newer. No dependency installation or API key is required.

```bash
cd '/Users/banik/Desktop/Agentic-Automations/.000-my-learnings/001-claude-code/apps/everyday-german'
npm ci
npm run dev
```

Open http://localhost:4173. Set `PORT=4174 npm run dev` if that port is occupied. The server binds to loopback only; this does not publish the site or expose it to other devices.

```bash
npm test
npm run check
```

## First release

- Dashboard with real device-local completion statistics.
- 44 original activities: 15 reading, 15 listening, 5 form fields, 3 writing messages, and 6 speaking tasks.
- Six short bilingual lessons with German examples and checks.
- 24 vocabulary flashcards with meaning reveal and repeat/learned tracking.
- One 80-minute adapted four-skill practice paper: 15 listening questions, 15 reading questions, 5 form fields, one written message and three speaking activities. Answers, writing drafts and the absolute deadline survive reload. Time continues when the tab is closed.
- Answer explanations, mistake review, local progress export and confirmed local deletion.
- App manifest and SVG icon for supporting home-screen installation. No service worker or offline availability promise.

## Important product boundaries

This is a working **local first release**, not the complete commercial platform. All content is original draft material awaiting qualified German teacher review. No Ankommo, LexDeutsch or telc catalogue has been copied or imported. The site is independent of telc.

Listening uses the browser's built-in German speech synthesis; a German voice must be available on the device. If unavailable, a visible message and practice transcript are provided. Browser/OS speech services may process text according to their settings. There is no microphone access or recording. Speech is synthetic and has not been audited as exam-standard audio. Browser audio playback cannot be verified by reading the UI alone.

The practice papers are original learning material aligned to the published telc task structures, not official telc exams. A1 and A2 use their own exam flows; B1 has a 90-minute shared Reading/Language Elements block, 30-minute Listening and Writing blocks, a 20-minute oral preparation period and a 15-minute speaking simulation. Listening is synthetic rather than the official continuous audio programme. Writing and speaking require manual practice ratings; they are not official results.

Progress and written drafts are stored in localStorage on this origin and browser. No cloud sync, account, analytics, payment or AI evaluation is implemented. Static source includes answer keys; this is a learning application, not a secure proctored exam. Progress at one localhost port does not automatically move to another port or a future public domain.

The telc A1, A2 and B1 exam modules are implemented with original practice items. Broader B1 course content and higher-level exam modules remain planned. Qualified teacher review, licensed recordings, accounts, billing and public deployment require further work and explicit decisions. Nothing is committed, pushed or deployed by this delivery.

## Structure

`src/content.js`, `src/telc-a2-exams.js` and `src/telc-b1-exams.js` contain original practice items with stable IDs. `src/telc-exams.js` contains the five A1 papers. `src/telc-format.js` implements versioned A1/A2/B1 timed flows and practice scoring. `src/i18n.js` contains paired UI strings. `src/state.js` handles validated persistence and grading. `src/app.js` contains views and interactions. `src/styles.css` provides responsive layouts. `server.mjs` serves only public application paths and has no third-party dependencies.

## Browser checks

Check desktop and mobile widths, English/German switching, all four skills, answer correction, lessons, vocabulary review, draft persistence, exam resume/submit, elapsed time after reload and browser-storage failures. Try Safari/Chrome on actual iOS and Android before a public launch; desktop mobile-size checks do not replace those tests.

## Expanded local release — 2026-11-04

- 300 activity items: 75 each for Lesen, Hören, Schreiben and Sprechen. There are 30 additional shared everyday situations; paired comprehension questions deliberately reuse their passage across skills. This is not 75 complete mock papers.
- 75 short course lessons: the original six lessons plus 23 topics with understand/use/recall steps. These are guided micro-lessons, not 75 long chapters. Teacher review is pending.
- Five light palettes (sage, ocean, lavender, sand, rose) and dark mode under Colours & audio. Preferences persist locally.
- Expandable sidebar: learning hub, four journey checklists, exam hub, five playable language games, readiness check and CV studio.
- CV: ten editable sections, three layouts, live preview, local draft persistence, JSON export and browser Print / Save as PDF. Print dialogue is provided by the browser. No automatic translation or personal information submission.
- AI writing/speaking grading, live AI examination, immigration advice, accounts and additional CEFR levels are not implemented. Journey pages are personal planning checklists.

### ElevenLabs audio

No API key is configured or shipped. No paid generation was run. The website prefers saved MP3 recordings and otherwise uses a selectable German browser voice at an adjustable speed. Enhanced voices depend on the device; this does not guarantee an improvement on every device.

1. Copy `.env.example` to `.env` locally.
2. Set `ELEVENLABS_API_KEY` and one or more comma-separated `ELEVENLABS_VOICE_IDS` from your account. Do not paste keys into the chat or browser source.
3. Keep `AUDIO_LIMIT=1` for a first sample. Run `npm run audio:generate`. This consumes ElevenLabs credits.
4. Listen to the sample in the exercise, adjust voices if needed, then increase the limit (up to 75).

The generator uses `eleven_multilingual_v2` with moderate stability/style, alternates voices **between activities**, and caches MP3s in `public/audio`. It does not yet perform multiple speaker casting within a dialogue. Generated recordings must be checked for German pronunciation and listening-task fidelity before publication. The API key stays in the local CLI environment; no arbitrary text-to-speech endpoint is exposed.

Reference: https://elevenlabs.io/docs/api-reference/text-to-speech/convert


## CV import, job comparison and compact palette — 2026-11-04

- The top-right palette control opens vertically in place. Selection changes theme without navigation or rebuilding the page; CV inputs remain intact. Escape and outside click dismiss it. Sidebar groups no longer repeat their own heading as an arrow link.
- CV Studio accepts PDF, DOC and DOCX up to 10 MB. PDF.js extracts text from PDFs up to 20 pages in a limited child process. DOC/DOCX extraction currently uses macOS textutil: Linux hosting needs a Word parser before offering those formats. Scanned/image-only and password-protected documents require pasted text. Originals are not persisted; extracted text and the job description remain in localStorage.
- Import shows editable extracted text before applying it to sections. The user confirms replacement of the current editor. Headings are mapped heuristically; check reading order and fields before exporting.
- The ATS feature reports basic text structure signals and exact keyword coverage against a pasted job description. It is a local, transparent heuristic, not a vendor ATS simulation or a hiring prediction. Synonyms and inflection are not inferred. It does not inspect the original visual layout.
- Install the pinned dependency with `npm ci` before starting. Requires Node 22.13 or later.
- Audio generator now defaults to expressive `eleven_v3`; `.env.example` selects `h15` and a limit of one sample. Existing browser voices cannot guarantee contextual emotion. Natural voice quality is pending an actual sample and listening review. Do not automatically run the whole bank. User approved one sample after configuring local credentials.

## Five full telc A1 practice papers — 2026-11-11

- Five complete papers (Prüfung 01–05) in the structure of Start Deutsch 1. Per paper: Hören with 15 questions in three telc-style parts (Teil 1 conversations played twice, Teil 2 announcements played once, Teil 3 phone messages played twice), Lesen with 15 questions (Teil 1 short texts, Teil 2 situations with advert a/b, Teil 3 signs), Schreiben Teil 1 with five form fields plus Teil 2 as a ~30-word message over three points, and Sprechen with self-introduction incl. spelling and a number, a question card and a request card. 39 tasks and an 80-minute timer (20 + 25 + 20 + 15) per paper.
- The exam hub under telc A1 lists all five papers with the per-paper last objective result. Each paper can also be opened directly via `#mock?exam=telc-a1-p1` … `telc-a1-p5`. The original mixed practice paper is unchanged.
- New content lives in `src/telc-exams.js`. Paper tasks also appear in the practice lists; the catalogue is now 495 activities (150 Lesen, 150 Hören, 105 Schreiben, 90 Sprechen).
- Listening tasks show a plays hint (twice/once); the results page shows per-skill scores plus the 35-point objective total.
- Still original, adapted practice — not an official telc paper. Writing and speaking remain self-reviewed; no overall pass grade is invented. Teacher review is still pending.
- Tests: `test/telc-papers.test.mjs` validates the paper structure, unique IDs, answer keys and suite registration; `test/state.test.mjs` catalogue counts were raised from 300 to 495 accordingly.

## telc Deutsch A1 format alignment (2026-11-18)

Newly started telc A1 papers follow the official practice paper's task structure: listening6/4/5 (twice/once/twice), reading5/5/5, a five-field form and ~30word/three-point message, and oral introduction/spelling/numbers plus two question/answer rounds and two request/response picture-card rounds. The telc-a1 entry opens corrected paper1; five original papers are available.

Listening has a20minute block; reading and writing share45minutes without a break. Oral simulation starts separately for15minutes, with no preparation screen showing cards. Save/leave does not pause written clocks. Expiry advances written blocks even while away; waiting for oral does not start the oral clock. The real oral exam is a group session, usually four candidates; this local simulation needs a practice partner and cannot reproduce examiner interaction.

The listening button plays scheduled repetitions and limits total attempts per item, including interrupted attempts; playback failures may be retried. The text is synthetic and is not the official telc continuous audio programme. Practice mode retains unrestricted listening/transcripts.

Official marking structure is available as manual teacher/partner assessment: listening15,reading15,writing(form5+message10),speaking15. Writing content points take3/1.5/0, text design1/.5/0. Speaking parts take3/6/6. Total60 and threshold36 are displayed only after all manual ratings and needed spelling decisions. These are practice estimates, not an official result. Numeric form answers require correct digits; harmless phone spacing is accepted. Minor word-spelling errors need human review.

Existing saved exams keep the previous structure to avoid changing past answers/scores. Start a new paper to activate the corrections. Matching tasks, unrelated levels/providers, course/CV/theme/voice settings and progress are retained. Questions and model answers remain German with EN/DE guidance.

Verification evidence: [.10x/reviews/2026-11-18-telc-a1-format.md](.10x/reviews/2026-11-18-telc-a1-format.md). Source: [telc official exam/download page](https://www.telc.net/en/language-examinations/certificate-exams/german/start-german1-telc-german-a1/). The PDF currently linked by telc matches the supplied reference exactly. No official exercise wording or audio was copied into the app. Teacher review of all original content remains pending.
