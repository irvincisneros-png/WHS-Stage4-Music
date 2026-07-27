/* Dedicated instrument learning areas. These are deliberately separate from
   curriculum modules so students can practise guitar or piano from either year
   without changing topic-completion data. */

const GUITAR_OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const GUITAR_STRING_LABELS = ["6 · low E", "5 · A", "4 · D", "3 · G", "2 · B", "1 · high E"];

const GUITAR_CHORDS = {
  C: {
    name: "C major",
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, 0, 1, 0],
    tip: "Curl finger 1 so the open high E string can ring.",
  },
  G: {
    name: "G major",
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    tip: "Keep fingers close to the frets and strum all six strings.",
  },
  D: {
    name: "D major",
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [null, null, 0, 1, 3, 2],
    tip: "Start the strum from the open D string.",
  },
  A: {
    name: "A major",
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [null, 0, 1, 2, 3, 0],
    tip: "Place the three fingers close together behind fret 2.",
  },
  E: {
    name: "E major",
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    tip: "This shape uses every string. Check each one separately.",
  },
  Am: {
    name: "A minor",
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [null, 0, 2, 3, 1, 0],
    tip: "It looks like E major moved across one string.",
  },
  Em: {
    name: "E minor",
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    tip: "Only two fingers are needed. Let every string ring.",
  },
  Dm: {
    name: "D minor",
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [null, null, 0, 2, 3, 1],
    tip: "Keep finger 1 on the first fret of the high E string.",
  },
  Fmaj7: {
    name: "F major 7",
    frets: [-1, -1, 3, 2, 1, 0],
    fingers: [null, null, 3, 2, 1, 0],
    tip: "A beginner-friendly F sound with an open high E.",
  },
  B7: {
    name: "B dominant 7",
    frets: [-1, 2, 1, 2, 0, 2],
    fingers: [null, 2, 1, 3, 0, 4],
    tip: "Use finger 4 on the high E string and avoid the low E.",
  },
};

const GUITAR_PROGRESSIONS = [
  {
    id: "first-change",
    name: "First chord change",
    note: "Four bars · one chord per bar",
    chords: ["G", "C", "D", "G"],
  },
  {
    id: "four-chord",
    name: "Four-chord practice loop",
    note: "An original pop-style practice loop",
    chords: ["C", "G", "Am", "Fmaj7"],
  },
  {
    id: "amazing-grace",
    name: "Amazing Grace",
    note: "Simplified practice chords · public domain",
    chords: ["G", "G", "C", "G", "G", "D", "G", "G"],
  },
  {
    id: "blues",
    name: "12-bar blues in E",
    note: "A standard blues form",
    chords: ["E", "E", "E", "E", "A", "A", "E", "E", "B7", "A", "E", "B7"],
  },
];

const GUITAR_TAB_PATTERNS = [
  {
    id: "open-strings",
    name: "Open-string ladder",
    note: "Read from left to right. Zero means play an open string.",
    events: [
      { string: 6, fret: 0 }, { string: 5, fret: 0 }, { string: 4, fret: 0 },
      { string: 3, fret: 0 }, { string: 2, fret: 0 }, { string: 1, fret: 0 },
    ],
  },
  {
    id: "c-walk",
    name: "C major walk",
    note: "Keep one finger ready for each fret.",
    events: [
      { string: 5, fret: 3 }, { string: 4, fret: 0 }, { string: 4, fret: 2 },
      { string: 4, fret: 3 }, { string: 3, fret: 0 }, { string: 3, fret: 2 },
      { string: 2, fret: 0 }, { string: 2, fret: 1 },
    ],
  },
  {
    id: "minor-riff",
    name: "E minor riff",
    note: "An original two-string riff",
    events: [
      { string: 6, fret: 0 }, { string: 6, fret: 0 }, { string: 6, fret: 3 },
      { string: 5, fret: 2 }, { string: 6, fret: 0 }, { string: 5, fret: 2 },
      { string: 4, fret: 2 }, { string: 5, fret: 2 },
    ],
  },
];

function guitarMidiName(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
}

function guitarMidiHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makeGuitarTuning(midis, labels) {
  return midis.map((midi, index) => ({
    string: 6 - index,
    label: labels?.[index] || (index === 0 ? "Lowest string" : index === 5 ? "Highest string" : `String ${6 - index}`),
    note: labels?.[index] || guitarMidiName(midi),
    midi,
    hz: guitarMidiHz(midi),
  }));
}

const GUITAR_TUNING_PRESETS = [
  {
    id: "standard",
    name: "Standard",
    notes: "E A D G B E",
    help: "The usual tuning for beginner chords, scales and most class songs.",
    strings: makeGuitarTuning([40, 45, 50, 55, 59, 64], ["E2", "A2", "D3", "G3", "B3", "E4"]),
  },
  {
    id: "drop-d",
    name: "Drop D",
    notes: "D A D G B E",
    help: "Lower only string 6 from E to D for power chords and a deeper bass.",
    strings: makeGuitarTuning([38, 45, 50, 55, 59, 64], ["D2", "A2", "D3", "G3", "B3", "E4"]),
  },
  {
    id: "half-step",
    name: "Half-step down",
    notes: "E♭ A♭ D♭ G♭ B♭ E♭",
    help: "Every string is one semitone lower. Chord shapes stay the same.",
    strings: makeGuitarTuning([39, 44, 49, 54, 58, 63], ["E♭2", "A♭2", "D♭3", "G♭3", "B♭3", "E♭4"]),
  },
  {
    id: "d-standard",
    name: "D Standard",
    notes: "D G C F A D",
    help: "Every string is one whole tone lower for a darker, looser sound.",
    strings: makeGuitarTuning([38, 43, 48, 53, 57, 62], ["D2", "G2", "C3", "F3", "A3", "D4"]),
  },
  {
    id: "drop-c",
    name: "Drop C",
    notes: "C G C F A D",
    help: "D Standard with string 6 lowered again to C. Use suitable string tension.",
    strings: makeGuitarTuning([36, 43, 48, 53, 57, 62], ["C2", "G2", "C3", "F3", "A3", "D4"]),
  },
  {
    id: "dadgad",
    name: "DADGAD",
    notes: "D A D G A D",
    help: "An open, suspended tuning used in folk, acoustic and Celtic styles.",
    strings: makeGuitarTuning([38, 45, 50, 55, 57, 62], ["D2", "A2", "D3", "G3", "A3", "D4"]),
  },
  {
    id: "open-g",
    name: "Open G",
    notes: "D G D G B D",
    help: "The open strings form a G major chord.",
    strings: makeGuitarTuning([38, 43, 50, 55, 59, 62], ["D2", "G2", "D3", "G3", "B3", "D4"]),
  },
  {
    id: "open-d",
    name: "Open D",
    notes: "D A D F# A D",
    help: "The open strings form a D major chord.",
    strings: makeGuitarTuning([38, 45, 50, 54, 57, 62], ["D2", "A2", "D3", "F#3", "A3", "D4"]),
  },
  {
    id: "open-e",
    name: "Open E",
    notes: "E B E G# B E",
    help: "The open strings form an E major chord. Tune up carefully to avoid excess tension.",
    strings: makeGuitarTuning([40, 47, 52, 56, 59, 64], ["E2", "B2", "E3", "G#3", "B3", "E4"]),
  },
];

