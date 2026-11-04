/* One module for the prototype pages. Every part is guarded: a page that lacks
   the element skips that part, and the page reads fine with no script at all. */

const AR = document.documentElement.lang === "ar";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- theme: system, light, dark ---------- */
(function theme() {
  const btn = $("[data-theme-btn]");
  if (!btn) return;
  const order = ["system", "light", "dark"];
  const names = AR ? { system: "حسب الجهاز", light: "فاتح", dark: "داكن" } : { system: "system", light: "light", dark: "dark" };
  let cur = "system";
  try { cur = localStorage.getItem("theme") || "system"; } catch {}
  const set = (t) => {
    cur = t;
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    btn.setAttribute("aria-label", (AR ? "المظهر: " : "Theme: ") + names[t]);
    btn.title = btn.getAttribute("aria-label");
    try { localStorage.setItem("theme", t); } catch {}
  };
  set(cur);
  btn.addEventListener("click", () => set(order[(order.indexOf(cur) + 1) % order.length]));
})();

/* ---------- the hero: a miniature of this page, cut open ---------- */
const MINI = [
  [4, 3.5, 16, 3.4, "ink"], [46, 4.2, 6, 2], [55, 4.2, 6, 2], [64, 4.2, 6, 2], [80, 2.5, 15, 5.5, "ink"],
  [6, 20, 48, 6.2, "ink"], [6, 28.5, 42, 6.2, "ink"], [6, 37, 30, 6.2, "ink"], [37.5, 37, 12, 6.2, "acc"],
  [6, 49, 44, 2.2], [6, 53, 38, 2.2], [6, 57, 26, 2.2],
  [6, 65, 15, 6.5, "ink"], [23, 65, 15, 6.5, "ghost"],
  [60, 18, 34, 55, "frame"],
  [6, 82, 3, 4, "acc"], [11, 83, 10, 2], [25, 82, 3, 4, "ink"], [30, 83, 10, 2], [44, 82, 3, 4, "ink"], [49, 83, 10, 2],
];
const GROUPS = [[2, 1.5, 95, 8.5, "<SiteBar>"], [4, 17, 50, 57, "<Hero>"], [58, 15.5, 38, 60, "<Cut>"], [4, 79.5, 58, 9, "<LayerPick>"]];
const DESIGN_TAGS = AR
  ? [["12 عمودًا", 62, 91], ["الهامش clamp(16px…48px)", 42, 14.5], ["العنوان clamp(2.4rem…4.6rem)", 40, 44.5], ["المسافة 24px", 40, 74.5]]
  : [["12 columns", 62, 91], ["gutter clamp(16px…48px)", 42, 14.5], ["h1 clamp(2.4rem…4.6rem)", 40, 44.5], ["gap 24px", 40, 74.5]];
const box = (x, y, w, h, k = "") => `<b class="${k}" style="--x:${x};--y:${y};--w:${w};--h:${h}"></b>`;
const tag = (t, x, y, ltr) => `<span class="tagx"${ltr ? ' dir="ltr"' : ""} style="inset-inline-start:${x}%;top:${y}%">${t.replace(/</g, "&lt;")}</span>`;

