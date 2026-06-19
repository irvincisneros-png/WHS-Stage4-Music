/* Section-level mini-interactives. One file, many small components.
   Each takes optional props and exports onto window. They are designed
   for embedding inside a SectionPage and are small + self-contained. */

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

const { useEffect: useEf, useRef: useRf, useState: useSt, useMemo: useMm } = React;

const Audio = () => window.MusicAudio;

function useBeat(bpm, steps, playing) {
  const [step, setStep] = useSt(-1);
  useEf(() => {
    if (!playing) { setStep(-1); return; }
    const ms = 60_000 / bpm / 2; // 8th notes
    let s = 0;
    setStep(0);
    const id = setInterval(() => {
      s = (s + 1) % steps;
      setStep(s);
    }, ms);
    return () => clearInterval(id);
  }, [bpm, steps, playing]);
  return step;
}

/* ------------------------------------------------------------------ */
/* 1. TapPulse: tap in time, see how close to the beat                 */
/* ------------------------------------------------------------------ */
function TapPulse({ bpm = 90, label = "Tap a steady beat" }) {
  const [playing, setPlaying] = useSt(false);
  const [hits, setHits] = useSt([]); // ms offsets
  const startRef = useRf(0);
  const beatMs = 60_000 / bpm;

  useEf(() => {
    if (!playing) return;
    Audio()?.resume();
    startRef.current = performance.now();
    setHits([]);
    let i = 0;
    Audio()?.click(true);
    const id = setInterval(() => {
      i++;
      Audio()?.click(i % 4 === 0);
      if (i >= 16) { setPlaying(false); clearInterval(id); }
    }, beatMs);
    return () => clearInterval(id);
  }, [playing, bpm]);

  function tap() {
    if (!playing) { setPlaying(true); return; }
    const t = performance.now() - startRef.current;
    const nearest = Math.round(t / beatMs) * beatMs;
    const off = t - nearest;
    setHits(h => [...h, { t, off }]);
  }

  const avgOff = hits.length
    ? Math.round(hits.reduce((s, h) => s + Math.abs(h.off), 0) / hits.length)
    : null;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Pulse trainer</div>
          <strong>{label} · {bpm} BPM</strong>
        </div>
        <span className="mono text-soft" style={{ fontSize: ".82rem" }}>
          {playing ? `${hits.length} taps` : "press to begin"}
        </span>
      </div>

      <button onClick={tap} className="btn btn-primary" style={{
        height: 120, fontSize: "1.4rem", fontFamily: "var(--font-display)",
      }}>
        {playing ? "TAP" : "▶ Start & tap"}
      </button>

      {hits.length > 0 && (
        <div style={{
          height: 70, background: "var(--bg)", border: "1.5px solid var(--border)",
          borderRadius: 14, position: "relative", overflow: "hidden",
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} style={{
              position: "absolute", left: `${(i / 16) * 100}%`, top: 0, bottom: 0,
              width: 1, background: i % 4 === 0 ? "var(--terracotta)" : "var(--border)",
              opacity: i % 4 === 0 ? .6 : .3,
            }} />
          ))}
          {hits.map((h, i) => {
            const pct = (h.t / (16 * beatMs)) * 100;
            const good = Math.abs(h.off) < 80;
            return <span key={i} style={{
              position: "absolute", left: `${pct}%`, top: "50%",
              width: 10, height: 10, marginLeft: -5, marginTop: -5,
              background: good ? "var(--teal)" : "var(--butter-d)",
              borderRadius: "50%",
            }} />;
          })}
        </div>
      )}

      {avgOff !== null && !playing && (
        <div className="row between center">
          <span className="text-soft" style={{ fontSize: ".88rem" }}>
            Average offset · <strong style={{ color: avgOff < 60 ? "var(--teal)" : "var(--butter-d)" }}>{avgOff}ms</strong>
          </span>
          <span className="mono text-soft" style={{ fontSize: ".8rem" }}>
            {avgOff < 40 ? "Locked in." : avgOff < 80 ? "Good." : "Loosen up; feel the click."}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. MiniStepGrid: generic step sequencer (rows is array of voices)   */
/* ------------------------------------------------------------------ */
function MiniStepGrid({ rows, steps = 8, bpm = 100, title = "Step sequencer", preset }) {
  const [grid, setGrid] = useSt(() => {
    if (preset) return preset.map(r => r.slice(0, steps));
    return rows.map(() => Array(steps).fill(false));
  });
  const [playing, setPlaying] = useSt(false);
  const step = useBeat(bpm, steps, playing);

  function toggle(r, c) {
    setGrid(g => g.map((row, i) => i === r ? row.map((v, j) => j === c ? !v : v) : row));
  }

  useEf(() => {
    if (step < 0) return;
    Audio()?.resume();
    grid.forEach((row, i) => {
      if (row[step]) rows[i].play?.();
    });
  }, [step]);

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">{title}</div>
          <strong>{bpm} BPM · {steps} steps</strong>
        </div>
        <button className="btn btn-primary" onClick={() => setPlaying(p => !p)}>
          {playing ? "■ Stop" : "▶ Play"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((row, ri) => (
          <div key={ri} className="row gap-2 center">
            <span style={{
              width: 72, fontFamily: "var(--font-mono)", fontSize: ".75rem",
              textTransform: "uppercase", color: "var(--ink-soft)", flexShrink: 0,
            }}>{row.label}</span>
            <div style={{
              flex: 1, display: "grid", gridTemplateColumns: `repeat(${steps}, 1fr)`, gap: 4,
            }}>
              {grid[ri].map((on, ci) => (
                <button
                  key={ci}
                  onClick={() => toggle(ri, ci)}
                  style={{
                    height: 38, border: "1.5px solid var(--border)",
                    background: on ? (row.color || "var(--terracotta)") : "var(--bg)",
                    color: on ? "#fff" : "var(--ink-soft)",
                    borderRadius: 8, cursor: "pointer", padding: 0,
                    outline: step === ci ? "2px solid var(--butter)" : "none",
                    outlineOffset: -1,
                    fontFamily: "var(--font-mono)", fontSize: ".7rem",
                    transition: "transform .1s",
                    transform: step === ci && on ? "scale(1.08)" : "none",
                  }}
                >{ci % 4 === 0 ? ci / 4 + 1 : ""}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. MiniStaff: clickable staff (treble / bass)                       */
/* ------------------------------------------------------------------ */
function MiniStaff({ clef = "treble" }) {
  /* Position numbering: lines are drawn at pos 1, 3, 5, 7, 9 (top → bottom).
     pos 1 = top line, pos 9 = bottom line. Each diatonic step = 1 pos.
     Anything > 9 sits BELOW the staff (needs ledger lines past pos 11).
     Anything < 1 sits ABOVE the staff. */
  const treble = [
    { pos: 11, name: "C4", label: "Middle C (1 ledger below)" },
    { pos: 10, name: "D4", label: "D4 (just below staff)" },
    { pos: 9,  name: "E4", label: "E4 (bottom line)" },
    { pos: 8,  name: "F4", label: "F4 (1st space)" },
    { pos: 7,  name: "G4", label: "G4 (2nd line, clef curl)" },
    { pos: 6,  name: "A4", label: "A4 (2nd space)" },
    { pos: 5,  name: "B4", label: "B4 (middle line)" },
    { pos: 4,  name: "C5", label: "C5 (3rd space)" },
    { pos: 3,  name: "D5", label: "D5 (4th line)" },
    { pos: 2,  name: "E5", label: "E5 (top space)" },
    { pos: 1,  name: "F5", label: "F5 (top line)" },
  ];
  const bass = [
    { pos: 11, name: "E2", label: "E2 (1 ledger below)" },
    { pos: 10, name: "F2", label: "F2 (just below staff)" },
    { pos: 9,  name: "G2", label: "G2 (bottom line)" },
    { pos: 8,  name: "A2", label: "A2 (1st space)" },
    { pos: 7,  name: "B2", label: "B2 (2nd line)" },
    { pos: 6,  name: "C3", label: "C3 (2nd space)" },
    { pos: 5,  name: "D3", label: "D3 (middle line)" },
    { pos: 4,  name: "E3", label: "E3 (3rd space)" },
    { pos: 3,  name: "F3", label: "F3 (4th line, the F-clef line)" },
    { pos: 2,  name: "G3", label: "G3 (top space)" },
    { pos: 1,  name: "A3", label: "A3 (top line)" },
    { pos: -1, name: "C4", label: "Middle C (1 ledger above)" },
  ];
  const notes = clef === "treble" ? treble : bass;
  const [picked, setPicked] = useSt(null);

  function clickNote(n) {
    setPicked(n);
    Audio()?.resume();
    Audio()?.playPiano(n.name, 1.0);
  }

  const W = 520, H = 220;
  const lineGap = 16;
  const top = 60;
  const ystaff = (p) => top + p * (lineGap / 2);

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Click any note</div>
          <strong>{clef === "treble" ? "Treble (G) clef" : "Bass (F) clef"}</strong>
        </div>
        <span className="mono text-soft" style={{ fontSize: ".82rem" }}>
          {picked ? `${picked.name} · ${picked.label}` : "tap a note to hear it"}
        </span>
      </div>

      <div style={{ background: "var(--bg)", borderRadius: 14, padding: 12, border: "1.5px solid var(--border)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i} x1={20} y1={ystaff(i * 2 + 1)} x2={W - 20} y2={ystaff(i * 2 + 1)}
                  stroke="var(--ink-soft)" strokeWidth="1.5" />
          ))}
          {/* clef glyph */}
          <text x="32" y={clef === "treble" ? ystaff(7) + 8 : ystaff(3) + 8}
                fontSize={clef === "treble" ? 80 : 60}
                fontFamily="serif" fill="var(--ink)">
            {clef === "treble" ? "𝄞" : "𝄢"}
          </text>

          {notes.map((n, i) => {
            const x = 110 + i * 35;
            const y = ystaff(n.pos);
            return (
              <g key={n.name}
                style={{ cursor: "pointer" }}
                onClick={() => clickNote(n)}
                tabIndex={0}
                role="button"
                aria-label={`${n.name} - ${n.label}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    clickNote(n);
                  }
                }}>
                {/* ledger line below the staff (e.g. Middle C in treble at pos 11) */}
                {n.pos >= 11 && <line x1={x - 11} y1={ystaff(11)} x2={x + 11} y2={ystaff(11)} stroke="var(--ink)" strokeWidth="1.5"/>}
                {/* ledger line above the staff (e.g. Middle C in bass at pos -1) */}
                {n.pos <= -1 && <line x1={x - 11} y1={ystaff(-1)} x2={x + 11} y2={ystaff(-1)} stroke="var(--ink)" strokeWidth="1.5"/>}
                <ellipse cx={x} cy={y} rx={9} ry={7}
                         fill={picked?.name === n.name ? "var(--terracotta)" : "var(--ink)"}
                         transform={`rotate(-20 ${x} ${y})`} />
                <text x={x} y={H - 16} fontSize={11} textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fill={picked?.name === n.name ? "var(--terracotta)" : "var(--ink-soft)"}>
                  {n.name.replace(/(\d)/, "")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. NoteValueLab: buttons for different note durations               */
/* ------------------------------------------------------------------ */
function NoteValueLab({ bpm = 80 }) {
  const beatMs = 60_000 / bpm;
  const values = [
    { label: "Semibreve", beats: 4, glyph: "𝅝" },
    { label: "Minim", beats: 2, glyph: "𝅗𝅥" },
    { label: "Crotchet", beats: 1, glyph: "𝅘𝅥" },
    { label: "Quaver", beats: 0.5, glyph: "𝅘𝅥𝅮" },
    { label: "Semiquaver", beats: 0.25, glyph: "𝅘𝅥𝅯" },
  ];
  const [active, setActive] = useSt(null);

  function play(v) {
    Audio()?.resume();
    setActive(v.label);
    const count = Math.max(1, Math.round(4 / v.beats));
    for (let i = 0; i < count; i++) {
      setTimeout(() => Audio()?.playPiano("C5", v.beats * 0.5), i * v.beats * beatMs);
    }
    setTimeout(() => setActive(null), count * v.beats * beatMs);
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div>
        <div className="eyebrow">Hear it</div>
        <strong>Note values at {bpm} BPM</strong>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        {values.map(v => (
          <button key={v.label} className="btn btn-ghost" onClick={() => play(v)}
            style={{
              padding: "16px 8px", display: "grid", gap: 4, justifyItems: "center",
              background: active === v.label ? "var(--terracotta)" : undefined,
              color: active === v.label ? "#fff" : undefined,
              borderColor: active === v.label ? "var(--terracotta)" : undefined,
            }}>
            <span style={{ fontSize: "2.4rem", lineHeight: 1, fontFamily: "serif" }}>{v.glyph}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".75rem" }}>{v.label}</span>
            <span style={{ fontSize: ".75rem", opacity: .7 }}>{v.beats} beat{v.beats !== 1 ? "s" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. MiniKeys: small interactive keyboard                             */
/* ------------------------------------------------------------------ */
function MiniKeys({ startMidi = 60, octaves = 1, highlight = [], labelMode = "letters" }) {
  // Generate notes
  const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const whiteIdx = [0,2,4,5,7,9,11];
  const blackIdx = [1,3,6,8,10];
  const total = octaves * 12;

  function nameForMidi(m) {
    const o = Math.floor(m / 12) - 1;
    return noteNames[m % 12] + o;
  }

  function play(m) {
    Audio()?.resume();
    Audio()?.playPiano(nameForMidi(m).replace("#", "#"), 0.8);
  }

  const whiteKeys = [];
  for (let i = 0; i < total; i++) {
    if (whiteIdx.includes(i % 12)) whiteKeys.push(startMidi + i);
  }
  const blackKeys = [];
  for (let i = 0; i < total; i++) {
    if (blackIdx.includes(i % 12)) blackKeys.push(startMidi + i);
  }

  const W = 480, H = 130;
  const kw = W / whiteKeys.length;

  function whitePos(midi) {
    return whiteKeys.indexOf(midi);
  }
  function blackXFor(midi) {
    // black key sits between the white above and below
    const below = whiteKeys.findIndex(w => w > midi) - 1;
    return (below + 1) * kw - kw * 0.32;
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div>
        <div className="eyebrow">Tap a key</div>
        <strong>Mini keyboard</strong>
      </div>

      <div style={{ position: "relative", height: H, background: "var(--bg)",
                    borderRadius: 12, border: "1.5px solid var(--border)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
          {whiteKeys.map((m, i) => {
            const isHi = highlight.includes(nameForMidi(m).replace(/\d/, ""));
            const noteName = nameForMidi(m);
            return (
              <g key={"w"+m}
                onClick={() => play(m)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Play ${noteName}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    play(m);
                  }
                }}>
                <rect x={i*kw} y={0} width={kw-1} height={H}
                      fill={isHi ? "var(--butter)" : "#fff"} stroke="var(--ink-soft)" strokeWidth="1"/>
                {labelMode === "letters" && (
                  <text x={i*kw + kw/2} y={H - 8} textAnchor="middle"
                        fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-soft)">
                    {nameForMidi(m).replace(/\d/, "")}
                  </text>
                )}
              </g>
            );
          })}
          {blackKeys.map((m) => {
            const x = blackXFor(m);
            const isHi = highlight.includes(nameForMidi(m).replace(/\d/, ""));
            const noteName = nameForMidi(m);
            return (
              <g key={"b"+m}
                onClick={() => play(m)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Play ${noteName}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    play(m);
                  }
                }}>
                <rect x={x} y={0} width={kw*0.64} height={H*0.62}
                      fill={isHi ? "var(--terracotta)" : "var(--ink)"} stroke="#000"/>
                {labelMode === "letters" && (
                  <text x={x + kw*0.32} y={H*0.5} textAnchor="middle"
                        fontSize="8" fontFamily="var(--font-mono)" fill="#fff">
                    {nameForMidi(m).replace(/\d/, "")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. ChordPicker: buttons for chords                                  */
/* ------------------------------------------------------------------ */
function ChordPicker({ chords, title = "Chord library" }) {
  const [active, setActive] = useSt(null);

  function play(c) {
    Audio()?.resume();
    setActive(c.name);
    Audio()?.playChord(c.notes, 1.6, 0.7);
    setTimeout(() => setActive(null), 1700);
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div>
        <div className="eyebrow">Listen</div>
        <strong>{title}</strong>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
        {chords.map(c => (
          <button key={c.name} className="btn btn-ghost" onClick={() => play(c)}
            style={{
              padding: "14px 8px", display: "grid", gap: 6,
              background: active === c.name ? (c.color || "var(--teal)") : undefined,
              color: active === c.name ? "#fff" : undefined,
              borderColor: active === c.name ? (c.color || "var(--teal)") : undefined,
            }}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}>{c.name}</strong>
            {c.sub && <span style={{ fontSize: ".75rem", opacity: .75, fontFamily: "var(--font-mono)" }}>{c.sub}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. TextureToggles: mono / homo / poly layer toggler                 */
/* ------------------------------------------------------------------ */
function TextureToggles() {
  const [layers, setLayers] = useSt({ melody: true, chords: false, counter: false });
  const [playing, setPlaying] = useSt(false);

  useEf(() => {
    if (!playing) return;
    Audio()?.resume();
    let i = 0;
    const melody = ["C5","D5","E5","G5","A5","G5","E5","D5"];
    const counter = ["G3","E3","C3","E3","G3","E3","C3","C4"];
    const chords = [["C4","E4","G4"], ["F4","A4","C5"]];
    const id = setInterval(() => {
      if (layers.melody) Audio()?.playPiano(melody[i % 8], 0.4);
      if (layers.counter) Audio()?.playPiano(counter[i % 8], 0.5, 0.5);
      if (layers.chords && i % 4 === 0) Audio()?.playChord(chords[(i/4) % 2 | 0], 1.6, 0.4);
      i++;
      if (i >= 16) { setPlaying(false); clearInterval(id); }
    }, 250);
    return () => clearInterval(id);
  }, [playing]);

  const active = Object.values(layers).filter(Boolean).length;
  const textureName = active <= 1 ? "Monophonic" : layers.counter && layers.melody ? "Polyphonic" : "Homophonic";

  function Toggle({ id, label, desc, color }) {
    return (
      <button onClick={() => setLayers(l => ({ ...l, [id]: !l[id] }))}
        className="chunk" style={{
          textAlign: "left", padding: "14px 16px", borderRadius: 14, cursor: "pointer",
          background: layers[id] ? color : "var(--bg-2)",
          color: layers[id] ? "#fff" : "var(--ink)",
          border: "1.5px solid " + (layers[id] ? color : "var(--border)"),
        }}>
        <strong style={{ fontFamily: "var(--font-display)" }}>{label}</strong>
        <p style={{ fontSize: ".82rem", margin: "4px 0 0", opacity: .85 }}>{desc}</p>
      </button>
    );
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Texture lab</div>
          <strong>{textureName} · {active} layer{active === 1 ? "" : "s"} on</strong>
        </div>
        <button className="btn btn-primary" onClick={() => setPlaying(p => !p)}>
          {playing ? "■ Stop" : "▶ Play"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <Toggle id="melody"  label="Melody"   desc="A single tune sung up high."     color="var(--terracotta)" />
        <Toggle id="chords"  label="Chords"   desc="Stacked harmony underneath."     color="var(--butter-d)" />
        <Toggle id="counter" label="Counter-melody" desc="A second tune that argues with the first." color="var(--teal)" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8. MajorMinorAB: same melody, two tonalities                        */
/* ------------------------------------------------------------------ */
function MajorMinorAB() {
  const [mode, setMode] = useSt(null);
  function play(m) {
    Audio()?.resume();
    setMode(m);
    const major = ["C5","E5","G5","C6","B5","G5","E5","C5"];
    const minor = ["C5","D#5","G5","C6","A#5","G5","D#5","C5"]; // Eb / Bb
    const seq = m === "major" ? major : minor;
    seq.forEach((n, i) => setTimeout(() => Audio()?.playPiano(n.replace("#", "#"), 0.45), i * 220));
    setTimeout(() => setMode(null), 8 * 220 + 200);
  }
  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div>
        <div className="eyebrow">A / B compare</div>
        <strong>Major vs Minor: same melody, third flips</strong>
      </div>
      <div className="row gap-3 wrap">
        <button className="btn btn-primary" onClick={() => play("major")}
          style={{ flex: "1 1 200px", padding: "18px",
            background: mode === "major" ? "var(--teal)" : undefined,
            borderColor: mode === "major" ? "var(--teal)" : undefined,
          }}>
          ▶ Major (bright)
        </button>
        <button className="btn btn-primary" onClick={() => play("minor")}
          style={{ flex: "1 1 200px", padding: "18px",
            background: mode === "minor" ? "#5a3a52" : undefined,
            borderColor: mode === "minor" ? "#5a3a52" : undefined,
          }}>
          ▶ Minor (darker)
        </button>
      </div>
      <p className="text-soft" style={{ fontSize: ".85rem" }}>
        Same melody. The only difference is the third, which sits half a step darker in minor. Your ear catches that immediately.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. OrchestraFamilies: 4 family tabs with timbre demo                */
/* ------------------------------------------------------------------ */
function OrchestraFamilies() {
  const families = [
    { id: "strings",   name: "Strings",   color: "var(--terracotta)",
      members: ["Violin", "Viola", "Cello", "Double bass", "Harp"],
      desc: "Sound made by bowing or plucking strings. Largest section, sits closest to the conductor.",
      timbre: () => { Audio()?.playPluck("E4", 1.4); Audio()?.playPluck("G4", 1.4); Audio()?.playPluck("B4", 1.4); } },
    { id: "woodwinds", name: "Woodwinds", color: "var(--teal)",
      members: ["Flute", "Oboe", "Clarinet", "Bassoon"],
      desc: "Air vibrating across or through a reed. Bright, agile, often carries the melody.",
      timbre: () => { Audio()?.playPiano("G5", 1.2, 0.5); Audio()?.playPiano("A5", 1.2, 0.5); Audio()?.playPiano("B5", 1.2, 0.5); } },
    { id: "brass",     name: "Brass",     color: "var(--butter-d)",
      members: ["Trumpet", "French horn", "Trombone", "Tuba"],
      desc: "Lips buzz into a metal mouthpiece. Loud, heroic, sits behind the woodwinds.",
      timbre: () => { Audio()?.playPiano("C4", 1.4, 0.9); Audio()?.playPiano("E4", 1.4, 0.9); Audio()?.playPiano("G4", 1.4, 0.9); } },
    { id: "perc",      name: "Percussion", color: "var(--espresso)",
      members: ["Timpani", "Snare", "Cymbals", "Triangle", "Xylophone"],
      desc: "Anything you hit, shake or scrape. Lives at the back of the stage.",
      timbre: () => { Audio()?.playTom(110); setTimeout(() => Audio()?.playSnare(), 250); setTimeout(() => Audio()?.playCrash(), 500); } },
  ];
  const [pick, setPick] = useSt(families[0]);
  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div>
        <div className="eyebrow">The four families</div>
        <strong>Click a family · hear a sample · see members</strong>
      </div>
      <div className="row gap-2 wrap">
        {families.map(f => (
          <button key={f.id} onClick={() => { setPick(f); Audio()?.resume(); f.timbre(); }}
            className="btn btn-ghost"
            style={{
              background: pick.id === f.id ? f.color : undefined,
              color: pick.id === f.id ? "#fff" : undefined,
              borderColor: pick.id === f.id ? f.color : undefined,
            }}>{f.name}</button>
        ))}
      </div>
      <div style={{ background: "var(--bg)", border: "1.5px dashed var(--border)",
                    borderRadius: 14, padding: 18 }}>
        <h3 style={{ fontSize: "1.2rem", margin: 0, color: pick.color }}>{pick.name}</h3>
        <p style={{ fontSize: ".92rem", lineHeight: 1.5, margin: "8px 0" }}>{pick.desc}</p>
        <div className="row gap-2 wrap">
          {pick.members.map(m => <Chip key={m}>{m}</Chip>)}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10. MCQ: generic multiple choice                                    */
/* ------------------------------------------------------------------ */
function MCQ({ title = "Quick check", items }) {
  const [answers, setAnswers] = useSt({});
  function pick(i, choice) {
    setAnswers(a => ({ ...a, [i]: choice }));
    if (choice === items[i].a) Audio()?.ding(true);
    else Audio()?.ding(false);
  }
  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 16 }}>
      <div>
        <div className="eyebrow">Quick check</div>
        <strong>{title}</strong>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{i + 1}. {it.q}</p>
          <div className="row gap-2 wrap">
            {it.options.map(o => {
              const picked = answers[i] === o;
              const correct = picked && o === it.a;
              const wrong = picked && o !== it.a;
              return (
                <button key={o} className="btn btn-ghost"
                  disabled={answers[i] != null}
                  onClick={() => pick(i, o)}
                  style={{
                    background: correct ? "var(--teal)" : wrong ? "#a44" : undefined,
                    color: (correct || wrong) ? "#fff" : undefined,
                    borderColor: correct ? "var(--teal)" : wrong ? "#a44" : undefined,
                    opacity: answers[i] != null && !picked ? .6 : 1,
                  }}>
                  {o}
                </button>
              );
            })}
          </div>
          {answers[i] != null && it.because && (
            <p className="text-soft" style={{ fontSize: ".85rem", margin: 0 }}>↳ {it.because}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11. BreathTimer: animated 4-8 breath circle                         */
/* ------------------------------------------------------------------ */
function BreathTimer() {
  const [running, setRunning] = useSt(false);
  const [phase, setPhase] = useSt("in");
  const [count, setCount] = useSt(4);

  useEf(() => {
    if (!running) return;
    let p = "in", c = 4;
    setPhase(p); setCount(c);
    const tick = () => {
      c -= 1;
      if (c <= 0) {
        if (p === "in") { p = "out"; c = 8; } else { p = "in"; c = 4; }
      }
      setPhase(p); setCount(c);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running]);

  const size = phase === "in" ? 220 : 110;
  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14, justifyItems: "center" }}>
      <div style={{ width: "100%" }}>
        <div className="eyebrow">Vocal warm-up</div>
        <strong>Box breath · in for 4, out for 8</strong>
      </div>
      <div style={{
        width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: "radial-gradient(circle, var(--terracotta) 0%, var(--terracotta-d) 100%)",
          transition: phase === "in" ? "all 4s linear" : "all 8s linear",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700,
        }}>{count}</div>
      </div>
      <strong style={{ fontFamily: "var(--font-mono)", letterSpacing: ".15em", textTransform: "uppercase" }}>
        {phase === "in" ? "Breathe in" : "Breathe out"}
      </strong>
      <button className="btn btn-primary" onClick={() => setRunning(r => !r)}>
        {running ? "■ Stop" : "▶ Begin"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12. DynamicsDemo: pp..ff with playback                              */
/* ------------------------------------------------------------------ */
function DynamicsDemo() {
  const levels = [
    { mark: "pp", name: "Pianissimo", v: 0.15, desc: "Very soft. As quiet as a whisper at the back of the room." },
    { mark: "p",  name: "Piano",      v: 0.30, desc: "Soft. Comfortable to speak over." },
    { mark: "mp", name: "Mezzo-piano", v: 0.45, desc: "Moderately soft. Still gentle." },
    { mark: "mf", name: "Mezzo-forte", v: 0.65, desc: "Moderately loud. The default for most pop." },
    { mark: "f",  name: "Forte",      v: 0.85, desc: "Loud. The chorus, the drop." },
    { mark: "ff", name: "Fortissimo", v: 1.00, desc: "Very loud. Reserved. Use sparingly to count." },
  ];
  const [pick, setPick] = useSt(levels[3]);
  function play(L) {
    Audio()?.resume();
    setPick(L);
    ["C5","E5","G5","C6"].forEach((n, i) => setTimeout(() => Audio()?.playPiano(n, 0.55, L.v), i * 180));
  }
  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div>
        <div className="eyebrow">Dynamics</div>
        <strong>From pp to ff</strong>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
        {levels.map(L => (
          <button key={L.mark} className="btn btn-ghost" onClick={() => play(L)}
            style={{
              padding: "12px 0", display: "grid", gap: 2, justifyItems: "center",
              background: pick.mark === L.mark ? "var(--terracotta)" : undefined,
              color: pick.mark === L.mark ? "#fff" : undefined,
              borderColor: pick.mark === L.mark ? "var(--terracotta)" : undefined,
            }}>
            <strong style={{ fontFamily: "serif", fontStyle: "italic", fontSize: "1.4rem" }}>{L.mark}</strong>
            <span style={{ fontSize: ".62rem", fontFamily: "var(--font-mono)", opacity: .8 }}>{Math.round(L.v * 100)}%</span>
          </button>
        ))}
      </div>
      <div style={{ background: "var(--bg)", borderRadius: 12, padding: "12px 16px", border: "1.5px solid var(--border)" }}>
        <strong>{pick.name}</strong>
        <p style={{ margin: "4px 0 0", fontSize: ".9rem", color: "var(--ink-soft)" }}>{pick.desc}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 13. FormBuilder: arrange A/B/C blocks into a structure              */
/* ------------------------------------------------------------------ */
function FormBuilder() {
  const blocks = [
    { id: "A", name: "Verse",   color: "var(--terracotta)", notes: ["C5","E5","G5","E5"] },
    { id: "B", name: "Chorus",  color: "var(--butter-d)",   notes: ["F5","A5","G5","E5","C5"] },
    { id: "C", name: "Bridge",  color: "var(--teal)",       notes: ["A4","G4","E4","D4"] },
  ];
  const [form, setForm] = useSt(["A","B","A","B"]);
  const [playing, setPlaying] = useSt(false);

  useEf(() => {
    if (!playing) return;
    Audio()?.resume();
    let cancelled = false;
    (async () => {
      for (let i = 0; i < form.length; i++) {
        const b = blocks.find(x => x.id === form[i]);
        for (let j = 0; j < b.notes.length; j++) {
          if (cancelled) return;
          Audio()?.playPiano(b.notes[j], 0.4);
          await new Promise(r => setTimeout(r, 240));
        }
      }
      setPlaying(false);
    })();
    return () => { cancelled = true; };
  }, [playing]);

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Form lab</div>
          <strong>Arrange the song · {form.join(" · ")}</strong>
        </div>
        <button className="btn btn-primary" onClick={() => setPlaying(p => !p)}>
          {playing ? "■ Stop" : "▶ Play form"}
        </button>
      </div>
      <div className="row gap-2 wrap">
        {blocks.map(b => (
          <button key={b.id} className="btn btn-ghost" onClick={() => setForm(f => [...f, b.id])}
            style={{ borderColor: b.color, color: b.color, fontWeight: 700 }}>
            + {b.id} {b.name}
          </button>
        ))}
        <button className="btn btn-ghost" onClick={() => setForm([])}>Clear</button>
      </div>
      <div className="row gap-2 wrap" style={{ minHeight: 60 }}>
        {form.map((id, i) => {
          const b = blocks.find(x => x.id === id);
          return (
            <button key={i} onClick={() => setForm(f => f.filter((_, j) => j !== i))}
              style={{
                background: b.color, color: "#fff", border: "none",
                padding: "12px 18px", borderRadius: 12, fontFamily: "var(--font-display)",
                fontWeight: 700, cursor: "pointer", fontSize: "1rem",
              }}>{b.id} · {b.name} ×</button>
          );
        })}
        {!form.length && <span className="text-soft">Click + buttons above to add sections.</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 14. GraphicScoreCanvas: draw and replay shapes                      */
/* ------------------------------------------------------------------ */
function GraphicScoreCanvas() {
  const [shapes, setShapes] = useSt([]);
  const tools = [
    { id: "click", label: "Click",  color: "var(--terracotta)", play: () => Audio()?.click(true) },
    { id: "kick",  label: "Boom",   color: "var(--espresso)",   play: () => Audio()?.playKick() },
    { id: "snare", label: "Crack",  color: "var(--butter-d)",   play: () => Audio()?.playSnare() },
    { id: "tom",   label: "Hum",    color: "var(--teal)",       play: () => Audio()?.playTom(180) },
    { id: "hat",   label: "Tss",    color: "#9c9c9c",           play: () => Audio()?.playHat(false) },
  ];
  const [tool, setTool] = useSt(tools[0]);

  function add(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setShapes(s => [...s, { x, y, t: tool.id, color: tool.color }]);
    Audio()?.resume();
    tool.play();
  }

  function play() {
    Audio()?.resume();
    const sorted = [...shapes].sort((a, b) => a.x - b.x);
    sorted.forEach((s, i) => {
      setTimeout(() => {
        const t = tools.find(t => t.id === s.t);
        t.play();
      }, i * 320);
    });
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Graphic score</div>
          <strong>Click on the canvas to place sounds · time flows left → right</strong>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => setShapes([])}>Clear</button>
          <button className="btn btn-primary" onClick={play} disabled={!shapes.length}>▶ Play</button>
        </div>
      </div>
      <div className="row gap-2 wrap">
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t)}
            className="btn btn-ghost"
            style={{
              background: tool.id === t.id ? t.color : undefined,
              color: tool.id === t.id ? "#fff" : undefined,
              borderColor: tool.id === t.id ? t.color : undefined,
            }}>{t.label}</button>
        ))}
      </div>
      <div onClick={add}
        tabIndex={0}
        role="button"
        aria-label={`Graphic score canvas. Press Enter or Space to place a ${tool.label} sound at the centre.`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (e.key === " ") e.preventDefault();
            // Place sound at centre of the canvas
            const el = e.currentTarget;
            const r = el.getBoundingClientRect();
            Audio()?.resume();
            tool.play();
            setShapes(s => [...s, { x: 0.5, y: 0.5, t: tool.id, color: tool.color }]);
          }
        }}
        style={{
          height: 220, background: "linear-gradient(90deg, var(--bg) 0%, var(--bg-2) 100%)",
          border: "1.5px dashed var(--border)", borderRadius: 14, position: "relative",
          cursor: "crosshair",
          backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px)",
          backgroundSize: "12.5% 100%",
        }}>
        {shapes.map((s, i) => (
          <span key={i} style={{
            position: "absolute", left: `${s.x*100}%`, top: `${s.y*100}%`,
            width: 18, height: 18, borderRadius: "50%", background: s.color,
            marginLeft: -9, marginTop: -9,
            boxShadow: "0 2px 0 0 rgba(0,0,0,.15)",
          }} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 15. CMajorScale: a play-along scale ladder                          */
/* ------------------------------------------------------------------ */
function ScaleLadder({ name = "C major", notes = ["C4","D4","E4","F4","G4","A4","B4","C5"] }) {
  const [playing, setPlaying] = useSt(-1);
  function playAll() {
    Audio()?.resume();
    notes.forEach((n, i) => {
      setTimeout(() => { setPlaying(i); Audio()?.playPiano(n, 0.45); }, i * 280);
    });
    setTimeout(() => setPlaying(-1), notes.length * 280 + 200);
  }
  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Scale</div>
          <strong>{name}</strong>
        </div>
        <button className="btn btn-primary" onClick={playAll}>▶ Play ladder</button>
      </div>
      <div className="row gap-2 wrap">
        {notes.map((n, i) => (
          <button key={i} className="btn btn-ghost" onClick={() => { Audio()?.resume(); Audio()?.playPiano(n, 0.5); }}
            style={{
              minWidth: 64, fontFamily: "var(--font-mono)", fontWeight: 700,
              background: playing === i ? "var(--terracotta)" : undefined,
              color: playing === i ? "#fff" : undefined,
              borderColor: playing === i ? "var(--terracotta)" : undefined,
            }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 16. TabReader: guitar fretboard + tab playback                      */
/* ------------------------------------------------------------------ */
function TabReader({ tabs, frets = 7 }) {
  const TABS = tabs && tabs.length ? tabs : [
    { name: "Open strings", bpm: 70,
      notes: [
        { s: 5, f: 0 }, { s: 4, f: 0 }, { s: 3, f: 0 },
        { s: 2, f: 0 }, { s: 1, f: 0 }, { s: 0, f: 0 },
      ] },
    { name: "Climbing 0 → 3", bpm: 100,
      notes: [
        { s: 5, f: 0 }, { s: 5, f: 2 }, { s: 5, f: 3 },
        { s: 4, f: 0 }, { s: 4, f: 2 }, { s: 4, f: 3 },
        { s: 3, f: 0 }, { s: 3, f: 2 }, { s: 3, f: 3 },
      ] },
    { name: "Pentatonic riff", bpm: 110,
      notes: [
        { s: 5, f: 0 }, { s: 5, f: 3 }, { s: 4, f: 0 }, { s: 4, f: 2 },
        { s: 3, f: 0 }, { s: 3, f: 2 }, { s: 4, f: 2 }, { s: 4, f: 0 },
        { s: 5, f: 3 }, { s: 5, f: 0 },
      ] },
  ];

  const [tabIdx, setTabIdx] = useSt(0);
  const [pos, setPos] = useSt(-1);
  const [playing, setPlaying] = useSt(false);
  const timerRef = useRf(null);
  const tab = TABS[tabIdx];

  // index 0 = top line (high e), index 5 = bottom line (low E)
  const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];
  const STRING_MIDI  = [64, 59, 55, 50, 45, 40];

  function midiName(m) {
    const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    return names[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  }
  function noteAt(s, f) { return midiName(STRING_MIDI[s] + f); }

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }
  function stop() { setPlaying(false); clearTimer(); }

  useEf(() => () => clearTimer(), []);
  useEf(() => { stop(); setPos(-1); }, [tabIdx]);

  function strike(i) {
    setPos(i);
    const n = tab.notes[i];
    Audio()?.resume();
    Audio()?.playPluck(noteAt(n.s, n.f), 0.7);
  }
  function play() {
    if (playing) { stop(); return; }
    Audio()?.resume();
    setPlaying(true);
    let i = (pos < 0 || pos >= tab.notes.length - 1) ? 0 : pos;
    strike(i);
    const ms = 60_000 / tab.bpm * 0.55;
    timerRef.current = setInterval(() => {
      i++;
      if (i >= tab.notes.length) { stop(); return; }
      strike(i);
    }, ms);
  }
  function step(dir) {
    stop();
    const next = Math.max(0, Math.min(tab.notes.length - 1, (pos < 0 ? -1 : pos) + dir));
    strike(next);
  }

  // fretboard geometry
  const FB_W = 600, FB_H = 210;
  const PAD_L = 56, PAD_R = 16, PAD_T = 22, PAD_B = 30;
  const NECK_W = FB_W - PAD_L - PAD_R;
  const NECK_H = FB_H - PAD_T - PAD_B;
  const fretX   = (f) => PAD_L + (f / frets) * NECK_W;
  const stringY = (s) => PAD_T + (s / 5) * NECK_H;
  const noteX   = (f) => f === 0 ? PAD_L - 22 : (fretX(f - 1) + fretX(f)) / 2;
  const dotFrets = [3, 5, 7, 9, 12].filter(f => f <= frets);
  const current = pos >= 0 ? tab.notes[pos] : null;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 16 }}>
      <div className="row between center wrap gap-3">
        <div>
          <div className="eyebrow">Tab reader · simulation</div>
          <strong style={{ fontSize: "1.05rem" }}>{tab.name}</strong>
          <span className="mono text-soft" style={{ marginLeft: 10, fontSize: ".8rem" }}>
            {tab.notes.length} notes · {tab.bpm} BPM
          </span>
        </div>
        <div className="row gap-2 wrap">
          {TABS.map((t, i) => (
            <button key={i} className="btn btn-ghost"
              onClick={() => setTabIdx(i)}
              style={{
                background: i === tabIdx ? "var(--terracotta)" : undefined,
                color: i === tabIdx ? "#fff" : undefined,
                borderColor: i === tabIdx ? "var(--terracotta-d)" : undefined,
                padding: "8px 14px", fontSize: ".8rem",
              }}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab "staff": clickable */}
      <div style={{
        background: "var(--bg)",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
        padding: "14px 16px",
        overflowX: "auto",
        fontFamily: "var(--font-mono)",
      }}>
        {STRING_NAMES.map((name, si) => (
          <div key={si} style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
            <span style={{
              width: 28, fontWeight: 800, color: "var(--ink-soft)",
              fontSize: 13, textAlign: "right", paddingRight: 6,
            }}>
              {name}|
            </span>
            {tab.notes.map((n, i) => {
              const isOn = n.s === si;
              const active = pos === i;
              // Only the string that owns this note position is interactive
              // (the "-" dashes on other strings are decorative)
              const isInteractive = isOn;
              return (
                <span key={i}
                  onClick={isInteractive ? () => { stop(); strike(i); } : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  role={isInteractive ? "button" : undefined}
                  aria-label={isInteractive ? `Note ${i + 1}: string ${name}, fret ${n.f}` : undefined}
                  onKeyDown={isInteractive ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (e.key === " ") e.preventDefault();
                      stop();
                      strike(i);
                    }
                  } : undefined}
                  style={{
                    display: "inline-block",
                    minWidth: 28,
                    textAlign: "center",
                    padding: "5px 2px",
                    margin: "1px",
                    borderRadius: 6,
                    cursor: isInteractive ? "pointer" : "default",
                    fontWeight: isOn ? 800 : 400,
                    fontSize: 14,
                    background: active && isOn ? "var(--terracotta)"
                              : active ? "rgba(39,98,224,.10)"
                              : "transparent",
                    color: active && isOn ? "#fff"
                         : isOn ? "var(--ink)"
                         : "var(--ink-soft)",
                    opacity: isOn ? 1 : 0.6,
                    transition: "background .12s, color .12s",
                  }}>
                  {isOn ? n.f : "-"}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Fretboard */}
      <div style={{ overflowX: "auto" }}>
        <svg width={FB_W} height={FB_H} viewBox={`0 0 ${FB_W} ${FB_H}`}
             preserveAspectRatio="xMidYMid meet"
             role="img" aria-label="Guitar fretboard"
             style={{ display: "block", maxWidth: "100%", height: "auto" }}>
          {/* neck */}
          <rect x={PAD_L} y={PAD_T - 4} width={NECK_W} height={NECK_H + 8}
                fill="var(--bg)" stroke="var(--border)" strokeWidth={1.5} rx={4} />
          {/* inlay dots */}
          {dotFrets.map(f => (
            <circle key={f}
              cx={(fretX(f - 1) + fretX(f)) / 2}
              cy={PAD_T + NECK_H / 2}
              r={f === 12 ? 9 : 6}
              fill="var(--ink-soft)" opacity={0.16} />
          ))}
          {/* frets */}
          {Array.from({ length: frets }, (_, i) => i + 1).map(f => (
            <line key={f}
              x1={fretX(f)} y1={PAD_T - 3}
              x2={fretX(f)} y2={PAD_T + NECK_H + 3}
              stroke="var(--ink-soft)" strokeWidth={1.4} opacity={0.55} />
          ))}
          {/* nut */}
          <line x1={PAD_L} y1={PAD_T - 6} x2={PAD_L} y2={PAD_T + NECK_H + 6}
            stroke="var(--ink)" strokeWidth={6} strokeLinecap="round" />
          {/* strings (top = high e, thinnest) */}
          {STRING_NAMES.map((name, s) => (
            <g key={s}>
              <text x={PAD_L - 14} y={stringY(s) + 4} textAnchor="end"
                fontSize={13} fontFamily="var(--font-mono)" fontWeight={800}
                fill="var(--ink-soft)">{name}</text>
              <line
                x1={PAD_L - 4} y1={stringY(s)}
                x2={FB_W - PAD_R} y2={stringY(s)}
                stroke="var(--ink)"
                strokeOpacity={0.85}
                strokeWidth={0.7 + (5 - s) * 0.5} />
            </g>
          ))}
          {/* fret numbers */}
          {Array.from({ length: frets + 1 }, (_, f) => (
            <text key={f}
              x={f === 0 ? PAD_L - 22 : (fretX(f - 1) + fretX(f)) / 2}
              y={FB_H - 8}
              textAnchor="middle"
              fontSize={11}
              fontFamily="var(--font-mono)"
              fontWeight={700}
              fill="var(--ink-soft)">
              {f}
            </text>
          ))}
          {/* peek-ahead ghost notes (next 2) */}
          {tab.notes.map((n, i) => {
            if (pos < 0 || i <= pos) return null;
            if (i > pos + 2) return null;
            const cx = noteX(n.f), cy = stringY(n.s);
            const op = 0.28 - (i - pos - 1) * 0.10;
            return (
              <g key={"g" + i}>
                <circle cx={cx} cy={cy} r={10}
                  fill="var(--ink)" opacity={op} />
                <text x={cx} y={cy + 3.5} textAnchor="middle"
                  fontSize={10} fontFamily="var(--font-mono)" fontWeight={700}
                  fill="var(--bg-2)" opacity={op + 0.5}>{n.f}</text>
              </g>
            );
          })}
          {/* active note */}
          {current && (
            <g>
              <circle cx={noteX(current.f)} cy={stringY(current.s)} r={20}
                fill="var(--terracotta)" opacity={0.20}>
                <animate attributeName="r" from="14" to="26"
                  dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.35" to="0"
                  dur="0.8s" repeatCount="indefinite" />
              </circle>
              <circle cx={noteX(current.f)} cy={stringY(current.s)} r={15}
                fill="var(--terracotta)"
                stroke="var(--cream-2)" strokeWidth={2.5} />
              <text x={noteX(current.f)} y={stringY(current.s) + 4.5}
                textAnchor="middle"
                fontSize={13} fontFamily="var(--font-mono)" fontWeight={800}
                fill="#fff">
                {current.f}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Controls */}
      <div className="row between center wrap gap-3">
        <div className="row gap-2 wrap">
          <button className="btn btn-ghost" onClick={() => step(-1)}
            disabled={pos <= 0}
            style={{ padding: "8px 14px" }}>← Prev</button>
          <button className="btn btn-primary" onClick={play} style={{ padding: "8px 18px" }}>
            {playing ? "⏸ Pause" : pos < 0 ? "▶ Play tab" : "▶ Resume"}
          </button>
          <button className="btn btn-ghost" onClick={() => step(1)}
            disabled={pos >= tab.notes.length - 1}
            style={{ padding: "8px 14px" }}>Next →</button>
          <button className="btn btn-ghost" onClick={() => { stop(); setPos(-1); }}
            style={{ padding: "8px 14px" }}>↺ Reset</button>
        </div>
        <div className="mono text-soft" style={{ fontSize: ".82rem", textAlign: "right" }}>
          {pos < 0
            ? "press play, step with the arrows, or tap any number"
            : (
              <>
                note {pos + 1}/{tab.notes.length} ·
                string <strong style={{ color: "var(--ink)" }}>{STRING_NAMES[current.s]}</strong> ·
                fret <strong style={{ color: "var(--ink)" }}>{current.f}</strong> ·
                sounds <strong style={{ color: "var(--terracotta)" }}>{noteAt(current.s, current.f)}</strong>
              </>
            )}
        </div>
      </div>

      <div style={{
        background: "var(--bg)",
        border: "1.5px dashed var(--border)",
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: ".88rem",
        lineHeight: 1.55,
        color: "var(--ink-soft)",
      }}>
        <strong style={{ color: "var(--ink)" }}>How to read tab:</strong>{" "}
        Six lines = six strings. The TOP line is the highest-pitched string
        (thin <span className="mono" style={{ color: "var(--ink)" }}>e</span>);
        the BOTTOM line is the lowest (thick{" "}
        <span className="mono" style={{ color: "var(--ink)" }}>E</span>).
        A number tells you which <em>fret</em> to press on that string:{" "}
        <span className="mono" style={{ color: "var(--ink)" }}>0</span> means
        play the string open. Read left to right, like text.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 17. ChordChart: annotated chord-diagram explainer                   */
/* ------------------------------------------------------------------ */
function ChordChart() {
  // frets: -1 = mute (X), 0 = open (O), n = press fret n
  // fingers: 0 = none, 1 = index, 2 = middle, 3 = ring, 4 = little
  const CHORDS = [
    { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0],
      color: "var(--teal)", notes: ["E2","B2","E3","G3","B3","E4"] },
    { name: "G",  frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4],
      color: "var(--terracotta)", notes: ["G2","B2","D3","G3","B3","G4"] },
    { name: "C",  frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0],
      color: "var(--butter-d)", notes: ["C3","E3","G3","C4","E4"] },
    { name: "D",  frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2],
      color: "var(--espresso)", notes: ["D3","A3","D4","F#4"] },
    { name: "A",  frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0],
      color: "#7c4a7e", notes: ["A2","E3","A3","C#4","E4"] },
  ];
  const STRING_LABELS = ["E", "A", "D", "G", "B", "e"]; // low → high (left → right)

  const [picked, setPicked] = useSt(2); // start on C (has X, O, dots)
  const [annot, setAnnot] = useSt(true);
  const [active, setActive] = useSt(null);
  const chord = CHORDS[picked];

  function play(c) {
    Audio()?.resume();
    setActive(c.name);
    Audio()?.playChord(c.notes, 1.6, 0.7);
    setTimeout(() => setActive(null), 1700);
  }

  /* --- shared chord diagram renderer --- */
  function ChordSVG({ chord, big = false, label = true, callouts = false, accent }) {
    const W = 220, H = 280;
    const NUM_FRETS = 4;
    const PAD_L = 38, PAD_R = 38, PAD_T = 60, PAD_B = 36;
    const NECK_W = W - PAD_L - PAD_R;
    const NECK_H = H - PAD_T - PAD_B;
    const xString = (s) => PAD_L + (s / 5) * NECK_W;
    const yFret   = (f) => PAD_T + (f / NUM_FRETS) * NECK_H;
    const yDot    = (f) => (yFret(f - 1) + yFret(f)) / 2;
    const dotFill = accent || chord.color || "var(--terracotta)";

    // when callouts are shown, widen the viewBox to leave space for labels
    const VB = callouts
      ? `-110 0 ${W + 220} ${H}`
      : `0 0 ${W} ${H}`;

    return (
      <svg viewBox={VB}
           width="100%"
           preserveAspectRatio="xMidYMid meet"
           style={{ maxWidth: callouts ? 520 : (big ? 380 : 200), display: "block", margin: "0 auto" }}>
        {label && (
          <text x={W / 2} y={28} textAnchor="middle"
            fontSize={big ? 26 : 22} fontWeight={800}
            fontFamily="var(--font-display)" fill="var(--ink)">
            {chord.name}
          </text>
        )}

        {/* X / O markers above nut */}
        {chord.frets.map((f, si) => (
          <text key={"m" + si}
            x={xString(si)} y={PAD_T - 14}
            textAnchor="middle"
            fontSize={16} fontWeight={800}
            fontFamily="var(--font-mono)"
            fill={f === -1 ? "var(--ink-soft)" : "var(--ink)"}>
            {f === -1 ? "✕" : f === 0 ? "○" : ""}
          </text>
        ))}

        {/* nut */}
        <rect x={PAD_L - 2} y={PAD_T - 4}
          width={NECK_W + 4} height={6}
          fill="var(--ink)" rx={1.5} />

        {/* frets */}
        {Array.from({ length: NUM_FRETS }, (_, i) => i + 1).map(f => (
          <line key={"f" + f}
            x1={PAD_L - 2} y1={yFret(f)}
            x2={PAD_L + NECK_W + 2} y2={yFret(f)}
            stroke="var(--ink-soft)" strokeWidth={1.4} opacity={0.65} />
        ))}

        {/* strings */}
        {[0,1,2,3,4,5].map(s => (
          <line key={"s" + s}
            x1={xString(s)} y1={PAD_T - 4}
            x2={xString(s)} y2={PAD_T + NECK_H + 2}
            stroke="var(--ink)" strokeOpacity={0.85}
            strokeWidth={0.7 + (5 - s) * 0.4} />
        ))}

        {/* finger dots */}
        {chord.frets.map((f, si) => {
          if (f <= 0) return null;
          const fingerNum = chord.fingers[si];
          return (
            <g key={"d" + si}>
              <circle cx={xString(si)} cy={yDot(f)} r={big ? 14 : 12}
                fill={dotFill}
                stroke="var(--cream-2)" strokeWidth={2} />
              {fingerNum > 0 && (
                <text x={xString(si)} y={yDot(f) + (big ? 5 : 4.5)}
                  textAnchor="middle"
                  fontSize={big ? 13 : 12} fontWeight={800}
                  fontFamily="var(--font-mono)" fill="#fff">
                  {fingerNum}
                </text>
              )}
            </g>
          );
        })}

        {/* string letters below */}
        {STRING_LABELS.map((nm, si) => (
          <text key={"l" + si}
            x={xString(si)} y={PAD_T + NECK_H + 22}
            textAnchor="middle"
            fontSize={11} fontFamily="var(--font-mono)" fontWeight={700}
            fill="var(--ink-soft)">
            {nm}
          </text>
        ))}

        {/* annotation callouts (only on the big chart) */}
        {callouts && (() => {
          // first muted string (X)
          const muteIdx = chord.frets.findIndex(v => v === -1);
          // first open string (O)
          const openIdx = chord.frets.findIndex(v => v === 0);
          // first stopped dot
          const dotIdx  = chord.frets.findIndex(v => v > 0);
          const cAcc  = "var(--terracotta)";
          const cAcc2 = "var(--teal)";
          const cAcc3 = "var(--butter-d)";

          // label sits OUTSIDE the diagram in the wider viewBox margin
          const leftLX  = -16;
          const rightLX = W + 16;

          const lines = [];
          // NUT, left
          lines.push({ key: "nut",
            x1: leftLX + 2, y1: PAD_T - 4,
            x2: PAD_L - 2,  y2: PAD_T - 1,
            color: cAcc,
            lx: leftLX, ly: PAD_T - 10,
            label: "NUT", anchor: "end" });
          // FRET, left, between fret 1 and 2
          lines.push({ key: "fret",
            x1: leftLX + 2, y1: yFret(1) + 8,
            x2: PAD_L - 2,  y2: yFret(1) + 8,
            color: cAcc,
            lx: leftLX, ly: yFret(1) + 4,
            label: "FRET", anchor: "end" });

          if (muteIdx >= 0) {
            lines.push({ key: "mute",
              x1: rightLX - 2, y1: PAD_T - 22,
              x2: xString(muteIdx) + 4, y2: PAD_T - 18,
              color: cAcc2,
              lx: rightLX, ly: PAD_T - 26,
              label: "MUTE (✕)", anchor: "start" });
          }
          if (openIdx >= 0) {
            lines.push({ key: "open",
              x1: rightLX - 2, y1: PAD_T - 6,
              x2: xString(openIdx) + 4, y2: PAD_T - 12,
              color: cAcc2,
              lx: rightLX, ly: PAD_T - 10,
              label: "OPEN (○)", anchor: "start" });
          }
          if (dotIdx >= 0) {
            const df = chord.frets[dotIdx];
            const dy = yDot(df);
            lines.push({ key: "dot",
              x1: rightLX - 2, y1: dy - 10,
              x2: xString(dotIdx) + 12, y2: dy - 4,
              color: cAcc3,
              lx: rightLX, ly: dy - 14,
              label: "FINGER DOT", anchor: "start" });
            lines.push({ key: "num",
              x1: rightLX - 2, y1: dy + 18,
              x2: xString(dotIdx) + 12, y2: dy + 4,
              color: cAcc3,
              lx: rightLX, ly: dy + 22,
              label: "FINGER #", anchor: "start" });
          }

          return lines.map(L => (
            <g key={L.key}>
              <line x1={L.x1} y1={L.y1} x2={L.x2} y2={L.y2}
                stroke={L.color} strokeWidth={1.3}
                strokeDasharray="3 3" />
              <text x={L.lx} y={L.ly}
                textAnchor={L.anchor}
                fontSize={11} fontWeight={800}
                fontFamily="var(--font-mono)"
                fill={L.color}>
                {L.label}
              </text>
            </g>
          ));
        })()}
      </svg>
    );
  }

  /* --- finger-number legend (stylized left hand) --- */
  function FingerKey() {
    const FINGERS = [
      { n: 1, name: "Index",  color: "var(--terracotta)" },
      { n: 2, name: "Middle", color: "var(--teal)" },
      { n: 3, name: "Ring",   color: "var(--butter-d)" },
      { n: 4, name: "Little", color: "var(--espresso)" },
    ];
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
        gap: 10,
      }}>
        {FINGERS.map(f => (
          <div key={f.n} style={{
            display: "grid",
            gap: 6,
            padding: "12px 10px",
            background: "var(--bg)",
            border: "1.5px solid var(--border)",
            borderRadius: 14,
            textAlign: "center",
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: f.color, color: "#fff",
              fontFamily: "var(--font-mono)", fontWeight: 800,
              fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto",
              boxShadow: "0 3px 0 0 var(--border)",
            }}>{f.n}</div>
            <div className="mono" style={{
              fontSize: ".82rem", fontWeight: 700, color: "var(--ink)",
            }}>{f.name}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 20 }}>
      <div className="row between center wrap gap-3">
        <div>
          <div className="eyebrow">Chord chart · anatomy</div>
          <strong style={{ fontSize: "1.05rem" }}>The five open chords</strong>
        </div>
        <div className="row gap-2 wrap">
          <button className="btn btn-ghost"
            onClick={() => setAnnot(a => !a)}
            style={{ padding: "8px 14px", fontSize: ".8rem" }}>
            {annot ? "Hide labels" : "Show labels"}
          </button>
          <button className="btn btn-primary"
            onClick={() => play(chord)}
            style={{ padding: "8px 18px" }}>
            ▶ Hear {chord.name}
          </button>
        </div>
      </div>

      {/* Big annotated diagram */}
      <div style={{
        background: "var(--bg)",
        border: "1.5px solid var(--border)",
        borderRadius: 18,
        padding: "20px 14px 8px",
      }}>
        <ChordSVG chord={chord} big={true} callouts={annot} accent={chord.color} />
        <p className="text-soft" style={{
          fontSize: ".82rem", textAlign: "center",
          margin: "4px 0 0", fontFamily: "var(--font-mono)",
        }}>
          strings: low E ▸ A ▸ D ▸ G ▸ B ▸ high e
        </p>
      </div>

      {/* Finger key */}
      <div>
        <div className="eyebrow mb-2">Finger numbers · left hand</div>
        <FingerKey />
      </div>

      {/* Chord picker: small diagrams + play */}
      <div>
        <div className="eyebrow mb-2">Try the others</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}>
          {CHORDS.map((c, i) => (
            <div key={c.name}
              onClick={() => setPicked(i)}
              tabIndex={0}
              role="button"
              aria-label={`Select ${c.name} chord`}
              aria-pressed={i === picked}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (e.key === " ") e.preventDefault();
                  setPicked(i);
                }
              }}
              style={{
                padding: "12px 10px 14px",
                background: i === picked ? "var(--bg)" : "transparent",
                border: i === picked
                  ? `2px solid ${c.color}`
                  : "1.5px solid var(--border)",
                borderRadius: 16,
                cursor: "pointer",
                display: "grid",
                gap: 8,
                transition: "border-color .15s, background .15s",
              }}>
              <ChordSVG chord={c} accent={c.color} label={false} />
              <div className="row between center" style={{ marginTop: 4 }}>
                <strong style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.05rem", color: c.color,
                }}>
                  {c.name}
                </strong>
                <button
                  onClick={(e) => { e.stopPropagation(); play(c); }}
                  className="btn btn-ghost"
                  style={{
                    padding: "4px 10px", fontSize: ".75rem",
                    background: active === c.name ? c.color : undefined,
                    color: active === c.name ? "#fff" : undefined,
                    borderColor: active === c.name ? c.color : undefined,
                  }}>
                  ▶ Play
                </button>
              </div>
              <div className="mono text-soft" style={{ fontSize: ".7rem", textAlign: "center" }}>
                {c.frets.map(f => f === -1 ? "✕" : f).join("·")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */
Object.assign(window, {
  SectionTapPulse: TapPulse,
  SectionStepGrid: MiniStepGrid,
  SectionMiniStaff: MiniStaff,
  SectionNoteValues: NoteValueLab,
  SectionMiniKeys: MiniKeys,
  SectionChordPicker: ChordPicker,
  SectionTextureToggles: TextureToggles,
  SectionMajorMinor: MajorMinorAB,
  SectionOrchestraFamilies: OrchestraFamilies,
  SectionMCQ: MCQ,
  SectionBreath: BreathTimer,
  SectionDynamics: DynamicsDemo,
  SectionFormBuilder: FormBuilder,
  SectionGraphicScore: GraphicScoreCanvas,
  SectionScaleLadder: ScaleLadder,
  SectionTabReader: TabReader,
  SectionChordChart: ChordChart,
});
