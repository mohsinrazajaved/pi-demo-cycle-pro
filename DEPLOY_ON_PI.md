# Cycle Stats Pro — Raspberry Pi Deployment Guide

This guide is for running **Cycle Stats Pro** on a Raspberry Pi 5 with a Waveshare 7" HDMI (H) 1024×600 touchscreen and testing the hardware inputs (rotary encoder + push button).

The app is a React/Vite static web app with a small Python "hardware bridge" script that reads GPIO pins and sends events to the browser via a local WebSocket. There is no backend, no database, no internet required — everything runs locally on the Pi.

---

## 1. What You're Getting

The project lives on GitHub here:

### 🔗 Repository
**https://github.com/mohsinrazajaved/pi-demo-cycle-pro**

Clone it anywhere (your Mac, PC, or directly on the Pi):
```bash
git clone https://github.com/mohsinrazajaved/pi-demo-cycle-pro.git cycle-stats-pro
cd cycle-stats-pro
```

Folder structure:
```
cycle-stats-pro/
├── encoder.py            ← Python GPIO bridge script (real hardware)
├── mock-hardware.py      ← optional: simulate events from a Mac/PC (no Pi)
├── DEPLOY_ON_PI.md       ← this file
├── src/                  ← React source code — build with `npm run build`
├── index.html
├── package.json
└── ...
```

> **Note:** The `dist/` folder (built static files) is **not in the repo** — you need to build it once with `npm run build` before serving. This only needs Node.js during the build step, not at runtime.

---

## 2. Hardware You Need

| Item | Notes |
|---|---|
| Raspberry Pi 5 | 4GB+ recommended |
| Waveshare 7" HDMI LCD (H) — 1024×600 | https://www.waveshare.com/wiki/7inch_HDMI_LCD_(H)_(with_case) |
| Rotary encoder (KY-040 or similar) | 3-pin: CLK, DT, GND (+3.3V if VCC present) |
| Push button (momentary) | Any SPST button |
| LED (5mm) | Optional — lights up and flashes on button press |
| 220Ω resistor | In series with the LED |
| Jumper wires | 6–8 of them |
| microSD card 16GB+ | For Raspberry Pi OS |
| HDMI cable | To connect Pi → screen |
| USB-C power supply for Pi | 5V/5A for Pi 5 |

---

## 3. Wiring

Use **BCM pin numbering** (the "GPIO XX" numbers, not physical pin numbers).

### Rotary Encoder (KY-040)

| Encoder pin | Pi pin (BCM) | Physical pin |
|---|---|---|
| CLK | GPIO 17 | Pin 11 |
| DT  | GPIO 18 | Pin 12 |
| GND | GND     | Pin 9 or any GND |
| `+` / VCC (if present) | 3.3V | Pin 1 or 17 |

The encoder has no SW (push) pin wired — the push-button is separate.

### Push Button

| Button terminal | Pi pin (BCM) | Physical pin |
|---|---|---|
| One leg | GPIO 23 | Pin 16 |
| Other leg | GND | Any GND |

