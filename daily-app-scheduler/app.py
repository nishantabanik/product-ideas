"""Daily App: Garmin data, Pomodoro timer and calendar meetings in one log.

Start it with:  streamlit run app.py
"""

import datetime as dt
import html
import io
import re
import math
import time
import wave

import json

import altair as alt
import pandas as pd
import streamlit as st

import activity_types
import calendar_sync
import db
import garmin_sync
import insights
import notifier
import outlook_api
import report
import google_api
import movement
import pomodoro
import quotes
import rooms
import sounds
import sync
import worker
from config import AUTO_SYNC_MINUTES, TZ

st.set_page_config(page_title="Daily App", page_icon="⏱️", layout="wide")
st.html("<style>[data-testid='stAudio']{display:none}</style>")  # sounds play without showing a player

KIND_LABELS = {
    "focus": "Deep work",
    "meeting": "Meeting",
    "room": "Study room",
    "exercise": "Exercise",
    "sleep": "Sleep",
    "break": "Break",
    "movement": "Movement break",
    "other": "Other",
}
KIND_COLORS = {
    "Deep work": "#4C78A8",
    "Meeting": "#F58518",
    "Study room": "#72B7B2",
    "Exercise": "#54A24B",
    "Sleep": "#8E6BB8",
    "Break": "#B9B9B9",
    "Movement break": "#FF9DA6",
    "Other": "#E45756",
}


# ---------- helpers ----------

def day_bounds(day: dt.date) -> tuple[int, int]:
    start = dt.datetime.combine(day, dt.time(), TZ)
    end = dt.datetime.combine(day + dt.timedelta(days=1), dt.time(), TZ)
    return int(start.timestamp()), int(end.timestamp())


def local(ts: int) -> dt.datetime:
    return dt.datetime.fromtimestamp(ts, TZ)


def hhmm(ts: int | None) -> str:
    return local(ts).strftime("%H:%M") if ts else "–"


def fmt_minutes(minutes: float) -> str:
    minutes = int(round(minutes))
    return f"{minutes // 60}h {minutes % 60:02d}m" if minutes >= 60 else f"{minutes}m"


def minutes_by_kind(activities: list[dict], start_ts: int, end_ts: int) -> dict[str, float]:
    """Minutes per kind inside the window. Overlapping meetings are counted once."""
    intervals: dict[str, list[tuple[int, int]]] = {}
    for a in activities:
        s, e = max(a["start_ts"], start_ts), min(a["end_ts"], end_ts)
        if e > s:
            intervals.setdefault(a["kind"], []).append((s, e))
    totals = {}
    for kind, spans in intervals.items():
        spans.sort()
        total, cur_s, cur_e = 0, *spans[0]
        for s, e in spans[1:]:
            if s > cur_e:
                total += cur_e - cur_s
                cur_s, cur_e = s, e
            else:
                cur_e = max(cur_e, e)
        totals[kind] = (total + cur_e - cur_s) / 60
    return totals


def details_text(a: dict) -> str:
    d = a.get("details") or {}
    parts = []
    if a["kind"] == "sleep":
        if d.get("score"):
            parts.append(f"score {d['score']}")
        for key, label in (("deep_min", "deep"), ("rem_min", "REM"), ("light_min", "light"), ("awake_min", "awake")):
            if d.get(key):
                parts.append(f"{label} {fmt_minutes(d[key])}")
    elif a["kind"] == "exercise":
        if d.get("distance_km"):
            parts.append(f"{d['distance_km']} km")
        if d.get("avg_hr"):
            parts.append(f"avg HR {int(d['avg_hr'])}")
        if d.get("calories"):
            parts.append(f"{int(d['calories'])} kcal")
    elif a["kind"] in ("focus", "break") and d.get("completed") is False:
        parts.append("stopped early")
    if d.get("topic"):
        parts.append(f"topic: {d['topic']}")
    if d.get("location"):
        parts.append(d["location"])
    return " · ".join(parts)


RATE = 22050


def _wav(samples: list[float]) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(int(max(-1.0, min(1.0, x)) * 20000).to_bytes(2, "little", signed=True) for x in samples))
    return buf.getvalue()


def _silence(seconds: float) -> list[float]:
    return [0.0] * int(RATE * seconds)


def _chirp(f0: float, f1: float, seconds: float, volume: float = 0.5) -> list[float]:
    """One bird-like chirp: a quick pitch glide with a soft envelope and a little warble."""
    n, phase, out = int(RATE * seconds), 0.0, []
    for i in range(n):
        t = i / n
        freq = f0 + (f1 - f0) * t + 120 * math.sin(2 * math.pi * 35 * i / RATE)
        phase += 2 * math.pi * freq / RATE
        out.append(volume * math.sin(math.pi * t) ** 2 * math.sin(phase))
    return out


def bird_wav() -> bytes:
    """A short, sweet birdsong for the end of a Pomodoro cycle."""
    song = []
    for _ in range(2):
        song += _chirp(3200, 4400, 0.09) + _silence(0.05) + _chirp(3400, 4700, 0.09) + _silence(0.22)
        for _ in range(6):
            song += _chirp(4300, 3600, 0.035, 0.35) + _silence(0.02)
        song += _silence(0.25) + _chirp(2800, 4200, 0.12) + _silence(0.06) + _chirp(3000, 4600, 0.1) + _silence(0.45)
    return _wav(song)


def chime_wav() -> bytes:
    """A soft two-note chime between focus and break."""
    notes = []
    for freq in (660, 880):
        n = int(RATE * 0.6)
        notes += [
            0.35 * math.exp(-5 * i / n) * (math.sin(2 * math.pi * freq * i / RATE) + 0.25 * math.sin(4 * math.pi * freq * i / RATE))
            for i in range(n)
        ]
    return _wav(notes)


def show_sync_results(results: list[tuple[str, str]]) -> None:
    for level, message in results:
        if level == "ok":
            st.success(message)
        elif level == "warn":
            st.warning(message)
        else:
            st.caption(message)


# ---------- sidebar ----------

@st.fragment(run_every=quotes.SLIDE_SECONDS)
def quote_card() -> None:
    index, items = quotes.current(dt.datetime.now(TZ))
    text, author, theme = items[index]
    dots = "".join(
        f"<span style='display:inline-block;height:6px;border-radius:3px;margin-right:5px;"
        f"width:{18 if i == index else 6}px;background:currentColor;opacity:{0.85 if i == index else 0.25};"
        f"transition:all .4s'></span>"
        for i in range(len(items))
    )
    st.html(f"""
<style>@keyframes thoughtIn {{ from {{ opacity: 0; transform: translateY(4px) }} to {{ opacity: 1; transform: none }} }}</style>
<div style="border:1px solid rgba(128,128,128,.28);border-radius:14px;padding:16px 16px 14px 16px;margin:0 0 6px 0">
  <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.55;margin-bottom:10px">Thought of the moment</div>
  <div style="font-size:{16 if len(text) <= 100 else 14}px;line-height:1.5;min-height:7.5em;animation:thoughtIn .6s ease">“{html.escape(text)}”</div>
  <div style="margin:12px 0 10px 0;line-height:0">{dots}</div>
  <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.6">
    – {html.escape(author)} · {theme}</div>
</div>""")


