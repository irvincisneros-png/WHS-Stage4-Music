/* ConceptVisuals: small, on-topic SVG illustrations used on section hero
   cards. Each visual takes a viewport of roughly 320×180 and uses
   currentColor + a few accent rgba-white tones so it inherits the parent
   topic's theme colour from .tile-art.

   Register on window so the data file can reference them by string. */

/* ============================================================
   Helpers
   ============================================================ */
/* Ink palette: uses currentColor so the visual inherits the tile-art's
   foreground (white on dark themes, dark on light "butter"/"pink" themes).
   color-mix gives us layered opacity without hardcoding any base colour. */
const cv_ink = "currentColor";
const cv_dim = "color-mix(in srgb, currentColor, transparent 58%)";
const cv_paper = "currentColor";
const cv_paperDim = "color-mix(in srgb, currentColor, transparent 28%)";
const cv_accent = "color-mix(in srgb, currentColor, transparent 84%)";
const cv_chip = "color-mix(in srgb, currentColor, transparent 82%)";
const cv_chipBorder = "color-mix(in srgb, currentColor, transparent 70%)";

function CVFrame({ children, viewBox = "0 0 320 180" }) {
  return (
    <svg viewBox={viewBox} width="100%" height="100%"
         preserveAspectRatio="xMidYMid meet"
         style={{ display: "block", color: "inherit" }}>
      {children}
    </svg>
  );
}

/* ============================================================
   STAFF · clef, optional notes, optional time-sig.
   Supports treble / bass / grand. ============================ */
function cvStaff(props = {}) {
  const { clef = "treble", notes = [], timeSig, label, markers = [] } = props;

  // Use Unicode music glyphs: way more reliable than hand-drawn paths.
  // U+1D11E = 𝄞 treble, U+1D122 = 𝄢 bass. Rendered in a serif/music font.
  function ClefGlyph({ x, y, char, size = 64 }) {
    return (
      <text x={x} y={y}
        fontFamily="'Bravura Text', 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', Georgia, serif"
        fontSize={size} fill={cv_paper}
        textAnchor="middle" dominantBaseline="alphabetic">{char}</text>
    );
  }

  const TREBLE_Y = { "E4": 80, "F4": 75, "G4": 70, "A4": 65, "B4": 60, "C5": 55, "D5": 50, "E5": 45, "F5": 40, "G5": 35, "A5": 30, "C4": 90, "D4": 85, "B3": 95 };
  const BASS_Y   = { "G2": 80, "A2": 75, "B2": 70, "C3": 65, "D3": 60, "E3": 55, "F3": 50, "G3": 45, "A3": 40, "B3": 35, "C4": 30, "F2": 85, "E2": 90 };

  function StaffLines({ y = 35 }) {
    return (
      <g stroke={cv_paper} strokeWidth="1.4" opacity=".95">
        {[0, 10, 20, 30, 40].map(d => <line key={d} x1="20" x2="305" y1={y + d} y2={y + d} />)}
      </g>
    );
  }

  function Notehead({ x, y, filled = true, stem = "up", color }) {
    const fill = color || cv_paper;
    return (
      <g>
        <ellipse cx={x} cy={y} rx="6.2" ry="4.6" transform={`rotate(-20 ${x} ${y})`}
                 fill={filled ? fill : "none"} stroke={fill} strokeWidth="1.8" />
        {stem === "up"
          ? <line x1={x + 5.8} y1={y - 2} x2={x + 5.8} y2={y - 32} stroke={fill} strokeWidth="1.6" />
          : <line x1={x - 5.8} y1={y + 2} x2={x - 5.8} y2={y + 32} stroke={fill} strokeWidth="1.6" />}
      </g>
    );
  }

  if (clef === "grand") {
    return (
      <CVFrame>
        <g>
          {/* brace */}
          <path d={`M 18 28 Q 8 80 18 130 Q 26 80 18 28 Z`} fill={cv_paper} opacity=".9" />
          <StaffLines y={28} />
          <ClefGlyph x={42} y={66} char="𝄞" size={58} />
          <StaffLines y={102} />
          <ClefGlyph x={42} y={124} char="𝄢" size={36} />
          {/* Middle C ledger between staves */}
          <line x1="110" y1="80" x2="150" y2="80" stroke={cv_paper} strokeWidth="1.4" opacity=".85" />
          <Notehead x={130} y={80} filled={true} stem="up" />
          <text x={170} y={84} fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace" fontSize="10" letterSpacing="1.5">MIDDLE C</text>
        </g>
      </CVFrame>
    );
  }

  const yMap = clef === "bass" ? BASS_Y : TREBLE_Y;
  const baseY = 35;
  const clefChar = clef === "bass" ? "𝄢" : "𝄞";
  const clefSize = clef === "bass" ? 40 : 58;
  const clefY = clef === "bass" ? baseY + 22 : baseY + 30;
  const noteXStart = timeSig ? 100 : 78;

  return (
    <CVFrame>
      <StaffLines y={baseY} />
      <ClefGlyph x={42} y={clefY} char={clefChar} size={clefSize} />
      {timeSig && (
        <g fill={cv_paper} fontFamily="Georgia, serif" fontWeight="800" fontSize="18" textAnchor="middle">
          <text x="76" y={baseY + 16}>{timeSig.split("/")[0]}</text>
          <text x="76" y={baseY + 34}>{timeSig.split("/")[1]}</text>
        </g>
      )}
      {notes.map((nt, i) => {
        const y = yMap[nt.n] ?? (baseY + 25);
        const x = noteXStart + i * 30;
        return (
          <g key={i}>
            <Notehead x={x} y={y} stem={y > baseY + 18 ? "up" : "down"} />
            {nt.label && (
              <text x={x} y={baseY + 60} fill={cv_paper} fontFamily="ui-monospace, Menlo, monospace"
                    fontSize="10" textAnchor="middle" letterSpacing="1">{nt.label}</text>
            )}
            {nt.n === "C4" && clef === "treble" && (
              <line x1={x - 9} y1={y} x2={x + 9} y2={y} stroke={cv_paper} strokeWidth="1.4" />
            )}
          </g>
        );
      })}
      {/* arbitrary callout markers (above the staff) */}
      {markers.map((mk, i) => {
        const x = noteXStart + mk.at * 30;
        return (
          <g key={"mk" + i}>
            {/* arrow down to staff */}
            <path d={`M ${x} ${baseY - 18} L ${x} ${baseY - 4} M ${x - 4} ${baseY - 8} L ${x} ${baseY - 4} L ${x + 4} ${baseY - 8}`}
                  stroke={cv_paper} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x={x} y={baseY - 24} fill={cv_paper}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="9" fontWeight="700"
                  textAnchor="middle" letterSpacing="1.5">{mk.label}</text>
          </g>
        );
      })}
      {label && (
        <text x="160" y="160" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10" textAnchor="middle" letterSpacing="2">{label}</text>
      )}
    </CVFrame>
  );
}

