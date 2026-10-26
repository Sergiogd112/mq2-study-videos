/* TASN figures: air navigation, signals and systems, data, propagation and antennas. */
"use strict";

/* ------------------------------------------------------------------ navigation */
fig("nav_aids", {
  title: "Radio navigation aids at work", w: 680, h: 300,
  caption: "An NDB radiates the same signal in all directions (the ADF on board points at it); a VOR sweeps a rotating beam so the phase tells the radial; a DME times interrogation-reply pulse pairs to get the slant range; satellites broadcast time signals.",
  init(a) {
    a.rect(0, 250, 680, 50, { fill: "#ecfccb", color: "none" });
    // satellites
    const sats = [[120, 30], [560, 26]];
    sats.forEach(([x, y]) => { a.rect(x - 8, y - 6, 16, 12, { fill: C.steel }); a.rect(x - 30, y - 4, 18, 8, { fill: C.sky, color: C.blue, width: 1 }); a.rect(x + 12, y - 4, 18, 8, { fill: C.sky, color: C.blue, width: 1 }); });
    a.text(340, 22, "GNSS: GPS · GLONASS · Galileo (broadcast)", { size: 13, color: C.mid });
    // NDB
    a.line(110, 250, 110, 200, { width: 3 }); a.line(96, 250, 110, 200); a.line(124, 250, 110, 200);
    a.text(110, 275, "NDB (LF/MF)", { size: 13 });
    // VOR
    a.rect(320, 232, 40, 18, { fill: C.faint }); a.circle(340, 226, 7, { fill: C.bg });
    a.text(340, 275, "VOR (108–118 MHz)", { size: 13 });
    // DME
    a.rect(530, 220, 18, 30, { fill: C.faint }); a.line(539, 220, 539, 204, { width: 3 });
    a.text(539, 275, "DME (L band)", { size: 13 });
    const plane = a.g();
    a.within(plane, () => Parts.plane(a, 0.9, C.ink));
    const rings = [0, 1, 2].map(() => a.circle(110, 200, 5, { color: C.blue, width: 2 }));
    const beam = a.line(340, 226, 340, 100, { color: C.orange, width: 3, opacity: 0.8 });
    const flash = a.circle(340, 226, 22, { color: C.green, width: 3 });
    const pul = [a.circle(0, 0, 4, { fill: C.purple, color: "none" }), a.circle(0, 0, 4, { fill: C.purple, color: "none" })];
    const satw = sats.map(([x, y]) => a.circle(x, y, 5, { color: C.teal, width: 1.5 }));
    a.loop((t) => {
      const px = 60 + ((t * 40) % 600), py = 120;
      plane.setAttribute("transform", `translate(${px},${py}) rotate(90)`);
      rings.forEach((r, i) => { const u = ((t * 0.6 + i / 3) % 1); a.set(r, { r: 5 + u * 150, opacity: 1 - u }); });
      const th = (t * 1.5) % TAU;
      a.set(beam, { x2: 340 + 75 * Math.sin(th), y2: 226 - 75 * Math.cos(th) * 0.45 });
      a.set(flash, { opacity: th < 0.25 ? 1 : 0 });
      const u = (t * 0.9) % 1, k = u < 0.5 ? u * 2 : 2 - u * 2;
      pul.forEach((p, i) => { const s = clamp(k - i * 0.06, 0, 1); a.set(p, { cx: lerp(px, 539, s), cy: lerp(py, 204, s) }); });
      satw.forEach((c, i) => { const v = (t * 0.5 + i * 0.5) % 1; a.set(c, { r: 5 + v * 90, opacity: 0.8 - 0.8 * v }); });
    });
  },
});

fig("globe", {
  title: "Latitude, longitude and the nautical mile", w: 640, h: 320,
  caption: "Latitude φ is measured from the equator along a meridian, longitude λ from the Greenwich meridian (red). One minute of arc along any great circle is about one nautical mile (1 nmi = 1 852 m exactly); along a parallel a minute of longitude shrinks to cos φ nautical miles.",
  init(a) {
    const cx = 170, cy = 160, R = 135, tilt = rad(22);
    a.circle(cx, cy, R, { fill: "#eff6ff", color: C.blue, width: 2 });
    const grid = a.g();
    const P = (lat, lon, lon0) => {
      const cl = Math.cos(lat), x = cl * Math.sin(lon - lon0), y1 = Math.sin(lat), z = cl * Math.cos(lon - lon0);
      const y = y1 * Math.cos(tilt) - z * Math.sin(tilt), zz = y1 * Math.sin(tilt) + z * Math.cos(tilt);
      return [cx + R * x, cy - R * y, zz];
    };
    const seg = (pts) => { let d = "", on = false; for (const [x, y, z] of pts) { if (z > 0) { d += (on ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); on = true; } else on = false; } return d; };
    const mer = Array.from({ length: 12 }, (_, i) => a.path("", { color: i === 0 ? C.red : C.sky, width: i === 0 ? 2.5 : 1.2, parent: grid }));
    const par = [-60, -30, 0, 30, 60].map((l) => a.path("", { color: l === 0 ? C.blue : C.sky, width: l === 0 ? 2.5 : 1.2, parent: grid }));
    const latArc = a.path("", { color: C.orange, width: 4 });
    const dot = a.circle(0, 0, 6, { fill: C.orange, color: C.bg });
    const lab = a.text(0, 0, "P (41.4°N, 2.2°E)", { size: 13, anchor: "start", weight: 600 });
    a.text(470, 40, "1 nmi = 1 852 m ≈ 1′ of latitude", { size: 16, weight: 700 });
    a.text(470, 72, "1° of latitude ≈ 60 nmi", { size: 15 });
    a.text(470, 100, "1 kt = 1 nmi/h", { size: 15 });
    a.text(470, 140, "along a parallel at latitude φ:", { size: 14, color: C.mid });
    a.text(470, 164, "1′ of longitude = cos φ nmi", { size: 15 });
    const pt = a.plot(360, 190, 220, 100, [0, 90], [0, 1]);
    pt.axes("φ (°)", "cos φ");
    pt.curve((x) => Math.cos(rad(x)), { color: C.blue, width: 2.5 });
    a.text(pt.X(60) - 8, pt.Y(0.5) + 16, "60°: ½ nmi", { size: 12, color: C.orange, anchor: "end" });
    a.circle(pt.X(60), pt.Y(0.5), 4, { fill: C.orange, color: "none" });
    const latP = rad(41.4), lonP = rad(2.2);
    const MER_LAT = Array.from({ length: 37 }, (_, k) => rad(-90 + k * 5)), PAR_LON = Array.from({ length: 61 }, (_, k) => rad(k * 6));
    a.loop((t) => {
      const lon0 = rad(-40) + Math.sin(t * 0.35) * rad(55);
      mer.forEach((m, i) => { const lon = rad(i * 30); a.set(m, { d: seg(MER_LAT.map((la) => P(la, lon, lon0))) }); });
      par.forEach((m, i) => { const lat = rad([-60, -30, 0, 30, 60][i]); a.set(m, { d: seg(PAR_LON.map((lo) => P(lat, lo, lon0))) }); });
      a.set(latArc, { d: seg(Array.from({ length: 30 }, (_, k) => P((latP * k) / 29, lonP, lon0))) });
      const [x, y, z] = P(latP, lonP, lon0);
      a.set(dot, { cx: x, cy: y, opacity: z > 0 ? 1 : 0.2 });
      a.set(lab, { x: x + 10, y: y - 10, opacity: z > 0 ? 1 : 0.3 });
    });
  },
});

fig("rhumb_gc", {
  title: "Rhumb line versus great circle on a Mercator chart", w: 680, h: 330,
  caption: "Barcelona → New York. The rhumb line (loxodrome, orange) keeps a constant heading and is straight on Mercator; the great circle (orthodrome, blue) is the shortest route and bows towards the pole. The counters show the distance flown by each aircraft.",
  init(a) {
    const lon0 = -90, lon1 = 20, latTop = 70, latBot = 20;
    const my = (lat) => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));
    const X = (lon) => 30 + ((lon - lon0) / (lon1 - lon0)) * 620;
    const Y = (lat) => 300 - ((my(lat) - my(latBot)) / (my(latTop) - my(latBot))) * 270;
    a.rect(30, 30, 620, 270, { fill: "#f0f9ff", color: C.soft, width: 1 });
    for (let lo = -90; lo <= 20; lo += 10) a.line(X(lo), 30, X(lo), 300, { color: C.soft, width: 1 });
    for (let la = 20; la <= 70; la += 10) { a.line(30, Y(la), 650, Y(la), { color: C.soft, width: 1 }); a.text(24, Y(la), la + "°N", { size: 11, anchor: "end", color: C.mid }); }
    const A = [41.39, 2.17], B = [40.71, -74.0];
    const v = ([la, lo]) => [Math.cos(rad(la)) * Math.cos(rad(lo)), Math.cos(rad(la)) * Math.sin(rad(lo)), Math.sin(rad(la))];
    const va = v(A), vb = v(B), om = Math.acos(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]);
    const gc = (u) => { const s1 = Math.sin((1 - u) * om) / Math.sin(om), s2 = Math.sin(u * om) / Math.sin(om); const p = va.map((c, i) => s1 * c + s2 * vb[i]); return [deg(Math.asin(p[2])), deg(Math.atan2(p[1], p[0]))]; };
    const gcPts = Array.from({ length: 101 }, (_, i) => gc(i / 100));
    a.path(gcPts.map(([la, lo], i) => (i ? "L" : "M") + X(lo) + "," + Y(la)).join(""), { color: C.blue, width: 3 });
    a.line(X(A[1]), Y(A[0]), X(B[1]), Y(B[0]), { color: C.orange, width: 3, dash: "8 5" });
    [[A, "Barcelona"], [B, "New York"]].forEach(([p, n]) => { a.circle(X(p[1]), Y(p[0]), 6, { fill: C.ink, color: C.bg }); a.text(X(p[1]), Y(p[0]) + 20, n, { size: 14, weight: 700 }); });
    const dGC = om * 3440.1;
    const dphi = rad(B[0] - A[0]), dpsi = my(B[0]) - my(A[0]), q = Math.abs(dpsi) > 1e-9 ? dphi / dpsi : Math.cos(rad(A[0]));
    const dRL = Math.sqrt(dphi * dphi + q * q * rad(B[1] - A[1]) ** 2) * 3440.1;
    const p1 = a.g(), p2 = a.g();
    a.within(p1, () => Parts.plane(a, 0.6, C.blue));
    a.within(p2, () => Parts.plane(a, 0.6, C.orange));
    const r1 = a.text(440, 52, "", { size: 14, color: C.blue, weight: 700, anchor: "start" });
    const r2 = a.text(440, 74, "", { size: 14, color: C.orange, weight: 700, anchor: "start" });
    a.loop((t) => {
      const flown = Math.min(dRL, ((t % 10) / 8) * dRL); // both fly at the same speed
      const u = Math.min(1, flown / dGC), s = flown / dRL;
      const [la, lo] = gc(u);
      const [la2, lo2] = gc(Math.min(1, u + 0.01));
      const ang = deg(Math.atan2(X(lo2) - X(lo), -(Y(la2) - Y(la))));
      p1.setAttribute("transform", `translate(${X(lo)},${Y(la)}) rotate(${ang})`);
      const w = Math.min(1, s);
      const x2 = lerp(X(A[1]), X(B[1]), w), y2 = lerp(Y(A[0]), Y(B[0]), w);
      p2.setAttribute("transform", `translate(${x2},${y2}) rotate(${deg(Math.atan2(X(B[1]) - X(A[1]), -(Y(B[0]) - Y(A[0]))))})`);
      a.setText(r1, `great circle: ${(u * dGC).toFixed(0)} / ${dGC.toFixed(0)} nmi${u >= 1 ? " ✓" : ""}`);
      a.setText(r2, `rhumb line:  ${(w * dRL).toFixed(0)} / ${dRL.toFixed(0)} nmi${w >= 1 ? " ✓" : ""}`);
    });
  },
});

