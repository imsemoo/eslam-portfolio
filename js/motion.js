/* The scroll motion system. It starts after the first paint, so it only ever
   touches elements that are still below the fold; whatever is already on
   screen is left exactly as the CSS drew it.

   One language, four moves, in reading order:
   - a headline slides up out of a mask (the hero does this in CSS; every
     section heading further down does the same here),
   - a block fades and rises 20 px into place,
   - a group of siblings does that with a short stagger, so a list reads as
     a list,
   - a screenshot is uncovered with a wipe from the top and settles from a
     slight zoom, the one move reserved for the case visuals.
   Everything runs once, on transform, opacity and clip-path only. Nothing
   loops, nothing bounces. */

const EASE = "expo.out";
const D = { rise: 20, reveal: 0.8, mask: 1.0, wipe: 1.1, stagger: 0.07 };

export function initMotion({ gsap, ScrollTrigger, Lenis }) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE, duration: D.reveal });

  const fold = window.innerHeight;
  const belowFold = (el) => el.getBoundingClientRect().top > fold * 0.92;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const once = (trigger, start) => ({ trigger, start, once: true });

  // ---- smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync
  if (Lenis && finePointer) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Wrap an element's content in a mask so it can slide up into view.
  function mask(el) {
    const wrap = document.createElement("span");
    wrap.className = "line-mask";
    const line = document.createElement("span");
    line.className = "motion-line";
    while (el.firstChild) line.appendChild(el.firstChild);
    wrap.appendChild(line);
    el.appendChild(wrap);
    return line;
  }

  // ---- multi-line headlines (contact): each .line gets its own mask
  document.querySelectorAll("[data-motion-text='lines']").forEach((el) => {
    if (el.closest(".hero") || !belowFold(el)) return;
    const lines = [...el.querySelectorAll(".line")].map((line) => {
      const wrap = document.createElement("span");
      wrap.className = "line-mask";
      line.parentNode.insertBefore(wrap, line);
      wrap.appendChild(line);
      line.classList.add("motion-line");
      return line;
    });
    gsap.fromTo(lines, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: D.mask, stagger: 0.09, scrollTrigger: once(el, "top 88%") });
  });

  // ---- section heads: label, then the heading out of its mask, then the lede
  document.querySelectorAll(".section-head").forEach((head) => {
    if (!belowFold(head)) return;
    const label = head.querySelector(".label");
    const h2 = head.querySelector("h2");
    const lede = head.querySelector(".lede");
    const tl = gsap.timeline({ scrollTrigger: once(head, "top 85%") });
    if (label) tl.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0);
    if (h2) tl.fromTo(mask(h2), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: D.mask }, 0);
    if (lede) tl.fromTo(lede, { y: D.rise, opacity: 0 }, { y: 0, opacity: 1, duration: D.reveal }, 0.18);
  });

  // ---- other headings below the fold (the measured copy) slide out of a mask too
  document.querySelectorAll("main h2").forEach((h2) => {
    if (h2.closest(".hero, .section-head") || h2.hasAttribute("data-motion-text") || !belowFold(h2)) return;
    gsap.fromTo(mask(h2), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: D.mask, scrollTrigger: once(h2, "top 88%") });
  });

  // ---- single reveals
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    if (!belowFold(el)) return;
    gsap.fromTo(el, { y: D.rise, opacity: 0 }, { y: 0, opacity: 1, scrollTrigger: once(el, "top 88%") });
  });

  // ---- grouped reveals, staggered within the group
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    if (!belowFold(group)) return;
    const items = group.querySelectorAll("[data-reveal-item]");
    if (!items.length) return;
    gsap.fromTo(items, { y: D.rise, opacity: 0 }, { y: 0, opacity: 1, stagger: D.stagger, scrollTrigger: once(group, "top 85%") });
  });

  // ---- the index: rows arrive in small batches as the reader scrolls. Quick
  // and shallow, because this is a list to be read, not a show. Rows that a
  // filter already brought in are left alone.
  const rows = [...document.querySelectorAll("[data-rows] .row")].filter(belowFold);
  if (rows.length) {
    rows.forEach((row) => row.setAttribute("data-batch", ""));
    gsap.set(rows, { y: 10, opacity: 0 });
    ScrollTrigger.batch(rows, {
      start: "top 94%",
      once: true,
      onEnter: (batch) => {
        const fresh = batch.filter((row) => !row.dataset.revealed);
        batch.forEach((row) => (row.dataset.revealed = "1"));
        if (fresh.length) gsap.to(fresh, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, overwrite: true, clearProps: "transform" });
      },
    });
  }

  // ---- case studies: the head rises, the screenshot is uncovered from the
  // top while it settles from a slight zoom, then the text blocks follow
  document.querySelectorAll(".case").forEach((article) => {
    const head = article.querySelector(".case__head");
    const shot = article.querySelector(".case__visual .shot");
    const img = shot && shot.querySelector(".shot__img");
    const blocks = article.querySelectorAll(".case__block, .case__cta");
    if (head && belowFold(head)) {
      gsap.fromTo(head, { y: D.rise, opacity: 0 }, { y: 0, opacity: 1, scrollTrigger: once(head, "top 85%") });
    }
    if (shot && belowFold(shot)) {
      const tl = gsap.timeline({ scrollTrigger: once(shot, "top 85%") });
      tl.fromTo(shot, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: D.wipe }, 0);
      if (img) tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: D.wipe + 0.4, clearProps: "transform" }, 0);
    }
    const body = article.querySelector(".case__body");
    if (body && blocks.length && belowFold(body)) {
      gsap.fromTo(blocks, { y: D.rise, opacity: 0 }, { y: 0, opacity: 1, stagger: D.stagger, scrollTrigger: once(body, "top 85%") });
    }
  });

  // ---- hero: the three layered screens drift at different depths while
  // scrolling, and on a fine pointer they lean away from the cursor, deeper
  // layers less, so the stack reads as a real pile rather than a flat image.
  const stack = document.querySelector("[data-hero-stack]");
  if (stack) {
    const layers = [...stack.querySelectorAll("[data-depth]")];
    layers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth || "0.2");
      gsap.to(layer, {
        yPercent: depth * -60,
        ease: "none",
        scrollTrigger: { trigger: stack, start: "top 20%", end: "bottom top", scrub: 1 },
      });
    });
    if (finePointer) {
      const movers = layers.map((layer) => ({
        depth: parseFloat(layer.dataset.depth || "0.2"),
        x: gsap.quickTo(layer, "x", { duration: 0.9, ease: EASE }),
        rot: gsap.quickTo(layer, "rotation", { duration: 0.9, ease: EASE }),
      }));
      const hero = stack.closest(".hero") || stack;
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1 .. 1
        movers.forEach((m) => {
          m.x(nx * -26 * (1 - m.depth));
          m.rot(nx * -1.2 * (1 - m.depth));
        });
      });
      hero.addEventListener("pointerleave", () => movers.forEach((m) => { m.x(0); m.rot(0); }));
    }
  }

  // ---- case visuals: a slow drift so the sticky image feels attached to the text
  document.querySelectorAll("[data-parallax-section] .shot__img").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -4 },
      { yPercent: 4, ease: "none", scrollTrigger: { trigger: img.closest(".case"), start: "top bottom", end: "bottom top", scrub: 1.2 } }
    );
  });

  // ---- magnetic buttons (fine pointers only)
  if (finePointer) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      const toX = gsap.quickTo(btn, "x", { duration: 0.45, ease: EASE });
      const toY = gsap.quickTo(btn, "y", { duration: 0.45, ease: EASE });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        toX((e.clientX - (r.left + r.width / 2)) * 0.22);
        toY((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      btn.addEventListener("pointerleave", () => {
        toX(0);
        toY(0);
      });
    });
  }

  // ---- nav: compact after the hero, current section underlined
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    ScrollTrigger.create({
      start: 80,
      onUpdate: (self) => nav.classList.toggle("is-compact", self.scroll() > 80),
    });
    nav.querySelectorAll(".nav__links a").forEach((a) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: (self) => a.toggleAttribute("aria-current", self.isActive),
      });
    });
  }

  // ---- safety net: a renderer that stops producing frames (background tab,
  // print preview, some embeds) can leave a trigger unfired. On return, and
  // once after a pause, anything faded that is now on screen is shown.
  const showVisible = () => {
    const faded = [...document.querySelectorAll("[data-reveal], [data-reveal-item], [data-batch], .motion-line, .case__head, .case__block, .case__cta, .section-head .lede, .section-head .label")].filter((el) => {
      const r = el.getBoundingClientRect();
      return parseFloat(getComputedStyle(el).opacity) < 1 && r.top < window.innerHeight && r.bottom > 0;
    });
    if (faded.length) gsap.set(faded, { opacity: 1, y: 0, yPercent: 0 });
    document.querySelectorAll(".case__visual .shot").forEach((shot) => {
      const r = shot.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && shot.style.clipPath && shot.style.clipPath !== "inset(0px 0px 0% 0px)") {
        gsap.set(shot, { clipPath: "inset(0 0 0% 0)" });
      }
    });
  };
  window.addEventListener("pageshow", () => ScrollTrigger.refresh());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      ScrollTrigger.refresh();
      showVisible();
    }
  });
  setTimeout(showVisible, 2500);
}
