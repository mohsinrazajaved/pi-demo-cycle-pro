import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { playTypewriterClick } from './audioCues';

export default function PromptDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-80 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-[#FF3F03]" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        
        <p className="text-zinc-400 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={() => { playTypewriterClick(); onCancel(); }}
            className="flex-1 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => { playTypewriterClick(); onConfirm(); }}
            className="flex-1 py-3 rounded-lg bg-[#FF3F03] hover:bg-[#ff5522] text-white font-bold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}