import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, X } from 'lucide-react';
import { playTypewriterClick } from './audioCues';

export default function AudioControl({ volume, setVolume, onClose }) {
  return (
    <div className="relative rounded-md p-6 w-[33rem] z-50" style={{ background: '#3f3f3f' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[#FF3F03]" />
          <span className="text-sm font-bold text-white">Volume</span>
        </div>
        <button
          onClick={() => { playTypewriterClick(); onClose(); }}
          className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: '#000' }}
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <VolumeX className="w-4 h-4 text-zinc-600" />
        <Slider
          value={[volume]}
          onValueChange={(val) => setVolume(val[0])}
          min={0}
          max={100}
          step={5}
          className="flex-1"
        />
        <Volume2 className="w-5 h-5 text-[#FF3F03]" />
      </div>

      <div className="text-center mt-3">
        <span className="text-xs text-zinc-500">{volume}%</span>
      </div>
    </div>
  );
}