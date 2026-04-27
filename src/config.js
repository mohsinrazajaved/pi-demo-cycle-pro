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
