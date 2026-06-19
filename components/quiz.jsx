/* Quiz components.
   <Quiz questions onFinish /> generic engine (used by module quizzes + tests).
   <ModuleQuiz topic onResult />  wrapper used at the end of a topic page.
*/

function Quiz({ questions, onFinish, label = "Quiz", showExplain = true, showTopic = false }) {
  const [idx, setIdx] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const [revealed, setRevealed] = React.useState(false);
  const [answers, setAnswers] = React.useState([]); // {topicId, correct}[]
  const [done, setDone] = React.useState(false);
  const [focusIdx, setFocusIdx] = React.useState(null);

  if (!questions || !questions.length) return null;

  const q = questions[idx];
  const isCorrect = selected === q.answer;

  function choose(i) {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.answer) window.MusicAudio?.ding(true);
    else window.MusicAudio?.ding(false);
  }

  function next() {
    const newAnswers = [...answers, { topicId: q.topicId, correct: isCorrect, qIndex: idx, picked: selected }];
    if (idx + 1 >= questions.length) {
      setAnswers(newAnswers);
      setDone(true);
      onFinish?.(newAnswers);
    } else {
      setAnswers(newAnswers);
      setIdx(idx + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  function restart() {
    setIdx(0); setSelected(null); setRevealed(false); setAnswers([]); setDone(false);
  }

  if (done) {
    const score = answers.filter(a => a.correct).length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="chunk paper col gap-4 center-text" style={{ padding: "28px 26px" }}>
        <div className="eyebrow">Quiz complete</div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
          fontWeight: 800,
          letterSpacing: "-.02em",
          color: pct >= 75 ? "var(--teal)" : pct >= 50 ? "var(--butter-d)" : "var(--terracotta)",
        }}>
          {score} / {questions.length}
        </div>
        <div className="text-soft">{pct}% correct</div>
        <div className="row center gap-3 wrap mt-4">
          <button className="btn btn-ghost" onClick={restart}>↻ Try again</button>
        </div>
      </div>
    );
  }

  const letters = ["A", "B", "C", "D"];

  return (
    <div className="chunk paper" style={{ padding: "26px 28px" }}>
      <div className="row between center wrap gap-3 mb-4">
        <div className="row gap-2 wrap">
          <Chip>{label}</Chip>
          <Chip>Q{idx + 1} / {questions.length}</Chip>
          {showTopic && q.topicTitle && <Chip variant="teal">{q.topicTitle}</Chip>}
        </div>
        <div style={{ minWidth: 140 }}>
          <XPBar value={idx} max={questions.length} />
        </div>
      </div>

      <h3 style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.4rem",
        fontWeight: 700,
        lineHeight: 1.3,
        marginBottom: 18,
      }}>{q.q}</h3>

      <div className="col gap-2">
        {q.options.map((opt, i) => {
          const picked = selected === i;
          const isAns = i === q.answer;
          let bg = "var(--bg)", bd = "var(--border)", clr = "var(--ink)";
          if (revealed) {
            if (isAns)        { bg = "var(--teal)"; bd = "var(--teal-d)"; clr = "#fff"; }
            else if (picked)  { bg = "var(--terracotta)"; bd = "var(--terracotta-d)"; clr = "#fff"; }
          } else if (picked) {
            bg = "var(--bg-2)"; bd = "var(--espresso-2)";
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={revealed}
              onFocus={() => setFocusIdx(i)}
              onBlur={() => setFocusIdx(null)}
              style={{
                all: "unset",
                cursor: revealed ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px",
                background: bg, color: clr,
                border: "1.5px solid " + bd,
                borderRadius: 14,
                boxShadow: revealed && (isAns || picked) ? "0 4px 0 0 " + bd : "0 2px 0 0 var(--border)",
                transition: "transform .15s var(--ease-spring), box-shadow .15s var(--ease-spring)",
                transform: revealed && (isAns || picked) ? "translateY(-1px)" : "none",
                ...(focusIdx === i ? { outline: "3px solid var(--terracotta)", outlineOffset: "2px" } : {}),
              }}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 999,
                background: revealed && isAns ? "rgba(255,255,255,.25)" : "var(--bg-2)",
                color: revealed && (isAns || picked) ? "#fff" : "var(--ink)",
                border: "1.5px solid " + bd,
                fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: ".8rem",
                flexShrink: 0,
              }}>
                {revealed && isAns ? "✓" : revealed && picked ? "✗" : letters[i]}
              </span>
              <span style={{ flex: 1, lineHeight: 1.45, fontWeight: 500 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-4" style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: isCorrect ? "rgba(15, 118, 110, .08)" : "rgba(39, 98, 224, .08)",
          border: "1.5px dashed " + (isCorrect ? "var(--teal)" : "var(--terracotta)"),
          fontSize: ".93rem",
          lineHeight: 1.5,
        }}>
          <strong style={{ color: isCorrect ? "var(--teal)" : "var(--terracotta)" }}>
            {isCorrect ? "✓ Correct" : "✗ Not quite"}
          </strong>
          {showExplain && q.why && <>. {q.why}</>}
        </div>
      )}

      <div className="row center gap-3 wrap mt-4">
        {revealed && (
          <button className="btn btn-primary" onClick={next}>
            {idx + 1 >= questions.length ? "Finish ▸" : "Next ▸"}
          </button>
        )}
      </div>
    </div>
  );
}

/* Module quiz: top-level wrapper used at the end of each TopicPage.
   Records the result to whs.quizScores[topicId]. */
function ModuleQuiz({ topic, onResult }) {
  const pool = window.QUIZ_BY_TOPIC[topic.id];
  const [running, setRunning] = React.useState(false);
  const [savedScore, setSavedScore] = React.useState(() => {
    const all = window.Students.readNS("quizScores", {});
    return all[topic.id] || null;
  });

  if (!pool || !pool.length) return null;

  const questions = pool.map(p => ({ ...p, topicId: topic.id, topicTitle: topic.title }));

  function onFinish(answers) {
    const correct = answers.filter(a => a.correct).length;
    const result = { topicId: topic.id, correct, total: questions.length, at: Date.now() };
    const all = window.Students.readNS("quizScores", {});
    all[topic.id] = result;
    window.Students.writeNS("quizScores", all);
    setSavedScore(result);
    onResult?.(result);
  }

  if (!running) {
    return (
      <div className="chunk paper" style={{ padding: "26px 28px" }}>
        <div className="row between center wrap gap-3">
          <div className="col gap-2">
            <div className="eyebrow">Check your understanding</div>
            <h2 style={{ fontSize: "1.5rem" }}>Module quiz</h2>
            <p className="text-soft" style={{ fontSize: ".95rem", maxWidth: 480 }}>
              {questions.length} quick multiple-choice questions. You get immediate feedback after each one.
            </p>
            {savedScore && (
              <div className="row gap-2 wrap mt-2">
                <Chip variant={savedScore.correct / savedScore.total >= 0.75 ? "teal" : "butter"}>
                  Last attempt: {savedScore.correct} / {savedScore.total}
                </Chip>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setRunning(true)}>
            ▶ Start quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <Quiz
      questions={questions}
      label="Module Quiz"
      onFinish={(answers) => { onFinish(answers); }}
    />
  );
}

Object.assign(window, { Quiz, ModuleQuiz });
