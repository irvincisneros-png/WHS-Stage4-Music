/* Header — Woonona High School Music brand + Year switcher + HUD (XP, streak, theme) */

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

function Header({ year, setYear, xp, level, streak, theme, setTheme, onOpenTweaks,
  student, onSignOut }) {
  const initials = student ? window.Students.initials(student) : "?";
  const name = student ? window.Students.displayName(student) : "";
  const avatar = student?.avatar || "terracotta";
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

        <div className="row center gap-2 wrap">
          <div className="hud-pill" title={`${xp} XP toward next level`}>
            <span style={{ color: "var(--butter-d)" }}>★</span>
            <span>LV {level}</span>
            <XPBar value={xp % 100} max={100} />
          </div>
          <div className="hud-pill" title="Daily streak">
            <span style={{ color: "var(--terracotta)" }}>♪</span>
            <span>{streak}d</span>
          </div>

          {/* Student pill */}
          {student &&
          <StudentMenu student={student} initials={initials} name={name} avatar={avatar} onSignOut={onSignOut} />
          }

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

/* Student avatar + dropdown menu in the header */
function StudentMenu({ student, initials, name, avatar, onSignOut }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        className="hud-pill"
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: "pointer", paddingLeft: 6, paddingRight: 14, background: "var(--bg-2)" }}
        aria-haspopup="menu"
        aria-expanded={open}>
        
        <div className={"tile-art t-" + avatar} style={{
          width: 28, height: 28, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontFamily: "var(--font-display)",
          fontWeight: 800, fontSize: ".75rem", letterSpacing: "-.02em"
        }}>{initials}</div>
        <span style={{
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>{student.firstName || name}</span>
        <span style={{ fontSize: ".7rem", opacity: .6 }}>▾</span>
      </button>
      {open &&
      <div
        role="menu"
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          minWidth: 240,
          background: "var(--bg-2)",
          border: "1.5px solid var(--border)",
          borderRadius: 18,
          boxShadow: "0 8px 0 0 var(--border), 0 24px 40px -20px rgba(20,20,25,.25)",
          padding: 8,
          zIndex: 60
        }}>
        
          <div style={{
          padding: "10px 12px",
          borderRadius: 12,
          background: "var(--bg)",
          marginBottom: 6
        }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{name}</div>
            {student.classCode &&
          <div className="mono text-soft" style={{ fontSize: ".7rem", marginTop: 2 }}>
                {student.classCode}
              </div>
          }
          </div>
          <button
          onClick={() => {setOpen(false);onSignOut();}}
          style={{
            all: "unset",
            cursor: "pointer",
            display: "block",
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            fontFamily: "var(--font-display)", fontWeight: 700,
            color: "var(--terracotta)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg)"}
          onMouseLeave={(e) => e.currentTarget.style.background = ""}>
          
            ↩ Sign out / switch profile
          </button>
        </div>
      }
    </div>);

}

Object.assign(window, { Header, WoononaMark });