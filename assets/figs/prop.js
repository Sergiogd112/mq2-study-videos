/* Propulsion figures: engine cutaways, components, cycle diagrams, turbomachinery stages. */
"use strict";

/* Temperature → colour (cold blue … hot red). */
const TEMP_LUT = (() => {
  const stops = [[0, [59, 130, 246]], [0.3, [34, 197, 94]], [0.55, [234, 179, 8]], [0.8, [249, 115, 22]], [1, [220, 38, 38]]];
  return Array.from({ length: 64 }, (_, n) => {
    const u = n / 63;
    for (let i = 1; i < stops.length; i++) if (u <= stops[i][0]) { const [u0, c0] = stops[i - 1], [u1, c1] = stops[i], k = (u - u0) / (u1 - u0); return `rgb(${c0.map((c, j) => Math.round(lerp(c, c1[j], k))).join(",")})`; }
    return "rgb(220,38,38)";
  });
})();
function tempColor(T, lo = 220, hi = 1800) { return TEMP_LUT[Math.round(clamp((T - lo) / (hi - lo), 0, 1) * 63)]; }

/* Engine helper: axisymmetric annulus between hub(x) and tip(x), mirrored about y = cy. */
const Eng = {
  outline(a, cy, xs, f, o = {}) {
    const top = xs.map((x) => `${x},${(cy - f(x)).toFixed(1)}`), bot = xs.map((x) => `${x},${(cy + f(x)).toFixed(1)}`);
    a.path("M" + top.join(" L"), o); a.path("M" + bot.join(" L"), o);
  },
  band(a, cy, xs, fo, fi, o = {}) {
    const up = xs.map((x) => `${x},${(cy - fo(x)).toFixed(1)}`).concat(xs.slice().reverse().map((x) => `${x},${(cy - fi(x)).toFixed(1)}`));
    const dn = xs.map((x) => `${x},${(cy + fo(x)).toFixed(1)}`).concat(xs.slice().reverse().map((x) => `${x},${(cy + fi(x)).toFixed(1)}`));
    a.path("M" + up.join(" L") + "z", o); a.path("M" + dn.join(" L") + "z", o);
  },
  /* A rotating blade row: lines whose spacing shimmers to suggest rotation. Returns updater(t). */
  row(a, cy, x, rIn, rOut, o = {}) {
    const n = o.n || 4, ls = [];
    for (const s of [-1, 1]) for (let k = 0; k < n; k++) ls.push([a.line(x, cy + s * rIn, x, cy + s * rOut, { color: o.color || C.metal, width: o.width || 3 }), k, s]);
    if (o.stator) return () => {};
    return (t) => ls.forEach(([l, k, s]) => { const ph = t * (o.speed || 6) + (k * TAU) / n; const dx = Math.sin(ph) * (o.chord || 5); a.set(l, { x1: x + dx * 0.4, x2: x - dx, opacity: 0.35 + 0.65 * Math.abs(Math.cos(ph)) }); });
  },
  /* Flow particles moving through the engine; u(x) speed, T(x) temperature, r(x, f) radius for fraction f. */
  particles(a, cy, n, u, T, rad, xmax, o = {}) {
    const ps = Array.from({ length: n }, (_, i) => ({ x: (i / n) * xmax, f: ((i * 0.618) % 1) * 0.8 + 0.1, s: i % 2 ? 1 : -1, c: a.circle(0, 0, o.r || 2.6, { fill: C.blue, color: "none" }) }));
    return (t, dt) => ps.forEach((p) => {
      p.x += u(p.x) * dt;
      if (p.x > xmax) p.x = o.x0 || 0;
      const r = rad(p.x, p.f);
      a.set(p.c, { cx: p.x, cy: cy + p.s * r, fill: tempColor(T(p.x)) });
    });
  },
};

/* ------------------------------------------------------------------ PROP-1 */
fig("turbojet", {
  title: "Single-spool turbojet: components and station numbers", w: 720, h: 360,
  caption: "Inlet (0 → 2), compressor (2 → 3), burner (3 → 4), turbine (4 → 5) driving the compressor through the shaft, nozzle (5 → 9). Particles are coloured by total temperature. The bars are the station totals of the supersonic turbojet worked example (M₀ = 2, 12 km, πc = 10, Tt4 = 1 800 K).",
  init(a) {
    const cy = 130;
    const tip = (x) => x < 90 ? 70 - (x - 20) * 0.06 : x < 260 ? lerp(66, 46, (x - 90) / 170) : x < 380 ? 46 + 8 * Math.sin(((x - 260) / 120) * Math.PI) : x < 450 ? lerp(46, 58, (x - 380) / 70) : lerp(58, 38, (x - 450) / 110);
    const hub = (x) => x < 40 ? 0 : x < 90 ? 26 * Math.sqrt((x - 40) / 50) : x < 260 ? lerp(26, 34, (x - 90) / 170) : x < 380 ? lerp(34, 30, (x - 260) / 120) : x < 450 ? 30 : x < 525 ? 30 * Math.sqrt(Math.max(0, (525 - x) / 75)) : 0;
    const xs = Array.from({ length: 136 }, (_, i) => 20 + i * 4);
    Eng.band(a, cy, xs, (x) => tip(x) + 9, tip, { fill: "#cbd5e1", color: C.mid, width: 1.2 });
    Eng.band(a, cy, xs.filter((x) => x >= 40 && x <= 525), hub, () => 0, { fill: "#e2e8f0", color: C.mid, width: 1.2 });
    a.rect(110, cy - 4, 330, 8, { fill: C.orange, color: "none", opacity: 0.85 }); a.text(330, cy + 20, "shaft: turbine drives compressor", { size: 11, color: C.orange });
    // combustor liner and flame
    Eng.band(a, cy, xs.filter((x) => x >= 270 && x <= 370), (x) => tip(x) - 4, (x) => hub(x) + 4, { fill: "#fff7ed", color: C.orange, width: 1.2 });
    const flames = [-1, 1].map((s) => a.path("", { fill: "#fb923c", color: C.red, width: 1, opacity: 0.85 }));
    a.circle(272, cy - 40, 4, { fill: C.brown, color: "none" }); a.circle(272, cy + 40, 4, { fill: C.brown, color: "none" });
    const rows = [];
    for (let k = 0; k < 8; k++) { const x = 100 + k * 20; rows.push(Eng.row(a, cy, x, hub(x), tip(x), { color: C.blue, speed: 7 })); a.line(x + 10, cy - hub(x + 10), x + 10, cy - tip(x + 10), { color: C.soft, width: 2 }); a.line(x + 10, cy + hub(x + 10), x + 10, cy + tip(x + 10), { color: C.soft, width: 2 }); }
    for (const x of [392, 425]) { a.line(x - 9, cy - hub(x), x - 9, cy - tip(x), { color: C.soft, width: 2 }); a.line(x - 9, cy + hub(x), x - 9, cy + tip(x), { color: C.soft, width: 2 }); rows.push(Eng.row(a, cy, x, hub(x), tip(x), { color: C.red, speed: 7 })); }
    const st = [[12, "0"], [90, "2"], [262, "3"], [378, "4"], [452, "5"], [560, "9"]];
    st.forEach(([x, s]) => { a.line(x, cy - 92, x, cy + 92, { color: C.purple, width: 1, dash: "3 3" }); a.text(x, cy - 100, s, { size: 14, weight: 700, color: C.purple }); });
    [["inlet", 55], ["compressor", 175], ["burner", 320], ["turbine", 415], ["nozzle", 505]].forEach(([n, x]) => a.text(x, cy + 104, n, { size: 12, weight: 600 }));
    const Ttx = (x) => x < 90 ? 390 : x < 260 ? lerp(390, 810, (x - 90) / 170) : x < 290 ? 810 : x < 360 ? lerp(810, 1800, (x - 290) / 70) : x < 380 ? 1800 : x < 450 ? lerp(1800, 1468, (x - 380) / 70) : 1468;
    const u = (x) => x < 90 ? 60 : x < 260 ? 45 : x < 380 ? 35 : x < 450 ? 70 : x < 560 ? 110 : 160;
    const parts = Eng.particles(a, cy, 44, u, Ttx, (x, f) => x < 20 || x > 560 ? f * (x > 560 ? 36 : 60) : hub(x) + f * (tip(x) - hub(x)), 715);
    const pl = a.plot(40, 255, 560, 80, [0, 700], [0, 2000]);
    a.line(40, 335, 620, 335, { color: C.ink, width: 1 });
    [[12, 90, 390], [90, 262, 390], [262, 378, 810], [378, 452, 1800], [452, 560, 1468]].forEach(([x0, x1, T]) => { a.rect(x0 + 2, pl.Y(T), x1 - x0 - 4, 335 - pl.Y(T), { fill: tempColor(T), color: "none", opacity: 0.75 }); a.text((x0 + x1) / 2, pl.Y(T) - 8, `${T} K`, { size: 11, weight: 700 }); });
    a.text(640, 300, "T_t at the", { size: 11, color: C.mid }); a.text(640, 314, "station", { size: 11, color: C.mid });
    a.loop((t, dt) => {
      rows.forEach((r) => r(t)); parts(t, dt);
      flames.forEach((f, i) => { const s = i ? 1 : -1, w = 6 + 3 * Math.sin(t * 13 + i); a.set(f, { d: `M276,${cy + s * 40} Q${310 + 10 * Math.sin(t * 9)},${cy + s * (40 - w)} ${345 + 8 * Math.sin(t * 7 + i)},${cy + s * 40} Q${310},${cy + s * (40 + w)} 276,${cy + s * 40} z` }); });
    });
  },
});

