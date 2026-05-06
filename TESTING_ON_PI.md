# Testing SpinDeck on Your Raspberry Pi

A 3-minute setup. You'll be running the kiosk with one command.

## What you need

- **Raspberry Pi 5** (Pi 4 also works)
- **Waveshare 7" HDMI LCD (H)** — 1024×600 — or any HDMI display
- **microSD card** (16 GB+) flashed with **Raspberry Pi OS (64-bit, Bookworm)** — the regular "with desktop" image is fine
- **Internet** on the Pi (Wi-Fi or Ethernet)
- HDMI cable, power supply, USB keyboard for first boot

## Steps

### 1. Boot the Pi

Insert the SD card, plug in the HDMI display, connect to the internet, and power on. Complete the standard first-run setup (user, Wi-Fi, locale).

> Username for the rest of this guide doesn't matter — the script installs into `$HOME` for whichever user runs it.

### 2. Open a terminal and run

```bash
curl -fsSL https://raw.githubusercontent.com/mohsinrazajaved/pi-demo-cycle-pro/dev/install-on-pi.sh | bash
```

The script will:

- Install system packages (git, Chromium, xinit, unclutter)
- Install Node.js 20 and the `serve` static server
- Clone the repo into `~/pi-demo-cycle-pro`
- Build the production app
- Deploy the static dist to `~/spindeck`
- Configure `~/.xinitrc` so a kiosk Chromium auto-launches at boot
- Set HDMI mode to 1024×600 (KMS-aware via `cmdline.txt`)
- Enable auto-login on tty1

This takes ~3 minutes on a Pi 5 with a decent connection.

### 3. Reboot

```bash
sudo reboot
```

After reboot, the Pi will:

- Auto-login on tty1
- Start the X server via `~/.bash_profile`
- Launch Chromium in kiosk mode pointing at `http://localhost:5173`
- A static `serve` instance runs in the background and serves the built app

You should see the SpinDeck launcher fill the screen. Tap a program tile to start a session.

## Verifying it worked

| Check | Command |
|---|---|
| Kiosk Chromium is running | `pgrep -af chromium` |
| App is being served | `curl -s http://localhost:5173 \| head -3` |
| Display is 1024×600 | `cat /sys/class/drm/card*-HDMI-*/modes \| head -1` |

## Updating to the latest code

When the upstream repo changes, just rerun the same one-liner — it does a `git pull && npm run build` and replaces the deployed dist:

```bash
curl -fsSL https://raw.githubusercontent.com/mohsinrazajaved/pi-demo-cycle-pro/dev/install-on-pi.sh | bash
sudo reboot   # or: pkill chromium  (auto-restarts)
```

## Troubleshooting

**Black screen, nothing launches**
Check the X log:
```bash
cat ~/.xsession-errors
tail /tmp/spindeck-serve.log
```

**Kiosk shows but content is cropped at the bottom**
The display isn't running at native 1024×600. Verify:
```bash
xrandr 2>/dev/null || wlr-randr
```
If your display is on a different mode, edit `/boot/firmware/cmdline.txt` and adjust the `video=HDMI-A-1:…` parameter, then reboot.

**Want hardware controls (rotary encoder, pulse button)?**
The script doesn't enable the GPIO bridge by default. To wire up the Waveshare/encoder hardware, see `DEPLOY_ON_PI.md` in the repo (sections on `hardwareBridge.py` + systemd).

**Different display than 1024×600?**
The UI is locked to a 1024×600 design canvas and auto-scales to fit any viewport via `FitToViewport.jsx`. It will pillarbox/letterbox cleanly on other resolutions — no crop.

## Uninstall

```bash
rm -rf ~/pi-demo-cycle-pro ~/spindeck ~/.xinitrc
sed -i '/startx/d' ~/.bash_profile
```

---

Questions? Issues? File at https://github.com/mohsinrazajaved/pi-demo-cycle-pro/issues
