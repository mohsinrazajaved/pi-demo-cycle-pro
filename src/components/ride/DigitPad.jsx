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
  const keyBg = '#3f3f3f';

  return (
    <div className="rounded-md p-3 w-full max-w-xs" style={{ background: '#0a0a0a' }}>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onMouseDown={(e) => { e.preventDefault(); playTypewriterClick(); handleKey(k); }}
            className="rounded-md h-14 flex items-center justify-center text-white font-bold text-xl transition-all active:scale-95"
            style={{ background: keyBg }}
          >
            {k === 'DEL' ? <Delete className="w-5 h-5 text-[#FF3F03]" /> : k}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onMouseDown={(e) => { e.preventDefault(); onPrev(); }}
          className="flex-1 rounded-md h-9 flex items-center justify-center transition-all active:scale-95"
          style={{ background: keyBg }}
        >
          <ChevronUp className="w-5 h-5 text-[#FF3F03]" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); onNext(); }}
          className="flex-1 rounded-md h-9 flex items-center justify-center transition-all active:scale-95"
          style={{ background: keyBg }}
        >
          <ChevronDown className="w-5 h-5 text-[#FF3F03]" />
        </button>
      </div>
    </div>
  );
}
