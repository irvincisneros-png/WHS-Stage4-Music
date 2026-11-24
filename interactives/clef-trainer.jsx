/* Clef Trainer: Staff Wars-style note recognition for treble and bass clefs.
   The level sets the range (staff only → one ledger line → two ledger lines)
   and the time limit. */

/* ---------- Staff geometry ----------
   Staff positions count down from the top line: 0 = top line, 1 = top space,
   ... 8 = bottom line. Negative = above the staff, > 8 = below it. */
const CT_W = 360, CT_H = 230;
const CT_TOP = 78;      // y of the top staff line
const CT_SPACE = 14;    // distance between two staff lines
const CT_NOTE_X = 220;  // notehead centre x
const ctY = (idx) => CT_TOP + idx * CT_SPACE / 2;

/* ---------- Clef glyphs ----------
   The clefs are Unicode music characters, so their size and position depend on
   whichever font the device has. We measure the glyph's actual ink with a
   canvas and scale it into place, using the SMuFL (Bravura) proportions:
   the G clef sits 4.39 spaces above and 2.63 below its G line; the F clef
   1.05 above and 2.54 below its F line. */
const CT_CLEF_FONT = "'Bravura Text', 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols 2', 'Noto Sans Symbols', serif";
const CT_CLEFS = {
  treble: { char: "\u{1D11E}", line: 6, above: 4.39, below: 2.63, left: 40 },
  bass:   { char: "\u{1D122}", line: 2, above: 1.05, below: 2.54, left: 44 },
};
const ctClefCache = {};
function clefPlacement(clef) {
  if (ctClefCache[clef]) return ctClefCache[clef];
  const c = CT_CLEFS[clef];
  const inkTop = ctY(c.line) - c.above * CT_SPACE;
  const inkH = (c.above + c.below) * CT_SPACE;
  let place = null;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `100px ${CT_CLEF_FONT}`;
    const m = ctx.measureText(c.char);
    const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    if (asc + desc > 5) {
      const s = inkH / (asc + desc);
      place = { size: 100 * s, x: c.left + (m.actualBoundingBoxLeft || 0) * s, y: inkTop + asc * s };
    }
  } catch (e) { /* no canvas: fall back below */ }
  if (!place) {
    // Typical serif proportions if measuring is not possible.
    place = clef === "treble"
      ? { size: inkH * 1.05, x: c.left, y: inkTop + inkH * 0.78 }
      : { size: inkH * 2.0, x: c.left, y: inkTop + inkH * 0.95 };
  }
  ctClefCache[clef] = place;
  return place;
}

function StaffSVG({ clef, noteIndex, reveal }) {
  const noteY = ctY(noteIndex);

  // Ledger lines: every line position between the staff and the note.
  const ledgers = [];
  for (let n = -2; n >= noteIndex; n -= 2) ledgers.push(ctY(n));
  for (let n = 10; n <= noteIndex; n += 2) ledgers.push(ctY(n));

  // Stems go up for notes below the middle line, down from the middle line up.
  const stemUp = noteIndex > 4;
  const stemLen = 3.5 * CT_SPACE;
  const stemX = stemUp ? CT_NOTE_X + 9.2 : CT_NOTE_X - 9.2;
  const clefPos = clefPlacement(clef);

  return (
    <svg viewBox={`0 0 ${CT_W} ${CT_H}`} width="100%" style={{ maxWidth: 480 }} className="staff-svg"
         role="img" aria-label={`${clef === "treble" ? "Treble" : "Bass"} clef staff with one note`}>
      {[0, 2, 4, 6, 8].map(i => (
        <line key={i} x1="30" x2={CT_W - 20} y1={ctY(i)} y2={ctY(i)} className="staff-line" />
      ))}
      {ledgers.map((y, i) => (
        <line key={"l" + i} x1={CT_NOTE_X - 19} x2={CT_NOTE_X + 19} y1={y} y2={y} className="staff-line" />
      ))}
      <text x={clefPos.x} y={clefPos.y} fontSize={clefPos.size} fontFamily={CT_CLEF_FONT}
            fill="currentColor" aria-hidden="true">{CT_CLEFS[clef].char}</text>
      <line x1={stemX} x2={stemX} y1={noteY + (stemUp ? -1.5 : 1.5)} y2={noteY + (stemUp ? -stemLen : stemLen)}
            stroke="var(--espresso-2)" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx={CT_NOTE_X} cy={noteY} rx="10" ry="7.5" fill="var(--terracotta)"
               stroke="var(--espresso-2)" strokeWidth="2" transform={`rotate(-20 ${CT_NOTE_X} ${noteY})`} />
      {reveal && (
        <text x={CT_NOTE_X + 30} y={noteY + 7} fontSize="20" fontWeight="800"
              fontFamily="var(--font-display)" fill="var(--terracotta)">{reveal}</text>
      )}
    </svg>
  );
}

