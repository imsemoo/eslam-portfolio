/* Mobile navigation, a disclosure: the button opens the list below the
   header and moves focus to its first link; Escape or a chosen link closes
   it and returns focus to the button. Also the local-time readout, so a
   client in another time zone can see whether it is day in Egypt. */

export function initNav() {
  clock();

  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
  const set = (open, { focus = false } = {}) => {
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("is-open", open);
    if (open && focus) links.querySelector("a")?.focus();
    if (!open && focus) toggle.focus();
  };

  toggle.addEventListener("click", () => set(!isOpen(), { focus: !isOpen() }));
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) set(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) set(false, { focus: true });
  });
  // leaving the open menu with Tab closes it rather than stranding it
  links.addEventListener("focusout", (e) => {
    if (isOpen() && !links.contains(e.relatedTarget) && e.relatedTarget !== toggle) set(false);
  });
  window.matchMedia("(min-width: 821px)").addEventListener("change", (m) => {
    if (m.matches) set(false);
  });
}

function clock() {
  const box = document.querySelector("[data-clock]");
  const time = box && box.querySelector("[data-clock-time]");
  if (!time || typeof Intl === "undefined") return;
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
  } catch {
    return;
  }
  const tick = () => {
    const now = new Date();
    time.textContent = fmt.format(now);
    time.dateTime = now.toISOString();
  };
  tick();
  box.title = "Local time in Egypt";
  box.hidden = false;
  setInterval(tick, 30000);
}
