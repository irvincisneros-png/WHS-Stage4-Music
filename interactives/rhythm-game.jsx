/* Rhythm Game: clap-back style.
   Shows a 4-beat (or 8-beat) rhythm using note values, plays it, then user taps
   along to a metronome to match the pattern. */

const NOTE_GLYPH = {
  q:  { label: "♩", beats: 1, text: "Crotchet" },
  e:  { label: "♪", beats: 0.5, text: "Quaver" },
  ee: { label: "♫", beats: 0.5, text: "Pair of quavers" },
  h:  { label: "𝅗𝅥", beats: 2, text: "Minim" },
  r:  { label: "𝄽", beats: 1, text: "Crotchet rest", rest: true },
};

// Pattern banks per difficulty. Each pattern is an array of "beats"; each beat
// is either "q", "h"/"r" (1 beat), or a pair of quavers represented as a tuple.
const PATTERNS = {
  easy: [
    ["q","q","q","q"],
    ["h","q","q"],
    ["q","r","q","q"],
    ["q","q","h"],
  ],
  medium: [
    ["q",["e","e"],"q","q"],
    [["e","e"],"q",["e","e"],"q"],
    ["q","q",["e","e"],"q"],
    ["h",["e","e"],"q"],
  ],
  hard: [
    [["e","e"],["e","e"],"q","r"],
    [["e","e"],"q",["e","e"],["e","e"]],
    ["q",["e","e"],"r",["e","e"]],
    [["e","e"],["e","e"],["e","e"],["e","e"]],
  ],
};

function flattenPattern(p) {
  // Returns array of { offset (in beats), rest, label } at quaver resolution.
  const events = [];
  let t = 0;
  for (const beat of p) {
    if (Array.isArray(beat)) {
      events.push({ t, rest: false, label: "♪" });
      events.push({ t: t + 0.5, rest: false, label: "♪" });
    } else if (beat === "q") {
      events.push({ t, rest: false, label: "♩" });
    } else if (beat === "h") {
      events.push({ t, rest: false, label: "𝅗𝅥", sustain: 2 });
    } else if (beat === "r") {
      events.push({ t, rest: true, label: "𝄽" });
    }
    t += Array.isArray(beat) ? 1 : (beat === "h" ? 2 : 1);
  }
  return { events, total: t };
}

