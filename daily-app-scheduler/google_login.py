"""One-time Google sign-in. Run this in a terminal:  ./run.sh google

Opens your browser, you pick your Google account and allow calendar access,
and the token is saved in data/google_token.json.
"""

import google_api


def main() -> None:
    google_api.login()
    calendars = google_api.list_calendars()
    print(f"Connected. Found {len(calendars)} calendars:")
    for c in calendars:
        print(f"  - {c['name']}{' (primary)' if c['primary'] else ''}")
    print("Pick which ones to sync in the app: Setup tab.")


if __name__ == "__main__":
    main()
