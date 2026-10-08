"""Numbers behind the Insights tab and the weekly report: daily totals, goals,
streaks, topics and sleep/energy findings. No Streamlit in here."""

import datetime as dt
import json

import pandas as pd

import activity_types
import db
import rooms
from config import TZ

DEFAULT_GOALS = {
    "deep_work_hours": 15,  # per week
    "workouts": 4,
    "runs": 2,
    "strength": 2,
    "sleep_hours": 7.0,  # average per night
}
GOAL_LABELS = {
    "deep_work_hours": "Deep work (hours / week)",
    "workouts": "Workouts / week",
    "runs": "Runs / week",
    "strength": "Strength sessions / week",
    "sleep_hours": "Average sleep (hours / night)",
}


def day_bounds(day: dt.date) -> tuple[int, int]:
    start = dt.datetime.combine(day, dt.time(), TZ)
    end = dt.datetime.combine(day + dt.timedelta(days=1), dt.time(), TZ)
    return int(start.timestamp()), int(end.timestamp())


def minutes_by_kind(activities: list[dict], start_ts: int, end_ts: int) -> dict[str, float]:
    """Minutes per kind inside the window. Overlapping entries of one kind are counted once."""
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


def daily_frame(first: dt.date, last: dt.date) -> pd.DataFrame:
    """One row per day with focus, meetings, workouts, sleep and Garmin stats."""
    start_ts, end_ts = day_bounds(first)[0], day_bounds(last)[1]
    acts = rooms.visible(db.activities_between(start_ts, end_ts))
    stats = db.daily_stats_between(first.isoformat(), last.isoformat())
    rows = []
    day = first
    while day <= last:
        s, e = day_bounds(day)
        today = [a for a in acts if a["start_ts"] < e and a["end_ts"] > s]
        totals = minutes_by_kind([a for a in today if a["kind"] != "sleep"], s, e)
        workouts = [a for a in today if a["source"] == "garmin" and a["kind"] == "exercise" and s <= a["start_ts"] < e]
        labels = [activity_types.label(a["details"].get("type")) for a in workouts]
        sleep = db.get_activity(f"garmin:sleep:{day.isoformat()}")
        st = stats.get(day.isoformat(), {})
        rows.append({
            "day": day,
            "focus_min": totals.get("focus", 0.0),
            "meeting_min": totals.get("meeting", 0.0),
            "room_min": totals.get("room", 0.0),
            "exercise_min": totals.get("exercise", 0.0),
            "workouts": len(workouts),
            "runs": labels.count("Running"),
            "strength": labels.count("Strength training"),
            "movement_breaks": sum(1 for a in today if a["kind"] == "movement"),
            "sleep_h": (sleep["details"].get("asleep_min") or 0) / 60 if sleep else None,
            "sleep_score": sleep["details"].get("score") if sleep else None,
            "steps": st.get("totalSteps"),
            "body_battery": st.get("bodyBatteryHighestValue"),
        })
        day += dt.timedelta(days=1)
    return pd.DataFrame(rows)


# ---------- goals and streaks ----------

def goals() -> dict:
    saved = json.loads(db.get_meta("goals") or "{}")
    return {**DEFAULT_GOALS, **saved}


def set_goals(values: dict) -> None:
    db.set_meta("goals", json.dumps(values))


def week_start(day: dt.date) -> dt.date:
    return day - dt.timedelta(days=day.weekday())


def week_progress(df: pd.DataFrame, g: dict) -> list[dict]:
    """Progress of one week's rows against the goals."""
    sleep = df["sleep_h"].dropna()
    values = {
        "deep_work_hours": df["focus_min"].sum() / 60,
        "workouts": int(df["workouts"].sum()),
        "runs": int(df["runs"].sum()),
        "strength": int(df["strength"].sum()),
        "sleep_hours": float(sleep.mean()) if len(sleep) else 0.0,
    }
    return [
        {"key": k, "label": GOAL_LABELS[k], "value": values[k], "target": g[k], "done": values[k] >= g[k] and g[k] > 0}
        for k in GOAL_LABELS
    ]


def focus_streak(today: dt.date) -> int:
    """Days in a row with at least one focus session (today counts once it has one)."""
    df = daily_frame(today - dt.timedelta(days=400), today)
    has = dict(zip(df["day"], df["focus_min"] > 0))
    day = today if has.get(today) else today - dt.timedelta(days=1)
    streak = 0
    while has.get(day):
        streak += 1
        day -= dt.timedelta(days=1)
    return streak


