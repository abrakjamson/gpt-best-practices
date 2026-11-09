// Original sound design synthesized locally (no samples or licensed audio).
const fs = require('fs');

function makeSoundtrack(file, duration, { CUES, UI_START, UI_END }) {
  const rate = 48000, n = Math.ceil(duration * rate);
  const L = new Float32Array(n), R = new Float32Array(n);
  const padL = new Float32Array(n), padR = new Float32Array(n);
  const tau = 2 * Math.PI;
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  let seed = 20261028;
  const rnd = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gains = pan => [Math.cos((pan + 1) * Math.PI / 4), Math.sin((pan + 1) * Math.PI / 4)];
  const lpA = fc => 1 - Math.exp(-tau * fc / rate);

  const BPM = 96, beat = 60 / BPM, bar = 4 * beat;
  const chords = [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 55, 59, 62, 67], [45, 52, 57, 61, 64]];
  const roots = [38, 35, 31, 33];
  const chordLen = 2 * bar;
  const grooveStart = Math.ceil(UI_START / beat) * beat;

  // Detuned-saw pads through a slowly breathing low-pass filter.
  function pad(start, len, notes, level, cutoff = 1100) {
    notes.forEach((m, ni) => {
      const pan = (ni / (notes.length - 1) - 0.5) * 0.8, [gl, gr] = gains(pan);
      for (const det of [-0.07, 0.07]) {
        const f = hz(m + det);
        let ph = rnd(), y1 = 0, y2 = 0;
        const s0 = Math.max(0, Math.round(start * rate)), s1 = Math.min(n, Math.round((start + len) * rate));
        for (let i = s0; i < s1; i++) {
          const t = (i - s0) / rate;
          ph += f / rate; if (ph >= 1) ph -= 1;
          const x = 2 * ph - 1;
          const a = lpA(cutoff * (0.75 + 0.25 * Math.sin(tau * 0.08 * (i / rate) + ni)));
          y1 += a * (x - y1); y2 += a * (y1 - y2);
          const env = Math.min(1, t / 1.4) * Math.min(1, (len - t) / 1.8);
          const v = y2 * env * level;
          padL[i] += v * gl; padR[i] += v * gr;
        }
      }
    });
  }
  function kick(t0, level = 0.55) {
    const s0 = Math.round(t0 * rate);
    let ph = 0;
    for (let i = 0; i < 0.45 * rate && s0 + i < n; i++) {
      const t = i / rate, f = 46 + 70 * Math.exp(-t * 28);
      ph += f / rate;
      const v = Math.sin(tau * ph) * Math.exp(-t * 7.5) * level;
      L[s0 + i] += v; R[s0 + i] += v;
    }
  }
  function hat(t0, level, pan) {
    const s0 = Math.round(t0 * rate), [gl, gr] = gains(pan);
    let prev = 0;
    for (let i = 0; i < 0.09 * rate && s0 + i < n; i++) {
      const x = rnd() * 2 - 1, hp = x - prev; prev = x;
      const v = hp * Math.exp(-(i / rate) * 55) * level;
      L[s0 + i] += v * gl; R[s0 + i] += v * gr;
    }
  }
  function pluck(t0, m, level, pan, decay = 3.2) {
    const s0 = Math.round(t0 * rate), f = hz(m), [gl, gr] = gains(pan);
    for (let i = 0; i < 1.4 * rate && s0 + i < n; i++) {
      const t = i / rate;
      const w = Math.sin(tau * f * t) + 0.32 * Math.sin(tau * 2 * f * t) * Math.exp(-t * 6) + 0.12 * Math.sin(tau * 3 * f * t) * Math.exp(-t * 9);
      const v = w * Math.min(1, t / 0.004) * Math.exp(-t * decay) * level;
      L[s0 + i] += v * gl; R[s0 + i] += v * gr;
    }
  }
  function bass(t0, m, len, level) {
    const s0 = Math.round(t0 * rate), f = hz(m);
    let ph = 0, y = 0;
    for (let i = 0; i < len * rate && s0 + i < n; i++) {
      const t = i / rate;
      ph += f / rate; if (ph >= 1) ph -= 1;
      const x = Math.sin(tau * ph) + 0.35 * (2 * ph - 1);
      y += lpA(260) * (x - y);
      const v = y * Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * Math.min(1, (len - t) / 0.05) * level;
      L[s0 + i] += v; R[s0 + i] += v;
    }
  }
  function bell(t0, m, level, pan) {
    const s0 = Math.round(t0 * rate), f = hz(m), [gl, gr] = gains(pan);
    const parts = [[1, 1, 1.6], [2.76, 0.42, 3.2], [5.4, 0.22, 5.5], [8.93, 0.1, 8]];
    for (let i = 0; i < 2.6 * rate && s0 + i < n; i++) {
      const t = i / rate;
      let w = 0;
      for (const [r, a, d] of parts) w += a * Math.sin(tau * f * r * t) * Math.exp(-t * d);
      const v = w * Math.min(1, t / 0.003) * level;
      L[s0 + i] += v * gl; R[s0 + i] += v * gr;
    }
  }
  // Two restrained sweeps bookend the UI footage.
  function sweep(t0, len, f0, f1, level, pan0, pan1, peakAt = 0.65) {
    const s0 = Math.max(0, Math.round(t0 * rate)), s1 = Math.min(n, Math.round((t0 + len) * rate));
    let low = 0, band = 0;
    for (let i = s0; i < s1; i++) {
      const u = (i - s0) / (s1 - s0);
      const f = f0 * (f1 / f0) ** u, q = 0.35;
      const F = 2 * Math.sin(Math.PI * f / rate);
      const x = rnd() * 2 - 1;
      low += F * band; const high = x - low - q * band; band += F * high;
      const env = u < peakAt ? (u / peakAt) ** 2 : ((1 - u) / (1 - peakAt)) ** 1.5;
      const [gl, gr] = gains(lerp(pan0, pan1, u));
      const v = band * env * level;
      L[i] += v * gl; R[i] += v * gr;
    }
  }
  function tick(t0, level, pan) {
    const s0 = Math.round(t0 * rate), [gl, gr] = gains(pan);
    let prev = 0;
    const f = 2400 + rnd() * 1400;
    for (let i = 0; i < 0.03 * rate && s0 + i < n; i++) {
      const t = i / rate, x = rnd() * 2 - 1, hp = x - prev; prev = x;
      const v = (0.6 * hp + 0.4 * Math.sin(tau * f * t)) * Math.exp(-t * 260) * level;
      L[s0 + i] += v * gl; R[s0 + i] += v * gr;
    }
  }
  const lerp = (a, b, t) => a + (b - a) * t;

  // Harmonic bed.
  for (let c = 0, t = 0; t < duration; c++, t += chordLen) {
    const ch = chords[c % 4];
    const last = t + chordLen >= UI_END - 0.2;
    pad(t, (last ? duration - t : chordLen + 1.6), ch, 0.03, t < grooveStart ? 700 + 120 * t : 1250);
    if (last) break;
  }
  // Groove from the first beat after the UI lands until the final hit.
  for (let t = grooveStart; t < UI_END - 0.05; t += beat) {
    const b = Math.round((t - grooveStart) / beat);
    const ci = Math.floor(t / chordLen) % 4, ch = chords[ci];
    if (b % 2 === 0) kick(t, b % 4 === 0 ? 0.5 : 0.36);
    hat(t + beat / 2, 0.06, b % 2 ? 0.3 : -0.3);
    if (b % 4 === 0) bass(t, roots[ci], beat * 1.4, 0.2);
    if (b % 4 === 1) bass(t + beat / 2, roots[ci], beat * 0.9, 0.13);
    for (let k = 0; k < 2; k++) {
      const note = ch[(b * 2 + k) % ch.length] + 12;
      pluck(t + k * beat / 2, note, 0.028 + 0.008 * (k === 0), ((b * 2 + k) % 4 - 1.5) * 0.3, 4.2);
    }
  }
  // Duck the pads under the kick for a gentle pump.
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    let duck = 1;
    if (t >= grooveStart && t < UI_END) {
      const since = (t - grooveStart) % (2 * beat);
      duck = 1 - 0.32 * Math.exp(-since / 0.16);
    }
    L[i] += padL[i] * duck; R[i] += padR[i] * duck;
  }
  // Edit-synced effects.
  for (const cue of CUES) {
    if (cue.type === 'whoosh') sweep(cue.t - 0.25, 0.95, 300, 5200, 0.16, -0.6, 0.6, 0.6);
    else if (cue.type === 'typing') {
      for (let t = cue.t + 0.05; t < cue.end; t += 0.05 + rnd() * 0.07) tick(t, 0.11 + rnd() * 0.05, (rnd() - 0.5) * 0.5);
    } else if (cue.type === 'chime') {
      [81, 86, 90].forEach((m, k) => bell(cue.t + k * 0.085, m, 0.07, (k - 1) * 0.35));
      bell(cue.t + 0.26, 93, 0.035, 0.15);
    } else if (cue.type === 'final') {
      kick(cue.t, 0.6);
      bass(cue.t, 38, 3.5, 0.24);
      pad(cue.t, duration - cue.t, [50, 57, 62, 66, 69, 74], 0.024, 1600);
      [74, 78, 81, 86, 90].forEach((m, k) => pluck(cue.t + 0.1 + k * 0.11, m, 0.05, (k - 2) * 0.25, 1.6));
      [86, 90, 93].forEach((m, k) => bell(cue.t + 0.65 + k * 0.1, m, 0.045, (k - 1) * 0.3));
    }
  }
  // Master: fades, peak normalize, soft clip.
  let peak = 0;
  const fadeAt = t => Math.min(1, t / 0.8, (duration - t) / 1.8);
  for (let i = 0; i < n; i++) {
    const f = fadeAt(i / rate);
    peak = Math.max(peak, Math.abs(L[i] * f), Math.abs(R[i] * f));
  }
  const gain = 0.8 / peak;
  const sat = x => Math.tanh(1.2 * x) / Math.tanh(1.2);
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const f = fadeAt(i / rate) * gain;
    data.writeInt16LE(Math.round(sat(L[i] * f) * 32767), i * 4);
    data.writeInt16LE(Math.round(sat(R[i] * f) * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 4, 28);
  header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
}
module.exports = { makeSoundtrack };
