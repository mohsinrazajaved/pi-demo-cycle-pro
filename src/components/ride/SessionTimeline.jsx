import { useRef, useEffect, useState } from 'react';

const MAX_RESISTANCE = 30;
const ACTIVE_SLOT = 10;
const IMAGE_SLOTS = 4;
const TOTAL_SLOTS = 21;
const EQ_PHASE = 3000;    // ms of equalizer animation
const DROP_PHASE = 3000;  // ms for bars to drop to zero

// Each bar gets its own random frequency, phase, amplitude, and drop delay
const EQ_PARAMS = Array(TOTAL_SLOTS).fill(null).map(() => ({
  freq: 0.6 + Math.random() * 1.5,
  phase: Math.random() * Math.PI * 2,
  min: 15 + Math.random() * 25,
  max: 50 + Math.random() * 45,
  dropDelay: Math.random() * DROP_PHASE * 0.8,
}));

// "WORKOUT COMPLETE" banner — styled text instead of an external image
function GameOverBanner({ style }) {
  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        fontFamily: 'monospace',
        fontWeight: 900,
        fontSize: '3.5vh',
        color: '#FF3F03',
        textShadow: '0 0 20px rgba(255,63,3,0.8), 0 0 40px rgba(255,63,3,0.4)',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        lineHeight: 1,
      }}>
        WORKOUT<br/>COMPLETE
      </div>
    </div>
  );
}

// --- Audio via unlocked HTML Audio element ---
// We keep a silent audio element that gets "unlocked" on first user gesture,
// then swap its src to play the cheer sound.
let unlockedAudio = null;

export function primeAudio() {
  if (!unlockedAudio) {
    unlockedAudio = new Audio();
    unlockedAudio.volume = 1;
  }
  // Play silence to unlock — browsers allow this during a user gesture
  unlockedAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  unlockedAudio.play().catch(() => {});
}

function playRetroCheer(volumePct = 100) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const durationMs = EQ_PHASE;
    const end = ctx.currentTime + durationMs / 1000;
    const vol = volumePct / 100;

    // Master gain node to control overall volume
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    // Noise bursts
    const burstCount = 14;
    for (let i = 0; i < burstCount; i++) {
      const t = ctx.currentTime + (i / burstCount) * (durationMs / 1000) * 0.85;
      const burstDur = 0.18 + Math.random() * 0.12;
      const bufferSize = Math.floor(ctx.sampleRate * burstDur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 700 + Math.random() * 800;
      filter.Q.value = 1.2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + burstDur);
      noise.connect(filter); filter.connect(gain); gain.connect(master);
      noise.start(t); noise.stop(t + burstDur);
    }

    // Chiptune arpeggio
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.16;
      if (t >= end) return;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain); gain.connect(master);
      osc.start(t); osc.stop(t + 0.14);
    });

    setTimeout(() => ctx.close(), durationMs + 500);
  } catch(e) {
    // no audio
  }
}