(function hero() {
  const stage = $("[data-stage]");
  if (!stage) return;
  $$("[data-mini]", stage).forEach((m) => {
    const kind = m.dataset.mini;
    const keep = $(".readout", m);
    let html = "";
    if (kind === "build") html = GROUPS.map(([x, y, w, h, t]) => box(x, y, w, h) + tag(t, Math.max(x, 40), y + h - 0.2, true)).join("");
    else {
      html = MINI.map((b) => box(...b)).join("");
      if (kind === "base") html += `<i style="position:absolute;top:15%;bottom:24%;inset-inline-start:77%;width:1.5px;background:var(--text)"></i>`;
      if (kind === "design") html += DESIGN_TAGS.map(([t, x, y]) => tag(t, x, y)).join("");
    }
    m.innerHTML = html;
    if (keep) m.appendChild(keep);
  });

  const range = $("[data-range]");
  const out = $("[data-out]");
  const setPos = (p, user = true) => {
    p = Math.max(0, Math.min(100, p));
    if (user) stage.classList.remove("is-intro");
    stage.style.setProperty("--pos", `${p}%`);
    if (range) range.value = Math.round(p);
    if (out) out.textContent = `${Math.round(p)}%`;
  };
  let drag = false;
  const at = (x) => { const r = stage.getBoundingClientRect(); const p = ((x - r.left) / r.width) * 100; return AR ? 100 - p : p; };
  stage.addEventListener("pointerdown", (e) => { drag = true; stage.setPointerCapture(e.pointerId); setPos(at(e.clientX)); });
  stage.addEventListener("pointermove", (e) => { if (drag) setPos(at(e.clientX)); });
  stage.addEventListener("pointerup", () => (drag = false));
  stage.addEventListener("pointercancel", () => (drag = false));
  range && range.addEventListener("input", () => setPos(Number(range.value)));

  const end = () => { if (stage.classList.contains("is-intro")) { stage.classList.remove("is-intro"); setPos(38, false); } };
  stage.addEventListener("animationend", end);
  if (!reduce) { stage.style.removeProperty("--pos"); stage.classList.add("is-intro"); setTimeout(end, 3200); }

  const pick = (k) => {
    $$(".stage__layer", stage).forEach((l) => l.classList.toggle("is-on", l.dataset.layer === k));
    $$("[data-layer-facts]").forEach((l) => l.classList.toggle("is-on", l.dataset.layerFacts === k));
    $$(".layer-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.layer === k)));
    if (k === "measure") paint();
  };
  $$(".layer-btn").forEach((b) => b.addEventListener("click", () => { if (stage.classList.contains("is-intro")) setPos(38); pick(b.dataset.layer); }));
  pick("design");

  /* the Measure layer reads this visit, in this browser */
  const live = { lcp: null, cls: 0 };
  try {
    new PerformanceObserver((l) => { const e = l.getEntries(); live.lcp = e[e.length - 1].startTime; paint(); }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { l.getEntries().forEach((e) => { if (!e.hadRecentInput) live.cls += e.value; }); paint(); }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  const kb = () => {
    const nav = performance.getEntriesByType("navigation")[0];
    const sum = performance.getEntriesByType("resource").reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), nav ? nav.transferSize || nav.encodedBodySize || 0 : 0);
    return Math.round(sum / 1024);
  };
  const L = AR
    ? { t: "هذه الزيارة، مقيسة الآن", lcp: "أكبر رسم", cls: "إزاحة التخطيط", kb: "المنقول", n: "العناصر", wait: "جارٍ القياس…", s: "ث" }
    : { t: "This visit, measured now", lcp: "Largest paint", cls: "Layout shift", kb: "Transferred", n: "Elements", wait: "measuring…", s: "s" };
  function paint() {
    if (!stage.hasAttribute("data-live")) return;
    const r = $(".readout", stage);
    if (!r) return;
    const lcp = live.lcp == null ? L.wait : `${(live.lcp / 1000).toFixed(2)} ${L.s}`;
    r.innerHTML = `<small>${L.t}</small><span>${L.lcp} <b>${lcp}</b></span><span>${L.cls} <b>${live.cls.toFixed(3)}</b></span><span>${L.kb} <b>${kb()} KB</b></span><span>${L.n} <b>${document.getElementsByTagName("*").length}</b></span>`;
  }
  addEventListener("load", paint);
})();

/* ---------- platform demo: one codebase, themes and switches ---------- */
(function platform() {
  const np = $("[data-np]");
  if (!np) return;
  $$("[name=np-theme]").forEach((r) => r.addEventListener("change", () => {
    np.dataset.themeId = r.value;
    np.dir = r.value === "c" ? "ltr" : "rtl";
    np.lang = r.value === "c" ? "en" : "ar";
    $$("[data-np-text]", np).forEach((n) => (n.textContent = n.dataset[r.value === "c" ? "en" : "ar"]));
  }));
  $$("[data-np-mod]").forEach((c) => c.addEventListener("change", () => {
    const m = $(`[data-mod="${c.dataset.npMod}"]`, np);
    if (m) m.hidden = !c.checked;
  }));
})();

/* ---------- measured: the weekly numbers, live from the repository ---------- */
(function measured() {
  const rows = $$("[data-psi]");
  if (!rows.length) return;
  const BASE = "https://raw.githubusercontent.com/imsemoo/imsemoo/main/data/psi/";
  let latest = null;
  Promise.allSettled(rows.map(async (tr) => {
    const r = await fetch(BASE + tr.dataset.psi + ".json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const m = d.results && d.results.mobile;
    if (!m) return;
    const set = (k, v, under) => { const td = $(`[data-k="${k}"]`, tr); if (td) { td.textContent = v; td.classList.toggle("under", !!under); } };
    set("perf", m.scores.performance, m.scores.performance < 90);
    set("a11y", m.scores.accessibility, m.scores.accessibility < 90);
    set("lcp", m.metrics.lcp.display.replace(/\s/g, " ").replace("s", AR ? "ث" : "s"));
    /* move the marks on the scales too: performance on 0-100, the largest paint on 0-6 s */
    const scale = (k, pct, under) => { const el = $(`[data-scale="${k}"]`, tr); if (el) { el.style.setProperty("--v", `${Math.max(0, Math.min(100, pct))}%`); el.classList.toggle("is-under", under); } };
    scale("perf", m.scores.performance, m.scores.performance < 90);
    const lcpS = m.metrics.lcp.value / 1000;
    scale("lcp", (lcpS / 6) * 100, lcpS > 2.5);
    const when = new Date(d.measuredAt);
    if (!latest || when > latest) latest = when;
  })).then(() => {
    const s = $("[data-psi-date]");
    if (s && latest) s.textContent = latest.toLocaleDateString(AR ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  });
})();

/* ---------- contact: copy the address, local time ---------- */
(function contact() {
  const b = $("[data-copy]");
  if (b) b.addEventListener("click", async () => {
    const out = $("[data-copied]");
    try { await navigator.clipboard.writeText(b.dataset.copy); out.textContent = AR ? "نُسخ" : "Copied"; }
    catch { const sel = getSelection(); const r = document.createRange(); r.selectNodeContents($("[data-address]")); sel.removeAllRanges(); sel.addRange(r); out.textContent = AR ? "محدد، انسخه" : "Selected, copy it"; }
  });
  const c = $("[data-clock]");
  if (c && typeof Intl !== "undefined") {
    const f = new Intl.DateTimeFormat(AR ? "ar-EG-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Cairo" });
    const tick = () => (c.textContent = f.format(new Date()));
    tick(); setInterval(tick, 30000);
  }
})();

/* ---------- case page: which layer is being read ---------- */
(function toc() {
  const links = $$(".toc a");
  if (!links.length || !("IntersectionObserver" in window)) return;
  const map = new Map(links.map((a) => [$(a.getAttribute("href")), a]));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.removeAttribute("aria-current"));
    map.get(e.target)?.setAttribute("aria-current", "true");
  }), { rootMargin: "-40% 0px -55% 0px" });
  map.forEach((_, s) => s && io.observe(s));
})();

/* ---------- the language link keeps your place ---------- */
(function samePlace() {
  const link = $("[data-lang-link]");
  if (!link) return;
  const base = link.getAttribute("href");
  const aim = () => {
    let here = null, best = -Infinity;
    for (const el of $$("main [id]")) {
      const t = el.getBoundingClientRect().top;
      if (t <= 120 && t > best) { best = t; here = el; }
    }
    link.href = here ? `${base}#${here.id}` : base;
  };
  ["pointerenter", "focus", "click"].forEach((t) => link.addEventListener(t, aim));
})();
