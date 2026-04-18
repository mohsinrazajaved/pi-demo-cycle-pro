import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // After 3 seconds, start fade out
    const fadeTimer = setTimeout(() => setFading(true), 3000);
    // After fade (0.8s), call onComplete
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
        backgroundColor: '#515454',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698a9a4bff14678e47cf83bf/7b5d29d96_GamerCycleLogoTM.png"
        alt="GamerCycle Logo"
        className="w-full max-w-4xl object-contain"
      />
    </div>
  );
}