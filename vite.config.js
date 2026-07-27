import { cpSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, transformWithEsbuild } from "vite";

/*
 * The application predates ES modules: its JSX files deliberately share one
 * browser-global scope and expose components on `window`.  This virtual entry
 * preserves that loading order while Vite compiles the complete app once with
 * production React and minifies it for deployment.
 */
const sourceFiles = [
  "tweaks-panel.jsx",
  "lib/audio.jsx",
  "lib/ui.jsx",
  "lib/store.jsx",
  "lib/curriculum.jsx",
  "lib/quiz-data.jsx",
  "lib/sections-data.jsx",
  "lib/companion-data.jsx",
  "lib/concept-visuals.jsx",
  "interactives/clef-trainer.jsx",
  "interactives/rhythm-game.jsx",
  "interactives/drum-pads.jsx",
  "interactives/piano.jsx",
  "interactives/instrument-studios.jsx",
  "interactives/elements-explorer.jsx",
  "interactives/section-bits.jsx",
  "interactives/listening-bits.jsx",
  "interactives/piano-bits.jsx",
  "interactives/improv-bits.jsx",
  "interactives/guided-listening.jsx",
  "components/header.jsx",
  "components/year-map.jsx",
  "components/quiz.jsx",
  "components/test-runner.jsx",
  "components/progress-dashboard.jsx",
  "components/topic-page.jsx",
  "components/section-page.jsx",
  "components/companion-home.jsx",
  "lib/dev-checks.jsx",
  "app.jsx"
];

const virtualEntry = "/virtual:stage4-app";
const resolvedVirtualEntry = `\0${virtualEntry}.jsx`;

function legacyGlobalApp() {
  let config;

  return {
    name: "stage4-legacy-global-app",
    enforce: "pre",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    resolveId(id) {
      return id === virtualEntry ? resolvedVirtualEntry : null;
    },
    load(id) {
      if (id !== resolvedVirtualEntry) return null;

      const appSource = sourceFiles.map((file) => {
        const absoluteFile = resolve(config.root, file);
        this.addWatchFile(absoluteFile);
        return `\n/* ${file} */\n${readFileSync(absoluteFile, "utf8")}`;
      }).join("\n");

      return `import React from "react";
import { createRoot } from "react-dom/client";

window.React = React;
window.ReactDOM = { createRoot };
${appSource}`;
    },
    async transform(code, id) {
      if (id !== resolvedVirtualEntry) return null;
      return transformWithEsbuild(code, id, {
        loader: "jsx",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment",
        target: "es2020"
      });
    },
    closeBundle() {
      // JSX data uses string paths such as "assets/guitar/open-chord-hand.jpg".
      // Keep the static folder structure in dist so those existing URLs remain
      // valid without rewriting application content.
      const sourceAssets = resolve(config.root, "assets");
      const outputAssets = resolve(config.build.outDir, "assets");
      if (existsSync(sourceAssets)) cpSync(sourceAssets, outputAssets, { recursive: true });
    }
  };
}

export default defineConfig({
  // GitHub Pages publishes this repository under /WHS-Stage4-Music/.
  base: "/WHS-Stage4-Music/",
  plugins: [legacyGlobalApp()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2020"
  }
});
