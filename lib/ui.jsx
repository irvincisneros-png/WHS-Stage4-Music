/* Shared UI primitives: TiltCard (3D hover), Modal, Chip, Btn, XPBar.
   Exported to window so other babel scripts can use them. */

const { useState, useRef, useEffect, useCallback } = React;

/* ---------- 3D Tilt Card ---------- */
function TiltCard({ children, intensity = 14, className = "", style, onClick, locked, ...rest }) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el || locked) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0..1
    const y = (e.clientY - r.top) / r.height;
    const ry = (x - 0.5) * intensity * 2;       // left↔right
    const rx = -(y - 0.5) * intensity * 2;      // up↕down
    el.style.setProperty("--ty", ry + "deg");
    el.style.setProperty("--tx", rx + "deg");
    el.style.setProperty("--mx", (x * 100) + "%");
    el.style.setProperty("--my", (y * 100) + "%");
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.setProperty("--tx", "0deg");
    el.style.setProperty("--ty", "0deg");
  };

  const keyboardProps = (onClick && !locked) ? {
    role: "button",
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        onClick(e);
      }
    },
  } : {};

  return (
    <div
      ref={ref}
      className={"tilt " + className}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={locked ? undefined : onClick}
      {...keyboardProps}
      {...rest}
    >
      <div className="tilt-inner" style={{ height: "100%" }}>{children}</div>
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({ open, onClose, children, maxWidth }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Remember what had focus before the modal opened so we can restore it.
    returnFocusRef.current = document.activeElement;

    // Move focus into the panel (or first focusable child) once it renders.
    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        panel.focus();
      }
    }

    // Escape to close.
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Return focus to the trigger element when the modal closes.
      if (returnFocusRef.current && typeof returnFocusRef.current.focus === "function") {
        returnFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  // Tab trap: keep focus cycling within the modal panel.
  const onTabKey = (e) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    ));
    if (focusable.length === 0) { e.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="modal-card"
        style={{ maxWidth: maxWidth || undefined }}
        role="dialog"
        aria-modal="true"
        aria-label="Dialog"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onTabKey}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Chip ---------- */
function Chip({ children, variant }) {
  const cls = variant ? `chip solid-${variant}` : "chip";
  return <span className={cls}>{children}</span>;
}

/* ---------- XP Bar ---------- */
function XPBar({ value, max }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="xp-bar" style={{ width: 140 }}>
      <i style={{ width: pct + "%" }} />
    </div>
  );
}

/* ---------- Difficulty stars ---------- */
function Stars({ n, max = 3, color }) {
  return (
    <span className="stars" style={{ color: color || "currentColor" }}>
      {Array.from({ length: max }).map((_, i) => <i key={i} className={i < n ? "on" : ""} />)}
    </span>
  );
}

/* ---------- Icon (very small SVG glyph set; placeholders for topics) ---------- */
function Glyph({ name, size = 56, stroke = "currentColor" }) {
  const sw = 2.2;
  const props = { width: size, height: size, viewBox: "0 0 64 64", fill: "none", stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "note":
      return (<svg {...props}>
        <path d="M26 14 V46" /><path d="M26 14 L48 10 V42" />
        <circle cx="20" cy="46" r="6" fill={stroke} stroke="none" />
        <circle cx="42" cy="42" r="6" fill={stroke} stroke="none" />
      </svg>);
    case "drum":
      return (<svg {...props}>
        <ellipse cx="32" cy="22" rx="22" ry="6" />
        <path d="M10 22 V42" /><path d="M54 22 V42" />
        <ellipse cx="32" cy="42" rx="22" ry="6" />
        <path d="M14 50 L20 56" /><path d="M50 50 L44 56" />
      </svg>);
    case "mic":
      return (<svg {...props}>
        <rect x="24" y="8" width="16" height="28" rx="8" />
        <path d="M16 30 a16 16 0 0 0 32 0" />
        <path d="M32 46 V58" /><path d="M22 58 H42" />
      </svg>);
    case "staff":
      return (<svg {...props}>
        <path d="M6 18 H58" /><path d="M6 26 H58" /><path d="M6 34 H58" /><path d="M6 42 H58" /><path d="M6 50 H58" />
        <circle cx="22" cy="42" r="4" fill={stroke} stroke="none" />
        <circle cx="40" cy="34" r="4" fill={stroke} stroke="none" />
      </svg>);
    case "wave":
      return (<svg {...props}>
        <path d="M4 32 Q14 12 24 32 T44 32 T60 32" />
      </svg>);
    case "guitar":
      return (<svg {...props}>
        <circle cx="22" cy="44" r="14" />
        <path d="M30 36 L52 14" />
        <path d="M48 10 L56 18" />
        <circle cx="22" cy="44" r="4" />
      </svg>);
    case "ear":
      return (<svg {...props}>
        <path d="M18 22 a14 14 0 0 1 28 0 c0 10-8 12-10 18s-6 8-12 6 -6-10 0-12" />
        <circle cx="32" cy="26" r="3" />
      </svg>);
    case "piano":
      return (<svg {...props}>
        <rect x="6" y="20" width="52" height="28" rx="3" />
        <path d="M19 20 V40" /><path d="M32 20 V40" /><path d="M45 20 V40" />
        <rect x="14" y="20" width="6" height="14" fill={stroke} stroke="none" />
        <rect x="27" y="20" width="6" height="14" fill={stroke} stroke="none" />
        <rect x="40" y="20" width="6" height="14" fill={stroke} stroke="none" />
      </svg>);
    case "compose":
      return (<svg {...props}>
        <rect x="8" y="14" width="48" height="36" rx="6" />
        <path d="M16 26 H30" /><path d="M16 34 H42" /><path d="M16 42 H38" />
        <circle cx="46" cy="22" r="3" fill={stroke} stroke="none" />
      </svg>);
    case "orchestra":
      return (<svg {...props}>
        <path d="M10 50 Q32 28 54 50" />
        <circle cx="14" cy="20" r="4" /><circle cx="32" cy="14" r="4" /><circle cx="50" cy="20" r="4" />
        <path d="M14 24 V44" /><path d="M32 18 V44" /><path d="M50 24 V44" />
      </svg>);
    case "film":
      return (<svg {...props}>
        <rect x="6" y="14" width="52" height="36" rx="4" />
        <circle cx="16" cy="20" r="2" /><circle cx="24" cy="20" r="2" />
        <circle cx="32" cy="20" r="2" /><circle cx="40" cy="20" r="2" />
        <circle cx="48" cy="20" r="2" />
        <path d="M26 30 L42 38 L26 46 Z" fill={stroke} stroke="none" />
      </svg>);
    case "texture":
      return (<svg {...props}>
        <path d="M6 18 H58" /><path d="M6 32 Q20 22 32 32 T58 32" /><path d="M6 46 L58 46" />
      </svg>);
    case "globe":
      return (<svg {...props}>
        <circle cx="32" cy="32" r="22" />
        <path d="M10 32 H54" /><path d="M32 10 Q14 32 32 54 Q50 32 32 10" />
      </svg>);
    case "spark":
      return (<svg {...props}>
        <path d="M32 8 L36 26 L54 30 L36 34 L32 52 L28 34 L10 30 L28 26 Z" fill={stroke} stroke="none" />
      </svg>);
    default:
      return <svg {...props}><circle cx="32" cy="32" r="20" /></svg>;
  }
}

Object.assign(window, { TiltCard, Modal, Chip, XPBar, Stars, Glyph });
