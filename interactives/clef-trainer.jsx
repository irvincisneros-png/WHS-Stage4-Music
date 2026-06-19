/* Clef Trainer — Staff Wars-style note recognition for treble and bass clefs.
   Difficulty controls range and speed bonus. */

function StaffSVG({ clef, noteIndex, ledgerStep }) {
  // noteIndex: 0 = top line, 8 = bottom line, fractional = spaces.
  // The staff has 5 lines spaced 12px apart. We render with extra ledger room above/below.
  const W = 360, H = 220;
  const cx = 220;       // notehead center x
  const top = 70;       // top staff line y
  const step = 14;      // distance between adjacent staff positions (line→space = 7)
  const noteY = top + (noteIndex * (step / 2));

  // ledger lines (every line position outside the 5 lines)
  const ledgers = [];
  if (noteIndex < 0) {
    for (let n = -2; n >= Math.floor(noteIndex); n -= 2) {
      ledgers.push(top + (n * step / 2));
    }
  } else if (noteIndex > 8) {
    for (let n = 10; n <= Math.ceil(noteIndex); n += 2) {
      ledgers.push(top + (n * step / 2));
    }
  }
  // Middle C ledger between clefs
  if (clef === "treble" && noteIndex === 10) ledgers.push(top + 10 * step / 2);
  if (clef === "bass"   && noteIndex === -2) ledgers.push(top + -2 * step / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 480 }} className="staff-svg">
      {/* staff lines */}
      {[0,1,2,3,4].map(i => (
        <line key={i} x1="30" x2={W - 20} y1={top + i*step} y2={top + i*step}
              className="staff-line" />
      ))}
      {/* ledger lines */}
      {ledgers.map((y, i) => (
        <line key={"l"+i} x1={cx - 18} x2={cx + 18} y1={y} y2={y} className="staff-line" />
      ))}
      {/* clef glyph */}
      {clef === "treble" ? (
        <text x="38" y={top + 4*step + 10} fontSize="92" fontFamily="serif" fill="currentColor">𝄞</text>
      ) : (
        <text x="48" y={top + 4*step - 6} fontSize="76" fontFamily="serif" fill="currentColor">𝄢</text>
      )}
      {/* notehead */}
      <ellipse cx={cx} cy={noteY} rx="10" ry="7.5" fill="var(--terracotta)" stroke="var(--espresso-2)" strokeWidth="2" transform={`rotate(-18 ${cx} ${noteY})`} />
      <line x1={cx + 10} x2={cx + 10} y1={noteY - 2} y2={noteY - 56} stroke="var(--espresso-2)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* For each clef, a list of letter names + the noteIndex (top line = 0).
   Treble: lines from top E5 D5 B4 G4 F4 + spaces F5 C5 A4 E4 etc.
   We'll define the staff positions explicitly. */
const TREBLE_NOTES = [
  // index -2 (above top with one ledger) is A5? — we keep within +-2 ledger range
  { name: "A5", idx: -1, midi: 69 + 12 },
  { name: "G5", idx: 0,  midi: 67 + 12 }, // hmm wait
];
// To avoid arithmetic mistakes, just define mapping directly:
const TREBLE = [
  { name: "C4", letter: "C", idx: 10, midi: 60 }, // middle C (1 ledger below)
  { name: "D4", letter: "D", idx: 9,  midi: 62 },
  { name: "E4", letter: "E", idx: 8,  midi: 64 }, // bottom line
  { name: "F4", letter: "F", idx: 7,  midi: 65 },
  { name: "G4", letter: "G", idx: 6,  midi: 67 },
  { name: "A4", letter: "A", idx: 5,  midi: 69 },
  { name: "B4", letter: "B", idx: 4,  midi: 71 },
  { name: "C5", letter: "C", idx: 3,  midi: 72 },
  { name: "D5", letter: "D", idx: 2,  midi: 74 },
  { name: "E5", letter: "E", idx: 1,  midi: 76 },
  { name: "F5", letter: "F", idx: 0,  midi: 77 }, // top line
  { name: "G5", letter: "G", idx: -1, midi: 79 },
  { name: "A5", letter: "A", idx: -2, midi: 81 },
];
const BASS = [
  { name: "E2", letter: "E", idx: 9,  midi: 40 }, // bottom-ish
  { name: "G2", letter: "G", idx: 8,  midi: 43 }, // bottom line
  { name: "A2", letter: "A", idx: 7,  midi: 45 },
  { name: "B2", letter: "B", idx: 6,  midi: 47 },
  { name: "C3", letter: "C", idx: 5,  midi: 48 },
  { name: "D3", letter: "D", idx: 4,  midi: 50 },
  { name: "E3", letter: "E", idx: 3,  midi: 52 },
  { name: "F3", letter: "F", idx: 2,  midi: 53 },
  { name: "G3", letter: "G", idx: 1,  midi: 55 },
  { name: "A3", letter: "A", idx: 0,  midi: 57 }, // top line
  { name: "B3", letter: "B", idx: -1, midi: 59 },
  { name: "C4", letter: "C", idx: -2, midi: 60 }, // middle C (1 ledger above)
];

