import { useEffect, useRef } from 'react';
import { primeAudio, playFinishCheer } from './completionAudio';
import { useCompletionAnimation } from './useCompletionAnimation';
import { ScrollingGameOver, FlickeringGameOver } from './GameOverImage';

export { primeAudio };

const MAX_LEVEL = 30;
const ACTIVE_BAR_INDEX = 10;
const VISIBLE_BAR_COUNT = 21;
const BANNER_BAR_SPAN = 4;
const BANNER_WIDTH_PCT = (BANNER_BAR_SPAN / VISIBLE_BAR_COUNT) * 100;

/**
 * @param {number} currentPosition
 * @param {number} totalBars
 */
function deriveScrollWindow(currentPosition, totalBars) {
  const startIdx = currentPosition < ACTIVE_BAR_INDEX ? 0 : currentPosition - ACTIVE_BAR_INDEX;
  const highlightSlot = currentPosition < ACTIVE_BAR_INDEX ? currentPosition : ACTIVE_BAR_INDEX;
  const bannerStart = totalBars - startIdx;
  const bannerVisible = bannerStart < VISIBLE_BAR_COUNT && bannerStart + BANNER_BAR_SPAN > 0;
  return { startIdx, highlightSlot, bannerStart, bannerVisible };
}

/**
 * @param {{
 *   animatedHeights: number[] | null,
 *   animatedIdx: number,
 *   dataIdx: number,
 *   programData: number[],
 *   totalBars: number,
 * }} args
 * @returns {number | null}
 */
function pickBarHeight({ animatedHeights, animatedIdx, dataIdx, programData, totalBars }) {
  if (animatedHeights) return animatedHeights[animatedIdx];
  if (dataIdx >= totalBars) return null;
  const level = Math.min(programData[dataIdx], MAX_LEVEL);
  return (level / MAX_LEVEL) * 100;
}

/**
 * @param {{
 *   programData: number[],
 *   currentPosition: number,
 *   resistance: number,
 *   isComplete: boolean,
 *   programLabel?: string,
 *   volume?: number,
 * }} props
 */
export default function SessionTimeline({ programData, currentPosition, resistance, isComplete, programLabel, volume = 100 }) {
  const totalBars = programData.length;
  const { heights, bannerVisible: flickerVisible, eqPhaseMs } = useCompletionAnimation(VISIBLE_BAR_COUNT, isComplete);

  const cheerFiredRef = useRef(false);
  useEffect(() => {
    if (!isComplete) { cheerFiredRef.current = false; return; }
    if (cheerFiredRef.current) return;
    cheerFiredRef.current = true;
    playFinishCheer({ durationMs: eqPhaseMs, volumePct: volume });
  }, [isComplete, eqPhaseMs, volume]);

  const { startIdx, highlightSlot, bannerStart, bannerVisible: scrollingVisible } = deriveScrollWindow(currentPosition, totalBars);
  const showScrollingBanner = !isComplete && scrollingVisible;
  const showFlickerBanner = isComplete && flickerVisible;

  return (
    <div className="w-full h-full rounded-md p-2 flex flex-col" style={{ background: '#000' }}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
          Program{programLabel ? ` — ${programLabel}` : ''}
        </span>
        <span className="text-[11px] text-[#FF3F03] font-bold">Level {resistance}/{MAX_LEVEL}</span>
      </div>

      <div className="flex-1 flex items-end gap-[1px] relative overflow-hidden">
        {Array.from({ length: VISIBLE_BAR_COUNT }, (_, displayIdx) => {
          const dataIdx = isComplete ? displayIdx : startIdx + displayIdx;
          const isActive = !isComplete && displayIdx === highlightSlot;
          const height = pickBarHeight({
            animatedHeights: heights,
            animatedIdx: displayIdx,
            dataIdx,
            programData,
            totalBars,
          });

          return (
            <div key={displayIdx} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
              {height > 0 && (
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isActive ? '#FF3F03' : '#3f3f3f',
                    transition: 'none',
                  }}
                />
              )}
            </div>
          );
        })}

        {showScrollingBanner && (
          <ScrollingGameOver
            leftPercent={(bannerStart / VISIBLE_BAR_COUNT) * 100}
            widthPercent={BANNER_WIDTH_PCT}
          />
        )}

        {showFlickerBanner && (
          <FlickeringGameOver widthPercent={BANNER_WIDTH_PCT} />
        )}
      </div>
    </div>
  );
}