def deep_work_week_streak(today: dt.date) -> int:
    """Finished weeks in a row that reached the deep-work goal."""
    target = goals()["deep_work_hours"] * 60
    streak = 0
    start = week_start(today) - dt.timedelta(days=7)
    for _ in range(104):
        df = daily_frame(start, start + dt.timedelta(days=6))
        if df["focus_min"].sum() < target or target <= 0:
            break
        streak += 1
        start -= dt.timedelta(days=7)
    return streak


# ---------- topics and focus hours ----------

def topic_minutes(first: dt.date, last: dt.date) -> pd.DataFrame:
    start_ts, end_ts = day_bounds(first)[0], day_bounds(last)[1]
    rows = []
    for a in db.activities_between(start_ts, end_ts):
        if a["kind"] == "focus":
            topic = (a["details"] or {}).get("topic") or "No topic"
            day = dt.datetime.fromtimestamp(a["start_ts"], TZ).date()
            rows.append({"topic": topic, "week": week_start(day), "minutes": (a["end_ts"] - a["start_ts"]) / 60})
    return pd.DataFrame(rows, columns=["topic", "week", "minutes"])


def focus_by_hour(first: dt.date, last: dt.date) -> pd.Series:
    """Focus minutes per hour of the day (0..23)."""
    minutes = [0.0] * 24
    start_ts, end_ts = day_bounds(first)[0], day_bounds(last)[1]
    for a in db.activities_between(start_ts, end_ts):
        if a["kind"] != "focus":
            continue
        t = a["start_ts"]
        while t < a["end_ts"]:
            moment = dt.datetime.fromtimestamp(t, TZ)
            next_hour = int((moment.replace(minute=0, second=0, microsecond=0) + dt.timedelta(hours=1)).timestamp())
            chunk_end = min(next_hour, a["end_ts"])
            minutes[moment.hour] += (chunk_end - t) / 60
            t = chunk_end
    return pd.Series(minutes, index=range(24))


def fmt_minutes(minutes: float) -> str:
    minutes = int(round(minutes))
    return f"{minutes // 60}h {minutes % 60:02d}m" if minutes >= 60 else f"{minutes}m"


def _compare(df: pd.DataFrame, mask: pd.Series, yes: str, no: str) -> str | None:
    a, b = df.loc[mask, "focus_min"], df.loc[~mask, "focus_min"]
    if len(a) < 3 or len(b) < 3:
        return None
    ma, mb = a.mean(), b.mean()
    if mb > 0:
        change = f" ({(ma - mb) / mb * 100:+.0f}%)"
    else:
        change = ""
    return f"{yes}: {fmt_minutes(ma)} of deep work on average, vs {fmt_minutes(mb)} {no}{change}."


def findings(df: pd.DataFrame, sleep_target: float) -> list[str]:
    """Plain-language patterns from the last weeks. Empty when there isn't enough data yet."""
    out = []
    worked = df[df["focus_min"] > 0]
    if len(worked) < 7:
        return out
    with_sleep = df.dropna(subset=["sleep_h"])
    if len(with_sleep):
        line = _compare(with_sleep, with_sleep["sleep_h"] >= sleep_target,
                        f"After nights with {sleep_target:g}h+ sleep", "after shorter nights")
        if line:
            out.append(line)
    line = _compare(df, df["workouts"] > 0, "On days with a workout", "on days without")
    if line:
        out.append(line)
    bb = df.dropna(subset=["body_battery"])
    if len(bb) >= 6:
        line = _compare(bb, bb["body_battery"] >= bb["body_battery"].median(),
                        f"When Body Battery peaked at {bb['body_battery'].median():.0f}+", "on lower days")
        if line:
            out.append(line)
    weekday = df.assign(wd=pd.to_datetime(df["day"]).dt.day_name()).groupby("wd")["focus_min"].mean()
    if len(weekday) >= 5 and weekday.max() > 0:
        out.append(f"Your strongest day is {weekday.idxmax()} ({fmt_minutes(weekday.max())} on average), "
                   f"the weakest {weekday.idxmin()} ({fmt_minutes(weekday.min())}).")
    return out


def best_hours(by_hour: pd.Series) -> str | None:
    if by_hour.sum() < 120:
        return None
    window = by_hour + by_hour.shift(-1, fill_value=0)
    h = int((window * 1000 + by_hour).idxmax())  # on a tie, start at the busier hour
    return f"{h:02d}:00–{(h + 2) % 24:02d}:00"
