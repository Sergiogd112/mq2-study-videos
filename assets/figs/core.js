/* Figure engine for the study notes: tiny SVG helpers, sliders, and an animation loop that only runs
   for figures on screen. Every figure registers itself with fig(name, {title, w, h, init}). */
"use strict";
const FIGS = {};
const NS = "http://www.w3.org/2000/svg";
const C = {
  ink: "#1f2937", mid: "#6b7280", soft: "#d1d5db", faint: "#f3f4f6", bg: "#ffffff",
  blue: "#2563eb", sky: "#93c5fd", orange: "#ea580c", amber: "#f59e0b", green: "#16a34a", lime: "#86efac",
  red: "#dc2626", rose: "#fda4af", purple: "#7c3aed", teal: "#0d9488", yellow: "#eab308", brown: "#92400e",
  metal: "#9ca3af", steel: "#cbd5e1", hot: "#f97316", cold: "#60a5fa",
};
const TAU = Math.PI * 2, rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const fmt = (x, n = 1) => (Math.abs(x) >= 1e4 ? x.toFixed(0) : x.toFixed(n)).replace("-", "−");

function fig(name, spec) { FIGS[name] = spec; }

/* Text on the white figure canvas uses darker shades of the light diagram colours (≥ 4.5:1 contrast);
   strokes and fills keep the original colours. */
const TEXT_INK = {
  [C.amber]: "#b45309", [C.orange]: "#c2410c", [C.yellow]: "#a16207", [C.green]: "#15803d", [C.teal]: "#0f766e",
  [C.sky]: "#0369a1", [C.lime]: "#15803d", [C.cold]: "#1d4ed8", [C.hot]: "#c2410c", [C.metal]: "#4b5563",
  [C.soft]: "#6b7280", [C.steel]: "#4b5563", [C.rose]: "#be123c",
};