fig("stagnation", {
  title: "Static and total quantities; what a shock does", w: 680, h: 300,
  caption: "Bringing the flow to rest adiabatically raises T to Tt = T(1 + (γ−1)/2·M²) whatever the losses; Pt = P(Tt/T)^{γ/(γ−1)} needs a REVERSIBLE deceleration. Through a normal shock Tt is kept but Pt drops: that is why a supersonic inlet has τd = 1 but πd < 1.",
  init(a) {
    a.rect(20, 60, 300, 80, { fill: "#f0f9ff", color: C.soft });
    const parts = Parts.flowDots(a, [[20, 85], [300, 85]], { color: C.blue, gap: 26, speed: 120 });
    const parts2 = Parts.flowDots(a, [[20, 115], [300, 115]], { color: C.blue, gap: 26, speed: 120 });
    a.path("M300,100 L250,100 M300,100 L300,170 L320,170", { width: 3 }); a.text(330, 172, "Pitot probe: measures Pt", { size: 12, anchor: "start" });
    const shock = a.line(190, 60, 190, 140, { color: C.red, width: 4 });
    const bars = a.g();
    const out = [0, 1, 2, 3].map((i) => a.text(360, 70 + i * 24, "", { size: 14, anchor: "start", weight: i === 3 ? 700 : 400 }));
    const st = { M: 0.8, shock: false };
    const g = 1.4;
    const draw = () => {
      const k = 1 + ((g - 1) / 2) * st.M ** 2, TtT = k, PtP = k ** (g / (g - 1));
      let ps = 1;
      if (st.shock && st.M > 1) { const M2 = st.M ** 2; ps = (((g + 1) * M2) / ((g - 1) * M2 + 2)) ** (g / (g - 1)) * ((g + 1) / (2 * g * M2 - (g - 1))) ** (1 / (g - 1)); }
      a.set(shock, { opacity: st.shock && st.M > 1 ? 1 : 0 });
      a.setText(out[0], `Tt/T = 1 + 0.2 M² = ${TtT.toFixed(3)}`);
      a.setText(out[1], `Pt/P (isentropic) = ${PtP.toFixed(3)}`);
      a.setText(out[2], st.shock && st.M > 1 ? `normal shock: Tt kept, Pt₂/Pt₁ = ${ps.toFixed(3)}` : "no shock: Pt kept");
      a.setText(out[3], `Δs = −R ln(Pt₂/Pt₁) = ${(-287 * Math.log(ps)).toFixed(1)} J/(kg K)`);
      while (bars.firstChild) bars.removeChild(bars.firstChild);
      a.within(bars, () => {
        const base = 280, sc = 40;
        [["T", 1, C.blue], ["Tt", TtT, C.orange], ["P", 1, C.teal], ["Pt (ideal)", PtP, C.purple], ["Pt after shock", PtP * ps, C.red]].forEach(([n, v, c], i) => {
          const h = Math.min(4.5, v) * sc / 1.2;
          a.rect(40 + i * 60, base - h, 40, h, { fill: c, color: "none", opacity: 0.8 }); a.text(60 + i * 60, base + 12, n, { size: 10 }); a.text(60 + i * 60, base - h - 8, v.toFixed(2), { size: 10, weight: 700 });
        });
      });
    };
    a.slider("Mach M", 0, 3, 0.05, 0.8, (v) => { st.M = v; draw(); }, (v) => v.toFixed(2));
    a.buttons(["no shock", "normal shock (if M > 1)"], (i) => { st.shock = i === 1; draw(); });
    a.loop((t) => { parts(t, 60 + st.M * 60); parts2(t, 60 + st.M * 60); });
  },
});

fig("mfp_curve", {
  title: "The mass flow parameter and choking", w: 680, h: 300,
  caption: "MFP(M) = √γ·M·[1 + (γ−1)/2·M²]^{−(γ+1)/(2(γ−1))} peaks at M = 1: a duct passes the most mass per unit area when choked. A = ṁ√(R·Tt)/(Pt·MFP), so subsonic AND supersonic flows need a larger area than the throat: the convergent-divergent nozzle.",
  init(a) {
    const MFP = (g, M) => Math.sqrt(g) * M * (1 + ((g - 1) / 2) * M * M) ** (-(g + 1) / (2 * (g - 1)));
    const p = a.plot(50, 20, 360, 220, [0, 3], [0, 0.75]);
    p.axes("M", "MFP", { below: true });
    for (let k = 0; k <= 3; k++) a.text(p.X(k), 256, k, { size: 11, color: C.mid });
    p.curve((M) => MFP(1.4, M), { color: C.blue, width: 3 });
    p.curve((M) => MFP(1.3, M), { color: C.orange, width: 2.5, dash: "6 4" });
    a.text(p.X(2.2), p.Y(MFP(1.4, 2.2)) - 14, "γ = 1.4", { size: 12, color: C.blue }); a.text(p.X(2.5), p.Y(MFP(1.3, 2.5)) + 18, "γ = 1.3", { size: 12, color: C.orange });
    a.circle(p.X(1.11), p.Y(0.661), 5, { fill: C.orange, color: "none" }); a.text(p.X(1.11) + 8, p.Y(0.661) + 16, "0.661 (3A)", { size: 11, color: C.orange, anchor: "start" });
    const dot = a.circle(0, 0, 6, { fill: C.red, color: "none" });
    const nz = a.path("", { color: C.ink, width: 2, fill: "#e2e8f0" });
    const mk = a.line(0, 0, 0, 0, { color: C.red, width: 3 });
    const out = [0, 1].map((i) => a.text(560, 230 + i * 22, "", { size: 13, weight: i ? 700 : 400 }));
    const shape = (x) => 1 + 4 * (x - 0.35) ** 2; // A/A* along a C-D nozzle, x in [0,1]
    a.path(Array.from({ length: 61 }, (_, i) => { const x = i / 60, r = 18 * Math.sqrt(shape(x)); return (i ? "L" : "M") + (450 + x * 220) + "," + (110 - r); }).join("") + Array.from({ length: 61 }, (_, i) => { const x = 1 - i / 60, r = 18 * Math.sqrt(shape(x)); return "L" + (450 + x * 220) + "," + (110 + r); }).join("") + "z", { color: C.ink, width: 2, fill: "#f1f5f9" });
    a.text(450 + 0.35 * 220, 160, "throat: M = 1", { size: 11, color: C.mid });
    a.slider("Mach M", 0.1, 3, 0.01, 0.5, (M) => {
      const v = MFP(1.4, M), ar = MFP(1.4, 1) / v;
      a.set(dot, { cx: p.X(M), cy: p.Y(v) });
      // locate the nozzle station with this area ratio (subsonic side if M<1)
      const x = M < 1 ? 0.35 - Math.sqrt((ar - 1) / 4) : 0.35 + Math.sqrt((ar - 1) / 4);
      const xx = clamp(x, 0, 1), r = 18 * Math.sqrt(shape(xx));
      a.set(mk, { x1: 450 + xx * 220, x2: 450 + xx * 220, y1: 110 - r, y2: 110 + r, opacity: x >= 0 && x <= 1 ? 1 : 0.2 });
      a.setText(out[0], `MFP = ${v.toFixed(4)}`); a.setText(out[1], `A/A* = ${ar.toFixed(3)}`);
    }, (v) => v.toFixed(2));
  },
});

fig("axial_stage", {
  title: "An axial compressor stage: rotor, then stator", w: 700, h: 300,
  caption: "Unwrapped mean-line view. The rotor blades (blue) move at U and add swirl (work: cp ΔTt = U(v₂ − v₁)); the stator vanes (grey) are fixed and remove the swirl, diffusing the flow. The rotor diffuses the RELATIVE velocity (V₂R < V₁R) and the stator the ABSOLUTE velocity (V₃ < V₂); that diffusion is what limits the pressure rise per stage.",
  init(a) {
    const yR = 90, yS = 190, s = 70;
    a.text(20, yR, "rotor", { size: 14, weight: 700, anchor: "start", color: C.blue, halo: true, front: true }); a.text(20, yS, "stator", { size: 14, weight: 700, anchor: "start", color: C.mid, halo: true, front: true });
    // lean = −1: leading edge faces flow with swirl AGAINST U (rotor, relative frame V_R = V − U);
    // lean = +1: leading edge faces flow with swirl ALONG U (stator, absolute frame). Both turn the flow towards axial.
    const blade = (x, y, lean, col) => a.path(`M${x - lean * 12},${y - 28} Q${x + lean * 10},${y} ${x + lean * 12},${y + 28}`, { color: col, width: 7 });
    const rotor = a.g();
    a.within(rotor, () => { for (let k = -1; k < 11; k++) blade(k * s, yR, -1, C.blue); });
    for (let k = 1; k < 10; k++) blade(k * s - 30, yS, 1, C.mid);
    const U = a.arrow(300, 30, 400, 30, C.blue, 3); a.text(410, 30, "U", { size: 15, weight: 700, color: C.blue, anchor: "start" });
    const flow = Array.from({ length: 24 }, (_, i) => ({ y: (i * 37) % 270 + 10, x: 100 + ((i * 53) % 500), c: a.circle(0, 0, 3, { fill: C.orange, color: "none" }) }));
    a.text(680, 280, "flow (axial u + swirl)", { size: 12, color: C.orange, anchor: "end" });
    a.loop((t, dt) => {
      rotor.setAttribute("transform", `translate(${100 + ((t * 45) % s)},0)`);
      flow.forEach((p) => { const sw = p.y < yR - 30 ? 0.5 : p.y < yS - 30 ? 1.2 : 0.5; p.y += 45 * dt; p.x += 45 * sw * dt; if (p.y > 290) { p.y = 0; p.x = 100 + Math.random() * 500; } a.set(p.c, { cx: p.x % 700, cy: p.y }); });
    });
  },
});

fig("poly_eff", {
  title: "Polytropic versus isentropic efficiency", w: 680, h: 280,
  caption: "With the same small-stage (polytropic) efficiency e, a compressor's isentropic efficiency FALLS as π grows, while a turbine's RISES as it expands more (reheat): ηc = (π^ε − 1)/(π^{ε/e} − 1), ηt = (1 − π_t^{ε·e})/(1 − π_t^{ε}), ε = (γ−1)/γ. Use e to compare designs of different pressure ratio.",
  init(a) {
    const p = a.plot(60, 20, 560, 210, [1, 40], [0.78, 0.96]);
    p.axes("π_c, or 1/π_t", "η", { below: true });
    for (const k of [1, 10, 20, 30, 40]) a.text(p.X(k), 246, k, { size: 11, color: C.mid });
    for (const k of [0.8, 0.85, 0.9, 0.95]) a.text(56, p.Y(k), k.toFixed(2), { size: 11, color: C.mid, anchor: "end" });
    const cc = a.path("", { color: C.blue, width: 3 }), tc = a.path("", { color: C.red, width: 3 }), el = a.line(0, 0, 0, 0, { color: C.mid, dash: "5 4", width: 1.5 });
    const lc = a.text(0, 0, "compressor", { size: 13, color: C.blue, weight: 700 }), lt = a.text(0, 0, "turbine", { size: 13, color: C.red, weight: 700 });
    a.slider("polytropic efficiency e", 0.8, 0.95, 0.005, 0.9, (e) => {
      const g = 1.4, ep = (g - 1) / g;
      a.set(cc, { d: p.d((x) => (x ** ep - 1) / (x ** (ep / e) - 1), 1.01, 40) });
      a.set(tc, { d: p.d((x) => (1 - (1 / x) ** (ep * e)) / (1 - (1 / x) ** ep), 1.01, 40) });
      a.set(el, { x1: p.X(1), x2: p.X(40), y1: p.Y(e), y2: p.Y(e) });
      a.set(lc, { x: p.X(32), y: p.Y((32 ** ep - 1) / (32 ** (ep / e) - 1)) + 16 }); a.set(lt, { x: p.X(32), y: p.Y((1 - (1 / 32) ** (ep * e)) / (1 - (1 / 32) ** ep)) - 12 });
    }, (v) => v.toFixed(3));
  },
});

