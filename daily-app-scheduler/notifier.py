"""macOS notifications (Notification Centre) via osascript. Does nothing on other systems."""

import json
import subprocess
import sys

import db


def enabled() -> bool:
    return db.get_meta("notifications") != "off"


def notify(title: str, message: str, sound: str = "Glass") -> bool:
    if sys.platform != "darwin" or not enabled():
        return False
    script = f"display notification {json.dumps(message)} with title {json.dumps(title)} sound name {json.dumps(sound)}"
    try:
        subprocess.run(["osascript", "-e", script], timeout=10, check=False, capture_output=True)
        return True
    except (OSError, subprocess.SubprocessError):
        return False
