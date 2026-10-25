/* RF figures: spectrum and propagation, modulation and receivers, noise and linearity, lines and matching. */
"use strict";

/* ------------------------------------------------------------------ propagation */
fig("spectrum_bands", {
  title: "The radio spectrum and the aviation services", w: 700, h: 260,
  caption: "ITU bands are decades of frequency (logarithmic axis). Each marker is an aviation service: NDB in LF/MF, HF voice for oceanic flights, VOR/ILS localizer 108–118 MHz, VHF voice 118–137 MHz, ILS glide slope 329–335 MHz, DME/SSR/GNSS in L band, radio altimeter and weather radar in SHF.",
  init(a) {
    const X = (f) => 30 + ((Math.log10(f) - 4.4) / (10.6 - 4.4)) * 640;
    const bands = [["LF", 3e4, 3e5, "#fef3c7"], ["MF", 3e5, 3e6, "#fde68a"], ["HF", 3e6, 3e7, "#d9f99d"], ["VHF", 3e7, 3e8, "#bbf7d0"], ["UHF", 3e8, 3e9, "#bae6fd"], ["SHF", 3e9, 3e10, "#c7d2fe"]];
    bands.forEach(([n, f0, f1, c]) => { a.rect(X(f0), 40, X(f1) - X(f0), 40, { fill: c, color: C.bg, width: 2 }); a.text((X(f0) + X(f1)) / 2, 60, n, { size: 15, weight: 700 }); });
    a.line(30, 80, 670, 80, { width: 1.5 });
    [[3e4, "30 kHz"], [3e5, "300 kHz"], [3e6, "3 MHz"], [3e7, "30 MHz"], [3e8, "300 MHz"], [3e9, "3 GHz"], [3e10, "30 GHz"]].forEach(([f, s]) => { a.line(X(f), 80, X(f), 86); a.text(X(f), 98, s, { size: 11, color: C.mid }); });
    a.text(350, 22, "λ: 10 km … 1 cm", { size: 12, color: C.mid });
    const svc = [["NDB", 190e3, 1750e3, 0], ["HF voice", 2.8e6, 22e6, 1], ["VOR / LOC", 108e6, 118e6, 0], ["VHF COM", 118e6, 137e6, 1], ["glide slope", 329e6, 335e6, 2], ["DME · SSR · GPS L1", 960e6, 1600e6, 0], ["radio altimeter", 4.2e9, 4.4e9, 1], ["weather radar", 9.3e9, 9.5e9, 2]];
    svc.forEach(([n, f0, f1, lvl]) => {
      const y = 130 + lvl * 38, x = (X(f0) + X(f1)) / 2;
      a.rect(X(f0), 104, Math.max(3, X(f1) - X(f0)), 8, { fill: C.orange, color: "none" });
      a.line(x, 112, x, y - 10, { color: C.orange, width: 1, dash: "2 2" });
      a.text(x, y, n, { size: 12, weight: 600 });
    });
  },
});

fig("wavelength_media", {
  title: "The same 100 MHz wave in three media", w: 680, h: 250,
  caption: "λ = c / (f √εeff): the frequency stays the same but the wave slows down in a dielectric, so the wavelength shrinks: 3.00 m in air, 1.98 m in polyethylene coax (εeff 2.3), 0.335 m in water (εeff 80.4).",
  init(a) {
    const rows = [["air, εeff = 1", 3.0, C.blue], ["PE coax, εeff = 2.3", 1.98, C.teal], ["water, εeff = 80.4", 0.335, C.purple]];
    const px = 120; // px per metre
    const paths = rows.map(([n, lam, c], i) => {
      const y = 50 + i * 75;
      a.text(20, y - 30, n, { size: 13, weight: 700, anchor: "start" });
      a.text(660, y - 30, `λ = ${lam.toFixed(lam < 1 ? 3 : 2)} m`, { size: 13, anchor: "end", color: c, weight: 700 });
      a.line(20, y, 660, y, { color: C.faint, width: 1 });
      a.line(20, y + 26, 20 + lam * px > 660 ? 660 : 20 + lam * px, y + 26, { color: c, width: 1.5, arrow: true, arrow2: true });
      return [a.path("", { color: c, width: 2.5 }), lam, y];
    });
    a.loop((t) => paths.forEach(([p, lam, y]) => { let d = ""; for (let x = 0; x <= 640; x += 2) d += (x ? "L" : "M") + (20 + x) + "," + (y - 16 * Math.sin(TAU * (x / (lam * px) - t * 0.5))).toFixed(1); a.set(p, { d }); }));
  },
});

fig("ionosphere", {
  title: "Sky waves: critical frequency, MUF and day/night", w: 680, h: 320,
  caption: "A layer of electron density N reflects vertical waves up to f_c = 9√N (Hz, e⁻/m³). An oblique ray at elevation θ is reflected up to MUF = f_c / sin θ. By day the D layer absorbs low HF; at night it disappears and the F layer weakens, so the usable frequencies drop.",
  init(a) {
    const ground = 290;
    a.rect(0, ground, 680, 30, { fill: "#dcfce7", color: "none" });
    const layers = { D: [230, "#fecaca"], E: [180, "#fde68a"], F1: [120, "#bfdbfe"], F2: [70, "#c7d2fe"] };
    const lay = {};
    Object.entries(layers).forEach(([n, [y, c]]) => { lay[n] = [a.rect(0, y - 14, 680, 28, { fill: c, color: "none", opacity: 0.8 }), a.text(14, y, n, { size: 13, weight: 700, anchor: "start" })]; });
    a.line(60, ground, 60, ground - 20, { width: 4 });
    const ray = a.path("", { color: C.orange, width: 3 });
    const dots = Array.from({ length: 6 }, () => a.circle(0, 0, 4, { fill: C.orange, color: "none" }));
    const out = [0, 1, 2].map((i) => a.text(670, 16 + i * 20, "", { size: 12.5, anchor: "end", weight: i === 2 ? 700 : 400 }));
    a.text(670, 312, "layer at 350 km; heights exaggerated", { size: 10, anchor: "end", color: C.mid });
    const st = { day: true, th: 18.5, f: 17.1 };
    let pts = [];
    const upd = () => {
      const N = st.day ? 5e11 : 1e11, fc = 9 * Math.sqrt(N) / 1e6, muf = fc / Math.sin(rad(st.th));
      a.set(lay.D[0], { opacity: st.day ? 0.8 : 0 }); a.set(lay.D[1], { opacity: st.day ? 1 : 0 }); a.set(lay.F1[0], { opacity: st.day ? 0.8 : 0 }); a.set(lay.F1[1], { opacity: st.day ? 1 : 0 });
      const top = st.day ? 70 : 95;
      a.set(lay.F2[0], { y: top - 14 }); a.set(lay.F2[1], { y: top });
      const hkm = 350, kmpx = 0.25, dx = (hkm / Math.tan(rad(st.th))) * kmpx; // vertical scale exaggerated
      const h = ground - 20 - top;
      const absorbed = st.day && st.f < 3;
      if (absorbed) pts = [[60, ground - 20], [60 + dx * ((ground - 20 - 230) / h), 230]];
      else if (st.f <= muf) pts = [[60, ground - 20], [60 + dx, top], [60 + 2 * dx, ground - 20]];
      else pts = [[60, ground - 20], [60 + dx * ((ground - 20) / h), 0]];
      a.set(ray, { d: "M" + pts.map((p) => p.join(",")).join(" L") });
      a.setText(out[0], `${st.day ? "day" : "night"}: N = ${N.toExponential(0)} e⁻/m³ → f_c = ${fc.toFixed(2)} MHz`);
      a.setText(out[1], `MUF = f_c / sin ${st.th}° = ${muf.toFixed(1)} MHz, OWF = ${(0.85 * muf).toFixed(1)} MHz`);
      a.setText(out[2], absorbed ? "absorbed in the D layer (too low)" : st.f <= muf ? `${st.f} MHz ≤ MUF: reflected, one hop = 2·350/tan θ = ${((2 * 350) / Math.tan(rad(st.th))).toFixed(0)} km` : `${st.f} MHz > MUF: escapes to space`);
    };
    a.buttons(["day", "night"], (i) => { st.day = i === 0; upd(); });
    a.slider("elevation θ (°)", 5, 85, 0.5, 18.5, (v) => { st.th = v; upd(); });
    a.slider("frequency (MHz)", 1, 40, 0.1, 17.1, (v) => { st.f = v; upd(); }, (v) => v.toFixed(1));
    a.loop((t) => {
      if (pts.length < 2) return;
      const segs = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push([pts[i - 1], pts[i], L, l]); L += l; }
      dots.forEach((d, k) => { const s = ((t * 120 + (k * L) / 6) % L); for (const [p, q, l0, l] of segs) if (s <= l0 + l) { const u = (s - l0) / l; a.set(d, { cx: lerp(p[0], q[0], u), cy: lerp(p[1], q[1], u) }); break; } });
    });
  },
});

