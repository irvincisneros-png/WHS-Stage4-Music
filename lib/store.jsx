/* Local, anonymous progress storage.
   There is no login and there are no student profiles. Everything for the
   person using this browser is saved under one fixed namespace
   (whs.local.<key>). No names, classes, or other personal data are collected
   or stored anywhere. */

(function () {
  const NS = "whs.local.";

  // Fixed, nameless local "student". Kept as an object with a stable id so the
  // rest of the app (originally written to be student-aware) keeps working
  // unchanged. It carries no personal data.
  const LOCAL = { id: "local" };

  function readJSON(k, d) {
    try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; }
    catch { return d; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }

  // Always "signed in" as the single local profile.
  function getCurrentStudent() { return LOCAL; }

  /* Namespaced key helpers: `whs.local.<key>` */
  function readNS(key, dflt) { return readJSON(NS + key, dflt); }
  function writeNS(key, value) { writeJSON(NS + key, value); }
  function removeNS(key) { try { localStorage.removeItem(NS + key); } catch {} }

  // Clear every bit of progress saved on this device (XP, badges, quiz scores,
  // pre/post tests, current year). Used by the "Reset my progress" button.
  function resetProgress() {
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(NS)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  // One-time cleanup of the old per-student login: deletes any leftover
  // whs.students / whs.currentStudent registry and every whs.s.* profile
  // namespace (names, classes, progress saved during earlier testing). Safe to
  // run on every load; it's a no-op once nothing legacy remains.
  (function purgeLegacyProfiles() {
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === "whs.students" || k === "whs.currentStudent" || k.startsWith("whs.s."))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  })();

  window.Students = {
    getCurrentStudent,
    readNS, writeNS, removeNS,
    resetProgress,
  };
})();
