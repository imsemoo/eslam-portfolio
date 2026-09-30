/* Mobile navigation, a disclosure: the button opens the list below the
   header and moves focus to its first link; Escape or a chosen link closes
   it and returns focus to the button. Also the local-time readout, so a
   client in another time zone can see whether it is day in Egypt, and the
   link to the other language, which keeps the reader's place. */

const AR = document.documentElement.lang === "ar";

export function initNav() {
  clock();
  samePlace();

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
    fmt = AR
      ? new Intl.DateTimeFormat("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Cairo" })
      : new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
  } catch {
    return;
  }
  const tick = () => {
    const now = new Date();
    time.textContent = fmt.format(now);
    time.dateTime = now.toISOString();
  };
  tick();
  box.title = AR ? "الوقت الآن في مصر" : "Local time in Egypt";
  box.hidden = false;
  setInterval(tick, 30000);
}

/* Both pages carry the same ids, so the link to the other language points
   at whatever is at the top of the screen: the section, the case, the row.
   It is re-aimed when the pointer or focus reaches it and on the click. */
function samePlace() {
  const link = document.querySelector("[data-lang-switch]");
  if (!link) return;
  const page = link.getAttribute("href");
  const aim = () => {
    const line = (document.querySelector("[data-nav]")?.offsetHeight || 0) + 24;
    // the section, case, brief or row passed most recently: the lowest top
    // still above the line. They all clear the nav when jumped to. The hero
    // stays pinned under the sheet, so it never counts.
    let here = null;
    let best = -Infinity;
    for (const el of document.querySelectorAll("main section[id], main article[id], main li[id]")) {
      if (!el.getClientRects().length || el.closest("[data-hero]")) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= line && top > best) {
        best = top;
        here = el;
      }
    }
    link.href = here ? `${page}#${here.id}` : page;
  };
  ["pointerenter", "focus", "click"].forEach((type) => link.addEventListener(type, aim));
}
