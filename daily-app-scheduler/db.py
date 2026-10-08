"""SQLite storage. Every logged thing is a row in `activities`.

Times are stored as UTC epoch seconds so daylight-saving changes never
confuse the ordering.
"""

import json
import sqlite3
import time
from contextlib import closing

from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS activities (
    uid      TEXT PRIMARY KEY,
    source   TEXT NOT NULL,      -- google, outlook, garmin, pomodoro, manual
    kind     TEXT NOT NULL,      -- meeting, focus, break, sleep, exercise, other
    title    TEXT,
    start_ts INTEGER NOT NULL,
    end_ts   INTEGER NOT NULL,
    details  TEXT
);
CREATE INDEX IF NOT EXISTS idx_activities_start ON activities(start_ts);

CREATE TABLE IF NOT EXISTS daily_stats (
    day  TEXT PRIMARY KEY,       -- YYYY-MM-DD
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS timer (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    phase          TEXT NOT NULL,  -- focus, break
    task           TEXT,
    start_ts       INTEGER NOT NULL,
    planned_end_ts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);
"""


def _connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
    return con


def _row_to_activity(row: sqlite3.Row) -> dict:
    a = dict(row)
    a["details"] = json.loads(a["details"]) if a["details"] else {}
    return a


def _insert(con: sqlite3.Connection, rows: list[dict]) -> None:
    con.executemany(
        "INSERT OR REPLACE INTO activities (uid, source, kind, title, start_ts, end_ts, details) "
        "VALUES (:uid, :source, :kind, :title, :start_ts, :end_ts, :details)",
        [{**r, "details": json.dumps(r.get("details") or {})} for r in rows],
    )


def upsert_activities(rows: list[dict]) -> None:
    with closing(_connect()) as con, con:
        _insert(con, rows)


def replace_source_range(source: str, start_ts: int, end_ts: int, rows: list[dict]) -> None:
    """Swap all `source` rows starting in [start_ts, end_ts) for `rows`.

    Used for calendars so that cancelled or moved meetings disappear.
    """
    with closing(_connect()) as con, con:
        con.execute(
            "DELETE FROM activities WHERE source = ? AND start_ts >= ? AND start_ts < ?",
            (source, start_ts, end_ts),
        )
        _insert(con, rows)


def activities_between(start_ts: int, end_ts: int) -> list[dict]:
    """Activities overlapping [start_ts, end_ts), oldest first."""
    with closing(_connect()) as con:
        rows = con.execute(
            "SELECT * FROM activities WHERE start_ts < ? AND end_ts > ? ORDER BY start_ts",
            (end_ts, start_ts),
        ).fetchall()
    return [_row_to_activity(r) for r in rows]


def get_activity(uid: str) -> dict | None:
    with closing(_connect()) as con:
        row = con.execute("SELECT * FROM activities WHERE uid = ?", (uid,)).fetchone()
    return _row_to_activity(row) if row else None


def delete_activity(uid: str) -> None:
    with closing(_connect()) as con, con:
        con.execute("DELETE FROM activities WHERE uid = ?", (uid,))


def set_daily_stats(day: str, data: dict) -> None:
    with closing(_connect()) as con, con:
        con.execute(
            "INSERT OR REPLACE INTO daily_stats (day, data) VALUES (?, ?)", (day, json.dumps(data))
        )


def daily_stats_between(first_day: str, last_day: str) -> dict[str, dict]:
    with closing(_connect()) as con:
        rows = con.execute(
            "SELECT day, data FROM daily_stats WHERE day BETWEEN ? AND ?", (first_day, last_day)
        ).fetchall()
    return {r["day"]: json.loads(r["data"]) for r in rows}


def get_timer() -> dict | None:
    with closing(_connect()) as con:
        row = con.execute("SELECT * FROM timer WHERE id = 1").fetchone()
    return dict(row) if row else None


def start_timer(phase: str, task: str, minutes: float, start_ts: int | None = None) -> None:
    now = int(start_ts if start_ts is not None else time.time())
    with closing(_connect()) as con, con:
        con.execute(
            "INSERT OR REPLACE INTO timer (id, phase, task, start_ts, planned_end_ts) VALUES (1, ?, ?, ?, ?)",
            (phase, task, now, now + int(minutes * 60)),
        )


def clear_timer() -> None:
    with closing(_connect()) as con, con:
        con.execute("DELETE FROM timer")


def get_meta(key: str) -> str | None:
    with closing(_connect()) as con:
        row = con.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else None


def set_meta(key: str, value: str) -> None:
    with closing(_connect()) as con, con:
        con.execute("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", (key, value))