export default function SessionTimeline({ programData, currentPosition, resistance, isComplete, programLabel, volume = 100 }) {
  const totalBars = programData.length;
  const [eqHeights, setEqHeights] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!isComplete) {
      setEqHeights(null);
      setShowGameOver(false);
      startTimeRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    // Immediately set non-zero heights so bars are visible before animation loop
    setEqHeights(EQ_PARAMS.map(({ min, max }) => min + (max - min) * 0.5));
    setShowGameOver(true);
    playRetroCheer(volume);
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const elapsedSec = elapsed / 1000;

      if (elapsed < EQ_PHASE) {
        // Phase 1: equalizer dancing
        const heights = EQ_PARAMS.map(({ freq, phase, min, max }) => {
          const t = Math.sin(elapsedSec * freq * Math.PI * 2 + phase);
          return min + (max - min) * (t * 0.5 + 0.5);
        });
        setEqHeights([...heights]);
        animFrameRef.current = requestAnimationFrame(animate);
      } else if (elapsed < EQ_PHASE + DROP_PHASE) {
        const dropElapsed = elapsed - EQ_PHASE;

        // Hide game over image at start of phase 2
        setShowGameOver(false);

        const heights = EQ_PARAMS.map(({ freq, phase, min, max, dropDelay }) => {
          if (dropElapsed < dropDelay) {
            // still dancing
            const t = Math.sin(elapsedSec * freq * Math.PI * 2 + phase);
            return min + (max - min) * (t * 0.5 + 0.5);
          }
          // dropping to zero
          const dropProgress = Math.min(1, (dropElapsed - dropDelay) / (DROP_PHASE * 0.4));
          const peakAtDrop = (min + max) * 0.5;
          return peakAtDrop * (1 - dropProgress);
        });

        setEqHeights([...heights]);
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setEqHeights(Array(TOTAL_SLOTS).fill(0));
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isComplete]);

  // Normal scrolling mode
  const startIdx = currentPosition < ACTIVE_SLOT ? 0 : currentPosition - ACTIVE_SLOT;
  const highlightSlot = currentPosition < ACTIVE_SLOT ? currentPosition : ACTIVE_SLOT;

  // Normal image positioning (scrolls in from right)
  const imageStartVirtual = totalBars;
  const imageStartDisplay = imageStartVirtual - startIdx;
  const imageVisible = !isComplete && imageStartDisplay < TOTAL_SLOTS && imageStartDisplay + IMAGE_SLOTS > 0;

  return (
    <div className="w-full h-full bg-zinc-900/80 rounded-lg border border-zinc-800 p-2 flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Program{programLabel ? ` — ${programLabel}` : ''}</span>
        <span className="text-[10px] text-[#FF3F03]">Level {resistance}/{MAX_RESISTANCE}</span>
      </div>

      <div className="flex-1 flex items-end gap-[1px] relative overflow-hidden">
        {/* Interval bars */}
        {Array(TOTAL_SLOTS).fill(null).map((_, displayIdx) => {
          const dataIdx = isComplete ? displayIdx : startIdx + displayIdx;
          const isActive = !isComplete && displayIdx === highlightSlot;

          let height;
          if (eqHeights) {
            height = eqHeights[displayIdx];
          } else if (dataIdx >= totalBars) {
            height = null;
          } else {
            height = (Math.min(programData[dataIdx], MAX_RESISTANCE) / MAX_RESISTANCE) * 100;
          }

          return (
            <div key={displayIdx} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
              {height > 0 && (
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isActive ? '#FF3F03' : '#444',
                    boxShadow: isActive ? '0 0 8px #FF3F03' : 'none',
                    transition: 'none',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Normal: WORKOUT COMPLETE banner scrolling in from right */}
        {imageVisible && (
          <GameOverBanner
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              height: '100%',
              width: `${(IMAGE_SLOTS / TOTAL_SLOTS) * 100}%`,
              left: `${(imageStartDisplay / TOTAL_SLOTS) * 100}%`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Complete: GAME OVER image centered with flicker then fade off */}
        {isComplete && showGameOver && (
          <>
            <style>{`
              @keyframes gameOverFlicker {
                0%   { opacity: 0; transform: translateX(-50%) scale(0.8); filter: brightness(3); }
                10%  { opacity: 1; transform: translateX(-50%) scale(1.15); filter: brightness(2); }
                20%  { opacity: 0; transform: translateX(-50%) scale(1.05); }
                30%  { opacity: 1; transform: translateX(-50%) scale(1.1); filter: brightness(2.5); }
                40%  { opacity: 0; transform: translateX(-50%) scale(1.05); }
                50%  { opacity: 1; transform: translateX(-50%) scale(1.08); filter: brightness(2); }
                60%  { opacity: 0.3; transform: translateX(-50%) scale(1.03); }
                70%  { opacity: 1; transform: translateX(-50%) scale(1.05); filter: brightness(1.5); }
                85%  { opacity: 0.7; transform: translateX(-50%) scale(1.02); }
                100% { opacity: 1; transform: translateX(-50%) scale(1); filter: brightness(1); }
              }
            `}</style>
            <GameOverBanner
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                height: '100%',
                width: `${(IMAGE_SLOTS / TOTAL_SLOTS) * 100}%`,
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                animation: 'gameOverFlicker 1.8s ease-out forwards',
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}