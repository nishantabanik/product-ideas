# Li X Analyzer

One place to plan, write, schedule and measure posts on LinkedIn and X.

## What this app is for

Posting on LinkedIn and X works best when we write well, post at good times, answer comments quickly, and learn from our own numbers.
Li X Analyzer brings those jobs together:

- Measure how our posts perform, on both platforms, over any period.
- Create posts faster, in our own voice, with every draft checked against good practice.
- Schedule posts through Postiz, at the right times, with an approval step if we want one.
- Engage by answering comments from one inbox.
- Improve with a daily Advisory that reads our numbers and tells us what to do next.

It is built for one person or a small team (one shared password). It runs free on Vercel with a Neon database.
Posts are published through our own Postiz account. A language model is optional and only powers the writing helpers.

## Features and where to find them

The same list is inside the app, on the Features page (left menu), with a link to each feature.

| Area | Feature | Where |
| --- | --- | --- |
| Measure | Overview of both platforms | Overview |
| Measure | Analytics for any range, comparison with the previous period, likes, comments and reposts | Analytics |
| Measure | LinkedIn and X side by side, top posts table, post detail page | Analytics |
| Measure | Import LinkedIn and X exports (safe to repeat) | Import data |
| Measure | Daily Advisory, health scores, post audit, playbook, coach notes | Advisory |
| Measure | Post speed: first hour, growth curve, compared with the previous post | Analytics, click a post |
| Measure | Benchmarks: this month against last month, last year, our usual month and our best | Analytics, Benchmarks tab |
| Measure | Content analysis: which topics, formats, lengths and hooks work | Analytics, Content tab |
| Measure | Goals with progress and the pace we need | Analytics, Goals tab |
| Measure | Follower growth and the posts that came before our best gains | Analytics, Growth tab |
| Measure | Weekly or monthly report as PDF, by email if we want | Analytics, Reports tab |
| Create | Write a post: type a topic, pick one of 61 story formats and a structure, pick the model, get LinkedIn and X posts in simple English (needs a model) | Studio, Write tab |
| Create | My style: tone, way of writing, memory, own story formats, writing formats and skill files, chosen per post | Studio, My style tab; Write tab step 3 |
| Create | Studio board: ideas, drafts, review, approved, scheduled | Studio, Board tab |
| Create | Draft editor with a rules check and score | Studio, open a draft |
| Create | Write 3 versions in our own voice | Studio, open a draft |
| Create | Adapt one post to LinkedIn, a short X post and an X thread | Studio, open a draft |
| Create | X thread builder with character counters | Studio, X draft |
| Create | Hook and template library | Studio, Library tab |
| Create | Content pillars with performance per topic | Studio, Pillars tab |
| Create | Compose one post, now or later | Compose |
| Create | Bulk schedule from an Excel or CSV | Bulk schedule |
| Schedule | Calendar of all scheduled and published posts | Calendar |
| Schedule | Approval flow (optional, can be made mandatory) | Studio |
| Schedule | Best time to post (heat map per platform) | Queue |
| Schedule | Weekly queue slots and Fill the queue | Queue |
| Schedule | Run old winners again | Queue |
| Engage | Comments inbox for LinkedIn and X, reply from the app | Comments |
| Engage | Direct messages pasted into the same inbox | Comments, Messages filter |
| Engage | Reply templates | Comments, Templates |
| Engage | Reminders for conversations that went quiet | Comments, Follow up filter |
| Engage | Lead tracker from first contact to a deal | Leads |
| Engage | Target list with daily engagement and a streak | Targets |
| Engage | Alerts when a post takes off or starts slowly | Alerts |
| Set up | Model gateway (URL, key, model dropdown), GitHub Copilot sign in | Settings |
| Set up | X and LinkedIn connections with test buttons | Settings |
| Set up | Side advisor: chat on every page, answers for that page and runs the fix when it can (sync, X replies, Advisory) | Bottom right corner, every page |
| Automatic | Daily Postiz sync (06:00 UTC) and daily Advisory (06:20 UTC) | Runs by itself |

## A simple week with the app

1. Monday: open Advisory. Read the three actions for the week.
2. Studio: save ideas, write drafts with "Write 3 versions", fix what the rules check flags.
3. Send drafts for review, approve them, then press Fill the queue on the Queue page.
4. After posting: open Comments and answer people. Replies in the first hour matter most.
5. Once a month: export LinkedIn analytics and upload it on Import data.

## What each connection is needed for

| Connection | Needed for | Required |
| --- | --- | --- |
| Neon (Postgres) | Storing everything | Yes |
| Postiz | Scheduling, calendar, X numbers | Yes |
| A model (gateway or GitHub Copilot) | Coach notes, 3 versions, adapting, ideas, reply suggestions, smart paste | No |
| X developer keys | Reading and answering X replies | No |
| LinkedIn app | Sending LinkedIn replies from the app | No |

Without the optional ones the app still measures, schedules, checks drafts and shows best times.

## Setup

1. Database: create a free project at neon.tech and copy the connection string. Tables are created automatically on first use.
2. Postiz: Settings, Developers, Public API, copy the API key.
3. Copy `.env.example` to `.env.local` and fill it in. Never put real values in `.env.example`, it is committed to git.
4. `npm install`, then `npm run dev`, and open http://localhost:3000.
5. Log in with `APP_PASSWORD`, then open Overview and press Sync from Postiz.

### Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `POSTIZ_API_KEY`, `POSTIZ_API_URL` | Postiz access (cloud default is https://api.postiz.com/public/v1) |
| `APP_PASSWORD` | The login password |
| `SESSION_SECRET` | Long random string. Signs the login and encrypts saved connections |
| `CRON_SECRET` | Long random string. Protects the daily jobs |
| `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM` | optional | Email for reports and alerts (Resend free plan). The from address is optional |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | optional | Telegram messages for alerts |
| `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | Optional. X replies |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `APP_URL` | Optional. LinkedIn replies |
| `GATEWAY_API_URL`, `GATEWAY_API_KEY`, `GATEWAY_MODEL` | Optional. Same as typing them on the Settings page, which is easier |

Make long random strings with `openssl rand -hex 32`.

## Alerts and frequent checks

Vercel's free plan runs a job once a day. To watch fresh posts every 15 minutes (alerts, first hour numbers, growth curves), GitHub does it: in the repository open Settings, Secrets and variables, Actions, and add `APP_URL` (our Vercel address) and `CRON_SECRET` (same value as in Vercel). The workflow file `.github/workflows/pulse.yml` is already there. These checks use Postiz numbers, so they work for X posts, not for LinkedIn personal profiles. Postiz allows about 90 requests an hour, and each check uses at most six.

## Deploy on Vercel

1. Import the GitHub repo into Vercel and add the variables above under Project Settings, Environment Variables.
2. Deploy `main`. `vercel.json` runs functions in `fra1` (Frankfurt), next to a Neon project in `eu-central-1`.
   If Neon is elsewhere, change `regions` to the closest Vercel region.
3. After changing a variable, redeploy. Vercel only reads variables on a new deployment.

A model gateway running on our own computer (localhost) cannot be reached from Vercel. Use a public https address, for example a Cloudflare tunnel.

## Using the main parts

### Studio and Queue

- Studio is a board that takes a post from idea to published. Each draft has an editor with a score and tips, three AI versions, an adapt button and, for X, a thread builder.
- Approval is optional. Turn on "Require approval before anything is scheduled" on the board to force Send for review then Approve.
- Pillars: add our three to five topics with keywords. Every post is tagged by keyword and we see which topics earn the most.
- Queue: set weekly slots per platform and our time zone. Approved drafts take the next free slot, and times already taken in Postiz are skipped.
- Best time to post needs about 20 posts with impressions. Before that the page shows common starter times and says so.
- A scheduled post is locked in Studio. To change it, edit it in Postiz.

### Comments

- X: replies are read from our X account and answered from the app. X bills the API per request, so only new replies are read.
- LinkedIn: LinkedIn does not allow apps to read comments on a personal profile. We capture them by pasting, adding one, or uploading a file.
  Replying from the app needs the LinkedIn connection and the link from "Copy link to comment". Otherwise the card copies the reply and opens the comment.

### Model connection

- Gateway: on Settings enter the gateway API URL and key, press Load models, pick a model from the dropdown, press Save gateway, then Test the model.
  OpenAI style gateways work by default. Anthropic style works when the URL ends in /messages.
- GitHub Copilot: Settings, Sign in with GitHub, type the shown code on GitHub. This is unofficial and can stop working at any time.
- Saved connections are encrypted in our database with a key made from `SESSION_SECRET`. If that value changes, we sign in again.

### LinkedIn data

LinkedIn's export has a daily sheet and a top posts sheet (at most 50 posts per table).
Daily numbers fill the charts for the whole range. To capture more posts, export shorter ranges and upload the files together.
Nothing is counted twice. When two files disagree the higher number is kept, so the order of uploads does not matter.

### Bulk file format

First row is the header. Columns: `date` (like 2026-10-12), `time` (optional, default 09:00), `platform` (x, linkedin or both), `content`.
A sample is at `/bulk-template.csv`. Rows with a past date, a missing field, an X post over 280 characters or a duplicate are skipped.

## Known limits

- Postiz only knows posts published through Postiz. Posts written directly on LinkedIn or X come in through Import data, and X also as account totals.
- LinkedIn comments cannot be read automatically (a closed permission for personal profiles).
- The Postiz public API allows about 90 requests per hour, so lists are cached for a short time.
- The Copilot sign in is not an official integration.
- Platforms do not publish their ranking rules. The playbook is a set of hypotheses, and our own numbers decide.

## For developers

- Stack: Next.js 16 (App Router), TypeScript, Postgres (`postgres` driver), Vercel cron.
- `npm test` runs the unit tests. `npm run typecheck` checks types.
- Layout: `app/` pages and API routes, `lib/` logic (`lib/advisory`, `lib/comments`, `lib/llm`, `lib/studio`), `lib/features-catalog.ts` is the list shown on the Features page.
- `EXPORT_INSTRUCTIONS.md` is the full handover document for anyone (or any AI) taking over the project. `dev-tools/` holds fake services and browser tests for running everything without real accounts.
- When we add a feature, add a line to `lib/features-catalog.ts` and to the table above. A test checks that every link in the catalog leads to a real page.
