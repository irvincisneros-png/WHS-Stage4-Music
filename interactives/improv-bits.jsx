/* ImprovLab — improvisation interactive for MU4-COM-01 (improvises, arranges or composes).
   Students improvise a melody over an auto-playing backing groove using a safe, "always sounds
   good" scale. Supports C major pentatonic and C blues scale. No import/export. */

/* ------------------------------------------------------------------ */
/* Scale definitions                                                    */
/* ------------------------------------------------------------------ */

const SCALES = {
  pentatonic: {
    label: "C Major Pentatonic",
    desc: "Five notes — C D E G A. Bright, open sound. Used in pop, folk, and rock worldwide.",
    notes: [
      { name: "C4",  display: "C",  key: "A" },
      { name: "D4",  display: "D",  key: "S" },
      { name: "E4",  display: "E",  key: "D" },
      { name: "G4",  display: "G",  key: "F" },
      { name: "A4",  display: "A",  key: "G" },
      { name: "C5",  display: "C·", key: "H" },
      { name: "D5",  display: "D·", key: "J" },
    ],
    color: "var(--teal)",
    bassNote: "C3",
    chordNotes: ["C3", "E3", "G3"],
  },
  blues: {
    label: "C Blues Scale",
    desc: "Six notes with a 'blue note' — C Eb F F# G Bb. Earthy, soulful. Blues, jazz and R&B.",
    notes: [
      { name: "C4",   display: "C",   key: "A" },
      { name: "Eb4",  display: "Eb",  key: "S" },
      { name: "F4",   display: "F",   key: "D" },
      { name: "F#4",  display: "F#",  key: "F" },
      { name: "G4",   display: "G",   key: "G" },
      { name: "Bb4",  display: "Bb",  key: "H" },
      { name: "C5",   display: "C·",  key: "J" },
    ],
    color: "var(--terracotta)",
    bassNote: "C3",
    chordNotes: ["C3", "Eb3", "G3"],
  },
};

/* ------------------------------------------------------------------ */
/* Call-and-response ideas pool (shown as a gentle nudge)              */
/* ------------------------------------------------------------------ */

const PROMPTS = [
  "Play a 4-note idea that starts high and falls.",
  "Repeat one note 3 times, then jump up.",
  "Try starting on the last note of the scale and work downward.",
  "Play slow — leave some silence. Let the groove breathe.",
  "Use only 3 notes, but vary the rhythm.",
  "End on C. Does it feel like 'home'?",
  "Start quiet, get louder — let the line crescendo.",
  "Copy the rhythm of the kick drum in your melody.",
];

/* ------------------------------------------------------------------ */
/* ImprovLab component                                                  */
/* ------------------------------------------------------------------ */