def sidebar() -> tuple[dt.date, dict]:
    with st.sidebar:
        quote_card()
        st.divider()
        today = dt.datetime.now(TZ).date()
        day = st.date_input("Day", value=today, max_value=today, format="YYYY-MM-DD")

        if st.button("Sync now", width="stretch"):
            with st.spinner("Syncing calendars and Garmin..."):
                st.session_state.sync_results = sync.run_all()
        last = db.get_meta("last_sync")
        st.caption(f"Last sync: {local(int(float(last))).strftime('%d %b %H:%M') if last else 'never'}")
        if st.session_state.get("sync_results"):
            show_sync_results(st.session_state.sync_results)

        with st.expander("Pomodoro settings"):
            c1, c2 = st.columns(2)
            settings = {
                "focus": c1.number_input("Focus", 1, 180, 25, help="minutes"),
                "short": c2.number_input("Short break", 1, 60, 5, help="minutes"),
                "long": c1.number_input("Long break", 1, 90, 15, help="minutes"),
                "rounds": c2.number_input("Rounds", 1, 8, 3, help="focus sessions per cycle"),
            }
            modes = list(movement.MODES)
            st.selectbox(
                "Movement nudge", modes, index=modes.index(movement.mode()), format_func=movement.MODES.get,
                key="move_mode_w", on_change=lambda: db.set_meta("move_mode", st.session_state.move_mode_w),
                help="Shown at the next break, never in the middle of a focus session",
            )
    return day, settings


def auto_sync() -> None:
    if st.session_state.get("auto_sync_done"):
        return
    st.session_state.auto_sync_done = True
    last = db.get_meta("last_sync")
    setup_unchanged = db.get_meta("last_sync_setup") == sync.setup_fingerprint()
    if last and setup_unchanged and time.time() - float(last) < AUTO_SYNC_MINUTES * 60:
        return
    with st.spinner("Syncing calendars and Garmin..."):
        st.session_state.sync_results = sync.run_all()


# ---------- Pomodoro clock (top-right) ----------

FOCUS_COLOR, BREAK_COLOR = "#4C78A8", "#54A24B"


def ring_html(fraction: float, label: str, sub: str, color: str) -> str:
    """A small round progress ring drawn with CSS (Streamlit strips inline SVG)."""
    degrees = 360 * max(0.0, min(1.0, fraction))
    track = "rgba(128,128,128,0.18)"
    mask = "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))"
    return f"""
<div role="img" aria-label="{label} {sub}" style="position:relative;width:124px;height:124px;margin:0 auto">
  <div style="position:absolute;inset:0;border-radius:50%;
              background:conic-gradient({color} {degrees:.1f}deg, {track} 0);
              -webkit-mask:{mask};mask:{mask}"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
    <div style="font-size:26px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums">{label}</div>
    <div style="font-size:11px;opacity:0.6;margin-top:6px">{sub}</div>
  </div>
</div>"""


def focus_sessions_today() -> int:
    start, end = day_bounds(dt.datetime.now(TZ).date())
    return sum(
        1 for a in db.activities_between(start, end)
        if a["kind"] == "focus" and a["details"].get("completed")
    )


def advance_timer() -> bool:
    """Move the cycle on (also catches up after the app was closed) and queue the sound.

    When the background helper runs (started by run.sh) it moves the timer and
    hands us what happened; otherwise the app does it itself.
    """
    events = worker.pop_ui_events() if worker.alive() else pomodoro.tick()
    if "cycle_done" in events:
        st.session_state.sound = "bird"
    elif events:
        st.session_state.sound = "chime"
        st.session_state.toast = "Break time." if events[-1] == "focus_done" else "Back to focus."
    return bool(events)


def start_cycle(task: str, settings: dict, topic: str | None = None) -> None:
    pomodoro.start_cycle(task, settings["focus"], settings["short"], settings["long"], settings["rounds"], topic)


NEW_TOPIC = "+ New topic..."


def topic_picker() -> str:
    known = pomodoro.topics()
    current = db.get_meta("current_topic") or ""
    options = ["No topic", *known, NEW_TOPIC]
    index = options.index(current) if current in options else 0
    choice = st.selectbox("Topic / project", options, index=index, key="topic_choice")
    if choice == NEW_TOPIC:
        return st.text_input("New topic", key="topic_new", placeholder="e.g. Statistics, Thesis, German").strip()
    return "" if choice == "No topic" else choice


@st.fragment(run_every=1)
def running_clock() -> None:
    if advance_timer():
        st.rerun()
    timer = pomodoro.current()
    if timer is None:
        st.rerun()
    timer["remaining"] = max(0.0, timer["remaining"])  # the helper moves on within a second

    is_focus = timer["phase"] == "focus"
    mins, secs = divmod(int(timer["remaining"]), 60)
    total = timer["planned_end_ts"] - timer["start_ts"]
    cycle = timer["cycle"]
    sub = cycle["steps"][cycle["step"]]["label"].lower() if cycle else ("focus" if is_focus else "break")
    st.html(ring_html(timer["remaining"] / total, f"{mins:02d}:{secs:02d}", sub, FOCUS_COLOR if is_focus else BREAK_COLOR))
    task = cycle["task"] if cycle else timer["task"]
    if task:
        st.caption(f"<div style='text-align:center'>{html.escape(task[:40])}</div>", unsafe_allow_html=True)
    c1, c2 = st.columns(2)
    if c1.button("Stop", key="clock_stop", help="Stop the cycle and log the time so far", width="stretch"):
        pomodoro.stop(log=True)
        st.rerun()
    if c2.button("✕", key="clock_cancel", help="Cancel without logging this session", width="stretch"):
        pomodoro.stop(log=False)
        st.rerun()


def cycle_done_clock(settings: dict) -> None:
    st.html(ring_html(1.0, "Done", "cycle complete", BREAK_COLOR))
    if st.button(f"Start another cycle ({settings['rounds']} × {settings['focus']})", type="primary", width="stretch"):
        start_cycle(pomodoro.last_task(), settings)
        st.rerun()
    if st.button("Not now", width="stretch"):
        pomodoro.dismiss_cycle_done()
        st.rerun()


def idle_clock(settings: dict) -> None:
    done = focus_sessions_today()
    st.html(ring_html(1.0, f"{settings['focus']:02d}:00", f"{done} done today", "rgba(128,128,128,0.35)"))
    with st.popover("Start", width="stretch"):
        task = st.text_input("What are you working on?", key="pomodoro_task", placeholder="e.g. Study chapter 4")
        topic = topic_picker()
        st.caption(
            f"A cycle is {settings['rounds']} × {settings['focus']} min focus with {settings['short']} min breaks, "
            f"then a {settings['long']} min long break. It runs by itself."
        )
        if st.button(f"Start cycle ({settings['rounds']} × {settings['focus']} min)", type="primary", width="stretch"):
            start_cycle(task, settings, topic)
            st.rerun()
        if st.button(f"Single focus {settings['focus']} min", width="stretch"):
            pomodoro.start("focus", task, settings["focus"], topic)
            st.rerun()
        c1, c2 = st.columns(2)
        if c1.button(f"Break {settings['short']}", width="stretch"):
            pomodoro.start("break", "Short break", settings["short"])
            st.rerun()
        if c2.button(f"Break {settings['long']}", width="stretch"):
            pomodoro.start("break", "Long break", settings["long"])
            st.rerun()


