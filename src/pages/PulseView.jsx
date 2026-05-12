import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SessionTimeline from '../components/ride/SessionTimeline';
import { dataStore } from '@/services/localStore';
import { generateSessionPattern } from '../components/ride/sessionPatterns';
import TimerRow from '../components/ride/TimerRow';
import { useWorkout } from '../components/ride/WorkoutContext';

// Safely turn a URL param into a number. Returns `fallback` for null,
// '', NaN, negative, or anything not finite. Prevents the dreaded
// "Number('') === 0 → falls through to default" bug.
function safeNum(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

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

export default function PulseView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);

  // All timer state comes from the shared WorkoutContext — same instance the RideDisplay
  // ride display reads, so the timer keeps ticking through navigation.
  const { state: w } = useWorkout();
  const { elapsedSeconds, intervalSecondsRemaining, programPosition, isRunning, isPaused, targetDuration, isInfinity } = w;

  // Program identity comes from context; manual/resistance come on the URL from RideDisplay.
  const program = w.programId;
  const isManual = urlParams.get('manual') === '1';

  const [heartRate] = useState(120); // demo: 120 BPM
  const [resistance] = useState(safeNum(urlParams.get('resistance'), 5));
  const [profileAge, setProfileAge] = useState(44); // age 44 → max HR 176 → 120/176 = 68%
  const autoReturn = safeNum(urlParams.get('autoReturn'), 0);

  // Load profile age (fallback to 44 for demo math: 120 BPM = 68% of max HR)
  useEffect(() => {
    dataStore.entities.Profile.list('-created_date', 1).then((results) => {
      if (results.length > 0 && results[0].age) setProfileAge(results[0].age);
    });
  }, []);

  // Auto-return to RideDisplay after N seconds (triggered by push button).
  // We call `handleBackToBike` through a ref so the timer always uses the
  // *latest* version of the closure — i.e., current elapsedSeconds, not the
  // value from when the effect was first set up.
  const handleBackToBikeRef = useRef(null);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(autoReturn);
  useEffect(() => {
    if (!autoReturn) return;
    const timer = setInterval(() => {
      setAutoReturnCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); handleBackToBikeRef.current?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const NUM_BARS = generateSessionPattern(program, resistance).length;

  const [programData, setProgramData] = useState(() =>
    isManual ? Array(NUM_BARS).fill(resistance) : generateSessionPattern(program, resistance)
  );

  useEffect(() => {
    if (isManual) {
      setProgramData(Array(NUM_BARS).fill(resistance));
    } else {
      setProgramData(generateSessionPattern(program, resistance));
    }
  }, [resistance, isManual]);

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
    // No URL params — context state preserves the timer across the route change.
    navigate(createPageUrl('RideDisplay'));
  };

  // Keep the ref pointing at the latest handleBackToBike, so the autoReturn
  // setInterval (which captured a stale closure on mount) always calls the
  // current version with up-to-date elapsedSeconds / programPosition / etc.
  useEffect(() => { handleBackToBikeRef.current = handleBackToBike; });

  return (
    <div className="h-screen w-screen text-white overflow-hidden relative" style={{ background: '#000' }}>
      {/* Auto-return countdown badge — bottom-centered */}
      {autoReturn > 0 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-0.5 rounded-md text-[11px] font-bold text-[#FF3F03]"
          style={{ background: '#3f3f3f' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3F03] animate-pulse" />
          Returning in {autoReturnCountdown}s
        </div>
      )}

      {/* Main Content — fixed-pixel layout: 72 + 388 + 108 + paddings/gaps = 600 */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px' }}>
        {/* Header — 72px */}
        <TimerRow
          variant="pulse"
          intervalSecondsRemaining={intervalSecondsRemaining}
          elapsedSeconds={elapsedSeconds}
          targetDuration={targetDuration}
          isInfinity={isInfinity}
          isRunning={isRunning}
          isPaused={isPaused}
        />

        {/* Centre — 388px */}
        <div className="flex gap-2 flex-shrink-0" style={{ height: '388px' }}>
          <div className="w-2/3 rounded-md p-2" style={{ background: '#000' }}>
            <HeartRateGauge heartRate={heartRate} />
          </div>
          <div className="w-1/3 flex flex-col gap-2">
            {/* Training Zone */}
            <div className="flex-1 rounded-md flex flex-col items-center justify-center overflow-hidden" style={{ background: '#3f3f3f' }}>
              <span className="text-[12px] uppercase tracking-wider text-zinc-300 mb-2 font-semibold">Training Zone</span>
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
                  <div className="text-center px-1 w-full">
                    <div className="font-black uppercase leading-tight break-words" style={{ color, fontSize: '28px' }}>{zone}</div>
                  </div>
                );
              })()}
            </div>
            {/* % Max Heart Rate */}
            <div className="flex-1 rounded-md flex flex-col items-center justify-center overflow-hidden" style={{ background: '#3f3f3f' }}>
              <span className="text-[12px] uppercase tracking-wider text-zinc-300 mb-2 font-semibold">% Max Heart Rate</span>
              <div className="font-black" style={{ color: getHeartRateColor(heartRate), fontSize: '40px' }}>
                {Math.round((heartRate / (220 - profileAge)) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — 108px */}
        <div style={{ height: '108px', flexShrink: 0 }}>
          <SessionTimeline programData={programData} currentPosition={programPosition} resistance={resistance} isComplete={false} programLabel="" elapsedSeconds={elapsedSeconds} targetDuration={targetDuration} />
        </div>
      </div>
    </div>
  );
}
