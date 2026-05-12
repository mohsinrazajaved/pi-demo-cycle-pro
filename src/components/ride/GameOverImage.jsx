const GAME_OVER_SRC = '/gameover.png';

const FLICKER_KEYFRAMES = `
  @keyframes gameOverFlicker {
    0%   { opacity: 1; transform: translateX(-50%) scale(0.8); filter: brightness(3); }
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
`;

/** @type {import('react').CSSProperties} */
const baseImageStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  height: '100%',
  objectFit: 'fill',
  pointerEvents: 'none',
};

/** @param {{ leftPercent: number, widthPercent: number }} props */
export function ScrollingGameOver({ leftPercent, widthPercent }) {
  return (
    <img
      src={GAME_OVER_SRC}
      alt="GAME OVER"
      style={{ ...baseImageStyle, left: `${leftPercent}%`, width: `${widthPercent}%` }}
    />
  );
}

/** @param {{ widthPercent: number }} props */
export function FlickeringGameOver({ widthPercent }) {
  return (
    <>
      <style>{FLICKER_KEYFRAMES}</style>
      <img
        src={GAME_OVER_SRC}
        alt="GAME OVER"
        style={{
          ...baseImageStyle,
          left: '50%',
          width: `${widthPercent}%`,
          transform: 'translateX(-50%)',
          animation: 'gameOverFlicker 1.8s ease-out forwards',
        }}
      />
    </>
  );
}
