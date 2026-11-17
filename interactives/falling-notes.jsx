/* Falling Notes: a piano trainer with falling notes that LISTENS through the mic.
   It runs as its own full-window app inside the site (song library + player).
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
  const LOOK_S = 0.12;        // the app's own notes are booked this far ahead on the audio clock, so their timing never depends on the frame rate
  const WAIT_LATE_S = 2.5;    // wait mode: notes later than this count as misses
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
    // class arrangements packed from MIDI files (lib/falling-midi-songs.jsx)
    const packed = window.FALLING_SONGS_MIDI || {};
    Object.keys(packed).forEach((k) => {
      const s = packed[k], m = s.m;
      out.push({
        key: k, name: s.name, tag: s.tag, level: s.level || "Hard", song: { note: s.note },
        // m.tm: the song's own tempo changes, [[beat, bpm], ...]. A 5th number on a note is how long it rings with the pedal down.
        model: { bpb: m.b, bpm: m.p, totalBeats: m.t, sig: m.s || null, tempo: m.tm || null, events: m.e.map((e) => ({ midi: e[0], start: e[1], dur: e[2], hand: e[3] ? "L" : "R", ring: e[4] || 0 })) },
      });
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
  const saveSettings = (patch) => { if (window.Students) window.Students.writeNS("fallingNotes.settings", Object.assign({}, readSettings(), patch)); };

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
      totalBeats: model.totalBeats, notes, sig: model.sig || null, tempo: model.tempo || null,
      opts: { hands: "B", wait: true, speed: 1, metro: false, labels: true, otherHand: false, demo: false, loop: false, loopStart: 1, loopEnd: model.totalBeats / model.bpb },
      flash: {}, tap: {}, geo: null,
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
    g.sndIdx = g.notes.findIndex((n) => n.start >= b); if (g.sndIdx < 0) g.sndIdx = g.notes.length;
    g.lastInt = Math.ceil(g.beat - 1e-9) - 1;
  }
  function resetAll(g) {
    g.notes.forEach((n) => { n.status = "pending"; n.late = false; });
    g.playing = false; g.waiting = false; g.waitChord = null; g.finished = false; g.result = null;
    g.needCount = true; g.countLeft = 0; g.beat = homeBeat(g); g.flash = {}; g.tap = {}; g.lastPass = null; g.ignoreUntil = 0;
    g.jumped = false; g.countNext = false;
    reindex(g);
  }
  /* Move to another place in the song. Notes from there on can be played again.
     Notes that were jumped over count as skipped: they are left out of the score,
     and a run with skipped notes is a practice run (no stars, no best score). */
  function seek(g, b) {
    b = Math.max(0, Math.min(g.totalBeats - 0.001, b));
    g.notes.forEach((n) => {
      if (n.start >= b - 1e-6) { n.status = "pending"; n.late = false; }
      else if (n.status === "pending") { n.status = "skip"; if (isScored(g, n)) g.jumped = true; }
    });
    g.beat = b; g.waiting = false; g.waitChord = null; g.finished = false; g.result = null;
    g.countLeft = 0; g.needCount = false; g.countNext = !g.playing; g.flash = {}; g.ignoreUntil = 0;
    reindex(g);
  }
  function resetRange(g, a, b) { g.notes.forEach((n) => { if (n.start >= a - 1e-6 && n.start < b - 1e-6) { n.status = "pending"; n.late = false; } }); }
  const chordDone = (c) => c.notes.every((n) => n.status !== "pending");
  function counts(g) {
    let hits = 0, misses = 0, skips = 0;
    g.scored.forEach((n) => { if (n.status === "hit") hits++; else if (n.status === "miss") misses++; else if (n.status === "skip") skips++; });
    return { hits, misses, total: g.scored.length - skips };
  }
  const pctOf = (c) => (c.total ? Math.round((c.hits / c.total) * 100) : 0);

  /* beats per second right now: the song's tempo (which may change along the way) times the speed setting */
  function bpsOf(g) {
    let bpm = g.bpm; const t = g.tempo;
    if (t && t.length) {
      let i = g.tempoIdx || 0;
      if (i >= t.length || t[i][0] > g.beat) i = 0;
      while (i + 1 < t.length && t[i + 1][0] <= g.beat) i++;
      g.tempoIdx = i; bpm = t[i][1];
    }
    return bpm * g.opts.speed / 60;
  }
  /* how long a model lasts in seconds */
  function songSecs(m) {
    const t = m.tempo;
    if (!t || !t.length) return (m.totalBeats / m.bpm) * 60;
    let s = 0;
    for (let i = 0; i < t.length; i++) { const a = i ? t[i][0] : 0, z = i + 1 < t.length ? t[i + 1][0] : m.totalBeats; if (z > a) s += (z - a) / t[i][1] * 60; }
    return s;
  }

  function play(g) {
    if (g.finished) resetAll(g);
    if (g.needCount || g.countNext) { g.needCount = false; g.countNext = false; g.countLeft = g.bpb; g.lastCountInt = g.bpb + 1; }
    g.playing = true;
  }
  function pause(g) { g.playing = false; }

  /* The app's own notes: every note in "Play it for me", else the other hand.
     Each is booked a moment ahead for its exact time, so the rhythm stays even
     on a slow screen. A note rings for as long as the pedal holds it (n.ring). */
  function bookSounds(g, bps, now, H, endB) {
    const o = g.opts;
    let ahead = g.beat + LOOK_S * bps;
    if (g.waiting) ahead = g.beat;
    else if (o.wait && !o.demo && g.chordIdx < g.chords.length) ahead = Math.min(ahead, g.chords[g.chordIdx].start);
    if (o.loop) ahead = Math.min(ahead, endB - 1e-6);
    while (g.sndIdx < g.notes.length && g.notes[g.sndIdx].start <= ahead + 1e-9) {
      const n = g.notes[g.sndIdx++];
      if (o.demo || (o.otherHand && !isScored(g, n))) {
        H.playNote(n.midi, Math.max(0.3, Math.max(n.dur, n.ring || 0) / bps), o.demo ? 0.5 : 0.7, now + Math.max(0, (n.start - g.beat) / bps) * 1000);
      }
    }
  }

  function update(g, dt, now, H) {
    if (!g.playing) return;
    const o = g.opts, bps = bpsOf(g), tolB = TOL_S * bps;
    // count-in
    if (g.countLeft > 0) {
      g.countLeft -= dt * bps;
      const ci = Math.ceil(g.countLeft - 1e-9);
      if (ci < g.lastCountInt && ci >= 1) { g.lastCountInt = ci; H.click(ci === g.bpb); g.ignoreUntil = now + 70; }
      if (g.countLeft <= 0) {
        // the song starts now: its first notes are booked from this exact moment
        g.countLeft = 0; reindex(g);
        bookSounds(g, bps, now, H, o.loop ? Math.min(g.totalBeats, Math.max(o.loopStart, o.loopEnd) * g.bpb) : g.totalBeats);
      }
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
      if (o.demo) {
        // "Play it for me": nothing is scored (the sound itself is booked further down)
        c.notes.forEach((n) => {
          if (n.status !== "pending") return;
          n.status = "hit"; n.hitAt = now; g.flash[n.midi] = now;
        });
        continue;
      }
      if (o.wait && !chordDone(c)) { nb = Math.max(g.beat, c.start); g.waiting = true; g.waitChord = c; g.arrivedMs = now; break; }
    }
    g.beat = nb;
    // metronome
    const fl = Math.floor(g.beat + 1e-9);
    while (g.lastInt < fl) {
      g.lastInt++;
      if (o.metro) { H.click(((g.lastInt % g.bpb) + g.bpb) % g.bpb === 0); g.ignoreUntil = now + 70; }
    }
    const endB = o.loop ? Math.min(g.totalBeats, Math.max(o.loopStart, o.loopEnd) * g.bpb) : g.totalBeats;
    bookSounds(g, bps, now, H, endB);
    if (g.waiting) return;
    // misses (free-play mode)
    if (!o.wait) g.scored.forEach((n) => { if (n.status === "pending" && n.start + tolB < g.beat) n.status = "miss"; });
    // loop / finish
    if (o.loop) {
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
      if (o.demo) { g.result = null; return; }
      const c = counts(g), pct = pctOf(c);
      const practice = !!g.jumped;
      g.result = { pct, stars: practice ? 0 : FC.starsFor(pct), hits: c.hits, total: c.total, practice };
      if (g.key !== "custom" && !practice) saveBest(g.key, o.hands, o.wait, pct);
      H.finished(g.result);
    }
  }

  /* a note was heard `age` seconds ago */
  function onHeard(g, midi, now, age) {
    if (!g.playing || g.countLeft > 0) return false;
    const bps = bpsOf(g), tolB = TOL_S * bps;
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
    const bps = bpsOf(g), a = g.beat - 0.6 * bps, b = g.beat + 1.0 * bps;
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
  const WHITE_PC = { 0: 1, 2: 1, 4: 1, 5: 1, 7: 1, 9: 1, 11: 1 };
  const isWhite = (m) => !!WHITE_PC[((m % 12) + 12) % 12];
  const KEY_RATIO = 5;   // white key height : width. A real key is about 6.4 : 1.
  const BLACK_SHIFT = { 1: -0.1, 3: 0.1, 6: -0.13, 8: 0, 10: 0.13 }; // black keys sit a little off-centre, as on a real piano

  /* The keyboard is sized first and the number of keys follows from real key
     proportions, so a wide screen shows more octaves instead of fatter keys.
     `coarse` = touch screen: keys stay wide enough for a finger. */
  function makeGeo(g, W, H, coarse) {
    let lo = 127, hi = 0;
    g.notes.forEach((n) => { if (n.midi < lo) lo = n.midi; if (n.midi > hi) hi = n.midi; });
    if (lo > hi) { lo = 60; hi = 72; }
    lo = Math.max(21, Math.min(108, lo)); hi = Math.max(21, Math.min(108, hi));
    if (!isWhite(lo)) lo--;
    if (!isWhite(hi)) hi++;
    const down = (m) => { do m--; while (!isWhite(m)); return m; };
    const up = (m) => { do m++; while (!isWhite(m)); return m; };
    let a = lo, b = hi, have = 0;
    for (let m = a; m <= b; m++) if (isWhite(m)) have++;
    let kbH = Math.round(Math.max(84, Math.min(240, H * (H < 420 ? 0.36 : 0.27))));
    const want = Math.max(have + 2, Math.min(52, Math.round(W / Math.max(kbH / KEY_RATIO, coarse ? 26 : 0))));
    let flip = 0;
    while (have < want) {
      const canUp = b < 108, canDown = a > 21;
      if (!canUp && !canDown) break;
      if ((flip++ % 2 === 0 && canUp) || !canDown) b = up(b); else a = down(a);
      have++;
    }
    const whites = [];
    for (let m = a; m <= b; m++) if (isWhite(m)) whites.push(m);
    const kw = W / whites.length, idx = {};
    kbH = Math.round(Math.max(72, Math.min(kbH, kw * 6.4)));
    whites.forEach((m, i) => { idx[m] = i; });
    const keys = {};
    whites.forEach((m) => { keys[m] = { x: idx[m] * kw, w: kw, black: false }; });
    const bw = kw * 0.58;
    for (let m = a + 1; m < b; m++) {
      if (isWhite(m)) continue;
      keys[m] = { x: (idx[m - 1] + 1) * kw - bw / 2 + (BLACK_SHIFT[m % 12] || 0) * bw, w: bw, black: true };
    }
    return { W, H, a, b, whites, kw, keys, kbH, blackH: Math.round(kbH * 0.63) };
  }

  /* which key is at (x, y) on the canvas? null above the keyboard */
  function keyAt(geo, x, y) {
    if (!geo) return null;
    const hitY = geo.H - geo.kbH;
    if (y < hitY || y > geo.H || x < 0 || x >= geo.W) return null;
    if (y < hitY + geo.blackH) {
      for (let m = geo.a; m <= geo.b; m++) { const k = geo.keys[m]; if (k && k.black && x >= k.x && x < k.x + k.w) return m; }
    }
    const m = geo.whites[Math.min(geo.whites.length - 1, Math.floor(x / geo.kw))];
    return m == null ? null : m;
  }
  const fmtTime = (sec) => Math.floor(sec / 60) + ":" + String(Math.round(sec) % 60).padStart(2, "0");

  /* ------------------------------------------------------------ stage look (canvas) */
  const FONT = '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
  /* right hand = blue, left hand = orange: far apart in hue and still distinct for colour-blind students */
  const HANDS = {
    R: { top: "#7aa2ff", bot: "#2c5fe6", topB: "#4f78e6", botB: "#1c45b8", glow: "rgba(91,140,255,0.95)", flat: "#5b8cff", deep: "#2c5fe6", beam: "91,140,255", idx: 0 },
    L: { top: "#ffc46b", bot: "#f0871f", topB: "#f2a23c", botB: "#c96a12", glow: "rgba(255,166,61,0.9)", flat: "#ffa63d", deep: "#e8801a", beam: "255,166,61", idx: 1 },
  };
  const HAND_BY_IDX = [HANDS.R, HANDS.L];
  const RED = "#ef4444";
  const SPARKS = 192, SPARK_LIFE = 450, FLASH_MS = 450, MISS_MS = 380, TAP_MS = 240;

  function stageColors(stage) {
    const dark = stage === "dark";
    return {
      stage, dark,
      top: dark ? "#05070f" : "#fbfaf7",
      bot: dark ? "#131a36" : "#eeece4",
      barLine: dark ? "rgba(255,255,255,0.09)" : "rgba(30,40,70,0.13)",
      beatLine: dark ? "rgba(255,255,255,0.03)" : "rgba(30,40,70,0.05)",
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
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.closePath();
  }
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  /* everything that only changes with size / theme is built once here */
  function prepare(fx, c, geo, col, dpr) {
    const { W, H, kbH, keys, kw } = geo, hitY = H - kbH, bh = geo.blackH, dark = col.dark;
    const bg = fx.bg || (fx.bg = document.createElement("canvas"));
    bg.width = Math.max(1, Math.round(W * dpr)); bg.height = Math.max(1, Math.round(hitY * dpr));
    const b = bg.getContext("2d");
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = b.createLinearGradient(0, 0, 0, hitY);
    sky.addColorStop(0, col.top); sky.addColorStop(1, col.bot);
    b.fillStyle = sky; b.fillRect(0, 0, W, hitY);
    // every second octave is a touch lighter, so each C is easy to find
    geo.whites.forEach((m) => {
      if (m % 12 !== 0 || (Math.floor(m / 12) % 2)) return;
      b.fillStyle = dark ? "rgba(255,255,255,0.022)" : "rgba(30,40,70,0.022)";
      b.fillRect(keys[m].x, 0, Math.min(W - keys[m].x, kw * 7), hitY);
    });
    fx.blackL = [];
    for (let m = geo.a; m <= geo.b; m++) if (keys[m] && keys[m].black) fx.blackL.push(m);
    // black-key lanes a touch darker
    b.fillStyle = dark ? "rgba(0,0,0,0.24)" : "rgba(30,40,70,0.03)";
    fx.blackL.forEach((m) => { b.fillRect(keys[m].x, 0, keys[m].w, hitY); });
    // lane lines, brighter at each C
    geo.whites.forEach((m) => {
      const x = Math.round(keys[m].x);
      const isC = m % 12 === 0;
      b.fillStyle = dark ? (isC ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.028)") : (isC ? "rgba(30,40,70,0.15)" : "rgba(30,40,70,0.05)");
      b.fillRect(x, 0, 1, hitY);
    });
    // soft light rising from the keyboard, and a darker top edge
    if (dark) {
      const riseH = Math.min(260, hitY * 0.55), rise = b.createLinearGradient(0, hitY - riseH, 0, hitY);
      rise.addColorStop(0, "rgba(91,140,255,0)"); rise.addColorStop(1, "rgba(91,140,255,0.13)");
      b.fillStyle = rise; b.fillRect(0, hitY - riseH, W, riseH);
      const topH = Math.min(120, hitY * 0.3), top = b.createLinearGradient(0, 0, 0, topH);
      top.addColorStop(0, "rgba(0,0,0,0.5)"); top.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = top; b.fillRect(0, 0, W, topH);
    }
    const g = {};
    const ng = (stops) => { const q = c.createLinearGradient(0, 0, 0, 100); stops.forEach((s) => q.addColorStop(s[0], s[1])); return q; };
    g.R = ng([[0, HANDS.R.top], [1, HANDS.R.bot]]);
    g.L = ng([[0, HANDS.L.top], [1, HANDS.L.bot]]);
    g.Rb = ng([[0, HANDS.R.topB], [1, HANDS.R.botB]]);   // notes on black keys are a shade deeper
    g.Lb = ng([[0, HANDS.L.topB], [1, HANDS.L.botB]]);
    g.miss = ng([[0, "#9aa1b8"], [1, "#6c7390"]]);
    const kg = (y0, y1, stops) => { const q = c.createLinearGradient(0, y0, 0, y1); stops.forEach((s) => q.addColorStop(s[0], s[1])); return q; };
    g.white = kg(hitY, hitY + kbH, [[0, "#f3f3f7"], [0.08, "#ffffff"], [0.8, "#f4f4f8"], [1, "#dcdce6"]]);
    g.litR = kg(hitY, hitY + kbH, [[0, "#8fb1ff"], [1, HANDS.R.deep]]);
    g.litL = kg(hitY, hitY + kbH, [[0, "#ffd595"], [1, HANDS.L.deep]]);
    g.black = kg(hitY, hitY + bh, [[0, "#2c2c36"], [0.8, "#17171d"], [1, "#07070a"]]);
    g.blackTop = kg(hitY, hitY + bh, [[0, "#565664"], [0.12, "#3a3a46"], [1, "#24242c"]]);
    g.top = kg(hitY, hitY + 16, [[0, "rgba(0,0,0,0.42)"], [1, "rgba(0,0,0,0)"]]);
    g.lip = kg(hitY + kbH - 10, hitY + kbH, [[0, "rgba(20,24,50,0)"], [1, "rgba(20,24,50,0.2)"]]);
    g.glow = kg(hitY - 40, hitY, [[0, "rgba(91,140,255,0)"], [1, "rgba(91,140,255,0.22)"]]);
    [["beamR", HANDS.R], ["beamL", HANDS.L]].forEach(([k, h]) => {
      g[k] = kg(hitY - 150, hitY, [[0, "rgba(" + h.beam + ",0)"], [1, "rgba(" + h.beam + ",0.6)"]]);
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
    const { W, H, kbH, keys, kw } = geo, hitY = H - kbH, bpb = g.bpb, look = LOOK_BARS * bpb, ppb = hitY / look, beat = g.beat;
    const key = W + "x" + H + "|" + col.stage + "|" + dpr + "|" + kbH + "|" + geo.a + "-" + geo.b;
    if (fx.key !== key) { prepare(fx, c, geo, col, dpr); fx.key = key; }
    const G = fx.g, dark = col.dark, bh = geo.blackH;
    fx.lastNow = now;

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
      if (y < 56) continue; // keep clear of the readouts at the top of the stage
      const lab = String(k + 1), pw = lab.length * 6.5 + 12;
      c.fillStyle = col.pill; rr(c, 6, y - 20, pw, 16, 8); c.fill();
      c.fillStyle = col.pillText; c.fillText(lab, 6 + pw / 2, y - 11.5);
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
      const pad = k.black ? 0.5 : Math.min(2.5, k.w * 0.09);
      const h = Math.max(6, yb - yt), x = k.x + pad, w = k.w - pad * 2, y0 = yb - h;
      if (w < 2) continue;
      const r = Math.min(7, w / 2.6, h / 2);
      const missed = n.status === "miss", hit = n.status === "hit" || n.status === "skip";
      c.globalAlpha = !scored ? 0.3 : missed ? 0.5 : hit ? 0.45 : 1;
      // glow strengthens as the note nears the hit line (dark) / soft drop shadow (light)
      if (scored && !missed && !hit) {
        if (dark) {
          const dist = hitY - yb, prox = playing ? 1 : dist <= 0 ? 1 : Math.max(0, 1 - dist / (ppb * bpb));
          if (reduce) { c.shadowColor = hnd.glow; c.shadowBlur = 6; }
          else if (prox > 0.02) { c.shadowColor = hnd.glow; c.shadowBlur = 4 + 20 * prox; }
        } else { c.shadowColor = "rgba(25,35,70,0.28)"; c.shadowBlur = 6; c.shadowOffsetY = 2; }
      } else if (!dark && scored) { c.shadowColor = "rgba(25,35,70,0.18)"; c.shadowBlur = 4; c.shadowOffsetY = 1.5; }
      rr(c, x, y0, w, h, r);
      c.save(); c.translate(0, y0); c.scale(1, h / 100);
      c.fillStyle = missed ? G.miss : n.hand === "R" ? (k.black ? G.Rb : G.R) : (k.black ? G.Lb : G.L); c.fill();
      c.restore();
      c.shadowBlur = 0; c.shadowOffsetY = 0;
      // glass edge + a soft shine down the left side
      rr(c, x + 0.5, y0 + 0.5, w - 1, h - 1, Math.max(0, r - 0.5));
      c.strokeStyle = "rgba(255,255,255,0.36)"; c.lineWidth = 1; c.stroke();
      if (w >= 12 && h >= 12) { c.fillStyle = "rgba(255,255,255,0.17)"; rr(c, x + 2, y0 + 3, Math.max(2, w * 0.16), h - 6, 2); c.fill(); }
      if (missed && scored) { c.strokeStyle = hnd.flat; c.setLineDash([3, 3]); c.lineWidth = 1.5; rr(c, x, y0, w, h, r); c.stroke(); c.setLineDash([]); }
      // note name in a small rounded label near the bottom of the bar
      if (labelsOn && h >= 18 && w >= 8 && w < 17) {
        // narrow keys (phones): plain bold letter, no pill
        const lab = n._lab || (n._lab = nameIn(g, n.midi));
        const fs = Math.max(8, Math.min(12, Math.floor(lab.length > 1 ? w * 0.72 : w * 0.85)));
        c.fillStyle = "#fff"; c.font = "700 " + fs + "px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(lab, x + w / 2, yb - 4 - fs / 2);
        c.textAlign = "left";
      } else if (labelsOn && h >= 26 && w >= 17) {
        const lab = n._lab || (n._lab = nameIn(g, n.midi));
        const fs = Math.max(11, Math.min(13, Math.floor(w * 0.42))), lw = Math.min(w - 4, lab.length * fs * 0.62 + 10);
        const ly = yb - 5 - 16;
        c.fillStyle = "rgba(6,10,28,0.36)"; rr(c, x + w / 2 - lw / 2, ly, lw, 16, 8); c.fill();
        c.fillStyle = "#fff"; c.font = "600 " + fs + "px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(lab, x + w / 2, ly + 8.5);
        c.textAlign = "left";
      }
      c.globalAlpha = 1;
    }

    // light beams and a bloom above keys that were just played right
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
          const k = keys[m], hd = HAND_BY_IDX[fx.hand[m]];
          c.globalAlpha = (dark ? 0.9 : 0.6) * a; c.fillStyle = fx.hand[m] ? G.beamL : G.beamR;
          c.fillRect(k.x + 1, hitY - 150, k.w - 2, 150);
          const cx = k.x + k.w / 2, rad = Math.max(26, kw * 1.5) * (1.25 - 0.25 * a);
          const bloom = c.createRadialGradient(cx, hitY, 0, cx, hitY, rad);
          bloom.addColorStop(0, "rgba(" + hd.beam + ",0.75)"); bloom.addColorStop(1, "rgba(" + hd.beam + ",0)");
          c.globalAlpha = (dark ? 0.85 : 0.5) * a; c.fillStyle = bloom;
          c.fillRect(cx - rad, hitY - rad, rad * 2, rad);
        }
      }
      c.globalAlpha = 1; c.globalCompositeOperation = comp;
    }

    // hit line
    if (dark) {
      c.fillStyle = G.glow; c.fillRect(0, hitY - 40, W, 40);
      c.shadowColor = "rgba(120,160,255,0.95)"; c.shadowBlur = 16;
      c.fillStyle = "#b9ccff"; c.fillRect(0, hitY - 2.5, W, 2.5);
      c.shadowBlur = 0;
    } else {
      c.fillStyle = "rgba(39,98,224,0.75)"; c.fillRect(0, hitY - 2.5, W, 2.5);
    }

    // wait mode: expected notes pulse at the hit line
    const pulse = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 220);
    for (let m = geo.a; m <= geo.b; m++) {
      const wv = fx.wait[m]; if (!wv) continue;
      const k = keys[m], hnd = wv === 1 ? HANDS.R : HANDS.L;
      c.shadowColor = hnd.glow; c.shadowBlur = dark ? 18 : 8; c.globalAlpha = 0.35 + 0.6 * pulse;
      c.fillStyle = hnd.flat; rr(c, k.x + 1.5, hitY - 10, k.w - 3, 7, 3.5); c.fill();
      c.shadowBlur = 0; c.globalAlpha = 1;
    }

    // ---- keyboard: slab, white keys, felt strip, names, black keys ----
    c.fillStyle = "#0b0c12"; c.fillRect(0, hitY, W, kbH);
    const wl = geo.whites, gap = kw >= 14 ? 1.2 : 0.6, wr = Math.min(5, kw * 0.16);
    for (let i = 0; i < wl.length; i++) {
      const m = wl[i], k = keys[m], L = fx.lit[m], fa = g.flash[m] ? Math.max(0, 1 - (now - g.flash[m]) / FLASH_MS) : 0;
      const ma = fx.missT[m] ? Math.max(0, 1 - (now - fx.missT[m]) / MISS_MS) : 0;
      const tp = g.tap[m] ? Math.max(0, 1 - (now - g.tap[m]) / TAP_MS) : 0;
      const press = (L && !fx.litFade[m]) || fa > 0.5 || tp > 0.35 ? 3 : 0;
      rrBottom(c, k.x + gap / 2, hitY + press, k.w - gap, kbH - press - 1.5, wr);
      c.fillStyle = G.white; c.fill();
      if (tp > 0) { c.globalAlpha = 0.2 * tp; c.fillStyle = "#1e2846"; c.fill(); }
      if (L) { c.globalAlpha = fx.litFade[m] ? 0.28 : 0.9; c.fillStyle = L === HANDS.R ? G.litR : G.litL; c.fill(); }
      if (fa > 0) { c.globalAlpha = fa * 0.9; c.fillStyle = fx.hand[m] ? G.litL : G.litR; c.fill(); }
      if (ma > 0) { c.globalAlpha = ma * 0.85; c.fillStyle = RED; c.fill(); }
      if (fx.wait[m]) { c.globalAlpha = 0.2 + 0.32 * pulse; c.fillStyle = fx.wait[m] === 1 ? HANDS.R.flat : HANDS.L.flat; c.fill(); }
      c.globalAlpha = 1;
    }
    c.fillStyle = G.lip; c.fillRect(0, hitY + kbH - 10, W, 10);
    c.fillStyle = G.top; c.fillRect(0, hitY, W, 16);
    // key names (C keys always, the rest when "Note names" is on and keys are wide enough) + middle-C dot
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    const allNames = labelsOn && kw >= 22, fsz = kw >= 30 ? 11 : 10, ly = hitY + kbH - Math.max(8, kbH * 0.07);
    for (let i = 0; i < wl.length; i++) {
      const m = wl[i], isC = m % 12 === 0;
      if (!isC && !allNames) continue;
      const k = keys[m]; if (k.w < 13) continue;
      const on = fx.lit[m] && !fx.litFade[m];
      c.fillStyle = on ? "rgba(255,255,255,0.96)" : isC ? "#7c7c8e" : "#b0b0bf"; c.font = (isC ? "700 " : "600 ") + fsz + "px " + FONT;
      c.fillText(isC ? "C" + (Math.floor(m / 12) - 1) : FC.midiToLetter(m), k.x + k.w / 2, ly);
      if (m === 60) { c.fillStyle = on ? "#fff" : "#2762e0"; c.beginPath(); c.arc(k.x + k.w / 2, ly - fsz - 6, 3, 0, 6.2832); c.fill(); }
    }
    c.textAlign = "left";
    // black keys: shadow, body, lighter top face that leaves a front edge
    const bl = fx.blackL;
    for (let i = 0; i < bl.length; i++) {
      const m = bl[i], k = keys[m], L = fx.lit[m], fa = g.flash[m] ? Math.max(0, 1 - (now - g.flash[m]) / FLASH_MS) : 0;
      const ma = fx.missT[m] ? Math.max(0, 1 - (now - fx.missT[m]) / MISS_MS) : 0;
      const tp = g.tap[m] ? Math.max(0, 1 - (now - g.tap[m]) / TAP_MS) : 0;
      const press = (L && !fx.litFade[m]) || fa > 0.5 || tp > 0.35 ? 2 : 0;
      c.fillStyle = "rgba(0,0,0,0.32)"; rrBottom(c, k.x + 1, hitY, k.w + 2.5, bh + 4 - press, 3.5); c.fill();
      rrBottom(c, k.x, hitY + press, k.w, bh - press, 3.5);
      c.fillStyle = G.black; c.fill();
      const lit = L || fa > 0 || ma > 0 || fx.wait[m];
      const ins = Math.max(1, k.w * 0.13), front = Math.max(4, bh * 0.09);
      if (!lit && k.w >= 9) { rrBottom(c, k.x + ins, hitY + press, k.w - ins * 2, bh - press - front, 2.5); c.fillStyle = G.blackTop; c.fill(); rrBottom(c, k.x, hitY + press, k.w, bh - press, 3.5); }
      if (tp > 0) { c.globalAlpha = 0.3 * tp; c.fillStyle = "#fff"; c.fill(); }
      if (L) { c.globalAlpha = fx.litFade[m] ? 0.35 : 0.92; c.fillStyle = L === HANDS.R ? G.litR : G.litL; c.fill(); }
      if (fa > 0) { c.globalAlpha = fa * 0.9; c.fillStyle = HAND_BY_IDX[fx.hand[m]].flat; c.fill(); }
      if (ma > 0) { c.globalAlpha = ma * 0.9; c.fillStyle = RED; c.fill(); }
      if (fx.wait[m]) { c.globalAlpha = 0.25 + 0.4 * pulse; c.fillStyle = fx.wait[m] === 1 ? HANDS.R.flat : HANDS.L.flat; c.fill(); }
      c.globalAlpha = 1;
      c.fillStyle = "rgba(255,255,255,0.2)"; c.fillRect(k.x + ins + 0.5, hitY + press + 3, Math.max(1, k.w * 0.12), (bh - press - front) * 0.8);
    }
    // red felt strip where the keys meet the stage
    c.fillStyle = "#7d1626"; c.fillRect(0, hitY, W, 3);
    c.fillStyle = "rgba(255,255,255,0.14)"; c.fillRect(0, hitY, W, 1);

    // sparkles
    if (!reduce) {
      for (let i = 0; i < SPARKS; i++) {
        const t0 = fx.sT[i]; if (!t0) continue;
        const age = now - t0;
        if (age >= SPARK_LIFE) { fx.sT[i] = 0; continue; }
        const s = age / 1000;
        const x = fx.sx[i] + fx.svx[i] * s, y = fx.sy[i] + fx.svy[i] * s + 260 * s * s;
        const life = 1 - age / SPARK_LIFE;
        c.globalAlpha = life; c.fillStyle = dark ? (fx.sH[i] ? "#ffe6bf" : "#d3e0ff") : (fx.sH[i] ? "#c96a0a" : "#2762e0");
        const z = fx.sz[i] * (0.5 + 0.5 * life);
        c.shadowColor = fx.sH[i] ? HANDS.L.glow : HANDS.R.glow; c.shadowBlur = dark ? 6 : 0;
        c.beginPath(); c.arc(x, y, z, 0, 6.2832); c.fill();
      }
      c.shadowBlur = 0; c.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------ stave (optional strip of written music) */
  /* The same notes as the falling bars, written on a stave that scrolls past a
     "now" line. Right hand = treble, left hand = bass, in the hand colours.
     Kept simple on purpose: no rests, no beams (short notes carry flags), no ties. */
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];   // C D E F G A B (also the steps of a major scale)
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6];  // F C G D A E B
  const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];   // B E A D G C F
  const STAFF_BOT = { treble: 30, bass: 18 };  // bottom line as a step number: E4 and G2 (C4 = 28)
  const KEYSIG_STEP = { sharp: [38, 35, 39, 36, 33, 37, 34], flat: [34, 37, 33, 36, 32, 35, 31] }; // treble; bass is 14 lower
  /* note values in beats (a beat = a crotchet): [beats, head, dots, flags] */
  const VALUES = [[6, "w", 1, 0], [4, "w", 0, 0], [3, "h", 1, 0], [2, "h", 0, 0], [1.5, "q", 1, 0], [1, "q", 0, 0],
    [0.75, "q", 1, 1], [0.5, "q", 0, 1], [0.375, "q", 1, 2], [0.25, "q", 0, 2], [0.125, "q", 0, 3],
    [2 / 3, "q", 0, 0, 3], [1 / 3, "q", 0, 1, 3], [1 / 6, "q", 0, 2, 3]] // triplets: three in the time of two
    .map((v, i) => ({ id: i, beats: v[0], head: v[1], dots: v[2], flags: v[3], trip: !!v[4] }));
  function noteValue(beats, triplet) {
    let best = VALUES[0], bd = 1e9;
    VALUES.forEach((v) => {
      if (v.trip && !triplet) return; // triplet values only for notes that really sit on a triplet grid
      const d = Math.abs(Math.log2(Math.max(0.01, beats) / v.beats)); if (d < bd) { bd = d; best = v; }
    });
    return best;
  }
  /* the key signature that fits the song best: -6 (six flats) to 6 (six sharps) */
  function guessKey(notes) {
    const count = new Array(12).fill(0);
    notes.forEach((n) => { count[((n.midi % 12) + 12) % 12]++; });
    let best = 0, bestScore = -1;
    [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6].forEach((k) => {
      const tonic = (((k * 7) % 12) + 12) % 12;
      let sc = 0;
      LETTER_PC.forEach((pc) => { sc += count[(tonic + pc) % 12]; });
      if (sc > bestScore) { bestScore = sc; best = k; }
    });
    return best;
  }
  /* how a note is written in a key: its line or space (step) and whether it is sharp (1), flat (-1) or natural (0) */
  function spell(midi, keyAlt, k) {
    const pc = ((midi % 12) + 12) % 12;
    const mk = (L, alt) => ({ step: (Math.floor((midi - alt) / 12) - 1) * 7 + L, alt });
    for (let L = 0; L < 7; L++) if ((((LETTER_PC[L] + keyAlt[L]) % 12) + 12) % 12 === pc) return mk(L, keyAlt[L]); // a note of the key
    for (let L = 0; L < 7; L++) if (LETTER_PC[L] === pc) return mk(L, 0);                                        // a white note the key changes
    const a = k < 0 ? -1 : 1;
    for (let L = 0; L < 7; L++) if ((((LETTER_PC[L] + a) % 12) + 12) % 12 === pc) return mk(L, a);                 // outside the key
    return mk(0, 0);
  }
  const ledgerCount = (p, st) => (p > STAFF_BOT[st] + 8 ? Math.floor((p - STAFF_BOT[st] - 8) / 2) : p < STAFF_BOT[st] ? Math.floor((STAFF_BOT[st] - p) / 2) : 0);

  /* a note's name in the song's key, so the bars, the prompts and the stave agree
     (in a flat key the black note below E is Eb, not D#) */
  function nameIn(g, midi, withOctave) {
    if (g.keyK === undefined) {
      g.keyK = guessKey(g.notes); g.keyAlt = new Array(7).fill(0);
      (g.keyK > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, Math.abs(g.keyK)).forEach((L) => { g.keyAlt[L] = g.keyK > 0 ? 1 : -1; });
    }
    const sp = spell(midi, g.keyAlt, g.keyK), L = ((sp.step % 7) + 7) % 7;
    return "CDEFGAB"[L] + (sp.alt > 0 ? "#" : sp.alt < 0 ? "b" : "") + (withOctave ? Math.floor(sp.step / 7) : "");
  }

  /* work out, once per song, how every note is written */
  function buildStave(g) {
    const notes = g.notes, bpb = g.bpb;
    const sig = g.sig || [bpb, 4];
    const q = bpb / ((sig[0] * 4) / sig[1]); // the song's beats per crotchet: 1 as a rule, 2 when it counts in quavers
    const k = guessKey(notes), keyAlt = new Array(7).fill(0);
    (k > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, Math.abs(k)).forEach((L) => { keyAlt[L] = k > 0 ? 1 : -1; });
    const hasR = notes.some((n) => n.hand === "R"), hasL = notes.some((n) => n.hand === "L");
    const mode = hasR && hasL ? "both" : hasL ? "bass" : "treble";
    // when a key was let go a little early, the next note in the same hand tells us the written length
    const nextStart = new Map();
    ["R", "L"].forEach((h) => {
      const hs = notes.filter((n) => n.hand === h);
      let j = 0;
      for (let i = 0; i < hs.length; i++) { while (j < hs.length && hs[j].start <= hs[i].start + 0.03) j++; if (j < hs.length) nextStart.set(hs[i], hs[j].start); }
    });
    const inBar = {}, groups = new Map(), items = [];
    let minBeats = 4 * q;
    notes.forEach((n) => {
      const sp = spell(n.midi, keyAlt, k);
      let staff = mode === "both" ? (n.hand === "R" ? "treble" : "bass") : mode;
      if (mode === "both") {
        const other = staff === "treble" ? "bass" : "treble";
        if (ledgerCount(sp.step, staff) > 3 && ledgerCount(sp.step, other) < ledgerCount(sp.step, staff)) staff = other;
      }
      // very high or very low notes are written an octave (or two) closer, with an 8va mark
      let step = sp.step, ott = 0;
      while (ledgerCount(step, staff) > 4) { const high = step > STAFF_BOT[staff] + 8; step += high ? -7 : 7; ott += high ? 1 : -1; }
      // an accidental is written once and then lasts until the bar line
      const bar = Math.floor(n.start / bpb + 1e-6), key = bar + "|" + staff + "|" + step;
      const inForce = key in inBar ? inBar[key] : keyAlt[((sp.step % 7) + 7) % 7];
      const acc = sp.alt === inForce ? null : sp.alt;
      inBar[key] = sp.alt;
      const gap = nextStart.has(n) ? nextStart.get(n) - n.start : 0;
      // a length that is already a proper note value is kept (the gap after it is a rest);
      // a slightly short one, as people really play, is written up to the next note
      const own = n.dur / q, from = n.start / q, to = from + own, on = (x, d) => Math.abs(x * d - Math.round(x * d)) < 0.04;
      const triplet = (!on(from, 8) || !on(to, 8)) && on(from, 12) && on(to, 12); // on the grid of thirds, off the ordinary one
      const proper = VALUES.some((v) => (!v.trip || triplet) && Math.abs(own / v.beats - 1) < 0.07);
      const val = noteValue(!proper && gap > 0 && gap <= 4.5 * q && n.dur >= 0.55 * gap ? gap / q : own, triplet);
      if (val.beats * q < minBeats) minBeats = val.beats * q;
      const gk = staff + "|" + Math.round(n.start * 32) + "|" + val.id;
      let it = groups.get(gk);
      if (!it) { it = { start: n.start, staff, val, heads: [] }; groups.set(gk, it); items.push(it); }
      it.heads.push({ n, step, ott, acc });
    });
    items.forEach((it) => {
      it.heads.sort((a, b) => a.step - b.step);
      const mid = STAFF_BOT[it.staff] + 4, lo = it.heads[0].step, hi = it.heads[it.heads.length - 1].step;
      it.up = (mid - lo) > (hi - mid); // stem goes up when the notes sit low on the stave
    });
    items.sort((a, b) => a.start - b.start);
    const compound = sig[1] === 8 && sig[0] % 3 === 0; // 3/8, 6/8, 9/8, 12/8: quavers go in threes
    const unit = (compound ? 1.5 : 1) * q;              // one beam group, in the song's beats
    const staves = mode === "both" ? ["treble", "bass"] : [mode];
    const grid = (t) => Math.round(t * 8) / 8;

    // beams: short notes inside one beat are joined by a beam instead of each carrying a flag
    staves.forEach((st) => {
      const list = items.filter((it) => it.staff === st), together = new Map();
      list.forEach((it) => { const key = Math.round(it.start * 32); together.set(key, (together.get(key) || 0) + 1); });
      let run = [];
      const flush = () => {
        if (run.length > 1) {
          const mid = STAFF_BOT[st] + 4; let far = 0;
          run.forEach((it) => { [it.heads[0].step, it.heads[it.heads.length - 1].step].forEach((p) => { if (Math.abs(p - mid) > Math.abs(far)) far = p - mid; }); });
          const beam = { items: run, up: far < 0, frame: -1, drawn: -1 };
          run.forEach((it) => { it.beam = beam; it.up = beam.up; });
        }
        run = [];
      };
      list.forEach((it) => {
        const ok = it.val.flags > 0 && together.get(Math.round(it.start * 32)) === 1, prev = run[run.length - 1];
        if (prev && ok && Math.floor(grid(it.start) / unit + 1e-6) === Math.floor(grid(prev.start) / unit + 1e-6)
          && Math.abs(it.start - (prev.start + prev.val.beats * q)) < 0.09) run.push(it);
        else { flush(); if (ok) run.push(it); }
      });
      flush();
    });
    // notes a step apart cannot share a column: the second one sits on the other side of the stem
    items.forEach((it) => {
      let prev = null;
      if (it.up) it.heads.forEach((h) => { h.side = prev && h.step - prev.step === 1 && !prev.side ? 1 : 0; prev = h; });
      else for (let i = it.heads.length - 1; i >= 0; i--) { const h = it.heads[i]; h.side = prev && prev.step - h.step === 1 && !prev.side ? -1 : 0; prev = h; }
    });

    // rests: the silences in each hand, bar by bar. A song played freely (not on the
    // beat grid) only gets its longer rests, or the stave would fill with tiny ones.
    let onGrid = 0;
    notes.forEach((n) => { if (Math.abs(n.start * 4 - Math.round(n.start * 4)) < 0.13) onGrid++; });
    const freeTime = notes.length > 0 && onGrid / notes.length < 0.85;
    const rests = [], bars = Math.round(g.totalBeats / bpb), sizes = compound ? [3, 1.5, 0.5, 0.25] : [4, 2, 1, 0.5, 0.25];
    staves.forEach((st) => {
      const spans = items.filter((it) => it.staff === st).map((it) => { const a = Math.round(it.start * 4) / 4; return [a, a + it.val.beats * q]; }).sort((x, y) => x[0] - y[0]);
      let si = 0;
      for (let b = 0; b < bars; b++) {
        const b0 = b * bpb, b1 = b0 + bpb, gaps = [];
        while (si < spans.length && spans[si][1] <= b0 + 0.01) si++;
        let p = b0;
        for (let i = si; i < spans.length && spans[i][0] < b1 - 0.01; i++) {
          if (spans[i][0] > p + 0.01) gaps.push([p, spans[i][0]]);
          p = Math.max(p, Math.min(b1, spans[i][1]));
        }
        if (p < b1 - 0.01) gaps.push([p, b1]);
        if (gaps.length === 1 && gaps[0][0] <= b0 + 0.01 && gaps[0][1] >= b1 - 0.01) { rests.push({ staff: st, start: b0, beats: 4, len: bpb, bar: true }); continue; }
        gaps.forEach(([a, z]) => {
          let at = a;
          while (z - at > 0.2 * q) {
            let v = 0; // the rest's value in crotchets; it lasts v * q of the song's beats
            for (const o of sizes) { const r = (at - b0) / (o * q); if (o * q <= z - at + 0.01 && Math.abs(r - Math.round(r)) < 0.02) { v = o; break; } }
            if (!v) break;
            if (!(freeTime && v < 1)) rests.push({ staff: st, start: at, beats: v, len: v * q, bar: false });
            at += v * q;
          }
        });
      }
    });
    rests.sort((a, b) => a.start - b.start);
    return { k, mode, items, rests, sig, compound, minBeats: Math.max(0.25, minBeats) };
  }

  function staveColors(dark) {
    return dark
      ? { line: "rgba(255,255,255,0.44)", ink: "#eef1fb", soft: "rgba(238,241,251,0.5)", R: "#8fb1ff", L: "#ffc46b", bar: "rgba(255,255,255,0.3)", now: "#b9ccff", bg: "13,18,38", miss: "#ff7a7a" }
      : { line: "rgba(22,22,26,0.6)", ink: "#16161a", soft: "rgba(22,22,26,0.5)", R: "#2762e0", L: "#d9760f", bar: "rgba(22,22,26,0.32)", now: "#2762e0", bg: "255,255,255", miss: "#d92d20" };
  }
  /* clefs and accidentals are drawn as shapes (not font characters) so they look the same on every device.
     Units: 1 = the gap between two stave lines, y pointing up. */
  function drawTreble(c, x, yG, s, color) { // yG = the G line (second from the bottom)
    c.save(); c.translate(x, yG); c.scale(s, -s);
    c.strokeStyle = color; c.fillStyle = color; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 0.21;
    c.beginPath();
    c.moveTo(-0.42, -0.15);
    c.bezierCurveTo(-0.5, 0.45, 0.15, 0.75, 0.5, 0.3);
    c.bezierCurveTo(0.85, -0.2, 0.55, -0.95, -0.05, -0.98);
    c.bezierCurveTo(-0.75, -1.0, -1.15, -0.35, -1.0, 0.35);
    c.bezierCurveTo(-0.85, 1.1, -0.2, 1.6, 0.2, 2.3);
    c.bezierCurveTo(0.5, 2.85, 0.75, 3.5, 0.55, 4.0);
    c.bezierCurveTo(0.42, 4.35, 0.12, 4.4, -0.02, 4.0);
    c.bezierCurveTo(-0.2, 3.5, -0.08, 2.9, 0.0, 2.3);
    c.lineTo(0.38, -1.75);
    c.bezierCurveTo(0.45, -2.25, 0.2, -2.65, -0.15, -2.62);
    c.bezierCurveTo(-0.45, -2.6, -0.6, -2.3, -0.45, -2.1);
    c.stroke();
    c.beginPath(); c.arc(-0.36, -2.14, 0.2, 0, 6.2832); c.fill();
    c.restore();
  }
  function drawBass(c, x, yF, s, color) { // yF = the F line (second from the top)
    c.save(); c.translate(x, yF); c.scale(s, -s);
    c.strokeStyle = color; c.fillStyle = color; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 0.26;
    c.beginPath();
    c.moveTo(-0.72, 0.1);
    c.bezierCurveTo(-0.75, 0.8, -0.2, 1.05, 0.2, 0.95);
    c.bezierCurveTo(0.78, 0.8, 0.98, 0.15, 0.82, -0.55);
    c.bezierCurveTo(0.62, -1.5, -0.2, -2.3, -1.0, -2.72);
    c.stroke();
    c.beginPath(); c.arc(-0.56, 0.02, 0.3, 0, 6.2832); c.fill();
    c.beginPath(); c.arc(1.42, 0.5, 0.15, 0, 6.2832); c.arc(1.42, -0.5, 0.15, 0, 6.2832); c.fill();
    c.restore();
  }
  function drawAccidental(c, type, x, y, s, color) { // 1 sharp, -1 flat, 0 natural
    c.save(); c.translate(x, y); c.scale(s, -s);
    c.strokeStyle = color; c.lineCap = "butt"; c.lineJoin = "round";
    const line = (x1, y1, x2, y2, w) => { c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
    if (type === 1) {
      line(-0.17, -0.82, -0.17, 0.72, 0.085); line(0.17, -0.72, 0.17, 0.82, 0.085);
      line(-0.4, -0.4, 0.4, -0.16, 0.22); line(-0.4, 0.16, 0.4, 0.4, 0.22);
    } else if (type === -1) {
      line(-0.22, 1.3, -0.22, -0.5, 0.09);
      c.lineWidth = 0.15; c.beginPath(); c.moveTo(-0.22, 0.18);
      c.bezierCurveTo(0.12, 0.62, 0.52, 0.3, 0.32, -0.08);
      c.bezierCurveTo(0.18, -0.3, -0.08, -0.42, -0.22, -0.5); c.stroke();
    } else {
      line(-0.17, 0.9, -0.17, -0.42, 0.085); line(0.17, 0.42, 0.17, -0.9, 0.085);
      line(-0.17, 0.2, 0.17, 0.4, 0.22); line(-0.17, -0.4, 0.17, -0.2, 0.22);
    }
    c.restore();
  }

  /* rests, drawn as shapes. yMid = the middle line of the stave. */
  function drawRest(c, beats, x, yMid, s, color) {
    c.save(); c.translate(x, yMid); c.scale(s, -s);
    c.strokeStyle = color; c.fillStyle = color; c.lineJoin = "round";
    const stroke = (w, cap, fn) => { c.lineWidth = w; c.lineCap = cap; c.beginPath(); fn(); c.stroke(); };
    const dot = (dx, dy) => { c.beginPath(); c.arc(dx, dy, 0.15, 0, 6.2832); c.fill(); };
    if (beats >= 3.99) c.fillRect(-0.62, 0.5, 1.24, 0.5);                  // semibreve rest: hangs from the fourth line
    else if (beats >= 1.99) { c.fillRect(-0.62, 0, 1.24, 0.5); if (beats >= 2.99) dot(0.95, 0.25); } // minim rest: sits on the middle line
    else if (beats >= 0.99) {                                               // crotchet rest
      stroke(0.13, "round", () => { c.moveTo(-0.12, 1.5); c.lineTo(0.32, 0.82); });
      stroke(0.36, "butt", () => { c.moveTo(0.34, 0.86); c.lineTo(-0.24, 0.1); });
      stroke(0.13, "round", () => { c.moveTo(-0.22, 0.12); c.lineTo(0.3, -0.42); });
      stroke(0.2, "round", () => { c.moveTo(0.3, -0.42); c.bezierCurveTo(-0.5, -0.18, -0.62, -1.05, 0.02, -1.38); });
      if (beats >= 1.49) dot(0.8, 0.25);
    } else {                                                                // quaver and semiquaver rests
      const two = beats < 0.49, x1 = two ? 0.5 : 0.42, y1 = 0.62, x2 = two ? -0.22 : -0.08, y2 = two ? -2.02 : -1.05;
      stroke(0.13, "round", () => { c.moveTo(x1, y1); c.lineTo(x2, y2); });
      for (let i = 0; i < (two ? 2 : 1); i++) {
        const ox = -0.273 * i, oy = -i;
        c.beginPath(); c.arc(x1 - 0.78 + ox, y1 - 0.2 + oy, 0.21, 0, 6.2832); c.fill();
        stroke(0.12, "round", () => { c.moveTo(x1 - 0.78 + ox, y1 - 0.33 + oy); c.bezierCurveTo(x1 - 0.5 + ox, y1 - 0.42 + oy, x1 - 0.17 + ox, y1 - 0.27 + oy, x1 + ox, y1 + oy); });
      }
    }
    c.restore();
  }

  function drawStave(c, g, W, H, dark) {
    const S = g.stave || (g.stave = buildStave(g)), col = staveColors(dark), both = S.mode === "both";
    const bpb = g.bpb, beat = g.beat;
    const names = !!g.opts.staveNames;                          // letter names under the notes
    // spacing between stave lines, from the height: room for ledger lines above, between and below
    // (more room between and below when the letters are shown)
    const above = both || names ? 3 : 3.25, gap = names ? 7 : 4.5, below = both ? (names ? 4.5 : 3) : (names ? 5 : 3.25);
    const span = both ? 8 + gap : 4;
    const s = Math.max(4.5, Math.min(13, H / (above + span + below)));
    const y0 = (H - span * s) * above / (above + below);        // top line of the upper stave
    const top = { treble: y0, bass: both ? y0 + (4 + gap) * s : y0 };
    const staves = both ? ["treble", "bass"] : [S.mode];
    const yOf = (staff, step) => top[staff] + 4 * s - (step - STAFF_BOT[staff]) * s / 2;
    const nk = Math.abs(S.k), xLeft = Math.max(8, s * 0.9), xKey = xLeft + 3.4 * s, xTime = xKey + nk * 1.05 * s + (nk ? 0.5 * s : 0);
    const headEnd = xTime + (S.sig[0] > 9 ? 3.1 : 2.3) * s, xNow = headEnd + 2.4 * s;
    const ppb = Math.min(16 * s, Math.max((W - xNow) / (4 * bpb), (1.9 * s) / S.minBeats));
    const yTop = top[staves[0]], yBot = top[staves[staves.length - 1]] + 4 * s;
    const lines = (x1, x2) => {
      c.fillStyle = col.line;
      staves.forEach((st) => { for (let i = 0; i < 5; i++) c.fillRect(x1, Math.round(top[st] + i * s) - 0.5, x2 - x1, 1); });
    };

    c.clearRect(0, 0, W, H);
    lines(headEnd, W);
    const hw = 0.6 * s, frame = (S.frame = (S.frame || 0) + 1);
    /* where a beam runs this frame: it follows the notes, never too steep, and
       slides away from the note heads until every stem is long enough */
    const beamOf = (bm) => {
      if (bm.frame === frame) return bm;
      bm.frame = frame;
      const its = bm.items, up = bm.up, n = its.length;
      const sx = (it) => xNow + (it.start - beat) * ppb + (up ? hw - 0.05 * s : -hw + 0.05 * s);
      const tip = (it) => (up ? yOf(it.staff, it.heads[it.heads.length - 1].step) - 3.1 * s : yOf(it.staff, it.heads[0].step) + 3.1 * s);
      const x0 = sx(its[0]), x1 = sx(its[n - 1]);
      let slope = x1 > x0 ? (tip(its[n - 1]) - tip(its[0])) / (x1 - x0) : 0;
      if (Math.abs(slope * (x1 - x0)) > s) slope = (Math.sign(slope) * s) / (x1 - x0);
      let y0 = tip(its[0]);
      its.forEach((it) => { const at = y0 + slope * (sx(it) - x0), t = tip(it); if (up ? at > t : at < t) y0 += t - at; });
      bm.x0 = x0; bm.x1 = x1; bm.y0 = y0; bm.slope = slope; bm.xs = its.map(sx);
      return bm;
    };
    const beamBar = (bm, xa, xb, off) => { // one beam (or part of one) as a slanted bar
      const t = 0.48 * s * (bm.up ? 1 : -1), o = off * (bm.up ? 1 : -1), ya = bm.y0 + bm.slope * (xa - bm.x0) + o, yb = bm.y0 + bm.slope * (xb - bm.x0) + o;
      c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.lineTo(xb, yb + t); c.lineTo(xa, ya + t); c.closePath(); c.fill();
    };

    // bar lines and bar numbers
    c.font = "600 " + Math.max(9, Math.round(s * 1.05)) + "px " + FONT; c.textAlign = "left"; c.textBaseline = "alphabetic";
    const firstBar = Math.max(0, Math.floor((beat - (xNow - headEnd) / ppb) / bpb));
    for (let b = firstBar; b * bpb <= g.totalBeats + 1e-6; b++) {
      const x = Math.round(xNow + (b * bpb - beat) * ppb - 1.3 * s);
      if (x > W) break;
      if (x < headEnd) continue;
      c.fillStyle = col.bar; c.fillRect(x, yTop, 1, yBot - yTop);
      if (b * bpb < g.totalBeats) { c.fillStyle = col.soft; c.fillText(String(b + 1), x + 4, yTop - 0.7 * s); }
    }

    // notes
    const gone = (n) => n.status === "hit" || n.status === "skip";
    const stacks = new Map();
    const items = S.items, tMin = beat - (xNow - headEnd + 2 * s) / ppb, tMax = beat + (W - xNow + 2 * s) / ppb;
    let lo = 0, hi = items.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (items[m].start < tMin) lo = m + 1; else hi = m; }
    while (lo > 0 && items[lo - 1].beam && items[lo - 1].beam === (items[lo] || {}).beam) lo--; // do not cut a beamed group in half
    for (let i = lo; i < items.length; i++) {
      const it = items[i];
      if (it.start > tMax) break;
      const x = xNow + (it.start - beat) * ppb, st = it.staff, v = it.val, heads = it.heads;
      const past = x < xNow - 1 ? Math.max(0, 1 - (xNow - x) / (xNow - headEnd)) : 1;
      const first = heads[0].n, hand = first.hand === "R" ? col.R : col.L;
      const allHit = heads.every((h) => gone(h.n));
      const base = (allHit ? 0.38 : 1) * past;
      if (base <= 0.02) continue;
      // ledger lines
      c.globalAlpha = base; c.fillStyle = col.line;
      const lowest = heads[0].step, highest = heads[heads.length - 1].step, bot = STAFF_BOT[st];
      for (let p = bot + 10; p <= highest; p += 2) c.fillRect(x - 1.05 * s, Math.round(yOf(st, p)) - 0.5, 2.1 * s + (it.up ? hw : 0), 1);
      for (let p = bot - 2; p >= lowest; p -= 2) c.fillRect(x - 1.05 * s - (it.up ? 0 : hw), Math.round(yOf(st, p)) - 0.5, 2.1 * s + (it.up ? 0 : hw), 1);
      // stem and flags
      const yLo = yOf(st, lowest), yHi = yOf(st, highest);
      c.strokeStyle = hand; c.fillStyle = hand;
      let inkLow = yLo + 0.5 * s;                               // the lowest point this note reaches
      if (v.head !== "w") {
        const bm = it.beam ? beamOf(it.beam) : null;
        const xs = it.up ? x + hw - 0.05 * s : x - hw + 0.05 * s;
        const tip = bm ? bm.y0 + bm.slope * (xs - bm.x0) : it.up ? yHi - 3.3 * s : yLo + 3.3 * s;
        c.lineWidth = Math.max(1, 0.11 * s); c.lineCap = "butt";
        c.beginPath(); c.moveTo(xs, it.up ? yLo : yHi); c.lineTo(xs, tip); c.stroke();
        if (!it.up) inkLow = Math.max(inkLow, tip + (bm && bm.items.every((q) => q.val.trip) ? 1.25 * s : 0.1 * s));
        if (bm && bm.drawn !== frame) {
          // the whole beam is drawn once, with the first of its notes we meet
          bm.drawn = frame;
          const its = bm.items, last = its.length - 1;
          c.globalAlpha = (its.every((q) => q.heads.every((h) => gone(h.n))) ? 0.38 : 1) * past;
          beamBar(bm, bm.xs[0], bm.xs[last], 0);
          for (let lev = 2; lev <= 3; lev++) { // semiquavers get a second beam, demisemiquavers a third
            for (let q = 0; q <= last; q++) {
              if (its[q].val.flags < lev) continue;
              const off = (lev - 1) * 0.78 * s;
              if (q < last && its[q + 1].val.flags >= lev) beamBar(bm, bm.xs[q], bm.xs[q + 1], off);
              else if (!(q > 0 && its[q - 1].val.flags >= lev)) { const dir = q < last ? 1 : -1; beamBar(bm, Math.min(bm.xs[q], bm.xs[q] + dir * 0.95 * s), Math.max(bm.xs[q], bm.xs[q] + dir * 0.95 * s), off); }
            }
          }
          if (its.every((q) => q.val.trip)) { // a small 3 marks a triplet
            const xm = (bm.xs[0] + bm.xs[last]) / 2, ym = bm.y0 + bm.slope * (xm - bm.x0) + (bm.up ? -0.55 : 0.55) * s;
            c.font = "italic 700 " + Math.max(8, Math.round(s * 1.15)) + "px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
            c.fillText("3", xm, ym); c.textBaseline = "alphabetic";
          }
          c.globalAlpha = base;
        }
        const d = it.up ? 1 : -1;
        c.lineWidth = Math.max(1.2, 0.17 * s); c.lineCap = "round";
        for (let f = 0; f < (bm ? 0 : v.flags); f++) {
          const ty = tip + d * f * 0.8 * s;
          c.beginPath(); c.moveTo(xs, ty);
          c.bezierCurveTo(xs + 0.15 * s, ty + d * 0.9 * s, xs + 1.05 * s, ty + d * 1.15 * s, xs + 0.72 * s, ty + d * 2.2 * s);
          c.stroke();
        }
      }
      // heads, accidentals, dots
      let accCol = 0, lastAccStep = -99;
      for (let j = heads.length - 1; j >= 0; j--) {
        const h = heads[j], y = yOf(st, h.step), hx = x + h.side * (2 * hw - 0.1 * s);
        const miss = h.n.status === "miss";
        const color = miss ? col.miss : h.n.hand === "R" ? col.R : col.L;
        c.globalAlpha = (gone(h.n) ? 0.38 : miss ? 0.85 : 1) * past;
        c.fillStyle = color;
        c.save(); c.translate(hx, y); c.rotate(-0.36);
        const whole = v.head === "w", rx = (whole ? 0.74 : 0.63) * s, ry = 0.43 * s;
        c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 6.2832); c.closePath();
        if (v.head !== "q") {
          const ix = (whole ? 0.38 : 0.47) * s, iy = (whole ? 0.27 : 0.2) * s, rot = whole ? 0.95 : 0;
          c.moveTo(ix * Math.cos(rot), ix * Math.sin(rot)); c.ellipse(0, 0, ix, iy, rot, 0, 6.2832); c.closePath();
          c.fill("evenodd");
        } else c.fill();
        c.restore();
        if (h.acc != null) {
          accCol = lastAccStep - h.step < 6 && lastAccStep !== -99 ? (accCol + 1) % 3 : 0; lastAccStep = h.step;
          drawAccidental(c, h.acc, x - (it.up ? 0 : hw) - 1.45 * s - accCol * 0.95 * s, y, s, color);
        }
        for (let dn = 0; dn < v.dots; dn++) {
          const onLine = ((h.step - bot) % 2 + 2) % 2 === 0;
          const dx = x + hw + (heads.some((q) => q.side === 1) ? 2 * hw : 0) + 0.6 * s + dn * 0.5 * s;
          c.beginPath(); c.arc(dx, y - (onLine ? s / 2 : 0), Math.max(1.1, 0.15 * s), 0, 6.2832); c.fill();
        }
        if (h.ott && (j === heads.length - 1 || j === 0)) {
          c.font = "700 " + Math.max(8, Math.round(s * 0.95)) + "px " + FONT; c.textAlign = "center";
          const lab = Math.abs(h.ott) > 1 ? "15" : "8";
          c.fillText(lab, hx, h.ott > 0 ? y - 1.1 * s : y + 1.9 * s);
          if (h.ott < 0) inkLow = Math.max(inkLow, y + 2.3 * s);
        }
      }
      // letter names are drawn after the notes. Notes that sound together on one stave share a stack.
      if (names) {
        const sk = st + "|" + Math.round(it.start * 32);
        let stk = stacks.get(sk);
        if (!stk) { stk = { x, st, past, ink: inkLow, heads: [] }; stacks.set(sk, stk); }
        stk.ink = Math.max(stk.ink, inkLow);
        heads.forEach((h) => stk.heads.push(h));
      }
      c.globalAlpha = 1;
    }

    // letter names: a row just under the stave, lower where a note itself reaches down there
    if (names) {
      const fs = Math.max(9, Math.round(s * 1.2)), step = fs * 1.02;
      c.font = "700 " + fs + "px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      stacks.forEach((stk) => {
        const hs = stk.heads.length > 1 ? stk.heads.slice().sort((a, b) => b.n.midi - a.n.midi) : stk.heads; // a chord reads top note first
        let ty = Math.max(top[stk.st] + 5.55 * s, stk.ink + 0.95 * s);
        ty = Math.max(fs * 0.6, Math.min(ty, H - fs * 0.6 - (hs.length - 1) * step));
        hs.forEach((h) => {
          const miss = h.n.status === "miss";
          c.globalAlpha = (gone(h.n) ? 0.38 : miss ? 0.85 : 1) * stk.past;
          c.fillStyle = miss ? col.miss : h.n.hand === "R" ? col.R : col.L;
          c.fillText(h.name || (h.name = nameIn(g, h.n.midi, false)), stk.x, ty);
          ty += step;
        });
      });
      c.globalAlpha = 1; c.textBaseline = "alphabetic";
    }

    // rests
    const rests = S.rests;
    lo = 0; hi = rests.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (rests[m].start < tMin - bpb) lo = m + 1; else hi = m; }
    for (let i = lo; i < rests.length; i++) {
      const r = rests[i];
      if (r.start > tMax) break;
      // a whole-bar rest sits in the middle of its bar
      const x = xNow + ((r.bar ? r.start + r.len / 2 : r.start) - beat) * ppb - (r.bar ? 1.3 * s : 0);
      if (x > W + 2 * s) continue;
      const past = x < xNow - 1 ? Math.max(0, 1 - (xNow - x) / (xNow - headEnd)) : 1;
      c.globalAlpha = (r.start + r.len <= beat + 1e-6 ? 0.38 : 0.9) * past;
      if (c.globalAlpha <= 0.02) continue;
      drawRest(c, r.beats, x, top[r.staff] + 2 * s, s, r.staff === "treble" ? col.R : col.L);
    }
    c.globalAlpha = 1;

    // the "now" line
    c.fillStyle = col.now; c.globalAlpha = 0.9;
    c.fillRect(Math.round(xNow) - 1, yTop - 1.6 * s, 2, yBot - yTop + 3.2 * s);
    c.globalAlpha = 0.16; c.fillRect(Math.round(xNow) - 5, yTop - 1.6 * s, 10, yBot - yTop + 3.2 * s);
    c.globalAlpha = 1;

    // left edge: notes slide out of sight under the clef, key and time signature
    const fade = c.createLinearGradient(headEnd, 0, headEnd + 1.8 * s, 0);
    fade.addColorStop(0, "rgba(" + col.bg + ",1)"); fade.addColorStop(1, "rgba(" + col.bg + ",0)");
    c.fillStyle = "rgb(" + col.bg + ")"; c.fillRect(0, 0, headEnd, H);
    c.fillStyle = fade; c.fillRect(headEnd, 0, 1.8 * s, H);
    lines(xLeft, headEnd + 1.8 * s);
    c.fillStyle = col.line; c.fillRect(Math.round(xLeft), yTop, 1.5, yBot - yTop);
    staves.forEach((st) => {
      if (st === "treble") drawTreble(c, xLeft + 1.7 * s, top.treble + 3 * s, s, col.ink);
      else drawBass(c, xLeft + 1.55 * s, top.bass + s, s, col.ink);
      const kind = S.k > 0 ? "sharp" : "flat";
      for (let i = 0; i < nk; i++) drawAccidental(c, S.k > 0 ? 1 : -1, xKey + (i + 0.5) * 1.05 * s, yOf(st, KEYSIG_STEP[kind][i] - (st === "bass" ? 14 : 0)), s, col.ink);
      c.fillStyle = col.ink; c.font = "800 " + Math.round(2.3 * s) + "px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      const xT = xTime + (S.sig[0] > 9 ? 1.4 : 1.0) * s;
      c.fillText(String(S.sig[0]), xT, top[st] + 1.05 * s);
      c.fillText(String(S.sig[1]), xT, top[st] + 3.05 * s);
    });
    c.textAlign = "left"; c.textBaseline = "alphabetic";
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
    chevL: <path d="M15 6l-6 6 6 6" />,
    chevR: <path d="M9 6l6 6-6 6" />,
    note: <g><path d="M9 18V5.5l10-2V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></g>,
    sound: <g><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.5a7.6 7.6 0 0 1 0 11" /></g>,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    search: <g><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></g>,
    share: <g><path d="M12 15V3.5M8 7l4-3.5L16 7" /><path d="M8 11H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18 11h-2" /></g>,
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
              <Switch label="Show the stave" checked={s.stave} onChange={s.setStave} hint="See the notes as written music, moving with the song." />
              {s.stave ? <Switch label="Letters under the notes" checked={s.staveNames} onChange={s.setStaveNames} hint="Each note on the stave shows its letter name." /> : null}
              <div className="fn-row">
                <span className="fn-row-label">Look</span>
                <Seg label="Look" value={s.stage} onChange={s.setStage} options={[["dark", "Dark"], ["light", "Light"]]} />
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
              <Switch label="Play it for me" checked={s.demo} onChange={s.setDemo} hint="The app plays the whole song so you can hear it." />
              <Switch label="Play the other hand for me" checked={s.otherHand} onChange={s.setOtherHand} hint="Headphones help, so the mic does not hear it." />
            </section>
          </div>
        </aside>
      </div>
    );
  }

  /* ------------------------------------------------------------ player */
  const mq = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  /* a phone held upright: "full screen" turns the whole app on its side */
  const ROT_MQ = "(orientation: portrait) and (pointer: coarse) and (max-width: 640px)";

  function FallingPlayer({ meta, onChangeSong, stage, setStage, immersive, toggleImmersive, canImmersive, soundOn, onEnableSound }) {
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
    const [stave, setStave] = React.useState(!!saved.stave);
    const [staveNames, setStaveNames] = React.useState(saved.staveNames !== false);
    const [otherHand, setOtherHand] = React.useState(false);
    const [demo, setDemo] = React.useState(false);
    const [loop, setLoop] = React.useState(false);
    const [loopStart, setLoopStart] = React.useState(1);
    const [loopEnd, setLoopEnd] = React.useState(totalBars);
    const [sens, setSens] = React.useState(typeof saved.sens === "number" ? saved.sens : 1);
    const [micErr, setMicErr] = React.useState("");
    const [listening, setListening] = React.useState(MIC.listening);
    const [drawer, setDrawer] = React.useState(false);
    const [snap, setSnap] = React.useState({});
    const [size, setSize] = React.useState({ w: 360, h: 420 });
    const wrapRef = React.useRef(null), canvasRef = React.useRef(null), bodyRef = React.useRef(null), gearRef = React.useRef(null);
    const staveRef = React.useRef(null);
    // one stave is enough when a song uses one hand only
    const twoStaves = React.useMemo(() => g.notes.some((n) => n.hand === "R") && g.notes.some((n) => n.hand === "L"), [g]);
    const detRef = React.useRef(null);
    if (!detRef.current) detRef.current = new FC.Detector(SENS_KEYS[sens]);
    const live = React.useRef({}); // mic readouts updated by the loop
    const stageRef = React.useRef(stage); stageRef.current = stage;
    const prevBest = React.useRef(0);
    const drawerRef = React.useRef(false); drawerRef.current = drawer;
    const immRef = React.useRef(immersive); immRef.current = immersive;
    const coarse = React.useMemo(() => mq("(pointer: coarse)"), []);

    // push options into the engine; changing hands / wait starts the song over
    React.useEffect(() => {
      const o = g.opts, structural = o.hands !== hands || o.wait !== wait || o.demo !== demo;
      Object.assign(o, { hands, wait, speed, metro, labels, staveNames, otherHand, demo, loop, loopStart, loopEnd });
      if (structural) { buildSets(g); resetAll(g); detRef.current.reset(); }
      else if (!g.playing && g.needCount) { g.beat = homeBeat(g); reindex(g); }
    }, [hands, wait, speed, metro, labels, staveNames, otherHand, demo, loop, loopStart, loopEnd]);
    React.useEffect(() => {
      detRef.current.setSens(SENS_KEYS[sens]);
      saveSettings({ sens, wait, metro, labels, stave, staveNames });
    }, [sens, wait, metro, labels, stave, staveNames]);

    const hooks = React.useMemo(() => ({
      click: (acc) => { window.MusicAudio && window.MusicAudio.click(acc); },
      // `at` (optional): the moment the note should sound, on the performance.now() clock
      playNote: (midi, dur, vel, at) => { window.MusicAudio && window.MusicAudio.playPiano(FC.midiToName(midi), dur, vel || 0.7, at ? Math.max(0, (at - performance.now()) / 1000) : 0); },
      testPlay: (midis, dur) => { if (MIC.listening) MIC.synth(midis, dur); },
      finished: (res) => { if (res.stars === 3 && window.MusicAudio) window.MusicAudio.ding(true); },
    }), []);

    async function startListening() {
      setMicErr("");
      try { await MIC.start(); setListening(true); return true; }
      catch (e) {
        const n = e && e.name;
        setMicErr((n === "NotAllowedError" || n === "SecurityError" ? "The microphone is blocked. Allow it in your browser settings to play on a real piano."
          : n === "NotFoundError" ? "No microphone found."
          : "Could not start the microphone on this device.") + " You can still tap the keys on the screen.");
        return false;
      }
    }
    function stopListening() { MIC.stop(); setListening(false); live.current = {}; detRef.current.reset(); }
    // the microphone note goes away by itself
    React.useEffect(() => {
      if (!micErr) return;
      const t = setTimeout(() => setMicErr(""), 9000);
      return () => clearTimeout(t);
    }, [micErr]);

    /* start the song. d = true: the app plays it. d = false: the student plays
       (on a real piano through the mic, or by tapping the keys on screen). */
    function begin(d, fresh) {
      if (g.opts.demo !== d) { g.opts.demo = d; buildSets(g); resetAll(g); setDemo(d); }
      else if (fresh || g.finished) resetAll(g);
      // ask for the mic but do not wait for it: the on-screen keys work without one
      if (!d && !MIC.listening) startListening();
      window.MusicAudio && window.MusicAudio.resume();
      detRef.current.reset();
      prevBest.current = bestPct(g.key, hands, wait);
      play(g);
    }
    function togglePlay() {
      if (g.playing) { pause(g); return; }
      begin(demo);
    }
    /* tap or click a key on the on-screen keyboard */
    function tapKey(midi) {
      const now = performance.now();
      window.MusicAudio && window.MusicAudio.resume();
      hooks.playNote(midi, 0.7, 0.7);
      g.tap[midi] = now;
      g.ignoreUntil = now + 400; // the mic must not count this sound a second time
      if (!g.opts.demo) onHeard(g, midi, now, 0);
    }
    /* pointer -> canvas coordinates, also when the app is turned on its side */
    function stagePoint(e) {
      const cv = canvasRef.current; if (!cv) return null;
      const r = cv.getBoundingClientRect();
      if (immRef.current && mq(ROT_MQ)) return [e.clientY - r.top, r.right - e.clientX];
      return [e.clientX - r.left, e.clientY - r.top];
    }
    /* move to another place in the song */
    function jump(b) { seek(g, b); detRef.current.reset(); }
    function goBar(d) {
      const cur = Math.floor(g.beat / g.bpb + 1e-6), into = g.beat - cur * g.bpb;
      jump(Math.max(0, Math.min(totalBars - 1, d < 0 ? (into > 0.3 ? cur : cur - 1) : cur + 1)) * g.bpb);
    }
    const goRef = React.useRef(); goRef.current = goBar;
    // the progress line: click or drag to jump to a bar
    const lineRef = React.useRef(null), lineDrag = React.useRef(false);
    function lineSeek(e) {
      const el = lineRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const f = immRef.current && mq(ROT_MQ) ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
      jump(Math.max(0, Math.min(totalBars - 1, Math.floor(Math.max(0, Math.min(0.9999, f)) * totalBars))) * g.bpb);
    }
    function onLineDown(e) {
      if (e.button != null && e.button > 0) return;
      lineDrag.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      lineSeek(e);
    }
    function onLineMove(e) { if (lineDrag.current) lineSeek(e); }
    function onLineUp() { lineDrag.current = false; }
    function onLineKey(e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); goBar(-1); }
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); goBar(1); }
      else if (e.key === "Home") { e.preventDefault(); jump(0); }
    }
    // the falling area: drag up or down (or scroll) to move through the song
    const scrub = React.useRef(null);
    function onStageDown(e) {
      if (e.button != null && e.button > 0) return;
      const p = stagePoint(e); if (!p) return;
      const m = keyAt(g.geo, p[0], p[1]);
      if (m != null) { e.preventDefault(); tapKey(m); return; }
      if (!g.geo) return;
      scrub.current = { id: e.pointerId, y: p[1], beat: g.beat, was: g.playing, moved: false };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    function onStageUp(e) {
      const sc = scrub.current;
      if (!sc || sc.id !== e.pointerId) return;
      scrub.current = null;
      if (sc.moved && sc.was) { g.countNext = false; play(g); }
    }
    function onStageWheel(e) {
      if (!g.geo || drawerRef.current) return;
      jump(g.beat + (e.deltaY || 0) / 120);
    }
    function onStageMove(e) {
      const sc = scrub.current;
      if (sc && sc.id === e.pointerId) {
        const q = stagePoint(e); if (!q || !g.geo) return;
        const dy = q[1] - sc.y;
        if (!sc.moved && Math.abs(dy) < 6) return;
        if (!sc.moved) { sc.moved = true; if (sc.was) pause(g); }
        jump(sc.beat + dy / ((g.geo.H - g.geo.kbH) / (LOOK_BARS * g.bpb)));
        return;
      }
      const cv = canvasRef.current; if (!cv || e.pointerType === "touch") return;
      const p = stagePoint(e);
      const over = !!p && keyAt(g.geo, p[0], p[1]) != null;
      if (cv.dataset.keys !== String(over)) cv.dataset.keys = String(over);
    }
    function restart() { resetAll(g); detRef.current.reset(); }
    function restartAndPlay() { begin(false, true); }
    const toggleRef = React.useRef(); toggleRef.current = togglePlay;

    // keyboard: space plays / pauses, left and right arrows move a bar
    React.useEffect(() => {
      const onKey = (e) => {
        const space = e.code === "Space" || e.key === " ", arrow = e.key === "ArrowLeft" || e.key === "ArrowRight";
        if (!space && !arrow) return;
        if (drawerRef.current) return;
        const t = e.target, tag = t && t.tagName;
        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || (t && t.isContentEditable) || (t && t.getAttribute && t.getAttribute("role") === "slider")) return;
        if (space && (tag === "BUTTON" || tag === "A")) return;
        e.preventDefault();
        if (space) toggleRef.current(); else goRef.current(e.key === "ArrowLeft" ? -1 : 1); // arrows: back or forward a bar
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    // while the settings drawer is open the rest of the app is inert
    React.useEffect(() => {
      const el = bodyRef.current; if (!el) return;
      if (drawer) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
      else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
    }, [drawer]);

    // the stage fills whatever space the app has
    React.useEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const measure = () => {
        const w = Math.max(240, Math.floor(el.clientWidth)), h = Math.max(200, Math.floor(el.clientHeight));
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
      const reduce = mq("(prefers-reduced-motion: reduce)");
      let colors = stageColors(stageRef.current);
      const fx = createFx();
      let raf = 0, last = performance.now(), lastUi = 0, lastYin = 0;
      const lv = live.current;

      const tick = (now) => {
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
        const cv = canvasRef.current;
        // 1) listen
        if (MIC.listening) {
          const cand = candidates(g);
          const needHi = cand.some((m) => m < FC.HI_BELOW);
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
        if (g.finished && g.result && g.result.newBest === undefined) g.result.newBest = g.key !== "custom" && !g.result.practice && g.result.pct > 0 && g.result.pct > prevBest.current;
        // 3) draw
        if (cv) {
          const { w, h } = sizeRef.current, dpr = Math.min(2.5, window.devicePixelRatio || 1);
          if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
          const c = cv.getContext("2d");
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (!g.geo || g.geo.W !== w || g.geo.H !== h) g.geo = makeGeo(g, w, h, coarse);
          if (colors.stage !== stageRef.current) colors = stageColors(stageRef.current);
          draw(c, g, g.geo, colors, fx, now, reduce, dpr);
        }
        // 3b) the stave strip, when it is switched on
        const sv = staveRef.current;
        if (sv) {
          const w = sv.clientWidth, h = sv.clientHeight, dpr = Math.min(2.5, window.devicePixelRatio || 1);
          if (w > 0 && h > 0) {
            if (sv.width !== Math.round(w * dpr) || sv.height !== Math.round(h * dpr)) { sv.width = Math.round(w * dpr); sv.height = Math.round(h * dpr); }
            const sc = sv.getContext("2d");
            sc.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawStave(sc, g, w, h, stageRef.current === "dark");
          }
        }
        // 4) UI snapshot
        if (now - lastUi > 100) {
          lastUi = now;
          const cn = counts(g);
          setSnap({
            playing: g.playing, waiting: g.waiting, finished: g.finished, result: g.result, count: g.countLeft > 0,
            countN: g.countLeft > 0 ? Math.max(1, Math.ceil(g.countLeft - 1e-9)) : 0, beat: g.beat,
            hits: cn.hits, misses: cn.misses, total: cn.total, bar: Math.max(1, Math.floor(Math.max(0, g.beat) / g.bpb) + 1),
            expected: g.waiting ? expectedNow(g).map((m) => nameIn(g, m, true)) : [], waitedMs: g.waiting ? now - g.arrivedMs : 0,
            level: lv.level || 0, heard: lv.note != null && now - lv.noteAt < 900 ? FC.midiToName(lv.note) : "", heardAt: lv.noteAt || 0,
            micOk: !!lv.micOk, lastPass: g.lastPass,
          });
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(raf); };
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
            keys: g.geo ? { whites: g.geo.whites.length, keyW: g.geo.kw, keyH: g.geo.kbH, from: g.geo.a, to: g.geo.b } : null,
          };
        },
        stave() { const S = g.stave || (g.stave = buildStave(g)); return { key: S.k, mode: S.mode, items: S.items.length, on: !!staveRef.current }; },
        injectNotes(midis) { const now = performance.now(); return (midis || []).map((m) => onHeard(g, m, now, 0)); },
        /* where a key is on the page (centre of its lower half), for tap tests */
        keyPoint(midi) {
          const cv = canvasRef.current, k = g.geo && g.geo.keys[midi]; if (!cv || !k) return null;
          const r = cv.getBoundingClientRect(), x = k.x + k.w / 2, y = g.geo.H - g.geo.kbH + (k.black ? g.geo.blackH * 0.5 : g.geo.kbH * 0.85);
          return immRef.current && mq(ROT_MQ) ? [r.right - y, r.top + x] : [r.left + x, r.top + y];
        },
        /* test-synth only: play `midis` and return detector scores over ~0.7 s */
        probe(midis, sens) {
          if (!MIC.listening) return Promise.resolve(null);
          if (TEST_SYNTH) MIC.synth(midis, 0.6);
          const t0 = performance.now(), log = [];
          return new Promise((resolve) => {
            const iv = setInterval(() => {
              const s = MIC.read(true);
              log.push(midis.map((m) => {
                const sp = m < FC.HI_BELOW ? s.hi : s.lo;
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

    // when a result card appears, put keyboard focus on its first button
    const resultRef = React.useRef(null);
    React.useEffect(() => {
      if (snap.finished && resultRef.current) { const b = resultRef.current.querySelector("button"); if (b) b.focus({ preventScroll: true }); }
    }, [snap.finished && (snap.result || demo)]);

    // clamp loop bars
    function setBar(which, v) {
      v = Math.max(1, Math.min(totalBars, parseInt(v, 10) || 1));
      if (which === "s") { setLoopStart(v); if (v > loopEnd) setLoopEnd(v); } else { setLoopEnd(v); if (v < loopStart) setLoopStart(v); }
    }
    const setSpeedClamped = (v) => setSpeed(Math.round(Math.max(0.25, Math.min(1.5, v)) * 100) / 100);

    const expectedText = snap.expected && snap.expected.length ? snap.expected.join(" + ") : "";
    let status = demo ? "Press Play to hear the song." : "Press Play, then play the notes you see on a piano or on the keys below.";
    if (snap.finished) status = "Song finished.";
    else if (snap.count) status = "Get ready...";
    else if (snap.waiting) status = "Waiting for: " + expectedText;
    else if (snap.playing) status = "Bar " + snap.bar + " of " + totalBars;
    else if (g.beat > homeBeat(g) + 0.01) status = "Paused";

    const done = (snap.hits || 0) + (snap.misses || 0);
    const acc = done ? Math.round(100 * (snap.hits || 0) / done) : null;
    const pos = Math.max(0, Math.min(1, (snap.beat || 0) / g.totalBeats));
    const sub = (meta.level || "Medium") + " · " + (g.sig ? g.sig[0] + "/" + g.sig[1] : g.bpb + "/4") + " · " + g.bpm + " bpm";
    const atStart = !snap.playing && !snap.finished && !(g.beat > homeBeat(g) + 0.01);
    const lvl = Math.round((snap.level || 0) * 100);
    const res = snap.result;

    return (
      <div className="fn-player">
        <div className="fn-body" ref={bodyRef}>
          <header className="fn-bar" role="toolbar" aria-label="Song controls">
            <div className="fn-bar-id">
              <button type="button" className="fn-back" onClick={onChangeSong}><Icon n="back" size={18} /> <span>Songs</span></button>
              <div className="fn-title">
                <h2>{g.name}</h2>
                <span>{sub}</span>
              </div>
            </div>
            <div className="fn-bar-main">
              <button type="button" className="fn-play" onClick={togglePlay} aria-label={snap.playing ? "Pause" : "Play"} title={(snap.playing ? "Pause" : "Play") + " (space bar)"}>
                <Icon n={snap.playing ? "pause" : "play"} size={22} />
              </button>
              <button type="button" className="fn-icon-btn" onClick={restart} aria-label="Restart" title="Restart"><Icon n="restart" /></button>
              <div className="fn-stepper" role="group" aria-label="Speed">
                <button type="button" aria-label="Slower" onClick={() => setSpeedClamped(speed - 0.1)} disabled={speed <= 0.25}><Icon n="minus" size={16} /></button>
                <output aria-live="off">{Math.round(speed * 100)}%</output>
                <button type="button" aria-label="Faster" onClick={() => setSpeedClamped(speed + 0.1)} disabled={speed >= 1.5}><Icon n="plus" size={16} /></button>
              </div>
              <Seg label="Hands" value={hands} onChange={setHands} options={[
                ["L", <React.Fragment><i className="fn-dot l" aria-hidden="true" />Left</React.Fragment>],
                ["R", <React.Fragment><i className="fn-dot r" aria-hidden="true" />Right</React.Fragment>],
                ["B", "Both"]]} />
              <span className="fn-bar-chips">
                {demo ? null : <Chip label="Wait for me" checked={wait} onChange={setWait} />}
                <Chip label="Metronome" checked={metro} onChange={setMetro} />
                <Chip label="Play it for me" checked={demo} onChange={setDemo} />
              </span>
            </div>
            <div className="fn-bar-end">
              <button type="button" className="fn-icon-btn" onClick={() => setStage(stage === "dark" ? "light" : "dark")}
                aria-label={stage === "dark" ? "Switch to light look" : "Switch to dark look"} title={stage === "dark" ? "Light look" : "Dark look"}>
                <Icon n={stage === "dark" ? "sun" : "moon"} />
              </button>
              {canImmersive ? (
                <button type="button" className="fn-icon-btn" onClick={toggleImmersive} aria-label={immersive ? "Exit full screen" : "Full screen"} title={immersive ? "Exit full screen" : "Full screen"}>
                  <Icon n={immersive ? "compress" : "expand"} />
                </button>
              ) : null}
              <button type="button" className="fn-icon-btn" ref={gearRef} onClick={() => setDrawer(true)} aria-label="Settings" aria-haspopup="dialog" title="Settings"><Icon n="gear" /></button>
            </div>
          </header>

          <div className="fn-timeline" ref={lineRef} role="slider" tabIndex={0} aria-label="Place in the song. Drag, or use the arrow keys, to move."
            aria-valuemin={1} aria-valuemax={totalBars} aria-valuenow={Math.min(snap.bar || 1, totalBars)} aria-valuetext={"Bar " + Math.min(snap.bar || 1, totalBars) + " of " + totalBars}
            title="Drag to move through the song" style={{ "--bars": totalBars }}
            onPointerDown={onLineDown} onPointerMove={onLineMove} onPointerUp={onLineUp} onPointerCancel={onLineUp} onKeyDown={onLineKey}>
            <div className="fn-track">
              {totalBars <= 80 ? <div className="fn-ticks" /> : null}
              {loop ? <div className="fn-loopzone" style={{ left: ((Math.max(1, loopStart) - 1) / totalBars) * 100 + "%", width: ((Math.max(loopStart, loopEnd) - Math.max(1, loopStart) + 1) / totalBars) * 100 + "%" }} /> : null}
              <div className="fn-fill" style={{ width: pos * 100 + "%" }} />
              <div className="fn-knob" style={{ left: pos * 100 + "%" }} />
            </div>
          </div>
          <div className="sr-only" aria-live="polite">{status}{snap.lastPass != null ? " Last loop: " + snap.lastPass + "%" : ""}</div>
          {stave ? (
            <div className={"fn-stave" + (twoStaves ? "" : " one") + (staveNames ? " names" : "")}>
              <canvas ref={staveRef} role="img" aria-label={"The notes of " + g.name + " written on a stave"} />
            </div>
          ) : null}

          <div className="fn-stage" ref={wrapRef}>
            <canvas ref={canvasRef} role="img" tabIndex={0} onPointerDown={onStageDown} onPointerMove={onStageMove}
              onPointerUp={onStageUp} onPointerCancel={onStageUp} onWheel={onStageWheel}
              aria-label={"Falling notes for " + g.name + ". " + status}
              style={{ width: size.w + "px", height: size.h + "px" }} />
            <div className="fn-hud">
              <span className="fn-hud-start">
                <span className="fn-pill fn-barlbl">
                  <button type="button" className="fn-barbtn" aria-label="Back one bar" title="Back one bar (left arrow)" onClick={() => goBar(-1)}><Icon n="chevL" size={16} /></button>
                  <span>Bar {Math.min(snap.bar || 1, totalBars)}<small>/{totalBars}</small></span>
                  <button type="button" className="fn-barbtn" aria-label="Forward one bar" title="Forward one bar (right arrow)" onClick={() => goBar(1)}><Icon n="chevR" size={16} /></button>
                </span>
                <span className="fn-pill fn-legend" aria-label="Colours: orange is the left hand, blue is the right hand">
                  <i className="fn-dot l" aria-hidden="true" /><span>Left</span><i className="fn-dot r" aria-hidden="true" /><span>Right</span>
                </span>
              </span>
              <span className="fn-hud-end">
                {listening && !demo && !snap.playing && snap.heard ? <span className="fn-heard" key={snap.heardAt} aria-live="polite">Heard {snap.heard}</span> : null}
                {demo ? (
                  <span className="fn-pill fn-mic demo"><Icon n="note" size={15} /> Playing it for you</span>
                ) : (
                  <React.Fragment>
                    <span className="fn-pill fn-score" aria-label="Notes right so far">
                      <strong>{snap.hits || 0}</strong><span> / {snap.total || 0}</span>
                      {acc != null ? <em>{acc}%</em> : null}
                    </span>
                    {listening ? (
                      <span className="fn-pill fn-mic on" style={{ "--lvl": lvl / 100 }}><i aria-hidden="true" /> Listening</span>
                    ) : (
                      <button type="button" className="fn-pill fn-mic" onClick={startListening}><Icon n="mic" size={15} /> <span>Use the mic</span></button>
                    )}
                  </React.Fragment>
                )}
              </span>
            </div>
            <div className="fn-toasts">
              {!soundOn ? (
                <p className="fn-toast" role="status"><Icon n="sound" size={16} /> <span>Sound is turned off for this site.</span>
                  <button type="button" onClick={onEnableSound}>Turn sound on</button></p>
              ) : null}
              {micErr && !demo ? (
                <p className="fn-toast" role="status"><Icon n="mic" size={16} /> <span>{micErr}</span>
                  <button type="button" aria-label="Close this note" onClick={() => setMicErr("")}><Icon n="close" size={14} /></button></p>
              ) : null}
            </div>
            {snap.waiting && expectedText ? (
              <div className="fn-floatwrap">
                <span className="fn-waitchip"><i aria-hidden="true" /> Play: {expectedText}</span>
                {snap.waitedMs > 6000 ? (
                  <button type="button" className="fn-skip" onClick={() => { if (g.waitChord) g.waitChord.notes.forEach((n) => { if (n.status === "pending") n.status = "miss"; }); }}>Skip this note</button>
                ) : null}
              </div>
            ) : null}
            {snap.count && snap.countN ? <div className="fn-count" aria-hidden="true"><span key={snap.countN}>{snap.countN}</span></div> : null}
            {atStart ? (
              <div className="fn-idle">
                <button type="button" className="fn-start" onClick={() => begin(false)}><Icon n="play" size={18} /> Play along</button>
                <button type="button" className="fn-start ghost" onClick={() => begin(true)}><Icon n="sound" size={18} /> Hear it first</button>
              </div>
            ) : null}
            {snap.finished && !res && demo ? (
              <div className="fn-result" role="dialog" aria-label="The song has finished" ref={resultRef}>
                <div className="fn-result-card fn-turn">
                  <span className="fn-turn-icon" aria-hidden="true"><Icon n="note" size={30} /></span>
                  <h3>Your turn!</h3>
                  <p>Now try it yourself. Slow it down if you need to.</p>
                  <div className="fn-result-actions">
                    <button type="button" className="fn-cta" onClick={() => begin(false, true)}>Now you play</button>
                    <button type="button" className="fn-cta ghost" onClick={() => begin(true, true)}>Hear it again</button>
                  </div>
                </div>
              </div>
            ) : null}
            {snap.finished && res ? (
              <div className="fn-result" role="dialog" aria-label="Your result" ref={resultRef}>
                <div className="fn-result-card">
                  {res.practice ? null : <Stars n={res.stars} pop />}
                  <h3>{res.practice ? "Practice run" : res.stars === 3 ? "Brilliant!" : res.stars === 2 ? "Great job!" : res.stars === 1 ? "Nice work!" : "Keep practising!"}</h3>
                  {res.practice ? <p>You skipped part of the song. Play it all the way through to earn stars.</p> : null}
                  <div className="fn-ring" style={{ "--pct": res.pct }} role="img" aria-label={res.pct + " percent"}>
                    <div className="fn-pct">{res.pct}<small>%</small></div>
                  </div>
                  <dl className="fn-stats">
                    <div><dt>Right</dt><dd>{res.hits}</dd></div>
                    <div><dt>Missed</dt><dd>{res.total - res.hits}</dd></div>
                    <div><dt>Speed</dt><dd>{Math.round(speed * 100)}%</dd></div>
                  </dl>
                  {res.newBest ? <span className="fn-newbest">New best!</span> : null}
                  <div className="fn-result-actions">
                    <button type="button" className="fn-cta" onClick={restartAndPlay}>Play again</button>
                    <button type="button" className="fn-cta ghost" onClick={onChangeSong}>Pick another song</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {drawer ? (
          <SettingsDrawer onClose={() => setDrawer(false)} s={{
            wait, setWait, metro, setMetro, loop, setLoop, loopStart, loopEnd, setBar, totalBars,
            labels, setLabels, stave, setStave, staveNames, setStaveNames, stage, setStage, sens, setSens, listening, level: snap.level || 0, micOk: !!snap.micOk,
            startListening, stopListening, otherHand, setOtherHand, demo, setDemo,
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
    return (thumbCache[meta.key] = { ...out, bpb: m.bpb, sig: m.sig ? m.sig[0] + "/" + m.sig[1] : m.bpb + "/4", secs: songSecs(m), W, H });
  }
  function Thumb({ meta }) {
    const t = thumbPaths(meta);
    return (
      <svg className="fn-thumb" viewBox={"0 0 " + t.W + " " + t.H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={t.L} fill="#ffa63d" opacity="0.95" />
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

  /* ------------------------------------------------------------ app shell: song library + player */
  const Logo = ({ size = 34 }) => (
    <svg className="fn-logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="11" fill="#0d1226" />
      <rect x="7" y="6" width="5" height="12" rx="2.5" fill="#ffa63d" />
      <rect x="17.5" y="10" width="5" height="9" rx="2.5" fill="#5b8cff" />
      <rect x="28" y="4" width="5" height="16" rx="2.5" fill="#5b8cff" />
      <rect x="5" y="24" width="30" height="11" rx="2.5" fill="#fff" />
      <path d="M12.5 24v11M20 24v11M27.5 24v11" stroke="#c9cad6" strokeWidth="1" />
      <rect x="10.4" y="24" width="4.2" height="6.4" rx="1" fill="#11131c" />
      <rect x="25.4" y="24" width="4.2" height="6.4" rx="1" fill="#11131c" />
    </svg>
  );

  /* Is a newer build of the site live? Phones, and above all the home-screen app,
     hold on to an old copy for a long time. The page asks the server for a fresh
     index.html and compares the app file it names with the one that is running. */
  const BUNDLE_RE = /assets\/index-[\w-]+\.js/;
  function runningBundle() {
    const el = document.querySelector('script[type="module"][src*="assets/index-"]');
    const m = el && BUNDLE_RE.exec(el.getAttribute("src") || "");
    return m ? m[0] : null;
  }
  function findNewerBuild() {
    const mine = runningBundle();
    if (!mine || typeof fetch !== "function") return Promise.resolve(null);
    return fetch(window.location.pathname + "?fresh=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : ""))
      .then((html) => { const m = BUNDLE_RE.exec(html); return m && m[0] !== mine ? m[0] : null; })
      .catch(() => null);
  }

  /* iPhone: Safari never hides its bars for a web page, but the same page opened
     from the home screen runs with no bars at all. This card says how. */
  function InstallTip({ onClose }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const b = ref.current && ref.current.querySelector("button");
      if (b) b.focus({ preventScroll: true });
      const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
      document.addEventListener("keydown", onKey, true);
      return () => document.removeEventListener("keydown", onKey, true);
    }, []);
    return (
      <div className="fn-tip-layer" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="fn-tip" role="dialog" aria-modal="true" aria-labelledby="fn-tip-title" ref={ref}>
          <h3 id="fn-tip-title">Get the whole screen</h3>
          <ol>
            <li><span>Tap <Icon n="share" size={17} /> <strong>Share</strong> in Safari.</span></li>
            <li><span>Choose <strong>Add to Home Screen</strong>.</span></li>
            <li><span>Open <strong>Falling Notes</strong> from your home screen.</span></li>
          </ol>
          <p>Safari on an iPhone always keeps its bars. The home screen version has none.</p>
          <button type="button" className="fn-cta" onClick={onClose}>Got it</button>
        </div>
      </div>
    );
  }

  function FallingNotes({ year, onBack, soundOn, onEnableSound }) {
    const [meta, setMeta] = React.useState(null);
    const [msg, setMsg] = React.useState("");
    const [filter, setFilter] = React.useState("All");
    const [query, setQuery] = React.useState("");
    const [stage, setStageState] = React.useState(() => (readSettings().stage === "light" ? "light" : "dark"));
    const [immersive, setImmersive] = React.useState(false);
    const [, bump] = React.useState(0);
    const fileRef = React.useRef(null), appRef = React.useRef(null);
    const songs = React.useMemo(songList, []);
    const canFs = React.useMemo(FS_OK, []);
    const phone = React.useMemo(() => mq("(pointer: coarse)"), []);
    const setStage = (v) => { setStageState(v); saveSettings({ stage: v }); };
    const [tip, setTip] = React.useState(false);
    const [update, setUpdate] = React.useState(null); // the newer app file, when one is live
    const lastCheck = React.useRef(0);
    // look for a newer version when the app opens and whenever it comes back to the front
    React.useEffect(() => {
      let gone = false;
      const check = () => {
        if (Date.now() - lastCheck.current < 180000) return;
        lastCheck.current = Date.now();
        findNewerBuild().then((b) => { if (b && !gone) setUpdate(b); });
      };
      const onShow = () => { if (!document.hidden) check(); };
      check();
      document.addEventListener("visibilitychange", onShow);
      window.addEventListener("pageshow", onShow);
      return () => { gone = true; document.removeEventListener("visibilitychange", onShow); window.removeEventListener("pageshow", onShow); };
    }, []);
    /* load the new version. A plain reload can hand back the saved old page, so the
       address gets the new version's name on it, which forces a fresh copy. */
    function applyUpdate() {
      const u = new URL(window.location.href), v = update.replace(/^.*index-|\.js$/g, "");
      if (u.searchParams.get("v") === v) { window.location.reload(); return; }
      u.searchParams.set("v", v);
      window.location.replace(u.toString());
    }
    // a phone whose browser cannot go full screen (iPhone Safari) and is not yet opened from the home screen
    const needsInstall = React.useMemo(() => phone && !canFs
      && !(window.navigator.standalone === true || mq("(display-mode: standalone)") || mq("(display-mode: fullscreen)")), []);

    React.useEffect(() => () => { MIC.stop(); }, []);
    // the app owns the whole window: no page scrolling behind it
    React.useEffect(() => {
      const el = document.documentElement;
      el.classList.add("fn-app-open");
      return () => { el.classList.remove("fn-app-open"); };
    }, []);
    // leaving real full screen (Esc, system gesture) also leaves the app's full-screen look
    React.useEffect(() => {
      if (!canFs) return;
      const onFs = () => { if (!fsElement()) setImmersive(false); };
      document.addEventListener("fullscreenchange", onFs);
      document.addEventListener("webkitfullscreenchange", onFs);
      return () => { document.removeEventListener("fullscreenchange", onFs); document.removeEventListener("webkitfullscreenchange", onFs); };
    }, []);

    /* Full screen. Where the browser allows it the app goes truly full screen and
       asks to lock to landscape. A phone that cannot do either (iPhone) gets the
       same result by turning the app on its side: see .fn-app.immersive in the CSS. */
    function toggleImmersive() {
      const el = appRef.current; if (!el) return;
      const unlock = () => { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* ignore */ } };
      if (immersive) {
        setImmersive(false); unlock();
        if (fsElement()) { const x = document.exitFullscreen || document.webkitExitFullscreen; if (x) { const p = x.call(document); if (p && p.catch) p.catch(() => {}); } }
        return;
      }
      if (needsInstall) {
        // already sideways: there is nothing left to turn, so just explain the home screen way
        if (!mq(ROT_MQ)) { setTip(true); return; }
        // upright: turn the app on its side, and explain the first time
        if (!(window.Students && window.Students.readNS("fallingNotes.fsTip", false))) {
          setTip(true);
          if (window.Students) window.Students.writeNS("fallingNotes.fsTip", true);
        }
      }
      setImmersive(true);
      const lock = () => { try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape"); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } };
      const f = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!f || !canFs) return;
      try {
        const p = f.call(el);
        if (p && p.then) p.then(lock).catch(() => { if (!phone) setImmersive(false); });
        else lock();
      } catch (e) { if (!phone) setImmersive(false); }
    }

    function openSong(s) {
      if (s.key !== "custom" && window.Students) window.Students.writeNS("fallingNotes.last", s.key);
      setMeta(s);
    }
    function openFile(file) {
      setMsg("");
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) { setMsg("That file is too big. Try a smaller MIDI file."); return; }
      const done = (buf) => {
        try {
          const m = FC.parseMidi(buf);
          const cut = m.events.length > 4000;
          openSong({
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
    const q = query.trim().toLowerCase();
    const shown = songs
      .filter((s) => (filter === "All" || s.level === filter) && (!q || (s.name + " " + byline(s)).toLowerCase().indexOf(q) >= 0))
      .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
    const starTotal = songs.reduce((t, s) => t + bestStars(s.key), 0);
    const lastKey = window.Students ? window.Students.readNS("fallingNotes.last", null) : null;
    const last = lastKey ? songs.find((s) => s.key === lastKey) : null;
    const fsBtn = (canFs || phone) ? (
      <button type="button" className="fn-icon-btn" onClick={toggleImmersive} aria-label={immersive ? "Exit full screen" : "Full screen"} title={immersive ? "Exit full screen" : "Full screen"}>
        <Icon n={immersive ? "compress" : "expand"} />
      </button>
    ) : null;

    return (
      <div className={"fn-app" + (immersive ? " immersive" : "")} data-stage={stage} ref={appRef}>
        {meta ? (
          <FallingPlayer key={meta.key + meta.name} meta={meta} onChangeSong={() => { setMeta(null); bump((n) => n + 1); }}
            stage={stage} setStage={setStage} immersive={immersive} toggleImmersive={toggleImmersive} canImmersive={canFs || phone}
            soundOn={soundOn !== false} onEnableSound={onEnableSound} />
        ) : (
          <div className="fn-lib">
            <header className="fn-bar fn-lib-bar">
              <div className="fn-bar-id">
                <button type="button" className="fn-back" onClick={onBack}><Icon n="back" size={18} /> <span>{window.CURRICULUM[year].label}</span></button>
                <div className="fn-brand"><Logo /><h1>Falling Notes</h1></div>
              </div>
              <div className="fn-bar-end">
                <span className="fn-pill fn-startotal" title="Stars you have earned"><Star /> {starTotal}<small>/{songs.length * 3}</small></span>
                <button type="button" className="fn-icon-btn" onClick={() => setStage(stage === "dark" ? "light" : "dark")}
                  aria-label={stage === "dark" ? "Switch to light look" : "Switch to dark look"} title={stage === "dark" ? "Light look" : "Dark look"}>
                  <Icon n={stage === "dark" ? "sun" : "moon"} />
                </button>
                {fsBtn}
              </div>
            </header>

            <div className="fn-lib-scroll">
              {update ? (
                <div className="fn-updatebar" role="status">
                  <Icon n="restart" size={20} />
                  <span><strong>A new version is ready.</strong> Update to get the latest songs and fixes.</span>
                  <button type="button" className="fn-cta" onClick={applyUpdate}>Update now</button>
                </div>
              ) : null}
              <section className="fn-hero">
                <div className="fn-hero-text">
                  <h2>What will you play today?</h2>
                  <p>Pick a song and play along on a real piano while the mic listens, or tap the keys on the screen. You can hear any song first.</p>
                </div>
                {last ? (
                  <button type="button" className="fn-resume" onClick={() => openSong(last)}>
                    <Thumb meta={last} />
                    <span className="fn-resume-text"><small>Keep going</small><strong>{last.name}</strong></span>
                    <span className="fn-resume-go" aria-hidden="true"><Icon n="play" size={18} /></span>
                  </button>
                ) : null}
              </section>

              <div className="fn-listbar">
                <label className="fn-search">
                  <Icon n="search" size={18} />
                  <span className="sr-only">Search songs</span>
                  <input type="search" placeholder="Search songs" value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
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

              {shown.length ? (
                <ul className="fn-songs">
                  {shown.map((s) => {
                    const stars = bestStars(s.key), t = thumbPaths(s);
                    return (
                      <li key={s.key}>
                        <button type="button" className="fn-card" onClick={() => openSong(s)}>
                          <span className="fn-card-art">
                            <Thumb meta={s} />
                            <span className="fn-card-play" aria-hidden="true"><Icon n="play" size={20} /></span>
                            <span className="fn-card-time">{fmtTime(t.secs)}</span>
                          </span>
                          <span className="fn-card-body">
                            <span className="fn-card-name">{s.name}</span>
                            <span className="fn-card-by">{byline(s)}</span>
                            <span className="fn-card-meta">
                              <span className={"fn-level " + s.level.toLowerCase()}>{s.level}</span>
                              <span className="fn-sig">{t.sig}</span>
                              {stars > 0 ? <Stars n={stars} /> : <span className="fn-new">New</span>}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="fn-empty">No songs match. Try a different word or level.</p>
              )}
            </div>
          </div>
        )}
        {tip ? <InstallTip onClose={() => setTip(false)} /> : null}
      </div>
    );
  }

  window.FallingNotes = FallingNotes;
})();