def pomodoro_clock(settings: dict) -> None:
    sound = st.session_state.pop("sound", None)
    if st.session_state.get("toast"):
        st.toast(st.session_state.pop("toast"))
    if sound == "bird":
        st.toast("Pomodoro cycle complete. Well done!")
        st.audio(bird_wav(), format="audio/wav", autoplay=True)
    elif sound == "chime":
        st.audio(chime_wav(), format="audio/wav", autoplay=True)

    if pomodoro.current():
        running_clock()
    elif pomodoro.cycle_done_pending():
        cycle_done_clock(settings)
    else:
        idle_clock(settings)


# ---------- Garmin workouts ----------

def workouts(start_ts: int, end_ts: int) -> list[dict]:
    return [
        a for a in db.activities_between(start_ts, end_ts)
        if a["source"] == "garmin" and a["kind"] == "exercise"
    ]


def workout_label(a: dict) -> str:
    return activity_types.label(a["details"].get("type"))


def types_seen() -> list[str]:
    """All activity groups in the stored Garmin history, most frequent first."""
    counts: dict[str, int] = {}
    for a in workouts(0, int(time.time()) + 86400):
        counts[workout_label(a)] = counts.get(workout_label(a), 0) + 1
    return sorted(counts, key=lambda t: -counts[t])


def tracked_types() -> list[str]:
    seen = types_seen()
    saved = db.get_meta("tracked_activity_types")
    if saved is None:
        return seen
    return [t for t in json.loads(saved) if t in seen]


def tick_chips(types: list[str], done: set[str]) -> str:
    chips = []
    for t in types:
        ok = t in done
        chips.append(
            f"<span style='display:inline-block;margin:0 6px 6px 0;padding:3px 10px;border-radius:999px;"
            f"border:1px solid {'#54A24B' if ok else 'rgba(128,128,128,0.35)'};"
            f"background:{'rgba(84,162,75,0.12)' if ok else 'transparent'};opacity:{1 if ok else 0.7}'>"
            f"{'✅' if ok else '⬜'} {html.escape(t)}</span>"
        )
    return "".join(chips)


# ---------- Today ----------

def timeline_chart(activities: list[dict], start_ts: int, end_ts: int) -> alt.Chart:
    rows = [
        {
            "Type": KIND_LABELS.get(a["kind"], a["kind"]),
            "Title": a["title"],
            "Source": a["source"],
            # naive local times, so the chart shows the clock time from your .env time zone
            "start": local(max(a["start_ts"], start_ts)).replace(tzinfo=None),
            "end": local(min(a["end_ts"], end_ts)).replace(tzinfo=None),
            "From": hhmm(a["start_ts"]),
            "To": hhmm(a["end_ts"]),
        }
        for a in activities
    ]
    df = pd.DataFrame(rows)
    domain = [local(start_ts).replace(tzinfo=None), local(end_ts).replace(tzinfo=None)]
    order = [k for k in KIND_COLORS if k in set(df["Type"])]
    return (
        alt.Chart(df)
        .mark_bar(cornerRadius=3, height=22)
        .encode(
            x=alt.X("start:T", title=None, scale=alt.Scale(domain=domain), axis=alt.Axis(format="%H:%M", tickCount=12)),
            x2="end:T",
            y=alt.Y("Type:N", title=None, sort=order),
            color=alt.Color(
                "Type:N",
                legend=None,
                scale=alt.Scale(domain=list(KIND_COLORS), range=list(KIND_COLORS.values())),
            ),
            tooltip=["Title", "Type", "From", "To", "Source"],
        )
        .properties(height=48 * max(1, len(order)) + 30)
    )


def today_tab(day: dt.date) -> None:
    start_ts, end_ts = day_bounds(day)
    everything = db.activities_between(start_ts, end_ts)
    activities = rooms.visible(everything)  # open rooms stay out of the chart and the totals, but not the table
    room_names = rooms.titles()
    sleep = db.get_activity(f"garmin:sleep:{day.isoformat()}")
    stats = db.daily_stats_between(day.isoformat(), day.isoformat()).get(day.isoformat(), {})
    totals = minutes_by_kind([a for a in activities if a["kind"] != "sleep"], start_ts, end_ts)

    st.subheader(day.strftime("%A, %d %B %Y"))
    cols = st.columns(7)
    cols[0].metric("Woke up", hhmm(sleep["end_ts"]) if sleep else "–")
    cols[1].metric("Went to bed", hhmm(sleep["start_ts"]) if sleep else "–")
    asleep = sleep and sleep["details"].get("asleep_min")
    score = sleep and sleep["details"].get("score")
    cols[2].metric("Sleep", fmt_minutes(asleep) if asleep else "–", f"score {score}" if score else None, delta_color="off", delta_arrow="off")
    cols[3].metric("Steps", f"{stats['totalSteps']:,}" if stats.get("totalSteps") else "–")
    cols[4].metric("Deep work", fmt_minutes(totals.get("focus", 0)))
    cols[5].metric("Meetings", fmt_minutes(totals.get("meeting", 0)))
    cols[6].metric("Exercise", fmt_minutes(totals.get("exercise", 0)))

    if stats:
        extra = []
        if stats.get("restingHeartRate"):
            extra.append(f"Resting HR {stats['restingHeartRate']}")
        if stats.get("averageStressLevel") and stats["averageStressLevel"] > 0:
            extra.append(f"Avg stress {stats['averageStressLevel']}")
        if stats.get("bodyBatteryHighestValue"):
            extra.append(f"Body Battery {stats.get('bodyBatteryLowestValue')}–{stats['bodyBatteryHighestValue']}")
        if stats.get("totalKilocalories"):
            extra.append(f"{int(stats['totalKilocalories'])} kcal")
        st.caption(" · ".join(extra))

    done_today = {workout_label(a) for a in workouts(start_ts, end_ts)}
    ticks = list(dict.fromkeys(tracked_types() + sorted(done_today)))
    if ticks:
        st.markdown(tick_chips(ticks, done_today), unsafe_allow_html=True)

    if not everything:
        st.info("Nothing logged for this day yet. Start a focus session, sync, or add an entry by hand.")
        return

    if activities:
        st.altair_chart(timeline_chart(activities, start_ts, end_ts), width="stretch")

    table = pd.DataFrame(
        [
            {
                "From": hhmm(a["start_ts"]),
                "To": hhmm(a["end_ts"]),
                "Duration": fmt_minutes((a["end_ts"] - a["start_ts"]) / 60),
                "Type": "Open room" if rooms.is_open_room(a, room_names) else KIND_LABELS.get(a["kind"], a["kind"]),
                "Title": a["title"],
                "Source": a["source"],
                "Details": details_text(a),
                "Meet": a["details"].get("meet"),
            }
            for a in everything
        ]
    )
    st.dataframe(
        table,
        hide_index=True,
        width="stretch",
        column_config={"Meet": st.column_config.LinkColumn("Meet", display_text="Join")},
    )

    own = {f"{hhmm(a['start_ts'])} {a['title']} ({a['source']})": a["uid"] for a in activities if a["source"] in ("pomodoro", "manual")}
    if own:
        with st.expander("Delete an entry"):
            choice = st.selectbox("Entry", list(own), key="delete_choice")
            if st.button("Delete", key="delete_btn"):
                db.delete_activity(own[choice])
                st.rerun()


