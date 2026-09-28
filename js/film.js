/* Case intro films.

   The page ships a plain <video> with native controls, so the film works with
   no JavaScript. Here those controls give way to two buttons, and the film
   plays by itself only while most of it is on screen: it pauses when scrolled
   away and carries on when it comes back. It plays once and stops on its
   closing frame. Play/Pause stops it at any moment, which an animation that
   runs longer than five seconds needs (WCAG 2.2.2). Full screen is there
   because at phone width the type inside the film is too small to read.

   Under prefers-reduced-motion, or with Save-Data on, it never starts by
   itself: the poster stays until the reader presses Play. */

export function initFilm({ reduce }) {
  const films = document.querySelectorAll("[data-film]");
  if (!films.length) return;
  const passive = reduce || navigator.connection?.saveData === true;
  films.forEach((fig) => setUp(fig, passive));
}

function setUp(fig, passive) {
  const video = fig.querySelector("video");
  const frame = fig.querySelector(".film__frame");
  if (!video || !frame) return;
  const name = video.getAttribute("aria-label") || "the intro";

  video.removeAttribute("controls");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "film__toggle";
  frame.append(button);

  // Whether the film should be running when it is on screen. The reader's own
  // Pause, and the end of the film, turn it off; Play turns it back on.
  let wanted = !passive;

  const label = () => {
    const state = !video.paused ? "Pause" : video.ended ? "Replay" : "Play";
    button.textContent = state;
    button.setAttribute("aria-label", `${state} ${name}`);
  };
  const start = () => video.play().catch(label);

  button.addEventListener("click", () => {
    if (video.paused) {
      wanted = true;
      if (video.ended) video.currentTime = 0;
      start();
    } else {
      wanted = false;
      video.pause();
    }
  });
  video.addEventListener("play", label);
  video.addEventListener("pause", label);
  video.addEventListener("ended", () => {
    wanted = false;
    label();
  });
  label();

  fullScreen(frame, video, name, () => {
    wanted = true;
    start();
  });

  if (!("IntersectionObserver" in window)) return;
  // The ratio, not isIntersecting: scrolling off slowly fires one callback at
  // just under 0.6, where isIntersecting is still true, and none after it.
  let shown = false;
  new IntersectionObserver(([entry]) => {
    shown = entry.intersectionRatio >= 0.6;
    if (shown && wanted && video.paused && !video.ended) start();
    else if (!shown && !video.paused) video.pause();
  }, { threshold: 0.6 }).observe(video);
  // Browsers stop muted video in a hidden tab; carry on when the tab is back.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && shown && wanted && video.paused && !video.ended) start();
  });
}

/* Full screen takes the whole frame, so Play/Pause stays on screen with the
   film, and a phone turns to landscape for it. An iPhone can put only the
   video itself full screen, in its own player, and only once the video has
   loaded: until then the press starts the film, and the next one opens it. */
function fullScreen(frame, video, name, play) {
  const whole = document.fullscreenEnabled === true;
  const own = typeof video.webkitEnterFullscreen === "function";
  if (!whole && !own) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "film__expand";
  frame.append(button);

  let turned = false;
  const label = () => {
    const state = document.fullscreenElement === frame ? "Exit full screen" : "Full screen";
    button.textContent = state;
    button.setAttribute("aria-label", `${state}: ${name}`);
  };

  button.addEventListener("click", () => {
    if (document.fullscreenElement === frame) {
      document.exitFullscreen();
    } else if (whole) {
      frame
        .requestFullscreen()
        .then(() => screen.orientation.lock("landscape"))
        .then(() => (turned = true))
        .catch(() => {});
    } else {
      try {
        video.webkitEnterFullscreen();
      } catch {
        play();
      }
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (turned && document.fullscreenElement !== frame) {
      screen.orientation.unlock();
      turned = false;
    }
    label();
  });
  label();
}