fig("combustor", {
  title: "Annular combustor (cut through one sector)", w: 700, h: 300,
  caption: "Compressor air (3) splits: some enters through the swirler around the fuel nozzle to burn in the primary zone near stoichiometric; the rest flows outside the liner and enters through secondary and dilution holes, cooling the walls and bringing the gas down to the Tt4 the turbine can take. Total pressure drops a few percent (πb ≈ 0.95; 0.90 in the exercises).",
  init(a) {
    a.path("M40,40 L660,40 M40,260 L660,260", { color: C.mid, width: 6 });
    a.path("M150,80 Q170,70 200,70 L560,80 L640,95 M150,220 Q170,230 200,230 L560,220 L640,205", { color: C.ink, width: 4 });
    a.path("M150,80 L150,220", { color: C.ink, width: 4 });
    for (const x of [260, 330, 420, 500]) for (const y of [72, 228]) a.rect(x - 8, y - 4, 16, 8, { fill: C.bg, color: "none" });
    a.rect(110, 140, 40, 20, { fill: C.brown, color: "none" }); a.line(60, 150, 110, 150, { color: C.brown, width: 5 }); a.text(80, 132, "fuel", { size: 12, color: C.brown });
    a.text(20, 30, "3: compressor air", { size: 12, anchor: "start", color: C.blue, weight: 700 });
    a.text(680, 30, "4: to the turbine", { size: 12, anchor: "end", color: C.red, weight: 700 });
    a.text(205, 150, "primary\nzone", { size: 11 }); a.text(450, 150, "dilution zone", { size: 12, weight: 600 });
    const flame = a.path("", { fill: "#fb923c", color: C.red, width: 1.5, opacity: 0.85 }), core = a.path("", { fill: "#fde047", color: "none", opacity: 0.9 });
    const outside = [Parts.flowDots(a, [[20, 55], [640, 55], [660, 100]], { color: C.blue, gap: 30, speed: 70 }), Parts.flowDots(a, [[20, 245], [640, 245], [660, 200]], { color: C.blue, gap: 30, speed: 70 })];
    const jets = [];
    for (const x of [260, 330, 420, 500]) for (const s of [-1, 1]) jets.push(Parts.flowDots(a, [[x, 150 + s * 105], [x, 150 + s * (x < 400 ? 50 : 25)]], { n: 2, color: C.sky, r: 2.8, speed: 40 }));
    const hot = Array.from({ length: 30 }, (_, i) => ({ x: 200 + ((i * 47) % 440), y: 95 + ((i * 29) % 110), c: a.circle(0, 0, 3, { fill: C.red, color: "none" }) }));
    a.loop((t, dt) => {
      outside.forEach((f) => f(t)); jets.forEach((f) => f(t));
      const w = 30 + 6 * Math.sin(t * 11);
      a.set(flame, { d: `M150,150 C190,${150 - w} ${250 + 10 * Math.sin(t * 7)},${150 - w * 0.8} ${300 + 12 * Math.sin(t * 9)},150 C${250},${150 + w * 0.8} 190,${150 + w} 150,150 z` });
      a.set(core, { d: `M150,150 C175,${150 - w * 0.5} 210,${150 - w * 0.4} ${240 + 8 * Math.sin(t * 13)},150 C210,${150 + w * 0.4} 175,${150 + w * 0.5} 150,150 z` });
      hot.forEach((p) => { p.x += 70 * dt; if (p.x > 640) p.x = 220; const T = p.x < 330 ? 2200 : lerp(2200, 1600, (p.x - 330) / 310); a.set(p.c, { cx: p.x, cy: p.y, fill: tempColor(T, 300, 2300) }); });
    });
  },
});

fig("turbine_stage", {
  title: "An axial turbine stage: nozzle guide vanes, then rotor", w: 700, h: 300,
  caption: "The stator (nozzle) turns and ACCELERATES the hot gas to a large swirl angle α₂ in the direction of blade motion U; the rotor blades take that swirl out and the shaft gets cp ΔTt = U(v₂ + v₃). The flow accelerates in both rows (favourable pressure gradient), so one turbine stage can drive several compressor stages. Blades are cooled with compressor air.",
  init(a) {
    const yS = 90, yR = 200, s = 74;
    a.text(20, yS, "nozzle (stator)", { size: 13, weight: 700, anchor: "start", color: C.mid, halo: true, front: true }); a.text(20, yR, "rotor", { size: 13, weight: 700, anchor: "start", color: C.red, halo: true, front: true });
    const vane = (x, y, col, k) => a.path(`M${x},${y - 32} C${x + 4},${y - 5} ${x - 10 * k},${y + 20} ${x - 40 * k},${y + 32}`, { color: col, width: 9 });
    for (let k = 1; k < 10; k++) vane(k * s - 40, yS, C.mid, -1);
    const rot = a.g();
    a.within(rot, () => { for (let k = -1; k < 11; k++) a.path(`M${k * s - 30},${yR - 32} C${k * s},${yR - 10} ${k * s},${yR + 10} ${k * s - 30},${yR + 32}` /* camber follows the RELATIVE flow: in towards +U, out towards −U */, { color: C.red, width: 9 }); });
    a.arrow(300, 270, 400, 270, C.red, 3); a.text(410, 270, "U", { size: 15, weight: 700, color: C.red, anchor: "start" });
    const ps = Array.from({ length: 28 }, (_, i) => ({ y: (i * 41) % 280, x: 60 + ((i * 59) % 560), c: a.circle(0, 0, 3, { fill: C.orange, color: "none" }) }));
    a.loop((t, dt) => {
      rot.setAttribute("transform", `translate(${100 + ((t * 70) % s)},0)`);
      ps.forEach((p) => { const sw = p.y < yS - 32 ? 0 : p.y < yR - 32 ? 1.6 : -0.1; /* nozzle swirl along U, rotor takes it out */ const sp = p.y < yS - 32 ? 40 : 75; p.y += sp * dt; p.x += sp * sw * dt; if (p.y > 290) { p.y = 0; p.x = 60 + Math.random() * 560; } a.set(p.c, { cx: ((p.x % 700) + 700) % 700, cy: p.y, fill: tempColor(p.y < yR ? 1600 : 1340, 800, 1700) }); });
    });
  },
});

fig("nozzle", {
  title: "Convergent nozzle: choked or matched? (exercise 1A core)", w: 700, h: 300,
  caption: "Assume choked: P9* = Pt9 / 1.832 (γ = 1.3, ideal). If P9* ≥ P0 the nozzle is choked (M9 = 1) and the jet leaves under-expanded, finishing its expansion outside (pressure thrust (P9 − P0)A9); otherwise it is matched (P9 = P0, M9 < 1). With ηn the core of 1A gives P9* = 0.447 bar > 0.227 bar: choked.",
  init(a) {
    a.path("M40,60 L300,60 L430,110 M40,240 L300,240 L430,190", { width: 5, color: C.mid });
    a.text(80, 40, "Pt9 = Pt5", { size: 13 }); a.text(430, 90, "exit 9", { size: 12, anchor: "start" });
    const plume = a.path("", { fill: "#fed7aa", color: C.orange, width: 1.5, opacity: 0.7 });
    const parts = Array.from({ length: 40 }, (_, i) => ({ x: 40 + ((i * 37) % 600), f: ((i * 0.618) % 1) * 1.8 - 0.9, c: a.circle(0, 0, 3, { fill: C.red, color: "none" }) }));
    const notes = [a.note(""), a.note("")];
    const out = [0, 1, 2, 3].map(() => ({ t: "" }));
    const show = () => { notes[0].textContent = out[0].t + " · " + out[1].t; notes[1].textContent = out[2].t + " · " + out[3].t; };
    const st = { Pt: 0.887, P0: 0.2273 };
    let M9 = 1, under = 1;
    const upd = () => {
      const crit = 1.832, Pst = st.Pt / crit;
      if (st.Pt <= st.P0) { M9 = 0; under = 1; out[0].t = `Pt9 = ${st.Pt.toFixed(3)} bar ≤ P0 = ${st.P0.toFixed(3)} bar`; out[1].t = "no forward flow"; out[2].t = "outside the nozzle model"; out[3].t = "raise Pt9 or lower P0"; show(); a.set(plume, { d: "" }); return; }
      if (Pst >= st.P0) { M9 = 1; under = Pst / st.P0; out[2].t = `P9* = ${Pst.toFixed(3)} bar ≥ P0 → CHOKED, M9 = 1`; out[3].t = `under-expanded: P9/P0 = ${under.toFixed(2)}, pressure thrust`; }
      else { under = 1; M9 = Math.sqrt(((st.Pt / st.P0) ** (0.3 / 1.3) - 1) / 0.15); out[2].t = `P9* = ${Pst.toFixed(3)} bar < P0 → MATCHED, P9 = P0`; out[3].t = `M9 = ${M9.toFixed(2)}, no pressure thrust`; }
      out[0].t = `Pt9 = ${st.Pt.toFixed(3)} bar, P0 = ${st.P0.toFixed(4)} bar`;
      out[1].t = `Pt9/P0 = ${(st.Pt / st.P0).toFixed(2)} (critical 1.832, ideal)`;
      show();
      const w = 40 + 30 * Math.log(under) * 1.5;
      a.set(plume, { d: `M430,110 Q${470},${150 - w - 10} 690,${150 - w} L690,${150 + w} Q470,${150 + w + 10} 430,190 z` });
    };
    a.slider("Pt9 (bar)", 0.25, 2, 0.001, 0.887, (v) => { st.Pt = v; upd(); }, (v) => v.toFixed(3));
    a.slider("P0 (bar)", 0.2, 1.013, 0.001, 0.2273, (v) => { st.P0 = v; upd(); }, (v) => v.toFixed(3));
    a.loop((t, dt) => parts.forEach((p) => {
      a.set(p.c, { opacity: st.Pt > st.P0 ? 1 : 0 });
      if (st.Pt <= st.P0) return;
      const sp = p.x < 300 ? 60 : p.x < 430 ? 90 + 80 * M9 : 160 + 60 * M9; p.x += sp * dt; if (p.x > 690) p.x = 40;
      const half = p.x < 300 ? 85 : p.x < 430 ? lerp(85, 35, (p.x - 300) / 130) : 35 + (p.x - 430) * 0.12 * Math.log(under + 1);
      a.set(p.c, { cx: p.x, cy: 150 + p.f * half });
    }));
  },
});