fig("heading_track", {
  title: "Heading, track and drift (problem 1.1)", w: 640, h: 345,
  caption: "The nose points along the heading (045) but the wind from 360 pushes the aircraft, so it moves along the track (054): the aircraft flies crabbed. Drift is the angle between heading and track.",
  init(a) {
    const cx = 200, cy = 175, R = 140;
    a.circle(cx, cy, R, { color: C.soft });
    for (let d = 0; d < 360; d += 10) { const L = d % 30 ? 6 : 12; a.line(cx + (R - L) * Math.sin(rad(d)), cy - (R - L) * Math.cos(rad(d)), cx + R * Math.sin(rad(d)), cy - R * Math.cos(rad(d)), { color: C.mid, width: 1.2 }); }
    [["N 000", 0], ["E 090", 90], ["S 180", 180], ["W 270", 270]].forEach(([s, d]) => a.text(cx + (R + 22) * Math.sin(rad(d)), cy - (R + 14) * Math.cos(rad(d)), s, { size: 13, weight: 700 }));
    const hd = 45, tr = 54.4;
    a.line(cx, cy, cx + R * Math.sin(rad(hd)), cy - R * Math.cos(rad(hd)), { color: C.blue, width: 2, dash: "6 4" });
    a.line(cx, cy, cx + R * Math.sin(rad(tr)), cy - R * Math.cos(rad(tr)), { color: C.green, width: 3 });
    a.path(`M${cx + 70 * Math.sin(rad(hd))},${cy - 70 * Math.cos(rad(hd))} A70,70 0 0 1 ${cx + 70 * Math.sin(rad(tr))},${cy - 70 * Math.cos(rad(tr))}`, { color: C.red, width: 3 });
    a.text(cx + 62 * Math.sin(rad(50)) - 4, cy - 62 * Math.cos(rad(50)) + 16, "drift 9°", { size: 12, color: C.red, weight: 700, anchor: "end" });
    a.text(cx + (R - 30) * Math.sin(rad(38)), cy - (R - 30) * Math.cos(rad(38)) - 12, "heading 045", { size: 13, color: C.blue });
    a.text(cx + (R + 4) * Math.sin(rad(62)) + 30, cy - (R + 4) * Math.cos(rad(62)), "track 054", { size: 13, color: C.green });
    a.arrow(cx - 20, cy - 120, cx - 20, cy - 70, C.orange, 3);
    a.text(cx - 26, cy - 130, "wind from 360, 20 kt", { size: 13, color: C.orange, anchor: "end" });
    const pl = a.g();
    a.within(pl, () => Parts.plane(a, 1, C.ink));
    a.text(500, 60, "TAS 100 kt on heading 045", { size: 14, color: C.blue });
    a.text(500, 84, "+ wind 20 kt towards 180", { size: 14, color: C.orange });
    a.text(500, 108, "= GS 87 kt on track 054", { size: 14, color: C.green, weight: 700 });
    a.text(500, 150, "Heading (rumb): where the nose points", { size: 12, color: C.mid });
    a.text(500, 170, "Track (derrota): path over the ground", { size: 12, color: C.mid });
    a.text(500, 190, "Drift (deriva): heading → track angle", { size: 12, color: C.mid });
    a.loop((t) => {
      const s = (t * 0.18) % 1;
      const x = cx + s * R * Math.sin(rad(tr)), y = cy - s * R * Math.cos(rad(tr));
      pl.setAttribute("transform", `translate(${x},${y}) rotate(${hd})`);
    });
  },
});

fig("wind_triangle", {
  title: "Interactive wind triangle", w: 640, h: 340,
  caption: "Air vector (heading, TAS) + wind vector (towards = from + 180) = ground vector (track, GS). Move the sliders: the numbers are computed with the same components the exam uses (east = V sin θ, north = V cos θ).",
  init(a) {
    const ox = 210, oy = 175;
    a.circle(ox, oy, 4, { fill: C.ink });
    a.arrow(ox, oy, ox, oy - 40, C.mid, 1.4); a.text(ox, oy - 50, "N", { size: 12, color: C.mid });
    const air = a.arrow(0, 0, 0, 0, C.blue, 3.5), wind = a.arrow(0, 0, 0, 0, C.orange, 3.5), gnd = a.arrow(0, 0, 0, 0, C.green, 3.5);
    const la = a.text(0, 0, "", { size: 13, color: C.blue, weight: 700 }), lw = a.text(0, 0, "", { size: 13, color: C.orange, weight: 700 }), lg = a.text(0, 0, "", { size: 13, color: C.green, weight: 700 });
    const out = [0, 1, 2, 3].map((i) => a.text(415, 70 + i * 28, "", { size: 14, anchor: "start", weight: i === 2 ? 700 : 400 }));
    const pl = a.g();
    a.within(pl, () => Parts.plane(a, 0.55, C.ink));
    const st = { hd: 45, tas: 100, wf: 0, ws: 20 };
    let geo = null;
    const draw = () => {
      const ax = st.tas * Math.sin(rad(st.hd)), ay = st.tas * Math.cos(rad(st.hd));
      const wt = st.wf + 180, wx = st.ws * Math.sin(rad(wt)), wy = st.ws * Math.cos(rad(wt));
      const gx = ax + wx, gy = ay + wy, gs = Math.hypot(gx, gy), trk = (deg(Math.atan2(gx, gy)) + 360) % 360;
      const k = 150 / Math.max(st.tas + st.ws, 1);
      const P = (x, y) => [ox + x * k, oy - y * k];
      const [x1, y1] = P(ax, ay), [x2, y2] = P(gx, gy);
      a.set(air, { x1: ox, y1: oy, x2: x1, y2: y1 }); a.set(wind, { x1, y1, x2, y2 }); a.set(gnd, { x1: ox, y1: oy, x2, y2 });
      a.set(la, { x: (ox + x1) / 2 - 14, y: (oy + y1) / 2 - 10 }); a.setText(la, "air");
      a.set(lw, { x: (x1 + x2) / 2 + 14, y: (y1 + y2) / 2 - 8 }); a.setText(lw, "wind");
      a.set(lg, { x: (ox + x2) / 2 + 22, y: (oy + y2) / 2 + 12 }); a.setText(lg, "ground");
      let drift = ((trk - st.hd + 540) % 360) - 180;
      a.setText(out[0], `air:    (${fmt(ax)}, ${fmt(ay)}) kt`);
      a.setText(out[1], `wind: (${fmt(wx)}, ${fmt(wy)}) kt → ${String(Math.round(wt % 360)).padStart(3, "0")}`);
      a.setText(out[2], `track ${String(Math.round(trk) % 360).padStart(3, "0")} · GS ${gs.toFixed(0)} kt`);
      a.setText(out[3], `drift ${Math.abs(drift).toFixed(1)}° ${drift > 0.05 ? "to the right" : drift < -0.05 ? "to the left" : ""}`);
      geo = { x2, y2 };
    };
    a.slider("heading", 0, 359, 1, st.hd, (v) => { st.hd = v; draw(); }, (v) => String(v).padStart(3, "0"));
    a.slider("TAS (kt)", 40, 300, 1, st.tas, (v) => { st.tas = v; draw(); });
    a.slider("wind from", 0, 359, 1, st.wf, (v) => { st.wf = v; draw(); }, (v) => String(v).padStart(3, "0"));
    a.slider("wind (kt)", 0, 80, 1, st.ws, (v) => { st.ws = v; draw(); });
    draw();
    a.loop((t) => { if (!geo) return; const u = (t * 0.25) % 1; pl.setAttribute("transform", `translate(${lerp(ox, geo.x2, u)},${lerp(oy, geo.y2, u)}) rotate(${st.hd})`); });
  },
});

fig("interception", {
  title: "Interception, problem 1.2", w: 640, h: 330,
  caption: "Target on heading 225 at 500 kt; interceptor 300 nmi to the west at 1 000 kt. The cosine law gives t = 0.233 h (14 min) and the sine law the interceptor heading 090 + 20.7 = 111.",
  init(a) {
    const k = 1.15, ox = 520, oy = 70; // target start (nmi → px)
    const T = 0.2333, hT = 225, hI = 110.7;
    const tx = (t) => ox + 500 * t * Math.sin(rad(hT)) * k, ty = (t) => oy - 500 * t * Math.cos(rad(hT)) * k;
    const ix0 = ox - 300 * k, iy0 = oy;
    const ix = (t) => ix0 + 1000 * t * Math.sin(rad(hI)) * k, iy = (t) => iy0 - 1000 * t * Math.cos(rad(hI)) * k;
    a.line(ix0, oy, ox, oy, { color: C.soft, dash: "4 4" }); a.text((ix0 + ox) / 2, oy - 12, "300 nmi", { size: 13, color: C.mid });
    a.line(ox, oy, tx(T), ty(T), { color: C.orange, dash: "6 4" });
    a.line(ix0, iy0, ix(T), iy(T), { color: C.blue, dash: "6 4" });
    a.circle(tx(T), ty(T), 8, { color: C.red, width: 2.5 });
    a.text(tx(T) + 14, ty(T) + 18, "meet after 0.233 h", { size: 13, color: C.red, anchor: "start" });
    a.text(ox + 20, oy - 16, "target 500 kt, hdg 225", { size: 13, color: C.orange, anchor: "end" });
    a.text(ix0, oy - 14, "interceptor 1 000 kt, hdg 111", { size: 13, color: C.blue });
    a.path(`M${ix0 + 50},${oy} A50,50 0 0 1 ${ix0 + 50 * Math.sin(rad(hI))},${oy - 50 * Math.cos(rad(hI))}`, { color: C.blue, width: 2 });
    a.text(ix0 + 66, oy + 20, "20.7°", { size: 12, color: C.blue });
    const pT = a.g(), pI = a.g();
    a.within(pT, () => Parts.plane(a, 0.75, C.orange));
    a.within(pI, () => Parts.plane(a, 0.75, C.blue));
    const clock = a.text(40, 300, "", { size: 15, anchor: "start", weight: 700 });
    a.loop((t) => {
      const u = Math.min(T, ((t % 8) / 6.5) * T);
      pT.setAttribute("transform", `translate(${tx(u)},${ty(u)}) rotate(${hT})`);
      pI.setAttribute("transform", `translate(${ix(u)},${iy(u)}) rotate(${hI})`);
      a.setText(clock, `t = ${(u * 60).toFixed(1)} min · gap ${Math.hypot((tx(u) - ix(u)) / k, (ty(u) - iy(u)) / k).toFixed(0)} nmi`);
    });
  },
});

fig("radials", {
  title: "Radials and positions, problem 1.3", w: 640, h: 300,
  caption: "A radial is the direction the wave travels away from the beacon. 10 nmi on radial 190 then 14 nmi on radial 210 one minute later: ΔP = 5.73 nmi in 1 min → 344 kt on track 247.",
  init(a) {
    const bx = 430, by = 60, k = 14;
    a.circle(bx, by, 7, { fill: C.purple, color: C.bg }); a.text(bx + 14, by - 6, "beacon", { size: 13, anchor: "start", color: C.purple });
    const P = (r, d) => [bx + r * k * Math.sin(rad(d)), by - r * k * Math.cos(rad(d))];
    const p1 = P(10, 190), p2 = P(14, 210);
    a.line(bx, by, ...P(16, 190), { color: C.soft, dash: "5 4" }); a.line(bx, by, ...P(16, 210), { color: C.soft, dash: "5 4" });
    a.text(...P(16.8, 188), "R-190", { size: 12, color: C.mid }); a.text(...P(16.8, 212), "R-210", { size: 12, color: C.mid });
    a.circle(...p1, 5, { fill: C.blue, color: "none" }); a.text(p1[0] + 16, p1[1] + 4, "P₁: 10 nmi at t = 0", { size: 13, anchor: "start" });
    a.circle(...p2, 5, { fill: C.blue, color: "none" }); a.text(p2[0] - 10, p2[1] + 18, "P₂: 14 nmi at t = 60 s", { size: 13, anchor: "end" });
    a.arrow(...p1, ...p2, C.green, 3);
    a.text(60, 40, "P = r (sin θ, cos θ)", { size: 15, anchor: "start" });
    a.text(60, 66, "ΔP = (−5.26, −2.28) nmi", { size: 15, anchor: "start" });
    a.text(60, 92, "|ΔP| = 5.73 nmi in 1 min → 344 kt", { size: 15, anchor: "start", color: C.green, weight: 700 });
    a.text(60, 118, "track = atan2(−5.26, −2.28) = 247", { size: 15, anchor: "start", color: C.green, weight: 700 });
    const pl = a.g(); a.within(pl, () => Parts.plane(a, 0.6, C.ink));
    const wave = a.circle(bx, by, 3, { color: C.purple, width: 1.5 });
    a.loop((t) => {
      const u = (t * 0.3) % 1;
      pl.setAttribute("transform", `translate(${lerp(p1[0], p2[0], u)},${lerp(p1[1], p2[1], u)}) rotate(246.6)`);
      a.set(wave, { r: 3 + ((t * 120) % 230), opacity: 1 - ((t * 120) % 230) / 230 });
    });
  },
});

/* ------------------------------------------------------------------ signals and systems */
fig("tele_model", {
  title: "The general telecommunication model", w: 680, h: 220,
  caption: "Source → transmitter → channel → receiver → destination. The channel attenuates (frequency-dependent) and adds noise and interference; the receiver must recover the message from what is left.",
  init(a) {
    const xs = [60, 190, 340, 490, 620], names = ["source", "transmitter", "channel", "receiver", "destination"];
    xs.forEach((x, i) => Parts.box(a, x, 70, i === 2 ? 120 : 100, 44, names[i], { fill: i === 2 ? "#fef3c7" : "#eff6ff", color: i === 2 ? C.amber : C.blue }));
    a.arrow(340, 150, 340, 96, C.red, 2); a.text(340, 165, "noise · interference", { size: 13, color: C.red });
    const sigs = [0, 1, 2, 3].map(() => a.path("", { color: C.blue, width: 2 }));
    a.text(340, 205, "line (two-wire, coax, fibre) or radio (air, vacuum): attenuation + bandwidth", { size: 12, color: C.mid });
    a.loop((t) => {
      const segs = [[110, 140], [240, 280], [400, 440], [540, 570]];
      segs.forEach(([x0, x1], i) => {
        let d = "";
        for (let x = x0; x <= x1; x += 1) {
          const A = i < 2 ? 12 : 5;
          const n = i >= 2 && i < 3 ? (Math.sin(x * 2.3 + t * 40) + Math.sin(x * 5.1 - t * 23)) * 2.5 : 0;
          d += (d ? "L" : "M") + x + "," + (70 + A * Math.sin((x - t * 60) / 5) + n);
        }
        a.set(sigs[i], { d });
      });
    });
  },
});

