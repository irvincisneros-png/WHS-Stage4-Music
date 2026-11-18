/* Falling Notes: extra public-domain songs.
   Same format as SONGS in interactives/piano.jsx: rh / lh = [[noteName, beats], ...]
   plus `level` and `beatsPerBar` (default 4). "R" is a rest.
   Written with a tiny helper: S("E5/2 D5 C5/.5") -> [["E5",2],["D5",1],["C5",0.5]]
   (no "/n" means 1 beat). Join note names with "+" for a chord: "C4+E4+G4/2".
   All pieces are simple student arrangements. */
(function () {
  const S = (str) => str.trim().split(/\s+/).map((t) => {
    const [n, b] = t.split("/");
    return [n, b ? parseFloat(b) : 1];
  });
  const rep = (str, n) => Array(n).fill(str).join(" ");

  // Levels for the songs that already live in piano.jsx
  window.FALLING_LEVELS = {
    hotcross: "Easy", twinkle: "Easy", mary: "Easy", ode: "Easy",
    simpleStone: "Easy", extensionStone: "Medium",
  };
  // Songs from piano.jsx that Falling Notes leaves out (they stay on the Piano page)
  window.FALLING_HIDE = ["simpleStone"];

  const jbA = "E4/1 E4/1 E4/2 E4/1 E4/1 E4/2 E4/1 G4/1 C4/1.5 D4/.5 E4/4";
  const mmP = "D5/.5 B4/.5 A4/.5 G4/.5 A4/.5 B4/.5";
  const minA = "D5/1 G4/.5 A4/.5 B4/.5 C5/.5 D5/1 G4/1 G4/1 E5/1 C5/.5 D5/.5 E5/.5 F#5/.5 G5/1 G4/1 G4/1";
  const gsA = "C5/2 D5/1 E5/1.5 F5/.5 E5/1 D5/2 B4/1 G4/1.5 A4/.5 B4/1";
  const canonBass = "C3/2 G2/2 A2/2 E3/2 F2/2 C3/2 F2/2 G2/2";
  // Last Christmas: chords and bass only (one chord per bar), no melody
  const lcRh = "G3+B3+C4+E4/4 G3+B3+C4+E4/4 G3+A3+C4+E4/4 G3+A3+C4+E4/4 F3+A3+C4+E4/4 F3+A3+C4+E4/4 F3+G3+B3+E4/4 F3+G3+B3+D4/4";
  const lcLh = "C3/4 C3/3 B2/1 A2/4 A2/2 B2/1 C3/1 D3/4 D3/4 G2/4 G2/4";

  window.FALLING_SONGS_EXTRA = {
    frere: {
      name: "Frère Jacques", note: "Traditional · public domain", bpm: 100, tag: "ROUND",
      level: "Easy",
      rh: S("C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4/2 E4 F4 G4/2 G4/.5 A4/.5 G4/.5 F4/.5 E4 C4 G4/.5 A4/.5 G4/.5 F4/.5 E4 C4 C4 G3 C4/2 C4 G3 C4/2"),
      lh: S(rep("C3/4", 8)),
    },
    jingle: {
      name: "Jingle Bells", note: "Pierpont · public domain · chorus", bpm: 120, tag: "SEASONAL",
      level: "Easy",
      rh: S(jbA + " F4/1 F4/1 F4/1.5 F4/.5 F4/1 E4/1 E4/1 E4/.5 E4/.5 E4/1 D4/1 D4/1 E4/1 D4/2 G4/2 "
        + jbA + " F4/1 F4/1 F4/1.5 F4/.5 F4/1 E4/1 E4/1 E4/.5 E4/.5 G4/1 G4/1 F4/1 D4/1 C4/4"),
      lh: S(rep("C3/2 G3/2", 4) + " F2/2 C3/2 C3/2 G3/2 D3/2 A2/2 G2/4 "
        + rep("C3/2 G3/2", 4) + " F2/2 C3/2 C3/2 G3/2 G2/2 D3/2 C3/4"),
    },
    saints: {
      name: "When the Saints Go Marching In", note: "Traditional · public domain", bpm: 112, tag: "JAZZ",
      level: "Easy",
      rh: S("R/1 C4 E4 F4 G4/4 R/1 C4 E4 F4 G4/4 R/1 C4 E4 F4 G4/2 E4/2 C4/2 E4/2 D4/4 "
        + "R/1 E4 E4 D4 C4/3 C4 E4/2 G4/2 G4/2 F4/2 R/2 E4 F4 G4/2 E4/2 C4/2 D4/2 C4/4"),
      lh: S("R/4 C3/4 C3/4 C3/4 C3/4 C3/4 C3/4 G2/4 C3/4 C3/4 C3/4 F2/4 F2/4 C3/4 G2/4 C3/4"),
    },
    amazing: {
      name: "Amazing Grace", note: "Traditional · public domain", bpm: 84, tag: "HYMN",
      level: "Medium", beatsPerBar: 3,
      rh: S("R/2 D4/1 G4/2 B4/.5 G4/.5 B4/2 A4/1 G4/2 E4/1 D4/2 D4/1 G4/2 B4/.5 G4/.5 B4/2 A4/1 D5/3 D5/2 B4/1 "
        + "D5/2 B4/.5 G4/.5 B4/2 A4/1 G4/2 E4/1 D4/2 D4/1 G4/2 B4/.5 G4/.5 B4/2 A4/1 G4/3"),
      lh: S("R/3 G2/3 G2/3 C3/3 G2/3 G2/3 D3/3 D3/3 D3/3 G2/3 G2/3 C3/3 G2/3 G2/3 D3/3 G2/3"),
    },
    minuet: {
      name: "Minuet in G", note: "Petzold (once credited to Bach) · public domain", bpm: 108, tag: "BAROQUE",
      level: "Medium", beatsPerBar: 3,
      rh: S(minA + " C5/1 D5/.5 C5/.5 B4/.5 A4/.5 B4/1 C5/.5 B4/.5 A4/.5 G4/.5 F#4/1 G4/.5 A4/.5 B4/.5 G4/.5 A4/3 "
        + minA + " C5/1 D5/.5 C5/.5 B4/.5 A4/.5 B4/1 C5/.5 B4/.5 A4/.5 G4/.5 A4/1 B4/.5 A4/.5 G4/.5 F#4/.5 G4/3"),
      lh: S("G2/3 G2/3 C3/3 G2/3 C3/3 G2/3 D3/3 D3/3 G2/3 G2/3 C3/3 G2/3 C3/3 G2/3 D3/3 G2/3"),
    },
    greensleeves: {
      name: "Greensleeves", note: "Traditional English · public domain · 3/4 version", bpm: 96, tag: "FOLK",
      level: "Medium", beatsPerBar: 3,
      rh: S("R/2 A4/1 " + gsA + " C5/2 A4/1 A4/1.5 G#4/.5 A4/1 B4/2 G#4/1 E4/2 A4/1 "
        + gsA + " C5/1.5 B4/.5 A4/1 G#4/1.5 F#4/.5 G#4/1 A4/3"),
      lh: S("R/3 A2/3 G2/3 E3/3 G2/3 A2/3 A2/3 E3/3 A2/3 A2/3 G2/3 E3/3 G2/3 A2/3 E3/3 A2/3"),
    },
    morning: {
      name: "Morning Mood", note: "Grieg (Peer Gynt) · public domain · opening theme, moved to G major", bpm: 96, tag: "ROMANTIC",
      level: "Medium", beatsPerBar: 3,
      rh: S([mmP, mmP, "D5/.5 B4/.5 D5/.5 E5/.5 B4/.5 E5/.5", mmP, mmP, "D5/.5 B4/.5 D5/.5 E5/.5 B4/.5 E5/.5", "D5/.5 B4/.5 A4/.5 G4/1.5", "G4/3"].join(" ")),
      lh: S("G2/3 G2/3 C3/3 G2/3 G2/3 C3/3 D3/3 G2/3"),
    },
    canon: {
      name: "Canon (Pachelbel)", note: "Pachelbel · public domain · simplified, moved to C major", bpm: 72, tag: "BAROQUE",
      level: "Medium",
      rh: S("E5/2 D5/2 C5/2 B4/2 A4/2 G4/2 A4/2 B4/2 "
        + "E5 E5 D5 D5 C5 C5 B4 B4 A4 A4 G4 G4 A4 A4 B4 B4 "
        + "C5/.5 E5/.5 G5/.5 E5/.5 G4/.5 B4/.5 D5/.5 B4/.5 A4/.5 C5/.5 E5/.5 C5/.5 G4/.5 B4/.5 E5/.5 B4/.5 "
        + "F4/.5 A4/.5 C5/.5 A4/.5 E4/.5 G4/.5 C5/.5 G4/.5 F4/.5 A4/.5 C5/.5 A4/.5 G4/.5 B4/.5 D5/.5 B4/.5 C5/4"),
      lh: S(rep(canonBass, 3) + " C3/4"),
    },
    lastChristmasChords: {
      name: "Last Christmas (chords)", note: "Chords and bass only · Cmaj7, Am7, Dm9, G7 · no melody", bpm: 86, tag: "SEASONAL",
      level: "Hard",
      rh: S(rep(lcRh, 2) + " G3+B3+C4+E4/4"),
      lh: S(rep(lcLh, 2) + " C3/4"),
    },
  };
})();
