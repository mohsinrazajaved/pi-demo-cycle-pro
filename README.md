# SpinDeck

**Smart Indoor Cycling Display** — a fully-offline React/Vite dashboard for a Raspberry Pi 5 + Waveshare 7" HDMI 1024×600 touchscreen mounted on a stationary bike.

## Overview

SpinDeck simulates a complete indoor cycling console: session timers, calorie tracking, cadence + power gauges, a pulse-rate monitor, and workout history — all rendered locally with no backend, no cloud calls, no internet required.

Two physical inputs drive the real-time experience:

| Input | Effect |
|---|---|
| **Rotary encoder** | Increments / decrements resistance (bike tension) in real time |
| **Push button (LED)** | Jumps to the Pulse View screen for 15 s, then auto-returns |

Everything else — cadence, wattage, speed, heart rate — runs a fixed demo loop (500 kcal/hr, 140 W, 65 RPM, 10 km/h, 120 BPM).

## Dev quick start

```bash
npm install
npm run dev
```
App opens at <http://localhost:5173>.

### Simulating the hardware on a Mac / PC (no Pi needed)

```bash
pip3 install websockets aiohttp
python3 mockBridge.py
```

The mock bridge exposes the same WebSocket on `ws://localhost:8765` that the Pi's `hardwareBridge.py` serves. Trigger events over HTTP from any terminal:

```bash
curl http://localhost:8766/button          # jump to Pulse View for 15 s
curl http://localhost:8766/encoder/up      # tension +1
curl http://localhost:8766/encoder/down    # tension -1
```

## Raspberry Pi deployment

See **[DEPLOY_ON_PI.md](./DEPLOY_ON_PI.md)** for the full walk-through — OS setup, wiring, systemd services, Chromium kiosk autostart.

## Layout

```
src/
├── pages/
│   ├── Launcher.jsx         landing screen / program picker
│   ├── RideDisplay.jsx      active session (timers + gauges)
│   ├── PulseView.jsx        heart-rate monitor overlay screen
│   ├── RiderSetup.jsx       profile create / edit
│   ├── DurationSelect.jsx   program-duration chooser
│   └── SessionLog.jsx       workout history + charts
├── components/
│   ├── ride/                session-related UI (gauges, splash, timeline, pads)
│   ├── session/             history cards and charts
│   └── ui/                  shadcn primitives
├── services/
│   └── localStore.js        localStorage-backed CRUD for profiles + sessions
└── lib/                     helpers (router, query client, auth stub)

hardwareBridge.py            Raspberry Pi GPIO → WebSocket bridge
mockBridge.py                Mac/PC mock for hardware-free testing
```

## Stack

React 18 · Vite · TailwindCSS · Framer Motion · Recharts · React Router · TanStack Query · Python 3 (`websockets`, `RPi.GPIO`).
