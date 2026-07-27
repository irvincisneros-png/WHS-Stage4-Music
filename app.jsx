/* Main App: hash-routed. No login. Progress/XP/quiz data is stored locally and
   anonymously on this device (one nameless profile via window.Students). */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "sound": true,
  "difficulty": "medium"
}/*EDITMODE-END*/;

const SPECIAL_ROUTES = new Set(["pretest", "posttest", "progress", "guitar", "piano"]);

function parseHash(hash, lastYear) {
  const h = (hash || "").replace(/^#\/?/, "");
  if (!h) return { year: lastYear, special: null, topicId: null, sectionIdx: null };
  const parts = h.split("/").filter(Boolean);
  const year = parts[0] === "year7" || parts[0] === "year8" ? parts[0] : lastYear;
  const tail = parts[1] || null;
  if (tail && SPECIAL_ROUTES.has(tail)) return { year, special: tail, topicId: null, sectionIdx: null };
  // .../year/topicId/s/<index>
  let sectionIdx = null;
  if (parts[2] === "s" && parts[3] != null) {
    const n = parseInt(parts[3], 10);
    if (Number.isFinite(n)) sectionIdx = n;
  }
  return { year, special: null, topicId: tail, sectionIdx };
}

function useRoute(lastYear) {
  const [route, setRoute] = React.useState(() => parseHash(window.location.hash, lastYear));
  React.useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash, lastYear));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [lastYear]);
  return route;
}

function setRouteHash({ year, topicId, special, sectionIdx }) {
  if (special)                       location.hash = "#/" + year + "/" + special;
  else if (topicId && sectionIdx != null)
                                     location.hash = "#/" + year + "/" + topicId + "/s/" + sectionIdx;
  else if (topicId)                  location.hash = "#/" + year + "/" + topicId;
  else                               location.hash = "#/" + year;
}

/* Per-student React state hook. Reads/writes through Students.readNS / writeNS.
   Resets when the active student changes. */
function useStudentLocal(key, initial, studentId) {
  const [v, setV] = React.useState(() => window.Students.readNS(key, initial));
  // When the active student changes we reload that student's stored value.
  // That reload must NOT be written straight back out (it could land in a
  // different student's namespace before state settles), so skip the single
  // write the reload triggers.
  const skipWrite = React.useRef(false);
  React.useEffect(() => {
    skipWrite.current = true;
    setV(window.Students.readNS(key, initial));
  }, [studentId, key]);
  React.useEffect(() => {
    if (skipWrite.current) { skipWrite.current = false; return; }
    if (studentId) window.Students.writeNS(key, v);
  }, [v, studentId, key]);
  return [v, setV];
}

/* Device-level state (theme/sound/etc) stays global */
function useLocalGlobal(key, initial) {
  const [v, setV] = React.useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored != null ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, setV];
}

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    window.__SOUND_ON = tweaks.sound;
  }, [tweaks.theme, tweaks.sound]);

  // No login. A single anonymous, device-local profile: no names, no class,
  // no profile picker. Progress is saved to this browser only.
  const student = window.Students.getCurrentStudent();

  return <SignedInApp
    student={student}
    tweaks={tweaks}
    setTweak={setTweak}
  />;
}

