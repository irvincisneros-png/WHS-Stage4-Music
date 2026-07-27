/* Shared Stage 4 companion hub. Google Classroom owns assignments and marks;
   this page helps students choose a practical lab and level of challenge. */

const CLASSROOM_LINKS = {
  year7: "https://classroom.google.com/u/0/c/Nzk4NDc5MjAzNDI0",
  year8: "https://classroom.google.com/u/0/c/ODU1NTk3NzY1ODQ4",
};

const LAB_TONES = {
  guitar: "teal",
  "piano-keyboard": "terracotta",
  "rhythm-drums": "espresso",
  composition: "plum",
  "listening-elements": "butter",
  "orchestra-sound": "sky",
};

function CompanionHome({ year, progress, openTopic, openSpecial }) {
  const companion = window.STAGE4_COMPANION;
  const [pathway, setPathway] = React.useState("foundation");
  const yearLabel = year === "year7" ? "Year 7" : "Year 8";

  function openLab(lab) {
    if (lab.id === "guitar") return openSpecial("guitar");
    if (lab.id === "piano-keyboard") return openSpecial("piano");
    const yearLink = lab.topicLinks.find(link => link.year === year) || lab.topicLinks[0];
    if (yearLink.year === year) openTopic(yearLink.topicId);
    else location.hash = yearLink.route;
  }

  function openTopicLink(link) {
    if (link.year === year) openTopic(link.topicId);
    else location.hash = link.route;
  }

  return (
    <div className="companion-home">
      <section className="companion-hero" aria-labelledby="companion-title">
        <div className="companion-hero-copy">
          <div className="eyebrow">Practise · experiment · reflect</div>
          <h1 id="companion-title">What do you want to make sound better today?</h1>
          <p>
            Choose a lab, work at your level, then take the result back to class.
            This is a practice companion—not a place for marks or submissions.
          </p>
          <div className="row gap-3 wrap">
            <button className="btn btn-primary" onClick={() => {
              document.getElementById("music-labs")?.scrollIntoView({
                behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
              });
            }}>Choose a music lab</button>
            <a className="btn btn-ghost" href={CLASSROOM_LINKS[year]}
              target="_blank" rel="noopener noreferrer">
              Open {yearLabel} Classroom ↗
            </a>
          </div>
        </div>
        <div className="companion-hero-note" aria-label="How the companion works">
          <span className="companion-note-icon" aria-hidden="true">♪</span>
          <strong>Classroom sets the task.</strong>
          <span>This site helps you rehearse, listen, create and explain your choices.</span>
        </div>
      </section>

      <section className="practice-cycle" aria-labelledby="practice-cycle-title">
        <div>
          <div className="eyebrow">A useful practice loop</div>
          <h2 id="practice-cycle-title">Learn → Try → Challenge → Reflect</h2>
        </div>
        <ol>
          {companion.cycle.map((step, index) => (
            <li key={step.id}>
              <span>{index + 1}</span>
              <div><strong>{step.label}</strong><small>{step.prompt}</small></div>
            </li>
          ))}
        </ol>
      </section>

      <section id="music-labs" className="music-labs" aria-labelledby="music-labs-title">
        <div className="labs-heading">
          <div>
            <div className="eyebrow">{yearLabel} shortcut</div>
            <h2 id="music-labs-title">Six labs, one Stage 4 toolkit</h2>
            <p className="text-soft">
              Year 7 and Year 8 use the same musical toolkit. Your pathway changes
              the challenge, not the instrument.
            </p>
          </div>
          <div className="level-picker" role="group" aria-label="Choose a challenge level">
            {companion.pathways.map(level => (
              <button key={level.id} type="button" aria-pressed={pathway === level.id}
                onClick={() => setPathway(level.id)}>
                {level.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="lab-grid">
          {companion.labs.map(lab => {
            const relevantLinks = lab.topicLinks.filter(link => link.year === year);
            const links = relevantLinks.length ? relevantLinks : lab.topicLinks.slice(0, 1);
            return (
              <article className="lab-card chunk" key={lab.id}>
                <div className={"lab-card-art tile-art t-" + LAB_TONES[lab.id]}>
                  <Glyph name={lab.glyph} size={54} stroke="currentColor" />
                  <div className="row gap-2 wrap">
                    {lab.outcomes.map(outcome => <span className="lab-outcome" key={outcome}>{outcome}</span>)}
                  </div>
                </div>
                <div className="lab-card-body">
                  <div>
                    <div className="eyebrow">{companion.pathways.find(item => item.id === pathway).label}</div>
                    <h3>{lab.title}</h3>
                  </div>
                  <p>{lab.summary}</p>
                  <div className="lab-level-brief">
                    <strong>Your challenge</strong>
                    <span>{lab.pathways[pathway]}</span>
                  </div>
                  <button className="btn btn-primary lab-open" onClick={() => openLab(lab)}>
                    Open lab <span aria-hidden="true">→</span>
                  </button>
                  <div className="lab-class-links">
                    <span>Related class topics</span>
                    {links.map(link => (
                      <button key={link.topicId} onClick={() => openTopicLink(link)}>
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="repertoire-passport" aria-labelledby="passport-title">
        <div className="passport-intro">
          <div className="eyebrow">Music in context</div>
          <h2 id="passport-title">{companion.repertoirePassport.title}</h2>
          <p>{companion.repertoirePassport.studentPrompt}</p>
        </div>
        <div className="passport-grid">
          {companion.repertoirePassport.categories.map((category, index) => {
            const currentLink = category.currentLinks.find(link => link.year === year) || category.currentLinks[0];
            return (
              <article key={category.id} className="passport-card">
                <span className="passport-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{category.label}</h3>
                <p>{category.prompt}</p>
                <small><strong>Listen for:</strong> {category.evidence}</small>
                <button onClick={() => openTopicLink(currentLink)}>
                  Explore an example <span aria-hidden="true">→</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="classroom-bridge chunk" aria-labelledby="classroom-bridge-title">
        <div>
          <div className="eyebrow">Back to your lesson</div>
          <h2 id="classroom-bridge-title">Use the lab here. Submit the work there.</h2>
          <p>
            Your teacher’s instructions, due dates, feedback and marks stay in Google Classroom.
            Reflections saved here remain private to this browser.
          </p>
        </div>
        <a className="btn btn-teal" href={CLASSROOM_LINKS[year]}
          target="_blank" rel="noopener noreferrer">
          Go to {yearLabel} Classroom ↗
        </a>
      </section>

      <details className="all-topics">
        <summary>Find every {yearLabel} class topic</summary>
        <div className="all-topics-content">
          <YearMap yearKey={year} onOpenTopic={(topic) => openTopic(topic.id)} progress={progress} />
        </div>
      </details>
    </div>
  );
}

window.CompanionHome = CompanionHome;