# ---------- Activities ----------

def activities_tab(day: dt.date) -> None:
    seen = types_seen()
    if not seen:
        st.info("No Garmin workouts stored yet. Setup tab → Garmin → Load Garmin history.")
        return

    chosen = st.multiselect("Activities to tick", seen, default=tracked_types(), key="tracked_types")
    if chosen != tracked_types():
        db.set_meta("tracked_activity_types", json.dumps(chosen))

    st.markdown("##### Week")
    picked = st.date_input("Week of", value=day, max_value=dt.datetime.now(TZ).date(), format="YYYY-MM-DD", key="week_of")
    monday = picked - dt.timedelta(days=picked.weekday())
    week = [monday + dt.timedelta(days=i) for i in range(7)]
    done_by_day = {}
    for d in week:
        s, e = day_bounds(d)
        done_by_day[d] = {workout_label(a) for a in workouts(s, e)}
    extra = sorted(set().union(*done_by_day.values()) - set(chosen))
    rows = []
    for t in chosen + extra:
        row = {"Activity": t}
        for d in week:
            row[d.strftime("%a %d")] = "✅" if t in done_by_day[d] else ""
        row["Days"] = sum(t in done_by_day[d] for d in week)
        rows.append(row)
    st.dataframe(pd.DataFrame(rows), hide_index=True, width="stretch")

    if not st.toggle("Show workout records", key="show_records"):
        return
    today = dt.datetime.now(TZ).date()
    c1, c2 = st.columns([2, 1])
    types = c1.multiselect("Types", seen, default=seen, key="record_types")
    rng = c2.date_input("Range", value=(today - dt.timedelta(days=90), today), max_value=today, format="YYYY-MM-DD", key="record_range")
    if not isinstance(rng, (tuple, list)) or len(rng) != 2:
        return
    start_ts, end_ts = day_bounds(rng[0])[0], day_bounds(rng[1])[1]
    items = [a for a in workouts(start_ts, end_ts) if workout_label(a) in types]
    if not items:
        st.caption("No workouts in this range.")
        return
    records = pd.DataFrame([
        {
            "Date": local(a["start_ts"]).strftime("%Y-%m-%d"),
            "Start": hhmm(a["start_ts"]),
            "Activity": workout_label(a),
            "Name": a["title"],
            "Duration": fmt_minutes((a["end_ts"] - a["start_ts"]) / 60),
            "Distance (km)": a["details"].get("distance_km"),
            "Avg HR": a["details"].get("avg_hr"),
            "Calories": a["details"].get("calories"),
        }
        for a in reversed(items)
    ])
    st.dataframe(records, hide_index=True, width="stretch")
    st.markdown("##### Workouts per month")
    per_month = (
        records.assign(Month=records["Date"].str[:7])
        .pivot_table(index="Month", columns="Activity", values="Name", aggfunc="count", fill_value=0)
        .sort_index(ascending=False)
    )
    st.dataframe(per_month, width="stretch")


# ---------- Insights ----------

@st.cache_data(ttl=120, show_spinner=False)
def cached_frame(first: dt.date, last: dt.date) -> pd.DataFrame:
    return insights.daily_frame(first, last)


@st.cache_data(ttl=120, show_spinner=False)
def cached_streaks(today: dt.date) -> tuple[int, int]:
    return insights.focus_streak(today), insights.deep_work_week_streak(today)


def goals_section(today: dt.date) -> None:
    g = insights.goals()
    week = insights.daily_frame(insights.week_start(today), today)
    st.markdown("##### This week's goals")
    progress = insights.week_progress(week, g)
    cols = st.columns(len(progress))
    for c, p in zip(cols, progress):
        value = f"{p['value']:.1f}" if isinstance(p["value"], float) else str(p["value"])
        c.metric(p["label"], f"{'✅ ' if p['done'] else ''}{value}", f"goal {p['target']}", delta_color="off", delta_arrow="off")
        c.progress(min(1.0, p["value"] / p["target"]) if p["target"] else 0.0)
    days, weeks = cached_streaks(today)
    c1, c2 = st.columns(2)
    c1.metric("Focus streak", f"🔥 {days} day{'s' if days != 1 else ''}", help="Days in a row with at least one focus session")
    c2.metric("Deep-work goal streak", f"{weeks} week{'s' if weeks != 1 else ''}", help="Finished weeks in a row that reached the deep-work goal")
    with st.expander("Edit goals"):
        with st.form("goals"):
            cols = st.columns(len(insights.GOAL_LABELS))
            new = {}
            for c, (key, label) in zip(cols, insights.GOAL_LABELS.items()):
                step = 0.5 if key == "sleep_hours" else 1
                new[key] = c.number_input(label, 0.0 if key == "sleep_hours" else 0, 100.0 if key == "sleep_hours" else 100,
                                          g[key], step=step)
            if st.form_submit_button("Save goals", type="primary"):
                insights.set_goals(new)
                st.rerun()


def heatmap_section(today: dt.date) -> None:
    st.markdown("##### Deep work, last 12 months")
    first = insights.week_start(today - dt.timedelta(days=364))
    df = cached_frame(first, today)
    if df["focus_min"].sum() == 0:
        st.caption("Your focus sessions will fill this calendar.")
        return
    df = df.assign(
        week=[insights.week_start(d).isoformat() for d in df["day"]],
        weekday=[d.strftime("%a") for d in df["day"]],
        hours=(df["focus_min"] / 60).round(1),
        date=[d.isoformat() for d in df["day"]],
    )
    st.altair_chart(
        alt.Chart(df).mark_rect(cornerRadius=2).encode(
            x=alt.X("week:O", axis=None),
            y=alt.Y("weekday:O", sort=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], title=None),
            color=alt.Color("hours:Q", title="Hours", scale=alt.Scale(scheme="blues", domainMin=0)),
            tooltip=["date", "hours"],
        ).properties(height=150),
        width="stretch",
    )


def topics_section(today: dt.date) -> None:
    st.markdown("##### Deep work by topic")
    tm = insights.topic_minutes(insights.week_start(today) - dt.timedelta(weeks=7), today)
    if tm.empty or (tm["topic"] == "No topic").all():
        st.caption("Pick a topic when you start a Pomodoro (Start → Topic / project) to see hours per subject here.")
        return
    this_week = tm[tm["week"] == insights.week_start(today)].groupby("topic")["minutes"].sum().div(60).round(1)
    weekly = tm.groupby(["week", "topic"])["minutes"].sum().div(60).round(1).reset_index(name="hours")
    weekly["week"] = weekly["week"].map(lambda d: d.strftime("%d %b"))
    c1, c2 = st.columns([1, 2])
    with c1:
        st.caption("This week (hours)")
        st.dataframe(this_week.sort_values(ascending=False).rename("hours"), width="stretch")
    with c2:
        st.altair_chart(
            alt.Chart(weekly).mark_bar().encode(
                x=alt.X("week:O", title=None, sort=None), y=alt.Y("hours:Q", stack="zero"),
                color=alt.Color("topic:N", title="Topic"), tooltip=["week", "topic", "hours"],
            ).properties(height=220),
            width="stretch",
        )


