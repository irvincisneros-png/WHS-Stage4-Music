# IMAGE-PROMPTS.md
## Stage 4 Music Site — AI Image Generation Plan (Antigravity 2.0 → Nano Banana 2.0)

> **Prepared for:** Stage 4 Music Teaching Website  
> **Tool:** Antigravity 2.0, using the **Nano Banana 2.0** image model  
> **Purpose:** Ready-to-use prompts and `image:` snippets for every recommended photo slot.  
> **Date:** June 2026

---

## ⚠️ MUST READ — Force Antigravity to use Nano Banana 2.0

By default, Antigravity will try to **draw images with Python code** (matplotlib / PIL) — which looks wrong for photographs. You must explicitly tell it to use the **Nano Banana 2.0** image model, which is the one built for realistic, creative image generation.

Every prompt below **already begins with that instruction** — so copy the *whole* code block, not just the description. If you ever write your own prompt, start it with:

> *"Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do not draw it with Python / matplotlib / PIL."*

---

## FIRM RULES — Read Before Generating Anything

### RULE 1 — Never generate musical notation with AI

Do NOT use Nano Banana 2.0 (or any AI image model) to generate musical notation, staves, clefs, chord diagrams, tablature, time signatures, note heads, ledger lines, or any music-theory diagram. AI image models render these with systematic errors — wrong note positions, garbled clef symbols, impossible fingering. The site already has accurate SVG vector visuals for every theory concept. Those must stay. This plan covers only real-world **photographic** contexts.

### RULE 2 — Never AI-generate First Nations cultural imagery

Do NOT generate Aboriginal or Torres Strait Islander cultural imagery with any AI tool. This includes: traditional art styles, sacred objects (didgeridoo / yidaki in ceremony, clapsticks in cultural use), people in cultural settings, Country-specific imagery, or any iconography that represents a specific First Nations tradition. NSW syllabus ICIP (Indigenous Cultural and Intellectual Property) protocols require proper licensing, attribution and/or community permission — none of which AI generation can provide. For First Nations content, the site uses text descriptions and official links only. This rule is non-negotiable.

---

## How to Add an Image Once Generated