/* ============================================================
   KEYS · mini keyboard with marked notes ====================== */
function cvKeys(props = {}) {
  const { octaves = 1, highlight = [], labels = [], finger = false, label } = props;
  const whiteCount = 7 * octaves;
  const W = 300;
  const H = 110;
  const wW = W / whiteCount;
  const wH = H;
  const bW = wW * 0.62;
  const bH = wH * 0.6;
  const whites = ["C","D","E","F","G","A","B"];
  const blackAfter = { C: true, D: true, E: false, F: true, G: true, A: true, B: false };

  const keys = [];
  for (let o = 0; o < octaves; o++) {
    whites.forEach((n, i) => {
      keys.push({ n, type: "w", idx: o * 7 + i });
    });
  }
  const blacks = [];
  for (let o = 0; o < octaves; o++) {
    whites.forEach((n, i) => {
      if (blackAfter[n]) blacks.push({ n: n + "#", anchor: o * 7 + i });
    });
  }

  return (
    <CVFrame viewBox="0 0 320 180">
      <g transform="translate(10 30)">
        {/* white keys */}
        {keys.map(k => {
          const isHi = highlight.includes(k.n);
          return (
            <g key={"w" + k.idx}>
              <rect x={k.idx * wW} y={0} width={wW - 1.4} height={wH} rx="3"
                    fill={isHi ? "rgba(255,255,255,.95)" : cv_paper} opacity={isHi ? 1 : .82} />
              {isHi && (
                <circle cx={k.idx * wW + wW / 2} cy={wH - 12} r="6" fill="currentColor" opacity=".9" />
              )}
              {finger && (
                <text x={k.idx * wW + wW / 2} y={wH - 8} fill="currentColor"
                      fontFamily="ui-monospace, Menlo, monospace" fontSize="10" textAnchor="middle" fontWeight="700">{(k.idx % 5) + 1}</text>
              )}
            </g>
          );
        })}
        {/* black keys */}
        {blacks.map((b, i) => {
          const isHi = highlight.includes(b.n) || highlight.includes(b.n.replace("#","b").replace("Cb","B").replace("Fb","E"));
          const x = b.anchor * wW + wW - bW / 2;
          return (
            <rect key={"b" + i} x={x} y={0} width={bW} height={bH} rx="2"
                  fill={isHi ? "rgba(0,0,0,.85)" : "rgba(15,15,20,.9)"}
                  stroke={isHi ? "rgba(255,255,255,.95)" : "none"} strokeWidth="2" />
          );
        })}
        {/* labels */}
        {labels.map((lbl, i) => (
          <text key={i} x={lbl.x} y={lbl.y} fill={cv_paper}
                fontFamily="ui-monospace, Menlo, monospace" fontSize="11"
                textAnchor="middle" fontWeight="700">{lbl.t}</text>
        ))}
      </g>
      {label && (
        <text x="160" y="160" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10" textAnchor="middle" letterSpacing="2">{label}</text>
      )}
    </CVFrame>
  );
}

