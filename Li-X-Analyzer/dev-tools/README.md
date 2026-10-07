# dev-tools: run and test the app without any real account

Nothing here is used in production. These files let a person or an AI run the whole app on one machine against fake services, so changes can be checked end to end before they are pushed. No real keys are involved: every key below is a made up test value.

## What is here

| File | What it is |
| --- | --- |
| `fake-postiz.mjs` | A fake Postiz API on port 4010 (key `testkey`). Serves channels, 60 days of LinkedIn and X posts with text dependent numbers, per post analytics, account analytics, and accepts schedule requests (it prints each one as `POST_POSTS ...`). Also adds two fresh X posts (`pnew1` doing great, `pnew2` slow) so Alerts can be tested. |
| `mock-services.mjs` | One server on port 4030 that fakes: an OpenAI style gateway (`/v1/chat/completions`, `/v1/models`, key `secret-key`), GitHub device sign in and Copilot (`/login/device/code`, `/copilot/...`), the X API (`/2/users/me`, mentions, tweets), Resend (`/emails`) and Telegram (`/bot.../sendMessage`). Model names change behaviour: `claude-free` answers "Unsupported model", `claude-Code` answers chattily (greeting, bold labels, closing remark). `/__log` returns the request paths it saw. |
| `e2e/*.mjs` | Browser tests with Playwright. See the table below. |
| `gen-linkedin-export.cjs` | Writes a realistic LinkedIn analytics export (.xlsx) for testing the importer. |
| `sample-skill.md` | A tiny skill file for testing the skill upload on My style. |

## Run it

1. A local Postgres 15 or newer. Create a database, for example `createdb lix`.
2. `npm install`, then `npm install --no-save playwright-core`. You also need a Chromium or Chrome binary, and `CHROMIUM_PATH` pointing at it.
3. Create `.env.local` (ignored by git) with:
   ```
   DATABASE_URL=postgres://USER:PASS@127.0.0.1:5432/lix?sslmode=disable
   POSTIZ_API_KEY=testkey
   POSTIZ_API_URL=http://localhost:4010/public/v1
   APP_PASSWORD=pw123
   SESSION_SECRET=testsecret
   CRON_SECRET=cronsecret
   ```
4. Start the fakes in two terminals: `node dev-tools/fake-postiz.mjs` and `node dev-tools/mock-services.mjs`.
5. Build and start the app with the fakes wired in (one line):
   ```
   npx next build && GATEWAY_API_URL=http://localhost:4030/v1 GATEWAY_API_KEY=secret-key GATEWAY_MODEL=mock-model X_API_BASE=http://localhost:4030 X_API_KEY=a X_API_SECRET=b X_ACCESS_TOKEN=c X_ACCESS_SECRET=d RESEND_API_BASE=http://localhost:4030 RESEND_API_KEY=rk NOTIFY_EMAIL_TO=me@example.com TELEGRAM_API_BASE=http://localhost:4030 TELEGRAM_BOT_TOKEN=tok TELEGRAM_CHAT_ID=42 GITHUB_BASE_URL=http://localhost:4030 GITHUB_API_URL=http://localhost:4030 npx next start -p 3100
   ```
6. Run a browser test: `CHROMIUM_PATH=/path/to/chromium node dev-tools/e2e/tour.mjs ./shots`. Screenshots land in `./shots`. Open them to check how the pages look.

Tables are created by the app on first use, so an empty database is fine. Between runs, clear the tables a test fills (for example `delete from comments; delete from drafts;`), because the tests do not clean up.

## The browser tests

| Test | What it covers |
| --- | --- |
| `tour.mjs` | Sync, Alerts (check now, badges, email and Telegram sent), post speed page, every Analytics tab, goals, follower numbers, the report PDF and email, Comments (messages, templates, reminders, Mark as lead), Leads, Targets, and a link check of every page listed on Features. |
| `studio-and-queue.mjs` | Ideas, drafts, three versions, review and approval, scheduling to the fake Postiz, an X thread (two posts), pillars, library, queue slots and Fill the queue. |
| `my-style-and-write.mjs` | My style items and a skill upload (pass the sample file as the second argument), our own format in the Write tab, and a check that tone, rules, memory, skill, format and writing format reach the model. |
| `models-and-copilot.mjs` | The model list before and after a Copilot sign in, and that a Copilot pick is sent to Copilot. |
| `write-api-models.mjs` | The Write API against a normal, a chatty and an unsupported model. |
| `comments-and-settings.mjs` | Settings sign in with Copilot, X sync, pasting LinkedIn comments, suggested replies, replying on X. |
| `chat.mjs` | The AI chat, on its own page and next to a draft. |

## Rules for these tools

- Keep them free of real values. Add new fakes here when a new outside service is added.
- When a test fails because an old mock process is still running on the port, stop the old one first. This cost real time once: a stale mock kept answering with old behaviour.