/* ---------- Note tables ----------
   Built from letter steps so positions cannot drift from names.
   Treble: top line is F5. Bass: top line is A3. Both run two ledger lines
   beyond the staff in each direction (idx -4 … 12). */
const CT_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const CT_SEMIS = [0, 2, 4, 5, 7, 9, 11];
function buildNotes(topLetter, topOctave) {
  const topStep = topOctave * 7 + CT_LETTERS.indexOf(topLetter);
  const notes = [];
  for (let idx = -4; idx <= 12; idx++) {
    const step = topStep - idx;
    const octave = Math.floor(step / 7), li = step - octave * 7;
    const letter = CT_LETTERS[li];
    notes.push({ name: letter + octave, letter, idx, midi: 12 * (octave + 1) + CT_SEMIS[li] });
  }
  return notes;
}
const TREBLE = buildNotes("F", 5);  // C6 … A3, middle C at idx 10
const BASS = buildNotes("A", 3);    // E4 … C2, middle C at idx -2

const CT_LEVELS = {
  easy:   { min: 0,  max: 8,  time: 90, label: "Easy",   blurb: "90 seconds · lines and spaces on the staff." },
  medium: { min: -2, max: 10, time: 60, label: "Medium", blurb: "60 seconds · adds one ledger line above and below (middle C)." },
  hard:   { min: -4, max: 12, time: 45, label: "Hard",   blurb: "45 seconds · up to two ledger lines above and below." },
};

function randomNote(pool, level, previous) {
  const L = CT_LEVELS[level] || CT_LEVELS.medium;
  const usable = pool.filter(n => n.idx >= L.min && n.idx <= L.max && (!previous || n.name !== previous.name));
  return usable[Math.floor(Math.random() * usable.length)];
}

