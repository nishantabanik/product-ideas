"""Pomodoro timer and cycles. The running timer lives in the database, so it
survives page refreshes and even closing the browser.

A cycle is `rounds` focus sessions with a short break between them and a long
break at the end, e.g. focus, short, focus, short, focus, long. It moves on to
the next step by itself, also while the app is closed.
"""

import json
import time

import db
import movement

MIN_LOG_SECONDS = 60  # sessions shorter than this are not worth logging


def current() -> dict | None:
    timer = db.get_timer()
    if timer:
        timer["remaining"] = timer["planned_end_ts"] - time.time()
        timer["cycle"] = get_cycle()
    return timer


def get_cycle() -> dict | None:
    raw = db.get_meta("pomodoro_cycle")
    return json.loads(raw) if raw else None


def _set_cycle(cycle: dict | None) -> None:
    db.set_meta("pomodoro_cycle", json.dumps(cycle) if cycle else "")


def set_topic(topic: str) -> None:
    db.set_meta("current_topic", (topic or "").strip())


def topics() -> list[str]:
    """Topics used before, most recent first."""
    seen = []
    for a in reversed(db.activities_between(0, int(time.time()) + 1)):
        t = (a.get("details") or {}).get("topic")
        if a["source"] == "pomodoro" and t and t not in seen:
            seen.append(t)
    return seen


def start(phase: str, task: str, minutes: float, topic: str | None = None) -> None:
    """A single session, outside of a cycle."""
    _set_cycle(None)
    if topic is not None:
        set_topic(topic)
    db.start_timer(phase, task.strip(), minutes)


def _step_title(step: dict, task: str) -> str:
    return task if step["phase"] == "focus" else step["label"]


def start_cycle(task: str, focus: int, short: int, long: int, rounds: int = 3, topic: str | None = None) -> None:
    if topic is not None:
        set_topic(topic)
    steps = []
    for i in range(rounds):
        steps.append({"phase": "focus", "minutes": focus, "label": f"Focus {i + 1}/{rounds}"})
        last = i == rounds - 1
        steps.append({"phase": "break", "minutes": long if last else short, "label": "Long break" if last else "Short break"})
    cycle = {"task": task.strip(), "steps": steps, "step": 0}
    db.set_meta("last_task", cycle["task"])
    _set_cycle(cycle)
    db.set_meta("cycle_done_at", "")
    db.start_timer("focus", _step_title(steps[0], cycle["task"]), focus)


def tick() -> list[str]:
    """Finish every step whose time is up and start the next one.

    Returns what happened: "focus_done", "break_done", "cycle_done".
    """
    events = []
    while True:
        timer = db.get_timer()
        if not timer or timer["planned_end_ts"] > time.time():
            return events
        finish(completed=True, keep_cycle=True)
        events.append(f"{timer['phase']}_done")
        cycle = get_cycle()
        if not cycle:
            return events
        cycle["step"] += 1
        if cycle["step"] >= len(cycle["steps"]):
            _set_cycle(None)
            db.set_meta("cycle_done_at", str(timer["planned_end_ts"]))
            events.append("cycle_done")
            movement.cycle_finished()
            return events
        step = cycle["steps"][cycle["step"]]
        _set_cycle(cycle)
        # the next step starts exactly when the previous one ended
        db.start_timer(step["phase"], _step_title(step, cycle["task"]), step["minutes"], start_ts=timer["planned_end_ts"])


def last_task() -> str:
    return db.get_meta("last_task") or ""


def cycle_done_pending() -> bool:
    return bool(db.get_meta("cycle_done_at"))


def dismiss_cycle_done() -> None:
    db.set_meta("cycle_done_at", "")


def stop(log: bool = True) -> None:
    """Stop the timer (and the cycle). `log` keeps the time done so far."""
    if log:
        finish(completed=False)
    else:
        db.clear_timer()
    _set_cycle(None)


def finish(completed: bool, keep_cycle: bool = False) -> dict | None:
    """Stop the timer and log it. `completed` means it ran the full length."""
    timer = db.get_timer()
    if not timer:
        return None
    db.clear_timer()
    if not keep_cycle:
        _set_cycle(None)
    end = timer["planned_end_ts"] if completed else min(int(time.time()), timer["planned_end_ts"])
    if end - timer["start_ts"] < MIN_LOG_SECONDS:
        return None
    is_focus = timer["phase"] == "focus"
    row = {
        "uid": f"pomodoro:{timer['start_ts']}",
        "source": "pomodoro",
        "kind": "focus" if is_focus else "break",
        "title": timer["task"] or ("Deep work" if is_focus else "Break"),
        "start_ts": timer["start_ts"],
        "end_ts": end,
        "details": {"completed": completed, **({"topic": db.get_meta("current_topic")} if is_focus and db.get_meta("current_topic") else {})},
    }
    db.upsert_activities([row])
    return row
