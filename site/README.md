# The portfolio, rebuilt with Astro

Direction C, "Section": every project is cut open into three layers, what was
designed, what was built and what was measured. Approved on 2 November 2026,
together with the Alif cut mark, the Interface fonts (Schibsted Grotesk,
Vazirmatn, Fragment Mono) and a multi-page site in English and Arabic.

Static pages, no client framework. One small script (`src/scripts/site.js`)
runs the cut, the platform demo, the theme switch and the live PageSpeed
numbers; every page reads fine without it.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321/eslam-portfolio/
npm run build     # writes dist/
npm run preview   # serves dist/ at the same address
```

Node 22 or newer.

## Where things are

```
src/
  pages/              index, ar/index, work/[slug], ar/work/[slug]
  layouts/Base.astro  head, hreflang, the bar, the footer
  components/         Home, Case, Mark
  data/
    projects.ts       reads ../_dev/projects.json and projects.ar.json: the
                      same case copy the current site and the proposal tooling use
    layers.ts         how each case page is ordered by the three layers
    cases.json        the five rows on the home page, with their readings
    psi.ts            the weekly PageSpeed numbers, read at build time
  i18n/ui.json        every string the templates write, in both languages
  styles/             tokens.css (all colours, sizes, spaces), site.css, fonts.css
  scripts/site.js
public/
  fonts/              self-hosted subsets
  img/work/ev/        evidence images, copied from ../img/work/ev as pages need them
```

## Rules carried over

- Nothing invented: a layer that is someone else's work, or was never measured, says so.
- Arabic is written, not translated, never letter-spaced, and mirrors through logical properties.
- No third-party scripts. Motion is CSS and the View Transitions API, and reduced motion turns it off.
- Every screen checked at 390 and 1440 px before it is called done.

## Going live (not done yet)

1. Map the remaining four cases in `src/data/layers.ts` and set `page` on them in `cases.json`.
2. Add `/work/`, `/lab/`, `/about/` and the redirects from the old `#case-…` anchors.
3. In the repository settings, switch Pages from "Deploy from a branch" to "GitHub Actions".
4. Run the "Astro site" workflow with deploy ticked.
