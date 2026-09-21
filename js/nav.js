/* Mobile navigation toggle. Closes on link click and on Escape. */

export function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  const set = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => set(toggle.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) set(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
}
