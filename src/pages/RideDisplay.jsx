import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dataStore } from '@/services/localStore';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Play, Pause, Home, Flame, Sun, Volume2 } from 'lucide-react';
import { playTypewriterClick } from '../components/ride/audioCues';
import { toast } from 'sonner';
import GaugeDial from '../components/ride/GaugeDial';
import SessionTimeline, { primeAudio } from '../components/ride/SessionTimeline';
import ScreenDimmer from '../components/ride/ScreenDimmer';
import AudioControl from '../components/ride/AudioControl';
import PromptDialog from '../components/ride/PromptDialog';
import { generateSessionPattern } from '../components/ride/sessionPatterns';
import { INTERVAL_DURATION_SEC, PULSE_VIEW_DURATION_SEC, getVolume, getIntervalDurationSec } from '@/config';
import TimerRow from '../components/ride/TimerRow';
import { useWorkout } from '../components/ride/WorkoutContext';

const INTERVAL_DURATION = INTERVAL_DURATION_SEC;

function playCoinSound(volumePct = 100) {
  try {
    const AudioCtx = window.AudioContext || window['webkitAudioContext'];
    const ctx = new AudioCtx();
    const vol = volumePct / 100;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
    // Mario coin: two notes B5 (988Hz) then E6 (1319Hz)
    const notes = [{ freq: 988, t: 0, dur: 0.18 }, { freq: 1319, t: 0.09, dur: 0.72 }];
    notes.forEach(({ freq, t, dur }) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur);
    });
    setTimeout(() => ctx.close(), 600);
  } catch (e) { }
}

