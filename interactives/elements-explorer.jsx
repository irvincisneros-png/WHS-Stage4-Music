/* Elements of Music Explorer: six interactive cards, each demos its element
   with both AUDIO and a synced VISUAL animation. */

const ELEMENTS = [
  {
    id: "duration",
    label: "Duration",
    blurb: "How long sounds last. Rhythm, beat, tempo, metre.",
    color: "var(--terracotta)",
    demo: ["Slow", "Medium", "Fast"],
  },
  {
    id: "pitch",
    label: "Pitch",
    blurb: "How high or low a sound is. Melody, harmony, range.",
    color: "var(--teal)",
    demo: ["Low", "Mid", "High"],
  },
  {
    id: "dynamics",
    label: "Dynamics",
    blurb: "How loud or soft, and how expressive.",
    color: "var(--butter)",
    demo: ["pp", "mf", "ff"],
  },
  {
    id: "tone",
    label: "Performing media & timbre",
    blurb: "What makes the sound (voice, instrument or technology) and its 'flavour' (tone colour). Same pitch, different instrument.",
    color: "#b07b8f",
    demo: ["Piano", "Pluck", "Synth"],
  },
  {
    id: "texture",
    label: "Texture",
    blurb: "How many layers play at once, and how they relate.",
    color: "#6ea7a0",
    demo: ["Mono", "Homo", "Poly"],
  },
  {
    id: "structure",
    label: "Structure",
    blurb: "How a piece is organised. Sections and form.",
    color: "var(--espresso)",
    demo: ["AB", "ABA", "Verse-Chorus"],
  },
];

/* ---------- audio per element ---------- */
function playDuration(speed) {
  const ms = { Slow: 600, Medium: 300, Fast: 130 }[speed];
  const notes = ["C5","E5","G5","C5","E5","G5","C5","E5"];
  notes.forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, ms/1000 * 0.7), i * ms));
}
function playPitch(range) {
  const sets = { Low: ["C3","E3","G3","C4"], Mid: ["C4","E4","G4","C5"], High: ["C6","E6","G6","C7"] };
  sets[range].forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 0.5), i * 200));
}
function playDynamics(level) {
  const v = { "pp": 0.2, "mf": 0.6, "ff": 1.0 }[level];
  const notes = ["E5","G5","C6"];
  notes.forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 0.6, v), i * 200));
}
function playTone(kind) {
  const note = "C5";
  if (kind === "Piano") window.MusicAudio?.playPiano(note, 0.9);
  if (kind === "Pluck") window.MusicAudio?.playPluck(note, 1.0);
  if (kind === "Synth") {
    ["C5","E5","G5","B5"].forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 1.2, 0.5), i * 80));
  }
}
function playTexture(kind) {
  if (kind === "Mono") {
    ["C5","D5","E5","F5","G5"].forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 0.5), i * 250));
  } else if (kind === "Homo") {
    ["C5","D5","E5","F5","G5"].forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 0.5), i * 280));
    setTimeout(() => window.MusicAudio?.playChord(["C4","E4","G4"], 1.6, 0.5), 0);
    setTimeout(() => window.MusicAudio?.playChord(["F3","A3","C4"], 1.6, 0.5), 700);
  } else if (kind === "Poly") {
    ["C5","D5","E5","F5","G5","E5","D5","C5"].forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 0.5), i * 200));
    ["G3","E3","C3","G3","E3","C3","G3","C4"].forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 0.6), i * 200 + 100));
  }
}
function playStructure(form) {
  const A = ["C5","E5","G5","E5"];
  const B = ["F5","A5","G5","E5"];
  const sections = form === "AB" ? [A, B]
                : form === "ABA" ? [A, B, A]
                : /* V-C */ [A, B, A, B];
  sections.flat().forEach((n, i) => setTimeout(() => window.MusicAudio?.playPiano(n, 0.5), i * 220));
}

function fireDemo(elId, demo) {
  window.MusicAudio?.resume();
  switch (elId) {
    case "duration":  return playDuration(demo);
    case "pitch":     return playPitch(demo);
    case "dynamics":  return playDynamics(demo);
    case "tone":      return playTone(demo);
    case "texture":   return playTexture(demo);
    case "structure": return playStructure(demo);
  }
}