fig("radio_horizon", {
  title: "Line of sight and the radio horizon", w: 680, h: 300,
  caption: "Above 50 MHz the range is limited by the radio horizon: d [nmi] = 1.23 (√H_T + √H_R) with heights in FEET (the factor includes the 4/3-Earth refraction). The line of sight just grazes the Earth; range grows only with √H: four times higher, twice as far. Curvature and heights are exaggerated, distances are to scale.",
  init(a) {
    // Line of sight drawn horizontal at Y0; the Earth touches it at the tangent point xt. An object at horizontal
    // distance s from xt must be s²/(2R) tall to reach the line, which is exactly why d ∝ √H.
    const Y0 = 70, s = 3.2, gx = 40, R = 1250;
    const hR = 10 / 0.3048, dR = 1.23 * Math.sqrt(hR), xt = gx + s * dR;
    const ys = (x) => Y0 + ((x - xt) ** 2) / (2 * R);
    let d = ""; for (let x = 0; x <= 680; x += 4) d += (x ? "L" : "M") + x + "," + ys(x).toFixed(1);
    a.path(d + " L680,300 L0,300 z", { color: C.green, width: 3, fill: "#f0fdf4" });
    a.line(gx, ys(gx), gx, Y0, { width: 4 }); a.text(gx + 6, ys(gx) + 18, "ground station 10 m", { size: 12, anchor: "start" });
    a.circle(xt, Y0, 4, { fill: C.green, color: "none" }); a.text(xt, Y0 - 12, "tangent point", { size: 11, color: C.green });
    const los = a.line(gx, Y0, gx, Y0, { color: C.orange, width: 2.5, dash: "7 4" });
    const mast = a.line(0, 0, 0, 0, { color: C.blue, width: 1.5, dash: "3 3" });
    const ac = a.g(); a.within(ac, () => Parts.plane(a, 0.7, C.blue));
    const ruler = a.line(gx, 285, gx, 285, { color: C.ink, width: 1.5, arrow: true, arrow2: true });
    const rl = a.text(0, 275, "", { size: 12 });
    const out = [0, 1].map((i) => a.text(670, 26 + i * 22, "", { size: 14, anchor: "end", weight: i ? 700 : 400 }));
    a.slider("aircraft altitude (m)", 50, 6000, 10, 2803, (H) => {
      const hT = H / 0.3048, dist = 1.23 * (Math.sqrt(hT) + Math.sqrt(hR));
      const x = Math.min(675, gx + s * dist);
      ac.setAttribute("transform", `translate(${x},${Y0}) rotate(90)`);
      a.set(los, { x2: x }); a.set(mast, { x1: x, x2: x, y1: Y0 + 6, y2: ys(x) });
      a.set(ruler, { x2: x }); a.set(rl, { x: (gx + x) / 2 }); a.setText(rl, `${dist.toFixed(1)} nmi`);
      a.setText(out[0], `H_T = ${hT.toFixed(0)} ft, H_R = 32.8 ft`);
      a.setText(out[1], `d = 1.23(√H_T + √H_R) = ${dist.toFixed(1)} nmi = ${(dist * 1.852).toFixed(0)} km`);
    });
  },
});

fig("wave_effects", {
  title: "Reflection, refraction, diffraction, scattering", w: 700, h: 230,
  caption: "Reflection: obstacle much larger than λ. Refraction: the wave enters a medium with another index and bends. Diffraction: an edge re-radiates (Huygens) so the wave reaches the shadow behind a hill. Scattering: obstacles smaller than λ (rain drops) re-radiate in all directions.",
  init(a) {
    const W = 170, titles = ["reflection", "refraction", "diffraction", "scattering"];
    titles.forEach((n, i) => { a.rect(5 + i * 174, 10, W, 190, { r: 8, fill: "#f8fafc", color: C.soft, width: 1 }); a.text(5 + i * 174 + W / 2, 218, n, { size: 13, weight: 700 }); });
    a.rect(140, 30, 14, 160, { fill: C.metal, color: "none" });
    a.rect(179, 110, W, 90, { fill: "#dbeafe", color: "none" });
    a.poly([[353 + 70, 200], [353 + 85, 100], [353 + 100, 200]], { fill: C.brown, color: "none" });
    const drops = [[620, 70], [600, 120], [640, 150], [580, 90]]; drops.forEach(([x, y]) => a.circle(x, y, 4, { fill: C.blue, color: "none" }));
    const g = a.g();
    a.loop((t) => {
      while (g.firstChild) g.removeChild(g.firstChild);
      a.within(g, () => {
        for (let k = 0; k < 4; k++) {
          const u = ((t * 0.5 + k / 4) % 1);
          // reflection: plane fronts moving right, reflected moving left
          const xr = 20 + u * 240;
          if (xr < 140) a.line(xr, 40, xr, 180, { color: C.blue, width: 2, opacity: 0.8 }); else a.line(280 - xr, 40, 280 - xr, 180, { color: C.orange, width: 2, opacity: 0.8 });
          // refraction: oblique fronts, slower and turned below the interface
          const xf = 185 + u * 150;
          a.line(xf, 30, xf - 50, 110, { color: C.blue, width: 2 }); a.line(xf - 50, 110, xf - 50 - 30 * 0.7, 190, { color: C.purple, width: 2 });
          // diffraction: plane fronts left of the hill, arcs behind its tip
          const xd = 365 + u * 150;
          if (xd < 438) a.line(xd, 25, xd, 195, { color: C.blue, width: 2 }); else { const r = xd - 438; a.path(`M${438},${100 - r} A${r},${r} 0 0 1 ${438 + r},${100}`, { color: C.blue, width: 2 }); a.line(438, 100 - r, 438, 25, { color: C.blue, width: 2 }); }
          // scattering: circles from each drop
          drops.forEach(([x, y], j) => a.circle(x, y, 4 + ((t * 25 + j * 8 + k * 12) % 48), { color: C.blue, width: 1.3, opacity: 1 - (((t * 25 + j * 8 + k * 12) % 48) / 48) }));
        }
      });
    });
  },
});

fig("absorption", {
  title: "Clear-air absorption: windows and peaks", w: 680, h: 280,
  caption: "Schematic specific attenuation at sea level (log scales, shape only): water-vapour lines at 22 and 183 GHz, oxygen at 60 and 119 GHz. Long-range millimetre links and radars use the windows (≈ 35 and 94 GHz); short 'secure' links use the 60 GHz peak, where the signal dies within a few kilometres.",
  init(a) {
    const p = a.plot(60, 20, 590, 210, [1, 3.0], [-2.2, 1.6]);
    p.axes("frequency (GHz, log)", "dB/km (log)", {});
    const lines = [[22.2, 0.18, 2.5], [60, 15, 6], [118.75, 2.5, 2], [183.3, 30, 4]];
    const att = (lf) => { const f = 10 ** lf; let s = 0.006 * (f / 10) ** 2 / (1 + (f / 300) ** 2) + 0.004; for (const [f0, A, w] of lines) s += A / (1 + ((f - f0) / w) ** 2); return Math.log10(s); };
    p.curve(att, { color: C.blue, width: 3, n: 800 });
    [[10, "10"], [22, "22"], [35, "35"], [60, "60"], [94, "94"], [119, "119"], [183, "183"], [300, "300"]].forEach(([f, s]) => { a.line(p.X(Math.log10(f)), 230, p.X(Math.log10(f)), 236); a.text(p.X(Math.log10(f)), 248, s, { size: 11, color: C.mid }); });
    [[22.2, "H₂O"], [60, "O₂"], [118.75, "O₂"], [183.3, "H₂O"]].forEach(([f, s]) => a.text(p.X(Math.log10(f)), p.Y(att(Math.log10(f))) - 12, s, { size: 12, weight: 700, color: C.red }));
    [[35, "window"], [94, "window"]].forEach(([f, s]) => { a.rect(p.X(Math.log10(f)) - 14, 20, 28, 210, { fill: C.green, color: "none", opacity: 0.12 }); a.text(p.X(Math.log10(f)), 34, s, { size: 11, color: C.green, weight: 700 }); });
  },
});

/* ------------------------------------------------------------------ transmitters, receivers, modulation */
fig("txrx_chain", {
  title: "Transmitter and receiver chains", w: 700, h: 250,
  caption: "Transmitter: baseband message → modulator → upconversion (mixer + local oscillator) → power amplifier → antenna. Receiver: antenna → LNA (sets the noise figure) → downconversion → IF amplifier and filter → demodulator.",
  init(a) {
    const tx = [["baseband", 55], ["modulator", 150], ["×", 245], ["PA", 330]], rx = [["LNA", 380], ["×", 470], ["IF amp\n+ filter", 565], ["demod.", 655]];
    const y1 = 70, y2 = 190;
    a.text(20, 22, "transmitter", { size: 14, weight: 700, anchor: "start" }); a.text(20, 140, "receiver", { size: 14, weight: 700, anchor: "start" });
    tx.forEach(([n, x]) => n === "×" ? Parts.mixer(a, x, y1, 16) : n === "PA" ? Parts.amp(a, x, y1, 18, "", { fill: "#fff7ed", color: C.orange }) : Parts.box(a, x, y1, 84, 40, n));
    a.text(330, y1 + 32, "PA", { size: 12, color: C.orange });
    a.circle(245, y1 + 50, 12, { fill: C.bg }); a.text(245, y1 + 50, "LO", { size: 10 }); a.line(245, y1 + 38, 245, y1 + 16);
    a.path(`M360,${y1} L400,${y1} L400,${y1 - 30} M388,${y1 - 48} L400,${y1 - 30} L412,${y1 - 48}`, { width: 2.5 });
    const ty = [[97, 108], [192, 229], [261, 312], [348, 400]]; ty.forEach(([p, q]) => a.arrow(p, y1, q, y1, C.ink, 1.6));
    a.path(`M300,${y2 - 30} L300,${y2} M288,${y2 - 48} L300,${y2 - 30} L312,${y2 - 48}`, { width: 2.5 }); a.line(300, y2, 362, y2);
    rx.forEach(([n, x]) => n === "×" ? Parts.mixer(a, x, y2, 16) : n === "LNA" ? Parts.amp(a, x, y2, 18, "", { fill: "#eff6ff" }) : Parts.box(a, x, y2, 80, 40, n));
    a.text(380, y2 + 32, "LNA", { size: 12, color: C.blue });
    a.circle(470, y2 + 50, 12, { fill: C.bg }); a.text(470, y2 + 50, "LO", { size: 10 }); a.line(470, y2 + 38, 470, y2 + 16);
    [[398, 454], [486, 525], [605, 615]].forEach(([p, q]) => a.arrow(p, y2, q, y2, C.ink, 1.6));
    const f1 = Parts.flowDots(a, [[20, y1], [400, y1], [400, y1 - 40]], { color: C.orange, gap: 40, speed: 70 });
    const f2 = Parts.flowDots(a, [[300, y2 - 40], [300, y2], [690, y2]], { color: C.blue, gap: 40, speed: 70 });
    a.loop((t) => { f1(t); f2(t); });
  },
});

