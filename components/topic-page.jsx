/* Topic Page — full-page detail view for a single module.
   Replaces the previous modal. Hash-routed via app.jsx. */

/* Maps outcome keys to NSW syllabus codes + labels */
const OUTCOME_MAP = {
  PER: { code: "MU4-PER-01", label: "Performing" },
  LIS: { code: "MU4-LIS-01", label: "Listening" },
  COM: { code: "MU4-COM-01", label: "Composing" },
};
function outcomeChips(outcomes) {
  return (outcomes || []).map(o => OUTCOME_MAP[o]).filter(Boolean);
}

function TopicPage({ year, topic, onBack, onComplete, onNavigate, onOpenSection, difficulty, completed }) {
  if (!topic) return null;
  const yearData = window.CURRICULUM[year];
  const idx = yearData.topics.findIndex(t => t.id === topic.id);
  const prev = idx > 0 ? yearData.topics[idx - 1] : null;
  const next = idx < yearData.topics.length - 1 ? yearData.topics[idx + 1] : null;

  // scroll to top when topic changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [topic.id]);

  const Interactive = (() => {
    switch (topic.interactive) {
      case "clef":     return window.ClefTrainer;
      case "rhythm":   return window.RhythmGame;
      case "drums":    return window.DrumPads;
      case "piano":    return window.PianoPlayer;
      case "elements": return window.ElementsExplorer;
      default: return null;
    }
  })();

  return (
    <article className="col gap-6">
      {/* Breadcrumb bar */}
      <div className="row between center wrap gap-3">
        <button className="btn btn-ghost" onClick={onBack}>
          <span className="link-bob" style={{ display: "inline-block" }}>←</span>
          &nbsp;Back to {yearData.label}
        </button>
        <div className="row gap-2 wrap">
          <Chip>{yearData.label}</Chip>
          <Chip>{topic.eyebrow}</Chip>
          {outcomeChips(topic.outcomes).map(({ code, label }) => (
            <Chip key={code} variant="teal" title={label}>{code}</Chip>
          ))}
          {completed && <Chip variant="butter">✓ Complete</Chip>}
        </div>
      </div>

      {/* Hero */}
      <header className="chunk paper" style={{ padding: 0, overflow: "hidden" }}>
        <div className={"tile-art t-" + topic.theme} style={{
          padding: "44px 36px",
          minHeight: 220,
          display: "flex",
          alignItems: "center",
          gap: 28,
          borderRadius: 0,
          flexWrap: "wrap",
        }}>
          <div style={{
            width: 110, height: 110, borderRadius: 28,
            background: "rgba(255,255,255,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)",
            border: "2px solid rgba(255,255,255,.3)",
            flexShrink: 0,
          }}>
            <Glyph name={topic.glyph} size={64} stroke="currentColor" />
          </div>
          <div className="col gap-3" style={{ flex: "1 1 320px" }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: ".72rem",
              fontWeight: 700,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              opacity: .9,
            }}>{topic.eyebrow}</div>
            <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", margin: 0 }}>
              {topic.title}
            </h1>
            <p style={{ fontSize: "1.1rem", lineHeight: 1.5, maxWidth: 640, opacity: .95 }}>
              {topic.summary}
            </p>
            <div className="row gap-2 wrap mt-2">
              {topic.outcomes.map(o => (
                <span key={o} className="chip" style={{
                  background: "rgba(255,255,255,.22)",
                  borderColor: "rgba(255,255,255,.4)",
                  color: "inherit",
                }}>
                  {o === "PER" ? "Performing" : o === "LIS" ? "Listening" : "Composing"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="row gap-6 wrap" style={{ alignItems: "flex-start" }}>
        {/* Main column — deep reading */}
        <div className="col gap-6" style={{ flex: "2 1 520px", minWidth: 300 }}>
          {topic.deep && topic.deep.length > 0 && (
            <section>
              <div className="row between center wrap gap-3 mb-4">
                <div>
                  <div className="eyebrow">Sections</div>
                  <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Open a concept</h2>
                </div>
                <span className="text-soft mono" style={{ fontSize: ".82rem" }}>
                  {topic.deep.length} concept{topic.deep.length === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
              }}>
                {topic.deep.map((sec, i) => {
                  const extras = window.SECTION_EXTRAS?.[topic.id + "/" + i] || {};
                  const hasInteractive = !!(extras.try && extras.try.length);
                  const hasImage = !!extras.image;
                  return (
                    <TiltCard
                      key={i}
                      intensity={8}
                      className="chunk paper"
                      style={{
                        padding: 0,
                        cursor: "pointer",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onClick={() => onOpenSection(i)}
                    >
                      <div className={"tile-art t-" + topic.theme} style={{
                        padding: "16px 18px",
                        borderRadius: 0,
                        display: "flex", alignItems: "center", gap: 12,
                        minHeight: 70,
                      }}>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontWeight: 800,
                          fontSize: ".85rem",
                          background: "rgba(255,255,255,.22)",
                          padding: "5px 9px", borderRadius: 8,
                          border: "1.5px solid rgba(255,255,255,.35)",
                          color: "inherit",
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="tilt-layer-2" style={{
                          fontFamily: "var(--font-mono)", fontSize: ".7rem",
                          fontWeight: 700, letterSpacing: ".1em",
                          textTransform: "uppercase", opacity: .85,
                        }}>Section</span>
                      </div>
                      <div className="col gap-2" style={{ padding: "18px 20px", flex: 1 }}>
                        <h3 className="tilt-layer-2" style={{
                          fontSize: "1.15rem", margin: 0, lineHeight: 1.3,
                        }}>{sec.h}</h3>
                        <p className="tilt-layer-1" style={{
                          fontSize: ".88rem",
                          color: "var(--ink-soft)",
                          lineHeight: 1.45,
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>{sec.p}</p>
                        <div className="row gap-2 wrap mt-2">
                          {hasInteractive && <Chip variant="teal">Interactive</Chip>}
                          {hasImage && <Chip variant="butter">Image</Chip>}
                          <span style={{ marginLeft: "auto", color: "var(--terracotta)", fontWeight: 700, fontSize: ".88rem" }}>
                            Open →
                          </span>
                        </div>
                      </div>
                    </TiltCard>
                  );
                })}
              </div>
            </section>
          )}

          {/* What you'll do */}
          <section className="chunk paper" style={{ padding: "26px 28px" }}>
            <div className="eyebrow mb-2">In class</div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: 14 }}>What you'll do</h2>
            <div className="col gap-2">
              {topic.bullets.map((b, i) => (
                <div key={i} className="row gap-3 center" style={{
                  padding: "12px 14px",
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 14,
                }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 999,
                    background: "var(--terracotta)", color: "#fff",
                    fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: ".8rem",
                    flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ flex: 1, lineHeight: 1.45 }}>{b}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive */}
          {Interactive && (
            <section>
              <div className="row between center wrap gap-3 mb-4">
                <div>
                  <div className="eyebrow">Try it</div>
                  <h2 style={{ fontSize: "1.5rem" }}>Interactive</h2>
                </div>
                <Chip variant="teal">+50 XP</Chip>
              </div>
              <Interactive
                topic={topic}
                difficulty={difficulty}
                onComplete={() => onComplete(topic)}
              />
            </section>
          )}

          {!Interactive && (
            <section className="chunk paper" style={{ padding: "22px 26px" }}>
              <div className="eyebrow mb-2">Mark progress</div>
              <p className="text-soft" style={{ fontSize: ".95rem", marginBottom: 14 }}>
                A dedicated interactive for this topic is on the way. For now, mark the module
                complete once you've worked through the class activities.
              </p>
              <button className="btn btn-primary" onClick={() => onComplete(topic)}>
                ✓ Mark complete (+20 XP)
              </button>
            </section>
          )}

          {/* Module quiz */}
          {window.QUIZ_BY_TOPIC[topic.id] && (
            <section>
              <div className="row between center wrap gap-3 mb-4">
                <div>
                  <div className="eyebrow">Check yourself</div>
                  <h2 style={{ fontSize: "1.5rem" }}>End-of-module quiz</h2>
                </div>
                <Chip variant="butter">+ Quiz score</Chip>
              </div>
              <window.ModuleQuiz topic={topic} onResult={(result) => onComplete(topic, result)} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="col gap-4" style={{
          flex: "1 1 280px",
          minWidth: 260,
          position: "sticky",
          top: 16,
          alignSelf: "flex-start",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
        }}>
          <div className="chunk paper" style={{ padding: "20px 22px" }}>
            <div className="eyebrow mb-2">Elements</div>
            <div className="row gap-2 wrap">
              {topic.elements.map(e => <Chip key={e}>{e}</Chip>)}
            </div>
          </div>

          <div className="chunk paper" style={{ padding: "20px 22px" }}>
            <div className="eyebrow mb-2">Repertoire</div>
            <p className="mono" style={{ fontSize: ".92rem", lineHeight: 1.45 }}>{topic.repertoire}</p>
          </div>

          {topic.assessment && (
            <div style={{
              background: "var(--butter)",
              color: "var(--espresso-2)",
              borderRadius: 18,
              border: "1.5px solid var(--butter-d)",
              padding: "18px 20px",
              boxShadow: "0 5px 0 0 var(--butter-d)",
            }}>
              <div className="eyebrow" style={{ color: "inherit", opacity: .8 }}>Assessment</div>
              <p style={{ marginTop: 6, fontWeight: 700, fontSize: ".95rem", lineHeight: 1.4 }}>
                {topic.assessment}
              </p>
            </div>
          )}

          <div className="chunk paper" style={{ padding: "20px 22px" }}>
            <div className="eyebrow mb-2">Outcomes</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".9rem", lineHeight: 1.6 }}>
              {topic.outcomes.includes("PER") && <li><strong>PER</strong> · MU4-PER-01 (Performing)</li>}
              {topic.outcomes.includes("LIS") && <li><strong>LIS</strong> · MU4-LIS-01 (Listening)</li>}
              {topic.outcomes.includes("COM") && <li><strong>COM</strong> · MU4-COM-01 (Composing)</li>}
            </ul>
          </div>

          {topic.icip && <IcipBanner compact />}
        </aside>
      </div>

      {/* Up next / prev nav */}
      <div className="row gap-3 wrap" style={{ marginTop: 24 }}>
        {prev ? (
          <TiltCard intensity={6} className="chunk" style={{
            flex: "1 1 260px", padding: "18px 22px", cursor: "pointer",
          }} onClick={() => onNavigate(prev.id)}>
            <div className="eyebrow tilt-layer-1">← Previous</div>
            <h3 className="tilt-layer-2" style={{ fontSize: "1.2rem", marginTop: 6 }}>{prev.title}</h3>
            <p className="text-soft tilt-layer-1" style={{ fontSize: ".88rem", marginTop: 4 }}>{prev.eyebrow}</p>
          </TiltCard>
        ) : <div style={{ flex: "1 1 260px" }} />}
        {next ? (
          <TiltCard intensity={6} className="chunk" style={{
            flex: "1 1 260px", padding: "18px 22px", cursor: "pointer", textAlign: "right",
          }} onClick={() => onNavigate(next.id)}>
            <div className="eyebrow tilt-layer-1">Next →</div>
            <h3 className="tilt-layer-2" style={{ fontSize: "1.2rem", marginTop: 6 }}>{next.title}</h3>
            <p className="text-soft tilt-layer-1" style={{ fontSize: ".88rem", marginTop: 4 }}>{next.eyebrow}</p>
          </TiltCard>
        ) : <div style={{ flex: "1 1 260px" }} />}
      </div>
    </article>
  );
}

window.TopicPage = TopicPage;
