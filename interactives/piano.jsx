/* Piano Player: two-octave keyboard with play-along sheet music.
   Ships public-domain melodies plus two ORIGINAL pedagogical exercises
   ("Simple Melody" and "Extension Melody") designed to drill the same skills
   as the Year 7 Flintstones repertoire: 5-finger RH treble reading for
   Simple; LH bass, Am7-Dm7-G7-C turnaround and syncopation for Extension.
   Teachers can also paste a custom note sequence to mirror their printed
   class music.

   The grand staff renders both treble (RH) and bass (LH) lines positioned
   by absolute beat-time, with chord symbols and barlines. */

/* ---------- shared note geometry ---------- */
const STEP_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const MIDDLE_C_Y = 90;  // middle-C ledger line, treble bottom + bass top
const STAFF_STEP = 4;

function diatonicPos(name) {
  const m = name.match(/([A-G])([#b])?(-?\d+)/);
  if (!m) return 0;
  const oct = parseInt(m[3], 10);
  return (oct - 4) * 7 + STEP_INDEX[m[1]];
}
function noteY(name) { return MIDDLE_C_Y - diatonicPos(name) * STAFF_STEP; }
function accidentalOf(name) {
  if (name.includes("#")) return "♯";
  if (name.includes("b")) return "♭";
  return null;
}

/* Convert [[note,beats], ...] into beat-positioned events. */
function annotateBeats(seq) {
  let beat = 0;
  return seq.map(([n, d]) => {
    const e = { note: n, dur: d, startBeat: beat };
    beat += d;
    return e;
  });
}

/* ---------- Grand staff: treble + bass, beat-positioned ---------- */
function GrandStave({ rh, lh, chords, totalBeats, rhPos, lhPos, showNoteNames = true }) {
  const BEAT_PX = 38;
  const PAD_L = 70;
  const PAD_R = 24;

  const rhEvents = React.useMemo(() => annotateBeats(rh || []), [rh]);
  const lhEvents = React.useMemo(() => annotateBeats(lh || []), [lh]);

  const beats = totalBeats || Math.max(
    rhEvents.reduce((a, e) => Math.max(a, e.startBeat + e.dur), 0),
    lhEvents.reduce((a, e) => Math.max(a, e.startBeat + e.dur), 0),
  );

  const width = PAD_L + beats * BEAT_PX + PAD_R;
  const scrollRef = React.useRef(null);

  // Auto-scroll to keep the current note centred
  React.useEffect(() => {
    if (!scrollRef.current || rhPos < 0) return;
    const ev = rhEvents[rhPos];
    if (!ev) return;
    const x = PAD_L + ev.startBeat * BEAT_PX;
    const el = scrollRef.current;
    if (x < el.scrollLeft + 80 || x > el.scrollLeft + el.clientWidth - 80) {
      el.scrollTo({ left: Math.max(0, x - el.clientWidth / 2), behavior: "smooth" });
    }
  }, [rhPos, rhEvents]);

  const trebleY = [50, 58, 66, 74, 82];
  const bassY   = [98, 106, 114, 122, 130];

  // Bar lines every 4 beats (assume 4/4 throughout; that's all our exercises use)
  const bars = [];
  for (let b = 4; b <= beats; b += 4) bars.push(b);

  function renderNote(ev, i, hand, posIdx) {
    const x = PAD_L + ev.startBeat * BEAT_PX + 10;
    const y = noteY(ev.note);
    const isPast = i < posIdx;
    const isCurrent = i === posIdx && hand === "rh";  // only RH highlight
    const color = isCurrent
      ? "var(--terracotta)"
      : isPast ? "var(--ink-soft)"
      : hand === "lh" ? "var(--teal)" : "var(--ink)";
    const opacity = isPast && hand === "rh" ? 0.45 : 1;
    const acc = accidentalOf(ev.note);

    // Ledger lines
    const ledgers = [];
    if (y === 90) ledgers.push(90);
    if (y < 50) for (let ly = 46; ly >= y - 2; ly -= 8) ledgers.push(ly);
    if (y > 130) for (let ly = 134; ly <= y + 2; ly += 8) ledgers.push(ly);
    if (y > 82 && y < 98 && y !== 90) ledgers.push(y < 90 ? 86 : 94);

    // Note head shape: filled for ≤1 beat, hollow for longer
    const isHollow = ev.dur >= 2;
    const isHalf = ev.dur >= 2 && ev.dur < 4;
    const isWhole = ev.dur >= 4;

    // Stem direction
    const stemUp = y >= 66;
    const stemX = stemUp ? x + 5 : x - 5;
    const stemY1 = stemUp ? y - 2 : y + 2;
    const stemY2 = stemUp ? y - 28 : y + 28;

    // Flag for quavers (0.5 beats)
    const hasFlag = ev.dur < 1 && !isHollow;

    return (
      <g key={hand + i} opacity={opacity}>
        {isCurrent && (
          <rect x={x - 14} y={28} width="28" height={140} rx={8}
                fill="var(--terracotta)" opacity=".10" />
        )}
        {ledgers.map((ly, j) => (
          <line key={j} x1={x - 9} x2={x + 9} y1={ly} y2={ly}
                stroke={color} strokeWidth="1.2" />
        ))}
        {acc && (
          <text x={x - 13} y={y + 4} fontSize="14"
                fontFamily="'Bravura Text','Noto Music','Segoe UI Symbol',Georgia,serif"
                fill={color} textAnchor="middle" fontWeight="700">{acc}</text>
        )}
        {/* Notehead */}
        {isHollow ? (
          <ellipse cx={x} cy={y} rx="6" ry="4.4"
                   transform={`rotate(-20 ${x} ${y})`}
                   fill="none" stroke={color} strokeWidth="2" />
        ) : (
          <ellipse cx={x} cy={y} rx="5.6" ry="4.2"
                   transform={`rotate(-20 ${x} ${y})`} fill={color} />
        )}
        {/* Stem (no stem for whole notes) */}
        {!isWhole && (
          <line x1={stemX} y1={stemY1} x2={stemX} y2={stemY2}
                stroke={color} strokeWidth="1.4" />
        )}
        {/* Quaver flag */}
        {hasFlag && (
          <path d={stemUp
            ? `M ${stemX} ${stemY2} q 8 4 8 12`
            : `M ${stemX} ${stemY2} q 8 -4 8 -12`}
            stroke={color} strokeWidth="1.6" fill="none" />
        )}
        {/* Dotted-note dot */}
        {ev.dur === 1.5 || ev.dur === 3 ? (
          <circle cx={x + 10} cy={y} r="1.6" fill={color} />
        ) : null}
        {/* Note letter under treble notes only (bass labels would clutter) */}
        {hand === "rh" && showNoteNames && (
          <text x={x} y={160}
                className="grand-stave-note-name"
                fontSize="9.5"
                fontFamily="var(--font-mono)"
                fill={color}
                textAnchor="middle"
                fontWeight={isCurrent ? 700 : 500}
                letterSpacing=".5">{ev.note.replace(/\d/, "")}</text>
        )}
      </g>
    );
  }

  return (
    <div ref={scrollRef} style={{
      overflowX: "auto",
      padding: "14px 14px 10px",
      background: "var(--bg)",
      border: "1.5px solid var(--border)",
      borderRadius: 12,
      marginBottom: 14,
    }}>
      <svg viewBox={`0 0 ${width} 185`}
           width={width} height="185"
           style={{ display: "block", color: "var(--ink)" }}>
        {/* Staves */}
        <g stroke="currentColor" strokeWidth="1" opacity=".85">
          {trebleY.map(y => <line key={"t"+y} x1={PAD_L - 12} x2={width - 8} y1={y} y2={y} />)}
          {bassY.map(y => <line key={"b"+y} x1={PAD_L - 12} x2={width - 8} y1={y} y2={y} />)}
        </g>
        {/* Brace */}
        <path d={`M ${PAD_L - 22} 50 Q ${PAD_L - 34} 90 ${PAD_L - 22} 130 Q ${PAD_L - 14} 90 ${PAD_L - 22} 50 Z`}
              fill="currentColor" opacity=".85" />
        {/* Clefs */}
        <text x={PAD_L - 8} y={82}
              fontSize="42"
              fontFamily="'Bravura Text','Noto Music','Segoe UI Symbol','Apple Symbols',Georgia,serif"
              fill="currentColor" textAnchor="end">𝄞</text>
        {(lhEvents.length > 0) && (
          <text x={PAD_L - 8} y={126}
                fontSize="28"
                fontFamily="'Bravura Text','Noto Music','Segoe UI Symbol','Apple Symbols',Georgia,serif"
                fill="currentColor" textAnchor="end">𝄢</text>
        )}
        {/* Barlines */}
        {bars.map((b, i) => {
          const x = PAD_L + b * BEAT_PX - 4;
          const isFinal = i === bars.length - 1;
          return (
            <line key={"bl"+i} x1={x} x2={x} y1="50" y2={lhEvents.length > 0 ? 130 : 82}
                  stroke="currentColor" strokeWidth={isFinal ? 2.2 : 1}
                  opacity={isFinal ? .85 : .45} />
          );
        })}
        {/* Chord symbols above treble */}
        {(chords || []).map((c, i) => {
          const x = PAD_L + c.beat * BEAT_PX + 10;
          return (
            <text key={"c"+i} x={x} y={36}
                  fontSize="13" fontWeight="700"
                  fontFamily="var(--font-display)"
                  fill="var(--butter-d)" textAnchor="middle"
                  letterSpacing="-.02em">{c.label}</text>
          );
        })}
        {/* RH notes */}
        {rhEvents.map((ev, i) => renderNote(ev, i, "rh", rhPos))}
        {/* LH notes */}
        {lhEvents.map((ev, i) => renderNote(ev, i, "lh", lhPos))}
      </svg>
    </div>
  );
}

/* MIDI note names laid out for two octaves starting at C4 */
const WHITE_KEYS = [
  "C4","D4","E4","F4","G4","A4","B4",
  "C5","D5","E5","F5","G5","A5","B5",
  "C6",
];
const BLACK_KEY_INFO = [
  ["C#4", 0], ["D#4", 1], ["F#4", 3], ["G#4", 4], ["A#4", 5],
  ["C#5", 7], ["D#5", 8], ["F#5",10], ["G#5",11], ["A#5",12],
];

/* ---------- Repertoire ----------
   Hot Cross Buns, Twinkle, Ode, Mary: public-domain warm-ups.
   simpleStone & extensionStone: ORIGINAL exercises composed to mirror the
   pedagogical aims of the Year 7 Flintstones Simple / Extension sheets.
   Teachers play the printed sheets in class; these exercises drill the same
   skills (5-finger RH; LH bass + chord turnaround) on-screen. */
const SONGS = {
  simpleStone: {
    name: "Flintstones Simple",
    note: "Original exercise · 5-finger RH treble in C major · same skills as Flintstones · Simple",
    bpm: 100,
    tag: "Y7 PIANO",
    rh: [
      // Phrase A
      ["G4",2],["C4",1],["C5",1],
      ["A4",1],["G4",2],["C4",1],
      ["G4",1],["F4",1],["E4",0.5],["E4",0.5],["F4",1],
      ["G4",1],["C4",0.5],["D4",0.5],["E4",2],
      // Phrase B
      ["G4",1],["C4",1],["C5",1],["A4",1],
      ["G4",2],["C4",1],["G4",1],
      ["F4",1],["E4",0.5],["E4",0.5],["F4",1],["G4",1],
      ["C4",0.5],["D4",0.5],["C4",2],
    ],
  },

  extensionStone: {
    name: "Extension Melody",
    note: "Original exercise · LH bass + Am7–Dm7–G7–C turnaround · same skills as Flintstones · Extension",
    bpm: 96,
    tag: "Y7 PIANO+",
    rh: [
      // Bar 1 (C)
      ["E5",1],["G5",1],["C6",2],
      // Bar 2 (Am7): dotted syncopation
      ["A5",1.5],["G5",0.5],["E5",2],
      // Bar 3 (Dm7)
      ["F5",1],["A5",1],["D6",1],["A5",1],
      // Bar 4 (G7)
      ["G5",1],["F5",1],["E5",2],
      // Bar 5 (C): quaver pickup
      ["E5",0.5],["G5",0.5],["C6",1],["G5",1],["E5",1],
      // Bar 6 (Am7)
      ["A5",0.5],["E5",0.5],["A5",1],["C6",2],
      // Bar 7 (Dm7 → G7)
      ["F5",1],["E5",1],["D5",1],["F5",1],
      // Bar 8 (C)
      ["E5",1],["G5",1],["C6",2],
    ],
    lh: [
      // Bar 1 (C): root, 5th, root, 5th
      ["C3",1],["G3",1],["C3",1],["G3",1],
      // Bar 2 (Am7)
      ["A2",1],["E3",1],["A2",1],["E3",1],
      // Bar 3 (Dm7)
      ["D3",1],["A3",1],["D3",1],["A3",1],
      // Bar 4 (G7): adding the b7 (F)
      ["G2",1],["D3",1],["G2",1],["F3",1],
      // Bar 5 (C)
      ["C3",1],["G3",1],["C3",1],["G3",1],
      // Bar 6 (Am7)
      ["A2",1],["E3",1],["A2",1],["E3",1],
      // Bar 7 (Dm7 → G7)
      ["D3",1],["A3",1],["G2",1],["D3",1],
      // Bar 8 (C)
      ["C3",1],["G3",1],["C3",2],
    ],
    chords: [
      { beat:0,  label:"C"   },
      { beat:4,  label:"Am7" },
      { beat:8,  label:"Dm7" },
      { beat:12, label:"G7"  },
      { beat:16, label:"C"   },
      { beat:20, label:"Am7" },
      { beat:24, label:"Dm7" },
      { beat:26, label:"G7"  },
      { beat:28, label:"C"   },
    ],
  },

  hotcross: {
    name: "Hot Cross Buns",
    note: "Traditional · public domain",
    bpm: 100,
    tag: "WARM-UP",
    rh: [
      ["E5",1],["D5",1],["C5",2],
      ["E5",1],["D5",1],["C5",2],
      ["C5",0.5],["C5",0.5],["C5",0.5],["C5",0.5],
      ["D5",0.5],["D5",0.5],["D5",0.5],["D5",0.5],
      ["E5",1],["D5",1],["C5",2],
    ],
    lh: [
      // Bar 1 (C): root + fifth, half notes
      ["C3",2],["G3",2],
      // Bar 2 (C): root + fifth
      ["C3",2],["G3",2],
      // Bar 3 (C, buns): held root underneath the busy RH eighths
      ["C3",4],
      // Bar 4 (C): root, fifth, root (final cadence)
      ["C3",1],["G3",1],["C3",2],
    ],
  },
  twinkle: {
    name: "Twinkle Twinkle",
    note: "Traditional · public domain",
    bpm: 110,
    tag: "WARM-UP",
    rh: [
      ["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],
      ["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2],
    ],
    lh: [
      // Bar 1 (C): alternate root and fifth on the half
      ["C3",2],["G3",2],
      // Bar 2 (F → C): half-bar chord change
      ["F2",2],["C3",2],
      // Bar 3 (C → G): still in tonic, hint of dominant
      ["C3",2],["G3",2],
      // Bar 4 (G → C): V to I cadence to home
      ["G2",2],["C3",2],
    ],
  },
  ode: {
    name: "Ode to Joy",
    note: "Beethoven · public domain",
    bpm: 96,
    tag: "REPERTOIRE",
    rh: [
      ["E4",1],["E4",1],["F4",1],["G4",1],
      ["G4",1],["F4",1],["E4",1],["D4",1],
      ["C4",1],["C4",1],["D4",1],["E4",1],
      ["E4",1.5],["D4",0.5],["D4",2],
    ],
    lh: [
      // Bar 1 (C): root–fifth–root–fifth on each crotchet
      ["C3",1],["G3",1],["C3",1],["G3",1],
      // Bar 2 (C → G): tonic for two beats, then dominant
      ["C3",1],["G3",1],["G2",1],["G2",1],
      // Bar 3 (C): back home
      ["C3",1],["G3",1],["C3",1],["G3",1],
      // Bar 4 (G → C): V → I cadence
      ["G2",2],["C3",2],
    ],
  },
  mary: {
    name: "Mary Had a Little Lamb",
    note: "Traditional · public domain",
    bpm: 108,
    tag: "WARM-UP",
    rh: [
      ["E4",1],["D4",1],["C4",1],["D4",1],
      ["E4",1],["E4",1],["E4",2],
      ["D4",1],["D4",1],["D4",2],
      ["E4",1],["G4",1],["G4",2],
    ],
    lh: [
      // Bar 1 (C): hold the root for the whole bar
      ["C3",4],
      // Bar 2 (C): hold root (RH sits on E)
      ["C3",4],
      // Bar 3 (G): V chord (RH sits on D)
      ["G2",4],
      // Bar 4 (C): home
      ["C3",4],
    ],
  },
};

/* Parse "E4 D4 C4/2 F#5 ..." (slash = duration in beats; default 1) */
function parseCustom(text) {
  const tokens = text.trim().split(/[\s,]+/).filter(Boolean);
  const seq = [];
  for (const t of tokens) {
    const m = t.match(/^([A-Ga-g][#b]?)(-?\d)(?:\/(\d+(?:\.\d+)?))?$/);
    if (!m) continue;
    const name = m[1][0].toUpperCase() + m[1].slice(1).replace("B","b") + m[2];
    seq.push([name, m[3] ? parseFloat(m[3]) : 1]);
  }
  return seq;
}

function PianoPlayer({ topic, difficulty, onComplete }) {
  const initialKey = (topic && topic.pianoSong && SONGS[topic.pianoSong])
    ? topic.pianoSong
    : "simpleStone";
  const [selected, setSelected] = React.useState(initialKey);
  const [custom, setCustom] = React.useState(null);   // { name, rh } or null
  const [showCustom, setShowCustom] = React.useState(false);
  const [customText, setCustomText] = React.useState("E4 G4 C5/2 G4 E4 C4/2");

  const song = custom || SONGS[selected];

  const [rhPos, setRhPos] = React.useState(-1);
  const [lhPos, setLhPos] = React.useState(-1);
  const [autoplay, setAutoplay] = React.useState(false);
  const [tempo, setTempo] = React.useState(song.bpm);
  const [activeKeys, setActiveKeys] = React.useState(new Set());
  const [scoreHits, setScoreHits] = React.useState(0);
  const [scoreMiss, setScoreMiss] = React.useState(0);

  const expectedRef = React.useRef(null);
  const rhTimer = React.useRef(null);
  const lhTimer = React.useRef(null);

  React.useEffect(() => { setTempo(song.bpm); reset(); }, [selected, custom]);
  React.useEffect(() => () => { clearTimeout(rhTimer.current); clearTimeout(lhTimer.current); }, []);

  // Computer-keyboard mapping
  const keyMap = {
    a: "C4", w: "C#4", s: "D4", e: "D#4", d: "E4", f: "F4", t: "F#4",
    g: "G4", y: "G#4", h: "A4", u: "A#4", j: "B4",
    k: "C5", o: "C#5", l: "D5", p: "D#5", ";": "E5", "'": "F5",
  };
  React.useEffect(() => {
    const down = (e) => {
      // ignore when user is typing into the custom-notes textarea
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = keyMap[e.key.toLowerCase()];
      if (n) pressKey(n);
    };
    const up = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = keyMap[e.key.toLowerCase()];
      if (n) releaseKey(n);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  function pressKey(n) {
    window.MusicAudio?.playPiano(n, 0.6);
    setActiveKeys(s => new Set(s).add(n));
    const exp = expectedRef.current;
    if (exp && n === exp) {
      setScoreHits(h => h + 1);
      expectedRef.current = null;
      advance();
    } else if (exp) {
      setScoreMiss(m => m + 1);
    }
  }
  function releaseKey(n) {
    setActiveKeys(s => { const ns = new Set(s); ns.delete(n); return ns; });
  }

  function reset() {
    clearTimeout(rhTimer.current);
    clearTimeout(lhTimer.current);
    setRhPos(-1);
    setLhPos(-1);
    setScoreHits(0);
    setScoreMiss(0);
    setAutoplay(false);
    expectedRef.current = null;
  }

  function start({ auto }) {
    reset();
    setAutoplay(auto);
    setRhPos(0);
    expectedRef.current = song.rh[0][0];
    if (auto) {
      playRhSeq(0);
      if (song.lh) playLhSeq(0);
    }
  }

  function playRhSeq(i) {
    if (i >= song.rh.length) {
      setRhPos(-1);
      onComplete?.();
      return;
    }
    const [note, beats] = song.rh[i];
    setRhPos(i);
    expectedRef.current = note;
    window.MusicAudio?.playPiano(note, beats * 0.7);
    setActiveKeys(s => new Set(s).add(note));
    rhTimer.current = setTimeout(() => {
      setActiveKeys(s => { const ns = new Set(s); ns.delete(note); return ns; });
      playRhSeq(i + 1);
    }, (60000 / tempo) * beats);
  }

  function playLhSeq(i) {
    if (!song.lh || i >= song.lh.length) { setLhPos(-1); return; }
    const [note, beats] = song.lh[i];
    setLhPos(i);
    window.MusicAudio?.playPiano(note, beats * 0.7, 0.55);
    lhTimer.current = setTimeout(() => playLhSeq(i + 1), (60000 / tempo) * beats);
  }

  function advance() {
    setRhPos(i => {
      const next = i + 1;
      if (next >= song.rh.length) {
        onComplete?.();
        return -1;
      }
      expectedRef.current = song.rh[next][0];
      return next;
    });
  }

  function applyCustom() {
    const parsed = parseCustom(customText);
    if (parsed.length === 0) return;
    setCustom({ name: "Custom melody", note: "Teacher-supplied notes", bpm: tempo, rh: parsed });
    setShowCustom(false);
  }

  // ---- Layout dimensions ----
  const KW = 44;
  const KH = 170;
  const totalW = WHITE_KEYS.length * KW;

  // Total beats for staff width
  const totalBeats = React.useMemo(() => {
    const r = (song.rh || []).reduce((a, [, d]) => a + d, 0);
    const l = (song.lh || []).reduce((a, [, d]) => a + d, 0);
    return Math.max(r, l);
  }, [song]);

  // Next-expected note (for keyboard hint outline)
  const nextNote = rhPos >= 0 && rhPos < song.rh.length ? song.rh[rhPos][0] : null;
  const finished = rhPos === -1 && scoreHits > 0;

  function whiteIsActive(n) { return activeKeys.has(n); }
  function blackIsActive(n) { return activeKeys.has(n); }

  const isStoneAge = selected === "simpleStone" || selected === "extensionStone";

  return (
    <div className="chunk paper" style={{ padding: 20 }}>

      {/* Song picker */}
      <div className="row between center wrap gap-3 mb-3">
        <div className="row gap-2 wrap">
          {Object.entries(SONGS).map(([k, v]) => (
            <button key={k}
              className={"chip " + (selected === k && !custom ? "solid-terracotta" : "")}
              onClick={() => { setCustom(null); setSelected(k); }}
              style={{ cursor: "pointer" }}>
              <span style={{ all: "unset" }}>{v.name}</span>
              {v.tag && <span style={{ marginLeft: 6, opacity: .65, fontSize: ".62rem" }}>{v.tag}</span>}
            </button>
          ))}
          <button className={"chip " + (custom ? "solid-teal" : "")} onClick={() => setShowCustom(s => !s)}>
            <span style={{ all: "unset" }}>+ Custom notes</span>
          </button>
        </div>
        <div className="row gap-2 wrap">
          <Chip>♩ = {tempo} bpm</Chip>
          {song.lh && <Chip variant="butter">LH bass · 2 hands</Chip>}
          {rhPos >= 0 && <Chip variant="teal">{scoreHits}✓ · {scoreMiss}✗</Chip>}
          {finished && <Chip variant="terracotta">Done · {scoreHits}/{song.rh.length}</Chip>}
        </div>
      </div>

      {/* Tempo slider */}
      <div className="row center gap-3 wrap mb-3" style={{ fontSize: ".82rem" }}>
        <label className="mono" style={{ color: "var(--ink-soft)" }}>TEMPO</label>
        <input type="range" min="50" max="160" step="2" value={tempo}
               onChange={(e) => setTempo(parseInt(e.target.value, 10))}
               style={{ width: 200, accentColor: "var(--terracotta)" }} />
        <span className="mono" style={{ minWidth: 64 }}>{tempo} bpm</span>
        {song.bpm !== tempo && (
          <button className="chip" onClick={() => setTempo(song.bpm)}
                  style={{ cursor: "pointer" }}>
            <span style={{ all: "unset" }}>↺ reset {song.bpm}</span>
          </button>
        )}
      </div>

      {/* Custom melody editor */}
      {showCustom && (
        <div style={{
          background: "var(--bg)",
          border: "1.5px dashed var(--border)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Paste your class melody</div>
          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", margin: "0 0 8px" }}>
            One note per token. Add <code>/2</code> for a minim, <code>/0.5</code> for a quaver, <code>/4</code> for a semibreve. Default = crotchet (1 beat). Example: <code>E4 G4 C5/2 G4 E4 C4/2</code>
          </p>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              fontFamily: "var(--font-mono)",
              fontSize: ".88rem",
              padding: 10,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--bg-2)",
              color: "var(--ink)",
              resize: "vertical",
            }}
          />
          <div className="row gap-2 mt-2">
            <button className="btn btn-primary" onClick={applyCustom}>Load notes</button>
            <button className="btn btn-ghost" onClick={() => setShowCustom(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Transport */}
      <div className="row center gap-3 wrap mb-4">
        <button className="btn btn-primary" onClick={() => start({ auto: true })}>▶ Demo (listen)</button>
        <button className="btn btn-teal" onClick={() => start({ auto: false })}>🎹 Play along</button>
        <button className="btn btn-ghost" onClick={reset}>↻ Reset</button>
      </div>

      {/* Grand staff */}
      <GrandStave
        rh={song.rh}
        lh={song.lh || []}
        chords={song.chords || []}
        totalBeats={totalBeats}
        rhPos={rhPos}
        lhPos={lhPos}
      />

      {/* Piano */}
      <div style={{ overflowX: "auto", paddingBottom: 6 }}>
        <div style={{
          position: "relative",
          width: totalW,
          height: KH,
          margin: "0 auto",
        }}>
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            {WHITE_KEYS.map(n => (
              <div
                key={n}
                role="button"
                tabIndex={0}
                aria-label={n}
                className={"key-white" + (whiteIsActive(n) ? " active" : "") + (n === nextNote ? " hint" : "")}
                onMouseDown={() => pressKey(n)}
                onMouseUp={() => releaseKey(n)}
                onMouseLeave={() => releaseKey(n)}
                onTouchStart={(e) => { e.preventDefault(); pressKey(n); }}
                onTouchEnd={() => releaseKey(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pressKey(n);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    releaseKey(n);
                  }
                }}
                style={{
                  width: KW, height: KH, cursor: "pointer",
                  outline: n === nextNote ? "3px solid var(--terracotta)" : "none",
                  outlineOffset: -3,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div style={{
                  position: "absolute", bottom: 8, left: 0, right: 0,
                  textAlign: "center",
                  fontFamily: "var(--font-mono)", fontSize: ".7rem",
                  color: "var(--ink-soft)",
                  pointerEvents: "none",
                }}>{n.replace(/\d/, "")}</div>
              </div>
            ))}
          </div>
          {BLACK_KEY_INFO.map(([n, after]) => {
            const left = (after + 1) * KW - KW * 0.32;
            return (
              <div
                key={n}
                role="button"
                tabIndex={0}
                aria-label={n}
                className={"key-black" + (blackIsActive(n) ? " active" : "")}
                onMouseDown={() => pressKey(n)}
                onMouseUp={() => releaseKey(n)}
                onMouseLeave={() => releaseKey(n)}
                onTouchStart={(e) => { e.preventDefault(); pressKey(n); }}
                onTouchEnd={() => releaseKey(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pressKey(n);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    releaseKey(n);
                  }
                }}
                style={{
                  left, top: 0,
                  width: KW * 0.64, height: KH * 0.62,
                  zIndex: 2,
                  outline: n === nextNote ? "3px solid var(--butter)" : "none",
                  outlineOffset: -2,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="text-soft mt-4 center-text" style={{ fontSize: ".82rem", lineHeight: 1.5 }}>
        <strong>{song.name}.</strong> {song.note}. Play with mouse, touch or computer keyboard
        (<span className="mono">A row</span> = white keys C4–F5; <span className="mono">W E T Y U</span> / <span className="mono">O P</span> = black keys).
        The next note is outlined in <span style={{ color: "var(--terracotta)" }}>orange</span>.
      </div>

      {isStoneAge && (
        <div style={{
          marginTop: 14,
          padding: "12px 14px",
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          fontSize: ".82rem",
          lineHeight: 1.5,
          color: "var(--ink-soft)",
        }}>
          <strong style={{ color: "var(--ink)" }}>For class:</strong> these are original on-screen
          exercises that drill the {selected === "simpleStone"
            ? "5-finger RH treble reading"
            : "two-hand coordination, LH bass and Am7–Dm7–G7–C turnaround"} you need for the
          printed Flintstones {selected === "simpleStone" ? "Simple" : "Extension"} sheet.
          Use the printed sheet for performance; warm up here. Use <em>+ Custom notes</em> to paste any class melody.
        </div>
      )}
    </div>
  );
}

window.PianoPlayer = PianoPlayer;
