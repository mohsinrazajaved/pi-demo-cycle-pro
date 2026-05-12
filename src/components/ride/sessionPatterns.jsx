// Helper to generate interval patterns (repeating low/high cycles)
function makeInterval(totalBars, low, high, cycleLen = 6) {
  // cycle: 3 low, 3 high (or custom)
  const halfCycle = cycleLen / 2;
  const result = [];
  for (let i = 0; i < totalBars; i++) {
    result.push(i % cycleLen < halfCycle ? low : high);
  }
  // ensure last few bars are low (cool-down feel)
  for (let i = Math.max(0, totalBars - Math.round(totalBars * 0.05)); i < totalBars; i++) {
    result[i] = low;
  }
  return result;
}

// Helper to generate step/pyramid patterns (low, mid, high, mid cycle)
function makeStep(totalBars, low, mid, high) {
  const unit = [low, low, low, mid, mid, high, high, high, mid, mid]; // 10-bar unit
  const result = [];
  for (let i = 0; i < totalBars; i++) {
    result.push(unit[i % unit.length]);
  }
  return result;
}

// Helper to generate plateau patterns (warmup ramp, plateau, cooldown ramp)
function makePlateau(totalBars, low, mid, high) {
  const hasMid = mid !== null;
  // proportions: 10% warmup, 10% ramp up, 60% plateau, 10% ramp down, 10% cooldown
  const warmup = Math.round(totalBars * 0.10);
  const ramp = Math.round(totalBars * 0.10);
  const plateau = totalBars - warmup * 2 - ramp * 2;
  const result = [];
  for (let i = 0; i < warmup; i++) result.push(low);
  for (let i = 0; i < ramp; i++) result.push(hasMid ? mid : Math.round(low + (high - low) * (i + 1) / ramp));
  for (let i = 0; i < plateau; i++) result.push(high);
  for (let i = ramp - 1; i >= 0; i--) result.push(hasMid ? mid : Math.round(low + (high - low) * (i + 1) / ramp));
  for (let i = 0; i < warmup; i++) result.push(low);
  return result;
}

// Generate pattern arrays for each minute value
function si(min) { return makeInterval(min * 2, 2, 6); }   // small-interval: 2 bars/min
function li(min) { return makeInterval(min * 2, 2, 9); }   // large-interval
function ss(min) { return makeStep(min * 2, 2, 4, 6); }    // small-step
function bs(min) { return makeStep(min * 2, 2, 6, 10); }   // big-step
function sp(min) { return makePlateau(min * 2, 2, 4, 6); } // small-plateau
function lp(min) { return makePlateau(min * 2, 2, 6, 10); }// large-plateau

