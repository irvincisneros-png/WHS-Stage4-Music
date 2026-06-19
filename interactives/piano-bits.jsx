/* Piano-specific mini-interactives for Year 8 (Keys & two staves).
   Builds on Year 7 keyboard work by adding both-hands depth:
     · TwoHandKeys: 2-octave keyboard with LH & RH home zones marked, plus a hands-together C major scale
     · GrandStaffNotes: clickable grand staff (treble + bass joined by middle C)
     · TwoHandScale: parallel-octave C major run, hands together with adjustable speed
*/

const { useEffect: usePEf, useRef: usePRf, useState: usePSt } = React;
const PA = () => window.MusicAudio;

/* ------------------------------------------------------------------ */
/* TwoHandKeys: keyboard with both hand home zones                    */
/* ------------------------------------------------------------------ */
function TwoHandKeys({ startMidi = 48, octaves = 2, bpm = 90 }) {
  // Default: C3 to C5 = 2 octaves
  // LH home: C3..G3 (MIDI 48..55)
  // RH home: C4..G4 (MIDI 60..67)
  const LH = [48, 55];
  const RH = [60, 67];
  const C_MAJOR_RH = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
  const C_MAJOR_LH = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];

  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const whiteIdx = [0, 2, 4, 5, 7, 9, 11];
  const blackIdx = [1, 3, 6, 8, 10];
  const total = octaves * 12 + 1; // include final C

  function nameForMidi(m) {
    const o = Math.floor(m / 12) - 1;
    return noteNames[m % 12] + o;
  }
  function inZone(m, [lo, hi]) {
    return m >= lo && m <= hi;
  }

  const whiteKeys = [];
  for (let i = 0; i < total; i++) {
    if (whiteIdx.includes(i % 12)) whiteKeys.push(startMidi + i);
  }
  const blackKeys = [];
  for (let i = 0; i < total; i++) {
    if (blackIdx.includes(i % 12)) blackKeys.push(startMidi + i);
  }

  const W = 540, H = 160;
  const kw = W / whiteKeys.length;
  function blackXFor(midi) {
    const below = whiteKeys.findIndex((w) => w > midi) - 1;
    return (below + 1) * kw - kw * 0.32;
  }

  const [activeRh, setActiveRh] = usePSt(-1);
  const [activeLh, setActiveLh] = usePSt(-1);
  const [playing, setPlaying] = usePSt(false);
  const timersRef = usePRf([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  usePEf(() => clearTimers, []);

  function press(midi) {
    PA()?.resume();
    PA()?.playPiano(nameForMidi(midi), 0.6, inZone(midi, LH) ? 0.55 : 0.7);
  }

  function playScale() {
    if (playing) return;
    PA()?.resume();
    clearTimers();
    setPlaying(true);
    const ms = 60_000 / bpm / 2; // 8ths
    C_MAJOR_RH.forEach((n, i) => {
      timersRef.current.push(setTimeout(() => {
        setActiveRh(i);
        PA()?.playPiano(n, 0.45, 0.75);
      }, i * ms));
    });
    C_MAJOR_LH.forEach((n, i) => {
      timersRef.current.push(setTimeout(() => {
        setActiveLh(i);
        PA()?.playPiano(n, 0.5, 0.55);
      }, i * ms));
    });
    timersRef.current.push(setTimeout(() => {
      setPlaying(false);
      setActiveRh(-1);
      setActiveLh(-1);
    }, C_MAJOR_RH.length * ms + 200));
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Both hands · home position</div>
          <strong>LH thumb on C3 · RH thumb on Middle C (C4)</strong>
        </div>
        <button
          className="btn btn-primary"
          onClick={playScale}
          disabled={playing}
          style={{ padding: "8px 18px" }}
        >
          {playing ? "♪ Both hands…" : "▶ Hands together · C major"}
        </button>
      </div>

      {/* legend */}
      <div className="row gap-3 wrap" style={{ fontSize: ".82rem" }}>
        <span className="row gap-2 center">
          <span style={{ width: 14, height: 14, borderRadius: 3, background: "var(--teal)" }} />
          <span className="mono">LH zone · C3 – G3</span>
        </span>
        <span className="row gap-2 center">
          <span style={{ width: 14, height: 14, borderRadius: 3, background: "var(--terracotta)" }} />
          <span className="mono">RH zone · C4 – G4</span>
        </span>
        <span className="row gap-2 center">
          <span style={{ width: 14, height: 14, borderRadius: 3, background: "var(--ink)" }} />
          <span className="mono">Middle C: the bridge</span>
        </span>
      </div>

      <div
        style={{
          position: "relative",
          height: H,
          background: "var(--bg)",
          borderRadius: 12,
          border: "1.5px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          {whiteKeys.map((m, i) => {
            const inLh = inZone(m, LH);
            const inRh = inZone(m, RH);
            const isMiddleC = m === 60;
            const isC = m % 12 === 0;
            const scaleIdxRh = C_MAJOR_RH.indexOf(nameForMidi(m));
            const scaleIdxLh = C_MAJOR_LH.indexOf(nameForMidi(m));
            const activeRhKey = scaleIdxRh >= 0 && scaleIdxRh === activeRh;
            const activeLhKey = scaleIdxLh >= 0 && scaleIdxLh === activeLh;

            const baseFill = activeRhKey
              ? "var(--terracotta)"
              : activeLhKey
                ? "var(--teal)"
                : isMiddleC
                  ? "color-mix(in oklab, var(--ink) 18%, white)"
                  : inLh
                    ? "color-mix(in oklab, var(--teal) 22%, white)"
                    : inRh
                      ? "color-mix(in oklab, var(--terracotta) 22%, white)"
                      : "#fff";

            const keyLabel = nameForMidi(m);
            const zoneDesc = isMiddleC ? "Middle C" : inLh ? "left hand zone" : inRh ? "right hand zone" : "";
            const fullLabel = zoneDesc ? `Play ${keyLabel} - ${zoneDesc}` : `Play ${keyLabel}`;

            return (
              <g key={"w" + m}
                onClick={() => press(m)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={fullLabel}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    press(m);
                  }
                }}>
                <rect
                  x={i * kw}
                  y={0}
                  width={kw - 1}
                  height={H}
                  fill={baseFill}
                  stroke="var(--ink-soft)"
                  strokeWidth="1"
                />
                {/* zone strip at top */}
                {inLh && (
                  <rect
                    x={i * kw}
                    y={0}
                    width={kw - 1}
                    height={6}
                    fill="var(--teal)"
                  />
                )}
                {inRh && (
                  <rect
                    x={i * kw}
                    y={0}
                    width={kw - 1}
                    height={6}
                    fill="var(--terracotta)"
                  />
                )}
                {isMiddleC && (
                  <text
                    x={i * kw + kw / 2}
                    y={H - 26}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                    fill="var(--ink)"
                  >
                    MID C
                  </text>
                )}
                {isC && (
                  <text
                    x={i * kw + kw / 2}
                    y={H - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fill={(activeRhKey || activeLhKey) ? "#fff" : "var(--ink-soft)"}
                    fontWeight="700"
                  >
                    {nameForMidi(m)}
                  </text>
                )}
              </g>
            );
          })}
          {blackKeys.map((m) => {
            const x = blackXFor(m);
            const blackKeyLabel = nameForMidi(m);
            return (
              <g key={"b" + m}
                onClick={() => press(m)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Play ${blackKeyLabel}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    press(m);
                  }
                }}>
                <rect
                  x={x}
                  y={0}
                  width={kw * 0.64}
                  height={H * 0.62}
                  fill="var(--ink)"
                  stroke="#000"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-soft" style={{ fontSize: ".82rem", margin: 0 }}>
        Tap any key to hear it. The teal band marks the left-hand home (C3 – G3), terracotta marks the right-hand home (C4 – G4). They meet at Middle C, the same physical key both hands count from.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GrandStaffNotes: clickable grand staff                              */
/* ------------------------------------------------------------------ */
function GrandStaffNotes() {
  // Treble notes E4..F5 (lines+spaces) and bass notes G2..A3, plus middle C bridging.
  const treble = [
    { pos: 9,  name: "E4", role: "RH · bottom line" },
    { pos: 8,  name: "F4" },
    { pos: 7,  name: "G4" },
    { pos: 6,  name: "A4" },
    { pos: 5,  name: "B4", role: "RH · middle" },
    { pos: 4,  name: "C5" },
    { pos: 3,  name: "D5" },
    { pos: 2,  name: "E5" },
    { pos: 1,  name: "F5", role: "RH · top line" },
  ];
  const bass = [
    { pos: 9,  name: "G2", role: "LH · bottom line" },
    { pos: 8,  name: "A2" },
    { pos: 7,  name: "B2" },
    { pos: 6,  name: "C3" },
    { pos: 5,  name: "D3", role: "LH · middle" },
    { pos: 4,  name: "E3" },
    { pos: 3,  name: "F3" },
    { pos: 2,  name: "G3" },
    { pos: 1,  name: "A3", role: "LH · top line" },
  ];

  const [picked, setPicked] = usePSt(null);

  function tap(note, role) {
    PA()?.resume();
    PA()?.playPiano(note, 1.0);
    setPicked({ name: note, role: role || "" });
  }

  const W = 560, H = 320;
  const lineGap = 14;
  const trebleTop = 40;
  const bassTop = trebleTop + 8 * lineGap + 28; // gap between staves
  const yTreble = (p) => trebleTop + p * (lineGap / 2);
  const yBass = (p) => bassTop + p * (lineGap / 2);
  // middle C bridge position is between staves
  const yMiddleC = (yTreble(11) + yBass(-1)) / 2;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">The grand staff</div>
          <strong>Two staves, two hands · click any note to hear it</strong>
        </div>
        <span className="mono text-soft" style={{ fontSize: ".82rem" }}>
          {picked ? `${picked.name}${picked.role ? " · " + picked.role : ""}` : "tap a notehead"}
        </span>
      </div>

      <div
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {/* TREBLE staff lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={"t" + i}
              x1={20}
              y1={yTreble(i * 2 + 1)}
              x2={W - 20}
              y2={yTreble(i * 2 + 1)}
              stroke="var(--ink-soft)"
              strokeWidth="1.5"
            />
          ))}
          {/* BASS staff lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={"b" + i}
              x1={20}
              y1={yBass(i * 2 + 1)}
              x2={W - 20}
              y2={yBass(i * 2 + 1)}
              stroke="var(--ink-soft)"
              strokeWidth="1.5"
            />
          ))}
          {/* brace connecting the staves on the left */}
          <line
            x1={20}
            y1={yTreble(1)}
            x2={20}
            y2={yBass(9)}
            stroke="var(--ink)"
            strokeWidth="2.5"
          />
          {/* treble clef */}
          <text
            x="34"
            y={yTreble(7) + 8}
            fontSize="74"
            fontFamily="serif"
            fill="var(--ink)"
          >
            𝄞
          </text>
          {/* bass clef */}
          <text
            x="34"
            y={yBass(3) + 8}
            fontSize="58"
            fontFamily="serif"
            fill="var(--ink)"
          >
            𝄢
          </text>

          {/* treble notes */}
          {treble.map((n, i) => {
            const x = 110 + i * 38;
            const y = yTreble(n.pos);
            const isPicked = picked?.name === n.name;
            return (
              <g
                key={n.name}
                onClick={() => tap(n.name, n.role)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={n.role ? `${n.name} - ${n.role}` : `Play ${n.name}, treble staff`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    tap(n.name, n.role);
                  }
                }}
              >
                <ellipse
                  cx={x}
                  cy={y}
                  rx={9}
                  ry={7}
                  fill={isPicked ? "var(--terracotta)" : "var(--ink)"}
                  transform={`rotate(-20 ${x} ${y})`}
                />
                <text
                  x={x}
                  y={y - 14}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                  fill={isPicked ? "var(--terracotta)" : "var(--ink-soft)"}
                >
                  {n.name.replace(/\d/, "")}
                </text>
              </g>
            );
          })}

          {/* bass notes */}
          {bass.map((n, i) => {
            const x = 110 + i * 38;
            const y = yBass(n.pos);
            const isPicked = picked?.name === n.name;
            return (
              <g
                key={n.name}
                onClick={() => tap(n.name, n.role)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={n.role ? `${n.name} - ${n.role}` : `Play ${n.name}, bass staff`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    tap(n.name, n.role);
                  }
                }}
              >
                <ellipse
                  cx={x}
                  cy={y}
                  rx={9}
                  ry={7}
                  fill={isPicked ? "var(--teal)" : "var(--ink)"}
                  transform={`rotate(-20 ${x} ${y})`}
                />
                <text
                  x={x}
                  y={y + 22}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                  fill={isPicked ? "var(--teal)" : "var(--ink-soft)"}
                >
                  {n.name.replace(/\d/, "")}
                </text>
              </g>
            );
          })}

          {/* MIDDLE C bridge between the staves */}
          <g
            onClick={() => tap("C4", "Middle C · bridges both staves")}
            style={{ cursor: "pointer" }}
            tabIndex={0}
            role="button"
            aria-label="Play C4 - Middle C, bridges both staves"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (e.key === " ") e.preventDefault();
                tap("C4", "Middle C · bridges both staves");
              }
            }}
          >
            <line
              x1={W * 0.62 - 12}
              y1={yMiddleC}
              x2={W * 0.62 + 12}
              y2={yMiddleC}
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            <ellipse
              cx={W * 0.62}
              cy={yMiddleC}
              rx={10}
              ry={7.5}
              fill={picked?.name === "C4" ? "var(--butter-d)" : "var(--ink)"}
              transform={`rotate(-20 ${W * 0.62} ${yMiddleC})`}
            />
            <text
              x={W * 0.62}
              y={yMiddleC + 26}
              fontSize="11"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontWeight="800"
              fill="var(--butter-d)"
            >
              MIDDLE C
            </text>
          </g>
        </svg>
      </div>

      <p className="text-soft" style={{ fontSize: ".82rem", margin: 0 }}>
        Treble (G clef) is for the right hand. Bass (F clef) is for the left. Middle C floats on a ledger line <em>between</em> them, the same key on the piano, written either way depending on which hand plays it.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TwoHandScale: ascend + descend together, with tempo slider          */