def energy_section(today: dt.date) -> None:
    st.markdown("##### Sleep, energy and focus")
    df = cached_frame(today - dt.timedelta(days=89), today)
    lines = insights.findings(df, insights.goals()["sleep_hours"])
    by_hour = insights.focus_by_hour(today - dt.timedelta(days=29), today)
    best = insights.best_hours(by_hour)
    if best:
        lines.insert(0, f"Your best focus window over the last 30 days is {best}. Protect it for your hardest work.")
    if not lines:
        st.caption("Patterns appear after about a week of focus sessions together with Garmin sleep data.")
        return
    for line in lines:
        st.markdown(f"- {line}")
    c1, c2 = st.columns(2)
    hours = pd.DataFrame({"hour": [f"{h:02d}" for h in range(24)], "minutes": by_hour.round().values})
    c1.altair_chart(
        alt.Chart(hours).mark_bar(color=KIND_COLORS["Deep work"]).encode(
            x=alt.X("hour:O", title="Hour of day"), y=alt.Y("minutes:Q", title="Focus minutes (30 days)"),
        ).properties(height=220),
        width="stretch",
    )
    pts = df.dropna(subset=["sleep_h"]).assign(deep_work_h=lambda d: (d["focus_min"] / 60).round(1), date=lambda d: d["day"].astype(str))
    if len(pts) >= 5:
        c2.altair_chart(
            alt.Chart(pts).mark_circle(size=60, opacity=0.7, color=KIND_COLORS["Sleep"]).encode(
                x=alt.X("sleep_h:Q", title="Sleep the night before (h)", scale=alt.Scale(zero=False)),
                y=alt.Y("deep_work_h:Q", title="Deep work that day (h)"),
                tooltip=["date", "sleep_h", "deep_work_h", "sleep_score"],
            ).properties(height=220),
            width="stretch",
        )


def report_section(today: dt.date) -> None:
    st.markdown("##### Weekly report")
    mondays = [insights.week_start(today) - dt.timedelta(weeks=i) for i in range(0, 9)]
    week = st.selectbox("Week", mondays, index=1, format_func=lambda d: f"Week of {d:%d %b %Y}" + (" (this week)" if d == mondays[0] else ""))
    c1, c2 = st.columns(2)
    if c1.button("Create PDF", width="stretch"):
        st.session_state.report_pdf = (week, report.pdf(week))
    if st.session_state.get("report_pdf") and st.session_state.report_pdf[0] == week:
        c1.download_button("Download PDF", st.session_state.report_pdf[1], f"weekly-report-{week}.pdf", "application/pdf", width="stretch", type="primary")
    if report.email_configured():
        if c2.button("Email it to me", width="stretch"):
            try:
                report.send(week)
                st.success("Sent.")
            except Exception as exc:
                st.error(f"Could not send: {exc}")
        st.caption("The report for last week is also emailed automatically every Monday at 08:00 while the app runs.")
    else:
        c2.caption("To get it by email every Monday, add your Gmail details to `.env` (see Setup → Weekly report email).")


def insights_tab() -> None:
    today = dt.datetime.now(TZ).date()
    goals_section(today)
    heatmap_section(today)
    topics_section(today)
    energy_section(today)
    report_section(today)


# ---------- History ----------

def history_tab() -> None:
    today = dt.datetime.now(TZ).date()
    picked = st.date_input("Range", value=(today - dt.timedelta(days=13), today), max_value=today, format="YYYY-MM-DD", key="history_range")
    if not isinstance(picked, (tuple, list)) or len(picked) != 2:
        st.caption("Pick a start and an end date.")
        return
    first, last = picked
    days = [first + dt.timedelta(days=i) for i in range((last - first).days + 1)]
    range_start, range_end = day_bounds(first)[0], day_bounds(last)[1]
    activities = rooms.visible(db.activities_between(range_start, range_end))
    stats = db.daily_stats_between(first.isoformat(), last.isoformat())

    hours_rows, sleep_rows = [], []
    for day in days:
        s, e = day_bounds(day)
        totals = minutes_by_kind([a for a in activities if a["kind"] != "sleep"], s, e)
        for kind in ("focus", "room", "meeting", "exercise"):
            hours_rows.append({"Day": day.isoformat(), "Type": KIND_LABELS[kind], "Hours": round(totals.get(kind, 0) / 60, 2)})
        sleep = db.get_activity(f"garmin:sleep:{day.isoformat()}")
        if sleep:
            sleep_rows.append({
                "Day": day.isoformat(),
                "Went to bed": hhmm(sleep["start_ts"]),
                "Woke up": hhmm(sleep["end_ts"]),
                "Asleep": fmt_minutes(sleep["details"].get("asleep_min") or 0),
                "Score": sleep["details"].get("score"),
            })

    st.markdown("##### Hours per day")
    hours = pd.DataFrame(hours_rows)
    shown = ["Deep work", "Study room", "Meeting", "Exercise"]
    st.altair_chart(
        alt.Chart(hours).mark_bar().encode(
            x=alt.X("Day:O", title=None),
            y=alt.Y("Hours:Q", stack="zero"),
            color=alt.Color("Type:N", scale=alt.Scale(domain=shown, range=[KIND_COLORS[k] for k in shown])),
            tooltip=["Day", "Type", "Hours"],
        ),
        width="stretch",
    )

    c1, c2 = st.columns(2)
    with c1:
        st.markdown("##### Sleep")
        if sleep_rows:
            st.dataframe(pd.DataFrame(sleep_rows), hide_index=True, width="stretch")
        else:
            st.caption("No Garmin sleep data in this range yet.")
    with c2:
        st.markdown("##### Steps")
        steps = pd.DataFrame([{"Day": d, "Steps": v.get("totalSteps") or 0} for d, v in sorted(stats.items())])
        if not steps.empty:
            st.bar_chart(steps, x="Day", y="Steps")
        else:
            st.caption("No Garmin daily stats in this range yet.")

    if activities:
        export = pd.DataFrame(
            [
                {
                    "start": local(a["start_ts"]).isoformat(),
                    "end": local(a["end_ts"]).isoformat(),
                    "type": a["kind"],
                    "title": a["title"],
                    "source": a["source"],
                    "details": details_text(a),
                }
                for a in activities
            ]
        )
        st.download_button("Download this range as CSV", export.to_csv(index=False), f"daily-log-{first}-{last}.csv", "text/csv")


# ---------- Add entry ----------

