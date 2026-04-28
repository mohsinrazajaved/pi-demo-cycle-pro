import { useEffect, useRef, useState } from 'react';
import { getVolume } from '@/config';

// Served from public/ — works fully offline, no internet required.
const LOGO_URL  = '/logo.png';
const SOUND_URL = '/boot.mp3';

// How long the logo stays on screen before the home view shows.
// Tweak here if the customer asks for a different duration.
const SPLASH_DURATION_MS = 5000;
const FADE_DURATION_MS   = 700;

export default function BootSplash({ onComplete }) {
  const [fading, setFading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Try to play the boot sound. Browsers block autoplay until the page has
    // had a user gesture; if blocked, we silently fall back to a silent splash.
    const audio = new Audio(SOUND_URL);
    // HTML5 audio.volume is 0.0–1.0 (1.0 = MAX). getVolume() returns 0–100,
    // so dividing by 100 maps to the API's 0–1 range. With the default 100,
    // this evaluates to 1.0 = full volume.
    audio.volume = getVolume() / 100;
    audio.play().catch(() => { /* autoplay blocked — silent splash */ });
    audioRef.current = audio;

    const fadeTimer     = setTimeout(() => setFading(true), SPLASH_DURATION_MS - FADE_DURATION_MS);
    const completeTimer = setTimeout(() => onComplete(),     SPLASH_DURATION_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      try { audio.pause(); } catch (_) { /* noop */ }
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center transition-opacity"
      style={{
        backgroundColor: '#515454',
        opacity: fading ? 0 : 1,
        transitionDuration: `${FADE_DURATION_MS}ms`,
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