function ClefTrainer({ topic, difficulty = "medium", onComplete }) {
  const startingClef = topic.clefSet || "treble";
  const [clef, setClef] = React.useState(startingClef);
  const [pool, setPool] = React.useState(() => startingClef === "treble" ? TREBLE : BASS);
  const [round, setRound] = React.useState(0);
  const [target, setTarget] = React.useState(() => randomNote(startingClef === "treble" ? TREBLE : BASS, difficulty));
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(60);

  React.useEffect(() => {
    setPool(clef === "treble" ? TREBLE : BASS);
    setTarget(randomNote(clef === "treble" ? TREBLE : BASS, difficulty));
  }, [clef, difficulty]);

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  React.useEffect(() => {
    if (!running && timeLeft === 0 && score > 0) {
      // award xp on session end
      onComplete?.();
    }
  }, [running, timeLeft]);

  function randomNote(p, diff) {
    let usable = p;
    if (diff === "easy") {
      // only inside the staff
      usable = p.filter(n => n.idx >= 0 && n.idx <= 8);
    } else if (diff === "medium") {
      usable = p.filter(n => n.idx >= -1 && n.idx <= 9);
    } // hard = all incl. ledger
    return usable[Math.floor(Math.random() * usable.length)];
  }

  function answer(letter) {
    const correct = letter === target.letter;
    setFeedback(correct ? "✓" : "✗ " + target.letter);
    if (correct) {
      window.MusicAudio?.playPiano(target.name, 0.6);
      window.MusicAudio?.ding(true);
      setScore(s => s + 10 + streak);
      setStreak(s => s + 1);
    } else {
      window.MusicAudio?.ding(false);
      setStreak(0);
    }
    setTimeout(() => {
      setFeedback(null);
      setTarget(randomNote(pool, difficulty));
      setRound(r => r + 1);
    }, 500);
  }

  function start() {
    setScore(0); setStreak(0); setRound(0);
    setTimeLeft(difficulty === "easy" ? 90 : difficulty === "medium" ? 60 : 45);
    setRunning(true);
    setTarget(randomNote(pool, difficulty));
  }

  return (
    <div className="chunk paper" style={{ padding: 22 }}>
      <div className="row between center wrap gap-3 mb-4">
        <div className="row gap-2 wrap">
          <Chip variant={clef === "treble" ? "terracotta" : undefined}>
            <button onClick={() => setClef("treble")} style={{ all: "unset", cursor: "pointer" }}>Treble 𝄞</button>
          </Chip>
          <Chip variant={clef === "bass" ? "teal" : undefined}>
            <button onClick={() => setClef("bass")} style={{ all: "unset", cursor: "pointer" }}>Bass 𝄢</button>
          </Chip>
          <Chip>Difficulty: {difficulty}</Chip>
        </div>
        <div className="row gap-3 center">
          <span className="hud-pill">Score {score}</span>
          <span className="hud-pill" style={{ color: streak >= 5 ? "var(--terracotta)" : undefined }}>x{streak}</span>
          <span className="hud-pill">⏱ {timeLeft}s</span>
        </div>
      </div>

      <div className="col center" style={{ position: "relative" }}>
        <StaffSVG clef={clef} noteIndex={target.idx} />
        {feedback && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: feedback.startsWith("✓") ? "var(--teal)" : "var(--terracotta)",
            color: "#fff",
            padding: "12px 22px",
            borderRadius: 999,
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem",
            boxShadow: "0 8px 0 0 rgba(0,0,0,.2)",
            animation: "pop .25s var(--ease-spring)",
          }}>{feedback}</div>
        )}
      </div>

      {running ? (
        <div className="mt-6">
          <div className="eyebrow center-text mb-2">Tap the letter name</div>
          <div className="row center gap-2 wrap">
            {["A","B","C","D","E","F","G"].map(l => (
              <button key={l} className="btn" onClick={() => answer(l)}
                style={{ minWidth: 56, padding: "14px 18px", fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 col center gap-3">
          {timeLeft === 0 && score > 0 && (
            <div className="center-text">
              <div className="eyebrow">Session complete</div>
              <h3 style={{ fontSize: "1.8rem" }}>You scored {score}</h3>
              <div className="text-soft">Best streak ×{streak}</div>
            </div>
          )}
          <button className="btn btn-primary" onClick={start}>
            {timeLeft === 0 ? "Play again ▸" : "Start trainer ▸"}
          </button>
          <div className="text-soft" style={{ fontSize: ".85rem" }}>
            {difficulty === "easy" && "90 seconds · staff notes only."}
            {difficulty === "medium" && "60 seconds · includes one ledger line."}
            {difficulty === "hard" && "45 seconds · full range with ledger lines."}
          </div>
        </div>
      )}
    </div>
  );
}

window.ClefTrainer = ClefTrainer;
