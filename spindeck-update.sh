#!/bin/bash
# Apply a SpinDeck update on the Raspberry Pi.
# Takes a pre-built tarball (made on the developer's machine via ./release.sh)
# and swaps it into the running kiosk — no git pull, no npm install, no build.
#
# Usage:
#   ./spindeck-update.sh /path/to/spindeck-build-<tag>.tar.gz
#
# Or double-click the .tar.gz from the file manager and pick "Open with…
# Run in Terminal" if your desktop is configured for it.
#
set -euo pipefail

ARCHIVE="${1:-}"
if [ -z "${ARCHIVE}" ]; then
  echo "Usage: $0 <spindeck-build-XYZ.tar.gz>"
  exit 1
fi
if [ ! -f "${ARCHIVE}" ]; then
  echo "Archive not found: ${ARCHIVE}"
  exit 1
fi

TARGET="${HOME}/spindeck"
WORK=$(mktemp -d)
trap 'rm -rf "${WORK}"' EXIT

echo "==> extracting ${ARCHIVE} → ${WORK}…"
tar xzf "${ARCHIVE}" -C "${WORK}"

if [ ! -d "${WORK}/dist" ]; then
  echo "ERROR: archive does not contain a dist/ folder. Wrong file?"
  exit 1
fi

echo "==> swapping in new dist/ → ${TARGET}…"
mkdir -p "${TARGET}"
rm -rf "${TARGET}"/*
cp -r "${WORK}/dist/"* "${TARGET}/"
[ -f "${WORK}/hardwareBridge.py" ] && cp "${WORK}/hardwareBridge.py" "${TARGET}/"

echo "==> restarting kiosk…"
# The .xinitrc while-loop relaunches chromium with the fresh files.
sudo pkill chromium 2>/dev/null || true

echo
echo "✓ Update applied. The screen will refresh in ~2 seconds."