export const PROGRAM_PATTERNS = {
  // ── Small Interval ──────────────────────────────────────────────────────────
  'small-interval-10': [2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2],
  'small-interval-20': [2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 2],
  'small-interval-30': [2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 6, 6, 2, 2, 2],
  'small-interval-40': [2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 2, 2, 2],
  'small-interval-50': [2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 6, 6, 6, 2, 2, 2, 2],
  'small-interval-60': si(60),
  'small-interval-70': si(70),
  'small-interval-80': si(80),
  'small-interval-90': si(90),
  'small-interval-100': si(100),
  'small-interval-110': si(110),
  'small-interval-120': si(120),
  'small-interval-130': si(130),
  'small-interval-140': si(140),

  // ── Large Interval ──────────────────────────────────────────────────────────
  'large-interval-10': [2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2],
  'large-interval-20': [2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 2],
  'large-interval-30': [2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 9, 9, 2, 2, 2],
  'large-interval-40': [2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 2, 2, 2],
  'large-interval-50': [2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 9, 9, 9, 2, 2, 2, 2],
  'large-interval-60': li(60),
  'large-interval-70': li(70),
  'large-interval-80': li(80),
  'large-interval-90': li(90),
  'large-interval-100': li(100),
  'large-interval-110': li(110),
  'large-interval-120': li(120),
  'large-interval-130': li(130),
  'large-interval-140': li(140),

  // ── Small Step (Pyramids) ───────────────────────────────────────────────────
  'small-step-10': [2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4],
  'small-step-20': [2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4],
  'small-step-30': [2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4],
  'small-step-40': [2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4],
  'small-step-50': [2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4, 2, 2, 2, 4, 4, 6, 6, 6, 4, 4],
  'small-step-60': ss(60),
  'small-step-70': ss(70),
  'small-step-80': ss(80),
  'small-step-90': ss(90),
  'small-step-100': ss(100),
  'small-step-110': ss(110),
  'small-step-120': ss(120),
  'small-step-130': ss(130),
  'small-step-140': ss(140),

  // ── Big Step (Large Pyramids) ───────────────────────────────────────────────
  'big-step-10': [2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6],
  'big-step-20': [2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6],
  'big-step-30': [2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6],
  'big-step-40': [2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6],
  'big-step-50': [2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6, 2, 2, 2, 6, 6, 10, 10, 10, 6, 6],
  'big-step-60': bs(60),
  'big-step-70': bs(70),
  'big-step-80': bs(80),
  'big-step-90': bs(90),
  'big-step-100': bs(100),
  'big-step-110': bs(110),
  'big-step-120': bs(120),
  'big-step-130': bs(130),
  'big-step-140': bs(140),

  // ── Small Plateau ──────────────────────────────────────────────────────────
  'small-plateau-1':  [2, 2, 2, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 2, 2, 2],
  'small-plateau':    [2, 2, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 2, 2],
  'small-plateau-10': [2, 2, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 2, 2],
  'small-plateau-20': [2, 2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 2, 2, 2, 2],
  'small-plateau-30': [2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2],
  'small-plateau-40': [2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2],
  'small-plateau-50': [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  'small-plateau-60': sp(60),
  'small-plateau-70': sp(70),
  'small-plateau-80': sp(80),
  'small-plateau-90': sp(90),
  'small-plateau-100': sp(100),
  'small-plateau-110': sp(110),
  'small-plateau-120': sp(120),
  'small-plateau-130': sp(130),
  'small-plateau-140': sp(140),

  // ── Large Plateau ──────────────────────────────────────────────────────────
  'large-plateau-10': [2, 2, 6, 6, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 6, 6, 2, 2],
  'large-plateau-20': [2, 2, 2, 2, 6, 6, 6, 6, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 6, 6, 6, 6, 2, 2, 2, 2],
  'large-plateau-30': [2, 2, 2, 2, 2, 2, 6, 6, 6, 6, 6, 6, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 6, 6, 6, 6, 6, 6, 2, 2, 2, 2, 2, 2],
  'large-plateau-40': [2, 2, 2, 2, 2, 2, 2, 2, 6, 6, 6, 6, 6, 6, 6, 6, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 6, 6, 6, 6, 6, 6, 6, 6, 2, 2, 2, 2, 2, 2, 2, 2],
  'large-plateau-50': [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  'large-plateau-60': lp(60),
  'large-plateau-70': lp(70),
  'large-plateau-80': lp(80),
  'large-plateau-90': lp(90),
  'large-plateau-100': lp(100),
  'large-plateau-110': lp(110),
  'large-plateau-120': lp(120),
  'large-plateau-130': lp(130),
  'large-plateau-140': lp(140),
};

export const PATTERN_BASE = {
  'small-plateau': 2, 'small-plateau-1': 2, 'small-plateau-10': 2, 'small-plateau-20': 2, 'small-plateau-30': 2, 'small-plateau-40': 2, 'small-plateau-50': 2,
  'small-plateau-60': 2, 'small-plateau-70': 2, 'small-plateau-80': 2, 'small-plateau-90': 2, 'small-plateau-100': 2,
  'small-plateau-110': 2, 'small-plateau-120': 2, 'small-plateau-130': 2, 'small-plateau-140': 2,
  'small-interval-10': 2, 'small-interval-20': 2, 'small-interval-30': 2, 'small-interval-40': 2, 'small-interval-50': 2,
  'small-interval-60': 2, 'small-interval-70': 2, 'small-interval-80': 2, 'small-interval-90': 2, 'small-interval-100': 2,
  'small-interval-110': 2, 'small-interval-120': 2, 'small-interval-130': 2, 'small-interval-140': 2,
  'large-interval-10': 2, 'large-interval-20': 2, 'large-interval-30': 2, 'large-interval-40': 2, 'large-interval-50': 2,
  'large-interval-60': 2, 'large-interval-70': 2, 'large-interval-80': 2, 'large-interval-90': 2, 'large-interval-100': 2,
  'large-interval-110': 2, 'large-interval-120': 2, 'large-interval-130': 2, 'large-interval-140': 2,
  'small-step-10': 2, 'small-step-20': 2, 'small-step-30': 2, 'small-step-40': 2, 'small-step-50': 2,
  'small-step-60': 2, 'small-step-70': 2, 'small-step-80': 2, 'small-step-90': 2, 'small-step-100': 2,
  'small-step-110': 2, 'small-step-120': 2, 'small-step-130': 2, 'small-step-140': 2,
  'big-step-10': 3, 'big-step-20': 3, 'big-step-30': 3, 'big-step-40': 3, 'big-step-50': 3,
  'big-step-60': 3, 'big-step-70': 3, 'big-step-80': 3, 'big-step-90': 3, 'big-step-100': 3,
  'big-step-110': 3, 'big-step-120': 3, 'big-step-130': 3, 'big-step-140': 3,
  'large-plateau-10': 2, 'large-plateau-20': 2, 'large-plateau-30': 2, 'large-plateau-40': 2, 'large-plateau-50': 2,
  'large-plateau-60': 2, 'large-plateau-70': 2, 'large-plateau-80': 2, 'large-plateau-90': 2, 'large-plateau-100': 2,
  'large-plateau-110': 2, 'large-plateau-120': 2, 'large-plateau-130': 2, 'large-plateau-140': 2,
};

export function generateSessionPattern(programId, baseResistance = 5) {
  // GC Fat Burn: flat profile; bar count scales with chosen duration (same 2 bars/min as interval presets).
  const fatBurnMins = /^gc-fat-burn-(\d+)$/.exec(programId);
  if (fatBurnMins) {
    const mins = Number(fatBurnMins[1]);
    const bars = mins * 2;
    const level = Math.min(30, Math.max(1, baseResistance));
    return Array(bars).fill(level);
  }
  if (PROGRAM_PATTERNS[programId]) {
    const patternBase = PATTERN_BASE[programId] ?? 1;
    const offset = Math.max(0, baseResistance - patternBase);
    return PROGRAM_PATTERNS[programId].map(v => Math.min(30, v + offset));
  }
  if (programId === 'small-step') {
    const offsets = [0, 1, 2, 3, 2, 1, 2, 3, 2, 1];
    const bars = 21;
    const barsPerInterval = Math.floor(bars / offsets.length);
    const data = [];
    offsets.forEach((offset, i) => {
      const level = Math.min(30, baseResistance + offset);
      const count = i === offsets.length - 1 ? bars - data.length : barsPerInterval;
      for (let b = 0; b < count; b++) data.push(level);
    });
    return data;
  }
  return Array(21).fill(baseResistance);
}