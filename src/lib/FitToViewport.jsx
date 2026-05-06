import { useEffect, useState } from 'react';

const DESIGN_W = 1024;
const DESIGN_H = 600;
// Safety margin to absorb HDMI overscan / display-bezel crop on the Pi.
// 0.96 = ~2% inset on every side (≈ 20px top+bottom, 41px left+right at 600vh).
// Prevents cropping even when `window.innerHeight` lies about the visible area.
const SAFETY = 0.96;

/**
 * Locks the app to a 1024×600 design canvas and scales it to fit whatever
 * viewport the kiosk browser reports. Solves Pi overscan / bezel crop — the
 * layout can never overflow regardless of the real display dimensions.
 *
 * Because `transform: scale()` establishes a containing block, any `fixed`
 * modals inside still stay within the design canvas.
 */
export default function FitToViewport({ children }) {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    // Some kiosks (Chromium with no --window-size) report an `innerWidth` /
    // `innerHeight` larger than the actual display. Clamp to `screen.*` so we
    // never scale to a viewport that includes off-screen pixels.
    const compute = () => setDims({
      w: Math.min(window.innerWidth, window.screen.width),
      h: Math.min(window.innerHeight, window.screen.height),
    });
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const scale = Math.min(dims.w / DESIGN_W, dims.h / DESIGN_H) * SAFETY;
  const scaledW = DESIGN_W * scale;
  const scaledH = DESIGN_H * scale;
  const offsetX = (dims.w - scaledW) / 2;
  const offsetY = (dims.h - scaledH) / 2;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
