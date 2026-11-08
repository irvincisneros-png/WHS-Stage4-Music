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
  function bestPct(songKey, hands, wait) {
    const b = readBest()[songKey + "|" + hands + "|" + (wait ? "wait" : "free")];
    return (b && b.pct) || 0;
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
    return { W, H, a, b, whites, kw, keys, kbH: Math.max(72, Math.min(126, Math.round(H * 0.22))) };
  }

  /* ------------------------------------------------------------ stage look (canvas) */
  const FONT = '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
  const HANDS = {
    R: { top: "#5b8cff", bot: "#2762e0", glow: "rgba(91,140,255,0.95)", flat: "#5b8cff", beam: "91,140,255", idx: 0 },
    L: { top: "#34e0c4", bot: "#0f8a7e", glow: "rgba(52,224,196,0.9)", flat: "#34e0c4", beam: "52,224,196", idx: 1 },
  };
  const HAND_BY_IDX = [HANDS.R, HANDS.L];
  const RED = "#ef4444";
  const SPARKS = 192, SPARK_LIFE = 450, FLASH_MS = 450, MISS_MS = 380;

  function stageColors(stage) {
    const siteDark = document.documentElement.dataset.theme === "dark";
    const dark = stage === "dark";
    return {
      stage, siteDark, dark,
      top: dark ? "#0e1222" : siteDark ? "#ece9e2" : "#fbfaf7",
      bot: dark ? "#161b30" : siteDark ? "#dedbd2" : "#f1efe8",
      barLine: dark ? "rgba(255,255,255,0.07)" : "rgba(30,40,70,0.11)",
      beatLine: dark ? "rgba(255,255,255,0.028)" : "rgba(30,40,70,0.045)",
      pill: dark ? "rgba(255,255,255,0.09)" : "rgba(30,40,70,0.08)",
      pillText: dark ? "rgba(205,214,240,0.8)" : "rgba(40,50,80,0.7)",
    };
  }

  function createFx() {
    return {
      key: "", bg: null, g: null, blackL: [],
      seen: new Float64Array(128), hand: new Uint8Array(128), missT: new Float64Array(128),
      lit: new Array(128).fill(null), litFade: new Uint8Array(128), wait: new Uint8Array(128),
      sx: new Float32Array(SPARKS), sy: new Float32Array(SPARKS), svx: new Float32Array(SPARKS), svy: new Float32Array(SPARKS),
      sz: new Float32Array(SPARKS), sT: new Float64Array(SPARKS), sH: new Uint8Array(SPARKS), sNext: 0, lastNow: 0,
    };
  }

  /* rounded rectangle with only the bottom corners rounded (keys) */
  function rrBottom(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.closePath();
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  /* everything that only changes with size / theme is built once here */
  function prepare(fx, c, geo, col, dpr) {
    const { W, H, kbH, keys } = geo, hitY = H - kbH, bh = kbH * 0.62;
    const bg = fx.bg || (fx.bg = document.createElement("canvas"));
    bg.width = Math.max(1, Math.round(W * dpr)); bg.height = Math.max(1, Math.round(hitY * dpr));
    const b = bg.getContext("2d");
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = b.createLinearGradient(0, 0, 0, hitY);
    sky.addColorStop(0, col.top); sky.addColorStop(1, col.bot);
    b.fillStyle = sky; b.fillRect(0, 0, W, hitY);
    fx.blackL = [];
    for (let m = geo.a; m <= geo.b; m++) if (keys[m] && keys[m].black) fx.blackL.push(m);
    // black-key columns a touch darker
    b.fillStyle = col.dark ? "rgba(0,0,0,0.20)" : "rgba(30,40,70,0.022)";
    fx.blackL.forEach((m) => { b.fillRect(keys[m].x, 0, keys[m].w, hitY); });
    // lane lines, brighter at each C
    geo.whites.forEach((m) => {
      const x = Math.round(keys[m].x);
      const isC = m % 12 === 0;
      b.fillStyle = col.dark ? (isC ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.03)") : (isC ? "rgba(30,40,70,0.14)" : "rgba(30,40,70,0.05)");
      b.fillRect(x, 0, 1, hitY);
    });
    const g = {};
    const ng = (stops) => { const q = c.createLinearGradient(0, 0, 0, 100); stops.forEach((s) => q.addColorStop(s[0], s[1])); return q; };
    g.R = ng([[0, HANDS.R.top], [1, HANDS.R.bot]]);
    g.L = ng([[0, HANDS.L.top], [1, HANDS.L.bot]]);
    g.miss = ng([[0, "#9aa1b8"], [1, "#6c7390"]]);
    g.white = c.createLinearGradient(0, hitY, 0, hitY + kbH); g.white.addColorStop(0, "#ffffff"); g.white.addColorStop(1, "#e8e8ee");
    g.black = c.createLinearGradient(0, hitY, 0, hitY + bh); g.black.addColorStop(0, "#41414c"); g.black.addColorStop(0.6, "#1b1b23"); g.black.addColorStop(1, "#0a0a0e");
    g.top = c.createLinearGradient(0, hitY, 0, hitY + 10); g.top.addColorStop(0, "rgba(0,0,0,0.30)"); g.top.addColorStop(1, "rgba(0,0,0,0)");
    g.glow = c.createLinearGradient(0, hitY - 36, 0, hitY); g.glow.addColorStop(0, "rgba(91,140,255,0)"); g.glow.addColorStop(1, "rgba(91,140,255,0.2)");
    [["beamR", HANDS.R], ["beamL", HANDS.L]].forEach(([k, h]) => {
      const q = c.createLinearGradient(0, hitY - 120, 0, hitY);
      q.addColorStop(0, "rgba(" + h.beam + ",0)"); q.addColorStop(1, "rgba(" + h.beam + ",0.6)"); g[k] = q;
    });
    fx.g = g;
  }

  function spawnSparks(fx, x, y, hand, now) {
    const n = 8 + ((Math.random() * 7) | 0);
    for (let i = 0; i < n; i++) {
      const j = fx.sNext; fx.sNext = (j + 1) % SPARKS;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 70 + Math.random() * 150;
      fx.sx[j] = x + (Math.random() - 0.5) * 8; fx.sy[j] = y;
      fx.svx[j] = Math.cos(a) * sp; fx.svy[j] = Math.sin(a) * sp;
      fx.sz[j] = 1.4 + Math.random() * 2.2; fx.sT[j] = now; fx.sH[j] = hand;
    }
  }

  function draw(c, g, geo, col, fx, now, reduce, dpr) {
    const { W, H, kbH, keys } = geo, hitY = H - kbH, bpb = g.bpb, look = LOOK_BARS * bpb, ppb = hitY / look, beat = g.beat;
    const key = W + "x" + H + "|" + col.stage + col.siteDark + "|" + dpr + "|" + kbH;
    if (fx.key !== key) { prepare(fx, c, geo, col, dpr); fx.key = key; }
    const G = fx.g, dark = col.dark, bh = kbH * 0.62;
    const dt = fx.lastNow ? Math.min(0.05, (now - fx.lastNow) / 1000) : 0.016; fx.lastNow = now;

    c.clearRect(0, 0, W, H);
    c.drawImage(fx.bg, 0, 0, fx.bg.width, fx.bg.height, 0, 0, W, hitY);

    // beat + bar lines, bar-number pills
    const beat0 = Math.max(0, Math.floor(beat));
    for (let b = beat0; b <= beat + look + 1e-6 && b < g.totalBeats; b++) {
      const y = Math.round(hitY - (b - beat) * ppb);
      if (y < 0 || y > hitY) continue;
      if (b % bpb) { c.fillStyle = col.beatLine; c.fillRect(0, y, W, 1); }
    }
    c.font = "600 10px " + FONT; c.textBaseline = "middle"; c.textAlign = "center";
    for (let k = Math.max(0, Math.floor(beat / bpb)); k * bpb <= beat + look + 1e-6 && k * bpb < g.totalBeats; k++) {
      const y = Math.round(hitY - (k * bpb - beat) * ppb);
      if (y < 0 || y > hitY) continue;
      c.fillStyle = col.barLine; c.fillRect(0, y, W, 1);
      const lab = String(k + 1), pw = lab.length * 6.5 + 12;
      c.fillStyle = col.pill; rr(c, 6, y + 4, pw, 16, 8); c.fill();
      c.fillStyle = col.pillText; c.fillText(lab, 6 + pw / 2, y + 12.5);
    }
    c.textAlign = "left";

    // notes
    fx.lit.fill(null); fx.wait.fill(0);
    if (g.waiting && g.waitChord) {
      const wn = g.waitChord.notes;
      for (let i = 0; i < wn.length; i++) if (wn[i].status === "pending") fx.wait[wn[i].midi] = wn[i].hand === "R" ? 1 : 2;
    }
    const notes = g.notes, labelsOn = g.opts.labels;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.start > beat + look) break;
      const k = keys[n.midi]; if (!k) continue;
      const scored = isScored(g, n), hnd = n.hand === "R" ? HANDS.R : HANDS.L;
      // events: new hit -> sparks; new miss -> red flash
      if (n.status !== n._seen) {
        if (n._seen !== undefined && n.status === "miss" && scored && beat >= n.start && beat - n.start < 1.5 * bpb) fx.missT[n.midi] = now;
        n._seen = n.status;
      }
      if (n.status === "hit" && n.hitAt && n.hitAt === g.flash[n.midi] && fx.seen[n.midi] !== n.hitAt) {
        fx.seen[n.midi] = n.hitAt; fx.hand[n.midi] = hnd.idx;
        if (!reduce) spawnSparks(fx, k.x + k.w / 2, hitY - 2, hnd.idx, now);
      }
      const end = n.start + n.dur;
      if (end < beat) continue;
      const playing = n.start <= beat + 1e-6 && beat < end;
      if (playing) { fx.lit[n.midi] = hnd; fx.litFade[n.midi] = scored ? 0 : 1; }
      const yb = Math.min(hitY, hitY - (n.start - beat) * ppb) - 1.5;
      const yt = Math.max(-6, hitY - (end - beat) * ppb);
      const h = Math.max(6, yb - yt), x = k.x + 1.5, w = k.w - 3, y0 = yb - h;
      if (w < 2) continue;
      const r = Math.min(6, w / 3, h / 2);
      const missed = n.status === "miss", hit = n.status === "hit";
      c.globalAlpha = !scored ? 0.3 : missed ? 0.5 : hit ? 0.5 : 1;
      // glow strengthens as the note nears the hit line (dark) / soft drop shadow (light)
      if (scored && !missed && !hit) {
        if (dark) {
          const dist = hitY - yb, prox = playing ? 1 : dist <= 0 ? 1 : Math.max(0, 1 - dist / (ppb * bpb));
          if (reduce) { c.shadowColor = hnd.glow; c.shadowBlur = 6; }
          else if (prox > 0.02) { c.shadowColor = hnd.glow; c.shadowBlur = 4 + 18 * prox; }
        } else { c.shadowColor = "rgba(25,35,70,0.28)"; c.shadowBlur = 6; c.shadowOffsetY = 2; }
      } else if (!dark && scored) { c.shadowColor = "rgba(25,35,70,0.18)"; c.shadowBlur = 4; c.shadowOffsetY = 1.5; }
      rr(c, x, y0, w, h, r);
      c.save(); c.translate(0, y0); c.scale(1, h / 100);
      c.fillStyle = missed ? G.miss : n.hand === "R" ? G.R : G.L; c.fill();
      c.restore();
      c.shadowBlur = 0; c.shadowOffsetY = 0;
      // 1px inner highlight
      rr(c, x + 0.5, y0 + 0.5, w - 1, h - 1, Math.max(0, r - 0.5));
      c.strokeStyle = "rgba(255,255,255,0.34)"; c.lineWidth = 1; c.stroke();
      if (missed && scored) { c.strokeStyle = hnd.flat; c.setLineDash([3, 3]); c.lineWidth = 1.5; rr(c, x, y0, w, h, r); c.stroke(); c.setLineDash([]); }
      // note name in a small rounded label near the bottom of the bar
      if (labelsOn && h >= 18 && w >= 8 && w < 17) {
        // narrow keys (phones): plain bold letter, no pill
        const lab = n._lab || (n._lab = FC.midiToLetter(n.midi));
        const fs = Math.max(8, Math.min(12, Math.floor(lab.length > 1 ? w * 0.72 : w * 0.85)));
        c.fillStyle = "#fff"; c.font = "700 " + fs + "px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(lab, x + w / 2, yb - 4 - fs / 2);
        c.textAlign = "left";
      } else if (labelsOn && h >= 26 && w >= 17) {
        const lab = n._lab || (n._lab = FC.midiToLetter(n.midi));
        const fs = Math.max(11, Math.min(13, Math.floor(w * 0.42))), lw = Math.min(w - 4, lab.length * fs * 0.62 + 10);
        const ly = yb - 5 - 16;
        c.fillStyle = "rgba(6,10,28,0.34)"; rr(c, x + w / 2 - lw / 2, ly, lw, 16, 8); c.fill();
        c.fillStyle = "#fff"; c.font = "600 " + fs + "px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(lab, x + w / 2, ly + 8.5);
        c.textAlign = "left";
      }
      c.globalAlpha = 1;
    }

    // light beams above keys that were just played right
    const comp = c.globalCompositeOperation;
    if (!reduce) {
      if (dark) c.globalCompositeOperation = "lighter";
      const list = geo.whites;
      for (let pass = 0; pass < 2; pass++) {
        const arr = pass ? fx.blackL : list;
        for (let i = 0; i < arr.length; i++) {
          const m = arr[i], t = g.flash[m];
          if (!t) continue;
          const a = 1 - (now - t) / FLASH_MS;
          if (a <= 0) continue;
          const k = keys[m];
          c.globalAlpha = (dark ? 0.9 : 0.6) * a; c.fillStyle = fx.hand[m] ? G.beamL : G.beamR;
          c.fillRect(k.x + 1, hitY - 120, k.w - 2, 120);
        }
      }
      c.globalAlpha = 1; c.globalCompositeOperation = comp;
    }

    // hit line
    if (dark) {
      c.fillStyle = G.glow; c.fillRect(0, hitY - 36, W, 36);
      c.shadowColor = "rgba(120,160,255,0.95)"; c.shadowBlur = 14;
      c.fillStyle = "#a9c0ff"; c.fillRect(0, hitY - 2, W, 2.5);
      c.shadowBlur = 0;
    } else {
      c.fillStyle = "rgba(39,98,224,0.75)"; c.fillRect(0, hitY - 2, W, 2.5);
    }

    // wait mode: expected notes pulse at the hit line
    const pulse = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 220);
    for (let m = geo.a; m <= geo.b; m++) {
      const wv = fx.wait[m]; if (!wv) continue;
      const k = keys[m], hnd = wv === 1 ? HANDS.R : HANDS.L;
      c.shadowColor = hnd.glow; c.shadowBlur = dark ? 18 : 8; c.globalAlpha = 0.35 + 0.6 * pulse;
      c.fillStyle = hnd.flat; rr(c, k.x + 1.5, hitY - 9, k.w - 3, 7, 3.5); c.fill();
      c.shadowBlur = 0; c.globalAlpha = 1;
    }

    // keyboard base + white keys
    c.fillStyle = "#a7a6b4"; c.fillRect(0, hitY, W, kbH);
    const wl = geo.whites;
    for (let i = 0; i < wl.length; i++) {
      const m = wl[i], k = keys[m], L = fx.lit[m], fa = g.flash[m] ? Math.max(0, 1 - (now - g.flash[m]) / FLASH_MS) : 0;
      const ma = fx.missT[m] ? Math.max(0, 1 - (now - fx.missT[m]) / MISS_MS) : 0;
      const press = (L && !fx.litFade[m]) || fa > 0.5 ? 2 : 0;
      rrBottom(c, k.x + 0.5, hitY + press, k.w - 1, kbH - press - 0.5, 4);
      c.fillStyle = G.white; c.fill();
      if (L) { c.globalAlpha = fx.litFade[m] ? 0.28 : 0.8; c.fillStyle = L.flat; c.fill(); }
      if (fa > 0) { c.globalAlpha = fa * 0.9; c.fillStyle = HAND_BY_IDX[fx.hand[m]].flat; c.fill(); }
      if (ma > 0) { c.globalAlpha = ma * 0.85; c.fillStyle = RED; c.fill(); }
      if (fx.wait[m]) { c.globalAlpha = 0.18 + 0.3 * pulse; c.fillStyle = fx.wait[m] === 1 ? HANDS.R.flat : HANDS.L.flat; c.fill(); }
      c.globalAlpha = 1;
    }
    c.fillStyle = G.top; c.fillRect(0, hitY, W, 10);
    // C labels + middle-C dot
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    for (let i = 0; i < wl.length; i++) {
      const m = wl[i]; if (m % 12 !== 0) continue;
      const k = keys[m]; if (k.w < 13) continue;
      c.fillStyle = "#9a9aa9"; c.font = "600 10px " + FONT;
      c.fillText("C" + (Math.floor(m / 12) - 1), k.x + k.w / 2, hitY + kbH - 7);
      if (m === 60) { c.fillStyle = "#2762e0"; c.beginPath(); c.arc(k.x + k.w / 2, hitY + kbH - 22, 2.8, 0, 6.2832); c.fill(); }
    }
    c.textAlign = "left";
    // black keys
    const bl = fx.blackL;
    for (let i = 0; i < bl.length; i++) {
      const m = bl[i], k = keys[m], L = fx.lit[m], fa = g.flash[m] ? Math.max(0, 1 - (now - g.flash[m]) / FLASH_MS) : 0;
      const ma = fx.missT[m] ? Math.max(0, 1 - (now - fx.missT[m]) / MISS_MS) : 0;
      const press = (L && !fx.litFade[m]) || fa > 0.5 ? 1.5 : 0;
      c.fillStyle = "rgba(0,0,0,0.26)"; c.fillRect(k.x + 2, hitY, k.w, bh + 2 - press);
      rrBottom(c, k.x, hitY + press, k.w, bh - press, 3.5);
      c.fillStyle = G.black; c.fill();
      if (L) { c.globalAlpha = fx.litFade[m] ? 0.35 : 0.88; c.fillStyle = L.flat; c.fill(); }
      if (fa > 0) { c.globalAlpha = fa * 0.9; c.fillStyle = HAND_BY_IDX[fx.hand[m]].flat; c.fill(); }
      if (ma > 0) { c.globalAlpha = ma * 0.9; c.fillStyle = RED; c.fill(); }
      if (fx.wait[m]) { c.globalAlpha = 0.25 + 0.4 * pulse; c.fillStyle = fx.wait[m] === 1 ? HANDS.R.flat : HANDS.L.flat; c.fill(); }
      c.globalAlpha = 1;
      c.fillStyle = "rgba(255,255,255,0.22)"; c.fillRect(k.x + 1.5, hitY + press, k.w - 3, 1.5);
      c.fillStyle = "rgba(255,255,255,0.07)"; c.fillRect(k.x + k.w * 0.18, hitY + press + 4, k.w * 0.2, bh * 0.72);
    }

    // sparkles
    if (!reduce) {
      for (let i = 0; i < SPARKS; i++) {
        const t0 = fx.sT[i]; if (!t0) continue;
        const age = now - t0;
        if (age >= SPARK_LIFE) { fx.sT[i] = 0; continue; }
        const s = age / 1000;
        const x = fx.sx[i] + fx.svx[i] * s, y = fx.sy[i] + fx.svy[i] * s + 260 * s * s;
        const life = 1 - age / SPARK_LIFE;
        c.globalAlpha = life; c.fillStyle = dark ? (fx.sH[i] ? "#b8fff2" : "#d3e0ff") : (fx.sH[i] ? "#0f8a7e" : "#2762e0");
        const z = fx.sz[i] * (0.5 + 0.5 * life);
        c.shadowColor = fx.sH[i] ? HANDS.L.glow : HANDS.R.glow; c.shadowBlur = dark ? 6 : 0;
        c.beginPath(); c.arc(x, y, z, 0, 6.2832); c.fill();
      }
      c.shadowBlur = 0; c.globalAlpha = 1;
    }
    void dt;
  }

  /* ------------------------------------------------------------ small UI bits */
  const ICONS = {
    play: <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z" fill="currentColor" stroke="none" />,
    pause: <g fill="currentColor" stroke="none"><rect x="6" y="4.5" width="4.2" height="15" rx="1.4" /><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4" /></g>,
    restart: <g><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3.5 4.5v4.8h4.8" /></g>,
    moon: <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.8 6.8 0 0 0 9.7 9.7z" />,
    sun: <g><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></g>,
    expand: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
    compress: <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />,
    gear: <g><path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></g>,
    back: <path d="M19 12H5M11 18l-6-6 6-6" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    upload: <path d="M12 15.5V4M7.5 8.5L12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />,
    mic: <g><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></g>,
  };
  const Icon = ({ n, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ICONS[n]}</svg>
  );

  const Star = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.6l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.5l-5.9 3.3 1.2-6.6L2.4 9.6l6.7-.9z" /></svg>
  );
  /* gold stars. Song cards show only the stars earned; the result card shows all three popping in. */
  const Stars = ({ n, pop }) => (
    <span className={"fn-stars" + (pop ? " pop" : "")} role="img" aria-label={n + (n === 1 ? " star" : " stars") + " out of 3"}>
      {(pop ? [1, 2, 3] : Array.from({ length: n }, (_, i) => i + 1)).map((i) => (
        <span key={i} className={i <= n ? "on" : ""} style={pop ? { animationDelay: 0.25 + (i - 1) * 0.28 + "s" } : null} aria-hidden="true"><Star /></span>
      ))}
    </span>
  );

  /* toolbar toggle chip: a real checkbox laid over the whole chip */
  function Chip({ label, checked, onChange }) {
    return (
      <label className={"fn-tchip" + (checked ? " on" : "")}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="fn-tchip-face"><span className="fn-tick" aria-hidden="true"><Icon n="check" size={12} /></span>{label}</span>
      </label>
    );
  }
  /* settings switch (also a real checkbox) */
  function Switch({ label, checked, onChange, hint }) {
    return (
      <label className="fn-switch">
        <span className="fn-switch-text"><span>{label}</span>{hint ? <small>{hint}</small> : null}</span>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="fn-switch-track" aria-hidden="true"><span /></span>
      </label>
    );
  }
  function Seg({ label, value, options, onChange, className }) {
    return (
      <div className={"fn-seg " + (className || "")} role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
        ))}
      </div>
    );
  }

  const FS_OK = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

  /* ------------------------------------------------------------ settings drawer */
  function SettingsDrawer({ onClose, s }) {
    const panel = React.useRef(null);
    React.useEffect(() => {
      const p = panel.current, prev = document.activeElement;
      const first = p && p.querySelector("button, input, [tabindex]");
      if (first) first.focus();
      const onKey = (e) => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); return; }
        if (e.key !== "Tab" || !p) return;
        const f = Array.prototype.filter.call(p.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])"), (el) => !el.disabled && el.offsetParent !== null);
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (!p.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
        else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      };
      document.addEventListener("keydown", onKey, true);
      return () => {
        document.removeEventListener("keydown", onKey, true);
        if (prev && prev.focus && document.contains(prev)) prev.focus();
      };
    }, []);
    return (
      <div className="fn-drawer-layer">
        <div className="fn-backdrop" onClick={onClose} aria-hidden="true" />
        <aside className="fn-drawer" role="dialog" aria-modal="true" aria-labelledby="fn-drawer-title" ref={panel}>
          <header className="fn-drawer-head">
            <h2 id="fn-drawer-title">Settings</h2>
            <button type="button" className="fn-icon-btn" aria-label="Close settings" onClick={onClose}><Icon n="close" /></button>
          </header>
          <div className="fn-drawer-body">
            <section className="fn-sec" aria-labelledby="fn-sec-practice">
              <h3 id="fn-sec-practice">Practice</h3>
              <Switch label="Wait for me" checked={s.wait} onChange={s.setWait} hint="The song stops until you play the notes." />
              <Switch label="Metronome" checked={s.metro} onChange={s.setMetro} />
              <Switch label="Loop some bars" checked={s.loop} onChange={s.setLoop} />
              {s.loop ? (
                <div className="fn-loop">
                  <label>From bar <input type="number" inputMode="numeric" min="1" max={s.totalBars} value={s.loopStart} onChange={(e) => s.setBar("s", e.target.value)} /></label>
                  <label>to bar <input type="number" inputMode="numeric" min="1" max={s.totalBars} value={s.loopEnd} onChange={(e) => s.setBar("e", e.target.value)} /></label>
                </div>
              ) : null}
            </section>
            <section className="fn-sec" aria-labelledby="fn-sec-display">
              <h3 id="fn-sec-display">Display</h3>
              <Switch label="Note names" checked={s.labels} onChange={s.setLabels} />
              <div className="fn-row">
                <span className="fn-row-label">Stage</span>
                <Seg label="Stage" value={s.stage} onChange={s.setStage} options={[["dark", "Dark"], ["light", "Light"]]} />
              </div>
            </section>
            <section className="fn-sec" aria-labelledby="fn-sec-mic">
              <h3 id="fn-sec-mic">Microphone</h3>
              <div className="fn-row">
                <span className="fn-row-label">Sensitivity</span>
                <Seg label="Microphone sensitivity" value={s.sens} onChange={s.setSens} options={SENS_KEYS.map((k, i) => [i, SENS_LABELS[i]])} />
              </div>
              <p className="fn-note">High hears quiet playing. Low ignores more noise.</p>
              <div className="fn-miccheck">
                <div className="fn-miccheck-top">
                  <strong>Mic check: play middle C</strong>
                  {s.micOk ? <span className="fn-ok"><Icon n="check" size={14} /> Heard C4</span> : null}
                </div>
                <div className="fn-meter" role="meter" aria-label="Sound level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round((s.listening ? s.level : 0) * 100)}>
                  <span style={{ width: Math.round((s.listening ? s.level : 0) * 100) + "%" }} />
                </div>
                <small className="text-soft">{s.listening ? "Play the C near the middle of the piano." : "Turn the microphone on to try this."}</small>
              </div>
              <button type="button" className="fn-textbtn" onClick={s.listening ? s.stopListening : s.startListening}>
                <Icon n="mic" size={16} /> {s.listening ? "Turn microphone off" : "Turn microphone on"}
              </button>
            </section>
            <section className="fn-sec" aria-labelledby="fn-sec-help">
              <h3 id="fn-sec-help">Help</h3>
              <Switch label="Play the other hand for me" checked={s.otherHand} onChange={s.setOtherHand} hint="Headphones help, so the mic does not hear it." />
            </section>
          </div>
        </aside>
      </div>
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
    const [stage, setStage] = React.useState(saved.stage === "light" ? "light" : "dark");
    const [otherHand, setOtherHand] = React.useState(false);
    const [loop, setLoop] = React.useState(false);
    const [loopStart, setLoopStart] = React.useState(1);
    const [loopEnd, setLoopEnd] = React.useState(totalBars);
    const [sens, setSens] = React.useState(typeof saved.sens === "number" ? saved.sens : 1);
    const [micErr, setMicErr] = React.useState("");
    const [listening, setListening] = React.useState(MIC.listening);
    const [drawer, setDrawer] = React.useState(false);
    const [isFs, setIsFs] = React.useState(false);
    const [fsOk] = React.useState(FS_OK);
    const [snap, setSnap] = React.useState({});
    const [size, setSize] = React.useState({ w: 360, h: 420 });
    const playerRef = React.useRef(null), wrapRef = React.useRef(null), canvasRef = React.useRef(null), bodyRef = React.useRef(null), gearRef = React.useRef(null);
    const detRef = React.useRef(null);
    if (!detRef.current) detRef.current = new FC.Detector(SENS_KEYS[sens]);
    const live = React.useRef({}); // mic readouts updated by the loop
    const stageRef = React.useRef(stage); stageRef.current = stage;
    const prevBest = React.useRef(0);
    const drawerRef = React.useRef(false); drawerRef.current = drawer;

    // push options into the engine; changing hands / wait starts the song over
    React.useEffect(() => {
      const o = g.opts, structural = o.hands !== hands || o.wait !== wait;
      Object.assign(o, { hands, wait, speed, metro, labels, otherHand, loop, loopStart, loopEnd });
      if (structural) { buildSets(g); resetAll(g); detRef.current.reset(); }
      else if (!g.playing && g.needCount) { g.beat = homeBeat(g); reindex(g); }
    }, [hands, wait, speed, metro, labels, otherHand, loop, loopStart, loopEnd]);
    React.useEffect(() => {
      detRef.current.setSens(SENS_KEYS[sens]);
      if (window.Students) window.Students.writeNS("fallingNotes.settings", { sens, wait, metro, labels, stage });
    }, [sens, wait, metro, labels, stage]);

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
      prevBest.current = bestPct(g.key, hands, wait);
      play(g);
      showStage();
    }
    /* keep the falling notes and the keyboard on screen while playing */
    function showStage() {
      const el = wrapRef.current; if (!el || fsElement()) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) {
        const smooth = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        el.scrollIntoView({ block: "end", behavior: smooth ? "smooth" : "auto" });
      }
    }
    function restart() { resetAll(g); detRef.current.reset(); }
    async function restartAndPlay() {
      if (!MIC.listening) { const ok = await startListening(); if (!ok) return; }
      prevBest.current = bestPct(g.key, hands, wait);
      resetAll(g); detRef.current.reset(); play(g); showStage();
    }
    const toggleRef = React.useRef(); toggleRef.current = togglePlay;

    function toggleFs() {
      const el = playerRef.current; if (!el) return;
      if (fsElement()) { const x = document.exitFullscreen || document.webkitExitFullscreen; if (x) { const p = x.call(document); if (p && p.catch) p.catch(() => {}); } return; }
      const f = el.requestFullscreen || el.webkitRequestFullscreen;
      if (f) { const p = f.call(el); if (p && p.catch) p.catch(() => {}); }
    }

    // keyboard: space plays / pauses
    React.useEffect(() => {
      const onKey = (e) => {
        if (e.code !== "Space" && e.key !== " ") return;
        if (drawerRef.current) return;
        const t = e.target, tag = t && t.tagName;
        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || (t && t.isContentEditable)) return;
        e.preventDefault(); toggleRef.current();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    // while the settings drawer is open the rest of the page is inert
    React.useEffect(() => {
      const el = bodyRef.current; if (!el) return;
      if (drawer) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
      else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
    }, [drawer]);

    // size
    React.useEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const measure = () => {
        const w = Math.max(280, Math.floor(el.clientWidth));
        let h;
        const fs = fsElement() === playerRef.current;
        if (fs) h = Math.max(260, Math.floor(window.innerHeight - el.getBoundingClientRect().top - 12));
        else h = Math.round(Math.max(300, Math.min(560, window.innerHeight - (window.innerWidth < 640 ? 300 : 190))));
        setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
      };
      const onFs = () => { setIsFs(fsElement() === playerRef.current); measure(); requestAnimationFrame(measure); };
      measure();
      let ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(el); }
      window.addEventListener("resize", measure);
      document.addEventListener("fullscreenchange", onFs);
      document.addEventListener("webkitfullscreenchange", onFs);
      return () => {
        if (ro) ro.disconnect(); window.removeEventListener("resize", measure);
        document.removeEventListener("fullscreenchange", onFs); document.removeEventListener("webkitfullscreenchange", onFs);
      };
    }, []);

    // main loop
    React.useEffect(() => {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let colors = stageColors(stageRef.current);
      const mo = new MutationObserver(() => { colors = stageColors(stageRef.current); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      const fx = createFx();
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
        if (g.finished && g.result && g.result.newBest === undefined) g.result.newBest = g.key !== "custom" && g.result.pct > 0 && g.result.pct > prevBest.current;
        // 3) draw
        if (cv) {
          const { w, h } = sizeRef.current, dpr = window.devicePixelRatio || 1;
          if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
          const c = cv.getContext("2d");
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (!g.geo || g.geo.W !== w || g.geo.H !== h) g.geo = makeGeo(g, w, h);
          if (colors.stage !== stageRef.current) colors = stageColors(stageRef.current);
          draw(c, g, g.geo, colors, fx, now, reduce, dpr);
        }
        // 4) UI snapshot
        if (now - lastUi > 100) {
          lastUi = now;
          const cn = counts(g);
          setSnap({
            playing: g.playing, waiting: g.waiting, finished: g.finished, result: g.result, count: g.countLeft > 0,
            countN: g.countLeft > 0 ? Math.max(1, Math.ceil(g.countLeft - 1e-9)) : 0, beat: g.beat,
            hits: cn.hits, misses: cn.misses, total: cn.total, bar: Math.max(1, Math.floor(Math.max(0, g.beat) / g.bpb) + 1),
            expected: g.waiting ? expectedNow(g).map(FC.midiToName) : [], waitedMs: g.waiting ? now - g.arrivedMs : 0,
            level: lv.level || 0, heard: lv.note != null && now - lv.noteAt < 900 ? FC.midiToName(lv.note) : "", heardAt: lv.noteAt || 0,
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

    // when the result card appears, put keyboard focus on "Play again"
    const resultRef = React.useRef(null);
    React.useEffect(() => {
      if (snap.finished && snap.result && resultRef.current) { const b = resultRef.current.querySelector("button"); if (b) b.focus({ preventScroll: true }); }
    }, [snap.finished && snap.result]);

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

    const done = (snap.hits || 0) + (snap.misses || 0);
    const acc = done ? Math.round(100 * (snap.hits || 0) / done) : null;
    const pos = Math.max(0, Math.min(1, (snap.beat || 0) / g.totalBeats));
    const sub = (meta.level || "Medium") + " · " + g.bpb + "/4 · " + g.bpm + " bpm";
    const atStart = !snap.playing && !snap.finished && !(g.beat > homeBeat(g) + 0.01);
    const lvl = Math.round((snap.level || 0) * 100);

    return (
      <div className={"fn-player" + (isFs ? " is-fs" : "")} data-stage={stage} ref={playerRef}>
        <div className="fn-body" ref={bodyRef}>
          <div className="fn-toolbar" role="toolbar" aria-label="Song controls">
            <div className="fn-tb-id">
              <button type="button" className="fn-back" onClick={onChangeSong}><Icon n="back" size={18} /> Songs</button>
              <div className="fn-title">
                <h2>{g.name}</h2>
                <span>{sub}</span>
              </div>
            </div>
            <div className="fn-tb-main">
              <button type="button" className="fn-play" onClick={togglePlay} aria-label={snap.playing ? "Pause" : "Play"} title={(snap.playing ? "Pause" : "Play") + " (space bar)"}>
                <Icon n={snap.playing ? "pause" : "play"} size={24} />
              </button>
              <button type="button" className="fn-icon-btn" onClick={restart} aria-label="Restart" title="Restart"><Icon n="restart" /></button>
              <div className="fn-stepper" role="group" aria-label="Speed">
                <button type="button" aria-label="Slower" onClick={() => setSpeedClamped(speed - 0.1)} disabled={speed <= 0.25}><Icon n="minus" size={16} /></button>
                <output aria-live="off">{Math.round(speed * 100)}%</output>
                <button type="button" aria-label="Faster" onClick={() => setSpeedClamped(speed + 0.1)} disabled={speed >= 1.5}><Icon n="plus" size={16} /></button>
              </div>
              <Seg label="Hands" value={hands} onChange={setHands} options={[["R", "Right"], ["L", "Left"], ["B", "Both"]]} />
              <Chip label="Wait for me" checked={wait} onChange={setWait} />
              <Chip label="Metronome" checked={metro} onChange={setMetro} />
            </div>
            <div className="fn-tb-end">
              <button type="button" className="fn-icon-btn" onClick={() => setStage(stage === "dark" ? "light" : "dark")}
                aria-label={stage === "dark" ? "Switch to light stage" : "Switch to dark stage"} title={stage === "dark" ? "Light stage" : "Dark stage"}>
                <Icon n={stage === "dark" ? "sun" : "moon"} />
              </button>
              {fsOk ? (
                <button type="button" className="fn-icon-btn" onClick={toggleFs} aria-label={isFs ? "Exit full screen" : "Full screen"} title={isFs ? "Exit full screen" : "Full screen"}>
                  <Icon n={isFs ? "compress" : "expand"} />
                </button>
              ) : null}
              <button type="button" className="fn-icon-btn" ref={gearRef} onClick={() => setDrawer(true)} aria-label="Settings" aria-haspopup="dialog" title="Settings"><Icon n="gear" /></button>
            </div>
          </div>

          <div className="fn-progress">
            <span className="fn-barlbl">Bar {Math.min(snap.bar || 1, totalBars)}<small>/{totalBars}</small></span>
            <div className="fn-timeline" role="progressbar" aria-label="Song progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(pos * 100)} style={{ "--bars": totalBars }}>
              {totalBars <= 120 ? <div className="fn-ticks" /> : null}
              {loop ? <div className="fn-loopzone" style={{ left: ((Math.max(1, loopStart) - 1) / totalBars) * 100 + "%", width: ((Math.max(loopStart, loopEnd) - Math.max(1, loopStart) + 1) / totalBars) * 100 + "%" }} /> : null}
              <div className="fn-fill" style={{ width: pos * 100 + "%" }} />
              <div className="fn-head" style={{ left: pos * 100 + "%" }} />
            </div>
            <div className="fn-prog-end">
              <span className="fn-score" aria-label="Notes right so far">
                <strong>{snap.hits || 0}</strong><span> / {snap.total || 0}</span>
                {acc != null ? <em>{acc}%</em> : null}
              </span>
              {listening ? (
                <span className="fn-mic on" style={{ "--lvl": lvl / 100 }}><i aria-hidden="true" /> Listening</span>
              ) : (
                <button type="button" className="fn-mic" onClick={startListening}><i aria-hidden="true" /> Start listening</button>
              )}
              {listening && !snap.playing && snap.heard ? <span className="fn-heard" key={snap.heardAt} aria-live="polite">Heard {snap.heard}</span> : null}
            </div>
          </div>
          {micErr ? <p className="fn-error" role="alert">{micErr}</p> : null}
          <div className="sr-only" aria-live="polite">{status}{snap.lastPass != null ? " Last loop: " + snap.lastPass + "%" : ""}</div>

          <div className="fn-stage" ref={wrapRef}>
            <canvas ref={canvasRef} role="img" tabIndex={0}
              aria-label={"Falling notes for " + g.name + ". " + status}
              style={{ width: size.w + "px", height: size.h + "px" }} />
            {snap.waiting && expectedText ? (
              <div className="fn-floatwrap">
                <span className="fn-waitchip"><i aria-hidden="true" /> Play: {expectedText}</span>
                {snap.waitedMs > 6000 ? (
                  <button type="button" className="fn-skip" onClick={() => { if (g.waitChord) g.waitChord.notes.forEach((n) => { if (n.status === "pending") n.status = "miss"; }); }}>Skip this note</button>
                ) : null}
              </div>
            ) : null}
            {snap.count && snap.countN ? <div className="fn-count" aria-hidden="true"><span key={snap.countN}>{snap.countN}</span></div> : null}
            {atStart ? <div className="fn-idle"><span>Press Play to start</span></div> : null}
            {snap.finished && snap.result ? (
              <div className="fn-result" role="dialog" aria-label="Your result" ref={resultRef}>
                <div className="fn-result-card">
                  <Stars n={snap.result.stars} pop />
                  <h3>{snap.result.stars === 3 ? "Brilliant!" : snap.result.stars === 2 ? "Great job!" : snap.result.stars === 1 ? "Nice work!" : "Keep practising!"}</h3>
                  <div className="fn-pct">{snap.result.pct}<small>%</small></div>
                  <p>{snap.result.hits} of {snap.result.total} notes</p>
                  {snap.result.newBest ? <span className="fn-newbest">New best!</span> : null}
                  <div className="fn-result-actions">
                    <button type="button" className="btn btn-primary" onClick={restartAndPlay}>Play again</button>
                    <button type="button" className="btn btn-ghost" onClick={onChangeSong}>Pick another song</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {drawer ? (
          <SettingsDrawer onClose={() => setDrawer(false)} s={{
            wait, setWait, metro, setMetro, loop, setLoop, loopStart, loopEnd, setBar, totalBars,
            labels, setLabels, stage, setStage, sens, setSens, listening, level: snap.level || 0, micOk: !!snap.micOk,
            startListening, stopListening, otherHand, setOtherHand,
          }} />
        ) : null}
      </div>
    );
  }

  /* ------------------------------------------------------------ song list */
  const thumbCache = {};
  function thumbPaths(meta) {
    if (thumbCache[meta.key]) return thumbCache[meta.key];
    const m = modelOf(meta), W = 200, H = 52, padY = 6, total = Math.max(1, m.totalBeats);
    let lo = 127, hi = 0;
    m.events.forEach((e) => { if (e.midi < lo) lo = e.midi; if (e.midi > hi) hi = e.midi; });
    const rows = Math.max(14, hi - lo + 1), rowH = (H - padY * 2) / rows, off = (rows - (hi - lo + 1)) / 2;
    const out = { R: "", L: "" };
    m.events.forEach((e) => {
      const x = e.start / total * W, w = Math.max(1.4, e.dur / total * W - 0.5);
      const y = padY + (hi - e.midi + off) * rowH, h = Math.max(2.4, rowH - 0.2);
      out[e.hand] += "M" + x.toFixed(1) + " " + y.toFixed(1) + "h" + w.toFixed(1) + "v" + h.toFixed(1) + "h-" + w.toFixed(1) + "z";
    });
    return (thumbCache[meta.key] = { ...out, bpb: m.bpb, W, H });
  }
  function Thumb({ meta }) {
    const t = thumbPaths(meta);
    return (
      <svg className="fn-thumb" viewBox={"0 0 " + t.W + " " + t.H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={t.L} fill="#34e0c4" opacity="0.92" />
        <path d={t.R} fill="#6f9bff" opacity="0.95" />
      </svg>
    );
  }
  function byline(s) {
    const raw = ((s.song && s.song.note) || "").split("·")[0].replace(/\(.*?\)/g, "").trim();
    if (!raw) return "Piano";
    if (/^traditional/i.test(raw)) return "Traditional";
    if (/^original/i.test(raw)) return "Original exercise";
    return raw;
  }

  /* ------------------------------------------------------------ page */
  function FallingNotes({ year, onBack }) {
    const [meta, setMeta] = React.useState(null);
    const [msg, setMsg] = React.useState("");
    const [filter, setFilter] = React.useState("All");
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

    const LEVELS = ["Easy", "Medium", "Hard"];
    const count = (l) => songs.filter((s) => s.level === l).length;
    const shown = songs.filter((s) => filter === "All" || s.level === filter)
      .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));

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
          <div className="fn-list">
            <header className="fn-listhead">
              <h1>Falling Notes</h1>
              <p>Pick a song, then play along on a real piano. The mic listens.</p>
            </header>

            <div className="fn-listbar">
              <div className="fn-filters" role="group" aria-label="Filter songs by level">
                {["All"].concat(LEVELS).map((l) => (
                  <button key={l} type="button" aria-pressed={filter === l} onClick={() => setFilter(l)}>
                    {l} <span>{l === "All" ? songs.length : count(l)}</span>
                  </button>
                ))}
              </div>
              <div className="fn-open">
                <button type="button" className="fn-textbtn" onClick={() => fileRef.current && fileRef.current.click()}>
                  <Icon n="upload" size={16} /> Open your own MIDI file
                </button>
                <input ref={fileRef} type="file" accept=".mid,.midi,audio/midi" className="sr-only" aria-label="Open a MIDI file" tabIndex={-1}
                  onChange={(e) => { openFile(e.target.files && e.target.files[0]); e.target.value = ""; }} />
              </div>
            </div>
            {msg ? <p className="fn-error" role="alert">{msg}</p> : null}

            <ul className="fn-songs">
              {shown.map((s) => {
                const stars = bestStars(s.key), t = thumbPaths(s);
                return (
                  <li key={s.key}>
                    <button type="button" className="fn-card" onClick={() => setMeta(s)}>
                      <Thumb meta={s} />
                      <span className="fn-card-body">
                        <span className="fn-card-name">{s.name}</span>
                        <span className="fn-card-by">{byline(s)}</span>
                        <span className="fn-card-meta">
                          <span className={"chip " + (s.level === "Easy" ? "solid-teal" : s.level === "Medium" ? "solid-butter" : "solid-terracotta")}>{s.level}</span>
                          <span className="chip">{t.bpb}/4</span>
                          {stars > 0 ? <Stars n={stars} /> : <span className="fn-new">New</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  window.FallingNotes = FallingNotes;
})();
