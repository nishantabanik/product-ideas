"""Pull sleep, workouts and daily stats from Garmin Connect.

Uses the community `garminconnect` library, which logs in with your own
Garmin account. It is unofficial, so a Garmin website change can break it
until the library is updated (`pip install -U garminconnect`).
"""

import datetime as dt
import time
from collections.abc import Callable

from garminconnect import Garmin

import db
from config import GARMIN_EMAIL, GARMIN_PASSWORD, GARMIN_TOKENS, TZ

STAT_KEYS = [
    "totalSteps",
    "totalKilocalories",
    "restingHeartRate",
    "averageStressLevel",
    "bodyBatteryHighestValue",
    "bodyBatteryLowestValue",
    "moderateIntensityMinutes",
    "vigorousIntensityMinutes",
    "floorsAscended",
]


class GarminLoginRequired(RuntimeError):
    pass


def _refuse_mfa() -> str:
    raise GarminLoginRequired(
        "Garmin asked for a verification code. Run `./run.sh login` once in a terminal."
    )


def tokens_saved() -> bool:
    return (GARMIN_TOKENS / "garmin_tokens.json").exists()


def is_configured() -> bool:
    return tokens_saved() or bool(GARMIN_EMAIL and GARMIN_PASSWORD)


def get_client() -> Garmin:
    client = Garmin(GARMIN_EMAIL or None, GARMIN_PASSWORD or None, prompt_mfa=_refuse_mfa)
    client.login(str(GARMIN_TOKENS))
    return client


def _ms_to_ts(ms) -> int | None:
    return int(ms / 1000) if ms else None


def _gmt_to_ts(text: str) -> int:
    parsed = dt.datetime.strptime(text[:19], "%Y-%m-%d %H:%M:%S")
    return int(parsed.replace(tzinfo=dt.timezone.utc).timestamp())


def _minutes(seconds) -> int | None:
    return round(seconds / 60) if seconds else None


def _sleep_row(day: str, sleep: dict) -> dict | None:
    start = _ms_to_ts(sleep.get("sleepStartTimestampGMT"))
    end = _ms_to_ts(sleep.get("sleepEndTimestampGMT"))
    if not start or not end:
        return None
    score = ((sleep.get("sleepScores") or {}).get("overall") or {}).get("value")
    return {
        "uid": f"garmin:sleep:{day}",
        "source": "garmin",
        "kind": "sleep",
        "title": "Sleep",
        "start_ts": start,
        "end_ts": end,
        "details": {
            "score": score,
            "asleep_min": _minutes(sleep.get("sleepTimeSeconds")),
            "deep_min": _minutes(sleep.get("deepSleepSeconds")),
            "light_min": _minutes(sleep.get("lightSleepSeconds")),
            "rem_min": _minutes(sleep.get("remSleepSeconds")),
            "awake_min": _minutes(sleep.get("awakeSleepSeconds")),
        },
    }


def _activity_row(activity: dict) -> dict:
    start = _gmt_to_ts(activity["startTimeGMT"])
    duration = float(activity.get("duration") or 0)
    type_key = (activity.get("activityType") or {}).get("typeKey", "activity")
    distance = activity.get("distance")
    return {
        "uid": f"garmin:activity:{activity['activityId']}",
        "source": "garmin",
        "kind": "exercise",
        "title": activity.get("activityName") or type_key.replace("_", " ").title(),
        "start_ts": start,
        "end_ts": start + int(duration),
        "details": {
            "type": type_key,
            "distance_km": round(distance / 1000, 2) if distance else None,
            "calories": activity.get("calories"),
            "avg_hr": activity.get("averageHR"),
            "max_hr": activity.get("maxHR"),
        },
    }


def _has_day(day: str) -> bool:
    return db.get_activity(f"garmin:sleep:{day}") is not None and bool(db.daily_stats_between(day, day))


def sync_garmin(
    days_back: int,
    client: Garmin | None = None,
    skip_existing: bool = False,
    progress: Callable[[float, str], None] | None = None,
    pause: float = 0.0,
) -> dict[str, int]:
    """Pull workouts, sleep and daily stats for the last `days_back` days.

    skip_existing: don't re-download days already stored (used for long
    history loads, so an interrupted load can simply be started again).
    """
    client = client or get_client()
    today = dt.datetime.now(TZ).date()
    days = [today - dt.timedelta(days=i) for i in range(days_back, -1, -1)]
    report = progress or (lambda fraction, text: None)

    # Workouts first: one paged request for the whole period.
    report(0.0, "Downloading workouts...")
    activities = client.get_activities_by_date(days[0].isoformat(), today.isoformat()) or []
    rows = [_activity_row(a) for a in activities if a.get("startTimeGMT")]
    db.upsert_activities(rows)

    nights = failed = 0
    recent = {today - dt.timedelta(days=i) for i in range(3)}  # always refresh the last days
    for i, day in enumerate(days):
        ds = day.isoformat()
        report((i + 1) / len(days), f"Sleep and daily stats: {ds}")
        if skip_existing and day not in recent and _has_day(ds):
            continue
        try:
            sleep = (client.get_sleep_data(ds) or {}).get("dailySleepDTO") or {}
            row = _sleep_row(ds, sleep)
            if row:
                db.upsert_activities([row])
                nights += 1
            try:
                summary = client.get_user_summary(ds) or {}
            except Exception:
                summary = {}  # no data for that day
            if summary:
                db.set_daily_stats(ds, {k: summary.get(k) for k in STAT_KEYS})
        except Exception:
            failed += 1
            if failed >= 10:
                raise
        if pause:
            time.sleep(pause)

    result = {"workouts": len(rows), "nights of sleep": nights}
    if failed:
        result["days that failed (run again to retry)"] = failed
    return result


def load_history(days_back: int, progress: Callable[[float, str], None] | None = None) -> dict[str, int]:
    """Backfill a long period (e.g. 365 days). Safe to stop and run again."""
    return sync_garmin(days_back, skip_existing=True, progress=progress, pause=0.3)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Load Garmin history, e.g.  ./run.sh history 365")
    parser.add_argument("--days", type=int, default=365)
    args = parser.parse_args()

    def show(fraction: float, text: str) -> None:
        print(f"\r[{fraction * 100:5.1f}%] {text}   ", end="", flush=True)

    result = load_history(args.days, show)
    print("\nDone: " + ", ".join(f"{n} {what}" for what, n in result.items()))
