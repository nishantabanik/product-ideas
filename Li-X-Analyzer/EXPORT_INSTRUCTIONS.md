# EXPORT_INSTRUCTIONS.md

Handover document for Li X Analyzer. Written so that another AI (or a developer) can take over the whole application and keep building and maintaining it to the same standard. Read it from top to bottom once. After that, use the table of contents as a lookup.

Facts in this document were checked against the repository on the day it was written (October 2026): 289 tracked files, about 17,600 lines of TypeScript in `app/` and `lib/`, 35 test files and 273 passing unit tests, 29 pages, 52 API routes and 22 database tables. When the code and this document disagree, the code is right. Fix the document in the same change.

Table of contents

1. What the app is, and for whom
2. The owner and how to work with them
3. Architecture at a glance
4. Repository map
5. Data model (every table)
6. Configuration (environment, secrets, stored connections)
7. Authentication and security
8. Feature reference (every feature, where it lives, how it works)
9. The language model layer
10. Outside services and their limits
11. How the app was built: thinking, strategy and planning
12. Engineering conventions
13. Testing and verification
14. Git, branches, pull requests and deployment
15. Problems met and how they were solved
16. Operations runbook
17. Known limits and risks
18. Things the owner has not asked about but should know
19. Ideas not built yet
20. Glossary
21. First day checklist for the new maintainer

---

## 1. What the app is, and for whom

Li X Analyzer is one place to plan, write, schedule and measure posts on LinkedIn and X (Twitter), and to answer the comments on them. It is built for one person (the owner), or a very small team sharing one password. It is not multi user software.

Goals the owner stated, in their order of importance:

1. Measure how LinkedIn and X posts perform, over any period (days to years), with LinkedIn data coming from LinkedIn's Excel export and X data from Postiz.
2. Schedule posts through the owner's paid Postiz account (compose one post, bulk upload, calendar).
3. Get a daily advisory that explains why numbers move and what to do next (the Advisory).
4. Write better posts faster: story formats, voice, a writing assistant, drafts with review and approval, a queue of slots, best times.
5. Answer comments, follow up, track leads, engage with target people, get alerts when a post takes off.
6. Run for free (Vercel Hobby plan, Neon free database, GitHub Actions for frequent jobs). Costs the owner accepts: Postiz subscription, optional X API usage fees, optional model usage.
7. Be understandable: plain words in the interface, a Features page that documents everything, simple screens.

