/* Falling Notes: pure logic (no DOM). Exposed as window.FallingCore so it can
   also be tested in Node.
   - song -> events -> chords
   - Standard MIDI File parser
   - expected-note verification DSP (spectrum -> per-note scores)
   - onset-aware Detector, YIN pitch estimate */
(function () {
  const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function nameToMidi(n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    if (!m) return null;
    return 12 * (parseInt(m[3], 10) + 1) + BASE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  }
  function midiToName(m) { return NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }
  function midiToLetter(m) { return NAMES[((m % 12) + 12) % 12]; }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function hzToMidiFloat(f) { return 69 + 12 * Math.log2(f / 440); }

  /* ---------- song -> events ---------- */
  function songToEvents(song) {
    const events = [];
    let total = 0;
    [["R", song.rh], ["L", song.lh]].forEach(([hand, seq]) => {
      if (!seq) return;
      let t = 0;
      seq.forEach(([n, d]) => {
        const midi = nameToMidi(n);
        if (midi != null) events.push({ midi, start: t, dur: d, hand });
        t += d;
      });
      total = Math.max(total, t);
    });
    events.sort((a, b) => a.start - b.start || a.midi - b.midi);
    const bpb = song.beatsPerBar || 4;
    return { events, bpb, bpm: song.bpm || 100, totalBeats: Math.max(1, Math.ceil(total / bpb - 1e-9)) * bpb };
  }

  /* hands: "R" | "L" | "B". Notes that start together become one chord. */
  function groupChords(events, hands, eps) {
    eps = eps == null ? 0.05 : eps;
    const list = events.filter((e) => hands === "B" || e.hand === hands)
      .sort((a, b) => a.start - b.start);
    const chords = [];
    list.forEach((e) => {
      const last = chords[chords.length - 1];
      if (last && e.start - last.start <= eps) { last.notes.push(e); last.midis.push(e.midi); }
      else chords.push({ start: e.start, notes: [e], midis: [e.midi] });
    });
    return chords;
  }

  /* ---------- Standard MIDI File parser ---------- */
  function parseMidi(buf) {
    const bad = (msg) => { const e = new Error(msg); e.friendly = true; return e; };
    const d = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let p = 0;
    const u8 = () => { if (p >= d.length) throw bad("This MIDI file ended too early."); return d[p++]; };
    const u16 = () => (u8() << 8) | u8();
    const u32 = () => ((u8() * 16777216) + (u8() << 16) + (u8() << 8) + u8());
    const tag = () => String.fromCharCode(u8(), u8(), u8(), u8());
    const vlq = () => { let v = 0, b, n = 0; do { b = u8(); v = (v * 128) + (b & 0x7f); if (++n > 5) throw bad("Bad MIDI timing data."); } while (b & 0x80); return v; };

    if (d.length < 14 || tag() !== "MThd") throw bad("That does not look like a MIDI file.");
    const hlen = u32();
    const format = u16(), ntrks = u16(), division = u16();
    p = 8 + hlen;
    if (format > 2) throw bad("This kind of MIDI file is not supported.");
    if (division & 0x8000) throw bad("This MIDI file uses a timing type that is not supported.");
    const ppq = division || 480;

    const tracks = [];       // each: array of {midi, startTick, endTick}
    let tempo = null, tempoTick = Infinity, sig = null;
    for (let t = 0; t < ntrks && p + 8 <= d.length; t++) {
      const id = tag(), len = u32();
      const end = Math.min(d.length, p + len);
      if (id !== "MTrk") { p = end; t--; if (p >= d.length) break; continue; }
      const notes = [], open = new Map();
      let tick = 0, running = 0;
      while (p < end) {
        tick += vlq();
        let st = d[p];
        if (st & 0x80) { p++; if (st < 0xf0) running = st; } else { st = running; if (!st) throw bad("This MIDI file is damaged."); }
        if (st === 0xff) {
          const type = u8(), l = vlq();
          if (type === 0x51 && l === 3) {
            const us = (d[p] << 16) | (d[p + 1] << 8) | d[p + 2];
            if (us > 0 && tick < tempoTick) { tempo = us; tempoTick = tick; }
          } else if (type === 0x58 && l >= 2 && !sig) {
            sig = { num: d[p], den: Math.pow(2, d[p + 1]) };
          } else if (type === 0x2f) { p += l; break; }
          p += l;
        } else if (st === 0xf0 || st === 0xf7) {
          p += vlq();
        } else {
          const hi = st & 0xf0, ch = st & 0x0f;
          const a = u8();
          const b = (hi === 0xc0 || hi === 0xd0) ? 0 : u8();
          if (ch === 9) continue; // drums
          const key = ch * 128 + a;
          if (hi === 0x90 && b > 0) {
            if (!open.has(key)) open.set(key, []);
            open.get(key).push(tick);
          } else if (hi === 0x80 || (hi === 0x90 && b === 0)) {
            const q = open.get(key);
            if (q && q.length) notes.push({ midi: a, startTick: q.shift(), endTick: tick });
          }
        }
      }
      open.forEach((q, key) => q.forEach((s) => notes.push({ midi: key % 128, startTick: s, endTick: Math.max(s + ppq / 4, tick) })));
      p = end;
      if (notes.length) tracks.push(notes);
    }
    if (!tracks.length) throw bad("I could not find any notes in this MIDI file.");

    const events = [];
    const push = (n, hand) => events.push({
      midi: n.midi, start: n.startTick / ppq, dur: Math.max(0.05, (n.endTick - n.startTick) / ppq), hand,
    });
    if (tracks.length === 2) {
      tracks[0].forEach((n) => push(n, "R"));
      tracks[1].forEach((n) => push(n, "L"));
    } else {
      tracks.forEach((tr) => tr.forEach((n) => push(n, n.midi >= 60 ? "R" : "L")));
    }
    events.sort((a, b) => a.start - b.start || a.midi - b.midi);
    const bpb = sig ? Math.max(1, (sig.num * 4) / sig.den) : 4;
    const bpm = Math.min(240, Math.max(30, Math.round(60000000 / (tempo || 500000))));
    const end = events.reduce((m, e) => Math.max(m, e.start + e.dur), 0);
    return { events, bpb, bpm, totalBeats: Math.max(1, Math.ceil(end / bpb - 1e-9)) * bpb, format, ppq };
  }

  /* ---------- DSP: expected-note verification ----------
     `mag` = LINEAR magnitude spectrum (length fftSize/2), as made by an
     AnalyserNode with a Blackman window (dB -> 10^(dB/20)). */
  const SENS = {
    low:    { thr: 0.62, snr: 5,   abs: 8e-4, rise: 1.45 },
    medium: { thr: 0.50, snr: 3.5, abs: 3e-4, rise: 1.30 },
    high:   { thr: 0.40, snr: 2.5, abs: 1.5e-4, rise: 1.22 },
  };
  const SEMI3 = Math.pow(2, 1 / 36); // 1/3 of a semitone

  function dbToMag(db, out) {
    out = out || new Float32Array(db.length);
    for (let i = 0; i < db.length; i++) { const v = db[i]; out[i] = v > -160 ? Math.pow(10, v / 20) : 0; }
    return out;
  }

  function peakNear(mag, binHz, f) {
    let i0 = Math.floor(f / SEMI3 / binHz), i1 = Math.ceil(f * SEMI3 / binHz);
    if (i1 >= mag.length) return 0;
    if (i0 < 1) i0 = 1;
    let m = 0;
    for (let i = i0; i <= i1; i++) if (mag[i] > m) m = mag[i];
    return m;
  }

  function noiseFloor(mag, sr, fftSize) {
    const binHz = sr / fftSize;
    const a = Math.max(1, Math.floor(100 / binHz)), b = Math.min(mag.length - 1, Math.ceil(5000 / binHz));
    const vals = [];
    for (let i = a; i <= b; i += 2) vals.push(mag[i]);
    if (!vals.length) return 0;
    vals.sort((x, y) => x - y);
    return vals[vals.length >> 1];
  }

  /* score one expected note. `expected` = Set of all expected midis (so a
     chord member a semitone away is not treated as a "wrong neighbour"). */
  function scoreNote(mag, sr, fftSize, midi, floor, expected, sens) {
    const P = typeof sens === "string" ? SENS[sens] : sens;
    const binHz = sr / fftSize;
    const f0 = hz(midi);
    const low = midi < 48;
    const W = low ? [0.7, 1.5, 1.5, 1] : [2, 1.5, 1, 0.7];
    const fl = Math.max(floor, P.abs / 4);
    let num = 0, den = 0, strength = 0, own1 = 0, anyAbs = false, e1 = 0;
    for (let h = 1; h <= 4; h++) {
      const f = f0 * h;
      if (f > sr * 0.45 || f > 6000) break;
      const own = peakNear(mag, binHz, f);
      if (h === 1) own1 = own;
      if (h <= 3) strength += own;
      let nb = 0;
      if (!expected.has(midi - 1)) nb = Math.max(nb, peakNear(mag, binHz, hz(midi - 1) * h));
      if (!expected.has(midi + 1)) nb = Math.max(nb, peakNear(mag, binHz, hz(midi + 1) * h));
      let e = 0;
      if (own > fl * P.snr) {
        if (own > P.abs) anyAbs = true;
        e = Math.min(1, Math.max(0, (20 * Math.log10(own / Math.max(nb, fl))) / 10));
      }
      if (h === 1) e1 = e;
      num += W[h - 1] * e; den += W[h - 1];
    }
    let score = den ? num / den : 0;
    if (!anyAbs) score = 0;
    // a real note above ~C3 has its own fundamental; harmonics alone are
    // usually a lower note's overtones
    if (!low && e1 < 0.25) score *= 0.5;
    // octave guard: a loud note one octave below that is not expected means
    // our "harmonics" are really that lower note
    if (midi - 12 >= 21) {
      const sub = peakNear(mag, binHz, hz(midi - 12));
      if (sub > own1 * 1.5 && sub > fl * P.snr) score *= expected.has(midi - 12) ? 0.6 : 0.3;
    }
    return { score, strength };
  }

  function scoreNotes(mag, sr, fftSize, midis, sens) {
    const floor = noiseFloor(mag, sr, fftSize);
    const set = new Set(midis);
    return midis.map((m) => ({ midi: m, ...scoreNote(mag, sr, fftSize, m, floor, set, sens) }));
  }

  /* ---------- onset-aware detector ---------- */
  class Detector {
    constructor(sens) { this.setSens(sens || "medium"); this.st = new Map(); }
    setSens(s) { this.sensKey = s; this.P = SENS[s] || SENS.medium; }
    reset() { this.st.clear(); }
    /* specLo / specHi: {mag, sr, fftSize}. specHi (16384) is used for midi < 60.
       Returns [{midi, time}] for newly accepted notes (time = onset, in `now` units, ms). */
    update(specLo, specHi, midis, now, ignore) {
      const P = this.P, out = [];
      const set = new Set(midis);
      for (const k of Array.from(this.st.keys())) if (!set.has(k)) this.st.delete(k);
      const floors = new Map();
      midis.forEach((m) => {
        const spec = (m < 60 && specHi) ? specHi : specLo;
        if (!floors.has(spec)) floors.set(spec, noiseFloor(spec.mag, spec.sr, spec.fftSize));
        const floor = floors.get(spec);
        const r = scoreNote(spec.mag, spec.sr, spec.fftSize, m, floor, set, P);
        let s = this.st.get(m);
        if (!s) { s = { hist: [], streak: 0, onsetAt: -1e9, lastOnset: -1e9, armed: true, peak: 0 }; this.st.set(m, s); }
        s.hist.push([now, r.strength]);
        while (s.hist.length && s.hist[0][0] < now - 500) s.hist.shift();
        const hasOld = s.hist.length && s.hist[0][0] <= now - 120;
        if (!ignore && hasOld) {
          let mn = Infinity;
          for (const [t, v] of s.hist) if (t >= now - 110 && t <= now - 30 && v < mn) mn = v;
          const fl = Math.max(floor, P.abs / 4);
          if (!s.armed) {
            // one onset per note: re-arm once the sound has peaked and started to fade
            s.peak = Math.max(s.peak, r.strength);
            if (now - s.onsetAt >= 300 && (r.strength < s.peak * 0.9 || now - s.onsetAt > 700)) s.armed = true;
          }
          if (s.armed && mn < Infinity && r.strength > mn * P.rise && r.strength > fl * P.snr * 2) {
            s.onsetAt = now; s.armed = false; s.peak = r.strength;
          }
        }
        s.streak = (!ignore && r.score >= P.thr) ? s.streak + 1 : 0;
        if (s.streak >= 2 && now - s.onsetAt <= 350 && s.onsetAt > s.lastOnset) {
          s.lastOnset = s.onsetAt;
          out.push({ midi: m, time: s.onsetAt });
        }
      });
      return out;
    }
  }

  /* ---------- YIN pitch (monophonic readout only) ---------- */
  function yinPitch(x, sr, minHz, maxHz) {
    minHz = minHz || 65; maxHz = maxHz || 1100;
    const W = Math.min(2048, x.length >> 1);
    const tauMax = Math.min(W - 1, Math.floor(sr / minHz)), tauMin = Math.max(2, Math.floor(sr / maxHz));
    const d = new Float32Array(tauMax + 1), c = new Float32Array(tauMax + 1);
    for (let tau = 1; tau <= tauMax; tau++) {
      let s = 0;
      for (let j = 0; j < W; j++) { const v = x[j] - x[j + tau]; s += v * v; }
      d[tau] = s;
    }
    let run = 0; c[0] = 1;
    for (let tau = 1; tau <= tauMax; tau++) { run += d[tau]; c[tau] = run ? (d[tau] * tau) / run : 1; }
    for (let tau = tauMin; tau < tauMax; tau++) {
      if (c[tau] < 0.15) {
        while (tau + 1 < tauMax && c[tau + 1] < c[tau]) tau++;
        const a = c[tau - 1], b = c[tau], g = c[tau + 1];
        const den = a - 2 * b + g;
        const tt = den ? tau + (a - g) / (2 * den) : tau;
        return { hz: sr / tt, prob: 1 - b };
      }
    }
    return null;
  }

  function rms(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / x.length); }

  function starsFor(pct) { return pct >= 95 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0; }

  window.FallingCore = {
    nameToMidi, midiToName, midiToLetter, hz, hzToMidiFloat,
    songToEvents, groupChords, parseMidi,
    SENS, dbToMag, noiseFloor, scoreNote, scoreNotes, Detector, yinPitch, rms, starsFor,
  };
})();
