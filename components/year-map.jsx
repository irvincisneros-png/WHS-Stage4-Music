/* Year Map — chunky tile grid of topics for the selected year.
   Each tile uses TiltCard for the 3D-on-hover effect. */

function TopicTile({ topic, onOpen, progress }) {
  const completed = progress?.completed;
  return (
    <TiltCard
      className="tile chunk paper"
      intensity={10}
      onClick={() => onOpen(topic)}
      style={{ outline: completed ? "2px solid var(--butter)" : "none" }}
    >
      <div className={"tile-art t-" + topic.theme + " tilt-layer-1"}>
        <span className="tilt-layer-3" style={{ display: "inline-flex" }}>
          <Glyph name={topic.glyph} size={68} stroke="currentColor" />
        </span>
        {completed && (
          <div className="tilt-layer-3" style={{
            position: "absolute", top: 10, right: 10,
            width: 30, height: 30, borderRadius: 999,
            background: "var(--butter)", border: "2px solid var(--espresso-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--espresso-2)", fontWeight: 900,
          }}>✓</div>
        )}
      </div>

      <div className="col gap-2 tilt-layer-1">
        <div className="eyebrow">{topic.eyebrow}</div>
        <div className="tile-title">{topic.title}</div>
        <div className="tile-sub">{topic.summary}</div>
      </div>

      <div className="tile-foot tilt-layer-2">
        <div className="row gap-2 wrap">
          {topic.outcomes.map(o => <Chip key={o}>{o}</Chip>)}
        </div>
        <Stars n={topic.difficulty} color="var(--terracotta)" />
      </div>
    </TiltCard>
  );
}

function YearMap({ yearKey, onOpenTopic, progress }) {
  const year = window.CURRICULUM[yearKey];
  return (
    <section>
      <div className="col gap-2" style={{ marginBottom: 22 }}>
        <div className="eyebrow">{year.eyebrow}</div>
        <h1 style={{ maxWidth: 900 }}>{year.label}</h1>
        <p className="text-soft" style={{ maxWidth: 760, fontSize: "1.05rem" }}>{year.intro}</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 22,
      }}>
        {year.topics.map(t =>
          <TopicTile key={t.id} topic={t} onOpen={onOpenTopic} progress={progress[t.id]} />
        )}
      </div>
    </section>
  );
}

Object.assign(window, { YearMap });
