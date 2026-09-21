/* Index filter. Chips are exclusive; the count and the empty state update
   with aria-live. When GSAP is present the visible rows settle in with a
   short stagger, otherwise they just appear. */

export function initFilters({ reduce }) {
  const chips = document.querySelectorAll(".chip[data-filter]");
  const rows = [...document.querySelectorAll("[data-rows] .row")];
  const count = document.querySelector("[data-count]");
  const empty = document.querySelector("[data-empty]");
  if (!chips.length || !rows.length) return;

  function apply(filter) {
    let shown = 0;
    const visible = [];
    rows.forEach((row) => {
      const tags = (row.dataset.tags || "").split(/\s+/);
      const on = filter === "all" || tags.includes(filter);
      row.hidden = !on;
      if (on) {
        shown += 1;
        visible.push(row);
      }
    });
    if (count) count.textContent = String(shown);
    if (empty) empty.hidden = shown !== 0;
    if (!reduce && window.gsap && visible.length) {
      window.gsap.fromTo(visible, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.02, ease: "power2.out", overwrite: true, clearProps: "opacity,transform" });
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