/* ============================================================
   GROOVE · small step-grid of rows × steps =================== */
function cvGroove(props = {}) {
  const { rows = [], steps = 8, label } = props;
  const W = 300;
  const H = 24;
  const padL = 60;
  const cellW = (W - padL - 10) / steps;
  return (
    <CVFrame viewBox="0 0 320 180">
      <g transform="translate(10 20)">
        {rows.map((row, ri) => (
          <g key={ri} transform={`translate(0 ${ri * (H + 6)})`}>
            <text x={0} y={H / 2 + 4} fill={cv_paper}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="10" fontWeight="700">{row.label}</text>
            {Array.from({ length: steps }).map((_, si) => {
              const on = row.pattern[si];
              return (
                <rect key={si} x={padL + si * cellW} y={0}
                      width={cellW - 3} height={H} rx="4"
                      fill={on ? cv_paper : cv_accent}
                      stroke={on ? "none" : cv_chipBorder} strokeWidth="1" />
              );
            })}
          </g>
        ))}
        {/* beat numbers */}
        <g transform={`translate(0 ${rows.length * (H + 6) + 4})`}>
          {Array.from({ length: steps }).map((_, si) => (
            <text key={si} x={padL + si * cellW + (cellW - 3) / 2} y={10}
                  fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
                  fontSize="8" textAnchor="middle">{si + 1}</text>
          ))}
        </g>
      </g>
      {label && (
        <text x="160" y="170" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10" textAnchor="middle" letterSpacing="2">{label}</text>
      )}
    </CVFrame>
  );
}

/* ============================================================
   CHORDS · N chord diagrams in a row ========================= */
function cvChords(props = {}) {
  const { chords = [] } = props;
  // Each chord: { name, frets: "x-3-2-0-1-0" }
  const N = chords.length;
  const cellW = Math.min(80, 300 / N);
  const W = N * cellW;
  return (
    <CVFrame viewBox={`0 0 320 180`}>
      <g transform={`translate(${(320 - W) / 2} 18)`}>
        {chords.map((c, i) => {
          const frets = c.frets.split("-");
          const dx = i * cellW + cellW / 2;
          const gw = cellW * 0.7;
          const gh = 80;
          const left = dx - gw / 2;
          return (
            <g key={i}>
              <text x={dx} y={0} fill={cv_paper} fontFamily="Georgia, serif" fontWeight="800"
                    fontSize="16" textAnchor="middle">{c.name}</text>
              {/* nut */}
              <rect x={left} y={10} width={gw} height={3} fill={cv_paper} />
              {/* strings */}
              {[0,1,2,3,4,5].map(s => (
                <line key={s} x1={left + (s * gw / 5)} y1={13} x2={left + (s * gw / 5)} y2={13 + gh}
                      stroke={cv_paper} strokeWidth="1" opacity=".85" />
              ))}
              {/* frets */}
              {[1,2,3,4].map(f => (
                <line key={f} x1={left} y1={13 + f * (gh / 4)} x2={left + gw} y2={13 + f * (gh / 4)}
                      stroke={cv_paper} strokeWidth="1" opacity=".6" />
              ))}
              {/* x/o markers and fingered dots */}
              {frets.map((fr, si) => {
                const x = left + (si * gw / 5);
                if (fr === "x") return <text key={si} x={x} y={8} fill={cv_paper} fontFamily="ui-monospace, Menlo, monospace" fontSize="9" textAnchor="middle">×</text>;
                if (fr === "0") return <text key={si} x={x} y={8} fill={cv_paper} fontFamily="ui-monospace, Menlo, monospace" fontSize="9" textAnchor="middle">○</text>;
                const f = parseInt(fr, 10);
                const y = 13 + (f - 0.5) * (gh / 4);
                return <circle key={si} cx={x} cy={y} r={3.5} fill={cv_paper} />;
              })}
              {c.sub && (
                <text x={dx} y={13 + gh + 14} fill={cv_paperDim}
                      fontFamily="ui-monospace, Menlo, monospace" fontSize="8" textAnchor="middle">{c.sub}</text>
              )}
            </g>
          );
        })}
      </g>
    </CVFrame>
  );
}

/* ============================================================
   NUMERALS · Roman-numeral cadence ============================ */