fig("am_wave", {
  title: "Amplitude modulation", w: 680, h: 300,
  caption: "x(t) = A_C [1 + m·cos 2πf_m t] cos 2πf_C t. The envelope follows the message; m > 1 over-modulates and the envelope no longer reproduces it. Spectrum: carrier plus lower and upper sidebands of amplitude m·A_C/2 at f_C ± f_m, so the DSB bandwidth is 2f_m.",
  init(a) {
    const p = a.plot(30, 20, 420, 220, [0, 2], [-2.2, 2.2]);
    a.line(30, p.Y(0), 450, p.Y(0), { color: C.soft, width: 1 });
    const car = a.path("", { color: C.blue, width: 1.4 }), env = a.path("", { color: C.orange, width: 2.5 }), env2 = a.path("", { color: C.orange, width: 2.5 });
    const sp = a.plot(490, 40, 170, 180, [-3, 3], [0, 1.2]);
    sp.axes("f", "", { yAt: -3 });
    const L = [a.line(0, 0, 0, 0, { color: C.ink, width: 5 }), a.line(0, 0, 0, 0, { color: C.green, width: 5 }), a.line(0, 0, 0, 0, { color: C.green, width: 5 })];
    a.text(sp.X(0), 236, "f_C", { size: 12 }); a.text(sp.X(-1.6), 236, "f_C − f_m", { size: 10 }); a.text(sp.X(1.6), 236, "f_C + f_m", { size: 10 });
    const warn = a.text(240, 270, "", { size: 14, weight: 700, color: C.red });
    let m = 0.6;
    a.slider("modulation index m", 0, 1.5, 0.05, 0.6, (v) => {
      m = v;
      a.set(L[0], { x1: sp.X(0), x2: sp.X(0), y1: sp.Y(0), y2: sp.Y(1) });
      a.set(L[1], { x1: sp.X(-1.6), x2: sp.X(-1.6), y1: sp.Y(0), y2: sp.Y(m / 2) });
      a.set(L[2], { x1: sp.X(1.6), x2: sp.X(1.6), y1: sp.Y(0), y2: sp.Y(m / 2) });
      a.setText(warn, m > 1 ? "m > 1: over-modulation, envelope distorted" : "");
    }, (v) => v.toFixed(2));
    a.loop((t) => {
      const msg = (x) => 1 + m * Math.cos(TAU * (x - t * 0.3));
      a.set(car, { d: p.d((x) => msg(x) * Math.cos(TAU * 18 * x), 0, 2, 1400) });
      a.set(env, { d: p.d((x) => Math.abs(msg(x)), 0, 2) }); a.set(env2, { d: p.d((x) => -Math.abs(msg(x)), 0, 2) });
    });
  },
});

fig("fm_wave", {
  title: "Frequency modulation and Carson's rule", w: 680, h: 320,
  caption: "Constant amplitude; the instantaneous frequency swings ±Δf with the message. The spectrum has lines at f_C ± n·f_m with amplitudes J_n(m_f) (Bessel functions); Carson's rule B = 2(Δf + f_m) = 2f_m(m_f + 1) contains about 98 % of the power. m_f = 5 at f_m = 10 kHz gives 120 kHz (Module 1 problem).",
  init(a) {
    const p = a.plot(30, 20, 620, 90, [0, 2], [-1.3, 1.3]);
    const w = a.path("", { color: C.blue, width: 1.4 }), msg = a.path("", { color: C.orange, width: 2, dash: "5 4" });
    const sp = a.plot(40, 150, 600, 120, [-12, 12], [0, 1.05]);
    sp.axes("(f − f_C) / f_m", "|J_n(m_f)|", { yAt: 0 });
    const bars = Array.from({ length: 25 }, (_, i) => a.line(sp.X(i - 12), sp.Y(0), sp.X(i - 12), sp.Y(0), { color: C.blue, width: 6 }));
    const car = a.rect(0, 150, 0, 120, { fill: C.orange, color: "none", opacity: 0.12 });
    const read = a.text(640, 138, "", { size: 13, anchor: "end", weight: 700 });
    const J = (n, x) => { n = Math.abs(n); let s = 0, f = 1; for (let k = 0; k < 40; k++) { let den = 1; for (let i = 2; i <= k; i++) den *= i; let d2 = 1; for (let i = 2; i <= k + n; i++) d2 *= i; s += ((k % 2 ? -1 : 1) * (x / 2) ** (2 * k + n)) / (den * d2); } return s; };
    let mf = 5;
    a.slider("modulation index m_f = Δf/f_m", 0.2, 8, 0.1, 5, (v) => {
      mf = v;
      bars.forEach((b, i) => a.set(b, { y2: sp.Y(Math.abs(J(i - 12, mf))) }));
      a.set(car, { x: sp.X(-(mf + 1)), width: sp.X(mf + 1) - sp.X(-(mf + 1)) });
      a.setText(read, `f_m = 10 kHz: Δf = ${(mf * 10).toFixed(0)} kHz, B = 2(Δf + f_m) = ${(2 * (mf * 10 + 10)).toFixed(0)} kHz`);
    }, (v) => v.toFixed(1));
    a.loop((t) => {
      const ph = t * 0.3;
      a.set(msg, { d: p.d((x) => Math.cos(TAU * (x - ph)), 0, 2) });
      let d = "", phase = 0;
      for (let i = 0; i <= 1400; i++) { const x = (2 * i) / 1400; const fi = 14 * (1 + 0.5 * Math.min(1, mf / 5) * Math.cos(TAU * (x - ph))); phase += (TAU * fi * 2) / 1400; d += (i ? "L" : "M") + p.X(x).toFixed(1) + "," + p.Y(Math.cos(phase)).toFixed(1); }
      a.set(w, { d });
    });
  },
});

fig("fdm_tdm", {
  title: "Sharing the medium: FDM and TDM", w: 680, h: 280,
  caption: "FDM: every user gets its own frequency slot (channel + guard band) all the time. TDM: every user gets the whole band during its own time slot, in turn. The slide problem: ten 6 MHz SSB channels with 4 MHz guards fill 700–800 MHz.",
  init(a) {
    a.text(20, 20, "FDM (frequency)", { size: 14, weight: 700, anchor: "start" });
    const cols = [C.blue, C.orange, C.green, C.purple, C.teal, C.red, C.amber, C.brown, "#0ea5e9", "#db2777"];
    for (let k = 0; k < 10; k++) { const x = 40 + k * 62; a.rect(x, 40, 37, 70, { fill: cols[k], color: "none", opacity: 0.75 }); a.text(x + 18, 124, 700 + k * 10, { size: 10, color: C.mid }); }
    a.text(650, 124, "MHz", { size: 10, color: C.mid });
    a.text(110, 145, "6 MHz channel + 4 MHz guard", { size: 11, color: C.mid });
    a.text(20, 170, "TDM (time)", { size: 14, weight: 700, anchor: "start" });
    const slots = Array.from({ length: 10 }, (_, k) => a.rect(40 + k * 62, 190, 60, 50, { fill: cols[k % 4], color: C.bg, opacity: 0.8 }));
    a.text(340, 262, "users 1–4 take turns using the whole band", { size: 11, color: C.mid });
    const cur = a.rect(40, 186, 60, 58, { color: C.ink, width: 2.5 });
    a.loop((t) => a.set(cur, { x: 40 + (Math.floor(t * 2) % 10) * 62 }));
  },
});

fig("iq_modulator", {
  title: "I/Q modulation (QPSK)", w: 680, h: 280,
  caption: "The bit stream is split into pairs: one bit drives the in-phase carrier cos ω_Ct, the other the quadrature carrier sin ω_Ct (the same LO shifted 90°). Their sum is a carrier whose phase takes four values: the four points of the constellation.",
  init(a) {
    Parts.box(a, 60, 140, 80, 44, "bits →\npairs");
    Parts.mixer(a, 200, 80, 16); Parts.mixer(a, 200, 200, 16);
    a.line(100, 130, 140, 130); a.line(140, 130, 140, 80); a.arrow(140, 80, 184, 80); a.line(100, 150, 140, 150); a.line(140, 150, 140, 200); a.arrow(140, 200, 184, 200);
    a.text(160, 70, "I", { size: 14, weight: 700, color: C.blue }); a.text(160, 190, "Q", { size: 14, weight: 700, color: C.orange });
    a.circle(200, 140, 13, { fill: C.bg }); a.text(200, 140, "LO", { size: 10 }); a.line(200, 127, 200, 96); a.line(200, 153, 200, 184);
    a.text(222, 160, "−90°", { size: 11, color: C.mid });
    a.circle(300, 140, 14, { fill: C.bg }); a.text(300, 140, "Σ", { size: 16 });
    a.line(216, 80, 300, 80); a.arrow(300, 80, 300, 126); a.line(216, 200, 300, 200); a.arrow(300, 200, 300, 154);
    a.arrow(314, 140, 350, 140); a.text(352, 128, "RF out", { size: 12, anchor: "start" });
    const cx = 540, cy = 140, R = 80;
    a.line(cx - 110, cy, cx + 110, cy, { color: C.mid, width: 1 }); a.line(cx, cy - 110, cx, cy + 110, { color: C.mid, width: 1 });
    a.text(cx + 112, cy + 14, "I", { size: 13 }); a.text(cx + 10, cy - 110, "Q", { size: 13 });
    const pts = [[1, 1, "00"], [-1, 1, "01"], [-1, -1, "11"], [1, -1, "10"]];
    pts.forEach(([i, q, b]) => { a.circle(cx + i * R * 0.707, cy - q * R * 0.707, 6, { fill: C.soft, color: "none" }); a.text(cx + i * R * 0.95, cy - q * R * 0.95, b, { size: 12, color: C.mid }); });
    const vec = a.arrow(cx, cy, cx, cy, C.purple, 3), dot = a.circle(0, 0, 7, { fill: C.purple, color: "none" });
    const lab = a.text(cx, 262, "", { size: 13, weight: 700 });
    a.loop((t) => {
      const k = Math.floor(t / 1.2) % 4, [i, q, b] = pts[[0, 2, 1, 3][k]];
      a.set(vec, { x2: cx + i * R * 0.707, y2: cy - q * R * 0.707 }); a.set(dot, { cx: cx + i * R * 0.707, cy: cy - q * R * 0.707 });
      a.setText(lab, `bits ${b} → I = ${i > 0 ? "+" : "−"}1, Q = ${q > 0 ? "+" : "−"}1, phase ${(deg(Math.atan2(q, i)) + 360) % 360}°`);
    });
  },
});

