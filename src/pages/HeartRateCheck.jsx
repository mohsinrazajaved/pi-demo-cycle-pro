import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProgramDisplay from '../components/bike/ProgramDisplay';
import SimulatorController from '../components/bike/SimulatorController';
import { mockDB } from '@/api/mockDataService';
import { generateProgramData } from '../components/bike/programPatterns';

function HeartRateGauge({ heartRate }) {
  const MIN = 60;
  const MAX = 180;
  // The arc goes from the left end (angle=-180° from center = 180deg in SVG terms) 
  // to the right end (angle=0°). Center of arc is at (50,50).
  // Left end of arc (10,50) corresponds to 180deg, right end (90,50) to 0deg.
  // So: MIN -> 180deg, MAX -> 0deg  =>  angle = 180 - ((val-MIN)/(MAX-MIN))*180
  const clamped = Math.min(Math.max(heartRate, MIN), MAX);
  // MIN (60) -> left end of arc (-90deg), MAX (180) -> right end of arc (+90deg)
  const rotateAngle = ((clamped - MIN) / (MAX - MIN)) * 180 - 90;
  const tickValues = [60, 80, 100, 120, 140, 160, 180];

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="text-center text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Heart Rate (beats per minute)</div>
      <svg viewBox="0 0 100 58" className="w-full flex-1">
        <defs>
          <linearGradient id="hrGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="15%" stopColor="#00ff44" />
            <stop offset="45%" stopColor="#00ff44" />
            <stop offset="88%" stopColor="#ff4400" />
            <stop offset="100%" stopColor="#ff4400" />
          </linearGradient>
        </defs>
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#hrGradient)" strokeWidth="8" strokeLinecap="round" />
        {tickValues.map((value) => {
          // Arc goes from left (180deg) to right (0deg) in standard math angles
          // MIN(60) -> 180deg (left), MAX(180) -> 0deg (right)
          const fraction = (value - MIN) / (MAX - MIN);
          const rad = Math.PI - fraction * Math.PI; // 180deg -> 0deg
          return (
            <g key={value}>
              <line x1={50 + 32 * Math.cos(rad)} y1={50 - 32 * Math.sin(rad)} x2={50 + 42 * Math.cos(rad)} y2={50 - 42 * Math.sin(rad)} stroke="#666" strokeWidth="1" />
              <text x={50 + 26 * Math.cos(rad)} y={50 - 26 * Math.sin(rad)} fill="#888" fontSize="4.5" textAnchor="middle" dominantBaseline="middle">{value}</text>
            </g>
          );
        })}
        <g transform={`rotate(${rotateAngle}, 50, 50)`}>
          <polygon points="50,15 48,50 52,50" fill="#FF3F03" style={{ filter: 'drop-shadow(0 0 2px #FF3F03)' }} />
          <circle cx="50" cy="50" r="4" fill="#FF3F03" />
        </g>
        <text x="50" y="44" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">{heartRate}</text>
      </svg>
    </div>
  );
}