1. **Save the file** to the path listed in the "Target file" column (create the sub-folder under `assets/` if it doesn't exist yet).
2. Open `lib/sections-data.jsx`.
3. Find the matching `SECTION_EXTRAS` key (e.g. `"y8-orchestra/0"`).
4. Replace or add the `image:` property with the ready-to-paste snippet provided below.
5. Save. The site's `<SectionImage>` component will display the photo automatically. If the file is missing, a styled dashed placeholder renders instead — so you can paste the snippet before the image is ready with no broken-page risk.

> **Sub-folders to create under `assets/`:**  
> `assets/instruments/`, `assets/guitar/`, `assets/keyboard/`, `assets/drums/`, `assets/singing/`, `assets/context/`

---

## Prioritised Image Recommendations

Images are grouped by topic and marked **[MUST-HAVE]** or **[NICE-TO-HAVE]** based on pedagogical impact and current gap on the site.

---

### ORCHESTRA — y8-orchestra  
*(Currently: all three sections use concept-visual SVG chips. Photos here powerfully ground the timbre vocabulary.)*

---

#### IMAGE 01 — String section in performance  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y8-orchestra/0"`  
**Target file:** `assets/instruments/strings-section.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of a professional symphony orchestra string section mid-performance. 
Violins and violas in the foreground, cellos and double basses behind them. Musicians in 
formal black concert attire, bows moving across strings in unison. Warm stage lighting from 
above, concert hall with dark background and slight bokeh. Landscape orientation 16:9, 
shallow depth of field on the front row. Clean, warm editorial style. No text, no watermarks, 
no music stands visible as the main focus.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/instruments/strings-section.jpg",
  alt: "A professional orchestra string section — violins, violas, cellos and double basses — performing on stage under warm concert lighting.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 02 — Woodwind section  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y8-orchestra/1"`  
**Target file:** `assets/instruments/woodwind-section.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of four orchestral woodwind players seated together, viewed from a 
slight angle. Flautist, oboist, clarinetist and bassoonist visible, each holding their 
instrument at rest between phrases. Formal concert black attire. Clean neutral dark 
background, soft warm studio-style lighting. Landscape 16:9. Sharp focus on the instruments. 
No text, no watermarks. No music stands dominating the frame.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/instruments/woodwind-section.jpg",
  alt: "Four orchestral woodwind players — flute, oboe, clarinet, and bassoon — seated together in concert attire.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 03 — Brass section  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y8-orchestra/2"`  
**Target file:** `assets/instruments/brass-section.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of an orchestral brass section: two trumpeters, two French horn players 
and a trombone player, seated in curved formation. Instruments raised and ready to play. 
Formal concert black attire. Warm amber stage lighting from above, dark concert hall 
background. Landscape 16:9. Sharp focus on the bells of the instruments. No text, no 
watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/instruments/brass-section.jpg",
  alt: "An orchestral brass section — trumpets, French horns and trombone — seated in formation under warm stage lighting.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 04 — Violin close-up (hero instrument)  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** *(add to `"y8-orchestra/0"` as a second image, or add a new `"y8-orchestra/3"` entry)*  
**Target file:** `assets/instruments/violin-hero.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of a violinist's hands and instrument. Left hand in third 
position on the fingerboard, right hand drawing the bow across the A string. Warm studio 
lighting, shallow depth of field, rich amber tones in the spruce top and maple back. 
Landscape 16:9. No face visible — frame from mid-torso down. Clean neutral background. 
No text, no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/instruments/violin-hero.jpg",
  alt: "Close-up of a violinist's hands — left hand on the fingerboard, right hand drawing the bow across the strings.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 05 — Trumpet close-up (hero instrument)  
**Priority:** NICE-TO-HAVE  
**SECTION_EXTRAS key:** `"y8-orchestra/3"` *(new entry)*  
**Target file:** `assets/instruments/trumpet-hero.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of a trumpeter's hands and instrument. Right hand on the 
three valves, left hand supporting the bell, instrument angled slightly upward. Warm brass 
tone, bright studio lighting on the lacquered surface. Landscape 16:9, shallow depth of 
field. No face visible — frame from mid-torso down. Clean neutral dark background. 
No text, no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/instruments/trumpet-hero.jpg",
  alt: "Close-up of a trumpeter's hands on the valves, instrument raised and ready to play.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 06 — Flute close-up (hero instrument)  
**Priority:** NICE-TO-HAVE  
**SECTION_EXTRAS key:** `"y8-orchestra/4"` *(new entry)*  
**Target file:** `assets/instruments/flute-hero.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of a flautist holding the instrument horizontally. Both 
hands on the keys, embouchure hole facing forward, fingers curved over silver keywork. 
Clean white or light-grey studio background, cool even lighting. Landscape 16:9. 
No face visible — frame from shoulders down. No text, no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/instruments/flute-hero.jpg",
  alt: "A flautist holding the flute horizontally, fingers curved over the silver keywork.",
  license: "Generated — Nano Banana 2.0",
},
```

---

### GUITAR — y7-guitar / y8-guitar  
*(Currently: all guitar sections use concept-visual SVGs — chord grids, tab, strum-pattern diagrams. A real hand photo anchors the physical technique.)*

---

#### IMAGE 07 — Open chord hand position  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y7-guitar/2"`  
**Target file:** `assets/guitar/open-chord-hand.jpg`

> Note: This section currently has a concept-visual SVG for chord diagrams. Add this photo alongside it by inserting the image entry — the SVG lives in the `image: { kind: "concept", ... }` block. Replace that block with this photo entry, and move the chord diagram to the `try:` array if needed, OR add a new section index `"y7-guitar/4"` to keep both.

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of a guitarist's left hand forming a G major open chord on 
a steel-string acoustic guitar. Fingers clearly pressing strings down on the fretboard, 
fingertips visible, moderate fretting pressure, thumb behind the neck. Warm natural 
side-lighting, shallow depth of field, light wood grain on the guitar neck visible. 
Landscape 16:9. No face visible. Clean, neutral warm background. No text, no watermarks, 
no nail polish or heavy jewellery that would distract.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/guitar/open-chord-hand.jpg",
  alt: "A guitarist's left hand forming an open G major chord on an acoustic guitar — fingers pressing cleanly on the fretboard with the thumb behind the neck.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 08 — Strumming hand technique  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y7-guitar/3"`  
**Target file:** `assets/guitar/strumming-hand.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of a guitarist's right hand mid-strum on a steel-string 
acoustic guitar. Hand relaxed and loose, fingers slightly fanned, caught on the downstroke 
across the soundhole. Warm natural lighting, shallow depth of field, guitar body in the 
lower frame. Landscape 16:9. No face visible. Clean neutral background. No text, 
no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/guitar/strumming-hand.jpg",
  alt: "A guitarist's right hand mid-downstroke strum across the strings of an acoustic guitar, fingers relaxed and loose.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 09 — Barre chord / Year 8 guitar technique  