def add_entry_tab() -> None:
    st.caption("Log something by hand, e.g. reading, commute, a meeting that isn't in your calendar.")
    with st.form("manual_entry", clear_on_submit=True):
        title = st.text_input("Title")
        kind = st.selectbox("Type", list(KIND_LABELS), format_func=KIND_LABELS.get, index=0)
        c1, c2, c3 = st.columns(3)
        day = c1.date_input("Date", value=dt.datetime.now(TZ).date(), max_value=dt.datetime.now(TZ).date(), format="YYYY-MM-DD")
        start = c2.time_input("Start", value=dt.time(9, 0), step=300)
        end = c3.time_input("End", value=dt.time(10, 0), step=300)
        if st.form_submit_button("Add", type="primary"):
            start_dt = dt.datetime.combine(day, start, TZ)
            end_dt = dt.datetime.combine(day, end, TZ)
            if end_dt <= start_dt:
                end_dt += dt.timedelta(days=1)  # e.g. 23:00 to 01:00
            db.upsert_activities([{
                "uid": f"manual:{int(time.time() * 1000)}",
                "source": "manual",
                "kind": kind,
                "title": title.strip() or KIND_LABELS[kind],
                "start_ts": int(start_dt.timestamp()),
                "end_ts": int(end_dt.timestamp()),
                "details": {},
            }])
            st.success("Added.")


# ---------- Meetings (Google Meet) ----------

def parse_emails(text: str) -> list[str]:
    return sorted(set(re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)))


def writable_calendars() -> list[dict]:
    calendars = google_api.cached_calendars()
    if not calendars:
        calendars = google_api.list_calendars()
    return [c for c in calendars if c["can_write"]]


def upcoming_meet_list(settings: dict) -> None:
    now = int(time.time())
    meetings = [
        a for a in db.activities_between(now, now + 7 * 86400)
        if a["kind"] == "meeting" and a["details"].get("meet")
    ][:15]
    if not meetings:
        st.caption("No upcoming meetings with a Google Meet link in the next 7 days.")
        return
    room_names = rooms.titles()
    for m in meetings:
        start = local(m["start_ts"])
        live = m["start_ts"] <= now + 600
        when = "Now" if m["start_ts"] <= now else start.strftime("%a %d %b, %H:%M")
        is_room = rooms.is_open_room(m, room_names)
        c1, c2, c3 = st.columns([5, 1.2, 1.6], vertical_alignment="center")
        tag = "  ·  *open room: counts only while you're in it*" if is_room else ""
        c1.markdown(f"**{html.escape(m['title'])}**  \n{when} – {hhmm(m['end_ts'])}{tag}")
        if is_room:
            if c2.button("Join", key=f"room_{m['uid']}", type="primary" if live else "secondary", width="stretch",
                         help="Logs your time in the room from now until you click Leave", disabled=not live):
                rooms.join(m["title"], m["details"]["meet"], m["end_ts"])
                st.rerun()
        else:
            c2.link_button("Join", m["details"]["meet"], type="primary" if live else "secondary", width="stretch")
        if c3.button("Join + cycle", key=f"timer_{m['uid']}", help="Also start a Pomodoro cycle", width="stretch", disabled=is_room and not live):
            start_cycle(m["title"], settings)
            if is_room:
                rooms.join(m["title"], m["details"]["meet"], m["end_ts"])
            else:
                st.session_state.open_meet = m["details"]["meet"]
            st.rerun()


def new_meeting_form(settings: dict) -> None:
    try:
        calendars = writable_calendars()
    except Exception as exc:
        st.error(f"Could not load your calendars: {exc}")
        return
    if not calendars:
        st.warning("No calendar you can write to was found.")
        return

    with st.form("new_meet"):
        title = st.text_input("Title", value="Focus session")
        c1, c2 = st.columns(2)
        calendar = c1.selectbox("Calendar", calendars, format_func=lambda c: c["name"])
        cycle_minutes = settings["rounds"] * settings["focus"] + (settings["rounds"] - 1) * settings["short"] + settings["long"]
        minutes = c2.number_input("Duration (min)", 5, 480, int(cycle_minutes), step=5, help="Default: one full Pomodoro cycle")
        when = st.radio("When", ["Now", "Later"], horizontal=True)
        c3, c4 = st.columns(2)
        day = c3.date_input("Date (for Later)", value=dt.datetime.now(TZ).date(), format="YYYY-MM-DD")
        at = c4.time_input("Time (for Later)", value=(dt.datetime.now(TZ) + dt.timedelta(hours=1)).replace(minute=0).time(), step=300)
        guests = st.text_area("Invite (emails, optional)", placeholder="anna@example.com, ravi@example.com", height=70)
        with_timer = st.checkbox(
            "Run a Pomodoro in this meeting (starts the focus timer now; only for 'Now')", value=True
        )
        submitted = st.form_submit_button("Create Google Meet", type="primary")

    if not submitted:
        return
    start = dt.datetime.now(TZ).replace(second=0, microsecond=0) if when == "Now" else dt.datetime.combine(day, at, TZ)
    pomodoro_now = with_timer and when == "Now"
    description = "Created with Daily App."
    if pomodoro_now:
        description = (
            f"Pomodoro co-working cycle: {settings['rounds']} x {settings['focus']} min focus with {settings['short']} min breaks, "
            f"then a {settings['long']} min long break. "
            "Cameras optional, mics muted during focus.\n\n" + description
        )
    try:
        row = google_api.create_meeting(calendar["id"], title.strip() or "Meeting", start, int(minutes), parse_emails(guests), description)
    except Exception as exc:
        st.error(f"Could not create the meeting: {exc}")
        return
    if pomodoro_now:
        start_cycle(title.strip(), settings)
    st.session_state.open_meet = row["details"].get("meet") if row else None
    st.session_state.meet_created = f"Created '{row['title'] if row else title}' for {start.strftime('%a %d %b %H:%M')}."
    st.rerun()


def meetings_tab(settings: dict) -> None:
    if not google_api.is_connected():
        st.info("Connect Google first (Setup tab) to see Meet links and create Google Meet meetings from here.")
        return

    if st.session_state.get("meet_created"):
        st.success(st.session_state.pop("meet_created"))
    link = st.session_state.get("open_meet")
    if link:
        c1, c2 = st.columns([1, 3], vertical_alignment="center")
        c1.link_button("Open Google Meet", link, type="primary", width="stretch")
        c2.code(link, language=None)

    st.markdown("##### Upcoming meetings")
    upcoming_meet_list(settings)
    st.markdown("##### Start a new Google Meet")
    new_meeting_form(settings)


# ---------- Setup ----------

def status_line(ok: bool, text: str) -> None:
    st.markdown(f"{'✅' if ok else '⬜'} {text}")