Non goals: automatic engagement bots, scraping, auto commenting or auto liking (against platform rules and risky for the owner's accounts), multi user accounts, mobile apps.

## 2. The owner and how to work with them

The owner is not a developer by trade. They run the app through Vercel and GitHub in the browser and a terminal on a Mac. They ask for outcomes in plain language and want honest answers about what is possible, what is hard and what costs money.

Working rules that were set in the conversation. Follow them:

- Talk to the owner with "we" and "our" instead of "you" and "your".
- No em dashes anywhere (chat, app text, documents). Use a full stop or a comma. Use straight quotes. In chat replies do not use bold or asterisks. Never put code in a side canvas, give commands inline in the message.
- Keep chat answers short when they ask for "exact steps". Say what to add, where to add it and where to get it. They said more than once that long descriptions are not wanted.
- Be honest first. Before building, say what is possible, what is not, what it costs, what is untested. Every delivery so far ended with a list of limits and with the sentence that nothing was tested against the real services, only against mocks. Keep doing this. Never claim "works" for something only tested with mocks without saying so.
- The owner does not want filler screens. Studio was simplified into a Write tab with all options filled in. Prefer one clear screen with everything pre filled over many tabs.
- Texts inside the app: plain, short words, Class 5 reading level where reasonable, "we" and "our", no marketing talk.
- Secrets: the owner pasted real secrets into chat several times (a Neon connection string, the Postiz API key, they also committed real values into `.env.example` once). Each time we told them to rotate. Never write a secret into the repository or repeat it in a reply. Never ask them to paste a secret; ask them to put it in Vercel or `.env.local` themselves.
- Pull requests: the owner asks for them in plain words ("create a pull request") and clicks Merge themselves. An attempt to merge on their behalf was blocked by the harness. Do not try to bypass it. Never push to `main` directly (a direct push to main was blocked early on). Work on the feature branch `claude/upbeat-cannon-2eyzlu`, push, open a pull request when asked, then tell them to merge.
- Stop hook: a hook in the environment complains when the working tree has uncommitted changes at the end of a turn. Commit and push finished work before ending a turn. If other workers are still editing, commit only the finished files.
- Every new feature must be added to `lib/features-catalog.ts` (name, what it does, where it is, how to enable it) and to the README table. `CLAUDE.md` says so and a test enforces it.
- Commit messages end with two attribution lines, given by the environment (a Co-Authored-By line and a session link line). Follow the instruction the environment gives at that moment.

## 3. Architecture at a glance

```
Browser (owner)
   |  one password, cookie session
   v
Vercel (Hobby plan, region fra1)
   Next.js 16 App Router: server pages + route handlers (TypeScript)
   |            |                 |                    \
   v            v                 v                     v
Neon Postgres   Postiz public API   Language model        X API / LinkedIn API
(all data)      (schedule, posts,   (our gateway or        (optional: replies)
                analytics)          GitHub Copilot)
                                                         Resend (email), Telegram (messages)

Schedulers
  Vercel cron (daily):   06:00 UTC /api/cron      sync + X replies + report + pulse
                         06:20 UTC /api/cron/advisory
  GitHub Actions (every 15 min): .github/workflows/pulse.yml -> /api/cron/pulse
```

Stack and versions (see `package.json`): Next.js 16 (App Router, Turbopack build), React 19, TypeScript 5 (strict), `postgres` 3 (porsager driver), `zod` 4, `exceljs` 4 (lazy loaded, marked as server external package in `next.config.ts`), `pdf-lib` 1.17 (PDF reports, standard fonts only). No UI library, no CSS framework, no state library. No ORM: plain SQL through the tagged template of the `postgres` driver. No auth library: a signed cookie. Tests use Node's built in test runner with type stripping (`node --experimental-strip-types --test`).

Rendering model: pages are server components (`export const dynamic = "force-dynamic"`), they read the database directly and pass plain data to small client components for interaction. Client components call route handlers under `app/api` with `fetch` and then call `router.refresh()`.

## 4. Repository map

Top level
- `README.md`: short, for people. Features table, setup, env table, deploy.
- `CLAUDE.md`: rules for any AI working in the repo (update the features catalog, run tests, no secrets, plain text).
- `EXPORT_INSTRUCTIONS.md`: this file.
- `vercel.json`: region `fra1` and the two daily crons.
- `next.config.ts`: marks `exceljs` as a server external package.
- `.github/workflows/pulse.yml`: the 15 minute check.
- `dev-tools/`: fakes and browser tests (see section 13).
- `public/bulk-template.csv`: sample for bulk scheduling.
- `.gitignore`: ignores `.env`, `.env.local`, `.next`, `node_modules`, `*.tsbuildinfo`, `next-env.d.ts`.

`app/` (pages and route handlers). One folder per area, each page folder holds `page.tsx` (server) and client components next to it.
- `layout.tsx`, `nav.tsx`, `loading.tsx`, `globals.css`: shell, left menu with badges (Comments needs a reply, Alerts new), skeleton, all shared CSS tokens and classes.
- `components/`: `chart.tsx` (SVG line chart), `seg.tsx` (segmented control, can be link tabs), `toast.tsx`, `icons.tsx`, `delta.tsx`, `count-up.tsx`.
- `page.tsx` Overview, `analytics/` (Numbers, Benchmarks, Content, Goals, Growth, Reports), `advisory/`, `calendar/`, `compose/`, `bulk/`, `import/`, `comments/`, `leads/`, `targets/`, `alerts/`, `queue/`, `studio/` (Write, My style, Board, draft editor `[id]`, Library, Pillars, Chat), `posts/[id]/` (post page), `settings/`, `features/`, `login/`.
- `api/`: route handlers, one folder per feature (see appendix A).

`lib/` (logic). Rule: anything worth testing is a pure `.ts` file that imports siblings with the `.ts` extension. Files that touch the database, Postiz or the model are separate (`store.ts`, `service.ts`, `load.ts`) and are not unit tested.
- `db.ts`: connection and the whole schema (`SCHEMA` string, applied by `ensureSchema()`).
- `auth.ts`, `guard.ts`, `secret-box.ts`, `connections.ts`: login, API guard, encryption, stored connections and small key value state.
- `postiz.ts`: Postiz client (channels, posts, analytics, scheduling payload, 30 second post cache).
- `sync.ts`, `xaccount.ts`: sync from Postiz, X account totals in 12 weekly buckets.
- `import-parse.ts`, `import-store.ts`, `read-sheet.ts`, `ids.ts`: LinkedIn and X export parsing and upsert.
- `analytics-data.ts`, `analytics.ts`, `ranges.ts`, `stats.ts`, `tz.ts`, `calendar.ts`, `bulk.ts`: data access, range maths, time zones, calendar grid, bulk file parsing.
- `advisory/`: the Advisory engine (rules, scoring, lift of text traits, audit, playbook, coach, store, generate).
- `comments/`: capture, parse, store, X and LinkedIn clients, OAuth 1.0a, quiet conversations, templates, suggestions.
- `studio/`: drafts store and flow, thread tools, lint, voice, formats, write and chat prompts, assets (My style), times, slots, pillars, recycle, ai helpers, publishing service.
- `pulse/`: snapshots, curve maths, pace (take off or slow), alerts store and the pulse service.
- `insights/`: followers, goals, benchmarks, content breakdown.
- `reports/`: report builder, PDF, load, schedule.
- `leads/`, `targets/`: pipeline and daily engagement.
- `llm/`: gateway client, Copilot, model choice, JSON extraction, `index.ts` entry (`llmText`, `llmJson`).
- `notify.ts`: email (Resend) and Telegram.
- `features-catalog.ts`: the single source for the Features page.

## 5. Data model (every table)

All tables are created by `ensureSchema()` in `lib/db.ts` (idempotent `create table if not exists` and `alter table ... add column if not exists`). It runs on first use of any store. A shared promise prevents two requests from running it at once. There are no migration files: to change the schema, add a new `create` or `alter ... if not exists` line to `SCHEMA`. Never edit an old line in a way that changes meaning for existing data.

| Table | Purpose | Notes |
| --- | --- | --- |
| `channels` | Connected Postiz channels (id, name, platform linkedin or x, picture, profile) | Filled by sync |
| `posts` | Every known post. Text, state, url, published_at, numbers (impressions, engagements, likes, comments, shares, clicks), `source` (postiz or import), `external_id` | `external_id` is parsed from the post url (tweet id or LinkedIn activity id) to match imports with Postiz posts. A one time `do` block deleted early wrong imports and added `engagements` |
| `account_buckets` | X account totals per channel in 12 weekly buckets (week 1 = last 7 days) | From Postiz channel analytics, kept even when Postiz cannot list the posts |
| `daily_metrics` | LinkedIn account numbers per day (impressions, engagements, likes, comments, shares, clicks) | From the LinkedIn export. Primary key (platform, day). Upserts use `greatest()` |
| `channel_metrics` | Raw per channel label per day totals | Used for non X channels |
| `advisories` | One saved Advisory per day (jsonb data, optional coach jsonb, coach_error, model) | |
| `connections` | Encrypted sign in data by provider (`copilot`, `linkedin`, `gateway`) | AES-256-GCM keyed from SESSION_SECRET |
| `sync_state` | Small key value state | Keys: `x:user_id`, `x:mentions_since`, `studio:tz`, `studio:require_approval`, `report:freq`, `report:last` |
| `comments` | Comments and messages. platform, post_id, post_ref, external_id, author, body, status new/replied/ignored, comment_url, reply fields, `kind` comment or dm, `follow_up_at` | Unique (platform, external_id). Id for pasted rows is a hash of content so repeats do not duplicate |
| `reply_templates` | Saved replies | |
| `drafts` | Studio drafts. platform, status idea/draft/review/approved/scheduled/published, title, content, thread jsonb, pillar, source (manual, ai, repurpose, recycle), parent ids, scheduled_for, review_note | Scheduled drafts auto turn published 30 minutes after their time |
| `templates` | Studio library items we saved | |
| `queue_slots` | Weekly posting slots (platform, weekday 0 = Sunday, time HH:MM) | Time zone is in `sync_state` `studio:tz` |
| `pillars` | Content pillars (name, keywords jsonb, position) | Replaced as a whole on save |
| `leads` | Lead pipeline (stage new, contacted, conversation, proposal, won, lost, value, notes, next_step_at, last_contact_at, comment_id) | |
| `targets` | People to engage with daily | |
| `engagement_log` | One row per target per day engaged | Unique (day, target_id) |
| `post_snapshots` | Numbers of a post at a moment (post_id, taken_at, impressions, likes, comments, shares, clicks) | Taken at every sync and every pulse; thinned (at least 8 minutes apart); deleted after 180 days |
| `alerts` | Post alerts (post_id, kind taking_off or slow, title, detail, level, seen) | Unique (post_id, kind) so each alert is raised once |
| `goals` | Goals (platform, metric, period week or month, target) | |
| `follower_log` | Followers per platform per day (total, gained, lost, source) | |
| `writing_assets` | My style items: kind tone, style, memory, format, output, skill; name, body, platform, active (default on), position | Max 200 rows |

Dates: days are UTC calendar days stored as `date`; instants are `timestamptz`. Display converts to the owner's time zone where it matters (queue, report).

## 6. Configuration

Where values live
- Vercel: Project, Settings, Environment Variables. Values are read on a new deployment, so redeploy after changing one.
- `.env.local` for local runs (ignored by git). `.env.example` is a template with empty values and is committed. Never put real values in `.env.example`.
- GitHub: Settings, Secrets and variables, Actions, for the 15 minute check (`APP_URL`, `CRON_SECRET`).
- The Settings page stores two things in the database, encrypted: the model gateway (URL, key, model, optional style, key header, extra headers) and the sign ins (GitHub Copilot, LinkedIn). They win over the environment.

Environment variables (all names used in code)

| Name | Needed | Used for |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string. `channel_binding` is stripped automatically |
| `POSTIZ_API_KEY`, `POSTIZ_API_URL` | yes | Postiz. Cloud API base is `https://api.postiz.com/public/v1`. A dashboard address (platform.postiz.com) is mapped to it |
| `APP_PASSWORD` | yes | The single login password |
| `SESSION_SECRET` | yes | Signs the cookie and is the key for encrypted connections. Changing it signs everyone out and makes stored sign ins unreadable (sign in again) |
| `CRON_SECRET` | yes | Bearer secret for `/api/cron*` |
| `GATEWAY_API_URL`, `GATEWAY_API_KEY`, `GATEWAY_MODEL`, `GATEWAY_API_STYLE`, `GATEWAY_API_KEY_HEADER`, `GATEWAY_EXTRA_HEADERS` | optional | Model gateway from the environment. Easier to enter on Settings |
| `COPILOT_MODEL`, `GITHUB_COPILOT_CLIENT_ID`, `LLM_PROVIDER` | optional | Copilot default model (default gpt-4.1), device flow client id, force Copilot as default (`LLM_PROVIDER=copilot`) |
| `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`, `X_SYNC_LIMIT`, `X_API_BASE` | optional | Reading and sending X replies (OAuth 1.0a, owner's own X developer app) |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `APP_URL`, `LINKEDIN_VERSION`, `LINKEDIN_API_BASE`, `LINKEDIN_AUTH_BASE` | optional | Sending LinkedIn replies |
| `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM`, `RESEND_API_BASE` | optional | Email for reports and alerts |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_API_BASE` | optional | Telegram messages for alerts |
| `GITHUB_BASE_URL`, `GITHUB_API_URL` | tests | Point the Copilot sign in at a fake |

The `*_BASE` variables exist so that tests can point each outside service at a local fake. Keep that pattern for any new outside service.

## 7. Authentication and security

- One password (`APP_PASSWORD`). `POST /api/login` compares it in constant time and sets the cookie `lix_session`: an HMAC (SHA-256, keyed by `SESSION_SECRET`) of a constant string, httpOnly, sameSite lax, secure in production, 30 days. There is no user table.
- There is no middleware. Every page starts with `if (!(await isAuthed())) redirect("/login")`. Every route handler starts with `const denied = await requireAuth(); if (denied) return denied;` (from `lib/guard.ts`). Exceptions on purpose: `/api/login`, `/api/logout`, and the cron routes, which check `Authorization: Bearer ${CRON_SECRET}` instead. A new page or route without one of these checks is a bug. An audit at the time of writing found none missing.
- Stored sign ins and the gateway key are encrypted with AES-256-GCM (`lib/secret-box.ts`). The key derives from `SESSION_SECRET`, so protect that secret. The Settings page never shows a saved key again; an empty key field means keep the saved one.
- All SQL uses the tagged template of the driver, which parameterises values. Where a fragment is built (`db().unsafe(...)`) it only contains constants.
- Third party text (comments, DMs, pasted post text) is data. It is passed to the model inside prompts, so treat model output as untrusted text: it is only ever shown or copied, never executed.
- Weak points to know (also in section 18): no login rate limit, no CSRF token (cookies are sameSite lax and every mutation is a same origin JSON request), the stored data includes personal data of third parties.

## 8. Feature reference

Format: what it does, where, files, data, behaviour that is easy to get wrong. The user facing version of this list is the Features page, generated from `lib/features-catalog.ts`.

### 8.1 Overview and sync
- Page `app/page.tsx`, button `app/sync-button.tsx`, API `POST /api/sync`, logic `lib/sync.ts`.
- Sync: lists channels, loads X account totals (12 weekly buckets), channel level numbers for non X channels, lists posts (90 days back, 7 ahead), upserts posts in batches of 500, then refreshes per post numbers for at most 40 posts (unmeasured first, then posts younger than 21 days), 5 at a time, and records a snapshot per refreshed post. Reason for the limits: Postiz allows about 90 calls an hour.
- X account totals refresh at most every 6 hours unless forced; inconsistent totals from Postiz are rejected and the previous numbers kept.
- LinkedIn personal profile gives no analytics through Postiz. That is expected, not an error.

### 8.2 Analytics (Numbers tab)
- `app/analytics/page.tsx` plus `hero-chart.tsx`, `range-bar.tsx`, `top-posts.tsx`. Logic `lib/ranges.ts` (preset ranges, custom, "last N days, months, years", all time, auto grouping by day, week or month, partial first and last periods drawn dashed), `lib/analytics-data.ts`, `lib/stats.ts`.
- Metrics: impressions, engagements, likes, comments, reposts (a metric card or chip only shows when the column has data; "not in the export" is different from zero). Previous period comparison, best day, top posts table (sortable, each links to `/posts/[id]`), LinkedIn versus X side by side.
- X numbers are weekly (12 buckets); LinkedIn numbers are daily. Anything that mixes both must say so.
- Days are UTC days.

### 8.3 Import (LinkedIn and X exports)
- `app/import/*`, `POST /api/import`, `lib/import-parse.ts`, `lib/import-store.ts`, `lib/read-sheet.ts`.
- Reads every sheet of an xlsx (or a csv): a daily sheet (Date, Impressions, Engagements, optional likes, comments, shares, clicks), top posts tables, and a followers sheet (sheet name matches /follower/). LinkedIn lists at most 50 posts per top posts table and the two tables sit side by side in one sheet; they are split by column position and merged per post. Date order (month first or day first) is inferred from the values.
- Idempotent by design: days are keyed by (platform, day), posts by url, and conflicts keep the higher number (`greatest`), because LinkedIn keeps counting for a few days. Order of uploads never matters and an older file never lowers a settled number. The page shows new, updated and already there counts per file.
- X analytics CSV is also accepted; "New follows" and "Unfollows" columns feed the follower log.

### 8.4 Advisory
- `app/advisory/*`, `app/api/advisory`, `app/api/cron/advisory`, `lib/advisory/*`.
- A rules engine (no model needed) reads our own history and produces findings in groups (holding back, missing, stop, experiment, working), health scores for LinkedIn and X, up to three actions for today, a post by post audit, and a playbook of general practices. It reports a text pattern (question, link, hashtags, length, number in the first line, opening) only when enough posts sit on both sides, and says when a signal is early.
- Optional coach notes: a digest of numbers goes to the model (`lib/advisory/coach.ts`, `llmJson` with a zod schema): why we are behind, rewrites of weak posts, ideas for the week, experiments. If the model fails, the rules based advisory is still saved and the reason is shown.
- Runs daily at 06:20 UTC (`vercel.json`), or on first open of a new day. Older days stay available in a date picker.
- Comments feed it: a finding appears when comments wait for a reply.
- LinkedIn exports hold no post text, so text based advice for LinkedIn only covers posts made through Postiz or the Studio. The page says so.

### 8.5 Calendar, Compose, Bulk schedule
- Calendar: `app/calendar/*`, `lib/calendar.ts`: month and week grids of scheduled, published and failed posts live from Postiz, filter by platform, click a day for full texts and to start a post on that day.
- Compose: `app/compose/*`, `POST /api/schedule`: one post to X, LinkedIn or both, now or at a time. X limit 280 enforced.
- Bulk: `app/bulk/*`, `lib/bulk.ts`, `POST /api/bulk`: Excel or csv with date, time, platform, content. Time zone chosen on the page and converted with `lib/tz.ts` (daylight saving aware). Past dates, missing fields, X over 280 and duplicates are flagged and skipped; the rest are sent three at a time.
- Postiz payload (`buildSchedulePayload` in `lib/postiz.ts`): `type` now or schedule, `date`, `posts[]` with `integration.id`, `value[]` (one entry per post; an X thread has several entries), and platform settings (`__type: "x"` with `who_can_reply_post`, or the LinkedIn setting `post_as_images_carousel: false`).

### 8.6 Comments inbox
- `app/comments/*`, `app/api/comments/*`, `lib/comments/*`.
- Reading: X replies come from the mentions timeline of the owner's own X developer keys (OAuth 1.0a implemented in `oauth1.ts`, checked against Twitter's published signature example). Only new replies are read (`since_id` kept in `sync_state`) because X bills per tweet read. LinkedIn comments on a personal profile cannot be read by apps, so they are pasted (many at once, optionally with "smart paste" through the model), added one at a time, or uploaded from csv or xlsx.
- Direct messages: neither platform lets apps read them. They are pasted too (`kind = dm`), shown with a Message badge and always answered by copy and send by hand.
- Replying: on X the app sends the reply (`POST /2/tweets`). On LinkedIn it can send through the owner's own LinkedIn app (`socialActions/{postUrn}/comments` with `parentComment`) only when LinkedIn is connected and the comment URN is known (taken from the "Copy link to comment" url). Otherwise the card offers copy and open on LinkedIn.
- Suggested replies in three tones (`suggest.ts`, X replies cut to 280). Reply templates with `[name]` and `[post]` fill (`fill.ts`, tested). Reminders: "Remind me" sets `follow_up_at`; quiet conversations (we replied, no newer message from the same person for 3 days) are computed by `quiet.ts` (tested). A "Follow up" filter lists both.
- Each card has Mark as lead (`POST /api/leads {commentId}`).
- The left menu badge uses `newCount()` (one cheap query), because the layout runs on every page. Do not put a heavy query there.

### 8.7 Studio
Tabs (`app/studio/tabs.tsx`): Write, My style, Board, Library, Pillars, Chat. The left menu item Studio opens Write.

Write tab (`app/studio/write/*`, `POST /api/studio/write`, `lib/studio/write.ts`, `write-prompt.ts`, `simple.ts`, `formats.ts`)
- Input: topic, optional facts, one of 61 story formats in 7 groups (plus our own), optional one of 18 story structures, a kind of writing (standard, short, long, carousel outline, poll, list, plus our own), our style items, model, platforms.
- Output: a LinkedIn post and an X post. Rules enforced in code, not only in the prompt: plain typography (`plainText`: no em or en dashes, straight quotes), X text fitted to 279 characters with the same length rule as X (links count 23; wide characters count 2) by cutting at a sentence, reading grade (Flesch Kincaid, `readingGrade`) with a target of 6.5, and one automatic fix call when a post is too long, too hard or has a dash. The fix is kept only when it is no worse.
- The model answers in marker lines (`===LINKEDIN===` and `===X===`), not JSON, because several models (chatty ones, ones without JSON mode) fail JSON. `parseSections` accepts many spellings, strips code fences and closing remarks ("Let me know..."), and a single post may come without any marker.
- Model choice: `ModelSelect` lists models from every connected source (gateway list and Copilot list) in groups. The value is `source::name` (`lib/llm/choice.ts`) so the right backend is used even when the other one is the default.
- Saving a result creates a draft (source `ai`) and opens the editor.

My style (`app/studio/style/*`, `POST|PATCH|DELETE /api/studio/assets`, `lib/studio/assets.ts` and `assets-store.ts`)
- Six kinds: tone (how we sound), way of writing (rules), memory (facts about us), our story formats (appear first in the Write tab as group "Our formats", id `custom:<id>`), our writing formats (kind of writing), skill files (markdown or text instruction files, uploaded or pasted; front matter `name` and `description` are read).
- Each item can be marked "use by default"; in the Write tab, step 3 shows them ticked and the post can change that. Items can be limited to LinkedIn or X.
- `buildProfile` adds them to the system prompt under a character budget of 14,000 (about 3,500 tokens): tone, rules and memory first and in full, skill files share what is left and are shortened at a paragraph boundary (reported in the interface). The prompt ends with "the rules about dashes, length and simple words always come first". The chat uses the default ones with a 6,000 character budget.
- A switch "Keep the English simple (Class 5)" turns the reading level rule and its check off; dashes and invented facts stay forbidden.
- Limits: tone 1,500 characters, rules 3,000, memory 3,000, formats 2,000, skill files 20,000, at most 200 items.

Board and editor (`app/studio/page.tsx`, `app/studio/[id]/*`, `lib/studio/flow.ts`, `store.ts`, `service.ts`)
- Statuses: idea, draft, review, approved, scheduled, published. `nextStatus` allows the moves; a switch "Require approval before anything is scheduled" removes the shortcut from draft to scheduled. Editing the text of a draft in review or approved sends it back to draft (a save with no change does not). Autosave 900 ms after typing; actions flush the save first (a race here once let a stale save undo an approval).
- The editor shows a live rules check (`lint.ts`, same practices as the Advisory), "Write 3 versions", "Fix what is flagged", "Adapt to the other format" (LinkedIn version, short X post, X thread; falls back to rule based cutting without a model), an X thread builder (`thread.ts`: weighted length, split at paragraph, sentence, word; numbering; reorder), scheduling at a time with the next queue slots as chips, and post now.
- Scheduling goes to Postiz (`scheduleDraft`); a scheduled draft is locked here, the owner changes it in Postiz (the code has no Postiz delete or edit).
- Library (built in hooks and templates, ours, first lines of our best posts), Pillars (topics with keywords; `pillarOf` matches whole words; stats compare each topic with the typical post), Chat (section 8.8).

### 8.8 Chat (writing assistant)
- `app/studio/chat/*`, `app/studio/chat-panel.tsx`, `POST /api/studio/chat`, `lib/studio/chat.ts`.
- Multi turn without server memory: the browser sends the conversation; the server keeps the last 8 messages (4,000 characters each), adds the draft if there is one, four of our best posts for voice, the default My style items, and caps the answer at 900 tokens. The model choice dropdown is shared with the Write tab.

### 8.9 Queue (best time, slots, recycling)
- `app/queue/*`, `app/api/queue/*`, `lib/studio/times.ts`, `slots.ts`, `recycle.ts`.
- Best time: each post is compared with the account's typical post (ratio to the median) so growth over years does not bias recent hours; hours with few posts are pulled toward average (a prior worth two posts); a strong hour needs at least two posts and a ratio of at least 1.15; fewer than 20 posts with impressions shows starter times instead. Rendered as a weekday by hour heat map in the chosen time zone.
- Slots: weekly (weekday, HH:MM) per platform in one time zone (`sync_state` `studio:tz`). `zonedToUtc` converts wall clock to UTC including daylight saving changes (tested across the March 2026 change). `nextSlotTimes` skips taken times. "Fill the queue now" gives each approved draft the next free slot, also avoiding times Postiz already holds (looks 60 days ahead), then schedules it.
- Run again: old posts (older than 90 days), at least 1.3 times the typical post, 60 or more characters, not tied to a date (regex for today, tomorrow, webinar, years, month names with numbers) and not recycled in the last 90 days become a new draft, optionally with a fresh opening from the model.

### 8.10 Alerts and the pulse
- `app/alerts/*`, `app/api/alerts`, `app/api/cron/pulse`, `lib/pulse/*`, `.github/workflows/pulse.yml`.
- `runPulse`: looks at posts published in the last 36 hours (at most 6 per run, one Postiz call each), stores a snapshot, updates the post numbers and raises an alert once per post and kind. `paceStatus` compares impressions with the share of a typical final total that posts usually reach at that age. Until we have 8 posts with long snapshot history it uses a general curve (15 min 10 percent, 30 min 20, 60 min 35, 2 h 50, 6 h 75, 24 h 95); then it learns our own curve (`learnCurve`). Taking off: at least 1.5 times expected and at least 40 impressions. Slow: age between 60 minutes and 8 hours and at most half of expected. Alerts go to the Alerts page, the menu badge, email and Telegram if configured.
- Why GitHub Actions: Vercel Hobby only allows daily crons. The workflow calls the endpoint with the cron secret every 15 minutes; it needs the repository secrets `APP_URL` and `CRON_SECRET`, runs only from the default branch, and GitHub pauses scheduled workflows in repositories with no activity for 60 days.
- Works for X posts only (Postiz gives no per post numbers for LinkedIn personal profiles).

### 8.11 Post page: speed
- `app/posts/[id]/*`, `lib/pulse/curve.ts`. First hour impressions (only when a snapshot exists in the first hour or so; never invented), impressions at 24 hours, growth curve (age axis stretched with a log scale), comparison with the previous post on the same platform (final numbers, and at the same age when both have snapshots), the post's comments and the add form.

### 8.12 Analytics tabs
- Benchmarks (`lib/insights/benchmarks.ts`): last 30 full days against the 30 before, the same 30 days a year ago, our usual 30 days (median of rolling windows, needs 90+ days), our best 30 day window and the rank among blocks; records (best day, week, month, post). X has 12 weeks only, so it uses 4 week windows and says what is unavailable.
- Content (`lib/insights/breakdown.ts`): topic (pillars), format (thread, list, question, story, single), length buckets, hook type, each against the platform median with a verdict (strong at 1.25 times, weak at 0.75; at least 4 posts per group and 8 overall).
- Goals (`lib/insights/goals.ts`, `goals-load.ts`): metric, period week or month, target; progress, projection from the trailing rate, required pace, status. X weekly totals are spread evenly over days and the page says so.
- Growth (`lib/insights/followers.ts`): follower series from imports or by hand; gains in the 48 hours (publish day and next) above the normal two day gain; a post is "linked" only with full data, positive excess and at least 1.5 times the noise; needs 14 days and 5 posts; says it is a link, not proof.
- Reports (`lib/reports/*`): last full week (Monday to Sunday) or last full month, numbers with change, top posts, followers, goals and up to 3 next steps; PDF with `pdf-lib` and standard Helvetica only (text is sanitised to WinAnsi because the standard fonts throw on other characters); download any time; email through Resend as an attachment; a daily job sends it when due and marks it sent only on success.

### 8.13 Leads and Targets
- Leads (`app/leads/*`, `lib/leads/*`): board with six stages, summary (count, open value, won value, win rate), "Needs attention" (next step due, no contact for 14 days), add one, add several by paste (LinkedIn does not expose profile viewers, so names are pasted), create from a comment (de-duplicated by comment id).
- Targets (`app/targets/*`, `lib/targets/*`): short list of people; "Today" picks up to 5 not yet engaged today, least recently first; Mark engaged writes the log; streak counts consecutive UTC days; "Suggest a comment" asks the model for three comments from a pasted post, or shows eight fixed prompts without a model.

### 8.14 Settings and connections
- `app/settings/*`, `app/api/connect/*`, `app/api/settings/test`. Gateway form with Load models (dropdown from the gateway's model list), Copilot device flow sign in, X and LinkedIn status with test buttons, separate "Test the gateway" and "Test GitHub Copilot" buttons. A gateway on `localhost` cannot be reached from Vercel; the interface says so (`isLocalAddress`).

### 8.15 Features page
- `app/features/page.tsx` renders `lib/features-catalog.ts` (groups, name, what, where, link, how to enable, needs). `lib/features.test.ts` checks every link points to an existing page and every feature has enable text. This is the owner's own documentation tab (left menu, under Settings). Keeping it complete is a hard requirement.

## 9. The language model layer

Entry points (`lib/llm/index.ts`): `llmAvailable()`, `llmStatus()`, `llmText(opts)` (plain text) and `llmJson(zodSchema, opts)` (validated JSON). `opts` = `{ system, user, maxTokens, model?, provider? }`. Every model feature goes through these, so a new feature never talks to a provider directly.

Sources
- Gateway (`lib/llm/gateway.ts`): any OpenAI style chat endpoint (or an Anthropic style one when the url ends in `/messages` or the style is set). `resolveEndpoint` turns what we are given into the endpoint (a full chat url is used as is; a bare host or a `/v1` base gets the path added). Auth is `Authorization: Bearer key` (plus `x-api-key` and `anthropic-version` for the Anthropic style), or a custom header name, plus optional extra headers as JSON. The gateway saved on Settings (database, encrypted) wins over `GATEWAY_*` variables.
- GitHub Copilot (`lib/llm/copilot.ts`): the VS Code device flow with the public Copilot client id: start (`/login/device/code`), poll (`/login/oauth/access_token`), then exchange the GitHub token for a short lived Copilot token (`/copilot_internal/v2/token`, renewed a minute before it expires; the response tells the chat api base). It sends editor style headers. This is unofficial and may break at any time; the interface says so. Default model `gpt-4.1` (`COPILOT_MODEL`). Model list from `${api}/models`, chat models only.
- Which one is the default: the gateway wins unless `LLM_PROVIDER=copilot`. A pick made in the interface names its source (`gateway::model` or `copilot::model`) and overrides the default for that call (`opts.provider`, `opts.model`).

Gateway robustness (this took several rounds, keep it)
- Models and gateways differ in what a request may contain. `chatGateway` tries request shapes in order: standard (`stream:false`, `max_tokens`, JSON mode when asked), without JSON mode, streamed (`stream:true`, read server sent events), `max_completion_tokens`, and a bare request. The shape that worked is remembered per url, model and mode in memory.
- Fail fast, with a clear message and no retries, when the key is wrong (401 or 403), the endpoint is unknown or the model is missing (404), a rate limit (429), or the gateway says it cannot use the model ("Unsupported model ..." means the gateway maps our model name to something its own provider rejects; only the gateway's setup can fix that).
- `parseChatBody` reads `choices[].message.content` (string or array), `choices[].text`, `output_text`, `message.content`, Anthropic `content[].text` and streamed events. If every shape fails the error lists what was tried and the last gateway message.
- Model list: `listGatewayModels` tries `{base}/models`, `{base}/v1/models`, then the origin variants, and reads `data[].id`, `models[]` or a plain list.
- Network failures on private addresses (localhost, 10.x, 192.168.x) get an explanation: Vercel cannot reach a gateway on the owner's own computer; use a public https address such as a Cloudflare tunnel.

JSON versus plain text
- `llmJson` puts the JSON schema in the prompt, validates with zod and gives one repair attempt. It is used where the output is structured and short (coach notes, ideas, reply suggestions, adapt, improve). The Write tab does not use it, because some models wrap or refuse JSON; it uses marker lines. When adding a feature, prefer marker lines or plain text for long creative output and JSON only for small structured output.

Token control
- Prompts include only what is needed: four or three of our best posts for voice, the last 8 chat messages, My style under a character budget, and `maxTokens` caps (900 chat, 1500 write). Writing a post costs one call, two when the first needs a fix.

Writing rules that live in prompts and in code
- Prompt (`lib/studio/write-prompt.ts`, `writeSystem`): very simple English (Class 5), sentences under 12 words, everyday words, no jargon, "I" for personal stories, never em or en dashes, no emojis, no hashtags unless our rules ask, straight quotes, never invent facts (use [brackets] for missing details). X post at most 270 characters in the prompt (the code allows 279).
- Code enforces what a prompt cannot guarantee: `plainText`, `fitX`, `checkPost` (length, reading level, dashes), the single fix call.

## 10. Outside services and their limits

| Service | Used for | What to know |
| --- | --- | --- |
| Postiz (cloud) | Scheduling, post list, X and per post analytics | About 90 calls per hour. Cache lists (30 seconds), cap per run refresh counts (40 in sync, 6 in pulse). The API base is `api.postiz.com/public/v1`, not the dashboard host. No delete or edit of a scheduled post is used in our code. Personal LinkedIn profiles return no analytics. Post analytics `date` parameter is days |
| Neon (Postgres) | All data | Use the pooled host. The `channel_binding=require` part of Neon's copy button is not accepted by the driver and is removed. Prepared statements are off (`prepare: false`) because of the pooler. Free plan scales to zero; the first query after idle is slow |
| Vercel Hobby | Hosting, daily crons | Cron jobs at most once a day. Function duration is limited (several routes declare `maxDuration` 60 to 300; the plan may cap it lower, if a long call times out look here first). Environment variables are read at deploy time. Preview deployments of every branch are built with the Preview variables; production builds only come from the Production Branch setting, which must be `main` |
| GitHub Actions | 15 minute pulse | Schedules run only from the default branch and pause after 60 days without repository activity |
| X API | Reading and sending replies | The owner's own developer app, OAuth 1.0a (four keys). Pay per use: reads are billed per tweet, so only new replies are fetched. 402 means credits ran out, 403 usually means the app lacks write permission or the access token was made before that change |
| LinkedIn | Reply sending only | Reading comments of a personal profile is a closed permission. Replying needs our own LinkedIn app with the share permission, scopes `openid profile w_member_social`, and the comment URN (from "Copy link to comment"). Tokens expire (about 60 days), sign in again |
| GitHub Copilot | Optional model source | Unofficial endpoints; needs an active Copilot plan |
| Resend | Email | The free sender `onboarding@resend.dev` only delivers to the address that owns the Resend account. A verified domain is needed to send to others. Attachments are base64 |
| Telegram | Alert messages | Needs a bot token and the chat id (message the bot first, then read `getUpdates`) |

## 11. How the app was built: thinking, strategy and planning

This section records how the work was done, so the same approach can continue.

Method in one paragraph. Start from an honest feasibility check of what the platforms allow, then build in thin vertical slices (data, logic, screen, test), put every rule worth testing into a pure function with unit tests, verify each slice in a real browser against fake services, read the screenshots, fix what looks wrong, then commit and push. Documentation (the Features page) and the owner's real questions drive the next slice.

Phases, in the order they happened

1. Feasibility. The first question was how hard it is to measure and schedule LinkedIn and X posts with Postiz as the back end. The honest answer shaped everything: Postiz can schedule and gives X numbers; LinkedIn personal analytics are not available through any open API, so LinkedIn numbers come from LinkedIn's Excel export; LinkedIn comment reading is closed. The stack was chosen for zero running cost (Next.js on Vercel, Neon Postgres, GitHub) and for the owner's skills (they deploy from the browser).
2. First release: login, Postiz sync, calendar, analytics (7, 30, 90 days), compose, bulk file scheduling. The owner shared screenshots of Postiz as the target for the calendar and the X analytics. Early visual direction was colourful, then changed on the owner's request to a calmer dark slate theme with two accent colours (blue for LinkedIn, orange for X).
3. Reality check by the owner: the app felt slow, "not dynamic", and the LinkedIn import read only 50 posts from a 1.5 year export. Response: a performance pass (batch inserts, parallel queries, region next to the database, loading skeletons, shared schema promise), a rewrite of the importer to read daily history and both top post tables (see 8.3), idempotent upserts, any range (days to years), and a redesign of the interface with a sidebar shell.
4. The Advisory: the owner asked for a daily, automatic review of every post that explains why, lists best practices and things to avoid and tells what is missing. Design choice: a deterministic rules engine first (works with no model, reproducible, testable), optional model notes on top.
5. Likes, comments and reposts everywhere, then the comments inbox. Design choice: be explicit about what each platform allows (see section 10) and give a manual path (paste, file, copy and open) where an API is closed. The model layer was rewritten to accept a gateway URL and key (the owner has their own gateway) and a GitHub Copilot sign in instead of a single vendor key. Secrets for sign ins are stored encrypted in the database.
6. Studio and Queue: drafts with review and approval, thread builder, library, pillars, best times, slots, recycling. Then a feature list was published inside the app (Features page) because the owner could not find what had been added. Rule born from that: the app documents itself.
7. Second wave (analytics and engagement): nine features in one go. Planning approach: first build the shared groundwork alone (all tables in `SCHEMA`, the notify library, snapshot storage, the pulse, the navigation, the catalog entries with fixed routes), then hand independent areas to four parallel workers with strict file ownership and a written brief, then integrate, build once, run a full browser tour and fix what the tour showed. Details in 11.3.
8. Model usability: the owner's gateway has several models and some failed. Fixes: model list and dropdown, per request model choice, Copilot and gateway models in one list, request shape fallbacks, plain marker output instead of JSON, clear messages for gateway side problems.
9. Writing tools: the owner found Studio too complex and wanted storytelling formats chosen from a list, a topic, a model, and posts for LinkedIn and X in simple English with X under 280 characters. Result: the Write tab with 61 formats and 18 structures, then My style (tone, rules, memory, own formats, writing formats, skill files).
10. This document and `dev-tools/`.

### 11.1 Thought process on recurring decisions
- Prefer rules that can be explained and tested over model magic. A model is an optional layer on top, and every model feature degrades to something useful without it.
- Never invent numbers. Thin data gets a plain "we need more data" panel that says exactly what is missing and how to add it. Examples: best time needs about 20 posts, growth needs 14 days and 5 posts, first hour numbers only exist when a snapshot was taken early.
- Make writes idempotent. Imports, snapshots, alerts, leads from comments and comment capture all use unique keys or `on conflict` so repeating an action is safe.
- Respect platform limits and rules. No scraping, no auto engagement. Use official routes and the owner's own credentials. Where a route is closed, say so and offer the manual path.
- Cost awareness. Postiz call budget, X pay per read, model tokens (character budgets, caps, one extra call at most), and Neon/Vercel free plans shape many limits in the code.
- Keep logic and effects apart. Pure files for rules, small stores for SQL, thin routes, thin pages. This is what made large changes safe.
- One place per truth. The schema is `SCHEMA`; features are `features-catalog.ts`; model calls go through `lib/llm`; tabs are small components (`AnalyticsTabs`, `StudioTabs`).

### 11.2 Code style choices
- TypeScript strict; no `any` without a reason; `zod` at model boundaries.
- Functions have a doc comment that says why, not what. Comments explain decisions (limits, platform behaviour).
- Server components by default; client components only where interaction needs them.
- Plain CSS with tokens in `app/globals.css` (`--bg`, `--surface`, `--blue`, `--orange` and so on). A feature that needs more CSS ships its own file (`write.css`, `style.css`) imported by its page and prefixes its class names.
- Errors reach the person as sentences that say what happened and what to do, never a stack trace. API errors are `{ error: string }`.
- Names are plain English. Interface text uses "we" and "our".

### 11.3 Parallel workers (how the second wave was run)
- A brief file stated the repo rules, conventions, available helpers and the data reality, and each worker got a task with exact routes, UI labels and files it owned. Shared files (`db.ts`, `nav.tsx`, `layout.tsx`, `globals.css`, the catalog, README, package files) were off limits to workers; the lead pre created integration stubs (for example `lib/reports/schedule.ts` and `lib/insights/goals-load.ts`) so workers could import each other's future code.
- Workers must not run `next build` or the server (they share `.next`) and must not commit. They verify with `tsc` and `npm test` only. The lead builds once and runs the browser tour.
- The environment's stop hook demands commits, so finished areas were committed as soon as each worker reported, and unfinished ones went in as a clearly labelled work in progress commit.
- Lesson: this works when areas are independent and the interfaces are fixed first. Expect the lead to spend its effort on the contracts and on integration testing.

## 12. Engineering conventions

Files and imports
- `lib` files that have tests, and the files they import, use sibling imports with the `.ts` extension (`import { x } from "./y.ts"`) because the Node test runner does not resolve extensionless paths. Files that import `db`, `next` or the model (stores, services, routes) are outside the unit tested set and use normal imports. `tsconfig` has `allowImportingTsExtensions` for this.
- Path alias `@/*` points to the repo root and is used in `app/` and for imports from routes into `lib/`.
- Never import a database module from a pure file. If a pure function needs data, pass it in.

Pages
- Server page template: `export const dynamic = "force-dynamic"`, auth check, load data inside a try that turns a database error into the visible `note` box ("Database problem: ..."), render. In Next 16 `params` and `searchParams` are Promises.
- Page header: `.page-head` with `h1`, one sentence, and the tab component on the right.
- Always render honest empty states. A page must never crash because a table is empty or a service is down.
- Loading skeleton lives in `app/loading.tsx`.

Route handlers
- Auth first, then validate input and answer `400 { error }` for bad input, `502 { error }` when an outside service fails, `500` only for our own faults.
- Declare `export const maxDuration` for slow ones.
- Writes are idempotent where a repeat is plausible (use unique keys and `on conflict`).

Database code
- Plain SQL with the tagged template. Batch inserts with `sql(rows, ...columns)` (500 per statement). `db().json(value as never)` for jsonb. IDs are `crypto.randomUUID()` shortened to 14 hex characters. Always `await ensureSchema()` at the top of a store function.
- A SQL regular expression inside a TypeScript template string needs doubled backslashes (`\\d`), otherwise the backslash is eaten. This bit once in the backfill of `external_id`.

Client components
- `useToast()` for feedback (`tone`: ok, error, info), `useRouter().refresh()` after a write, `Icon` for icons, `Seg` for segmented controls and tab links.
- Autosave patterns keep the latest values in refs and flush before actions.
- Anything stored in `localStorage` is a convenience only and always wrapped in try and catch.

Copy
- Plain words, "we" and "our", no marketing language, no em dashes, no exclamation marks, no emoji, no markdown bold in the interface.

Adding things (checklists are in section 16).

## 13. Testing and verification

Layers, from fast to slow
1. Types: `npm run typecheck` (`tsc --noEmit`, strict).
2. Unit tests: `npm test` runs every `lib/**/*.test.ts` with Node's runner (273 tests at the time of writing, about 2 seconds). They cover: parsing (imports, followers, comments, bulk files, skill files), maths (ranges, benchmarks, goals, growth attribution, pace, curve, best times, slots across daylight saving, thread length, reading grade, X fitting), flows (draft status moves, quiet conversations), prompts (what the writer is told), the LLM layer against local mock HTTP servers (request shapes, fallbacks, streaming, key errors, unsupported model, model choice), email and Telegram against local servers, PDF building (valid header, odd characters, long text), encryption, and the feature catalog (links and enable text).
3. Production build: `npx next build` must pass. Turbopack reports type and route errors that `tsc` can miss.
4. Browser tests against fakes (`dev-tools/`, section "Run it" in its README): real Chromium drives the built app, which talks to a fake Postiz and a mock service server. Screenshots are saved and must be looked at: layout bugs (collapsed text, cut off columns, misaligned cards) only show there. Several real bugs were found this way (inline text where cards should be, a stale approval race, a layout query slowing every page).
5. Not tested: the real Postiz, Neon, X, LinkedIn, Copilot, Resend, Telegram and the owner's gateway. Everything about them was verified only by reading documentation and by mocks. Say so in every delivery, and ask for the exact error text when the owner reports a failure. Several fixes in this project were found only because the owner pasted a real error.

Habits that paid off
- Write the test with the pure function. When a bug is reported, reproduce it in a test or a mock first.
- Use deliberately awkward fakes: a model that only streams, one that refuses `max_tokens`, one that answers with greetings and closing remarks, one that says "Unsupported model".
- Before pushing: typecheck, tests, build, and for UI work one browser run with a screenshot review.
- Stale processes: a mock or app server from an earlier run can keep a port and answer with old behaviour. Free the port before a run (`fuser -k PORT/tcp`). This misled debugging twice.
- Do not run two builds at once in the same folder (`.next` is shared).
- Playwright: prefer specific selectors; a text selector like "LinkedIn post" can match page headers and pass too early. Wait for the element that proves the result.

## 14. Git, branches, pull requests and deployment

- Remote: `github.com/nishantabanik/Li-X-Analyzer`. Default branch `main`. Working branch for AI sessions: `claude/upbeat-cannon-2eyzlu`. Local folder of the owner: `.../apps/Li-X-Analyzer` on a Mac; the cloud sandbox uses `/home/user/Li-X-Analyzer`.
- Flow: commit small, push the branch, open a pull request into `main` when the owner asks, the owner merges. After a merge, the branch holds only merged history: bring it up to date with `git fetch origin main && git merge origin/main` (or restart the branch from main) before new work. Never push to `main` directly (blocked), never force push someone else's work, never rebase a branch the owner may have checked out.
- If a remote branch has commits you do not have (another session pushed the same request in parallel once), look at them first. Keep one implementation; do not overwrite silently.
- Commit message: a short imperative first line, a blank line, optional bullets, then the attribution lines the environment instructs.
- Pull request body: sections "What this adds", "Testing" (including the honest line that real services were not tried), and the footer the environment instructs. Check for a PR template file first.
- Merging is the owner's step. A merge attempt by the assistant was refused by the harness as a merge without review.
- Vercel: pushes to any branch build a preview; only the Production Branch (must be `main`) builds production. When the owner says a feature is missing, first check which deployment they are looking at (the Deployments list shows the commit of each; a deployment labelled Stale is an old one) and which domain, before debugging code. Missing variables are almost never the cause of a missing page.
- Secrets in git: if a commit contains real values (it happened with `.env.example`), do not push it; move the values to `.env.local`, drop the commit, tell the owner to rotate the values.

## 15. Problems met and how they were solved

| Problem | Cause | Fix |
| --- | --- | --- |
| Neon error "unrecognised setting channel_binding" | Neon's copy button adds `channel_binding=require` | `cleanDatabaseUrl` removes it |
| Slow queries and odd errors on Neon | Pooler does not keep prepared statements | `prepare: false` |
| Postiz 401 or empty data | Used the dashboard address as API base | `resolveBase` maps `platform.postiz.com` to `api.postiz.com/public/v1` |
| Hitting Postiz limit | 90 calls an hour | 30 second post cache, capped refreshes, pulse max 6 posts |
| App felt slow | Sequential queries and inserts, database far from functions | Batch inserts, `Promise.all`, region `fra1`, skeleton loading |
| Two requests creating tables at once failed | Race in `ensureSchema` | One shared promise |
| LinkedIn import found 50 posts of 1.5 years | Export lists at most 50 posts per table, two tables side by side were read as one, early imports stored wrong numbers | Parse by sheet, split side by side tables, merge per post, daily sheet fills the long range, one time cleanup block, guidance to export month by month |
| Duplicates on repeat imports | No natural keys | Keys (platform, day) and url, `greatest()` on conflict |
| `external_id` backfill matched nothing | `\d` lost inside a TypeScript template string | Doubled backslashes, verified against sample rows |
| Test runner could not load modules | Extensionless imports | `.ts` extensions in testable lib code |
| Median of quiet days wrong, charts dipped at partial periods | Logic bugs found by tests and screenshots | Fixed with tests; partial periods drawn dashed |
| Direct push to main refused | Protected branch | Branch plus pull request, owner merges |
| Merge conflict in `.env.example` with real secrets in it | Owner put real values in the template and committed | Back up, skip that commit, values to `.env.local`, rotate secrets |
| "Feature not visible" after merge | Looking at a stale or preview deployment; production branch setting | Check Deployments, commit shown, Production Branch = main |
| Gateway model list "fetch failed" | Gateway was `localhost`, unreachable from Vercel | Detect private addresses, explain, use a public tunnel |
| "Gateway did not answer with JSON" | Gateway answered with a stream or an HTML page | Read server sent events, report status, content type and first 200 characters |
| Models fail only with some request shapes | Gateways refuse `response_format`, `max_tokens`, or non streaming | Try other request shapes, remember what works |
| "Unsupported model mimo-auto" | The gateway maps our model name to a model its provider rejects | Detect and explain once; the fix is in the gateway |
| "Model did not return JSON" with a chatty model | Greeting, bold labels, closing remarks around the answer | Marker lines instead of JSON; tolerant parser; strip closing remarks |
| Copilot models missing in the list | Gateway was default so only its models were listed | Model list from every source, `source::name` values, per call provider |
| Copilot default model was the gateway's model name | Fallback to `GATEWAY_MODEL` | Default is `COPILOT_MODEL` or `gpt-4.1` |
| Approve right after typing undid the approval | A delayed autosave arrived after the action and demoted the status | Actions flush the save first; saves with no change do not demote |
| Every page slow after comments upgrade | Layout called a heavy count with follow up scanning | `newCount()` single query for the badge |
| Cards rendered as one line of text | Used inline elements where the card CSS needs `.l` and `.v` blocks | Use the card structure |
| Em dashes and curly quotes in model output | Models like them | Prompt rule plus `plainText` |
| X post over limit | Models ignore length | `fitX` at 279 using X weighting, one fix call |
| Wrong times for posts around clock changes | Naive offset maths | `zonedToUtc` with a second pass; tests across March 2026 |
| First hour numbers impossible from daily data | Postiz numbers are totals, Vercel cron is daily | Snapshots at each check, GitHub Actions every 15 minutes, never invent a value |
| Parallel workers colliding | Shared tree and `.next` | File ownership, no builds by workers, lead integrates |
| Stop hook asks for commits mid work | Environment rule | Commit finished areas, label work in progress |
| Shell helper `pkill -f` killed its own shell | Pattern matched the command line | Small script that skips its own pid (kept outside the repo) |
| Test debugging misled by old behaviour | Old mock server still bound to the port | Free ports before runs |
| Another session pushed the same Features page | Parallel sessions on one branch | Compare, keep one implementation, tell the owner |

## 16. Operations runbook

Daily jobs
- 06:00 UTC `/api/cron`: sync from Postiz, collect new X replies if the keys exist, send the weekly or monthly report if due, run the pulse once. Failures in one step never stop the others; the response lists each result.
- 06:20 UTC `/api/cron/advisory`: build the day's Advisory (and coach notes if a model exists).
- Every 15 minutes (GitHub Actions): `/api/cron/pulse`.
- To run any of them by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://APP/api/cron`.

When the owner reports...
- "Authentication failed for neondb_owner": the Vercel (or `.env.local`) `DATABASE_URL` still has the old password. Copy the new pooled string from Neon after a reset into all environments (Production, Preview, Development), redeploy.
- Gateway problems: press Test the gateway on Settings; read the message. 401 key; 404 URL or model; "cannot use the model" gateway setup; "could not be reached" with a localhost hint means a tunnel is needed.
- Copilot group shows a red note in the model list: sign in again, check the Copilot plan.
- No alerts: the check only sees posts of the last 36 hours; X posts only; the baseline needs 5 measured older posts per platform.
- Email does not arrive: the free Resend sender only delivers to the account owner's address.
- Cron did not run: Vercel logs show crons; check `CRON_SECRET` is set in Production.
- Postiz 429: wait; reduce refreshes.

Rotating secrets: new `SESSION_SECRET` signs everyone out and breaks stored sign ins (sign in again on Settings); new `CRON_SECRET` must be changed in Vercel and in the GitHub secret; new `APP_PASSWORD` takes effect on redeploy.

How to add a feature (checklist)
1. Decide route and tab. Add page, client parts and API under the area folders.
2. Pure logic in a `.ts` file with tests; stores and services separate.
3. Tables: add `create table if not exists` or `alter table ... if not exists` to `SCHEMA`.
4. Auth check on page and routes; validate input; friendly errors.
5. Honest empty and thin data states.
6. If a model is involved: go through `lib/llm`, cap tokens, degrade without a model.
7. If an outside service is involved: add a base url override variable and a fake in `dev-tools/`.
8. `lib/features-catalog.ts` entry (what, where, how to enable) and README table row.
9. `npm run typecheck`, `npm test`, `npx next build`, browser run with screenshots.
10. Commit, push, tell the owner what to merge and what was not tested live.

How to add an environment variable: use it in code, add it to `.env.example` (empty), to the README table, and to the "How to enable" text of the feature. Remind the owner to set it in Vercel and redeploy.

How to add a model provider: implement chat in `lib/llm/`, extend `llmStatus` and `chat` routing, add models to `/api/studio/models`, add a `source::` prefix in `choice.ts`.

## 17. Known limits and risks

- Real service behaviour is unverified. Treat the first live use of each integration as a test and ask the owner for exact error text.
- LinkedIn: no personal analytics through Postiz, no comment reading, no DMs, no profile viewers. Everything LinkedIn comes from exports and pasting.
- X: weekly account totals only (12 weeks), reads cost money, DMs are not read.
- Postiz: a scheduled post cannot be changed from this app.
- First hour numbers, growth curves and alerts need frequent checks and only exist for X posts.
- Copilot sign in is unofficial.
- Best time, growth and benchmarks need enough history and say so when they do not have it.
- Single password, no login rate limit, no per user history, no audit trail.
- Hobby plan limits on function duration and cron frequency.
- Free Neon plan scales to zero and has storage limits; snapshots are deleted after 180 days to stay small.
- The model can still produce a weak post. The checks catch length, dashes and reading level, not quality or truth. A human reads every post before it goes out; the approval flow exists for that.

## 18. Things the owner has not asked about but should know

1. Back up the database. Neon offers point in time restore and branches on the free plan within a short window. Before any risky schema change, create a Neon branch. Export `writing_assets` (their style files) now and then; they are hard to recreate.
2. Rotate the secrets that were pasted in chat (Neon password, Postiz key, any gateway key) and use random values for `SESSION_SECRET` and `CRON_SECRET` (`openssl rand -hex 32`). Use a password for `APP_PASSWORD` that is not guessable and different from the secrets.
3. Add login rate limiting if the app address becomes known. Today anyone who finds the address can try passwords without a limit.
4. Third party personal data (commenters' names, handles, messages, leads) is stored. Keep it to what is needed, delete leads and comments that are no longer useful, and do not paste confidential messages into the model if the gateway is not trusted: comments and pasted posts are sent to the model for suggestions and smart paste.
5. Platform rules. Keep human control on posting and engaging. Do not add auto liking, auto commenting, scraping or mass tagging. They can get accounts restricted.
6. Cost watch: model tokens (each write is one or two calls plus My style), X API reads and posts, Resend and Telegram are free at this volume. If the owner's gateway bills per token, tell them the size: about 2,000 to 3,500 tokens per post with style items on.
7. Dependencies: run `npm audit` now and then; Next, React and the PDF and Excel libraries get security updates. Test with the build before merging updates.
8. Vercel Production Branch must be `main`; deployment protection or preview password settings can hide previews.
9. Time zones: days in analytics are UTC days; the queue and the report use the zone saved on the Queue page. A different zone in the browser can make a time look off by hours.
10. GitHub Actions scheduled runs stop after 60 days with no repository activity. A weekly manual run or any commit revives them.
11. The `Features` page is the owner's manual. When it is out of date the owner loses trust fast, which has already happened once.
12. Keep `CLAUDE.md` short and current: it is the first thing the next AI reads.
13. If the owner wants more users later, this needs real accounts, per user data, and a rethink of the encrypted connections (one key from one secret today).
14. Accessibility and phones: a mobile top nav exists and layouts collapse below 980 px, but pages were checked mostly on desktop widths.

## 19. Ideas not built yet

Competitor tracking from public X data, multiple accounts and clients with white label reports, more platforms (Threads, Bluesky, Instagram), a public share link for a report, a weekly digest email of the Advisory, automatic recycling on a schedule, per post notes and tags, CSV export of all data, a first run guide, evaluation of drafts against past performance (train a simple score from our own posts), A/B comparison of two openings, saved prompts per format, import of a whole skills folder (zip), better image support (we do not store whether a post had an image, so image analysis is absent), and moving the mocks into a small test server shipped with `npm run dev:fake`.

## 20. Glossary

- Postiz: a social media scheduler (paid account). We use its public API to schedule and to read posts and X numbers.
- Channel: one connected account in Postiz (a LinkedIn profile or an X account).
- Sync: copying channels, posts and numbers from Postiz into our database.
- Advisory: the daily review. Coach notes: the optional model written part of it.
- Pillar: one of our main topics, tagged by keywords.
- Slot: a weekly posting time. Queue: approved drafts waiting for slots.
- Pulse: the frequent check of fresh posts. Snapshot: numbers of a post at one moment.
- Gateway: our own OpenAI style model endpoint that fronts several models.
- Skill file: a markdown instruction file for the writer.
- My style: tone, rules, memory, own formats, writing formats and skill files.
- Marker lines: the plain text answer format used by the Write tab.
- Class 5 level: about Flesch Kincaid grade 5; our target is at most 6.5.
- Stale deployment: a Vercel deployment that has been replaced by a newer one.

## 21. First day checklist for the new maintainer

1. Read `README.md`, `CLAUDE.md`, this file, then `lib/features-catalog.ts` and `lib/db.ts`.
2. `npm install`, `npm run typecheck`, `npm test` (expect all green), `npx next build`.
3. Set up the local fakes from `dev-tools/README.md` and run `dev-tools/e2e/tour.mjs`. Open the screenshots to see the product.
4. Open each page of the live app once as the owner would, starting with Features.
5. Ask the owner which of these are connected: Postiz, Neon, a model (gateway or Copilot), X keys, LinkedIn app, Resend, Telegram, GitHub secrets. The Features page shows Ready or Needs for each.
6. Check Vercel: Production Branch is `main`, variables are set, the latest production deployment matches the latest `main` commit.
7. Check the GitHub workflow runs (Actions tab) if frequent checks are wanted.
8. Agree the working style with the owner (section 2): short answers, honest limits, no secrets in chat, pull requests that they merge.
9. Pick the smallest useful next improvement, build it as in section 16, and update the catalog and README in the same change.

---

## Appendix A: pages and API routes

Pages
- `/`
- `/advisory`
- `/alerts`
- `/analytics`
- `/analytics/benchmarks`
- `/analytics/content`
- `/analytics/goals`
- `/analytics/growth`
- `/analytics/reports`
- `/bulk`
- `/calendar`
- `/comments`
- `/compose`
- `/features`
- `/import`
- `/leads`
- `/login`
- `/posts/[id]`
- `/queue`
- `/schedule`
- `/settings`
- `/studio`
- `/studio/[id]`
- `/studio/chat`
- `/studio/library`
- `/studio/pillars`
- `/studio/style`
- `/studio/write`
- `/targets`

API routes (all require the login cookie except the cron routes, which need the bearer secret, and login and logout)

| Route | Methods |
| --- | --- |
| `/api/advisory` | GET, POST |
| `/api/alerts` | POST, PATCH |
| `/api/bulk` | POST |
| `/api/calendar` | GET |
| `/api/channels` | GET |
| `/api/comments` | POST |
| `/api/comments/[id]` | PATCH, DELETE |
| `/api/comments/[id]/nudge` | POST |
| `/api/comments/[id]/reply` | POST |
| `/api/comments/[id]/suggest` | POST |
| `/api/comments/file` | POST |
| `/api/comments/sync` | POST |
| `/api/connect/copilot` | DELETE |
| `/api/connect/copilot/poll` | POST |
| `/api/connect/copilot/start` | POST |
| `/api/connect/gateway` | POST, DELETE |
| `/api/connect/gateway/models` | POST |
| `/api/connect/linkedin` | GET, DELETE |
| `/api/connect/linkedin/callback` | GET |
| `/api/cron` | GET |
| `/api/cron/advisory` | GET |
| `/api/cron/pulse` | GET |
| `/api/followers` | POST, DELETE |
| `/api/goals` | POST, DELETE |
| `/api/import` | POST |
| `/api/leads` | POST |
| `/api/leads/[id]` | PATCH, DELETE |
| `/api/login` | POST |
| `/api/logout` | POST |
| `/api/queue/fill` | POST |
| `/api/queue/recycle` | POST |
| `/api/queue/slots` | PUT |
| `/api/reports` | GET, POST, PUT |
| `/api/schedule` | POST |
| `/api/settings/test` | POST |
| `/api/studio` | POST |
| `/api/studio/[id]` | PATCH, DELETE |
| `/api/studio/[id]/action` | POST |
| `/api/studio/ai` | POST |
| `/api/studio/assets` | POST, PATCH, DELETE |
| `/api/studio/chat` | POST |
| `/api/studio/library` | POST, DELETE |
| `/api/studio/models` | GET |
| `/api/studio/pillars` | PUT |
| `/api/studio/settings` | PUT |
| `/api/studio/write` | POST |
| `/api/sync` | POST |
| `/api/targets` | POST |
| `/api/targets/[id]` | PATCH, DELETE |
| `/api/targets/[id]/engage` | POST |
| `/api/targets/suggest` | POST |
| `/api/templates` | GET, POST, DELETE |

## Appendix B: the prompts the writer receives

Base rules for the Write tab (`writeSystem(true)` in `lib/studio/write-prompt.ts`). With the simple English switch off, the two lines about Class 5 and speaking style are replaced by "Write clear, natural English in our own tone. Keep it easy to read." and the rest stays.

```
You write social media posts for one person.
- Use very simple English, like a Class 5 school book. Most sentences are under 12 words. Use everyday words. Avoid jargon. If a technical word is needed, explain it in a few simple words.
- Write the way we speak. Warm, plain and honest. Use "I" for personal stories.
- Never use em dashes or en dashes. Use a full stop or a comma instead.
- No emojis. No hashtags unless our own rules ask for them. Straight quotes only.
- Never invent facts, numbers, names, companies or results. Use only what we give you. If a detail is missing, keep the line general or use [brackets] for the missing detail.
```

After the base rules the system prompt gets, in this order: optional tone matching samples (when "match the tone of our past posts" is on), then the My style block (tone, rules, memory, skill files) ending with "The rules above about dashes, length and simple words always come first, even if one of the files says something else."

The user prompt (`writePrompt`) holds: the topic, the facts we gave (or "No extra facts were given, so keep it general and honest."), the story format with its example and "How to write it", the optional structure and the optional kind of writing, then the platform instructions (LinkedIn: strong first line, short lines with blank lines between short paragraphs, about 600 to 1,200 characters, one idea, end with one easy question; X: one post, at most 270 characters, the sharpest version, no thread) and the answer format:

```
Reply in exactly this format and write nothing else, no greeting and no notes:
===LINKEDIN===
(the LinkedIn post)
===X===
(the X post)
```

The fix prompt (`fixPrompt`) sends the current posts with a list of problems ("It is 301 characters. It must be at most 270.", "The reading level is grade 9.1. Use shorter sentences...", "It uses a dash...") and the same answer format.

Chat system prompt (`CHAT_SYSTEM` in `lib/studio/chat.ts`): our writing partner for LinkedIn and X; answer briefly; when asked for a post write it ready to paste; never invent facts; cannot see our numbers. It is preceded by the voice prompt (our best posts and measured habits such as median length, share of posts with questions or emoji, the playbook items to follow and avoid) and by the default My style items.

## Appendix C: thresholds and constants (where to change them)

| Rule | Value | File |
| --- | --- | --- |
| Postiz post cache | 30 seconds | `lib/postiz.ts` |
| Sync post refresh cap, recent window, X totals freshness | 40 posts, 21 days, 6 hours | `lib/sync.ts` |
| Pulse: posts per run, age window | 6 posts, 36 hours | `lib/pulse/service.ts` |
| Snapshot spacing | 8 minutes in pulse, 60 in sync; kept 180 days | `lib/pulse/store.ts` |
| Pace: taking off, slow, minimum impressions | at least 1.5 times expected, at most 0.5 between 60 and 480 minutes, 40 impressions | `lib/pulse/pace.ts` |
| Learned curve | needs 8 posts with snapshots over 24 hours | `lib/pulse/pace.ts` |
| Best time | 20 posts to start, prior worth 2 posts, at least 2 posts per hour and ratio 1.15 | `lib/studio/times.ts` |
| Recycling | older than 90 days, ratio 1.3, 60 characters, pool of 8 | `lib/studio/recycle.ts` |
| Content verdicts | strong 1.25, weak 0.75, 4 posts per group, 8 overall | `lib/insights/breakdown.ts` |
| Follower attribution | 14 days, 5 posts, 1.5 times noise | `lib/insights/followers.ts` |
| Quiet conversation | 3 days; follow up window 90 days | `lib/comments/quiet.ts`, `store.ts` |
| Lead needs attention | next step due, or no contact for 14 days | `lib/leads/stages.ts` |
| Targets per day | 5 | `lib/targets/rotation.ts` |
| X post limit | 279 (prompt asks 270), links count 23, wide characters 2 | `lib/studio/simple.ts`, `thread.ts` |
| Reading level | target 6.5, a fix is requested above 7.0 | `lib/studio/simple.ts` |
| Chat | last 8 messages, 4,000 characters each, answer 900 tokens | `lib/studio/chat.ts` |
| My style budget | 14,000 characters in Write, 6,000 in chat | `lib/studio/assets.ts` |
| Draft autosave, scheduled draft turns published | 900 ms, 30 minutes after its time | `app/studio/[id]/editor.tsx`, `lib/studio/store.ts` |
| Alerts check workflow | every 15 minutes | `.github/workflows/pulse.yml` |

## Appendix D: Postiz API as used

Base `https://api.postiz.com/public/v1`. Header `Authorization: <api key>` (the key itself, no Bearer prefix).

- `GET /integrations` returns channels (`id`, `name`, `identifier` such as `x` or `linkedin`, `picture`, `profile`, `disabled`).
- `GET /posts?startDate&endDate` returns `{ posts: [{ id, content (html), publishDate, state (QUEUE, PUBLISHED, ERROR...), releaseURL, integration: { id } }] }`.
- `POST /posts` with `{ type: "now" | "schedule", shortLink: false, date, tags: [], posts: [{ integration: { id }, value: [{ content, image: [] }], settings }] }`. One `value` entry per post of a thread. Settings: `{ __type: "x", who_can_reply_post: "everyone" }` or `{ __type: "linkedin", post_as_images_carousel: false }`.
- `GET /analytics/{channelId}?date=N` returns series `[{ label, data: [{ total, date }] }]` or `{ missing: true }`; for X it is used with N = 7, 14, ... 84 to build 12 weekly buckets (`lib/xaccount.ts` checks consistency).
- `GET /analytics/post/{postId}?date=N` returns series for one post; `summarizeSeries` collapses them to impressions, likes, comments (replies), shares (reposts, retweets, quotes), clicks, bookmarks using the latest data point.

End of document. If something here is wrong or missing, fix it in the same change that discovers it.
