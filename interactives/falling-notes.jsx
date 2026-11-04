/* Falling Notes: Synthesia-style piano trainer that LISTENS through the mic.
   Pure logic (MIDI parser, note verification DSP, detector) lives in
   lib/falling-core.jsx.  Here: song list, game engine, canvas, controls.
   Nothing is uploaded: MIDI files and microphone audio stay in the browser. */
(function () {
  const FC = window.FallingCore;
  const TEST_SYNTH = /[?&]testsource=synth(&|$)/.test(window.location.search);
  // test-synth only: scale the test sound to mimic soft playing (e.g. ?testsource=synth&testgain=0.05)
  // test-synth only: add steady room noise at this level (e.g. &testnoise=0.002)
  const TEST_NOISE = parseFloat(new URLSearchParams(location.search).get("testnoise")) || 0;
  const TEST_GAIN = Math.min(1, parseFloat(new URLSearchParams(location.search).get("testgain")) || 1);
  const LOOK_BARS = 2;        // how many bars you can see falling
  const LATENCY = 0.09;       // s between a key press and the detector noticing
  const TOL_S = 0.25;         // timing window (s) when not waiting
  const WAIT_LATE_S = 1.5;    // wait mode: notes later than this count as misses
  const GREEN = "#22c55e";
  const SENS_KEYS = ["low", "medium", "high"];
  const SENS_LABELS = ["Low", "Medium", "High"];

  /* ------------------------------------------------------------ songs */
  function songList() {
    const out = [];
    const base = window.PIANO_SONGS || {};
    Object.keys(base).forEach((k) => {
      const s = base[k];
      out.push({ key: k, name: s.name, tag: s.tag, level: (window.FALLING_LEVELS || {})[k] || s.level || "Medium", song: s });
    });
    const extra = window.FALLING_SONGS_EXTRA || {};
    Object.keys(extra).forEach((k) => {
      const s = extra[k];
      out.push({ key: k, name: s.name, tag: s.tag, level: s.level || "Medium", song: s });
    });
    return out;
  }
  const modelOf = (meta) => meta.model || FC.songToEvents(meta.song);

  /* ------------------------------------------------------------ storage */
  const readBest = () => (window.Students && window.Students.readNS("fallingNotes.best", {})) || {};
  function bestStars(songKey) {
    const b = readBest();
    let s = 0;
    Object.keys(b).forEach((k) => { if (k.indexOf(songKey + "|") === 0) s = Math.max(s, b[k].stars || 0); });
    return s;
  }
  function saveBest(songKey, hands, wait, pct) {
    const b = readBest(), k = songKey + "|" + hands + "|" + (wait ? "wait" : "free");
    if (!b[k] || pct > b[k].pct) { b[k] = { pct, stars: FC.starsFor(pct) }; window.Students.writeNS("fallingNotes.best", b); }
  }
  const readSettings = () => (window.Students && window.Students.readNS("fallingNotes.settings", {})) || {};

  /* ------------------------------------------------------------ microphone / test synth */
  const MIC = {
    ctx: null, listening: false, lo: null, hi: null, src: null, stream: null,
    dbLo: null, dbHi: null, magLo: null, magHi: null, time: null,
    async start() {
      if (this.listening) return;
      const MA = window.MusicAudio;
      let ctx = MA && MA.getContext ? MA.getContext() : null;
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) throw new Error("no-audio"); ctx = new AC(); }
      if (ctx.state !== "running") { try { await ctx.resume(); } catch (e) { /* ignore */ } }
      if (this.ctx !== ctx) {
        this.ctx = ctx;
        const mk = (n) => { const a = ctx.createAnalyser(); a.fftSize = n; a.smoothingTimeConstant = 0; a.minDecibels = -140; a.maxDecibels = 0; return a; };
        this.lo = mk(8192); this.hi = mk(16384);
        const sink = ctx.createGain(); sink.gain.value = 0; sink.connect(ctx.destination);
        this.lo.connect(sink); this.hi.connect(sink);
        this.dbLo = new Float32Array(this.lo.frequencyBinCount); this.dbHi = new Float32Array(this.hi.frequencyBinCount);
        this.magLo = new Float32Array(this.dbLo.length); this.magHi = new Float32Array(this.dbHi.length);
        this.time = new Float32Array(this.lo.fftSize);
        this.tapped = false;
      }
      if (TEST_SYNTH) {
        if (!this.tapped && MA && MA.tap) { MA.tap(this.lo); MA.tap(this.hi); this.tapped = true; }
        if (TEST_NOISE && !this.noise) {
          const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * TEST_NOISE;
          const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
          n.connect(this.lo); n.connect(this.hi); n.start(); this.noise = n;
        }
      } else {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("no-mic-api");
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        this.src = ctx.createMediaStreamSource(this.stream);
        this.src.connect(this.lo); this.src.connect(this.hi);
      }
      this.listening = true;
    },
    stop() {
      if (this.src) { try { this.src.disconnect(); } catch (e) { /* ignore */ } this.src = null; }
      if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
      this.listening = false;
    },
    read(needHi) {
      this.lo.getFloatFrequencyData(this.dbLo);
      FC.dbToMag(this.dbLo, this.magLo);
      const sr = this.ctx.sampleRate;
      const lo = { mag: this.magLo, sr, fftSize: this.lo.fftSize };
      let hi = null;
      if (needHi) { this.hi.getFloatFrequencyData(this.dbHi); FC.dbToMag(this.dbHi, this.magHi); hi = { mag: this.magHi, sr, fftSize: this.hi.fftSize }; }
      this.lo.getFloatTimeDomainData(this.time);
      return { lo, hi };
    },
    /* test hook: the page's own synth plays the chord into the detector */
    synth(midis, dur) {
      const c = this.ctx; if (!c || !this.lo) return;
      const t = c.currentTime, out = c.createGain();
      out.gain.value = 1; out.connect(this.lo); out.connect(this.hi);
      const mon = c.createGain(); mon.gain.value = 0.4; out.connect(mon); mon.connect(c.destination);
      const amp = 0.09 * TEST_GAIN / Math.sqrt(midis.length);
      midis.forEach((m) => {
        [1, 0.5, 0.33, 0.22].forEach((a, i) => {
          const o = c.createOscillator(); o.type = "sine"; o.frequency.value = FC.hz(m) * (i + 1);
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(amp * a, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur));
          o.connect(g); g.connect(out); o.start(t); o.stop(t + Math.max(0.35, dur) + 0.05);
        });
      });
    },
  };

  /* ------------------------------------------------------------ game engine (plain object, no React) */
  function newGame(meta) {
    const model = modelOf(meta);
    const notes = model.events.slice(0, 4000).map((e) => ({ ...e, status: "pending", late: false }));
    notes.sort((a, b) => a.start - b.start || a.midi - b.midi);
    const g = {
      meta, key: meta.key, name: meta.name, bpm: model.bpm, bpb: model.bpb,
      totalBeats: model.totalBeats, notes,
      opts: { hands: "B", wait: true, speed: 1, metro: false, labels: true, otherHand: false, loop: false, loopStart: 1, loopEnd: model.totalBeats / model.bpb },
      flash: {}, geo: null,
    };
    buildSets(g); resetAll(g);
    return g;
  }
  const isScored = (g, n) => g.opts.hands === "B" || n.hand === g.opts.hands;
  function buildSets(g) {
    g.scored = g.notes.filter((n) => isScored(g, n));
    g.other = g.notes.filter((n) => !isScored(g, n));
    g.chords = FC.groupChords(g.scored, "B");
  }
  const homeBeat = (g) => (g.opts.loop ? (Math.max(1, g.opts.loopStart) - 1) * g.bpb : 0);
  function reindex(g) {
    const b = g.beat - 1e-6;
    g.chordIdx = g.chords.findIndex((c) => c.start >= b); if (g.chordIdx < 0) g.chordIdx = g.chords.length;
    g.otherIdx = g.other.findIndex((n) => n.start >= b); if (g.otherIdx < 0) g.otherIdx = g.other.length;
    g.lastInt = Math.ceil(g.beat - 1e-9) - 1;
  }
  function resetAll(g) {
    g.notes.forEach((n) => { n.status = "pending"; n.late = false; });
    g.playing = false; g.waiting = false; g.waitChord = null; g.finished = false; g.result = null;
    g.needCount = true; g.countLeft = 0; g.beat = homeBeat(g); g.flash = {}; g.lastPass = null; g.ignoreUntil = 0;
    reindex(g);
  }
  function resetRange(g, a, b) { g.notes.forEach((n) => { if (n.start >= a - 1e-6 && n.start < b - 1e-6) { n.status = "pending"; n.late = false; } }); }
  const chordDone = (c) => c.notes.every((n) => n.status !== "pending");
  function counts(g) {
    let hits = 0, misses = 0;
    g.scored.forEach((n) => { if (n.status === "hit") hits++; else if (n.status === "miss") misses++; });
    return { hits, misses, total: g.scored.length };
  }
  const pctOf = (c) => (c.total ? Math.round((c.hits / c.total) * 100) : 0);

  function play(g) {
    if (g.finished) resetAll(g);
    if (g.needCount) { g.needCount = false; g.countLeft = g.bpb; g.lastCountInt = g.bpb + 1; }
    g.playing = true;
  }
  function pause(g) { g.playing = false; }

  function update(g, dt, now, H) {
    if (!g.playing) return;
    const o = g.opts, bps = g.bpm * o.speed / 60, tolB = TOL_S * bps;
    // count-in
    if (g.countLeft > 0) {
      g.countLeft -= dt * bps;
      const ci = Math.ceil(g.countLeft - 1e-9);
      if (ci < g.lastCountInt && ci >= 1) { g.lastCountInt = ci; H.click(ci === g.bpb); g.ignoreUntil = now + 70; }
      if (g.countLeft <= 0) { g.countLeft = 0; reindex(g); }
      return;
    }
    if (g.waiting) {
      if (chordDone(g.waitChord)) { g.waiting = false; g.waitChord = null; } else return;
    }
    let nb = g.beat + dt * bps;
    // reaching chords
    while (g.chordIdx < g.chords.length && g.chords[g.chordIdx].start <= nb + 1e-9) {
      const c = g.chords[g.chordIdx++];
      if (TEST_SYNTH) H.testPlay(c.midis, c.notes[0].dur / bps);
      if (o.wait && !chordDone(c)) { nb = Math.max(g.beat, c.start); g.waiting = true; g.waitChord = c; g.arrivedMs = now; break; }
    }
    g.beat = nb;
    // metronome
    const fl = Math.floor(g.beat + 1e-9);
    while (g.lastInt < fl) {
      g.lastInt++;
      if (o.metro) { H.click(((g.lastInt % g.bpb) + g.bpb) % g.bpb === 0); g.ignoreUntil = now + 70; }
    }
    // other hand plays for the student
    while (g.otherIdx < g.other.length && g.other[g.otherIdx].start <= g.beat + 1e-9) {
      const n = g.other[g.otherIdx++];
      if (o.otherHand) H.playNote(n.midi, Math.max(0.3, n.dur / bps));
    }
    if (g.waiting) return;
    // misses (free-play mode)
    if (!o.wait) g.scored.forEach((n) => { if (n.status === "pending" && n.start + tolB < g.beat) n.status = "miss"; });
    // loop / finish
    if (o.loop) {
      const endB = Math.min(g.totalBeats, Math.max(o.loopStart, o.loopEnd) * g.bpb);
      if (g.beat >= endB) {
        const a = (Math.max(1, o.loopStart) - 1) * g.bpb;
        const inRange = g.scored.filter((n) => n.start >= a - 1e-6 && n.start < endB - 1e-6);
        if (inRange.length) g.lastPass = Math.round(100 * inRange.filter((n) => n.status === "hit").length / inRange.length);
        resetRange(g, a, endB);
        g.beat = a; g.waiting = false; g.waitChord = null; reindex(g);
      }
    } else if (g.beat >= g.totalBeats) {
      g.scored.forEach((n) => { if (n.status === "pending") n.status = "miss"; });
      g.playing = false; g.finished = true; g.beat = g.totalBeats;
      const c = counts(g), pct = pctOf(c);
      g.result = { pct, stars: FC.starsFor(pct), hits: c.hits, total: c.total };
      if (g.key !== "custom") saveBest(g.key, o.hands, o.wait, pct);
      H.finished(g.result);
    }
  }

  /* a note was heard `age` seconds ago */
  function onHeard(g, midi, now, age) {
    if (!g.playing || g.countLeft > 0) return false;
    const bps = g.bpm * g.opts.speed / 60, tolB = TOL_S * bps;
    const ref = g.waiting ? g.beat : g.beat - age * bps;
    let best = null, bd = 1e9;
    for (const n of g.scored) {
      if (n.midi !== midi || n.status !== "pending") continue;
      if (n.start > ref + tolB + 2) break;
      const inWait = g.waiting && g.waitChord && g.waitChord.notes.indexOf(n) >= 0;
      const d = Math.abs(n.start - ref);
      if ((inWait || d <= tolB) && d < bd) { best = n; bd = d; }
    }
    if (!best) return false;
    const late = g.waiting && g.waitChord && g.waitChord.notes.indexOf(best) >= 0 && (now - g.arrivedMs) > WAIT_LATE_S * 1000;
    best.status = late ? "miss" : "hit"; best.late = late; best.hitAt = now;
    if (!late) g.flash[midi] = now;
    return true;
  }

  function candidates(g) {
    if (!g.playing || g.countLeft > 0) return [];
    const bps = g.bpm * g.opts.speed / 60, a = g.beat - 0.6 * bps, b = g.beat + 1.0 * bps;
    const set = new Set();
    for (const n of g.scored) {
      if (n.start > b) break;
      if (n.status === "pending" && n.start >= a) set.add(n.midi);
    }
    if (g.waitChord) g.waitChord.notes.forEach((n) => { if (n.status === "pending") set.add(n.midi); });
    return Array.from(set);
  }
  function expectedNow(g) {
    if (g.waiting && g.waitChord) return g.waitChord.notes.filter((n) => n.status === "pending").map((n) => n.midi);
    const c = g.chords.find((ch) => ch.start >= g.beat - 1e-6 && ch.notes.some((n) => n.status === "pending"));
    return c ? c.notes.filter((n) => n.status === "pending").map((n) => n.midi) : [];
  }

  /* ------------------------------------------------------------ canvas */
  function makeGeo(g, W, H) {
    let lo = 127, hi = 0;
    g.notes.forEach((n) => { if (n.midi < lo) lo = n.midi; if (n.midi > hi) hi = n.midi; });
    let a = Math.floor(lo / 12) * 12, b = Math.floor(hi / 12) * 12 + 11;
    let flip = 0;
    while (b - a + 1 < 24) { if (flip++ % 2 === 0 && b < 104) b += 12; else if (a >= 24) a -= 12; else b += 12; }
    const WHITE = { 0: 1, 2: 1, 4: 1, 5: 1, 7: 1, 9: 1, 11: 1 };
    const whites = [];
    for (let m = a; m <= b; m++) if (WHITE[m % 12]) whites.push(m);
    const kw = W / whites.length, idx = {};
    whites.forEach((m, i) => { idx[m] = i; });
    const keys = {};
    whites.forEach((m) => { keys[m] = { x: idx[m] * kw, w: kw, black: false }; });
    for (let m = a; m <= b; m++) {
      if (WHITE[m % 12]) continue;
      const bw = kw * 0.62;
      keys[m] = { x: (idx[m - 1] + 1) * kw - bw / 2, w: bw, black: true };
    }
    return { W, H, a, b, whites, kw, keys, kbH: Math.max(64, Math.min(110, Math.round(H * 0.2))) };
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n, d) => (cs.getPropertyValue(n) || "").trim() || d;
    const dark = document.documentElement.dataset.theme === "dark";
    return {
      R: v("--terracotta", "#2762e0"), L: v("--teal", "#0f766e"), ink: v("--ink", "#16161a"),
      soft: v("--ink-soft", "#6e6e76"), bg: v("--bg-2", "#fff"), line: v("--border", "#ece9e0"),
      white: dark ? "#e9e9ee" : "#ffffff", black: dark ? "#0c0c10" : "#1b1b20", keyLine: dark ? "#55555f" : "#c9c6bb", dark,
    };
  }

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function draw(c, g, geo, col, now, reduce) {
    const { W, H, kbH, keys } = geo, hitY = H - kbH, bpb = g.bpb, look = LOOK_BARS * bpb, ppb = hitY / look, beat = g.beat;
    c.clearRect(0, 0, W, H);
    c.fillStyle = col.bg; c.fillRect(0, 0, W, hitY);
    // faint lanes at every C and F
    c.fillStyle = col.line; c.globalAlpha = 0.6;
    geo.whites.forEach((m) => { if (m % 12 === 0 || m % 12 === 5) c.fillRect(Math.round(keys[m].x), 0, 1, hitY); });
    c.globalAlpha = 1;
    // bar lines + numbers
    c.font = "600 11px ui-monospace, Menlo, monospace"; c.textBaseline = "top";
    for (let k = Math.max(0, Math.floor(beat / bpb)); k * bpb <= beat + look + 1e-6 && k * bpb < g.totalBeats; k++) {
      const y = hitY - (k * bpb - beat) * ppb;
      if (y < 0 || y > hitY) continue;
      c.fillStyle = col.soft; c.globalAlpha = 0.35; c.fillRect(0, Math.round(y), W, 1);
      c.globalAlpha = 0.8; c.fillText(String(k + 1), 4, y - 14); c.globalAlpha = 1;
    }
    // notes
    const lit = {};
    const waitSet = {};
    if (g.waiting && g.waitChord) g.waitChord.notes.forEach((n) => { if (n.status === "pending") waitSet[n.midi] = true; });
    for (const n of g.notes) {
      if (n.start > beat + look) break;
      const end = n.start + n.dur;
      if (end < beat) continue;
      const k = keys[n.midi]; if (!k) continue;
      const scored = isScored(g, n), hc = n.hand === "R" ? col.R : col.L;
      if (n.start <= beat + 1e-6 && beat < end && g.playing !== null) lit[n.midi] = { color: hc, faded: !scored };
      const yb = Math.min(hitY, hitY - (n.start - beat) * ppb) - 1.5;
      const yt = Math.max(-6, hitY - (end - beat) * ppb);
      const h = Math.max(5, yb - yt), x = k.x + 1, w = k.w - 2;
      c.globalAlpha = scored ? 1 : 0.2;
      c.fillStyle = n.status === "hit" ? GREEN : n.status === "miss" ? col.soft : hc;
      if (n.status === "miss") c.globalAlpha = scored ? 0.45 : 0.2;
      rr(c, x, yb - h, w, h, Math.min(6, w / 3)); c.fill();
      if (n.status === "miss" && scored) { c.strokeStyle = hc; c.setLineDash([3, 3]); c.lineWidth = 1.5; c.stroke(); c.setLineDash([]); }
      c.globalAlpha = 1;
      if (g.opts.labels && h >= 14 && w >= 9) {
        c.fillStyle = "#fff"; c.globalAlpha = scored ? 1 : 0.6;
        c.font = "700 " + Math.max(8, Math.min(12, Math.floor(w * 0.75))) + "px system-ui, sans-serif";
        c.textAlign = "center"; c.textBaseline = "alphabetic";
        c.fillText(FC.midiToLetter(n.midi), x + w / 2, yb - 4);
        c.textAlign = "left"; c.globalAlpha = 1;
      }
    }
    // hit line
    c.fillStyle = col.ink; c.globalAlpha = 0.5; c.fillRect(0, hitY - 1, W, 2); c.globalAlpha = 1;
    // keyboard
    const flashA = (m) => { const t = g.flash[m]; return t ? Math.max(0, 1 - (now - t) / 450) : 0; };
    const pulse = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 160);
    geo.whites.forEach((m) => {
      const k = keys[m], L = lit[m], f = flashA(m);
      c.fillStyle = col.white; c.fillRect(k.x, hitY, k.w, kbH);
      if (L) { c.globalAlpha = L.faded ? 0.3 : 0.85; c.fillStyle = L.color; c.fillRect(k.x, hitY, k.w, kbH); c.globalAlpha = 1; }
      if (f) { c.globalAlpha = f; c.fillStyle = GREEN; c.fillRect(k.x, hitY, k.w, kbH); c.globalAlpha = 1; }
      c.strokeStyle = col.keyLine; c.lineWidth = 1; c.strokeRect(k.x + 0.5, hitY + 0.5, k.w - 1, kbH - 1);
      if (waitSet[m]) { c.strokeStyle = col.ink; c.globalAlpha = pulse; c.lineWidth = 3; c.strokeRect(k.x + 2, hitY + 2, k.w - 4, kbH - 4); c.globalAlpha = 1; }
      if (m % 12 === 0 && k.w >= 12) {
        c.fillStyle = "#555"; c.font = "600 10px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic";
        c.fillText("C" + (Math.floor(m / 12) - 1), k.x + k.w / 2, hitY + kbH - 5); c.textAlign = "left";
      }
    });
    Object.keys(keys).forEach((ms) => {
      const m = +ms, k = keys[m]; if (!k.black) return;
      const L = lit[m], f = flashA(m), bh = kbH * 0.62;
      c.fillStyle = col.black; c.fillRect(k.x, hitY, k.w, bh);
      if (L) { c.globalAlpha = L.faded ? 0.35 : 0.9; c.fillStyle = L.color; c.fillRect(k.x + 1, hitY, k.w - 2, bh - 1); c.globalAlpha = 1; }
      if (f) { c.globalAlpha = f; c.fillStyle = GREEN; c.fillRect(k.x + 1, hitY, k.w - 2, bh - 1); c.globalAlpha = 1; }
      if (waitSet[m]) { c.strokeStyle = "#fff"; c.globalAlpha = pulse; c.lineWidth = 2.5; c.strokeRect(k.x + 1.5, hitY + 1.5, k.w - 3, bh - 3); c.globalAlpha = 1; }
    });
    // count-in number
    if (g.playing && g.countLeft > 0) {
      c.fillStyle = col.ink; c.globalAlpha = 0.8; c.font = "800 " + Math.round(hitY * 0.35) + "px system-ui, sans-serif";
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(String(Math.max(1, Math.ceil(g.countLeft - 1e-9))), W / 2, hitY / 2);
      c.textAlign = "left"; c.textBaseline = "alphabetic"; c.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------ small UI bits */
  const Stars = ({ n, size }) => (
    <span className="fn-stars" role="img" aria-label={n + (n === 1 ? " star" : " stars") + " out of 3"} style={size ? { fontSize: size } : null}>
      {[1, 2, 3].map((i) => <span key={i} className={i <= n ? "on" : ""} aria-hidden="true">★</span>)}
    </span>
  );

  function Toggle({ label, checked, onChange, hint }) {
    return (
      <label className="fn-toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </label>
    );
  }

  /* ------------------------------------------------------------ player */
  function FallingPlayer({ meta, onChangeSong }) {
    const saved = React.useMemo(readSettings, []);
    const gameRef = React.useRef(null);
    if (!gameRef.current || gameRef.current.meta !== meta) gameRef.current = newGame(meta);
    const g = gameRef.current;
    const totalBars = Math.round(g.totalBeats / g.bpb);

    const [hands, setHands] = React.useState("B");
    const [wait, setWait] = React.useState(saved.wait !== false);
    const [speed, setSpeed] = React.useState(1);
    const [metro, setMetro] = React.useState(!!saved.metro);
    const [labels, setLabels] = React.useState(saved.labels !== false);
    const [otherHand, setOtherHand] = React.useState(false);
    const [loop, setLoop] = React.useState(false);
    const [loopStart, setLoopStart] = React.useState(1);
    const [loopEnd, setLoopEnd] = React.useState(totalBars);
    const [sens, setSens] = React.useState(typeof saved.sens === "number" ? saved.sens : 1);
    const [micErr, setMicErr] = React.useState("");
    const [listening, setListening] = React.useState(MIC.listening);
    const [snap, setSnap] = React.useState({});
    const [size, setSize] = React.useState({ w: 360, h: 420 });
    const wrapRef = React.useRef(null), canvasRef = React.useRef(null);
    const detRef = React.useRef(null);
    if (!detRef.current) detRef.current = new FC.Detector(SENS_KEYS[sens]);
    const live = React.useRef({}); // mic readouts updated by the loop

    // push options into the engine; changing hands / wait starts the song over
    React.useEffect(() => {
      const o = g.opts, structural = o.hands !== hands || o.wait !== wait;
      Object.assign(o, { hands, wait, speed, metro, labels, otherHand, loop, loopStart, loopEnd });
      if (structural) { buildSets(g); resetAll(g); detRef.current.reset(); }
      else if (!g.playing && g.needCount) { g.beat = homeBeat(g); reindex(g); }
    }, [hands, wait, speed, metro, labels, otherHand, loop, loopStart, loopEnd]);
    React.useEffect(() => {
      detRef.current.setSens(SENS_KEYS[sens]);
      if (window.Students) window.Students.writeNS("fallingNotes.settings", { sens, wait, metro, labels });
    }, [sens, wait, metro, labels]);

    const hooks = React.useMemo(() => ({
      click: (acc) => { window.MusicAudio && window.MusicAudio.click(acc); },
      playNote: (midi, dur) => { window.MusicAudio && window.MusicAudio.playPiano(FC.midiToName(midi), dur, 0.7); },
      testPlay: (midis, dur) => { if (MIC.listening) MIC.synth(midis, dur); },
      finished: (res) => { if (res.stars === 3 && window.MusicAudio) window.MusicAudio.ding(true); },
    }), []);

    async function startListening() {
      setMicErr("");
      try { await MIC.start(); setListening(true); return true; }
      catch (e) {
        const n = e && e.name;
        setMicErr(n === "NotAllowedError" || n === "SecurityError" ? "The microphone is blocked. Allow it in your browser settings, then try again."
          : n === "NotFoundError" ? "No microphone found."
          : "Could not start the microphone on this device.");
        return false;
      }
    }
    function stopListening() { MIC.stop(); setListening(false); live.current = {}; detRef.current.reset(); }

    async function togglePlay() {
      if (g.playing) { pause(g); return; }
      if (!MIC.listening) { const ok = await startListening(); if (!ok) return; }
      window.MusicAudio && window.MusicAudio.resume();
      detRef.current.reset();
      play(g);
      showStage();
    }
    /* keep the falling notes and the keyboard on screen while playing */
    function showStage() {
      const el = wrapRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) {
        const smooth = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        el.scrollIntoView({ block: "end", behavior: smooth ? "smooth" : "auto" });
      }
    }
    function restart() { resetAll(g); detRef.current.reset(); }
    async function restartAndPlay() {
      if (!MIC.listening) { const ok = await startListening(); if (!ok) return; }
      resetAll(g); detRef.current.reset(); play(g); showStage();
    }
    const toggleRef = React.useRef(); toggleRef.current = togglePlay;

    // keyboard: space plays / pauses
    React.useEffect(() => {
      const onKey = (e) => {
        if (e.code !== "Space" && e.key !== " ") return;
        const t = e.target, tag = t && t.tagName;
        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || (t && t.isContentEditable)) return;
        e.preventDefault(); toggleRef.current();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    // size
    React.useEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const measure = () => {
        const w = Math.max(280, Math.floor(el.clientWidth));
        const h = Math.round(Math.max(300, Math.min(560, window.innerHeight - 170)));
        setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
      };
      measure();
      let ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(el); }
      window.addEventListener("resize", measure);
      return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
    }, []);

    // main loop
    React.useEffect(() => {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let colors = readColors();
      const mo = new MutationObserver(() => { colors = readColors(); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      let raf = 0, last = performance.now(), lastUi = 0, lastYin = 0;
      const lv = live.current;

      const tick = (now) => {
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
        const cv = canvasRef.current;
        // 1) listen
        if (MIC.listening) {
          const cand = candidates(g);
          const needHi = cand.some((m) => m < 60);
          const spec = MIC.read(needHi);
          const rms = FC.rms(MIC.time);
          lv.level = Math.max(0, Math.min(1, (20 * Math.log10(rms + 1e-9) + 60) / 50));
          if (now - lastYin > 80) {
            lastYin = now;
            const y = rms > 0.008 ? FC.yinPitch(MIC.time, MIC.ctx.sampleRate) : null;
            if (y && y.prob > 0.85) {
              const m = Math.round(FC.hzToMidiFloat(y.hz));
              lv.note = m; lv.noteAt = now;
              if (m === 60 && Math.abs(FC.hzToMidiFloat(y.hz) - 60) < 0.5) { lv.c4 = (lv.c4 || 0) + 1; if (lv.c4 >= 3) lv.micOk = true; }
            }
          }
          if (cand.length) {
            const found = detRef.current.update(spec.lo, spec.hi, cand, now, now < g.ignoreUntil);
            found.forEach((f) => onHeard(g, f.midi, now, (now - f.time) / 1000 + LATENCY));
          } else if (detRef.current.st.size) detRef.current.reset();
        }
        // 2) advance
        update(g, dt, now, hooks);
        // 3) draw
        if (cv) {
          const { w, h } = sizeRef.current, dpr = window.devicePixelRatio || 1;
          if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
          const c = cv.getContext("2d");
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (!g.geo || g.geo.W !== w || g.geo.H !== h) g.geo = makeGeo(g, w, h);
          draw(c, g, g.geo, colors, now, reduce);
        }
        // 4) UI snapshot
        if (now - lastUi > 100) {
          lastUi = now;
          const cn = counts(g);
          setSnap({
            playing: g.playing, waiting: g.waiting, finished: g.finished, result: g.result, count: g.countLeft > 0,
            hits: cn.hits, misses: cn.misses, total: cn.total, bar: Math.max(1, Math.floor(Math.max(0, g.beat) / g.bpb) + 1),
            expected: g.waiting ? expectedNow(g).map(FC.midiToName) : [], waitedMs: g.waiting ? now - g.arrivedMs : 0,
            level: lv.level || 0, heard: lv.note != null && now - lv.noteAt < 700 ? FC.midiToName(lv.note) : "",
            micOk: !!lv.micOk, lastPass: g.lastPass,
          });
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(raf); mo.disconnect(); };
    }, []);
    const sizeRef = React.useRef(size); sizeRef.current = size;

    // test hook
    React.useEffect(() => {
      window.__fallingNotes = {
        state() {
          const cn = counts(g);
          return {
            playing: g.playing, beat: g.beat, waiting: g.waiting, expected: expectedNow(g),
            hits: cn.hits, misses: cn.misses, score: cn.hits + cn.misses ? Math.round(100 * cn.hits / (cn.hits + cn.misses)) : null,
            finished: g.finished, listening: MIC.listening, song: g.key,
          };
        },
        injectNotes(midis) { const now = performance.now(); return (midis || []).map((m) => onHeard(g, m, now, 0)); },
        /* test-synth only: play `midis` and return detector scores over ~0.7 s */
        probe(midis, sens) {
          if (!MIC.listening) return Promise.resolve(null);
          if (TEST_SYNTH) MIC.synth(midis, 0.6);
          const t0 = performance.now(), log = [];
          return new Promise((resolve) => {
            const iv = setInterval(() => {
              const s = MIC.read(true);
              log.push(midis.map((m) => {
                const sp = m < 60 ? s.hi : s.lo;
                const r = FC.scoreNotes(sp.mag, sp.sr, sp.fftSize, midis, sens || "medium").find((x) => x.midi === m);
                return [m, +r.score.toFixed(2), +r.strength.toExponential(1)];
              }));
              if (performance.now() - t0 > 700) { clearInterval(iv); resolve(log); }
            }, 50);
          });
        },
      };
      return () => { delete window.__fallingNotes; };
    }, [g]);
    React.useEffect(() => () => { pause(g); }, [g]);

    // clamp loop bars
    function setBar(which, v) {
      v = Math.max(1, Math.min(totalBars, parseInt(v, 10) || 1));
      if (which === "s") { setLoopStart(v); if (v > loopEnd) setLoopEnd(v); } else { setLoopEnd(v); if (v < loopStart) setLoopStart(v); }
    }
    const setSpeedClamped = (v) => setSpeed(Math.round(Math.max(0.25, Math.min(1.5, v)) * 100) / 100);

    const expectedText = snap.expected && snap.expected.length ? snap.expected.join(" + ") : "";
    let status = "Press Play, then play the notes you see.";
    if (snap.finished) status = "Song finished.";
    else if (snap.count) status = "Get ready...";
    else if (snap.waiting) status = "Waiting for: " + expectedText;
    else if (snap.playing) status = "Bar " + snap.bar + " of " + totalBars;
    else if (g.beat > homeBeat(g) + 0.01) status = "Paused";

    return (
      <div className="fn-player">
        <div className="fn-topbar">
          <button className="btn btn-ghost" onClick={onChangeSong}><span aria-hidden="true">←</span> Songs</button>
          <div className="fn-title">
            <h2>{g.name}</h2>
            <span className="text-soft">{g.bpm} bpm · {g.bpb === 3 ? "3 beats" : g.bpb + " beats"} per bar</span>
          </div>
          <span className="fn-score" aria-live="off">{snap.hits || 0} / {snap.total || 0} right</span>
        </div>

        <section className="fn-mic" aria-label="Microphone">
          {!listening ? (
            <div className="fn-mic-row">
              <button className="btn btn-teal" onClick={startListening}>Start listening</button>
              <span className="text-soft">{TEST_SYNTH ? "Test mode: listening to the page's own sound." : "Uses your mic. Nothing is recorded or sent anywhere."}</span>
            </div>
          ) : (
            <div className="fn-mic-row">
              <div className="fn-meter" role="meter" aria-label="Sound level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round((snap.level || 0) * 100)}>
                <span style={{ width: Math.round((snap.level || 0) * 100) + "%" }} />
              </div>
              <span className="fn-heard" aria-live="polite">
                {snap.micOk ? "Mic works! " : "Play middle C to test. "}
                {snap.heard ? <strong>You played: {snap.heard}</strong> : <span className="text-soft">Listening...</span>}
              </span>
              <button className="btn btn-ghost fn-small" onClick={stopListening}>Stop listening</button>
            </div>
          )}
          {micErr ? <p className="fn-error" role="alert">{micErr}</p> : null}
        </section>

        <div className="fn-status" aria-live="polite">{status}{snap.lastPass != null ? " · Last loop: " + snap.lastPass + "%" : ""}</div>

        <div className="fn-transport">
          <button className="btn btn-primary" onClick={togglePlay} aria-label={snap.playing ? "Pause" : "Play"}>
            {snap.playing ? "Pause" : "Play"}
          </button>
          <button className="btn btn-ghost" onClick={restart}>Restart</button>
          {snap.waiting && snap.waitedMs > 6000 ? (
            <button className="btn btn-ghost" onClick={() => { if (g.waitChord) g.waitChord.notes.forEach((n) => { if (n.status === "pending") n.status = "miss"; }); }}>Skip this note</button>
          ) : null}
          <span className="text-soft fn-hint">Space = play / pause</span>
        </div>

        <div className="fn-stage" ref={wrapRef}>
          <canvas ref={canvasRef} role="img" tabIndex={0}
            aria-label={"Falling notes for " + g.name + ". " + status}
            style={{ width: size.w + "px", height: size.h + "px" }} />
          {snap.finished && snap.result ? (
            <div className="fn-result" role="dialog" aria-label="Your result">
              <Stars n={snap.result.stars} size="2.6rem" />
              <h3>{snap.result.stars === 3 ? "Brilliant!" : snap.result.stars === 2 ? "Great job!" : snap.result.stars === 1 ? "Nice work!" : "Keep practising!"}</h3>
              <p><strong>{snap.result.pct}%</strong> right · {snap.result.hits} of {snap.result.total} notes</p>
              <div className="fn-result-actions">
                <button className="btn btn-primary" onClick={restartAndPlay}>Play again</button>
                <button className="btn btn-ghost" onClick={onChangeSong}>Pick another song</button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="fn-settings">
          <div className="fn-field">
            <span className="fn-label" id="fn-hands-l">Hands</span>
            <div className="fn-seg" role="group" aria-labelledby="fn-hands-l">
              {[["R", "Right"], ["L", "Left"], ["B", "Both"]].map(([v, l]) => (
                <button key={v} type="button" aria-pressed={hands === v} onClick={() => setHands(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="fn-field">
            <label className="fn-label" htmlFor="fn-speed">Speed: {Math.round(speed * 100)}%</label>
            <div className="fn-speed">
              <button type="button" className="btn btn-ghost fn-small" aria-label="Slower" onClick={() => setSpeedClamped(speed - 0.1)}>-</button>
              <input id="fn-speed" type="range" min="25" max="150" step="5" value={Math.round(speed * 100)} onChange={(e) => setSpeedClamped(e.target.value / 100)} />
              <button type="button" className="btn btn-ghost fn-small" aria-label="Faster" onClick={() => setSpeedClamped(speed + 0.1)}>+</button>
            </div>
          </div>
          <div className="fn-field">
            <label className="fn-label" htmlFor="fn-sens">Mic sensitivity: {SENS_LABELS[sens]}</label>
            <input id="fn-sens" type="range" min="0" max="2" step="1" value={sens} onChange={(e) => setSens(+e.target.value)} />
            <small className="text-soft">High hears quiet playing. Low ignores more noise.</small>
          </div>
          <div className="fn-field fn-checks">
            <Toggle label="Wait for me" checked={wait} onChange={setWait} hint="The song stops until you play the notes." />
            <Toggle label="Metronome" checked={metro} onChange={setMetro} />
            <Toggle label="Note names" checked={labels} onChange={setLabels} />
            <Toggle label="Play the other hand for me" checked={otherHand} onChange={setOtherHand} hint="Headphones help, so the mic does not hear it." />
          </div>
          <div className="fn-field">
            <Toggle label="Loop some bars" checked={loop} onChange={setLoop} />
            {loop ? (
              <div className="fn-loop">
                <label>From bar <input type="number" min="1" max={totalBars} value={loopStart} onChange={(e) => setBar("s", e.target.value)} /></label>
                <label>to bar <input type="number" min="1" max={totalBars} value={loopEnd} onChange={(e) => setBar("e", e.target.value)} /></label>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ page */
  function FallingNotes({ year, onBack }) {
    const [meta, setMeta] = React.useState(null);
    const [msg, setMsg] = React.useState("");
    const [, bump] = React.useState(0);
    const fileRef = React.useRef(null);
    const songs = React.useMemo(songList, []);

    React.useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [meta]);
    React.useEffect(() => () => { MIC.stop(); }, []);

    function openFile(file) {
      setMsg("");
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) { setMsg("That file is too big. Try a smaller MIDI file."); return; }
      const done = (buf) => {
        try {
          const m = FC.parseMidi(buf);
          const cut = m.events.length > 4000;
          setMeta({
            key: "custom", name: file.name.replace(/\.midi?$/i, ""), tag: "YOUR FILE", level: "Your file",
            model: cut ? { ...m, events: m.events.slice(0, 4000) } : m,
          });
          if (cut) setMsg("That is a long file. Only the first part is used.");
        } catch (e) {
          setMsg(e && e.friendly ? e.message + " Try a different MIDI file." : "Sorry, that file did not work. Try a different MIDI file.");
        }
      };
      if (file.arrayBuffer) file.arrayBuffer().then(done).catch(() => setMsg("Sorry, I could not read that file."));
      else { const r = new FileReader(); r.onload = () => done(r.result); r.onerror = () => setMsg("Sorry, I could not read that file."); r.readAsArrayBuffer(file); }
    }

    return (
      <div className="instrument-studio fn-page">
        <div className="studio-backbar">
          <button className="btn btn-ghost" onClick={onBack}>
            <span aria-hidden="true">←</span> Back to {window.CURRICULUM[year].label}
          </button>
        </div>

        {meta ? (
          <FallingPlayer key={meta.key + meta.name} meta={meta} onChangeSong={() => { setMeta(null); bump((n) => n + 1); }} />
        ) : (
          <>
            <header className="fn-head">
              <div className="eyebrow">Piano · learn a song</div>
              <h1>Falling Notes</h1>
              <p>Pick a song. Notes fall onto the keys. Play them on a real piano or keyboard and the mic will hear you.</p>
            </header>

            <div className="fn-open">
              <button className="btn btn-teal" onClick={() => fileRef.current && fileRef.current.click()}>Open MIDI file</button>
              <input ref={fileRef} type="file" accept=".mid,.midi,audio/midi" className="sr-only" aria-label="Open a MIDI file"
                onChange={(e) => { openFile(e.target.files && e.target.files[0]); e.target.value = ""; }} />
              <span className="text-soft">Your file stays on this device.</span>
            </div>
            {msg ? <p className="fn-error" role="alert">{msg}</p> : null}

            {["Easy", "Medium", "Hard"].map((lvl) => {
              const list = songs.filter((s) => s.level === lvl);
              if (!list.length) return null;
              return (
                <section key={lvl} className="fn-group" aria-label={lvl + " songs"}>
                  <h2><span className={"chip " + (lvl === "Easy" ? "solid-teal" : lvl === "Medium" ? "solid-butter" : "solid-terracotta")}>{lvl}</span></h2>
                  <ul className="fn-songs">
                    {list.map((s) => (
                      <li key={s.key}>
                        <button className="fn-song" onClick={() => setMeta(s)}>
                          <span className="fn-song-name">{s.name}</span>
                          <span className="fn-song-meta">
                            {s.tag ? <span className="chip">{s.tag}</span> : null}
                            <Stars n={bestStars(s.key)} />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </>
        )}
      </div>
    );
  }

  window.FallingNotes = FallingNotes;
})();
