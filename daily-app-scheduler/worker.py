"""Background helper, started by run.sh next to the app.

Keeps the Pomodoro cycle moving, sends Mac notifications (break time, cycle
done, meeting in 5 minutes, time to move), syncs every AUTO_SYNC_MINUTES and
emails the weekly report on Monday morning. Works without a browser tab open.
"""

import datetime as dt
import json
import threading
import time

import db

HEARTBEAT_SECONDS = 10
MEETING_REMINDER_MINUTES = 5


# ---------- shared with the app ----------

def alive() -> bool:
    seen = db.get_meta("worker_seen")
    return bool(seen) and time.time() - float(seen) < HEARTBEAT_SECONDS


def push_ui_events(events: list[str]) -> None:
    queued = json.loads(db.get_meta("ui_events") or "[]")
    db.set_meta("ui_events", json.dumps(queued + events))


def pop_ui_events() -> list[str]:
    queued = json.loads(db.get_meta("ui_events") or "[]")
    if queued:
        db.set_meta("ui_events", "[]")
    return queued


# ---------- the loop ----------

def _pomodoro_notifications(events: list[str]) -> None:
    import notifier
    import pomodoro

    if "cycle_done" in events:
        notifier.notify("Pomodoro cycle complete", "Well done! Open Daily App to start another cycle.", "Purr")
        return
    timer = pomodoro.current()
    if not timer:
        return
    minutes = round((timer["planned_end_ts"] - timer["start_ts"]) / 60)
    if timer["phase"] == "break":
        notifier.notify("Break time", f"{timer['task']}: {minutes} min. Stand up and stretch.")
    else:
        notifier.notify("Back to focus", f"{timer['task'] or 'Deep work'}: {minutes} min.")


def _meeting_reminders() -> None:
    import notifier
    import rooms

    now = int(time.time())
    sent = json.loads(db.get_meta("reminded_meetings") or "{}")
    names = rooms.titles()
    for a in db.activities_between(now, now + MEETING_REMINDER_MINUTES * 60 + 1):
        key = f"{a['uid']}@{a['start_ts']}"
        if a["kind"] != "meeting" or a["start_ts"] <= now or key in sent or rooms.is_open_room(a, names):
            continue
        minutes = max(1, round((a["start_ts"] - now) / 60))
        link = " Join link in Daily App." if a["details"].get("meet") else ""
        notifier.notify("Meeting soon", f"{a['title']} starts in {minutes} min.{link}", "Ping")
        sent[key] = a["start_ts"]
    sent = {k: v for k, v in sent.items() if v > now - 86400}
    db.set_meta("reminded_meetings", json.dumps(sent))


def _movement_reminder() -> None:
    import movement
    import notifier

    if movement.due():
        task = movement.suggestion()
        if db.get_meta("move_notified") != task:
            notifier.notify("Time to move", task, "Hero")
            db.set_meta("move_notified", task)


def _periodic_sync() -> None:
    import sync
    from config import AUTO_SYNC_MINUTES

    last = float(db.get_meta("last_sync") or 0)
    if time.time() - last >= AUTO_SYNC_MINUTES * 60:
        sync.run_all()


def _weekly_report() -> None:
    import report
    from config import TZ

    now = dt.datetime.now(TZ)
    if now.weekday() != 0 or now.hour < 8 or not report.email_configured():
        return
    week = (now.date() - dt.timedelta(days=7)).isoformat()
    if db.get_meta("report_sent_for") == week:
        return
    report.send(dt.date.fromisoformat(week))
    db.set_meta("report_sent_for", week)


def _slow_jobs() -> None:
    """Sync and the weekly email can take a while, so they run in their own thread."""
    while True:
        for job in (_periodic_sync, _weekly_report):
            try:
                job()
            except Exception as exc:
                print(f"helper ({job.__name__}): {exc}", flush=True)
        time.sleep(60)


def main() -> None:
    import pomodoro
    import rooms

    if alive():
        print("Daily App helper is already running.", flush=True)
        return
    print("Daily App helper running (notifications, timer, sync).", flush=True)
    threading.Thread(target=_slow_jobs, daemon=True).start()
    last_slow = 0.0
    while True:
        db.set_meta("worker_seen", str(time.time()))
        try:
            events = pomodoro.tick()
            if events:
                push_ui_events(events)
                _pomodoro_notifications(events)
            rooms.refresh()
            if time.time() - last_slow >= 30:
                last_slow = time.time()
                _meeting_reminders()
                _movement_reminder()
        except Exception as exc:  # keep running; the app shows sync errors itself
            print(f"helper: {exc}", flush=True)
        time.sleep(1)


if __name__ == "__main__":
    main()