def google_setup() -> None:
    st.markdown("#### Google Calendar and Google Meet")
    status_line(google_api.has_client_secret(), "`google_credentials.json` is in the app folder")
    status_line(google_api.is_connected(), "Signed in with Google (`./run.sh google`)")

    if google_api.is_connected():
        try:
            calendars = google_api.cached_calendars() or google_api.list_calendars()
        except Exception as exc:
            st.error(str(exc))
            return
        primary = next((c["id"] for c in calendars if c["primary"]), None)
        current = [primary if cid == "primary" else cid for cid in google_api.selected_calendar_ids()]
        names = {c["id"]: c["name"] for c in calendars}
        chosen = st.multiselect(
            "Calendars to sync",
            list(names),
            default=[cid for cid in current if cid in names],
            format_func=lambda cid: names[cid],
        )
        c1, c2 = st.columns(2)
        if c1.button("Save and sync", type="primary", width="stretch", disabled=not chosen):
            google_api.set_selected_calendar_ids(chosen)
            with st.spinner("Syncing..."):
                st.session_state.sync_results = sync.run_all()
            st.rerun()
        if c2.button("Reload calendar list", width="stretch"):
            google_api.list_calendars()
            st.rerun()
        return

    st.markdown(
        """
One-time setup, about 10 minutes, free. Use the Google account whose calendar you want.

1. Open **console.cloud.google.com** → project picker at the top → **New project** → name it `daily-app` → **Create**, and select it.
2. Open **console.cloud.google.com/apis/library/calendar-json.googleapis.com** → **Enable** (Google Calendar API).
3. Open **console.cloud.google.com/auth/overview** → **Get started**: App name `Daily App`, your email as support email →
   Audience **External** → your email as contact → agree → **Create**.
4. Left menu **Audience** → **Test users** → **Add users** → add the Gmail you will sign in with → **Save**.
   (Optional: if **Publish app** is clickable there, click it. Otherwise Google signs you out after 7 days; just run `./run.sh google` again.)
5. Left menu **Clients** → **Create client** → Application type **Desktop app** → **Create** →
   **Download JSON**. Rename the file to `google_credentials.json` and put it in the `daily-app-scheduler` folder.
6. In Terminal, in the app folder: `./run.sh google`. Your browser opens: choose your account.
   If Google says *"Google hasn't verified this app"*: click **Advanced** → **Go to Daily App** (it is your own app) → **Continue**.
7. Come back here, refresh the page, and pick the calendars to sync.
"""
    )


def outlook_setup() -> None:
    st.markdown("#### Outlook Calendar")
    connected = outlook_api.is_connected()
    links = calendar_sync.feeds()["outlook"]
    status_line(connected, "Signed in with Microsoft (`./run.sh outlook`)")
    status_line(bool(links), "Or: published Outlook ICS link saved")
    if connected:
        c1, c2 = st.columns(2)
        if c1.button("Sync Outlook now", type="primary", width="stretch"):
            with st.spinner("Syncing..."):
                st.session_state.sync_results = sync.run_all()
            st.rerun()
        if c2.button("Sign out of Microsoft", width="stretch"):
            outlook_api.logout()
            st.rerun()
        return
    st.markdown(
        """
**Way 1, recommended: sign in with Microsoft** (works for work/school accounts, read-only)

1. Open Terminal, go to the app folder and run:
   `./run.sh outlook`
2. It prints a line like *"To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code ABCD1234"*.
3. Open **microsoft.com/devicelogin** in your browser, type the code, choose your Outlook account, sign in, click **Continue** / **Accept**.
4. Terminal says *Connected*. Come back here and click **Sync now** in the sidebar. Teams links appear as **Join**.

If Microsoft says **"Need admin approval"**, your company blocks outside apps: use Way 2, or ask IT to allow
"Microsoft Graph Command Line Tools". For a **personal Outlook.com / Hotmail** account, if the sign-in is refused,
use Way 2 (or set your own app ID, see README).

**Way 2: publish the calendar as a link**

1. Open **outlook.office.com** (work) or **outlook.live.com** (personal) in the browser, not the Mac app.
2. Gear icon ⚙️ top right → **Calendar** → **Shared calendars**.
3. Scroll to **Publish a calendar** → choose **Calendar** → choose **Can view all details** → **Publish**.
4. Click the **ICS** link that appears → **Copy link**, and paste it below.
"""
    )
    with st.form("outlook_link", clear_on_submit=True):
        url = st.text_input("Outlook ICS link", type="password", placeholder="https://outlook.office365.com/owa/calendar/.../calendar.ics")
        if st.form_submit_button("Save and test", type="primary") and url.strip():
            try:
                n = calendar_sync.test_link(url.strip())
            except Exception as exc:
                st.error(f"That link did not work: {exc}")
            else:
                calendar_sync.set_saved_links("outlook", [url.strip()])
                st.session_state.sync_results = sync.run_all()
                st.success(f"Link works ({n} events in the calendar). Synced.")
    if json.loads(db.get_meta("ics_links") or "{}").get("outlook"):
        if st.button("Remove saved Outlook link"):
            calendar_sync.set_saved_links("outlook", [])
            db.replace_source_range("outlook", 0, 2**31, [])
            st.rerun()


def mac_setup() -> None:
    st.markdown("#### Mac notifications and autostart")
    status_line(worker.alive(), "Background helper running (started by `./run.sh`)")
    on = st.toggle("Mac notifications (break time, cycle done, meeting in 5 min, time to move)", value=notifier.enabled())
    if on != notifier.enabled():
        db.set_meta("notifications", "on" if on else "off")
    if st.button("Send a test notification"):
        st.toast("Sent. If nothing appeared, see the note below." if notifier.notify("Daily App", "Notifications work.") else
                 "Notifications only work when the app runs on your Mac.")
    st.caption(
        "The first time, macOS may ask to allow notifications from **Script Editor**: allow it "
        "(System Settings → Notifications → Script Editor)."
    )
    st.markdown(
        "**Start automatically when you log in**: in Terminal run `./run.sh autostart on` (turn off with "
        "`./run.sh autostart off`). The app then runs in the background; open it at **http://localhost:8501**."
    )


def email_setup() -> None:
    st.markdown("#### Weekly report email (optional)")
    status_line(report.email_configured(), "Email settings in `.env`")
    if not report.email_configured():
        st.markdown(
            """
1. Create a Gmail **App Password**: myaccount.google.com/apppasswords (needs 2-Step Verification) → name it *Daily App* → copy the 16 letters.
2. Add to `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=the16letterapppassword
REPORT_TO=you@gmail.com
```
3. Restart the app. The report for the past week arrives every Monday at 08:00 (while the app runs).
"""
        )


def garmin_setup() -> None:
    st.markdown("#### Garmin")
    status_line(garmin_sync.tokens_saved(), "Garmin signed in (`./run.sh login`)")
    if not garmin_sync.is_configured():
        st.markdown("Put `GARMIN_EMAIL` and `GARMIN_PASSWORD` in `.env`, then run `./run.sh login` once in Terminal.")
        return
    c1, c2 = st.columns([1, 2], vertical_alignment="bottom")
    days = c1.number_input("Days of history", 30, 3650, 365, step=30)
    if c2.button("Load Garmin history", type="primary"):
        bar = st.progress(0.0, text="Starting...")
        try:
            result = garmin_sync.load_history(int(days), lambda f, t: bar.progress(min(1.0, f), text=t))
        except Exception as exc:
            st.error(f"Stopped: {exc}. Click again to continue; days already loaded are skipped.")
        else:
            st.success("Loaded: " + ", ".join(f"{n} {what}" for what, n in result.items()))
    st.caption(
        "Workouts for the whole period arrive in seconds. Sleep and daily stats need one request per day, "
        "so a year takes roughly 5 to 10 minutes. You can also run it in Terminal: `./run.sh history 365`."
    )


