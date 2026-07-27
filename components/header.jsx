/* Header: Woonona High School Music brand + pathway switcher + settings. */

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

function Header({ year, setYear, theme, setTheme, onOpenTweaks }) {
  return (
    <header className="site-header col gap-4">
      <div className="row between center wrap gap-4">
        <a className="brand-link row center gap-3" href={"#/" + year} aria-label="Stage 4 Music Companion home">
          <WoononaMark size={56} />
          <div className="col">
            <div className="eyebrow">WOONONA HIGH SCHOOL · CAPA DEPARTMENT</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.45rem", letterSpacing: "-.02em", lineHeight: 1 }}>
              Stage 4 Music Companion
            </div>
          </div>
        </a>

        <div className="pathway-switcher" role="group" aria-label="Choose your class pathway">
          <span className="pathway-switcher-label">Class pathway</span>
          <button
            className="year-tab"
            aria-pressed={year === "year7"}
            onClick={() => setYear("year7")}>
            Year 7</button>
          <button
            className="year-tab"
            aria-pressed={year === "year8"}
            onClick={() => setYear("year8")}>
            Year 8</button>
        </div>

        <div className="row center gap-2 wrap no-print">
          <button
            className="btn btn-ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
            style={{ padding: "10px 14px" }}>
            
            {theme === "dark" ? "☼" : "☾"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={onOpenTweaks}
            aria-label="Open settings"
            aria-haspopup="dialog"
            style={{ padding: "10px 14px" }}>
            ⚙</button>
        </div>
      </div>
    </header>);

}

Object.assign(window, { Header, WoononaMark });
