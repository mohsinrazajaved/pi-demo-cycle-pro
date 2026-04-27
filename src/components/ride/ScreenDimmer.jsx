import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Sun, X } from 'lucide-react';
import { playTypewriterClick } from './audioCues';

export default function ScreenDimmer({ brightness, setBrightness, onClose }) {
  return (
    <>
      {/* Background overlay that dims with the brightness setting */}
      <div 
        className="fixed inset-0 bg-black transition-opacity duration-150 z-40"
        style={{ opacity: (100 - brightness) / 100 }}
      />
      
      {/* Slider widget - always fully visible */}
      <div className="relative rounded-md p-6 w-[33rem] z-50" style={{ background: '#3f3f3f' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-[#FF3F03]" />
            <span className="text-sm font-bold text-white">Screen Brightness</span>
          </div>
          <button 
            onClick={() => { playTypewriterClick(); onClose(); }}
            className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: '#000' }}
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <Sun className="w-4 h-4 text-zinc-600" />
          <Slider
            value={[brightness]}
            onValueChange={(val) => setBrightness(val[0])}
            min={0}
            max={100}
            step={5}
            className="flex-1"
          />
          <Sun className="w-5 h-5 text-[#FF3F03]" />
        </div>
        
        <div className="text-center mt-3">
          <span className="text-xs text-zinc-500">{brightness}%</span>
        </div>
      </div>
    </>
  );
}