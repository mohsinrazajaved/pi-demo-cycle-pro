import React from 'react';
import { formatWorkoutTime } from './WorkoutContext';

/**
 * Shared timer-row used by RideDisplay (ride display) and PulseView (pulse view).
 * Keeps Interval / Program / Elapsed perfectly in sync between the two screens.
 *
 * variant: 'ride' (RideDisplay layout) | 'pulse' (PulseView layout)
 */
export default function TimerRow({
  intervalSecondsRemaining,
  elapsedSeconds,
  targetDuration,
  isInfinity,
  isRunning,
  isPaused,
  variant = 'ride',
}) {
  const programValue = isInfinity
    ? '∞'
    : formatWorkoutTime(Math.max(0, targetDuration - elapsedSeconds));

  const items = [
    { label: 'Interval Remaining', value: formatWorkoutTime(intervalSecondsRemaining) },
    { label: 'Program Remaining',  value: programValue, large: variant === 'pulse' && isInfinity },
    { label: 'Elapsed Time',       value: formatWorkoutTime(elapsedSeconds), dot: true },
  ];

  if (variant === 'pulse') {
    return (
      <div className="flex gap-2 flex-shrink-0" style={{ height: '72px' }}>
        {items.map(({ label, value, large, dot }) => (
          <div key={label} className="flex-1 rounded-md flex flex-col items-center justify-center"
            style={{ background: '#3f3f3f' }}
          >
            <span className="text-[12px] uppercase tracking-widest text-zinc-300 leading-none mb-1 font-semibold">{label}</span>
            <div className="font-bold text-[#FF3F03] leading-none flex items-center gap-1 whitespace-nowrap"
              style={{ fontSize: large ? '32px' : '28px' }}
            >
              {dot && <span className={`w-1.5 h-1.5 rounded-full ${isRunning && !isPaused ? 'bg-[#FF3F03] animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-zinc-600'}`} />}
              {value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ride variant
  return (
    <div className="flex gap-2" style={{ height: '90px', flexShrink: 0, padding: '8px 8px 0 8px' }}>
      {items.map(({ label, value, dot }) => (
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
  );
}
