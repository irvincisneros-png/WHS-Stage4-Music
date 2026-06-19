/* ProgressDashboard: year-level overview of completion, module-quiz scores,
   and pre/post test results. Acts as the "where to focus" hub. */

function ProgressDashboard({ year, onBack, onOpenTopic, onTakeTest }) {
  const yearData = window.CURRICULUM[year];

  // Read everything from the per-student namespace
  const progress = window.Students.readNS("progress", {});
  const quizScores = window.Students.readNS("quizScores", {});
  const preTest = window.Students.readNS("preTest." + year, null);
  const postTest = window.Students.readNS("postTest." + year, null);

  // Per-topic computed stats
  const stats = yearData.topics.map(t => {
    const done = !!progress[t.id]?.completed;
    const q = quizScores[t.id];
    const pre = preTest?.byTopic?.[t.id];
    const post = postTest?.byTopic?.[t.id];
    const quizPct = q ? Math.round((q.correct / q.total) * 100) : null;
    return { topic: t, done, q, quizPct, pre, post };
  });

  const completedCount = stats.filter(s => s.done).length;
  const total = stats.length;
  const overallPct = Math.round((completedCount / total) * 100);
  const avgQuizPct = (() => {
    const taken = stats.filter(s => s.quizPct != null);
    if (!taken.length) return null;
    return Math.round(taken.reduce((a, s) => a + s.quizPct, 0) / taken.length);
  })();

  // Top focus: incomplete modules OR low quiz score
  const focus = stats
    .filter(s => !s.done || (s.quizPct != null && s.quizPct < 75))
    .sort((a, b) => {
      // prioritise: not-done, then lowest quiz score, then not-quizzed
      if (a.done !== b.done) return a.done ? 1 : -1;
      const aQ = a.quizPct == null ? 50 : a.quizPct;
      const bQ = b.quizPct == null ? 50 : b.quizPct;
      return aQ - bQ;
    })
    .slice(0, 6);

  return (
    <article className="col gap-6">
      <div className="row between center wrap gap-3">
        <button className="btn btn-ghost" onClick={onBack}>← Back to {yearData.label}</button>
        <Chip>{yearData.label}</Chip>
      </div>

      {/* Hero */}
      <header className="chunk paper" style={{ padding: "36px 32px" }}>
        <div className="row gap-6 wrap center" style={{ justifyContent: "space-between" }}>
          <div className="col gap-3">
            <div className="eyebrow">Progress dashboard</div>
            <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)" }}>Where you're at</h1>
            <p className="text-soft" style={{ fontSize: "1.05rem", maxWidth: 560, lineHeight: 1.55 }}>
              See which modules you've completed, how the quizzes went, and what to focus on next.
            </p>
            <div className="row gap-2 wrap mt-2">
              <Chip variant="terracotta">{completedCount} / {total} modules</Chip>
              {avgQuizPct != null && <Chip variant="teal">{avgQuizPct}% avg quiz</Chip>}
              {preTest && <Chip>Pre-Test {preTest.correct}/{preTest.total}</Chip>}
              {postTest && <Chip variant="butter">Post-Test {postTest.correct}/{postTest.total}</Chip>}
            </div>
          </div>

          <div className="row gap-6 wrap center">
            <div className="col center">
              <ScoreDial value={overallPct} size={150} label="modules" />
            </div>
            {avgQuizPct != null && (
              <div className="col center">
                <ScoreDial value={avgQuizPct} size={150} label="avg quiz" />
              </div>
            )}
          </div>
        </div>

        <div className="row gap-3 wrap mt-6">
          <button className="btn btn-teal" onClick={() => onTakeTest("pre")}>
            {preTest ? "↻ Retake Pre-Test" : "▶ Take Pre-Test"}
          </button>
          <button className="btn btn-primary"
                  onClick={() => onTakeTest("post")}
                  disabled={completedCount < Math.ceil(total * 0.5)}
                  style={completedCount < Math.ceil(total * 0.5) ? { opacity: .5, cursor: "not-allowed" } : null}>
            {postTest ? "↻ Retake Post-Test" : "▶ Take Post-Test"}
          </button>
          {completedCount < Math.ceil(total * 0.5) && (
            <span className="text-soft" style={{ alignSelf: "center", fontSize: ".85rem" }}>
              Post-Test unlocks after finishing about half the modules.
            </span>
          )}
        </div>
      </header>

      {/* Focus list: biggest impact area */}
      {focus.length > 0 && (
        <section className="chunk paper" style={{ padding: "26px 28px" }}>
          <div className="eyebrow mb-2">Recommended focus</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>
            Start with these {focus.length}
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}>
            {focus.map(({ topic, done, quizPct }) => (
              <TiltCard key={topic.id} intensity={6} className="chunk" style={{
                padding: 18,
                cursor: "pointer",
                background: "var(--bg-2)",
              }} onClick={() => onOpenTopic(topic.id)}>
                <div className="row gap-3 center tilt-layer-1">
                  <div className={"tile-art t-" + topic.theme} style={{
                    width: 44, height: 44, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Glyph name={topic.glyph} size={26} stroke="currentColor" />
                  </div>
                  <div className="col" style={{ minWidth: 0 }}>
                    <strong style={{ fontFamily: "var(--font-display)" }}>{topic.title}</strong>
                    <span className="text-soft" style={{ fontSize: ".82rem" }}>{topic.eyebrow}</span>
                  </div>
                </div>
                <div className="row gap-2 wrap tilt-layer-2 mt-4">
                  {!done && <Chip variant="terracotta">Not started</Chip>}
                  {done && quizPct != null && quizPct < 75 && (
                    <Chip variant="butter">Quiz {quizPct}%</Chip>
                  )}
                  {done && quizPct == null && <Chip variant="teal">Try the quiz</Chip>}
                </div>
              </TiltCard>
            ))}
          </div>
        </section>
      )}

      {/* Full topic list */}
      <section className="chunk paper" style={{ padding: "26px 28px" }}>
        <div className="eyebrow mb-2">All modules</div>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>{yearData.label}</h2>
        <div className="col gap-2">
          {stats.map(({ topic, done, quizPct, pre, post }) => (
            <div key={topic.id} className="row center gap-3 wrap" style={{
              padding: "10px 14px",
              background: done ? "var(--bg-2)" : "var(--bg)",
              borderRadius: 12,
              border: "1.5px solid " + (done ? "var(--teal)" : "var(--border)"),
              borderLeftWidth: done ? 5 : 1.5,
            }}>
              <div className="row center gap-3" style={{ flex: "1 1 200px", minWidth: 180 }}>
                <Glyph name={topic.glyph} size={22} stroke={done ? "var(--teal)" : "var(--ink-soft)"} />
                <div className="col" style={{ minWidth: 0 }}>
                  <strong style={{ fontFamily: "var(--font-display)" }}>{topic.title}</strong>
                  <span className="text-soft" style={{ fontSize: ".78rem" }}>{topic.eyebrow}</span>
                </div>
              </div>
              <div className="row center gap-2 wrap" style={{ flex: "2 1 320px" }}>
                {done ? <Chip variant="teal">✓ Done</Chip> : <Chip>Not started</Chip>}
                {quizPct != null && (
                  <Chip variant={quizPct >= 75 ? "teal" : "butter"}>Quiz {quizPct}%</Chip>
                )}
                {pre && <Chip>Pre {pre.correct}/{pre.total}</Chip>}
                {post && <Chip variant="butter">Post {post.correct}/{post.total}</Chip>}
              </div>
              <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: ".82rem" }}
                onClick={() => onOpenTopic(topic.id)}>Open ▸</button>
            </div>
          ))}
        </div>
      </section>

      {/* Pre vs Post comparison */}
      {preTest && postTest && (
        <section className="chunk paper" style={{ padding: "26px 28px" }}>
          <div className="eyebrow mb-2">Pre-Test vs Post-Test</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>Your growth this year</h2>
          <div className="row gap-6 wrap center" style={{ marginBottom: 18 }}>
            <div className="col center">
              <ScoreDial value={Math.round(preTest.correct / preTest.total * 100)} size={120} label="Pre" />
            </div>
            <div className="col center">
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800 }}>
                {postTest.correct - preTest.correct >= 0 ? "+" : ""}
                {postTest.correct - preTest.correct} questions
              </div>
              <div className="text-soft mono" style={{ fontSize: ".75rem", marginTop: 4 }}>growth across the year</div>
            </div>
            <div className="col center">
              <ScoreDial value={Math.round(postTest.correct / postTest.total * 100)} size={120} label="Post" />
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

window.ProgressDashboard = ProgressDashboard;
