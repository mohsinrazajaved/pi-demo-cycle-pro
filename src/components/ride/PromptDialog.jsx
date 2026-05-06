import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { playTypewriterClick } from './audioCues';

export default function PromptDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="rounded-md p-6 w-80" style={{ background: '#3f3f3f' }}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-[#FF3F03]" strokeWidth={2.5} />
          <h3 className="text-lg font-black text-white uppercase tracking-wide">{title}</h3>
        </div>

        <p className="text-zinc-200 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={() => { playTypewriterClick(); onCancel(); }}
            className="flex-1 py-3 rounded-md text-white font-black"
            style={{ background: '#000' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { playTypewriterClick(); onConfirm(); }}
            className="flex-1 py-3 rounded-md bg-[#FF3F03] text-white font-black"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}