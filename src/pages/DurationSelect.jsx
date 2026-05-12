import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Timer } from 'lucide-react';
import { playTypewriterClick } from '../components/ride/audioCues';

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

const TIMED_PROGRAMS = ['gc-fat-burn', 'small-interval', 'large-interval', 'small-step', 'big-step', 'small-plateau', 'large-plateau'];

export default function DurationSelect() {
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
    navigate(createPageUrl('RideDisplay') + `?program=${resolvedProgramId}&duration=${value === Infinity ? 'infinity' : value}&name=${encodeURIComponent(programName)}&durationLabel=${encodeURIComponent(durationLabel)}`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden text-white relative" style={{ background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header — 56px */}
        <div className="flex items-center gap-3 flex-shrink-0" style={{ height: '56px', padding: '0 12px' }}>
          <button
            onClick={() => { playTypewriterClick(); navigate(createPageUrl('Launcher')); }}
            className="w-10 h-10 rounded-md flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{ background: '#3f3f3f' }}
          >
            <ArrowLeft className="text-[#FF3F03]" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <Timer className="text-[#FF3F03]" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Duration</span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-lg font-black text-white uppercase tracking-wide">{programName}</span>
          </div>
        </div>

        {/* Grid — 544px */}
        <div className="grid grid-cols-5 grid-rows-3 flex-shrink-0" style={{ height: '544px', padding: '0 12px 12px', gap: '10px' }}>
        {TIME_OPTIONS.map((opt) => {
          const isSelected = selectedTime === opt.value;
          const isInfinity = opt.value === Infinity;
          return (
            <button
              key={String(opt.value)}
              onClick={() => { playTypewriterClick(); handleSelect(opt.value); }}
              className="rounded-md flex flex-col items-center justify-center font-black transition-all active:scale-95"
              style={{
                background: isSelected ? '#FF3F03' : '#3f3f3f',
                color: isSelected ? '#fff' : '#FF3F03',
                fontSize: isInfinity ? '48px' : '36px',
              }}
            >
              {opt.label}
              {!isInfinity && (
                <span className="font-semibold text-zinc-400 tracking-wider" style={{ fontSize: '13px', marginTop: '4px' }}>min</span>
              )}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