function cvNumerals(props = {}) {
  const { sequence = ["I","IV","V","I"], label, op = "→" } = props;
  return (
    <CVFrame>
      <g transform="translate(0 70)">
        {sequence.map((s, i) => {
          const w = Math.min(58, 280 / (sequence.length * 1.5 + sequence.length - 1));
          const total = sequence.length * w + (sequence.length - 1) * 18;
          const startX = (320 - total) / 2;
          const x = startX + i * (w + 18);
          return (
            <g key={i}>
              <rect x={x} y={-26} width={w} height={52} rx="10"
                    fill={cv_chip} stroke={cv_chipBorder} strokeWidth="1.5" />
              <text x={x + w / 2} y={6} fill={cv_paper}
                    fontFamily="Georgia, serif" fontWeight="800" fontSize="22" textAnchor="middle">{s}</text>
              {i < sequence.length - 1 && (
                <text x={x + w + 9} y={6} fill={cv_paperDim} fontSize="14" textAnchor="middle"
                      fontFamily="ui-monospace, Menlo, monospace">{op}</text>
              )}
            </g>
          );
        })}
      </g>
      {label && (
        <text x="160" y="160" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10" textAnchor="middle" letterSpacing="2">{label}</text>
      )}
    </CVFrame>
  );
}

/* ============================================================
   NOTE VALUES · semibreve to semiquaver ======================= */
function cvNoteValues() {
  const items = [
    { n: "𝅝",  label: "Semibreve", beats: "4" },
    { n: "𝅗𝅥", label: "Minim",     beats: "2" },
    { n: "𝅘𝅥",  label: "Crotchet",  beats: "1" },
    { n: "𝅘𝅥𝅮", label: "Quaver",    beats: "½" },
    { n: "𝅘𝅥𝅯", label: "Semiquaver",beats: "¼" },
  ];
  return (
    <CVFrame>
      {items.map((it, i) => {
        const x = 20 + i * 58;
        return (
          <g key={i}>
            <rect x={x - 22} y={20} width={46} height={92} rx="9"
                  fill={cv_chip} stroke={cv_chipBorder} strokeWidth="1.5" />
            <text x={x} y={70} fill={cv_paper}
                  fontSize="38" textAnchor="middle" dominantBaseline="middle"
                  fontFamily="Bravura, 'Noto Music', Georgia, serif">{it.n}</text>
            <text x={x} y={96} fill={cv_paper}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="8.5" textAnchor="middle"
                  fontWeight="700">{it.beats} BEAT{it.beats === "1" ? "" : "S"}</text>
            <text x={x} y={132} fill={cv_paperDim}
                  fontFamily="Georgia, serif" fontStyle="italic" fontSize="10" textAnchor="middle">{it.label}</text>
          </g>
        );
      })}
      <text x="160" y="158" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="9" textAnchor="middle" letterSpacing="2">EACH HALF THE LENGTH OF THE LAST</text>
    </CVFrame>
  );
}

/* ============================================================
   TIME SIGNATURE · two side-by-side ========================== */
function cvTimeSig(props = {}) {
  const { sigs = [{ s: "4/4", feel: "Common" }, { s: "3/4", feel: "Waltz" }, { s: "6/8", feel: "Lilt" }] } = props;
  return (
    <CVFrame>
      {sigs.map((sg, i) => {
        const w = 280 / sigs.length;
        const cx = 20 + i * w + (w - 10) / 2;
        const [top, bot] = sg.s.split("/");
        return (
          <g key={i}>
            <rect x={20 + i * w + 5} y={18} width={w - 10} height={120} rx="12"
                  fill={cv_chip} stroke={cv_chipBorder} strokeWidth="1.5" />
            {/* 5-line staff stub */}
            <g stroke={cv_paper} strokeWidth="1" opacity=".7">
              {[0,1,2,3,4].map(li => (
                <line key={li} x1={20 + i * w + 18} x2={20 + i * w + w - 18}
                      y1={50 + li * 8} y2={50 + li * 8} />
              ))}
            </g>
            {/* digits */}
            <text x={cx} y={66} fill={cv_paper} fontFamily="Georgia, serif"
                  fontWeight="800" fontSize="22" textAnchor="middle">{top}</text>
            <text x={cx} y={86} fill={cv_paper} fontFamily="Georgia, serif"
                  fontWeight="800" fontSize="22" textAnchor="middle">{bot}</text>
            <text x={cx} y={125} fill={cv_paperDim}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="9"
                  textAnchor="middle" letterSpacing="1.5">{sg.feel.toUpperCase()}</text>
          </g>
        );
      })}
    </CVFrame>
  );
}

/* ============================================================
   DYNAMICS · pp to ff gradient ramp =========================== */
function cvDynamics() {
  const marks = ["pp","p","mp","mf","f","ff"];
  return (
    <CVFrame>
      {/* hairpin background */}
      <path d="M 20 100 L 300 35 L 300 145 Z" fill={cv_chip} stroke={cv_chipBorder} strokeWidth="1.5" />
      {marks.map((m, i) => {
        const x = 30 + i * 48;
        const y = 100 - (i * 8);
        return (
          <g key={i}>
            <text x={x} y={y + 6} fill={cv_paper} fontFamily="Georgia, serif"
                  fontStyle="italic" fontWeight="800" fontSize={14 + i * 1.5} textAnchor="middle">{m}</text>
          </g>
        );
      })}
      <text x="20" y="170" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="9" letterSpacing="2">PIANISSIMO</text>
      <text x="300" y="170" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="9" letterSpacing="2" textAnchor="end">FORTISSIMO</text>
    </CVFrame>
  );
}

