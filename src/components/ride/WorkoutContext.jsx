import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { INTERVAL_DURATION_SEC, getIntervalDurationSec } from '@/config';

const WorkoutContext = createContext(null);

const initialStats = {
  calories: 0, speed: 0, distance: 0, cadence: 0, heartRate: 0, power: 0,
  maxSpeed: 0, maxCadence: 0, maxHeartRate: 0, maxPower: 0,
  totalSpeed: 0, totalCadence: 0, totalHeartRate: 0, totalPower: 0, readings: 0,
};

// Demo sensor values — fixed for the simulator.
const SIM_SPEED = 10;
const SIM_CADENCE = 65;
const SIM_HEARTRATE = 120;
const SIM_POWER = 140;

const initialState = {
  elapsedSeconds: 0,
  intervalSecondsRemaining: INTERVAL_DURATION_SEC,
  programPosition: 0,
  isRunning: false,
  isPaused: false,
  targetDuration: 120 * 60,
  isInfinity: false,
  numBars: 1,
  timeMultiplier: 1,
  programId: '',
  programLabel: '',
  stats: initialStats,
  // True once the post-completion autosave has fired for this session. Cleared on
  // `reset()`. Prevents double-saves if the user taps Play again after game-over,
  // and gives RideDisplay a way to handle a completion that fired while it was
  // unmounted (e.g., while the user was on PulseView).
  autoSaveFired: false,
};

export function WorkoutProvider({ children }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const tickListenersRef = useRef(new Set());

  // Single source-of-truth tick — survives route changes because the provider
  // sits above <Routes> so it never unmounts during in-app navigation.
  useEffect(() => {
    if (!state.isRunning || state.isPaused) return;
    const id = setInterval(() => {
      const prev = stateRef.current;
      const inc = prev.timeMultiplier || 1;
      let nextElapsed = prev.elapsedSeconds + inc;
      let nextInterval = prev.intervalSecondsRemaining - inc;
      let nextPos = prev.programPosition;
      if (nextInterval <= 0) {
        nextPos = (nextPos + 1) % Math.max(1, prev.numBars);
        nextInterval = getIntervalDurationSec(prev.programId);
      }
      let stop = false;
      if (!prev.isInfinity && nextElapsed >= prev.targetDuration) {
        nextElapsed = prev.targetDuration;
        stop = true;
      }
      // Accumulate workout stats here so totals keep advancing while the user is on
      // any screen that shares this provider (ride display, pulse view, etc.).
      const s = prev.stats;
      const newCalories = s.calories + (500 / 3600) * inc;
      const nextStats = {
        ...s,
        speed: SIM_SPEED, cadence: SIM_CADENCE, heartRate: SIM_HEARTRATE, power: SIM_POWER,
        distance: s.distance + (SIM_SPEED / 3600) * inc,
        calories: newCalories,
        maxSpeed: Math.max(s.maxSpeed, SIM_SPEED),
        maxCadence: Math.max(s.maxCadence, SIM_CADENCE),
        maxHeartRate: Math.max(s.maxHeartRate, SIM_HEARTRATE),
        maxPower: Math.max(s.maxPower, SIM_POWER),
        totalSpeed: s.totalSpeed + SIM_SPEED,
        totalCadence: s.totalCadence + SIM_CADENCE,
        totalHeartRate: s.totalHeartRate + SIM_HEARTRATE,
        totalPower: s.totalPower + SIM_POWER,
        readings: s.readings + 1,
      };

      const next = {
        ...prev,
        elapsedSeconds: nextElapsed,
        intervalSecondsRemaining: nextInterval,
        programPosition: nextPos,
        isRunning: stop ? false : prev.isRunning,
        stats: nextStats,
      };
      stateRef.current = next;
      setState(next);
      tickListenersRef.current.forEach(l => {
        try { l({ increment: inc, prev, next, stop }); } catch (_) {}
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.isRunning, state.isPaused, state.timeMultiplier]);

  const update = useCallback((patch) => {
    setState(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const reset = useCallback(() => setState({ ...initialState }), []);

  const subscribeTick = useCallback((listener) => {
    tickListenersRef.current.add(listener);
    return () => tickListenersRef.current.delete(listener);
  }, []);

  return (
    <WorkoutContext.Provider value={{ state, update, reset, subscribeTick, stateRef }}>
      {children}
    </WorkoutContext.Provider>
  );
}

/**
 * @typedef {{
 *   state: any,
 *   update: (patch: any) => void,
 *   reset: () => void,
 *   subscribeTick: (listener: (e: any) => void) => () => void,
 *   stateRef: { current: any },
 * }} WorkoutContextValue
 */

/** @returns {WorkoutContextValue} */
export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return /** @type {WorkoutContextValue} */ (ctx);
}

export function formatWorkoutTime(totalSeconds) {
  const rounded = Math.round(totalSeconds);
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
