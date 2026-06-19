/* Drum Pads + 16-step sequencer.
   Tap pads to trigger samples. Toggle steps in the grid. Press play to loop. */

const PADS = [
  { id: "kick",  label: "Kick",  key: "Z", color: "var(--terracotta)", play: () => window.MusicAudio?.playKick() },
  { id: "snare", label: "Snare", key: "X", color: "var(--teal)",       play: () => window.MusicAudio?.playSnare() },
  { id: "hat",   label: "Hi-Hat",key: "C", color: "var(--butter)",     play: () => window.MusicAudio?.playHat(false) },
  { id: "open",  label: "Open Hat", key: "V", color: "#e8a96a",        play: () => window.MusicAudio?.playHat(true) },
  { id: "clap",  label: "Clap",  key: "B", color: "#b07b8f",           play: () => window.MusicAudio?.playClap() },
  { id: "tomh",  label: "Tom Hi",key: "N", color: "#6ea7a0",           play: () => window.MusicAudio?.playTom(260) },
  { id: "toml",  label: "Tom Lo",key: "M", color: "#8a6d5b",           play: () => window.MusicAudio?.playTom(140) },
  { id: "crash", label: "Crash", key: ",", color: "#e8b75a",           play: () => window.MusicAudio?.playCrash() },
];

const PRESETS = {
  empty:  Array.from({ length: 8 }, () => Array(16).fill(false)),
  rock:   (() => {
    const g = Array.from({ length: 8 }, () => Array(16).fill(false));
    // kick on 1, 3 (every 4 steps starting 0, 8 in 16-step)
    [0,8].forEach(i => g[0][i] = true);
    // snare on 2, 4 (steps 4, 12)
    [4,12].forEach(i => g[1][i] = true);
    // hat eighth notes
    for (let i = 0; i < 16; i += 2) g[2][i] = true;
    return g;
  })(),
  hiphop: (() => {
    const g = Array.from({ length: 8 }, () => Array(16).fill(false));
    [0, 7, 10].forEach(i => g[0][i] = true);
    [4, 12].forEach(i => g[1][i] = true);
    for (let i = 0; i < 16; i++) if (i % 2 === 0) g[2][i] = true;
    return g;
  })(),
};