/* ---------- per-element visualizer ---------- */
function ElementViz({ elId, demo, color, runKey }) {
  // runKey changes whenever a new demo is fired; we use it as the key on the
  // viz wrapper to reset CSS animations cleanly.
  const palette = color || "var(--terracotta)";
  return (
    <div key={runKey} style={{
      height: 64,
      background: "var(--bg)",
      border: "1.5px solid var(--border)",
      borderRadius: 12,
      position: "relative",
      overflow: "hidden",
    }}>
      {!demo && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-soft)", fontSize: ".75rem",
          fontFamily: "var(--font-mono)", letterSpacing: ".1em",
          textTransform: "uppercase",
        }}>tap a demo →</div>
      )}
      {elId === "duration" && demo && <VizDuration demo={demo} color={palette} />}
      {elId === "pitch"    && demo && <VizPitch    demo={demo} color={palette} />}
      {elId === "dynamics" && demo && <VizDynamics demo={demo} color={palette} />}
      {elId === "tone"     && demo && <VizTone     demo={demo} color={palette} />}
      {elId === "texture"  && demo && <VizTexture  demo={demo} color={palette} />}
      {elId === "structure"&& demo && <VizStructure demo={demo} color={palette} />}
    </div>
  );
}

function VizDuration({ demo, color }) {
  // pulsing dots at three different cadences
  const ms = { Slow: 600, Medium: 300, Fast: 130 }[demo];
  const count = 8;
  return (
    <div style={{ display: "flex", height: "100%", alignItems: "center",
                   justifyContent: "space-around", padding: "0 12px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{
          width: 14, height: 14, borderRadius: "50%", background: color,
          opacity: 0.4,
          animation: `el-pulse ${ms}ms ${i * ms}ms ease-out`,
        }} />
      ))}
    </div>
  );
}

function VizPitch({ demo, color }) {
  // bars rising/falling based on range
  const sets = {
    Low:  [22, 30, 36, 28],
    Mid:  [40, 50, 56, 48],
    High: [62, 72, 78, 70],
  };
  const heights = sets[demo];
  return (
    <div style={{ display: "flex", height: "100%", alignItems: "flex-end",
                   justifyContent: "space-around", padding: "0 14px 6px" }}>
      {heights.map((h, i) => (
        <span key={i} style={{
          width: 18, background: color, borderRadius: "4px 4px 0 0",
          height: h + "%",
          opacity: 0,
          animation: `el-rise 250ms ${i * 200}ms ease-out forwards`,
        }} />
      ))}
    </div>
  );
}

function VizDynamics({ demo, color }) {
  // waveform amplitude swells. pp small, mf medium, ff big
  const amp = { "pp": 6, "mf": 18, "ff": 28 }[demo];
  // build a sine wave path
  const w = 280, h = 64;
  const cy = h / 2;
  let d = `M 0 ${cy}`;
  for (let x = 0; x <= w; x += 4) {
    const y = cy + Math.sin((x / w) * Math.PI * 6) * amp;
    d += ` L ${x} ${y}`;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
         style={{ width: "100%", height: "100%" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: "el-fade-in 250ms ease-out" }} />
      <text x={w - 8} y={18} textAnchor="end" fontSize="14"
            fontFamily="serif" fontStyle="italic" fill={color}>{demo}</text>
    </svg>
  );
}

function VizTone({ demo, color }) {
  // three different waveform shapes
  const w = 280, h = 64;
  const cy = h / 2;
  function build(kind) {
    let d = `M 0 ${cy}`;
    for (let x = 0; x <= w; x += 2) {
      const t = (x / w) * Math.PI * 6;
      let y;
      if (kind === "Piano") y = cy + Math.sin(t) * 18 * Math.exp(-x / w * 1.2);
      else if (kind === "Pluck") y = cy + Math.sign(Math.sin(t)) * 16 * Math.exp(-x / w * 0.8);
      else y = cy + (Math.sin(t) + Math.sin(t * 2) * 0.4 + Math.sin(t * 3) * 0.25) * 12;
      d += ` L ${x} ${y}`;
    }
    return d;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
         style={{ width: "100%", height: "100%" }}>
      <path d={build(demo)} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: "el-trace 800ms ease-out" }} />
      <text x={w - 8} y={18} textAnchor="end" fontSize="11"
            fontFamily="var(--font-mono)" fill={color}>{demo}</text>
    </svg>
  );
}

function VizTexture({ demo, color }) {
  // mono = 1 line, homo = line + chord bars, poly = two weaving lines
  const w = 280, h = 64;
  function wavePath(amp, phase, freq) {
    let d = `M 0 ${h/2 + amp * Math.sin(phase)}`;
    for (let x = 0; x <= w; x += 4) {
      const y = h/2 + amp * Math.sin((x / w) * Math.PI * freq + phase);
      d += ` L ${x} ${y}`;
    }
    return d;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
         style={{ width: "100%", height: "100%" }}>
      {/* chord bars (homo only) */}
      {demo === "Homo" && [0, 1, 2].map(i => (
        <rect key={i} x={20 + i * 90} y={32} width={70} height={6}
              fill={color} opacity="0.25"
              style={{ animation: `el-fade-in 300ms ${i*120}ms both` }}/>
      ))}
      {/* always-visible top line */}
      <path d={wavePath(14, 0, 5)} fill="none" stroke={color} strokeWidth="2.2"
            strokeLinecap="round"
            style={{ animation: "el-trace 600ms ease-out" }} />
      {/* counter-line for poly */}
      {demo === "Poly" && (
        <path d={wavePath(10, Math.PI / 2, 7)} fill="none"
              stroke="var(--terracotta)" strokeWidth="2.2"
              strokeLinecap="round"
              style={{ animation: "el-trace 600ms 200ms both" }} />
      )}
      <text x={w - 8} y={18} textAnchor="end" fontSize="11"
            fontFamily="var(--font-mono)" fill={color}>{demo}</text>
    </svg>
  );
}

