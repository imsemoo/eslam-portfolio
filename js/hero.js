/* The hero stage. The work is shown the way a design tool shows a frame, then
   built in front of the reader: the blueprint is up first, a scan line wipes
   it away to leave the shipped screen, and the phone slides in beside it.
   That is the page's claim, "what you approve in the design is what ships",
   played once rather than said again. The first build is pure CSS and starts
   with the first paint, so it never waits on this file.

   Hovering or focusing a case in the rail below rebuilds the stage for that
   case, a little faster (fine pointers only; on touch the rail items are
   plain links). On a fine pointer the canvas also reacts: the grid lights up
   around the pointer and the stage leans a few degrees towards it.

   With reduced motion none of this runs: the stage is simply the finished
   screen, and the rail still links to each case. */

export function initHero({ reduce }) {
  const hero = document.querySelector("[data-hero]");
  const stage = hero && hero.querySelector("[data-stage]");
  if (!stage) return;
  const img = stage.querySelector("[data-stage-img]");
  const phone = stage.querySelector("[data-stage-phone]");
  const cap = stage.querySelector("[data-stage-cap]");
  const host = stage.querySelector("[data-stage-host]");
  const rig = stage.querySelector("[data-stage-rig]");
  const parts = [...stage.querySelectorAll(".stage__blueprint, .stage__scan, .stage__select, .stage__phone, .stage__cap")];
  const rails = [...document.querySelectorAll("[data-rail]")];
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // restart the CSS build: drop the animations for one frame, then hand them back
  const build = () => {
    if (reduce) return;
    stage.classList.add("is-quick");
    parts.forEach((el) => (el.style.animation = "none"));
    void stage.offsetWidth;
    parts.forEach((el) => (el.style.animation = ""));
  };

  let current = rails[0] || null;
  const warm = new Map();
  function preload(a) {
    if (!warm.has(a)) {
      const i = new Image();
      i.sizes = img.sizes;
      i.srcset = a.dataset.srcset;
      i.src = a.dataset.src;
      const p = new Image();
      p.sizes = phone.sizes;
      p.srcset = a.dataset.phoneSet;
      p.src = a.dataset.phone;
      warm.set(a, Promise.all([i, p].map((x) => (x.decode ? x.decode() : Promise.resolve()).catch(() => {}))));
    }
    return warm.get(a);
  }

  function show(a) {
    if (a === current) return;
    current = a;
    rails.forEach((r) => (r === a ? r.setAttribute("aria-current", "true") : r.removeAttribute("aria-current")));
    preload(a).then(() => {
      if (current !== a) return;
      img.srcset = a.dataset.srcset;
      img.src = a.dataset.src;
      img.alt = a.dataset.alt;
      phone.srcset = a.dataset.phoneSet;
      phone.src = a.dataset.phone;
      phone.alt = a.dataset.phoneAlt;
      cap.textContent = a.dataset.cap;
      host.textContent = a.dataset.host;
      build();
    });
  }

  if (fine) {
    rails.forEach((a) => {
      a.addEventListener("pointerenter", () => show(a));
      a.addEventListener("focus", () => show(a));
    });
  }

  if (fine && !reduce) {
    let frame = 0;
    let last = null;
    const apply = () => {
      frame = 0;
      if (!last) return;
      const r = hero.getBoundingClientRect();
      const x = (last.clientX - r.left) / r.width;
      const y = (last.clientY - r.top) / r.height;
      hero.style.setProperty("--mx", `${last.clientX - r.left}px`);
      hero.style.setProperty("--my", `${last.clientY - r.top}px`);
      rig.style.setProperty("--tilt-y", `${((x - 0.5) * 7).toFixed(2)}deg`);
      rig.style.setProperty("--tilt-x", `${((0.5 - y) * 5).toFixed(2)}deg`);
    };
    hero.addEventListener("pointermove", (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    });
    hero.addEventListener("pointerenter", () => hero.classList.add("is-lit"));
    hero.addEventListener("pointerleave", () => {
      hero.classList.remove("is-lit");
      rig.style.setProperty("--tilt-x", "0deg");
      rig.style.setProperty("--tilt-y", "0deg");
    });
  }
}
