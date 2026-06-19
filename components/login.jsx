/* Login screen — student profile picker for Stage 4 Music.
   Persists individual student progress per profile. */

function LoginScreen({ onSignIn }) {
  const [students, setStudents] = React.useState(() => window.Students.listStudents());
  const [mode, setMode] = React.useState(() => students.length === 0 ? "create" : "pick");
  // form state
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName]   = React.useState("");
  const [classCode, setClassCode] = React.useState("");
  const [avatar, setAvatar]       = React.useState(window.Students.AVATAR_COLORS[0]);
  const [error, setError]         = React.useState(null);

  function refresh() { setStudents(window.Students.listStudents()); }

  function pickStudent(student) {
    window.Students.setCurrentStudentId(student.id);
    window.Students.updateStudent(student.id, {});
    onSignIn(student);
  }

  function createStudent(e) {
    if (e) e.preventDefault();
    if (!firstName.trim()) { setError("Please enter at least a first name."); return; }
    const s = window.Students.addStudent({ firstName, lastName, classCode, avatar });
    window.Students.setCurrentStudentId(s.id);
    onSignIn(s);
  }

  function deleteStudent(s) {
    if (!confirm(`Remove ${window.Students.displayName(s)}'s profile? Their progress will be deleted permanently.`)) return;
    window.Students.removeStudent(s.id);
    const list = window.Students.listStudents();
    setStudents(list);
    if (list.length === 0) setMode("create");
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      position: "relative",
    }}>
      {/* Soft musical background decoration */}
      <BackgroundStaff />

      <div className="chunk paper" style={{
        width: "min(820px, 100%)",
        padding: "44px 44px 36px",
        position: "relative",
        zIndex: 1,
        background: "var(--bg-2)",
      }}>
        {/* Logo + wordmark band */}
        <div className="col center gap-3" style={{ marginBottom: 28 }}>
          <img
            src="assets/rise-logo.jpg"
            alt="Woonona High School RISE crest"
            width="160"
            height="160"
            style={{
              width: 160,
              height: 160,
              objectFit: "contain",
              borderRadius: 999,
              background: "transparent",
            }}
          />
          <div className="eyebrow">Woonona High School</div>
          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            textAlign: "center",
            margin: 0,
          }}>Stage 4 Music</h1>
          <p className="text-soft center-text" style={{ maxWidth: 480, fontSize: ".98rem", lineHeight: 1.5 }}>
            Sign in to keep track of your modules, quizzes and how you're going across Year 7 and Year 8.
          </p>
        </div>

        {/* Picker or Create mode */}
        {mode === "pick" && students.length > 0 ? (
          <ProfilePicker
            students={students}
            onPick={pickStudent}
            onDelete={deleteStudent}
            onAddNew={() => { setMode("create"); setError(null); }}
          />
        ) : (
          <CreateForm
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            classCode={classCode} setClassCode={setClassCode}
            avatar={avatar} setAvatar={setAvatar}
            error={error}
            hasExisting={students.length > 0}
            onSubmit={createStudent}
            onCancel={() => { setMode("pick"); setError(null); }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-soft center-text mt-6" style={{ fontSize: ".82rem", maxWidth: 600, lineHeight: 1.5 }}>
        Profiles and progress live on this device only.
        Teaching team: your Stage 4 Music teachers.
      </div>
    </div>
  );
}

/* ---------- Profile picker (Netflix-style) ---------- */

function ProfilePicker({ students, onPick, onDelete, onAddNew }) {
  return (
    <div className="col gap-4">
      <div className="eyebrow center-text">Who's signing in?</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 16,
      }}>
        {students.map(s => (
          <ProfileCard key={s.id} student={s} onPick={() => onPick(s)} onDelete={() => onDelete(s)} />
        ))}
        {/* Add-new tile */}
        <TiltCard intensity={8} className="chunk" style={{
          padding: 0, cursor: "pointer", minHeight: 200, background: "var(--bg)",
        }} onClick={onAddNew}>
          <div className="col center gap-3" style={{ padding: "28px 18px", height: "100%", justifyContent: "center" }}>
            <div className="tilt-layer-3" style={{
              width: 72, height: 72,
              borderRadius: 999,
              background: "var(--bg-2)",
              border: "2.5px dashed var(--ink-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--ink-soft)",
            }}>+</div>
            <div className="tilt-layer-2 col center gap-1">
              <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Add student</strong>
              <span className="text-soft" style={{ fontSize: ".82rem" }}>Create new profile</span>
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}