/* ============================================================
   TEXTURE LINES · 1, 2 or 3 stacked melodic lines ============= */
function cvTextureLines(props = {}) {
  const { mode = "poly" } = props;
  const kind = mode;
  const lines = kind === "mono" ? 1 : kind === "homo" ? 3 : 3;
  const paths = [
    "M 10 0 Q 60 -14 110 0 T 210 0 T 310 0",
    "M 10 0 Q 60 12 110 -4 T 210 6 T 310 -2",
    "M 10 0 Q 60 -8 110 8 T 210 -10 T 310 6",
  ];
  return (
    <CVFrame>
      {Array.from({ length: lines }).map((_, i) => {
        const y = 50 + i * 32;
        const opacity = kind === "homo" ? (i === 0 ? 1 : .55) : 1;
        return (
          <g key={i} transform={`translate(0 ${y})`} opacity={opacity}>
            <path d={paths[i % paths.length]} fill="none" stroke={cv_paper}
                  strokeWidth="2.2" strokeLinecap="round" />
            <text x={10} y={-8} fill={cv_paperDim}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="9">
              {kind === "mono" ? "ONE LINE" : kind === "homo" ? (i === 0 ? "MELODY" : "HARMONY") : `VOICE ${i+1}`}
            </text>
          </g>
        );
      })}
      <text x="160" y="160" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="10" textAnchor="middle" letterSpacing="2">
        {kind === "mono" ? "MONOPHONIC" : kind === "homo" ? "HOMOPHONIC" : "POLYPHONIC"}
      </text>
    </CVFrame>
  );
}

/* ============================================================
   CHIPS · generic labeled-chip grid =========================== */
function cvChips(props = {}) {
  const { items = [], cols = 3, label } = props;
  const rows = Math.ceil(items.length / cols);
  const W = 300, H = rows * 38 + (rows - 1) * 10;
  const cellW = W / cols;
  return (
    <CVFrame>
      <g transform={`translate(10 ${(180 - H - (label ? 18 : 0)) / 2})`}>
        {items.map((t, i) => {
          const r = Math.floor(i / cols), c = i % cols;
          return (
            <g key={i} transform={`translate(${c * cellW} ${r * 48})`}>
              <rect x="2" y="0" width={cellW - 6} height="38" rx="9"
                    fill={cv_chip} stroke={cv_chipBorder} strokeWidth="1.5" />
              <text x={(cellW - 6) / 2 + 2} y="17" fill={cv_paper}
                    fontFamily="Georgia, serif" fontWeight="700" fontSize="12"
                    textAnchor="middle">{typeof t === "string" ? t : t.big}</text>
              {typeof t !== "string" && t.small && (
                <text x={(cellW - 6) / 2 + 2} y="30" fill={cv_paperDim}
                      fontFamily="ui-monospace, Menlo, monospace" fontSize="8"
                      textAnchor="middle" letterSpacing="1">{t.small}</text>
              )}
            </g>
          );
        })}
      </g>
      {label && (
        <text x="160" y="170" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10" textAnchor="middle" letterSpacing="2">{label}</text>
      )}
    </CVFrame>
  );
}

/* ============================================================
   STRUM · D/U arrow pattern =================================== */
function cvStrum(props = {}) {
  const { pattern = ["D","D","u","D","u","D","u"], label = "ONE BAR · 8 SUBDIVISIONS" } = props;
  return (
    <CVFrame>
      <g transform="translate(20 60)">
        {pattern.map((p, i) => {
          const x = i * 38 + 18;
          const up = p === "u" || p === "U";
          return (
            <g key={i}>
              {p === "_" ? (
                <text x={x} y={4} fill={cv_paperDim} fontSize="18" textAnchor="middle">·</text>
              ) : (
                <g>
                  <path d={up
                    ? `M ${x} 12 L ${x} -22 M ${x - 5} -16 L ${x} -22 L ${x + 5} -16`
                    : `M ${x} -22 L ${x} 12 M ${x - 5} 6 L ${x} 12 L ${x + 5} 6`}
                    stroke={cv_paper} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <text x={x} y={32} fill={cv_paper} fontFamily="ui-monospace, Menlo, monospace"
                        fontSize="10" fontWeight="700" textAnchor="middle">{up ? "U" : "D"}</text>
                </g>
              )}
            </g>
          );
        })}
      </g>
      <text x="160" y="150" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="9" textAnchor="middle" letterSpacing="2">{label}</text>
    </CVFrame>
  );
}

