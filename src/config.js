// SpinDeck — customer-tweakable constants. Change a value here and the
// whole app picks it up — no hunting through component files.
//
// All durations are in **seconds** unless noted.

// How long the heart-rate (PulseView) screen stays open after a button press
// before auto-returning to the workout view.
export const PULSE_VIEW_DURATION_SEC = 10;

// Length of each program "interval" (one bar in the program bar chart).
// The same value is used by RideDisplay's countdown and PulseView when the
// workout keeps running while the heart-rate overlay is shown.
export const INTERVAL_DURATION_SEC = 120;

// Default workout length when no `?duration=` param is provided
// (e.g., entering RideDisplay directly without going through DurationSelect).
export const DEFAULT_TARGET_DURATION_SEC = 30 * 60; // 30 minutes

// Default app volume (0–100). Used by every sound effect and the boot splash
// audio. Persisted in localStorage under "bikeVolume". Use getVolume() so a
// stored 0 / NaN / negative never silences the system on first boot.
export const DEFAULT_VOLUME_PERCENT = 100;

export function getVolume() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('bikeVolume') : null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) return DEFAULT_VOLUME_PERCENT;
  return n;
}
