/* Live PageSpeed numbers. The HTML ships with the last committed values; this
   fetches the JSON the weekly GitHub Action writes and updates the cells if
   they differ. If the fetch fails, the committed numbers stand. */

const BASE = "https://raw.githubusercontent.com/imsemoo/imsemoo/main/data/psi/";
const KEYS = ["performance", "accessibility", "best-practices", "seo"];

// the sentences this file writes, in the page's language
const T = document.documentElement.lang === "ar"
  ? {
      locale: "ar-EG-u-nu-latn",
      live: (day) => `الأرقام مباشرة من المستودع. آخر قياس: ${day}.`,
      field: (overall, lcp, inp) => `مستخدمو Chrome الفعليون خلال 28 يومًا: ${overall}، وLCP عند ${lcp}، وINP عند ${inp}.`,
      overall: { FAST: "سريع", AVERAGE: "متوسط", SLOW: "بطيء" },
      s: (ms) => `${(ms / 1000).toFixed(2)} ثانية`,
      ms: (ms) => `${ms} ملي ثانية`,
      lcp: (shown) => shown.replace(/\s*s$/, "\u00a0ث"),
      more: (v) => `${v} أو أكثر`,
      none: "غير متاح",
    }
  : {
      locale: "en-GB",
      live: (day) => `Live from the repository. Last measured ${day}.`,
      field: (overall, lcp, inp) => `Real Chrome users over 28 days: ${overall}, LCP ${lcp}, INP ${inp}.`,
      overall: {},
      s: (ms) => `${(ms / 1000).toFixed(2)}\u00a0s`,
      ms: (ms) => `${ms}\u00a0ms`,
      lcp: (shown) => shown.replace(/\s/g, "\u00a0"),
      more: (v) => `${v} or more`,
      none: "n/a",
    };

export function initMeasured() {
  const cards = document.querySelectorAll("[data-psi]");
  const status = document.querySelector("[data-psi-status]");
  if (!cards.length) return;

  let latest = null;

  // Each card stands on its own: a site the weekly job has not measured yet
  // (this page, until its first Monday) must not hide the others' numbers.
  Promise.allSettled(
    [...cards].map(async (card) => {
      const slug = card.dataset.psi;
      const res = await fetch(`${BASE}${slug}.json`, { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      fill(card, data);
      const when = new Date(data.measuredAt);
      if (!latest || when > latest) latest = when;
    })
  ).then(() => {
    if (status && latest) {
      const day = latest.toLocaleDateString(T.locale, { day: "numeric", month: "long", year: "numeric" });
      status.textContent = T.live(day);
    }
  });
}

function fill(card, data) {
  const self = card.querySelector("[data-self]");
  if (self) return fillSelf(card, data);
  card.querySelectorAll("tr[data-strategy]").forEach((tr) => {
    const r = data.results && data.results[tr.dataset.strategy];
    if (!r) return;
    KEYS.forEach((k) => {
      const td = tr.querySelector(`[data-k="${k}"]`);
      const v = r.scores && r.scores[k];
      if (!td || typeof v !== "number") return;
      td.textContent = String(v);
      td.classList.toggle("under", v < 90);
    });
    const lcp = tr.querySelector('[data-k="lcp"]');
    if (lcp && r.metrics && r.metrics.lcp && r.metrics.lcp.display) {
      lcp.textContent = T.lcp(r.metrics.lcp.display);
    }
  });
  const note = card.querySelector("[data-field]");
  const field = data.results && (data.results.mobile || data.results.desktop);
  if (note && field && field.field && field.field.overall) {
    const f = field.field;
    note.textContent = T.field(
      T.overall[f.overall] || f.overall,
      f.lcp_ms == null ? T.none : T.s(f.lcp_ms),
      f.inp_ms == null ? T.none : T.ms(f.inp_ms)
    );
  }
}

/* The page's own card has no table: one sentence with the two performance
   scores and the lowest of the other three categories across both devices.
   The sentence ships with the committed numbers, so filling it in never
   moves the layout. */
function fillSelf(card, data) {
  const r = data.results || {};
  const mob = r.mobile && r.mobile.scores;
  const desk = r.desktop && r.desktop.scores;
  if (!mob || !desk) return;
  const rest = Math.min(
    ...["accessibility", "best-practices", "seo"].flatMap((k) => [mob[k], desk[k]]).filter((v) => typeof v === "number")
  );
  card.querySelector("[data-self-mobile]").textContent = String(mob.performance);
  card.querySelector("[data-self-desktop]").textContent = String(desk.performance);
  card.querySelector("[data-self-rest]").textContent = Number.isFinite(rest) ? (rest === 100 ? "100" : T.more(rest)) : T.none;
}