fig("duplex", {
  title: "Simplex, half-duplex and full-duplex", w: 640, h: 250,
  caption: "Simplex: one direction only. Half-duplex: both directions but one at a time (pilot and controller share the frequency with push-to-talk). Full-duplex: both at once (telephone).",
  init(a) {
    const rows = [["simplex", 50], ["half-duplex", 125], ["full-duplex", 200]];
    const ups = [];
    rows.forEach(([n, y], i) => {
      a.text(70, y, n, { size: 14, weight: 700 });
      Parts.box(a, 190, y, 70, 36, i === 1 ? "pilot" : "A"); Parts.box(a, 530, y, 70, 36, i === 1 ? "ATC" : "B");
      a.line(225, y, 495, y, { color: C.soft, width: 6 });
      const f = Parts.flowDots(a, [[226, y - (i === 2 ? 6 : 0)], [494, y - (i === 2 ? 6 : 0)]], { color: C.blue, gap: 40, speed: 70 });
      const b = i === 2 ? Parts.flowDots(a, [[494, y + 6], [226, y + 6]], { color: C.orange, gap: 40, speed: 70 }) : i === 1 ? Parts.flowDots(a, [[494, y], [226, y]], { color: C.orange, gap: 40, speed: 70 }) : null;
      ups.push([i, f, b]);
    });
    const ptt = a.text(360, 100, "", { size: 12, color: C.mid });
    a.loop((t) => {
      const phase = Math.floor(t / 2.5) % 2;
      for (const [i, f, b] of ups) {
        f(t); if (b) b(t);
        if (i === 1) { f.show(phase === 0); b.show(phase === 1); }
      }
      a.setText(ptt, phase ? "ATC transmits (push-to-talk)" : "pilot transmits (push-to-talk)");
    });
  },
});

fig("topologies", {
  title: "Network topologies", w: 680, h: 220,
  caption: "Bus: all terminals in parallel on one line (Ethernet). Ring: closed loop (token ring). Star: everything through a hub or exchange. Tree: a bus of buses (2022 Q7).",
  init(a) {
    const term = (x, y) => a.rect(x - 9, y - 9, 18, 18, { fill: C.blue, color: "none", r: 3 });
    const dots = [];
    // bus
    a.line(20, 110, 150, 110, { width: 3 }); [35, 75, 115, 145].forEach((x, i) => { a.line(x, 110, x, i % 2 ? 140 : 80); term(x, i % 2 ? 148 : 72); });
    dots.push(Parts.flowDots(a, [[20, 110], [150, 110]], { n: 1, color: C.orange, r: 5, speed: 60 }));
    // ring
    const rc = [250, 110], rr = 50;
    a.circle(...rc, rr, { width: 3 });
    for (let i = 0; i < 6; i++) term(rc[0] + rr * Math.cos((i * TAU) / 6), rc[1] + rr * Math.sin((i * TAU) / 6));
    const ringDot = a.circle(0, 0, 5, { fill: C.orange, color: "none" });
    // star
    const sc = [410, 110];
    a.circle(...sc, 12, { fill: C.purple, color: "none" });
    const starPts = Array.from({ length: 6 }, (_, i) => [sc[0] + 60 * Math.cos((i * TAU) / 6 + 0.3), sc[1] + 60 * Math.sin((i * TAU) / 6 + 0.3)]);
    starPts.forEach((p) => { a.line(...sc, ...p); term(...p); });
    dots.push(Parts.flowDots(a, [starPts[0], sc, starPts[3]], { n: 1, color: C.orange, r: 5, speed: 60 }));
    // tree
    a.line(500, 70, 660, 70, { width: 3 }); [530, 630].forEach((x) => { a.line(x, 70, x, 120); a.line(x - 30, 120, x + 30, 120, { width: 3 }); [x - 25, x, x + 25].forEach((xx) => { a.line(xx, 120, xx, 150); term(xx, 158); }); });
    [["bus", 85], ["ring", 250], ["star", 410], ["tree", 580]].forEach(([n, x]) => a.text(x, 205, n, { size: 15, weight: 700 }));
    dots.push(Parts.flowDots(a, [[505, 158], [505, 120], [530, 120], [530, 70], [630, 70], [630, 120], [655, 120], [655, 158]], { n: 1, color: C.orange, r: 5, speed: 80 }));
    a.loop((t) => { dots.forEach((d) => d(t)); const th = t * 1.4; a.set(ringDot, { cx: rc[0] + rr * Math.cos(th), cy: rc[1] + rr * Math.sin(th) }); });
  },
});

fig("phasor", {
  title: "A rotating phasor draws a cosine", w: 680, h: 260,
  caption: "A cos(2πf₀t + φ) is the real part of the phasor A e^{j(2πf₀t + φ)}: a vector of length A turning counter-clockwise at f₀. Its projection on the real axis traces the cosine. The complex plane is drawn turned by 90° (real axis UP, imaginary axis to the LEFT) so that the real part is the height of the tip and lines up with the plot.",
  init(a) {
    // complex plane drawn with the real axis pointing UP, so the height of the tip is Re{·} = x(t)
    const cx = 130, cy = 130, R = 90;
    a.circle(cx, cy, R, { color: C.soft });
    a.arrow(cx + R + 15, cy, cx - R - 18, cy, C.mid, 1.2); a.arrow(cx, cy + R + 15, cx, cy - R - 18, C.mid, 1.2);  // +Im to the left, +Re up
    a.text(cx + 8, cy - R - 14, "Re", { size: 12, color: C.mid, anchor: "start" }); a.text(cx - R - 16, cy - 12, "Im", { size: 12, color: C.mid });
    const vec = a.arrow(cx, cy, cx, cy - R, C.blue, 3.5), proj = a.line(0, 0, 0, 0, { color: C.orange, width: 1.5, dash: "4 3" });
    const pl = a.plot(270, 40, 380, 180, [0, 2], [-1.2, 1.2]);
    pl.axes("t (periods)", "x(t)", { xAt: 0 });
    const ghost = a.path("", { color: C.faint, width: 2.5 }), tr = a.path("", { color: C.orange, width: 2.5 });
    const dot = a.circle(0, 0, 5, { fill: C.orange, color: "none" });
    const st = { A: 1, ph: 0 };
    a.slider("amplitude A", 0.2, 1, 0.05, 1, (v) => (st.A = v));
    a.slider("phase φ (°)", -180, 180, 15, 0, (v) => (st.ph = rad(v)));
    a.loop((t) => {
      const s = (t * 0.35) % 2, th = TAU * s + st.ph;
      const x = cx - R * st.A * Math.sin(th), y = cy - R * st.A * Math.cos(th);
      a.set(vec, { x2: x, y2: y });
      a.set(dot, { cx: pl.X(s), cy: pl.Y(st.A * Math.cos(th)) });
      a.set(proj, { x1: x, y1: y, x2: pl.X(s), y2: y });
      const key = st.A + ":" + st.ph;
      if (ghost._k !== key) { ghost._k = key; a.set(ghost, { d: pl.d((u) => st.A * Math.cos(TAU * u + st.ph), 0, 2, 300) }); }
      a.set(tr, { d: pl.d((u) => st.A * Math.cos(TAU * u + st.ph), 0, s, 300) });
    });
  },
});

fig("fourier_square", {
  title: "Fourier series: building a square wave", w: 680, h: 280,
  caption: "Adding odd harmonics (4/π)·sin((2k−1)ω₀t)/(2k−1) approaches the square wave; the overshoot at each jump (Gibbs, ≈ 9 %) never disappears. The line spectrum below shows the two-sided coefficients |c_n| = 2/(πn) for odd n (each sine of amplitude 4/(πn) splits into two lines).",
  init(a) {
    const pl = a.plot(40, 20, 600, 150, [0, 2], [-1.4, 1.4]);
    pl.axes("t / T₀", "", { xAt: 0 });
    pl.curve((x) => (x % 1 < 0.5 ? 1 : -1), { color: C.soft, width: 2 });
    const sum = a.path("", { color: C.blue, width: 2.5 });
    const sp = a.plot(40, 200, 600, 60, [0, 26], [0, 0.7]);
    a.line(40, 260, 650, 260, { color: C.ink, width: 1.4 });
    const bars = Array.from({ length: 13 }, (_, k) => { const n = 2 * k + 1; const h = 2 / Math.PI / n; /* two-sided |c_n| */ return a.line(sp.X(n), sp.Y(0), sp.X(n), sp.Y(h), { color: C.soft, width: 5 }); });
    a.text(650, 275, "harmonic n", { size: 12, anchor: "end", color: C.mid });
    const lab = a.text(60, 12, "", { size: 14, weight: 700, color: C.blue, anchor: "start" });
    const cache = {};
    let lastK = 0;
    a.loop((t) => {
      const K = 1 + (Math.floor(t / 0.9) % 13);
      if (K === lastK) return;
      lastK = K;
      a.set(sum, { d: cache[K] || (cache[K] = pl.d((x) => { let s = 0; for (let k = 1; k <= K; k++) s += Math.sin(TAU * (2 * k - 1) * x) / (2 * k - 1); return (4 / Math.PI) * s; }, 0, 2, 500)) });
      bars.forEach((b, k) => a.set(b, { stroke: k < K ? C.blue : C.soft }));
      a.setText(lab, `${K} harmonic${K > 1 ? "s" : ""} (up to n = ${2 * K - 1})`);
    });
  },
});

fig("pulse_spectrum", {
  title: "Pulse train ↔ sinc envelope", w: 680, h: 300,
  caption: "A train of pulses of width τ and period T has spectral lines every 1/T under the envelope (Aτ/T)·sinc(fτ); the first zero is at 1/τ. Narrow pulses → wide spectrum. The mean value (DC line) is Aτ/T.",
  init(a) {
    const tp = a.plot(40, 20, 600, 90, [-1.5, 1.5], [0, 1.3]);
    tp.axes("t / T", "x(t)", {});
    const train = a.path("", { color: C.blue, width: 2.5 });
    const fp = a.plot(40, 160, 600, 110, [-10, 10], [-0.25, 0.6]);
    fp.axes("f · T", "c_n", { xAt: 0, yAt: 0 });
    const env = a.path("", { color: C.orange, width: 2, dash: "6 4" });
    const lines = Array.from({ length: 21 }, () => a.line(0, 0, 0, 0, { color: C.blue, width: 3 }));
    const read = a.text(636, 140, "", { size: 13, anchor: "end", weight: 700 });
    const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
    a.slider("duty τ/T", 0.05, 0.6, 0.01, 0.25, (d) => {
      a.set(train, { d: tp.d((x) => { const u = ((x % 1) + 1) % 1; return (u < d / 2 || u > 1 - d / 2) ? 1 : 0; }, -1.5, 1.5, 1200) });
      a.set(env, { d: fp.d((f) => d * sinc(f * d), -10, 10, 600) });
      lines.forEach((l, i) => { const n = i - 10, c = d * sinc(n * d); a.set(l, { x1: fp.X(n), y1: fp.Y(0), x2: fp.X(n), y2: fp.Y(c) }); });
      a.setText(read, `mean = Aτ/T = ${d.toFixed(2)} · first zero at f = ${(1 / d).toFixed(1)}/T`);
    }, (v) => v.toFixed(2));
  },
});

