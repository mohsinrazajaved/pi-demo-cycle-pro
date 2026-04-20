# Cycle Stats Pro

A fully-offline React/Vite exercise bike display demo for Raspberry Pi 5 + Waveshare 7" HDMI 1024×600 touchscreen.

## What it is

A simulated exercise bike dashboard: timer, calorie counter, RPM and power gauges, heart rate monitor screen, workout history — all rendered locally, no backend, no internet.

Two physical inputs affect the demo:

- **Rotary encoder** → changes resistance/tension up or down
- **Push button** → shows the heart rate screen for 15 s, then auto-returns

Everything else (RPM, watts, calories, speed, heart rate) is a fixed demo loop.

## Quick start (development)

```bash
npm install
npm run dev
```
Then open <http://localhost:5173>.

To simulate the hardware inputs on your Mac without the Pi:
```bash
pip3 install websockets aiohttp
python3 mock-hardware.py
```
Trigger events via curl:
```bash
curl http://localhost:8766/button
curl http://localhost:8766/encoder/up
curl http://localhost:8766/encoder/down
```

## Deploying on a Raspberry Pi

See **[DEPLOY_ON_PI.md](./DEPLOY_ON_PI.md)** for the full step-by-step guide: hardware wiring, OS setup, systemd services, kiosk mode autostart.

## Project structure

```
src/
├── pages/              screen-level components (Home, BikeComputer, HeartRateCheck, ...)
├── components/bike/    gauges, keyboards, sliders, splash screen, etc.
├── api/mockDataService.js   localStorage-backed CRUD for profiles and workouts
└── lib/                shared helpers (query client, auth stub)
encoder.py              Raspberry Pi GPIO bridge (reads encoder + button, serves WebSocket on :8765)
mock-hardware.py        Mac-side mock bridge (HTTP triggers + keyboard input)
```

## Stack

React 18 · Vite · TailwindCSS · Framer Motion · Recharts · React Router · TanStack Query.
Python 3 + `websockets` + `RPi.GPIO` for the hardware bridge.
