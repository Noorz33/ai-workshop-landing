# ChatGPT & Gemini workshop landing page

A spatial landing page for the Hoosh Sazeh × Donya-ye Mes workshop. Scrolling flies a camera across a dark 3D map. The copper route is an infinity sign (∞): ChatGPT is the left loop, Gemini the right loop, and they cross at the center. One trip goes around both loops and back to the center, lighting the ∞ as you go. The route shape and station spacing live in `src/stops.js`.

**Live:** https://ai-workshop-landing-one.vercel.app/ (Vercel) and https://noorz33.github.io/ai-workshop-landing/ (GitHub Pages). Every push to `main` redeploys the GitHub Pages copy automatically (`.github/workflows/deploy.yml`). Redeploy Vercel with `npx vercel deploy --prod`, or connect the repo under Settings → Git in the Vercel dashboard.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/ (deploy anywhere)
npm run preview   # serve dist/ on http://localhost:4173
```

## How it works

| Piece | Where |
|---|---|
| Stops (camera, lighting and node position for every station) | `src/stops.js` |
| 3D world: map shader, spotlights, beams, copper route, tokens, glints | `src/scene/` (lazy-loaded) |
| Scroll → camera rig, panels, artifact anchoring, snapping, adaptive DPR | `src/main.js` |
| Interactive artifacts for each syllabus node | `src/artifacts/` (`gpt.js`, `gem.js`, `common.js`) |
| Minimap, map markers, index dialog | `src/ui/nav.js` |
| All text content (also readable without JS, and used for SEO) | `index.html` |

- **Spatial mode** runs when the browser supports WebGL 2 and the user hasn't asked for reduced motion or data saving.
- **Flat mode** covers every other case, and it is also the no-JS fallback. In flat mode the page is a normal long document with the same content and interactive artifacts. Force it with `/?flat`.

## Things to know

- **Vendor logos.** OpenAI and Google both ask for permission before their logos appear in marketing. If you don't have approval, set `vendorLogos: false` in `src/config.js` to hide all vendor logos. Files: `public/brand/`.
  - OpenAI files come from cdn.openai.com/brand.
  - Gemini and Workspace icons come from gstatic.com.
- **Sample data.** All figures in the demos are sample data, and the page labels them that way. The dataset lives in `src/artifacts/data.js`.
- **Copy to review.** The session 2 bullet points expand the Gemini table in the syllabus and should be reviewed before launch. The hub intro lines and the outcome card captions were also written for this page.
- **`public/syllabus.pdf` and `public/og.jpg`** are generated from the page itself (`@media print` in `src/styles/print.css` and the hero). After copy changes, run `npm run build && npm run preview`, then `npm run assets` in a second terminal, then build again. Set `CHROME_PATH` if Chrome is not in /Applications.