function DrumPads({ topic, difficulty, onComplete }) {
  const [grid, setGrid] = React.useState(PRESETS.empty);
  const [playing, setPlaying] = React.useState(false);
  const [step, setStep] = React.useState(-1);
  const [bpm, setBpm] = React.useState(96);
  const [flashing, setFlashing] = React.useState({});
  const tickRef = React.useRef(null);
  const stepRef = React.useRef(0);

  // Keyboard control
  React.useEffect(() => {
    const onKey = (e) => {
      const pad = PADS.find(p => p.key.toLowerCase() === e.key.toLowerCase());
      if (pad) { pad.play(); flash(pad.id); }
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  function flash(id) {
    setFlashing(f => ({ ...f, [id]: true }));
    setTimeout(() => setFlashing(f => ({ ...f, [id]: false })), 120);
  }

  function togglePlay() {
    if (playing) {
      clearInterval(tickRef.current);
      tickRef.current = null;
      setPlaying(false);
      setStep(-1);
      stepRef.current = 0;
    } else {
      window.MusicAudio?.resume();
      stepRef.current = 0;
      const interval = 60000 / bpm / 4; // 16 steps / 4 beats per bar
      tickRef.current = setInterval(() => {
        const s = stepRef.current;
        setStep(s);
        PADS.forEach((p, i) => {
          if (grid[i][s]) { p.play(); flash(p.id); }
        });
        stepRef.current = (s + 1) % 16;
      }, interval);
      setPlaying(true);
    }
  }

  // When bpm changes during play, restart loop
  React.useEffect(() => {
    if (playing) {
      clearInterval(tickRef.current);
      const interval = 60000 / bpm / 4;
      tickRef.current = setInterval(() => {
        const s = stepRef.current;
        setStep(s);
        PADS.forEach((p, i) => {
          if (grid[i][s]) { p.play(); flash(p.id); }
        });
        stepRef.current = (s + 1) % 16;
      }, interval);
    }
  }, [bpm, grid]);

  React.useEffect(() => () => clearInterval(tickRef.current), []);

  function toggleStep(r, c) {
    setGrid(g => g.map((row, i) => i === r ? row.map((v, j) => j === c ? !v : v) : row));
  }

  function clear() { setGrid(PRESETS.empty); }
  function loadPreset(name) { setGrid(PRESETS[name].map(row => [...row])); }

  return (
    <div className="chunk paper" style={{ padding: 20 }}>
      <div className="row between center wrap gap-3 mb-4">
        <div className="row gap-2 wrap">
          <Chip>4 / 4 · 16 steps</Chip>
          <Chip>{bpm} bpm</Chip>
        </div>
        <div className="row gap-2 wrap">
          <button className="btn btn-ghost" onClick={() => loadPreset("rock")}>Rock</button>
          <button className="btn btn-ghost" onClick={() => loadPreset("hiphop")}>Hip-hop</button>
          <button className="btn btn-ghost" onClick={clear}>Clear</button>
          <button className={"btn " + (playing ? "btn-teal" : "btn-primary")} onClick={togglePlay}>
            {playing ? "■ Stop" : "▶ Play"}
          </button>
        </div>
      </div>

      {/* Pads */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        marginBottom: 16,
      }}>
        {PADS.map(p => (
          <div
            key={p.id}
            className={"pad " + (flashing[p.id] ? "flash" : "")}
            style={{ background: flashing[p.id] ? p.color : "var(--bg-2)", color: flashing[p.id] ? "#fff" : "var(--ink)", aspectRatio: "1.2 / 1", minHeight: 64 }}
            onMouseDown={() => { p.play(); flash(p.id); }}
            onTouchStart={(e) => { e.preventDefault(); p.play(); flash(p.id); }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem" }}>{p.label}</div>
            <div className="mono" style={{ fontSize: ".65rem", opacity: .7 }}>{p.key}</div>
          </div>
        ))}
      </div>

      {/* Sequencer */}
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 4, minWidth: 540 }}>
          <thead>
            <tr>
              <th />
              {Array.from({ length: 16 }).map((_, c) => (
                <th key={c} style={{
                  fontFamily: "var(--font-mono)", fontSize: ".65rem",
                  color: c === step ? "var(--terracotta)" : "var(--ink-soft)",
                  fontWeight: c % 4 === 0 ? 700 : 400,
                }}>{c % 4 === 0 ? (c / 4 + 1) : "·"}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PADS.map((p, r) => (
              <tr key={p.id}>
                <td style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".8rem",
                  paddingRight: 8, color: p.color, textAlign: "right", whiteSpace: "nowrap",
                }}>{p.label}</td>
                {grid[r].map((on, c) => (
                  <td key={c}>
                    <button
                      onClick={() => toggleStep(r, c)}
                      style={{
                        width: 26, height: 26,
                        background: on ? p.color : "var(--bg)",
                        border: "1.5px solid " + (c === step ? "var(--terracotta)" : "var(--border)"),
                        borderRadius: 6,
                        boxShadow: on ? "0 3px 0 0 rgba(0,0,0,.18)" : "none",
                        cursor: "pointer",
                        transition: "transform .1s",
                        transform: c === step && on ? "scale(1.18)" : "scale(1)",
                      }}
                      aria-label={`${p.label} step ${c + 1}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row center gap-3 wrap mt-4">
        <label className="row gap-2 center" style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem" }}>
          BPM
          <input type="range" min="60" max="160" value={bpm} onChange={(e) => setBpm(+e.target.value)} />
          <span>{bpm}</span>
        </label>
        <button className="btn btn-ghost" onClick={() => onComplete?.()}>✓ Got it (+20 XP)</button>
      </div>
      <p className="text-soft mt-2 center-text" style={{ fontSize: ".8rem" }}>
        Tip: tap pads with mouse or keys (Z–M). Space toggles play.
      </p>
    </div>
  );
}

window.DrumPads = DrumPads;
