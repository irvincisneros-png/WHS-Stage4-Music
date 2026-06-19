# Handover — Woonona High School Stage 4 Music

A supplemental, interactive learning site for NSW Stage 4 (Years 7–8) Music,
built for Woonona High School. It is **not** the primary teaching tool — the
framing throughout is "extra practice between lessons; class is still where the
real work happens."

This document is for the next person (or agent) picking up the project. Read it
top to bottom before changing anything.

---

## 1. What this is / tech stack

- **Single-page app, no build step.** `index.html` loads React 18 + Babel
  Standalone, then a series of `<script type="text/babel">` JSX files that the
  browser compiles **at runtime**. There is no bundler, no npm install, no
  transpile step to deploy. To run it: open `index.html` (ideally via a static
  server so relative paths and `fetch` behave — e.g. `python3 -m http.server`).
- **React + Babel are vendored** in `vendor/` (`react.development.js`,
  `react-dom.development.js`, `babel.min.js`). This was deliberate: the site
  used to load them from unpkg, which is blocked in some networks and made the
  page render blank. Do **not** re-point these at a CDN.
- **All JSX files share one global scope** (they're separate `<script>` tags,
  not modules). Components/utilities are attached to `window` (e.g.
  `window.TopicPage`, `window.Students`, `window.MusicAudio`) and read off
  `window` elsewhere. There are no `import`/`export` statements. Keep it that
  way unless you introduce a real build step.
- **State is local-only.** Everything persists to `localStorage`. There is no
  backend and no real authentication (by design — see §5).

## 2. File map

```
index.html                  Script load order (order matters — deps first)
styles.css                  Design system: CSS vars, chunky cards, 3D tilt,
                            dark/light, reduced-motion, focus-visible
app.jsx                     Root <App>, hash router, per-student state hook,
                            YearHome, Tweaks panel wiring, backup/restore
tweaks-panel.jsx            Reusable settings-panel shell + form controls
image-slot.js               Drag-to-replace image slot (design-tool helper;
                            persists to a sidecar file, NOT localStorage)

lib/
  audio.jsx                 Web Audio synth engine (window.MusicAudio):
                            piano, pluck, drums, ding, metronome click
  ui.jsx                    TiltCard (3D hover + keyboard a11y), Modal, Chip,
                            XPBar, Stars, Glyph (SVG icon set)
  store.jsx                 window.Students: per-student registry + namespaced
                            localStorage (whs.s.<id>.<key>), export/import
  curriculum.jsx            window.CURRICULUM — all topic content for both years
  quiz-data.jsx             window.QUIZ_BY_TOPIC + buildYearTest() sampler
  sections-data.jsx         window.SECTION_EXTRAS — per-section images/interactives
  concept-visuals.jsx       window.ConceptVisual — inline SVG concept diagrams

interactives/               Self-contained widgets (each attaches to window)
  clef-trainer.jsx          Treble/bass note-reading speed drill
  rhythm-game.jsx           Rhythm clap-back
  drum-pads.jsx             Drum pads + 16-step sequencer
  piano.jsx                 Play-along keyboard + grand staff (Flintstones Simple)
  elements-explorer.jsx     Six "elements of music" demos
  section-bits.jsx          Small section-level widgets (staff, chords, etc.)
  listening-bits.jsx        Listening-in-context widgets (dictation, hi/same/lo…)
  piano-bits.jsx            Year 8 two-hand piano widgets

components/
  header.jsx                Brand + year tabs + XP/level/streak HUD + student menu
  year-map.jsx              Topic tile grid for the selected year
  topic-page.jsx            Full module page (sections, interactive, quiz, sidebar)
  section-page.jsx          One concept page (image, reading, interactives)
  quiz.jsx                  Quiz engine + ModuleQuiz wrapper
  test-runner.jsx           Pre-/Post-test driver + results + ScoreDial
  progress-dashboard.jsx    Completion/quiz/pre-vs-post dashboard
  login.jsx                 Profile picker / create form / class dropdown
  lesson-modal.jsx          (legacy modal, largely superseded by topic-page)
```

## 3. How it fits together

- **Routing** is hash-based, parsed in `app.jsx` (`parseHash`):
  - `#/year7` / `#/year8` — year home
  - `#/year7/<topicId>` — module page
  - `#/year7/<topicId>/s/<index>` — section page
  - `#/year7/pretest` · `#/year7/posttest` · `#/year7/progress`
  Back/forward and deep links work; state survives refresh.
- **Students**: on first load `login.jsx` shows a Netflix-style profile picker.
  Each profile gets its own namespace `whs.s.<studentId>.<key>`. `SignedInApp`
  is mounted with `key={student.id}` so switching profiles fully remounts and
  never mixes data. Global device settings (theme/sound/difficulty) live in
  un-namespaced keys via `useLocalGlobal`.
- **Data contracts** (keep these aligned if you add content):
  - `CURRICULUM[year].topics[].deep` (the concept list) must line up 1:1 with
    `SECTION_EXTRAS["<topicId>/<index>"]`. They currently match exactly for all
    17 topics (verified). A section with no extras still renders, just without
    an image/interactive.
  - Every topic should have a `QUIZ_BY_TOPIC[topicId]` entry (all 17 do).
  - `buildYearTest(year)` samples **2 questions per topic** (falls back to fewer
    if a pool is small), tags each with `topicId`/`topicTitle`, then shuffles.

## 4. Recent work (last two commits)

1. **Initial implementation** — copied the Claude Design prototype from
   `project/` to the repo root, wired the real RISE logo into `assets/`.
