"""Google Calendar + Google Meet through the official (free) Google Calendar API.

Reads meetings from the calendars you pick, and creates new events with a
Google Meet link (that is how Google Meet meetings are created through the
API). Sign in once with:  ./run.sh google
"""

import datetime as dt
import json

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

import db
from config import BASE_DIR, DATA_DIR, TZ

SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",  # list your calendars and events
    "https://www.googleapis.com/auth/calendar.events",  # create events with a Meet link
]
CLIENT_SECRET = BASE_DIR / "google_credentials.json"
TOKEN = DATA_DIR / "google_token.json"


class GoogleLoginRequired(RuntimeError):
    pass


def has_client_secret() -> bool:
    return CLIENT_SECRET.exists()


def is_connected() -> bool:
    return TOKEN.exists()


def login() -> None:
    """Opens the browser for Google sign-in and saves the token."""
    if not has_client_secret():
        raise SystemExit(f"Missing {CLIENT_SECRET.name}. See README section 'Connect Google Calendar'.")
    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent", access_type="offline")
    TOKEN.write_text(creds.to_json())


def _credentials() -> Credentials:
    if not is_connected():
        raise GoogleLoginRequired("Google is not connected yet. Run `./run.sh google` once.")
    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if creds.valid:
        return creds
    try:
        creds.refresh(Request())
    except RefreshError as exc:
        raise GoogleLoginRequired(f"Google sign-in expired. Run `./run.sh google` again. ({exc})") from exc
    TOKEN.write_text(creds.to_json())
    return creds


def _service():
    return build("calendar", "v3", credentials=_credentials(), cache_discovery=False)


# ---------- calendars ----------

def list_calendars() -> list[dict]:
    """All calendars in your Google account: id, name, can_write, primary."""
    service, calendars, page = _service(), [], None
    while True:
        resp = service.calendarList().list(pageToken=page).execute()
        for c in resp.get("items", []):
            calendars.append({
                "id": c["id"],
                "name": c.get("summaryOverride") or c.get("summary") or c["id"],
                "can_write": c.get("accessRole") in ("owner", "writer"),
                "primary": bool(c.get("primary")),
            })
        page = resp.get("nextPageToken")
        if not page:
            break
    calendars.sort(key=lambda c: (not c["primary"], c["name"].lower()))
    db.set_meta("google_calendars_cache", json.dumps(calendars))
    return calendars


def cached_calendars() -> list[dict]:
    raw = db.get_meta("google_calendars_cache")
    return json.loads(raw) if raw else []


def selected_calendar_ids() -> list[str]:
    raw = db.get_meta("google_selected_calendars")
    return json.loads(raw) if raw else ["primary"]


def set_selected_calendar_ids(ids: list[str]) -> None:
    db.set_meta("google_selected_calendars", json.dumps(ids))


# ---------- events ----------

def meet_link(event: dict) -> str | None:
    if event.get("hangoutLink"):
        return event["hangoutLink"]
    for entry in (event.get("conferenceData") or {}).get("entryPoints", []):
        if entry.get("entryPointType") == "video":
            return entry.get("uri")
    return None


def _declined(event: dict) -> bool:
    return any(a.get("self") and a.get("responseStatus") == "declined" for a in event.get("attendees", []))


def _event_to_row(calendar_id: str, event: dict) -> dict | None:
    if event.get("status") == "cancelled" or _declined(event):
        return None
    start, end = event.get("start", {}), event.get("end", {})
    if "dateTime" not in start:
        return None  # all-day entries (holidays, out-of-office) are not timed meetings
    start_ts = int(dt.datetime.fromisoformat(start["dateTime"]).timestamp())
    end_ts = int(dt.datetime.fromisoformat(end.get("dateTime", start["dateTime"])).timestamp())
    details = {"calendar": calendar_id, "event_link": event.get("htmlLink")}
    if event.get("location"):
        details["location"] = event["location"]
    link = meet_link(event)
    if link:
        details["meet"] = link
    return {
        "uid": f"google:{calendar_id}:{event['id']}",
        "source": "google",
        "kind": "meeting",
        "title": event.get("summary") or "(no title)",
        "start_ts": start_ts,
        "end_ts": max(end_ts, start_ts),
        "details": details,
    }


def sync(days_back: int, days_ahead: int) -> int:
    """Refresh meetings of the selected calendars. Returns how many were stored."""
    service = _service()
    today = dt.datetime.now(TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    start = today - dt.timedelta(days=days_back)
    end = today + dt.timedelta(days=days_ahead + 1)

    rows = []
    for calendar_id in selected_calendar_ids():
        page = None
        while True:
            resp = service.events().list(
                calendarId=calendar_id,
                timeMin=start.isoformat(),
                timeMax=end.isoformat(),
                singleEvents=True,
                orderBy="startTime",
                maxResults=2500,
                pageToken=page,
            ).execute()
            for event in resp.get("items", []):
                row = _event_to_row(calendar_id, event)
                if row:
                    rows.append(row)
            page = resp.get("nextPageToken")
            if not page:
                break
    db.replace_source_range("google", int(start.timestamp()), int(end.timestamp()), rows)
    return len(rows)


def create_meeting(
    calendar_id: str,
    title: str,
    start: dt.datetime,
    minutes: int,
    attendees: list[str],
    description: str = "",
) -> dict:
    """Create a calendar event with a new Google Meet link, invite attendees,
    store it in the local log and return it as an activity row."""
    end = start + dt.timedelta(minutes=minutes)
    body = {
        "summary": title,
        "description": description,
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
        "attendees": [{"email": email} for email in attendees],
        "conferenceData": {
            "createRequest": {
                "requestId": f"daily-app-{int(dt.datetime.now().timestamp() * 1000)}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }
    event = _service().events().insert(
        calendarId=calendar_id,
        body=body,
        conferenceDataVersion=1,
        sendUpdates="all" if attendees else "none",
    ).execute()
    row = _event_to_row(calendar_id, event)
    if row:
        db.upsert_activities([row])
    return row
