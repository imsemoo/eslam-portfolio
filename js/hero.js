/* The hero pile. Three framed screens sit in three fixed slots; the cards
   can be leafed through. Click a card at the back and it comes to the front,
   click the front card and it opens the project, or use the Next button.
   With GSAP present the cards travel between slots (FLIP); without it, or
   with reduced motion, they simply swap. The caption under the pile names
   the front screen and is read out by screen readers when it changes. */

export function initHero({ reduce }) {
  const stack = document.querySelector("[data-hero-stack]");
  if (!stack) return;
  const slots = [...stack.querySelectorAll("[data-slot]")];
  const caption = stack.querySelector("[data-stack-caption]");
  const next = stack.querySelector("[data-stack-next]");
  if (slots.length < 2) return;

  let busy = false;

  const cards = () => slots.map((slot) => slot.querySelector("[data-card]"));

  function describe() {
    const front = cards()[0];
    if (!front) return;
    slots.forEach((slot, i) => slot.classList.toggle("is-front", i === 0));
    if (caption) caption.textContent = `${front.dataset.cap}, ${front.dataset.kind}`;
    // the accessible name starts with the caption the card visibly shows
    cards().forEach((card, i) => {
      card.setAttribute("aria-label", i === 0 ? `${card.dataset.cap}, ${card.dataset.name}: ${card.dataset.open}` : `${card.dataset.cap}, ${card.dataset.name}: bring to the front`);
    });
  }

  // Move the cards so that `lead` sits in the first slot and the others keep
  // their relative order, then animate each from where it was.
  function rotate(lead) {
    if (busy) return;
    const list = cards();
    const from = list.indexOf(lead);
    if (from <= 0) return;
    const order = list.slice(from).concat(list.slice(0, from));
    const gsap = !reduce && window.gsap;
    const first = gsap ? new Map(order.map((card) => [card, card.getBoundingClientRect()])) : null;
    order.forEach((card, i) => slots[i].appendChild(card));
    describe();
    if (!gsap) return;
    busy = true;
    let pending = order.length;
    order.forEach((card) => {
      const a = first.get(card);
      const b = card.getBoundingClientRect();
      gsap.fromTo(
        card,
        { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, transformOrigin: "0 0" },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.75, ease: "expo.out", overwrite: true, clearProps: "transform,transformOrigin", onComplete: () => { if (--pending === 0) busy = false; } }
      );
    });
  }

  // Keyboard activation follows the link straight away; a pointer or a
  // finger on a back card brings it forward first. The keyboard is detected
  // by the keydown that precedes the synthesised click.
  let keyAt = 0;
  stack.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-card]")) keyAt = performance.now();
  });
  stack.addEventListener("click", (e) => {
    const card = e.target.closest("[data-card]");
    if (!card || !stack.contains(card)) return;
    if (performance.now() - keyAt < 400) return;
    const list = cards();
    if (list.indexOf(card) > 0) {
      e.preventDefault();
      rotate(card);
    }
  });

  if (next) {
    next.addEventListener("click", () => {
      const list = cards();
      if (list[1]) rotate(list[1]);
    });
  }

  describe();
}