(The script uses Pi's internal pull-up resistor, so no external pull-up is needed. The button shorts GPIO 23 → GND when pressed.)

### LED (optional, for press feedback)

| LED leg | Connection |
|---|---|
| Long leg (anode, +) | → 220Ω resistor → GPIO 24 (Pi physical pin 18) |
| Short leg (cathode, –) | GND |

If you don't have an LED handy, skip it — the script still works.

---

## 4. Raspberry Pi OS Setup

### Install Raspberry Pi OS

1. Use Raspberry Pi Imager → **Raspberry Pi OS (64-bit) with Desktop** → write to SD.
2. Pre-configure user (e.g., `pi`), WiFi, SSH enabled.
3. Insert SD, connect HDMI + touchscreen + power. Boot.

### Enable the Waveshare 7" screen

Most Waveshare HDMI screens are plug-and-play on a Pi, but the 1024×600 variant sometimes needs a config. Edit `/boot/firmware/config.txt`:

```bash
sudo nano /boot/firmware/config.txt
```

Ensure these are present (add at the end if missing):

```
hdmi_group=2
hdmi_mode=87
hdmi_cvt=1024 600 60 6 0 0 0
hdmi_drive=1
```

Save and reboot: `sudo reboot`.

---

## 5. Install Dependencies on the Pi

Once logged into the Pi (either on the touchscreen or via `ssh pi@<pi-ip>`):

```bash
# Node.js — only needed for `serve`, the static file server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g serve

# Python 3 + hardware libs (Python 3 is usually pre-installed)
sudo apt-get install -y python3-websockets
# Note: on Pi OS Bookworm, install websockets via apt (not pip) to avoid
# the externally-managed-environment error. RPi.GPIO is pre-installed.

# Optional: hides the mouse cursor in kiosk mode
sudo apt-get install -y unclutter
```

---

## 6. Get the App onto the Pi

### Recommended: Clone from GitHub + build on the Pi

This is the simplest end-to-end path and keeps you in sync with the latest code.

SSH into the Pi (or work directly on the touchscreen) and run:

```bash
# Clone the repo
cd ~
git clone https://github.com/mohsinrazajaved/pi-demo-cycle-pro.git cycle-stats-pro-src
cd cycle-stats-pro-src

# Install Node deps (one-time, ~2-3 min)
npm install

# Build the static web app (~20 sec)
npm run build

# Move the built files + encoder.py into a clean serving directory
mkdir -p ~/cycle-stats-pro
cp -r dist/* ~/cycle-stats-pro/
cp encoder.py ~/cycle-stats-pro/
```

**End state:** The Pi will have this directory ready to serve:
```
/home/pi/cycle-stats-pro/
├── index.html
├── assets/
│   ├── index-XXXXX.js
│   └── index-XXXXX.css
└── encoder.py
```

You can delete the `cycle-stats-pro-src` folder after building if you want to save space — but keep it if you plan to pull updates with `git pull` later.

---

### Alternative paths (if the Pi has no internet)

**Build on your Mac, then SCP:**
```bash
# On the Mac
git clone https://github.com/mohsinrazajaved/pi-demo-cycle-pro.git
cd pi-demo-cycle-pro
npm install
npm run build

# Copy to Pi
scp -r dist/ pi@<PI_IP>:~/cycle-stats-pro
scp encoder.py pi@<PI_IP>:~/cycle-stats-pro/
```

**USB drive:**
Build on a machine with internet, copy `dist/` + `encoder.py` onto a USB, plug into Pi, then:
```bash
mkdir -p ~/cycle-stats-pro
cp -r /media/pi/<USB_NAME>/dist/* ~/cycle-stats-pro/
cp /media/pi/<USB_NAME>/encoder.py ~/cycle-stats-pro/
```

---

## 7. First Manual Test (before autostart)

Run everything manually once to confirm it works.

### Terminal 1 — static web server
```bash
cd ~/cycle-stats-pro
serve -s . -l 5173
```
You should see: `Accepting connections at http://localhost:5173`

### Terminal 2 — hardware bridge
```bash
cd ~/cycle-stats-pro
python3 encoder.py
```
You should see:
```
Cycle Stats Pro hardware bridge starting...
  Encoder CLK=17, DT=18
  Button PIN=23, LED=24
  WebSocket server on ws://localhost:8765
```

### Browser
Open Chromium on the Pi and go to `http://localhost:5173`.

You should see the Home screen. Pick a program (e.g., "GC Fat Burn") → duration (e.g., 120 min) → you land on the BikeComputer workout screen.

### Test the hardware

- **Turn the encoder clockwise** → resistance goes up by 1 each click. Visible in the program bar display (the orange highlighted bar moves up).
- **Turn the encoder counter-clockwise** → resistance goes down by 1.
- **Press the button** → screen jumps to the Heart Rate monitor, countdown badge "Returning in 15s" appears top-right, at 0s it returns to the workout with everything preserved. The LED flashes briefly when pressed.

In Terminal 2 you should see the bridge print events as they happen.

If something doesn't work, see **Troubleshooting** at the bottom.

---

## 8. Auto-start on Boot (Kiosk Mode)

Once manual testing works, set it up to start automatically at boot with no interaction required.

### systemd service — static web server

```bash
sudo nano /etc/systemd/system/cyclestats-web.service
```
Paste (replace `YOUR_USERNAME` with the output of `whoami`):
```ini
[Unit]
Description=Cycle Stats Pro — static web server
After=network.target

[Service]
ExecStart=/usr/bin/serve -s /home/YOUR_USERNAME/cycle-stats-pro -l 5173
Restart=always
User=YOUR_USERNAME

[Install]
WantedBy=multi-user.target
```

### systemd service — GPIO bridge

```bash
sudo nano /etc/systemd/system/cyclestats-hw.service
```
Paste (replace `YOUR_USERNAME` with the output of `whoami`):
```ini
[Unit]
Description=Cycle Stats Pro — GPIO hardware bridge
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/YOUR_USERNAME/cycle-stats-pro/encoder.py
Restart=always
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME

[Install]
WantedBy=multi-user.target
```

> **Note:** `WorkingDirectory` is required — lgpio (the GPIO backend on Pi OS Bookworm) creates temporary pipe files in the working directory and will fail if it defaults to `/`.

### Enable + start both

Also ensure your user is in the `gpio` group (required for GPIO access on Pi OS Bookworm):
```bash
sudo usermod -a -G gpio YOUR_USERNAME
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable cyclestats-web cyclestats-hw
sudo systemctl start  cyclestats-web cyclestats-hw

# Verify
systemctl status cyclestats-web
systemctl status cyclestats-hw
```
Both should be **active (running)** in green.

### Chromium kiosk — true kiosk mode (no desktop)

This approach boots to CLI and launches X with only Chromium — no desktop environment, no taskbar, no keyring prompt.

**Step 1 — Switch to CLI autologin:**

```bash
sudo raspi-config nonint do_boot_behaviour B2
```

**Step 2 — Create `~/.xinitrc`** (Chromium is the only process X starts):

```bash
nano ~/.xinitrc
```

Paste:

```bash
#!/bin/bash
xset s off
xset -dpms
xset s noblank
unclutter -idle 0 &
exec chromium --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble --disable-translate \
  --incognito --touch-events=enabled \
  --check-for-update-interval=31536000 \
  --password-store=basic \
  http://localhost:5173
```

**Step 3 — Auto-start X on login** (add to `~/.bash_profile`):

```bash
echo '[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && startx' >> ~/.bash_profile
```

### Hide cursor on touchscreen (blank cursor theme)

`unclutter` hides the cursor when idle, but on a touchscreen the cursor reappears on every tap. Fix this by creating a blank Xcursor theme — no extra packages needed, just Python 3.

**Step 1 — Generate the blank cursor file:**

```bash
python3 << 'EOF'
import struct, os

magic = b'Xcur'
file_header = struct.pack('<III', 16, 0x00010000, 1)
toc = struct.pack('<III', 0xFFFD0002, 1, 28)
img_header = struct.pack('<IIIIIIIII', 36, 0xFFFD0002, 1, 1, 1, 1, 0, 0, 50)
pixel = struct.pack('<I', 0x00000000)

data = magic + file_header + toc + img_header + pixel
with open('/tmp/blank_cursor', 'wb') as f:
    f.write(data)
print('Blank cursor created')
EOF
```

**Step 2 — Install it as a cursor theme:**

```bash
mkdir -p ~/.icons/blank-cursor/cursors

for name in left_ptr default pointer hand1 hand2 watch wait xterm text crosshair move grabbing; do
    cp /tmp/blank_cursor ~/.icons/blank-cursor/cursors/$name
done

cat > ~/.icons/blank-cursor/index.theme << 'EOF'
[Icon Theme]
Name=blank-cursor
EOF

echo 'Xcursor.theme: blank-cursor' >> ~/.Xresources
```

**Step 3 — Load the theme in `~/.xinitrc`:**

Add `xrdb -merge ~/.Xresources` before the `exec chromium` line:

```bash
#!/bin/bash
xset s off
xset -dpms
xset s noblank
xrdb -merge ~/.Xresources
unclutter -idle 0 &
exec chromium --kiosk ...
```

### Reboot and verify

```bash
sudo reboot
```

Boot sequence: **CLI autologin → bash_profile triggers startx → xinitrc launches Chromium directly.**

When the Pi boots:

1. Cycle Stats Pro loads immediately — no desktop, no taskbar, no dialogs.
2. The encoder and button already work.

No keyboard, no mouse, no clicking required. The bike is ready to use.

---

## 9. Troubleshooting

### Blank white screen in browser
- Open DevTools in Chromium (`Ctrl+Shift+I`) → Console tab. Any red errors will tell you what's wrong.
- Hard-refresh with `Ctrl+Shift+R`.

### Encoder doesn't work
- Confirm `encoder.py` is running: `sudo systemctl status cyclestats-hw`
- Check the wiring: CLK to GPIO 17, DT to GPIO 18, GND to GND.
- Test without the UI:
  ```bash
  sudo systemctl stop cyclestats-hw
  python3 ~/cycle-stats-pro/encoder.py
  ```
  Turn the encoder — you should see output lines being sent. If nothing, it's a wiring/hardware issue.

### Button doesn't do anything
- Test without the UI (same as above) and press the button — the script should print/send an event.
- Make sure you wired GPIO 23 to button, and the **other leg to GND** (not 3.3V).

### React doesn't receive events even though Python sees them
- The React app only connects to the WebSocket when on the BikeComputer workout screen. Pick a program and start a workout first.
- In Chromium DevTools → Network tab → WS filter — you should see a connection to `ws://localhost:8765`. If it's red/failed, the bridge isn't running.

### "Address already in use" when starting encoder.py
- Another copy is already running:
  ```bash
  sudo systemctl stop cyclestats-hw
  pkill -f encoder.py
  ```

### Logs
```bash
# Web server
journalctl -u cyclestats-web -f

# Hardware bridge (shows button presses, encoder events)
journalctl -u cyclestats-hw -f
```

### Want to switch back from autostart to manual testing?
```bash
sudo systemctl stop cyclestats-web cyclestats-hw
sudo systemctl disable cyclestats-web cyclestats-hw
```
Then run the two manual commands from **Section 7** in two terminals.

---

## 10. Updating the App Later

When the developer pushes new changes to GitHub, pull + rebuild on the Pi:

```bash
cd ~/cycle-stats-pro-src
git pull
npm install            # only if package.json changed
npm run build
cp -r dist/* ~/cycle-stats-pro/
cp encoder.py ~/cycle-stats-pro/
sudo systemctl restart cyclestats-hw   # only if encoder.py changed
```

The browser will pick up the new UI on next refresh (`Ctrl+R` in Chromium). The static web server needs no restart.

If you built on a Mac instead, just rebuild and SCP:
```bash
# On Mac
git pull && npm run build
scp -r dist/* pi@<PI_IP>:~/cycle-stats-pro/
```

---

## 11. Demo Behavior (For Reference)

The app simulates an exercise bike workout with these fixed values:

| Metric | Value |
|---|---|
| Watts | 140 (fixed) |
| RPM | 65 (fixed) |
| Speed | 10 km/h |
| Calories | 500/hour (8.33/min) |
| Program duration | 2 hours (default) |
| Interval | 2-minute countdown, auto-restarts |
| Heart rate (when on HR screen) | 120 BPM |
| Training zone | Fat Burn (68% of max HR) |

The **only** things the user can physically affect:

- **Rotary encoder** → changes resistance (tension) level up or down
- **Push button** → shows heart rate monitor for 15 seconds, then auto-returns

Everything else is simulated.

---

## 12. Quick Reference Card

| Task | Command |
|---|---|
| Start web server manually | `serve -s ~/cycle-stats-pro -l 5173` |
| Start hardware bridge manually | `python3 ~/cycle-stats-pro/encoder.py` |
| Restart hardware bridge | `sudo systemctl restart cyclestats-hw` |
| View hardware events live | `journalctl -u cyclestats-hw -f` |
| Reboot Pi | `sudo reboot` |
| Find Pi's IP | `hostname -I` |
| Open app in Chromium | `http://localhost:5173` |

---

**Questions?** Contact the developer.
