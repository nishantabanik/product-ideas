"""Pull meetings from Google / Outlook calendars through their secret ICS links."""

import datetime as dt

import icalendar
import recurring_ical_events
import requests

import json

import db
from config import CALENDAR_FEEDS, TZ


def feeds() -> dict[str, list[str]]:
    """ICS links from .env plus the ones pasted in the app's Setup tab."""
    saved = json.loads(db.get_meta("ics_links") or "{}")
    return {src: list(dict.fromkeys(urls + saved.get(src, []))) for src, urls in CALENDAR_FEEDS.items()}


def set_saved_links(source: str, urls: list[str]) -> None:
    saved = json.loads(db.get_meta("ics_links") or "{}")
    saved[source] = urls
    db.set_meta("ics_links", json.dumps(saved))


def test_link(url: str) -> int:
    """Download a link and return how many events it contains (raises if invalid)."""
    return len(_fetch(url).walk("VEVENT"))


def _fetch(url: str) -> icalendar.Calendar:
    url = url.replace("webcal://", "https://", 1)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return icalendar.Calendar.from_ical(resp.content)


def _aware(value: dt.datetime) -> dt.datetime:
    return value.replace(tzinfo=TZ) if value.tzinfo is None else value


def _event_to_row(source: str, event) -> dict | None:
    if str(event.get("STATUS", "")).upper() == "CANCELLED":
        return None
    start = event.get("DTSTART")
    if start is None or not isinstance(start.dt, dt.datetime):
        return None  # all-day entries (holidays, out-of-office) are not timed meetings
    start = _aware(start.dt)

    if event.get("DTEND") is not None and isinstance(event["DTEND"].dt, dt.datetime):
        end = _aware(event["DTEND"].dt)
    elif event.get("DURATION") is not None:
        end = start + event["DURATION"].dt
    else:
        end = start

    start_ts = int(start.timestamp())
    location = str(event.get("LOCATION", "")).strip()
    return {
        "uid": f"{source}:{event.get('UID', '')}:{start_ts}",
        "source": source,
        "kind": "meeting",
        "title": str(event.get("SUMMARY", "")).strip() or "(no title)",
        "start_ts": start_ts,
        "end_ts": max(int(end.timestamp()), start_ts),
        "details": {"location": location} if location else {},
    }


def is_configured(skip: tuple[str, ...] = ()) -> bool:
    return any(urls for source, urls in feeds().items() if source not in skip)


def sync_calendars(days_back: int, days_ahead: int, skip: tuple[str, ...] = ()) -> dict[str, int]:
    """Refresh meetings from `days_back` days ago up to `days_ahead` days ahead.

    Sources in `skip` are left alone. Returns the number of meetings stored
    per calendar source.
    """
    today = dt.datetime.now(TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    start = today - dt.timedelta(days=days_back)
    end = today + dt.timedelta(days=days_ahead + 1)

    counts = {}
    for source, urls in feeds().items():
        if not urls or source in skip:
            continue
        rows = []
        for url in urls:
            calendar = _fetch(url)
            for event in recurring_ical_events.of(calendar).between(start, end):
                row = _event_to_row(source, event)
                if row:
                    rows.append(row)
        db.replace_source_range(source, int(start.timestamp()), int(end.timestamp()), rows)
        counts[source] = len(rows)
    return counts