fig("lpf_tones", {
  title: "Tones through an ideal low-pass filter (ex. 3.5)", w: 680, h: 300,
  caption: "Y(f) = X(f)·H(f). A cosine is two lines at ±f; if they fall inside |f| < W they pass unchanged, outside they are removed. Move the tone frequency across the cut-off.",
  init(a) {
    const sp = a.plot(40, 30, 280, 140, [-3, 3], [0, 1.3]);
    sp.axes("f / W", "", { yAt: 0 });
    a.rect(sp.X(-1), sp.Y(1), sp.X(1) - sp.X(-1), sp.Y(0) - sp.Y(1), { fill: "#dcfce7", color: C.green, width: 2 });
    a.text(sp.X(0), sp.Y(1.12), "H(f) = 1 for |f| < W", { size: 12, color: C.green });
    const l1 = a.line(0, 0, 0, 0, { color: C.blue, width: 4, arrow: true }), l2 = a.line(0, 0, 0, 0, { color: C.blue, width: 4, arrow: true });
    const ti = a.plot(370, 30, 280, 60, [0, 3], [-1.2, 1.2]), to = a.plot(370, 140, 280, 60, [0, 3], [-1.2, 1.2]);
    a.text(370, 22, "input x(t) = A cos 2πft", { size: 13, anchor: "start" }); a.text(370, 132, "output y(t)", { size: 13, anchor: "start" });
    const wi = a.path("", { color: C.blue, width: 2 }), wo = a.path("", { color: C.green, width: 2.5 });
    a.line(370, ti.Y(0), 650, ti.Y(0), { color: C.soft, width: 1 }); a.line(370, to.Y(0), 650, to.Y(0), { color: C.soft, width: 1 });
    const read = a.text(510, 240, "", { size: 15, weight: 700 });
    let f = 0.5;
    a.slider("tone f / W", 0.1, 2.8, 0.05, 0.5, (v) => {
      f = v;
      a.set(l1, { x1: sp.X(f), y1: sp.Y(0), x2: sp.X(f), y2: sp.Y(0.5) }); a.set(l2, { x1: sp.X(-f), y1: sp.Y(0), x2: sp.X(-f), y2: sp.Y(0.5) });
      const pass = f < 1;
      [l1, l2].forEach((l) => a.set(l, { stroke: pass ? C.blue : C.red }));
      a.setText(read, pass ? "inside the pass band: y = x" : "outside the pass band: y = 0");
    }, (v) => v.toFixed(2));
    a.loop((t) => {
      a.set(wi, { d: ti.d((x) => Math.cos(TAU * f * 2 * (x - t * 0.3)), 0, 3, 400) });
      a.set(wo, { d: to.d((x) => (f < 1 ? Math.cos(TAU * f * 2 * (x - t * 0.3)) : 0), 0, 3, 400) });
    });
  },
});

fig("impulse_response", {
  title: "Ideal low-pass filter: rectangle ↔ sinc (2022 Q5)", w: 680, h: 260,
  caption: "H(f) = 1 for |f| < B has impulse response h(t) = 2B·sinc(2Bt): peak 2B at t = 0 and zeros at t = k/(2B). A wider filter gives a taller, narrower pulse (duality).",
  init(a) {
    const fp = a.plot(40, 40, 260, 160, [-3, 3], [0, 1.3]);
    fp.axes("f", "H(f)", { yAt: 0 });
    const rect = a.path("", { color: C.green, width: 3, fill: "#dcfce7" });
    const tp = a.plot(360, 30, 290, 190, [-3, 3], [-0.6, 3.4]);
    tp.axes("t", "h(t)", { xAt: 0, yAt: 0 });
    const h = a.path("", { color: C.blue, width: 2.5 });
    const read = a.text(505, 240, "", { size: 14, weight: 700 });
    const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
    a.slider("bandwidth B", 0.3, 1.5, 0.05, 0.75, (B) => {
      a.set(rect, { d: `M${fp.X(-B)},${fp.Y(0)} L${fp.X(-B)},${fp.Y(1)} L${fp.X(B)},${fp.Y(1)} L${fp.X(B)},${fp.Y(0)}` });
      a.set(h, { d: tp.d((t) => 2 * B * sinc(2 * B * t), -3, 3, 600) });
      a.setText(read, `h(0) = 2B = ${(2 * B).toFixed(2)} · zeros every 1/(2B) = ${(1 / (2 * B)).toFixed(2)}`);
    }, (v) => v.toFixed(2));
  },
});

fig("modulation_shift", {
  title: "Modulation moves the spectrum", w: 680, h: 230,
  caption: "Multiplying by a carrier cos 2πf₀t (DSB) moves the baseband spectrum [−B, B] to bands around ±f₀, each 2B wide. That lets small antennas radiate it and many users share the spectrum.",
  init(a) {
    const p = a.plot(30, 30, 620, 150, [-10, 10], [0, 1.2]);
    p.axes("f", "|X(f)|", { yAt: 0 });
    a.text(p.X(6), p.Y(0) + 16, "+f₀", { size: 13 }); a.text(p.X(-6), p.Y(0) + 16, "−f₀", { size: 13 });
    const tri = (c, h) => `M${p.X(c - 1.5)},${p.Y(0)} L${p.X(c)},${p.Y(h)} L${p.X(c + 1.5)},${p.Y(0)} z`;
    const base = a.path(tri(0, 1), { color: C.soft, fill: C.faint, dash: "4 3" });
    const L = a.path("", { color: C.blue, fill: "#dbeafe" }), R = a.path("", { color: C.blue, fill: "#dbeafe" });
    const lab = a.text(p.X(-9.5), 30, "", { size: 14, weight: 700, anchor: "start" });
    a.loop((t) => {
      const u = 0.5 - 0.5 * Math.cos(Math.min(1, (t % 6) / 3) * Math.PI);
      a.set(L, { d: tri(-6 * u, lerp(1, 0.5, u)) }); a.set(R, { d: tri(6 * u, lerp(1, 0.5, u)) });
      a.setText(lab, u > 0.98 ? "band-pass: two bands of width 2B, half the amplitude each" : "baseband [−B, B]");
    });
  },
});

fig("harmonics", {
  title: "A non-linear system creates new frequencies", w: 680, h: 280,
  caption: "Drive a saturating amplifier harder: the output sinusoid flattens and harmonics 2f₀, 3f₀ … appear (here a soft clip y = tanh(gx) gives odd harmonics). A linear system never creates frequencies that are not in the input.",
  init(a) {
    const ip = a.plot(30, 30, 190, 110, [0, 2], [-1.6, 1.6]), op = a.plot(30, 160, 190, 110, [0, 2], [-1.6, 1.6]);
    a.text(30, 22, "input", { size: 13, anchor: "start" }); a.text(30, 152, "output", { size: 13, anchor: "start" });
    const xi = a.path("", { color: C.blue, width: 2 }), xo = a.path("", { color: C.orange, width: 2.5 });
    const cp = a.plot(260, 40, 150, 200, [-1.6, 1.6], [-1.6, 1.6]);
    cp.axes("x", "y", { xAt: 0, yAt: 0 });
    const cur = a.path("", { color: C.ink, width: 2.5 });
    a.line(cp.X(-1.6), cp.Y(-1.6), cp.X(1.6), cp.Y(1.6), { color: C.soft, dash: "4 4" });
    const sp = a.plot(450, 40, 200, 200, [0, 6], [0, 1.1]);
    sp.axes("f / f₀", "|Y|", {});
    const bars = [1, 2, 3, 4, 5].map((n) => a.line(sp.X(n), sp.Y(0), sp.X(n), sp.Y(0), { color: C.orange, width: 7 }));
    const thd = a.text(550, 262, "", { size: 14, weight: 700 });
    let g = 1;
    const f = (x) => Math.tanh(g * x) / Math.tanh(g);
    a.slider("drive level", 0.2, 4, 0.1, 1.5, (v) => {
      g = v;
      a.set(cur, { d: cp.d((x) => Math.tanh(g * x) / Math.tanh(g) * 1, -1.6, 1.6) });
      const N = 512, amp = [];
      for (let n = 1; n <= 31; n++) { let re = 0, im = 0; for (let k = 0; k < N; k++) { const y = f(Math.sin((TAU * k) / N)); re += y * Math.cos((TAU * n * k) / N); im += y * Math.sin((TAU * n * k) / N); } amp.push((2 / N) * Math.hypot(re, im)); }
      bars.forEach((b, i) => a.set(b, { y2: sp.Y(amp[i] / amp[0]) }));
      a.setText(thd, `THD (to n = 31) = ${(100 * Math.sqrt(amp.slice(1).reduce((s, x) => s + x * x, 0)) / amp[0]).toFixed(1)} %`);
    }, (v) => v.toFixed(1));
    a.loop((t) => {
      a.set(xi, { d: ip.d((x) => Math.sin(TAU * (x - t * 0.25)), 0, 2) });
      a.set(xo, { d: op.d((x) => f(Math.sin(TAU * (x - t * 0.25))), 0, 2) });
    });
  },
});

fig("thermal_noise", {
  title: "Thermal noise of a resistor", w: 680, h: 240,
  caption: "Free electrons in any resistor above 0 K move randomly and produce a noise voltage with a flat (white) spectrum. Available noise power N = kTB, independent of R; at 290 K that is −174 dBm per hertz.",
  init(a) {
    a.rect(30, 70, 150, 70, { r: 10, fill: "#fff7ed", color: C.orange });
    Parts.resistor(a, 50, 105, 160); a.text(105, 58, "R at temperature T", { size: 13 });
    const es = Array.from({ length: 14 }, () => a.circle(0, 0, 3, { fill: C.blue, color: "none" }));
    const p = a.plot(230, 40, 420, 130, [0, 1], [-3.5, 3.5]);
    a.line(230, p.Y(0), 650, p.Y(0), { color: C.soft, width: 1 });
    a.text(230, 32, "noise voltage v_n(t)", { size: 13, anchor: "start" });
    const tr = a.path("", { color: C.blue, width: 1.5 });
    const read = a.text(440, 210, "", { size: 15, weight: 700 });
    let T = 290, seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(TAU * rnd());
    const buf = Array.from({ length: 300 }, () => gauss());
    a.slider("temperature T (K)", 10, 1000, 10, 290, (v) => {
      T = v;
      const N = 1.38e-23 * T * 1e6;
      a.setText(read, `B = 1 MHz: N = kTB = ${N.toExponential(2)} W = ${(10 * Math.log10(N / 1e-3)).toFixed(1)} dBm`);
    });
    a.loop((t, dt) => {
      const s = Math.sqrt(T / 290);
      for (let k = 0; k < 4; k++) { buf.shift(); buf.push(gauss() * s); }
      a.set(tr, { d: buf.map((v, i) => (i ? "L" : "M") + p.X(i / 299).toFixed(1) + "," + p.Y(clamp(v, -3.4, 3.4)).toFixed(1)).join("") });
      es.forEach((e, i) => { a.set(e, { cx: 55 + ((i * 37 + Math.sin(t * 9 * s + i) * 9 * s) % 110 + 110) % 110, cy: 105 + Math.sin(t * 13 * s + i * 1.7) * 18 * Math.min(1.4, s) }); });
    });
  },
});

fig("repeaters", {
  title: "Analog amplifiers versus regenerative repeaters", w: 680, h: 280,
  caption: "Each hop attenuates and adds noise. An analog amplifier boosts signal AND noise, so noise accumulates; a regenerative repeater decides each bit and re-sends a clean pulse, so the noise does not accumulate. This is the key advantage of digital transmission.",
  init(a) {
    const bits = [1, 0, 1, 1, 0, 1];
    const rows = [["analog chain", 80, false], ["digital chain", 200, true]];
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
    const noise = Array.from({ length: 4 }, () => Array.from({ length: 120 }, () => rnd()));
    const paths = [];
    const hl = a.rect(12, 20, 136, 240, { fill: C.yellow, color: "none", opacity: 0.12, r: 8 });
    rows.forEach(([n, y, dig]) => {
      a.text(20, y - 50, n, { size: 14, weight: 700, anchor: "start" });
      for (let s = 0; s < 4; s++) {
        const x0 = 20 + s * 165;
        paths.push([a.path("", { color: dig ? C.green : C.blue, width: 2 }), x0, y, s, dig]);
        if (s < 3) dig ? Parts.box(a, x0 + 145, y, 30, 30, "R", { fill: "#dcfce7", color: C.green }) : Parts.amp(a, x0 + 145, y, 15, "", {});
      }
    });
    const lvl = (x0, y, s, dig, k, i) => {
      const b = bits[Math.floor(k / 20)];
      const sig = b ? -18 : 18;
      if (dig) return y + sig + noise[s][i] * 22;
      let n = 0; for (let j = 0; j <= s; j++) n += noise[j][i];
      return y + sig + n * 22;
    };
    a.loop((t) => {
      const shown = 4;
      a.set(hl, { x: 12 + (Math.floor(t / 1.2) % 4) * 165 });
      paths.forEach(([p, x0, y, s, dig]) => {
        let d = "";
        for (let i = 0; i < 120; i++) d += (i ? "L" : "M") + (x0 + i) + "," + lvl(x0, y, s, dig, i, i).toFixed(1);
        a.set(p, { d });
      });
    });
  },
});