fig("superhet", {
  title: "The superheterodyne receiver (exam problem 2)", w: 700, h: 330,
  caption: "The mixer moves the wanted RF to a FIXED IF, |f_RF − f_LO| = 455 kHz, where selective filters and gain live. The image on the other side of the LO (f_LO + f_IF for high-side injection) would land on the same IF, so the RF filter must remove it. Tune with the slider: the LO moves, the IF stays.",
  init(a) {
    a.path("M30,90 L30,60 M18,42 L30,60 L42,42", { width: 2.5 }); a.line(30, 90, 52, 90);
    Parts.box(a, 95, 90, 80, 40, "RF filter"); Parts.amp(a, 175, 90, 18, ""); Parts.mixer(a, 255, 90, 16);
    Parts.box(a, 355, 90, 90, 40, "IF filter\n455 kHz"); Parts.amp(a, 440, 90, 18, ""); Parts.box(a, 530, 90, 80, 40, "detector"); Parts.box(a, 640, 90, 60, 40, "audio");
    [[135, 157], [193, 239], [271, 310], [400, 422], [458, 490], [570, 610]].forEach(([p, q]) => a.arrow(p, 90, q, 90, C.ink, 1.6));
    a.circle(255, 150, 14, { fill: C.bg }); a.text(255, 150, "LO", { size: 10 }); a.arrow(255, 136, 255, 108, C.ink, 1.6);
    const sp = a.plot(40, 190, 620, 100, [3.5, 7.5], [0, 1.2]);
    sp.axes("f (MHz)", "", {});
    for (let f = 4; f <= 7; f++) a.text(sp.X(f), 306, f, { size: 11, color: C.mid });
    const rfF = a.path("", { color: C.green, width: 2, fill: "#dcfce7" });
    const lines = { rf: a.line(0, 0, 0, 0, { color: C.blue, width: 5 }), lo: a.line(0, 0, 0, 0, { color: C.ink, width: 3, dash: "4 3" }), im: a.line(0, 0, 0, 0, { color: C.red, width: 5 }) };
    const labs = { rf: a.text(0, 0, "", { size: 12, color: C.blue, weight: 700 }), lo: a.text(0, 0, "", { size: 12, weight: 700 }), im: a.text(0, 0, "", { size: 12, color: C.red, weight: 700 }) };
    const lo = a.text(255, 178, "", { size: 12, weight: 700 });
    a.slider("tuned station f_RF (MHz)", 4.5, 6.5, 0.05, 5.5, (f) => {
      const flo = f + 0.455, fim = flo + 0.455;
      a.set(rfF, { d: `M${sp.X(f - 0.35)},${sp.Y(0)} C${sp.X(f - 0.2)},${sp.Y(1.1)} ${sp.X(f + 0.2)},${sp.Y(1.1)} ${sp.X(f + 0.35)},${sp.Y(0)}` });
      const put = (k, x, h, s) => { a.set(lines[k], { x1: sp.X(x), x2: sp.X(x), y1: sp.Y(0), y2: sp.Y(h) }); a.set(labs[k], { x: sp.X(x), y: sp.Y(h) - 10 }); a.setText(labs[k], s); };
      put("rf", f, 0.8, `RF ${f.toFixed(2)}`); put("lo", flo, 1.05, `LO ${flo.toFixed(3)}`); put("im", fim, 0.8, `image ${fim.toFixed(2)}`);
      a.setText(lo, `f_LO = ${flo.toFixed(3)} MHz`);
    }, (v) => v.toFixed(2));
  },
});

/* ------------------------------------------------------------------ noise and linearity */
fig("db_ruler", {
  title: "Decibels as a ruler", w: 680, h: 220,
  caption: "dBm = 10 log(P / 1 mW) and dBW = dBm − 30: every ×10 in power is +10 dB, ×2 is +3 dB. Drag the power to see the three scales line up; the voltage across 50 Ω follows from V = √(PR) (20 log for voltages).",
  init(a) {
    const X = (dbm) => 40 + ((dbm + 100) / 150) * 600;
    a.line(40, 90, 640, 90, { width: 2 });
    for (let d = -100; d <= 50; d += 10) { a.line(X(d), 84, X(d), 96); a.text(X(d), 110, d, { size: 11, color: C.mid }); }
    a.text(40, 130, "dBm", { size: 12, anchor: "start", color: C.mid });
    [[-90, "1 pW"], [-60, "1 nW"], [-30, "1 µW"], [0, "1 mW"], [30, "1 W"]].forEach(([d, s]) => a.text(X(d), 70, s, { size: 11, color: C.blue }));
    const mk = a.poly([[0, 0], [0, 0], [0, 0]], { fill: C.orange, color: "none" });
    const out = [0, 1, 2].map((i) => a.text(340, 160 + i * 22, "", { size: 14, weight: i ? 400 : 700 }));
    a.slider("power (dBm)", -100, 50, 0.1, 16.99, (d) => {
      a.set(mk, { points: `${X(d)},88 ${X(d) - 8},74 ${X(d) + 8},74` });
      const P = 10 ** (d / 10) / 1000, V = Math.sqrt(P * 50);
      const ps = P >= 1 ? P.toFixed(3) + " W" : P >= 1e-3 ? (P * 1e3).toFixed(3) + " mW" : P >= 1e-6 ? (P * 1e6).toFixed(3) + " µW" : P >= 1e-9 ? (P * 1e9).toFixed(3) + " nW" : (P * 1e12).toFixed(3) + " pW";
      a.setText(out[0], `${ps} = ${d.toFixed(2)} dBm = ${(d - 30).toFixed(2)} dBW`);
      a.setText(out[1], `across 50 Ω: V = ${V >= 1 ? V.toFixed(3) + " V" : V >= 1e-3 ? (V * 1e3).toFixed(3) + " mV" : (V * 1e6).toFixed(2) + " µV"}`);
      a.setText(out[2], `= ${(20 * Math.log10(V)).toFixed(2)} dBV = ${(20 * Math.log10(V) + 120).toFixed(2)} dBµV`);
    }, (v) => v.toFixed(1));
  },
});

fig("nf_cascade", {
  title: "Friis noise cascade: who dominates?", w: 700, h: 320,
  caption: "Slide example: amplifier (G 10 dB, NF 2 dB), filter (−1 dB, 1 dB), mixer (−3 dB, 4 dB). F_T = F₁ + (F₂ − 1)/G₁ + (F₃ − 1)/(G₁G₂) in linear units. Each bar is a stage's contribution. Reorder the chain: with the amplifier first its gain divides everything after it; put the lossy parts first and the noise figure rises.",
  init(a) {
    const st = { order: [0, 1, 2] };
    const stages = [{ n: "amplifier", G: 10, NF: 2, sym: "amp" }, { n: "filter", G: -1, NF: 1, sym: "filter" }, { n: "mixer", G: -3, NF: 4, sym: "mix" }];
    const g = a.g();
    const bars = a.g();
    const out = a.text(350, 300, "", { size: 15, weight: 700 });
    const draw = () => {
      while (g.firstChild) g.removeChild(g.firstChild);
      while (bars.firstChild) bars.removeChild(bars.firstChild);
      a.within(g, () => {
        a.path("M30,90 L30,60 M18,42 L30,60 L42,42", { width: 2.5 }); a.line(30, 90, 70, 90);
        st.order.forEach((k, i) => {
          const s = stages[k], x = 140 + i * 180;
          if (s.sym === "amp") Parts.amp(a, x, 90, 26, "", { fill: "#eff6ff" });
          else if (s.sym === "mix") { Parts.mixer(a, x, 90, 22); a.circle(x, 145, 11, { fill: C.bg }); a.text(x, 145, "LO", { size: 9 }); a.line(x, 134, x, 112); }
          else { a.rect(x - 30, 70, 60, 40, { r: 5, fill: "#f0fdf4", color: C.green }); a.path(`M${x - 20},${100} C${x - 12},${70} ${x + 12},${70} ${x + 20},${100}`, { color: C.green }); }
          a.text(x, 40, s.n, { size: 13, weight: 700 }); a.text(x, 172, `G ${s.G} dB · NF ${s.NF} dB`, { size: 12, color: C.mid });
          a.arrow(x + 30, 90, x + 150, 90, C.ink, 1.6);
        });
      });
      let Gc = 1, F = 0; const contrib = [];
      st.order.forEach((k, i) => { const s = stages[k], Fi = 10 ** (s.NF / 10), Gi = 10 ** (s.G / 10); const c = i === 0 ? Fi : (Fi - 1) / Gc; contrib.push([s.n, c]); F += c; Gc *= Gi; });
      a.within(bars, () => {
        let x = 100;
        const scale = 160;
        contrib.forEach(([n, c], i) => { const w = c * scale; a.rect(x, 215, w, 34, { fill: [C.blue, C.green, C.orange][st.order[i]], color: C.bg, opacity: 0.85 }); if (w > 40) a.text(x + w / 2, 232, c.toFixed(3), { size: 12, color: C.bg, weight: 700 }); x += w; });
        a.text(96, 232, "F_T =", { size: 13, anchor: "end" });
      });
      a.setText(out, `F_T = ${F.toFixed(3)} → NF = ${(10 * Math.log10(F)).toFixed(2)} dB`);
    };
    a.buttons(["amplifier first (slide)", "filter first", "mixer first"], (i) => { st.order = [[0, 1, 2], [1, 0, 2], [2, 0, 1]][i]; draw(); });
  },
});