2. **Bug fixes + improvements:**
   - Removed duplicate `background`/`border` style keys in section-page sidebar.
   - Removed dead `readJSON` in `progress-dashboard.jsx`.
   - Hardened `useStudentLocal` against a write-race on profile switch.
   - `TestRunner` rebuilds questions via `useMemo([year, kind])`.
   - Pre/Post tests sample **2** questions per topic (was 1) for finer results.
   - Module quizzes only mark a module complete at **≥50%** (failed attempts are
     still recorded, they just don't earn the badge/XP).
   - `prefers-reduced-motion` support (disables tilt/parallax/wobble).
   - Visible keyboard focus rings globally + on quiz options; clickable
     `TiltCard`s are keyboard-operable (role/tabindex/Enter/Space).
   - Vendored React + Babel locally.
   - Backup & restore (export/import all progress as JSON) in Settings.

> **Git:** there is **no remote configured**. Commits are local only. Add a
> remote and push when you're ready (`git remote add origin … && git push -u …`).

## 5. Hard constraints — don't undo these

These came from explicit user decisions across the design sessions:

- **Copyright:** Do **not** transcribe the actual Flintstones theme (or other
  copyrighted songs) into the page. The piano interactive uses a melody the
  teacher supplied via the "Simple Melody" note list; keep custom-notes input as
  the path for teacher-entered repertoire. Public-domain melodies only otherwise.
- **No real auth / security.** This is classroom identification, not login
  security. Don't add passwords or imply the data is protected. Data is
  on-device localStorage only.
- **No "Week N" labels** and **no "Formal task"** wording anywhere user-facing.
  Modules are dip-in-any-order; assessment callouts say "Assessment".
- **Human-sounding copy, no em dashes** in user-visible strings.
- **ICIP / First Nations** material: keep the clearly-labelled notice on the
  Composition/Listening modules; do not add First Nations audio or imagery
  unless the school supplies it under proper protocols.
- **Original branding only** — the RISE crest (`assets/rise-logo.jpg`) is the
  school's real logo; don't reproduce other companies' branded UI.
- **Class list:** Year 7 = 7MUS1–7MUS7 with **7MUSC4** as the CAPA outlier;
  Year 8 = 8MUS1–8MUS7. Example student name is **Luna Cisneros**.
- **Teaching team:** Ms Sharp, Ms Arnold, Ms Crighton, Mr Cisneros.

## 6. How to validate changes (no test framework in-repo)

There's no committed test setup, but the JSX is easy to check headlessly with a
throwaway Node install. The two checks that caught everything during the last
pass:

```bash
# one-time, in a scratch dir:
cd /tmp && npm init -y && npm install @babel/core @babel/preset-react \
  react@18.3.1 react-dom@18.3.1 jsdom

# (a) Does every JSX file compile the way the browser's Babel will?
cd /path/to/repo && node -e '
const b=require("/tmp/node_modules/@babel/core"),fs=require("fs");
const files=require("child_process").execSync("find lib components interactives app.jsx tweaks-panel.jsx -name \"*.jsx\"").toString().trim().split("\n");
let fail=0; for(const f of files){try{b.transformSync(fs.readFileSync(f,"utf8"),{presets:["/tmp/node_modules/@babel/preset-react"],filename:f});}catch(e){fail++;console.log("ERR",f,e.message.split("\n")[0]);}}
console.log(fail?fail+" failed":"all compile clean");'
```

For a runtime smoke test, transpile each file and `vm.runInContext` it into a
`jsdom` window (stub `localStorage` and `AudioContext`), then mount every
`TopicPage`/`SectionPage`/`TestRunner`/etc. with `react-dom/client`. A clean run
reports **0 React errors/warnings** across all 17 topic pages + 57 section pages.
(The only benign warning is a jsdom-only `attachEvent` message from `autoFocus`.)

Per README guidance, don't screenshot/render in a browser unless asked — the
source is the source of truth.

## 7. Good next steps (not yet done)

- **Build step (optional, bigger):** in-browser Babel transpiling ~26 files on
  every load is slow. A one-time esbuild/Vite bundle would speed load a lot — but
  it removes the "just open index.html" property, so it's a real tradeoff. Left
  undone on purpose.
- **More quiz questions per topic** to deepen the diagnostic value of the tests.
- **Richer content** for any thin sections; more section-level interactives.
- **Remaining interactives** floated earlier but not built: guitar chord trainer
  variants, orchestra explorer, film-music mood-matcher, texture identifier,
  composition layer-builder.
- **Teacher view / class export** if staff want to see cohort progress (currently
  all data is per-device, per-browser).

---

## 8. Continuation prompt (copy-paste to start a new session)

```
You are continuing work on the Woonona High School "Stage 4 Music" website in
this repo. Read HANDOVER.md first — it has the full architecture, file map, hard
constraints, and how to validate changes.

Key facts:
- No build step. index.html loads vendored React + Babel (vendor/) and compiles
  JSX in the browser. All JSX shares one global scope and attaches components to
  window (no import/export). Don't add a build step or re-point deps at a CDN
  unless I explicitly ask.
- State is per-student localStorage under whs.s.<id>.<key> via window.Students.
  Hash routing in app.jsx. Data is on-device only; no real auth.
- Honour the hard constraints in HANDOVER.md §5: no copyrighted song
  transcriptions, no "Week N" / "Formal task" wording, no em dashes in copy,
  keep the ICIP notice, original branding only, class list 7MUS1–7MUS7
  (7MUSC4 = CAPA) and 8MUS1–8MUS7, example name Luna Cisneros.

Before coding: tell me your plan and ask about anything ambiguous. After coding:
validate with the compile-check and jsdom smoke test described in HANDOVER.md §6
(all JSX must compile; all pages must mount with zero React errors), then report
what changed. There is no git remote — commit locally and tell me if I should
push.

My task for you: <DESCRIBE THE CHANGE HERE>
```