fig("shannon", {
  title: "Hartley–Shannon capacity", w: 680, h: 280,
  caption: "C = B log₂(1 + S/N). Capacity grows linearly with bandwidth only if S/N stays fixed; with white noise N = kTB grows with B too, so doubling B gives less than double C (ex. 3.10).",
  init(a) {
    const p = a.plot(60, 30, 330, 200, [0, 40], [0, 14]);
    p.axes("S/N (dB)", "C/B (bit/s/Hz)", { below: true });
    p.curve((x) => Math.log2(1 + 10 ** (x / 10)), { color: C.blue, width: 3 });
    for (let k = 0; k <= 40; k += 10) a.text(p.X(k), p.Y(0) + 16, k, { size: 11, color: C.mid });
    for (let k = 0; k <= 14; k += 2) a.text(p.X(0) - 8, p.Y(k), k, { size: 11, color: C.mid, anchor: "end" });
    const dot = a.circle(0, 0, 6, { fill: C.orange, color: "none" });
    const r = [0, 1, 2, 3].map((i) => a.text(420, 60 + i * 34, "", { size: 15, anchor: "start", weight: i === 1 ? 700 : 400 }));
    const st = { B: 25, snr: 30 };
    const upd = () => {
      const s = 10 ** (st.snr / 10), C1 = st.B * Math.log2(1 + s), C2 = 2 * st.B * Math.log2(1 + s / 2);
      a.set(dot, { cx: p.X(st.snr), cy: p.Y(Math.log2(1 + s)) });
      a.setText(r[0], `S/N = ${st.snr} dB = ${s.toFixed(0)}`);
      a.setText(r[1], `C = ${C1.toFixed(1)} kbit/s`);
      a.setText(r[2], `double B (N doubles): ${C2.toFixed(1)} kbit/s`);
      a.setText(r[3], `= ×${(C2 / C1).toFixed(2)}, not ×2`);
    };
    a.slider("B (kHz)", 1, 50, 0.5, 25, (v) => { st.B = v; upd(); }, (v) => v.toFixed(2));
    a.slider("S/N (dB)", 0, 40, 1, 30, (v) => { st.snr = v; upd(); });
  },
});

/* ------------------------------------------------------------------ data */
fig("serial_parallel", {
  title: "Parallel versus serial, asynchronous framing", w: 680, h: 300,
  caption: "Parallel: one line per bit, all bits of a character at once (short distances). Serial: one line, bits one after another. Asynchronous serial wraps each character in a start bit and stop bit so the receiver can resynchronise every character.",
  init(a) {
    const ch = [0, 1, 0, 0, 0, 0, 0, 1]; // 'A' = 0x41, LSB first below
    a.text(20, 20, "parallel (8 lines)", { size: 14, weight: 700, anchor: "start" });
    const par = ch.map((b, i) => { a.line(60, 40 + i * 14, 300, 40 + i * 14, { color: C.soft, width: 2 }); return a.rect(0, 33 + i * 14, 18, 12, { fill: b ? C.blue : C.bg, color: C.blue, width: 1.2, r: 2 }); });
    a.text(20, 180, "serial, asynchronous", { size: 14, weight: 700, anchor: "start" });
    a.line(60, 220, 660, 220, { color: C.soft, width: 2 });
    const frame = [0, ...ch.slice().reverse(), 1];
    const labels = ["start", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "stop"];
    const ser = frame.map((b, i) => { const r = a.rect(0, 210, 34, 20, { fill: i === 0 ? "#fde68a" : i === 9 ? "#fecaca" : b ? C.blue : C.bg, color: i === 0 ? C.amber : i === 9 ? C.red : C.blue, width: 1.4, r: 3 }); const t = a.text(0, 246, labels[i], { size: 10, color: C.mid }); return [r, t]; });
    a.text(470, 60, "character 'A' = 0100 0001", { size: 14 });
    a.text(470, 84, "parallel: 1 clock tick per character", { size: 12, color: C.mid });
    a.text(470, 104, "serial: 10 symbols per character", { size: 12, color: C.mid });
    a.text(470, 124, "(8 data + start + stop) → r_b < r_s", { size: 12, color: C.mid });
    a.loop((t) => {
      const u = (t * 0.25) % 1;
      par.forEach((r) => a.set(r, { x: 60 + u * 222 }));
      ser.forEach(([r, l], i) => { const x = 60 + ((t * 70) % 760) - i * 38; a.set(r, { x }); a.set(l, { x: x + 17, opacity: x > 50 && x < 650 ? 1 : 0 }); a.set(r, { opacity: x > 50 && x < 650 ? 1 : 0 }); });
    });
  },
});

fig("mary_levels", {
  title: "Binary and M-ary signals in noise", w: 680, h: 300,
  caption: "At the same baud rate an M-level symbol carries log₂M bits, so 4 levels double the bit rate. But with the same peak amplitude the levels are closer, and the same noise crosses the decision thresholds more often (2016 Q8). Errors are marked in red.",
  init(a) {
    let seed = 3;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(TAU * rnd());
    const N = 16, M = [2, 4, 8];
    const syms = M.map((m) => Array.from({ length: N }, () => Math.floor(rnd() * m)));
    const nz = Array.from({ length: N * 20 }, () => gauss());
    const rows = M.map((m, r) => {
      const y0 = 30 + r * 90;
      a.text(20, y0 + 30, `M = ${m}`, { size: 14, weight: 700, anchor: "start" });
      a.text(20, y0 + 50, `${Math.log2(m)} bit/symbol`, { size: 11, color: C.mid, anchor: "start" });
      for (let k = 1; k < m; k++) a.line(110, y0 + 70 - (k / m) * 70, 650, y0 + 70 - (k / m) * 70, { color: C.soft, width: 1, dash: "3 3" });
      return { y0, m, path: a.path("", { color: C.blue, width: 1.6 }), marks: Array.from({ length: N }, () => a.rect(0, y0 - 2, 33.75, 74, { fill: C.red, color: "none", opacity: 0 })) };
    });
    const read = a.note("");
    a.slider("noise σ (fraction of peak)", 0, 0.25, 0.01, 0.07, (s) => {
      let errs = [];
      rows.forEach(({ y0, m, path, marks }, r) => {
        let d = "", e = 0;
        for (let k = 0; k < N; k++) {
          const lv = (syms[r][k] + 0.5) / m;
          let ok = true;
          for (let i = 0; i < 20; i++) {
            const v = lv + s * nz[k * 20 + i];
            if (i === 10 && Math.floor(clamp(v, 0, 0.9999) * m) !== syms[r][k]) ok = false;
            d += (d ? "L" : "M") + (110 + k * 33.75 + i * 1.7).toFixed(1) + "," + (y0 + 70 - clamp(v, -0.1, 1.1) * 70).toFixed(1);
          }
          a.set(marks[k], { x: 110 + k * 33.75, opacity: ok ? 0 : 0.18 });
          if (!ok) e++;
        }
        a.set(path, { d });
        errs.push(`M=${m}: ${e} errors`);
      });
      read.textContent = errs.join(" · ") + " (decision at mid-symbol)";
    }, (v) => v.toFixed(2));
  },
});

fig("linecodes", {
  title: "Line codes for 1 0 1 1 0 0 1 0", w: 680, h: 330,
  caption: "Unipolar NRZ has a DC component; bipolar NRZ removes it on average; RZ returns to zero mid-bit; AMI alternates the polarity of the 1s (no DC, single errors detectable); Manchester has a transition in every bit (self-clocking, double bandwidth).",
  init(a) {
    const bits = [1, 0, 1, 1, 0, 0, 1, 0], x0 = 150, bw = 60;
    bits.forEach((b, k) => { a.text(x0 + bw * (k + 0.5), 18, b, { size: 15, weight: 700 }); a.line(x0 + bw * k, 28, x0 + bw * k, 320, { color: C.faint, width: 1 }); });
    const codes = {
      "unipolar NRZ": (k, h) => bits[k],
      "bipolar NRZ": (k, h) => (bits[k] ? 1 : -1),
      "unipolar RZ": (k, h) => (bits[k] && h < 0.5 ? 1 : 0),
      AMI: (k, h) => { if (!bits[k]) return 0; let c = 0; for (let j = 0; j <= k; j++) c += bits[j]; return c % 2 ? 1 : -1; },
      Manchester: (k, h) => (bits[k] ? (h < 0.5 ? 1 : -1) : h < 0.5 ? -1 : 1),
    };
    Object.entries(codes).forEach(([n, f], r) => {
      const yc = 60 + r * 60;
      a.text(20, yc, n, { size: 13, weight: 700, anchor: "start" });
      a.line(x0, yc, x0 + bw * 8, yc, { color: C.soft, width: 1 });
      let d = "";
      for (let k = 0; k < 8; k++) for (const h of [0, 0.499, 0.5, 0.999]) { const v = f(k, h); d += (d ? "L" : "M") + (x0 + bw * (k + h)) + "," + (yc - v * 18); }
      a.path(d, { color: [C.blue, C.teal, C.purple, C.orange, C.green][r], width: 2.5 });
    });
    const cur = a.rect(x0, 30, bw, 295, { fill: C.yellow, color: "none", opacity: 0.15 });
    a.loop((t) => a.set(cur, { x: x0 + bw * (Math.floor(t / 0.8) % 8) }));
  },
});

fig("keying", {
  title: "ASK, FSK and PSK for the bits 1 0 1 1 0", w: 680, h: 280,
  caption: "Amplitude-shift keying switches the carrier on and off; frequency-shift keying uses two frequencies; phase-shift keying flips the phase 180° for a 0. A modem (modulator-demodulator) does this to send data over a band-pass channel.",
  init(a) {
    const bits = [1, 0, 1, 1, 0], x0 = 110, bw = 105;
    bits.forEach((b, k) => { a.text(x0 + bw * (k + 0.5), 18, b, { size: 15, weight: 700 }); a.line(x0 + bw * k, 28, x0 + bw * k, 270, { color: C.faint, width: 1 }); });
    const sig = {
      ASK: (x, b) => b * Math.sin(TAU * 4 * x),
      FSK: (x, b) => Math.sin(TAU * (b ? 6 : 3) * x),
      PSK: (x, b) => Math.sin(TAU * 4 * x + Math.PI * (1 - b)),
    };
    const clipId = "kc" + Math.random().toString(36).slice(2, 7);
    const cp = a.el("clipPath", { id: clipId }, a.el("defs", {})), clipRect = a.el("rect", { x: x0, y: 0, width: 0, height: 280 }, cp);
    const gg = a.g({ "clip-path": `url(#${clipId})` });
    Object.entries(sig).forEach(([n, f], r) => {
      a.text(20, 70 + r * 80, n, { size: 15, weight: 700, anchor: "start" });
      let d = ""; for (let i2 = 0; i2 <= 600; i2++) { const x = i2 / 120, bb = bits[Math.min(4, Math.floor(x))]; d += (d ? "L" : "M") + (x0 + x * bw).toFixed(1) + "," + (70 + r * 80 - 25 * f(x, bb)).toFixed(1); }
      a.path(d, { color: [C.blue, C.teal, C.orange][r], width: 2, parent: gg });
    });
    const cur = a.line(0, 30, 0, 270, { color: C.red, width: 1.5 });
    a.loop((t) => { const xe = x0 + Math.min(5, (t * 0.9) % 5.6) * bw; a.set(clipRect, { width: (xe - x0).toFixed(1) }); a.set(cur, { x1: xe.toFixed(1), x2: xe.toFixed(1) }); });
  },
});

fig("ad_chain", {
  title: "The A/D converter, block by block", w: 680, h: 250,
  caption: "Anti-aliasing filter → sampler (switch closing every T_s) → quantizer (nearest level) → coder (N-bit word per sample, T_b = T_s/N).",
  init(a) {
    const xs = [95, 255, 415, 575], n = ["anti-aliasing\nLPF (W)", "sampler\nf_s = 1/T_s", "quantizer\n2^N levels", "coder\nN bits"];
    xs.forEach((x, i) => Parts.box(a, x, 60, 120, 50, n[i], { fill: "#eff6ff", color: C.blue }));
    [[20, 35], [155, 195], [315, 355], [475, 515], [635, 670]].forEach(([p, q]) => a.arrow(p, 60, q, 60, C.ink, 2));
    const sh = [0, 1, 2, 3].map(() => a.path("", { color: C.orange, width: 2 }));
    const sig = (x) => 0.6 * Math.sin(TAU * x * 0.9) + 0.3 * Math.sin(TAU * x * 2.1 + 1);
    // one 3-bit quantizer shared by the quantizer and the coder: index 0..7 over [−1, 1]
    const qi = (v) => clamp(Math.floor(((v + 1) / 2) * 8), 0, 7), qv = (q) => -1 + (q + 0.5) / 4;
    a.loop((t) => {
      const ph = t * 0.15;
      const ws = [[35, 155], [195, 315], [355, 475], [515, 635]];
      ws.forEach(([p, q], i) => {
        let d = "";
        if (i === 0) for (let x = p; x <= q; x++) d += (d ? "L" : "M") + x + "," + (170 - 40 * sig((x - p) / 120 + ph)).toFixed(1);  // the LPF output: smooth, nothing above W
        else if (i === 1) for (let k = 0; k < 12; k++) { const x = p + k * 10, v = sig(k / 12 + ph); d += `M${x},170 L${x},${(170 - 40 * v).toFixed(1)}`; }
        else if (i === 2) for (let k = 0; k < 12; k++) { const x = p + k * 10, v = qv(qi(sig(k / 12 + ph))); d += `M${x},${(170 - 40 * v).toFixed(1)} L${x + 10},${(170 - 40 * v).toFixed(1)}`; }
        else for (let k = 0; k < 36; k++) { const w = 10 / 3, x = p + k * w, v = (qi(sig(Math.floor(k / 3) / 12 + ph)) >> (2 - (k % 3))) & 1; d += (d ? "L" : "M") + x.toFixed(1) + "," + (185 - v * 30) + " L" + (x + w).toFixed(1) + "," + (185 - v * 30); } /* 3 bits per sample: T_b = T_s/3 */
        a.set(sh[i], { d });
      });
    });
    ["band-limited x(t)", "discrete x(nT_s)", "multi-level digital", "binary, T_b = T_s/N"].forEach((s, i) => a.text(xs[i], 232, s, { size: 12, color: C.mid }));
  },
});