function SignedInApp({ student, tweaks, setTweak }) {
  const studentId = student.id;

  const [storedYear, setStoredYear] = useStudentLocal("year", "year7", studentId);
  const route = useRoute(storedYear);
  const year = route.year || storedYear;

  React.useEffect(() => {
    if (year && year !== storedYear) setStoredYear(year);
  }, [year]);

  function openTweaks() {
    window.postMessage({ type: "__activate_edit_mode" }, "*");
  }

  // Practice notes are stored locally on this device. They are deliberately
  // informal and are not a school assessment or learning-management record.
  const [progress, setProgress] = useStudentLocal("progress", {}, studentId);

  function navigateYear(y) {
    setStoredYear(y);
    setRouteHash({ year: y, topicId: null });
  }
  function openTopic(id) {
    window.MusicAudio?.resume();
    setRouteHash({ year, topicId: id });
  }
  function backToYear() {
    setRouteHash({ year, topicId: null });
  }
  function openSpecial(name) {
    setRouteHash({ year, special: name });
  }
  function openSection(topicId, idx) {
    window.MusicAudio?.resume();
    setRouteHash({ year, topicId, sectionIdx: idx });
  }
  function backToTopic(topicId) {
    setRouteHash({ year, topicId });
  }

  function complete(topic, quizResult) {
    // When completion is driven by a quiz attempt, require a passing score
    // (>= 50%) before the module counts as done. The score itself is saved
    // separately by ModuleQuiz, so a failed attempt is still recorded; it just
    // doesn't earn the completion badge or XP. Interactive- and button-driven
    // completion (no quizResult) always counts.
    if (quizResult && quizResult.total > 0 &&
        quizResult.correct / quizResult.total < 0.5) {
      return;
    }
    const already = progress[topic.id]?.completed;
    setProgress(p => ({ ...p, [topic.id]: { completed: true, at: Date.now() } }));
    if (!already) {
      window.MusicAudio?.ding(true);
    }
  }

  const currentTopic = route.topicId
    ? window.CURRICULUM[year].topics.find(t => t.id === route.topicId)
    : null;

  // Read pre/post test summary for the home banner
  const preTest = window.Students.readNS("preTest." + year, null);
  const postTest = window.Students.readNS("postTest." + year, null);
  const yearTopics = window.CURRICULUM[year].topics;
  const completedCount = yearTopics.filter(t => progress[t.id]?.completed).length;

  React.useEffect(() => {
    const topicTitle = currentTopic ? currentTopic.title + " · " : "";
    document.title = topicTitle + "Stage 4 Music Companion · Woonona High";
    const main = document.getElementById("main-content");
    if (!main) return;
    requestAnimationFrame(() => main.focus({ preventScroll: true }));
  }, [year, route.special, route.topicId, route.sectionIdx]);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault();
        document.getElementById("main-content")?.focus();
      }}>Skip to main content</a>
      <Header
        year={year}
        setYear={navigateYear}
        theme={tweaks.theme}
        setTheme={(t) => setTweak("theme", t)}
        onOpenTweaks={openTweaks}
      />

      <main id="main-content" tabIndex="-1">
      {route.special === "pretest" && (
        <window.TestRunner
          year={year}
          kind="pre"
          onBack={backToYear}
          onOpenTopic={openTopic}
        />
      )}
      {route.special === "posttest" && (
        <window.TestRunner
          year={year}
          kind="post"
          onBack={backToYear}
          onOpenTopic={openTopic}
        />
      )}
      {route.special === "progress" && (
        <window.ProgressDashboard
          year={year}
          onBack={backToYear}
          onOpenTopic={openTopic}
          onTakeTest={(kind) => openSpecial(kind + "test")}
        />
      )}
      {route.special === "guitar" && (
        <window.GuitarStudio
          year={year}
          onBack={backToYear}
          onSwitch={(instrument) => openSpecial(instrument)}
          soundEnabled={tweaks.sound}
          onEnableSound={() => setTweak("sound", true)}
          onOpenSettings={openTweaks}
        />
      )}
      {route.special === "piano" && (
        <window.PianoStudio
          year={year}
          onBack={backToYear}
          onSwitch={(instrument) => openSpecial(instrument)}
        />
      )}

      {!route.special && currentTopic && route.sectionIdx != null && (
        <window.SectionPage
          year={year}
          topic={currentTopic}
          sectionIndex={route.sectionIdx}
          onBack={() => backToTopic(currentTopic.id)}
          onNavigate={openTopic}
          onNavigateSection={(i) => openSection(currentTopic.id, i)}
        />
      )}

      {!route.special && currentTopic && route.sectionIdx == null && (
        <window.TopicPage
          year={year}
          topic={currentTopic}
          completed={!!progress[currentTopic.id]?.completed}
          difficulty={tweaks.difficulty}
          onBack={backToYear}
          onComplete={complete}
          onNavigate={openTopic}
          onOpenSection={(i) => openSection(currentTopic.id, i)}
        />
      )}

      {!route.special && !currentTopic && route.sectionIdx == null && (
        <window.CompanionHome
          year={year}
          progress={progress}
          openTopic={openTopic}
          openSpecial={openSpecial}
        />
      )}
      </main>

      <footer className="footer">
        <div className="col gap-2">
          <div className="row gap-2 center">
            <WoononaMark size={32} />
            <strong>Woonona High School · Music</strong>
          </div>
          <span>Stage 4. Built around the NESA Music 7–10 Syllabus (2024).</span>
          <span>A spot for extra practice between lessons. Class is still where the real work happens.</span>
        </div>
        <div className="col gap-2" style={{ textAlign: "right" }}>
          <span className="eyebrow">Teaching team</span>
          <span>Music Faculty</span>
          <span>Woonona High School</span>
        </div>
      </footer>

      <window.TweaksPanel title="Settings">
        <window.TweakSection label="Display">
          <window.TweakRadio
            label="Theme"
            value={tweaks.theme}
            options={[
              { label: "Light", value: "light" },
              { label: "Dark",  value: "dark" },
            ]}
            onChange={(v) => setTweak("theme", v)}
          />
        </window.TweakSection>
        <window.TweakSection label="Audio">
          <window.TweakToggle
            label="Instrument and game sounds"
            value={tweaks.sound}
            onChange={(v) => setTweak("sound", v)}
          />
        </window.TweakSection>
        <window.TweakSection label="Games">
          <window.TweakRadio
            label="Game difficulty"
            value={tweaks.difficulty}
            options={[
              { label: "Easy",   value: "easy" },
              { label: "Medium", value: "medium" },
              { label: "Hard",   value: "hard" },
            ]}
            onChange={(v) => setTweak("difficulty", v)}
          />
        </window.TweakSection>
        <window.TweakSection label="This device">
          <window.TweakButton secondary label="Reset my progress" onClick={() => {
            if (!confirm("This clears practice notes, quiz scores and test results saved on this device. Continue?")) return;
            setProgress({});
            window.Students.resetProgress();
          }} />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