**Priority:** NICE-TO-HAVE  
**SECTION_EXTRAS key:** `"y8-guitar/0"`  
**Target file:** `assets/guitar/barre-chord.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of a guitarist's left hand forming a barre chord — index 
finger pressing flat across all six strings at the fifth fret, other fingers forming a 
chord shape higher up the neck. Steel-string acoustic or electric guitar, warm studio 
lighting, shallow depth of field. Landscape 16:9. No face visible — frame from mid-torso 
down. Clean neutral dark background. No text, no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/guitar/barre-chord.jpg",
  alt: "A guitarist's left hand forming a barre chord — index finger pressing across all strings at the fifth fret.",
  license: "Generated — Nano Banana 2.0",
},
```

---

### KEYBOARD — y7-keyboard / y8-keyboard  
*(Currently: all keyboard sections use concept-visual SVGs of the piano keys. A photo of real hands on real keys adds physical authenticity.)*

---

#### IMAGE 10 — Correct single-hand keyboard position  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y7-keyboard/2"`  
**Target file:** `assets/keyboard/hand-position-rh.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of a pianist's right hand in correct playing position on 
piano keys — thumb resting lightly on Middle C, fingers curved naturally over the adjacent 
white keys, wrist level and relaxed (not dropped or raised). Clean light background, even 
studio lighting, no shadows obscuring the key position. Landscape 16:9. No face visible. 
No jewellery. Keys should be clearly an acoustic upright or grand piano. No text, 
no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/keyboard/hand-position-rh.jpg",
  alt: "A pianist's right hand in correct playing position — thumb on Middle C, fingers curved naturally over the adjacent white keys, wrist level.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 11 — Both hands on keys  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y8-keyboard/0"`  
**Target file:** `assets/keyboard/both-hands.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of both a pianist's hands on piano keys simultaneously. 
Right hand in treble position (upper keys), left hand in bass position (lower keys), 
both with correct curved-finger technique. Clean even studio lighting from above and 
slightly in front, no harsh shadows. Grand piano keys, slightly warm tone. Landscape 16:9. 
No face visible — frame from wrists down. No jewellery. No text, no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/keyboard/both-hands.jpg",
  alt: "Both hands on a piano — right hand in treble position, left hand in bass position, both with correct curved-finger technique.",
  license: "Generated — Nano Banana 2.0",
},
```

---

### DRUMS — y7-drums  
*(Currently: section 0 has the SVG drum kit diagram; section 3 has the safe-drumming SVG. Photos below complement without replacing.)*

---

#### IMAGE 12 — Real 5-piece drum kit  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y7-drums/0"` *(replace the existing SVG, or add to section index 4)*  
**Target file:** `assets/drums/kit-5piece-photo.jpg`

> The existing `"y7-drums/0"` entry uses `src: "assets/drum-kit-5piece.svg"`. If you want to keep the SVG as-is, add this photo to a new `"y7-drums/4"` entry instead.

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of a professional 5-piece drum kit viewed from slightly behind the 
drummer's position. Clearly visible: kick drum, snare, hi-tom, mid-tom, floor tom, 
hi-hat, ride cymbal and crash cymbal. Chrome hardware, clean drumheads, no clutter 
around the kit. Warm rehearsal-studio lighting, slightly bokeh background suggesting 
a practice room. Landscape 16:9. No person seated. No text, no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/drums/kit-5piece-photo.jpg",
  alt: "A professional 5-piece drum kit — kick, snare, hi-tom, mid-tom and floor tom, plus hi-hat, ride and crash cymbals — photographed from the drummer's perspective.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 13 — Matched grip on snare drum  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y7-drums/3"`  
**Target file:** `assets/drums/matched-grip.jpg`

> This replaces the existing `"y7-drums/3"` SVG (the safe-drumming illustration). Only do this if you prefer the photo over the SVG; otherwise add as `"y7-drums/4"`.

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Close-up editorial photograph of both hands holding drumsticks in matched grip above a 
snare drum. Both sticks held identically — balanced at the fulcrum point between thumb 
and index finger, other fingers loosely supporting. Sticks approximately 5 cm above the 
drumhead, about to play. Clean white snare head, warm studio lighting, shallow depth of 
field. Landscape 16:9. No face visible — frame from mid-forearm down. No text, 
no watermarks.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/drums/matched-grip.jpg",
  alt: "Both hands holding drumsticks in correct matched grip above a snare drum — sticks balanced at the fulcrum point, fingers relaxed.",
  license: "Generated — Nano Banana 2.0",
},
```

