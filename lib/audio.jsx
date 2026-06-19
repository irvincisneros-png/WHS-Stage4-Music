/* Tiny Web Audio engine: synth voices for piano, drum kit, click metronome.
   Exposed on window.MusicAudio. Honors window.__SOUND_ON (set by Tweaks). */

(function () {
  let ctx = null;
  let masterGain = null;
  let convolver = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    // tiny reverb-ish via short noise IR (optional, keep light)
    convolver = ctx.createConvolver();
    const ir = ctx.createBuffer(2, ctx.sampleRate * 0.6, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = ir.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      }
    }
    convolver.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.12;
    convolver.connect(wet).connect(masterGain);
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    const c = ensure();
    if (c && c.state === "suspended") {
      // Fire-and-forget; some browsers return a Promise we can ignore.
      const p = c.resume();
      if (p && typeof p.then === "function") p.catch(() => {});
    }
    return c;
  }

  // Run `fn(ctx)` once the AudioContext is actually running. If it's still
  // suspending (the very first user gesture often races with the first
  // playPiano call), we wait for resume() to settle before scheduling, so
  // oscillator events don't get queued against a frozen clock and dropped.
  function ifReady(fn) {
    const c = resume();
    if (!c) return;
    if (c.state === "running") { fn(c); return; }
    const p = c.resume();
    if (p && typeof p.then === "function") {
      p.then(() => fn(c)).catch(() => {});
    } else {
      // very old browsers: best-effort
      setTimeout(() => fn(c), 30);
    }
  }

  // Browsers won't let an AudioContext make sound until it's created or
  // resumed inside a user gesture. Wire a one-shot listener on first
  // pointer/key/touch so the context is "warm" by the time the user clicks
  // a piano key or hits Play. Without this the first note is often silent
  // (especially on Safari + iOS).
  function installGestureUnlock() {
    if (typeof window === "undefined") return;
    const events = ["pointerdown", "touchstart", "keydown", "click"];
    const unlock = () => {
      try { resume(); } catch {}
      events.forEach(ev => window.removeEventListener(ev, unlock, true));
    };
    events.forEach(ev => window.addEventListener(ev, unlock, true));
  }
  installGestureUnlock();

  const ok = () => window.__SOUND_ON !== false;

  // Note name → midi number. e.g. C4 = 60
  function midiFromName(name) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
    if (!m) return null;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
    const oct = parseInt(m[3], 10);
    return 12 * (oct + 1) + base + acc;
  }
  function hzFromMidi(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function hzFromName(n) {
    const m = midiFromName(n);
    return m == null ? null : hzFromMidi(m);
  }

  // simple piano-ish voice: 2 detuned saws + filter env + amp env
  function playPiano(name, dur = 0.9, velocity = 0.8) {
    if (!ok()) return;
    const f = hzFromName(name); if (!f) return;
    ifReady((c) => {
      const t = c.currentTime;

      const osc1 = c.createOscillator(); osc1.type = "triangle"; osc1.frequency.value = f;
      const osc2 = c.createOscillator(); osc2.type = "sine";     osc2.frequency.value = f * 2;
      const osc3 = c.createOscillator(); osc3.type = "sine";     osc3.frequency.value = f;

      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2800, t);
      filter.frequency.exponentialRampToValueAtTime(900, t + dur);
      filter.Q.value = 1.2;

      const g = c.createGain();
      const peak = 0.32 * velocity;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      const mix = c.createGain();
      mix.gain.value = 1;
      osc1.connect(mix); osc2.connect(mix); osc3.connect(mix);
      mix.connect(filter).connect(g);
      g.connect(masterGain);
      g.connect(convolver);

      osc1.start(t); osc2.start(t); osc3.start(t);
      osc1.stop(t + dur + 0.05);
      osc2.stop(t + dur + 0.05);
      osc3.stop(t + dur + 0.05);
    });
  }

  // pluck: for guitar chords
  function playPluck(name, dur = 1.2, velocity = 0.75) {
    if (!ok()) return;
    const f = hzFromName(name); if (!f) return;
    ifReady((c) => {
      const t = c.currentTime;
      const osc = c.createOscillator(); osc.type = "sawtooth"; osc.frequency.value = f;
      const filter = c.createBiquadFilter(); filter.type = "lowpass";
      filter.frequency.setValueAtTime(3500, t);
      filter.frequency.exponentialRampToValueAtTime(500, t + dur);
      const g = c.createGain();
      const peak = 0.18 * velocity;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(filter).connect(g).connect(masterGain);
      g.connect(convolver);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  }

  function playChord(notes, dur = 1.5, velocity = 0.7) {
    notes.forEach((n, i) => setTimeout(() => playPluck(n, dur, velocity), i * 25));
  }

  // drums
  function playKick() {
    if (!ok()) return;
    ifReady((c) => {
      const t = c.currentTime;
      const osc = c.createOscillator(); osc.type = "sine";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
      const g = c.createGain();
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.4);
    });
  }
  function noiseBuf(c, dur) {
    const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function playSnare() {
    if (!ok()) return;
    ifReady((c) => {
      const t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, 0.25);
      const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1200;
      const g = c.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      src.connect(f).connect(g).connect(masterGain);
      const osc = c.createOscillator(); osc.type = "triangle"; osc.frequency.value = 180;
      const og = c.createGain();
      og.gain.setValueAtTime(0.35, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(og).connect(masterGain);
      src.start(t); osc.start(t); osc.stop(t + 0.2);
    });
  }
  function playHat(open = false) {
    if (!ok()) return;
    ifReady((c) => {
      const t = c.currentTime;
      const dur = open ? 0.35 : 0.06;
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, dur + 0.05);
      const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6500;
      const g = c.createGain();
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f).connect(g).connect(masterGain);
      src.start(t);
    });
  }
  function playClap() {
    if (!ok()) return;
    ifReady((c) => {
      const t = c.currentTime;
      [0, 0.012, 0.024, 0.04].forEach((d, i) => {
        const src = c.createBufferSource(); src.buffer = noiseBuf(c, 0.08);
        const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1500; f.Q.value = 1.4;
        const g = c.createGain();
        g.gain.setValueAtTime(i === 3 ? 0.5 : 0.3, t + d);
        g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.08);
        src.connect(f).connect(g).connect(masterGain);
        src.start(t + d);
      });
    });
  }
  function playTom(pitch = 220) {
    if (!ok()) return;
    ifReady((c) => {
      const t = c.currentTime;
      const osc = c.createOscillator(); osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, t + 0.3);
      const g = c.createGain();
      g.gain.setValueAtTime(0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.4);
    });
  }
  function playCrash() {
    if (!ok()) return;
    ifReady((c) => {
      const t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, 1.4);
      const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4500;
      const g = c.createGain();
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      src.connect(f).connect(g).connect(masterGain);
      src.start(t);
    });
  }

  // pleasant UI ding
  function ding(success = true) {
    if (!ok()) return;
    ifReady((c) => {
      const notes = success ? [660, 880, 1320] : [330, 220];
      notes.forEach((f, i) => {
        const t = c.currentTime + i * 0.07;
        const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g).connect(masterGain);
        o.start(t); o.stop(t + 0.25);
      });
    });
  }

  function click(accent = false) {
    if (!ok()) return;
    ifReady((c) => {
      const t = c.currentTime;
      const o = c.createOscillator(); o.type = "square"; o.frequency.value = accent ? 1500 : 900;
      const g = c.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.connect(g).connect(masterGain);
      o.start(t); o.stop(t + 0.05);
    });
  }

  window.MusicAudio = {
    resume, playPiano, playPluck, playChord,
    playKick, playSnare, playHat, playClap, playTom, playCrash,
    ding, click, hzFromName, midiFromName,
  };
})();