/* Build the drawing API for one figure. */
function makeApi(holder, spec, rec) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${spec.w || 640} ${spec.h || 320}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", spec.title || "figure");
  holder.appendChild(svg);
  const defs = document.createElementNS(NS, "defs");
  svg.appendChild(defs);
  const controls = document.createElement("div");
  controls.className = "fig-controls";
  holder.appendChild(controls);
  const markers = {};
  const frames = [];
  let cur = svg;
  const api = {
    svg, C, W: spec.w || 640, H: spec.h || 320,
    el(tag, attrs = {}, parent) {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
      (parent || cur).appendChild(e);
      return e;
    },
    /* Attribute writes are cached per element: unchanged values cost nothing (most frames change only a few). */
    set(e, attrs) { const c = e._c || (e._c = {}); for (const k in attrs) { let v = attrs[k]; if (k === "fill" && e.tagName === "text" && TEXT_INK[v]) v = TEXT_INK[v]; if (c[k] !== v) { c[k] = v; e.setAttribute(k, v); } } return e; },
    g(attrs = {}, parent) { return api.el("g", attrs, parent); },
    within(group, fn) { const prev = cur; cur = group; fn(); cur = prev; return group; },
    marker(color) {
      if (markers[color]) return markers[color];
      const id = "m" + Math.random().toString(36).slice(2, 8);
      const m = api.el("marker", { id, viewBox: "0 0 10 10", refX: 8.5, refY: 5, markerWidth: 6.5, markerHeight: 6.5, orient: "auto-start-reverse", markerUnits: "strokeWidth" }, defs);
      api.el("path", { d: "M0,0 L10,5 L0,10 z", fill: color }, m);
      return (markers[color] = `url(#${id})`);
    },
    line(x1, y1, x2, y2, o = {}) {
      return api.el("line", { x1, y1, x2, y2, stroke: o.color || C.ink, "stroke-width": o.width || 2, "stroke-dasharray": o.dash, "stroke-linecap": "round", "marker-end": o.arrow ? api.marker(o.color || C.ink) : undefined, "marker-start": o.arrow2 ? api.marker(o.color || C.ink) : undefined, opacity: o.opacity }, o.parent);
    },
    arrow(x1, y1, x2, y2, color = C.ink, width = 2.2, o = {}) { return api.line(x1, y1, x2, y2, { ...o, color, width, arrow: true }); },
    path(d, o = {}) {
      return api.el("path", { d, fill: o.fill || "none", stroke: o.color === undefined ? C.ink : o.color, "stroke-width": o.width === undefined ? 2 : o.width, "stroke-dasharray": o.dash, "stroke-linejoin": "round", "stroke-linecap": "round", opacity: o.opacity, "marker-end": o.arrow ? api.marker(o.color || C.ink) : undefined, transform: o.transform }, o.parent);
    },
    rect(x, y, w, h, o = {}) {
      return api.el("rect", { x, y, width: w, height: h, rx: o.r || 0, fill: o.fill || "none", stroke: o.color === undefined ? C.ink : o.color, "stroke-width": o.width === undefined ? 2 : o.width, "stroke-dasharray": o.dash, opacity: o.opacity, transform: o.transform }, o.parent);
    },
    circle(cx, cy, r, o = {}) {
      return api.el("circle", { cx, cy, r, fill: o.fill || "none", stroke: o.color === undefined ? C.ink : o.color, "stroke-width": o.width === undefined ? 2 : o.width, "stroke-dasharray": o.dash, opacity: o.opacity }, o.parent);
    },
    poly(pts, o = {}) {
      return api.el("polygon", { points: pts.map((p) => p.join(",")).join(" "), fill: o.fill || "none", stroke: o.color === undefined ? C.ink : o.color, "stroke-width": o.width === undefined ? 2 : o.width, opacity: o.opacity, transform: o.transform }, o.parent);
    },
    /* Text with light markup: x_1, x_{12}, x^2, x^{-1}. */
    text(x, y, str, o = {}) {
      const t = api.el("text", { x, y, "font-size": o.size || 15, "text-anchor": o.anchor || "middle", fill: TEXT_INK[o.color] || o.color || C.ink, "font-weight": o.weight, "font-style": o.italic ? "italic" : undefined, "dominant-baseline": o.base || "middle", transform: o.rotate ? `rotate(${o.rotate} ${x} ${y})` : undefined, opacity: o.opacity }, o.parent);
      api.setText(t, str);
      return t;
    },
    setText(t, str) {
      str = String(str);
      if (t._s === str) return t;
      t._s = str;
      while (t.firstChild) t.removeChild(t.firstChild);
      const parts = [];
      let buf = "", i = 0;
      while (i < str.length) {
        const ch = str[i];
        if ((ch === "_" || ch === "^") && i + 1 < str.length) {
          if (buf) parts.push([buf, 0]), (buf = "");
          let j = i + 1, body = "";
          if (str[j] === "{") { const k = str.indexOf("}", j); body = str.slice(j + 1, k < 0 ? str.length : k); j = k < 0 ? str.length : k + 1; }
          else { while (j < str.length && /[A-Za-z0-9.αβγδεηθλμπρστφψωΔ′'*+−-]/.test(str[j]) && !(j > i + 1 && /[+−-]/.test(str[j]))) j++; body = str.slice(i + 1, j); }
          parts.push([body, ch === "_" ? 4 : -6]);
          i = j;
        } else { buf += ch; i++; }
      }
      if (buf) parts.push([buf, 0]);
      let shift = 0;
      for (const [s, dy] of parts) {
        const sp = document.createElementNS(NS, "tspan");
        const d = dy - shift;
        if (d) sp.setAttribute("dy", d);
        if (dy) sp.setAttribute("font-size", "72%");
        sp.textContent = s;
        t.appendChild(sp);
        shift = dy;
      }
      return t;
    },
    /* A plot box: maps data (x, y) into the rectangle [x0, x0+w] × [y0, y0+h]. */
    plot(x0, y0, w, h, xr, yr, o = {}) {
      const P = {
        X: (x) => x0 + ((x - xr[0]) / (xr[1] - xr[0])) * w,
        Y: (y) => y0 + h - ((y - yr[0]) / (yr[1] - yr[0])) * h,
        x0, y0, w, h,
        axes(xl = "", yl = "", oo = {}) {
          const ay = oo.xAt === undefined ? y0 + h : P.Y(oo.xAt);
          const ax = oo.yAt === undefined ? x0 : P.X(oo.yAt);
          api.arrow(x0 - 4, ay, x0 + w + 12, ay, C.ink, 1.6);
          api.arrow(ax, y0 + h + 4, ax, y0 - 12, C.ink, 1.6);
          api.text(x0 + w + 12, ay + 16, xl, { anchor: "end", size: 14, color: C.mid });
          api.text(ax + 8, y0 - 12, yl, { anchor: "start", size: 14, color: C.mid });
        },
        d(fn, a = xr[0], b = xr[1], n = 240) {
          let s = "";
          for (let i = 0; i <= n; i++) {
            const x = a + ((b - a) * i) / n, y = fn(x);
            if (!isFinite(y)) continue;
            s += (s ? "L" : "M") + P.X(x).toFixed(2) + "," + P.Y(clamp(y, yr[0] - (yr[1] - yr[0]), yr[1] + (yr[1] - yr[0]))).toFixed(2);
          }
          return s;
        },
        curve(fn, oo = {}) { return api.path(P.d(fn, oo.a, oo.b, oo.n), oo); },
      };
      if (o.frame) api.rect(x0, y0, w, h, { color: C.soft, width: 1 });
      return P;
    },
    slider(label, min, max, step, value, cb, show = (v) => v) {
      const wrap = document.createElement("label");
      wrap.className = "fig-slider";
      const name = document.createElement("span");
      name.textContent = label;
      const inp = document.createElement("input");
      Object.assign(inp, { type: "range", min, max, step, value });
      const out = document.createElement("output");
      const upd = () => { out.textContent = show(+inp.value); cb(+inp.value); api.invalidate(); };
      inp.addEventListener("input", upd);
      wrap.append(name, inp, out);
      controls.appendChild(wrap);
      setTimeout(upd, 0);
      return inp;
    },
    buttons(labels, cb, start = 0) {
      const wrap = document.createElement("div");
      wrap.className = "fig-buttons";
      const bs = labels.map((l, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = l;
        b.addEventListener("click", () => { bs.forEach((x) => x.classList.remove("on")); b.classList.add("on"); cb(i, l); api.invalidate(); });
        wrap.appendChild(b);
        return b;
      });
      controls.appendChild(wrap);
      setTimeout(() => bs[start] && bs[start].click(), 0);
      return bs;
    },
    note(str) { const p = document.createElement("div"); p.className = "fig-readout"; p.textContent = str; controls.appendChild(p); return p; },
    loop(fn) { frames.push(fn); },
    /* Ask for one redraw even while paused (sliders, buttons, toggles). */
    invalidate() { if (rec) { rec.dirty = true; Anim.kick(); } },
  };
  svg.addEventListener("click", () => api.invalidate());
  return { api, frames, svg };
}

/* Animation manager: one rAF loop at most 30 fps that runs only while a visible figure is playing or needs a redraw.
   Reduced motion pauses everything on a representative frame; the preference is followed live. */
const Anim = (() => {
  const live = new Set(), all = new Set();
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const STEP = 1 / 30;
  let raf = 0, last = null, acc = 0;
  const wanted = () => { for (const f of live) if (!f.paused || f.dirty) return true; return false; };
  const run = (f, dt) => { for (const fn of f.frames) fn(f.t, dt); };
  function tick(now) {
    raf = 0;
    const dt = last === null ? STEP : Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    const due = acc >= STEP - 0.002;
    for (const f of live) {
      if (!f.paused && due) { f.t += acc; run(f, acc); f.dirty = false; }
      else if (f.dirty) { run(f, 0); f.dirty = false; }
    }
    if (due) acc = 0;
    if (wanted()) raf = requestAnimationFrame(tick); else last = null;
  }
  const kick = () => { if (!raf && wanted()) raf = requestAnimationFrame(tick); };
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    for (const e of es) { const f = e.target._fig; if (!f) continue; if (e.isIntersecting) { live.add(f); f.dirty = true; } else live.delete(f); }
    kick();
  }, { rootMargin: "100px" }) : null;
  const setReduce = (r) => { for (const f of all) { f.paused = r; if (r) { f.t = Math.max(f.t, 6); f.dirty = true; } f.paint && f.paint(); } kick(); };
  if (mq.addEventListener) mq.addEventListener("change", (e) => setReduce(e.matches));
  document.addEventListener("visibilitychange", () => { last = null; kick(); });
  return {
    kick,
    add(holder, f) {
      holder._fig = f;
      all.add(f);
      f.paused = mq.matches;
      if (mq.matches) f.t = 6; // show a representative, well-developed frame when motion is reduced
      run(f, 0);
      f.dirty = false;
      if (!f.frames.length) return;
      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "fig-play";
      f.paint = () => (badge.textContent = f.paused ? "▶ play" : "❚❚ pause");
      badge.addEventListener("click", () => { f.paused = !f.paused; f.paint(); kick(); });
      f.paint();
      const ctl = holder.querySelector(".fig-controls");
      ctl ? ctl.prepend(badge) : holder.appendChild(badge);
      if (io) io.observe(holder); else { live.add(f); kick(); }
    },
  };
})();