const GUITAR_CUSTOM_NOTES = Array.from({ length: 34 }, (_, index) => {
  const midi = 35 + index;
  return { midi, note: guitarMidiName(midi), hz: guitarMidiHz(midi) };
});

function detectGuitarPitch(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.012) return null;

  const minTau = Math.floor(sampleRate / 420);
  const maxTau = Math.min(Math.floor(sampleRate / 58), Math.floor(buffer.length / 2));
  const difference = new Float32Array(maxTau + 1);
  const comparisonLength = buffer.length - maxTau;

  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < comparisonLength; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += difference[tau];
    difference[tau] = runningSum ? difference[tau] * tau / runningSum : 1;
  }

  let bestTau = -1;
  let bestValue = 1;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (difference[tau] < bestValue) {
      bestValue = difference[tau];
      bestTau = tau;
    }
    if (difference[tau] < 0.14) {
      while (tau + 1 <= maxTau && difference[tau + 1] < difference[tau]) tau++;
      bestTau = tau;
      bestValue = difference[tau];
      break;
    }
  }

  if (bestTau < 0 || bestValue > 0.38) return null;
  const left = difference[Math.max(1, bestTau - 1)];
  const centre = difference[bestTau];
  const right = difference[Math.min(maxTau, bestTau + 1)];
  const denominator = 2 * (2 * centre - right - left);
  const refinedTau = denominator ? bestTau + (right - left) / denominator : bestTau;
  return sampleRate / refinedTau;
}

function guitarNoteFor(stringIndex, fret) {
  return guitarMidiName(GUITAR_OPEN_MIDI[stringIndex] + fret);
}

function playGuitarShape(chordKey, direction = "down") {
  const chord = GUITAR_CHORDS[chordKey];
  if (!chord) return;
  const indexes = chord.frets.map((_, i) => i).filter(i => chord.frets[i] >= 0);
  if (direction === "up") indexes.reverse();
  window.MusicAudio?.resume();
  indexes.forEach((stringIndex, order) => {
    setTimeout(() => {
      window.MusicAudio?.playPluck(
        guitarNoteFor(stringIndex, chord.frets[stringIndex]),
        1.35,
        0.72
      );
    }, order * 48);
  });
}

function StudioBackBar({ year, onBack, active, onSwitch }) {
  return (
    <div className="studio-backbar">
      <button className="btn btn-ghost" onClick={onBack}>
        <span aria-hidden="true">←</span>
        Back to {window.CURRICULUM[year].label}
      </button>
      <nav className="studio-switcher" aria-label="Instrument studios">
        <button
          className={"studio-switch " + (active === "guitar" ? "active" : "")}
          onClick={() => onSwitch("guitar")}
          aria-current={active === "guitar" ? "page" : undefined}
        >
          <Glyph name="guitar" size={22} />
          Guitar
        </button>
        <button
          className={"studio-switch " + (active === "piano" ? "active" : "")}
          onClick={() => onSwitch("piano")}
          aria-current={active === "piano" ? "page" : undefined}
        >
          <Glyph name="piano" size={22} />
          Piano
        </button>
      </nav>
    </div>
  );
}

function scrollWithinStudio(event, selector) {
  event.preventDefault();
  const target = document.querySelector(selector);
  if (!target) return;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
}