function ProfileCard({ student, onPick, onDelete }) {
  const initials = window.Students.initials(student);
  const name     = window.Students.displayName(student);
  return (
    <TiltCard intensity={9} className="chunk" style={{
      padding: 0, cursor: "pointer", minHeight: 200, position: "relative", overflow: "hidden",
    }} onClick={onPick}>
      {/* Avatar block */}
      <div className={"tile-art t-" + (student.avatar || "terracotta")} style={{
        padding: "26px 16px",
        minHeight: 130,
        borderRadius: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div className="tilt-layer-3" style={{
          width: 76, height: 76,
          borderRadius: 999,
          background: "rgba(255,255,255,.25)",
          border: "2.5px solid rgba(255,255,255,.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontSize: "1.8rem",
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-.02em",
        }}>{initials}</div>
        {/* delete icon (subtle, top-right) */}
        <button
          className="profile-x"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label={`Delete profile for ${name}`}
          style={{
            position: "absolute", top: 8, right: 8,
            width: 26, height: 26,
            borderRadius: 999,
            background: "rgba(0,0,0,.25)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: ".9rem",
            opacity: .6,
            transition: "opacity .15s",
          }}
        >✕</button>
      </div>
      <div className="col gap-1" style={{ padding: "14px 16px" }}>
        <strong className="tilt-layer-1" style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.05rem",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>{name}</strong>
        {student.classCode && (
          <span className="text-soft mono" style={{ fontSize: ".72rem" }}>{student.classCode}</span>
        )}
      </div>
    </TiltCard>
  );
}

/* ---------- Create-new form ---------- */

function CreateForm({ firstName, setFirstName, lastName, setLastName, classCode, setClassCode,
                      avatar, setAvatar, error, hasExisting, onSubmit, onCancel }) {
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid var(--border)",
    borderRadius: 12,
    background: "var(--bg)",
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  };
  const labelStyle = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: ".7rem",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "var(--ink-soft)",
    marginBottom: 6,
  };

  return (
    <form className="col gap-4" onSubmit={onSubmit}>
      <div className="eyebrow center-text">Create your profile</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>First name</label>
          <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)}
                 placeholder="e.g. Alex" autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Last name</label>
          <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)}
                 placeholder="e.g. Lee" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Class</label>
        <ClassPicker value={classCode} onChange={setClassCode} />
      </div>

      <div>
        <label style={labelStyle}>Pick an avatar colour</label>
        <div className="row gap-2 wrap">
          {window.Students.AVATAR_COLORS.map(c => (
            <button
              key={c} type="button"
              onClick={() => setAvatar(c)}
              aria-label={"Avatar " + c}
              style={{
                width: 44, height: 44, borderRadius: 12,
                border: "2.5px solid " + (avatar === c ? "var(--ink)" : "transparent"),
                cursor: "pointer",
                padding: 0,
                outline: "none",
                background: "transparent",
                position: "relative",
                boxShadow: avatar === c ? "0 4px 0 0 var(--ink)" : "0 2px 0 0 var(--border)",
                transition: "transform .15s var(--ease-spring)",
                transform: avatar === c ? "translateY(-1px)" : "none",
              }}
            >
              <div className={"tile-art t-" + c} style={{ width: "100%", height: "100%", borderRadius: 8 }} />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(217, 104, 70, .08)",
          border: "1.5px dashed var(--terracotta)",
          borderRadius: 10,
          color: "var(--terracotta)",
          fontSize: ".9rem",
        }}>{error}</div>
      )}

      <div className="row gap-3 wrap" style={{ marginTop: 6 }}>
        <button type="submit" className="btn btn-primary">
          ▶ Sign in & start
        </button>
        {hasExisting && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            ← Back to profiles
          </button>
        )}
      </div>
    </form>
  );
}

