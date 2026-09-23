/* Entry point. Small modules, each loaded and started on its own so one that
   fails cannot take the others with it. They are imported with this file's
   own ?v= so a new build never mixes with a cached module from the last one.
   No third-party scripts: the motion runs on CSS, IntersectionObserver and
   the Web Animations API. */

const v = new URL(import.meta.url).search;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const modules = [
  ["nav", "initNav"],
  ["hero", "initHero"],
  ["filters", "initFilters"],
  ["preview", "initPreview"],
  ["measured", "initMeasured"],
  ["motion", "initMotion"],
];

for (const [file, fn] of modules) {
  import(`./${file}.js${v}`)
    .then((m) => m[fn]({ reduce }))
    .catch(() => {
      /* the page works without this module */
    });
}
