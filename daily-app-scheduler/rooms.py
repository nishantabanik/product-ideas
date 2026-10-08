"""Open rooms: long calendar meetings that are only a standing invitation
(e.g. an all-day "Group Study" Google Meet). They are hidden from the
timeline and only count for the time you actually join them from the app.
"""

import json
import time

import db

AUTO_HOURS = 6  # meetings at least this long count as open rooms until you choose yourself
CALENDAR_SOURCES = ("google", "outlook")


def _calendar_meetings(days_back: int = 60, days_ahead: int = 14) -> list[dict]:
    now = int(time.time())
    return [
        a for a in db.activities_between(now - days_back * 86400, now + days_ahead * 86400)
        if a["kind"] == "meeting" and a["source"] in CALENDAR_SOURCES
    ]


def meeting_titles() -> list[str]:
    return sorted({a["title"] for a in _calendar_meetings()}, key=str.lower)


def auto_titles() -> list[str]:
    return sorted({a["title"] for a in _calendar_meetings() if a["end_ts"] - a["start_ts"] >= AUTO_HOURS * 3600})


def titles() -> set[str]:
    saved = db.get_meta("open_rooms")
    return set(json.loads(saved)) if saved else set(auto_titles())


def set_titles(names: list[str]) -> None:
    db.set_meta("open_rooms", json.dumps(sorted(names)))


def is_open_room(a: dict, names: set[str] | None = None) -> bool:
    names = titles() if names is None else names
    return a["kind"] == "meeting" and a["source"] in CALENDAR_SOURCES and a["title"] in names


def visible(activities: list[dict]) -> list[dict]:
    """Drop open-room calendar entries; the time you were really in them is kept separately."""
    names = titles()
    return [a for a in activities if not is_open_room(a, names)]


# ---------- being in a room ----------

def active() -> dict | None:
    raw = db.get_meta("room_session")
    return json.loads(raw) if raw else None


def join(title: str, meet: str | None, until_ts: int) -> None:
    if active():
        leave()
    now = int(time.time())
    session = {"uid": f"room:{now}", "title": title, "meet": meet, "start_ts": now, "until_ts": until_ts}
    db.set_meta("room_session", json.dumps(session))
    _save(session, now)


def refresh() -> None:
    """Extend the logged time while you are in the room; close it when the meeting ends."""
    session = active()
    if not session:
        return
    now = int(time.time())
    _save(session, min(now, session["until_ts"]))
    if now >= session["until_ts"]:
        db.set_meta("room_session", "")


def leave() -> None:
    session = active()
    if session:
        _save(session, min(int(time.time()), session["until_ts"]))
        db.set_meta("room_session", "")


def _save(session: dict, end_ts: int) -> None:
    db.upsert_activities([{
        "uid": session["uid"],
        "source": "room",
        "kind": "room",
        "title": session["title"],
        "start_ts": session["start_ts"],
        "end_ts": max(end_ts, session["start_ts"]),
        "details": {"meet": session["meet"]} if session.get("meet") else {},
    }])