fig("noise_floor", {
  title: "Noise floor and sensitivity in decibels", w: 720, h: 290,
  caption: "Start from kT₀ = −174 dBm/Hz, add 10 log B for the bandwidth, the noise figure, and either the gain (output noise floor N_o) or the minimum SNR the demodulator needs (sensitivity P_min). Default: B = 1 MHz, NF = 5 dB, SNR_min = 10 dB → −99 dBm.",
  init(a) {
    const Y = (d) => 30 + ((-40 - d) / 140) * 230;
    a.line(80, 30, 80, 262, { width: 1.5 });
    for (let d = -180; d <= -40; d += 20) { a.line(74, Y(d), 80, Y(d)); a.text(70, Y(d), d, { size: 11, anchor: "end", color: C.mid }); }
    a.text(40, 18, "dBm", { size: 11, color: C.mid });
    const g = a.g();
    const st = { B: 6, NF: 5, S: 10 };
    const draw = () => {
      while (g.firstChild) g.removeChild(g.firstChild);
      a.within(g, () => {
        const steps = [["kT₀ = −174 dBm/Hz", -174, C.mid], ["+10 log B", 10 * st.B, C.blue], ["+NF", st.NF, C.orange], ["+SNR_min", st.S, C.green]];
        let lvl = 0, x = 110;
        steps.forEach(([n, v, c], i) => {
          const from = i ? lvl : -180, to = i ? lvl + v : -174;
          a.rect(x, Y(Math.max(from, to)), 90, Math.abs(Y(from) - Y(to)), { fill: c, color: "none", opacity: 0.75 });
          a.text(x + 45, Y(Math.max(from, to)) - 12, n, { size: 12, weight: 700 });
          lvl = to; x += 120;
        });
        a.line(100, Y(lvl), 715, Y(lvl), { color: C.red, dash: "6 4", width: 2 });
        a.text(715, Y(lvl) - 12, `P_min = ${lvl.toFixed(1)} dBm`, { size: 15, weight: 700, color: C.red, anchor: "end" });
        const N = -174 + 10 * st.B + st.NF;
        a.text(715, Y(lvl) + 40, `input noise kT₀BF = ${N.toFixed(1)} dBm`, { size: 12, anchor: "end", color: C.orange });
      });
    };
    a.slider("log₁₀ B (Hz)", 3, 9, 0.1, 6, (v) => { st.B = v; draw(); }, (v) => (10 ** v >= 1e6 ? (10 ** v / 1e6).toFixed(2) + " MHz" : (10 ** v / 1e3).toFixed(1) + " kHz"));
    a.slider("NF (dB)", 0, 15, 0.1, 5, (v) => { st.NF = v; draw(); }, (v) => v.toFixed(1));
    a.slider("SNR_min (dB)", 0, 30, 0.5, 10, (v) => { st.S = v; draw(); });
  },
});

fig("intermod", {
  title: "Two tones through a non-linear amplifier", w: 680, h: 290,
  caption: "Two tones f₁, f₂ produce harmonics (2f₁, 3f₁ …, easy to filter) and intermodulation products. The third-order ones, 2f₁ − f₂ and 2f₂ − f₁, fall right next to the wanted signals, cannot be filtered, and grow 3 dB for every 1 dB of input.",
  init(a) {
    const p = a.plot(40, 30, 600, 200, [0, 3.4], [-90, 10]);
    p.axes("frequency", "output (dBm)", {});
    for (let d = -80; d <= 0; d += 20) a.text(36, p.Y(d), d, { size: 10, anchor: "end", color: C.mid });
    const f1 = 1.0, f2 = 1.1;
    const comps = [[f1, 1, "f₁"], [f2, 1, "f₂"], [2 * f1 - f2, 3, "2f₁−f₂"], [2 * f2 - f1, 3, "2f₂−f₁"], [2 * f1, 2, "2f₁"], [f1 + f2, 2, "f₁+f₂"], [2 * f2, 2, "2f₂"], [3 * f1, 3, "3f₁"], [3 * f2, 3, ""], [f2 - f1, 2, "f₂−f₁"]];
    const L = comps.map(([f, o, n]) => [a.line(p.X(f), p.Y(-90), p.X(f), p.Y(-90), { color: o === 1 ? C.blue : o === 3 && f < 1.5 ? C.red : C.mid, width: 5 }), a.text(p.X(f), 0, n, { size: 10, color: o === 3 && f < 1.5 ? C.red : C.mid }), o]);
    a.rect(p.X(0.85), 30, p.X(1.25) - p.X(0.85), 200, { fill: C.blue, color: "none", opacity: 0.07 });
    a.text(p.X(1.05), 222, "receiver band", { size: 11, color: C.blue });
    const read = a.note("");
    a.slider("input level per tone (dBm)", -40, 0, 1, -20, (pin) => {
      const G = 20, IIP3 = 5, IIP2 = 25;
      L.forEach(([l, t, o]) => { const lvl = o === 1 ? pin + G : o === 3 ? 3 * pin - 2 * IIP3 + G : 2 * pin - IIP2 + G; a.set(l, { y2: p.Y(Math.max(-90, lvl)) }); a.set(t, { y: p.Y(Math.max(-90, lvl)) - 10 }); });
      read.textContent = `G = 20 dB, IIP3 = +5 dBm: wanted ${pin + G} dBm, IM3 ${3 * pin - 2 * IIP3 + G} dBm → C/IM3 = 2(IIP3 − P_in) = ${2 * (IIP3 - pin)} dB`;
    });
  },
});

fig("ip3_plot", {
  title: "1 dB compression point and third-order intercept", w: 680, h: 330,
  caption: "Exam problem 10 amplifier: G = 13 dB, output 1 dB CP = 20 dBm (so input 1 dB CP = 8 dBm), IIP3 ≈ 8 + 9.6 = 17.6 dBm, OIP3 = 30.6 dBm. The fundamental has slope 1 and compresses; IM3 has slope 3; their straight-line extensions cross at IP3, which the real device never reaches.",
  init(a) {
    const p = a.plot(60, 20, 560, 260, [-30, 25], [-60, 40]);
    p.axes("P_in (dBm)", "P_out (dBm)", {});
    for (let d = -30; d <= 25; d += 10) a.text(p.X(d), 296, d, { size: 10, color: C.mid });
    for (let d = -60; d <= 40; d += 20) a.text(56, p.Y(d), d, { size: 10, color: C.mid, anchor: "end" });
    const G = 13, IIP3 = 17.6, Pc = 13.87;
    const fund = (x) => x + G - 10 * Math.log10(1 + 10 ** ((x - Pc) / 10));
    const im3 = (x) => 3 * x - 2 * IIP3 + G;
    p.curve((x) => x + G, { color: C.blue, width: 1.5, dash: "5 4" });
    p.curve(fund, { color: C.blue, width: 3 });
    p.curve((x) => im3(x), { color: C.red, width: 1.5, dash: "5 4" });
    p.curve((x) => im3(x) - 10 * Math.log10(1 + 10 ** ((x - Pc) / 10)) * 3, { color: C.red, width: 3, b: 25 });
    a.circle(p.X(IIP3), p.Y(IIP3 + G), 7, { color: C.ink, width: 2.5 }); a.text(p.X(IIP3) - 10, p.Y(IIP3 + G) - 14, "IP3 (17.6, 30.6)", { size: 12, weight: 700, anchor: "end" });
    a.circle(p.X(8), p.Y(fund(8)), 6, { fill: C.orange, color: "none" }); a.text(p.X(8) + 10, p.Y(fund(8)) + 16, "1 dB CP (8, 20)", { size: 12, color: C.orange, weight: 700, anchor: "start" });
    a.text(p.X(-20), p.Y(-20 + G) - 14, "fundamental, slope 1", { size: 12, color: C.blue });
    a.text(p.X(-6), p.Y(im3(-6)) + 18, "IM3, slope 3", { size: 12, color: C.red, anchor: "start" });
    const mk = a.line(0, 0, 0, 0, { color: C.green, width: 3, arrow: true, arrow2: true });
    const lab = a.text(0, 0, "", { size: 12, color: C.green, weight: 700, anchor: "start" });
    a.loop((t) => {
      const x = -25 + ((t * 4) % 30);
      a.set(mk, { x1: p.X(x), x2: p.X(x), y1: p.Y(fund(x)), y2: p.Y(im3(x)) });
      a.set(lab, { x: p.X(x) + 8, y: p.Y((fund(x) + im3(x)) / 2) }); a.setText(lab, `C/IM3 = ${(2 * (IIP3 - x)).toFixed(0)} dB`);
    });
  },
});

