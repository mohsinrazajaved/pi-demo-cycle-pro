# SpinDeck — Raspberry Pi Deployment Guide

This guide walks through running **SpinDeck** on a Raspberry Pi 5 with a Waveshare 7" HDMI (H) 1024×600 touchscreen, and wiring up the two hardware inputs (rotary encoder + push button).

SpinDeck is a React/Vite static web app paired with a tiny Python GPIO bridge. No backend, no database, no internet required at runtime — everything runs locally.

---

## 1. Source Code

The project lives on GitHub:

### 🔗 Repository
**https://github.com/mohsinrazajaved/pi-demo-cycle-pro**

Clone anywhere (Mac, PC, or directly on the Pi):
```bash
git clone https://github.com/mohsinrazajaved/pi-demo-cycle-pro.git spindeck
cd spindeck
```

Folder layout:
```
spindeck/
├── hardwareBridge.py     Python GPIO → WebSocket bridge (runs on Pi)
├── mockBridge.py         Mac/PC mock bridge for testing without hardware
├── DEPLOY_ON_PI.md       (this file)
├── src/                  React source — build with `npm run build`
├── public/logo.png       splash logo (bundled with the app, no CDN)
├── index.html
├── package.json
└── ...
```

> The `dist/` folder (built static files) is **not in the repo** — build it once with `npm run build` before serving.

---

## 2. Hardware Bill of Materials

| Item | Notes |
|---|---|
| Raspberry Pi 5 | 4 GB+ recommended |
| Waveshare 7" HDMI LCD (H) — 1024×600 | https://www.waveshare.com/wiki/7inch_HDMI_LCD_(H)_(with_case) |
| Rotary encoder (KY-040 or equivalent) | 3-pin: CLK, DT, GND (+3.3V if VCC present) |
| Momentary push button | Any SPST |
| 5 mm LED (optional) | Flashes on button press |
| 220 Ω resistor | In series with the LED |
| ~8 jumper wires | |
| microSD 16 GB+ | Raspberry Pi OS |
| HDMI cable | Pi → panel |
| USB-C 5V/5A supply | For Pi 5 |

---

## 3. Wiring (BCM pin numbers)

### Rotary encoder (KY-040)

| Encoder pin | Pi BCM | Physical pin |
|---|---|---|
| CLK | GPIO 17 | Pin 11 |
| DT  | GPIO 18 | Pin 12 |
| GND | GND | Pin 9 (or any GND) |
| `+` / VCC (if present) | 3.3V | Pin 1 |

### Push button

| Button leg | Pi BCM | Physical pin |
|---|---|---|
| One leg | GPIO 23 | Pin 16 |
| Other leg | GND | any GND |

Uses the Pi's internal pull-up — no external resistor needed. Button shorts GPIO 23 → GND when pressed.

### LED (optional)

| LED | Connection |
|---|---|
| Anode (long leg, +) | → 220 Ω resistor → GPIO 24 (Pin 18) |
| Cathode (short leg, –) | GND |

---

## 4. Raspberry Pi OS setup

### Flash the OS

Use Raspberry Pi Imager → **Raspberry Pi OS (64-bit) with Desktop** → write to SD. Pre-configure user, Wi-Fi, SSH. Insert SD, connect HDMI + panel + power.

### Waveshare 1024×600 display config

Some Waveshare panels need an explicit mode. Edit the boot config:
```bash
sudo nano /boot/firmware/config.txt
```
Add at the end if missing:
```
hdmi_group=2
hdmi_mode=87
hdmi_cvt=1024 600 60 6 0 0 0
hdmi_drive=1
```
Reboot: `sudo reboot`.

---

## 5. Install dependencies on the Pi

```bash
# Node.js (used by `serve` for the static build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g serve

# Python GPIO libs (RPi.GPIO comes pre-installed; websockets via apt on Bookworm)
sudo apt-get install -y python3-websockets

# Cursor hider for kiosk
sudo apt-get install -y unclutter
```

---

## 6. Get the app onto the Pi

### Recommended — clone + build on the Pi

SSH in (or work on the touchscreen directly):

```bash
cd ~
git clone https://github.com/mohsinrazajaved/pi-demo-cycle-pro.git spindeck-src
cd spindeck-src
npm install                # ~2–3 min
npm run build              # ~20 s

mkdir -p ~/spindeck
cp -r dist/* ~/spindeck/
cp hardwareBridge.py ~/spindeck/
```

End state:
```
/home/pi/spindeck/
├── index.html
├── logo.png
├── assets/
│   ├── index-XXXXX.js
│   └── index-XXXXX.css
└── hardwareBridge.py
```

### Alternative — build on Mac, copy via SCP