fig("sampling", {
  title: "Sampling and aliasing", w: 680, h: 320,
  caption: "Sampling at f_s repeats the spectrum every f_s: below, the original line (blue) and its copies at k·f_s ± f (purple); dashed lines mark f_s/2, 3f_s/2 … If the signal frequency f exceeds f_s/2 a copy lands below f_s/2 and the samples are indistinguishable from that lower 'alias' frequency (orange, in both plots): the original cannot be recovered. Sample at f_s ≥ 2W.",
  init(a) {
    const p = a.plot(40, 30, 600, 150, [0, 1], [-1.3, 1.3]);
    a.line(40, p.Y(0), 640, p.Y(0), { color: C.soft, width: 1 });
    const tru = a.path("", { color: C.blue, width: 2 }), ali = a.path("", { color: C.orange, width: 2.5, dash: "7 4" });
    const dots = Array.from({ length: 60 }, () => a.circle(0, 0, 4, { fill: C.ink, color: "none" }));
    const sp = a.plot(40, 230, 600, 60, [0, 40], [0, 1]);
    a.line(40, 290, 650, 290, { color: C.ink, width: 1.4 });
    a.text(650, 305, "frequency (Hz)", { size: 11, anchor: "end", color: C.mid });
    const lines = Array.from({ length: 40 }, () => a.line(0, 0, 0, 0, { color: C.blue, width: 3 }));
    const fsL = Array.from({ length: 4 }, () => a.line(0, 0, 0, 0, { color: C.soft, width: 1, dash: "3 3" }));
    const nyq = a.text(0, 222, "f_s/2", { size: 11, color: C.mid });
    const read = a.text(630, 22, "", { size: 14, anchor: "end", weight: 700 });
    const st = { f: 3, fs: 10 };
    const upd = () => {
      const { f, fs } = st;
      a.set(tru, { d: p.d((t) => Math.cos(TAU * f * t), 0, 1, 600) });
      const fa = Math.abs(f - Math.round(f / fs) * fs);
      a.set(ali, { d: f > fs / 2 ? p.d((t) => Math.cos(TAU * fa * t), 0, 1, 600) : "" });
      dots.forEach((d, k) => { const t = k / fs; a.set(d, t <= 1 ? { cx: p.X(t), cy: p.Y(Math.cos(TAU * f * t)), opacity: 1 } : { opacity: 0 }); });
      let i = 0;
      lines.forEach((l) => a.set(l, { opacity: 0 }));
      const kmin = Math.floor(-f / fs) - 1, kmax = Math.ceil((40 + f) / fs) + 1; // every replica that can land in 0–40 Hz
      for (let k = kmin; k <= kmax; k++) for (const s of [-1, 1]) { const fr = k * fs + s * f; if (fr >= 0 && fr <= 40 && i < lines.length) { const orig = k === 0 && s === 1; a.set(lines[i], { x1: sp.X(fr), x2: sp.X(fr), y1: sp.Y(0), y2: sp.Y(orig ? 1 : 0.7), stroke: orig ? C.blue : f > fs / 2 && fr <= fs / 2 ? C.orange : C.purple, opacity: 1 }); i++; } }
      fsL.forEach((l, k) => a.set(l, { x1: sp.X((k + 0.5) * fs), x2: sp.X((k + 0.5) * fs), y1: 230, y2: 290, opacity: (k + 0.5) * fs <= 40 ? 1 : 0 }));
      a.set(nyq, { x: sp.X(fs / 2) });
      a.setText(read, f > fs / 2 ? `f = ${f} Hz > f_s/2: alias at ${fa.toFixed(1)} Hz` : `f = ${f} Hz ≤ f_s/2 = ${fs / 2}: no aliasing`);
    };
    a.slider("signal f (Hz)", 0.5, 18, 0.5, 3, (v) => { st.f = v; upd(); });
    a.slider("sampling f_s (Hz)", 4, 40, 1, 10, (v) => { st.fs = v; upd(); });
  },
});

fig("quantizer", {
  title: "Quantization with N bits", w: 680, h: 300,
  caption: "Each sample is replaced by the nearest of 2^N levels; the difference is the quantization error (bottom), uniformly spread within ±Δ/2. Every extra bit halves the step and adds ≈ 6 dB of signal-to-quantization-noise ratio.",
  init(a) {
    const p = a.plot(40, 20, 600, 170, [0, 1], [-1.15, 1.15]);
    const lv = a.g();
    const orig = a.path("", { color: C.soft, width: 2 }), q = a.path("", { color: C.blue, width: 2.5 });
    const ep = a.plot(40, 215, 600, 60, [0, 1], [-0.5, 0.5]);
    a.line(40, ep.Y(0), 640, ep.Y(0), { color: C.soft, width: 1 });
    a.text(40, 207, "error x − x_q (same amplitude units as the signal, full scale ±1)", { size: 12, anchor: "start", color: C.mid });
    const err = a.path("", { color: C.red, width: 1.6 });
    const read = a.text(636, 30, "", { size: 14, anchor: "end", weight: 700 });
    const sig = (t) => 0.98 * Math.sin(TAU * t);  // a full-scale sine, the case the SQNR formula is for
    a.slider("bits N", 1, 6, 1, 3, (N) => {
      const L = 2 ** N, D = 2 / L;
      while (lv.firstChild) lv.removeChild(lv.firstChild);
      for (let k = 0; k < L; k++) { const y = -1 + D * (k + 0.5); a.line(40, p.Y(y), 640, p.Y(y), { color: C.faint, width: 1, parent: lv }); }
      const qf = (v) => clamp(-1 + D * (Math.floor((v + 1) / D) + 0.5), -1 + D / 2, 1 - D / 2);
      a.set(orig, { d: p.d(sig, 0, 1, 500) });
      let d = "", de = "";
      for (let i = 0; i < 64; i++) { const t0 = i / 64, v = qf(sig(t0)); d += (d ? "L" : "M") + p.X(t0) + "," + p.Y(v) + "L" + p.X(t0 + 1 / 64) + "," + p.Y(v); const e = sig(t0) - v; de += (de ? "L" : "M") + ep.X(t0) + "," + ep.Y(clamp(e, -0.5, 0.5)) + "L" + ep.X(t0 + 1 / 64) + "," + ep.Y(clamp(e, -0.5, 0.5)); }
      a.set(q, { d }); a.set(err, { d: de });
      a.setText(read, `${L} levels · full-scale sine: SQNR ≈ 6.02N + 1.76 = ${(6.02 * N + 1.76).toFixed(1)} dB`);
    });
  },
});

/* ------------------------------------------------------------------ propagation */
fig("plane_wave", {
  title: "A plane electromagnetic wave", w: 680, h: 280,
  caption: "E (red) and H (blue) are perpendicular to each other and to the direction of propagation k, and IN PHASE: both peak at the same z. Here E points up and H towards you (drawn down-left), so E × H points along k. Their ratio is the intrinsic impedance η = √(μ/ε) (377 Ω in vacuum); the pattern travels at v = 1/√(με).",
  init(a) {
    const ox = 100, oy = 140, L = 520, A = 80;
    // oblique view: z to the right, y up, x out of the page drawn down-left (shallow enough that the H curve never folds back)
    const iso = (z, y, x) => [ox + z - x * 0.42, oy - y + x * 0.3];
    a.arrow(...iso(0, 0, 0), ...iso(L + 30, 0, 0), C.ink, 2); a.text(...iso(L + 40, 10, 0), "k", { size: 16, weight: 700 });
    a.arrow(...iso(0, 0, 0), ...iso(0, 105, 0), C.red, 1.5); a.text(...iso(-12, 108, 0), "E", { size: 15, color: C.red, weight: 700 });
    a.arrow(...iso(0, 0, 0), ...iso(0, 0, 100), C.blue, 1.5); a.text(...iso(-10, -16, 100), "H (towards you)", { size: 13, color: C.blue, weight: 700, anchor: "start", halo: true, front: true });
    const Ev = Array.from({ length: 40 }, () => a.line(0, 0, 0, 0, { color: C.red, width: 1.4, opacity: 0.7 }));
    const Hv = Array.from({ length: 40 }, () => a.line(0, 0, 0, 0, { color: C.blue, width: 1.4, opacity: 0.7 }));
    const Ec = a.path("", { color: C.red, width: 2.5 }), Hc = a.path("", { color: C.blue, width: 2.5 });
    a.loop((t) => {
      const ph = t * 3, v = (z) => Math.sin(z / 45 - ph);  // E and H: the same phase
      let de = "", dh = "";
      for (let i = 0; i <= 200; i++) { const z = (i / 200) * L; const [x1, y1] = iso(z, A * v(z), 0), [x2, y2] = iso(z, 0, A * v(z)); de += (i ? "L" : "M") + x1.toFixed(1) + "," + y1.toFixed(1); dh += (i ? "L" : "M") + x2.toFixed(1) + "," + y2.toFixed(1); }
      a.set(Ec, { d: de }); a.set(Hc, { d: dh });
      Ev.forEach((l, i) => { const z = (i / 40) * L; const [x0, y0] = iso(z, 0, 0), [x1, y1] = iso(z, A * v(z), 0); a.set(l, { x1: x0, y1: y0, x2: x1, y2: y1 }); });
      Hv.forEach((l, i) => { const z = (i / 40) * L; const [x0, y0] = iso(z, 0, 0), [x1, y1] = iso(z, 0, A * v(z)); a.set(l, { x1: x0, y1: y0, x2: x1, y2: y1 }); });
    });
  },
});

fig("snell", {
  title: "Reflection and refraction (Snell)", w: 680, h: 300,
  caption: "Angles are measured from the NORMAL. Reflection: θr = θi. Refraction: n₁ sin θi = n₂ sin θt. Going into a lower index beyond the critical angle, all the energy is reflected.",
  init(a) {
    const cx = 260, cy = 150;
    const top = a.rect(20, 10, 480, 140, { fill: "#f8fafc", color: "none" }), bot = a.rect(20, 150, 480, 140, { fill: "#dbeafe", color: "none" });
    a.line(20, cy, 500, cy, { width: 2 }); a.line(cx, 20, cx, 280, { color: C.mid, dash: "5 4", width: 1.4 });
    const n1t = a.text(40, 30, "", { size: 14, anchor: "start" }), n2t = a.text(40, 270, "", { size: 14, anchor: "start" });
    const inc = a.arrow(0, 0, cx, cy, C.orange, 3), refl = a.arrow(cx, cy, 0, 0, C.orange, 2), refr = a.arrow(cx, cy, 0, 0, C.blue, 3);
    const read = [0, 1, 2].map((i) => a.text(515, 80 + i * 28, "", { size: 13, anchor: "start", weight: i === 2 ? 700 : 400 }));
    const dots = Array.from({ length: 5 }, () => a.circle(0, 0, 4, { fill: C.orange, color: "none" }));
    const st = { th: 40, n1: 1, n2: 1.5 };
    let geo = null;
    const upd = () => {
      const R = 130, ti = rad(st.th);
      a.setText(n1t, `n₁ = ${st.n1.toFixed(2)}`); a.setText(n2t, `n₂ = ${st.n2.toFixed(2)}`);
      a.set(bot, { fill: st.n2 > st.n1 ? "#dbeafe" : "#f1f5f9" }); a.set(top, { fill: st.n1 > st.n2 ? "#dbeafe" : "#f8fafc" });
      const ix = cx - R * Math.sin(ti), iy = cy - R * Math.cos(ti);
      a.set(inc, { x1: ix, y1: iy }); a.set(refl, { x2: cx + R * Math.sin(ti), y2: cy - R * Math.cos(ti) });
      const s = (st.n1 / st.n2) * Math.sin(ti);
      a.setText(read[0], `θi = θr = ${st.th}°`);
      if (s < 1) { const tt = Math.asin(s); a.set(refr, { x2: cx + R * Math.sin(tt), y2: cy + R * Math.cos(tt), opacity: 1 }); a.setText(read[1], `θt = ${deg(tt).toFixed(1)}°`); a.setText(read[2], st.n2 > st.n1 ? "towards the normal" : st.n2 < st.n1 ? "away from the normal" : "no bending"); }
      else { a.set(refr, { opacity: 0 }); a.setText(read[1], `critical angle ${deg(Math.asin(st.n2 / st.n1)).toFixed(1)}°`); a.setText(read[2], "total internal reflection"); }
      geo = [ix, iy];
    };
    a.slider("incidence θi (°)", 0, 85, 1, 40, (v) => { st.th = v; upd(); });
    a.slider("n₁ (top)", 1, 2, 0.05, 1, (v) => { st.n1 = v; upd(); }, (v) => v.toFixed(2));
    a.slider("n₂ (bottom)", 1, 2, 0.05, 1.5, (v) => { st.n2 = v; upd(); }, (v) => v.toFixed(2));
    a.loop((t) => { if (!geo) return; dots.forEach((d, i) => { const u = ((t * 0.5 + i / 5) % 1); a.set(d, { cx: lerp(geo[0], cx, u), cy: lerp(geo[1], cy, u) }); }); });
  },
});

