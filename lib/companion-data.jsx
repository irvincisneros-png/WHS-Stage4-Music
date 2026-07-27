/*
  Stage 4 Music Companion
  -----------------------
  A curriculum-first content model for the companion hub. It deliberately
  points at the existing Year 7/8 topic pages and interactive components,
  rather than creating a second set of lessons. A hub component can render
  this data as six entry points, filter it by pathway, and embed a component
  by its `component` name from `window`.

  `topicId` works with the existing hash routes, for example
  #/year7/y7-guitar. `component` is the name of an existing window component
  where one is available. A `planned: true` reference is a curriculum brief
  for a purposeful new activity, not a promise that the component exists.
*/

const COMPANION_CYCLE = [
  {
    id: "learn",
    label: "Learn",
    prompt: "Meet one idea and hear what it does.",
  },
  {
    id: "try",
    label: "Try",
    prompt: "Use the tool slowly and copy a short example.",
  },
  {
    id: "challenge",
    label: "Challenge",
    prompt: "Make a musical choice of your own.",
  },
  {
    id: "reflect",
    label: "Reflect",
    prompt: "Name what changed, using music words.",
  },
];

const COMPANION_PATHWAYS = [
  {
    id: "foundation",
    label: "Foundation",
    shortLabel: "Start",
    description: "Build the core skill with a clear model and plenty of repeats.",
    years: ["year7", "year8"],
  },
  {
    id: "build",
    label: "Build",
    shortLabel: "Build",
    description: "Join skills together and make a more independent choice.",
    years: ["year7", "year8"],
  },
  {
    id: "extend",
    label: "Extend",
    shortLabel: "Extend",
    description: "Adapt the idea for a new style, purpose, performer or audience.",
    years: ["year7", "year8"],
  },
];

const STAGE4_OUTCOMES = {
  PER: { code: "MU4-PER-01", label: "Performing" },
  LIS: { code: "MU4-LIS-01", label: "Listening" },
  COM: { code: "MU4-COM-01", label: "Composing" },
};

const STAGE4_FOCUS_AREAS = {
  practice: "Music in Practice",
  context: "Music in Context",
  elements: "Elements of Music",
};

const topicLink = (year, topicId, label) => ({
  type: "topic",
  year,
  topicId,
  label,
  route: `#/${year}/${topicId}`,
});

const componentLink = (component, label, props) => ({
  type: "interactive",
  component,
  label,
  ...(props ? { props } : {}),
});

const plannedLink = (id, label, purpose) => ({
  type: "planned",
  id,
  label,
  purpose,
  planned: true,
});

const STAGE4_REPERTOIRE_PASSPORT = {
  id: "stage4-repertoire-passport",
  title: "Repertoire Passport",
  studentPrompt: "Collect listening evidence from every music world — then compare what you hear.",
  categories: [
    {
      id: "australian",
      label: "Music of Australia",
      prompt: "Hear how place, people and purpose shape music made here.",
      required: true,
      currentLinks: [
        topicLink("year7", "y7-guitar", "Australian guitar repertoire"),
        topicLink("year7", "y7-listening", "First Nations listening"),
        topicLink("year8", "y8-guitar", "Australian repertoire"),
      ],
      evidence: "Name an element and one context that matters.",
    },
    {
      id: "art",
      label: "Art music",
      prompt: "Follow instruments, layers and form in a longer work.",
      required: true,
      currentLinks: [
        topicLink("year7", "y7-listening", "Listening in context"),
        topicLink("year8", "y8-orchestra", "The Orchestra"),
        topicLink("year8", "y8-listening", "Aural analysis"),
      ],
      evidence: "Describe the timbre or texture at one moment.",
    },
    {
      id: "jazz",
      label: "Jazz",
      prompt: "Notice groove, improvising and how musicians respond to each other.",
      required: true,
      currentLinks: [topicLink("year8", "y8-listening", "Aural analysis")],
      evidence: "Spot a musical conversation or improvisation choice.",
      gap: "Add a guided jazz listening and call-and-response activity.",
    },
    {
      id: "popular",
      label: "Popular music",
      prompt: "Play, make and analyse music made for audiences now.",
      required: true,
      currentLinks: [
        topicLink("year7", "y7-drums", "Drums"),
        topicLink("year7", "y7-keyboard", "Keyboard"),
        topicLink("year8", "y8-film", "Film music"),
      ],
      evidence: "Explain how one musical choice suits its audience or purpose.",
    },
    {
      id: "global",
      label: "Global music culture",
      prompt: "Listen beyond your usual playlist and respect the music's setting.",
      required: true,
      currentLinks: [topicLink("year7", "y7-listening", "Listening in context")],
      evidence: "Compare one element with music you already know.",
      gap: "Add at least one substantial guided listening sequence with cultural context.",
    },
  ],
  reflection: {
    prompt: "Which music changed how you think about sound, and why?",
    minEvidence: 5,
    fields: ["repertoire", "element", "context", "my response"],
  },
};