fig("thrust_cv", {
  title: "The thrust equation from a control volume", w: 700, h: 280,
  caption: "Momentum flux out minus in, plus the pressure imbalance at the exit if the nozzle is not matched: F = ṁ9v9 − ṁ0v0 + (P9 − P0)A9. The ram drag ṁ0v0 is paid for taking the air on board at flight speed.",
  init(a) {
    a.rect(30, 40, 640, 200, { color: C.purple, width: 2, dash: "8 5" }); a.text(350, 30, "control volume (undisturbed free stream outside)", { size: 12, color: C.purple });
    a.path("M200,90 L500,95 L560,120 L560,180 L500,205 L200,210 L180,180 L180,120 z", { fill: "#e2e8f0", color: C.mid });
    a.text(370, 150, "engine", { size: 14, weight: 700 });
    a.arrow(60, 150, 170, 150, C.blue, 5); a.text(110, 130, "ṁ0 v0 in", { size: 13, color: C.blue, weight: 700 });
    a.arrow(565, 150, 660, 150, C.red, 7); a.text(612, 116, "ṁ9 v9 out", { size: 13, color: C.red, weight: 700, halo: true });
    a.text(585, 205, "(P9 − P0) A9", { size: 13, color: C.orange, weight: 700 });
    for (const y of [125, 175]) a.arrow(600, y, 570, y, C.orange, 2);
    a.arrow(470, 250, 300, 250, C.green, 5); a.text(385, 280, "F (on the engine, forward)", { size: 13, color: C.green, weight: 700 });
    const fin = Parts.flowDots(a, [[40, 150], [180, 150]], { color: C.blue, gap: 18, speed: 70 }), fout = Parts.flowDots(a, [[560, 150], [668, 150]], { color: C.red, gap: 18, speed: 150 });
    a.loop((t) => { fin(t); fout(t); });
  },
});

fig("etap_tradeoff", {
  title: "Propulsive efficiency: move more air, more slowly", w: 680, h: 300,
  caption: "For one matched stream ηP = 2/(1 + v9/v0). The same thrust F = ṁ(v9 − v0) can come from a small, fast jet (turbojet, low ηP) or a large, slow one (turbofan, propeller, high ηP); the kinetic energy wasted in the jet is ½ṁ(v9 − v0)².",
  init(a) {
    const p = a.plot(60, 20, 300, 220, [1, 5], [0, 1]);
    p.axes("v9 / v0", "ηP", { below: true });
    for (const k of [1, 2, 3, 4, 5]) a.text(p.X(k), 256, k, { size: 11, color: C.mid });
    for (const k of [0, 0.5, 1]) a.text(56, p.Y(k), k, { size: 11, color: C.mid, anchor: "end" });
    p.curve((x) => 2 / (1 + x), { color: C.blue, width: 3 });
    const dot = a.circle(0, 0, 6, { fill: C.orange, color: "none" });
    const jet = a.path("", { fill: "#fed7aa", color: C.orange, width: 1.5 });
    a.rect(400, 120, 90, 50, { r: 10, fill: "#e2e8f0", color: C.mid }); a.text(445, 145, "engine", { size: 12 });
    const out = [0, 1, 2].map((i) => a.text(560, 210 + i * 22, "", { size: 13, weight: i === 2 ? 700 : 400 }));
    const ps = Array.from({ length: 20 }, (_, i) => ({ x: 490 + ((i * 31) % 180), f: ((i * 0.618) % 1) * 2 - 1, c: a.circle(0, 0, 2.6, { fill: C.orange, color: "none" }) }));
    let r = 2;
    a.slider("v9 / v0", 1.05, 5, 0.05, 2, (v) => {
      r = v;
      a.set(dot, { cx: p.X(v), cy: p.Y(2 / (1 + v)) });
      const area = 1 / (v - 1), h = clamp(8 * Math.sqrt(area) * 2, 6, 60);
      a.set(jet, { d: `M490,${145 - h} L670,${145 - h} L670,${145 + h} L490,${145 + h} z` });
      a.setText(out[0], `same thrust: ṁ ∝ 1/(v9 − v0) = ×${area.toFixed(2)}`);
      a.setText(out[1], `jet loss ½ṁ(v9 − v0)² ∝ ${(v - 1).toFixed(2)}`);
      a.setText(out[2], `ηP = 2/(1 + ${v.toFixed(2)}) = ${(2 / (1 + v)).toFixed(3)}`);
    }, (v) => v.toFixed(2));
    a.loop((t, dt) => ps.forEach((q) => { q.x += 40 * r * dt; if (q.x > 670) q.x = 492; const h = clamp(8 * Math.sqrt(1 / (r - 1)) * 2, 6, 60); a.set(q.c, { cx: q.x, cy: 145 + q.f * h * 0.9 }); }));
  },
});

fig("brayton_ts", {
  title: "T–s diagram of the 1A turbofan (cruise)", w: 680, h: 340,
  caption: "Station values of exercise 1A (totals, plus the static exit states 9 and 19). Entropy is computed as cp ln(T/T₀) − R ln(P/P₀). Real compression and expansion lean to the right (entropy grows; an ideal, isentropic process would be vertical); the burner adds heat along a nearly constant-pressure curve and loses 10 % of Pt; the bypass stream 13 → 19 is a separate branch. The cold end, where 0, 2, 13 and 19 crowd together, is magnified in the inset.",
  init(a) {
    const cold = [1004.5, 287], hot = [1239, 285.9];
    const S = ([cp, R], T, P) => cp * Math.log(T / 216.8) - R * Math.log(P / 0.2273);
    const pts = [["0", 216.8, 0.2273, cold], ["t0", 244.55, 0.3465, cold], ["t2", 244.55, 0.3395, cold], ["t13", 268.3, 0.4482, cold], ["t25", 457.02, 2.241, cold], ["t3", 771.2, 10.39, cold], ["t4", 1600, 9.351, hot], ["t45", 1339.7, 3.488, hot], ["t5", 1045.6, 0.886, hot], ["9", 909.2, 0.447, hot]].map(([n, T, P, g]) => [n, S(g, T, P), T]);
    const fan = [["t13", S(cold, 268.3, 0.4482), 268.3], ["19", S(cold, 225.7, 0.2273), 225.7]];
    const xs = pts.map((p) => p[1]).concat(fan.map((p) => p[1]));
    const p = a.plot(70, 20, 520, 280, [Math.min(...xs) - 40, Math.max(...xs) + 60], [150, 1700]);
    p.axes("s − s₀ (J/kg/K)", "T (K)", {});
    for (const T of [200, 500, 1000, 1500]) a.text(66, p.Y(T), T, { size: 11, color: C.mid, anchor: "end" });
    [[0.2273, "P₀"], [10.39, "Pt3"]].forEach(([P, n]) => { a.path(p.d((s) => 216.8 * Math.exp((s + 287 * Math.log(P / 0.2273)) / 1004.5), p.x0 === 70 ? Math.min(...xs) - 40 : 0, Math.max(...xs) + 60, 200), { color: C.soft, width: 1.2, dash: "4 4" }); });
    // burner t3 → t4: heat addition at (nearly) constant pressure is an exponential T(s), not a straight line
    const seg = (q0, q1) => (q0[0] === "t3" ? Array.from({ length: 30 }, (_, k) => { const w = (k + 1) / 30; return [lerp(q0[1], q1[1], w), q0[2] * (q1[2] / q0[2]) ** w]; }) : [[q1[1], q1[2]]]);
    const path = (P, X, Y) => "M" + X(P[0][1]) + "," + Y(P[0][2]) + P.slice(1).map((q, i) => seg(P[i], q).map(([s, T]) => "L" + X(s).toFixed(1) + "," + Y(T).toFixed(1)).join("")).join("");
    a.path(path(pts, p.X, p.Y), { color: C.red, width: 2.5 });
    a.path(fan.map((q, i) => (i ? "L" : "M") + p.X(q[1]) + "," + p.Y(q[2])).join(""), { color: C.blue, width: 2.5, dash: "6 4" });
    const crowd = ["0", "t0", "t2", "t13", "19"];
    pts.concat([fan[1]]).forEach(([n, s, T]) => { a.circle(p.X(s), p.Y(T), 4, { fill: C.ink, color: "none" }); if (!crowd.includes(n)) a.text(p.X(s) + 8, p.Y(T) - 8, n, { size: 12, weight: 700, anchor: "start" }); });
    // inset: the cold end magnified (s from −15 to 110 J/kg/K, T from 200 to 480 K)
    const bx = 82, by = 24, bw = 186, bh = 100, sr = [-15, 110], Tr = [200, 480];
    const IX = (s) => bx + ((s - sr[0]) / (sr[1] - sr[0])) * bw, IY = (T) => by + bh - ((T - Tr[0]) / (Tr[1] - Tr[0])) * bh;
    a.rect(p.X(sr[0]), p.Y(Tr[1]), p.X(sr[1]) - p.X(sr[0]), p.Y(Tr[0]) - p.Y(Tr[1]), { color: C.mid, width: 1, dash: "3 2" });
    a.line(p.X(sr[1]), p.Y(Tr[1]), bx + bw, by + bh, { color: C.soft, width: 1 });
    a.rect(bx, by, bw, bh, { fill: C.bg, color: C.mid, width: 1 });
    const clipId = "bts" + Math.random().toString(36).slice(2, 7);
    const cp = a.el("clipPath", { id: clipId }, a.el("defs", {})); a.el("rect", { x: bx, y: by, width: bw, height: bh }, cp);
    const ins = a.g({ "clip-path": `url(#${clipId})` });
    a.within(ins, () => {
      a.path(path(pts, IX, IY), { color: C.red, width: 2 });
      a.path(fan.map((q, i) => (i ? "L" : "M") + IX(q[1]) + "," + IY(q[2])).join(""), { color: C.blue, width: 2, dash: "5 3" });
    });
    const off = { 0: [-7, 3, "end"], t0: [-6, -8, "end"], t2: [7, 10, "start"], t13: [-6, -8, "end"], 19: [7, 4, "start"], t25: [-6, -6, "end"] };
    pts.concat([fan[1]]).forEach(([n, s, T]) => { if (!(n in off)) return; const [dx, dy, an] = off[n]; a.circle(IX(s), IY(T), 3.5, { fill: C.ink, color: "none" }); a.text(IX(s) + dx, IY(T) + dy, n, { size: 11, weight: 700, anchor: an }); });
    a.text(bx + 5, by + 10, "cold end (zoom)", { size: 10, color: C.mid, anchor: "start" });
    const dot = a.circle(0, 0, 7, { fill: C.orange, color: C.bg });
    a.text(440, 262, "core: 0 → 9", { size: 12, color: C.red, weight: 700, anchor: "start" }); a.text(440, 282, "bypass: 13 → 19", { size: 12, color: C.blue, weight: 700, anchor: "start" });
    a.loop((t) => { const u = (t * 0.12) % 1, k = u * (pts.length - 1), i = Math.floor(k), f = k - i, q0 = pts[i], q1 = pts[Math.min(i + 1, pts.length - 1)]; const T = q0[0] === "t3" ? q0[2] * (q1[2] / q0[2]) ** f : lerp(q0[2], q1[2], f); a.set(dot, { cx: p.X(lerp(q0[1], q1[1], f)), cy: p.Y(T) }); });
  },
});