function ImprovLab({ scale: scaleProp = "pentatonic", bpm: bpmProp = 92 }) {
  const { useState, useEffect, useRef } = React;

  const [scaleKey, setScaleKey]   = useState(scaleProp in SCALES ? scaleProp : "pentatonic");
  const [bpm, setBpm]             = useState(Math.min(120, Math.max(60, Number(bpmProp) || 92)));
  const [grooving, setGrooving]   = useState(false);
  const [activeNote, setActiveNote] = useState(null);     // note name being held
  const [lit, setLit]             = useState({});         // pad flash state
  const [promptIdx, setPromptIdx] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [notesPlayed, setNotesPlayed] = useState(0);

  const grooveRef  = useRef(null);   // setInterval id for groove loop
  const stepRef    = useRef(0);      // current 16th-note step 0–15
  const bpmRef     = useRef(bpm);    // always-current bpm for interval
  const grooving_  = useRef(false);  // sync ref to avoid stale closure

  const scale = SCALES[scaleKey];

  // keep refs in sync
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  /* ---- Groove engine ---- */
  function startGroove() {
    window.MusicAudio?.resume();
    grooving_.current = true;
    stepRef.current = 0;

    function tick() {
      const s = stepRef.current;
      const A = window.MusicAudio;
      const sc = SCALES[scaleKey];

      // kick: steps 0, 8  (beats 1 & 3 in 16-step)
      if (s === 0 || s === 8)  A?.playKick();
      // snare: steps 4, 12 (beats 2 & 4)
      if (s === 4 || s === 12) A?.playSnare();
      // hi-hat: every even step (8th notes)
      if (s % 2 === 0) A?.playHat(false);
      // bass note: on the downbeat (step 0) and halfway (step 8)
      if (s === 0)  A?.playPluck(sc.bassNote, 0.55, 0.55);
      if (s === 8)  A?.playPluck(sc.bassNote, 0.45, 0.40);
      // soft chord stab on beat 1 only
      if (s === 0)  A?.playChord(sc.chordNotes, 1.8, 0.22);

      stepRef.current = (s + 1) % 16;

      if (grooving_.current) {
        const ms = 60_000 / bpmRef.current / 4; // 16th note interval
        grooveRef.current = setTimeout(tick, ms);
      }
    }

    const ms = 60_000 / bpmRef.current / 4;
    grooveRef.current = setTimeout(tick, ms);
    setGrooving(true);
  }

  function stopGroove() {
    grooving_.current = false;
    if (grooveRef.current) { clearTimeout(grooveRef.current); grooveRef.current = null; }
    stepRef.current = 0;
    setGrooving(false);
  }

  function toggleGroove() {
    if (grooving) { stopGroove(); } else { startGroove(); }
  }

  // stop and restart when scale changes while playing (bass note updates)
  useEffect(() => {
    if (grooving) { stopGroove(); startGroove(); }
  }, [scaleKey]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      grooving_.current = false;
      if (grooveRef.current) clearTimeout(grooveRef.current);
    };
  }, []);

  /* ---- Note pad interaction ---- */
  function flashPad(name) {
    setLit(l => ({ ...l, [name]: true }));
    setTimeout(() => setLit(l => ({ ...l, [name]: false })), 200);
  }

  function playNote(note) {
    window.MusicAudio?.resume();
    window.MusicAudio?.playPiano(note.name, 0.85, 0.82);
    setActiveNote(note.name);
    flashPad(note.name);
    setNotesPlayed(n => n + 1);
    setTimeout(() => setActiveNote(n => n === note.name ? null : n), 420);
  }

  /* ---- Keyboard shortcuts (a s d f g h j) ---- */
  useEffect(() => {
    function onKey(e) {
      if (e.repeat) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      const upper = e.key.toUpperCase();
      const note = scale.notes.find(n => n.key === upper);
      if (note) { playNote(note); return; }
      // space = toggle groove
      if (e.code === "Space") { e.preventDefault(); toggleGroove(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grooving, scaleKey, bpm]);

  /* ---- Prompt cycling ---- */
  function newPrompt() {
    setPromptIdx(i => (i + 1) % PROMPTS.length);
    setShowPrompt(true);
  }

  /* ---- UI helpers ---- */
  const padColor = scale.color;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 20 }}>

      {/* ---- Header ---- */}
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">MU4-COM-01 · Improvisation</div>
          <strong style={{ fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>
            ImprovLab
          </strong>
        </div>
        <div className="row gap-2 wrap" style={{ alignItems: "center" }}>
          <span className="mono text-soft" style={{ fontSize: ".78rem" }}>
            {notesPlayed > 0 ? `${notesPlayed} note${notesPlayed === 1 ? "" : "s"} played` : "make something up"}
          </span>
          {notesPlayed > 0 && (
            <button
              className="btn btn-ghost"
              style={{ padding: "5px 12px", fontSize: ".78rem" }}
              onClick={() => setNotesPlayed(0)}
            >
              Reset count
            </button>
          )}
        </div>
      </div>

      {/* ---- Intro blurb ---- */}
      <div style={{
        background: "var(--bg)",
        border: "1.5px dashed var(--border)",
        borderRadius: 14,
        padding: "14px 18px",
        fontSize: ".9rem",
        lineHeight: 1.6,
        color: "var(--ink-soft)",
      }}>
        <strong style={{ color: "var(--ink)" }}>Improvisation</strong> means making music up
        in the moment — no wrong turns. Every note in this scale will fit with the groove.
        Start the backing track, then tap the pads (or press{" "}
        <span className="mono" style={{ color: "var(--ink)", fontSize: ".82rem" }}>A S D F G H J</span>
        ) to build your own melody on top.
      </div>

      {/* ---- Groove controls row ---- */}
      <div className="row between center wrap gap-3">
        <div className="row gap-3 center wrap">
          <button
            className="btn btn-primary"
            onClick={toggleGroove}
            style={{
              minWidth: 150,
              padding: "12px 24px",
              fontSize: "1rem",
              background: grooving ? "var(--espresso)" : undefined,
              borderColor: grooving ? "var(--espresso)" : undefined,
              transition: "background .2s, border-color .2s",
            }}
            aria-label={grooving ? "Stop groove" : "Start groove"}
          >
            {grooving ? "■ Stop groove" : "▶ Start groove"}
          </button>

          {/* Groove indicator dots */}
          <div className="row gap-1 center" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: grooving ? padColor : "var(--border)",
                  opacity: grooving ? 1 : 0.4,
                  transition: "background .3s, opacity .3s",
                  animationName: grooving ? "improv-pulse" : "none",
                  animationDuration: `${(60 / bpm) * 0.9}s`,
                  animationDelay: `${i * (60 / bpm / 4)}s`,
                  animationIterationCount: "infinite",
                  animationTimingFunction: "ease-in-out",
                }}
              />
            ))}
          </div>
        </div>

        {/* Tempo slider */}
        <div className="row center gap-2 wrap">
          <label
            htmlFor="improv-bpm"
            className="mono text-soft"
            style={{ fontSize: ".82rem", whiteSpace: "nowrap" }}
          >
            Tempo
          </label>
          <input
            id="improv-bpm"
            type="range"
            min={60}
            max={120}
            step={2}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={{ width: 120, accentColor: padColor }}
          />
          <span
            className="mono"
            style={{ fontSize: ".82rem", minWidth: 52, color: "var(--ink)" }}
          >
            {bpm} BPM
          </span>
        </div>
      </div>

      {/* ---- Scale selector ---- */}
      <div>
        <div className="eyebrow mb-2">Scale</div>
        <div className="row gap-2 wrap">
          {Object.entries(SCALES).map(([k, s]) => (
            <button
              key={k}
              className="btn btn-ghost"
              onClick={() => setScaleKey(k)}
              style={{
                background: scaleKey === k ? s.color : undefined,
                color: scaleKey === k ? "#fff" : undefined,
                borderColor: scaleKey === k ? s.color : undefined,
                transition: "background .15s, color .15s, border-color .15s",
              }}
              aria-pressed={scaleKey === k}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-soft" style={{ fontSize: ".84rem", margin: "8px 0 0", lineHeight: 1.5 }}>
          {scale.desc}
        </p>
      </div>

      {/* ---- Note pads ---- */}
      <div>
        <div className="eyebrow mb-2">
          Melody pads — tap, click, or press keyboard keys
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
          gap: 10,
        }}>
          {scale.notes.map((note) => {
            const isLit = lit[note.name];
            const isActive = activeNote === note.name;
            return (
              <button
                key={note.name}
                aria-label={`Play note ${note.display} (${note.name}), keyboard key ${note.key}`}
                onClick={() => playNote(note)}
                style={{
                  height: 90,
                  display: "grid",
                  gap: 4,
                  alignContent: "center",
                  justifyItems: "center",
                  padding: "10px 4px",
                  borderRadius: 16,
                  border: isLit
                    ? `2.5px solid ${padColor}`
                    : "1.5px solid var(--border)",
                  background: isLit
                    ? padColor
                    : isActive
                      ? "var(--bg-2)"
                      : "var(--bg)",
                  color: isLit ? "#fff" : "var(--ink)",
                  cursor: "pointer",
                  transition: "background .08s, border-color .08s, color .08s, transform .08s",
                  transform: isLit ? "scale(1.06)" : "scale(1)",
                  boxShadow: isLit
                    ? `0 4px 0 0 ${padColor}55`
                    : "0 2px 0 0 var(--border)",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}>
                  {note.display}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: ".62rem",
                  opacity: .65,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}>
                  {note.key}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: ".6rem",
                  opacity: .5,
                }}>
                  {note.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Call-and-response prompt ---- */}
      <div style={{
        background: "var(--bg-2)",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
        padding: "14px 18px",
        display: "grid",
        gap: 10,
      }}>
        <div className="row between center wrap gap-2">
          <div>
            <div className="eyebrow">Need an idea?</div>
            <strong style={{ fontSize: ".9rem" }}>Call-and-response prompts</strong>
          </div>
          <button
            className="btn btn-ghost"
            onClick={newPrompt}
            style={{ padding: "8px 16px", fontSize: ".84rem" }}
          >
            {showPrompt ? "Next idea →" : "Give me an idea"}
          </button>
        </div>

        {showPrompt && (
          <div style={{
            background: "var(--bg)",
            border: `1.5px solid ${padColor}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontFamily: "var(--font-body)",
            fontSize: ".95rem",
            lineHeight: 1.55,
            color: "var(--ink)",
          }}>
            <span style={{ color: padColor, fontWeight: 700, marginRight: 6 }}>Try this:</span>
            {PROMPTS[promptIdx]}
          </div>
        )}
      </div>

      {/* ---- Keyboard map legend ---- */}
      <div style={{
        borderTop: "1.5px solid var(--border)",
        paddingTop: 14,
      }}>
        <div className="eyebrow mb-2">Keyboard shortcuts</div>
        <div className="row gap-2 wrap center" style={{ alignItems: "center" }}>
          {scale.notes.map(note => (
            <div key={note.key} className="row gap-1 center" style={{ alignItems: "center" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: ".78rem",
                fontWeight: 700,
                color: "var(--ink)",
                boxShadow: "0 2px 0 0 var(--border)",
              }}>
                {note.key}
              </span>
              <span className="mono text-soft" style={{ fontSize: ".72rem" }}>
                {note.display}
              </span>
            </div>
          ))}
          <div className="row gap-1 center" style={{ alignItems: "center", marginLeft: 8 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 10px",
              height: 26,
              borderRadius: 6,
              background: "var(--bg)",
              border: "1.5px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: ".72rem",
              fontWeight: 700,
              color: "var(--ink-soft)",
              boxShadow: "0 2px 0 0 var(--border)",
            }}>
              SPACE
            </span>
            <span className="mono text-soft" style={{ fontSize: ".72rem" }}>
              groove on/off
            </span>
          </div>
        </div>
      </div>

      {/* ---- Keyframe for pulse animation (inline style block) ---- */}
      <style>{`
        @keyframes improv-pulse {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50%       { opacity: 1;    transform: scale(1.1);  }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Register on window                                                   */
/* ------------------------------------------------------------------ */
window.ImprovLab = ImprovLab;
