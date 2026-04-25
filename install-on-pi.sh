#!/bin/bash
# SpinDeck — one-shot installer for Raspberry Pi 5 + Waveshare 7" HDMI
# Run on a fresh Raspberry Pi OS (Bookworm 64-bit) install:
#   curl -fsSL https://raw.githubusercontent.com/mohsinrazajaved/pi-demo-cycle-pro/dev/install-on-pi.sh | bash
#
# What it does:
#   1. Installs system deps (git, node 20, chromium, xinit, unclutter, serve)
#   2. Clones the repo, installs npm packages, builds the app
#   3. Drops a static dist into ~/spindeck and serves it on :5173
#   4. Configures ~/.xinitrc + ~/.bash_profile so the kiosk auto-launches at boot

set -euo pipefail

REPO="https://github.com/mohsinrazajaved/pi-demo-cycle-pro.git"
BRANCH="dev"
HOME_DIR="${HOME}"
APP_DIR="${HOME_DIR}/pi-demo-cycle-pro"
SERVE_DIR="${HOME_DIR}/spindeck"

echo "==> Installing system packages…"
sudo apt update
sudo apt install -y git curl xinit unclutter chromium-browser

echo "==> Installing Node.js 20…"
if ! command -v node >/dev/null || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
sudo npm install -g serve

echo "==> Cloning repo…"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull
else
  git clone -b "${BRANCH}" "${REPO}" "${APP_DIR}"
fi

echo "==> Installing npm deps + building…"
cd "${APP_DIR}"
npm install
npm run build

echo "==> Deploying static dist to ${SERVE_DIR}…"
mkdir -p "${SERVE_DIR}"
rm -rf "${SERVE_DIR:?}"/*
cp -r dist/* "${SERVE_DIR}/"
cp hardwareBridge.py "${SERVE_DIR}/" 2>/dev/null || true

echo "==> Writing ~/.xinitrc (kiosk launcher)…"
cat > "${HOME_DIR}/.xinitrc" <<'EOF'
#!/bin/bash
# Start the static server in the background, then kiosk Chromium
serve -s "$HOME/spindeck" -l 5173 >/tmp/spindeck-serve.log 2>&1 &

xset s off
xset -dpms
xset s noblank
xrdb -merge ~/.Xresources 2>/dev/null
unclutter -idle 0 &
xsetroot -solid black

# Wait for the server to come up
for i in {1..20}; do
  curl -fs http://localhost:5173 -o /dev/null && break
  sleep 0.5
done

exec chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble --disable-translate \
  --touch-events=enabled \
  --check-for-update-interval=31536000 \
  --disable-background-networking \
  --disable-default-apps \
  --no-first-run \
  --password-store=basic \
  --force-device-scale-factor=1 \
  --window-size=1024,600 \
  --window-position=0,0 \
  --start-fullscreen \
  --incognito \
  http://localhost:5173
EOF
chmod +x "${HOME_DIR}/.xinitrc"

echo "==> Adding startx hook to ~/.bash_profile…"
if ! grep -q 'startx' "${HOME_DIR}/.bash_profile" 2>/dev/null; then
  echo '[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && startx -- -br' >> "${HOME_DIR}/.bash_profile"
fi

echo "==> Configuring HDMI for 1024x600 (KMS-aware)…"
CMDLINE=/boot/firmware/cmdline.txt
if ! grep -q "video=HDMI" "${CMDLINE}" 2>/dev/null; then
  sudo sed -i 's|$| video=HDMI-A-1:1024x600M@60|' "${CMDLINE}"
fi

echo "==> Enabling auto-login on tty1…"
sudo raspi-config nonint do_boot_behaviour B2 || true

cat <<'DONE'

==========================================================
SpinDeck installed.  Reboot the Pi:   sudo reboot
After reboot, the kiosk launches automatically on the HDMI screen.
==========================================================
DONE