function RhythmGame({ topic, difficulty = "medium", onComplete }) {
  const [pattern, setPattern] = React.useState(() => PATTERNS[difficulty][0]);
  const [phase, setPhase] = React.useState("idle"); // idle | listen | record | result
  const [hits, setHits] = React.useState([]);       // array of { t (in beats) }
  const [score, setScore] = React.useState(null);
  const [round, setRound] = React.useState(1);
  const [totalScore, setTotalScore] = React.useState(0);
  const [bpm] = React.useState(80);
  const startRef = React.useRef(0);
  const flat = flattenPattern(pattern);

  React.useEffect(() => {
    setPattern(PATTERNS[difficulty][Math.floor(Math.random() * PATTERNS[difficulty].length)]);
  }, [difficulty]);

  function newPattern() {
    const list = PATTERNS[difficulty];
    setPattern(list[Math.floor(Math.random() * list.length)]);
    setHits([]);
    setScore(null);
    setPhase("idle");
  }

  async function play() {
    window.MusicAudio?.resume();
    setPhase("listen");
    setHits([]);
    setScore(null);
    const beatMs = 60000 / bpm;
    // Count-in 4 beats
    for (let i = 0; i < 4; i++) {
      setTimeout(() => window.MusicAudio?.click(i === 0), i * beatMs);
    }
    // Play pattern
    const startMs = 4 * beatMs;
    for (const ev of flat.events) {
      setTimeout(() => {
        if (!ev.rest) {
          window.MusicAudio?.playKick();
        }
      }, startMs + ev.t * beatMs);
    }
    // After listen, switch to record with another count-in
    setTimeout(() => {
      setPhase("record");
      startRef.current = performance.now() + 4 * beatMs;
      for (let i = 0; i < 4; i++) {
        setTimeout(() => window.MusicAudio?.click(i === 0), i * beatMs);
      }
      setTimeout(() => {
        // grade
        gradeAndFinish();
      }, (4 + flat.total + 0.5) * beatMs);
    }, startMs + flat.total * beatMs + 400);
  }

  function tap() {
    if (phase !== "record") return;
    const now = performance.now();
    const beatMs = 60000 / bpm;
    const t = (now - startRef.current) / beatMs;
    if (t < -0.25) return;
    window.MusicAudio?.playSnare();
    setHits(h => [...h, { t }]);
  }

  function gradeAndFinish() {
    setPhase("result");
    setHits(curHits => {
      const beats = flat.events.filter(e => !e.rest);
      let hit = 0;
      const used = new Set();
      for (const b of beats) {
        const best = curHits.findIndex((h, i) => !used.has(i) && Math.abs(h.t - b.t) < 0.35);
        if (best >= 0) { used.add(best); hit += 1; }
      }
      const extras = curHits.length - used.size;
      const acc = beats.length ? hit / beats.length : 0;
      const penalty = Math.max(0, extras * 0.15);
      const sc = Math.max(0, Math.round((acc - penalty) * 100));
      setScore(sc);
      setTotalScore(s => s + sc);
      setRound(r => r + 1);
      if (sc >= 70) onComplete?.();
      return curHits;
    });
  }

  // Render notation strip
  function renderStrip() {
    return (
      <div className="row gap-3 center wrap" style={{
        padding: "20px 24px",
        background: "var(--bg)",
        border: "1.5px solid var(--border)",
        borderRadius: 18,
        fontFamily: "serif",
        fontSize: "2.6rem",
        lineHeight: 1,
        position: "relative",
      }}>
        {pattern.map((beat, i) => {
          if (Array.isArray(beat)) {
            return (
              <span key={i} style={{ position: "relative", color: "var(--terracotta)" }}>
                ♫
              </span>
            );
          }
          const map = { q: "♩", h: "𝅗𝅥", r: "𝄽" };
          return <span key={i} style={{ color: beat === "r" ? "var(--ink-soft)" : "var(--ink)" }}>{map[beat]}</span>;
        })}
      </div>
    );
  }

  // Visualise hits vs targets
  function renderTimeline() {
    const beatMs = 60000 / bpm;
    return (
      <div style={{
        position: "relative",
        height: 60,
        background: "var(--bg)",
        border: "1.5px solid var(--border)",
        borderRadius: 12,
        marginTop: 8,
      }}>
        {/* beat ticks */}
        {Array.from({ length: flat.total + 1 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i / flat.total) * 100}%`,
            top: 0, bottom: 0,
            width: 1, background: "var(--border)",
          }} />
        ))}
        {/* targets */}
        {flat.events.filter(e => !e.rest).map((e, i) => (
          <div key={"t"+i} style={{
            position: "absolute",
            left: `${(e.t / flat.total) * 100}%`,
            top: 8, bottom: 32,
            width: 6, marginLeft: -3,
            background: "var(--teal)", borderRadius: 6,
          }} />
        ))}
        {/* user hits */}
        {hits.map((h, i) => (
          <div key={"h"+i} style={{
            position: "absolute",
            left: `${Math.min(100, Math.max(0, (h.t / flat.total) * 100))}%`,
            top: 30, bottom: 6,
            width: 6, marginLeft: -3,
            background: "var(--terracotta)", borderRadius: 6,
          }} />
        ))}
        <div style={{
          position: "absolute", bottom: 2, left: 8,
          fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--ink-soft)",
        }}>
          ━━ target  ━━ you
        </div>
      </div>
    );
  }

  return (
    <div className="chunk paper" style={{ padding: 22 }}>
      <div className="row between center wrap gap-3 mb-4">
        <div className="row gap-2 wrap">
          <Chip>Clap-back · Round {round}</Chip>
          <Chip>Tempo {bpm} bpm</Chip>
          <Chip>Difficulty: {difficulty}</Chip>
        </div>
        <div className="row gap-3 center">
          {score !== null && <span className="hud-pill" style={{ color: score >= 70 ? "var(--teal)" : "var(--terracotta)" }}>{score}%</span>}
          <span className="hud-pill">Σ {totalScore}</span>
        </div>
      </div>

      {renderStrip()}
      {renderTimeline()}

      <div className="mt-6 row center gap-3 wrap">
        {phase === "idle" && (
          <button className="btn btn-primary" onClick={play}>▶ Play pattern</button>
        )}
        {phase === "listen" && (
          <div className="hud-pill">🎧 Listen…</div>
        )}
        {phase === "record" && (
          <button
            className="btn btn-teal"
            onMouseDown={tap}
            onTouchStart={(e) => { e.preventDefault(); tap(); }}
            style={{ minWidth: 220, padding: "20px 28px", fontSize: "1.2rem" }}
          >
            👏 TAP to copy
          </button>
        )}
        {phase === "result" && (
          <>
            <button className="btn btn-ghost" onClick={() => { newPattern(); }}>↻ New pattern</button>
            <button className="btn btn-primary" onClick={play}>▶ Try again</button>
          </>
        )}
      </div>

      <p className="text-soft mt-4 center-text" style={{ fontSize: ".85rem" }}>
        Listen to the pattern, then tap it back during the count-in.
      </p>
    </div>
  );
}

window.RhythmGame = RhythmGame;
