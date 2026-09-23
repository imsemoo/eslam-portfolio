/* Index filter and length.

   Two questions a client brings, two groups of chips:
   - Project type ("have you built something like mine?"), one at a time,
     Everything by default.
   - What you need ("design and build", "build from my design", "Arabic,
     right to left"), at most one, off by default; pressing it again clears it.
   The two combine. Each chip shows how many projects it would leave with the
   other group as it stands, and a chip that would leave none is disabled, so
   the list can never be filtered into an empty state.

   With nothing narrowed, only the first rows (data-open) show and a button
   offers the rest. Without JavaScript every row is simply there.

   Changes are explained rather than swapped: rows that stay slide from where
   they were (FLIP, Web Animations API), rows that arrive rise in behind them.
   With reduced motion the list simply updates. */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function initFilters({ reduce }) {
  const chips = [...document.querySelectorAll(".chip[data-filter]")];
  const list = document.querySelector("[data-rows]");
  const rows = list ? [...list.querySelectorAll(".row")] : [];
  const count = document.querySelector("[data-count]");
  const more = document.querySelector("[data-more]");
  const showAll = document.querySelector("[data-show-all]");
  if (!chips.length || !rows.length) return;

  const animate = !reduce && typeof Element.prototype.animate === "function";
  const tagsOf = new Map(rows.map((row) => [row, (row.dataset.tags || "").split(/\s+/)]));
  let expanded = !rows.some((row) => row.hasAttribute("data-extra"));
  const state = { type: "all", need: null };

  const matches = (row, type, need) => {
    const tags = tagsOf.get(row);
    return (type === "all" || tags.includes(type)) && (!need || tags.includes(need));
  };
  const narrowed = () => state.type !== "all" || state.need !== null;

  // the one hand-ranked order in projects.json applies when its filter is the only one on
  function ordered() {
    const only = state.need && state.type === "all" ? state.need : !state.need && state.type !== "all" ? state.type : null;
    const key = only && "rank" + only.charAt(0).toUpperCase() + only.slice(1);
    if (!key || !rows.some((row) => row.dataset[key] !== undefined)) return rows;
    const rank = (row) => (row.dataset[key] === undefined ? Infinity : Number(row.dataset[key]));
    return [...rows].sort((a, b) => rank(a) - rank(b));
  }

  function counts() {
    chips.forEach((chip) => {
      const f = chip.dataset.filter;
      const n = chip.dataset.group === "type"
        ? rows.filter((row) => matches(row, f, state.need)).length
        : rows.filter((row) => matches(row, state.type, f)).length;
      const pressed = chip.getAttribute("aria-pressed") === "true";
      chip.querySelector("[data-n]").textContent = String(n);
      chip.querySelector("[data-n-sr]").textContent = `, ${n} ${n === 1 ? "project" : "projects"}`;
      chip.disabled = n === 0 && !pressed;
    });
  }

  function apply() {
    const before = new Map();
    if (animate) rows.forEach((row) => { if (!row.hidden) before.set(row, row.getBoundingClientRect().top); });

    const sequence = ordered();
    sequence.forEach((row) => list.appendChild(row));

    let shown = 0;
    let total = 0;
    const arriving = [];
    sequence.forEach((row) => {
      const match = matches(row, state.type, state.need);
      if (match) total += 1;
      const on = match && (narrowed() || expanded || !row.hasAttribute("data-extra"));
      row.hidden = !on;
      if (!on) return;
      shown += 1;
      if (!before.has(row)) arriving.push(row);
    });
    if (count) count.textContent = shown < total ? `${shown} of ${total}` : String(total);
    if (more) more.hidden = !(shown < total);
    counts();

    if (!animate) return;
    const limit = window.innerHeight * 1.5;
    before.forEach((top, row) => {
      if (row.hidden) return;
      const now = row.getBoundingClientRect().top;
      const dy = top - now;
      if (Math.abs(dy) < 1 || now > limit) return;
      row.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 550, easing: EASE });
    });
    arriving
      .filter((row) => row.getBoundingClientRect().top < limit)
      .forEach((row, i) => {
        row.animate(
          [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
          { duration: 500, easing: EASE, delay: Math.min(i * 30, 300), fill: "backwards" }
        );
      });
  }

  function press() {
    chips.forEach((chip) => {
      const on = chip.dataset.group === "type" ? chip.dataset.filter === state.type : chip.dataset.filter === state.need;
      chip.setAttribute("aria-pressed", String(on));
    });
  }

  function hash() {
    const parts = [state.type !== "all" ? state.type : null, state.need].filter(Boolean);
    history.replaceState(null, "", parts.length ? `#index-${parts.join(".")}` : "#index");
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      if (chip.dataset.group === "type") state.type = f;
      else state.need = state.need === f ? null : f;
      press();
      apply();
      hash();
    });
  });

  if (showAll) {
    showAll.addEventListener("click", () => {
      const firstHidden = rows.find((row) => row.hidden && row.hasAttribute("data-extra"));
      expanded = true;
      showAll.setAttribute("aria-expanded", "true");
      apply();
      // focus moves to the first row that just appeared, so the button that
      // disappeared does not take the reader's place in the page with it
      const link = firstHidden && firstHidden.querySelector(".row__link");
      if (link) link.focus({ preventScroll: false });
    });
  }

  apply();

  // Deep links, on load and when a link on the page changes the hash:
  // #index-news, #index-rtl or #index-news.rtl open the index already
  // filtered; a link to a row that starts collapsed (#p-slug) opens the list.
  const types = new Set(chips.filter((c) => c.dataset.group === "type").map((c) => c.dataset.filter));
  const needs = new Set(chips.filter((c) => c.dataset.group === "need").map((c) => c.dataset.filter));
  function follow() {
    const m = location.hash.match(/^#index-([a-z.]+)$/);
    if (m) {
      const parts = m[1].split(".");
      const type = parts.find((p) => types.has(p)) || "all";
      const need = parts.find((p) => needs.has(p)) || null;
      if (type !== state.type || need !== state.need) {
        state.type = type;
        state.need = need;
        press();
        apply();
      }
      document.getElementById("index")?.scrollIntoView();
      return;
    }
    const row = location.hash.startsWith("#p-") && document.getElementById(location.hash.slice(1));
    if (row && row.hidden) {
      state.type = "all";
      state.need = null;
      expanded = true;
      press();
      apply();
      row.scrollIntoView();
    }
  }
  follow();
  window.addEventListener("hashchange", follow);
}