export default function HeartRateCheck() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);

  // State passed from BikeComputer
  const program = urlParams.get('program') || '';
  const targetEndTimeParam = urlParams.get('targetEndTime') || '';
  const isManual = urlParams.get('manual') === '1';
  const isInfinity = targetEndTimeParam === 'infinity' || urlParams.get('infinity') === '1';
  const targetDuration = isInfinity ? Infinity : (Number(targetEndTimeParam) || 30 * 60);
  const wasRunning = urlParams.get('running') === '1';

  const [elapsedSeconds, setElapsedSeconds] = useState(Number(urlParams.get('elapsed') || 0));
  const [intervalSecondsRemaining, setIntervalSecondsRemaining] = useState(Number(urlParams.get('intervalRemaining') || 30));
  const [programPosition, setProgramPosition] = useState(Number(urlParams.get('programPosition') || 0));

  const [heartRate, setHeartRate] = useState(120); // demo: 120 BPM
  const [simRpm, setSimRpm] = useState(65);
  const [simPower, setSimPower] = useState(140);
  const [resistance, setResistance] = useState(Number(urlParams.get('resistance') || 5));
  const [timeMultiplier, setTimeMultiplier] = useState(1);
  const [profileAge, setProfileAge] = useState(44); // age 44 → max HR 176 → 120/176 = 68%
  const autoReturn = Number(urlParams.get('autoReturn') || 0);

  // Load profile age (fallback to 44 for demo math: 120 BPM = 68% of max HR)
  useEffect(() => {
    mockDB.entities.Profile.list('-created_date', 1).then((results) => {
      if (results.length > 0 && results[0].age) setProfileAge(results[0].age);
    });
  }, []);

  // Auto-return to BikeComputer after N seconds (triggered by push button)
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(autoReturn);
  useEffect(() => {
    if (!autoReturn) return;
    const timer = setInterval(() => {
      setAutoReturnCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); handleBackToBike(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line

  const INTERVAL_DURATION = 30;

  // Keep timers running if workout was running
  useEffect(() => {
    if (!wasRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + timeMultiplier);
      setIntervalSecondsRemaining(prev => {
        const next = prev - timeMultiplier;
        if (next <= 0) {
          setProgramPosition(p => (p + 1) % NUM_BARS);
          return INTERVAL_DURATION;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [wasRunning, timeMultiplier]);

  const NUM_BARS = generateProgramData(program, resistance).length;

  // For small-step, cap resistance at 27 (max offset is 3, so 27+3=30)
  // In manual mode, no cap needed
  const maxResistanceForProgram = (!isManual && program === 'small-step') ? 27 : 30;

  const [programData, setProgramData] = useState(() =>
    isManual ? Array(NUM_BARS).fill(resistance) : generateProgramData(program, resistance)
  );

  useEffect(() => {
    if (isManual) {
      setProgramData(Array(NUM_BARS).fill(resistance));
    } else {
      setProgramData(generateProgramData(program, resistance));
    }
  }, [resistance, isManual]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = () => {
    if (isInfinity) return '∞';
    return formatTime(Math.max(0, targetDuration - elapsedSeconds));
  };

  const getHeartRateColor = (hr) => {
    const MIN = 60;
    const MAX = 180;
    const clamped = Math.min(Math.max(hr, MIN), MAX);
    const fraction = (clamped - MIN) / (MAX - MIN);

    const colors = [
      { offset: 0, color: [59, 130, 246] },      // #3b82f6 blue
      { offset: 0.15, color: [0, 255, 68] },     // #00ff44 vibrant green
      { offset: 0.45, color: [0, 255, 68] },     // #00ff44 vibrant green (extends past 130)
      { offset: 0.88, color: [255, 68, 0] },     // #ff4400 dark orange (starts ~170 bpm)
      { offset: 1, color: [255, 68, 0] }         // #ff4400 dark orange
    ];

    let segment = 0;
    for (let i = 0; i < colors.length - 1; i++) {
      if (fraction >= colors[i].offset && fraction <= colors[i + 1].offset) {
        segment = i;
        break;
      }
    }

    const start = colors[segment];
    const end = colors[segment + 1];
    const segmentFraction = (fraction - start.offset) / (end.offset - start.offset);

    const r = Math.round(start.color[0] + (end.color[0] - start.color[0]) * segmentFraction);
    const g = Math.round(start.color[1] + (end.color[1] - start.color[1]) * segmentFraction);
    const b = Math.round(start.color[2] + (end.color[2] - start.color[2]) * segmentFraction);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleBackToBike = () => {
    // Pass the absolute target end time back to BikeComputer
    const passableTargetEndTime = isInfinity ? 'infinity' : targetDuration;

    navigate(
      createPageUrl('BikeComputer') +
      `?program=${program}&targetEndTime=${passableTargetEndTime}&elapsed=${elapsedSeconds}&intervalRemaining=${intervalSecondsRemaining}&programPosition=${programPosition}&running=${wasRunning ? '1' : '0'}&resistance=${resistance}&manual=${isManual ? '1' : '0'}&infinity=${isInfinity ? '1' : '0'}`
    );
  };

  return (
    <div className="h-screen w-screen text-white overflow-hidden flex flex-col p-2 relative"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a0800 0%, #0a0a0a 60%, #050505 100%)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,63,3,0.5), transparent)' }} />

      {/* Auto-return countdown badge */}
      {autoReturn > 0 && (
        <div className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FF3F03]/40 text-xs font-bold text-[#FF3F03]"
          style={{ background: 'rgba(255,63,3,0.1)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3F03] animate-pulse" />
          Returning in {autoReturnCountdown}s
        </div>
      )}

      {/* Simulator Controller - always visible on top */}
      <SimulatorController
        heartRate={heartRate}
        setHeartRate={setHeartRate}
        rpm={simRpm}
        setRpm={setSimRpm}
        power={simPower}
        setPower={setSimPower}
        resistance={resistance}
        setResistance={setResistance}
        maxResistance={maxResistanceForProgram}
        onHeartRateHold={handleBackToBike}
        timeMultiplier={timeMultiplier}
        setTimeMultiplier={setTimeMultiplier}
      />

      {/* Main Content — fixed heights tuned for 800×480 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with Time Displays — fixed 62px */}
        <div className="flex gap-2 mb-1" style={{ height: '62px', flexShrink: 0 }}>
          {[
            { label: 'Interval', value: formatTime(intervalSecondsRemaining) },
            { label: 'Program',  value: formatTimeRemaining(), large: isInfinity },
            { label: 'Elapsed',  value: formatTime(elapsedSeconds), dot: true },
          ].map(({ label, value, large, dot }) => (
            <div key={label} className="flex-1 rounded-xl border border-zinc-700/40 px-2 flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(180deg, rgba(30,30,30,0.9) 0%, rgba(15,15,15,0.9) 100%)' }}
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 leading-none mb-0.5">{label}</span>
              <div className={`font-mono font-bold text-[#FF3F03] leading-none flex items-center gap-1 ${large ? 'text-5xl' : 'text-3xl'}`}
                style={{ textShadow: '0 0 20px rgba(255,63,3,0.4)' }}
              >
                {dot && <span className={`w-1.5 h-1.5 rounded-full ${wasRunning ? 'bg-[#FF3F03] animate-pulse' : 'bg-zinc-600'}`} />}
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Centre: Gauge + Info — flex-1 takes remaining space */}
        <div className="flex gap-2 min-h-0" style={{ flex: '1 1 0' }}>
          {/* Heart Rate Gauge - 2/3 width */}
          <div className="w-2/3 rounded-xl border border-zinc-700/40 p-2 min-h-0"
            style={{ background: 'linear-gradient(180deg, rgba(25,25,25,0.95) 0%, rgba(12,12,12,0.95) 100%)' }}
          >
            <HeartRateGauge heartRate={heartRate} />
          </div>
          {/* Right side - two stacked panels - 1/3 width */}
          <div className="w-1/3 flex flex-col gap-2 min-h-0">
            {/* Training Zone */}
            <div className="flex-1 rounded-xl border border-zinc-700/40 p-2 flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(25,25,25,0.95) 0%, rgba(12,12,12,0.95) 100%)' }}>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Training Zone</span>
              {(() => {
                const maxHR = 220 - profileAge;
                const pct = (heartRate / maxHR) * 100;
                let zone;
                if (pct < 60) { zone = 'Light'; }
                else if (pct < 70) { zone = 'Fat Burn'; }
                else if (pct < 80) { zone = 'Aerobic'; }
                else if (pct < 90) { zone = 'Threshold'; }
                else { zone = 'Anaerobic'; }
                const color = getHeartRateColor(heartRate);
                return (
                  <div className="text-center px-1">
                    <div className="text-3xl font-black uppercase leading-tight" style={{ color }}>{zone}</div>
                  </div>
                );
              })()}
            </div>
            {/* % Max Heart Rate */}
            <div className="flex-1 rounded-xl border border-zinc-700/40 p-2 flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(25,25,25,0.95) 0%, rgba(12,12,12,0.95) 100%)' }}>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">% Max Heart Rate</span>
              <div className="text-4xl font-black" style={{ color: getHeartRateColor(heartRate) }}>
                {Math.round((heartRate / (220 - profileAge)) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Program Display — fixed 100px */}
        <div className="mt-1" style={{ height: '100px', flexShrink: 0 }}>
          <ProgramDisplay programData={programData} currentPosition={programPosition} resistance={resistance} isComplete={false} programLabel="" />
        </div>
      </div>
    </div>
  );
}