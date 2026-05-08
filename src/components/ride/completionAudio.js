let primedAudio = null;

export function primeAudio() {
  if (!primedAudio) {
    primedAudio = new Audio();
    primedAudio.volume = 1;
  }
  primedAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  primedAudio.play().catch(() => {});
}

const CHIPTUNE = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319, 1568];
const NOTE_INTERVAL = 0.16;
const NOTE_DURATION = 0.14;
const NOISE_BURST_COUNT = 14;
const NOISE_SPREAD = 0.85;

/** @param {AudioContext} ctx @param {number} seconds */
function makeNoiseBuffer(ctx, seconds) {
  const samples = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < samples; i += 1) channel[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

/** @param {AudioContext} ctx @param {GainNode} master @param {number} at */
function scheduleNoiseBurst(ctx, master, at) {
  const burstSec = 0.18 + Math.random() * 0.12;
  const noise = makeNoiseBuffer(ctx, burstSec);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 700 + Math.random() * 800;
  filter.Q.value = 1.2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.5, at + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, at + burstSec);
  noise.connect(filter); filter.connect(gain); gain.connect(master);
  noise.start(at); noise.stop(at + burstSec);
}

/** @param {AudioContext} ctx @param {GainNode} master @param {number} startTime @param {number} hardEnd */
function scheduleArpeggio(ctx, master, startTime, hardEnd) {
  CHIPTUNE.forEach((freq, idx) => {
    const at = startTime + idx * NOTE_INTERVAL;
    if (at >= hardEnd) return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + NOTE_DURATION);
    osc.connect(gain); gain.connect(master);
    osc.start(at); osc.stop(at + NOTE_DURATION);
  });
}

/** @param {{ durationMs: number, volumePct?: number }} options */
export function playFinishCheer({ durationMs, volumePct = 100 }) {
  try {
    const AudioCtor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    const ctx = /** @type {AudioContext} */ (new AudioCtor());
    const start = ctx.currentTime;
    const durationSec = durationMs / 1000;
    const end = start + durationSec;

    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, volumePct / 100));
    master.connect(ctx.destination);

    for (let i = 0; i < NOISE_BURST_COUNT; i += 1) {
      scheduleNoiseBurst(ctx, master, start + (i / NOISE_BURST_COUNT) * (durationSec * NOISE_SPREAD));
    }
    scheduleArpeggio(ctx, master, start, end);

    setTimeout(() => ctx.close(), durationMs + 500);
  } catch (_) {
    // graceful no-op when AudioContext is unavailable
  }
}
