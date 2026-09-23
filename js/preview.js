/* Pointer preview over the index. Desktop with a fine pointer only; phones
   get the inline thumbnails. The frame rides along the right edge of the
   list at the pointer's height, so it covers the stack and language columns
   while the name and the role stay readable. The image element is reused
   and the eased position only animates while the pointer is over a row. */

export function initPreview({ reduce }) {
  const box = document.querySelector("[data-preview-box]");
  const rows = document.querySelector("[data-rows]");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!box || !rows || !fine) return;

  const img = box.querySelector("img");
  const bar = document.querySelector("[data-nav]");
  const state = { y: 0, ty: 0, x: 0, frame: 0, on: false };

  function place() {
    state.frame = 0;
    const dy = state.ty - state.y;
    state.y = reduce ? state.ty : state.y + dy * 0.2;
    box.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translateY(-50%)`;
    if (!reduce && Math.abs(dy) > 0.3) state.frame = requestAnimationFrame(place);
  }

  function target(e) {
    const r = rows.getBoundingClientRect();
    state.x = r.right - box.offsetWidth - 8;
    const half = box.offsetHeight / 2 + 12;
    // never under the sticky nav: the frame stops just below it
    const top = (bar ? bar.offsetHeight : 0) + half;
    state.ty = Math.min(Math.max(e.clientY, top), window.innerHeight - half);
    if (!state.frame) state.frame = requestAnimationFrame(place);
  }

  rows.addEventListener("pointerover", (e) => {
    const row = e.target.closest(".row[data-preview]");
    if (!row) return;
    const src = row.dataset.preview;
    if (img.getAttribute("src") !== src) img.src = src;
    if (!state.on) state.y = e.clientY;
    state.on = true;
    box.classList.add("is-on");
    target(e);
  });
  rows.addEventListener("pointermove", (e) => {
    if (state.on) target(e);
  });
  rows.addEventListener("pointerout", (e) => {
    const to = e.relatedTarget;
    if (to && to.closest && to.closest(".row[data-preview]")) return;
    state.on = false;
    box.classList.remove("is-on");
  });
}
