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

  const btnClass = "rounded-md flex items-center justify-center text-white font-bold transition-all active:scale-95";
  const keyBg = '#3f3f3f';

  return (
    <div className="rounded-md p-2 w-full" style={{ background: '#0a0a0a' }}>
      {/* Number row */}
      <div className="flex justify-center gap-1 mb-1">
        {NUMBERS.map((k) => (
          <button
            key={k}
            onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); onChange(value + k); }}
            className={`${btnClass} flex-1 h-9 text-sm`}
            style={{ background: keyBg }}
          >
            {k}
          </button>
        ))}
        <button
          onMouseDown={(e) => { e.preventDefault(); handleDel(); }}
          className="rounded-md w-10 h-9 flex items-center justify-center ml-1 flex-shrink-0"
          style={{ background: keyBg }}
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
              className={`${btnClass} flex-1 h-9 text-sm`}
              style={{ background: keyBg, maxWidth: '10%' }}
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
          className={`rounded-md px-3 h-9 text-xs font-black flex-shrink-0 ${caps ? 'bg-[#FF3F03] text-white' : 'text-zinc-300'}`}
          style={caps ? {} : { background: keyBg }}
        >
          CAPS
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); onChange(value + ' '); }}
          className="rounded-md flex-1 h-9 text-white text-xs"
          style={{ background: keyBg }}
        >
          SPACE
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); onChange(value + '.'); }}
          className="rounded-md px-3 h-9 text-white font-bold text-xs flex-shrink-0"
          style={{ background: keyBg }}
        >
          .
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); onPrev?.(); }}
          className="rounded-md px-2 h-9 flex items-center justify-center flex-shrink-0"
          style={{ background: keyBg }}
        >
          <ChevronUp className="w-4 h-4 text-[#FF3F03]" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); onNext?.(); }}
          className="rounded-md px-2 h-9 flex items-center justify-center flex-shrink-0"
          style={{ background: keyBg }}
        >
          <ChevronDown className="w-4 h-4 text-[#FF3F03]" />
        </button>
      </div>
    </div>
  );
}
