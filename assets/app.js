/* Lecture page: chapter navigation, playback speed and 'follow the video' scrolling. */
"use strict";
(() => {
  const vid = document.getElementById("vid");
  if (!vid) return;
  const notes = [...document.querySelectorAll("section.note")];
  const starts = notes.map((n) => +n.dataset.start);
  const chap = [...document.querySelectorAll(".chapters a")];
  const follow = document.getElementById("follow");
  let cur = -1;

  const seek = (t, play = true) => { vid.currentTime = t + 0.05; if (play) vid.play().catch(() => {}); };
  document.querySelectorAll("[data-t]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      seek(+el.dataset.t);
      if (el.closest(".chapters")) document.getElementById(el.getAttribute("href").slice(1)).scrollIntoView({ behavior: "smooth", block: "start" });
    }));

  const mark = (i) => {
    if (i === cur) return;
    if (cur >= 0) { notes[cur].classList.remove("now"); chap[cur].classList.remove("now"); }
    cur = i;
    notes[i].classList.add("now");
    chap[i].classList.add("now");
    chap[i].scrollIntoView({ block: "nearest" });
    if (follow && follow.checked && !vid.paused) notes[i].scrollIntoView({ behavior: "smooth", block: "start" });
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

  const narr = document.getElementById("shownarr");
  narr && narr.addEventListener("change", () => document.querySelectorAll("details.narr").forEach((d) => (d.open = narr.checked)));

  const q = new URLSearchParams(location.search).get("t");
  if (q) vid.addEventListener("loadedmetadata", () => seek(+q, false), { once: true });
})();
