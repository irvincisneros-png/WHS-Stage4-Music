/* Header: Woonona High School Music brand + Year switcher + HUD (XP, streak, theme) */

function WoononaMark({ size = 44 }) {
  // School's official RISE crest.
  return (
    <img
      src="assets/rise-logo.jpg"
      alt="Woonona High School RISE crest"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: 999,
        flexShrink: 0
      }} />);


}

function Header({ year, setYear, xp, level, streak, theme, setTheme, onOpenTweaks }) {
  return (
    <header className="col gap-4" style={{ marginBottom: 28 }}>
      <div className="row between center wrap gap-4">
        <div className="row center gap-3">
          <WoononaMark size={56} />
          <div className="col">
            <div className="eyebrow">WOONONA HIGH SCHOOL · CAPA DEPARTMENT</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.45rem", letterSpacing: "-.02em", lineHeight: 1 }}>
              Stage 4 Music
            </div>
          </div>
        </div>

        <div className="row center gap-2 wrap" role="tablist" aria-label="Year">
          <button
            className="year-tab"
            role="tab"
            aria-selected={year === "year7"}
            onClick={() => setYear("year7")}>
            Year 7</button>
          <button
            className="year-tab"
            role="tab"
            aria-selected={year === "year8"}
            onClick={() => setYear("year8")}>
            Year 8</button>
        </div>

        <div className="row center gap-2 wrap no-print">
          <div className="hud-pill" title={`${xp} XP toward next level`}>
            <span style={{ color: "var(--butter-d)" }}>★</span>
            <span>LV {level}</span>
            <XPBar value={xp % 100} max={100} />
          </div>
          <div className="hud-pill" title="Daily streak">
            <span style={{ color: "var(--terracotta)" }}>♪</span>
            <span>{streak}d</span>
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            style={{ padding: "10px 14px" }}>
            
            {theme === "dark" ? "☼" : "☾"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={onOpenTweaks}
            aria-label="Open settings"
            style={{ padding: "10px 14px" }}>
            ⚙</button>
        </div>
      </div>
    </header>);

}

Object.assign(window, { Header, WoononaMark });