function mountOne(node) {
  const spec = FIGS[node.dataset.fig];
  const holder = node.querySelector(".figbox");
  if (!spec) { holder.textContent = `missing figure: ${node.dataset.fig}`; return; }
  if (holder.dataset.done) return;
  holder.dataset.done = 1;
  holder.style.aspectRatio = "";
  const ph = node.querySelector(".ctl-ph");
  if (ph) ph.remove();
  const rec = { frames: null, t: 0, paused: false, dirty: false };
  const { api, frames } = makeApi(holder, spec, rec);
  rec.frames = frames;
  try { spec.init(api); } catch (e) { console.error("figure", node.dataset.fig, e); holder.insertAdjacentHTML("beforeend", `<p class="fig-err">figure error: ${e.message}</p>`); }
  const cap = node.querySelector("figcaption");
  if (cap && !cap.textContent.trim()) cap.innerHTML = `<b>${spec.title}.</b> ${spec.caption || ""}`;
  Anim.add(holder, rec);
}

/* Figures are built only when they come within ~600 px of the viewport (their space is reserved in the HTML). */
function mountFigures(root = document) {
  const nodes = [...root.querySelectorAll("figure.fig[data-fig]")];
  if (!("IntersectionObserver" in window)) { nodes.forEach(mountOne); return; }
  const lazy = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { lazy.unobserve(e.target); mountOne(e.target); } }), { rootMargin: "600px 0px" });
  nodes.forEach((n) => lazy.observe(n));
}

