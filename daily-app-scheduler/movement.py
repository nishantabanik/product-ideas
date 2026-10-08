"""Movement nudges: after enough sitting and focusing, suggest a quick exercise
at the next break (never in the middle of a focus session)."""

import random
import time

import db

MODES = {
    "focus60": "After 60 min of focus",
    "cycles2": "After every 2 Pomodoro cycles",
    "off": "Off",
}
EXERCISES = [
    "20 jumping jacks",
    "10 push-ups",
    "5 pull-ups (or 10 band pull-downs)",
    "15 bodyweight squats",
    "30-second plank",
    "10 lunges per leg",
    "Climb 2 floors of stairs and back",
    "1 minute of skipping (jump rope or imaginary)",
    "10 burpees",
    "Neck, shoulder and wrist rolls for 1 minute",
    "Hip-flexor stretch, 30 seconds per side",
    "Walk around and drink a glass of water",
]
FOCUS_SECONDS = 60 * 60
CYCLES = 2


def mode() -> str:
    return db.get_meta("move_mode") or "focus60"


def _last_ack() -> int:
    raw = db.get_meta("move_last_ack")
    if not raw:
        now = int(time.time())
        db.set_meta("move_last_ack", str(now))
        return now
    return int(raw)


def focus_seconds_since(ts: int) -> int:
    total = 0
    for a in db.activities_between(ts, int(time.time()) + 1):
        if a["kind"] == "focus":
            total += a["end_ts"] - max(a["start_ts"], ts)
    timer = db.get_timer()
    if timer and timer["phase"] == "focus":
        total += int(time.time()) - max(timer["start_ts"], ts)
    return total


def cycle_finished() -> None:
    """Called by the Pomodoro when a full cycle ends."""
    db.set_meta("move_cycles", str(int(db.get_meta("move_cycles") or 0) + 1))


def _moved_since(ts: int) -> bool:
    """A Garmin workout since the last nudge counts as moving."""
    return any(a["kind"] == "exercise" for a in db.activities_between(ts, int(time.time()) + 1) if a["start_ts"] >= ts)


def due() -> bool:
    m = mode()
    if m == "off":
        return False
    now = int(time.time())
    if now < int(db.get_meta("move_snooze_until") or 0):
        return False
    timer = db.get_timer()
    if timer and timer["phase"] == "focus":
        return False  # wait for the next break
    last = _last_ack()
    if _moved_since(last):
        acknowledge(log=False)
        return False
    if m == "cycles2":
        return int(db.get_meta("move_cycles") or 0) >= CYCLES
    return focus_seconds_since(last) >= FOCUS_SECONDS


def suggestion() -> str:
    """Same suggestion until it is done or snoozed."""
    current = db.get_meta("move_suggestion")
    if not current:
        current = random.choice(EXERCISES)
        db.set_meta("move_suggestion", current)
    return current


def acknowledge(log: bool = True) -> None:
    now = int(time.time())
    if log:
        db.upsert_activities([{
            "uid": f"move:{now}", "source": "movement", "kind": "movement",
            "title": db.get_meta("move_suggestion") or "Movement break",
            "start_ts": now - 120, "end_ts": now, "details": {},
        }])
    db.set_meta("move_last_ack", str(now))
    db.set_meta("move_cycles", "0")
    db.set_meta("move_suggestion", "")


def snooze(minutes: int = 10) -> None:
    db.set_meta("move_snooze_until", str(int(time.time()) + minutes * 60))
    db.set_meta("move_suggestion", "")