fig("polarization", {
  title: "Polarization: the curve traced by the tip of E", w: 680, h: 300,
  caption: "Watch E at one point in space. Components in phase → a line (linear); 90° apart with equal amplitudes → a circle; anything else → an ellipse. Ex. 2.6a: (2x̂ + j2ŷ) is circular, 2.6b: (jx̂ + jŷ) is linear at 45°.",
  init(a) {
    const cx = 170, cy = 150, R = 110;
    a.line(cx - R - 20, cy, cx + R + 20, cy, { color: C.mid, width: 1 }); a.line(cx, cy - R - 20, cx, cy + R + 20, { color: C.mid, width: 1 });
    a.text(cx + R + 26, cy, "x", { size: 14 }); a.text(cx, cy - R - 28, "y", { size: 14 });
    const trail = a.path("", { color: C.sky, width: 2 }), vec = a.arrow(cx, cy, cx, cy, C.red, 3.5);
    const xp = a.plot(340, 40, 310, 90, [0, 2], [-1.2, 1.2]), yp = a.plot(340, 180, 310, 90, [0, 2], [-1.2, 1.2]);
    a.text(340, 34, "E_x(t)", { size: 13, anchor: "start" }); a.text(340, 174, "E_y(t)", { size: 13, anchor: "start" });
    a.line(340, xp.Y(0), 650, xp.Y(0), { color: C.soft, width: 1 }); a.line(340, yp.Y(0), 650, yp.Y(0), { color: C.soft, width: 1 });
    const ex = a.path("", { color: C.blue, width: 2 }), ey = a.path("", { color: C.orange, width: 2 });
    const modes = { linear: [1, 0.6, 0], circular: [1, 1, 90], elliptical: [1, 0.55, 60], "2.6a": [1, 1, 90], "2.6b": [1, 1, 0] };
    let m = modes.linear;
    a.buttons(Object.keys(modes), (i, k) => (m = modes[k]));
    a.loop((t) => {
      const [ax, ay, dp] = m, w = TAU * 0.4, th = w * t;
      const Ex = (s) => ax * Math.cos(s), Ey = (s) => ay * Math.cos(s + rad(dp));
      a.set(vec, { x2: cx + R * Ex(th), y2: cy - R * Ey(th) });
      let d = ""; for (let i = 0; i <= 120; i++) { const s = th - (i / 120) * TAU * 0.9; d += (i ? "L" : "M") + (cx + R * Ex(s)).toFixed(1) + "," + (cy - R * Ey(s)).toFixed(1); }
      a.set(trail, { d });
      a.set(ex, { d: xp.d((s) => Ex(TAU * s + th - TAU * 2), 0, 2) }); a.set(ey, { d: yp.d((s) => Ey(TAU * s + th - TAU * 2), 0, 2) });
    });
  },
});

fig("prop_modes", {
  title: "Ground wave, space wave and sky wave", w: 680, h: 300,
  caption: "LF/MF ground waves follow the curved Earth (NDB); VHF and above travel in line of sight with a ground-reflected ray (VOR, VHF voice); HF sky waves are reflected by the ionosphere and hop thousands of kilometres.",
  init(a) {
    const cx = 340, cy = 1150, R = 950;
    a.path(`M${cx - 660},${cy - Math.sqrt(R * R - 660 * 660)} A${R},${R} 0 0 1 ${cx + 660},${cy - Math.sqrt(R * R - 660 * 660)}`, { color: C.green, width: 3 });
    a.path(`M${cx - 660},${cy - Math.sqrt(1150 ** 2 - 660 ** 2)} A1150,1150 0 0 1 ${cx + 660},${cy - Math.sqrt(1150 ** 2 - 660 ** 2)}`, { color: C.purple, width: 10, opacity: 0.18 });
    a.text(600, 18, "ionosphere (F layer)", { size: 13, color: C.purple });
    const surf = (x) => cy - Math.sqrt(R * R - (x - cx) ** 2);
    const tower = (x, h) => { const y = surf(x); a.line(x, y, x, y - h, { width: 3 }); return [x, y - h]; };
    const t1 = tower(80, 30), t2 = tower(300, 30), t3 = tower(520, 30), t4 = tower(640, 26);
    const ground = Array.from({ length: 41 }, (_, i) => { const x = 80 + i * 5.5; return [x, surf(x) - 4]; });
    const top = (x) => cy - Math.sqrt(1150 ** 2 - (x - cx) ** 2);
    const sky = [t1, [360, top(360) + 6], t4];
    const g = Parts.flowDots(a, ground, { color: C.green, r: 4, gap: 30, speed: 60 });
    a.path(ground.map((p, i) => (i ? "L" : "M") + p.join(",")).join(""), { color: C.green, width: 1.5, dash: "4 4" });
    const sp = Parts.flowDots(a, [t2, t3], { color: C.blue, r: 4, gap: 30, speed: 60 });
    a.line(...t2, ...t3, { color: C.blue, dash: "4 4", width: 1.5 });
    const midx = 410; a.path(`M${t2[0]},${t2[1]} L${midx},${surf(midx)} L${t3[0]},${t3[1]}`, { color: C.sky, dash: "4 4", width: 1.5 });
    const sk = Parts.flowDots(a, sky, { color: C.purple, r: 4, gap: 40, speed: 90 });
    a.path(`M${sky.map((p) => p.join(",")).join(" L")}`, { color: C.purple, dash: "4 4", width: 1.5 });
    a.text(170, 238, "ground wave · LF/MF", { size: 13, color: C.green, weight: 700 });
    a.text(410, 150, "space wave · VHF+", { size: 13, color: C.blue, weight: 700 });
    a.text(250, 70, "sky wave · HF", { size: 13, color: C.purple, weight: 700 });
    a.loop((t) => { g(t); sp(t); sk(t); });
  },
});

/* ------------------------------------------------------------------ antennas */
fig("antenna_gallery", {
  title: "Antenna structures", w: 720, h: 400,
  caption: "Eight families from the notes. Dipole (λ/2) and monopole (λ/4 over a ground plane, the VHF COM blade); Yagi-Uda (reflector, driven dipole, directors); horn; parabolic reflector with its feed; microstrip patch (SMOS uses arrays of them); helix (circular polarization); log-periodic (wideband).",
  init(a) {
    const cell = (i) => [90 + (i % 4) * 180, 90 + Math.floor(i / 4) * 200];
    const names = ["λ/2 dipole", "λ/4 monopole", "Yagi-Uda", "horn", "parabolic reflector", "microstrip patch", "helix", "log-periodic"];
    const anim = [];
    names.forEach((n, i) => { const [x, y] = cell(i); a.rect(x - 85, y - 80, 170, 185, { r: 10, fill: "#f8fafc", color: C.soft, width: 1 }); a.text(x, y + 92, n, { size: 13, weight: 700 }); });
    // dipole with current distribution
    { const [x, y] = cell(0); a.line(x, y - 60, x, y - 4, { width: 4 }); a.line(x, y + 4, x, y + 60, { width: 4 }); a.line(x - 30, y - 2, x - 4, y - 2, { width: 1.5 }); a.line(x - 30, y + 2, x - 4, y + 2, { width: 1.5 });
      const I = a.path("", { color: C.orange, width: 2.5, fill: "#fed7aa" }); a.text(x + 44, y - 50, "I(z)", { size: 12, color: C.orange });
      anim.push((t) => { const k = Math.cos(t * 4); let d = `M${x},${y - 60}`; for (let j = 0; j <= 40; j++) { const z = -60 + j * 3; d += ` L${x + 30 * k * Math.cos((Math.PI * z) / 120)},${y + z}`; } a.set(I, { d: d + ` L${x},${y + 60} z` }); }); }
    // monopole
    { const [x, y] = cell(1); a.line(x - 70, y + 40, x + 70, y + 40, { width: 4, color: C.metal }); a.line(x, y + 36, x, y - 50, { width: 4 }); a.line(x, y + 40, x, y + 75, { width: 2, dash: "4 4", color: C.mid }); a.text(x + 26, y + 62, "image", { size: 11, color: C.mid }); a.text(x + 40, y - 10, "λ/4", { size: 12 }); a.text(x - 50, y + 54, "ground plane", { size: 11, color: C.mid });
      const w = [0, 1, 2].map(() => a.path("", { color: C.blue, width: 1.5 })); anim.push((t) => w.forEach((p, j) => { const r = ((t * 30 + j * 25) % 75) + 5; a.set(p, { d: `M${x - r},${y + 38} A${r},${r * 1.2} 0 0 1 ${x + r},${y + 38}`, opacity: 1 - r / 80 }); })); }
    // Yagi
    { const [x, y] = cell(2); const el = [[-55, 54, C.ink], [-30, 46, C.red], [-5, 40, C.ink], [18, 37, C.ink], [40, 34, C.ink]]; a.line(x - 60, y, x + 50, y, { width: 3, color: C.metal }); el.forEach(([dx, h, c]) => a.line(x + dx, y - h, x + dx, y + h, { width: 3, color: c })); a.text(x - 55, y + 66, "refl.", { size: 10 }); a.text(x - 30, y + 58, "driven", { size: 10, color: C.red }); a.text(x + 20, y + 52, "directors", { size: 10 });
      const w = [0, 1, 2].map(() => a.path("", { color: C.blue, width: 2 })); anim.push((t) => w.forEach((p, j) => { const r = ((t * 30 + j * 15) % 45); a.set(p, { d: `M${x + 50 + r},${y - 30 + r * 0.2} Q${x + 60 + r},${y} ${x + 50 + r},${y + 30 - r * 0.2}`, opacity: 1 - r / 45 }); })); }
    // horn
    { const [x, y] = cell(3); a.rect(x - 70, y - 12, 40, 24, { fill: C.steel }); a.poly([[x - 30, y - 12], [x + 50, y - 50], [x + 50, y + 50], [x - 30, y + 12]], { fill: "#e2e8f0" }); a.text(x - 50, y + 26, "waveguide", { size: 10, color: C.mid });
      const w = [0, 1, 2].map(() => a.path("", { color: C.blue, width: 2 })); anim.push((t) => w.forEach((p, j) => { const u = ((t * 0.7 + j / 3) % 1), xx = x - 30 + u * 105; const h = 12 + (Math.min(xx, x + 50) - (x - 30)) * 0.475; a.set(p, { d: `M${xx},${y - h} Q${xx + 10},${y} ${xx},${y + h}`, opacity: u < 0.95 ? 1 : 0 }); })); }
    // dish
    { const [x, y] = cell(4); a.path(`M${x - 30},${y - 65} Q${x - 85},${y} ${x - 30},${y + 65}`, { width: 4, fill: "#e2e8f0" }); a.line(x - 52, y, x + 5, y, { color: C.metal }); a.circle(x + 5, y, 6, { fill: C.red, color: "none" }); a.text(x + 5, y - 14, "feed", { size: 10, color: C.red });
      const rays = [-50, -25, 0, 25, 50].map((h) => { const xr = x - 30 - 55 * (1 - (h / 65) ** 2) * 0.62; a.line(x + 5, y, xr, y + h, { color: C.sky, width: 1 }); return Parts.flowDots(a, [[x + 5, y], [xr, y + h], [x + 80, y + h]], { n: 2, color: C.blue, r: 2.5, speed: 70 }); }); anim.push((t) => rays.forEach((r) => r(t))); }
    // patch
    { const [x, y] = cell(5); a.poly([[x - 70, y + 20], [x + 30, y + 20], [x + 70, y - 20], [x - 30, y - 20]], { fill: "#bbf7d0", color: C.green }); a.poly([[x - 35, y + 10], [x + 5, y + 10], [x + 25, y - 10], [x - 15, y - 10]], { fill: "#facc15", color: C.brown }); a.line(x - 15, y + 10, x - 15, y + 45, { width: 3, color: C.brown }); a.text(x, y + 40, "substrate εr", { size: 10, color: C.green }); a.text(x + 40, y - 34, "metal patch ≈ λ/2", { size: 10, color: C.brown });
      const w = a.path("", { color: C.blue, width: 1.8 }); anim.push((t) => { const r = (t * 30) % 60; a.set(w, { d: `M${x - 5 - r},${y - 14 - r * 0.3} Q${x + 5},${y - 30 - r} ${x + 15 + r},${y - 14 - r * 0.3}`, opacity: 1 - r / 60 }); }); }
    // helix
    { const [x, y] = cell(6); a.rect(x - 70, y - 50, 8, 100, { fill: C.metal, color: "none" }); const hp = a.path("", { color: C.orange, width: 3 }); a.text(x + 30, y + 60, "axial mode", { size: 10, color: C.mid });
      anim.push((t) => { let d = ""; for (let j = 0; j <= 200; j++) { const s = j / 200, th = s * TAU * 5 + t * 3; d += (j ? "L" : "M") + (x - 62 + s * 130).toFixed(1) + "," + (y + 26 * Math.sin(th)).toFixed(1); } a.set(hp, { d }); }); }
    // log-periodic
    { const [x, y] = cell(7); a.line(x - 70, y, x + 60, y, { width: 3, color: C.metal }); let L = 60, xx = x - 60; for (let j = 0; j < 7; j++) { a.line(xx, y - L * (j % 2 ? 1 : -1) * 0.02, xx, y + (j % 2 ? L : -L), { width: 2.5 }); a.line(xx, y, xx, y + (j % 2 ? -L : L) * 0.9, { width: 2.5 }); xx += L * 0.32; L *= 0.8; } a.text(x, y + 70, "τ-scaled dipoles", { size: 10, color: C.mid }); }
    a.loop((t) => anim.forEach((f) => f(t)));
  },
});