fig("pic_trend", {
  title: "Ideal turbojet: specific thrust and TSFC against πc", w: 680, h: 320,
  caption: "Ideal turbojet (γ = 1.4, cp = 1004 J/(kg K), hPR = 42.8 MJ/kg). Specific thrust peaks at τc = √τλ/τr; TSFC keeps falling to much higher πc, so real engines sit between. Raise M₀: the optimum πc falls towards 1, the ramjet.",
  init(a) {
    const p = a.plot(70, 20, 470, 250, [0, Math.log10(60)], [0, 1200]);
    p.axes("πc (log)", "F/ṁ₀ (N·s/kg)", { below: true });
    for (const k of [1, 2, 5, 10, 20, 40]) a.text(p.X(Math.log10(k)), 286, k, { size: 11, color: C.mid });
    for (const k of [0, 400, 800, 1200]) a.text(66, p.Y(k), k, { size: 11, color: C.mid, anchor: "end" });
    for (const k of [0, 20, 40, 60]) a.text(550, p.Y(k * 20), k, { size: 11, color: C.orange, anchor: "start" });
    a.text(550, 270 + 14, "mg/s/N", { size: 10, color: C.orange, anchor: "start" });
    const Fc = a.path("", { color: C.blue, width: 3 }), Sc = a.path("", { color: C.orange, width: 2.5, dash: "6 4" });
    const opt = a.line(0, 0, 0, 0, { color: C.blue, width: 1.5, dash: "3 3" });
    a.text(585, 120, "F/ṁ₀", { size: 12, color: C.blue, weight: 700, anchor: "start" }); a.text(585, 140, "TSFC", { size: 12, color: C.orange, weight: 700, anchor: "start" }); a.text(585, 156, "(right scale)", { size: 10, color: C.orange, anchor: "start" });
    const read = a.note("");
    const st = { M0: 2, Tt4: 1800 };
    const upd = () => {
      const g = 1.4, cp = 1004, T0 = 216.7, a0 = Math.sqrt(g * 287 * T0), h = 42.8e6;
      const tr = 1 + 0.2 * st.M0 ** 2, tl = st.Tt4 / T0;
      const perf = (pc) => { const tc = pc ** (0.4 / 1.4), tt = 1 - (tr * (tc - 1)) / tl; const v9 = a0 * Math.sqrt((2 / (g - 1)) * (tl / (tr * tc)) * (tr * tc * tt - 1)); const F = v9 - st.M0 * a0; const f = ((cp * T0) / h) * (tl - tr * tc); return [F, (f / F) * 1e6]; };
      a.set(Fc, { d: p.d((lx) => perf(10 ** lx)[0], 0, Math.log10(60), 300) });
      a.set(Sc, { d: p.d((lx) => { const [F, S] = perf(10 ** lx); return F > 0 ? S * 20 : NaN; }, 0, Math.log10(60), 300) });
      const tco = Math.sqrt(tl) / tr, pco = Math.max(1, tco ** 3.5);
      a.set(opt, { x1: p.X(Math.log10(pco)), x2: p.X(Math.log10(pco)), y1: p.Y(0), y2: p.Y(1200) });
      const [Fo, So] = perf(pco);
      read.innerHTML = richHTML(`τλ = ${tl.toFixed(2)}, τr = ${tr.toFixed(3)} → optimum πc = (√τλ/τr)^3.5 = ${pco.toFixed(1)}: F/ṁ₀ = ${Fo.toFixed(0)} N·s/kg, TSFC = ${So.toFixed(1)} mg/s/N`);
    };
    a.slider("flight Mach M₀", 0, 3.5, 0.05, 2, (v) => { st.M0 = v; upd(); }, (v) => v.toFixed(2));
    a.slider("Tt4 (K)", 1200, 2000, 10, 1800, (v) => { st.Tt4 = v; upd(); });
  },
});

/* ------------------------------------------------------------------ PROP-2 */
fig("turbofan", {
  title: "Two-spool, separate-flow turbofan (the CFM56 of exercises 1A/1B)", w: 720, h: 380,
  caption: "The FAN works on all the air ṁ₀; α = 6 parts go round the core in the bypass duct (13 → 19), 1 part enters the core: LPC (booster) → HPC → burner → HPT → LPT → core nozzle. The HP spool (orange) links HPT and HPC; the LP spool (blue) links LPT to the fan and LPC, through the middle of the HP shaft.",
  init(a) {
    const cy = 175;
    const nac = (x) => x < 60 ? 125 : x < 340 ? lerp(125, 108, (x - 60) / 280) : 108;
    const split = (x) => x < 112 ? 0 : x < 340 ? lerp(68, 74, (x - 112) / 228) : 0;
    const tip = (x) => x < 112 ? nac(x) - 6 : x < 180 ? lerp(66, 58, (x - 112) / 68) : x < 300 ? lerp(58, 44, (x - 180) / 120) : x < 380 ? 44 + 6 * Math.sin(((x - 300) / 80) * Math.PI) : x < 470 ? lerp(44, 58, (x - 380) / 90) : lerp(58, 40, (x - 470) / 80);
    const hub = (x) => x < 30 ? 0 : x < 80 ? 34 * Math.sqrt((x - 30) / 50) : x < 180 ? lerp(34, 32, (x - 80) / 100) : x < 300 ? lerp(32, 34, (x - 180) / 120) : x < 470 ? 30 : x < 545 ? 30 * Math.sqrt(Math.max(0, (545 - x) / 75)) : 0;
    const xs = (a0, b0) => Array.from({ length: Math.round((b0 - a0) / 4) + 1 }, (_, i) => a0 + i * 4);
    Eng.band(a, cy, xs(40, 340), (x) => nac(x) + 12, nac, { fill: "#cbd5e1", color: C.mid, width: 1.2 });
    Eng.band(a, cy, xs(112, 340), split, tip, { fill: "#e2e8f0", color: C.mid, width: 1.2 });
    Eng.band(a, cy, xs(340, 560), (x) => tip(x) + 9, tip, { fill: "#e2e8f0", color: C.mid, width: 1.2 });
    Eng.band(a, cy, xs(30, 545), hub, () => 0, { fill: "#f1f5f9", color: C.mid, width: 1.2 });
    a.rect(90, cy - 3, 400, 6, { fill: C.blue, color: "none" }); a.rect(195, cy - 9, 225, 4, { fill: C.orange, color: "none" }); a.rect(195, cy + 5, 225, 4, { fill: C.orange, color: "none" });
    a.text(260, cy + 24, "HP spool", { size: 11, color: C.orange, weight: 700 }); a.text(470, cy + 24, "LP spool", { size: 11, color: C.blue, weight: 700 });
    const rows = [];
    rows.push(Eng.row(a, cy, 92, hub(92), nac(92) - 4, { color: C.blue, width: 5, chord: 9, speed: 4, n: 6 }));
    for (const x of [130, 150, 170]) rows.push(Eng.row(a, cy, x, hub(x), tip(x), { color: C.blue, speed: 4 }));
    for (let k = 0; k < 6; k++) { const x = 200 + k * 17; rows.push(Eng.row(a, cy, x, hub(x), tip(x), { color: C.orange, speed: 7 })); }
    rows.push(Eng.row(a, cy, 392, hub(392), tip(392), { color: C.orange, speed: 7 }));
    for (const x of [420, 440, 460]) rows.push(Eng.row(a, cy, x, hub(x), tip(x), { color: C.blue, speed: 4 }));
    Eng.band(a, cy, xs(310, 370), (x) => tip(x) - 4, (x) => hub(x) + 4, { fill: "#fff7ed", color: C.orange, width: 1 });
    const flames = [-1, 1].map(() => a.path("", { fill: "#fb923c", color: C.red, width: 1, opacity: 0.85 }));
    const st = [[15, "0"], [80, "2"], [112, "13"], [340, "19"], [180, "25"], [302, "3"], [372, "4"], [404, "45"], [470, "5"], [550, "9"]];
    st.forEach(([x, s], i) => { const top = s === "13" || s === "19"; a.line(x, cy - (top ? 140 : 100), x, cy - (top ? nac(x) - 8 : 0), { color: C.purple, width: 1, dash: "3 3" }); a.text(x, cy - (top ? 150 : 108) - (s === "25" || s === "45" ? 0 : 0), s, { size: 13, weight: 700, color: C.purple }); });
    [["fan", 92], ["LPC", 150], ["HPC", 245], ["burner", 340], ["HPT", 392], ["LPT", 440], ["core nozzle", 515]].forEach(([n, x]) => a.text(x, cy + 140, n, { size: 11, weight: 600 }));
    a.text(240, cy - 92, "bypass duct (α = 6)", { size: 12, color: C.blue });
    const Tc = (x) => x < 92 ? 245 : x < 180 ? lerp(268, 457, (x - 92) / 88) : x < 300 ? lerp(457, 771, (x - 180) / 120) : x < 325 ? 771 : x < 365 ? lerp(771, 1600, (x - 325) / 40) : x < 404 ? lerp(1600, 1340, (x - 365) / 39) : x < 470 ? lerp(1340, 1046, (x - 404) / 66) : 1046;
    const core = Eng.particles(a, cy, 34, (x) => (x < 92 ? 60 : x < 300 ? 45 : x < 370 ? 35 : x < 470 ? 70 : 120), Tc, (x, f) => (x < 92 ? f * 60 : x > 545 ? f * 38 : hub(x) + f * (tip(x) - hub(x))), 715);
    const by = Eng.particles(a, cy, 36, (x) => (x < 92 ? 60 : 75), (x) => (x < 92 ? 245 : 268), (x, f) => (x < 92 ? 62 + f * 55 : x < 340 ? split(x) + 4 + f * (nac(x) - split(x) - 8) : 76 + f * 28 - (x - 340) * 0.02), 715, { r: 2.4 });
    a.loop((t, dt) => {
      rows.forEach((r) => r(t)); core(t, dt); by(t, dt);
      flames.forEach((f, i) => { const s = i ? 1 : -1, w = 5 + 2.5 * Math.sin(t * 13 + i); a.set(f, { d: `M314,${cy + s * 38} Q${336 + 8 * Math.sin(t * 9)},${cy + s * (38 - w)} ${362},${cy + s * 38} Q336,${cy + s * (38 + w)} 314,${cy + s * 38} z` }); });
    });
  },
});

