# Portfolio

My personal site: UI/UX design and the front-end behind it. Static HTML, CSS
and a little JavaScript, hosted on GitHub Pages.

**Live:** https://imsemoo.github.io/eslam-portfolio/ and, in Arabic,
https://imsemoo.github.io/eslam-portfolio/ar/

## The idea

Show the work, not a list of adjectives. The page opens with five case
studies told through the decision that shaped each product: three live
sites as they are today on a laptop and on a phone, one app design
(FreightZone) shown from its Figma file, and a 3D concept (Ward Twin)
that runs in the browser. Five shorter write-ups follow, then the index
of every project with my actual role on it. The PageSpeed section reads
the JSON that a weekly GitHub Action commits to my profile, and the page
states its own weight.

Anything that cannot be checked is left out. Where a case study still needs
something only I can supply (an outcome, an early sketch, a screen behind a
login), it sits under `todo` in `projects.json`: the build prints it and the
page never shows it.

## Layout of the repository

```
index.html          generated, do not edit by hand
ar/index.html       the same page in Arabic, right to left; generated too
404.html            GitHub Pages fallback, points back at the work, in both languages
css/
  tokens.css        every colour, size, space and easing on the page
  base.css          reset, document, type defaults, the rounded sheet on the ink ground
  components.css    buttons, chips, badges, screenshot and phone frames, quotes, tables, the at-a-glance list
  sections.css      one block per section, each with its own mobile collapse
  motion.css        the hero build on load, the hero sinking under the white sheet, scroll reveals, the reading-progress line
  fonts.css         self-hosted subsets: Bricolage Grotesque 600, Schibsted Grotesk and Fragment Mono (latin), Readex Pro (arabic)
  rtl.css           the Arabic page only: what cannot mirror by itself (transforms, origins), and Arabic type
  site.css          generated bundle of the above, rtl.css aside; build.py inlines it into index.html
js/
  main.js           entry; every module is guarded so the page works without it
  nav.js            mobile menu as a disclosure (focus in, Escape out, focus back) and the local time in Egypt
  hero.js           the hero stage: rebuilds for the case under the pointer in the rail, lights the grid, leans towards the pointer
  filters.js        the index: grouped filters, per-filter order, first 12 rows then "Show all", deep links
  preview.js        pointer preview riding the right edge of the index, fine pointers only
  measured.js       live PageSpeed numbers from raw.githubusercontent.com
  motion.js         the curtain (pinned hero, white sheet over it), the nav's tone and current section, scroll reveals, print prep
img/work/           WebP screenshots at 1200, 800 and 600 wide, plus 240 wide thumbnails
img/work/ev/        case-study evidence captured from the live sites: phones at 390 and 600, desktops at 800 and 1400
_dev/
  projects.json     projects, filters, featured cases, briefs, evidence and todo notes
  projects.ar.json  the Arabic copy of every string in projects.json that reaches the page
  ar.sources.json   generated: a fingerprint of the English each Arabic string was written from
  template.html     the page with placeholders
  template.ar.html  the Arabic page with the same placeholders and the same ids
  build.py          templates + JSON  ->  index.html, ar/index.html, css/site.css; prints what still needs me
  images.py         raw screenshots  ->  img/work;  --evidence raw captures  ->  img/work/ev
  snap.py           captures the evidence listed in projects.json from the live sites, or from a local build with --root
  og.html, og.py    the link-preview cards  ->  img/og.png, and img/og-ar.png from og.ar.html
  icons/            the Phosphor SVGs; build.py inlines only the ones the page uses
```

## Working on it

Edit `_dev/projects.json`, `_dev/template.html` or anything in `css/` and `js/`,
then:

```bash
python _dev/build.py
```

Evidence for the case studies comes from the live sites. `snap.py` opens each
page listed under a case's `evidence` in the installed Chrome, with a real
phone emulation (390 x 844, 2x, touch) or a 1440 desktop, and `images.py`
crops and sizes the captures:

```bash
pip install playwright
python _dev/snap.py <raw-dir>
python _dev/images.py --evidence <raw-dir>
python _dev/og.py
```

Evidence can also come from a local build instead of the live site (the
IWAD section hubs, shown with the theme's sample content). Such an item names
a `root` and a `local` file instead of a URL; point the root at a checkout of
that repository:

```bash
python _dev/snap.py <raw-dir> --root iwad=<path-to-theme> devlo
```

The sites are live newsrooms and dashboards, so every capture is a snapshot
of one day; the captions say what was on screen.

New project screenshots still go through `python _dev/images.py <raw-dir> <legacy-dir>`:
1440 wide, above the fold, cropped to 16:10.

## The Arabic page

`ar/` is the same page, written in Arabic rather than machine-translated, and
built from the same data: `projects.ar.json` holds the Arabic for every string
of `projects.json` that reaches the page, and `template.ar.html` the Arabic of
the template, with the same ids, so an anchor such as `#case-devlo` means the
same thing on both pages. The link to the other language keeps the reader's
place: it points at the section, case or row at the top of the screen.

The build keeps the two in step:

- A string with no Arabic yet is shown in English and listed after the build.
- A change to the English (a project's copy, a block of the template) is
  listed too, string by string. The Arabic pairs a case's stories, results
  and links by position, so a story added in the middle moves every one after
  it: the list names each of them. Once the Arabic is brought up to date, and
  only then, record it:

  ```bash
  python _dev/build.py --stamp
  ```

What the Arabic page does differently, in `rtl.css` and in the build:

- It reads right to left: the layout mirrors through logical properties, the
  arrows point left, and the preview rides the left edge of the index.
- Arabic is never letter-spaced, on either page (`:lang(ar)` in base.css).
- Every Latin run in the Arabic text (Laravel, `<ward-twin>`, A*, 360 × 800)
  is wrapped in a `<bdi>`, so it keeps its order whatever punctuation sits at
  its edges, and a number keeps its unit on the same line.
- Counts agree with their noun (46 مشروعًا, 9 مشاريع) in the build and in the
  scripts, which read the page's language from `<html lang>`.
- The case films are the English ones.

## Rules the page keeps

- Nothing is hidden waiting for JavaScript. The hero's first build is CSS and
  starts with the first paint. JS hides only what is still below the fold,
  without a transition, and a timer, focus and print show anything left behind.
- No third-party scripts. Motion is CSS, scroll timelines where the browser has
  them, IntersectionObserver and the Web Animations API;
  `prefers-reduced-motion` turns it off.
- No eyebrows over headings, no stat strips, mono only for figures, code and
  addresses. No em dashes, no emoji, one accent colour, brighter on the ink.
- Buttons, chips, navigation and row links are at least 44 px tall; inline
  text links follow the text. The mobile menu moves focus in and out.
- Checked for horizontal overflow at 375 and 1280 px with headless Chrome.
- Print gets the content without the nav or the pointer preview: the hero in
  dark type on white, every row of the index, the notes opened, and the
  address of every external link.