---

### SINGING — y7-singing  
*(Currently: section 0 uses a concept-visual SVG; section 1 uses the vocal-warmups SVG. A posture photo adds physical reference.)*

---

#### IMAGE 14 — Upright singing posture / ribcage expansion  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y7-singing/1"`  
**Target file:** `assets/singing/posture-breath.jpg`

> This would sit alongside or replace the vocal-warmups SVG at `"y7-singing/1"`. Recommend keeping the SVG and moving this photo to `"y7-singing/4"` (a new section entry) so both resources are available.

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of a singer demonstrating correct upright posture for singing. 
Subject is standing, feet shoulder-width apart, shoulders relaxed and back (not hunched), 
chin level (not lifted or dropped), hands resting loosely at sides. Neutral light 
background, clean studio lighting from the front. Subject gender-neutral presentation, 
age range 14–18 (student-appropriate). Full-body shot from knees up. Landscape 16:9. 
No text, no watermarks, no sheet music visible.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/singing/posture-breath.jpg",
  alt: "A student singer demonstrating correct upright posture — shoulders relaxed and back, chin level, hands at sides, ready to sing.",
  license: "Generated — Nano Banana 2.0",
},
```

---

### LISTENING IN CONTEXT — y7-listening  
*(Currently: all three sections use concept-visual SVGs. An environment photo grounds the "where music happens" framing.)*

---

#### IMAGE 15 — Concert hall interior  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y7-listening/2"`  
**Target file:** `assets/context/concert-hall.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Wide-angle editorial photograph of a grand concert hall interior, empty of audience. 
Multi-tiered balconies, ornate ceiling with chandelier or acoustic panels, warm amber 
and gold tones, raked seating stretching back from a wide stage. Stage lit with warm 
performance lighting. Architectural detail visible. Landscape 16:9. No people on stage. 
No text, no watermarks. No brand logos visible.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/context/concert-hall.jpg",
  alt: "The interior of a grand concert hall — tiered balconies, ornate ceiling and a warmly lit stage, empty and ready for a performance.",
  license: "Generated — Nano Banana 2.0",
},
```

---

### COMPOSITION & PRODUCTION — y8-composition  
*(Currently: all three sections use concept-visual SVGs. A studio photo connects composition to modern production.)*

---

#### IMAGE 16 — Music production studio / DAW workstation  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y8-composition/1"`  
**Target file:** `assets/context/daw-studio.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of a modern music production workstation. Multiple monitors showing 
a DAW timeline with colourful audio and MIDI regions (no recognisable brand UI — keep 
generic), a MIDI keyboard controller on the desk, studio monitor speakers either side, 
acoustic foam panels on the walls behind. Warm desk lamp and monitor glow, moody studio 
atmosphere. No person visible. Landscape 16:9. No text on screens legible enough to read, 
no watermarks, no brand logos.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/context/daw-studio.jpg",
  alt: "A music production workstation — dual monitors showing a DAW timeline, MIDI keyboard, studio monitors and acoustic foam walls.",
  license: "Generated — Nano Banana 2.0",
},
```

---

### FILM MUSIC — y8-film  
*(Currently: all three sections use concept-visual SVGs. A film-scoring session image powerfully contextualises the diegetic/non-diegetic and leitmotif concepts.)*

---

#### IMAGE 17 — Film-scoring session (orchestra + screen)  
**Priority:** MUST-HAVE  
**SECTION_EXTRAS key:** `"y8-film/2"`  
**Target file:** `assets/context/film-scoring.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of a film scoring session in a large studio. An orchestra is visible 
in the background, musicians seated with stands. In the foreground, a large projection 
screen above the stage shows a blurred, unidentifiable film scene. A conductor's podium 
in the mid-ground. Warm tungsten lighting mix, slight haze. Landscape 16:9. No 
identifiable film footage on the screen. No text, no watermarks, no brand logos.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/context/film-scoring.jpg",
  alt: "A film scoring session — an orchestra on a studio stage beneath a large projection screen, conductor's podium in the foreground.",
  license: "Generated — Nano Banana 2.0",
},
```

---

#### IMAGE 18 — Band rehearsal space  
**Priority:** NICE-TO-HAVE  
**SECTION_EXTRAS key:** `"y7-listening/0"` *(or new `"y7-listening/3"`)*  
**Target file:** `assets/context/band-rehearsal.jpg`