/* ------------------------------------------------------------------ transmission lines */
fig("tline_wave", {
  title: "When a wire becomes a transmission line", w: 680, h: 260,
  caption: "1 m of PE coax (εr 2.3). At 50 kHz the line is a tiny fraction of λg: the voltage is the same everywhere (lumped circuit). At 99 MHz the line is λg/2 long and the voltage varies along it: it must be treated as a transmission line (rule of thumb: length > λg/10).",
  init(a) {
    const x0 = 120, x1 = 600;
    Parts.source(a, 70, 130, 22); a.line(70, 108, 70, 70); a.line(70, 152, 70, 190);
    a.line(70, 70, x0, 70); a.line(70, 190, x0, 190);
    a.rect(x0, 62, x1 - x0, 16, { fill: C.steel, color: C.metal }); a.rect(x0, 182, x1 - x0, 16, { fill: C.steel, color: C.metal });
    a.line(x1, 70, 640, 70); a.line(x1, 190, 640, 190); Parts.resistorV(a, 640, 70, 190, "Z_L");
    const arrows = Array.from({ length: 16 }, () => a.line(0, 0, 0, 0, { color: C.red, width: 2.5, arrow: true }));
    const wave = a.path("", { color: C.blue, width: 2.5 });
    const lab = a.text(360, 230, "", { size: 14, weight: 700 });
    let f = 99e6;
    a.buttons(["50 kHz (lumped)", "99 MHz (λg/2)", "300 MHz"], (i) => { f = [5e4, 99e6, 300e6][i]; const lg = 3e8 / (f * Math.sqrt(2.3)), r = 1 / lg; a.setText(lab, `λg = ${lg >= 100 ? lg.toFixed(0) : lg.toFixed(2)} m → the 1 m line is ${r < 0.01 ? "λg/" + (1 / r).toFixed(0) : r.toFixed(2) + " λg"}`); }, 1);
    a.loop((t) => {
      const lam = 3e8 / (f * Math.sqrt(2.3));
      const v = (x) => Math.cos(TAU * (((x - x0) / (x1 - x0)) / lam - t * 0.4)) * (f < 1e6 ? 1 : 1);
      const vv = (x) => (f < 1e6 ? Math.cos(TAU * t * 0.4) : v(x));
      arrows.forEach((ar, i) => { const x = x0 + 15 + i * 30, h = vv(x) * 45; a.set(ar, { x1: x, x2: x, y1: 130 - h * 0.05, y2: 130 - h }); });
      let d = ""; for (let x = x0; x <= x1; x += 3) d += (d ? "L" : "M") + x + "," + (35 - 18 * vv(x)).toFixed(1); a.set(wave, { d });
    });
  },
});

fig("rlgc_ladder", {
  title: "The RLGC model: a line is a ladder of tiny sections", w: 680, h: 230,
  caption: "Each Δz of line has series R·Δz (conductor loss) and L·Δz, and shunt G·Δz (dielectric loss) and C·Δz. Cascading infinitely many gives the telegrapher's equations; lossless (R = G = 0): Z₀ = √(L/C), v_p = 1/√(LC).",
  init(a) {
    const top = 60, bot = 180;
    for (let k = 0; k < 3; k++) {
      const x = 40 + k * 205;
      Parts.resistor(a, x, top, x + 60, "RΔz"); Parts.inductor(a, x + 60, top, x + 130, "LΔz"); a.line(x + 130, top, x + 205, top);
      a.line(x + 150, top, x + 150, top + 30); Parts.resistorV(a, x + 150, top + 30, bot - 10, ""); a.text(x + 132, top + 70, "GΔz", { size: 13, anchor: "end" });
      a.line(x + 185, top, x + 185, top + 30); Parts.capacitorV(a, x + 185, top + 30, bot - 10, "CΔz"); a.line(x + 150, bot - 10, x + 150, bot); a.line(x + 185, bot - 10, x + 185, bot);
      a.line(x, bot, x + 205, bot);
      a.line(x, 205, x + 205, 205, { color: C.mid, width: 1, arrow: true, arrow2: true }); a.text(x + 102, 220, "Δz", { size: 12, color: C.mid });
    }
    const f = Parts.flowDots(a, [[30, top], [655, top]], { color: C.orange, gap: 26, speed: 60 });
    a.loop((t) => f(t));
  },
});

fig("standing_wave", {
  title: "Incident + reflected = standing wave", w: 680, h: 300,
  caption: "Γ_L = (Z_L − Z₀)/(Z_L + Z₀). The forward wave (blue) and the reflected wave (orange, |Γ| times smaller) add to an instantaneous voltage (black) whose envelope (red) has maxima 1 + |Γ| and minima 1 − |Γ| every λ/2: SWR = (1 + |Γ|)/(1 − |Γ|).",
  init(a) {
    const p = a.plot(30, 30, 560, 200, [-1.25, 0], [-2.2, 2.2]);
    a.line(30, p.Y(0), 590, p.Y(0), { color: C.soft, width: 1 });
    a.rect(590, 70, 30, 120, { r: 4, fill: "#f1f5f9" }); const zt = a.text(605, 210, "", { size: 12, weight: 700 });
    a.text(p.X(-1.25), 252, "−1.25 λ", { size: 11, color: C.mid }); a.text(p.X(-0.5), 252, "−λ/2", { size: 11, color: C.mid }); a.text(p.X(0), 252, "load", { size: 11, color: C.mid });
    const fw = a.path("", { color: C.blue, width: 1.5 }), rw = a.path("", { color: C.orange, width: 1.5 }), tot = a.path("", { color: C.ink, width: 2.5 }), env = a.path("", { color: C.red, width: 2, dash: "6 4" }), env2 = a.path("", { color: C.red, width: 2, dash: "6 4" });
    const read = a.text(300, 285, "", { size: 14, weight: 700 });
    let G = { re: 0, im: 0 };
    const cases = { "matched Z₀": [1, 0], open: [1e9, 0], short: [0, 0], "Z_L = 2Z₀": [2, 0], "Z_L = Z₀/2": [0.5, 0], "Z_L = jZ₀": [0, 1] };
    a.buttons(Object.keys(cases), (i, k) => {
      const [r, x] = cases[k];
      const num = { re: r - 1, im: x }, den = { re: r + 1, im: x }, dd = den.re ** 2 + den.im ** 2;
      G = r > 1e8 ? { re: 1, im: 0 } : { re: (num.re * den.re + num.im * den.im) / dd, im: (num.im * den.re - num.re * den.im) / dd };
      const m = Math.hypot(G.re, G.im);
      a.setText(zt, k.split(" ")[0] === "matched" ? "Z₀" : k.replace("Z_L = ", ""));
      a.setText(read, `|Γ_L| = ${m.toFixed(3)} · SWR = ${m > 0.999 ? "∞" : ((1 + m) / (1 - m)).toFixed(2)}`);
      const e = (z) => { const ph = 4 * Math.PI * z, gr = G.re * Math.cos(ph) - G.im * Math.sin(ph), gi = G.re * Math.sin(ph) + G.im * Math.cos(ph); return Math.hypot(1 + gr, gi); };
      a.set(env, { d: p.d(e, -1.25, 0, 400) }); a.set(env2, { d: p.d((z) => -e(z), -1.25, 0, 400) });
    });
    a.loop((t) => {
      const w = t * 2.2, m = Math.hypot(G.re, G.im), ag = Math.atan2(G.im, G.re);
      const vf = (z) => Math.cos(w - TAU * z), vr = (z) => m * Math.cos(w + TAU * z + ag);
      a.set(fw, { d: p.d(vf, -1.25, 0, 300) }); a.set(rw, { d: p.d(vr, -1.25, 0, 300) }); a.set(tot, { d: p.d((z) => vf(z) + vr(z), -1.25, 0, 300) });
    });
  },
});

fig("coax", {
  title: "Coaxial cable: geometry and Z₀", w: 680, h: 300,
  caption: "Inner conductor d, dielectric εr, outer conductor D. The TEM field is radial E (red) and circular H (blue) between the conductors. Z₀ = (138/√εr) log₁₀(D/d); velocity factor VF = 1/√εr. Try d = 1.3 mm: air needs D = 2.99 mm for 50 Ω, polyethylene 4.61 mm.",
  init(a) {
    const cx = 160, cy = 150;
    // cutaway side view
    a.rect(330, 120, 320, 60, { fill: "#1f2937", color: "none", r: 4 }); a.text(640, 108, "jacket", { size: 11, anchor: "end", color: C.mid });
    a.rect(360, 126, 290, 48, { fill: "#d6d3d1", color: "none" }); a.text(400, 108, "braid / outer", { size: 11, color: C.mid });
    a.rect(400, 132, 250, 36, { fill: "#f8fafc", color: "none" }); a.text(470, 200, "dielectric εr", { size: 11, color: C.mid });
    a.rect(450, 145, 200, 10, { fill: "#b45309", color: "none" }); a.text(560, 222, "inner conductor", { size: 11, color: C.mid });
    for (let x = 362; x < 650; x += 8) a.line(x, 126, x + 6, 132, { color: C.metal, width: 1 });
    const outer = a.circle(cx, cy, 100, { fill: "#d6d3d1", color: C.metal, width: 4 });
    const diel = a.circle(cx, cy, 96, { fill: "#f8fafc", color: "none" });
    const inner = a.circle(cx, cy, 20, { fill: "#b45309", color: "none" });
    const Ef = a.g(), Hf = a.g();
    const out = [0, 1, 2].map((i) => a.text(340, 250 + i * 20, "", { size: 13, anchor: "start", weight: i === 0 ? 700 : 400 }));
    const st = { r: 2.3, e: 2.3 };
    const draw = () => {
      const Ro = 96, Ri = Ro / st.r;
      a.set(inner, { r: Ri }); a.set(diel, { fill: st.e > 1.05 ? "#fef9c3" : "#f8fafc" });
      while (Ef.firstChild) Ef.removeChild(Ef.firstChild); while (Hf.firstChild) Hf.removeChild(Hf.firstChild);
      a.within(Ef, () => { for (let k = 0; k < 12; k++) { const th = (k * TAU) / 12; a.arrow(cx + (Ri + 3) * Math.cos(th), cy + (Ri + 3) * Math.sin(th), cx + (Ro - 6) * Math.cos(th), cy + (Ro - 6) * Math.sin(th), C.red, 1.5); } });
      a.within(Hf, () => { [0.35, 0.6, 0.85].forEach((u) => a.circle(cx, cy, Ri + (Ro - Ri) * u, { color: C.blue, width: 1.5, dash: "4 4" })); });
      const Z0 = (138 / Math.sqrt(st.e)) * Math.log10(st.r);
      a.setText(out[0], `Z₀ = (138/√${st.e.toFixed(2)}) log₁₀(${st.r.toFixed(2)}) = ${Z0.toFixed(1)} Ω`);
      a.setText(out[1], `VF = 1/√εr = ${(100 / Math.sqrt(st.e)).toFixed(0)} %,  C = ${((24.12 * st.e) / Math.log10(st.r)).toFixed(1)} pF/m`);
      a.setText(out[2], `with d = 1.3 mm: D = ${(1.3 * st.r).toFixed(2)} mm`);
    };
    a.slider("D/d", 1.2, 8, 0.01, 3.55, (v) => { st.r = v; draw(); }, (v) => v.toFixed(2));
    a.slider("εr", 1, 4, 0.05, 2.3, (v) => { st.e = v; draw(); }, (v) => v.toFixed(2));
  },
});