function ClefTrainer({ topic, difficulty = "medium", onComplete }) {
  const startingClef = topic.clefSet || "treble";
  const [clef, setClef] = React.useState(startingClef);
  const [level, setLevel] = React.useState(CT_LEVELS[difficulty] ? difficulty : "medium");
  const pool = clef === "treble" ? TREBLE : BASS;
  const [target, setTarget] = React.useState(() => randomNote(startingClef === "treble" ? TREBLE : BASS, level));
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null); // { ok, letter }
  const [running, setRunning] = React.useState(false);
  const [finished, setFinished] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(CT_LEVELS[level].time);
  const lockRef = React.useRef(false);
  const nextTimer = React.useRef(null);

  // Follow the site-wide difficulty setting if it changes.
  React.useEffect(() => { if (CT_LEVELS[difficulty]) setLevel(difficulty); }, [difficulty]);

  // New clef or level: fresh note; outside a round, reset the clock too.
  React.useEffect(() => {
    setTarget(t => randomNote(pool, level, t));
    if (!running) setTimeLeft(CT_LEVELS[level].time);
  }, [clef, level]);

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { setRunning(false); setFinished(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  React.useEffect(() => {
    if (finished && score > 0) onComplete?.(); // award xp on session end
  }, [finished]);

  React.useEffect(() => () => clearTimeout(nextTimer.current), []);

  function answer(letter) {
    if (!running || lockRef.current) return;
    lockRef.current = true;
    const ok = letter === target.letter;
    setFeedback({ ok, letter: target.letter });
    setAttempts(a => a + 1);
    window.MusicAudio?.playPiano(target.name, 0.6);
    if (ok) {
      window.MusicAudio?.ding(true);
      setCorrectCount(c => c + 1);
      setScore(s => s + 10 + streak);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
    } else {
      window.MusicAudio?.ding(false);
      setStreak(0);
    }
    nextTimer.current = setTimeout(() => {
      setFeedback(null);
      setTarget(t => randomNote(pool, level, t));
      lockRef.current = false;
    }, ok ? 450 : 1100); // a wrong answer stays up longer so the right name sinks in
  }

  // Laptop keyboards: type the letter.
  React.useEffect(() => {
    if (!running) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const k = (e.key || "").toUpperCase();
      if (/^[A-G]$/.test(k)) { e.preventDefault(); answer(k); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function start() {
    clearTimeout(nextTimer.current);
    lockRef.current = false;
    setFeedback(null);
    setScore(0); setStreak(0); setBestStreak(0); setCorrectCount(0); setAttempts(0);
    setTimeLeft(CT_LEVELS[level].time);
    setFinished(false);
    setRunning(true);
    setTarget(t => randomNote(pool, level, t));
  }

  const chipBtn = { all: "unset", cursor: "pointer" };
  const accuracy = attempts ? Math.round(100 * correctCount / attempts) : 0;

  return (
    <div className="chunk paper" style={{ padding: 22 }}>
      <div className="row between center wrap gap-3 mb-4">
        <div className="row gap-2 wrap">
          <Chip variant={clef === "treble" ? "terracotta" : undefined}>
            <button onClick={() => setClef("treble")} style={chipBtn} aria-pressed={clef === "treble"}>Treble clef</button>
          </Chip>
          <Chip variant={clef === "bass" ? "teal" : undefined}>
            <button onClick={() => setClef("bass")} style={chipBtn} aria-pressed={clef === "bass"}>Bass clef</button>
          </Chip>
          {Object.keys(CT_LEVELS).map(k => (
            <Chip key={k} variant={level === k ? "teal" : undefined}>
              <button onClick={() => !running && setLevel(k)} disabled={running && level !== k}
                      style={{ ...chipBtn, opacity: running && level !== k ? 0.45 : 1, cursor: running ? "default" : "pointer" }}
                      aria-pressed={level === k}>{CT_LEVELS[k].label}</button>
            </Chip>
          ))}
        </div>
        <div className="row gap-3 center">
          <span className="hud-pill">Score {score}</span>
          <span className="hud-pill" style={{ color: streak >= 5 ? "var(--terracotta)" : undefined }}>x{streak}</span>
          <span className="hud-pill">⏱ {timeLeft}s</span>
        </div>
      </div>

      <div className="col center" style={{ position: "relative" }}>
        <StaffSVG clef={clef} noteIndex={target.idx} reveal={feedback && !feedback.ok ? feedback.letter : null} />
        {feedback && (
          <div aria-live="assertive" style={{
            position: "absolute", top: 12, left: "50%",
            transform: "translateX(-50%)",
            background: feedback.ok ? "var(--teal)" : "var(--terracotta)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 999,
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem",
            boxShadow: "0 6px 0 0 rgba(0,0,0,.2)",
            animation: "pop .25s var(--ease-spring)",
            whiteSpace: "nowrap",
          }}>{feedback.ok ? "✓ " + feedback.letter : "✗ It was " + feedback.letter}</div>
        )}
      </div>

      {running ? (
        <div className="mt-6">
          <div className="eyebrow center-text mb-2">Tap the letter name · or type it</div>
          <div className="row center gap-2 wrap">
            {["A","B","C","D","E","F","G"].map(l => {
              const isAnswer = feedback && feedback.letter === l;
              return (
                <button key={l} className="btn" onClick={() => answer(l)}
                  style={{
                    minWidth: 56, padding: "14px 18px", fontFamily: "var(--font-display)", fontSize: "1.2rem",
                    background: isAnswer ? (feedback.ok ? "var(--teal)" : "var(--terracotta)") : undefined,
                    color: isAnswer ? "#fff" : undefined,
                  }}>
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 col center gap-3">
          {finished && (
            <div className="center-text">
              <div className="eyebrow">Session complete</div>
              <h3 style={{ fontSize: "1.8rem" }}>You scored {score}</h3>
              <div className="text-soft">
                {correctCount} of {attempts} correct{attempts ? ` (${accuracy}%)` : ""} · best streak ×{bestStreak}
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={start}>
            {finished ? "Play again ▸" : "Start trainer ▸"}
          </button>
          <div className="text-soft" style={{ fontSize: ".85rem" }}>{CT_LEVELS[level].blurb}</div>
        </div>
      )}
    </div>
  );
}

window.ClefTrainer = ClefTrainer;