fig("actuator_disc", {
  title: "Momentum theory of the actuator disc", w: 700, h: 300,
  caption: "The disc accelerates the stream from v₀ to v_e; half of the increase happens ahead of the disc: v_p = (v₀ + v_e)/2 = v₀(1 + a). The streamtube contracts to conserve mass. Thrust F = 2ṁ·a·v₀, disc power Ẇ_D = F·v_p, and the Froude efficiency η_P = F v₀/Ẇ_D = 1/(1 + a): the lighter the disc loading, the better.",
  init(a) {
    const cy = 150, xd = 300;
    const tube = a.path("", { fill: "#e0f2fe", color: C.blue, width: 2 });
    a.rect(xd - 4, cy - 80, 8, 160, { fill: C.ink, color: "none" }); a.text(xd, cy + 112, "disc, area A_D", { size: 12, weight: 700 });
    const lab = [0, 1, 2].map(() => a.text(0, 0, "", { size: 12, weight: 700 }));
    const ps = Array.from({ length: 40 }, (_, i) => ({ x: (i * 17.5) % 700, f: ((i * 0.618) % 1) * 1.8 - 0.9, c: a.circle(0, 0, 2.8, { fill: C.blue, color: "none" }) }));
    const out = a.note("");
    let aa = 0.2;
    const vel = (x) => { const u = 1 / (1 + Math.exp(-(x - xd) / 50)); return 1 + 2 * aa * u; };
    const rad = (x) => 80 * Math.sqrt((1 + aa) / vel(x));
    a.slider("axial induction a = (v_p − v₀)/v₀", 0.01, 1, 0.01, 0.2, (v) => {
      aa = v;
      let up = "", dn = ""; for (let x = 0; x <= 700; x += 5) { up += (x ? "L" : "M") + x + "," + (cy - rad(x)).toFixed(1); dn = "L" + x + "," + (cy + rad(x)).toFixed(1) + dn; }
      a.set(tube, { d: up + dn.replace(/^L/, "L") + "z" });
      [[60, "v₀", 1], [xd + 40, "v_p = v₀(1 + a)", 1 + aa], [640, "v_e = v₀(1 + 2a)", 1 + 2 * aa]].forEach(([x, s, vv], i) => { a.set(lab[i], { x, y: cy - rad(x) - 12 }); a.setText(lab[i], s); });
      out.innerHTML = richHTML(`η_P = 1/(1 + a) = ${(1 / (1 + aa)).toFixed(3)} · tube area far downstream / disc = ${(1 + aa) / (1 + 2 * aa) < 1 ? ((1 + aa) / (1 + 2 * aa)).toFixed(3) : ""}`);
    }, (v) => v.toFixed(2));
    a.loop((t, dt) => ps.forEach((p) => { p.x += 70 * vel(p.x) * dt; if (p.x > 700) p.x = 0; a.set(p.c, { cx: p.x, cy: cy + p.f * rad(p.x) }); }));
  },
});

fig("turboprop", {
  title: "Turboprop: the turbine drives a propeller through a gearbox", w: 700, h: 300,
  caption: "Most of the expansion happens in the turbine, whose LP part drives the propeller through a reduction gearbox (Ẇprop = ηg(ηm ẆLPT − ẆLPC)). The propeller accelerates a huge mass of air a little (high ηP); the small core jet adds some thrust. The best split (τtL) moves more expansion to the propeller until the jet is starved.",
  init(a) {
    const cy = 150;
    a.path(`M150,${cy - 40} L520,${cy - 34} L600,${cy - 22} L600,${cy + 22} L520,${cy + 34} L150,${cy + 40} z`, { fill: "#e2e8f0", color: C.mid });
    a.rect(110, cy - 22, 50, 44, { r: 6, fill: "#fde68a", color: C.amber }); a.text(135, cy + 36, "gearbox", { size: 11 });
    a.path(`M60,${cy} Q80,${cy - 22} 110,${cy - 20} L110,${cy + 20} Q80,${cy + 22} 60,${cy}`, { fill: C.steel, color: C.mid });
    a.rect(160, cy - 3, 330, 6, { fill: C.blue, color: "none" }); a.text(330, cy + 22, "LP shaft (to gearbox)", { size: 11, color: C.blue });
    a.text(250, cy - 52, "compressor", { size: 11 }); a.text(380, cy - 52, "burner", { size: 11 }); a.text(470, cy - 52, "turbine", { size: 11 });
    const blades = [0, 1, 2, 3].map(() => a.path("", { fill: C.ink, color: "none" }));
    const air = Array.from({ length: 30 }, (_, i) => ({ x: (i * 23) % 700, f: ((i * 0.618) % 1) * 2 - 1, c: a.circle(0, 0, 2.6, { fill: C.blue, color: "none" }) }));
    const jet = Parts.flowDots(a, [[600, cy], [700, cy]], { color: C.red, gap: 14, speed: 140 });
    a.loop((t, dt) => {
      blades.forEach((b, k) => { const ph = t * 9 + (k * TAU) / 4, L = 120 * Math.cos(ph), w = 9 * Math.abs(Math.sin(ph)) + 3; a.set(b, { d: `M95,${cy} L${95 - w},${cy - L} L${95 + w},${cy - L} z` }); });
      air.forEach((p) => { p.x += (p.x < 95 ? 80 : 110) * dt; if (p.x > 700) p.x = 0; const r = p.x < 95 ? 125 : 125 - Math.min(20, (p.x - 95) * 0.05); a.set(p.c, { cx: p.x, cy: cy + p.f * r, opacity: Math.abs(p.f * r) < 44 && p.x > 60 && p.x < 600 ? 0 : 1 }); });
      jet(t);
    });
  },
});

fig("open_rotor", {
  title: "Propfan / open rotor: contra-rotating unducted blades", w: 700, h: 300,
  caption: "Same gas generator as the turbofan, but the fan is replaced by two rows of swept, contra-rotating propeller blades without a duct. In exercises 1A/1B part 2 this gives a bypass ratio of 44.5 at cruise and 16.4 at take-off, with 21 % and 35 % lower TSFC than the turbofan, paid for with tip-Mach limits (M₀ ≲ 0.8), noise, gearbox and installation.",
  init(a) {
    const cy = 150;
    a.path(`M60,${cy} Q90,${cy - 40} 160,${cy - 42} L560,${cy - 34} L640,${cy - 14} L640,${cy + 14} L560,${cy + 34} L160,${cy + 42} Q90,${cy + 40} 60,${cy} z`, { fill: "#e2e8f0", color: C.mid });
    a.text(300, cy + 4, "gas generator (core)", { size: 12 });
    a.rect(470, cy - 40, 60, 80, { fill: "#fde68a", color: C.amber, opacity: 0.6 }); a.text(500, cy + 56, "gearbox / power turbine", { size: 10, halo: true, front: true });
    const rowA = [0, 1, 2, 3, 4, 5].map(() => a.path("", { fill: C.blue, color: "none", opacity: 0.85 })), rowB = [0, 1, 2, 3, 4, 5].map(() => a.path("", { fill: C.orange, color: "none", opacity: 0.85 }));
    const air = Array.from({ length: 40 }, (_, i) => ({ x: (i * 17) % 700, f: ((i * 0.618) % 1) * 2 - 1, c: a.circle(0, 0, 2.4, { fill: C.blue, color: "none" }) }));
    a.text(560, 30, "front row", { size: 12, color: C.blue, weight: 700, halo: true, front: true }); a.text(560, 50, "rear row (opposite rotation)", { size: 12, color: C.orange, weight: 700, halo: true, front: true });
    const bl = (x, ph, sweep) => { const L = 130 * Math.cos(ph), w = 10 * Math.abs(Math.sin(ph)) + 2; return `M${x},${cy - Math.sign(L) * 30} Q${x + sweep * 0.5 * Math.abs(L) / 130},${cy - L * 0.6} ${x + sweep * Math.abs(L) / 130 + w},${cy - L} L${x + sweep * Math.abs(L) / 130 - w},${cy - L} Q${x - w},${cy - L * 0.6} ${x - 6},${cy - Math.sign(L) * 30} z`; };
    a.loop((t, dt) => {
      rowA.forEach((b, k) => a.set(b, { d: bl(500, t * 6 + (k * TAU) / 6, 20) }));
      rowB.forEach((b, k) => a.set(b, { d: bl(540, -t * 6 + (k * TAU) / 6 + 0.3, 20) }));
      air.forEach((p) => { p.x += (p.x < 500 ? 80 : 100) * dt; if (p.x > 700) p.x = 0; const r = 135; const y = cy + p.f * r; a.set(p.c, { cx: p.x, cy: y, opacity: Math.abs(y - cy) < 44 && p.x > 60 && p.x < 640 ? 0 : 1 }); });
    });
  },
});

