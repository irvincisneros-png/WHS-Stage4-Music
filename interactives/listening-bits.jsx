/* Listening-in-Context mini interactives.
   Adds depth to the three sections of "Listening in Context":
     · RhythmDictation, HighSameLow   → Active Listening
     · ListenAndLabel, VocabMatcher   → Words That Earn Marks
     · ContextMatcher                 → Music in Context
   Components register onto window for use by sections-data.jsx. */

const { useEffect: useLEf, useRef: useLRf, useState: useLSt } = React;
const LA = () => window.MusicAudio;

/* ================================================================== */
/* RhythmDictation — listen → reconstruct                              */
/* Uses Woonona High mnemonics: Tea / Coff-ee / Straw-ber-ry /         */
/* Ber-ry-straw / Shh (rest). Beat subdivided into 4 sixteenths.       */
/* ================================================================== */
function RhythmDictation({ bpm = 76 }) {
  // Each cell = 1 beat, subdivided into 4 sixteenth-pulses.
  const PATTERNS = {
    TEA: {
      label: "Tea",
      say: "tea",
      desc: "Crotchet · 1 beat",
      color: "var(--terracotta)",
      pulses: [1, 0, 0, 0],
    },
    COFFEE: {
      label: "Coff-ee",
      say: "coff·ee",
      desc: "Two quavers",
      color: "var(--teal)",
      pulses: [1, 0, 1, 0],
    },
    STRAWBERRY: {
      label: "Straw-ber-ry",
      say: "straw·ber·ry",
      desc: "Quaver + 2 semis",
      color: "var(--butter-d)",
      pulses: [1, 0, 1, 1],
    },
    BERRYSTRAW: {
      label: "Ber-ry-straw",
      say: "ber·ry·straw",
      desc: "2 semis + quaver",
      color: "var(--espresso)",
      pulses: [1, 1, 1, 0],
    },
    SHH: {
      label: "Shh",
      say: "shh",
      desc: "Crotchet rest",
      color: "var(--ink-soft)",
      pulses: [0, 0, 0, 0],
    },
  };

  const RHYTHMS = [
    { name: "Warm-up · Tea time",     cells: ["TEA", "TEA", "COFFEE", "TEA"] },
    { name: "Coffee morning",         cells: ["COFFEE", "TEA", "COFFEE", "TEA"] },
    { name: "Berry treat",            cells: ["TEA", "STRAWBERRY", "TEA", "SHH"] },
    { name: "Café special",           cells: ["COFFEE", "STRAWBERRY", "TEA", "BERRYSTRAW"] },
    { name: "Berry milkshake",        cells: ["STRAWBERRY", "BERRYSTRAW", "COFFEE", "TEA"] },
  ];

  const [idx, setIdx] = useLSt(0);
  const [answer, setAnswer] = useLSt(["", "", "", ""]);
  const [revealed, setRev] = useLSt(false);
  const [playing, setPlaying] = useLSt(false);
  const [phase, setPhase] = useLSt(""); // "count" | "play" | ""
  const timersRef = useLRf([]);

  const target = RHYTHMS[idx];
  const beatMs = 60_000 / bpm;
  const sixteenthMs = beatMs / 4;

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function next() {
    clearTimers();
    setIdx((i) => (i + 1) % RHYTHMS.length);
    setAnswer(["", "", "", ""]);
    setRev(false);
    setPlaying(false);
    setPhase("");
  }

  function play() {
    if (playing) return;
    LA()?.resume();
    clearTimers();
    setPlaying(true);
    setPhase("count");

    // 4-beat count-in (woodblock)
    for (let i = 0; i < 4; i++) {
      timersRef.current.push(
        setTimeout(() => LA()?.click(i === 0), i * beatMs),
      );
    }
    timersRef.current.push(setTimeout(() => setPhase("play"), 4 * beatMs - 30));

    // play rhythm — each beat is 4 sixteenths
    target.cells.forEach((c, ci) => {
      PATTERNS[c].pulses.forEach((p, pi) => {
        if (p === 1) {
          const at = 4 * beatMs + (ci * 4 + pi) * sixteenthMs;
          // shorter note for finer subdivisions so they sound crisp
          const dur = 0.18;
          timersRef.current.push(
            setTimeout(() => LA()?.playPiano("C5", dur, 0.78), at),
          );
        }
      });
    });

    const total = 4 * beatMs + 4 * 4 * sixteenthMs;
    timersRef.current.push(
      setTimeout(() => {
        setPlaying(false);
        setPhase("");
      }, total + 200),
    );
  }

  useLEf(() => clearTimers, []);

  function setBeat(b, k) {
    if (revealed) return;
    setAnswer((a) => a.map((v, i) => (i === b ? k : v)));
  }

  // single-cell audition (plays just one beat's worth of the pattern)
  function previewCell(k) {
    LA()?.resume();
    clearTimers();
    PATTERNS[k].pulses.forEach((p, pi) => {
      if (p === 1) {
        timersRef.current.push(
          setTimeout(() => LA()?.playPiano("C5", 0.18, 0.7), pi * sixteenthMs),
        );
      }
    });
  }

  const filled = answer.every((v) => v !== "");
  const correct = answer.every((v, i) => v === target.cells[i]);
  const score = answer.filter((v, i) => v === target.cells[i]).length;

  // ----- cell visual: stylised note glyphs from primitives ---------------
  // Renders a small picture of the rhythm cell's pulses so it reads at a glance.
  function CellGlyph({ pattern, accent }) {
    const W = 88, H = 36;
    const baselineY = 26;
    const stemTop = 6;
    const noteR = 4;
    const beamY = 9;
    if (pattern === "SHH") {
      return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 84 }}>
          <text x={W / 2} y={baselineY} textAnchor="middle"
            fontFamily="serif" fontSize={26} fill={accent || "var(--ink-soft)"}>
            𝄽
          </text>
        </svg>
      );
    }
    const p = PATTERNS[pattern].pulses; // length 4
    const xs = [W * 0.18, W * 0.40, W * 0.62, W * 0.84];
    // build groups of consecutive 1s — those get beamed
    const groups = [];
    let cur = null;
    p.forEach((v, i) => {
      if (v === 1) {
        if (cur) cur.end = i;
        else { cur = { start: i, end: i }; groups.push(cur); }
      } else {
        cur = null;
      }
    });

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 84 }}>
        {/* baseline */}
        <line x1={4} y1={baselineY} x2={W - 4} y2={baselineY}
          stroke="var(--ink-soft)" strokeWidth="0.5" opacity="0.25" />

        {/* draw each note */}
        {p.map((v, i) => {
          if (!v) return null;
          const x = xs[i];
          // crotchet (TEA) has no beam — solo stem with no flag
          // others are in a beam group
          return (
            <g key={i}>
              <ellipse cx={x} cy={baselineY - noteR + 0.5} rx={noteR + 1.5} ry={noteR - 0.5}
                fill={accent || "var(--ink)"} transform={`rotate(-18 ${x} ${baselineY - noteR + 0.5})`} />
              <line x1={x + noteR + 0.5} y1={baselineY - noteR + 1}
                x2={x + noteR + 0.5} y2={stemTop}
                stroke={accent || "var(--ink)"} strokeWidth="1.4" />
            </g>
          );
        })}

        {/* beams: per group, draw a thick beam line across the stems */}
        {groups.map((g, gi) => {
          if (g.start === g.end && pattern === "TEA") {
            // crotchet — no beam (handled below as a no-op)
            return null;
          }
          if (pattern === "TEA") return null;

          const xStart = xs[g.start] + noteR + 0.5;
          const xEnd   = xs[g.end]   + noteR + 0.5;
          // main beam (top)
          // for STRAWBERRY (1 quaver + 2 semis), the first note is a quaver (single beam over only itself? actually beamed together, the first connects to the 2nd with single beam, then 2nd-3rd get double beam)
          // Simplify: draw main beam across whole group; add secondary beams only between adjacent semiquaver pulses (where there are two consecutive 1s separated by no rest gap AND not the lone quaver).
          // For all our patterns:
          //   COFFEE     pulses [1,0,1,0]  -> no group (only one pulse per group? actually [1,0,1,0]: groups = [{0,0},{2,2}]). Two separate quavers — each beamed alone? In standard notation, COFFEE = two quavers beamed together. So special-case it.
          //   STRAWBERRY [1,0,1,1] -> groups [{0,0},{2,3}]. Lone quaver, then beamed pair of semis.
          //   BERRYSTRAW [1,1,1,0] -> group {0,2}. Three notes; semi-semi-quaver pattern.
          // We'll draw beams manually per-pattern below; skip default group beams.
          return null;
        })}

        {/* per-pattern beam overrides */}
        {pattern === "COFFEE" && (
          <line
            x1={xs[0] + noteR + 0.5} y1={beamY}
            x2={xs[2] + noteR + 0.5} y2={beamY}
            stroke={accent || "var(--ink)"} strokeWidth="2.4" strokeLinecap="round" />
        )}
        {pattern === "STRAWBERRY" && (
          <>
            {/* primary beam across all three notes */}
            <line
              x1={xs[0] + noteR + 0.5} y1={beamY}
              x2={xs[3] + noteR + 0.5} y2={beamY}
              stroke={accent || "var(--ink)"} strokeWidth="2.4" strokeLinecap="round" />
            {/* secondary beam only between the two semis (positions 2 and 3) */}
            <line
              x1={xs[2] + noteR + 0.5} y1={beamY + 4}
              x2={xs[3] + noteR + 0.5} y2={beamY + 4}
              stroke={accent || "var(--ink)"} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        {pattern === "BERRYSTRAW" && (
          <>
            <line
              x1={xs[0] + noteR + 0.5} y1={beamY}
              x2={xs[2] + noteR + 0.5} y2={beamY}
              stroke={accent || "var(--ink)"} strokeWidth="2.4" strokeLinecap="round" />
            <line
              x1={xs[0] + noteR + 0.5} y1={beamY + 4}
              x2={xs[1] + noteR + 0.5} y2={beamY + 4}
              stroke={accent || "var(--ink)"} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 16 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Rhythm dictation · Woonona mnemonics</div>
          <strong>Listen, then build the rhythm · {target.name} · {bpm} BPM</strong>
        </div>
        <div className="row gap-2">
          <button
            className="btn btn-primary"
            onClick={play}
            disabled={playing}
            style={{ padding: "8px 18px" }}
          >
            {playing
              ? (phase === "count" ? "1 · 2 · 3 · 4…" : "♪ Rhythm…")
              : "▶ Play"}
          </button>
          <button className="btn btn-ghost" onClick={next} style={{ padding: "8px 14px" }}>
            ↻ New
          </button>
        </div>
      </div>

      <p className="text-soft" style={{ fontSize: ".88rem", margin: 0 }}>
        4-beat count-in, then a 4-beat rhythm. Say it back using <em>tea · coff·ee · straw·ber·ry · ber·ry·straw · shh</em>, then choose the matching cell for each beat.
      </p>

      {/* Mnemonic legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
        }}
      >
        {Object.entries(PATTERNS).map(([k, P]) => (
          <button
            key={k}
            onClick={() => previewCell(k)}
            className="btn btn-ghost"
            style={{
              padding: "8px 6px",
              display: "grid",
              gap: 2,
              justifyItems: "center",
              textAlign: "center",
            }}
          >
            <div style={{ height: 28, display: "flex", alignItems: "center" }}>
              <CellGlyph pattern={k} accent={P.color} />
            </div>
            <strong
              style={{
                fontFamily: "var(--font-display)",
                fontSize: ".82rem",
                color: P.color,
                lineHeight: 1.1,
              }}
            >
              {P.say}
            </strong>
            <span
              className="mono text-soft"
              style={{ fontSize: ".62rem", letterSpacing: ".04em" }}
            >
              {P.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Beat slots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[0, 1, 2, 3].map((b) => {
          const choice = answer[b];
          const truth = target.cells[b];
          const right = revealed && choice === truth;
          const wrong = revealed && choice !== truth;
          const P = choice ? PATTERNS[choice] : null;
          return (
            <div
              key={b}
              style={{
                display: "grid",
                gap: 6,
                padding: "12px 8px",
                background: "var(--bg)",
                borderRadius: 12,
                border:
                  "1.5px solid " +
                  (right ? "var(--teal)" : wrong ? "#a44" : "var(--border)"),
              }}
            >
              <div className="mono text-soft" style={{ fontSize: ".7rem", textAlign: "center" }}>
                BEAT {b + 1}
              </div>
              <div
                style={{
                  display: "grid",
                  justifyItems: "center",
                  gap: 2,
                  minHeight: 54,
                }}
              >
                {P ? (
                  <>
                    <CellGlyph pattern={choice} accent={P.color} />
                    <span
                      className="mono"
                      style={{
                        fontSize: ".72rem",
                        color: P.color,
                        fontWeight: 700,
                      }}
                    >
                      {P.say}
                    </span>
                  </>
                ) : (
                  <span className="text-soft" style={{ fontSize: "1.2rem" }}>—</span>
                )}
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                {Object.keys(PATTERNS).map((k) => (
                  <button
                    key={k}
                    onClick={() => setBeat(b, k)}
                    className="btn btn-ghost"
                    style={{
                      padding: "4px 6px",
                      fontSize: ".68rem",
                      lineHeight: 1.2,
                      background: choice === k ? PATTERNS[k].color : undefined,
                      color: choice === k ? "#fff" : undefined,
                      borderColor: choice === k ? PATTERNS[k].color : undefined,
                    }}
                  >
                    {PATTERNS[k].label}
                  </button>
                ))}
              </div>
              {revealed && (
                <div
                  className="mono"
                  style={{
                    fontSize: ".7rem",
                    textAlign: "center",
                    color: right ? "var(--teal)" : "#a44",
                  }}
                >
                  {right ? "✓" : `was ${PATTERNS[truth].say}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="row between center wrap gap-2">
        <span className="mono text-soft" style={{ fontSize: ".82rem" }}>
          {!revealed
            ? filled ? "all four beats filled" : "fill all four beats"
            : correct ? "Locked in. Try a harder one." : `${score}/4 — replay and listen again`}
        </span>
        <button
          className="btn btn-primary"
          onClick={() => setRev(true)}
          disabled={!filled || revealed}
          style={{ padding: "8px 18px" }}
        >
          Check
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* HighSameLow — reference note, then 3 comparison notes               */
/* Each judgement is vs the IMMEDIATELY PREVIOUS note in the chain.    */
/* ================================================================== */
function HighSameLow() {
  // round shape: { notes: [n0,n1,n2,n3], answers: [a1,a2,a3] }
  const [round, setRound] = useLSt(null);
  const [picks, setPicks] = useLSt([null, null, null]);
  const [stage, setStage] = useLSt(0);      // which judgement (0..3); 3 = round complete
  const [playing, setPlaying] = useLSt(false);
  const [revealedSet, setRevealedSet] = useLSt(0); // number of rounds completed
  const [correctTotal, setCorrectTotal] = useLSt(0);
  const timersRef = useLRf([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  useLEf(() => clearTimers, []);

  function makeRound() {
    const SCALE = [
      "C4", "D4", "E4", "F4", "G4", "A4", "B4",
      "C5", "D5", "E5", "F5", "G5",
    ];
    // pick a comfortable starting index, then walk 3 times
    let idx = 2 + Math.floor(Math.random() * (SCALE.length - 4));
    const notes = [SCALE[idx]];
    const answers = [];
    for (let i = 0; i < 3; i++) {
      const roll = Math.random();
      let next;
      if (roll < 0.25) {
        next = idx; // same
      } else {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const step = 1 + Math.floor(Math.random() * 3);
        next = Math.max(0, Math.min(SCALE.length - 1, idx + dir * step));
        if (next === idx) next = Math.min(SCALE.length - 1, idx + 1);
      }
      const ans = next > idx ? "higher" : next < idx ? "lower" : "same";
      notes.push(SCALE[next]);
      answers.push(ans);
      idx = next;
    }
    return { notes, answers };
  }

  // Play notes 0..upTo (inclusive). Used for replay.
  function playUpTo(r, upTo) {
    if (!r) return;
    LA()?.resume();
    clearTimers();
    setPlaying(true);
    for (let i = 0; i <= upTo; i++) {
      timersRef.current.push(
        setTimeout(() => LA()?.playPiano(r.notes[i], 0.7, 0.7), i * 750),
      );
    }
    timersRef.current.push(setTimeout(() => setPlaying(false), upTo * 750 + 900));
  }

  // Play the single note at index i (used when revealing the next note after a pick).
  function playOne(r, i) {
    if (!r) return;
    LA()?.resume();
    clearTimers();
    setPlaying(true);
    LA()?.playPiano(r.notes[i], 0.7, 0.7);
    timersRef.current.push(setTimeout(() => setPlaying(false), 900));
  }

  function start() {
    const r = makeRound();
    setRound(r);
    setPicks([null, null, null]);
    setStage(0);
    // play reference note, then immediately note 1 for the first judgement
    LA()?.resume();
    clearTimers();
    setPlaying(true);
    timersRef.current.push(setTimeout(() => LA()?.playPiano(r.notes[0], 0.7, 0.7), 0));
    timersRef.current.push(setTimeout(() => LA()?.playPiano(r.notes[1], 0.7, 0.7), 750));
    timersRef.current.push(setTimeout(() => setPlaying(false), 1600));
  }

  function pick(g) {
    if (!round || stage >= 3) return;
    const correctAns = round.answers[stage];
    const right = g === correctAns;
    const newPicks = picks.slice();
    newPicks[stage] = g;
    setPicks(newPicks);
    if (right) LA()?.ding(true); else LA()?.ding(false);

    const nextStage = stage + 1;
    if (nextStage < 3) {
      // play the next comparison note (notes[nextStage + 1] is the one to judge)
      setStage(nextStage);
      timersRef.current.push(setTimeout(() => playOne(round, nextStage + 1), 350));
    } else {
      // round done
      setStage(3);
      const correctHere = newPicks.filter((p, i) => p === round.answers[i]).length;
      setRevealedSet((r) => r + 1);
      setCorrectTotal((c) => c + correctHere);
    }
  }

  const OPTS = [
    { k: "higher", label: "Higher", arrow: "▲", color: "var(--teal)" },
    { k: "same",   label: "Same",   arrow: "═", color: "var(--butter-d)" },
    { k: "lower",  label: "Lower",  arrow: "▼", color: "var(--terracotta)" },
  ];

  const roundCorrect =
    round && stage === 3
      ? picks.filter((p, i) => p === round.answers[i]).length
      : 0;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 16 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Higher · Same · Lower</div>
          <strong>Reference note + three comparisons</strong>
        </div>
        <div className="mono text-soft" style={{ fontSize: ".82rem" }}>
          {revealedSet > 0 && (
            <>
              correct <strong style={{ color: "var(--teal)" }}>{correctTotal}</strong> / {revealedSet * 3}
            </>
          )}
        </div>
      </div>

      <p className="text-soft" style={{ fontSize: ".88rem", margin: 0 }}>
        You'll hear a starting note, then three more notes one at a time. For each new note, decide whether it's higher than, the same as, or lower than the note <em>just before it</em>.
      </p>

      {!round ? (
        <button
          className="btn btn-primary"
          onClick={start}
          style={{ padding: "16px", fontSize: "1rem" }}
        >
          ▶ Start drill
        </button>
      ) : (
        <>
          {/* The chain — visual of where you are */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto repeat(3, 1fr)",
              gap: 8,
              alignItems: "stretch",
            }}
          >
            {/* Reference */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1.5px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--paper)",
                display: "grid",
                gap: 4,
                justifyItems: "center",
                minWidth: 86,
              }}
            >
              <span
                className="mono"
                style={{ fontSize: ".66rem", opacity: 0.7, letterSpacing: ".08em" }}
              >
                START
              </span>
              <strong
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.15rem",
                  lineHeight: 1,
                }}
              >
                Note 1
              </strong>
              <span
                className="mono"
                style={{ fontSize: ".72rem", opacity: 0.8 }}
              >
                {stage === 3 ? round.notes[0].replace(/\d/, "") : "·"}
              </span>
            </div>
            {[0, 1, 2].map((i) => {
              const truth = round.answers[i];
              const got = picks[i];
              const isCurrent = stage === i;
              const done = got != null;
              const right = done && got === truth;
              const colour = !done
                ? isCurrent ? "var(--terracotta)" : "var(--border)"
                : right ? "var(--teal)" : "#a44";
              const bg = !done
                ? isCurrent ? "color-mix(in oklab, var(--terracotta) 10%, transparent)" : "var(--bg)"
                : right ? "color-mix(in oklab, var(--teal) 14%, transparent)" : "color-mix(in oklab, #a44 12%, transparent)";
              return (
                <div
                  key={i}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 10,
                    border: `1.5px solid ${colour}`,
                    background: bg,
                    display: "grid",
                    gap: 4,
                    justifyItems: "center",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: ".66rem",
                      letterSpacing: ".08em",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {isCurrent && stage < 3 ? "NOW" : "vs PREV"}
                  </span>
                  <strong
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.05rem",
                      lineHeight: 1,
                      color: "var(--ink)",
                    }}
                  >
                    Note {i + 2}
                  </strong>
                  <span
                    className="mono"
                    style={{ fontSize: ".72rem", color: "var(--ink-soft)" }}
                  >
                    {done
                      ? `${got === "higher" ? "▲" : got === "lower" ? "▼" : "═"}${right ? "" : ` · was ${truth}`}`
                      : isCurrent ? "judge this" : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="row gap-2 wrap">
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (stage === 0) {
                  // replay reference + note 1
                  clearTimers();
                  LA()?.resume();
                  setPlaying(true);
                  timersRef.current.push(setTimeout(() => LA()?.playPiano(round.notes[0], 0.7, 0.7), 0));
                  timersRef.current.push(setTimeout(() => LA()?.playPiano(round.notes[1], 0.7, 0.7), 750));
                  timersRef.current.push(setTimeout(() => setPlaying(false), 1600));
                } else if (stage < 3) {
                  // replay previous + current
                  clearTimers();
                  LA()?.resume();
                  setPlaying(true);
                  timersRef.current.push(setTimeout(() => LA()?.playPiano(round.notes[stage], 0.7, 0.7), 0));
                  timersRef.current.push(setTimeout(() => LA()?.playPiano(round.notes[stage + 1], 0.7, 0.7), 750));
                  timersRef.current.push(setTimeout(() => setPlaying(false), 1600));
                } else {
                  // round done — replay whole chain
                  playUpTo(round, 3);
                }
              }}
              disabled={playing}
              style={{ padding: "10px 18px" }}
            >
              {playing
                ? "♪ Playing…"
                : stage < 3
                  ? "↻ Replay this pair"
                  : "↻ Replay all four"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={start}
              disabled={playing}
              style={{ padding: "10px 18px" }}
            >
              ⤳ New chain
            </button>
          </div>

          {stage < 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {OPTS.map((o) => (
                <button
                  key={o.k}
                  onClick={() => pick(o.k)}
                  disabled={playing}
                  className="btn btn-ghost"
                  style={{
                    padding: "20px 8px",
                    display: "grid",
                    gap: 6,
                    justifyItems: "center",
                  }}
                >
                  <span style={{ fontSize: "1.6rem", lineHeight: 1, color: o.color }}>
                    {o.arrow}
                  </span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                    {o.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {stage === 3 && (
            <div
              className="row between center wrap gap-2"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background:
                  roundCorrect === 3
                    ? "color-mix(in oklab, var(--teal) 16%, transparent)"
                    : roundCorrect === 0
                      ? "color-mix(in oklab, #a44 12%, transparent)"
                      : "color-mix(in oklab, var(--butter-d) 14%, transparent)",
              }}
            >
              <span className="mono" style={{ fontSize: ".88rem", fontWeight: 700 }}>
                Chain: {round.notes.map((n) => n.replace(/\d/, "")).join(" → ")}{" "}
                · scored {roundCorrect}/3
              </span>
              <button
                className="btn btn-primary"
                onClick={start}
                style={{ padding: "6px 14px" }}
              >
                Next chain →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* ListenAndLabel — describe a phrase by its elements                  */
/* ================================================================== */
function ListenAndLabel() {
  const PIECES = [
    {
      name: "Phrase A",
      hint: "One lone melody, smoothly connected, no harmony underneath, bright major sound.",
      truth: {
        texture: "Monophonic",
        articulation: "Legato",
        dynamic: "mf · medium",
        tempo: "Medium",
        tonality: "Major",
      },
      play() {
        const c = LA(); if (!c) return; c.resume();
        const seq = ["C5", "E5", "G5", "C6", "B5", "G5", "E5", "C5"];
        seq.forEach((n, i) => setTimeout(() => c.playPiano(n, 0.55, 0.7), i * 240));
      },
    },
    {
      name: "Phrase B",
      hint: "Short, detached melody notes sitting over chord stabs — that's homophonic, played staccato, in a minor key.",
      truth: {
        texture: "Homophonic",
        articulation: "Staccato",
        dynamic: "mp · soft-ish",
        tempo: "Medium-fast",
        tonality: "Minor",
      },
      play() {
        const c = LA(); if (!c) return; c.resume();
        const mel = ["A4", "C5", "E5", "A5", "G5", "E5", "C5", "A4"];
        mel.forEach((n, i) => setTimeout(() => c.playPiano(n, 0.18, 0.55), i * 180));
        const chords = [["A3","C4","E4"], ["F3","A3","C4"], ["G3","B3","D4"], ["A3","C4","E4"]];
        chords.forEach((ch, i) => setTimeout(() => c.playChord(ch, 1.2, 0.35), i * 360));
      },
    },
    {
      name: "Phrase C",
      hint: "Two independent melodies running at once — that's polyphonic, both equal, big major feel.",
      truth: {
        texture: "Polyphonic",
        articulation: "Legato",
        dynamic: "f · loud",
        tempo: "Medium",
        tonality: "Major",
      },
      play() {
        const c = LA(); if (!c) return; c.resume();
        const a = ["C5", "D5", "E5", "F5", "G5", "A5", "G5", "E5"];
        const b = ["G3", "A3", "B3", "C4", "D4", "E4", "D4", "C4"];
        a.forEach((n, i) => setTimeout(() => c.playPiano(n, 0.5, 0.9), i * 270));
        b.forEach((n, i) => setTimeout(() => c.playPiano(n, 0.55, 0.7), i * 270 + 135));
      },
    },
    {
      name: "Phrase D",
      hint: "A single slow line, gentle in volume — monophonic, legato, soft (pp), and the third is darker — minor.",
      truth: {
        texture: "Monophonic",
        articulation: "Legato",
        dynamic: "pp · very soft",
        tempo: "Slow",
        tonality: "Minor",
      },
      play() {
        const c = LA(); if (!c) return; c.resume();
        const seq = ["A4", "C5", "E5", "D5", "C5", "B4", "A4"];
        seq.forEach((n, i) => setTimeout(() => c.playPiano(n, 0.9, 0.25), i * 420));
      },
    },
  ];

  const QUESTIONS = [
    { id: "texture",      label: "Texture",      opts: ["Monophonic", "Homophonic", "Polyphonic"] },
    { id: "articulation", label: "Articulation", opts: ["Legato", "Staccato"] },
    { id: "dynamic",      label: "Dynamic",      opts: ["pp · very soft", "mp · soft-ish", "mf · medium", "f · loud"] },
    { id: "tempo",        label: "Tempo feel",   opts: ["Slow", "Medium", "Medium-fast", "Fast"] },
    { id: "tonality",     label: "Tonality",     opts: ["Major", "Minor"] },
  ];

  const [idx, setIdx] = useLSt(0);
  const [answers, setAnswers] = useLSt({});
  const [revealed, setRev] = useLSt(false);
  const piece = PIECES[idx];

  function pick(q, o) {
    if (revealed) return;
    setAnswers((a) => ({ ...a, [q]: o }));
  }
  function nextPiece() {
    setIdx((i) => (i + 1) % PIECES.length);
    setAnswers({});
    setRev(false);
  }

  const filled = QUESTIONS.every((q) => answers[q.id]);
  const score = revealed
    ? QUESTIONS.filter((q) => answers[q.id] === piece.truth[q.id]).length
    : 0;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 16 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Listen & label</div>
          <strong>Describe the music with the right words · {piece.name}</strong>
        </div>
        <div className="row gap-2">
          <button
            className="btn btn-primary"
            onClick={() => piece.play()}
            style={{ padding: "8px 18px" }}
          >
            ▶ Play phrase
          </button>
          <button className="btn btn-ghost" onClick={nextPiece} style={{ padding: "8px 14px" }}>
            ↻ New phrase
          </button>
        </div>
      </div>

      <p className="text-soft" style={{ fontSize: ".88rem", margin: 0 }}>
        Listen to the phrase (replay as many times as you like), then pick the technical term that best describes each element. Use the words — not "cool" or "sad" — these are what examiners mark.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {QUESTIONS.map((q) => (
          <div key={q.id} style={{ display: "grid", gap: 6 }}>
            <div className="row between center wrap gap-2">
              <strong style={{ fontSize: ".95rem" }}>{q.label}</strong>
              {revealed && (
                <span
                  className="mono"
                  style={{
                    fontSize: ".74rem",
                    color: answers[q.id] === piece.truth[q.id] ? "var(--teal)" : "#a44",
                  }}
                >
                  {answers[q.id] === piece.truth[q.id]
                    ? "✓ correct"
                    : `was ${piece.truth[q.id]}`}
                </span>
              )}
            </div>
            <div className="row gap-2 wrap">
              {q.opts.map((o) => {
                const isPicked = answers[q.id] === o;
                const isAns = revealed && o === piece.truth[q.id];
                const right = isPicked && isAns;
                const wrong = isPicked && revealed && !isAns;
                return (
                  <button
                    key={o}
                    onClick={() => pick(q.id, o)}
                    className="btn btn-ghost"
                    disabled={revealed}
                    style={{
                      padding: "8px 14px",
                      fontSize: ".82rem",
                      background: right
                        ? "var(--teal)"
                        : wrong
                          ? "#a44"
                          : isAns
                            ? "color-mix(in oklab, var(--teal) 16%, transparent)"
                            : isPicked
                              ? "var(--ink)"
                              : undefined,
                      color: right || wrong ? "#fff" : isPicked ? "var(--paper)" : undefined,
                      borderColor: right
                        ? "var(--teal)"
                        : wrong
                          ? "#a44"
                          : isPicked
                            ? "var(--ink)"
                            : isAns
                              ? "var(--teal)"
                              : undefined,
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="row between center wrap gap-2">
        <span className="mono text-soft" style={{ fontSize: ".82rem" }}>
          {!revealed
            ? filled ? "all five answered" : "answer all five elements"
            : <>scored <strong style={{ color: "var(--teal)" }}>{score}/{QUESTIONS.length}</strong> — {piece.hint}</>}
        </span>
        <button
          className="btn btn-primary"
          onClick={() => setRev(true)}
          disabled={!filled || revealed}
          style={{ padding: "8px 18px" }}
        >
          Check
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* VocabMatcher — pair term with definition                            */
/* ================================================================== */
function VocabMatcher() {
  const PAIRS = [
    { term: "Ostinato",    def: "A short pattern that keeps repeating (like a riff)." },
    { term: "Crescendo",   def: "The volume gradually getting louder." },
    { term: "Staccato",    def: "Notes played short and detached." },
    { term: "Legato",      def: "Notes played smoothly and connected." },
    { term: "Syncopation", def: "Stress placed on the OFF-beats." },
    { term: "Polyphonic",  def: "Two or more independent melodies at once." },
  ];

  const [shuf] = useLSt(() => [...PAIRS].sort(() => Math.random() - 0.5));
  const [picked, setPicked] = useLSt(null);
  const [matched, setMatched] = useLSt({}); // term -> def

  function clickTerm(t) {
    if (matched[t]) return;
    setPicked(picked === t ? null : t);
  }
  function clickDef(d) {
    if (!picked) return;
    setMatched((m) => ({ ...m, [picked]: d }));
    setPicked(null);
  }
  function reset() {
    setMatched({});
    setPicked(null);
  }

  const done = PAIRS.every((p) => matched[p.term]);
  const score = PAIRS.filter((p) => matched[p.term] === p.def).length;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Vocab matcher</div>
          <strong>Pair each technical term with its meaning</strong>
        </div>
        <div className="row gap-2 center">
          {done && (
            <span
              className="mono"
              style={{
                fontSize: ".82rem",
                color: score === PAIRS.length ? "var(--teal)" : "var(--butter-d)",
              }}
            >
              {score}/{PAIRS.length}
            </span>
          )}
          <button
            className="btn btn-ghost"
            onClick={reset}
            style={{ padding: "6px 12px", fontSize: ".78rem" }}
          >
            ↻ Reset
          </button>
        </div>
      </div>

      <p className="text-soft" style={{ fontSize: ".88rem", margin: 0 }}>
        Click a term, then click its definition. Pairs lock in colour — green for right, red for wrong.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.6fr)",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          {PAIRS.map((p) => {
            const ans = matched[p.term];
            const right = ans === p.def;
            return (
              <button
                key={p.term}
                onClick={() => clickTerm(p.term)}
                disabled={!!ans}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: ans ? "default" : "pointer",
                  borderRadius: 10,
                  border:
                    "1.5px solid " +
                    (ans
                      ? right
                        ? "var(--teal)"
                        : "#a44"
                      : picked === p.term
                        ? "var(--ink)"
                        : "var(--border)"),
                  background: ans
                    ? right
                      ? "color-mix(in oklab, var(--teal) 14%, transparent)"
                      : "color-mix(in oklab, #a44 12%, transparent)"
                    : picked === p.term
                      ? "var(--ink)"
                      : "var(--bg)",
                  color:
                    picked === p.term && !ans
                      ? "var(--paper)"
                      : "var(--ink)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: ".95rem",
                }}
              >
                {p.term}
              </button>
            );
          })}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {shuf.map((p) => {
            const owner = Object.keys(matched).find(
              (t) => matched[t] === p.def,
            );
            const right = owner === p.term;
            const wrong = owner && !right;
            return (
              <button
                key={p.def}
                onClick={() => clickDef(p.def)}
                disabled={!!owner || !picked}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: owner
                    ? "default"
                    : picked
                      ? "pointer"
                      : "not-allowed",
                  borderRadius: 10,
                  border:
                    "1.5px solid " +
                    (right
                      ? "var(--teal)"
                      : wrong
                        ? "#a44"
                        : "var(--border)"),
                  background: right
                    ? "color-mix(in oklab, var(--teal) 14%, transparent)"
                    : wrong
                      ? "color-mix(in oklab, #a44 12%, transparent)"
                      : "var(--bg)",
                  color: "var(--ink)",
                  fontSize: ".88rem",
                  lineHeight: 1.4,
                  opacity: !picked && !owner ? 0.7 : 1,
                }}
              >
                {owner && (
                  <strong
                    style={{
                      display: "block",
                      fontSize: ".7rem",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 2,
                      color: right ? "var(--teal)" : "#a44",
                    }}
                  >
                    {owner} {right ? "✓" : "✗"}
                  </strong>
                )}
                {p.def}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* ContextMatcher — pair context with its function (section 3)         */
/* ================================================================== */
function ContextMatcher() {
  const ITEMS = [
    {
      ctx: "Songline",
      fn: "Carries story, knowledge and Country across generations — performance tied to specific places and people.",
      colour: "var(--teal)",
    },
    {
      ctx: "Mass / Hymn",
      fn: "Written for a religious liturgy — text, ritual and a reverberant building shape the sound.",
      colour: "var(--terracotta)",
    },
    {
      ctx: "K-pop single",
      fn: "Engineered for streaming hooks, stadium choreography and a global audience.",
      colour: "var(--butter-d)",
    },
    {
      ctx: "National anthem",
      fn: "Performed at official ceremonies — strong, simple, easy to sing in unison.",
      colour: "var(--espresso)",
    },
    {
      ctx: "Drill / Hip-hop",
      fn: "Documents life on the street — sub-heavy beats, syncopated flow, regional dialect.",
      colour: "#7c4a7e",
    },
  ];

  const [shuf] = useLSt(() => [...ITEMS].sort(() => Math.random() - 0.5));
  const [picked, setPicked] = useLSt(null);
  const [matched, setMatched] = useLSt({}); // ctx -> fn

  function clickCtx(c) {
    if (matched[c]) return;
    setPicked(picked === c ? null : c);
  }
  function clickFn(f) {
    if (!picked) return;
    setMatched((m) => ({ ...m, [picked]: f }));
    setPicked(null);
  }
  function reset() {
    setMatched({});
    setPicked(null);
  }

  const done = ITEMS.every((i) => matched[i.ctx]);
  const score = ITEMS.filter((i) => matched[i.ctx] === i.fn).length;
  const pickedItem = ITEMS.find((i) => i.ctx === picked);

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Music in context · matcher</div>
          <strong>Match each context to what the music is FOR</strong>
        </div>
        <div className="row gap-2 center">
          {done && (
            <span
              className="mono"
              style={{
                fontSize: ".82rem",
                color: score === ITEMS.length ? "var(--teal)" : "var(--butter-d)",
              }}
            >
              {score}/{ITEMS.length}
            </span>
          )}
          <button
            className="btn btn-ghost"
            onClick={reset}
            style={{ padding: "6px 12px", fontSize: ".78rem" }}
          >
            ↻ Reset
          </button>
        </div>
      </div>

      <p className="text-soft" style={{ fontSize: ".88rem", margin: 0 }}>
        Context shapes the elements — a hymn isn't engineered like a K-pop single. Click a context, then the function that fits.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.6fr)",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          {ITEMS.map((it) => {
            const ans = matched[it.ctx];
            const right = ans === it.fn;
            return (
              <button
                key={it.ctx}
                onClick={() => clickCtx(it.ctx)}
                disabled={!!ans}
                style={{
                  padding: "12px",
                  textAlign: "left",
                  cursor: ans ? "default" : "pointer",
                  borderRadius: 10,
                  border:
                    "1.5px solid " +
                    (ans
                      ? right
                        ? "var(--teal)"
                        : "#a44"
                      : picked === it.ctx
                        ? it.colour
                        : "var(--border)"),
                  background: ans
                    ? right
                      ? "color-mix(in oklab, var(--teal) 14%, transparent)"
                      : "color-mix(in oklab, #a44 12%, transparent)"
                    : picked === it.ctx
                      ? it.colour
                      : "var(--bg)",
                  color: picked === it.ctx && !ans ? "#fff" : "var(--ink)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                }}
              >
                {it.ctx}
              </button>
            );
          })}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {shuf.map((it) => {
            const owner = Object.keys(matched).find(
              (c) => matched[c] === it.fn,
            );
            const right = owner === it.ctx;
            const wrong = owner && !right;
            return (
              <button
                key={it.fn}
                onClick={() => clickFn(it.fn)}
                disabled={!!owner || !picked}
                style={{
                  padding: "12px",
                  textAlign: "left",
                  cursor: owner
                    ? "default"
                    : picked
                      ? "pointer"
                      : "not-allowed",
                  borderRadius: 10,
                  border:
                    "1.5px solid " +
                    (right
                      ? "var(--teal)"
                      : wrong
                        ? "#a44"
                        : "var(--border)"),
                  background: right
                    ? "color-mix(in oklab, var(--teal) 14%, transparent)"
                    : wrong
                      ? "color-mix(in oklab, #a44 12%, transparent)"
                      : "var(--bg)",
                  fontSize: ".88rem",
                  lineHeight: 1.45,
                  opacity: !picked && !owner ? 0.7 : 1,
                }}
              >
                {owner && (
                  <strong
                    style={{
                      display: "block",
                      fontSize: ".7rem",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 4,
                      color: right ? "var(--teal)" : "#a44",
                    }}
                  >
                    {owner} {right ? "✓" : "✗"}
                  </strong>
                )}
                {it.fn}
              </button>
            );
          })}
        </div>
      </div>

      {pickedItem && (
        <p
          className="mono text-soft"
          style={{
            fontSize: ".78rem",
            margin: 0,
            paddingTop: 4,
          }}
        >
          selected → <strong style={{ color: pickedItem.colour }}>{pickedItem.ctx}</strong> · now pick its function
        </p>
      )}
    </div>
  );
}

/* ================================================================== */
/* Exports                                                            */
/* ================================================================== */
Object.assign(window, {
  SectionRhythmDictation: RhythmDictation,
  SectionHighSameLow: HighSameLow,
  SectionListenAndLabel: ListenAndLabel,
  SectionVocabMatcher: VocabMatcher,
  SectionContextMatcher: ContextMatcher,
});
