/* Index filter. Chips are exclusive; the count and the empty state update
   with aria-live. Rows keep the order of the projects array unless the
   build gave them a data-rank-<filter> attribute, in which case the rows
   are re-appended in that order so the CSS counter follows.

   With GSAP present the change is explained rather than swapped: rows that
   stay slide from where they were to where they are (FLIP), rows that
   arrive rise in behind them. Without it, or with reduced motion, the list
   simply updates. */

export function initFilters({ reduce }) {
  const chips = document.querySelectorAll(".chip[data-filter]");
  const list = document.querySelector("[data-rows]");
  const rows = list ? [...list.querySelectorAll(".row")] : [];
  const count = document.querySelector("[data-count]");
  const empty = document.querySelector("[data-empty]");
  if (!chips.length || !rows.length) return;

  function rankKey(filter) {
    return "rank" + filter.charAt(0).toUpperCase() + filter.slice(1);
  }

  function ordered(filter) {
    const key = rankKey(filter);
    if (!rows.some((row) => row.dataset[key] !== undefined)) return rows;
    const rank = (row) => (row.dataset[key] === undefined ? Infinity : Number(row.dataset[key]));
    return [...rows].sort((a, b) => rank(a) - rank(b));
  }

  function apply(filter) {
    const gsap = !reduce && window.gsap;
    const before = new Map();
    if (gsap) {
      rows.forEach((row) => {
        if (!row.hidden) before.set(row, row.getBoundingClientRect().top);
      });
    }

    const sequence = ordered(filter);
    sequence.forEach((row) => list.appendChild(row));

    let shown = 0;
    const staying = [];
    const arriving = [];
    sequence.forEach((row) => {
      const tags = (row.dataset.tags || "").split(/\s+/);
      const on = filter === "all" || tags.includes(filter);
      const was = before.has(row);
      row.hidden = !on;
      if (!on) return;
      shown += 1;
      (was ? staying : arriving).push(row);
    });
    if (count) count.textContent = String(shown);
    if (empty) empty.hidden = shown !== 0;

    if (gsap) {
      const limit = window.innerHeight * 1.5;
      staying.forEach((row) => {
        const top = row.getBoundingClientRect().top;
        const dy = before.get(row) - top;
        if (Math.abs(dy) < 1 || top > limit) return;
        gsap.fromTo(row, { y: dy }, { y: 0, duration: 0.55, ease: "expo.out", overwrite: true, clearProps: "transform" });
      });
      const near = arriving.filter((row) => row.getBoundingClientRect().top < limit);
      if (near.length) {
        gsap.fromTo(
          near,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: Math.min(0.03, 0.3 / near.length), ease: "expo.out", overwrite: true, clearProps: "opacity,transform" }
        );
      }
    }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", c === chip ? "true" : "false"));
      apply(chip.dataset.filter);
      history.replaceState(null, "", chip.dataset.filter === "all" ? "#index" : `#index-${chip.dataset.filter}`);
    });
  });

  // deep link: /#index-english opens the index already filtered
  const m = location.hash.match(/^#index-([a-z]+)$/);
  if (m) {
    const chip = [...chips].find((c) => c.dataset.filter === m[1]);
    if (chip) chip.click();
  }
}
