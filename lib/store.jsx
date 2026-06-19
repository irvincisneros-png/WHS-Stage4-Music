/* Student registry + namespaced storage.
   All progress, XP and quiz data is stored under whs.s.<studentId>.<key>
   so multiple students sharing a browser get independent profiles. */

(function () {
  const STUDENTS_KEY = "whs.students";
  const CURRENT_KEY  = "whs.currentStudent";

  function genId() {
    return "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function readJSON(k, d) {
    try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; }
    catch { return d; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }

  function listStudents() {
    const list = readJSON(STUDENTS_KEY, []);
    return Array.isArray(list) ? list : [];
  }
  function saveStudents(list) { writeJSON(STUDENTS_KEY, list); }

  function getCurrentStudentId() {
    return localStorage.getItem(CURRENT_KEY) || null;
  }
  function setCurrentStudentId(id) {
    if (id == null) localStorage.removeItem(CURRENT_KEY);
    else localStorage.setItem(CURRENT_KEY, id);
    window.dispatchEvent(new CustomEvent("whs:studentchange", { detail: { id } }));
  }
  function getCurrentStudent() {
    const id = getCurrentStudentId(); if (!id) return null;
    return listStudents().find(s => s.id === id) || null;
  }

  // Pool of colour themes a student can pick for their avatar tile
  const AVATAR_COLORS = [
    "terracotta", "teal", "butter", "espresso", "sky", "plum", "pink",
  ];

  function addStudent({ firstName, lastName, classCode, avatar }) {
    const list = listStudents();
    const id = genId();
    const student = {
      id,
      firstName: (firstName || "").trim() || "Student",
      lastName:  (lastName || "").trim(),
      classCode: (classCode || "").trim(),
      avatar:    avatar || AVATAR_COLORS[list.length % AVATAR_COLORS.length],
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };
    list.push(student);
    saveStudents(list);
    return student;
  }
  function updateStudent(id, patch) {
    const list = listStudents();
    const i = list.findIndex(s => s.id === id);
    if (i < 0) return null;
    list[i] = { ...list[i], ...patch, lastSeenAt: Date.now() };
    saveStudents(list);
    return list[i];
  }
  function removeStudent(id) {
    const list = listStudents().filter(s => s.id !== id);
    saveStudents(list);
    // Also wipe their data
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("whs.s." + id + ".")) localStorage.removeItem(k);
    });
    if (getCurrentStudentId() === id) setCurrentStudentId(null);
  }

  /* Namespaced key helpers: `whs.s.<id>.<key>` */
  function nsKey(key) {
    const id = getCurrentStudentId();
    return id ? "whs.s." + id + "." + key : null;
  }
  function readNS(key, dflt) {
    const k = nsKey(key); if (!k) return dflt;
    return readJSON(k, dflt);
  }
  function writeNS(key, value) {
    const k = nsKey(key); if (!k) return;
    writeJSON(k, value);
  }
  function removeNS(key) {
    const k = nsKey(key); if (!k) return;
    localStorage.removeItem(k);
  }

  function initials(student) {
    if (!student) return "?";
    const f = (student.firstName || "")[0] || "";
    const l = (student.lastName  || "")[0] || "";
    return (f + l).toUpperCase() || "?";
  }
  function displayName(student) {
    if (!student) return "Student";
    return [student.firstName, student.lastName].filter(Boolean).join(" ") || "Student";
  }

  // ── Data portability ────────────────────────────────────────────────────

  // Collect every localStorage key starting with "whs." and build a
  // portable snapshot object. Returns a pretty-printed JSON string.
  function exportAll() {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("whs.")) {
          const raw = localStorage.getItem(k);
          try { data[k] = JSON.parse(raw); }
          catch { data[k] = raw; }
        }
      }
      return JSON.stringify({ version: 1, exportedAt: Date.now(), data }, null, 2);
    } catch {
      return JSON.stringify({ version: 1, exportedAt: Date.now(), data: {} });
    }
  }

  // Restore a snapshot produced by exportAll(). By default merges on top of
  // existing data; pass { replace: true } to wipe all "whs." keys first.
  // Returns { ok: true, studentCount: <n> } or throws on invalid input.
  function importAll(jsonString, opts) {
    opts = opts || {};
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object" || !parsed.data || typeof parsed.data !== "object") {
      throw new Error("Invalid backup file");
    }
    if (opts.replace) {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("whs.")) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    }
    const entries = Object.entries(parsed.data);
    for (const [key, value] of entries) {
      if (!key.startsWith("whs.")) continue;
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }
    let studentCount = 0;
    try {
      const students = parsed.data[STUDENTS_KEY];
      const arr = Array.isArray(students) ? students : (typeof students === "string" ? JSON.parse(students) : []);
      studentCount = Array.isArray(arr) ? arr.length : 0;
    } catch { studentCount = 0; }
    return { ok: true, studentCount };
  }

  window.Students = {
    AVATAR_COLORS,
    listStudents, addStudent, updateStudent, removeStudent,
    getCurrentStudentId, setCurrentStudentId, getCurrentStudent,
    readNS, writeNS, removeNS,
    initials, displayName,
    exportAll, importAll,
  };
})();