/* ------------------------------------------------------------------ */
function TwoHandScale() {
  const RH = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];
  const LH = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3"];
  const [tempo, setTempo] = usePSt(80);
  const [pos, setPos] = usePSt(-1);
  const [playing, setPlaying] = usePSt(false);
  const timersRef = usePRf([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  usePEf(() => clearTimers, []);

  function play() {
    if (playing) return;
    PA()?.resume();
    clearTimers();
    setPlaying(true);
    const ms = 60_000 / tempo;
    for (let i = 0; i < RH.length; i++) {
      timersRef.current.push(setTimeout(() => {
        setPos(i);
        PA()?.playPiano(RH[i], 0.6, 0.7);
        PA()?.playPiano(LH[i], 0.6, 0.55);
      }, i * ms));
    }
    timersRef.current.push(setTimeout(() => {
      setPlaying(false);
      setPos(-1);
    }, RH.length * ms + 200));
  }

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">Hands together · C major scale</div>
          <strong>One octave up, one octave down, in parallel</strong>
        </div>
        <button
          className="btn btn-primary"
          onClick={play}
          disabled={playing}
          style={{ padding: "8px 18px" }}
        >
          {playing ? "♪ Playing…" : "▶ Play"}
        </button>
      </div>

      <div className="row gap-3 center wrap">
        <span className="mono text-soft" style={{ fontSize: ".78rem", minWidth: 84 }}>
          Tempo · {tempo} BPM
        </span>
        <input
          type="range"
          min="50"
          max="140"
          step="2"
          value={tempo}
          onChange={(e) => setTempo(+e.target.value)}
          disabled={playing}
          style={{ flex: 1, minWidth: 160, maxWidth: 360 }}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {/* RH row */}
        <div className="row gap-1 wrap">
          <span
            className="mono"
            style={{
              minWidth: 36,
              fontSize: ".72rem",
              fontWeight: 800,
              color: "var(--terracotta)",
              alignSelf: "center",
            }}
          >
            RH
          </span>
          {RH.map((n, i) => (
            <span
              key={"r" + i}
              style={{
                padding: "5px 8px",
                fontFamily: "var(--font-mono)",
                fontSize: ".74rem",
                borderRadius: 6,
                background: pos === i ? "var(--terracotta)" : "var(--bg)",
                color: pos === i ? "#fff" : "var(--ink)",
                border: "1px solid var(--border)",
                minWidth: 30,
                textAlign: "center",
                transition: "background .1s, color .1s",
              }}
            >
              {n.replace(/\d/, "")}
            </span>
          ))}
        </div>
        {/* LH row */}
        <div className="row gap-1 wrap">
          <span
            className="mono"
            style={{
              minWidth: 36,
              fontSize: ".72rem",
              fontWeight: 800,
              color: "var(--teal)",
              alignSelf: "center",
            }}
          >
            LH
          </span>
          {LH.map((n, i) => (
            <span
              key={"l" + i}
              style={{
                padding: "5px 8px",
                fontFamily: "var(--font-mono)",
                fontSize: ".74rem",
                borderRadius: 6,
                background: pos === i ? "var(--teal)" : "var(--bg)",
                color: pos === i ? "#fff" : "var(--ink)",
                border: "1px solid var(--border)",
                minWidth: 30,
                textAlign: "center",
                transition: "background .1s, color .1s",
              }}
            >
              {n.replace(/\d/, "")}
            </span>
          ))}
        </div>
      </div>

      <p className="text-soft" style={{ fontSize: ".82rem", margin: 0 }}>
        Both hands play the same letter-names, one octave apart. Right-hand fingering: 1-2-3-1-2-3-4-5 ascending, mirror coming back. Left-hand fingering: 5-4-3-2-1-3-2-1 ascending.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */
Object.assign(window, {
  SectionTwoHandKeys: TwoHandKeys,
  SectionGrandStaff: GrandStaffNotes,
  SectionTwoHandScale: TwoHandScale,
});
