/* Entry point. Four small modules, each guarded so the page works without it:
   the index filter, the pointer preview, the live PageSpeed numbers, and the
   mobile menu. The motion libraries are fetched after the first paint, so
   they never sit between the reader and the content. */

import { initFilters } from "./filters.js";
import { initPreview } from "./preview.js";
import { initMeasured } from "./measured.js";
import { initNav } from "./nav.js";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initNav();
initFilters({ reduce });
initPreview({ reduce });
initMeasured();

const CDN = "https://cdn.jsdelivr.net/npm/";
const LIBS = [
  "gsap@3.13.0/dist/gsap.min.js",
  "gsap@3.13.0/dist/ScrollTrigger.min.js",
  "lenis@1.3.4/dist/lenis.min.js",
];

function load(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CDN + src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function startMotion() {
  Promise.all(LIBS.map(load))
    .then(() => import("./motion.js"))
    .then(({ initMotion }) => {
      if (window.gsap && window.ScrollTrigger) {
        initMotion({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger, Lenis: window.Lenis });
      }
    })
    .catch(() => {
      /* no motion, nothing lost */
    });
}

if (!reduce) {
  // Two frames in, the first paint has happened and the hero CSS animation is
  // running. A tab opened in the background gets no frames, so a timer makes
  // sure the libraries still arrive before the reader does.
  let started = false;
  const once = () => {
    if (started) return;
    started = true;
    startMotion();
  };
  requestAnimationFrame(() => requestAnimationFrame(once));
  setTimeout(once, 1500);
}
