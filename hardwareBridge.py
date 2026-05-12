#!/usr/bin/env python3
"""
SpinDeck — Hardware Bridge
Raspberry Pi 5 GPIO → WebSocket server

Inputs:
  - Rotary encoder  → sends {"type": "resistance", "delta": +1 or -1}
  - Push button     → sends {"type": "button_press"}

React app connects to ws://localhost:8765 to receive these events.

Wiring (BCM pin numbers):
  Encoder CLK  → GPIO 17
  Encoder DT   → GPIO 18
  Encoder GND  → GND
  Encoder VCC  → 3.3V

  Button Signal → GPIO 23  (with 10kΩ pull-down, or use internal pull-up)
  Button LED    → GPIO 24  (via 220Ω resistor)
  Button GND    → GND
  Button VCC    → 3.3V

Install dependencies on Pi:
  pip3 install websockets RPi.GPIO
"""

import asyncio
import json
import os
import socket
import subprocess
import RPi.GPIO as GPIO
import websockets
import time

# ── systemd watchdog integration ─────────────────────────────────────────────
# Lets systemd's `WatchdogSec=` kill+restart this process if it hangs. Pure
# stdlib — no `systemd` python package needed. No-op when run outside systemd.
def sd_notify(msg: str) -> None:
    addr = os.environ.get("NOTIFY_SOCKET")
    if not addr:
        return
    if addr.startswith("@"):  # abstract namespace socket
        addr = "\0" + addr[1:]
    try:
        with socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM) as s:
            s.connect(addr)
            s.sendall(msg.encode("utf-8"))
    except OSError:
        pass

# Default heartbeat every 5s; if systemd sets WATCHDOG_USEC, ping at half its rate.
_watchdog_usec = int(os.environ.get("WATCHDOG_USEC", "10000000"))  # default 10s
HEARTBEAT_INTERVAL_S = max(1.0, (_watchdog_usec / 1_000_000) / 2)

# ── Pin config ──────────────────────────────────────────────────────────────
ENCODER_CLK = 17
ENCODER_DT  = 18
BUTTON_PIN  = 23
BUTTON_LED  = 24

# ── State ────────────────────────────────────────────────────────────────────
connected_clients = set()
last_clk_state = None
button_last_press = 0
BUTTON_DEBOUNCE_MS = 300  # ignore repeated presses within 300ms

# ── GPIO setup ───────────────────────────────────────────────────────────────
GPIO.setmode(GPIO.BCM)
GPIO.setup(ENCODER_CLK, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(ENCODER_DT,  GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(BUTTON_PIN,  GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(BUTTON_LED,  GPIO.OUT)
GPIO.output(BUTTON_LED, GPIO.HIGH)  # LED on by default

# ── Broadcast helper ─────────────────────────────────────────────────────────
async def broadcast(message: dict):
    if not connected_clients:
        return
    data = json.dumps(message)
    await asyncio.gather(
        *[client.send(data) for client in connected_clients],
        return_exceptions=True
    )

# ── Encoder polling loop ──────────────────────────────────────────────────────
async def poll_encoder():
    global last_clk_state
    last_clk_state = GPIO.input(ENCODER_CLK)
    while True:
        clk = GPIO.input(ENCODER_CLK)
        dt  = GPIO.input(ENCODER_DT)
        if clk != last_clk_state:
            if clk == GPIO.LOW:
                delta = -1 if dt == GPIO.HIGH else 1
                await broadcast({"type": "resistance", "delta": delta})
            last_clk_state = clk
        await asyncio.sleep(0.002)  # poll at ~500 Hz

# ── Button polling loop ───────────────────────────────────────────────────────
async def poll_button():
    global button_last_press
    prev = GPIO.input(BUTTON_PIN)
    while True:
        current = GPIO.input(BUTTON_PIN)
        # Active-low (internal pull-up): press = LOW
        if prev == GPIO.HIGH and current == GPIO.LOW:
            now_ms = time.time() * 1000
            if now_ms - button_last_press > BUTTON_DEBOUNCE_MS:
                button_last_press = now_ms
                # Flash LED to acknowledge press
                GPIO.output(BUTTON_LED, GPIO.LOW)
                await asyncio.sleep(0.1)
                GPIO.output(BUTTON_LED, GPIO.HIGH)
                await broadcast({"type": "button_press"})
        prev = current
        await asyncio.sleep(0.01)  # poll at 100 Hz

# ── Screen power control (DPMS) ──────────────────────────────────────────────
# When the React app sends {"type": "screen_off"} we tell X11 to power down
# the HDMI display via DPMS. The Waveshare LCD reads no signal and (on most
# revisions) drops the backlight. Any touch on the screen auto-wakes via X's
# built-in DPMS wake-on-input behaviour.
def screen_power(on: bool) -> None:
    import glob, json
    socks = glob.glob('/run/user/1000/sway-ipc.*.sock')
    if not socks:
        print("[!] screen_power: Sway IPC socket not found")
        return
    sock = socks[0]
    try:
        result = subprocess.run(
            ['swaymsg', '-s', sock, '-t', 'get_outputs', '--raw'],
            capture_output=True, text=True, timeout=3,
        )
        outputs = json.loads(result.stdout)
        active = next((o['name'] for o in outputs if o.get('active')), 'HDMI-A-1')
    except Exception:
        active = 'HDMI-A-1'
    cmd = ['swaymsg', '-s', sock, 'output', active, 'power', 'on' if on else 'off']
    try:
        subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        print(f"[!] screen_power({on}) failed: {e}")

# ── WebSocket server ──────────────────────────────────────────────────────────
async def handler(websocket):
    connected_clients.add(websocket)
    print(f"[+] Client connected ({len(connected_clients)} total)")
    try:
        async for raw in websocket:
            try:
                msg = json.loads(raw)
                if msg.get('type') == 'screen_off':
                    print('[*] screen_off requested')
                    screen_power(False)
                elif msg.get('type') == 'screen_on':
                    print('[*] screen_on requested')
                    screen_power(True)
            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"[!] handler error: {e}")
    finally:
        connected_clients.discard(websocket)
        print(f"[-] Client disconnected ({len(connected_clients)} total)")

async def heartbeat():
    """Tell systemd we're still alive, on every loop iteration."""
    while True:
        sd_notify("WATCHDOG=1")
        await asyncio.sleep(HEARTBEAT_INTERVAL_S)

async def main():
    print("SpinDeck hardware bridge starting...")
    print(f"  Encoder CLK={ENCODER_CLK}, DT={ENCODER_DT}")
    print(f"  Button PIN={BUTTON_PIN}, LED={BUTTON_LED}")
    print("  WebSocket server on ws://localhost:8765")
    if os.environ.get("NOTIFY_SOCKET"):
        print(f"  systemd watchdog enabled (heartbeat every {HEARTBEAT_INTERVAL_S:.1f}s)")

    async with websockets.serve(handler, "localhost", 8765):
        # Tell systemd we're up and serving
        sd_notify("READY=1")
        await asyncio.gather(
            poll_encoder(),
            poll_button(),
            heartbeat(),
            asyncio.Future()  # run forever
        )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        sd_notify("STOPPING=1")
        GPIO.output(BUTTON_LED, GPIO.LOW)
        GPIO.cleanup()
