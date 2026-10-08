# daily-app-scheduler

A personal daily log that runs on your own Mac, for free:

- **Garmin**: sleep (bedtime, wake-up time, sleep score, deep/REM/light), runs and workouts, steps, resting heart rate, stress, Body Battery.
- **Pomodoro timer**: deep-work and break sessions, logged automatically when they finish.
- **Google Calendar and Google Meet**: your meetings, Join buttons, and new Meet meetings created from the app.
- **Outlook Calendar**: your meetings, read-only.
- **Today** view with a timeline of the whole day, a **History** view with trends, manual entries, and CSV export.

Everything is stored in a local SQLite file (`data/daily.db`). Nothing is sent anywhere except the calls to Garmin and your calendar links.

## 1. First start

The app needs Python 3.12, but you don't have to install it yourself: `run.sh` uses the free tool
[uv](https://docs.astral.sh/uv/) to download a private Python 3.12 into this folder's `.venv/`
(your Mac's own Python is not touched). In Terminal:

```bash
cd /Users/banik/Desktop/Agentic-Automations/.000-my-learnings/001-claude-code/daily-app-scheduler
./run.sh
```

The first run installs uv (into `~/.local/bin`), Python 3.12 and the dependencies, and creates your `.env` file. The app opens at http://localhost:8501.
Stop it with `Ctrl+C`; start it again any time with `./run.sh`.

## 2. Connect Google Calendar and Google Meet

This uses Google's official Calendar API (free). It reads the calendars you choose and lets the app create
Google Meet meetings. One-time setup, about 10 minutes. Use the Google account whose calendar you want.

1. Open https://console.cloud.google.com → project picker at the top → **New project** → name it `daily-app` → **Create**, and select it.
2. Open https://console.cloud.google.com/apis/library/calendar-json.googleapis.com → **Enable**.
3. Open https://console.cloud.google.com/auth/overview → **Get started**: App name `Daily App`, your email as support email →
   Audience **External** → your email as contact → agree → **Create**.
4. Left menu **Audience** → under **Test users** click **Add users** → add the Gmail address you will sign in with → **Save**.
   (Without this, sign-in fails with *"Access blocked: Daily App has not completed the Google verification process"*.)
   Optional: if **Publish app** is clickable on the same page, click it → Confirm. Otherwise the app stays in "Testing" mode,
   which works fine but Google signs you out after 7 days; then just run `./run.sh google` again.
5. Left menu **Clients** → **Create client** → Application type **Desktop app** → **Create** → **Download JSON**.
   Rename the file to `google_credentials.json` and put it in this folder (it is git-ignored).
6. In Terminal, in this folder:

   ```bash
   ./run.sh google
   ```

   Your browser opens. Choose your account. If Google says *"Google hasn't verified this app"*, click
   **Advanced** → **Go to Daily App** (it is your own app) → **Continue**.
7. Start the app (`./run.sh`), open the **Setup** tab, pick the calendars to sync, click **Save and sync**.

### Outlook Calendar

**Way 1, recommended: sign in with Microsoft** (read-only, works for work/school accounts)

1. In Terminal, in this folder: `./run.sh outlook`
2. It prints: *To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code ABCD1234*.
3. Open **microsoft.com/devicelogin**, type the code, choose your Outlook account, sign in, click **Continue / Accept**.
4. Terminal says *Connected*. In the app click **Sync now**. Teams links show up as **Join**.

If Microsoft says **"Need admin approval"**, your company blocks outside apps: use Way 2 or ask IT to allow
*Microsoft Graph Command Line Tools*. For a personal Outlook.com account you can also register your own app at
portal.azure.com → App registrations → New registration (accounts in any organization **and personal Microsoft
accounts**) → Authentication → *Allow public client flows* = Yes → API permissions → Microsoft Graph → Delegated →
`Calendars.Read`, then put its *Application (client) ID* in `.env` as `MS_CLIENT_ID=` and run `./run.sh outlook` again.

**Way 2: publish the calendar as a link**

1. Open **outlook.office.com** (work) or **outlook.live.com** (personal) in the browser (not the Mac app).
2. Gear icon top right → **Calendar** → **Shared calendars**.
3. Under **Publish a calendar**: choose **Calendar**, choose **Can view all details** → **Publish**.
4. Click the **ICS** link → **Copy link** → app **Setup** tab → **Outlook Calendar** → paste → **Save and test**.

Also set `TIMEZONE` in `.env` (e.g. `Europe/Berlin`, `Asia/Kolkata`) so all times line up.

## 3. Connect Garmin

Put `GARMIN_EMAIL` and `GARMIN_PASSWORD` in `.env`, then run once:

```bash
./run.sh login
```

If Garmin emails you a verification code, type it in. A login token is saved to `data/garmin_tokens/`, and the app uses that from then on.
If Garmin sync ever starts failing with a login error, just run this command again.

### Load your Garmin history (e.g. the last year)

Normal syncs only pull the last week. To load a year: **Setup** tab → **Garmin** → set *Days of history* (365) →
**Load Garmin history**, or in Terminal:

```bash
./run.sh history 365
```

Workouts arrive in seconds; sleep and daily stats need one request per day, so a year takes roughly 5 to 10 minutes.
If it stops, run it again: days already loaded are skipped. Want more? Use 730 or 1460 days.

Note: Garmin has no free official API for personal use, so this uses the community
[`garminconnect`](https://github.com/cyberjunky/python-garminconnect) library. If Garmin changes its website and sync breaks,
update it with `./run.sh update`.

## 4. Daily use

- The app syncs automatically when you open it (at most every `AUTO_SYNC_MINUTES`). Use **Sync now** in the sidebar any time.
- Garmin data appears after your watch has synced to the Garmin Connect phone app.
- **Pomodoro clock** (round, top-right): click **Start**, type what you're working on, then **Start cycle**.
  A cycle is 3 × 25 min focus with 5 min short breaks between them and a 15 min long break at the end; it moves
  on by itself (a soft chime at each switch) and keeps going even if you close the tab. When the cycle ends you hear a
  short birdsong and can start another cycle. **Stop** logs the time so far, **✕** cancels. Change the lengths and the
  number of rounds under **Pomodoro settings** in the sidebar.
- **Thought of the moment** (sidebar): 8 quotes on discipline, resilience, focus and motivation that rotate every
  15 seconds; every hour a completely new set.
- **Movement nudge**: after 60 minutes of focus (or, if you choose, after every 2 Pomodoro cycles) the app suggests a quick
  exercise (jumping jacks, push-ups, pull-ups, stairs, ...) at the next break, never in the middle of a focus session.
  **Done** logs it as a movement break, **In 10 min** snoozes. A Garmin workout counts too. Set it under Pomodoro settings.
- **Background sounds** (**Sounds**, top right above the clock): two focus-music tracks with a 16 Hz pulse
  (the technique brain.fm's research is based on; generated in the app), Rain, Ocean waves, Forest birds, Brown noise,
  White noise, Calm music (study) and a Meditation drone & bowl, or your own MP3/WAV/M4A/AAC/OGG files (upload them in
  the same menu, or copy them into `data/sounds/` in Finder). Choose to play them during focus sessions only, during the
  whole Pomodoro (focus and breaks), or always. Volume Low/Medium/High for the built-in sounds. brain.fm itself has no
  public API, so the menu has a button that opens it in a new tab (needs their subscription).
- **Open rooms**: a long standing meeting such as an all-day *Group Study* Meet stays in the Today table (with its
  Join link) but is left out of the timeline chart and the meeting totals. Click
  **Join** on it in the **Meetings** tab and only the time until you click **Leave** is logged (as *Study room*).
  Meetings of 6+ hours are treated as open rooms automatically; choose them yourself in **Setup → Open rooms**.
- **Meetings** tab: upcoming meetings with a **Join** button for their Google Meet link, and **Join + timer** to also start a
  focus Pomodoro. Under **Start a new Google Meet** pick a calendar, duration and (optional) people to invite; it creates the
  calendar event with a Meet link and emails the invites. With *Run a Pomodoro in this meeting* ticked, the focus timer starts
  at the same time and the invite explains the focus/break rhythm, so it works as a co-working session. (The timer runs in this
  app; Google Meet itself has no way to show a timer from outside.)
- **Insights** tab: this week's goals (deep work hours, workouts, runs, strength, sleep) with progress bars, focus
  streak and deep-work-goal streak, a 12-month deep-work heatmap, hours per **topic**, and sleep / energy patterns
  (best focus hours, deep work after good vs short nights, with vs without workouts, strongest weekday).
- **Topics**: pick a topic / project when you start a Pomodoro (Start → Topic / project); hours per topic appear in Insights.
- **Weekly report**: Insights → Weekly report → **Create PDF**. With Gmail details in `.env` (Setup → Weekly report
  email) it is also emailed every Monday at 08:00.
- **Mac notifications**: break time, back to focus, cycle complete, meeting in 5 minutes, time to move. They come from a
  small helper that `./run.sh` starts next to the app, so they work even when the browser tab is in the background or
  closed. The first time, allow notifications for *Script Editor* in System Settings → Notifications.
- **Start with the Mac**: `./run.sh autostart on` runs the app in the background from login; open it at
  http://localhost:8501. `./run.sh autostart off` turns that off.
- **Activity ticks**: the Today tab shows ✅ / ⬜ for each activity type (running, strength training, stairs, jump rope, ...).
  The **Activities** tab shows a week grid with a ✅ per day, lets you choose which activity types to tick, and with
  **Show workout records** lists every workout (distance, heart rate, calories) plus workouts per month.
- **Add entry**: log anything by hand (reading, commute, a meeting not in your calendar).
- **History**: hours of deep work / meetings / exercise per day, sleep table, steps, CSV download.

Backfill older data (e.g. last 30 days):

```bash
./run.sh sync 30
```

## Get updates

When new changes are pushed to GitHub:

```bash
git pull
./run.sh
```

`run.sh` installs any new packages automatically on every start.

## Files

| File | What it does |
|---|---|
| `app.py` | The Streamlit app (all screens) |
| `pomodoro.py` | Timer and cycle logic, stores the running timer in the database |
| `rooms.py` | Open rooms: hide all-day meetings, log only the time you join |
| `quotes.py` | Thought of the moment |
| `insights.py` | Daily totals, goals, streaks, topics, sleep and energy patterns |
| `report.py` | Weekly PDF report and email |
| `outlook_api.py` | Outlook calendar through Microsoft sign-in (Graph API) |
| `worker.py` | Background helper: timer, notifications, sync, weekly email |
| `notifier.py` | Mac notifications |
| `movement.py` | Movement nudges |
| `sounds.py` | Built-in background sounds and your own sound files |
| `google_api.py` | Google Calendar API: your calendars, meetings, creating Google Meet meetings |
| `google_login.py` | One-time Google sign-in (`./run.sh google`) |
| `calendar_sync.py` | Reads ICS calendar links (Outlook, or Google without the API), including recurring meetings |
| `garmin_sync.py` | Reads sleep, workouts and daily stats from Garmin Connect, and loads history |
| `activity_types.py` | Groups Garmin activity types (e.g. treadmill / trail running → Running) |
| `garmin_login.py` | One-time Garmin login (handles the verification code) |
| `sync.py` | Runs both syncs, also usable from the command line |
| `db.py` | SQLite storage |
| `config.py` | Reads settings from `.env` |