const STAGE4_LABS = [
  {
    id: "guitar",
    title: "Guitar Lab",
    glyph: "guitar",
    summary: "Find the chord shape, keep the pulse, then make the progression yours.",
    outcomes: ["PER", "LIS", "COM"],
    focusAreas: ["practice", "context", "elements"],
    elements: ["Duration", "Pitch", "Performing media & timbre", "Structure"],
    topicLinks: [
      topicLink("year7", "y7-guitar", "Year 7 Guitar"),
      topicLink("year8", "y8-guitar", "Year 8 Guitar"),
    ],
    cycle: {
      learn: [componentLink("GuitarStudio", "Open the Guitar Studio", { year: "year7" })],
      try: [componentLink("GuitarStudio", "Practise one open-chord change", { year: "year7" })],
      challenge: [
        componentLink("SectionChordChart", "Read a chord chart"),
        topicLink("year8", "y8-composition", "Use chord tones in an eight-bar idea"),
      ],
      reflect: [
        plannedLink("guitar-reflection", "Two-bar rehearsal note", "Prompt: Which change stayed steady? What will you slow down next?")
      ],
    },
    pathways: {
      foundation: "Play one chord with a steady four-beat count.",
      build: "Change between two chords without losing the pulse.",
      extend: "Arrange a progression for a chosen style or audience.",
    },
  },
  {
    id: "piano-keyboard",
    title: "Piano & Keyboard Lab",
    glyph: "piano",
    summary: "Read the map, build the chord, then connect two hands.",
    outcomes: ["PER", "LIS", "COM"],
    focusAreas: ["practice", "elements"],
    elements: ["Pitch", "Duration", "Texture", "Structure"],
    topicLinks: [
      topicLink("year7", "y7-keyboard", "Year 7 Keyboard"),
      topicLink("year8", "y8-keyboard", "Year 8 Keyboard"),
      topicLink("year8", "y8-bassclef", "Bass Clef Trainer"),
    ],
    cycle: {
      learn: [componentLink("PianoStudio", "Open the Piano Studio", { year: "year7" })],
      try: [componentLink("PianoPlayer", "Play a short melody", { topic: { pianoSong: "hotcross" }, difficulty: "easy" })],
      challenge: [componentLink("SectionTwoHandKeys", "Connect both hands")],
      reflect: [
        plannedLink("keyboard-reflection", "Practice snapshot", "Prompt: Which hand leads? Which part needs a slower tempo?")
      ],
    },
    pathways: {
      foundation: "Find five notes using black-key groups as landmarks.",
      build: "Play a melody with a simple chord or bass note.",
      extend: "Arrange a two-hand version with a deliberate texture.",
    },
  },
  {
    id: "rhythm-drums",
    title: "Rhythm & Drums Lab",
    glyph: "drum",
    summary: "Lock the beat, build a groove, then make a fill that fits.",
    outcomes: ["PER", "LIS", "COM"],
    focusAreas: ["practice", "elements"],
    elements: ["Duration", "Dynamics & expression", "Structure", "Performing media & timbre"],
    topicLinks: [
      topicLink("year7", "y7-drums", "Year 7 Drums"),
      topicLink("year7", "y7-intro", "Beat, rhythm and graphic notation"),
      topicLink("year8", "y8-intro", "Revision & Aural"),
    ],
    cycle: {
      learn: [componentLink("SectionTapPulse", "Feel the steady pulse", { bpm: 80, label: "Tap the beat" })],
      try: [componentLink("DrumPads", "Play the kit", { difficulty: "easy" })],
      challenge: [componentLink("SectionStepGrid", "Build an eight-step groove")],
      reflect: [
        plannedLink("rhythm-reflection", "Groove check", "Prompt: Where is your beat? Which layer changes the feel?")
      ],
    },
    pathways: {
      foundation: "Hold a steady beat while playing one simple pattern.",
      build: "Layer kick, snare and hi-hat in a four-bar groove.",
      extend: "Change the groove to suit a different genre or section.",
    },
  },
  {
    id: "composition",
    title: "Composition Lab",
    glyph: "spark",
    summary: "Start with a small idea. Shape it, record it, then explain your choices.",
    outcomes: ["COM", "LIS", "PER"],
    focusAreas: ["practice", "context", "elements"],
    elements: ["Duration", "Pitch", "Texture", "Structure", "Dynamics & expression"],
    topicLinks: [
      topicLink("year7", "y7-composition", "Year 7 Composition"),
      topicLink("year8", "y8-composition", "Year 8 Compose & Arrange"),
      topicLink("year7", "y7-intro", "Graphic notation"),
    ],
    cycle: {
      learn: [componentLink("ImprovLab", "Improvise with a pentatonic scale", { scale: "pentatonic", bpm: 92 })],
      try: [componentLink("SectionGraphicScore", "Sketch a short graphic score")],
      challenge: [
        topicLink("year8", "y8-composition", "Develop an eight-bar motif"),
        plannedLink("compose-brief", "Choose a purpose and audience", "Write for a performer, scene or listener — not just for marks."),
      ],
      reflect: [
        plannedLink("composers-journal", "Composer's Journal", "Capture your stimulus, two choices, one revision and one next step."),
        plannedLink("ip-and-icip-check", "Credit and protocol check", "Name sources, ask before sharing, and treat First Nations material with care."),
      ],
    },
    pathways: {
      foundation: "Create one four-bar idea from a limited set of notes or sounds.",
      build: "Develop a motif using repetition, contrast or a changed rhythm.",
      extend: "Arrange, record and justify music for a clear purpose and audience.",
    },
  },
  {
    id: "listening-elements",
    title: "Listening & Elements Lab",
    glyph: "ear",
    summary: "Listen on purpose: spot one element, use the word, then connect it to context.",
    outcomes: ["LIS", "COM", "PER"],
    focusAreas: ["elements", "context", "practice"],
    elements: ["Duration", "Pitch", "Texture", "Structure", "Dynamics & expression", "Performing media & timbre"],
    topicLinks: [
      topicLink("year7", "y7-listening", "Year 7 Listening in Context"),
      topicLink("year8", "y8-listening", "Year 8 Aural Analysis"),
      topicLink("year8", "y8-concepts", "Concepts of Music"),
    ],
    cycle: {
      learn: [componentLink("ElementsExplorer", "Explore the six elements")],
      try: [componentLink("GuidedListening", "Try a guided listening")],
      challenge: [
        componentLink("SectionContextMatcher", "Match music to purpose and setting"),
        componentLink("SectionTextureToggles", "Hear layers change a texture"),
      ],
      reflect: [
        plannedLink("listening-response", "One-minute listening response", "Use one element word, one context clue and one piece of evidence."),
      ],
    },
    pathways: {
      foundation: "Identify one clear musical element in a short excerpt.",
      build: "Describe how two elements work together in a style.",
      extend: "Compare two versions and explain what changed for the audience or purpose.",
    },
  },
  {
    id: "orchestra-sound",
    title: "Orchestra & Sound Lab",
    glyph: "orchestra",
    summary: "Hear the family, follow the layers, then choose the sound that tells the story.",
    outcomes: ["LIS", "PER", "COM"],
    focusAreas: ["context", "elements", "practice"],
    elements: ["Performing media & timbre", "Texture", "Dynamics & expression", "Pitch", "Structure"],
    topicLinks: [
      topicLink("year8", "y8-orchestra", "The Orchestra"),
      topicLink("year8", "y8-film", "Film Music"),
      topicLink("year7", "y7-listening", "Listening in Context"),
    ],
    cycle: {
      learn: [componentLink("SectionOrchestraFamilies", "Meet the orchestra families")],
      try: [componentLink("SectionTextureToggles", "Turn layers on and off")],
      challenge: [
        componentLink("GuidedListening", "Follow a score or listening map"),
        plannedLink("orchestra-layering", "Choose a three-layer scene", "Pick instruments and explain the mood their timbres create."),
      ],
      reflect: [
        plannedLink("orchestra-reflection", "Sound evidence", "Name one instrument, one texture and one moment where the music changes the story."),
      ],
    },
    pathways: {
      foundation: "Recognise an instrument family and describe its sound.",
      build: "Follow two layers and describe how the texture changes.",
      extend: "Choose an orchestration for a scene and defend the choice.",
    },
  },
];

const STAGE4_COMPANION = {
  id: "stage4-music-companion",
  title: "Stage 4 Music Companion",
  subtitle: "Practise, experiment and reflect — then take your learning back to class.",
  purpose: "A helper companion for rehearsing, listening and making music. Google Classroom remains the place for teacher instructions, submissions and marks.",
  outcomes: STAGE4_OUTCOMES,
  focusAreas: STAGE4_FOCUS_AREAS,
  pathways: COMPANION_PATHWAYS,
  cycle: COMPANION_CYCLE,
  labs: STAGE4_LABS,
  repertoirePassport: STAGE4_REPERTOIRE_PASSPORT,
  integration: {
    routeConvention: "Use link.route for existing topic pages. Do not treat completion here as assessment evidence.",
    embedConvention: "For an interactive link, render window[link.component] only when it exists; show the linked topic or a friendly planned-state card otherwise.",
    progressConvention: "Store optional practice notes locally and clearly label them as personal practice, not a teacher record.",
    classroomConvention: "Add teacher-managed Google Classroom URLs outside this shared curriculum file, so class links stay private and easy to update.",
  },
};

window.STAGE4_COMPANION = STAGE4_COMPANION;