def open_rooms_setup() -> None:
    st.markdown("#### Open rooms")
    st.markdown(
        "Long meetings that are only an open invitation (like an all-day *Group Study* Meet) are hidden from your "
        "timeline. Only the time you actually spend in them counts: join from the **Meetings** tab and click **Leave** "
        f"when you go. Meetings of {rooms.AUTO_HOURS}+ hours are picked automatically until you choose here."
    )
    names = rooms.meeting_titles()
    if not names:
        st.caption("No calendar meetings synced yet.")
        return
    current = sorted(rooms.titles() & set(names))
    chosen = st.multiselect("Treat these meetings as open rooms", names, default=current, key="open_rooms")
    if st.button("Save open rooms", disabled=sorted(chosen) == current):
        rooms.set_titles(chosen)
        st.rerun()


def setup_tab() -> None:
    google_setup()
    open_rooms_setup()

    outlook_setup()
    garmin_setup()
    mac_setup()
    email_setup()

    st.caption(f"Time zone: {TZ}. After editing `.env`, restart the app (Ctrl+C in Terminal, then `./run.sh`).")


# ---------- main ----------

# ---------- background sounds (⋮ menu) ----------

SOUND_MODES = {
    "focus": "During focus sessions",
    "timer": "While the Pomodoro runs (focus and breaks)",
    "always": "Always, until I turn it off",
}
MY_PREFIX = "My sound: "


@st.cache_data(show_spinner=False)
def built_in_sound(name: str, volume: str) -> bytes:
    return sounds.built_in_wav(name, volume)


def sound_settings() -> dict:
    return {
        "sound": db.get_meta("bg_sound") or "Off",
        "mode": db.get_meta("bg_mode") or "focus",
        "volume": db.get_meta("bg_volume") or "Medium",
    }


def _save_setting(key: str, widget: str) -> None:
    db.set_meta(key, st.session_state[widget])


def sound_menu() -> None:
    cfg = sound_settings()
    mine = sounds.user_sounds()
    options = ["Off", *sounds.BUILT_IN, *(MY_PREFIX + name for name in mine)]
    with st.popover("Sounds", type="tertiary", help="Background sounds"):
        st.markdown("**Background sound**")
        st.selectbox(
            "Sound", options, index=options.index(cfg["sound"]) if cfg["sound"] in options else 0,
            key="bg_sound_w", on_change=_save_setting, args=("bg_sound", "bg_sound_w"),
        )
        st.radio(
            "Play", list(SOUND_MODES), format_func=SOUND_MODES.get, index=list(SOUND_MODES).index(cfg["mode"]),
            key="bg_mode_w", on_change=_save_setting, args=("bg_mode", "bg_mode_w"),
        )
        st.select_slider(
            "Volume (built-in sounds; use the Mac volume for your own)", list(sounds.VOLUMES), value=cfg["volume"],
            key="bg_volume_w", on_change=_save_setting, args=("bg_volume", "bg_volume_w"),
        )

        st.link_button("Open brain.fm in a new tab", "https://my.brain.fm", width="stretch",
                       help="brain.fm has no public API, so it can't play inside this app; it needs their subscription")

        st.divider()
        st.markdown("**Add your own sounds**")
        n = st.session_state.get("upload_round", 0)
        files = st.file_uploader(
            "Choose files from your Mac", type=[ext[1:] for ext in sounds.USER_EXTENSIONS],
            accept_multiple_files=True, key=f"sound_upload_{n}",
        )
        if files:
            for f in files:
                sounds.save_user_sound(f.name, f.getvalue())
            st.session_state.upload_round = n + 1
            st.rerun()
        st.caption(f"Saved in `{sounds.USER_DIR}`. You can also copy MP3/WAV/M4A files into that folder in Finder.")
        if mine:
            c1, c2 = st.columns([3, 1], vertical_alignment="bottom")
            gone = c1.selectbox("Remove one of your sounds", list(mine), key="sound_remove")
            if c2.button("Remove", width="stretch"):
                mine[gone].unlink(missing_ok=True)
                if cfg["sound"] == MY_PREFIX + gone:
                    db.set_meta("bg_sound", "Off")
                st.rerun()


def background_sound() -> None:
    cfg = sound_settings()
    if cfg["sound"] == "Off":
        return
    timer = pomodoro.current()
    playing = (
        cfg["mode"] == "always"
        or (cfg["mode"] == "timer" and timer is not None)
        or (cfg["mode"] == "focus" and timer is not None and timer["phase"] == "focus")
    )
    if not playing:
        return
    if cfg["sound"] in sounds.BUILT_IN:
        st.audio(built_in_sound(cfg["sound"], cfg["volume"]), format="audio/wav", loop=True, autoplay=True)
        return
    path = sounds.user_sounds().get(cfg["sound"].removeprefix(MY_PREFIX))
    if path:
        st.audio(path.read_bytes(), format=sounds.mime(path), loop=True, autoplay=True)


def movement_banner() -> None:
    if not movement.due():
        return
    task = movement.suggestion()
    if st.session_state.get("nudged_for") != task:
        st.session_state.nudged_for = task
        st.audio(chime_wav(), format="audio/wav", autoplay=True)
    with st.container(border=True):
        c1, c2, c3 = st.columns([4, 1.2, 1.2], vertical_alignment="center")
        c1.markdown(f"🏃 **Time to move.** {html.escape(task)}")
        if c2.button("Done ✅", type="primary", width="stretch", key="move_done"):
            movement.acknowledge()
            st.toast("Nice. Movement break logged.")
            st.rerun()
        if c3.button("In 10 min", width="stretch", key="move_snooze"):
            movement.snooze(10)
            st.rerun()


def room_banner() -> None:
    session = rooms.active()
    if not session:
        return
    minutes = (time.time() - session["start_ts"]) / 60
    with st.container(border=True):
        c1, c2, c3 = st.columns([4, 1.4, 1], vertical_alignment="center")
        c1.markdown(f"🟢 In **{html.escape(session['title'])}** since {hhmm(session['start_ts'])} ({fmt_minutes(minutes)})")
        if session.get("meet"):
            c2.link_button("Open Meet", session["meet"], type="primary", width="stretch")
        if c3.button("Leave", width="stretch"):
            rooms.leave()
            st.rerun()


sound_slot = st.container()  # always the first element, so the background sound keeps playing across reruns
day, settings = sidebar()
auto_sync()
advance_timer()
rooms.refresh()
with sound_slot:
    background_sound()

head_left, head_right = st.columns([5, 1.3], vertical_alignment="top")
with head_right:
    _, menu = st.columns([1, 3])
    with menu:
        sound_menu()
    pomodoro_clock(settings)
with head_left:
    st.title("Daily App")
    st.caption(dt.datetime.now(TZ).strftime("%A, %d %B %Y"))
    room_banner()
    movement_banner()

tab_today, tab_insights, tab_acts, tab_meet, tab_history, tab_add, tab_setup = st.tabs(
    ["Today", "Insights", "Activities", "Meetings", "History", "Add entry", "Setup"]
)
with tab_insights:
    insights_tab()
with tab_today:
    today_tab(day)
with tab_acts:
    activities_tab(day)
with tab_meet:
    meetings_tab(settings)
with tab_history:
    history_tab()
with tab_add:
    add_entry_tab()
with tab_setup:
    setup_tab()