**Nano Banana 2.0 prompt** — paste the whole block into Antigravity:
```
Use the Nano Banana 2.0 image model to generate a photorealistic photograph — do NOT draw it with Python / matplotlib / PIL.

Editorial photograph of a band rehearsal room, instruments set up but no people present. 
Drum kit on a riser at the back, guitar amplifiers to the sides, a keyboard on a stand, 
microphone on a stand at the front. Small intimate room with acoustic foam tiles, warm 
tungsten practise-room lighting. Cables neatly managed. Landscape 16:9. No text, 
no watermarks, no brand logos on equipment.
```

**Ready-to-paste snippet:**
```js
image: {
  src: "assets/context/band-rehearsal.jpg",
  alt: "A band rehearsal room — drum kit, guitar amplifiers, keyboard and microphone set up and ready, room empty.",
  license: "Generated — Nano Banana 2.0",
},
```

---

## Summary Table

| # | Priority | Topic | SECTION_EXTRAS key | Target file |
|---|----------|--------|--------------------|-------------|
| 01 | MUST-HAVE | y8-orchestra | `y8-orchestra/0` | `assets/instruments/strings-section.jpg` |
| 02 | MUST-HAVE | y8-orchestra | `y8-orchestra/1` | `assets/instruments/woodwind-section.jpg` |
| 03 | MUST-HAVE | y8-orchestra | `y8-orchestra/2` | `assets/instruments/brass-section.jpg` |
| 04 | MUST-HAVE | y8-orchestra | `y8-orchestra/0` or `y8-orchestra/3` | `assets/instruments/violin-hero.jpg` |
| 05 | NICE-TO-HAVE | y8-orchestra | `y8-orchestra/3` or `y8-orchestra/4` | `assets/instruments/trumpet-hero.jpg` |
| 06 | NICE-TO-HAVE | y8-orchestra | `y8-orchestra/4` or `y8-orchestra/5` | `assets/instruments/flute-hero.jpg` |
| 07 | MUST-HAVE | y7-guitar | `y7-guitar/2` or `y7-guitar/4` | `assets/guitar/open-chord-hand.jpg` |
| 08 | MUST-HAVE | y7-guitar | `y7-guitar/3` | `assets/guitar/strumming-hand.jpg` |
| 09 | NICE-TO-HAVE | y8-guitar | `y8-guitar/0` | `assets/guitar/barre-chord.jpg` |
| 10 | MUST-HAVE | y7-keyboard | `y7-keyboard/2` | `assets/keyboard/hand-position-rh.jpg` |
| 11 | MUST-HAVE | y8-keyboard | `y8-keyboard/0` | `assets/keyboard/both-hands.jpg` |
| 12 | MUST-HAVE | y7-drums | `y7-drums/0` or `y7-drums/4` | `assets/drums/kit-5piece-photo.jpg` |
| 13 | MUST-HAVE | y7-drums | `y7-drums/3` or `y7-drums/4` | `assets/drums/matched-grip.jpg` |
| 14 | MUST-HAVE | y7-singing | `y7-singing/1` or `y7-singing/4` | `assets/singing/posture-breath.jpg` |
| 15 | MUST-HAVE | y7-listening | `y7-listening/2` | `assets/context/concert-hall.jpg` |
| 16 | MUST-HAVE | y8-composition | `y8-composition/1` | `assets/context/daw-studio.jpg` |
| 17 | MUST-HAVE | y8-film | `y8-film/2` | `assets/context/film-scoring.jpg` |
| 18 | NICE-TO-HAVE | y7-listening | `y7-listening/0` or `y7-listening/3` | `assets/context/band-rehearsal.jpg` |

**MUST-HAVE total: 13 images** | **NICE-TO-HAVE total: 5 images**

---

## Notes on Existing SVGs — Do Not Replace These

The following SVG assets are accurate music-theory illustrations and must not be substituted with AI-generated photos:

| File | Used in |
|------|---------|
| `assets/drum-kit-5piece.svg` | `y7-drums/0` |
| `assets/note-values-mnemonics.svg` | `y7-drums/1` |
| `assets/graphic-notation.svg` | `y7-intro/2` |
| `assets/safe-drumming.svg` | `y7-drums/3` |
| `assets/vocal-warmups.svg` | `y7-singing/1` |
| All `kind: "concept"` entries | Multiple sections |

These are generated by the site's own concept-visual renderer and are correct by construction. Leave them as-is.