fig("dipole_radiation", {
  title: "A dipole radiating: t(θ) = sin²θ", w: 680, h: 300,
  caption: "Wavefronts leave the dipole strongest broadside (θ = 90°) and vanish along its axis: the normalised pattern of a short dipole is sin²θ (ex. 2.5). In the far field each piece of wavefront is locally a plane wave.",
  init(a) {
    const cx = 200, cy = 150;
    a.line(cx, cy - 40, cx, cy - 4, { width: 4 }); a.line(cx, cy + 4, cx, cy + 40, { width: 4 });
    // each ring = 36 unit-radius arc segments with fixed opacity sin²θ, built once; per frame only the group's scale/opacity change
    const rings = Array.from({ length: 4 }, () => {
      const g = a.g();
      for (let k = 0; k < 36; k++) {
        const t0 = (k / 36) * TAU, t1 = ((k + 1) / 36) * TAU, th = (t0 + t1) / 2;
        a.el("path", { d: `M${Math.sin(t0).toFixed(4)},${(-Math.cos(t0)).toFixed(4)} A1,1 0 0 1 ${Math.sin(t1).toFixed(4)},${(-Math.cos(t1)).toFixed(4)}`, fill: "none", stroke: C.blue, "stroke-width": 3.5, "stroke-linecap": "butt", "vector-effect": "non-scaling-stroke", opacity: (Math.sin(th) ** 2).toFixed(3) }, g);
      }
      return g;
    });
    const pc = [520, 150], pr = 110;
    a.circle(...pc, pr, { color: C.soft, width: 1 }); a.circle(...pc, pr / 2, { color: C.faint, width: 1 });
    a.line(pc[0], pc[1] - pr - 10, pc[0], pc[1] + pr + 10, { color: C.mid, width: 1, dash: "3 3" });
    a.path(Array.from({ length: 181 }, (_, i) => { const th = rad(i * 2), r = pr * Math.sin(th) ** 2; return (i ? "L" : "M") + (pc[0] + r * Math.sin(th)) + "," + (pc[1] - r * Math.cos(th)); }).join(""), { color: C.orange, width: 3, fill: "#ffedd5" });
    a.text(pc[0], 20, "pattern t(θ) = sin²θ", { size: 14, weight: 700 });
    a.text(pc[0] + 8, pc[1] - pr - 4, "θ = 0 (axis): null", { size: 11, anchor: "start", color: C.mid });
    a.loop((t) => rings.forEach((g, j) => { const r = ((t * 40 + j * 40) % 160) + 45; a.set(g, { transform: `translate(${cx},${cy}) scale(${r.toFixed(1)})`, opacity: (1 - (r - 45) / 160).toFixed(3) }); }));
  },
});

fig("pattern_polar", {
  title: "Reading a radiation pattern (ex. 2.4)", w: 680, h: 330,
  caption: "Polar plot in dB of a directive antenna (a 4-element end-fire array). Read the −3 dB beamwidth, the main-to-secondary lobe level (NLPS) and the front-to-back ratio. Turn the antenna: a wave arriving off-axis is received at the pattern level in that direction.",
  init(a) {
    const cx = 200, cy = 165, R = 140, floor = -30;
    [0, -10, -20, -30].forEach((dB) => { const r = R * (1 - dB / floor); a.circle(cx, cy, Math.max(r, 0.1), { color: dB ? C.faint : C.soft, width: 1 }); a.text(cx + 4, cy - r - 2, dB + " dB", { size: 10, color: C.mid, anchor: "start" }); });
    for (let d = 0; d < 360; d += 30) a.line(cx, cy, cx + R * Math.sin(rad(d)), cy - R * Math.cos(rad(d)), { color: C.faint, width: 1 });
    const N = 4, kd = Math.PI / 2;
    const af = (phi) => { const psi = kd * (Math.cos(phi) - 1); return Math.abs(Math.sin(psi / 2)) < 1e-9 ? 1 : Math.abs(Math.sin((N * psi) / 2) / (N * Math.sin(psi / 2))); };
    const tdB = (phi) => Math.max(floor, 20 * Math.log10(Math.min(1, af(phi)) + 1e-9));
    const pat = a.path("", { color: C.blue, width: 3, fill: "#dbeafe" });
    const bw = a.path("", { color: C.orange, width: 2 });
    a.arrow(cx + R + 60, cy, cx + R + 10, cy, C.red, 3); a.text(cx + R + 62, cy + 18, "wave from 090", { size: 12, color: C.red, anchor: "end" });
    let half = 0; for (let d = 0; d <= 180; d += 0.25) if (tdB(rad(d)) >= -3) half = d;
    let side = floor, sideAt = 0; let inMain = true;
    for (let d = 0; d <= 180; d += 0.25) { const v = tdB(rad(d)); if (inMain && v <= floor + 0.01) inMain = false; if (!inMain && v > side) { side = v; sideAt = d; } }
    const backRaw = af(Math.PI);
    a.text(410, 60, `−3 dB beamwidth ≈ ${(2 * half).toFixed(0)}°`, { size: 15, anchor: "start" });
    a.text(410, 88, `NLPS ≈ ${(-side).toFixed(1)} dB`, { size: 15, anchor: "start" });
    a.text(410, 116, backRaw < 1e-6 ? "front-to-back: ∞ (exact rear null)" : `front-to-back ≈ ${(-20 * Math.log10(backRaw)).toFixed(1)} dB`, { size: 15, anchor: "start" });
    const rd = a.text(410, 170, "", { size: 15, anchor: "start", weight: 700, color: C.red });
    const rd2 = a.text(410, 196, "", { size: 14, anchor: "start" });
    a.slider("antenna turned (° clockwise)", 0, 180, 5, 30, (rot) => {
      const P = (phi) => { const v = tdB(phi), r = R * (1 - v / floor); return [cx + r * Math.sin(phi + rad(90 + rot)), cy - r * Math.cos(phi + rad(90 + rot))]; };
      a.set(pat, { d: Array.from({ length: 721 }, (_, i) => (i ? "L" : "M") + P(rad(i / 2)).map((v) => v.toFixed(1)).join(",")).join("") + "z" });
      const p1 = P(rad(half)), p2 = P(rad(-half));
      a.set(bw, { d: `M${cx},${cy} L${p1[0]},${p1[1]} M${cx},${cy} L${p2[0]},${p2[1]}` });
      const lvl = tdB(rad(-rot));
      a.setText(rd, `wave now ${rot}° off-axis: ${lvl.toFixed(1)} dB`);
      a.setText(rd2, `1 µW aligned → ${(10 ** (lvl / 10)).toFixed(2)} µW`);
    });
  },
});

fig("friis_link", {
  title: "The Friis link budget (ex. 2.1)", w: 680, h: 300,
  caption: "Power density falls as P_T D_T / (4πR²); the receiving antenna collects it over its effective area A_ef = λ²D/(4π). Together: P_L = P_T D_T D_R (λ/4πR)². Defaults: 10 W, 2 dB antennas, 120 MHz, ATZ edge 5 nmi.",
  init(a) {
    const tx = [70, 150];
    a.line(tx[0], 230, tx[0], 120, { width: 4 }); a.text(tx[0], 250, "Tx", { size: 14, weight: 700 });
    const rx = a.g();
    const rings = Array.from({ length: 6 }, () => a.circle(tx[0], 120, 1, { color: C.blue, width: 2 }));
    const rxl = a.line(0, 230, 0, 120, { width: 4 }), rxt = a.text(0, 250, "Rx", { size: 14, weight: 700 });
    const ap = a.rect(0, 100, 10, 40, { fill: C.orange, color: "none", opacity: 0.35 });
    const out = [0, 1, 2, 3].map((i) => a.text(400, 40 + i * 26, "", { size: 14, anchor: "start", weight: i === 3 ? 700 : 400 }));
    const st = { R: 9.26, f: 120, PT: 10, D: 2 };
    let rxX = 400;
    const upd = () => {
      const lam = 3e8 / (st.f * 1e6), D = 10 ** (st.D / 10), R = st.R * 1000;
      const PL = st.PT * D * D * (lam / (4 * Math.PI * R)) ** 2;
      const Fs = 20 * Math.log10((4 * Math.PI * R) / lam);
      rxX = 120 + 220 * Math.log10(1 + st.R) / Math.log10(51);
      a.set(rxl, { x1: rxX, x2: rxX }); a.set(rxt, { x: rxX }); a.set(ap, { x: rxX - 5 });
      a.setText(out[0], `λ = ${lam.toFixed(2)} m, A_ef = ${((lam * lam * D) / (4 * Math.PI)).toFixed(2)} m²`);
      a.setText(out[1], `free-space loss (4πR/λ)² = ${Fs.toFixed(1)} dB`);
      a.setText(out[2], `P_T = ${st.PT} W = ${(10 * Math.log10(st.PT * 1000)).toFixed(1)} dBm`);
      a.setText(out[3], `P_L = ${PL < 1e-6 ? (PL * 1e9).toFixed(2) + " nW" : (PL * 1e6).toFixed(2) + " µW"} = ${(10 * Math.log10(PL * 1000)).toFixed(1)} dBm`);
    };
    a.slider("distance R (km)", 0.5, 50, 0.01, 9.26, (v) => { st.R = v; upd(); }, (v) => v.toFixed(2));
    a.slider("frequency (MHz)", 100, 3000, 1, 120, (v) => { st.f = v; upd(); });
    a.slider("D_T = D_R (dB)", 0, 30, 0.5, 2, (v) => { st.D = v; upd(); });
    a.loop((t) => rings.forEach((r, i) => { const u = (t * 0.35 + i / 6) % 1, rr = 5 + u * 330; a.set(r, { r: rr, opacity: Math.max(0, 0.9 - u) * (rr < rxX - tx[0] + 15 ? 1 : 0.25) }); }));
  },
});

fig("antenna_circuit", {
  title: "Antenna impedance and the receiving equivalent circuit", w: 680, h: 260,
  caption: "Seen from its terminals an antenna is Z_ant = R_rad + R_Ω + jX_ant (R_rad 'dissipates' the radiated power; R_Ω is ohmic loss). Receiving, it is a Thévenin source V_ant = l_ef·E behind Z_ant; the load gets the most power when Z_L = Z_ant*.",
  init(a) {
    a.line(60, 40, 60, 140, { width: 4 }); a.text(60, 30, "dipole", { size: 13 });
    for (let k = 0; k < 3; k++) a.arrow(14 + k * 12, 120, 14 + k * 12, 60, C.red, 1.8);
    a.arrow(10, 140, 46, 140, C.mid, 1.4); a.text(28, 154, "k", { size: 11, color: C.mid });
    a.text(42, 66, "E", { size: 13, color: C.red, anchor: "start", weight: 700 });
    a.arrow(85, 90, 130, 90, C.ink, 2); a.text(108, 76, "≡", { size: 20 });
    const y0 = 70, y1 = 200;
    Parts.source(a, 170, 135, 20); a.text(150, 178, "V_ant = l_ef E", { size: 13, anchor: "end" });
    a.line(170, 115, 170, y0); a.line(170, 155, 170, y1);
    Parts.resistor(a, 170, y0, 270, "R_rad"); Parts.resistor(a, 270, y0, 360, "R_Ω"); Parts.inductor(a, 360, y0, 450, "jX_ant");
    a.line(450, y0, 540, y0); a.line(170, y1, 540, y1);
    Parts.resistorV(a, 540, y0, y1, "Z_L (receiver)");
    a.rect(160, 40, 300, 60, { dash: "5 4", color: C.blue, width: 1.5 }); a.text(310, 30, "Z_ant = R_rad + R_Ω + jX_ant", { size: 13, color: C.blue, weight: 700 });
    const f = Parts.flowDots(a, [[170, y0], [540, y0], [540, y1], [170, y1], [170, y0]], { color: C.orange, gap: 30, ac: 22 });  // AC: the charges oscillate
    a.loop((t) => f(t));
  },
});
