"""Turn Garmin activity type keys (e.g. "treadmill_running") into friendly
groups (e.g. "Running") for the daily / weekly tick marks."""

# (label, words): the first group whose word appears in the Garmin key wins.
GROUPS = [
    ("Running", ["run"]),
    ("Walking", ["walk"]),
    ("Hiking", ["hik"]),
    ("Cycling", ["cycl", "bik", "spin"]),
    ("Strength training", ["strength"]),
    ("Stairs", ["stair", "floor_climb"]),
    ("Jump rope", ["rope", "jump"]),
    ("HIIT", ["hiit"]),
    ("Cardio", ["cardio"]),
    ("Yoga", ["yoga"]),
    ("Pilates", ["pilates"]),
    ("Swimming", ["swim"]),
    ("Rowing", ["row"]),
    ("Elliptical", ["elliptical"]),
    ("Climbing", ["climb", "boulder"]),
    ("Breathwork", ["breath", "meditat"]),
]


def label(type_key: str | None) -> str:
    key = (type_key or "other").lower()
    for name, words in GROUPS:
        if any(word in key for word in words):
            return name
    return key.replace("_", " ").capitalize()