/* ============================================================
   TAB · guitar tablature snippet ============================== */
function cvTab(props = {}) {
  const { lines = ["e|--0--3--5----", "B|--1--3--5----", "G|--0--2--5----", "D|--2--0--7----", "A|--3-----7----", "E|--x--------5-"] } = props;
  return (
    <CVFrame>
      <g transform="translate(20 28)" fontFamily="ui-monospace, Menlo, monospace" fontSize="11">
        {lines.map((l, i) => (
          <text key={i} x={0} y={i * 18 + 10} fill={cv_paper} letterSpacing="1.5">{l}</text>
        ))}
      </g>
      <text x="160" y="160" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="10" textAnchor="middle" letterSpacing="2">6 LINES · 6 STRINGS · NUMBERS = FRETS</text>
    </CVFrame>
  );
}

/* ============================================================
   FLOW · boxes with arrows for "A to B" or "A vs B" ============ */
function cvFlow(props = {}) {
  const { boxes = [{ big: "A" }, { big: "B" }], op = "→", label } = props;
  const N = boxes.length;
  const gap = 16;
  const boxW = Math.min(110, (300 - gap * (N - 1)) / N);
  const total = N * boxW + (N - 1) * gap;
  const startX = (320 - total) / 2;
  return (
    <CVFrame>
      <g transform="translate(0 60)">
        {boxes.map((b, i) => {
          const x = startX + i * (boxW + gap);
          return (
            <g key={i}>
              <rect x={x} y={-32} width={boxW} height={64} rx="12"
                    fill={cv_chip} stroke={cv_chipBorder} strokeWidth="1.5" />
              <text x={x + boxW / 2} y={-6} fill={cv_paper}
                    fontFamily="Georgia, serif" fontWeight="800" fontSize="14"
                    textAnchor="middle">{b.big}</text>
              {b.small && (
                <text x={x + boxW / 2} y={14} fill={cv_paperDim}
                      fontFamily="ui-monospace, Menlo, monospace" fontSize="9"
                      textAnchor="middle" letterSpacing="1">{b.small}</text>
              )}
              {i < N - 1 && (
                <text x={x + boxW + gap / 2} y={4} fill={cv_paper}
                      fontFamily="ui-monospace, Menlo, monospace" fontSize="16"
                      textAnchor="middle" fontWeight="700">{op}</text>
              )}
            </g>
          );
        })}
      </g>
      {label && (
        <text x="160" y="160" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10" textAnchor="middle" letterSpacing="2">{label}</text>
      )}
    </CVFrame>
  );
}

/* ============================================================
   FORM BLOCKS · INTRO V C V C B C OUTRO ======================= */
function cvForm(props = {}) {
  const { blocks = [
    { l: "INTRO", w: 1 },
    { l: "VERSE", w: 2 },
    { l: "CHORUS", w: 2, accent: true },
    { l: "VERSE", w: 2 },
    { l: "CHORUS", w: 2, accent: true },
    { l: "BRIDGE", w: 1.5 },
    { l: "CHORUS", w: 2, accent: true },
    { l: "OUT", w: 1 },
  ] } = props;
  const totalW = blocks.reduce((s, b) => s + b.w, 0);
  const W = 290;
  let x = 15;
  return (
    <CVFrame>
      <g transform="translate(0 76)">
        {blocks.map((b, i) => {
          const w = (b.w / totalW) * W - 3;
          const el = (
            <g key={i}>
              <rect x={x} y={0} width={w} height={40} rx="6"
                    fill={b.accent ? cv_paper : cv_chip}
                    stroke={cv_chipBorder} strokeWidth="1.5" />
              <text x={x + w / 2} y={24} fill={b.accent ? "rgba(0,0,0,.78)" : cv_paper}
                    fontFamily="ui-monospace, Menlo, monospace" fontSize="9" fontWeight="700"
                    textAnchor="middle" letterSpacing="1">{b.l}</text>
            </g>
          );
          x += w + 3;
          return el;
        })}
      </g>
      <text x="160" y="148" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="10" textAnchor="middle" letterSpacing="2">SONG FORM · LEFT TO RIGHT</text>
    </CVFrame>
  );
}

/* ============================================================
   SEATING · orchestra concentric arcs ========================= */