/* ---------- Class picker — generic placeholder classes ---------- */

function ClassPicker({ value, onChange }) {
  const groups = [
    {
      label: "Year 7",
      options: [
        { code: "7A" },
        { code: "7B" },
        { code: "7C" },
        { code: "7D", note: "CAPA" },
        { code: "7E" },
        { code: "7F" },
        { code: "7G" },
      ],
    },
    {
      label: "Year 8",
      options: [
        { code: "8A" },
        { code: "8B" },
        { code: "8C" },
        { code: "8D" },
        { code: "8E" },
        { code: "8F" },
        { code: "8G" },
      ],
    },
  ];

  const selectStyle = {
    width: "100%",
    padding: "12px 38px 12px 14px",
    border: "1.5px solid var(--border)",
    borderRadius: 12,
    background: "var(--bg)",
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    fontWeight: 600,
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    cursor: "pointer",
    transition: "border-color .2s, box-shadow .2s",
  };

  return (
    <div className="col gap-2">
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={selectStyle}
          aria-label="Select your class"
        >
          <option value="">Select your class…</option>
          {groups.map(g => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map(o => (
                <option key={o.code} value={o.code}>
                  {o.code}{o.note ? "  ·  " + o.note + " class" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {/* custom chevron */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: ".75rem",
            color: "var(--ink-soft)",
          }}
        >▾</span>
      </div>
      <div className="row center gap-2" style={{ fontSize: ".78rem", color: "var(--ink-soft)" }}>
        <span
          className="mono"
          style={{
            fontSize: ".62rem",
            fontWeight: 700,
            letterSpacing: ".08em",
            padding: "2px 7px",
            borderRadius: 999,
            background: "var(--butter)",
            color: "var(--espresso-2)",
            border: "1.2px solid var(--butter-d)",
          }}
        >CAPA</span>
        <span>7D is the Creative &amp; Performing Arts class.</span>
      </div>
    </div>
  );
}

/* ---------- Background decoration: a long faint staff with floating notes ---------- */

function BackgroundStaff() {
  return (
    <svg
      width="100%" height="100%" viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0,
        opacity: 0.06,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <g stroke="var(--ink)" strokeWidth="1.2" fill="none">
        {[180, 200, 220, 240, 260].map((y, i) => <line key={i} x1="0" x2="1200" y1={y} y2={y} />)}
        {[560, 580, 600, 620, 640].map((y, i) => <line key={"b"+i} x1="0" x2="1200" y1={y} y2={y} />)}
      </g>
      <g fill="var(--ink)">
        {/* a few stylised notes */}
        <g transform="translate(120 240) rotate(-15)">
          <ellipse cx="0" cy="0" rx="12" ry="9" />
          <rect x="10" y="-50" width="2" height="50" />
        </g>
        <g transform="translate(280 220) rotate(-12)">
          <ellipse cx="0" cy="0" rx="12" ry="9" />
          <rect x="10" y="-50" width="2" height="50" />
          <path d="M11 -50 Q26 -36 26 -16" stroke="var(--ink)" strokeWidth="3" fill="none" />
        </g>
        <g transform="translate(900 620) rotate(8)">
          <ellipse cx="0" cy="0" rx="12" ry="9" />
          <rect x="10" y="-50" width="2" height="50" />
        </g>
        <g transform="translate(1040 600)">
          <ellipse cx="0" cy="0" rx="12" ry="9" />
          <rect x="10" y="-50" width="2" height="50" />
          <path d="M11 -50 Q28 -38 28 -18" stroke="var(--ink)" strokeWidth="3" fill="none" />
        </g>
        {/* treble clef */}
        <text x="20" y="248" fontSize="92" fontFamily="serif" fill="var(--ink)">𝄞</text>
        <text x="20" y="638" fontSize="76" fontFamily="serif" fill="var(--ink)">𝄢</text>
      </g>
    </svg>
  );
}

window.LoginScreen = LoginScreen;
