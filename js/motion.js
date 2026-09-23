/* Scroll behaviour, with no libraries.

   - The curtain: the hero stays pinned while the white sheet slides up over
     it. Its sticky offset is set here so a hero taller than the screen is
     read to the end before it pins.
   - The nav follows the ground under it: ink over the hero, white over the
     sheet, and it underlines the section being read (aria-current).
   - Reveals: section headings slide up out of a mask, blocks rise in with a
     short stagger inside their group, the decision line arrives word by word,
     and case evidence is uncovered from the top.

   Only elements still below the fold when this runs are hidden, and they are
   hidden without a transition, so nothing on screen ever flickers. A timer, a
   focus listener and beforeprint show anything a frozen renderer or a
   keyboard jump would otherwise miss. Under prefers-reduced-motion the
   reveals are skipped entirely; the curtain and the nav still run. */

export function initMotion({ reduce }) {
  curtain();
  nav();
  print();
  if (reduce || !("IntersectionObserver" in window)) return;
  reveals();
  magnet();
}

function curtain() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const set = () => hero.style.setProperty("--hero-top", `${Math.min(0, window.innerHeight - hero.offsetHeight)}px`);
  set();
  document.documentElement.setAttribute("data-curtain", "");
  window.addEventListener("resize", set);
  if ("ResizeObserver" in window) new ResizeObserver(set).observe(hero);
}

function nav() {
  const bar = document.querySelector("[data-nav]");
  if (!bar) return;
  const lead = document.querySelector(".curtain--lead");

  let ticking = false;
  const update = () => {
    ticking = false;
    const tone = lead && lead.getBoundingClientRect().top > bar.offsetHeight ? "ink" : "paper";
    if (bar.dataset.tone !== tone) bar.dataset.tone = tone;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();

  if (!("IntersectionObserver" in window)) return;
  const links = [...bar.querySelectorAll(".nav__links a[href^='#']")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const visible = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => visible.set(e.target, e.isIntersecting));
    const current = sections.find((s) => visible.get(s));
    links.forEach((a) => {
      if (current && a.getAttribute("href") === `#${current.id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }, { rootMargin: "-45% 0px -54% 0px" });
  sections.forEach((s) => io.observe(s));
}

// closed notes would print as nothing: open them for the printout, then
// put them back the way the reader left them
function print() {
  let opened = [];
  window.addEventListener("beforeprint", () => {
    opened = [...document.querySelectorAll("details:not([open])")];
    opened.forEach((d) => (d.open = true));
  });
  window.addEventListener("afterprint", () => {
    opened.forEach((d) => (d.open = false));
    opened = [];
  });
}

function reveals() {
  const fold = window.innerHeight * 0.9;
  const below = (el) => el.getBoundingClientRect().top > fold;
  const armed = [];

  const arm = (el, cls, i = 0) => {
    if (!below(el)) return;
    el.classList.add(cls, `${cls}-off`);
    el.style.setProperty("--rv-i", String(i));
    armed.push([el, `${cls}-off`]);
  };

  // headings slide up out of a mask
  document.querySelectorAll("main h2, .feature__title, .briefs__head h3").forEach((h) => {
    if (!below(h)) return;
    const inner = document.createElement("span");
    inner.className = "mask__in";
    while (h.firstChild) inner.appendChild(h.firstChild);
    const mask = document.createElement("span");
    mask.className = "mask";
    mask.appendChild(inner);
    h.appendChild(mask);
    arm(h, "rh");
  });

  // blocks rise in, staggered inside their group
  const groups = [
    ".section-head .lede", ".feature__lede", ".contact .lede", ".contact__actions", ".links",
    ".glance > div", ".story__block", ".outcome > div", ".feature__links",
    ".system h4", ".sw", ".system__note",
    ".briefs__head p", ".brief", ".step", ".score", ".footprint", ".score__legend",
    ".measured__copy > :not(h2)", ".about__intro .lede", ".facts > div", ".timeline h3", ".tl",
    ".skills h3", ".skill-group", ".tokens__head", ".swatch, .type-sample, .space-sample",
    ".quote", ".index__bar", ".row", ".index__more",
  ];
  groups.forEach((sel) => {
    const byParent = new Map();
    document.querySelectorAll(sel).forEach((el) => {
      const list = byParent.get(el.parentElement) || [];
      list.push(el);
      byParent.set(el.parentElement, list);
    });
    byParent.forEach((list) => list.forEach((el, i) => arm(el, "rv", Math.min(i, 6))));
  });

  // the decision line arrives word by word
  document.querySelectorAll(".decision").forEach((p) => {
    if (!below(p)) return;
    let w = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
            const s = document.createElement("span");
            s.className = "word";
            s.style.setProperty("--w", String(w++));
            s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(p);
    arm(p, "rw");
  });

  // case evidence is uncovered from the top
  document.querySelectorAll("[data-reveal-ev]").forEach((el) => {
    const siblings = [...el.parentElement.querySelectorAll(":scope > [data-reveal-ev]")];
    arm(el, "uc", Math.min(siblings.indexOf(el), 3));
  });

  if (!armed.length) return;
  const off = new Map(armed);
  const show = (el) => {
    const cls = off.get(el);
    if (cls) el.classList.remove(cls);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      show(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  armed.forEach(([el]) => io.observe(el));

  const sweep = () => armed.forEach(([el]) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) show(el);
  });
  document.addEventListener("focusin", (e) => {
    armed.forEach(([el]) => { if (el.contains(e.target)) show(el); });
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) sweep(); });
  window.addEventListener("beforeprint", () => armed.forEach(([el]) => show(el)));
  setTimeout(sweep, 2500);
}

// the email buttons lean towards the pointer, a few pixels, fine pointers only
function magnet() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll("[data-magnetic]").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.18;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
      btn.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.translate = "";
    });
  });
}
