import { useEffect, useState } from 'react';

// Served from public/logo.png — works fully offline, no internet required.
const LOGO_URL = '/logo.png';

export default function BootSplash({ onComplete }) {
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
        backgroundColor: '#515454',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <img
        src={LOGO_URL}
        alt="GamerCycle Logo"
        className="w-full max-w-4xl object-contain"
      />
    </div>
  );
}
