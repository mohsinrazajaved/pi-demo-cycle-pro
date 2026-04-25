# SpinDeck — Hardware Wiring Guide

For the person wiring the bike's electronics to the Raspberry Pi.

## TL;DR — pin map

```
              Raspberry Pi 5 — 40-pin GPIO header
              (BCM numbering — what the software uses)

                      ┌───────────────┐
                      │   Push button │
                      │  GPIO 23 ─────┼──► one leg
                      │  GND    ─────┼──► other leg
                      └───────────────┘

                      ┌───────────────┐
                      │ Rotary encoder│
                      │  GPIO 17 ─────┼──► CLK  (also called A)
                      │  GPIO 18 ─────┼──► DT   (also called B)
                      │  GND    ─────┼──► GND
                      │  3.3 V  ─────┼──► VCC  (only if encoder has +)
                      └───────────────┘

                      ┌───────────────┐
                      │  Indicator LED│  (optional — confirms button works)
                      │  GPIO 24 ─────┼──► 220 Ω ──► LED anode (long leg)
                      │  GND    ─────┼──► LED cathode (short leg)
                      └───────────────┘
```

## Physical pin reference

The Pi's 40-pin header counts pins by physical position (1–40), not by GPIO number. Map:

| Signal  | BCM (software name) | Physical pin (header position) |
|---------|---------------------|--------------------------------|
| Encoder CLK / A | GPIO 17 | Pin 11 |
| Encoder DT / B  | GPIO 18 | Pin 12 |
| Push button     | GPIO 23 | Pin 16 |
| LED (optional)  | GPIO 24 | Pin 18 |
| GND (any)       | —       | Pin 6, 9, 14, 20, 25, 30, 34, 39 |
| 3.3 V (encoder VCC, if needed) | — | Pin 1 or 17 |

Full Pi 5 pinout: https://pinout.xyz/

## What the software expects

### Push button (GPIO 23)

- Wired with a **pull-up** internally — no external resistor needed.
- The pin **idles at 3.3 V (logic HIGH = "not pressed")**.
- **Pressing the button must short GPIO 23 to GND**, pulling the line LOW.
- Software triggers on the falling edge (HIGH → LOW transition).
- Bounce / chatter handled in software (50 ms debounce). Cheap tactile buttons are fine.

**What happens on press:** screen switches to the heart-rate display for 10 seconds, then auto-returns to the workout view.

### Rotary encoder (GPIO 17 + 18)

- Standard quadrature encoder (KY-040 or equivalent).
- Both lines pulled up internally.
- Software watches **GPIO 17 (CLK) for edges**, then samples **GPIO 18 (DT)** to decide direction:
  - 17 falls while 18 is HIGH → clockwise → resistance **+1**
  - 17 falls while 18 is LOW  → counter-clockwise → resistance **−1**
- Range clamped 1–30 in software. Detents (clicks) on the encoder are fine; no detents (smooth) also fine.

**What happens on rotation:** workout resistance level goes up/down by 1 per click. Visible immediately on the program bar.

### Indicator LED (GPIO 24, optional)

- Flashes for ~150 ms whenever the push button registers a press.
- Useful as a "yes, the Pi heard you" confirmation while testing.
- Series 220 Ω resistor required between the GPIO pin and the LED anode. **Don't omit the resistor — you'll burn out the LED and possibly the GPIO pin.**

## Testing the wiring (no app needed)

After wiring, before running the kiosk app, verify each input from the command line:

```bash
# Install the test tool (one time)
sudo apt install -y gpiod

# Watch the button (press it — you should see "1 0" toggle)
gpiomon -B pull-up gpiochip0 23

# Watch the encoder (rotate the knob — you should see edges)
gpiomon -B pull-up gpiochip0 17 18

# Blink the LED for a sanity test
gpioset -m time -s 1 gpiochip0 24=1 ; gpioset gpiochip0 24=0
```

If those commands all behave as expected, the hardware is good. The app's `hardwareBridge.py` will then publish the same events as JSON over a local WebSocket, and the React UI will react.

## Electrical notes & gotchas

- **All signal levels are 3.3 V.** Do NOT feed 5 V into a GPIO pin — it will damage the Pi.
- **Use the Pi's GND (any GND pin)** for the encoder/button common — don't try to use the bike's chassis ground unless they're tied together.
- **Wire length:** keep encoder leads under ~30 cm. Longer runs introduce noise and missed clicks. If the bike geometry forces a longer run, use a small RC filter (10 kΩ + 0.1 µF) at the Pi end, or twisted-pair shielded cable.
- **Power-on order:** safe in any order. The Pi tolerates inputs being live before it boots.
- **EMC/EMI:** if the bike has a brushed motor or magnetic resistance brake nearby, run the encoder and button wires away from the motor harness, and make sure GNDs are common.

## Software contract (for reference)

The Python bridge running on the Pi (`hardwareBridge.py`) emits JSON messages on `ws://localhost:8765`:

```json
{ "type": "button_press" }
{ "type": "resistance", "delta":  1 }   // CW click
{ "type": "resistance", "delta": -1 }   // CCW click
```

The hardware integrator does **not** need to touch the Python or React code — just deliver clean GPIO signals on the pins above and the rest is automatic.

## When you're done

1. Confirm `gpiomon` sees the button + encoder activity (above).
2. Boot the Pi normally — the kiosk launches, the bridge connects.
3. Press the button → heart-rate screen appears for 10 s.
4. Turn the encoder → resistance level changes on screen.

If any of those don't work, check `journalctl -u spindeck-bridge` for errors (or run `python3 ~/spindeck/hardwareBridge.py` manually to see live logs).
