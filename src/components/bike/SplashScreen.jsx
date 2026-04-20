import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 3000);
    const completeTimer = setTimeout(() => onComplete(), 3800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-700"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 50%, #1a0800 0%, #0a0a0a 60%, #000 100%)',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div className="text-center">
        <div className="text-6xl md:text-7xl font-black tracking-tight leading-none">
          <span className="text-white">CYCLE</span>
          <span className="text-[#FF3F03] ml-3" style={{ textShadow: '0 0 40px rgba(255,63,3,0.6)' }}>STATS</span>
        </div>
        <div className="mt-3 text-2xl font-bold tracking-[0.3em] text-zinc-500">PRO</div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF3F03] animate-pulse" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-[#FF3F03] animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-[#FF3F03] animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
