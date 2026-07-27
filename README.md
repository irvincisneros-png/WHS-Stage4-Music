# WHS Stage 4 Music

Interactive music practice for Woonona High School Stage 4 students.

## Development

Install dependencies once, then start the local development server:

```sh
npm install
npm run dev
```

Create the production site with:

```sh
npm run build
```

The publishable site is written to `dist/`. The Vite configuration uses the
GitHub Pages base path `/WHS-Stage4-Music/`; publish the contents of `dist/`
to that site, rather than the source repository root.

`npm run preview` serves the production build locally for a final check.

## GitHub Pages deployment

Merges to `main` run `.github/workflows/deploy-pages.yml`, which builds the
production bundle and deploys `dist/` through GitHub Pages. In the repository
Pages settings, the build source must be set to **GitHub Actions** rather than
the legacy `main / (root)` branch source.