/* ------------------------------------------------------------------ PROP-3 */
fig("comp_triangles", {
  title: "Repeating compressor stage: velocity triangles (exercise 2A)", w: 700, h: 340,
  caption: "Angles from the AXIAL direction; V = V_R + U. Repeating stage: α₁ = β₂, β₁ = α₂, so v₁ + v₂ = U. Work cp ΔTt = U(v₂ − v₁) = V₂² − V₁². Defaults are 2A: α₁ = 30°, V₁ = 130.9 m/s, U = 209.4 m/s → α₂ = 51.8°, ΔTt = 16.4 K.",
  init(a) {
    const g = a.g();
    const out = [0, 1, 2, 3, 4].map((i) => a.text(i < 3 ? 40 : 380, 230 + (i % 3) * 26, "", { size: 14, anchor: "start", weight: i === 2 ? 700 : 400 }));
    const st = { a1: 30, V1: 130.9, U: 209.44 };
    const draw = () => {
      while (g.firstChild) g.removeChild(g.firstChild);
      const u = st.V1 * Math.cos(rad(st.a1)), v1 = st.V1 * Math.sin(rad(st.a1)), v2 = st.U - v1, a2 = deg(Math.atan2(v2, u)), V2 = Math.hypot(u, v2);
      const k = 0.85, ox = 200, oy = 40;
      a.within(g, () => {
        const tri = (y0, v, vR, lab, col) => {
          const P = (x, y) => [ox + x * k, oy + y0 + y * k];
          a.arrow(...P(0, 0), ...P(v, u), col, 3); a.arrow(...P(0, 0), ...P(v - st.U, u), C.purple, 3); a.arrow(...P(v - st.U, u), ...P(v, u), C.blue, 3);
          a.line(...P(0, 0), ...P(0, u + 10), { color: C.soft, dash: "4 4", width: 1 });
          a.text(...P(v / 2 + 18, u / 2), `V${lab}`, { size: 13, weight: 700, color: col, anchor: "start" });
          a.text(...P((v - st.U) / 2 - 18, u / 2), `V${lab}R`, { size: 13, weight: 700, color: C.purple, anchor: "end" });
        };
        a.text(ox - 40, oy - 18, "rotor inlet (1)", { size: 12, weight: 700 });
        a.text(ox + 210, oy - 18, "rotor exit (2)", { size: 12, weight: 700 });
        const ox1 = ox; tri(0, v1, 0, "₁", C.orange);
        a.within(a.g({ transform: "translate(250,0)" }), () => tri(0, v2, 0, "₂", C.green));
        a.text(ox + (v1 - st.U / 2) * k, oy + u * k + 18, "U", { size: 13, color: C.blue, weight: 700 });
      });
      const dTt = (V2 * V2 - st.V1 * st.V1) / 1004.5;
      a.setText(out[0], `u = ${u.toFixed(2)} m/s, v₁ = ${v1.toFixed(2)}, v₂ = U − v₁ = ${v2.toFixed(2)}`);
      a.setText(out[1], `α₂ = β₁ = ${a2.toFixed(2)}°, V₂ = ${V2.toFixed(2)} m/s`);
      a.setText(out[2], `ΔTt = (V₂² − V₁²)/cp = ${dTt.toFixed(2)} K`);
      a.setText(out[3], `Ψ = cpΔTt/U² = ${((1004.5 * dTt) / st.U ** 2).toFixed(3)}, Φ = u/U = ${(u / st.U).toFixed(3)}`);
      a.setText(out[4], `de Haller V₂R/V₁R = ${(st.V1 / V2).toFixed(3)} (≥ 0.72?)`);
    };
    a.slider("α₁ (°)", 0, 45, 0.5, 30, (v) => { st.a1 = v; draw(); });
    a.slider("V₁ (m/s)", 80, 200, 0.1, 130.9, (v) => { st.V1 = v; draw(); });
    a.slider("U (m/s)", 150, 300, 0.1, 209.44, (v) => { st.U = v; draw(); });
  },
});

fig("turb_triangles", {
  title: "Turbine stage velocity triangles: reaction and loading", w: 700, h: 340,
  caption: "Zero exit swirl (α₃ = 0), constant u. Ψ = cpΔTt/U² = (v₂ + v₃)/U and Φ = u/U. With no exit swirl R_t = 1 − Ψ/2: 50 % reaction gives Ψ = 1 (3A: Φ = 0.4, α₂ = 68.2°), impulse gives Ψ = 2 (3B strict: Φ = 2, α₂ = 45°). Keep α₂ ≤ 70°.",
  init(a) {
    const g = a.g();
    const out = [0, 1, 2, 3].map((i) => a.text(420, 200 + i * 24, "", { size: 12.5, anchor: "start", weight: i === 1 ? 700 : 400 }));
    const st = { R: 0.5, Phi: 0.4 };
    const draw = () => {
      while (g.firstChild) g.removeChild(g.firstChild);
      const U = 1, Psi = 2 * (1 - st.R), u = st.Phi, v2 = Psi * U, v3 = 0;
      const a2 = deg(Math.atan2(v2, u)), b2 = deg(Math.atan2(v2 - U, u)), b3 = deg(Math.atan2(v3 + U, u));
      const k = 150 / Math.max(1.2, v2 + 0.3, u + 0.2);
      const ox = 60 + Math.max(0, -1) * k, oy = 40;
      a.within(g, () => {
        const P = (x, y) => [ox + 40 + x * k, oy + y * k];
        a.text(ox, oy - 14, "rotor inlet (2)", { size: 12, weight: 700, anchor: "start" });
        a.arrow(...P(0, 0), ...P(v2, u), C.orange, 3); a.arrow(...P(0, 0), ...P(v2 - U, u), C.purple, 3); a.arrow(...P(v2 - U, u), ...P(v2, u), C.blue, 3);
        a.text(...P(v2 / 2 + 0.1, u / 2), "V₂", { size: 13, color: C.orange, weight: 700, anchor: "start" }); a.text(...P((v2 - U) / 2 - 0.08, u / 2), "V₂R", { size: 13, color: C.purple, weight: 700, anchor: "end" });
        const Q = (x, y) => [ox + 300 + x * k * 0.8, oy + y * k * 0.8];
        a.text(ox + 260, oy - 14, "rotor exit (3)", { size: 12, weight: 700, anchor: "start" });
        a.arrow(...Q(0, 0), ...Q(0, u), C.green, 3); a.arrow(...Q(0, 0), ...Q(-U, u), C.purple, 3); a.arrow(...Q(-U, u), ...Q(0, u), C.blue, 3);
        a.text(...Q(0.06, u / 2), "V₃ (axial)", { size: 13, color: C.green, weight: 700, anchor: "start" }); a.text(...Q(-U / 2 - 0.1, u / 2), "V₃R", { size: 13, color: C.purple, weight: 700, anchor: "end" });
      });
      a.setText(out[0], `Ψ = 2(1 − R_t) = ${Psi.toFixed(2)}, Φ = ${st.Phi.toFixed(2)}, Ψ/Φ = ${(Psi / st.Phi).toFixed(2)}`);
      a.setText(out[1], `α₂ = ${a2.toFixed(1)}° ${a2 > 70 ? "> 70°: too large" : "≤ 70°: OK"}`);
      a.setText(out[2], `β₂ = ${b2.toFixed(1)}°, β₃ = ${b3.toFixed(1)}°`);
      a.setText(out[3], `turning ε = β₂ + β₃ = ${(b2 + b3).toFixed(1)}°`);
    };
    const sR = a.slider("reaction R_t", 0, 0.9, 0.05, 0.5, (v) => { st.R = v; draw(); });
    const sP = a.slider("flow coefficient Φ", 0.2, 2.2, 0.05, 0.4, (v) => { st.Phi = v; draw(); });
    a.buttons(["50 % reaction (3A)", "impulse, strict (3B)", "impulse, relaxed (3B)"], (i) => { const [r, f] = [[0.5, 0.4], [0, 2], [0, 0.8]][i]; sR.value = r; sP.value = f; sR.dispatchEvent(new Event("input")); sP.dispatchEvent(new Event("input")); });
  },
});

fig("cascade_geom", {
  title: "Cascade geometry: solidity, incidence and deviation", w: 680, h: 330,
  caption: "Chord c, pitch s = 2πr_m/n_b, solidity σ = c/s, stagger θ. The flow angles differ from the blade METAL angles γ: incidence i = α_i − γ_i (≈ 0 at design) and deviation δ = α_e − γ_e at the exit. Carter's rule for a compressor: δ = (γ_i − γ_e)/(4√σ): more solidity, less deviation, but more blades and friction.",
  init(a) {
    const g = a.g();
    const out = a.note("");
    const st = { sig: 1.2, gi: 45, ge: 15 };
    const draw = () => {
      while (g.firstChild) g.removeChild(g.firstChild);
      const c = 110, s = c / st.sig, delta = (st.gi - st.ge) / (4 * Math.sqrt(st.sig));
      a.within(g, () => {
        const camber = (x0, y0) => { const pts = []; let x = x0, y = y0; for (let i = 0; i <= 30; i++) { pts.push([x, y]); const g = rad(lerp(st.gi, st.ge, i / 30)); x += (c / 30) * Math.cos(g); y += (c / 30) * Math.sin(g); } return pts; };
        for (let k = -1; k < 4; k++) {
          const x0 = 200, y0 = 20 + k * s - c * 0.25;
          const pts = camber(x0, y0), p0 = pts[0], p1 = pts[30];
          a.path(pts.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + "," + q[1].toFixed(1)).join(""), { color: C.ink, width: 7 });
          if (k === 1) {
            const dir0 = [Math.cos(rad(st.gi)), Math.sin(rad(st.gi))], dir1 = [Math.cos(rad(st.ge)), Math.sin(rad(st.ge))], ex = [Math.cos(rad(st.ge + delta)), Math.sin(rad(st.ge + delta))];
            a.arrow(p0[0] - 100 * dir0[0], p0[1] - 100 * dir0[1], p0[0] - 6 * dir0[0], p0[1] - 6 * dir0[1], C.blue, 2.5); a.text(p0[0] - 100 * dir0[0] - 6, p0[1] - 100 * dir0[1], "inflow α_i ≈ γ_i", { size: 12, color: C.blue, anchor: "end" });
            a.line(p1[0], p1[1], p1[0] + 90 * dir1[0], p1[1] + 90 * dir1[1], { color: C.mid, dash: "4 3", width: 1.3 });
            a.arrow(p1[0] + 4 * ex[0], p1[1] + 4 * ex[1], p1[0] + 100 * ex[0], p1[1] + 100 * ex[1], C.orange, 2.5);
            a.text(p1[0] + 106 * ex[0] + 6, p1[1] + 106 * ex[1], "exit α_e = γ_e + δ (dashed: metal γ_e)", { size: 12, color: C.orange, anchor: "start" });
            a.line(x0 - 14, y0, x0 - 14, y0 + s, { color: C.purple, width: 1.5, arrow: true, arrow2: true }); a.text(x0 - 20, y0 + s / 2, "pitch s", { size: 13, color: C.purple, anchor: "end", weight: 700 });
            a.line(p0[0], p0[1] - 10, p1[0], p1[1] - 10, { color: C.teal, width: 1.3, arrow: true, arrow2: true }); a.text((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 22, "chord c", { size: 12, color: C.teal });
          }
        }
      });
      out.innerHTML = richHTML(`σ = c/s = ${st.sig.toFixed(2)} · Carter δ = (γ_i − γ_e)/(4√σ) = ${delta.toFixed(1)}° · turning (metal) = ${(st.gi - st.ge).toFixed(0)}°`);
    };
    a.slider("solidity σ", 0.5, 2.5, 0.05, 1.2, (v) => { st.sig = v; draw(); }, (v) => v.toFixed(2));
    a.slider("inlet metal γ_i (°)", 20, 60, 1, 45, (v) => { st.gi = v; draw(); });
    a.slider("exit metal γ_e (°)", 0, 40, 1, 15, (v) => { st.ge = v; draw(); });
  },
});

