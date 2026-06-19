/* SectionPage: full-page detail view for one section of a module.
   Reached via hash route #/year/topicId/s/<index>. Shows the section
   heading + extended reading, a CC image (with credit), one or more
   embedded interactives, and forward/back nav within the topic. */

/* Maps outcome keys to NSW syllabus codes + labels */
const OUTCOME_MAP_SEC = {
  PER: { code: "MU4-PER-01", label: "Performing" },
  LIS: { code: "MU4-LIS-01", label: "Listening" },
  COM: { code: "MU4-COM-01", label: "Composing" },
};
function outcomeChipsSec(outcomes) {
  return (outcomes || []).map(o => OUTCOME_MAP_SEC[o]).filter(Boolean);
}

/* ConceptCard: typographic "title card" tied directly to the concept being
   taught. Used instead of stock photos: every panel actually names what the
   section is about. Uses the parent topic's theme colour + glyph for visual
   continuity with the rest of the curriculum. */
function ConceptCard({ image, topic }) {
  const themeClass = "t-" + (topic?.theme || "espresso");
  const glyphName = image.glyph || topic?.glyph || "spark";
  const hasVisual = !!image.visual && !!window.ConceptVisual;

  return (
    <figure style={{ margin: 0, display: "grid", gap: 10 }}>
      <div className={"tile-art " + themeClass} style={{
        position: "relative",
        width: "100%",
        borderRadius: 18,
        overflow: "hidden",
        border: "1.5px solid var(--border)",
        padding: "22px 26px",
        display: "grid",
        gridTemplateColumns: hasVisual ? "minmax(0, 1fr) minmax(0, 1.1fr)" : "1fr",
        gap: 22,
        alignItems: "stretch",
        minHeight: 240,
      }}>
        {/* Decorative dotted grid (quiet, on-brand) */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background:
            "radial-gradient(currentColor 1px, transparent 1.4px)",
          backgroundSize: "22px 22px",
          opacity: .08,
          pointerEvents: "none",
        }}></div>

        {/* Left: visual (or full-width text if no visual) */}
        {hasVisual && (
          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,.07)",
            border: "1.5px solid rgba(255,255,255,.16)",
            borderRadius: 14,
            padding: "14px 16px",
            minHeight: 200,
          }}>
            <window.ConceptVisual visual={image.visual} />
          </div>
        )}

        {/* Right: text column */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          gap: 14,
        }}>
          <div className="row between center" style={{ gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13,
              background: "rgba(255,255,255,.18)",
              border: "1.5px solid rgba(255,255,255,.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "inherit",
              flexShrink: 0,
            }}>
              {window.Glyph
                ? <window.Glyph name={glyphName} size={26} stroke="currentColor" />
                : null}
            </div>
            {image.eyebrow && (
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                padding: "5px 11px",
                borderRadius: 999,
                background: "rgba(255,255,255,.16)",
                border: "1.5px solid rgba(255,255,255,.24)",
                textAlign: "right",
                lineHeight: 1.3,
              }}>{image.eyebrow}</div>
            )}
          </div>

          <div className="col gap-2">
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)",
              lineHeight: 1.05,
              letterSpacing: "-.02em",
              margin: 0,
              color: "inherit",
              textWrap: "balance",
            }}>{image.title}</h2>
            {image.tagline && (
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(.9rem, 1.1vw, 1rem)",
                lineHeight: 1.5,
                margin: 0,
                opacity: .9,
                textWrap: "pretty",
              }}>{image.tagline}</p>
            )}
          </div>

          {image.terms && (
            <div className="row gap-2 wrap">
              {image.terms.map((t, i) => (
                <span key={i} className="mono" style={{
                  fontSize: ".66rem",
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.14)",
                  border: "1.5px solid rgba(255,255,255,.22)",
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {image.caption && (
        <figcaption className="mono text-soft" style={{
          fontSize: ".74rem", lineHeight: 1.4, letterSpacing: ".02em",
        }}>{image.caption}</figcaption>
      )}

      <style>{`
        @media (max-width: 720px) {
          figure .tile-art {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </figure>
  );
}

function SectionImage({ image, topic }) {
  const [errored, setErrored] = React.useState(false);

  if (!image) return null;

  // Concept cards: typographic illustration tied to the lesson (no stock photo risk).
  if (image.kind === "concept") return <ConceptCard image={image} topic={topic} />;

  const fallback = (
    <div style={{
      width: "100%", aspectRatio: "16 / 9",
      background:
        "repeating-linear-gradient(45deg, var(--bg) 0 12px, var(--bg-2) 12px 24px)",
      border: "1.5px dashed var(--border)",
      borderRadius: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
    }}>
      <span className="mono text-soft" style={{ fontSize: ".82rem", maxWidth: 360, lineHeight: 1.5 }}>
        {image.alt || "Image unavailable. Open the source link below to view."}
      </span>
    </div>
  );

  return (
    <figure style={{ margin: 0, display: "grid", gap: 10 }}>
      <div style={{
        width: "100%",
        borderRadius: 18,
        overflow: "hidden",
        border: "1.5px solid var(--border)",
        background: "var(--bg-2)",
        position: "relative",
      }}>
        {!errored ? (
          <img
            src={image.src}
            alt={image.alt || ""}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setErrored(true)}
            style={{
              width: "100%", maxHeight: 480,
              display: "block", objectFit: "contain",
              background: "var(--bg-2)",
            }}
          />
        ) : fallback}
      </div>
      <figcaption className="row gap-2 wrap" style={{
        fontSize: ".78rem", color: "var(--ink-soft)", lineHeight: 1.4,
      }}>
        <span className="mono">{image.alt}</span>
        {image.credit && (
          <>
            <span style={{ opacity: .6 }}>·</span>
            <span>{image.credit}</span>
          </>
        )}
        {image.license && (
          <>
            <span style={{ opacity: .6 }}>·</span>
            <span className="mono">{image.license}</span>
          </>
        )}
        {image.link && (
          <>
            <span style={{ opacity: .6 }}>·</span>
            <a href={image.link} target="_blank" rel="noopener noreferrer"
               style={{ color: "var(--terracotta)" }}>source</a>
          </>
        )}
      </figcaption>
    </figure>
  );
}

function SectionInteractiveBlock({ entry }) {
  const Comp = window[entry.kind];
  if (!Comp) {
    return (
      <div className="chunk paper" style={{ padding: 22, color: "var(--ink-soft)" }}>
        <strong>Interactive missing:</strong> {entry.kind}
      </div>
    );
  }
  return (
    <div className="col gap-2">
      {entry.intro && (
        <p className="text-soft" style={{ fontSize: ".95rem", lineHeight: 1.55, margin: 0 }}>
          {entry.intro}
        </p>
      )}
      <Comp {...(entry.props || {})} />
    </div>
  );
}

function SectionPage({ year, topic, sectionIndex, onBack, onNavigate, onNavigateSection }) {
  const yearData = window.CURRICULUM[year];
  const section = topic?.deep?.[sectionIndex];

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [topic?.id, sectionIndex]);

  if (!topic || !section) {
    return (
      <div className="chunk paper" style={{ padding: 26 }}>
        <p>Section not found.</p>
        <button className="btn btn-primary" onClick={onBack}>Back</button>
      </div>
    );
  }

  const extras = window.SECTION_EXTRAS?.[topic.id + "/" + sectionIndex] || {};
  const total = topic.deep.length;
  const prevIdx = sectionIndex - 1;
  const nextIdx = sectionIndex + 1;
  const prev = prevIdx >= 0 ? topic.deep[prevIdx] : null;
  const next = nextIdx < total ? topic.deep[nextIdx] : null;

  const themeClass = "t-" + topic.theme;

  return (
    <article className="col gap-6" data-screen-label={`Section · ${topic.title} · ${section.h}`}>
      {/* Breadcrumb */}
      <div className="row between center wrap gap-3">
        <div className="row gap-2 wrap center">
          <button className="btn btn-ghost" onClick={onBack}>
            <span className="link-bob" style={{ display: "inline-block" }}>←</span>
            &nbsp;{topic.title}
          </button>
          <span className="text-soft" style={{ opacity: .5 }}>›</span>
          <Chip>Section {String(sectionIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</Chip>
        </div>
        <div className="row gap-2 wrap">
          <Chip>{yearData.label}</Chip>
          <Chip>{topic.eyebrow}</Chip>
          {outcomeChipsSec(topic.outcomes).map(({ code, label }) => (
            <Chip key={code} variant="teal" title={label}>{code}</Chip>
          ))}
        </div>
      </div>

      {/* Hero */}
      <header className="chunk paper" style={{ padding: 0, overflow: "hidden" }}>
        <div className={"tile-art " + themeClass} style={{
          padding: "40px 36px",
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          gap: 24,
          borderRadius: 0,
          flexWrap: "wrap",
        }}>
          <div style={{
            width: 84, height: 84, borderRadius: 22,
            background: "rgba(255,255,255,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid rgba(255,255,255,.3)", flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontWeight: 800,
              fontSize: "1.6rem", color: "inherit",
            }}>{String(sectionIndex + 1).padStart(2, "0")}</span>
          </div>
          <div className="col gap-2" style={{ flex: "1 1 320px" }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: ".72rem",
              fontWeight: 700, letterSpacing: ".12em",
              textTransform: "uppercase", opacity: .9,
            }}>
              {topic.title} · Section {sectionIndex + 1}
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", margin: 0, lineHeight: 1.1 }}>
              {section.h}
            </h1>
          </div>
        </div>
      </header>

      {/* Body grid */}
      <div className="row gap-6 wrap" style={{ alignItems: "flex-start" }}>
        <div className="col gap-6" style={{ flex: "2 1 520px", minWidth: 300 }}>

          {/* CC image, if any */}
          {extras.image && (
            <section className="col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Array.isArray(extras.image) ? (
                extras.image.map((img, idx) => (
                  <SectionImage key={idx} image={img} topic={topic} />
                ))
              ) : (
                <SectionImage image={extras.image} topic={topic} />
              )}
            </section>
          )}

          {/* Real photographs (in addition to any concept visual above) */}
          {extras.photos && extras.photos.length > 0 && (
            <section style={{
              display: "grid",
              gridTemplateColumns: extras.photos.length > 1
                ? "repeat(auto-fit, minmax(240px, 1fr))"
                : "1fr",
              gap: 14,
            }}>
              {extras.photos.map((ph, i) => (
                <SectionImage key={i} image={ph} topic={topic} />
              ))}
            </section>
          )}

          {/* Primary reading from curriculum */}
          <section className="chunk paper" style={{ padding: "28px 30px" }}>
            <div className="eyebrow mb-2">The concept</div>
            <p style={{
              fontSize: "1.08rem", lineHeight: 1.7,
              fontFamily: "var(--font-body)",
              margin: 0,
            }}>{section.p}</p>
          </section>

          {/* Extra long-read paragraphs */}
          {extras.longread && extras.longread.map((block, i) => (
            <section key={i} className="chunk paper" style={{ padding: "26px 28px" }}>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>{block.h}</h2>
              <p style={{ fontSize: "1rem", lineHeight: 1.65, margin: 0 }}>{block.p}</p>
            </section>
          ))}

          {/* Interactive(s) */}
          {extras.try && extras.try.map((entry, i) => (
            <section key={i} className="col gap-3">
              {i === 0 && (
                <div className="row between center wrap gap-3">
                  <div>
                    <div className="eyebrow">Try it</div>
                    <h2 style={{ fontSize: "1.4rem", margin: 0 }}>Interactive</h2>
                  </div>
                </div>
              )}
              <SectionInteractiveBlock entry={entry} />
            </section>
          ))}

          {/* No interactive at all? offer a gentle nudge to the parent topic's main interactive */}
          {!extras.try && (
            <section className="chunk paper" style={{ padding: "22px 26px" }}>
              <div className="eyebrow mb-2">Practise this</div>
              <p className="text-soft" style={{ fontSize: ".95rem", marginBottom: 12 }}>
                A dedicated interactive for this exact section isn't here yet. Head back to
                the {topic.title} page for the module-level activity.
              </p>
              <button className="btn btn-primary" onClick={onBack}>
                ← Back to {topic.title}
              </button>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="col gap-4" style={{
          flex: "1 1 260px", minWidth: 240,
          position: "sticky", top: 16, alignSelf: "flex-start",
          maxHeight: "calc(100vh - 32px)", overflowY: "auto",
        }}>
          <div className="chunk paper" style={{ padding: "20px 22px" }}>
            <div className="eyebrow mb-3">All sections in {topic.title}</div>
            <div className="col gap-1">
              {topic.deep.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onNavigateSection(i)}
                  className="row gap-2 center"
                  style={{
                    textAlign: "left",
                    padding: "10px 10px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: i === sectionIndex ? "var(--bg)" : "transparent",
                    border: i === sectionIndex ? "1.5px solid var(--border)" : "1.5px solid transparent",
                    color: i === sectionIndex ? "var(--ink)" : "var(--ink-soft)",
                    fontWeight: i === sectionIndex ? 600 : 500,
                    fontFamily: "inherit", fontSize: ".9rem",
                  }}
                >
                  <span className="mono" style={{
                    fontSize: ".72rem",
                    background: i === sectionIndex ? "var(--terracotta)" : "var(--border)",
                    color: i === sectionIndex ? "#fff" : "var(--ink-soft)",
                    padding: "2px 6px", borderRadius: 6, flexShrink: 0,
                  }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ flex: 1, lineHeight: 1.3 }}>{s.h}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="chunk paper" style={{ padding: "20px 22px" }}>
            <div className="eyebrow mb-2">Element focus</div>
            <div className="row gap-2 wrap">
              {topic.elements.map(e => <Chip key={e}>{e}</Chip>)}
            </div>
          </div>

          <div className="chunk paper" style={{ padding: "20px 22px" }}>
            <div className="eyebrow mb-2">Outcomes</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: ".88rem", lineHeight: 1.55 }}>
              {topic.outcomes.includes("PER") && <li><strong>PER</strong> · MU4-PER-01 (Performing)</li>}
              {topic.outcomes.includes("LIS") && <li><strong>LIS</strong> · MU4-LIS-01 (Listening)</li>}
              {topic.outcomes.includes("COM") && <li><strong>COM</strong> · MU4-COM-01 (Composing)</li>}
            </ul>
          </div>
        </aside>
      </div>

      {/* Prev / Next within topic */}
      <div className="row gap-3 wrap" style={{ marginTop: 16 }}>
        {prev ? (
          <TiltCard intensity={6} className="chunk" style={{
            flex: "1 1 260px", padding: "18px 22px", cursor: "pointer",
          }} onClick={() => onNavigateSection(prevIdx)}>
            <div className="eyebrow tilt-layer-1">← Previous section</div>
            <h3 className="tilt-layer-2" style={{ fontSize: "1.1rem", marginTop: 6 }}>{prev.h}</h3>
          </TiltCard>
        ) : (
          <TiltCard intensity={6} className="chunk" style={{
            flex: "1 1 260px", padding: "18px 22px", cursor: "pointer", opacity: .9,
          }} onClick={onBack}>
            <div className="eyebrow tilt-layer-1">← Back to</div>
            <h3 className="tilt-layer-2" style={{ fontSize: "1.1rem", marginTop: 6 }}>{topic.title} overview</h3>
          </TiltCard>
        )}
        {next ? (
          <TiltCard intensity={6} className="chunk" style={{
            flex: "1 1 260px", padding: "18px 22px", cursor: "pointer", textAlign: "right",
          }} onClick={() => onNavigateSection(nextIdx)}>
            <div className="eyebrow tilt-layer-1">Next section →</div>
            <h3 className="tilt-layer-2" style={{ fontSize: "1.1rem", marginTop: 6 }}>{next.h}</h3>
          </TiltCard>
        ) : (
          <TiltCard intensity={6} className="chunk" style={{
            flex: "1 1 260px", padding: "18px 22px", cursor: "pointer", textAlign: "right", opacity: .9,
          }} onClick={onBack}>
            <div className="eyebrow tilt-layer-1">Back to →</div>
            <h3 className="tilt-layer-2" style={{ fontSize: "1.1rem", marginTop: 6 }}>{topic.title} interactive</h3>
          </TiltCard>
        )}
      </div>
    </article>
  );
}

window.SectionPage = SectionPage;