export default function RideDisplay() {
  const navigate = useNavigate();
  const { state: w, update: updateWorkout, reset: resetWorkoutState, subscribeTick, stateRef } = useWorkout();

  // Timer-related fields are owned by the provider so they survive navigation.
  const { isRunning, isPaused, elapsedSeconds, programPosition, targetDuration, isInfinity, intervalSecondsRemaining } = w;

  const setIsRunning = useCallback((v) => updateWorkout(p => ({ isRunning: typeof v === 'function' ? v(p.isRunning) : v })), [updateWorkout]);
  const setIsPaused  = useCallback((v) => updateWorkout(p => ({ isPaused:  typeof v === 'function' ? v(p.isPaused)  : v })), [updateWorkout]);

  // Stats live in the provider so they keep accumulating across navigation.
  const stats = w.stats;
  const [resistance, setResistance] = useState(5);
  const [simHeartRate, setSimHeartRate] = useState(120); // demo: 120 BPM
  const [simRpm, setSimRpm] = useState(65);              // demo: 65 RPM
  const [simPower, setSimPower] = useState(140);         // demo: 140 W
  const [brightness, setBrightness] = useState(100);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  const [volume, setVolume] = useState(getVolume);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleVolumeChange = (val) => {
    setVolume(val);
    localStorage.setItem('bikeVolume', String(val));
  };
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [showProgramComplete, setShowProgramComplete] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [timeMultiplier, setTimeMultiplier] = useState(1);

  const resistanceRef = useRef(resistance);
  const isManualRef = useRef(isManual);

  useEffect(() => { resistanceRef.current = resistance; }, [resistance]);
  useEffect(() => { isManualRef.current = isManual; }, [isManual]);

  // programId/programLabel live in the context once the session is bootstrapped from URL,
  // so round-trips to PulseView (which navigates back without query params) don't
  // wipe out the program identity.
  const programId = w.programId;
  const programLabel = w.programLabel;
  const NUM_BARS = generateSessionPattern(programId).length;
  const maxResistanceForProgram = programId === 'small-step' ? 27 : 30;

  const [programData, setProgramData] = useState(() => generateSessionPattern(programId));

  useEffect(() => {
    if (!isManual) {
      setProgramData(generateSessionPattern(programId, resistance));
    } else {
      setProgramData(Array(NUM_BARS).fill(resistance));
    }
  }, [programId, resistance, isManual, NUM_BARS]);

  // Keep numBars in the provider in sync with the current program (used by the tick to wrap programPosition).
  useEffect(() => {
    updateWorkout({ numBars: NUM_BARS });
  }, [NUM_BARS, updateWorkout]);

  const handleManual = () => {
    setIsManual(true);
    setProgramData(Array(NUM_BARS).fill(resistance));
    setShowProgramComplete(false);
    updateWorkout({ isInfinity: true, isRunning: true, isPaused: false });
  };

  const handleCoolDown = () => {
    const newResistance = Math.max(1, Math.floor(resistance * 0.8));
    setResistance(newResistance);
    setIsManual(true);
    setProgramData(Array(NUM_BARS).fill(newResistance));
    setShowProgramComplete(false);
    updateWorkout(/** @param {any} prev */ (prev) => ({ isInfinity: false, targetDuration: prev.elapsedSeconds + 5 * 60, isRunning: true, isPaused: false }));
  };

  const lastCalorieMilestoneRef = useRef(0);
  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    setShowProgramComplete(false);
    lastCalorieMilestoneRef.current = 0;
  }, [w.programId]);

  // Initial load from URL: only treat as a NEW session when the URL has a program but no
  // running-elapsed marker. Returning from PulseView/Pong should not reset the timer.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('program')) return;
    const isFreshEntry = !params.get('elapsed') && !params.get('intervalRemaining');
    if (!isFreshEntry) return;

    // Fresh program selection — reset the workout context and apply URL config.
    resetWorkoutState();
    lastCalorieMilestoneRef.current = 0;

    // Match the original behavior: timer auto-starts when entering the ride display
    // from Launcher/DurationSelect (no `running` param). Only an explicit running=0 lands paused.
    const runningParam = params.get('running');
    const pid = params.get('program') || '';
    /** @type {Record<string, any>} */
    const patch = {
      isRunning: runningParam !== '0',
      isPaused: runningParam === '0',
      programId: pid,
      programLabel: [params.get('name'), params.get('durationLabel')].filter(Boolean).join(' '),
      intervalSecondsRemaining: getIntervalDurationSec(pid),
    };
    const duration = params.get('duration');
    if (duration === 'infinity') patch.isInfinity = true;
    else if (duration) { patch.targetDuration = Number(duration) * 60; patch.isInfinity = false; }
    if (params.get('resistance')) setResistance(Number(params.get('resistance')));
    if (params.get('manual') === '1') setIsManual(true);
    updateWorkout(patch);
  }, []); // eslint-disable-line

  const buildPulseQuery = (extra = '') => {
    const q = new URLSearchParams();
    q.set('manual', isManualRef.current ? '1' : '0');
    q.set('resistance', String(resistanceRef.current));
    return '?' + q.toString() + (extra ? '&' + extra : '');
  };

  const handleHeartRateHold = () => {
    navigate(createPageUrl('PulseView') + buildPulseQuery());
  };

  /** Same navigation as GPIO `button_press` from hardwareBridge.py (for on-bike testing without the bridge). */
  const openPulseViewLikeGpioButton = useCallback(() => {
    const q = new URLSearchParams();
    q.set('manual', isManualRef.current ? '1' : '0');
    q.set('resistance', String(resistanceRef.current));
    q.set('autoReturn', String(PULSE_VIEW_DURATION_SEC));
    navigate(createPageUrl('PulseView') + '?' + q.toString());
  }, [navigate]);

  // Hardware WebSocket bridge — rotary encoder + push button
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:8765');
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'resistance') {
              setResistance(prev => Math.min(30, Math.max(1, prev + (msg.delta || 0))));
            } else if (msg.type === 'button_press') {
              openPulseViewLikeGpioButton();
            }
          } catch (_) {}
        };
        ws.onerror = () => {};
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 3000); };
      } catch (_) {}
    };
    connect();
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [openPulseViewLikeGpioButton]);

  const autoSave = useCallback(async () => {
    const currentStats = stateRef.current.stats;
    const currentElapsed = stateRef.current.elapsedSeconds;
    if (currentElapsed < 10) return;
    const avgDivisor = currentStats.readings || 1;
    await dataStore.entities.Workout.create({
      duration_seconds: currentElapsed,
      calories: Math.round(currentStats.calories),
      distance_km: Math.round(currentStats.distance * 100) / 100,
      avg_speed_kmh: Math.round((currentStats.totalSpeed / avgDivisor) * 10) / 10,
      max_speed_kmh: currentStats.maxSpeed,
      avg_cadence: Math.round(currentStats.totalCadence / avgDivisor),
      max_cadence: currentStats.maxCadence,
      avg_heart_rate: Math.round(currentStats.totalHeartRate / avgDivisor),
      max_heart_rate: currentStats.maxHeartRate,
      avg_power: Math.round(currentStats.totalPower / avgDivisor),
      max_power: currentStats.maxPower,
      workout_date: new Date().toISOString()
    });
    toast.success('Workout saved!');
  }, [stateRef]);

  // RideDisplay-only side effects on each provider tick: coin sound + program-complete UI.
  useEffect(() => {
    const unsubscribe = subscribeTick(({ next, stop }) => {
      const newMilestone = Math.floor(next.stats.calories / 100);
      if (newMilestone > lastCalorieMilestoneRef.current) {
        lastCalorieMilestoneRef.current = newMilestone;
        playCoinSound(volumeRef.current);
      }
      if (stop) {
        setShowProgramComplete(true);
        setTimeout(() => autoSave(), 200);
      }
    });
    return unsubscribe;
  }, [subscribeTick, autoSave]);

  const handleStop = async () => {
    if (elapsedSeconds < 10) { resetWorkout(true); return; }
    const avgDivisor = stats.readings || 1;
    await dataStore.entities.Workout.create({
      duration_seconds: elapsedSeconds,
      calories: Math.round(stats.calories),
      distance_km: Math.round(stats.distance * 100) / 100,
      avg_speed_kmh: Math.round((stats.totalSpeed / avgDivisor) * 10) / 10,
      max_speed_kmh: stats.maxSpeed,
      avg_cadence: Math.round(stats.totalCadence / avgDivisor),
      max_cadence: stats.maxCadence,
      avg_heart_rate: Math.round(stats.totalHeartRate / avgDivisor),
      max_heart_rate: stats.maxHeartRate,
      avg_power: Math.round(stats.totalPower / avgDivisor),
      max_power: stats.maxPower,
      workout_date: new Date().toISOString()
    });
    toast.success('Workout saved!');
    resetWorkout(true);
  };

  const resetWorkout = (goHome = false) => {
    resetWorkoutState();
    setShowProgramComplete(false);
    lastCalorieMilestoneRef.current = 0;
    if (goHome) navigate(createPageUrl('Launcher'));
  };

  const handleHomeClick = () => {
    if (isRunning) setShowHomeConfirm(true);
    else navigate(createPageUrl('Launcher'));
  };

  const isDimmed = brightness < 100;

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: '#000' }}>
      <div className="relative text-white overflow-hidden" style={{ width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }} onClick={isDimmed && !showBrightnessSlider ? () => setBrightness(100) : undefined}>
          {isDimmed && !showBrightnessSlider && (
            <div className="absolute inset-0 z-40 cursor-pointer bg-black pointer-events-auto" style={{ opacity: (100 - brightness) / 100 }} />
          )}

          {/* Top Section — 258px: timers 90px + calories/controls 168px */}
          <div style={{ height: '258px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Timer row — 90px */}
            <TimerRow
              variant="ride"
              intervalSecondsRemaining={intervalSecondsRemaining}
              elapsedSeconds={elapsedSeconds}
              targetDuration={targetDuration}
              isInfinity={isInfinity}
              isRunning={isRunning}
              isPaused={isPaused}
            />

            {/* Calories + controls row — 168px */}
            <div style={{ height: '168px', flexShrink: 0, display: 'flex', padding: '6px 8px' }}>
              {/* Calories — left half */}
              <div style={{ width: '50%', paddingRight: '4px' }}>
                <div className="w-full h-full rounded-md flex flex-col items-center justify-center"
                  style={{ background: '#000' }}
                >
                  <div className="text-center w-full px-2 flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-2 flex-shrink-0" style={{ marginBottom: '4px' }}>
                      <Flame className="text-[#FF3F03]" style={{ width: '22px', height: '22px' }} strokeWidth={2.5} />
                      <span style={{ fontSize: '20px' }} className="uppercase tracking-wider text-zinc-300 font-semibold">Calories</span>
                    </div>
                    <div className="font-black leading-none text-[#FF3F03] whitespace-nowrap" style={{ fontSize: '78px' }}>
                      {Math.floor(stats.calories)}
                    </div>
                    <span style={{ fontSize: '16px', marginTop: '4px' }} className="text-zinc-400 lowercase">kcal</span>
                  </div>
                </div>
              </div>

              {/* Control buttons — right half */}
              <div style={{ width: '50%', paddingLeft: '4px' }}>
                <div className="grid grid-cols-2 h-full" style={{ gridTemplateRows: 'repeat(3, 1fr)', gap: '6px' }}>
                  {!isRunning || isPaused ? (
                    <button onClick={() => { playTypewriterClick(); primeAudio(); setIsRunning(true); setIsPaused(false); }}
                      className="rounded-md font-bold flex items-center justify-center transition-all active:scale-95"
                      style={{ background: '#3f3f3f' }}>
                      <Play style={{ width: '24px', height: '24px' }} className="text-[#FF3F03]" strokeWidth={2.5} />
                    </button>
                  ) : (
                    <button onClick={() => { playTypewriterClick(); setIsPaused(true); }}
                      className="rounded-md font-bold flex items-center justify-center transition-all active:scale-95"
                      style={{ background: '#3f3f3f' }}>
                      <Pause style={{ width: '24px', height: '24px' }} className="text-[#FF3F03]" strokeWidth={2.5} />
                    </button>
                  )}
                  {[
                    { icon: Home,    action: handleHomeClick },
                    { icon: Sun,     action: () => setShowBrightnessSlider(true) },
                    { icon: Volume2, action: () => setShowVolumeSlider(true) },
                  ].map(({ icon: Icon, action }) => (
                    <button key={Icon.displayName} onClick={() => { playTypewriterClick(); action(); }}
                      className="rounded-md font-bold flex items-center justify-center transition-all active:scale-95"
                      style={{ background: '#3f3f3f' }}>
                      <Icon style={{ width: '24px', height: '24px' }} className="text-[#FF3F03]" strokeWidth={2.5} />
                    </button>
                  ))}
                  {[
                    { label: 'Manual',    action: handleManual },
                    { label: 'Cool Down', action: handleCoolDown },
                  ].map(({ label, action }) => (
                    <button key={label} onClick={() => { playTypewriterClick(); action(); }}
                      className="rounded-md flex items-center justify-center transition-all active:scale-95"
                      style={{ background: '#3f3f3f' }}>
                      <span style={{ fontSize: '18px' }} className="font-black text-[#FF3F03] whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Program Display — 102px */}
          <div style={{ height: '102px', flexShrink: 0, padding: '0 10px 6px 10px', overflow: 'hidden' }}>
            <SessionTimeline
              programData={programData}
              currentPosition={programPosition}
              resistance={resistance}
              isComplete={showProgramComplete}
              programLabel={programLabel}
              volume={volume}
              elapsedSeconds={elapsedSeconds}
              targetDuration={targetDuration}
              isInfinity={isInfinity}
            />
          </div>

          {/* Bottom Section — 240px: three gauges/distance side-by-side */}
          <div style={{ height: '240px', flexShrink: 0, display: 'flex', padding: '0 8px 8px 8px', gap: '8px', overflow: 'hidden' }}>
            <div style={{ width: '33%' }}>
              <GaugeDial value={stats.cadence} max={150} label="RPM" unit="rpm" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center rounded-md"
              style={{ background: '#000' }}
            >
              <div className="font-bold text-[#FF3F03] whitespace-nowrap leading-none" style={{ fontSize: '78px' }}>{stats.distance.toFixed(2)}</div>
              <span style={{ fontSize: '14px', marginTop: '10px' }} className="uppercase tracking-widest text-zinc-400">KM</span>
            </div>
            <div style={{ width: '33%' }}>
              <GaugeDial value={stats.power} max={300} label="WATTS" unit="watts" />
            </div>
          </div>
        </div>

        <PromptDialog
          isOpen={showHomeConfirm}
          title="Leave Program"
          message="Are you sure you want to leave the current program?"
          onConfirm={() => { setShowHomeConfirm(false); navigate(createPageUrl('Launcher')); }}
          onCancel={() => setShowHomeConfirm(false)}
        />

        {showBrightnessSlider && (
          <div className="fixed inset-0 z-40 flex items-center justify-center cursor-pointer" onClick={() => setShowBrightnessSlider(false)}>
            <div className="z-50" onClick={(e) => e.stopPropagation()}>
              <ScreenDimmer brightness={brightness} setBrightness={setBrightness} onClose={() => setShowBrightnessSlider(false)} />
            </div>
          </div>
        )}

        {showVolumeSlider && (
          <div className="fixed inset-0 z-40 flex items-center justify-center cursor-pointer" onClick={() => setShowVolumeSlider(false)}>
            <div className="z-50" onClick={(e) => e.stopPropagation()}>
              <AudioControl volume={volume} setVolume={handleVolumeChange} onClose={() => setShowVolumeSlider(false)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