```bash
# On the Mac
git clone https://github.com/mohsinrazajaved/pi-demo-cycle-pro.git
cd pi-demo-cycle-pro
npm install && npm run build

scp -r dist/ pi@<PI_IP>:~/spindeck
scp hardwareBridge.py pi@<PI_IP>:~/spindeck/
```

---

## 7. Manual sanity test

Two terminals:

**Terminal A — static server**
```bash
cd ~/spindeck
serve -s . -l 5173
```

**Terminal B — hardware bridge**
```bash
cd ~/spindeck
python3 hardwareBridge.py
```
You should see:
```
SpinDeck hardware bridge starting...
  Encoder CLK=17, DT=18
  Button PIN=23, LED=24
  WebSocket server on ws://localhost:8765
```

**Browser** (Chromium on the Pi): open `http://localhost:5173` — splash appears with the SpinDeck logo, fades into the Launcher.

### Hardware check
- Turn the encoder CW → resistance +1 per click (visible on the program timeline)
- Turn CCW → resistance –1
- Press the button → app jumps to Pulse View, "Returning in 15s" badge counts down, auto-returns. LED flashes on press.

---

## 8. Auto-start on boot (kiosk mode)

### systemd — static server
```bash
sudo nano /etc/systemd/system/spindeck-web.service
```
```ini
[Unit]
Description=SpinDeck — static web server
After=network.target

[Service]
ExecStart=/usr/bin/serve -s /home/pi/spindeck -l 5173
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

### systemd — hardware bridge
```bash
sudo nano /etc/systemd/system/spindeck-hw.service
```
```ini
[Unit]
Description=SpinDeck — GPIO hardware bridge
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/spindeck/hardwareBridge.py
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable spindeck-web spindeck-hw
sudo systemctl start  spindeck-web spindeck-hw
```

### Chromium kiosk autostart
```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/spindeck-kiosk.desktop
```
```ini
[Desktop Entry]
Type=Application
Name=SpinDeck Kiosk
Exec=bash -c "sleep 10 && unclutter -idle 0 & chromium-browser --kiosk --force-device-scale-factor=1 --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-translate --incognito --touch-events=enabled --check-for-update-interval=31536000 http://localhost:5173"
X-GNOME-Autostart-enabled=true
```

Reboot: `sudo reboot`. When the Pi comes back up: desktop flashes briefly → Chromium takes over fullscreen → SpinDeck splash → Launcher. Encoder and button work immediately.

---

## 9. Troubleshooting

### Blank / white screen
- `Ctrl+Shift+I` → Console for errors
- Hard refresh: `Ctrl+Shift+R`

### Encoder / button unresponsive
```bash
sudo systemctl stop spindeck-hw
python3 ~/spindeck/hardwareBridge.py
# turn encoder / press button — script should print events
```
If nothing prints → wiring issue.

### React not receiving events
- WebSocket only connects when the user is on the RideDisplay screen. Pick a program first.
- Chromium DevTools → Network → WS → should show a connection to `ws://localhost:8765`.

### Logs
```bash
journalctl -u spindeck-web -f
journalctl -u spindeck-hw -f
```

### Stop autostart temporarily
```bash
sudo systemctl stop spindeck-web spindeck-hw
```

---

## 10. Updates

On the Pi:
```bash
cd ~/spindeck-src
git pull
npm install                 # only if package.json changed
npm run build
cp -r dist/* ~/spindeck/
cp hardwareBridge.py ~/spindeck/
sudo systemctl restart spindeck-hw   # if the Python script changed
```
Browser picks up the new UI on next refresh (`Ctrl+R`).

---

## 11. Demo behaviour (for reference)

Simulated metrics shown on RideDisplay during a session:

| Metric | Value |
|---|---|
| Wattage | 140 W (fixed) |
| Cadence | 65 RPM (fixed) |
| Speed | 10 km/h (fixed) |
| Calories | 500 / hour (8.33 / min) |
| Session length | 2 hours (default) |
| Segment | 2-min countdown, auto-restart |
| Pulse rate (Pulse View) | 120 BPM |
| Training zone | Fat Burn (68 % of max HR, age 44) |

User-affectable inputs:
- **Rotary encoder** → resistance 1–30
- **Push button** → Pulse View for 15 s, auto-return

---

## 12. Quick reference

| Task | Command |
|---|---|
| Start server manually | `serve -s ~/spindeck -l 5173` |
| Start hardware bridge manually | `python3 ~/spindeck/hardwareBridge.py` |
| Restart hardware bridge | `sudo systemctl restart spindeck-hw` |
| Tail bridge logs | `journalctl -u spindeck-hw -f` |
| Pi IP | `hostname -I` |
| Open app | `http://localhost:5173` |
