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
    // Set volume on the DOM-attached <audio> element. autoPlay attribute
    // handles the play() call — more reliable than `new Audio()` since the
    // element is mounted in the document and respects standard playback rules.
    if (audioRef.current) {
      // HTML5 audio.volume is 0.0–1.0 (1.0 = MAX). getVolume() returns 0–100.
      audioRef.current.volume = getVolume() / 100;
      // Manually call play() too, so we surface any autoplay-block error in
      // the console for debugging.
      audioRef.current.play().catch((err) => {
        console.warn('[BootSplash] autoplay blocked:', err.message);
      });
    }

    const fadeTimer     = setTimeout(() => setFading(true), SPLASH_DURATION_MS - FADE_DURATION_MS);
    const completeTimer = setTimeout(() => onComplete(),     SPLASH_DURATION_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (_) { /* noop */ }
      }
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
      {/* DOM-attached audio with autoPlay — most reliable cross-browser path */}
      <audio
        ref={audioRef}
        src={SOUND_URL}
        autoPlay
        preload="auto"
        onError={(e) => console.warn('[BootSplash] audio error', e?.target?.error)}
        onPlay={() => console.log('[BootSplash] audio playing')}
      />
      <img
        src={LOGO_URL}
        alt="GamerCycle Logo"
        className="w-full max-w-4xl object-contain"
      />
    </div>
  );
}
