/* The scroll motion system. It starts after the first paint, so it only ever
   touches elements that are still below the fold; whatever is already on
   screen is left exactly as the CSS drew it. Each animation has one job:
   - masked line reveals read a headline in order,
   - fade-ups introduce a section as it arrives,
   - staggered items show that a group is a group,
   - the hero screens drift at different depths while scrolling,
   - magnetic buttons acknowledge the pointer before the click.
   Nothing loops, nothing bounces. */

const EASE = "power3.out";

export function initMotion({ gsap, ScrollTrigger, Lenis }) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE, duration: 0.9 });

  const fold = window.innerHeight;
  const belowFold = (el) => el.getBoundingClientRect().top > fold * 0.92;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---- smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync
  if (Lenis && finePointer) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---- headlines further down: each .line gets a mask and slides up into it
  document.querySelectorAll("[data-motion-text='lines']").forEach((el) => {
    if (el.closest(".hero") || !belowFold(el)) return;
    const lines = el.querySelectorAll(".line");
    lines.forEach((line) => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      line.parentNode.insertBefore(mask, line);
      mask.appendChild(line);
      line.classList.add("motion-line");
    });
    gsap.fromTo(
      lines,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.09, scrollTrigger: { trigger: el, start: "top 88%", once: true } }
    );
  });

  // ---- single reveals
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    if (!belowFold(el)) return;
    gsap.fromTo(
      el,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85, scrollTrigger: { trigger: el, start: "top 88%", once: true } }
    );
  });

  // ---- grouped reveals, staggered within the group
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    if (!belowFold(group)) return;
    const items = group.querySelectorAll("[data-reveal-item]");
    if (!items.length) return;
    gsap.fromTo(
      items,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, scrollTrigger: { trigger: group, start: "top 85%", once: true } }
    );
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
        x: gsap.quickTo(layer, "x", { duration: 0.9, ease: "power3.out" }),
        rot: gsap.quickTo(layer, "rotation", { duration: 0.9, ease: "power3.out" }),
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
      const toX = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3.out" });
      const toY = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3.out" });
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
    const faded = [...document.querySelectorAll("[data-reveal], [data-reveal-item], .motion-line")].filter((el) => {
      const r = el.getBoundingClientRect();
      return parseFloat(getComputedStyle(el).opacity) < 1 && r.top < window.innerHeight && r.bottom > 0;
    });
    if (faded.length) gsap.set(faded, { opacity: 1, y: 0, yPercent: 0 });
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
