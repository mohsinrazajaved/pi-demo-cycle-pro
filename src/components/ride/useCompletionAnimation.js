import { useEffect, useRef, useState } from 'react';

const EQ_PHASE_MS = 3000;
const DROP_PHASE_MS = 3000;
const DROP_RAMP_FRACTION = 0.4;

/**
 * @typedef {{ freq: number, phase: number, min: number, max: number, dropDelay: number }} BarParam
 */

/** @param {number} count @returns {BarParam[]} */
function buildBarParams(count) {
  return Array.from({ length: count }, () => ({
    freq: 0.6 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
    min: 15 + Math.random() * 25,
    max: 50 + Math.random() * 45,
    dropDelay: Math.random() * DROP_PHASE_MS * 0.8,
  }));
}

/** @param {BarParam} p @param {number} secondsElapsed @returns {number} */
function dancingHeight({ freq, phase, min, max }, secondsElapsed) {
  const wave = Math.sin(secondsElapsed * freq * Math.PI * 2 + phase);
  return min + (max - min) * (wave * 0.5 + 0.5);
}

/** @param {number} barCount @param {boolean} isComplete */
export function useCompletionAnimation(barCount, isComplete) {
  const [heights, setHeights] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  const paramsRef = useRef([]);
  const rafRef = useRef(null);
  const startMsRef = useRef(null);

  useEffect(() => { paramsRef.current = buildBarParams(barCount); }, [barCount]);

  useEffect(() => {
    if (!isComplete) {
      setHeights(null);
      setBannerVisible(false);
      startMsRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return undefined;
    }

    const params = paramsRef.current;
    setHeights(params.map(({ min, max }) => min + (max - min) * 0.5));
    setBannerVisible(true);
    startMsRef.current = null;

    /** @param {number} now */
    const tick = (now) => {
      if (startMsRef.current == null) startMsRef.current = now;
      const elapsedMs = now - startMsRef.current;
      const elapsedSec = elapsedMs / 1000;

      if (elapsedMs < EQ_PHASE_MS) {
        setHeights(params.map((p) => dancingHeight(p, elapsedSec)));
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (elapsedMs < EQ_PHASE_MS + DROP_PHASE_MS) {
        setBannerVisible(false);
        const sinceDrop = elapsedMs - EQ_PHASE_MS;
        setHeights(params.map((p) => {
          if (sinceDrop < p.dropDelay) return dancingHeight(p, elapsedSec);
          const peak = (p.min + p.max) * 0.5;
          const fall = Math.min(1, (sinceDrop - p.dropDelay) / (DROP_PHASE_MS * DROP_RAMP_FRACTION));
          return peak * (1 - fall);
        }));
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      setHeights(Array.from({ length: barCount }, () => 0));
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isComplete, barCount]);

  return { heights, bannerVisible, eqPhaseMs: EQ_PHASE_MS };
}