function InstrumentPracticePlan({ instrument, steps }) {
  const storageKey = `instrumentPractice.${instrument}`;
  const [completed, setCompleted] = React.useState(
    () => window.Students.readNS(storageKey, [])
  );
  const completedSet = new Set(completed);
  const count = steps.filter(step => completedSet.has(step.id)).length;
  const allDone = count === steps.length;
  const next = steps.find(step => !completedSet.has(step.id));

  React.useEffect(() => {
    window.Students.writeNS(storageKey, completed);
  }, [storageKey, completed]);

  function toggleStep(id) {
    setCompleted(current => current.includes(id)
      ? current.filter(item => item !== id)
      : [...current, id]
    );
  }

  function reset() {
    setCompleted([]);
  }

  return (
    <section className="practice-plan" aria-labelledby={`${instrument}-practice-plan-title`}>
      <div className="practice-plan-summary">
        <div className="eyebrow">Five-minute practice path</div>
        <h2 id={`${instrument}-practice-plan-title`}>
          {allDone ? "Session complete" : next ? `Next: ${next.title}` : "Choose a step"}
        </h2>
        <p>
          Work through a short, focused sequence. Check each step yourself.
          Progress stays only on this device.
        </p>
        <div
          className="practice-plan-progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax={steps.length}
          aria-valuenow={count}
          aria-label={`${count} of ${steps.length} practice steps complete`}
        >
          <i style={{ width: `${(count / steps.length) * 100}%` }} />
        </div>
        <div className="practice-plan-count">{count} / {steps.length} steps</div>
        {count > 0 && (
          <button className="text-button" onClick={reset}>Start a fresh session</button>
        )}
      </div>
      <ol className="practice-plan-steps">
        {steps.map((step, index) => {
          const done = completedSet.has(step.id);
          return (
            <li key={step.id} className={done ? "done" : ""}>
              <button
                className="practice-step-check"
                onClick={() => toggleStep(step.id)}
                aria-pressed={done}
                aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${step.title}`}
              >
                <span aria-hidden="true">{done ? "✓" : index + 1}</span>
              </button>
              <div>
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </div>
              <a
                href={step.href}
                onClick={(event) => scrollWithinStudio(event, step.href)}
              >
                Open
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function GuitarChordDiagram({ chordKey, handed, reveal }) {
  const chord = GUITAR_CHORDS[chordKey];
  const width = 420;
  const nutY = 58;
  const fretHeight = 48;
  const stringXs = [70, 126, 182, 238, 294, 350];
  const displayXs = handed === "left" ? [...stringXs].reverse() : stringXs;

  function playString(index) {
    const fret = chord.frets[index];
    if (fret < 0) return;
    window.MusicAudio?.resume();
    window.MusicAudio?.playPluck(guitarNoteFor(index, fret), 1.25, 0.78);
  }

  return (
    <div className="guitar-diagram-wrap">
      <svg
        className="guitar-diagram"
        viewBox={`0 0 ${width} 338`}
        role="group"
        aria-label={`${chord.name} chord diagram, ${handed}-handed view`}
      >
        <text x="210" y="26" textAnchor="middle" className="guitar-diagram-title">
          {chord.name}
        </text>
        {[0, 1, 2, 3, 4, 5].map(fret => {
          const y = nutY + fret * fretHeight;
          return (
            <line
              key={"fret-" + fret}
              x1="70" x2="350" y1={y} y2={y}
              className={fret === 0 ? "guitar-nut" : "guitar-fret"}
            />
          );
        })}
        {chord.frets.map((fret, stringIndex) => {
          const x = displayXs[stringIndex];
          const finger = chord.fingers[stringIndex];
          const marker = fret < 0 ? "×" : fret === 0 ? "○" : null;
          const dotY = fret > 0 ? nutY + (fret - 0.5) * fretHeight : 0;
          return (
            <g
              key={"string-" + stringIndex}
              role={fret >= 0 ? "button" : undefined}
              tabIndex={fret >= 0 ? 0 : undefined}
              aria-label={fret >= 0
                ? `${GUITAR_STRING_LABELS[stringIndex]}, fret ${fret}. Play string`
                : `${GUITAR_STRING_LABELS[stringIndex]}, do not play`}
              onClick={() => playString(stringIndex)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  playString(stringIndex);
                }
              }}
              className={fret >= 0 ? "guitar-string-hit" : ""}
            >
              <line x1={x} x2={x} y1={nutY} y2={nutY + 5 * fretHeight} className="guitar-string" />
              <rect x={x - 24} y="35" width="48" height="266" fill="transparent" />
              {marker && (
                <text x={x} y="49" textAnchor="middle" className="guitar-open-marker">
                  {marker}
                </text>
              )}
              {reveal && fret > 0 && (
                <g>
                  <circle cx={x} cy={dotY} r="18" className="guitar-finger-dot" />
                  <text x={x} y={dotY + 5} textAnchor="middle" className="guitar-finger-number">
                    {finger}
                  </text>
                </g>
              )}
              <text x={x} y="320" textAnchor="middle" className="guitar-string-name">
                {GUITAR_STRING_LABELS[stringIndex].split("· ")[1]}
              </text>
            </g>
          );
        })}
        {!reveal && (
          <g>
            <rect x="102" y="131" width="216" height="66" rx="16" className="guitar-hidden-panel" />
            <text x="210" y="159" textAnchor="middle" className="guitar-hidden-title">Shape hidden</text>
            <text x="210" y="180" textAnchor="middle" className="guitar-hidden-copy">Picture it, then reveal the dots</text>
          </g>
        )}
      </svg>
      <p className="studio-help">
        Numbers show fretting-hand fingers: 1 index, 2 middle, 3 ring, 4 little finger.
        Select a string to hear it by itself.
      </p>
    </div>
  );
}

function GuitarChordLab() {
  const [chordKey, setChordKey] = React.useState("C");
  const [handed, setHanded] = React.useState("right");
  const [reveal, setReveal] = React.useState(true);
  const chord = GUITAR_CHORDS[chordKey];

  return (
    <section className="studio-section" aria-labelledby="guitar-chords-title">
      <div className="studio-section-heading">
        <div>
          <div className="eyebrow">Lesson 1 · chord shapes</div>
          <h2 id="guitar-chords-title">Place each finger, then check each string</h2>
          <p>Choose a chord, copy the diagram, and listen for clean notes.</p>
        </div>
        <div className="studio-compact-controls">
          <label>
            Diagram
            <select value={handed} onChange={(event) => setHanded(event.target.value)}>
              <option value="right">Right-handed</option>
              <option value="left">Left-handed</option>
            </select>
          </label>
          <button className="btn btn-ghost" onClick={() => setReveal(value => !value)}>
            {reveal ? "Hide fingering" : "Reveal fingering"}
          </button>
        </div>
      </div>

      <div className="chord-lab-layout">
        <div className="chord-library" role="list" aria-label="Beginner guitar chords">
          {Object.keys(GUITAR_CHORDS).map(key => (
            <button
              key={key}
              className={"chord-choice " + (key === chordKey ? "active" : "")}
              onClick={() => { setChordKey(key); setReveal(true); }}
              aria-pressed={key === chordKey}
            >
              <strong>{key}</strong>
              <span>{GUITAR_CHORDS[key].name}</span>
            </button>
          ))}
        </div>
        <div className="chunk paper chord-diagram-card">
          <GuitarChordDiagram chordKey={chordKey} handed={handed} reveal={reveal} />
          <div className="chord-actions">
            <button className="btn btn-primary" onClick={() => playGuitarShape(chordKey, "down")}>
              Strum down
            </button>
            <button className="btn btn-teal" onClick={() => playGuitarShape(chordKey, "up")}>
              Strum up
            </button>
          </div>
          <div className="studio-tip">
            <strong>Clean-chord check</strong>
            <span>{chord.tip}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const GUITAR_CHANGE_PAIRS = [
  { id: "g-c", label: "G to C", chords: ["G", "C"] },
  { id: "c-am", label: "C to Am", chords: ["C", "Am"] },
  { id: "d-a", label: "D to A", chords: ["D", "A"] },
  { id: "em-g", label: "Em to G", chords: ["Em", "G"] },
];

function GuitarChangeChallenge() {
  const [pairId, setPairId] = React.useState(GUITAR_CHANGE_PAIRS[0].id);
  const [duration, setDuration] = React.useState(60);
  const [tempo, setTempo] = React.useState(70);
  const [metronome, setMetronome] = React.useState(true);
  const [phase, setPhase] = React.useState("ready");
  const [countIn, setCountIn] = React.useState(3);
  const [timeLeft, setTimeLeft] = React.useState(60);
  const [changes, setChanges] = React.useState(0);
  const [targetIndex, setTargetIndex] = React.useState(0);
  const [bestByPair, setBestByPair] = React.useState(
    () => window.Students.readNS("instrumentPractice.guitarChangeBests", {})
  );
  const pair = GUITAR_CHANGE_PAIRS.find(item => item.id === pairId);
  const targetChord = pair.chords[targetIndex];
  const beatRef = React.useRef(0);

  React.useEffect(() => {
    window.Students.writeNS("instrumentPractice.guitarChangeBests", bestByPair);
  }, [bestByPair]);

  React.useEffect(() => {
    if (phase !== "count-in") return;
    if (countIn <= 0) {
      setPhase("running");
      setTimeLeft(duration);
      return;
    }
    window.MusicAudio?.click(countIn === 1);
    const timer = setTimeout(() => setCountIn(value => value - 1), 700);
    return () => clearTimeout(timer);
  }, [phase, countIn, duration]);

  React.useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      setTimeLeft(value => {
        if (value <= 1) {
          setPhase("done");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  React.useEffect(() => {
    if (phase !== "running" || !metronome) return;
    beatRef.current = 0;
    window.MusicAudio?.click(true);
    const timer = setInterval(() => {
      beatRef.current = (beatRef.current + 1) % 4;
      window.MusicAudio?.click(beatRef.current === 0);
    }, 60000 / tempo);
    return () => clearInterval(timer);
  }, [phase, metronome, tempo]);

  React.useEffect(() => {
    if (phase !== "done") return;
    setBestByPair(current => {
      const previous = current[pairId] || 0;
      return changes > previous ? { ...current, [pairId]: changes } : current;
    });
    if (changes > 0) window.MusicAudio?.ding(true);
  }, [phase, changes, pairId]);

  function start() {
    window.MusicAudio?.resume();
    setChanges(0);
    setTargetIndex(0);
    setTimeLeft(duration);
    setCountIn(3);
    setPhase("count-in");
  }

  function recordCleanChange() {
    if (phase !== "running") return;
    setChanges(value => value + 1);
    setTargetIndex(value => (value + 1) % 2);
  }

  function choosePair(id) {
    setPairId(id);
    setPhase("ready");
    setChanges(0);
    setTargetIndex(0);
  }

  const best = bestByPair[pairId] || 0;

  return (
    <section className="studio-section studio-section-tinted" aria-labelledby="guitar-change-title">
      <div className="studio-section-heading">
        <div>
          <div className="eyebrow">Lesson 2 · chord-change coach</div>
          <h2 id="guitar-change-title">Make clean changes before chasing speed</h2>
          <p>
            Choose two chords. Each time both shapes sound clean, record the change and move
            to the next target. This is a self-check tool, so listen honestly.
          </p>
        </div>
        <Chip variant="butter">Personal best · {best}</Chip>
      </div>

      <div className="change-coach-layout">
        <div className="change-coach-settings">
          <label className="studio-select">
            Chord pair
            <select value={pairId} onChange={(event) => choosePair(event.target.value)}>
              {GUITAR_CHANGE_PAIRS.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="studio-select">
            Challenge time
            <select value={duration} onChange={(event) => {
              const next = parseInt(event.target.value, 10);
              setDuration(next);
              setTimeLeft(next);
              setPhase("ready");
            }}>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </label>
          <label className="change-coach-toggle">
            <input
              type="checkbox"
              checked={metronome}
              onChange={(event) => setMetronome(event.target.checked)}
            />
            Metronome
          </label>
          <label className="studio-tempo">
            Tempo
            <input
              type="range" min="50" max="110" step="2" value={tempo}
              onChange={(event) => setTempo(parseInt(event.target.value, 10))}
              disabled={!metronome}
            />
            <strong>{tempo} bpm</strong>
          </label>
        </div>

        <div className="change-coach-console" aria-live="polite">
          <div className="change-coach-timer">
            <span>{phase === "count-in" ? "GET READY" : phase === "done" ? "FINISHED" : "TIME"}</span>
            <strong>{phase === "count-in" ? countIn : timeLeft}</strong>
          </div>
          <div className="change-coach-target">
            <span className="eyebrow">{phase === "running" ? "Change to" : "First shape"}</span>
            <strong>{targetChord}</strong>
            <button className="text-button" onClick={() => playGuitarShape(targetChord)}>
              Hear target chord
            </button>
          </div>
          <div className="change-coach-score">
            <span>Clean changes</span>
            <strong>{changes}</strong>
          </div>
        </div>

        <div className="change-coach-actions">
          {phase === "running" ? (
            <button className="btn btn-primary change-record-button" onClick={recordCleanChange}>
              Clean change
            </button>
          ) : (
            <button className="btn btn-primary change-record-button" onClick={start}>
              {phase === "done" ? "Try again" : "Start challenge"}
            </button>
          )}
          <p className="studio-help">
            A clean change means the correct strings ring without buzzing or accidental muting.
          </p>
        </div>
      </div>
    </section>
  );
}

function GuitarProgressionLab() {
  const [selectedId, setSelectedId] = React.useState(GUITAR_PROGRESSIONS[0].id);
  const [activeBar, setActiveBar] = React.useState(-1);
  const [tempo, setTempo] = React.useState(82);
  const timersRef = React.useRef([]);
  const progression = GUITAR_PROGRESSIONS.find(item => item.id === selectedId);

  function stop() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setActiveBar(-1);
  }

  React.useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

  function play() {
    stop();
    window.MusicAudio?.resume();
    const barMs = (60000 / tempo) * 4;
    progression.chords.forEach((chord, index) => {
      timersRef.current.push(setTimeout(() => {
        setActiveBar(index);
        playGuitarShape(chord, "down");
      }, index * barMs));
    });
    timersRef.current.push(setTimeout(() => setActiveBar(-1), progression.chords.length * barMs));
  }

  function chooseProgression(id) {
    stop();
    setSelectedId(id);
  }

  return (
    <section className="studio-section studio-section-tinted" aria-labelledby="guitar-progressions-title">
      <div className="studio-section-heading">
        <div>
          <div className="eyebrow">Lesson 3 · sample chords</div>
          <h2 id="guitar-progressions-title">Practise changing on the first beat</h2>
          <p>Keep the strumming hand moving while the fretting hand prepares the next shape.</p>
        </div>
        <label className="studio-tempo">
          Tempo
          <input
            type="range" min="55" max="120" step="1" value={tempo}
            onChange={(event) => setTempo(parseInt(event.target.value, 10))}
          />
          <strong>{tempo} bpm</strong>
        </label>
      </div>

      <div className="progression-picker" role="list">
        {GUITAR_PROGRESSIONS.map(item => (
          <button
            key={item.id}
            className={"progression-choice " + (selectedId === item.id ? "active" : "")}
            onClick={() => chooseProgression(item.id)}
            aria-pressed={selectedId === item.id}
          >
            <strong>{item.name}</strong>
            <span>{item.note}</span>
          </button>
        ))}
      </div>

      <div className="progression-strip" aria-label={`${progression.name} chord sequence`}>
        {progression.chords.map((chord, index) => (
          <button
            key={index}
            className={"progression-bar " + (activeBar === index ? "active" : "")}
            onClick={() => { setActiveBar(index); playGuitarShape(chord); }}
            aria-label={`Bar ${index + 1}, ${chord}`}
          >
            <span>BAR {index + 1}</span>
            <strong>{chord}</strong>
          </button>
        ))}
      </div>

      <div className="studio-action-row">
        <button className="btn btn-primary" onClick={play}>Play progression</button>
        <button className="btn btn-ghost" onClick={stop}>Stop</button>
        <span className="studio-help">Select any bar to hear that chord.</span>
      </div>
    </section>
  );
}

function GuitarTabLab() {
  const [patternId, setPatternId] = React.useState(GUITAR_TAB_PATTERNS[0].id);
  const [activeEvent, setActiveEvent] = React.useState(-1);
  const timersRef = React.useRef([]);
  const pattern = GUITAR_TAB_PATTERNS.find(item => item.id === patternId);
  const visualStrings = [1, 2, 3, 4, 5, 6];

  function stop() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setActiveEvent(-1);
  }

  React.useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

  function playEvent(event, index) {
    setActiveEvent(index);
    const stringIndex = 6 - event.string;
    window.MusicAudio?.resume();
    window.MusicAudio?.playPluck(guitarNoteFor(stringIndex, event.fret), 1.05, 0.78);
  }

  function playTab() {
    stop();
    pattern.events.forEach((event, index) => {
      timersRef.current.push(setTimeout(() => playEvent(event, index), index * 520));
    });
    timersRef.current.push(setTimeout(() => setActiveEvent(-1), pattern.events.length * 520));
  }

  return (
    <section className="studio-section" aria-labelledby="guitar-tab-title">
      <div className="studio-section-heading">
        <div>
          <div className="eyebrow">Lesson 4 · reading tab</div>
          <h2 id="guitar-tab-title">Six lines match the six strings</h2>
          <p>The top tab line is the thin high E string. A number tells you which fret to press.</p>
        </div>
        <label className="studio-select">
          Exercise
          <select value={patternId} onChange={(event) => { stop(); setPatternId(event.target.value); }}>
            {GUITAR_TAB_PATTERNS.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="tab-reading-grid">
        <div className="tab-notation chunk paper" role="group" aria-label={`${pattern.name} guitar tablature`}>
          {visualStrings.map(stringNumber => (
            <div className="tab-string-row" key={stringNumber}>
              <span className="tab-string-label">
                {stringNumber === 1 ? "e" : ["", "", "B", "G", "D", "A", "E"][stringNumber]}
              </span>
              {pattern.events.map((event, index) => {
                const hasNote = event.string === stringNumber;
                return hasNote ? (
                  <button
                    key={index}
                    className={"tab-cell " + (activeEvent === index ? "active" : "")}
                    onClick={() => playEvent(event, index)}
                    aria-label={`Play string ${event.string}, fret ${event.fret}`}
                  >
                    {event.fret}
                  </button>
                ) : (
                  <span className="tab-cell tab-cell-empty" key={index} aria-hidden="true" />
                );
              })}
            </div>
          ))}
        </div>
        <aside className="tab-lesson-card">
          <div className="eyebrow">How to decode it</div>
          <ol>
            <li>Find the string line.</li>
            <li>Press the numbered fret.</li>
            <li>Play notes from left to right.</li>
            <li>Keep each sound even and clear.</li>
          </ol>
          <div className="studio-tip">
            <strong>{pattern.name}</strong>
            <span>{pattern.note}</span>
          </div>
          <div className="studio-action-row">
            <button className="btn btn-primary" onClick={playTab}>Play tab</button>
            <button className="btn btn-ghost" onClick={stop}>Reset</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function GuitarTunerLab() {
  const [tuningId, setTuningId] = React.useState("standard");
  const [customMidis, setCustomMidis] = React.useState([40, 45, 50, 55, 59, 64]);
  const [stringIndex, setStringIndex] = React.useState(0);
  const [practiceOffset, setPracticeOffset] = React.useState(-18);
  const [mode, setMode] = React.useState("microphone");
  const [micState, setMicState] = React.useState("idle");
  const [detectedHz, setDetectedHz] = React.useState(null);
  const [micError, setMicError] = React.useState("");
  const micRef = React.useRef(null);

  const preset = GUITAR_TUNING_PRESETS.find(item => item.id === tuningId);
  const tuning = tuningId === "custom"
    ? makeGuitarTuning(customMidis)
    : preset.strings;
  const target = tuning[stringIndex];
  const micOffset = detectedHz ? 1200 * Math.log2(detectedHz / target.hz) : null;
  const offset = mode === "microphone" ? micOffset : practiceOffset;
  const inTune = offset != null && Math.abs(offset) <= 3;
  const direction = offset == null ? "waiting" : offset < -3 ? "flat" : offset > 3 ? "sharp" : "in tune";
  const detectedMidi = detectedHz ? Math.round(69 + 12 * Math.log2(detectedHz / 440)) : null;

  function stopMicrophone() {
    const resources = micRef.current;
    if (resources) {
      resources.stopped = true;
      if (resources.timer) clearTimeout(resources.timer);
      resources.stream?.getTracks().forEach(track => track.stop());
      resources.context?.close();
      micRef.current = null;
    }
    setMicState("idle");
    setDetectedHz(null);
  }

  React.useEffect(() => () => stopMicrophone(), []);

  async function startMicrophone() {
    setMicError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("Microphone tuning is not supported in this browser. Use the reference mode instead.");
      return;
    }
    setMicState("requesting");
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0;
      context.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      const resources = { stream, context, analyser, buffer, timer: null, stopped: false };
      micRef.current = resources;
      setMicState("listening");

      const analyse = () => {
        if (resources.stopped) return;
        analyser.getFloatTimeDomainData(buffer);
        const pitch = detectGuitarPitch(buffer, context.sampleRate);
        setDetectedHz(pitch);
        resources.timer = setTimeout(analyse, 90);
      };
      analyse();
    } catch (error) {
      stopMicrophone();
      setMicError(error?.name === "NotAllowedError"
        ? "Microphone permission was blocked. Allow microphone access, then try again."
        : "The microphone could not start. Use the reference mode or check your browser input.");
    }
  }

  function changeMode(nextMode) {
    if (nextMode !== "microphone") stopMicrophone();
    setMode(nextMode);
    setMicError("");
  }

  function changeTuning(nextId) {
    stopMicrophone();
    setTuningId(nextId);
    setStringIndex(0);
    setPracticeOffset(-18);
  }

  function changeCustomString(index, midi) {
    setCustomMidis(values => values.map((value, itemIndex) => itemIndex === index ? midi : value));
    setPracticeOffset(-18);
  }

  function playReference() {
    window.MusicAudio?.resume();
    window.MusicAudio?.playPluckHz(target.hz, 1.5, 0.72);
  }

  function playPracticeString() {
    window.MusicAudio?.resume();
    const hz = target.hz * Math.pow(2, practiceOffset / 1200);
    window.MusicAudio?.playPluckHz(hz, 1.5, 0.76);
  }

  function playAllReferences() {
    window.MusicAudio?.resume();
    tuning.forEach((string, index) => {
      setTimeout(() => window.MusicAudio?.playPluckHz(string.hz, 1.35, 0.7), index * 650);
    });
  }

  function newChallenge() {
    const nextString = Math.floor(Math.random() * tuning.length);
    const amount = 12 + Math.floor(Math.random() * 19);
    setStringIndex(nextString);
    setPracticeOffset(Math.random() > 0.5 ? amount : -amount);
  }

  return (
    <section className="studio-section studio-section-tinted" aria-labelledby="guitar-tuner-title">
      <div className="studio-section-heading">
        <div>
          <div className="eyebrow">Lesson 5 · guitar tuner</div>
          <h2 id="guitar-tuner-title">Tune standard, Drop D, open tunings and more</h2>
          <p>
            Select a target tuning. Use your microphone for a real guitar, or practise matching
            pitches by ear with the reference trainer.
          </p>
        </div>
        <Chip variant={inTune ? "teal" : "butter"}>
          {target.note} · {direction}
        </Chip>
      </div>

      <div className="tuner-setup chunk paper">
        <label className="studio-select tuner-preset-select">
          Tuning
          <select value={tuningId} onChange={(event) => changeTuning(event.target.value)}>
            {GUITAR_TUNING_PRESETS.map(item => (
              <option key={item.id} value={item.id}>{item.name} · {item.notes}</option>
            ))}
            <option value="custom">Custom tuning</option>
          </select>
        </label>
        <div className="tuner-preset-copy">
          <strong>{tuningId === "custom" ? "Custom tuning" : preset.name}</strong>
          <span>{tuningId === "custom"
            ? "Choose a target note for each string below."
            : preset.help}</span>
        </div>
        <div className="tuner-mode-switch" role="group" aria-label="Tuner mode">
          <button className={mode === "microphone" ? "active" : ""}
            aria-pressed={mode === "microphone"} onClick={() => changeMode("microphone")}>
            Microphone tuner
          </button>
          <button className={mode === "practice" ? "active" : ""}
            aria-pressed={mode === "practice"} onClick={() => changeMode("practice")}>
            Ear training
          </button>
        </div>
      </div>

      <div className="tuner-layout">
        <div className="tuning-string-list" role="list" aria-label={`${tuningId === "custom" ? "Custom" : preset.name} guitar strings`}>
          {tuning.map((string, index) => (
            <div className={"tuning-string-wrap " + (index === stringIndex ? "active" : "")} key={string.string}>
              <button
                className="tuning-string"
                onClick={() => { setStringIndex(index); setPracticeOffset(-18); setDetectedHz(null); }}
                aria-pressed={index === stringIndex}
              >
                <span>STRING {string.string}</span>
                <strong>{string.note}</strong>
                <small>{index === 0 ? "Lowest" : index === 5 ? "Highest" : "Target note"}</small>
              </button>
              {tuningId === "custom" && (
                <label>
                  <span className="sr-only">Target note for string {string.string}</span>
                  <select value={customMidis[index]}
                    onChange={(event) => changeCustomString(index, parseInt(event.target.value, 10))}>
                    {GUITAR_CUSTOM_NOTES.map(note => (
                      <option key={note.midi} value={note.midi}>{note.note}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ))}
        </div>

        <div className="chunk paper tuner-console">
          <div className="tuner-readout">
            <span className="eyebrow">{mode === "microphone" ? `String ${target.string} target` : "Practice string"}</span>
            <strong>{target.note}</strong>
            <span className={"tuner-status " + (inTune ? "good" : "")}>
              {mode === "microphone"
                ? detectedHz
                  ? `${guitarMidiName(detectedMidi)} detected · ${detectedHz.toFixed(1)} Hz · ${Math.abs(Math.round(micOffset))} cents ${direction}`
                  : micState === "listening" ? "Play the selected string"
                    : micState === "requesting" ? "Waiting for microphone permission" : "Microphone is off"
                : inTune ? "Ready to play" : `${Math.abs(practiceOffset)} cents ${direction}`}
            </span>
          </div>
          <div className="tuner-meter" aria-label={offset == null ? "Waiting for a pitch" : `Tuning offset ${Math.round(offset)} cents`}>
            <span>FLAT</span>
            <div className="tuner-track">
              <i className="tuner-centre" />
              <i className={"tuner-needle " + (inTune ? "good" : "")} style={{
                left: `${offset == null ? 50 : Math.max(0, Math.min(100, offset + 50))}%`,
                opacity: offset == null ? .22 : 1,
              }} />
            </div>
            <span>SHARP</span>
          </div>
          {mode === "practice" ? (
            <>
              <input
                className="tuner-slider"
                type="range" min="-50" max="50" step="1" value={practiceOffset}
                onChange={(event) => setPracticeOffset(parseInt(event.target.value, 10))}
                aria-label="Virtual tuning peg"
              />
              <div className="tuner-step-controls">
                <button className="btn btn-ghost" onClick={() => setPracticeOffset(value => Math.max(-50, value - 2))}>
                  Lower pitch
                </button>
                <button className="btn btn-ghost" onClick={() => setPracticeOffset(value => Math.min(50, value + 2))}>
                  Raise pitch
                </button>
              </div>
            </>
          ) : (
            <div className="microphone-tuner-controls">
              <button className={"btn " + (micState === "listening" ? "btn-ghost" : "btn-primary")}
                onClick={micState === "listening" ? stopMicrophone : startMicrophone}
                disabled={micState === "requesting"}>
                {micState === "listening" ? "Stop microphone"
                  : micState === "requesting" ? "Waiting for permission…" : "Start microphone"}
              </button>
              <p>Choose one string, pluck it clearly, then adjust the real tuning peg until the needle is centred.</p>
              {micError && <p className="tuner-error" role="alert">{micError}</p>}
            </div>
          )}
          <div className="studio-action-row">
            <button className="btn btn-teal" onClick={playReference}>Hear reference</button>
            <button className="btn btn-ghost" onClick={playAllReferences}>Hear all six</button>
            {mode === "practice" && (
              <>
                <button className="btn btn-primary" onClick={playPracticeString}>Hear practice string</button>
                <button className="btn btn-ghost" onClick={newChallenge}>New challenge</button>
              </>
            )}
          </div>
          <div className="sr-only" aria-live="polite">
            {mode === "microphone" && detectedHz
              ? `${guitarMidiName(detectedMidi)} detected, ${Math.abs(Math.round(micOffset))} cents ${direction}.`
              : ""}
          </div>
        </div>
      </div>
      <aside className="tuner-safety-note">
        <strong>Retuning safely</strong>
        <span>
          Tune in small steps and stop if a string feels unusually tight. Lower tunings may need
          heavier strings and a setup. This tuner listens only after you grant microphone access;
          audio is analysed in your browser and is not uploaded.
        </span>
      </aside>
    </section>
  );
}

function GuitarStudio({ year, onBack, onSwitch }) {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="instrument-studio">
      <StudioBackBar year={year} onBack={onBack} active="guitar" onSwitch={onSwitch} />
      <header className="studio-hero studio-hero-guitar">
        <div className="studio-hero-copy">
          <div className="eyebrow">Instrument studio · guitar</div>
          <h1>Learn the shape. Hear the sound. Make the change.</h1>
          <p>
            Start with clean beginner chords, read short tab patterns, tune standard or alternate tunings,
            then put the shapes into real progressions.
          </p>
          <div className="studio-hero-chips">
            <Chip>10 chord shapes</Chip>
            <Chip variant="teal">Chord-change coach</Chip>
            <Chip variant="butter">Tabs · tuner · songs</Chip>
          </div>
        </div>
        <div className="studio-hero-art" aria-hidden="true">
          <Glyph name="guitar" size={160} stroke="currentColor" />
          <span className="studio-art-string one" />
          <span className="studio-art-string two" />
          <span className="studio-art-string three" />
        </div>
      </header>

      <nav className="studio-jump-nav" aria-label="Guitar lesson sections">
        <a href="#guitar-chords-title" onClick={(event) => scrollWithinStudio(event, "#guitar-chords-title")}>Chord shapes</a>
        <a href="#guitar-change-title" onClick={(event) => scrollWithinStudio(event, "#guitar-change-title")}>Change coach</a>
        <a href="#guitar-progressions-title" onClick={(event) => scrollWithinStudio(event, "#guitar-progressions-title")}>Sample chords</a>
        <a href="#guitar-tab-title" onClick={(event) => scrollWithinStudio(event, "#guitar-tab-title")}>Read tab</a>
        <a href="#guitar-tuner-title" onClick={(event) => scrollWithinStudio(event, "#guitar-tuner-title")}>Tune up</a>
      </nav>

      <InstrumentPracticePlan
        instrument="guitar"
        steps={[
          { id: "tune", title: "Tune up", detail: "Choose a tuning and match all six strings.", href: "#guitar-tuner-title" },
          { id: "shape", title: "Check one chord", detail: "Play every string slowly and cleanly.", href: "#guitar-chords-title" },
          { id: "change", title: "Change two chords", detail: "Complete one timed self-check.", href: "#guitar-change-title" },
          { id: "tab", title: "Read one tab", detail: "Keep all notes even from left to right.", href: "#guitar-tab-title" },
          { id: "song", title: "Play a progression", detail: "Stay with the pulse for one complete loop.", href: "#guitar-progressions-title" },
        ]}
      />
      <GuitarChordLab />
      <GuitarChangeChallenge />
      <GuitarProgressionLab />
      <GuitarTabLab />
      <GuitarTunerLab />
    </div>
  );
}

const LAB_PIANO_WHITES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const LAB_PIANO_TARGETS = ["C", "D", "E", "F", "G", "A", "B"];
const LAB_PIANO_BLACKS = [
  ["C#4", 0], ["D#4", 1], ["F#4", 3], ["G#4", 4], ["A#4", 5],
];
const LAB_PIANO_CHORDS = {
  C: { name: "C major", notes: ["C4", "E4", "G4"], fingers: "1 · 3 · 5" },
  F: { name: "F major", notes: ["C4", "F4", "A4"], fingers: "1 · 3 · 5" },
  G: { name: "G major", notes: ["D4", "G4", "B4"], fingers: "1 · 3 · 5" },
  Am: { name: "A minor", notes: ["C4", "E4", "A4"], fingers: "1 · 3 · 5" },
};

function LabPianoKeyboard({ onPress, highlighted }) {
  const activeNotes = highlighted || new Set();
  const keyWidth = 64;

  return (
    <div className="lab-piano-scroll">
      <div className="lab-piano" style={{ width: keyWidth * LAB_PIANO_WHITES.length }}>
        <div className="lab-piano-whites">
          {LAB_PIANO_WHITES.map(note => (
            <button
              key={note}
              className={"lab-piano-white " + (activeNotes.has(note) ? "highlighted" : "")}
              onClick={() => onPress(note)}
              aria-label={`Play ${note}`}
            >
              <span>{note.replace(/\d/, "")}</span>
            </button>
          ))}
        </div>
        {LAB_PIANO_BLACKS.map(([note, after]) => (
          <button
            key={note}
            className={"lab-piano-black " + (activeNotes.has(note) ? "highlighted" : "")}
            style={{ left: (after + 1) * keyWidth - 20 }}
            onClick={() => onPress(note)}
            aria-label={`Play ${note}`}
          />
        ))}
      </div>
    </div>
  );
}

function PianoWarmupLab() {
  const [mode, setMode] = React.useState("notes");
  const [targetIndex, setTargetIndex] = React.useState(0);
  const [feedback, setFeedback] = React.useState("Find every C. Look just left of a pair of black keys.");
  const [chordKey, setChordKey] = React.useState("C");
  const target = LAB_PIANO_TARGETS[targetIndex];
  const chord = LAB_PIANO_CHORDS[chordKey];
  const nextTargetTimerRef = React.useRef(null);

  React.useEffect(() => () => clearTimeout(nextTargetTimerRef.current), []);

  function chooseNextTarget() {
    setTargetIndex(index => (index + 3) % LAB_PIANO_TARGETS.length);
  }

  function pressPianoKey(note) {
    window.MusicAudio?.resume();
    window.MusicAudio?.playPiano(note, 0.8, 0.78);
    if (mode !== "notes") return;
    const playedName = note.replace(/\d/, "");
    if (playedName === target) {
      setFeedback(`Correct. ${target} is under your finger.`);
      window.MusicAudio?.ding(true);
      clearTimeout(nextTargetTimerRef.current);
      nextTargetTimerRef.current = setTimeout(chooseNextTarget, 450);
    } else {
      setFeedback(`${playedName} is close. The target is ${target}.`);
    }
  }

  function playPianoChord() {
    window.MusicAudio?.resume();
    chord.notes.forEach((note, index) => {
      setTimeout(() => window.MusicAudio?.playPiano(note, 1.2, 0.62), index * 35);
    });
  }

  const highlighted = mode === "chords" ? new Set(chord.notes) : new Set();
  return (
    <section className="studio-section" aria-labelledby="piano-warmup-title">
      <div className="studio-section-heading">
        <div>
          <div className="eyebrow">Piano quick start</div>
          <h2 id="piano-warmup-title">Use the black-key pattern as your map</h2>
          <p>Find notes by shape first. Letter names become much easier when the geography is familiar.</p>
        </div>
        <div className="studio-switcher compact" role="group" aria-label="Piano warm-up mode">
          <button className={"studio-switch " + (mode === "notes" ? "active" : "")} onClick={() => setMode("notes")}>
            Note hunt
          </button>
          <button className={"studio-switch " + (mode === "chords" ? "active" : "")} onClick={() => setMode("chords")}>
            Chord shapes
          </button>
        </div>
      </div>

      {mode === "notes" ? (
        <div className="piano-challenge-callout">
          <span className="eyebrow">Your target</span>
          <strong>{target}</strong>
          <p>{feedback}</p>
        </div>
      ) : (
        <div className="piano-chord-picker">
          {Object.keys(LAB_PIANO_CHORDS).map(key => (
            <button
              key={key}
              className={"chord-choice " + (key === chordKey ? "active" : "")}
              onClick={() => setChordKey(key)}
              aria-pressed={key === chordKey}
            >
              <strong>{key}</strong>
              <span>{LAB_PIANO_CHORDS[key].name}</span>
            </button>
          ))}
          <div className="piano-finger-guide">
            <span className="eyebrow">Suggested fingers</span>
            <strong>{chord.fingers}</strong>
            <button className="btn btn-teal" onClick={playPianoChord}>Play {chordKey}</button>
          </div>
        </div>
      )}

      <LabPianoKeyboard onPress={pressPianoKey} highlighted={highlighted} />
      <p className="studio-help center-text">
        Piano finger numbers run from thumb 1 to little finger 5 in both hands.
      </p>
    </section>
  );
}

const PIANO_READING_SPRINTS = [
  {
    id: "steps",
    name: "Stepwise C position",
    note: "Mostly steps · C4 to G4",
    notes: ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4"],
  },
  {
    id: "steps-skips",
    name: "Steps and skips",
    note: "Second and third intervals",
    notes: ["E4", "G4", "F4", "A4", "G4", "E4", "D4", "C4"],
  },
  {
    id: "wider",
    name: "Wider reading",
    note: "C4 to C5",
    notes: ["C4", "E4", "G4", "F4", "D4", "B4", "C5", "G4"],
  },
];

function PianoReadingSprint() {
  const [exerciseId, setExerciseId] = React.useState(PIANO_READING_SPRINTS[0].id);
  const [phase, setPhase] = React.useState("ready");
  const [previewLeft, setPreviewLeft] = React.useState(10);
  const [position, setPosition] = React.useState(0);
  const [hits, setHits] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const [showHint, setShowHint] = React.useState(false);
  const [feedback, setFeedback] = React.useState("Preview the whole phrase before you begin.");
  const [bestByExercise, setBestByExercise] = React.useState(
    () => window.Students.readNS("instrumentPractice.pianoReadingBests", {})
  );
  const exercise = PIANO_READING_SPRINTS.find(item => item.id === exerciseId);
  const expected = exercise.notes[position];
  const best = bestByExercise[exerciseId] || 0;

  React.useEffect(() => {
    window.Students.writeNS("instrumentPractice.pianoReadingBests", bestByExercise);
  }, [bestByExercise]);

  React.useEffect(() => {
    if (phase !== "preview") return;
    if (previewLeft <= 0) {
      setPhase("playing");
      setFeedback("Play the highlighted note. The exercise waits for the correct key.");
      return;
    }
    const timer = setTimeout(() => setPreviewLeft(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, previewLeft]);

  function begin() {
    setPhase("preview");
    setPreviewLeft(10);
    setPosition(0);
    setHits(0);
    setMisses(0);
    setShowHint(false);
    setFeedback("Scan direction, repeated notes and any skips.");
  }

  function beginPlayingNow() {
    setPhase("playing");
    setPreviewLeft(0);
    setFeedback("Play the highlighted note. The exercise waits for the correct key.");
  }

  function chooseExercise(id) {
    setExerciseId(id);
    setPhase("ready");
    setPosition(0);
    setHits(0);
    setMisses(0);
    setShowHint(false);
    setFeedback("Preview the whole phrase before you begin.");
  }

  function pressReadingKey(note) {
    window.MusicAudio?.resume();
    window.MusicAudio?.playPiano(note, 0.75, 0.78);
    if (phase !== "playing") return;
    if (note !== expected) {
      setMisses(value => value + 1);
      setFeedback(`${note} is not the highlighted note. Read its staff position again.`);
      return;
    }

    const nextHits = hits + 1;
    setHits(nextHits);
    setFeedback(`Correct: ${note}.`);
    if (position >= exercise.notes.length - 1) {
      const attempts = nextHits + misses;
      const accuracy = attempts > 0 ? Math.round((nextHits / attempts) * 100) : 0;
      setBestByExercise(current => ({
        ...current,
        [exerciseId]: Math.max(current[exerciseId] || 0, accuracy),
      }));
      setPhase("done");
      window.MusicAudio?.ding(true);
      return;
    }
    setPosition(value => value + 1);
  }

  const hintNotes = phase === "playing" && showHint && expected
    ? new Set([expected])
    : new Set();
  const attempts = hits + misses;
  const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;

  return (
    <section className="studio-section studio-section-tinted" aria-labelledby="piano-reading-title">
      <div className="studio-section-heading">
        <div>
          <div className="eyebrow">Read and play · sight-reading sprint</div>
          <h2 id="piano-reading-title">Preview first, then let the notation lead</h2>
          <p>
            You get ten seconds to scan an original eight-note phrase. During the attempt,
            the score waits until you find the correct key.
          </p>
        </div>
        <Chip variant="butter">Best accuracy · {best}%</Chip>
      </div>

      <div className="reading-sprint-controls">
        <label className="studio-select">
          Reading level
          <select
            value={exerciseId}
            onChange={(event) => chooseExercise(event.target.value)}
            disabled={phase === "preview" || phase === "playing"}
          >
            {PIANO_READING_SPRINTS.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <div className="reading-sprint-meta">
          <strong>{exercise.name}</strong>
          <span>{exercise.note}</span>
        </div>
        <label className="change-coach-toggle">
          <input
            type="checkbox"
            checked={showHint}
            onChange={(event) => setShowHint(event.target.checked)}
          />
          Show keyboard hint
        </label>
      </div>

      <div className="reading-sprint-score">
        <GrandStave
          rh={exercise.notes.map(note => [note, 1])}
          lh={[]}
          totalBeats={exercise.notes.length}
          rhPos={phase === "playing" ? position : -1}
          lhPos={-1}
          showNoteNames={false}
        />
      </div>

      <div className="reading-sprint-status" aria-live="polite">
        <div>
          <span>{phase === "preview" ? "PREVIEW" : phase === "playing" ? "NOTE" : phase === "done" ? "ACCURACY" : "READY"}</span>
          <strong>
            {phase === "preview"
              ? previewLeft
              : phase === "playing"
                ? `${position + 1} / ${exercise.notes.length}`
                : phase === "done"
                  ? `${accuracy}%`
                  : exercise.notes.length}
          </strong>
        </div>
        <p>{feedback}</p>
        <div>
          <span>CORRECT</span>
          <strong>{hits}</strong>
        </div>
        <div>
          <span>RETRY</span>
          <strong>{misses}</strong>
        </div>
      </div>

      <LabPianoKeyboard onPress={pressReadingKey} highlighted={hintNotes} />

      <div className="studio-action-row">
        {phase === "preview" ? (
          <button className="btn btn-primary" onClick={beginPlayingNow}>Start now</button>
        ) : phase === "playing" ? (
          <button className="btn btn-ghost" onClick={() => setPhase("ready")}>Stop attempt</button>
        ) : (
          <button className="btn btn-primary" onClick={begin}>
            {phase === "done" ? "Try another phrase" : "Begin preview"}
          </button>
        )}
        <span className="studio-help">
          Feedback uses note names and text as well as colour.
        </span>
      </div>
    </section>
  );
}

function PianoStudio({ year, onBack, onSwitch }) {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="instrument-studio">
      <StudioBackBar year={year} onBack={onBack} active="piano" onSwitch={onSwitch} />
      <header className="studio-hero studio-hero-piano">
        <div className="studio-hero-copy">
          <div className="eyebrow">Instrument studio · piano</div>
          <h1>Find the notes, build the shape, play the phrase.</h1>
          <p>
            Learn the keyboard map, practise simple triads, then move into the full
            two-octave play-along piano with notation and public-domain melodies.
          </p>
          <div className="studio-hero-chips">
            <Chip>Note hunt</Chip>
            <Chip variant="teal">Sight-reading sprint</Chip>
            <Chip variant="butter">Chords · play-along</Chip>
          </div>
        </div>
        <div className="studio-hero-art" aria-hidden="true">
          <Glyph name="piano" size={170} stroke="currentColor" />
          <span className="studio-art-key one" />
          <span className="studio-art-key two" />
          <span className="studio-art-key three" />
        </div>
      </header>

      <nav className="studio-jump-nav" aria-label="Piano lesson sections">
        <a href="#piano-warmup-title" onClick={(event) => scrollWithinStudio(event, "#piano-warmup-title")}>Keyboard map</a>
        <a href="#piano-reading-title" onClick={(event) => scrollWithinStudio(event, "#piano-reading-title")}>Sight reading</a>
        <a href="#full-piano-title" onClick={(event) => scrollWithinStudio(event, "#full-piano-title")}>Full piano</a>
      </nav>

      <InstrumentPracticePlan
        instrument="piano"
        steps={[
          { id: "map", title: "Find three notes", detail: "Use the black-key groups as landmarks.", href: "#piano-warmup-title" },
          { id: "chord", title: "Build one triad", detail: "Play its three notes evenly.", href: "#piano-warmup-title" },
          { id: "read", title: "Read one phrase", detail: "Preview first and finish the sprint.", href: "#piano-reading-title" },
          { id: "slow", title: "Slow the tempo", detail: "Practise a melody below performance speed.", href: "#full-piano-title" },
          { id: "play", title: "Play one full melody", detail: "Keep going and notice the next target.", href: "#full-piano-title" },
        ]}
      />
      <PianoWarmupLab />
      <PianoReadingSprint />

      <section className="studio-section studio-section-tinted" aria-labelledby="full-piano-title">
        <div className="studio-section-heading">
          <div>
            <div className="eyebrow">Full instrument · play along</div>
            <h2 id="full-piano-title">Follow the score or explore freely</h2>
            <p>
              Start with Hot Cross Buns, slow the tempo, listen once, then choose Play along.
              The outlined key shows the next note.
            </p>
          </div>
          <Chip variant="teal">Mouse · touch · computer keys</Chip>
        </div>
        <window.PianoPlayer topic={{ pianoSong: "hotcross" }} difficulty="medium" />
      </section>
    </div>
  );
}

Object.assign(window, { GuitarStudio, PianoStudio });