/* Shared drawing pieces used by several subjects. */
const Parts = {
  /* Simple aircraft silhouette pointing up (north), centred at 0,0, scale s. */
  plane(api, s = 1, color = C.ink, parent) {
    const d = `M0,${-22 * s} C${3 * s},${-18 * s} ${3 * s},${-8 * s} ${3 * s},${-4 * s} L${22 * s},${4 * s} L${22 * s},${8 * s} L${3 * s},${4 * s} L${2.5 * s},${15 * s} L${8 * s},${20 * s} L${8 * s},${23 * s} L0,${21 * s} L${-8 * s},${23 * s} L${-8 * s},${20 * s} L${-2.5 * s},${15 * s} L${-3 * s},${4 * s} L${-22 * s},${8 * s} L${-22 * s},${4 * s} L${-3 * s},${-4 * s} C${-3 * s},${-8 * s} ${-3 * s},${-18 * s} 0,${-22 * s} z`;
    return api.path(d, { fill: color, color: "none", parent });
  },
  /* Resistor zig-zag from (x1,y) to (x2,y), horizontal. */
  resistor(api, x1, y, x2, label, o = {}) {
    const n = 6, len = x2 - x1, lead = len * 0.2, zz = (len - 2 * lead) / n;
    let d = `M${x1},${y} L${x1 + lead},${y}`;
    for (let i = 0; i < n; i++) d += ` L${x1 + lead + zz * (i + 0.5)},${y + (i % 2 ? 8 : -8)}`;
    d += ` L${x2 - lead},${y} L${x2},${y}`;
    api.path(d, { color: o.color || C.ink, width: 2 });
    if (label) api.text((x1 + x2) / 2, y - 18, label, { size: 14 });
  },
  resistorV(api, x, y1, y2, label, o = {}) {
    const n = 6, len = y2 - y1, lead = len * 0.2, zz = (len - 2 * lead) / n;
    let d = `M${x},${y1} L${x},${y1 + lead}`;
    for (let i = 0; i < n; i++) d += ` L${x + (i % 2 ? 8 : -8)},${y1 + lead + zz * (i + 0.5)}`;
    d += ` L${x},${y2 - lead} L${x},${y2}`;
    api.path(d, { color: o.color || C.ink });
    if (label) api.text(x + 16, (y1 + y2) / 2, label, { size: 14, anchor: "start" });
  },
  inductor(api, x1, y, x2, label) {
    const n = 4, lead = (x2 - x1) * 0.15, w = (x2 - x1 - 2 * lead) / n;
    let d = `M${x1},${y} L${x1 + lead},${y}`;
    for (let i = 0; i < n; i++) d += ` a${w / 2},${w / 2} 0 0 1 ${w},0`;
    d += ` L${x2},${y}`;
    api.path(d);
    if (label) api.text((x1 + x2) / 2, y - 22, label, { size: 14 });
  },
  inductorV(api, x, y1, y2, label) {
    const n = 4, lead = (y2 - y1) * 0.15, w = (y2 - y1 - 2 * lead) / n;
    let d = `M${x},${y1} L${x},${y1 + lead}`;
    for (let i = 0; i < n; i++) d += ` a${w / 2},${w / 2} 0 0 1 0,${w}`;
    d += ` L${x},${y2}`;
    api.path(d);
    if (label) api.text(x + 18, (y1 + y2) / 2, label, { size: 14, anchor: "start" });
  },
  capacitor(api, x1, y, x2, label) {
    const m = (x1 + x2) / 2;
    api.line(x1, y, m - 5, y); api.line(m + 5, y, x2, y);
    api.line(m - 5, y - 13, m - 5, y + 13, { width: 3 }); api.line(m + 5, y - 13, m + 5, y + 13, { width: 3 });
    if (label) api.text(m, y - 24, label, { size: 14 });
  },
  capacitorV(api, x, y1, y2, label) {
    const m = (y1 + y2) / 2;
    api.line(x, y1, x, m - 5); api.line(x, m + 5, x, y2);
    api.line(x - 13, m - 5, x + 13, m - 5, { width: 3 }); api.line(x - 13, m + 5, x + 13, m + 5, { width: 3 });
    if (label) api.text(x + 20, m, label, { size: 14, anchor: "start" });
  },
  ground(api, x, y) { api.line(x, y, x, y + 8); api.line(x - 12, y + 8, x + 12, y + 8); api.line(x - 7, y + 13, x + 7, y + 13); api.line(x - 3, y + 18, x + 3, y + 18); },
  source(api, x, y, r, label) { api.circle(x, y, r, { fill: C.bg }); api.path(`M${x - r * 0.5},${y} q${r * 0.25},${-r * 0.5} ${r * 0.5},0 t${r * 0.5},0`, { width: 1.8 }); if (label) api.text(x - r - 8, y, label, { anchor: "end", size: 14 }); },
  /* Amplifier triangle pointing right. */
  amp(api, x, y, s, label, o = {}) {
    api.poly([[x - s, y - s], [x + s, y], [x - s, y + s]], { fill: o.fill || "#eff6ff", color: o.color || C.blue });
    if (label) api.text(x - s * 0.2, y, label, { size: 13 });
  },
  box(api, x, y, w, h, label, o = {}) {
    api.rect(x - w / 2, y - h / 2, w, h, { r: 6, fill: o.fill || "#f8fafc", color: o.color || C.ink, width: o.width || 1.8 });
    if (label) String(label).split("\n").forEach((l, i, a) => api.text(x, y + (i - (a.length - 1) / 2) * 16, l, { size: o.size || 14, color: o.textColor || C.ink }));
  },
  mixer(api, x, y, r = 16) { api.circle(x, y, r, { fill: C.bg }); const k = r * 0.7; api.line(x - k, y - k, x + k, y + k); api.line(x - k, y + k, x + k, y - k); },
  /* Moving dots along a polyline: returns updater(t). */
  flowDots(api, pts, o = {}) {
    const segs = [];
    let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push([pts[i - 1], pts[i], L, l]); L += l; }
    const n = o.n || Math.max(3, Math.round(L / (o.gap || 28)));
    const dots = Array.from({ length: n }, () => api.circle(0, 0, o.r || 3.2, { fill: o.color || C.blue, color: "none" }));
    const at = (s) => { s = ((s % L) + L) % L; for (const [a, b, l0, l] of segs) if (s <= l0 + l) { const u = (s - l0) / l; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; } return pts[pts.length - 1]; };
    const upd = (t, speed = o.speed || 40) => dots.forEach((d, i) => { const [x, y] = at(t * speed + (i * L) / n); d.setAttribute("cx", x); d.setAttribute("cy", y); });
    upd(0);
    upd.dots = dots;
    upd.show = (v) => dots.forEach((d) => d.setAttribute("opacity", v ? 1 : 0));
    return upd;
  },
};

document.addEventListener("DOMContentLoaded", () => mountFigures());
