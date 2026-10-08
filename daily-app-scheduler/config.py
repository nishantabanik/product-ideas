"""App settings, read from the .env file next to this script."""

import datetime as dt
import os
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "daily.db"
GARMIN_TOKENS = DATA_DIR / "garmin_tokens"


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


def _urls(name: str) -> list[str]:
    return [u.strip() for u in _env(name).split(",") if u.strip()]


def _timezone():
    name = _env("TIMEZONE")
    if name:
        return ZoneInfo(name)
    return dt.datetime.now().astimezone().tzinfo


TZ = _timezone()

CALENDAR_FEEDS = {
    "google": _urls("GOOGLE_ICS_URLS"),
    "outlook": _urls("OUTLOOK_ICS_URLS"),
}

GARMIN_EMAIL = _env("GARMIN_EMAIL")
GARMIN_PASSWORD = _env("GARMIN_PASSWORD")

AUTO_SYNC_MINUTES = int(_env("AUTO_SYNC_MINUTES", "60"))
SYNC_DAYS_BACK = int(_env("SYNC_DAYS_BACK", "7"))
SYNC_DAYS_AHEAD = 7