function cvSeating() {
  const families = [
    { r: 78, label: "PERC · BRASS", accent: false },
    { r: 60, label: "WOODWIND",     accent: false },
    { r: 42, label: "VIOLAS · CELLOS", accent: true },
    { r: 24, label: "VIOLINS",      accent: true },
  ];
  return (
    <CVFrame>
      <g transform="translate(160 140)">
        {families.map((f, i) => (
          <g key={i}>
            <path d={`M ${-f.r} 0 A ${f.r} ${f.r} 0 0 1 ${f.r} 0`}
                  fill="none" stroke={cv_paper} strokeWidth="2.4"
                  opacity={f.accent ? 1 : .55} strokeLinecap="round" />
            <text x={0} y={-f.r + 14} fill={cv_paper}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="8"
                  textAnchor="middle" fontWeight="700" opacity={f.accent ? 1 : .7}>{f.label}</text>
          </g>
        ))}
        {/* conductor stand */}
        <circle cx="0" cy="0" r="4" fill={cv_paper} />
        <text x="0" y="18" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="8" textAnchor="middle" letterSpacing="1">CONDUCTOR</text>
      </g>
      <text x="160" y="20" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="10" textAnchor="middle" letterSpacing="2">QUIET FRONT · LOUD BACK</text>
    </CVFrame>
  );
}

/* ============================================================
   MAJOR / MINOR · two stacked triads ========================== */
function cvMajorMinor() {
  // Two staves side by side, C-E-G vs C-Eb-G
  return (
    <CVFrame>
      {/* left: major */}
      <g transform="translate(20 30)">
        <text x="60" y="-4" fill={cv_paper} fontFamily="Georgia, serif"
              fontWeight="800" fontSize="16" textAnchor="middle">Major</text>
        {[0,1,2,3,4].map(i => (
          <line key={i} x1="10" x2="110" y1={20 + i * 10} y2={20 + i * 10}
                stroke={cv_paper} strokeWidth="1.2" opacity=".85" />
        ))}
        {/* C-E-G stacked */}
        {[{y: 80, l: "C"}, {y: 70, l: "E"}, {y: 60, l: "G"}].map((nt, i) => (
          <g key={i}>
            <ellipse cx="60" cy={nt.y} rx="6" ry="4.4" transform={`rotate(-20 60 ${nt.y})`}
                     fill={cv_paper} />
            <text x="124" y={nt.y + 3} fill={cv_paper}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="10">{nt.l}</text>
          </g>
        ))}
        <text x="60" y="100" fill={cv_paperDim}
              fontFamily="ui-monospace, Menlo, monospace" fontSize="9"
              textAnchor="middle" letterSpacing="1">MAJOR 3rd</text>
      </g>
      {/* right: minor */}
      <g transform="translate(180 30)">
        <text x="60" y="-4" fill={cv_paper} fontFamily="Georgia, serif"
              fontWeight="800" fontSize="16" textAnchor="middle">minor</text>
        {[0,1,2,3,4].map(i => (
          <line key={i} x1="10" x2="110" y1={20 + i * 10} y2={20 + i * 10}
                stroke={cv_paper} strokeWidth="1.2" opacity=".85" />
        ))}
        {[{y: 80, l: "C"}, {y: 72, l: "E♭"}, {y: 60, l: "G"}].map((nt, i) => (
          <g key={i}>
            <ellipse cx="60" cy={nt.y} rx="6" ry="4.4" transform={`rotate(-20 60 ${nt.y})`}
                     fill={cv_paper} />
            <text x="124" y={nt.y + 3} fill={cv_paper}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="10">{nt.l}</text>
          </g>
        ))}
        <text x="60" y="100" fill={cv_paperDim}
              fontFamily="ui-monospace, Menlo, monospace" fontSize="9"
              textAnchor="middle" letterSpacing="1">minor 3rd</text>
      </g>
      <text x="160" y="155" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="10" textAnchor="middle" letterSpacing="2">LISTEN TO THE THIRD</text>
    </CVFrame>
  );
}

/* ============================================================
   BEAT vs RHYTHM · two stacked layers ========================= */
function cvBeatRhythm() {
  return (
    <CVFrame>
      <g transform="translate(20 50)">
        <text x={0} y={-8} fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="9" fontWeight="700" letterSpacing="2">RHYTHM</text>
        {/* irregular rhythm dots */}
        {[0, 18, 28, 60, 90, 108, 145, 175, 220, 250, 265].map((x, i) => (
          <circle key={i} cx={x} cy={10} r="6" fill={cv_paper} />
        ))}
        <text x={0} y={48} fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
              fontSize="9" fontWeight="700" letterSpacing="2">BEAT</text>
        {/* steady beat */}
        {[0, 70, 140, 210, 280].map((x, i) => (
          <rect key={i} x={x - 6} y={56} width="12" height="12" rx="2" fill={cv_paper} />
        ))}
      </g>
      <text x="160" y="160" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="10" textAnchor="middle" letterSpacing="2">RHYTHM RIDES ON THE BEAT</text>
    </CVFrame>
  );
}

/* ============================================================
   PASSES · listening passes ==================================== */