function VizStructure({ demo, color }) {
  const sections = demo === "AB" ? ["A", "B"]
                 : demo === "ABA" ? ["A", "B", "A"]
                 : ["V", "C", "V", "C"];
  const colors = { A: "var(--terracotta)", B: "var(--butter-d)",
                   V: "var(--terracotta)", C: "var(--butter-d)" };
  return (
    <div style={{ display: "flex", height: "100%", padding: 8, gap: 4 }}>
      {sections.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          background: colors[s] || color,
          borderRadius: 8,
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem",
          opacity: 0,
          animation: `el-block 400ms ${i*200}ms ease-out forwards`,
        }}>{s}</div>
      ))}
    </div>
  );
}

/* ---------- main component ---------- */
function ElementsExplorer({ topic, difficulty, onComplete }) {
  const [explored, setExplored] = React.useState(new Set());
  const [activeDemo, setActiveDemo] = React.useState({});
  const [runKey, setRunKey] = React.useState({});

  function explore(el, dem) {
    fireDemo(el.id, dem);
    setExplored(s => new Set(s).add(el.id));
    setActiveDemo(a => ({ ...a, [el.id]: dem }));
    setRunKey(r => ({ ...r, [el.id]: (r[el.id] || 0) + 1 }));
    if (explored.size + 1 >= ELEMENTS.length) onComplete?.();
  }

  return (
    <div className="col gap-3">
      <style>{`
        @keyframes el-pulse {
          0%   { transform: scale(0.4); opacity: 0.3; }
          25%  { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(0.4); opacity: 0.3; }
        }
        @keyframes el-rise {
          0%   { transform: translateY(120%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes el-fade-in {
          0% { opacity: 0; } 100% { opacity: 1; }
        }
        @keyframes el-trace {
          0%   { stroke-dasharray: 0 1200; }
          100% { stroke-dasharray: 1200 0; }
        }
        @keyframes el-block {
          0%   { transform: translateY(120%); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="row between center wrap gap-3">
        <Chip>The Six Elements</Chip>
        <Chip variant={explored.size === 6 ? "teal" : undefined}>{explored.size} / 6 explored</Chip>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 14,
      }}>
        {ELEMENTS.map(el => (
          /* Plain (non-tilting) card: this card holds its own clickable demo
             buttons, so it must NOT use TiltCard. A cursor-following 3D tilt
             makes the buttons wobble away from the pointer and hard to click. */
          <div key={el.id} className="chunk" style={{
            padding: 18,
            background: "var(--bg-2)",
            outline: explored.has(el.id) ? "2px solid var(--butter)" : "none",
          }}>
            <div className="col gap-2">
              <div className="row between center">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: el.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontWeight: 800,
                }}>{el.label[0]}</div>
                {explored.has(el.id) && <span style={{ color: "var(--butter-d)" }}>★</span>}
              </div>
              <h3 style={{ fontSize: "1.05rem" }}>{el.label}</h3>
              <p className="text-soft" style={{ fontSize: ".84rem", lineHeight: 1.4 }}>{el.blurb}</p>

              <ElementViz elId={el.id} demo={activeDemo[el.id]}
                          color={el.color} runKey={runKey[el.id]} />

              <div className="row gap-2 wrap mt-1">
                {el.demo.map(d => (
                  <button
                    key={d}
                    className="btn btn-ghost"
                    style={{
                      padding: "6px 10px",
                      fontSize: ".82rem",
                      background: activeDemo[el.id] === d ? el.color : undefined,
                      color: activeDemo[el.id] === d ? "#fff" : undefined,
                      borderColor: activeDemo[el.id] === d ? el.color : undefined,
                    }}
                    onClick={() => explore(el, d)}
                  >▸ {d}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {explored.size === 6 && (
        <div className="center-text mt-2">
          <span className="hud-pill" style={{ background: "var(--butter)", color: "var(--espresso-2)", borderColor: "var(--butter-d)" }}>
            🏅 All six elements unlocked!
          </span>
        </div>
      )}
    </div>
  );
}

window.ElementsExplorer = ElementsExplorer;