fig("line_types", {
  title: "Kinds of transmission line (cross-sections)", w: 700, h: 250,
  caption: "Two-wire line; coaxial cable (shielded, up to ≈ 50 GHz); rectangular waveguide (1–300 GHz, high power, low loss, bulky: the TE₁₀ E field peaks in the middle); stripline (conductor buried between two grounds); microstrip (εeff between 1 and εr because part of the field is in air); coplanar waveguide.",
  init(a) {
    const W = 112, names = ["two-wire", "coax", "waveguide", "stripline", "microstrip", "coplanar"];
    names.forEach((n, i) => { const x = 8 + i * 115; a.rect(x, 20, W, 180, { r: 8, fill: "#f8fafc", color: C.soft, width: 1 }); a.text(x + W / 2, 220, n, { size: 12, weight: 700 }); });
    const cx = (i) => 8 + i * 115 + W / 2, cy = 110;
    // two-wire
    a.circle(cx(0) - 22, cy, 9, { fill: "#b45309", color: "none" }); a.circle(cx(0) + 22, cy, 9, { fill: "#b45309", color: "none" });
    for (const s of [-1, 1]) a.path(`M${cx(0) - 13},${cy + s * 3} Q${cx(0)},${cy + s * 26} ${cx(0) + 13},${cy + s * 3}`, { color: C.red, width: 1.3 });
    // coax
    a.circle(cx(1), cy, 40, { fill: "#fef9c3", color: C.metal, width: 5 }); a.circle(cx(1), cy, 10, { fill: "#b45309", color: "none" });
    for (let k = 0; k < 8; k++) { const th = (k * TAU) / 8; a.line(cx(1) + 12 * Math.cos(th), cy + 12 * Math.sin(th), cx(1) + 36 * Math.cos(th), cy + 36 * Math.sin(th), { color: C.red, width: 1.2 }); }
    // waveguide
    a.rect(cx(2) - 45, cy - 25, 90, 50, { color: C.metal, width: 5 });
    const wg = Array.from({ length: 9 }, (_, k) => a.line(cx(2) - 40 + k * 10, cy - 22, cx(2) - 40 + k * 10, cy + 22, { color: C.red, width: 1.5 }));
    // stripline
    a.rect(cx(3) - 45, cy - 40, 90, 6, { fill: C.metal, color: "none" }); a.rect(cx(3) - 45, cy + 34, 90, 6, { fill: C.metal, color: "none" }); a.rect(cx(3) - 45, cy - 34, 90, 68, { fill: "#dcfce7", color: "none" }); a.rect(cx(3) - 14, cy - 3, 28, 6, { fill: "#b45309", color: "none" });
    for (const s of [-1, 1]) for (const dx of [-10, 0, 10]) a.line(cx(3) + dx, cy + s * 4, cx(3) + dx * 1.8, cy + s * 33, { color: C.red, width: 1.1 });
    // microstrip
    a.rect(cx(4) - 45, cy + 26, 90, 6, { fill: C.metal, color: "none" }); a.rect(cx(4) - 45, cy, 90, 26, { fill: "#dcfce7", color: "none" }); a.rect(cx(4) - 14, cy - 5, 28, 5, { fill: "#b45309", color: "none" });
    for (const dx of [-16, -8, 0, 8, 16]) a.path(`M${cx(4) + dx * 0.8},${cy} L${cx(4) + dx * 1.6},${cy + 25}`, { color: C.red, width: 1.1 });
    for (const s of [-1, 1]) a.path(`M${cx(4) + s * 14},${cy - 3} Q${cx(4) + s * 34},${cy - 22} ${cx(4) + s * 40},${cy + 24}`, { color: C.red, width: 1.1, dash: "3 2" });
    a.text(cx(4), cy - 30, "fringing in air", { size: 9, color: C.red });
    // CPW
    a.rect(cx(5) - 45, cy, 90, 26, { fill: "#dcfce7", color: "none" }); a.rect(cx(5) - 45, cy - 5, 28, 5, { fill: C.metal, color: "none" }); a.rect(cx(5) + 17, cy - 5, 28, 5, { fill: C.metal, color: "none" }); a.rect(cx(5) - 9, cy - 5, 18, 5, { fill: "#b45309", color: "none" });
    for (const s of [-1, 1]) a.path(`M${cx(5) + s * 9},${cy - 3} Q${cx(5) + s * 13},${cy - 14} ${cx(5) + s * 17},${cy - 3}`, { color: C.red, width: 1.2 });
    a.loop((t) => wg.forEach((l, k) => { const x = (k + 0.5) / 9, h = 22 * Math.sin(Math.PI * x) * Math.cos(t * 3); a.set(l, { y1: cy - h, y2: cy + h, opacity: 0.3 + 0.7 * Math.abs(Math.sin(Math.PI * x)) }); }));
  },
});

fig("smith_chart", {
  title: "The Smith chart: rotating towards the generator", w: 680, h: 400,
  caption: "Γ-plane with circles of constant r and arcs of constant x (normalised z = Z/Z₀). Moving a length l from the load towards the generator turns Γ CLOCKWISE by 2βl = 720°·l/λ on the |Γ| circle; one full turn is λ/2. The SWR is the r where the circle crosses the right half of the real axis.",
  init(a) {
    const cx = 210, cy = 200, R = 175;
    const P = (g) => [cx + R * g[0], cy - R * g[1]];
    const clipId = "c" + Math.random().toString(36).slice(2, 7);
    const cp = a.el("clipPath", { id: clipId }); a.el("circle", { cx, cy, r: R }, cp);
    const grid = a.g({ "clip-path": `url(#${clipId})` });
    a.circle(cx, cy, R, { fill: "#fffef5", color: C.ink, width: 2 });
    a.within(grid, () => {
      [0.2, 0.5, 1, 2, 5].forEach((r) => a.circle(cx + (R * r) / (1 + r), cy, R / (1 + r), { color: r === 1 ? C.orange : C.soft, width: r === 1 ? 1.6 : 1.1 }));
      [0.2, 0.5, 1, 2, 5].forEach((x) => [1, -1].forEach((s) => a.circle(cx + R, cy - (s * R) / x, R / x, { color: x === 1 ? C.teal : C.soft, width: x === 1 ? 1.6 : 1.1 })));
      a.line(cx - R, cy, cx + R, cy, { color: C.mid, width: 1.2 });
    });
    [[0.2, "0.2"], [0.5, "0.5"], [1, "1"], [2, "2"], [5, "5"]].forEach(([r, s]) => a.text(cx + (R * (r - 1)) / (r + 1) + 2, cy + 11, s, { size: 9, color: C.mid, anchor: "start" }));
    a.text(cx - R - 6, cy, "short", { size: 11, anchor: "end", color: C.mid }); a.text(cx + R + 6, cy, "open", { size: 11, anchor: "start", color: C.mid });
    a.text(cx, cy - R - 10, "+jx inductive", { size: 11, color: C.teal }); a.text(cx, cy + R + 14, "−jx capacitive", { size: 11, color: C.teal });
    const circ = a.circle(cx, cy, 1, { color: C.purple, width: 1.6, dash: "5 4" });
    const arc = a.path("", { color: C.purple, width: 3.5 });
    const ptL = a.circle(0, 0, 6, { fill: C.blue, color: C.bg }), pt = a.circle(0, 0, 7, { fill: C.red, color: C.bg });
    const lab = a.text(0, 0, "z_L", { size: 12, weight: 700, color: C.blue });
    const out = [0, 1, 2, 3, 4].map((i) => a.text(420, 60 + i * 26, "", { size: 14, anchor: "start", weight: i === 3 ? 700 : 400 }));
    const cases = { "50 Ω, 100 + j50, 0.2λ": [2, 1, 0.2, 50], "Pozar: 100 Ω, 40 + j70, 0.3λ": [0.4, 0.7, 0.3, 100], "exam 4: jZ₀ at λ/8": [0, 1, 0.125, 1] };
    let cur = null;
    const g2z = ([gr, gi]) => { const dr = (1 - gr) ** 2 + gi * gi; return [(1 - gr * gr - gi * gi) / dr, (2 * gi) / dr]; };
    a.buttons(Object.keys(cases), (i, k) => {
      const [r, x, l, Z0] = cases[k];
      const dr = (r + 1) ** 2 + x * x, g = [(r * r + x * x - 1) / dr, (2 * x) / dr], m = Math.hypot(...g), ang = Math.atan2(g[1], g[0]);
      cur = { g, m, ang, l, Z0, r, x };
      a.set(circ, { r: R * m });
      a.set(ptL, { cx: P(g)[0], cy: P(g)[1] }); a.set(lab, { x: P(g)[0] + 14, y: P(g)[1] - 12 });
      a.setText(out[0], `z_L = ${r} ${x >= 0 ? "+" : "−"} j${Math.abs(x)}  (Z₀ = ${Z0 === 1 ? "Z₀" : Z0 + " Ω"})`);
      a.setText(out[1], `Γ_L = ${m.toFixed(3)} ∠ ${deg(ang).toFixed(1)}°`);
      a.setText(out[2], `SWR = ${m > 0.999 ? "∞" : ((1 + m) / (1 - m)).toFixed(2)}`);
    });
    a.loop((t) => {
      if (!cur) return;
      const u = Math.min(1, (t % 7) / 5), l = u * cur.l, a2 = cur.ang - 4 * Math.PI * l;
      const g = [cur.m * Math.cos(a2), cur.m * Math.sin(a2)];
      a.set(pt, { cx: P(g)[0], cy: P(g)[1] });
      let d = ""; for (let k = 0; k <= 60; k++) { const aa = cur.ang - (4 * Math.PI * l * k) / 60; const q = P([cur.m * Math.cos(aa), cur.m * Math.sin(aa)]); d += (k ? "L" : "M") + q[0].toFixed(1) + "," + q[1].toFixed(1); }
      a.set(arc, { d });
      const z = g2z(g);
      a.setText(out[3], `after ${l.toFixed(3)} λ: z = ${Math.abs(z[0]) > 1e3 || !isFinite(z[0]) ? "∞ (open)" : `${z[0].toFixed(3)} ${z[1] >= 0 ? "+" : "−"} j${Math.abs(z[1]).toFixed(3)}`}`);
      a.setText(out[4], cur.Z0 > 1 && isFinite(z[0]) && Math.abs(z[0]) < 1e3 ? `Z = ${(z[0] * cur.Z0).toFixed(1)} ${z[1] >= 0 ? "+" : "−"} j${Math.abs(z[1] * cur.Z0).toFixed(1)} Ω` : "");
    });
  },
});

