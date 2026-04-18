import React from 'react';
import { Timer } from 'lucide-react';

export default function WorkoutTimer({ seconds }) {
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-zinc-900/60 backdrop-blur-sm rounded-full px-6 py-3 border border-zinc-800">
      <Timer className="w-5 h-5 text-cyan-400" />
      <span className="text-2xl font-mono font-bold text-white tracking-wider">
        {formatTime(seconds)}
      </span>
    </div>
  );
}