"""Sync calendars and Garmin. Used by the app, and can be run on its own:

    python sync.py              # default number of days (SYNC_DAYS_BACK)
    python sync.py --days 30    # backfill a month
"""

import argparse
import hashlib
import time

import calendar_sync
import db
import garmin_sync
import google_api
import outlook_api
from config import SYNC_DAYS_AHEAD, SYNC_DAYS_BACK


def run_all(days_back: int = SYNC_DAYS_BACK) -> list[tuple[str, str]]:
    """Returns (level, message) pairs, level being "ok", "warn" or "skip"."""
    results = []

    # Google: the API when connected (./run.sh google), otherwise the ICS link if set.
    ics_skip = ()
    if google_api.is_connected():
        ics_skip = ("google",)
        try:
            n = google_api.sync(days_back, SYNC_DAYS_AHEAD)
            results.append(("ok", f"Google Calendar: {n} meetings"))
        except Exception as exc:
            results.append(("warn", f"Google Calendar sync failed: {exc}"))

    # Outlook: Microsoft sign-in when connected (./run.sh outlook), otherwise the ICS link if set.
    if outlook_api.is_connected():
        ics_skip = (*ics_skip, "outlook")
        try:
            n = outlook_api.sync(days_back, SYNC_DAYS_AHEAD)
            results.append(("ok", f"Outlook Calendar: {n} meetings"))
        except Exception as exc:
            results.append(("warn", f"Outlook sync failed: {exc}"))

    if calendar_sync.is_configured(skip=ics_skip):
        try:
            counts = calendar_sync.sync_calendars(days_back, SYNC_DAYS_AHEAD, skip=ics_skip)
            text = ", ".join(f"{n} {src} meetings" for src, n in counts.items())
            results.append(("ok", f"Calendar links: {text}"))
        except Exception as exc:
            results.append(("warn", f"Calendar link sync failed: {exc}"))
    elif not ics_skip:
        results.append(("skip", "No calendar connected yet (see Setup tab)."))

    if garmin_sync.is_configured():
        try:
            counts = garmin_sync.sync_garmin(days_back)
            text = ", ".join(f"{n} {what}" for what, n in counts.items())
            results.append(("ok", f"Garmin: {text}"))
        except Exception as exc:
            results.append(("warn", f"Garmin sync failed: {exc}"))
    else:
        results.append(("skip", "Garmin not set up yet (see Setup tab)."))

    db.set_meta("last_sync", str(time.time()))
    db.set_meta("last_sync_setup", setup_fingerprint())
    return results


def setup_fingerprint() -> str:
    """Changes whenever a connection is added or removed, so the app re-syncs
    right away instead of waiting for AUTO_SYNC_MINUTES."""
    parts = [
        repr(sorted(calendar_sync.feeds().items())),
        str(google_api.is_connected()),
        str(outlook_api.is_connected()),
        str(google_api.selected_calendar_ids()),
        str(garmin_sync.is_configured()),
    ]
    return hashlib.sha256("|".join(parts).encode()).hexdigest()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, default=SYNC_DAYS_BACK, help="how many past days to pull")
    args = parser.parse_args()
    for level, message in run_all(args.days):
        print(f"[{level}] {message}")
