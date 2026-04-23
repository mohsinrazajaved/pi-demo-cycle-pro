import React, { useState } from 'react';
import { Delete, ChevronUp, ChevronDown } from 'lucide-react';

const NUMBERS = ['1','2','3','4','5','6','7','8','9','0'];
const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

import { playTypewriterClick } from './audioCues';

export default function AlphaPad({ value, onChange, onClose, onPrev, onNext }) {
  const [caps, setCaps] = useState(true);

  const handleKey = (key) => {
    playTypewriterClick();
    onChange(value + (caps ? key.toUpperCase() : key.toLowerCase()));
  };

  const handleDel = () => {
    playTypewriterClick();
    onChange(value.slice(0, -1));
  };

  const btnClass = "rounded-lg flex items-center justify-center text-white font-bold border border-zinc-700/30 transition-all active:scale-95";

  return (
    <div className="border border-zinc-700/40 rounded-xl p-2 shadow-2xl w-full" style={{ background: 'linear-gradient(180deg, #161616, #101010)' }}>
      {/* Number row */}
      <div className="flex justify-center gap-1 mb-1">
        {NUMBERS.map((k) => (
          <button
            key={k}
            onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); onChange(value + k); }}
            className={`${btnClass} flex-1 h-8 text-sm`} style={{ background: 'linear-gradient(145deg, #252525, #1a1a1a)' }}
          >
            {k}
          </button>
        ))}
        <button
          onMouseDown={(e) => { e.preventDefault(); handleDel(); }}
          className="bg-zinc-700 hover:bg-zinc-600 rounded-md w-10 h-8 flex items-center justify-center ml-1 flex-shrink-0"
        >
          <Delete className="w-4 h-4 text-[#FF3F03]" />
        </button>
      </div>

      {/* Letter rows */}
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 mb-1">
          {row.map((k) => (
            <button
              key={k}
              onMouseDown={(e) => { e.preventDefault(); handleKey(k); }}
              className={`${btnClass} flex-1 h-8 text-sm`} style={{ background: 'linear-gradient(145deg, #252525, #1a1a1a)' }}
              style={{ maxWidth: '10%' }}
            >
              {caps ? k.toUpperCase() : k.toLowerCase()}
            </button>
          ))}
        </div>
      ))}

      {/* Bottom row */}
      <div className="flex justify-center gap-1 mt-1">
        <button
          onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); setCaps(!caps); }}
          className={`rounded-md px-3 h-8 text-xs font-bold flex-shrink-0 ${caps ? 'bg-[#FF3F03] text-white' : 'bg-[#515454] text-zinc-300'}`}
        >
          CAPS
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); onChange(value + ' '); }}
          className="bg-[#515454] hover:bg-[#616464] rounded-md flex-1 h-8 text-white text-xs"
        >
          SPACE
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); onChange(value + '.'); }}
          className="bg-[#515454] hover:bg-[#616464] rounded-md px-3 h-8 text-white font-bold text-xs flex-shrink-0"
        >
          .
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); onPrev?.(); }}
          className="bg-[#515454] hover:bg-[#616464] rounded-md px-2 h-8 flex items-center justify-center flex-shrink-0"
        >
          <ChevronUp className="w-4 h-4 text-[#FF3F03]" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); onNext?.(); }}
          className="bg-[#515454] hover:bg-[#616464] rounded-md px-2 h-8 flex items-center justify-center flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-[#FF3F03]" />
        </button>
      </div>
    </div>
  );
}