fig("twoport", {
  title: "Scattering parameters of a two-port", w: 680, h: 220,
  caption: "a_i are incident and b_i reflected waves (normalised by √Z₀). S₁₁ = b₁/a₁ and S₂₁ = b₂/a₁ are measured with port 2 MATCHED (a₂ = 0), so nothing comes back from the load. |S₂₁|² is the gain or insertion loss; −20 log|S₁₁| is the return loss.",
  init(a) {
    Parts.box(a, 340, 110, 160, 110, "[S]", { size: 22, fill: "#f8fafc" });
    a.text(250, 60, "port 1", { size: 13, weight: 700 }); a.text(430, 60, "port 2", { size: 13, weight: 700 });
    a.line(60, 90, 260, 90, { color: C.soft, width: 1 }); a.line(420, 90, 610, 90, { color: C.soft, width: 1 });
    Parts.resistorV(a, 620, 80, 150, "Z₀ (matched)");
    const waves = [[90, 80, 250, C.blue, "a₁"], [130, 250, 80, C.orange, "b₁ = S₁₁a₁"], [90, 430, 600, C.green, "b₂ = S₂₁a₁"]];
    const ps = waves.map(([y, x1, x2, c, n]) => { a.arrow(x1, y + 40, x2, y + 40, c, 2); a.text((x1 + x2) / 2, y + 58, n, { size: 13, color: c, weight: 700 }); return [a.path("", { color: c, width: 2.5 }), y, x1, x2]; });
    a.text(520, 200, "a₂ = 0", { size: 13, color: C.mid });
    a.loop((t) => ps.forEach(([p, y, x1, x2], i) => { const dir = Math.sign(x2 - x1), amp = i === 1 ? 6 : i === 2 ? 11 : 14; let d = ""; for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x += 2) d += (d ? "L" : "M") + x + "," + (y + 10 - amp * Math.sin((x * dir) / 12 - t * 5)).toFixed(1); a.set(p, { d }); }));
  },
});

fig("lsection", {
  title: "L-section matching networks", w: 680, h: 300,
  caption: "Two reactive elements match any load at one frequency. If z_L is inside the r = 1 circle (R_L > Z₀) the shunt element goes next to the load; otherwise the series element does. Each case has two solutions. Values from the Module 2 example (0.5 GHz) and problem (2 GHz).",
  init(a) {
    const g = a.g();
    const out = a.note("");
    const sols = [
      { t: "200 − j100 Ω on 100 Ω, solution 1", shuntAtLoad: true, ser: ["L", "38.8 nH"], sh: ["C", "0.92 pF"], zl: "Z_L = 200 − j100 Ω (series RC)" },
      { t: "solution 2", shuntAtLoad: true, ser: ["C", "2.61 pF"], sh: ["L", "46.1 nH"], zl: "Z_L = 200 − j100 Ω (series RC)" },
      { t: "25 + j15 Ω on 50 Ω, solution 1", shuntAtLoad: false, ser: ["L", "0.80 nH"], sh: ["C", "1.59 pF"], zl: "Z_L = 25 + j15 Ω" },
      { t: "solution 2", shuntAtLoad: false, ser: ["C", "1.99 pF"], sh: ["L", "3.98 nH"], zl: "Z_L = 25 + j15 Ω" },
    ];
    const draw = (s) => {
      while (g.firstChild) g.removeChild(g.firstChild);
      a.within(g, () => {
        const top = 80, bot = 220;
        a.rect(20, top - 12, 150, 24, { fill: C.steel, color: C.metal }); a.rect(20, bot - 12, 150, 24, { fill: C.steel, color: C.metal }); a.text(95, top - 26, "line Z₀ (from the source)", { size: 12 });
        const xs = s.shuntAtLoad ? [[170, 340, "series"], [440, "shunt"]] : [[170, 330, "shunt-first"], [330, 470, "series"]];
        const shuntX = s.shuntAtLoad ? 440 : 250;
        const serA = s.shuntAtLoad ? 220 : 330, serB = s.shuntAtLoad ? 360 : 470;
        a.line(170, top, serA, top); if (s.ser[0] === "L") Parts.inductor(a, serA, top, serB, `${s.ser[1]}`); else Parts.capacitor(a, serA, top, serB, `${s.ser[1]}`);
        a.line(serB, top, 580, top); a.line(170, bot, 580, bot);
        if (s.shuntAtLoad) a.line(170, top, serA, top);
        a.line(shuntX, top, shuntX, top + 30); a.line(shuntX, bot - 30, shuntX, bot);
        if (s.sh[0] === "L") Parts.inductorV(a, shuntX, top + 30, bot - 30, s.sh[1]); else Parts.capacitorV(a, shuntX, top + 30, bot - 30, s.sh[1]);
        a.circle(shuntX, top, 4, { fill: C.ink }); a.circle(shuntX, bot, 4, { fill: C.ink });
        Parts.resistorV(a, 600, top, bot, ""); a.line(580, top, 600, top); a.line(580, bot, 600, bot);
        a.text(620, 150, "Z_L", { size: 14, anchor: "start", weight: 700 });
        a.text(400, 270, `${s.shuntAtLoad ? "z_L inside r = 1 → shunt next to the load, then series" : "z_L outside r = 1 → series next to the load, then shunt"}`, { size: 13, color: C.blue });
      });
      out.textContent = `${s.zl}: series ${s.ser[0]} = ${s.ser[1]}, shunt ${s.sh[0]} = ${s.sh[1]}`;
    };
    a.buttons(["example sol. 1", "example sol. 2", "problem sol. 1", "problem sol. 2"], (i) => draw(sols[i]));
  },
});

fig("quarterwave", {
  title: "Quarter-wave transformer and its bandwidth", w: 680, h: 320,
  caption: "A λ/4 section of Z₁ = √(Z₀Z_L) makes Z_in = Z₁²/Z_L = Z₀ at f₀ only. Off f₀ the section is no longer λ/4 and |Γ| grows; the band where SWR stays under the limit (shaded) is the fractional bandwidth. Example: 10 → 50 Ω gives 29 % for SWR ≤ 1.5.",
  init(a) {
    a.rect(30, 30, 150, 14, { fill: C.steel, color: C.metal }); a.text(105, 22, "Z₀", { size: 13, weight: 700 });
    const sec = a.rect(180, 26, 140, 22, { fill: "#fde68a", color: C.amber }); const z1t = a.text(250, 18, "", { size: 13, weight: 700 }); a.text(250, 62, "λ/4 at f₀", { size: 11, color: C.mid });
    Parts.resistor(a, 320, 37, 400, ""); const zlt = a.text(360, 18, "", { size: 13, weight: 700 });
    const p = a.plot(60, 90, 560, 180, [0, 2], [0, 1]);
    p.axes("f / f₀", "|Γ_in|", {});
    for (let k = 0; k <= 4; k++) a.text(p.X(k / 2), 286, (k / 2).toFixed(1), { size: 10, color: C.mid });
    const band = a.rect(0, 90, 0, 180, { fill: C.green, color: "none", opacity: 0.12 });
    const lim = a.line(60, 0, 620, 0, { color: C.red, dash: "5 4", width: 1.5 });
    const curve = a.path("", { color: C.blue, width: 3 });
    const read = a.text(610, 110, "", { size: 14, anchor: "end", weight: 700 });
    const cases = [[50, 10, 1.5], [100, 350, 2]];
    a.buttons(["10 → 50 Ω, SWR ≤ 1.5", "350 → 100 Ω, SWR ≤ 2"], (i) => {
      const [Z0, ZL, swr] = cases[i], Z1 = Math.sqrt(Z0 * ZL), Gm = (swr - 1) / (swr + 1);
      a.setText(z1t, `Z₁ = ${Z1.toFixed(2)} Ω`); a.setText(zlt, `Z_L = ${ZL} Ω`);
      const G = (fr) => { const t = Math.tan((Math.PI / 2) * fr); const nr = ZL, ni = Z1 * t, dr = Z1, di = ZL * t; const dd = dr * dr + di * di; const zr = (Z1 * (nr * dr + ni * di)) / dd, zi = (Z1 * (ni * dr - nr * di)) / dd; return Math.hypot(zr - Z0, zi) / Math.hypot(zr + Z0, zi); };
      a.set(curve, { d: p.d(G, 0.001, 1.999, 600) });
      a.set(lim, { y1: p.Y(Gm), y2: p.Y(Gm) });
      const bw = 2 - (4 / Math.PI) * Math.acos((Gm / Math.sqrt(1 - Gm * Gm)) * ((2 * Math.sqrt(Z0 * ZL)) / Math.abs(ZL - Z0)));
      a.set(band, { x: p.X(1 - bw / 2), width: p.X(1 + bw / 2) - p.X(1 - bw / 2) });
      a.setText(read, `Γ_m = ${Gm.toFixed(3)} · Δf/f₀ = ${(bw * 100).toFixed(0)} %`);
    });
    const dots = Parts.flowDots(a, [[30, 37], [320, 37]], { color: C.orange, gap: 30, speed: 50 });
    a.loop((t) => dots(t));
  },
});