function cvPasses() {
  const passes = ["TEXTURE", "STRUCTURE", "TIMBRE", "DYNAMICS"];
  return (
    <CVFrame>
      <g transform="translate(20 35)">
        {/* one waveform-ish base */}
        <path d="M 0 60 Q 40 30 80 60 T 160 60 T 240 60 T 280 60"
              stroke={cv_paper} strokeWidth="2" fill="none" opacity=".85" />
        {passes.map((p, i) => (
          <g key={i} transform={`translate(0 ${i * 18 + 78})`}>
            <rect x={0} y={0} width="20" height="14" rx="3"
                  fill={cv_paper} opacity=".95" />
            <text x={5} y={11} fill="rgba(0,0,0,.75)"
                  fontFamily="ui-monospace, Menlo, monospace" fontWeight="700"
                  fontSize="9" textAnchor="start">{i + 1}</text>
            <text x={28} y={11} fill={cv_paper}
                  fontFamily="ui-monospace, Menlo, monospace" fontSize="10"
                  fontWeight="700" letterSpacing="1.5">{p}</text>
          </g>
        ))}
      </g>
    </CVFrame>
  );
}

/* ============================================================
   BPM · slow to fast gauge ===================================== */
function cvBPM() {
  const ticks = [60, 80, 100, 120];
  return (
    <CVFrame>
      <g transform="translate(0 90)">
        <line x1="20" x2="300" y1="0" y2="0" stroke={cv_paper} strokeWidth="2.5" />
        {ticks.map((t, i) => {
          const x = 20 + (i / (ticks.length - 1)) * 280;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1="-8" y2="8" stroke={cv_paper} strokeWidth="2" />
              <text x={x} y="-16" fill={cv_paper}
                    fontFamily="Georgia, serif" fontWeight="800" fontSize="13" textAnchor="middle">{t}</text>
              <text x={x} y="26" fill={cv_paperDim}
                    fontFamily="ui-monospace, Menlo, monospace" fontSize="9" textAnchor="middle"
                    letterSpacing="1">BPM</text>
            </g>
          );
        })}
        {/* +5 arrow */}
        <g transform="translate(160 50)">
          <path d="M -40 0 L 40 0 M 28 -8 L 40 0 L 28 8" stroke={cv_paper} fill="none"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <text x={0} y="-8" fill={cv_paperDim}
                fontFamily="ui-monospace, Menlo, monospace" fontSize="9" textAnchor="middle"
                letterSpacing="2">+5 BPM AT A TIME</text>
        </g>
      </g>
    </CVFrame>
  );
}

/* ============================================================
   JOURNAL · lined-page glance ================================== */
function cvJournal() {
  const lines = [
    { label: "KEPT",   text: "swung 8ths in the chorus" },
    { label: "CUT",    text: "6/8 verse (fought the chorus)" },
    { label: "LISTEN", text: "tracks 1, 3, 7 of the album" },
  ];
  return (
    <CVFrame>
      <g transform="translate(30 28)">
        <rect x={0} y={0} width="260" height="124" rx="8"
              fill={cv_chip} stroke={cv_chipBorder} strokeWidth="1.5" />
        {lines.map((l, i) => (
          <g key={i} transform={`translate(14 ${20 + i * 32})`}>
            <rect x={0} y={-4} width={48} height={18} rx="9"
                  fill={cv_paper} />
            <text x={24} y={9} fill="rgba(0,0,0,.78)"
                  fontFamily="ui-monospace, Menlo, monospace" fontWeight="700"
                  fontSize="9" textAnchor="middle" letterSpacing="1">{l.label}</text>
            <text x={58} y={9} fill={cv_paper}
                  fontFamily="Georgia, serif" fontStyle="italic" fontSize="12">{l.text}</text>
          </g>
        ))}
      </g>
      <text x="160" y="170" fill={cv_paperDim} fontFamily="ui-monospace, Menlo, monospace"
            fontSize="9" textAnchor="middle" letterSpacing="2">EXAMINERS MARK THE REASONING</text>
    </CVFrame>
  );
}

/* ============================================================
   Renderer · pick visual by kind ============================== */
function ConceptVisual({ visual }) {
  if (!visual) return null;
  switch (visual.kind) {
    case "staff":       return cvStaff(visual);
    case "keys":        return cvKeys(visual);
    case "groove":      return cvGroove(visual);
    case "chords":      return cvChords(visual);
    case "numerals":    return cvNumerals(visual);
    case "noteValues":  return cvNoteValues();
    case "timeSig":     return cvTimeSig(visual);
    case "dynamics":    return cvDynamics();
    case "texture":     return cvTextureLines(visual);
    case "chips":       return cvChips(visual);
    case "strum":       return cvStrum(visual);
    case "tab":         return cvTab(visual);
    case "flow":        return cvFlow(visual);
    case "form":        return cvForm(visual);
    case "seating":     return cvSeating();
    case "majorMinor":  return cvMajorMinor();
    case "beatRhythm":  return cvBeatRhythm();
    case "passes":      return cvPasses();
    case "bpm":         return cvBPM();
    case "journal":     return cvJournal();
    default: return null;
  }
}

window.ConceptVisual = ConceptVisual;
