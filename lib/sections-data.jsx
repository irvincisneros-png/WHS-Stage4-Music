/* Per-section extras: extended content, interactive component, CC image
   credits. Keyed as "topicId/sectionIndex".

   Interactives reference the components registered onto window by
   section-bits.jsx (and existing ones like ClefTrainer). The image URLs
   are Wikimedia Commons thumbnails (CC-BY-SA / public-domain). If any
   fail to load they fall back to a styled placeholder rendered by
   <SectionImage> in section-page.jsx.

   Each entry can include:
     image: { src, alt, credit, license, link }
     longread: array of {h, p} for additional reading blocks
     try: array of one or more interactives to embed
       · { kind: "name-on-window", props: {...}, intro: "Above this widget" }
     facts: small list of factoid chips
*/

const SECTION_EXTRAS = {

  /* ============================================================
     Year 7 · y7-intro · Foundations
     ============================================================ */
  "y7-intro/0": {
    image: {
      kind: "concept",
      eyebrow: "Element · The whole frame",
      title: "What counts as music?",
      tagline: "Organised sound in time: singing, gamelan, drill, gregorian chant, all of it.",
      terms: ["Organised sound", "Six elements"],
      alt: "What counts as music? Organised sound in time: singing, gamelan, drill, gregorian chant, all of it.",
      visual: {"kind":"chips","cols":3,"items":[{"big":"Duration","small":"TIME"},{"big":"Pitch","small":"HIGH/LOW"},{"big":"Dynamics","small":"VOLUME"},{"big":"Timbre","small":"& MEDIA"},{"big":"Texture","small":"LAYERS"},{"big":"Structure","small":"FORM"}]},
    },
    longread: [
      { h: "Organised sound",
        p: "Not every sound is music. A car engine, rain on a tin roof, a fridge humming: they're all sound but most listeners wouldn't call them music. What turns sound into music is organisation: someone made decisions about pitch, time, dynamics and tone. The same hum becomes music the moment a composer loops it under a melody and calls it Track 1." },
      { h: "Why one definition for everything?",
        p: "It's tempting to define music as 'tunes' or 'singing' but that excludes huge traditions. A 5-hour gamelan performance, a Yothu Yindi clapstick groove, a Cage prepared-piano piece, a Stormzy drill track: they're all music. The six-element framework was designed to describe any music, anywhere. That's why we use it." },
    ],
    try: [
      { kind: "SectionMCQ", props: {
          title: "Is this music?",
          items: [
            { q: "Which is the BEST definition of music?",
              options: ["A nice tune", "Organised sound in time", "Anything you can dance to", "Notes on a stave"],
              a: "Organised sound in time",
              because: "Includes singing, EDM, gamelan, gregorian chant, modern composition. Anything organised in time qualifies." },
            { q: "Which of the six elements is about HOW LONG sounds last?",
              options: ["Pitch", "Duration", "Texture", "Dynamics"],
              a: "Duration",
              because: "Duration covers beat, rhythm, tempo and metre." },
            { q: "If two recordings have the same pitches and same rhythm but different INSTRUMENTS, which element is different?",
              options: ["Pitch", "Duration", "Performing media & timbre", "Structure"],
              a: "Performing media & timbre",
              because: "Performing media & timbre (tone colour) is the 'flavour' that lets you tell a flute from a trumpet at the same pitch." },
          ],
        } },
    ],
  },
  "y7-intro/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Duration",
      title: "Beat & rhythm",
      tagline: "Two layers, one piece. Tap the steady beat with your foot, clap the rhythm on top.",
      terms: ["Beat", "Rhythm", "Subdivision"],
      alt: "Beat and rhythm: two layers, one piece. Tap the steady beat with your foot, clap the rhythm on top.",
      visual: {"kind":"beatRhythm"},
    },
    longread: [
      { h: "Two layers, one piece",
        p: "Beat is the steady, unchanging foundation. Rhythm is everything else: every clap, syllable, kick drum, melodic note. If you stomp the beat with your foot and clap the rhythm of a song's vocals with your hands, you'll feel the two layers separately. Most students who 'lose the beat' have actually started chasing the rhythm and dropped the foundation." },
      { h: "Subdivisions",
        p: "Once the beat is solid, you can divide it. Two equal halves of a beat = quavers. Four equal quarters = semiquavers. Triplets sit three to a beat. Almost every groove you've ever heard is one of these subdivisions played against the beat." },
    ],
    try: [
      { kind: "SectionTapPulse", props: { bpm: 90, label: "Tap a steady beat at 90 BPM" } },
    ],
  },
  "y7-intro/2": {
    image: {
      src: "assets/graphic-notation.svg",
      alt: "Hand-drawn graphic notation: a one-minute piece for three voices and one object.",
      credit: "Illustration for Stage 4 Music",
      license: "CC0, public domain",
      link: "https://en.wikipedia.org/wiki/Graphic_notation_(music)",
    },
    longread: [
      { h: "Why graphic notation?",
        p: "Some sounds simply don't fit on a five-line staff. A vocal pop, a scrape across a desk, a yidaki drone, a click of fingernails on glass: they have no traditional pitch. Composers like Cornelius Cardew, Cathy Berberian and John Cage drew shapes, lines and pictures instead. A circle might mean a swell, a zig-zag might mean a tremolo. The performer reads the symbols and decides how to interpret them. That makes every performance unique." },
    ],
    try: [
      { kind: "SectionGraphicScore", props: {}, intro: "Draw a 10-second piece. Click on the canvas to drop sounds. Time flows left to right." },
    ],
  },

  /* ============================================================
     Year 7 · y7-drums · Drums
     ============================================================ */
  "y7-drums/0": {
    image: [
      {
        src: "assets/drum-kit-5piece.svg",
        alt: "A 5-piece drum kit: kick, snare, two rack toms, floor tom, plus hi-hat, ride and crash cymbals.",
        credit: "Illustration for Stage 4 Music",
        license: "CC0, public domain",
        link: "https://en.wikipedia.org/wiki/Drum_kit",
      },
      {
        src: "assets/drums/kit-5piece-photo.jpg",
        alt: "A professional 5-piece drum kit (kick, snare, hi-tom, mid-tom and floor tom, plus hi-hat, ride and crash cymbals) photographed from the drummer's perspective.",
        license: "Generated, Nano Banana 2.0",
      }
    ],
    longread: [
      { h: "Anatomy of a 5-piece",
        p: "A 5-piece kit usually means five DRUMS, not five pieces total. Cymbals are extra. The five drums are: kick, snare, hi-tom, mid-tom and floor tom. Cymbals on top are typically hi-hat (paired, controlled by a foot pedal), ride (big, used for steady patterns) and crash (loud accent)." },
      { h: "Sound production",
        p: "Each drum is a tensioned membrane (a 'head') stretched over a hollow shell. Cymbals are flat metal discs. Hitting them sets the membrane or disc vibrating, the shell or air column shapes the sound, and your stick choice (wood vs felt, light vs heavy) changes the attack." },
    ],
  },
  "y7-drums/1": {
    image: {
      src: "assets/note-values-mnemonics.svg",
      alt: "Note values with school food/drink mnemonics: crotchet = Tea, two quavers = Coff-ee, four semiquavers = Co-ca Co-la, mixed groups = Straw-ber-ry and Ber-ry Straw, minim = Ee-eh, crotchet rest = silent.",
      credit: "Illustration for Stage 4 Music, Woonona High mnemonics",
      license: "CC0, public domain",
      link: "https://en.wikipedia.org/wiki/Note_value",
    },

    longread: [
      { h: "Rest values",
        p: "Every note value has a matching rest value of the same length. A crotchet rest looks like a squiggle, a minim rest sits on a line, a semibreve rest hangs under one. Rests aren't 'nothing'. They're an active musical decision. A well-placed rest can carry more weight than the loudest note in a piece." },
      { h: "Counting subdivisions",
        p: "Crotchets = 1, 2, 3, 4. Quavers = 1-and-2-and-3-and-4-and. Semiquavers = 1-e-and-a, 2-e-and-a, 3-e-and-a, 4-e-and-a. Practise saying it out loud while tapping your foot. Drummers count constantly, even when they're not playing." },
    ],
    try: [
      { kind: "SectionNoteValues", props: { bpm: 80 } },
    ],
  },
  "y7-drums/2": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Drums",
      title: "The rock groove",
      tagline: "Kick on 1 & 3, snare on 2 & 4, hats steady on the 8ths. The most-played pattern in popular music.",
      terms: ["Backbeat", "Kick / snare / hat"],
      alt: "The rock groove. Kick on 1 & 3, snare on 2 & 4, hats steady on the 8ths. The most-played pattern in popular music.",
      visual: {"kind":"groove","steps":8,"rows":[{"label":"HAT","pattern":[1,1,1,1,1,1,1,1]},{"label":"SNARE","pattern":[0,0,1,0,0,0,1,0]},{"label":"KICK","pattern":[1,0,0,0,1,0,0,0]}]},
    },
    try: [
      { intro: "Below is the most-played pattern in popular music. Try adding an open hi-hat or an extra kick to make it yours.",
        kind: "SectionStepGrid", props: {
          bpm: 100, steps: 8, title: "Rock groove builder",
          rows: [
            { label: "Hi-hat", color: "#9c9c9c", play: () => window.MusicAudio?.playHat(false) },
            { label: "Snare",  color: "var(--butter-d)", play: () => window.MusicAudio?.playSnare() },
            { label: "Kick",   color: "var(--espresso)", play: () => window.MusicAudio?.playKick() },
          ],
          preset: [
            [true, true, true, true, true, true, true, true],   // hi-hat steady 8ths
            [false, false, true, false, false, false, true, false], // snare 2 & 4
            [true, false, false, false, true, false, false, false], // kick 1 & 3
          ],
        } },
    ],
  },
  "y7-drums/3": {
    image: [
      {
        src: "assets/safe-drumming.svg",
        alt: "Two-panel illustration: a musician's ear plug worn in the ear, and a hand demonstrating matched grip at the drumstick's balance point.",
        credit: "Illustration for Stage 4 Music",
        license: "CC0, public domain",
        link: "https://en.wikipedia.org/wiki/Drumming_technique",
      },
      {
        src: "assets/drums/matched-grip.jpg",
        alt: "Both hands holding drumsticks in correct matched grip above a snare drum, sticks balanced at the fulcrum point, fingers relaxed.",
        license: "Generated, Nano Banana 2.0",
      }
    ],

    longread: [
      { h: "Hearing damage is permanent",
        p: "Loud drumming over years adds up. Use foam, silicone or electronic ear plugs (musician's plugs reduce volume evenly across frequencies; cheap foam plugs muffle the highs). Many pro drummers wear plugs at every practice. There's nothing tough about losing the top two octaves of your hearing by 30." },
      { h: "Grip and posture",
        p: "Two main grips: matched (both hands hold the stick the same way) and traditional (left hand underhand, an old marching-band hold). Most modern drumming is matched grip. Hold the stick at its balance point, relax your fingers, let the stick bounce. Sit with your knees just above hip height so your foot is loose on the pedal." },
    ],
    try: [
      { kind: "SectionMCQ", props: {
          title: "Safe-technique check",
          items: [
            { q: "What's the main reason drummers wear ear plugs?",
              options: ["To look professional", "To prevent permanent hearing loss", "To hear the click track better", "It's a school rule"],
              a: "To prevent permanent hearing loss",
              because: "Sustained loud exposure permanently damages hair cells in the inner ear. There's no fix." },
            { q: "Which grip is most common today?",
              options: ["Matched grip", "Traditional grip", "Pencil grip", "Pinch grip"],
              a: "Matched grip",
              because: "Both hands the same. Easier to learn, plays all genres." },
          ],
        } },
    ],
  },

  /* ============================================================
     Year 7 · y7-singing · Singing
     ============================================================ */
  "y7-singing/0": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Singing",
      title: "How your voice works",
      tagline: "Air through two vibrating folds in the larynx, shaped by throat, mouth and chest into a vowel.",
      terms: ["Vocal folds", "Resonance", "Tessitura"],
      alt: "How your voice works. Air through two vibrating folds in the larynx, shaped by throat, mouth and chest into a vowel.",
      visual: {"kind":"chips","cols":2,"items":[{"big":"Diaphragm","small":"POWER"},{"big":"Vocal folds","small":"VIBRATE"},{"big":"Throat / mouth","small":"RESONATE"},{"big":"Vowel shape","small":"FORMANTS"}]},
    },
    longread: [
      { h: "How your voice actually works",
        p: "When you sing, air from your lungs pushes through two folds of tissue in your larynx (vocal folds). The folds vibrate and chop the airstream into pulses. That's the buzz. Your throat, mouth, sinuses and chest then shape that buzz into a vowel. Every voice is different because every body is different." },
      { h: "Why 'tone deaf' is a myth",
        p: "Less than 5% of the population has true amusia (a brain condition that makes pitch genuinely hard to perceive). The other 95% who think they 'can't sing' just haven't practised. Pitch matching is a muscle. Sing with people who can sing, sing along to recordings, sing in the shower. It gets better." },
    ],
    try: [
      { kind: "SectionMCQ", props: {
          title: "Voice basics",
          items: [
            { q: "What part of you vibrates to make sound when you sing?",
              options: ["Tongue", "Vocal folds", "Cheeks", "Teeth"],
              a: "Vocal folds",
              because: "Air pushes between two folds in the larynx. The folds vibrate, chopping the airstream into the buzz you hear as pitch." },
            { q: "What does 'tessitura' mean?",
              options: ["Highest note you can sing", "Lowest note you can sing", "Where your voice sits comfortably", "A type of warm-up"],
              a: "Where your voice sits comfortably",
              because: "Range is your full span; tessitura is where you can sit comfortably for a long time." },
          ],
        } },
    ],
  },
  "y7-singing/1": {
    image: [
      {
        src: "assets/vocal-warmups.svg",
        alt: "Vocal warm-up reference: a singer in good posture plus six exercises (lip trill, sirens, yawn-sigh, humming, vowel shapes mee-may-mah-moh-moo and box breath).",
        credit: "Illustration for Stage 4 Music",
        license: "CC0, public domain",
        link: "https://en.wikipedia.org/wiki/Vocal_warm_up",
      },
      {
        src: "assets/singing/posture-breath.jpg",
        alt: "A student singer demonstrating correct upright posture: shoulders relaxed and back, chin level, hands at sides, ready to sing.",
        license: "Generated, Nano Banana 2.0",
      }
    ],

    longread: [
      { h: "Why warm-ups?",
        p: "Cold muscles tear. Cold vocal folds get sore quickly, especially if you push them. Five minutes of warm-up before a rehearsal is enough to make a real difference. Then water (room temperature, not freezing), good sleep, and rest after illness. Those are the rest of the picture." },
    ],
    try: [
      { kind: "SectionBreath", props: {} },
    ],
  },
  "y7-singing/2": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Singing",
      title: "Find your home key",
      tagline: "Sing the chorus first. Move the key until the highest note is comfortable and the lowest is still audible.",
      terms: ["Range", "Tessitura", "Transposition"],
      alt: "Find your home key. Sing the chorus first. Move the key until the highest note is comfortable and the lowest is still audible.",
      visual: {"kind":"keys","octaves":2,"highlight":["C","G","D"],"labels":[{"x":25,"y":9,"t":"LOW"},{"x":285,"y":9,"t":"HIGH"}],"label":"FIND THE COMFY MIDDLE"},
    },

    longread: [
      { h: "Find your home key",
        p: "When learning a song, sing the chorus first. Find a key where the highest note is comfortable and the lowest note is still audible. Anything outside that is fine for one big moment, but if a whole verse sits there you'll get tired fast. Apps like Capo or even the YouTube speed/pitch slider let you nudge the key up or down by one or two semitones." },
    ],
    try: [
      { kind: "SectionMiniKeys", props: { startMidi: 48, octaves: 3, highlight: ["C","G"], labelMode: "letters" }, intro: "A 3-octave keyboard. Click any key to hear it. Find the comfortable middle of your range." },
    ],
  },
  "y7-singing/3": {
    image: {
      kind: "concept",
      eyebrow: "Element · Dynamics",
      title: "Dynamics in performance",
      tagline: "Loud isn't always strong, soft isn't always weak. Volume is a storytelling tool.",
      terms: ["pp · p · mp", "mf · f · ff", "Crescendo"],
      alt: "Dynamics in performance. Loud isn't always strong, soft isn't always weak. Volume is a storytelling tool.",
      visual: {"kind":"dynamics"},
    },

    try: [
      { kind: "SectionDynamics", props: {} },
    ],
  },

  /* ============================================================
     Year 7 · y7-notation · Reading Music
     ============================================================ */
  "y7-notation/0": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch",
      title: "The five-line staff",
      tagline: "Five lines, four spaces. Every note in Western notation lives on or between them.",
      terms: ["Lines & spaces", "Ledger lines"],
      alt: "The five-line staff. Five lines, four spaces. Every note in Western notation lives on or between them.",
      visual: {"kind":"staff","clef":"treble","notes":[{"n":"E4","label":"E"},{"n":"G4","label":"G"},{"n":"B4","label":"B"},{"n":"D5","label":"D"},{"n":"F5","label":"F"}],"label":"EVERY GOOD BOY DESERVES FRUIT"},
    },
    try: [
      { kind: "SectionMiniStaff", props: { clef: "treble" } },
    ],
  },
  "y7-notation/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Treble",
      title: "The treble clef",
      tagline: "Stylised letter G. Its curl wraps the G line. Every other note counts from there.",
      terms: ["E G B D F", "F A C E"],
      alt: "The treble clef. Stylised letter G. Its curl wraps the G line. Every other note counts from there.",
      visual: {"kind":"staff","clef":"treble","notes":[{"n":"F4","label":"F"},{"n":"A4","label":"A"},{"n":"C5","label":"C"},{"n":"E5","label":"E"}],"label":"SPACES: F  A  C  E"},
    },
    longread: [
      { h: "Why 'G clef'?",
        p: "The treble clef started life as a stylised letter G (look closely and you can still see it). The curl of the clef wraps around the second line from the bottom, which is therefore G4 (the G above middle C). Every other note is countable from there." },
      { h: "Mnemonics that actually help",
        p: "Lines (bottom up): Every Good Boy Deserves Fruit (E G B D F). Spaces (bottom up): F A C E. Use them while learning, drop them once you've memorised the staff. Real readers don't think 'Every Good Boy'. They just see E." },
    ],
    try: [
      { kind: "SectionMiniStaff", props: { clef: "treble" }, intro: "Click any note to hear it. The lines and spaces are listed below the staff." },
    ],
  },
  "y7-notation/2": {
    image: {
      kind: "concept",
      eyebrow: "Element · Duration",
      title: "Reading note values",
      tagline: "Semibreve, minim, crotchet, quaver, semiquaver. Each is half the length of the one above.",
      terms: ["1 / ½ / ¼", "Rests match"],
      alt: "Reading note values. Semibreve, minim, crotchet, quaver, semiquaver, each half the length of the one above.",
      visual: {"kind":"noteValues"},
    },

    try: [
      { kind: "SectionNoteValues", props: { bpm: 80 } },
    ],
  },
  "y7-notation/3": {
    image: {
      kind: "concept",
      eyebrow: "Element · Duration · Metre",
      title: "Time signatures",
      tagline: "Top number = beats per bar. Bottom number = which note value gets the beat.",
      terms: ["4/4", "3/4 waltz", "6/8"],
      alt: "Time signatures. Top number = beats per bar. Bottom number = which note value gets the beat.",
      visual: {"kind":"timeSig","sigs":[{"s":"4/4","feel":"Common"},{"s":"3/4","feel":"Waltz"},{"s":"6/8","feel":"Lilt"}]},
    },
    try: [
      { kind: "SectionMCQ", props: {
          title: "Reading the time signature",
          items: [
            { q: "What does the TOP number of a time signature tell you?",
              options: ["How fast to play", "How many beats per bar", "Which note gets one beat", "How loud to play"],
              a: "How many beats per bar",
              because: "Top = count of beats. Bottom = which note value gets one beat." },
            { q: "Which time signature gives a waltz feel?",
              options: ["4/4", "3/4", "6/8", "2/4"],
              a: "3/4",
              because: "Three crotchet beats per bar, stressed ONE-two-three. That's the waltz." },
            { q: "6/8 has how many quavers per bar?",
              options: ["Three", "Four", "Six", "Eight"],
              a: "Six",
              because: "Top = 6 (count), bottom = 8 (quaver gets the beat). Six quavers grouped in two big beats." },
          ],
        } },
    ],
  },

  /* ============================================================
     Year 7 · y7-composition · Composition
     ============================================================ */
  "y7-composition/0": {
    image: {
      kind: "concept",
      eyebrow: "Composition · Building blocks",
      title: "Build a 4-bar loop",
      tagline: "The smallest unit of any song you've ever loved. Drums, bass, chords, melody: in that order.",
      terms: ["Loop", "Layer order"],
      alt: "Build a 4-bar loop. The smallest unit of any song you've ever loved. Drums, bass, chords, melody: in that order.",
      visual: {"kind":"groove","steps":8,"rows":[{"label":"MELODY","pattern":[1,0,1,0,1,1,0,1]},{"label":"CHORDS","pattern":[1,0,0,0,1,0,0,0]},{"label":"BASS","pattern":[1,0,0,0,1,0,0,0]},{"label":"DRUMS","pattern":[1,0,1,0,1,0,1,0]}]},
    },
    try: [
      { intro: "Build a 4-bar loop. The simplest building block of any track you've ever loved.",
        kind: "SectionStepGrid", props: {
          bpm: 96, steps: 8, title: "4-bar loop builder",
          rows: [
            { label: "Hat",   color: "#9c9c9c",     play: () => window.MusicAudio?.playHat(false) },
            { label: "Snare", color: "var(--butter-d)", play: () => window.MusicAudio?.playSnare() },
            { label: "Kick",  color: "var(--espresso)", play: () => window.MusicAudio?.playKick() },
            { label: "Bass",  color: "var(--teal)",  play: () => window.MusicAudio?.playPluck("C3", 0.6) },
            { label: "Lead",  color: "var(--terracotta)", play: () => window.MusicAudio?.playPiano("E5", 0.4, 0.6) },
          ],
        } },
      { intro: "Before you compose, improvise. Start the groove and play the scale pads (or keyboard keys A–J) to make up a melody in the moment. Every note in the scale fits, so there are no wrong notes. Improvising is part of MU4-COM-01.",
        kind: "ImprovLab", props: { scale: "pentatonic", bpm: 92 } },
    ],
  },
  "y7-composition/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Texture",
      title: "Layering textures",
      tagline: "Monophonic, homophonic, polyphonic. How many layers are sounding, and how do they relate?",
      terms: ["Mono", "Homo", "Poly"],
      alt: "Layering textures. Monophonic, homophonic, polyphonic. How many layers are sounding, and how do they relate?",
      visual: {"kind":"texture","mode":"poly"},
    },

    try: [
      { kind: "SectionTextureToggles", props: {} },
    ],
  },
  "y7-composition/2": {
    image: {
      kind: "concept",
      eyebrow: "Element · Structure",
      title: "Song form & arrangement",
      tagline: "Intro · Verse · Chorus · Verse · Chorus · Bridge · Chorus · Outro. A scaffold you can re-use forever.",
      terms: ["Verse / Chorus", "Bridge"],
      alt: "Song form and arrangement. Intro · Verse · Chorus · Verse · Chorus · Bridge · Chorus · Outro. A scaffold you can re-use forever.",
      visual: {"kind":"form"},
    },

    try: [
      { kind: "SectionFormBuilder", props: {} },
    ],
  },
  "y7-composition/3": {
    image: {
      kind: "concept",
      eyebrow: "Composition · Process",
      title: "The composer's journal",
      tagline: "What you kept, what you cut and why, what you were listening to. Examiners mark the reasoning.",
      terms: ["Decisions", "Reflection"],
      alt: "The composer's journal. What you kept, what you cut and why, what you were listening to. Examiners mark the reasoning.",
      visual: {"kind":"journal"},
    },

    longread: [
      { h: "What goes in a journal",
        p: "Three things, briefly. (1) What you tried that you kept. (2) What you tried that you cut, and why. (3) What you were listening to that influenced you. One page is plenty. Examiners read journals to verify the process behind the audio, checking you actually made the decisions." },
    ],
    try: [
      { kind: "SectionMCQ", props: {
          title: "Journal sanity check",
          items: [
            { q: "Which entry is most useful in a Composer's Journal?",
              options: [
                "'I made a song'",
                "'I tried a 6/8 feel but cut it because it didn't fit the chorus'",
                "'I spent 3 hours on this'",
                "'It sounds good'",
              ],
              a: "'I tried a 6/8 feel but cut it because it didn't fit the chorus'",
              because: "Specific decisions and reasoning are what examiners can mark. Vague claims aren't." },
          ],
        } },
    ],
  },

  /* ============================================================
     Year 7 · y7-guitar · Guitar
     ============================================================ */
  "y7-guitar/2": {
    image: [
      {
        kind: "concept",
        eyebrow: "Performance · Guitar",
        title: "The five open chords",
        tagline: "Em, G, C, D, A. Learn these five shapes and you can fake your way through most of pop and rock.",
        terms: ["Em · G · C · D · A"],
        alt: "The five open chords. Em, G, C, D, A. Learn these five shapes and you can fake your way through most of pop and rock.",
        visual: {"kind":"chords","chords":[{"name":"Em","frets":"0-2-2-0-0-0"},{"name":"G","frets":"3-2-0-0-0-3"},{"name":"C","frets":"x-3-2-0-1-0"},{"name":"D","frets":"x-x-0-2-3-2"},{"name":"A","frets":"x-0-2-2-2-0"}]},
      },
      {
        src: "assets/guitar/open-chord-hand.jpg",
        alt: "A guitarist's left hand forming an open G major chord on an acoustic guitar, fingers pressing cleanly on the fretboard with the thumb behind the neck.",
        license: "Generated, Nano Banana 2.0",
      }
    ],
    try: [
      { kind: "SectionChordPicker", props: {
          title: "The five open chords",
          chords: [
            { name: "Em", sub: "0-2-2-0-0-0", notes: ["E2","B2","E3","G3","B3","E4"], color: "var(--teal)" },
            { name: "G",  sub: "3-2-0-0-0-3", notes: ["G2","B2","D3","G3","B3","G4"], color: "var(--terracotta)" },
            { name: "C",  sub: "x-3-2-0-1-0", notes: ["C3","E3","G3","C4","E4"], color: "var(--butter-d)" },
            { name: "D",  sub: "x-x-0-2-3-2", notes: ["D3","A3","D4","F#4"], color: "var(--espresso)" },
            { name: "A",  sub: "x-0-2-2-2-0", notes: ["A2","E3","A3","C#4","E4"], color: "#7c4a7e" },
          ],
        } },
    ],
  },
  "y7-guitar/1": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Guitar",
      title: "Reading a chord diagram",
      tagline: "Dots = fingers. Numbers = which finger. X = mute. O = open. Top bar = the nut.",
      terms: ["Dots & numbers", "X / O"],
      alt: "Reading a chord diagram. Dots = fingers. Numbers = which finger. X = mute. O = open. Top bar = the nut.",
      visual: {"kind":"chords","chords":[{"name":"G","frets":"3-2-0-0-0-3","sub":"3-2-0-0-0-3"},{"name":"C","frets":"x-3-2-0-1-0","sub":"x = mute · 0 = open"}]},
    },
    longread: [
      { h: "Reading the dots",
        p: "Each dot in a chord diagram is a finger. The number inside (if any) tells you WHICH finger. 1 = index, 2 = middle, 3 = ring, 4 = little. Above the diagram, 'X' over a string means don't play it. 'O' means play it open (no finger). At the top, a thick black bar shows the nut, the metal strip at the top of the guitar." },
    ],
    try: [
      { intro: "An annotated chord diagram with labelled parts (nut, frets, finger dots, X/O markers) and the finger-number key. Toggle the labels, switch between the five open chords, and tap ▶ to hear each one.",
        kind: "SectionChordChart", props: {} },
    ],
  },
  "y7-guitar/3": {
    image: [
      {
        kind: "concept",
        eyebrow: "Performance · Guitar",
        title: "Strumming patterns",
        tagline: "Down, down, up, down, up. Leave one strum out and the syncopation appears.",
        terms: ["Down / up", "Syncopation"],
        alt: "Strumming patterns. Down, down, up, down, up. Leave one strum out and the syncopation appears.",
        visual: {"kind":"strum","pattern":["D","D","u","D","u","D","u"]},
      },
      {
        src: "assets/guitar/strumming-hand.jpg",
        alt: "A guitarist's right hand mid-strum on a steel-string acoustic guitar. Hand relaxed and loose, fingers slightly fanned, caught on the downstroke across the soundhole.",
        license: "Generated, Nano Banana 2.0",
      }
    ],

    try: [
      { intro: "A simple strum pattern as a step grid. Each cell is a down strum. Try removing one to feel the syncopation.",
        kind: "SectionStepGrid", props: {
          bpm: 110, steps: 8, title: "Strum pattern",
          rows: [
            { label: "Strum", color: "var(--terracotta)", play: () => window.MusicAudio?.playChord(["E2","G2","B2","E3","G3","B3"], 0.6, 0.5) },
          ],
          preset: [
            [true, true, false, true, true, false, true, true],
          ],
        } },
    ],
  },
  "y7-guitar/0": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Tab",
      title: "Reading guitar tab",
      tagline: "Six lines for six strings, numbers are fret positions, but tab almost never tells you the rhythm.",
      terms: ["6 strings", "Fret numbers"],
      alt: "Reading guitar tab. Six lines for six strings, numbers are fret positions, but tab almost never tells you the rhythm.",
      visual: {"kind":"tab"},
    },
    try: [
      { intro: "An interactive tab reader. Pick an example, then press play. The highlighted note moves through the tab and lights up the matching fret on the guitar neck. You can also step through one note at a time or click any number to jump to it.",
        kind: "SectionTabReader", props: {} },
      { kind: "SectionMCQ", props: {
          title: "Tab reading",
          items: [
            { q: "On guitar tab, what does each LINE represent?",
              options: ["A finger", "A string", "A bar of music", "A chord"],
              a: "A string",
              because: "Six strings → six lines. The bottom line is the lowest-pitched (thickest) string." },
            { q: "A '5' on the third line down means…",
              options: ["Play fret 5 on the third string", "Strum 5 times", "Hold for 5 beats", "Play at 5 BPM"],
              a: "Play fret 5 on the third string",
              because: "Numbers in tab are FRET numbers, not finger numbers." },
            { q: "What does tab NOT tell you?",
              options: ["Which fret to play", "Which string", "The rhythm", "The string number"],
              a: "The rhythm",
              because: "That's tab's big limitation. You usually have to know the song to play it correctly." },
          ],
        } },
    ],
  },

  /* ============================================================
     Year 7 · y7-listening · Listening in Context
     ============================================================ */
  "y7-listening/0": {
    image: [
      {
        kind: "concept",
        eyebrow: "Listening · Method",
        title: "Active listening",
        tagline: "One element per pass. Texture · structure · timbre · dynamics. By pass four you'll hear what you missed.",
        terms: ["One element / pass"],
        alt: "Active listening. One element per pass. Texture · structure · timbre · dynamics. By pass four you'll hear what you missed.",
        visual: {"kind":"passes"},
      },
      {
        src: "assets/context/band-rehearsal.jpg",
        alt: "A band rehearsal room with drum kit, guitar amplifiers, keyboard and microphone set up and ready, room empty.",
        license: "Generated, Nano Banana 2.0",
      }
    ],
    longread: [
      { h: "One element per pass",
        p: "Active listening means going through a track multiple times, listening for only one thing each time. Pass 1: texture. Pass 2: structure. Pass 3: timbre. Pass 4: dynamics. By the fourth pass you'll hear things you missed the first three. This is how examiners listen, and it's a learnable skill." },
    ],
    try: [
      { intro: "Rhythm dictation, Woonona-style. Use the school mnemonics (tea, coff·ee, straw·ber·ry, ber·ry·straw, shh) to label each beat. You hear a 4-beat count-in, then a 4-beat rhythm; tap a mnemonic to audition it, then build your answer.",
        kind: "SectionRhythmDictation", props: { bpm: 76 } },
      { intro: "Pitch discrimination, the school's way: hear a reference note, then three more notes one after another. For each new note, decide if it's higher than, the same as, or lower than the note just before it.",
        kind: "SectionHighSameLow", props: {} },
      { kind: "SectionMCQ", props: {
          title: "Active vs passive",
          items: [
            { q: "Which is an ACTIVE-listening habit?",
              options: ["Playing the song while you do homework", "Listening once and writing what you remember", "Listening four times, focusing on one element each time", "Letting Spotify autoplay"],
              a: "Listening four times, focusing on one element each time",
              because: "Element-by-element passes is how you extract precise detail." },
            { q: "In a rhythm dictation, the count-in (the 4 clicks before the rhythm starts) is for…",
              options: ["Padding out the recording", "Locking your sense of the beat before the rhythm arrives", "Marking the end of the test", "Tuning your instrument"],
              a: "Locking your sense of the beat before the rhythm arrives",
              because: "Without an internal pulse you can't notate the rhythm against it. The count-in sets that pulse." },
          ],
        } },
    ],
  },
  "y7-listening/1": {
    image: {
      kind: "concept",
      eyebrow: "Listening · Vocabulary",
      title: "Words that earn marks",
      tagline: "Monophonic, ostinato, crescendo, staccato. Technical first, then describe feeling.",
      terms: ["Ostinato", "Crescendo", "Staccato"],
      alt: "Words that earn marks. Monophonic, ostinato, crescendo, staccato. Technical first, then describe feeling.",
      visual: {"kind":"chips","cols":3,"items":[{"big":"Ostinato"},{"big":"Crescendo"},{"big":"Staccato"},{"big":"Polyphonic"},{"big":"Syncopation"},{"big":"Motif"}]},
    },

    longread: [
      { h: "Vocabulary check",
        p: "Words that earn marks: monophonic, homophonic, polyphonic, crescendo, diminuendo, sforzando, accelerando, ritardando, legato, staccato, syncopation, ostinato, motif. Words that don't: cool, good, weird, sad, energetic. The second list isn't wrong, it's just not technical. Use the technical words FIRST then describe feeling." },
    ],
    try: [
      { intro: "Listen to a short phrase and describe it in technical language. Each phrase has a deliberate combination of texture, articulation, dynamic, tempo and tonality. Your job is to name them. This is the core skill of every aural exam.",
        kind: "SectionListenAndLabel", props: {} },
      { intro: "Lock in the vocabulary before you go any further. Click a term, then click its meaning.",
        kind: "SectionVocabMatcher", props: {} },
      { kind: "SectionMCQ", props: {
          title: "Pick the precise term",
          items: [
            { q: "The volume gradually increases. The term is…",
              options: ["Ritardando", "Crescendo", "Staccato", "Ostinato"],
              a: "Crescendo",
              because: "Crescendo = getting louder. Ritardando = slowing down." },
            { q: "A short, repeating musical idea (like the riff in Seven Nation Army). The term is…",
              options: ["Ostinato", "Crescendo", "Cadence", "Tessitura"],
              a: "Ostinato",
              because: "Ostinato = a short pattern that repeats persistently." },
            { q: "The notes are short and detached. The term is…",
              options: ["Legato", "Staccato", "Forte", "Polyphonic"],
              a: "Staccato",
              because: "Staccato = detached. Legato = smooth and connected." },
            { q: "Two or more independent melodies sounding at the same time is called…",
              options: ["Monophonic", "Homophonic", "Polyphonic", "Heterophonic"],
              a: "Polyphonic",
              because: "Poly = many; phon = sound. Multiple independent melodies layered together." },
          ],
        } },
    ],
  },
  "y7-listening/2": {
    image: [
      {
        kind: "concept",
        eyebrow: "Listening · Context · ICIP",
        title: "Music in context",
        tagline: "A Songline, a Mass, a K-pop hit. The function shapes the sound. Name the context before you describe.",
        terms: ["Function", "ICIP protocols"],
        alt: "Music in context. A Songline, a Mass, a K-pop hit. The function shapes the sound. Name the context before you describe.",
        visual: {"kind":"chips","cols":3,"items":[{"big":"Songline","small":"ON COUNTRY"},{"big":"Mass","small":"LITURGY"},{"big":"K-pop","small":"STREAMING"}]},
      },
      {
        src: "assets/context/concert-hall.jpg",
        alt: "The interior of a grand concert hall with tiered balconies, ornate ceiling and a warmly lit stage, empty and ready for a performance.",
        license: "Generated, Nano Banana 2.0",
      }
    ],
    longread: [
      { h: "Music doesn't exist in a vacuum",
        p: "A Songline travels across Country and tells a story tied to specific places and ancestors. A choral mass was written for a church liturgy. A K-pop track was engineered for streaming and stadium dance. The function of music shapes everything about it: instrumentation, structure, dynamics. When you analyse, name the context before you describe the sound." },
      { h: "ICIP: Indigenous Cultural and Intellectual Property",
        p: "First Nations music is often not 'freely available'. Some Songlines are restricted to certain people, places or times. Always engage through proper protocols, attribute the artist, ask permission when in doubt, and never claim ownership of cultural material that isn't yours." },
    ],
    try: [
      { intro: "Match each musical context to the function it serves. The function shapes the music: instrumentation, dynamics, structure all follow from what the music is FOR.",
        kind: "SectionContextMatcher", props: {} },
      { kind: "SectionMCQ", props: {
          title: "Context shapes sound",
          items: [
            { q: "A piece is written to be sung at a religious service. Which element is MOST likely shaped by that context?",
              options: ["Tempo (fast and danceable)", "Texture (reverberant choir in unison or harmony)", "Performing media & timbre (synth bass and 808s)", "Dynamics (sudden silences and shouts)"],
              a: "Texture (reverberant choir in unison or harmony)",
              because: "Liturgical music is typically vocal, often in a big resonant space, so choral textures dominate." },
            { q: "You're analysing a Songline. The MOST important first step is to…",
              options: ["Compare it to a Top 40 song", "Acknowledge ICIP and attribute the custodians and Country", "Describe the key signature", "Add a drum kit transcription"],
              a: "Acknowledge ICIP and attribute the custodians and Country",
              because: "Cultural protocol comes before description. Some material is restricted, so always engage respectfully and attribute properly." },
            { q: "K-pop tracks are often built with a strong hook in the first 15 seconds. Why?",
              options: ["It's a legal requirement", "Streaming algorithms reward early engagement; listeners skip if not hooked", "It's traditional in Korean music", "The producers can't write longer intros"],
              a: "Streaming algorithms reward early engagement; listeners skip if not hooked",
              because: "The streaming context shapes the structure. Front-load the hook or lose the listener." },
          ],
        } },
      { intro: "Now listen to real music from a range of cultural and historical contexts. For each track, click Listen to open a search for official uploads, then answer the guided questions, naming the context before you describe the sound. Check yourself against the model answers.",
        kind: "GuidedListening", props: {} },
    ],
  },

  /* ============================================================
     Year 7 · y7-keyboard · Keyboard
     ============================================================ */
  "y7-keyboard/0": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Keyboard",
      title: "Finding C on the keyboard",
      tagline: "Every C sits just to the left of a pair of two black keys. Once you can find C, you can find anything.",
      terms: ["White keys", "Two-key group"],
      alt: "Finding C on the keyboard. Every C sits just to the left of a pair of two black keys. Once you can find C, you can find anything.",
      visual: {"kind":"keys","octaves":2,"highlight":["C"],"label":"EVERY C SITS LEFT OF TWO BLACKS"},
    },
    try: [
      { kind: "SectionMiniKeys", props: { startMidi: 48, octaves: 3, highlight: ["C"], labelMode: "letters" }, intro: "Every C is highlighted. Notice they all sit just to the LEFT of a pair of two black keys." },
    ],
  },
  "y7-keyboard/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Accidentals",
      title: "Sharps & flats",
      tagline: "Black keys come in groups of 2 and 3. Same key has two names: C♯ is also D♭.",
      terms: ["♯ sharp", "♭ flat", "Enharmonic"],
      alt: "Sharps and flats. Black keys come in groups of 2 and 3. Same key has two names: C♯ is also D♭.",
      visual: {"kind":"keys","octaves":1,"highlight":["C#","D#","F#","G#","A#"],"label":"BLACKS COME IN 2s AND 3s"},
    },

    try: [
      { kind: "SectionMiniKeys", props: { startMidi: 60, octaves: 1, highlight: ["C#","D#","F#","G#","A#"], labelMode: "letters" }, intro: "Sharps and flats in orange. Black keys come in groups of 2 and 3. That's how you find your place on the keyboard quickly." },
    ],
  },
  "y7-keyboard/2": {
    image: [
      {
        kind: "concept",
        eyebrow: "Performance · Keyboard",
        title: "Home position: C major",
        tagline: "Right-hand thumb on Middle C, then one finger per white key up to G. The starting point for almost everything.",
        terms: ["Thumb on C", "1-2-3-4-5"],
        alt: "Home position, C major. Right-hand thumb on Middle C, then one finger per white key up to G. The starting point for almost everything.",
        visual: {"kind":"keys","octaves":1,"highlight":["C","D","E","F","G"],"finger":true,"label":"RH HOME · THUMB ON C"},
      },
      {
        src: "assets/keyboard/hand-position-rh.jpg",
        alt: "A pianist's right hand in correct playing position, thumb on Middle C, fingers curved naturally over the adjacent white keys, wrist level.",
        license: "Generated, Nano Banana 2.0",
      }
    ],

    try: [
      { kind: "SectionMiniKeys", props: { startMidi: 60, octaves: 1, highlight: ["C","D","E","F","G"], labelMode: "letters" }, intro: "Home position for the right hand. Thumb on Middle C, then one finger per white key up to G." },
      { kind: "SectionScaleLadder", props: { name: "C major scale" } },
    ],
  },

  /* ============================================================
     Year 8 · y8-intro · Revision & Aural
     ============================================================ */
  "y8-intro/0": {
    image: {
      kind: "concept",
      eyebrow: "Aural · Year 8",
      title: "Practising dictation",
      tagline: "Play a bar. Notate it. Play another. Compare. Slow for two weeks, then suddenly faster than you were.",
      terms: ["Rhythm dictation", "Melodic dictation"],
      alt: "Practising dictation. Play a bar. Notate it. Play another. Compare. Slow for two weeks, then suddenly faster than you were.",
      visual: {"kind":"staff","clef":"treble","notes":[{"n":"C4"},{"n":"E4"},{"n":"G4"},{"n":"E4"},{"n":"C4"}],"timeSig":"4/4","label":"PLAY · NOTATE · COMPARE"},
    },

    longread: [
      { h: "How to practise dictation alone",
        p: "Play a 1-bar rhythm on any instrument. Loop it once and notate it on paper. Now play another bar. Don't peek at the original. Compare. Repeat with longer phrases. You'll be slow for two weeks, then suddenly faster than you were." },
    ],
    try: [
      { intro: "Rhythm dictation, Woonona-style. Use the school mnemonics (tea, coff·ee, straw·ber·ry, ber·ry·straw, shh) to label each beat. You'll hear a 4-beat count-in, then a 4-beat rhythm.",
        kind: "SectionRhythmDictation", props: { bpm: 76 } },
      { intro: "Pitch comparison: hear a reference note, then three more notes one after the other. For each new note, decide whether it's higher than, the same as, or lower than the note just before it.",
        kind: "SectionHighSameLow", props: {} },
      { kind: "SectionTapPulse", props: { bpm: 100, label: "Tap a 100 BPM beat" } },
    ],
  },
  "y8-intro/1": {
    image: {
      kind: "concept",
      eyebrow: "Revision · Year 7",
      title: "Year 7 refresher",
      tagline: "Beat, rhythm, treble clef, six elements. Lock the basics before the new stuff lands.",
      terms: ["Six elements", "Note values"],
      alt: "Year 7 refresher. Beat, rhythm, treble clef, six elements. Lock the basics before the new stuff lands.",
      visual: {"kind":"chips","cols":3,"items":[{"big":"Six elements"},{"big":"Treble clef"},{"big":"Note values"},{"big":"Time sigs"},{"big":"Beat & rhythm"},{"big":"Open chords"}]},
    },

    try: [
      { kind: "SectionMCQ", props: {
          title: "Year 7 refresher",
          items: [
            { q: "Which of these is the LONGEST?",
              options: ["Crotchet", "Quaver", "Minim", "Semiquaver"],
              a: "Minim",
              because: "Minim = 2 beats; crotchet = 1; quaver = ½; semiquaver = ¼." },
            { q: "On the treble clef, what's the BOTTOM line?",
              options: ["F", "E", "G", "C"],
              a: "E",
              because: "Lines bottom-up: E G B D F." },
          ],
        } },
    ],
  },

  /* ============================================================
     Year 8 · y8-guitar · Guitar
     ============================================================ */
  "y8-guitar/0": {
    image: [
      {
        kind: "concept",
        eyebrow: "Element · Pitch · Harmony",
        title: "I · IV · V · I",
        tagline: "Half of popular music in four chords. Roman numerals are portable to any key.",
        terms: ["I IV V", "Roman numerals"],
        alt: "I · IV · V · I. Half of popular music in four chords. Roman numerals are portable to any key.",
        visual: {"kind":"numerals","sequence":["I","IV","V","I"],"label":"ROMAN NUMERALS · ANY KEY"},
      },
      {
        src: "assets/guitar/barre-chord.jpg",
        alt: "A guitarist's left hand forming a barre chord, index finger pressing across all strings at the fifth fret.",
        license: "Generated, Nano Banana 2.0",
      }
    ],

    longread: [
      { h: "Roman numerals are portable",
        p: "If you say 'in C major, play C – F – G – C', you've described one song. If you say 'play I – IV – V – I', you've described HALF OF POPULAR MUSIC. Roman numerals work in any key. Pick a key, build the chords from the scale, and you've got your three workhorse chords." },
    ],
    try: [
      { kind: "SectionChordPicker", props: {
          title: "I · IV · V · I in C major",
          chords: [
            { name: "I (C)",  sub: "C–E–G",   notes: ["C3","E3","G3","C4","E4"], color: "var(--terracotta)" },
            { name: "IV (F)", sub: "F–A–C",   notes: ["F3","A3","C4","F4"], color: "var(--butter-d)" },
            { name: "V (G)",  sub: "G–B–D",   notes: ["G3","B3","D4","G4"], color: "var(--teal)" },
          ],
        } },
    ],
  },
  "y8-guitar/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Cadence",
      title: "V7 → I: the pull home",
      tagline: "Add the 7th to V and the tension nearly forces the resolution. Cadences are how phrases punctuate.",
      terms: ["Dominant 7", "Resolution"],
      alt: "V7 to I, the pull home. Add the 7th to V and the tension nearly forces the resolution. Cadences are how phrases punctuate.",
      visual: {"kind":"numerals","sequence":["V7","I"],"op":"→","label":"TENSION → RESOLUTION"},
    },

    try: [
      { kind: "SectionChordPicker", props: {
          title: "V vs V7 vs I: feel the pull",
          chords: [
            { name: "V (G)",   sub: "G–B–D",       notes: ["G3","B3","D4","G4"], color: "var(--teal)" },
            { name: "V7 (G7)", sub: "G–B–D–F",     notes: ["G3","B3","D4","F4"], color: "var(--butter-d)" },
            { name: "I (C)",   sub: "Resolution",   notes: ["C3","E3","G3","C4"], color: "var(--terracotta)" },
          ],
        } },
    ],
  },
  "y8-guitar/2": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Practice",
      title: "Slow first, then fast",
      tagline: "Tone before tempo. Clean at 60 BPM beats messy at 120 every time.",
      terms: ["+5 BPM", "Clean first"],
      alt: "Slow first, then fast. Tone before tempo. Clean at 60 BPM beats messy at 120 every time.",
      visual: {"kind":"bpm"},
    },

    try: [
      { kind: "SectionMCQ", props: {
          title: "Practice strategy",
          items: [
            { q: "Which is the better practice approach?",
              options: [
                "Play the whole song at full tempo until it sounds OK",
                "Play it slowly, clean, then push the tempo 5 BPM at a time",
                "Play it once and post it on TikTok",
                "Play only the easy bits",
              ],
              a: "Play it slowly, clean, then push the tempo 5 BPM at a time",
              because: "Tone before tempo. Slow practice that sounds good will out-perform fast practice that sounds messy every time." },
          ],
        } },
    ],
  },

  /* ============================================================
     Year 8 · y8-listening · Aural Analysis
     ============================================================ */
  "y8-listening/0": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Tonality",
      title: "Major vs minor",
      tagline: "Same notes, different feel. Listen to the third. That's the switch between bright and dark.",
      terms: ["Major 3rd", "Minor 3rd"],
      alt: "Major vs minor. Same notes, different feel. Listen to the third. That's the switch between bright and dark.",
      visual: {"kind":"majorMinor"},
    },

    try: [
      { kind: "SectionMajorMinor", props: {} },
    ],
  },
  "y8-listening/1": {
    image: {
      kind: "concept",
      eyebrow: "Listening · Comparison",
      title: "Cover vs original",
      tagline: "Hold the melody constant. Ask what changed: tempo, key, instrumentation, texture, structure?",
      terms: ["Same melody", "Different elements"],
      alt: "Cover vs original. Hold the melody constant. Ask what changed: tempo, key, instrumentation, texture, structure?",
      visual: {"kind":"flow","op":"vs","boxes":[{"big":"Original","small":"BASELINE"},{"big":"Cover","small":"WHAT CHANGED?"}],"label":"HOLD MELODY CONSTANT"},
    },

    longread: [
      { h: "Hold the melody constant",
        p: "When you compare two versions of one song, lock the melody as your control. Then ask: what changed? Tempo? Key? Instrumentation? Texture? Structure? Dynamics? Often a cover that only swaps the instrumentation (acoustic Beyoncé, orchestral Radiohead) completely shifts the emotional meaning." },
    ],
    try: [
      { kind: "SectionMCQ", props: {
          title: "Cover vs original",
          items: [
            { q: "A song's TEMPO drops from 120 to 70 BPM and the band is replaced by a string quartet. Which elements changed?",
              options: ["Duration only", "Performing media & timbre only", "Duration AND performing media & timbre", "Structure only"],
              a: "Duration AND performing media & timbre",
              because: "Tempo lives under Duration; instrument change is performing media & timbre. Two elements moved." },
          ],
        } },
    ],
  },
  "y8-listening/2": {
    image: {
      kind: "concept",
      eyebrow: "Listening · Extended response",
      title: "The extended response",
      tagline: "One sentence framing · three paragraphs (one per element, with time-stamps) · one paragraph on effect.",
      terms: ["Time-stamps", "Synthesis"],
      alt: "The extended response. One sentence framing · three paragraphs (one per element, with time-stamps) · one paragraph on effect.",
      visual: {"kind":"chips","cols":5,"items":[{"big":"Frame"},{"big":"Texture"},{"big":"Structure"},{"big":"Timbre"},{"big":"Effect"}]},
    },

    longread: [
      { h: "Structure of an extended response",
        p: "1) One sentence: what's the piece, who made it, when. 2) Three paragraphs, one per element. Use time-stamps. 3) One closing paragraph: WHY these choices? What effect on the listener? Marks come from precision (time-stamps, terminology) and synthesis (joining observations into an argument)." },
    ],
    try: [
      { intro: "Practise the analysis these questions demand. Pick a track, click Listen to open a search for official uploads, and write a response to each element prompt using precise vocabulary and time-stamps. The model answers show the standard expected in Stage 4 and into Stage 5.",
        kind: "GuidedListening", props: {} },
    ],
  },

  /* ============================================================
     Year 8 · y8-composition · Compose & Arrange
     ============================================================ */
  "y8-composition/0": {
    image: {
      kind: "concept",
      eyebrow: "Composition · Definitions",
      title: "Compose or arrange?",
      tagline: "Composing = new material. Arranging = re-presenting existing material. Both earn marks, both need a journal.",
      terms: ["Original", "Arrangement"],
      alt: "Compose or arrange? Composing = new material. Arranging = re-presenting existing material. Both earn marks, both need a journal.",
      visual: {"kind":"flow","op":"vs","boxes":[{"big":"Compose","small":"NEW MATERIAL"},{"big":"Arrange","small":"RESHAPE EXISTING"}]},
    },

    try: [
      { kind: "SectionMCQ", props: {
          title: "Composing vs arranging",
          items: [
            { q: "You take an existing song and re-record it with new instruments, a different feel, a new chord progression. That's…",
              options: ["Composing", "Arranging", "Mixing", "Mastering"],
              a: "Arranging",
              because: "Arranging is re-presenting existing material. Composing is writing new material from scratch." },
          ],
        } },
    ],
  },
  "y8-composition/1": {
    image: [
      {
        kind: "concept",
        eyebrow: "Composition · Workflow",
        title: "Producer's workflow",
        tagline: "Drums first → bass → chords → melody on top. The order that almost every modern track is built in.",
        terms: ["Drums → bass → chords → top"],
        alt: "Producer's workflow. Drums first → bass → chords → melody on top. The order that almost every modern track is built in.",
        visual: {"kind":"groove","steps":8,"rows":[{"label":"DRUMS","pattern":[1,0,1,0,1,0,1,0]},{"label":"BASS","pattern":[1,0,0,0,1,0,0,0]},{"label":"CHORDS","pattern":[1,0,0,0,1,0,0,0]},{"label":"MELODY","pattern":[0,0,1,0,1,1,0,1]}]},
      },
      {
        src: "assets/context/daw-studio.jpg",
        alt: "A music production workstation with dual monitors showing a DAW timeline, MIDI keyboard, studio monitors and acoustic foam walls.",
        license: "Generated, Nano Banana 2.0",
      }
    ],
    try: [
      { intro: "The classic build-up: drums first, bass second, chords third, melody on top.",
        kind: "SectionStepGrid", props: {
          bpm: 100, steps: 8, title: "Producer's workflow",
          rows: [
            { label: "Hat",   color: "#9c9c9c",     play: () => window.MusicAudio?.playHat(false) },
            { label: "Snare", color: "var(--butter-d)", play: () => window.MusicAudio?.playSnare() },
            { label: "Kick",  color: "var(--espresso)", play: () => window.MusicAudio?.playKick() },
            { label: "Bass",  color: "var(--teal)",  play: () => window.MusicAudio?.playPluck("F2", 0.5) },
            { label: "Pad",   color: "var(--terracotta)", play: () => window.MusicAudio?.playChord(["F4","A4","C5"], 1.4, 0.4) },
          ],
        } },
    ],
  },
  "y8-composition/2": {
    image: {
      kind: "concept",
      eyebrow: "Composition · Influence",
      title: "Listen wide, then write",
      tagline: "Three tracks from one influence. Three things they do that you don't. Then sit down to write.",
      terms: ["Active listening", "Then compose"],
      alt: "Listen wide, then write. Three tracks from one influence. Three things they do that you don't. Then sit down to write.",
      visual: {"kind":"flow","op":"→","boxes":[{"big":"3 tracks","small":"LISTEN ACTIVELY"},{"big":"3 ideas","small":"WHAT THEY DO"},{"big":"Your piece","small":"INFLUENCED"}]},
    },

    longread: [
      { h: "Listening wide before you write",
        p: "Pick three tracks from the artist that influenced you. Listen actively (one element per pass). Note three things they do that you don't already do. THEN sit down to write. Influence shows in your choices, not in copy-paste imitation." },
    ],
  },

  /* ============================================================
     Year 8 · y8-concepts · Concepts of Music
     ============================================================ */
  "y8-concepts/0": {
    image: {
      kind: "concept",
      eyebrow: "Concepts · The six",
      title: "The six elements",
      tagline: "Duration · Pitch · Dynamics & expression · Performing media & timbre · Texture · Structure. The framework for every analysis.",
      terms: ["DUR · PIT · D&E", "T.C · TEX · STR"],
      alt: "The six elements. Duration · Pitch · Dynamics & expression · Performing media & timbre · Texture · Structure. The framework for every analysis.",
      visual: {"kind":"chips","cols":3,"items":[{"big":"Duration","small":"TIME"},{"big":"Pitch","small":"HIGH/LOW"},{"big":"Dynamics","small":"VOLUME"},{"big":"Timbre","small":"& MEDIA"},{"big":"Texture","small":"LAYERS"},{"big":"Structure","small":"FORM"}]},
    },

    try: [
      { kind: "SectionMCQ", props: {
          title: "Naming the six",
          items: [
            { q: "Which is NOT one of the six elements?",
              options: ["Duration", "Pitch", "Tempo", "Texture"],
              a: "Tempo",
              because: "Tempo belongs UNDER Duration. The six are: Duration, Pitch, Dynamics & expression, Performing media & timbre, Texture, Structure." },
            { q: "Which element covers monophonic / homophonic / polyphonic?",
              options: ["Performing media & timbre", "Texture", "Structure", "Dynamics"],
              a: "Texture",
              because: "How many layers, and how they relate. That's texture." },
          ],
        } },
    ],
  },
  "y8-concepts/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Texture",
      title: "Polyphonic textures",
      tagline: "Two or more independent melodies at once. Bach fugues, gospel choirs, jazz combos.",
      terms: ["Polyphonic", "Independent voices"],
      alt: "Polyphonic textures. Two or more independent melodies at once. Bach fugues, gospel choirs, jazz combos.",
      visual: {"kind":"texture","mode":"poly"},
    },

    try: [
      { kind: "SectionTextureToggles", props: {} },
    ],
  },
  "y8-concepts/2": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Enharmonic",
      title: "Two names, one key",
      tagline: "C♯ and D♭ are the same black key. The name you choose depends on the key signature you're in.",
      terms: ["C♯ = D♭", "F♯ = G♭"],
      alt: "Two names, one key. C♯ and D♭ are the same black key. The name you choose depends on the key signature you're in.",
      visual: {"kind":"keys","octaves":1,"highlight":["C#","D#","F#"],"label":"C♯ = D♭ · SAME KEY, TWO NAMES"},
    },
    try: [
      { kind: "SectionMiniKeys", props: { startMidi: 60, octaves: 2, highlight: ["C#","D#","F#","G#","A#"], labelMode: "letters" }, intro: "Same black key has two names: sharp of the white below, flat of the white above. C♯ and D♭ are the same note." },
    ],
  },

  /* ============================================================
     Year 8 · y8-bassclef · Bass Clef Trainer
     ============================================================ */
  "y8-bassclef/0": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Bass clef",
      title: "The bass clef",
      tagline: "Two dots either side of the F line. Same trick as the treble: the symbol marks the note it's named for.",
      terms: ["F clef", "Two-dot anchor"],
      alt: "The bass clef. Two dots either side of the F line. Same trick as the treble: the symbol marks the note it's named for.",
      visual: {"kind":"staff","clef":"bass","notes":[{"n":"F3","label":"F"}],"label":"TWO DOTS MARK THE F LINE"},
    },
    longread: [
      { h: "The dots point to F",
        p: "The two dots of the bass clef sit either side of the second line from the top. That line is F3 (the F below middle C). Same way the treble clef curl marks G, the bass clef dots mark F." },
    ],
  },
  "y8-bassclef/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Bass clef",
      title: "Bass-clef lines & spaces",
      tagline: "Lines (bottom up): Good Boys Deserve Fudge Always. Spaces: All Cows Eat Grass.",
      terms: ["G B D F A", "A C E G"],
      alt: "Bass-clef lines and spaces. Lines (bottom up): Good Boys Deserve Fudge Always. Spaces: All Cows Eat Grass.",
      visual: {"kind":"staff","clef":"bass","notes":[{"n":"G2","label":"G"},{"n":"B2","label":"B"},{"n":"D3","label":"D"},{"n":"F3","label":"F"},{"n":"A3","label":"A"}],"label":"GOOD BOYS DESERVE FUDGE ALWAYS"},
    },

    try: [
      { kind: "SectionMiniStaff", props: { clef: "bass" } },
    ],
  },
  "y8-bassclef/2": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Grand staff",
      title: "The grand staff",
      tagline: "Treble above, bass below. Middle C is the hinge: one ledger line below the treble, one above the bass.",
      terms: ["Middle C", "Two clefs"],
      alt: "The grand staff. Treble above, bass below. Middle C is the hinge: one ledger line below the treble, one above the bass.",
      visual: {"kind":"staff","clef":"grand"},
    },

    longread: [
      { h: "Where they meet",
        p: "Middle C sits ONE ledger line below the treble staff AND one ledger line above the bass staff. That's why piano players can read it on both. The two clefs share a hinge note." },
    ],
    try: [
      { kind: "SectionMiniKeys", props: { startMidi: 36, octaves: 4, highlight: ["C"], labelMode: "letters" }, intro: "Every C marked. Middle C is roughly in the centre." },
    ],
  },

  /* ============================================================
     Year 8 · y8-orchestra · The Orchestra
     ============================================================ */
  "y8-orchestra/0": {
    image: [
      {
        kind: "concept",
        eyebrow: "Element · Performing media & timbre",
        title: "The four families",
        tagline: "Strings · Woodwind · Brass · Percussion. Every orchestral instrument lives in one of these four boxes.",
        terms: ["Str · Ww · Brs · Perc"],
        alt: "The four families. Strings · Woodwind · Brass · Percussion. Every orchestral instrument lives in one of these four boxes.",
        visual: {"kind":"chips","cols":2,"items":[{"big":"Strings","small":"VIOLIN · CELLO"},{"big":"Woodwind","small":"FLUTE · CLARINET"},{"big":"Brass","small":"TRUMPET · HORN"},{"big":"Percussion","small":"TIMPANI · SNARE"}]},
      },
      {
        src: "assets/instruments/strings-section.jpg",
        alt: "A professional orchestra string section (violins, violas, cellos and double basses) performing on stage under warm concert lighting.",
        license: "Generated, Nano Banana 2.0",
      },
      {
        src: "assets/instruments/violin-hero.jpg",
        alt: "Close-up of a violinist's hands, left hand on the fingerboard, right hand drawing the bow across the strings.",
        license: "Generated, Nano Banana 2.0",
      }
    ],
    try: [
      { kind: "SectionOrchestraFamilies", props: {} },
    ],
  },
  "y8-orchestra/1": {
    image: [
      {
        kind: "concept",
        eyebrow: "Element · Performing media & timbre",
        title: "Talking about timbre",
        tagline: "Bright, dark, warm, thin, nasal, mellow, breathy, metallic. Use two of these per instrument.",
        terms: ["Bright / dark", "Warm / thin"],
        alt: "Talking about timbre. Bright, dark, warm, thin, nasal, mellow, breathy, metallic. Use two of these per instrument.",
        visual: {"kind":"chips","cols":4,"items":[{"big":"Bright"},{"big":"Dark"},{"big":"Warm"},{"big":"Thin"},{"big":"Nasal"},{"big":"Mellow"},{"big":"Breathy"},{"big":"Metallic"}]},
      },
      {
        src: "assets/instruments/woodwind-section.jpg",
        alt: "Four orchestral woodwind players (flute, oboe, clarinet, and bassoon) seated together in concert attire.",
        license: "Generated, Nano Banana 2.0",
      },
      {
        src: "assets/instruments/flute-hero.jpg",
        alt: "A flautist holding the flute horizontally, fingers curved over the silver keywork.",
        license: "Generated, Nano Banana 2.0",
      }
    ],

    longread: [
      { h: "Vocabulary for timbre",
        p: "Bright (lots of high overtones), dark (few high overtones), warm (rich middle), thin (lacking middle and bottom), nasal (a strong upper-middle 'pinch'), mellow (smooth, rounded), harsh (jagged), breathy (lots of airy noise mixed in), metallic (cymbal-like resonance). Use TWO of these per instrument and you'll sound expert immediately." },
    ],
    try: [
      { kind: "SectionOrchestraFamilies", props: {} },
    ],
  },
  "y8-orchestra/2": {
    image: [
      {
        kind: "concept",
        eyebrow: "Performance · Orchestra",
        title: "Why this seating?",
        tagline: "Quiet instruments at the front, loud at the back, soloist near the conductor. The geometry is acoustic, not arbitrary.",
        terms: ["Quiet front · Loud back"],
        alt: "Why this seating? Quiet instruments at the front, loud at the back, soloist near the conductor. The geometry is acoustic, not arbitrary.",
        visual: {"kind":"seating"},
      },
      {
        src: "assets/instruments/brass-section.jpg",
        alt: "An orchestral brass section (trumpets, French horns and trombone) seated in formation under warm stage lighting.",
        license: "Generated, Nano Banana 2.0",
      },
      {
        src: "assets/instruments/trumpet-hero.jpg",
        alt: "Close-up of a trumpeter's hands on the valves, instrument raised and ready to play.",
        license: "Generated, Nano Banana 2.0",
      }
    ],

    longread: [
      { h: "Why the layout?",
        p: "Quiet instruments sit at the front so they can be heard. Loud instruments (brass, percussion) sit at the back so they don't blast the audience. Solo players or vocalists usually stand in front of the conductor so they project clearly to the audience. The geometry is acoustic, not arbitrary." },
    ],
    try: [
      { kind: "SectionMCQ", props: {
          title: "Where do they sit?",
          items: [
            { q: "Why are the percussion at the BACK of the orchestra?",
              options: ["So nobody trips on the wires", "Because they're loud and don't need to be close", "They were the last to join", "It's tradition"],
              a: "Because they're loud and don't need to be close",
              because: "Quiet front, loud back. The geometry serves the audience's ears." },
          ],
        } },
    ],
  },

  /* ============================================================
     Year 8 · y8-film · Film Music
     ============================================================ */
  "y8-film/0": {
    image: {
      kind: "concept",
      eyebrow: "Music in context · Film",
      title: "Leitmotif",
      tagline: "A melody attached to a character, place or idea. Vader has one. Luke has one. The Force has one.",
      terms: ["Theme = identity"],
      alt: "Leitmotif. A melody attached to a character, place or idea. Vader has one. Luke has one. The Force has one.",
      visual: {"kind":"flow","op":"→","boxes":[{"big":"Character","small":"VADER"},{"big":"Melody","small":"RECURS"}],"label":"MELODY = IDENTITY"},
    },
    try: [
      { kind: "SectionMCQ", props: {
          title: "Functions of film music",
          items: [
            { q: "A melody plays whenever the villain enters. What's the technical term?",
              options: ["Underscore", "Leitmotif", "Diegetic", "Score"],
              a: "Leitmotif",
              because: "A melody attached to a person, place or idea. Star Wars is full of them: Vader, Luke, the Force, all have their own theme." },
          ],
        } },
    ],
  },
  "y8-film/1": {
    image: {
      kind: "concept",
      eyebrow: "Music in context · Film",
      title: "Diegetic or non-diegetic?",
      tagline: "Diegetic = inside the world (characters can hear it). Non-diegetic = score for the audience only.",
      terms: ["Diegetic", "Non-diegetic"],
      alt: "Diegetic or non-diegetic? Diegetic = inside the world (characters can hear it). Non-diegetic = score for the audience only.",
      visual: {"kind":"flow","op":"vs","boxes":[{"big":"Diegetic","small":"IN-WORLD"},{"big":"Non-diegetic","small":"FOR AUDIENCE"}]},
    },

    try: [
      { kind: "SectionMCQ", props: {
          title: "Diegetic or not?",
          items: [
            { q: "A character turns on a car radio. The song plays. That's…",
              options: ["Diegetic", "Non-diegetic", "Leitmotif", "Source-cue"],
              a: "Diegetic",
              because: "Diegetic = inside the world of the film. The characters can hear it." },
            { q: "Orchestral strings swell during a kiss. The characters can't hear them. That's…",
              options: ["Diegetic", "Non-diegetic", "Sound effect", "Foley"],
              a: "Non-diegetic",
              because: "Non-diegetic = for the audience only. Most film scoring is non-diegetic." },
          ],
        } },
    ],
  },
  "y8-film/2": {
    image: [
      {
        kind: "concept",
        eyebrow: "Music in context · Film",
        title: "Scoring a scene",
        tagline: "Strings swell for love, low brass for menace, woodwinds for innocence. Performing media & timbre does the heavy lifting.",
        alt: "Scoring a scene. Strings swell for love, low brass for menace, woodwinds for innocence. Performing media & timbre does the heavy lifting.",
        visual: {"kind":"chips","cols":2,"items":[{"big":"Love","small":"STRINGS · WARM"},{"big":"Menace","small":"LOW BRASS"},{"big":"Innocence","small":"WOODWIND"},{"big":"Action","small":"PERC · BRASS"}]},
      },
      {
        src: "assets/context/film-scoring.jpg",
        alt: "A film scoring session with an orchestra on a studio stage beneath a large projection screen, conductor's podium in the foreground.",
        license: "Generated, Nano Banana 2.0",
      },
    ],
    try: [
      { kind: "SectionTextureToggles", props: {} },
    ],
  },

  /* ============================================================
     Year 8 · y8-keyboard · Keyboard
     ============================================================ */
  "y8-keyboard/0": {
    image: [
      {
        kind: "concept",
        eyebrow: "Performance · Piano",
        title: "Both hands have a home",
        tagline: "RH thumb on Middle C, LH thumb an octave below. The two hands meet at Middle C, the bridge between treble and bass.",
        terms: ["LH home · C3–G3", "RH home · C4–G4"],
        alt: "Both hands have a home. Right-hand thumb on Middle C, left-hand thumb on C an octave below.",
        visual: {"kind":"keys","octaves":2,"highlight":["C","D","E","F","G"],"finger":true,"label":"BOTH HANDS · C MAJOR HOME"},
      },
      {
        src: "assets/keyboard/both-hands.jpg",
        alt: "Both hands on a piano, right hand in treble position, left hand in bass position, both with correct curved-finger technique.",
        license: "Generated, Nano Banana 2.0",
      }
    ],
    longread: [
      { h: "Where each hand lives",
        p: "Right-hand thumb sits on Middle C (C4) with the next four fingers covering D, E, F and G. Left-hand thumb sits on C3 (one octave lower) with its fingers spreading DOWN through G3 to C3. Both hands play the same letters, just an octave apart. Middle C is the meeting point you count from in both directions." },
      { h: "Why thumbs on C?",
        p: "It puts a strong finger on the most-used note of the key, leaves the other four fingers free to climb the rest of the home position, and gives both hands a matching shape so they reinforce each other when you play them together." },
    ],
    try: [
      { intro: "A two-octave keyboard with both home zones marked. Tap any key to hear it, then press the button to hear both hands play a C major scale in octaves.",
        kind: "SectionTwoHandKeys", props: { startMidi: 48, octaves: 2, bpm: 84 } },
    ],
  },
  "y8-keyboard/1": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Bass clef",
      title: "Reading the bass clef",
      tagline: "F clef. The two dots sit either side of F3. Lines G B D F A. Spaces A C E G.",
      terms: ["G B D F A", "A C E G"],
      alt: "Reading the bass clef. The F-clef sits on the F3 line; lines are G B D F A.",
      visual: {"kind":"staff","clef":"bass","notes":[{"n":"G2","label":"G"},{"n":"B2","label":"B"},{"n":"D3","label":"D"},{"n":"F3","label":"F"},{"n":"A3","label":"A"}],"label":"LINES · G B D F A"},
    },
    longread: [
      { h: "Why 'F clef'?",
        p: "The bass clef started life as a stylised letter F. The two dots of the modern symbol still mark the F line, the fourth line up on the bass staff (F3, the F below Middle C). Every other note is countable from there." },
      { h: "Mnemonics that help",
        p: "Lines (bottom up): Good Boys Deserve Fruit Always (G B D F A). Spaces (bottom up): All Cows Eat Grass (A C E G). Useful while you're learning; drop them once you can read notes directly." },
      { h: "Where Middle C lives",
        p: "Middle C sits ABOVE the bass staff on a single ledger line, and BELOW the treble staff on a single ledger line. Same key on the piano, written either way depending on which hand is playing it." },
    ],
    try: [
      { intro: "The grand staff: treble (RH) and bass (LH) stacked together, joined at Middle C. Tap any note to hear it.",
        kind: "SectionGrandStaff", props: {} },
      { intro: "Now drill the bass clef on its own. Click any notehead to hear it; the labels below show what's on each line and space.",
        kind: "SectionMiniStaff", props: { clef: "bass" } },
      { kind: "SectionMCQ", props: {
          title: "Bass clef check",
          items: [
            { q: "On the bass clef, the FOURTH line up is…",
              options: ["G", "B", "D", "F"],
              a: "F",
              because: "The two dots of the F clef sit either side of this line. Lines bottom-up: G B D F A." },
            { q: "Middle C in the bass clef sits…",
              options: ["On the bottom line", "In the top space", "On one ledger line ABOVE the staff", "On one ledger line BELOW the staff"],
              a: "On one ledger line ABOVE the staff",
              because: "Bass staff tops out at A3. Middle C is one ledger line above. (In treble it's one ledger line BELOW.)" },
            { q: "The bottom space of the bass staff is…",
              options: ["A", "C", "E", "G"],
              a: "A",
              because: "Spaces bottom-up: A C E G ('All Cows Eat Grass')." },
          ],
        } },
    ],
  },
  "y8-keyboard/2": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Piano",
      title: "Hands separate, then together",
      tagline: "Right hand clean. Left hand clean. Both hands at half speed. Push tempo last.",
      terms: ["RH → LH → both"],
      alt: "Hands separate, then together. Right hand clean. Left hand clean. Both hands at half speed. Push tempo last.",
      visual: {"kind":"flow","op":"→","boxes":[{"big":"RH only","small":"CLEAN"},{"big":"LH only","small":"CLEAN"},{"big":"Both","small":"HALF SPEED"}]},
    },
    longread: [
      { h: "The four-stage drill",
        p: "1) Right hand alone, slow, until it's automatic. 2) Left hand alone, slow, until it's automatic. 3) Both hands together at HALF the target tempo. 4) Push tempo five BPM at a time once both hands stay clean. Skipping straight to step 3 at speed is the most common reason students plateau." },
    ],
    try: [
      { intro: "Try the C major scale, hands together. Both hands play the same letters an octave apart. Drop the tempo if it's messy, push it once it locks.",
        kind: "SectionTwoHandScale", props: {} },
      { kind: "SectionMCQ", props: {
          title: "Practice strategy",
          items: [
            { q: "What's the best way to learn a new piano piece?",
              options: [
                "Hands together at full speed straight away",
                "Right hand only until smooth, then left hand only, then both at half speed",
                "Just memorise the right hand",
                "Watch a YouTube tutorial",
              ],
              a: "Right hand only until smooth, then left hand only, then both at half speed",
              because: "Hands separately first, then together slow, then push tempo. Faster than trying both at speed from the start." },
            { q: "Your hands together are clean at 60 BPM. What's the smart next step?",
              options: ["Jump straight to 120 BPM", "Push to 65 BPM and check it's still clean", "Give up and play something easier", "Switch to a different piece"],
              a: "Push to 65 BPM and check it's still clean",
              because: "Five BPM at a time. Big jumps re-introduce errors you've just trained out." },
          ],
        } },
    ],
  },
  "y8-keyboard/3": {
    image: {
      kind: "concept",
      eyebrow: "Performance · Piano",
      title: "Eyes ahead, fingers behind",
      tagline: "Read the next note while you play the current one. Sight readers do this without thinking.",
      terms: ["+1 note ahead"],
      alt: "Eyes ahead, fingers behind. Read the next note while you play the current one. Sight readers do this without thinking.",
      visual: {"kind":"staff","clef":"treble","notes":[{"n":"C4"},{"n":"D4"},{"n":"E4"},{"n":"F4"},{"n":"G4"},{"n":"A4"}],"markers":[{"at":1,"label":"FINGERS"},{"at":3,"label":"EYES"}],"label":"READ AHEAD OF YOUR FINGERS"},
    },
    longread: [
      { h: "Eyes ahead, fingers behind",
        p: "Don't read the note your finger is playing. Read the next one. Your eyes should always be 1-2 notes ahead of your hands. Sight readers do this without thinking. It feels weird at first; after a week it's automatic. Try whispering the next note's name as you play the current one." },
      { h: "Practice trick: cover the note you just played",
        p: "Put a sticky note over the bar you've already played as you go. It forces your eye to stay forward. Sounds silly but it works in about ten minutes." },
    ],
    try: [
      { intro: "Click any note on the treble clef to hear it, the same skill as sight-reading, just untimed.",
        kind: "SectionMiniStaff", props: { clef: "treble" } },
      { kind: "SectionMCQ", props: {
          title: "Sight-reading habit",
          items: [
            { q: "Where should your eyes be when you sight-read?",
              options: [
                "On the note you're playing right now",
                "On your fingers",
                "One or two notes ahead of your fingers",
                "On the audience",
              ],
              a: "One or two notes ahead of your fingers",
              because: "Your fingers can play any note your eyes have already prepared for. That's what makes reading fluent." },
          ],
        } },
    ],
  },
  "y8-keyboard/4": {
    image: {
      kind: "concept",
      eyebrow: "Element · Pitch · Harmony",
      title: "Left-hand triads",
      tagline: "Root, third, fifth. Stack three notes from any scale degree and you've built a chord.",
      terms: ["Root · 3rd · 5th"],
      alt: "Left-hand triads. Root, third, fifth.",
      visual: {"kind":"staff","clef":"bass","notes":[{"n":"C3","label":"Root"},{"n":"E3","label":"3rd"},{"n":"G3","label":"5th"}],"label":"ROOT · THIRD · FIFTH"},
    },
    longread: [
      { h: "Build a triad",
        p: "Pick any note in a scale. That's the ROOT. Skip a note, play the next one: that's the THIRD. Skip again, play the next: that's the FIFTH. Three notes, alternating up the scale. In C major: C–E–G is the I chord. F–A–C is the IV. G–B–D is the V. Three chord shapes cover most popular tunes." },
      { h: "Less is more in the left hand",
        p: "You don't have to play every note of every chord. Sometimes the root alone is enough, and you can let the RH melody and any RH harmony fill out the sound. A common pattern is root on beat 1, three-note chord on beats 2-3-4. Loads of pop piano is exactly this." },
    ],
    try: [
      { intro: "Left-hand triads in C major: I, IV, V, vi. Click each to hear how they sit underneath the right-hand melody.",
        kind: "SectionChordPicker", props: {
          title: "Left-hand triads in C",
          chords: [
            { name: "C (I)",  sub: "Root C",  notes: ["C3","E3","G3"], color: "var(--terracotta)" },
            { name: "F (IV)", sub: "Root F",  notes: ["F2","A2","C3"], color: "var(--butter-d)" },
            { name: "G (V)",  sub: "Root G",  notes: ["G2","B2","D3"], color: "var(--teal)" },
            { name: "Am (vi)",sub: "Root A",  notes: ["A2","C3","E3"], color: "#7c4a7e" },
          ],
        } },
      { kind: "SectionMCQ", props: {
          title: "Triad anatomy",
          items: [
            { q: "A triad is built from which scale degrees, counting from the root?",
              options: ["1, 2, 3", "1, 3, 5", "1, 4, 7", "1, 5, 8"],
              a: "1, 3, 5",
              because: "Root, third, fifth: three notes stacked in thirds." },
            { q: "In C major, the V chord is built on which note?",
              options: ["C", "F", "G", "A"],
              a: "G",
              because: "V = the 5th degree of the scale. In C major that's G; the triad is G–B–D." },
          ],
        } },
    ],
  },

};

window.SECTION_EXTRAS = SECTION_EXTRAS;
