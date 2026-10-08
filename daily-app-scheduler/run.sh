#!/usr/bin/env bash
# Start the Daily App.
#   ./run.sh          start the app (first run sets everything up)
#   ./run.sh update   also upgrade all packages (e.g. when Garmin sync breaks)
#   ./run.sh login    one-time Garmin login (asks for the verification code)
#   ./run.sh google   one-time Google sign-in (Calendar + Meet)
#   ./run.sh outlook  one-time Microsoft sign-in (Outlook calendar)
#   ./run.sh sync 30  pull the last 30 days of data without opening the app
#   ./run.sh history 365   load a year of Garmin history (can be stopped and re-run)
#   ./run.sh autostart on  start the app automatically when you log in to the Mac (off to stop)
#
# The app needs Python 3.12. macOS ships an older Python, so this script uses
# the free tool "uv" to download a private Python 3.12 just for this folder.
# Your system Python is not touched.
set -e
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv (one time, free, into ~/.local/bin)..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

venv_ok() {
  [ -x .venv/bin/python ] &&
    .venv/bin/python -c 'import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)' 2>/dev/null
}

if ! venv_ok; then
  echo "Creating .venv with Python 3.12..."
  rm -rf .venv
  uv venv --python 3.12 .venv
fi

if [ "$1" = "update" ]; then
  uv pip install --python .venv/bin/python --upgrade -r requirements.txt
else
  uv pip install --python .venv/bin/python --quiet -r requirements.txt
fi

[ -f .env ] || cp .env.example .env

PLIST="$HOME/Library/LaunchAgents/com.dailyapp.scheduler.plist"
autostart() {
  if [ "$(uname)" != "Darwin" ]; then echo "Autostart is only for macOS."; exit 1; fi
  case "$1" in
    on)
      mkdir -p "$HOME/Library/LaunchAgents" data
      cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.dailyapp.scheduler</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string><string>$PWD/run.sh</string>
    <string>--server.headless</string><string>true</string>
  </array>
  <key>WorkingDirectory</key><string>$PWD</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>StandardOutPath</key><string>$PWD/data/autostart.log</string>
  <key>StandardErrorPath</key><string>$PWD/data/autostart.log</string>
</dict>
</plist>
PLISTEOF
      launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
      launchctl bootstrap "gui/$(id -u)" "$PLIST"
      echo "Autostart is on. The app now runs in the background and starts when you log in."
      echo "Open it any time at http://localhost:8501 (bookmark it). Turn off with: ./run.sh autostart off"
      ;;
    off)
      launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
      rm -f "$PLIST"
      echo "Autostart is off."
      ;;
    *) echo "Use: ./run.sh autostart on   or   ./run.sh autostart off"; exit 1 ;;
  esac
  exit 0
}

case "$1" in
  login) exec .venv/bin/python garmin_login.py ;;
  google) exec .venv/bin/python google_login.py ;;
  outlook) exec .venv/bin/python -c 'import outlook_api; print("Connected:", outlook_api.login())' ;;
  sync) exec .venv/bin/python sync.py --days "${2:-7}" ;;
  history) exec .venv/bin/python garmin_sync.py --days "${2:-365}" ;;
  autostart) autostart "$2" ;;
  *)
    if curl -s --max-time 2 http://localhost:8501/_stcore/health >/dev/null 2>&1; then
      echo "Daily App is already running: http://localhost:8501"
      [ "$(uname)" = "Darwin" ] && open http://localhost:8501
      exit 0
    fi
    # the helper keeps the timer moving and sends notifications, even without a browser tab
    .venv/bin/python worker.py &
    WORKER=$!
    trap 'kill $WORKER 2>/dev/null' EXIT INT TERM
    .venv/bin/streamlit run app.py "$@"
    ;;
esac
