/* Formula sheets. The compact two-column A4 layout is the "pdf" class: added for printing (and by the PDF export,
   which opens the page with ?pdf), so the layout measured here is the one that gets printed. A formula wider than its
   column switches to its two-line version when it has one, and is then shrunk to fit if it still overflows. */
"use strict";
(() => {
  const root = document.documentElement;
  const debug = /[?&]debug\b/.test(location.search);
  const ratio = (box) => {
    const d = box.querySelector(".katex-display"), k = d && d.querySelector(".katex");
    if (!k) return [1, null];
    k.style.fontSize = "";
    const avail = d.clientWidth, need = k.scrollWidth;
    return [need > avail && avail > 0 ? (avail - 2) / need : 1, k];
  };
  const shrink = (k, r) => { if (k && r < 1) k.style.fontSize = (parseFloat(getComputedStyle(k).fontSize) * Math.max(0.5, r)).toFixed(2) + "px"; };
  const fit = () => {
    document.querySelectorAll(".fm").forEach((fm) => {
      const one = fm.querySelector(".f1"), two = fm.querySelector(".f2");
      if (!one) return;
      one.hidden = false;
      if (two) two.hidden = true;
      let [r, k] = ratio(one);
      if (r < 0.86 && two) {
        one.hidden = true;
        two.hidden = false;
        [r, k] = ratio(two);
      }
      shrink(k, r);
      if (debug && r < 1) console.log("FIT " + r.toFixed(2) + (two && !two.hidden ? " (2 lines) " : " ") + (fm.dataset.i || ""));
    });
  };
  if (/[?&]pdf\b/.test(location.search)) root.classList.add("pdf");
  let printing = false;
  window.addEventListener("beforeprint", () => { printing = !root.classList.contains("pdf"); root.classList.add("pdf"); fit(); });
  window.addEventListener("afterprint", () => { if (printing) { root.classList.remove("pdf"); fit(); } });
  let t = 0;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fit, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();
