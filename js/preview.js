/* Pointer-following preview over the index. Desktop with a fine pointer
   only; phones get the inline thumbnails. The image element is reused, the
   position is eased with requestAnimationFrame and the loop only runs while
   the pointer is over a row. */

export function initPreview({ reduce }) {
  const box = document.querySelector("[data-preview]");
  const rows = document.querySelector("[data-rows]");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!box || !rows || !fine || reduce) return;

  const img = box.querySelector("img");
  const state = { x: 0, y: 0, tx: 0, ty: 0, frame: 0, on: false };
  const OFFSET_X = 220; // keep the preview to the right of the pointer, off the text

  function loop() {
    state.x += (state.tx - state.x) * 0.16;
    state.y += (state.ty - state.y) * 0.16;
    box.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%) scale(${state.on ? 1 : 0.96})`;
    if (Math.abs(state.tx - state.x) > 0.3 || Math.abs(state.ty - state.y) > 0.3 || state.on) {
      state.frame = requestAnimationFrame(loop);
    } else {
      state.frame = 0;
    }
  }

  function place(e) {
    const w = box.offsetWidth;
    const maxX = window.innerWidth - w / 2 - 16;
    state.tx = Math.min(e.clientX + OFFSET_X, maxX);
    state.ty = e.clientY;
    if (!state.frame) state.frame = requestAnimationFrame(loop);
  }

  rows.addEventListener("pointerover", (e) => {
    const row = e.target.closest(".row[data-preview]");
    if (!row) return;
    const src = row.dataset.preview;
    if (img.getAttribute("src") !== src) img.src = src;
    if (!state.on) {
      state.x = e.clientX + OFFSET_X;
      state.y = e.clientY;
    }
    state.on = true;
    box.classList.add("is-on");
    place(e);
  });
  rows.addEventListener("pointermove", (e) => {
    if (state.on) place(e);
  });
  rows.addEventListener("pointerout", (e) => {
    const to = e.relatedTarget;
    if (to && to.closest && to.closest(".row[data-preview]")) return;
    state.on = false;
    box.classList.remove("is-on");
  });
}