/* ---------- Year Home ---------- */

function YearHome({ year, progress, preTest, postTest, completedCount, totalTopics,
                    openTopic, openSpecial }) {
  const halfDone = completedCount >= Math.ceil(totalTopics / 2);

  return (
    <>
      {/* Welcome line */}
      <div className="row between center wrap gap-3" style={{ marginBottom: 18 }}>
        <div className="col">
          <div className="eyebrow">Welcome back</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)" }}>Welcome</h2>
        </div>
      </div>

      {/* Start-here band */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
        marginBottom: 28,
      }}>
        <StartTile
          tone="terracotta"
          glyph="ear"
          eyebrow={preTest ? "Pre-Test done" : "Start of year"}
          title="Pre-Test"
          desc={preTest
            ? `Last score ${preTest.correct}/${preTest.total}. Have another go any time.`
            : "A short check across every topic. We'll suggest where to start."}
          onClick={() => openSpecial("pretest")}
        />
        <StartTile
          tone="teal"
          glyph="spark"
          eyebrow={`${completedCount} / ${totalTopics} modules complete`}
          title="Your Progress"
          desc="See what you've finished, how your quizzes went, and what to work on next."
          onClick={() => openSpecial("progress")}
        />
        <StartTile
          tone="butter"
          glyph="staff"
          eyebrow={!halfDone ? "Unlocks around halfway" :
                   postTest ? "Post-Test done" : "End of year"}
          title="Post-Test"
          desc={postTest
            ? `Last score ${postTest.correct}/${postTest.total}. Have another go any time.`
            : "Take it once you've worked through most of the modules to see how far you've come."}
          onClick={() => halfDone && openSpecial("posttest")}
          disabled={!halfDone}
        />
      </div>

      <section className="home-instrument-band" aria-labelledby="instrument-studios-title">
        <div className="home-instrument-heading">
          <div>
            <div className="eyebrow">Open practice · any time</div>
            <h2 id="instrument-studios-title">Instrument studios</h2>
          </div>
          <p>
            Learn a shape, hear it, then try it on a playable instrument.
            These studios are available in both Year 7 and Year 8.
          </p>
        </div>
        <div className="home-instrument-grid">
          <StartTile
            tone="teal"
            glyph="guitar"
            eyebrow="Chords · tab · tuning"
            title="Guitar Studio"
            desc="Build beginner chords, check every string, read short tabs, practise tuning and play sample progressions."
            onClick={() => openSpecial("guitar")}
          />
          <StartTile
            tone="terracotta"
            glyph="piano"
            eyebrow="Notes · chords · songs"
            title="Piano Studio"
            desc="Map the keys, find notes, build triads and use the full two-octave play-along piano."
            onClick={() => openSpecial("piano")}
          />
        </div>
      </section>

      <YearMap yearKey={year} onOpenTopic={(t) => openTopic(t.id)} progress={progress} />

      <div className="row gap-3 wrap center" style={{
        marginTop: 24,
        padding: "14px 18px",
        background: "var(--bg-2)",
        borderRadius: 18,
        border: "1.5px dashed var(--border)",
      }}>
        <span className="eyebrow">Outcomes assessed</span>
        <Chip variant="terracotta">PER · Performing</Chip>
        <Chip variant="teal">LIS · Listening</Chip>
        <Chip variant="butter">COM · Composing</Chip>
        <span className="text-soft" style={{ fontSize: ".82rem" }}>
          NESA Music 7–10 Syllabus (2024)
        </span>
      </div>
    </>
  );
}

function StartTile({ tone, glyph, eyebrow, title, desc, onClick, disabled }) {
  return (
    <TiltCard
      intensity={disabled ? 0 : 10}
      className="chunk"
      style={{
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? .55 : 1,
        overflow: "hidden",
        minHeight: 210,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <div className={"tile-art t-" + tone} style={{
        padding: "18px 22px",
        minHeight: 110,
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        borderRadius: 0,
      }}>
        <span className="tilt-layer-3" style={{ position: "absolute", top: 12, right: 14, opacity: .9 }}>
          <Glyph name={glyph} size={56} stroke="currentColor" />
        </span>
        <div className="col gap-1">
          <div style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: ".7rem",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            opacity: .9,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}>{eyebrow}</div>
          <h2 className="tilt-layer-2" style={{
            fontSize: "1.6rem",
            color: "inherit",
            margin: 0,
          }}>{title}</h2>
        </div>
      </div>
      <div style={{ padding: "18px 22px" }}>
        <p style={{ fontSize: ".95rem", lineHeight: 1.5, color: "var(--ink-soft)" }}>{desc}</p>
      </div>
    </TiltCard>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
