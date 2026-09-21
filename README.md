# Portfolio

My personal site. Static HTML, CSS and a little JavaScript, hosted on GitHub Pages.

**Live:** https://imsemoo.github.io/eslam-portfolio/

## The idea

Proof over promises. Every section carries something that can be checked
rather than claimed: the index lists every live site with my actual role on
it, the case studies state results only as far as they can be proven, the
PageSpeed section reads the JSON that a weekly GitHub Action commits to my
profile, and the footer prints the page's own weight.

## Layout of the repository

```
index.html          generated, do not edit by hand
404.html            GitHub Pages fallback, points back at the index
css/
  tokens.css        every colour, size, space and easing on the page
  base.css          reset, document, type defaults, the paper sheet
  components.css    buttons, chips, tags, the screenshot frame, quotes, tables
  sections.css      one block per section, each with its own mobile collapse
  motion.css        the little CSS the motion system needs
  fonts.css         four self-hosted latin subsets: Bricolage Grotesque 600, Geist 400 and 600, Geist Mono 400
  site.css          generated bundle of the above; build.py inlines it into index.html
js/
  main.js           entry; every module is guarded so the page works without it
  motion.js         GSAP + ScrollTrigger + Lenis: line reveals, fade-ups, parallax, magnetic buttons
  filters.js        the index filter, with deep links like #index-english
  preview.js        pointer-following preview over the index, fine pointers only
  measured.js       live PageSpeed numbers from raw.githubusercontent.com
  nav.js            mobile menu
img/work/           WebP screenshots at 1200, 800 and 600 wide, plus 240 wide thumbnails
_dev/
  projects.json     the thirty-odd projects, tiers, tags and case-study text
  template.html     the page with placeholders
  build.py          template + JSON  ->  index.html, css/site.css
  images.py         raw screenshots  ->  img/work
  icons/            the Phosphor SVGs that build.py inlines as a sprite
```

## Working on it

Edit `_dev/projects.json`, `_dev/template.html` or anything in `css/` and `js/`,
then:

```bash
python _dev/build.py
```

New screenshots go through `python _dev/images.py <raw-dir> <legacy-dir>`:
1440 wide, above the fold, cropped to 16:10.

## Rules the page keeps

- Nothing is hidden waiting for JavaScript. Reveals fade with opacity and a
  timeout fallback shows anything a frozen renderer left behind.
- `prefers-reduced-motion` turns the motion off, including smooth scroll.
- Checked for horizontal overflow at 375, 768, 1024, 1280 and 1920 px.
- No em dashes, no emoji, one accent colour, one label style used three times.
- Print gets the content without the nav, the desk or the pointer preview,
  and every external link prints its address.
- Lighthouse 12, mobile and desktop, behind a gzip server: 99 / 100 / 100 / 100.
