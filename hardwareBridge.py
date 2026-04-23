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
import RPi.GPIO as GPIO
import websockets
import time

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

# ── WebSocket server ──────────────────────────────────────────────────────────
async def handler(websocket):
    connected_clients.add(websocket)
    print(f"[+] Client connected ({len(connected_clients)} total)")
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)
        print(f"[-] Client disconnected ({len(connected_clients)} total)")

async def main():
    print("SpinDeck hardware bridge starting...")
    print(f"  Encoder CLK={ENCODER_CLK}, DT={ENCODER_DT}")
    print(f"  Button PIN={BUTTON_PIN}, LED={BUTTON_LED}")
    print("  WebSocket server on ws://localhost:8765")

    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.gather(
            poll_encoder(),
            poll_button(),
            asyncio.Future()  # run forever
        )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        GPIO.output(BUTTON_LED, GPIO.LOW)
        GPIO.cleanup()
