/* Lecture page: chapter navigation, playback speed and 'follow the video' scrolling. */
"use strict";
(() => {
  const vid = document.getElementById("vid");
  if (!vid) return;
  const notes = [...document.querySelectorAll("section.note")];
  const starts = notes.map((n) => +n.dataset.start);
  const list = document.querySelector(".chapters");
  const chap = [...document.querySelectorAll(".chapters a")];
  const follow = document.getElementById("follow");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  const behavior = () => (reduceMotion && reduceMotion.matches ? "auto" : "smooth");
  let cur = -1;

  /* The video uses preload="none": nothing is downloaded until the reader asks for it. A seek requested before the
     metadata exists is kept and applied as soon as it arrives. */
  let pending = null;
  vid.addEventListener("loadedmetadata", () => { if (pending !== null) { vid.currentTime = pending; pending = null; } });
  const seek = (t, play = true) => {
    const target = t + 0.05;
    if (vid.readyState >= 1) vid.currentTime = target;
    else { pending = target; if (!play) vid.load(); }
    if (play) vid.play().catch(() => {});
  };
  document.querySelectorAll("[data-t]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      seek(+el.dataset.t);
      if (el.closest(".chapters")) document.getElementById(el.getAttribute("href").slice(1)).scrollIntoView({ behavior: behavior(), block: "start" });
    }));

  /* Keep the current chapter visible inside the chapter list only: never scroll the page for it. */
  const revealInList = (a) => {
    const top = a.offsetTop - list.offsetTop, bottom = top + a.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  };
  const mark = (i) => {
    if (i === cur) return;
    if (cur >= 0) { notes[cur].classList.remove("now"); chap[cur].classList.remove("now"); }
    cur = i;
    notes[i].classList.add("now");
    chap[i].classList.add("now");
    revealInList(chap[i]);
    if (follow && follow.checked && !vid.paused) notes[i].scrollIntoView({ behavior: behavior(), block: "start" });
  };
  vid.addEventListener("timeupdate", () => {
    const t = vid.currentTime;
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= t) i++;
    mark(i);
  });

  document.querySelectorAll(".speed button").forEach((b) =>
    b.addEventListener("click", () => {
      vid.playbackRate = +b.dataset.r;
      document.querySelectorAll(".speed button").forEach((x) => x.classList.toggle("on", x === b));
    }));
  document.querySelector('.speed button[data-r="1"]').classList.add("on");
  vid.addEventListener("ratechange", () => document.querySelectorAll(".speed button").forEach((x) => x.classList.toggle("on", +x.dataset.r === vid.playbackRate)));

  const narr = document.getElementById("shownarr");
  narr && narr.addEventListener("change", () => document.querySelectorAll("details.narr").forEach((d) => (d.open = narr.checked)));

  /* Small screens: the player is not sticky, so offer a button back to it once it has scrolled away. */
  const back = document.createElement("button");
  back.type = "button";
  back.className = "to-player";
  back.textContent = "▲ video";
  back.hidden = true;
  back.addEventListener("click", () => vid.scrollIntoView({ behavior: behavior(), block: "start" }));
  document.body.appendChild(back);
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => (back.hidden = e.isIntersecting)).observe(vid);

  const q = new URLSearchParams(location.search).get("t");
  if (q) seek(+q, false);
})();
