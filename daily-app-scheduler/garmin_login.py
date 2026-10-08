"""One-time Garmin login. Run this in a terminal:  ./run.sh login

It handles the email verification / MFA code if Garmin asks for one and
saves a token in data/garmin_tokens/ so the app never needs your password
again (until the token expires, then just run this again).
"""

import getpass

from garminconnect import Garmin

from config import GARMIN_EMAIL, GARMIN_PASSWORD, GARMIN_TOKENS


def main() -> None:
    email = GARMIN_EMAIL or input("Garmin email: ").strip()
    password = GARMIN_PASSWORD or getpass.getpass("Garmin password: ")
    if not email or not password:
        raise SystemExit("Garmin email and password are needed (put them in .env or type them when asked).")
    client = Garmin(email, password, prompt_mfa=lambda: input("Garmin verification code: ").strip())
    client.login(str(GARMIN_TOKENS))
    client.client.dump(str(GARMIN_TOKENS))
    print(f"Logged in as {client.full_name or client.display_name}. Token saved in {GARMIN_TOKENS}/")


if __name__ == "__main__":
    main()
