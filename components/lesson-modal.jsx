/* Lesson Modal — opens when a topic tile is clicked.
   If topic.interactive, mounts the matching interactive component;
   otherwise renders a rich lesson card with the scope info. */

function LessonModal({ topic, onClose, onComplete, difficulty }) {
  if (!topic) return null;

  const Interactive = (() => {
    switch (topic.interactive) {
      case "clef":    return window.ClefTrainer;
      case "rhythm":  return window.RhythmGame;
      case "drums":   return window.DrumPads;
      case "piano":   return window.PianoPlayer;
      case "elements":return window.ElementsExplorer;
      default: return null;
    }
  })();

  return (
    <Modal open={!!topic} onClose={onClose}>
      <div className="paper" style={{ padding: 0 }}>
        {/* header band */}
        <div style={{
          padding: "24px 28px",
          background: `linear-gradient(135deg, var(--bg-2), var(--bg))`,
          borderBottom: "1.5px solid var(--border)",
          display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
        }}>
          <div className="row gap-4 center">
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 5px 0 0 var(--border)",
            }} className={"tile-art t-" + topic.theme}>
              <Glyph name={topic.glyph} size={36} stroke="currentColor" />
            </div>
            <div className="col gap-2">
              <div className="eyebrow">Week {topic.weeks} · {topic.eyebrow}</div>
              <h2 style={{ fontSize: "2rem" }}>{topic.title}</h2>
              <div className="row gap-2 wrap">
                {topic.outcomes.map(o => <Chip key={o} variant={o === "PER" ? "terracotta" : o === "LIS" ? "teal" : "butter"}>{o}</Chip>)}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">✕ Close</button>
        </div>

        {/* body */}
        <div style={{ padding: "28px" }}>
          {/* summary + bullets always shown */}
          <div className="row gap-6 wrap" style={{ alignItems: "flex-start" }}>
            <div className="col gap-4" style={{ flex: "1 1 320px", minWidth: 280 }}>
              <p style={{ fontSize: "1.05rem", lineHeight: 1.55 }}>{topic.summary}</p>

              <div className="col gap-2">
                <div className="eyebrow">In this lesson you'll</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                  {topic.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>

              <div className="col gap-2">
                <div className="eyebrow">Elements</div>
                <div className="row gap-2 wrap">
                  {topic.elements.map(e => <Chip key={e}>{e}</Chip>)}
                </div>
              </div>

              <div className="col gap-2">
                <div className="eyebrow">Repertoire</div>
                <div className="mono" style={{ fontSize: ".95rem" }}>{topic.repertoire}</div>
              </div>

              {topic.assessment && (
                <div style={{
                  background: "var(--butter)",
                  color: "var(--espresso-2)",
                  borderRadius: 16,
                  border: "1.5px solid var(--butter-d)",
                  padding: "12px 14px",
                  fontWeight: 700,
                  boxShadow: "0 4px 0 0 var(--butter-d)",
                  fontSize: ".92rem",
                }}>
                  ⚖ {topic.assessment}
                </div>
              )}

              {topic.icip && <IcipBanner compact />}
            </div>

            {/* right side: interactive panel */}
            <div className="col gap-3" style={{ flex: "2 1 480px", minWidth: 320 }}>
              {Interactive ? (
                <Interactive
                  topic={topic}
                  difficulty={difficulty}
                  onComplete={() => onComplete(topic)}
                />
              ) : (
                <PlaceholderActivity topic={topic} onComplete={() => onComplete(topic)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PlaceholderActivity({ topic, onComplete }) {
  // For topics without a built interactive yet — show a "lesson plan" panel
  // teachers can walk a class through, plus a "mark complete" button for XP.
  return (
    <div className="col gap-3">
      <div className="chunk paper" style={{ padding: 22 }}>
        <div className="eyebrow mb-2">Classroom plan</div>
        <h3 style={{ fontFamily: "var(--font-display)" }}>Built around the activity list</h3>
        <p className="text-soft mt-2" style={{ fontSize: ".95rem" }}>
          A dedicated interactive for <strong>{topic.title}</strong> is on the way. For now,
          use this lesson card to project the focus, elements and outcomes for the class.
        </p>

        <div className="mt-6 col gap-3">
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
              }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="row gap-3 center wrap">
        <button className="btn btn-primary" onClick={onComplete}>
          <span className="link-bob" style={{ display: "inline-block" }}>✓</span>
          &nbsp;Mark lesson complete (+20 XP)
        </button>
        <span className="text-soft" style={{ fontSize: ".85rem" }}>
          Earns a badge for this topic.
        </span>
      </div>
    </div>
  );
}

function IcipBanner({ compact }) {
  return (
    <div className="icip">
      <div className="eyebrow" style={{ color: "inherit", opacity: .7 }}>Indigenous Cultural & Intellectual Property</div>
      <h3 style={{ marginTop: 6, fontFamily: "var(--font-display)" }}>ICIP statement</h3>
      <p className="mt-2" style={{ fontSize: ".95rem", lineHeight: 1.55 }}>
        This module engages with First Nations music. Repertoire, recordings and imagery are
        added <strong>only with appropriate attribution and consent</strong>, following ICIP
        protocols. Audio and visual material is intentionally left for staff to add.
      </p>
      {!compact && (
        <p className="text-soft mt-2" style={{ fontSize: ".85rem" }}>
          Class teachers: Ms Sharp, Ms Arnold, Ms Crighton and Mr Cisneros co-ordinate the
          repertoire list for these units.
        </p>
      )}
    </div>
  );
}

Object.assign(window, { LessonModal, IcipBanner });
