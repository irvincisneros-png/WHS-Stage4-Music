/* guided-listening.jsx
   GuidedListening — MU4-LIS-01 Guided Listening component.
   Points students at REAL recordings (via YouTube search links) with
   structured, element-focused questions and model answers.

   No import/export. React is global. No audio embeds — all listening is
   done on external platforms via copyright-safe search-query links.

   Register: window.GuidedListening = GuidedListening;
*/

const { useState: useGLSt, useCallback: useGLCb } = React;

/* ------------------------------------------------------------------ */
/* Built-in curated track list                                          */
/* ------------------------------------------------------------------ */
const DEFAULT_TRACKS = [
  /* ---- First Nations / Contemporary Australian ---- */
  {
    id: "king-stingray-get-me-out",
    title: "Get Me Out",
    artist: "King Stingray",
    context: "First Nations · contemporary Australian",
    contextColor: "var(--teal)",
    whyThisTrack:
      "Yolŋu language fused with indie-rock; showcases layered guitars, strong backbeat, and call-and-response structure.",
    culturalNote:
      "King Stingray are a Yolŋu band from Yirrkala. This recording is used respectfully and with attribution.",
    questions: [
      {
        element: "Performing media & timbre",
        q: "Identify two instrumental timbres you can hear. How do they contrast with the vocal timbre?",
        model:
          "Electric guitars produce a bright, distorted timbre; bass guitar adds a deep, sustained resonance. The lead vocal timbre is nasal and relaxed, contrasting with the harder, more percussive guitar attack.",
      },
      {
        element: "Structure",
        q: "Describe one structural device — can you identify a recurring section or a contrasting section?",
        model:
          "The song follows a verse–chorus structure. The chorus is higher in pitch and louder (dynamics increase), creating a clear contrast with the verses.",
      },
      {
        element: "Duration",
        q: "How would you describe the tempo and the rhythmic feel? Is the groove regular or does it shift?",
        model:
          "The tempo is medium-fast and steady. The backbeat (snare on beats 2 and 4) creates a driving, regular groove typical of rock music.",
      },
      {
        element: "Texture",
        q: "Is the texture monophonic, homophonic, or polyphonic? Justify with specific reference to what you hear.",
        model:
          "The texture is homophonic: a single melodic vocal line is supported by chordal guitar and bass, with the rhythm section maintaining the pulse underneath.",
      },
    ],
  },
  {
    id: "baker-boy-marryuna",
    title: "Marryuna",
    artist: "Baker Boy ft. Yirrmal",
    context: "First Nations · contemporary Australian",
    contextColor: "var(--teal)",
    whyThisTrack:
      "Combines hip-hop flow in English and Yolŋu Matha with traditional elements — strong contrast of texture and rhythm.",
    culturalNote:
      "Baker Boy (Danzal Baker) is a Yolŋu man and ARIA Award winner. This work is used with attribution and respect.",
    questions: [
      {
        element: "Duration",
        q: "Compare the rhythmic delivery of the rap sections with the sung sections. What changes?",
        model:
          "The rap sections use rapid, syncopated rhythms with irregular phrase lengths, while the sung sections adopt longer, more even note durations, creating a rhythmic contrast that reflects the shift between speech-rhythm and melodic singing.",
      },
      {
        element: "Pitch",
        q: "Describe the melodic contour of the sung chorus. Does it move by steps, leaps, or a combination?",
        model:
          "The chorus melody moves largely by steps (conjunct motion) with occasional leaps upward, giving it a singable, accessible quality against the hip-hop rhythmic backdrop.",
      },
      {
        element: "Texture",
        q: "When the rap enters over the backing track, how does the texture change from the instrumental intro?",
        model:
          "The intro is heterophonic / layered beat-driven. When the rap enters, the texture becomes homophonic: the voice carries the melodic-rhythmic foreground while the beat provides a subordinate accompaniment.",
      },
      {
        element: "Dynamics & expression",
        q: "How does the production use dynamics or panning to create interest across the track?",
        model:
          "The beat maintains a consistent dynamic level throughout, while the vocal sits forward in the mix. A sudden drop or breakdown may reduce layers, lowering perceived density before a return to full texture — a common expressive device in popular music production.",
      },
    ],
  },
  {
    id: "yothu-yindi-treaty",
    title: "Treaty",
    artist: "Yothu Yindi",
    context: "First Nations · contemporary Australian",
    contextColor: "var(--teal)",
    whyThisTrack:
      "Landmark 1991 recording blending Yolŋu traditional music with rock — the yidaki (didgeridoo) provides a distinctive timbre.",
    culturalNote:
      "Yothu Yindi were from Arnhem Land. This recording carries significant political and cultural meaning for First Nations peoples.",
    questions: [
      {
        element: "Performing media & timbre",
        q: "Identify the yidaki (didgeridoo). Describe its timbre using precise vocabulary.",
        model:
          "The yidaki produces a continuous, low-pitched drone with a gravelly, buzzing timbre caused by circular breathing. Overtone harmonics and flutter-tongue techniques add brightness within the fundamental drone.",
      },
      {
        element: "Texture",
        q: "How does the layering of instruments change across the song? Start simple, then add layers.",
        model:
          "The track builds from a sparse beginning (yidaki and voice) to a dense rock texture with electric guitars, bass and drums, creating a thickening of texture. This layering process is sometimes called additive texture.",
      },
      {
        element: "Structure",
        q: "Is there a clear verse–chorus structure, or does the song use a different form? Describe what you hear.",
        model:
          "The song uses a modified verse–chorus form. The hook (\"Treaty, yeah\") functions as the chorus, returning after each verse. An instrumental break featuring traditional singing and yidaki provides a contrasting middle section.",
      },
      {
        element: "Pitch",
        q: "Describe the pitch range and tonality of the vocal melody. Does it sound major, minor, or modal?",
        model:
          "The rock-influenced sections use a minor-inflected tonality (blues-rock scale), while the traditional singing passages use a narrower pitch range rooted in a pentatonic or modal scale, contrasting with the Western tonality of the electric instruments.",
      },
    ],
  },

  /* ---- Western Art Music ---- */
  {
    id: "grieg-hall-mountain-king",
    title: "In the Hall of the Mountain King",
    artist: "Edvard Grieg",
    context: "Western art music · Romantic era (1875)",
    contextColor: "var(--terracotta)",
    whyThisTrack:
      "A masterclass in crescendo, accelerando, and additive orchestration — all audible and examinable.",
    culturalNote: null,
    questions: [
      {
        element: "Dynamics & expression",
        q: "Describe how the dynamic level changes from the opening to the climax. Use the correct Italian terms.",
        model:
          "The piece begins pianissimo (pp) and builds through a long, sustained crescendo to a fortissimo (ff) climax. This gradual increase in volume mirrors the increasing tempo and density of orchestration.",
      },
      {
        element: "Duration",
        q: "How does the tempo change throughout the piece? What is the musical term for this effect?",
        model:
          "The tempo begins slowly and increases progressively — this is called an accelerando. Combined with the crescendo, the acceleration creates a sense of mounting urgency and tension.",
      },
      {
        element: "Structure",
        q: "The piece is built on a single repeating melody. What structural technique is this?",
        model:
          "The main theme is an ostinato — a short melodic-rhythmic pattern that repeats throughout. Each repetition adds orchestral layers or shifts register, transforming the texture while the underlying pattern remains constant.",
      },
      {
        element: "Texture",
        q: "How does the texture change from the opening single-instrument statement to the full orchestra?",
        model:
          "The opening is monophonic (a single melodic line). As instruments enter successively, the texture becomes homophonic and ultimately polyphonic at the climax, with multiple lines moving simultaneously across the full orchestra.",
      },
    ],
  },
  {
    id: "holst-mars",
    title: "Mars, the Bringer of War",
    artist: "Gustav Holst",
    context: "Western art music · Romantic/Impressionist (1914–16)",
    contextColor: "var(--terracotta)",
    whyThisTrack:
      "Quintuple metre (5/4), brass-dominant timbre, ostinato bass — ideal for exploring metre, texture and performing media.",
    culturalNote: null,
    questions: [
      {
        element: "Duration",
        q: "This piece is written in an unusual metre. Can you count the beats? How does it feel different from 4/4?",
        model:
          "Mars is in 5/4 time — five crotchet beats per bar. This creates an uneven, restless feel compared to the symmetrical pulse of 4/4, reinforcing the sense of unease and aggression.",
      },
      {
        element: "Performing media & timbre",
        q: "Which instrument family dominates the climax? Describe the timbral quality.",
        model:
          "Brass instruments (trombones, trumpets, tuba) dominate the climax, producing a powerful, penetrating, and aggressive timbre. The brass is characterised by a forceful, metallic resonance that contributes to the music's martial, threatening character.",
      },
      {
        element: "Dynamics & expression",
        q: "Identify a moment of sudden dynamic contrast. What effect does it create?",
        model:
          "Sudden sforzando (sfz) accents punctuate the relentless rhythmic ostinato. These sudden louds against the driving rhythm create a shocking, violent effect that represents the brutality of war.",
      },
      {
        element: "Texture",
        q: "Describe the bass ostinato. How does it contribute to the overall texture?",
        model:
          "The bass ostinato — a repeating low rhythmic pattern in strings and timpani — underpins the entire movement, creating a dense, layered texture. Upper woodwind and brass lines are added over this foundation, producing a polyphonic and increasingly complex texture.",
      },
    ],
  },

  /* ---- Jazz ---- */
  {
    id: "brubeck-take-five",
    title: "Take Five",
    artist: "Dave Brubeck Quartet",
    context: "Jazz · Cool jazz (1959)",
    contextColor: "var(--butter-d)",
    whyThisTrack:
      "Famous for its 5/4 metre and Paul Desmond's alto saxophone timbre — excellent for metre, improvisation, and performing media.",
    culturalNote: null,
    questions: [
      {
        element: "Duration",
        q: "This piece is in 5/4 metre. Where is the primary accent in each bar? How does it feel to listen to?",
        model:
          "The standard grouping is 3 + 2 (three + two quavers), placing the primary accent on beat 1 and a secondary accent on beat 4. This creates an asymmetric, slightly lurching feel quite distinct from the balanced pulse of 4/4.",
      },
      {
        element: "Performing media & timbre",
        q: "Identify the instruments heard and describe the timbre of the saxophone.",
        model:
          "The quartet comprises alto saxophone, piano, double bass and drum kit. The alto saxophone produces a smooth, cool, slightly breathy timbre — a hallmark of the Cool jazz style — in contrast to the harder-edged sound of bebop saxophone playing.",
      },
      {
        element: "Texture",
        q: "During the improvised saxophone solo, how does the texture change compared to the head (main theme)?",
        model:
          "During the main theme (head), the texture is homophonic: the melody is carried by the saxophone over chordal piano comping. During the improvisation the piano largely drops out (leaving a two-chord vamp), thinning the texture so the soloist's melodic invention is foregrounded.",
      },
      {
        element: "Structure",
        q: "Jazz pieces often follow a head–solos–head structure. Can you hear this form in Take Five?",
        model:
          "Yes — the piece opens with the composed melody (head), moves into an extended drum solo and saxophone improvisation (solos section), then returns to the recognisable melody (head out). This cyclic form is standard in jazz performance.",
      },
    ],
  },
  {
    id: "armstrong-wonderful-world",
    title: "What a Wonderful World",
    artist: "Louis Armstrong",
    context: "Jazz · Popular/Swing (1967)",
    contextColor: "var(--butter-d)",
    whyThisTrack:
      "Armstrong's iconic gravelly vocal timbre alongside lush orchestration — ideal for timbre, texture and expression.",
    culturalNote: null,
    questions: [
      {
        element: "Performing media & timbre",
        q: "Describe Louis Armstrong's vocal timbre. What makes it distinctive?",
        model:
          "Armstrong's voice is low, gravelly, and husky — sometimes described as raspy or gruff. This rough, warm timbre is created by scar tissue on his vocal cords from years of trumpet playing. It contrasts markedly with the smooth string orchestration beneath him.",
      },
      {
        element: "Dynamics & expression",
        q: "How does Armstrong use dynamics and phrasing to express emotion in the delivery?",
        model:
          "Armstrong maintains a restrained, intimate dynamic level (mp–mf) throughout, using slight swells and gentle emphasis on key words (e.g. 'wonderful') to convey tenderness. The controlled breath support and deliberate pacing are characteristic of expressive ballad singing.",
      },
      {
        element: "Texture",
        q: "Describe the texture created by the voice plus string orchestra. How many melodic layers are there?",
        model:
          "The texture is homophonic: the vocal line carries the melody while the string orchestra provides a rich, sustained harmonic cushion. There is essentially one melodic foreground (the voice) supported by a chordal-textured background.",
      },
      {
        element: "Pitch",
        q: "Is the tonality of this piece major or minor? How does this contribute to the expressive character?",
        model:
          "The piece is in a major key, giving it a warm, optimistic quality. The melody moves primarily by steps (conjunct motion) within a relatively narrow range, making it accessible and singable, reinforcing its gentle, nostalgic mood.",
      },
    ],
  },

  /* ---- Global / Non-Western ---- */
  {
    id: "north-indian-classical",
    title: "Tabla & Sitar — North Indian classical raga",
    artist: "Search: Ravi Shankar sitar Tabla",
    context: "Global · North Indian classical",
    contextColor: "#7c4a7e",
    whyThisTrack:
      "A raga performance illustrates microtonal pitch, cyclic tala metre, gradual tempo increase (alap to gat), and non-Western modal scales.",
    culturalNote: null,
    questions: [
      {
        element: "Duration",
        q: "Describe how the tempo changes from the opening (alap) to the later sections. What effect does this create?",
        model:
          "The alap (introductory section) is performed without a steady beat — free metre — with the sitar exploring the raga's notes slowly and expressively. As the performance progresses through the jod and gat sections, the tabla enters and the tempo increases, building energy and complexity.",
      },
      {
        element: "Pitch",
        q: "How does pitch organisation in a raga differ from a Western major scale?",
        model:
          "A raga uses a specific set of pitches (sometimes fewer than seven notes) with precise rules about which notes are emphasised and in which direction (ascending vs descending). The sitar also uses ornaments (meend — slides between pitches) that produce microtonal inflections absent from the equal-tempered Western scale.",
      },
      {
        element: "Performing media & timbre",
        q: "Describe the timbre of the sitar and tabla. What is distinctive about each instrument?",
        model:
          "The sitar produces a bright, plucked timbre with a characteristic buzzing resonance caused by sympathetic strings. The tabla (pair of hand drums) produce a variety of pitched and unpitched tones — a sharp, high snap on the dayan and a deeper, resonant boom on the bayan — enabling melodic as well as rhythmic playing.",
      },
      {
        element: "Texture",
        q: "During the alap (opening section), how would you describe the texture? Does it change later?",
        model:
          "The alap is monophonic or heterophonic — a single melodic instrument (sitar) plays without rhythmic accompaniment, though the tanpura drone may be present providing a sustained harmonic background. Once the tabla enters, the texture becomes more layered and interactive.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Utility: build YouTube search URL                                    */
/* ------------------------------------------------------------------ */
function makeSearchUrl(artist, title) {
  return (
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(artist + " " + title + " official")
  );
}

/* ------------------------------------------------------------------ */
/* QuestionBlock — single question with reveal toggle                   */
/* ------------------------------------------------------------------ */
function QuestionBlock({ element, q, model, explored, onReveal }) {
  const [open, setOpen] = useGLSt(false);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && onReveal) onReveal();
  }

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        display: "grid",
        gap: 8,
      }}
    >
      {/* Element chip + question */}
      <div className="row gap-2 wrap" style={{ alignItems: "flex-start" }}>
        <span
          className="mono"
          style={{
            fontSize: ".68rem",
            fontWeight: 700,
            letterSpacing: ".06em",
            color: "var(--terracotta)",
            background: "color-mix(in oklab, var(--terracotta) 10%, transparent)",
            border: "1px solid color-mix(in oklab, var(--terracotta) 25%, transparent)",
            borderRadius: 5,
            padding: "2px 7px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {element}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: ".9rem",
            lineHeight: 1.5,
            color: "var(--ink)",
            flex: 1,
          }}
        >
          {q}
        </p>
      </div>

      {/* Reveal toggle */}
      <button
        className="btn btn-ghost"
        onClick={handleToggle}
        style={{
          padding: "6px 12px",
          fontSize: ".78rem",
          alignSelf: "flex-start",
          color: open ? "var(--teal)" : "var(--ink-soft)",
          borderColor: open
            ? "color-mix(in oklab, var(--teal) 40%, transparent)"
            : "var(--border)",
        }}
      >
        {open ? "▲ Hide model answer" : "▼ Reveal a model answer"}
      </button>

      {open && (
        <div
          style={{
            padding: "10px 13px",
            borderRadius: 8,
            background: "color-mix(in oklab, var(--teal) 8%, transparent)",
            border: "1px solid color-mix(in oklab, var(--teal) 22%, transparent)",
          }}
        >
          <span
            className="mono"
            style={{
              display: "block",
              fontSize: ".68rem",
              color: "var(--teal)",
              letterSpacing: ".08em",
              marginBottom: 5,
            }}
          >
            MODEL ANSWER
          </span>
          <p
            style={{
              margin: 0,
              fontSize: ".88rem",
              lineHeight: 1.55,
              color: "var(--ink)",
            }}
          >
            {model}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TrackCard — one listening card                                        */
/* ------------------------------------------------------------------ */
function TrackCard({ track }) {
  const [explored, setExplored] = useGLSt(false);
  const [anyRevealed, setAnyRevealed] = useGLSt(false);

  const searchUrl = makeSearchUrl(track.artist, track.title);

  function handleListen() {
    setExplored(true);
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  }

  function handleReveal() {
    setAnyRevealed(true);
  }

  const isFirstNations =
    track.context && track.context.toLowerCase().includes("first nations");

  return (
    <div
      className="chunk"
      style={{
        padding: 0,
        overflow: "hidden",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
        background: "var(--bg-2)",
        display: "grid",
        gap: 0,
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "16px 18px 14px",
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gap: 8,
        }}
      >
        {/* Top row: context chip + explored badge */}
        <div className="row between center wrap gap-2">
          <span
            className="mono"
            style={{
              fontSize: ".66rem",
              fontWeight: 700,
              letterSpacing: ".07em",
              color: track.contextColor || "var(--ink-soft)",
              background:
                "color-mix(in oklab, " +
                (track.contextColor || "var(--ink-soft)") +
                " 12%, transparent)",
              border:
                "1px solid color-mix(in oklab, " +
                (track.contextColor || "var(--ink-soft)") +
                " 28%, transparent)",
              borderRadius: 5,
              padding: "2px 8px",
            }}
          >
            {track.context}
          </span>

          {(explored || anyRevealed) && (
            <span
              className="mono"
              style={{
                fontSize: ".64rem",
                color: "var(--teal)",
                letterSpacing: ".06em",
              }}
            >
              ✓ explored
            </span>
          )}
        </div>

        {/* Title & artist */}
        <div>
          <strong
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              lineHeight: 1.15,
              color: "var(--ink)",
            }}
          >
            {track.title}
          </strong>
          <span
            className="text-soft"
            style={{ fontSize: ".88rem", marginTop: 2, display: "block" }}
          >
            {track.artist}
          </span>
        </div>

        {/* Why this track */}
        <p
          style={{
            margin: 0,
            fontSize: ".84rem",
            lineHeight: 1.45,
            color: "var(--ink-soft)",
            fontStyle: "italic",
          }}
        >
          {track.whyThisTrack}
        </p>

        {/* Cultural note (First Nations only) */}
        {isFirstNations && track.culturalNote && (
          <p
            style={{
              margin: 0,
              fontSize: ".76rem",
              lineHeight: 1.4,
              color: "var(--teal)",
              background:
                "color-mix(in oklab, var(--teal) 8%, transparent)",
              border:
                "1px solid color-mix(in oklab, var(--teal) 20%, transparent)",
              borderRadius: 7,
              padding: "6px 10px",
            }}
          >
            {track.culturalNote}
          </p>
        )}

        {/* Listen button */}
        <div>
          <button
            className="btn btn-primary"
            onClick={handleListen}
            style={{ padding: "9px 20px", fontSize: ".9rem" }}
          >
            Listen &#9654; — search YouTube
          </button>
          <p
            className="mono text-soft"
            style={{ fontSize: ".66rem", marginTop: 5, marginBottom: 0 }}
          >
            Opens a YouTube search for official uploads in a new tab. No audio
            is embedded in this site.
          </p>
        </div>
      </div>

      {/* Questions */}
      <div style={{ padding: "14px 18px 18px", display: "grid", gap: 10 }}>
        <span
          className="eyebrow"
          style={{ fontSize: ".7rem", marginBottom: 2 }}
        >
          Guided listening questions
        </span>
        {track.questions.map((qBlock, i) => (
          <QuestionBlock
            key={i}
            element={qBlock.element}
            q={qBlock.q}
            model={qBlock.model}
            explored={explored}
            onReveal={handleReveal}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GuidedListening — main component                                     */
/* ------------------------------------------------------------------ */
function GuidedListening({ tracks }) {
  const trackList = tracks && tracks.length > 0 ? tracks : DEFAULT_TRACKS;

  /* Group by context for display */
  const grouped = trackList.reduce((acc, t) => {
    const key = t.context || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const [activeContext, setActiveContext] = useGLSt(null);

  /* Contexts present in the current list */
  const contexts = Object.keys(grouped);

  /* Which tracks to show: all, or filtered by context tab */
  const visibleTracks = activeContext
    ? (grouped[activeContext] || [])
    : trackList;

  return (
    <div className="chunk paper" style={{ padding: 22, display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="row between center wrap gap-2">
        <div>
          <div className="eyebrow">MU4-LIS-01 · Guided listening</div>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
            Real recordings — describe music in context
          </strong>
        </div>
        <span className="mono text-soft" style={{ fontSize: ".76rem" }}>
          {trackList.length} track{trackList.length !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-soft" style={{ fontSize: ".88rem", margin: 0, lineHeight: 1.55 }}>
        Select a track, then click <strong>Listen</strong> to open an official YouTube
        search in a new tab. Answer each guided question in your workbook using precise
        musical vocabulary, then reveal the model answer to self-assess.
      </p>

      {/* Context filter tabs */}
      {contexts.length > 1 && (
        <div className="row gap-2 wrap">
          <button
            className={activeContext === null ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setActiveContext(null)}
            style={{ padding: "6px 14px", fontSize: ".8rem" }}
          >
            All
          </button>
          {contexts.map((ctx) => (
            <button
              key={ctx}
              className={activeContext === ctx ? "btn btn-primary" : "btn btn-ghost"}
              onClick={() => setActiveContext(ctx === activeContext ? null : ctx)}
              style={{ padding: "6px 14px", fontSize: ".8rem" }}
            >
              {ctx}
            </button>
          ))}
        </div>
      )}

      {/* Track cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))",
          gap: 18,
        }}
      >
        {visibleTracks.map((t) => (
          <TrackCard key={t.id} track={t} />
        ))}
      </div>

      {/* Footer note */}
      <p
        className="mono text-soft"
        style={{ fontSize: ".7rem", margin: 0, lineHeight: 1.45 }}
      >
        Copyright notice: This component does not host, stream, or reproduce any audio.
        All listening happens on the rights-holder's own YouTube channel via a search query.
        First Nations artists are credited by name; no cultural imagery is used.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Register                                                              */
/* ------------------------------------------------------------------ */
window.GuidedListening = GuidedListening;
