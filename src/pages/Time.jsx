import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Timer } from 'lucide-react';
import { playTypewriterClick } from '../components/bike/sounds';

const TIME_OPTIONS = [
  { label: '10',  value: 10 },
  { label: '20',  value: 20 },
  { label: '30',  value: 30 },
  { label: '40',  value: 40 },
  { label: '50',  value: 50 },
  { label: '60',  value: 60 },
  { label: '70',  value: 70 },
  { label: '80',  value: 80 },
  { label: '90',  value: 90 },
  { label: '100', value: 100 },
  { label: '110', value: 110 },
  { label: '120', value: 120 },
  { label: '130', value: 130 },
  { label: '140', value: 140 },
  { label: '∞',   value: Infinity },
];

const TIMED_PROGRAMS = ['small-interval', 'large-interval', 'small-step', 'big-step', 'small-plateau', 'large-plateau'];

export default function Time() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const programId = urlParams.get('program');
  const programName = (urlParams.get('name') || 'Program').replace(/\n/g, ' ').trim();
  const [selectedTime, setSelectedTime] = useState(null);

  const handleSelect = (value) => {
    setSelectedTime(value);
    let resolvedProgramId = programId;
    if (value !== Infinity && TIMED_PROGRAMS.includes(programId)) {
      resolvedProgramId = `${programId}-${value}`;
    }
    const durationLabel = value === Infinity ? '∞' : `${value}min`;
    navigate(createPageUrl('BikeComputer') + `?program=${resolvedProgramId}&duration=${value === Infinity ? 'infinity' : value}&name=${encodeURIComponent(programName)}&durationLabel=${encodeURIComponent(durationLabel)}`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col text-white"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a0800 0%, #0d0d0d 60%, #080808 100%)' }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,63,3,0.6), transparent)' }} />

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => { playTypewriterClick(); navigate(createPageUrl('Home')); }}
          className="w-10 h-10 rounded-xl border border-zinc-700/50 flex items-center justify-center transition-all hover:border-[#FF3F03]/40 active:scale-95"
          style={{ background: 'linear-gradient(145deg, #1e1e1e, #141414)' }}
        >
          <ArrowLeft className="w-4 h-4 text-[#FF3F03]" />
        </button>
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-[#FF3F03]/60" />
          <span className="text-xs uppercase tracking-widest text-zinc-500">Duration</span>
          <span className="text-[#FF3F03]/40 text-xs">·</span>
          <span className="text-base font-bold text-white">{programName}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-4 pb-4 grid grid-cols-5 grid-rows-3 gap-2.5">
        {TIME_OPTIONS.map((opt) => {
          const isSelected = selectedTime === opt.value;
          const isInfinity = opt.value === Infinity;
          return (
            <button
              key={String(opt.value)}
              onClick={() => { playTypewriterClick(); handleSelect(opt.value); }}
              className="relative rounded-xl border flex flex-col items-center justify-center font-bold transition-all active:scale-95 group overflow-hidden"
              style={{
                fontSize: isInfinity ? '2rem' : '1.5rem',
                background: isSelected
                  ? 'linear-gradient(145deg, #FF3F03, #cc3200)'
                  : 'linear-gradient(145deg, #1e1e1e, #141414)',
                border: isSelected ? '1px solid #FF3F03' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: isSelected ? '0 0 20px rgba(255,63,3,0.3)' : 'none',
                color: isSelected ? '#fff' : '#d4d4d4',
              }}
            >
              {!isSelected && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,63,3,0.12) 0%, transparent 70%)' }} />
              )}
              {opt.label}
              {!isInfinity && !isSelected && (
                <span className="text-[10px] font-normal text-zinc-600 absolute bottom-1.5 tracking-wider">min</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