fig("free_vortex", {
  title: "Free vortex: reaction is lowest at the hub", w: 680, h: 300,
  caption: "Free-vortex design (r·v = const, constant u) gives the same work at every radius, and the degree of reaction varies as R = 1 − (1 − R_m)(r_m/r)². Long compressor blades (low hub/tip ratio) can reach NEGATIVE reaction at the hub; keep the turbine hub above about −0.15.",
  init(a) {
    const p = a.plot(330, 30, 300, 220, [0.3, 1], [-0.6, 1]);
    p.axes("r / r_tip", "R", { xAt: 0, below: true });
    for (const k of [0.4, 0.6, 0.8, 1]) a.text(p.X(k), p.Y(0) + 14, k, { size: 11, color: C.mid });
    for (const k of [-0.5, 0, 0.5, 1]) a.text(326, p.Y(k), k, { size: 11, color: C.mid, anchor: "end" });
    const cur = a.path("", { color: C.blue, width: 3 }), neg = a.rect(0, 0, 0, 0, { fill: C.red, color: "none", opacity: 0.15 });
    const blade = a.g();
    const out = a.note("");
    const st = { Rm: 0.5, ht: 0.5 };
    const draw = () => {
      const rm = (1 + st.ht) / 2, R = (r) => 1 - (1 - st.Rm) * (rm / r) ** 2;
      a.set(cur, { d: p.d(R, st.ht, 1, 200) });
      const Rh = R(st.ht);
      a.set(neg, Rh < 0 ? { x: p.X(st.ht), y: p.Y(0), width: Math.max(0, p.X(Math.min(1, rm * Math.sqrt(1 - st.Rm))) - p.X(st.ht)), height: p.Y(-0.6) - p.Y(0) } : { width: 0 });
      while (blade.firstChild) blade.removeChild(blade.firstChild);
      a.within(blade, () => {
        const y = (r) => 270 - r * 230;
        a.rect(60, y(st.ht), 60, 4, { fill: C.metal, color: "none" }); a.rect(60, y(1) - 4, 60, 4, { fill: C.metal, color: "none" });
        a.rect(80, y(1), 20, y(st.ht) - y(1), { fill: "#dbeafe", color: C.blue });
        for (let k = 0; k <= 5; k++) { const r = st.ht + ((1 - st.ht) * k) / 5, v = (0.35 * rm) / r; a.arrow(140, y(r), 140 + v * 120, y(r), C.orange, 2); }
        a.text(200, y(1) - 14, "swirl v ∝ 1/r", { size: 12, color: C.orange }); a.text(90, y(st.ht) + 18, "hub", { size: 12 }); a.text(90, y(1) - 14, "tip", { size: 12 });
      });
      out.innerHTML = richHTML(`hub/tip = ${st.ht.toFixed(2)}, R at mean radius = ${st.Rm.toFixed(2)} → R_hub = ${Rh.toFixed(3)}${Rh < 0 ? " (negative!)" : ""}, R_tip = ${R(1).toFixed(3)}`);
    };
    a.slider("R at mean radius", 0, 0.9, 0.05, 0.5, (v) => { st.Rm = v; draw(); });
    a.slider("hub/tip ratio", 0.35, 0.9, 0.01, 0.5, (v) => { st.ht = v; draw(); });
  },
});

fig("multistage", {
  title: "Nine repeating stages (exercise 2A)", w: 680, h: 280,
  caption: "Every repeating stage adds the same ΔTt = 16.38 K, but the stage pressure ratio falls along the machine because the inlet temperature of each stage grows: πcs,i = (1 + ΔTt/Tt,i)^{γec/(γ−1)}. The overall πc = (1 + 9·16.38/306.53)^{3.38} = 3.77, not 1.192⁹.",
  init(a) {
    const Tt1 = 306.53, dT = 16.38, ex = 1.4 * 0.9647 / 0.4;
    const p = a.plot(60, 30, 560, 200, [0.5, 9.5], [0, 0.21]);  // bars of π − 1 from zero: an honest length
    const bars = [];
    for (let i = 1; i <= 9; i++) {
      const T = Tt1 + (i - 1) * dT, pis = (1 + dT / T) ** ex;
      const b = a.rect(p.X(i) - 22, p.Y(pis - 1), 44, p.Y(0) - p.Y(pis - 1), { fill: tempColor(T, 280, 460), color: "none", opacity: 0.85 });
      a.text(p.X(i), p.Y(pis - 1) - 10, pis.toFixed(4), { size: 11, weight: 700 }); a.text(p.X(i), 246, `stage ${i}`, { size: 11, color: C.mid }); a.text(p.X(i), 262, `${T.toFixed(0)} K in`, { size: 10, color: C.mid });
      bars.push(b);
    }
    a.line(60, 230, 630, 230, { width: 1.4 }); [0, 0.1, 0.2].forEach((v) => a.text(56, p.Y(v), v.toFixed(2), { size: 11, anchor: "end", color: C.mid })); a.text(60, 18, "stage pressure rise π − 1 (bar labels: π)", { size: 12, color: C.mid, anchor: "start" });
    const hl = a.rect(0, 30, 52, 200, { color: C.ink, width: 2, r: 4 });
    a.loop((t) => a.set(hl, { x: p.X((Math.floor(t * 1.2) % 9) + 1) - 26 }));
  },
});

fig("stage_ts", {
  title: "Stage T–s diagrams with the exercise numbers", w: 680, h: 360,
  caption: "Statics (●) and totals (○) are V²/(2cp) apart at the same entropy. In the rotor the RELATIVE total temperature is constant (t1R → t2R in the compressor, t2R → t3R in the turbine: horizontal) while the absolute total rises (compressor) or falls (turbine) by the work ΔTt. Every row moves to the right: losses create entropy. Points computed from the 2A and 3A solutions with s = cp ln T − R ln P.",
  init(a) {
    const g = a.g();
    const sets = {
      "2A compressor stage": { cp: 1004.5, R: 287, pts: [["1", 298, 1], ["t1", 306.53, 1.104], ["t1R", 314.72, 1.211], ["2", 306.19, 1.096], ["t2R", 314.72, 1.207], ["t2", 322.91, 1.32], ["3", 314.38, 1.198], ["t3", 322.91, 1.316]], path: ["1", "2", "3"], tot: ["t1", "t2", "t3"], rel: ["t1R", "t2R"] },
      "3A turbine stage": { cp: 1239, R: 285.9, pts: [["1", 1264, 7.562], ["t1", 1292.17, 8.32], ["2", 1090.46, 3.315], ["t2", 1292.17, 6.917], ["t2R", 1118.28, 3.698], ["3", 916.57, 1.265], ["t3R", 1118.28, 2.995], ["t3", 944.39, 1.44]], path: ["1", "2", "3"], tot: ["t1", "t2", "t3"], rel: ["t2R", "t3R"] },
    };
    const draw = (k) => {
      const D = sets[k];
      while (g.firstChild) g.removeChild(g.firstChild);
      const P = Object.fromEntries(D.pts.map(([n, T, Pp]) => [n, [D.cp * Math.log(T / D.pts[0][1]) - D.R * Math.log(Pp / D.pts[0][2]), T]]));
      const ss = Object.values(P).map((q) => q[0]), Ts = Object.values(P).map((q) => q[1]);
      const pad = (Math.max(...ss) - Math.min(...ss)) * 0.25 + 2, padT = (Math.max(...Ts) - Math.min(...Ts)) * 0.12;
      a.within(g, () => {
        const p = a.plot(70, 20, 520, 300, [Math.min(...ss) - pad, Math.max(...ss) + pad], [Math.min(...Ts) - padT, Math.max(...Ts) + padT]);
        p.axes("s (J/kg/K, relative)", "T (K)", {});
        const line = (names, col, dash) => a.path(names.map((n, i) => (i ? "L" : "M") + p.X(P[n][0]) + "," + p.Y(P[n][1])).join(""), { color: col, width: 2.5, dash });
        line(D.path, C.blue); line(D.tot, C.red); line(D.rel, C.purple, "6 4");
        Object.entries(P).forEach(([n, [s, T]]) => { const tot = n.startsWith("t"); a.circle(p.X(s), p.Y(T), 5, { fill: tot ? C.bg : C.ink, color: n.endsWith("R") ? C.purple : tot ? C.red : C.ink, width: 2 }); a.text(p.X(s) + 9, p.Y(T) - 9, `${n} ${T.toFixed(1)} K`, { size: 11, anchor: "start", weight: 600 }); });
        a.text(600, 40, "statics", { size: 12, color: C.blue, weight: 700, anchor: "start" }); a.text(600, 60, "abs. totals", { size: 12, color: C.red, weight: 700, anchor: "start" }); a.text(600, 80, "rel. totals", { size: 12, color: C.purple, weight: 700, anchor: "start" });
      });
    };
    a.buttons(Object.keys(sets), (i, k) => draw(k));
  },
});

fig("blade_stress", {
  title: "Centrifugal blade stress: AN²", w: 680, h: 300,
  caption: "A rotating blade carries its own centrifugal load: σc/ρ ≈ ω²A(1 + At/Ah)/(4π) → σc/ρ [MPa/(g/cm³)] = π(1 + At/Ah)·A·N²/(3.6·10⁶) with A in m² and N in rpm. Defaults: 3A annulus 0.230 m² at 2 500 rpm → 2.26; the 3B rotor (0.061 m², 25 000 rpm) gives 60.",
  init(a) {
    const cx = 160, cy = 150;
    const disc = a.g();
    a.within(disc, () => { a.circle(0, 0, 50, { fill: "#cbd5e1", color: C.mid }); for (let k = 0; k < 16; k++) { const th = (k * TAU) / 16; a.line(52 * Math.cos(th), 52 * Math.sin(th), 120 * Math.cos(th), 120 * Math.sin(th), { color: C.red, width: 6 }); } });
    const fArr = a.arrow(cx, cy - 125, cx, cy - 125, C.purple, 3);
    a.text(cx, 290, "disc + blades (hot section)", { size: 12, color: C.mid });
    const out = [0, 1].map((i) => a.text(320, 120 + i * 30, "", { size: 15, anchor: "start", weight: i ? 700 : 400 }));
    const st = { A: 0.23, N: 2500 };
    const upd = () => { const v = (Math.PI * 1.8 * st.A * st.N ** 2) / 3.6e6; a.setText(out[0], `A = ${st.A.toFixed(3)} m², N = ${st.N} rpm, At/Ah = 0.8`); a.setText(out[1], `σc/ρ = ${v.toFixed(2)} MPa/(g/cm³)`); a.set(fArr, { y2: cy - 125 - Math.min(40, 6 + v * 0.6) }); };
    a.slider("annulus A (m²)", 0.03, 0.3, 0.001, 0.23, (v) => { st.A = v; upd(); }, (v) => v.toFixed(3));
    a.slider("N (rpm)", 1000, 30000, 100, 2500, (v) => { st.N = v; upd(); });
    a.loop((t) => disc.setAttribute("transform", `translate(${cx},${cy}) rotate(${(t * st.N * 0.02) % 360})`));
  },
});
