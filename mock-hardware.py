#!/usr/bin/env python3
"""
Mock hardware bridge for testing without the Pi.

Three ways to trigger events:
  1. Keyboard (if run interactively):
       b   → button press
       +   → encoder up
       -   → encoder down
       q   → quit

  2. HTTP (works even when script is backgrounded):
       curl http://localhost:8766/button
       curl http://localhost:8766/encoder/up
       curl http://localhost:8766/encoder/down

  3. WebSocket client on port 8765 (how the React app connects).
"""

import asyncio
import json
import sys
import websockets
from aiohttp import web

WS_PORT   = 8765   # React app connects here
HTTP_PORT = 8766   # curl triggers land here

clients = set()

async def broadcast(msg):
    if not clients:
        print(f"  [!] no React client connected — {msg} dropped")
        return
    data = json.dumps(msg)
    await asyncio.gather(*[c.send(data) for c in clients], return_exceptions=True)
    print(f"  → sent {data} to {len(clients)} client(s)")

# ── WebSocket handler (React app) ────────────────────────────────────────────
async def ws_handler(ws):
    clients.add(ws)
    print(f"[+] React client connected ({len(clients)} total)")
    try:
        await ws.wait_closed()
    finally:
        clients.discard(ws)
        print(f"[-] React client disconnected ({len(clients)} total)")

# ── HTTP handlers (for curl triggers) ────────────────────────────────────────
async def http_button(request):
    print("[HTTP] button press")
    await broadcast({"type": "button_press"})
    return web.Response(text="button press sent\n")

async def http_encoder_up(request):
    print("[HTTP] encoder up (+1)")
    await broadcast({"type": "resistance", "delta": 1})
    return web.Response(text="encoder +1 sent\n")

async def http_encoder_down(request):
    print("[HTTP] encoder down (-1)")
    await broadcast({"type": "resistance", "delta": -1})
    return web.Response(text="encoder -1 sent\n")

async def http_status(request):
    return web.Response(text=f"connected React clients: {len(clients)}\n")

# ── Keyboard loop (interactive mode) ─────────────────────────────────────────
async def keyboard_loop():
    if not sys.stdin.isatty():
        return  # skip when backgrounded
    print("\n=== Mock Hardware Ready ===")
    print("Keyboard: b=button  +=enc-up  -=enc-down  q=quit\n")
    loop = asyncio.get_event_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        ch = line.strip().lower()
        if ch == 'b':
            print("[KEY] button press")
            await broadcast({"type": "button_press"})
        elif ch in ('+', '='):
            print("[KEY] encoder up (+1)")
            await broadcast({"type": "resistance", "delta": 1})
        elif ch in ('-', '_'):
            print("[KEY] encoder down (-1)")
            await broadcast({"type": "resistance", "delta": -1})
        elif ch == 'q':
            print("quitting...")
            break

# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    print(f"WebSocket server (React)  → ws://localhost:{WS_PORT}")
    print(f"HTTP trigger server (curl) → http://localhost:{HTTP_PORT}")
    print("    curl http://localhost:8766/button")
    print("    curl http://localhost:8766/encoder/up")
    print("    curl http://localhost:8766/encoder/down")

    app = web.Application()
    app.router.add_get('/button',        http_button)
    app.router.add_get('/encoder/up',    http_encoder_up)
    app.router.add_get('/encoder/down',  http_encoder_down)
    app.router.add_get('/status',        http_status)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', HTTP_PORT)
    await site.start()

    async with websockets.serve(ws_handler, "localhost", WS_PORT):
        await keyboard_loop()
        # if backgrounded (no tty), stay alive forever
        if not sys.stdin.isatty():
            await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
