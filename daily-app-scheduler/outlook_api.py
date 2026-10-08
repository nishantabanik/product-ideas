"""Outlook / Microsoft 365 calendar through the official Microsoft Graph API.

Sign in once with:  ./run.sh outlook
(shows a short code; you enter it at microsoft.com/devicelogin and sign in).
Works for work/school accounts and, with your own app ID, for personal
Outlook.com accounts. Read-only: the app only asks for Calendars.Read.
"""

import datetime as dt
import os

import msal
import requests

import db
from config import DATA_DIR, TZ

# Microsoft's own public app for command-line Graph access. Your organisation
# may require its own app; then set MS_CLIENT_ID in .env (see README).
DEFAULT_CLIENT_ID = "14d82eec-204b-4c2f-b7e8-296a70dab67e"
SCOPES = ["Calendars.Read"]
TOKEN_CACHE = DATA_DIR / "ms_token_cache.json"
GRAPH = "https://graph.microsoft.com/v1.0"


class OutlookLoginRequired(RuntimeError):
    pass


def _client_id() -> str:
    return (os.getenv("MS_CLIENT_ID") or "").strip() or DEFAULT_CLIENT_ID


def _app() -> tuple[msal.PublicClientApplication, msal.SerializableTokenCache]:
    cache = msal.SerializableTokenCache()
    if TOKEN_CACHE.exists():
        cache.deserialize(TOKEN_CACHE.read_text())
    app = msal.PublicClientApplication(
        _client_id(), authority="https://login.microsoftonline.com/common", token_cache=cache
    )
    return app, cache


def _save(cache: msal.SerializableTokenCache) -> None:
    if cache.has_state_changed:
        TOKEN_CACHE.write_text(cache.serialize())


def is_connected() -> bool:
    if not TOKEN_CACHE.exists():
        return False
    app, _ = _app()
    return bool(app.get_accounts())


def login() -> str:
    """Device-code sign-in in the terminal. Returns the signed-in account name."""
    app, cache = _app()
    flow = app.initiate_device_flow(scopes=SCOPES)
    if "user_code" not in flow:
        raise SystemExit(f"Could not start the Microsoft sign-in: {flow.get('error_description', flow)}")
    print(flow["message"], flush=True)
    result = app.acquire_token_by_device_flow(flow)
    if "access_token" not in result:
        raise SystemExit(f"Microsoft sign-in failed: {result.get('error_description', result)}")
    _save(cache)
    return result.get("id_token_claims", {}).get("preferred_username", "your account")


def logout() -> None:
    TOKEN_CACHE.unlink(missing_ok=True)


def _token() -> str:
    app, cache = _app()
    accounts = app.get_accounts()
    if not accounts:
        raise OutlookLoginRequired("Outlook is not connected. Run `./run.sh outlook` once.")
    result = app.acquire_token_silent(SCOPES, account=accounts[0])
    _save(cache)
    if not result or "access_token" not in result:
        raise OutlookLoginRequired("Outlook sign-in expired. Run `./run.sh outlook` again.")
    return result["access_token"]


def _event_to_row(event: dict) -> dict | None:
    if event.get("isCancelled") or event.get("isAllDay"):
        return None
    if (event.get("responseStatus") or {}).get("response") == "declined":
        return None
    # times come back in UTC because of the Prefer header
    start = dt.datetime.fromisoformat(event["start"]["dateTime"][:19]).replace(tzinfo=dt.timezone.utc)
    end = dt.datetime.fromisoformat(event["end"]["dateTime"][:19]).replace(tzinfo=dt.timezone.utc)
    details = {"event_link": event.get("webLink")}
    location = (event.get("location") or {}).get("displayName")
    if location:
        details["location"] = location
    join = (event.get("onlineMeeting") or {}).get("joinUrl") or event.get("onlineMeetingUrl")
    if join:
        details["meet"] = join  # Teams / Zoom / Meet link, shown as "Join"
    return {
        "uid": f"outlook:{event['id']}",
        "source": "outlook",
        "kind": "meeting",
        "title": event.get("subject") or "(no title)",
        "start_ts": int(start.timestamp()),
        "end_ts": max(int(end.timestamp()), int(start.timestamp())),
        "details": details,
    }


def sync(days_back: int, days_ahead: int) -> int:
    headers = {"Authorization": f"Bearer {_token()}", "Prefer": 'outlook.timezone="UTC"'}
    today = dt.datetime.now(TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    start = today - dt.timedelta(days=days_back)
    end = today + dt.timedelta(days=days_ahead + 1)
    url = f"{GRAPH}/me/calendarView"
    params = {
        "startDateTime": start.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endDateTime": end.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "$select": "id,subject,start,end,isAllDay,isCancelled,location,onlineMeeting,onlineMeetingUrl,responseStatus,webLink",
        "$top": "200",
    }
    rows = []
    while url:
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.status_code == 401:
            raise OutlookLoginRequired("Outlook sign-in expired. Run `./run.sh outlook` again.")
        resp.raise_for_status()
        data = resp.json()
        rows += [r for r in map(_event_to_row, data.get("value", [])) if r]
        url, params = data.get("@odata.nextLink"), None
    db.replace_source_range("outlook", int(start.timestamp()), int(end.timestamp()), rows)
    return len(rows)
