/* TestRunner: pre-test and post-test driver.
   Samples one question per topic, runs them, then shows a results page
   with per-topic accuracy and personalised focus recommendations. */

function TestRunner({ year, kind, onBack, onOpenTopic }) {
  // kind: "pre" or "post"
  const storageKey = kind + "Test." + year;
  const questions = React.useMemo(() => window.buildYearTest(year), [year, kind]);
  const [phase, setPhase] = React.useState("intro");      // intro | running | done
  const [results, setResults] = React.useState(null);
  const yearData = window.CURRICULUM[year];

  const preTestSaved = React.useMemo(() => window.Students.readNS("preTest." + year, null), [year, phase]);
  const postTestSaved = React.useMemo(() => window.Students.readNS("postTest." + year, null), [year, phase]);

  const previous = kind === "pre" ? preTestSaved : postTestSaved;

  function onFinish(answers) {
    const byTopic = {};
    for (const a of answers) {
      const t = a.topicId;
      if (!byTopic[t]) byTopic[t] = { correct: 0, total: 0 };
      byTopic[t].total += 1;
      if (a.correct) byTopic[t].correct += 1;
    }
    const correct = answers.filter(a => a.correct).length;
    const result = {
      kind, year, correct, total: answers.length, byTopic, at: Date.now(),
    };
    window.Students.writeNS(storageKey, result);
    setResults(result);
    setPhase("done");
  }

  if (phase === "intro") {
    return (
      <article className="col gap-6">
        <div className="row between center wrap gap-3">
          <button className="btn btn-ghost" onClick={onBack}>← Back to {yearData.label}</button>
          <Chip>{yearData.label}</Chip>
        </div>

        <div className="chunk paper" style={{ padding: "40px 36px" }}>
          <div className="eyebrow">{kind === "pre" ? "Start of year" : "End of year"}</div>
          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", marginTop: 8 }}>
            {kind === "pre" ? "Pre-Test" : "Post-Test"}
          </h1>
          <p style={{ fontSize: "1.1rem", lineHeight: 1.55, maxWidth: 720, marginTop: 14 }}>
            {kind === "pre"
              ? "A quick check of your music knowledge across every topic this year. Don't stress if you don't know the answers yet. The results will point you to the topics worth starting with."
              : "Now that you've worked through the modules, take this end-of-year check. You'll see it side-by-side with your Pre-Test so you can see how far you've come."}
          </p>
          <div className="row gap-3 wrap mt-6">
            <Chip>{questions.length} multiple-choice questions</Chip>
            <Chip>4 options each</Chip>
            <Chip>~{Math.ceil(questions.length * 0.8)} minutes</Chip>
            {kind === "post" && !preTestSaved && (
              <Chip variant="butter">Tip: take the Pre-Test first for comparison</Chip>
            )}
          </div>

          {previous && (
            <div className="mt-6" style={{
              padding: "14px 18px",
              borderRadius: 14,
              background: "var(--bg)",
              border: "1.5px dashed var(--border)",
              maxWidth: 560,
              fontSize: ".95rem",
            }}>
              <strong>You've taken this before.</strong> Last attempt: {previous.correct} / {previous.total}.
              Retaking will overwrite that result.
            </div>
          )}

          <div className="row gap-3 wrap mt-8">
            <button className="btn btn-primary" onClick={() => setPhase("running")}>
              ▶ Begin {kind === "pre" ? "Pre-Test" : "Post-Test"}
            </button>
            <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
          </div>
        </div>
      </article>
    );
  }

  if (phase === "running") {
    return (
      <article className="col gap-6">
        <div className="row between center wrap gap-3">
          <Chip>{kind === "pre" ? "Pre-Test" : "Post-Test"}</Chip>
          <Chip>{yearData.label}</Chip>
        </div>
        <Quiz
          questions={questions}
          label={kind === "pre" ? "Pre-Test" : "Post-Test"}
          showExplain={kind === "post"}
          showTopic={false}
          onFinish={onFinish}
        />
      </article>
    );
  }

  // phase === "done": results
  const pct = Math.round((results.correct / results.total) * 100);

  // Per-topic rows in the order of the curriculum
  const rows = yearData.topics
    .map(t => ({ topic: t, score: results.byTopic[t.id] }))
    .filter(r => r.score);

  // weak topics: any incorrect answers, sorted weakest-first
  const focusList = rows.filter(r => r.score.correct < r.score.total)
                       .slice()
                       .sort((a, b) => (a.score.correct / a.score.total) - (b.score.correct / b.score.total));

  // comparison if post-test
  let comparison = null;
  if (kind === "post" && preTestSaved) {
    comparison = {
      preCorrect: preTestSaved.correct,
      postCorrect: results.correct,
      total: results.total,
      perTopic: yearData.topics.map(t => ({
        topic: t,
        pre: preTestSaved.byTopic?.[t.id],
        post: results.byTopic[t.id],
      })).filter(r => r.pre || r.post),
    };
  }

  return (
    <article className="col gap-6">
      <div className="row between center wrap gap-3">
        <button className="btn btn-ghost" onClick={onBack}>← Back to {yearData.label}</button>
        <Chip variant={pct >= 75 ? "teal" : pct >= 50 ? "butter" : "terracotta"}>
          {kind === "pre" ? "Pre-Test" : "Post-Test"} complete
        </Chip>
      </div>

      {/* Hero result card */}
      <div className="chunk paper" style={{ padding: "36px 32px" }}>
        <div className="row gap-6 wrap center" style={{ justifyContent: "space-between" }}>
          <div className="col gap-2">
            <div className="eyebrow">{kind === "pre" ? "Your starting point" : "Your end-of-year result"}</div>
            <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)" }}>
              {results.correct} <span className="text-soft" style={{ fontWeight: 600 }}>/ {results.total}</span>
            </h1>
            <div className="row gap-2 center">
              <span className="hud-pill" style={{
                background: pct >= 75 ? "var(--teal)" : pct >= 50 ? "var(--butter)" : "var(--terracotta)",
                color: "#fff",
                borderColor: "transparent",
              }}>{pct}%</span>
              {comparison && (
                <span className="hud-pill">
                  {comparison.postCorrect - comparison.preCorrect >= 0 ? "▲" : "▼"} {Math.abs(comparison.postCorrect - comparison.preCorrect)} from Pre-Test
                </span>
              )}
            </div>
          </div>

          {/* Big radial */}
          <ScoreDial value={pct} size={180} />
        </div>
      </div>

      {/* Per-topic breakdown */}
      <section className="chunk paper" style={{ padding: "26px 28px" }}>
        <div className="eyebrow mb-2">Topic-by-topic breakdown</div>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>How you did across the year</h2>
        <div className="col gap-2">
          {rows.map(({ topic, score }) => {
            const tpct = Math.round((score.correct / score.total) * 100);
            return (
              <div key={topic.id} className="row center gap-3" style={{
                padding: "10px 14px",
                background: "var(--bg)",
                borderRadius: 12,
                border: "1.5px solid var(--border)",
              }}>
                <div className="row center gap-3" style={{ flex: "1 1 200px", minWidth: 160 }}>
                  <Glyph name={topic.glyph} size={26} stroke="var(--ink-soft)" />
                  <div className="col" style={{ minWidth: 0 }}>
                    <strong style={{ fontFamily: "var(--font-display)" }}>{topic.title}</strong>
                    <span className="text-soft mono" style={{ fontSize: ".7rem" }}>{topic.eyebrow}</span>
                  </div>
                </div>
                <div style={{ flex: "2 1 220px", minWidth: 140 }}>
                  <div className="xp-bar" style={{ width: "100%" }}>
                    <i style={{ width: tpct + "%" }} />
                  </div>
                </div>
                <div className="mono" style={{ fontSize: ".82rem", minWidth: 56, textAlign: "right" }}>
                  {score.correct}/{score.total}
                </div>
                <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: ".82rem" }}
                  onClick={() => onOpenTopic(topic.id)}>Open ▸</button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Focus recommendations */}
      {focusList.length > 0 && (
        <section className="chunk paper" style={{ padding: "26px 28px" }}>
          <div className="eyebrow mb-2">Where to focus next</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>
            {focusList.length === 1 ? "1 module to revisit" : `${focusList.length} modules to revisit`}
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}>
            {focusList.map(({ topic, score }) => (
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
                    <span className="text-soft" style={{ fontSize: ".82rem" }}>
                      {score.correct} / {score.total} on the test
                    </span>
                  </div>
                </div>
                <div className="row between center tilt-layer-2 mt-4">
                  <Chip variant="terracotta">Open module ▸</Chip>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>
      )}

      {/* Pre vs Post comparison */}
      {comparison && (
        <section className="chunk paper" style={{ padding: "26px 28px" }}>
          <div className="eyebrow mb-2">Your growth</div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>Pre-Test vs Post-Test, by topic</h2>
          <div className="col gap-3">
            {comparison.perTopic.map(({ topic, pre, post }) => {
              const prePct = pre ? Math.round((pre.correct / pre.total) * 100) : 0;
              const postPct = post ? Math.round((post.correct / post.total) * 100) : 0;
              const delta = postPct - prePct;
              return (
                <div key={topic.id} className="row center gap-3 wrap" style={{
                  padding: "10px 14px",
                  background: "var(--bg)",
                  borderRadius: 12,
                  border: "1.5px solid var(--border)",
                }}>
                  <strong style={{ fontFamily: "var(--font-display)", flex: "1 1 160px", minWidth: 140 }}>{topic.title}</strong>
                  <div style={{ flex: "2 1 280px", display: "flex", flexDirection: "column", gap: 4, minWidth: 200 }}>
                    <div className="row center gap-2">
                      <span className="text-soft mono" style={{ fontSize: ".7rem", width: 36 }}>PRE</span>
                      <div className="xp-bar" style={{ flex: 1 }}><i style={{ width: prePct + "%", background: "var(--ink-soft)" }} /></div>
                      <span className="mono" style={{ fontSize: ".75rem", width: 36, textAlign: "right" }}>{prePct}%</span>
                    </div>
                    <div className="row center gap-2">
                      <span className="text-soft mono" style={{ fontSize: ".7rem", width: 36 }}>POST</span>
                      <div className="xp-bar" style={{ flex: 1 }}><i style={{ width: postPct + "%" }} /></div>
                      <span className="mono" style={{ fontSize: ".75rem", width: 36, textAlign: "right" }}>{postPct}%</span>
                    </div>
                  </div>
                  <div className="mono" style={{
                    fontWeight: 700,
                    minWidth: 56,
                    textAlign: "right",
                    color: delta > 0 ? "var(--teal)" : delta < 0 ? "var(--terracotta)" : "var(--ink-soft)",
                  }}>
                    {delta > 0 ? "+" : ""}{delta}%
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="row center gap-3 wrap" style={{ marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={() => { setPhase("intro"); setResults(null); }}>
          ↻ Take it again
        </button>
        <button className="btn btn-primary" onClick={onBack}>
          ← Back to {yearData.label}
        </button>
      </div>
    </article>
  );
}

/* Score dial: radial progress */
function ScoreDial({ value, size = 160, label }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = c * (pct / 100);
  const colour = pct >= 75 ? "var(--teal)" : pct >= 50 ? "var(--butter)" : "var(--terracotta)";
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r}
          stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r}
          stroke={colour} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dasharray .8s var(--ease-spring)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: size * 0.28,
          lineHeight: 1,
        }}>{pct}%</div>
        {label && <div className="text-soft mono" style={{ fontSize: ".7rem", marginTop: 4 }}>{label}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { TestRunner, ScoreDial });
