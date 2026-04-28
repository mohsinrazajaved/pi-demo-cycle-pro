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
import { INTERVAL_DURATION_SEC, PULSE_VIEW_DURATION_SEC, getVolume } from '@/config';

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
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stats, setStats] = useState({
    calories: 0, speed: 0, distance: 0, cadence: 0, heartRate: 0, power: 0,
    maxSpeed: 0, maxCadence: 0, maxHeartRate: 0, maxPower: 0,
    totalSpeed: 0, totalCadence: 0, totalHeartRate: 0, totalPower: 0, readings: 0
  });
  const [resistance, setResistance] = useState(5);
  const [programPosition, setProgramPosition] = useState(0);
  const [targetDuration, setTargetDuration] = useState(120 * 60); // 2 hours
  const [isInfinity, setIsInfinity] = useState(false);
  const [intervalSecondsRemaining, setIntervalSecondsRemaining] = useState(INTERVAL_DURATION);
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

  const statsRef = useRef(stats);
  const elapsedRef = useRef(elapsedSeconds);
  const intervalSecondsRemainingRef = useRef(intervalSecondsRemaining);
  const programPositionRef = useRef(programPosition);
  const resistanceRef = useRef(resistance);
  const isRunningRef = useRef(isRunning);
  const isPausedRef = useRef(isPaused);
  const isManualRef = useRef(isManual);
  const isInfinityRef = useRef(isInfinity);
  const targetDurationRef = useRef(targetDuration);

  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);
  useEffect(() => { intervalSecondsRemainingRef.current = intervalSecondsRemaining; }, [intervalSecondsRemaining]);
  useEffect(() => { programPositionRef.current = programPosition; }, [programPosition]);
  useEffect(() => { resistanceRef.current = resistance; }, [resistance]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isManualRef.current = isManual; }, [isManual]);
  useEffect(() => { isInfinityRef.current = isInfinity; }, [isInfinity]);
  useEffect(() => { targetDurationRef.current = targetDuration; }, [targetDuration]);

  const p = new URLSearchParams(window.location.search);
  const programId = p.get('program') || '';
  const programLabel = [p.get('name'), p.get('durationLabel')].filter(Boolean).join(' ');
  const NUM_BARS = generateSessionPattern(programId).length;
  const maxResistanceForProgram = programId === 'small-step' ? 27 : 30;

  const [programData, setProgramData] = useState(() => generateSessionPattern(programId));

  useEffect(() => {
    if (!isManual) {
      setProgramData(generateSessionPattern(programId, resistance));
    } else {
      setProgramData(Array(NUM_BARS).fill(resistance));
    }
  }, [resistance, isManual]);

  const handleManual = () => {
    setIsManual(true);
    setProgramData(Array(NUM_BARS).fill(resistance));
    setIsInfinity(true);
  };

  const handleCoolDown = () => {
    const newResistance = Math.max(1, Math.floor(resistance * 0.8));
    setResistance(newResistance);
    setIsManual(true);
    setProgramData(Array(NUM_BARS).fill(newResistance));
    setIsInfinity(false);
    setTargetDuration(elapsedSeconds + 5 * 60);
  };

  const intervalRef = useRef(null);
  const lastCalorieMilestoneRef = useRef(0);
  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // Restore state from URL params (coming from PulseView, Pong, or initial load)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('program')) return;

    const targetEndTimeParam = params.get('targetEndTime');
    if (targetEndTimeParam === 'infinity') {
      setIsInfinity(true);
    } else if (targetEndTimeParam) {
      setTargetDuration(Number(targetEndTimeParam));
      setIsInfinity(false);
    } else {
      const duration = params.get('duration');
      if (duration === 'infinity') setIsInfinity(true);
      else if (duration) { setTargetDuration(Number(duration) * 60); setIsInfinity(false); }
    }

    if (params.get('elapsed')) setElapsedSeconds(Number(params.get('elapsed')));
    if (params.get('intervalRemaining')) setIntervalSecondsRemaining(Number(params.get('intervalRemaining')));
    if (params.get('programPosition')) setProgramPosition(Number(params.get('programPosition')));
    if (params.get('resistance')) setResistance(Number(params.get('resistance')));
    if (params.get('manual') === '1') setIsManual(true);
    if (params.get('infinity') === '1') setIsInfinity(true);

    const running = params.get('running');
    if (running === '0') { setIsRunning(false); setIsPaused(true); }
    else { setIsRunning(true); setIsPaused(false); }
  }, []);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      speed: 10, // fixed 10 km/h
      cadence: simRpm,
      heartRate: simHeartRate,
      power: simPower
    }));
  }, [simRpm, simHeartRate, simPower]);

  const generateSensorData = useCallback(() => ({
    speed: 10, // demo: fixed 10 km/h
    cadence: simRpm,
    heartRate: simHeartRate,
    power: simPower
  }), [simRpm, simHeartRate, simPower]);

  const buildReturnParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const q = new URLSearchParams();
    q.set('program', params.get('program') || programId);
    q.set('elapsed', String(Math.round(elapsedRef.current)));
    const infinity = isInfinityRef.current;
    const targetEndTime = infinity ? 'infinity' : targetDurationRef.current;
    q.set('targetEndTime', String(targetEndTime));
    q.set('running', isRunningRef.current && !isPausedRef.current ? '1' : '0');
    q.set('intervalRemaining', String(Math.round(intervalSecondsRemainingRef.current)));
    q.set('programPosition', String(programPositionRef.current));
    q.set('resistance', String(resistanceRef.current));
    q.set('manual', isManualRef.current ? '1' : '0');
    q.set('infinity', infinity ? '1' : '0');
    if (programLabel) q.set('name', programLabel);
    return q.toString();
  }, [programId, programLabel]);

  const handleHeartRateHold = () => {
    navigate(createPageUrl('PulseView') + '?' + buildReturnParams());
  };

  // Hardware WebSocket bridge — rotary encoder + push button
  const buildReturnParamsRef = useRef(null);
  useEffect(() => { buildReturnParamsRef.current = buildReturnParams; }, [buildReturnParams]);

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
            } else if (msg.type === 'button_press' && buildReturnParamsRef.current) {
              navigate(createPageUrl('PulseView') + '?' + buildReturnParamsRef.current() + '&autoReturn=' + PULSE_VIEW_DURATION_SEC);
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
  }, [navigate]);

  const autoSave = useCallback(async () => {
    const currentStats = statsRef.current;
    const currentElapsed = elapsedRef.current;
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
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const newData = generateSensorData();
        const increment = Math.round(timeMultiplier * 1000) / 1000;
        setElapsedSeconds(prev => {
          const next = prev + increment;
          // End the demo when the full program duration (2 hours) has elapsed
          if (!isInfinityRef.current && next >= targetDurationRef.current) {
            setIsRunning(false);
            setIsPaused(false);
            setShowProgramComplete(true);
            setTimeout(() => autoSave(), 200);
            return targetDurationRef.current;
          }
          return next;
        });
        setStats(prev => {
          const newReadings = prev.readings + 1;
          const newCalories = prev.calories + (500 / 3600) * increment; // 500 kcal/hr = 8.33/min
          const newMilestone = Math.floor(newCalories / 100);
          if (newMilestone > lastCalorieMilestoneRef.current) {
            lastCalorieMilestoneRef.current = newMilestone;
            playCoinSound(volumeRef.current);
          }
          return {
            ...prev,
            speed: newData.speed, cadence: newData.cadence,
            heartRate: newData.heartRate, power: newData.power,
            distance: prev.distance + (10 / 3600) * increment,
            calories: newCalories,
            maxSpeed: Math.max(prev.maxSpeed, newData.speed),
            maxCadence: Math.max(prev.maxCadence, newData.cadence),
            maxHeartRate: Math.max(prev.maxHeartRate, newData.heartRate),
            maxPower: Math.max(prev.maxPower, newData.power),
            totalSpeed: prev.totalSpeed + newData.speed,
            totalCadence: prev.totalCadence + newData.cadence,
            totalHeartRate: prev.totalHeartRate + newData.heartRate,
            totalPower: prev.totalPower + newData.power,
            readings: newReadings
          };
        });
        setIntervalSecondsRemaining(prev => {
          const newRemaining = prev - increment;
          if (newRemaining <= 0) {
            // Interval completed — advance program bar, loop if it reaches end
            setProgramPosition(pos => (pos + 1) % NUM_BARS);
            return INTERVAL_DURATION;
          }
          return newRemaining;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused, generateSensorData, timeMultiplier, autoSave]);

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
    setIsRunning(false); setIsPaused(false);
    setElapsedSeconds(0); setProgramPosition(0);
    setIntervalSecondsRemaining(INTERVAL_DURATION);
    setShowProgramComplete(false);
    lastCalorieMilestoneRef.current = 0;
    setStats({
      calories: 0, speed: 0, distance: 0, cadence: 0, heartRate: 0, power: 0,
      maxSpeed: 0, maxCadence: 0, maxHeartRate: 0, maxPower: 0,
      totalSpeed: 0, totalCadence: 0, totalHeartRate: 0, totalPower: 0, readings: 0
    });
    if (goHome) navigate(createPageUrl('Launcher'));
  };

  const formatTime = (totalSeconds) => {
    const rounded = Math.round(totalSeconds);
    const hrs = Math.floor(rounded / 3600);
    const mins = Math.floor((rounded % 3600) / 60);
    const secs = rounded % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = () => formatTime(Math.max(0, targetDuration - elapsedSeconds));



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
            <div className="flex gap-2" style={{ height: '90px', flexShrink: 0, padding: '8px 8px 0 8px' }}>
              {[
                { label: 'Interval Remaining', value: formatTime(intervalSecondsRemaining) },
                { label: 'Program Remaining',  value: isInfinity ? '∞' : formatTimeRemaining() },
                { label: 'Elapsed Time',        value: formatTime(elapsedSeconds), dot: true },
              ].map(({ label, value, dot }) => (
                <div key={label} className="flex-1 rounded-md flex flex-col items-center justify-center overflow-hidden"
                  style={{ background: '#3f3f3f' }}
                >
                  <span style={{ fontSize: '12px' }} className="uppercase tracking-widest text-zinc-300 leading-none mb-1 flex-shrink-0 font-semibold">{label}</span>
                  <div className="font-bold text-[#FF3F03] leading-none flex items-center gap-1 whitespace-nowrap"
                    style={{ fontSize: '36px' }}
                  >
                    {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRunning && !isPaused ? 'bg-[#FF3F03] animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-zinc-600'}`} />}
                    {value}
                  </div>
                </div>
              ))}
            </div>

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