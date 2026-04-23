import React from 'react';
import { Delete, ChevronUp, ChevronDown } from 'lucide-react';

import { playTypewriterClick } from './audioCues';

export default function DigitPad({ value, onChange, onClose, onPrev, onNext }) {
  const handleKey = (key) => {
    if (key === 'DEL') {
      onChange(String(value).slice(0, -1));
    } else if (key === '.') {
      if (!String(value).includes('.')) onChange(String(value) + '.');
    } else {
      onChange(String(value) + key);
    }
  };

  const keys = ['7','8','9','4','5','6','1','2','3','.','0','DEL'];

  return (
    <div className="border border-zinc-700/40 rounded-xl p-3 shadow-2xl w-full max-w-xs" style={{ background: 'linear-gradient(180deg, #161616, #101010)' }}>
      <div className="grid grid-cols-3 gap-1.5">
        {keys.map((k) => (
          <button
            key={k}
            onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); handleKey(k); }}
            className="rounded-xl h-14 flex items-center justify-center text-white font-bold text-xl border border-zinc-700/30 transition-all active:scale-95" style={{ background: 'linear-gradient(145deg, #252525, #1a1a1a)' }}
          >
            {k === 'DEL' ? <Delete className="w-5 h-5 text-[#FF3F03]" /> : k}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <button
          onMouseDown={(e) => { e.preventDefault(); onPrev(); }}
          className="flex-1 rounded-xl h-9 flex items-center justify-center border border-zinc-700/30 transition-all active:scale-95" style={{ background: 'linear-gradient(145deg, #252525, #1a1a1a)' }}
        >
          <ChevronUp className="w-5 h-5 text-[#FF3F03]" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); onNext(); }}
          className="flex-1 rounded-xl h-9 flex items-center justify-center border border-zinc-700/30 transition-all active:scale-95" style={{ background: 'linear-gradient(145deg, #252525, #1a1a1a)' }}
        >
          <ChevronDown className="w-5 h-5 text-[#FF3F03]" />
        </button>
      </div>
    </div>
  );
}