/* VA figures: A320 pneumatic (ATA 36) and hydraulic up to the Green system (ATA 29). */
"use strict";

const ECAM = { bg: "#0b1220", green: "#22c55e", amber: "#f59e0b", white: "#e5e7eb", cyan: "#22d3ee", blue: "#60a5fa" };

/* Valve symbol: circle with a bar in line (open) or across (closed). */
function valveSym(a, x, y, r, horizontal = true, col = C.ink) {
  const c = a.circle(x, y, r, { fill: C.bg, color: col, width: 2 });
  const bar = a.line(x - r, y, x + r, y, { color: col, width: 3 });
  return (open, color = col) => {
    const ang = open ? (horizontal ? 0 : 90) : horizontal ? 90 : 0;
    a.set(bar, { x1: x - r * Math.cos(rad(ang)), y1: y - r * Math.sin(rad(ang)), x2: x + r * Math.cos(rad(ang)), y2: y + r * Math.sin(rad(ang)), stroke: color });
    a.set(c, { stroke: color });
  };
}

/* A clickable SVG toggle row: returns getter. */
function svgToggle(a, x, y, label, init, onChange) {
  const g = a.g({ style: "cursor:pointer" });
  let on = init;
  const box = a.rect(x, y - 9, 34, 18, { r: 9, fill: on ? C.blue : C.soft, color: "none", parent: g });
  const knob = a.circle(on ? x + 25 : x + 9, y, 7, { fill: C.bg, color: "none", parent: g });
  a.text(x + 42, y, label, { size: 13, anchor: "start", parent: g });
  g.addEventListener("click", () => { on = !on; a.set(box, { fill: on ? C.blue : C.soft }); a.set(knob, { cx: on ? x + 25 : x + 9 }); onChange(on); });
  return () => on;
}

/* ------------------------------------------------------------------ VA-1 pneumatic overview */
fig("bleed_system", {
  title: "A320 pneumatic system: sources, crossbleed and users", w: 720, h: 400,
  caption: "Each engine bleeds through its own valves into its side of the manifold; the crossbleed valve joins the sides. The APU and the ground connection feed the LEFT side. APU bleed has priority: selecting it closes both engine bleed valves, and in AUTO the crossbleed follows the APU bleed valve. Click the controls and watch which users are fed.",
  init(a) {
    const yM = 170;
    const seg = (pts, col = C.soft) => ({ pts, line: a.path("M" + pts.map((p) => p.join(",")).join(" L"), { color: col, width: 8 }), dots: Parts.flowDots(a, pts, { color: C.orange, gap: 24, speed: 50, r: 3.2 }) });
    const L = { duct: seg([[70, yM], [360, yM]]), eng: seg([[150, 330], [150, yM]]), apu: seg([[300, 330], [300, yM]]), gnd: seg([[225, 330], [225, yM]]), pack: seg([[200, yM], [200, 70]]), wai: seg([[70, yM], [40, yM], [40, 120]]) };
    const R = { duct: seg([[360, yM], [650, yM]]), eng: seg([[570, 330], [570, yM]]), pack: seg([[520, yM], [520, 70]]), wai: seg([[650, yM], [680, yM], [680, 120]]) };
    Parts.box(a, 150, 350, 90, 34, "ENG 1", { fill: "#e2e8f0" }); Parts.box(a, 570, 350, 90, 34, "ENG 2", { fill: "#e2e8f0" });
    Parts.box(a, 300, 352, 70, 30, "APU", { fill: "#e2e8f0" }); Parts.box(a, 225, 386, 96, 22, "ground conn.", { size: 11, fill: "#f8fafc" });
    Parts.box(a, 200, 50, 90, 34, "PACK 1", { fill: "#e0f2fe" }); Parts.box(a, 520, 50, 90, 34, "PACK 2", { fill: "#e0f2fe" });
    a.text(40, 108, "wing anti-ice L", { size: 11 }); a.text(680, 108, "wing anti-ice R", { size: 11 });
    const vE1 = valveSym(a, 150, 260, 11, false), vE2 = valveSym(a, 570, 260, 11, false), vAPU = valveSym(a, 300, 260, 11, false), vX = valveSym(a, 360, yM, 13, true);
    a.text(166, 260, "PRV 1", { size: 11, anchor: "start" }); a.text(586, 260, "PRV 2", { size: 11, anchor: "start" }); a.text(316, 260, "APU bleed", { size: 11, anchor: "start" }); a.text(360, yM - 24, "X-BLEED", { size: 12, weight: 700 });
    a.poly([[294, 292], [306, 292], [300, 302]], { fill: C.ink, color: "none" }); a.text(312, 296, "check", { size: 10, anchor: "start", color: C.mid });
    const out = a.note("");
    const st = { e1: true, e2: true, apu: false, xs: "AUTO", gnd: false };
    const upd = () => {
      const apuOpen = st.apu, prv1 = st.e1 && !apuOpen, prv2 = st.e2 && !apuOpen;
      const xOpen = st.xs === "OPEN" || (st.xs === "AUTO" && apuOpen);
      let left = prv1 || apuOpen || st.gnd, right = prv2;
      if (xOpen) { const any = left || right; left = right = any; }
      vE1(prv1, prv1 ? C.green : C.ink); vE2(prv2, prv2 ? C.green : C.ink); vAPU(apuOpen, apuOpen ? C.green : C.ink); vX(xOpen, xOpen ? C.green : C.ink);
      const paint = (s, on) => { a.set(s.line, { stroke: on ? "#fdba74" : C.soft }); s.dots.show(on); s.on = on; };
      paint(L.duct, left); paint(L.pack, left); paint(L.wai, left); paint(L.eng, prv1); paint(L.apu, apuOpen); paint(L.gnd, st.gnd);
      paint(R.duct, right); paint(R.pack, right); paint(R.wai, right); paint(R.eng, prv2);
      const src = [prv1 && "ENG 1", prv2 && "ENG 2", apuOpen && "APU", st.gnd && "ground cart"].filter(Boolean);
      out.textContent = `sources: ${src.join(" + ") || "none"} · PACK 1 ${left ? "fed" : "NOT fed"} · PACK 2 ${right ? "fed" : "NOT fed"} · X-BLEED ${xOpen ? "OPEN" : "shut"}${apuOpen && (st.e1 || st.e2) ? " · APU priority: engine PRVs closed" : ""}`;
    };
    a.buttons(["ENG 1 BLEED on", "ENG 1 BLEED off"], (i) => { st.e1 = i === 0; upd(); });
    a.buttons(["ENG 2 BLEED on", "ENG 2 BLEED off"], (i) => { st.e2 = i === 0; upd(); });
    a.buttons(["APU BLEED off", "APU BLEED on"], (i) => { st.apu = i === 1; upd(); });
    a.buttons(["X-BLEED AUTO", "OPEN", "SHUT"], (i, k) => { st.xs = ["AUTO", "OPEN", "SHUT"][i]; upd(); });
    a.buttons(["ground cart off", "ground cart on"], (i) => { st.gnd = i === 1; upd(); });
    a.loop((t) => [...Object.values(L), ...Object.values(R)].forEach((s) => s.on && s.dots(t)));
  },
});

fig("engine_bleed", {
  title: "Engine bleed circuit: who regulates at each engine power?", w: 720, h: 360,
  caption: "Stage 5 (IP) feeds through the IPCV check valve; stage 9 (HP) through the HPV, which regulates 36 ± 4 psi and shuts once stage 5 exceeds 36 psi. Both join at the PRV, which is fully open below 44 psi and regulates 44 ± 4 psi above. The OPV (spring-open) only acts if the PRV fails: it starts closing at 74 psi and is shut at 90. The BMC closes the PRV (and the slaved HPV) through the TLT solenoid at 57 psi.",
  init(a) {
    a.rect(30, 230, 260, 90, { r: 10, fill: "#e2e8f0", color: C.mid }); a.text(160, 300, "HP compressor", { size: 13, weight: 700 });
    for (let k = 0; k < 9; k++) a.line(45 + k * 28, 240, 45 + k * 28, 280, { color: C.metal, width: 3 });
    a.text(101, 222, "stage 5 (IP)", { size: 12 }); a.text(269, 222, "stage 9 (HP)", { size: 12 });
    const dIP = a.path("M101,230 L101,150 L330,150", { color: C.soft, width: 8 }), dHP = a.path("M269,230 L269,190 L330,190 L330,150", { color: C.soft, width: 8 });
    const dJ = a.path("M330,150 L640,150 L640,60", { color: C.soft, width: 8 });
    const vIP = valveSym(a, 101, 185, 12, false), vHP = valveSym(a, 300, 190, 12, true), vPRV = valveSym(a, 400, 150, 13, true), vOPV = valveSym(a, 480, 150, 13, true);
    a.text(80, 185, "IPCV", { size: 11, anchor: "end" }); a.text(300, 172, "HPV 36", { size: 11 }); a.text(400, 128, "PRV 44", { size: 11, weight: 700 }); a.text(480, 128, "OPV", { size: 11 });
    a.rect(540, 125, 60, 50, { r: 6, fill: "#e0f2fe", color: C.blue }); a.text(570, 150, "PCE", { size: 11 }); a.text(570, 190, "precooler", { size: 10, color: C.mid });
    a.text(650, 54, "to the manifold", { size: 11, anchor: "start" });
    const pTxt = { p5: a.text(101, 336, "", { size: 12, color: C.purple, weight: 700 }), p9: a.text(269, 336, "", { size: 12, color: C.purple, weight: 700 }), out: a.text(650, 100, "", { size: 16, weight: 700, anchor: "start" }) };
    const flows = { ip: Parts.flowDots(a, [[101, 230], [101, 150], [330, 150]], { color: C.orange, gap: 22, speed: 50 }), hp: Parts.flowDots(a, [[269, 230], [269, 190], [330, 190], [330, 150]], { color: C.red, gap: 22, speed: 50 }), j: Parts.flowDots(a, [[330, 150], [640, 150], [640, 60]], { color: C.orange, gap: 22, speed: 60 }) };
    const notes = [a.note(""), a.note("")];
    const st = { p5: 25, prvFail: false, solFail: false };
    let act = { ip: false, hp: false, j: false };
    const upd = () => {
      const p5 = st.p5, p9 = 2.4 * p5;
      const hpvOpen = p5 <= 36 && !(st.prvFail && !st.solFail && 0);
      let pj = hpvOpen ? Math.max(p5, Math.min(p9, 36)) : p5;
      const ipcv = !hpvOpen || p5 >= pj - 0.01;
      let prv = "fully open", out = pj, opv = "open", closedBy = "";
      if (!st.prvFail) { if (pj > 44) { prv = "REGULATING"; out = 44; } }
      else { prv = "failed open"; out = pj; if (pj >= 57 && !st.solFail) { prv = "CLOSED by BMC (57 psi, TLT solenoid)"; out = 0; closedBy = "HPV closes with it"; } else if (pj > 74) { opv = pj >= 90 ? "throttling hard (shut at 90)" : "closing (74–90 psi band)"; out = Math.min(pj, 74 + (pj - 74) * 0.25); } }
      const hpvState = prv.startsWith("CLOSED") ? "CLOSED (slaved to PRV)" : hpvOpen ? (p9 > 36 ? "REGULATING 36 psi" : "fully open") : "CLOSED (stage 5 > 36 psi)";
      vIP(ipcv && out > 0, ipcv && out > 0 ? C.green : C.ink); vHP(hpvOpen && !prv.startsWith("CLOSED"), hpvOpen && !prv.startsWith("CLOSED") ? C.green : C.ink);
      vPRV(!prv.startsWith("CLOSED"), prv === "REGULATING" ? C.amber : prv.startsWith("CLOSED") ? C.red : C.green); vOPV(!opv.startsWith("throttling hard"), opv === "open" ? C.green : C.amber);
      act = { ip: ipcv && out > 0, hp: hpvOpen && !prv.startsWith("CLOSED"), j: out > 0 };
      a.set(dIP, { stroke: act.ip ? "#fdba74" : C.soft }); a.set(dHP, { stroke: act.hp ? "#fca5a5" : C.soft }); a.set(dJ, { stroke: act.j ? "#fdba74" : C.soft });
      Object.entries(flows).forEach(([k, f]) => f.show(act[k]));
      a.setText(pTxt.p5, `${p5.toFixed(0)} psi`); a.setText(pTxt.p9, `${p9.toFixed(0)} psi`); a.setText(pTxt.out, `${out.toFixed(0)} psi`);
      notes[0].textContent = `IPCV ${ipcv ? "open" : "shut (stage-9 air is higher)"} · HPV ${hpvState} · PRV ${prv} · OPV ${opv}`;
      notes[1].textContent = `delivered ≈ ${out.toFixed(0)} psi${prv === "REGULATING" ? " (44 ± 4)" : hpvState.startsWith("REG") ? " (36 ± 4)" : ""} ${closedBy}`;
    };
    a.slider("stage-5 pressure (engine power)", 10, 110, 1, 25, (v) => { st.p5 = v; upd(); }, (v) => v + " psi");
    a.buttons(["PRV normal", "PRV regulator fails high"], (i) => { st.prvFail = i === 1; upd(); });
    a.buttons(["TLT solenoid OK", "TLT solenoid failed"], (i) => { st.solFail = i === 1; upd(); });
    a.loop((t) => Object.entries(flows).forEach(([k, f]) => act[k] && f(t)));
  },
});

fig("butterfly_valve", {
  title: "PRV: a pneumatic actuator holds a butterfly at 44 psi", w: 720, h: 330,
  caption: "Upstream air (≥ 8 psi) fills the opening chamber C through the reference regulator (44 psi); downstream pressure above 44 psi lifts the vent and fills the closing chamber D, which with the spring pushes the butterfly towards closed. The butterfly 'hunts' around the set point: 44 ± 4 psi. Venting the sense line (TLT solenoid, reverse flow, thermal fuse) empties C and the spring shuts the valve.",
  init(a) {
    a.rect(20, 210, 680, 70, { fill: "#f1f5f9", color: C.mid }); a.text(60, 300, "upstream", { size: 12 }); a.text(640, 300, "downstream", { size: 12 });
    const bf = a.line(360, 215, 360, 275, { color: C.ink, width: 8 }); a.circle(360, 245, 5, { fill: C.ink });
    const crank = a.line(360, 245, 360, 200, { color: C.mid, width: 4 });
    a.rect(230, 60, 260, 70, { r: 6, fill: "#fff", color: C.ink });
    const chC = a.rect(232, 62, 100, 66, { fill: "#bfdbfe", color: "none" }), chD = a.rect(340, 62, 148, 66, { fill: "#fecaca", color: "none" });
    const pis = a.rect(330, 62, 10, 66, { fill: C.ink, color: "none" }), rod = a.line(335, 130, 360, 200, { color: C.mid, width: 4 });
    const spring = a.path("", { color: C.ink, width: 2 });
    a.text(282, 50, "chamber C (opens)", { size: 11, color: C.blue }); a.text(430, 50, "chamber D + spring (closes)", { size: 11, color: C.red });
    a.path("M120,210 L120,95 L232,95", { color: C.blue, width: 2, dash: "5 4" }); a.text(126, 150, "reference 44 psi", { size: 11, anchor: "start", color: C.blue });
    a.path("M600,210 L600,95 L488,95", { color: C.red, width: 2, dash: "5 4" }); a.text(594, 150, "downstream sense", { size: 11, anchor: "end", color: C.red });
    const gauge = a.text(560, 250, "", { size: 16, weight: 700 });
    const flow = Array.from({ length: 24 }, (_, i) => ({ x: (i * 29) % 680 + 20, y: 220 + ((i * 13) % 50), c: a.circle(0, 0, 3, { fill: C.orange, color: "none" }) }));
    const st = { pu: 80, vent: false };
    let th = 0.5, pd = 40;
    a.slider("upstream pressure (psi)", 0, 120, 1, 80, (v) => (st.pu = v));
    a.buttons(["sense line normal", "sense line vented (TLT)"], (i) => (st.vent = i === 1));
    a.loop((t, dt) => {
      const target = st.vent || st.pu < 8 ? 0 : st.pu <= 44 ? 1 : null;
      if (target !== null) th += (target - th) * Math.min(1, dt * 3);
      else th = clamp(th + (44 - pd) * dt * 0.02 + Math.sin(t * 2.3) * dt * 0.05, 0.05, 1);
      pd = st.pu * Math.min(1, Math.sin((th * Math.PI) / 2) * 1.15);
      const ang = (1 - th) * 80;
      a.set(bf, { x1: 360 - 30 * Math.sin(rad(ang)), y1: 245 - 30 * Math.cos(rad(ang)), x2: 360 + 30 * Math.sin(rad(ang)), y2: 245 + 30 * Math.cos(rad(ang)) });
      const px = 250 + th * 180;
      a.set(pis, { x: px }); a.set(chC, { width: px - 232 }); a.set(chD, { x: px + 10, width: 488 - px - 10 }); a.set(rod, { x1: px + 5 });
      let d = `M${px + 10},95`; const n = 8, w = (488 - px - 10) / n; for (let k = 0; k < n; k++) d += ` l${w / 2},${k % 2 ? 14 : -14} l${w / 2},${k % 2 ? -14 : 14}`; a.set(spring, { d });
      a.setText(gauge, `${pd.toFixed(1)} psi`);
      flow.forEach((p) => { p.x += (20 + 160 * th) * dt; if (p.x > 700) p.x = 20; a.set(p.c, { cx: p.x, cy: p.y, opacity: p.x > 360 && th < 0.08 ? 0 : 1 }); });
    });
  },
});

fig("prv_closure", {
  title: "Every way the PRV (and the slaved HPV) closes", w: 720, h: 340,
  caption: "Click the conditions. Electrical closures go through the BMC and the TLT solenoid; pneumatic ones act directly on the PRV sense line or by lack of pressure. Whatever closes the PRV also closes the HPV (PRV chamber C is piped to HPV chamber E), but not the reverse.",
  init(a) {
    const groups = [["crew", ["ENG BLEED pushbutton OFF", "ENG FIRE pushbutton pushed"]], ["BMC → TLT solenoid", ["overpressure ≥ 57 psi", "overtemperature ≥ 257 °C", "leak detected (that side)", "engine start sequence", "APU bleed valve open"]], ["pneumatic", ["upstream < 8 psi (spring)", "reverse flow (TLT diaphragm)", "thermal fuse 450 °C"]]];
    const state = {};
    let y = 30;
    groups.forEach(([gname, items]) => { a.text(20, y, gname, { size: 13, weight: 700, anchor: "start", color: C.blue }); y += 22; items.forEach((it) => { svgToggle(a, 30, y, it, false, (v) => { state[it] = v; upd(); }); y += 24; }); y += 6; });
    a.path("M360,40 L420,40 Q470,170 420,300 L360,300 Q400,170 360,40 z", { fill: "#f8fafc", color: C.ink }); a.text(405, 170, "OR", { size: 16, weight: 700 });
    for (let k = 0; k < 10; k++) a.line(330, 50 + k * 26, 372 + Math.sin((k / 9) * Math.PI) * 12, 50 + k * 26, { color: C.soft, width: 1 });
    a.line(462, 170, 520, 170, { width: 2.5, arrow: true });
    const vP = valveSym(a, 570, 140, 22, true), vH = valveSym(a, 570, 220, 18, true);
    a.text(610, 140, "PRV", { size: 15, weight: 700, anchor: "start" }); a.text(605, 220, "HPV (slaved)", { size: 13, anchor: "start" });
    const out = a.text(570, 290, "", { size: 15, weight: 700 });
    const upd = () => { const closed = Object.values(state).some(Boolean); vP(!closed, closed ? C.red : C.green); vH(!closed, closed ? C.red : C.green); a.setText(out, closed ? "PRV + HPV CLOSED" : "PRV regulating 44 psi"); a.set(out, { fill: closed ? C.red : C.green }); };
    upd();
  },
});

fig("temp_ladder", {
  title: "The temperature ladder after the precooler", w: 720, h: 320,
  caption: "Drag the bleed temperature up and read which protection acts: TCT/FAV regulate continuously at 200 ± 15 °C; the TLT probe throttles the PRV pneumatically from 235–245 °C; at 257 °C the BMC energises the TLT solenoid and shuts the PRV (ECAM); the PRV thermal fuse at 450 °C is the last resort.",
  init(a) {
    const Y = (T) => 290 - ((T - 150) / 330) * 260;
    a.rect(80, 20, 30, 275, { r: 15, fill: "#f8fafc", color: C.ink }); a.circle(95, 295, 22, { fill: C.red, color: C.ink });
    const merc = a.rect(87, 0, 16, 0, { fill: C.red, color: "none" });
    const rungs = [[185, 215, "TCT → FAV: more fan air, holds 200 ± 15 °C", C.green], [235, 245, "TLT probe: bleeds the PRV sense line → PRV throttles", C.amber], [257, 260, "BMC → TLT solenoid: PRV (and HPV) shut, ECAM caution", C.red], [450, 453, "PRV thermal fuse melts: sense line vented, PRV shut", C.purple]];
    const ly = [Y(200), Y(240) + 9, Y(258) - 11, Y(451)];
    const rows = rungs.map(([lo, hi, s, c], i) => { a.rect(115, Y(hi) - 2, 30, Math.max(4, Y(lo) - Y(hi) + 4), { fill: c, color: "none", opacity: 0.6 }); a.text(150, ly[i], `${lo}${hi - lo > 5 ? "–" + hi : ""} °C`, { size: 12, anchor: "start", weight: 700, color: c }); return [lo, a.text(250, ly[i], s, { size: 12.5, anchor: "start", opacity: 0.35 })]; });
    for (let T = 150; T <= 480; T += 50) a.text(72, Y(T), T, { size: 11, anchor: "end", color: C.mid });
    const out = a.text(470, 30, "", { size: 15, weight: 700 });
    a.slider("bleed temperature (°C)", 150, 480, 1, 200, (T) => {
      a.set(merc, { y: Y(T), height: 295 - Y(T) });
      rows.forEach(([lo, t]) => a.set(t, { opacity: T >= lo ? 1 : 0.35, "font-weight": T >= lo ? 700 : 400 }));
      a.setText(out, T < 185 ? "below 200 °C: FAV stays shut" : T <= 215 ? "normal regulation band" : T < 235 ? "above the band: FAV wide open" : T < 257 ? "TLT limiting the PRV" : T < 450 ? "PRV shut by the BMC" : "fuse: last resort");
    });
  },
});

fig("thermostat_probe", {
  title: "Tube-and-rod thermostatic probe (TCT and TLT)", w: 720, h: 260,
  caption: "The outer tube expands more than the inner rod welded to its tip. When the duct air heats the probe, the tube grows and PULLS the rod, which lifts a ball off its seat and opens a vent: proportional, not on/off. The TCT starts venting at 200 °C (sending signal air to the FAV); the TLT probe at 235–245 °C (bleeding the PRV sense line).",
  init(a) {
    a.rect(20, 60, 680, 140, { fill: "#fff7ed", color: C.soft }); a.text(40, 50, "bleed duct after the precooler", { size: 12, anchor: "start", color: C.mid });
    a.rect(560, 40, 120, 170, { r: 8, fill: "#e2e8f0", color: C.ink }); a.text(620, 30, "regulator body", { size: 12 });
    const tube = a.rect(0, 112, 0, 36, { r: 6, fill: "#fcd34d", color: C.brown, width: 2 }); const rod = a.line(0, 130, 600, 130, { color: C.ink, width: 4 });
    const ball = a.circle(612, 130, 9, { fill: C.metal, color: C.ink }); a.line(622, 112, 622, 148, { width: 4 }); a.text(640, 190, "vent", { size: 12 });
    const vent = Parts.flowDots(a, [[625, 130], [700, 130], [700, 20]], { color: C.blue, gap: 16, speed: 60 });
    const out = a.note("");
    let set = 200, T = 190, open = 0;
    a.buttons(["TCT (200 °C)", "TLT probe (235–245 °C)"], (i) => { set = i ? 235 : 200; upd(); });
    const upd = () => {
      const grow = (T - 150) * 0.35;
      a.set(tube, { x: 140 - grow, width: 420 + grow }); a.set(rod, { x1: 140 - grow + 6 });
      open = clamp((T - set) / (set === 200 ? 15 : 10), 0, 1);
      a.set(ball, { cx: 612 - open * 10 });
      vent.show(open > 0.02);
      out.textContent = `T = ${T} °C: vent ${open > 0.02 ? (open * 100).toFixed(0) + " % open" : "closed"} → ${set === 200 ? (open > 0.02 ? "TCT sends signal air, FAV opens" : "no air to the FAV, FAV spring-closed") : open > 0.02 ? "PRV sense line bled, PRV throttles" : "PRV unaffected"}`;
    };
    a.slider("duct temperature (°C)", 150, 280, 1, 190, (v) => { T = v; upd(); });
    a.loop((t) => vent(t));
  },
});

fig("precooler_loop", {
  title: "Precooler, FAV and TCT: the 200 °C loop", w: 720, h: 310,
  caption: "Hot bleed air runs through the tubes, cold fan air across them and then overboard: heat exchange, no mixing. The TCT senses the outlet and sends air to open the spring-closed FAV, letting more fan air through. Raise the engine bleed temperature: the FAV opens wider and the outlet settles near 200 °C (the BMC is not in this loop).",
  init(a) {
    a.rect(260, 70, 200, 170, { r: 8, fill: "#f8fafc", color: C.ink }); a.text(360, 60, "precooler (PCE)", { size: 13, weight: 700 });
    for (let k = 0; k < 6; k++) a.line(275, 95 + k * 25, 445, 95 + k * 25, { color: C.red, width: 4, opacity: 0.6 });
    const hotIn = Parts.flowDots(a, [[40, 155], [260, 155]], { color: C.red, gap: 22, speed: 60 }), hotOut = Parts.flowDots(a, [[460, 155], [700, 155]], { color: C.orange, gap: 22, speed: 60 });
    a.text(40, 140, "bleed from PRV/OPV", { size: 12, anchor: "start" }); a.text(700, 118, "to the manifold", { size: 12, anchor: "end" });
    const fan = Parts.flowDots(a, [[360, 300], [360, 245], [360, 70], [360, 10]], { color: C.blue, gap: 20, speed: 60 });
    a.text(380, 290, "fan air in", { size: 12, anchor: "start", color: C.blue }); a.text(380, 18, "overboard", { size: 12, anchor: "start", color: C.blue });
    const fav = a.line(340, 270, 380, 270, { color: C.ink, width: 6 }); a.text(330, 272, "FAV", { size: 12, anchor: "end", weight: 700 });
    a.circle(560, 155, 9, { fill: C.amber, color: C.ink }); a.text(560, 185, "TCT probe", { size: 11 });
    a.path("M560,146 L560,110 L620,110 L620,270 L385,270", { color: C.amber, width: 2, dash: "5 4" }); a.text(625, 230, "signal air", { size: 11, anchor: "start", color: C.amber });
    const tin = a.text(150, 185, "", { size: 14, weight: 700, color: C.red }), tout = a.text(600, 200, "", { size: 14, weight: 700, color: C.orange });
    let open = 0;
    a.slider("bleed temperature in (°C)", 180, 540, 1, 350, (T) => {
      const eps = 0.85, Tf = 30;
      open = T <= 200 ? 0 : clamp((T - 200) / (eps * (T - Tf)), 0, 1);
      const To = T - eps * open * (T - Tf);
      a.set(fav, { x1: 360 - 20 * Math.cos(rad(open * 85)), y1: 270 - 20 * Math.sin(rad(open * 85)), x2: 360 + 20 * Math.cos(rad(open * 85)), y2: 270 + 20 * Math.sin(rad(open * 85)) });
      a.setText(tin, `${T} °C`); a.setText(tout, `${To.toFixed(0)} °C · FAV ${(open * 100).toFixed(0)} %`);
      fan.show(open > 0.02);
    });
    a.loop((t) => { hotIn(t); hotOut(t); if (open > 0.02) fan(t, 30 + 60 * open); });
  },
});

fig("opv_valve", {
  title: "Overpressure valve (OPV)", w: 720, h: 250,
  caption: "Spring-loaded OPEN butterfly that does nothing while the PRV regulates. Upstream pressure, through a filter, acts on two spring-loaded pistons: they start to yield at 74 psi and the valve is fully closed at 90 psi (deck: 73.8–89.9). It reopens as the pressure recovers.",
  init(a) {
    a.rect(20, 120, 680, 70, { fill: "#f1f5f9", color: C.mid });
    const bf = a.line(360, 125, 360, 185, { color: C.ink, width: 8 });
    a.rect(300, 30, 120, 50, { r: 6, fill: "#fff", color: C.ink }); const p1 = a.rect(310, 35, 10, 40, { fill: C.ink, color: "none" }); a.text(360, 22, "two spring-loaded pistons", { size: 11 });
    a.line(360, 80, 360, 155, { color: C.mid, width: 3 });
    const out = a.text(560, 60, "", { size: 15, weight: 700 });
    const flow = Array.from({ length: 22 }, (_, i) => ({ x: (i * 31) % 680 + 20, y: 130 + ((i * 11) % 50), c: a.circle(0, 0, 3, { fill: C.orange, color: "none" }) }));
    let open = 1;
    a.slider("upstream pressure (psi)", 0, 100, 0.5, 60, (p) => {
      open = clamp((90 - p) / 16, 0, 1);
      const ang = (1 - open) * 85;
      a.set(bf, { x1: 360 - 30 * Math.sin(rad(90 - ang)) * 0 - 30 * Math.sin(rad(ang)), y1: 155 - 30 * Math.cos(rad(ang)), x2: 360 + 30 * Math.sin(rad(ang)), y2: 155 + 30 * Math.cos(rad(ang)) });
      a.set(p1, { x: 310 + (1 - open) * 90 });
      a.setText(out, p < 74 ? "fully OPEN (spring)" : p < 90 ? `closing: ${(open * 100).toFixed(0)} % open` : "CLOSED");
    });
    a.loop((t, dt) => flow.forEach((q) => { q.x += (10 + 150 * open) * dt; if (q.x > 700) q.x = 20; a.set(q.c, { cx: q.x, cy: q.y, opacity: q.x > 360 && open < 0.05 ? 0 : 1 }); }));
  },
});

fig("xbleed_logic", {
  title: "APU bleed valve and crossbleed logic", w: 720, h: 360,
  caption: "The APU bleed valve opens (BMC → ECB) when APU BLEED is selected, the APU runs at 95 %, there is no APU fire pushbutton, no APU shut-down signal and no APU-duct leak (leaks are tolerated on the ground until the engines start). In AUTO the crossbleed valve (motor 1, from either BMC) follows the APU bleed valve, unless an ENG FIRE pushbutton is pushed or a leak is detected (except during an engine start sequence). OPEN/SHUT use motor 2.",
  init(a) {
    const s = { apuSel: true, apu95: true, apuFire: false, apuShut: false, apuLeak: false, engFire: false, leak: false, start: false, sel: "AUTO" };
    const items1 = [["apuSel", "APU BLEED selected"], ["apu95", "APU at 95 % speed"], ["apuFire", "APU FIRE pushbutton"], ["apuShut", "APU shut-down signal"], ["apuLeak", "APU-duct leak (in flight)"]];
    const items2 = [["engFire", "ENG FIRE pushbutton"], ["leak", "bleed leak detected"], ["start", "engine start sequence"]];
    let y = 30;
    a.text(20, 18, "APU bleed valve conditions", { size: 13, weight: 700, anchor: "start", color: C.blue });
    items1.forEach(([k, l]) => { svgToggle(a, 30, y + 14, l, s[k], (v) => { s[k] = v; upd(); }); y += 26; });
    y += 18; a.text(20, y, "crossbleed (AUTO) conditions", { size: 13, weight: 700, anchor: "start", color: C.blue }); y += 4;
    items2.forEach(([k, l]) => { svgToggle(a, 30, y + 14, l, s[k], (v) => { s[k] = v; upd(); }); y += 26; });
    const vA = valveSym(a, 470, 90, 24, true), vX = valveSym(a, 470, 240, 24, true);
    a.text(510, 90, "APU bleed valve", { size: 14, weight: 700, anchor: "start" }); a.text(510, 240, "X-BLEED valve", { size: 14, weight: 700, anchor: "start" });
    const tA = a.text(510, 114, "", { size: 12, anchor: "start" }), tX = a.text(510, 264, "", { size: 12, anchor: "start" }), why2 = a.note("");
    a.path("M470,114 L470,216", { color: C.mid, width: 1.5, dash: "4 4" }); a.text(478, 165, "AUTO: follows", { size: 11, anchor: "start", color: C.mid });
    const upd = () => {
      const apu = s.apuSel && s.apu95 && !s.apuFire && !s.apuShut && !s.apuLeak;
      let x, why;
      if (s.sel === "OPEN") { x = true; why = "selector OPEN (motor 2)"; }
      else if (s.sel === "SHUT") { x = false; why = "selector SHUT (motor 2)"; }
      else { x = apu && !s.engFire && (!s.leak || s.start); why = !apu ? "AUTO, APU valve shut → shut (motor 1)" : s.engFire ? "AUTO, ENG FIRE pb → shut" : s.leak && !s.start ? "AUTO, leak → shut" : s.leak ? "AUTO, leak during start: stays open" : "AUTO, APU valve open → open (motor 1)"; }
      vA(apu, apu ? C.green : C.red); vX(x, x ? C.green : C.red);
      a.setText(tA, apu ? "OPEN" : "SHUT"); a.setText(tX, x ? "OPEN" : "SHUT"); why2.textContent = `X-BLEED ${x ? "OPEN" : "SHUT"}: ${why}`;
    };
    a.buttons(["selector AUTO", "OPEN", "SHUT"], (i) => { s.sel = ["AUTO", "OPEN", "SHUT"][i]; upd(); });
  },
});

fig("overhead_bleed", {
  title: "Overhead panel 21VU: bleed pushbuttons and X-BLEED selector", w: 720, h: 260,
  caption: "Dark cockpit: no light means normal. ENG BLEED: dark = bleed requested, white OFF = deselected, amber FAULT = failure (with ECAM). APU BLEED: blue ON when selected. X-BLEED: AUTO / OPEN / SHUT. Click the pushbuttons, the FAULT buttons and the selector.",
  init(a) {
    a.rect(10, 10, 700, 240, { r: 10, fill: "#334155", color: "none" });
    a.text(360, 34, "AIR COND / BLEED", { size: 13, color: "#e2e8f0", weight: 700 });
    const pb = (x, y, name, kind) => {
      a.text(x, y - 46, name, { size: 12, color: "#e2e8f0", weight: 700 });
      a.rect(x - 34, y - 34, 68, 68, { r: 6, fill: "#1e293b", color: "#64748b" });
      const top = a.text(x, y - 12, "", { size: 12, weight: 700 }), bot = a.text(x, y + 14, "", { size: 12, weight: 700 });
      const st = { on: true, fault: false };
      const paint = () => {
        if (kind === "eng") { a.setText(top, st.fault ? "FAULT" : ""); a.set(top, { fill: ECAM.amber }); a.setText(bot, st.on ? "" : "OFF"); a.set(bot, { fill: ECAM.white }); }
        else { a.setText(top, st.fault ? "FAULT" : ""); a.set(top, { fill: ECAM.amber }); a.setText(bot, st.on ? "ON" : ""); a.set(bot, { fill: ECAM.cyan }); }
      };
      if (kind === "apu") st.on = false;
      const hit = a.rect(x - 34, y - 34, 68, 68, { r: 6, fill: "transparent", color: "none" }); hit.style.cursor = "pointer";
      hit.addEventListener("click", () => { st.on = !st.on; paint(); });
      const fb = a.text(x, y + 56, "inject fault", { size: 10, color: "#fcd34d" }); fb.style.cursor = "pointer";
      fb.addEventListener("click", () => { st.fault = !st.fault; paint(); });
      paint();
    };
    pb(110, 140, "ENG 1 BLEED", "eng"); pb(280, 140, "APU BLEED", "apu"); pb(600, 140, "ENG 2 BLEED", "eng");
    a.text(440, 82, "X BLEED", { size: 12, color: "#e2e8f0", weight: 700 });
    a.circle(440, 150, 32, { fill: "#0f172a", color: "#64748b" });
    const pos = { SHUT: -60, AUTO: 0, OPEN: 60 }; Object.entries(pos).forEach(([n, ang]) => a.text(440 + 48 * Math.sin(rad(ang)), 150 - 48 * Math.cos(rad(ang)), n, { size: 10, color: "#e2e8f0" }));
    const knob = a.line(440, 150, 440, 122, { color: "#e2e8f0", width: 6 });
    let k = 1; const order = ["SHUT", "AUTO", "OPEN"];
    const hit = a.circle(440, 150, 34, { fill: "transparent", color: "none" }); hit.style.cursor = "pointer";
    hit.addEventListener("click", () => { k = (k + 1) % 3; const ang = pos[order[k]]; a.set(knob, { x2: 440 + 28 * Math.sin(rad(ang)), y2: 150 - 28 * Math.cos(rad(ang)) }); });
  },
});

fig("ecam_bleed", {
  title: "ECAM BLEED page (simplified)", w: 720, h: 340,
  caption: "Simplified lower-ECAM BLEED page for the four drill cases. Valve symbols in line = open, across = closed; green = normal, amber = abnormal. Precooler outlet pressure and temperature under each engine; 'GND' appears only on the ground.",
  init(a) {
    a.rect(0, 0, 720, 340, { r: 10, fill: ECAM.bg, color: "none" });
    a.text(360, 22, "BLEED", { size: 16, color: ECAM.white, weight: 700 });
    const g = a.g();
    const cases = {
      "normal cruise": { e1: true, e2: true, hp: false, apu: false, x: false, psi: [44, 44], tmp: [200, 200], gnd: false, fault2: false },
      "ground, APU bleed": { e1: false, e2: false, hp: false, apu: true, x: true, psi: [0, 0], tmp: [0, 0], gnd: true, fault2: false },
      "ENG 2 bleed fault": { e1: true, e2: false, hp: false, apu: false, x: false, psi: [44, 0], tmp: [200, 0], gnd: false, fault2: true },
      "250 °C on side 1": { e1: true, e2: true, hp: false, apu: false, x: false, psi: [44, 44], tmp: [250, 200], gnd: false, fault2: false, hot1: true },
    };
    const draw = (c) => {
      while (g.firstChild) g.removeChild(g.firstChild);
      a.within(g, () => {
        const G = ECAM.green, A = ECAM.amber, W = ECAM.white;
        a.line(120, 120, 600, 120, { color: G, width: 2 });
        [[200, "PACK 1"], [520, "PACK 2"]].forEach(([x, n]) => { a.line(x, 120, x, 60, { color: G, width: 2 }); a.text(x, 48, n, { size: 12, color: W }); });
        const v = (x, y, open, col, hor = false) => { a.circle(x, y, 11, { color: col, width: 2 }); const ang = open ? (hor ? 0 : 90) : hor ? 90 : 0; a.line(x - 11 * Math.cos(rad(ang)), y - 11 * Math.sin(rad(ang)), x + 11 * Math.cos(rad(ang)), y + 11 * Math.sin(rad(ang)), { color: col, width: 2 }); };
        v(360, 120, c.x, c.x ? G : G, true); a.text(360, 100, "X BLEED", { size: 10, color: W });
        a.line(260, 120, 260, 200, { color: G, width: 2 }); v(260, 170, c.apu, G); a.text(260, 225, "APU", { size: 12, color: W });
        [[120, 0], [600, 1]].forEach(([x, i]) => {
          const on = i ? c.e2 : c.e1, fault = i && c.fault2, hot = !i && c.hot1;
          a.line(x, 120, x, 290, { color: G, width: 2 });
          a.text(x + 26, 160, `${c.psi[i]}`, { size: 14, color: on ? G : A, anchor: "start", weight: 700 }); a.text(x + 26, 178, "PSI", { size: 9, color: "#93c5fd", anchor: "start" });
          a.text(x + 26, 204, `${c.tmp[i]}`, { size: 14, color: hot ? A : on ? G : A, anchor: "start", weight: 700 }); a.text(x + 26, 222, "°C", { size: 9, color: "#93c5fd", anchor: "start" });
          v(x, 250, on, fault ? A : G); a.text(x - 18, 250, "PRV", { size: 9, color: W, anchor: "end" });
          a.text(x - 26, 300, "IP", { size: 11, color: W }); a.text(x + 26, 300, "HP", { size: 11, color: W }); v(x + 26, 280, c.hp, G);
          a.text(x, 326, i ? "2" : "1", { size: 16, color: W, weight: 700 });
        });
        if (c.gnd) a.text(360, 300, "GND", { size: 14, color: W, weight: 700 });
      });
    };
    a.buttons(Object.keys(cases), (i, k) => draw(cases[k]));
  },
});

fig("bmc_network", {
  title: "Bleed monitoring computers and their neighbours", w: 720, h: 320,
  caption: "BMC 1 and BMC 2 (identical, interchangeable) supervise their side and exchange data. They read pushbuttons, the X-BLEED selector, fire pushbuttons, valve positions, pressure transmitters and leak-detection loops; they close valves on failures and report to the crew (SDAC → FWC → ECAM via the DMC) and to maintenance (CFDIU). Engine data come from the ECU through the EIU; APU bleed commands go to the ECB.",
  init(a) {
    const B = (x, y, n, w = 96, f = "#eff6ff") => Parts.box(a, x, y, w, 36, n, { fill: f, size: 12 });
    B(260, 160, "BMC 1", 100, "#dbeafe"); B(460, 160, "BMC 2", 100, "#dbeafe");
    B(90, 60, "pushbuttons\n+ X-BLEED sel.", 130); B(90, 160, "valve positions\nPt, Pr, T", 130); B(90, 260, "leak loops\n(ducts, pylons)", 130);
    B(360, 40, "SDAC"); B(560, 40, "FWC → ECAM"); B(630, 160, "DMC (displays)"); B(360, 280, "CFDIU (maint.)", 120); B(630, 280, "EIU ← ECU", 110); B(250, 280, "ECB (APU)", 96);
    const links = [[[155, 60], [210, 150]], [[155, 160], [210, 160]], [[155, 260], [210, 170]], [[310, 160], [410, 160]], [[260, 142], [330, 58]], [[460, 142], [390, 58]], [[408, 40], [512, 40]], [[510, 160], [582, 160]], [[260, 178], [250, 262]], [[300, 178], [350, 262]], [[460, 178], [590, 262]]];
    const fl = links.map(([p, q]) => { a.line(...p, ...q, { color: C.soft, width: 2 }); return Parts.flowDots(a, [p, q], { n: 2, color: C.blue, r: 3, speed: 40 }); });
    a.loop((t) => fl.forEach((f) => f(t)));
  },
});

fig("piccolo", {
  title: "Wing anti-ice: the piccolo tube", w: 720, h: 260,
  caption: "Hot bleed air enters a perforated 'piccolo' duct running along the slat leading edge (telescopic ducts feed the slats from slat 3 outboard). Jets from the holes impinge on the inside of the skin, heating it so ice cannot form, and the air leaves through vents on the lower surface.",
  init(a) {
    a.path("M120,130 C120,60 220,40 420,52 L700,70 M120,130 C120,190 220,205 420,200 L700,190", { color: C.ink, width: 4 });
    a.path("M160,130 C165,90 230,78 330,82 L330,178 C230,182 165,170 160,130 z", { color: C.mid, width: 2, dash: "5 4" });
    a.circle(240, 130, 16, { fill: "#fdba74", color: C.red, width: 2 }); a.text(240, 168, "piccolo tube", { size: 12, weight: 700 });
    const jets = [-60, -35, -10, 15, 40, 160, 185, 210].map((d) => Parts.flowDots(a, [[240 + 16 * Math.cos(rad(d + 180)), 130 + 16 * Math.sin(rad(d + 180))], [240 + 70 * Math.cos(rad(d + 180)), 130 + 55 * Math.sin(rad(d + 180))]], { n: 2, color: C.red, r: 2.6, speed: 50 }));
    const outv = Parts.flowDots(a, [[300, 175], [330, 205], [380, 240]], { n: 3, color: C.orange, r: 2.6, speed: 40 });
    a.text(380, 250, "exhaust vents", { size: 11, anchor: "start" });
    const ice = [0, 1, 2, 3, 4, 5].map((k) => a.circle(110 + k * 3, 100 + k * 12, 5, { fill: C.sky, color: "none" }));
    a.text(560, 120, "slat (leading edge)", { size: 13 });
    a.loop((t) => { jets.forEach((j) => j(t)); outv(t); ice.forEach((c, k) => a.set(c, { opacity: Math.max(0, 1 - ((t * 0.3) % 1.5)) })); });
  },
});

fig("air_starter", {
  title: "Engine start with APU air", w: 720, h: 260,
  caption: "Engines stopped → no engine bleed. APU air flows 'backwards' along the crossbleed duct to the engine's START valve, spins the air turbine starter on the accessory gearbox, which turns N2 (the HP spool) and then N1. During the start sequence the BMC keeps that engine's PRV shut.",
  init(a) {
    Parts.box(a, 80, 130, 90, 40, "APU", { fill: "#e2e8f0" });
    const duct = Parts.flowDots(a, [[125, 130], [300, 130], [300, 190], [370, 190]], { color: C.orange, gap: 20, speed: 70 });
    a.path("M125,130 L300,130 L300,190 L370,190", { color: "#fdba74", width: 8 });
    const sv = valveSym(a, 300, 160, 11, false); sv(true, C.green); a.text(318, 160, "START valve", { size: 11, anchor: "start" });
    a.circle(410, 190, 40, { fill: "#f8fafc", color: C.ink }); a.text(410, 248, "air turbine starter", { size: 12 });
    const rot = a.g(); a.within(rot, () => { for (let k = 0; k < 10; k++) a.line(0, 0, 34 * Math.cos((k * TAU) / 10), 34 * Math.sin((k * TAU) / 10), { color: C.blue, width: 3 }); });
    a.rect(470, 170, 80, 40, { r: 6, fill: "#fde68a", color: C.amber }); a.text(510, 228, "gearbox", { size: 12 });
    a.path("M550,190 L600,190 L600,110 L640,110", { color: C.mid, width: 5 });
    a.rect(620, 50, 80, 120, { r: 8, fill: "#e2e8f0", color: C.mid }); a.text(660, 40, "engine HP spool (N2)", { size: 12 });
    const n2 = a.g(); a.within(n2, () => { for (let k = 0; k < 6; k++) a.line(0, -45, 0, 45, { color: C.orange, width: 3, transform: `rotate(${k * 30})` }); });
    const read = a.text(360, 40, "", { size: 14, weight: 700 });
    a.loop((t) => {
      duct(t);
      rot.setAttribute("transform", `translate(410,190) rotate(${(t * 400) % 360})`);
      n2.setAttribute("transform", `translate(660,110) rotate(${(t * 120) % 360}) scale(0.9)`);
      a.setText(read, "starter turns N2, then N1; fuel and ignition follow (FADEC)");
    });
  },
});

/* ------------------------------------------------------------------ VA-3 hydraulics */
fig("hyd_arch", {
  title: "A320 hydraulics: three independent systems at 3000 psi", w: 720, h: 440,
  caption: "GREEN (ENG 1 pump), BLUE (electric pump + RAT), YELLOW (ENG 2 pump + electric + hand pump). The PTU links Green and Yellow mechanically (no fluid crosses). Pick a failure and see what keeps each system pressurised.",
  init(a) {
    const cols = { G: [130, C.green, "GREEN"], B: [360, C.blue, "BLUE"], Y: [590, C.yellow, "YELLOW"] };
    const g = a.g();
    const scen = {
      normal: { G: ["EDP 1"], B: ["elec pump"], Y: ["EDP 2"], ptu: "available", rat: false, fv: true },
      "Green EDP failed": { G: ["PTU (from Yellow)"], B: ["elec pump"], Y: ["EDP 2"], ptu: "running → Green", rat: false, fv: true, low: { G: 2500 } },
      "ENG 1 FIRE pb": { G: ["PTU (from Yellow)"], B: ["elec pump"], Y: ["EDP 2"], ptu: "running → Green", rat: false, fv: false, low: { G: 2500 } },
      "electrical emergency": { G: ["EDP 1"], B: ["RAT"], Y: ["EDP 2"], ptu: "available", rat: true, fv: true },
      "Yellow EDP failed": { G: ["EDP 1"], B: ["elec pump"], Y: ["PTU (from Green)"], ptu: "running → Yellow", rat: false, fv: true, low: { Y: 2500 } },
    };
    const users = { G: "gear, NWS, normal brakes, REV 1,\nflaps/slats, THS, rudder, spoilers,\naileron, L elevator", B: "emergency gen (CSM/G), slats,\nrudder, spoilers, aileron,\nL+R elevator", Y: "REV 2, flaps, cargo doors, alt. brakes,\nTHS, rudder, spoilers, R elevator" };
    const draw = (sc) => {
      while (g.firstChild) g.removeChild(g.firstChild);
      a.within(g, () => {
        Object.entries(cols).forEach(([k, [x, c, n]]) => {
          const p = sc.low && sc.low[k] ? sc.low[k] : 3000;
          a.rect(x - 95, 20, 190, 360, { r: 10, fill: "#f8fafc", color: c, width: 2.5 });
          a.text(x, 42, n, { size: 15, weight: 800, color: c === C.yellow ? "#a16207" : c });
          a.rect(x - 30, 60, 60, 50, { r: 6, fill: c, color: "none", opacity: 0.3 }); a.text(x, 85, "reservoir", { size: 11 });
          a.text(x, 132, "pressurised by:", { size: 11, color: C.mid });
          sc[k].forEach((s, i) => a.text(x, 152 + i * 18, s, { size: 13, weight: 700 }));
          a.rect(x - 70, 190, 140, 16, { r: 4, fill: C.faint, color: "none" }); a.rect(x - 70, 190, (140 * p) / 3000, 16, { r: 4, fill: c, color: "none" }); a.text(x, 220, `${p} psi`, { size: 12, weight: 700 });
          users[k].split("\n").forEach((l, i) => a.text(x, 300 + i * 16, l, { size: 10.5, color: C.mid }));
          a.text(x, 280, "users", { size: 11, weight: 700 });
        });
        const run = sc.ptu.startsWith("running");
        a.rect(330, 392, 60, 26, { r: 6, fill: run ? "#fde68a" : "#f1f5f9", color: C.amber }); a.text(360, 405, "PTU", { size: 12, weight: 700 });
        a.path("M130,380 L130,405 L330,405", { color: C.amber, width: 3, dash: run ? "" : "5 4" }); a.path("M390,405 L590,405 L590,380", { color: C.amber, width: 3, dash: run ? "" : "5 4" });
        a.text(360, 432, `PTU ${sc.ptu} (mechanical link, no fluid exchange)`, { size: 11, color: "#a16207" });
        if (!sc.fv) { a.text(130, 250, "fire valve CLOSED", { size: 11, color: C.red, weight: 700 }); }
        if (sc.rat) { a.text(360, 250, "RAT deployed", { size: 12, color: C.red, weight: 700 }); }
      });
    };
    a.buttons(Object.keys(scen), (i, k) => draw(scen[k]));
  },
});

fig("piston_pump", {
  title: "Engine-driven pump: variable-displacement axial pistons", w: 720, h: 320,
  caption: "The cylinder barrel turns with the gearbox; each piston rides on an inclined swashplate, so it strokes once per revolution: in on the suction side (fluid from the 50 psi reservoir), out on the delivery side. The tilt sets the stroke and therefore the flow; a compensator adjusts it to hold 3000 psi. With the plate neutral (ENG PUMP OFF) the pump still turns but delivers nothing.",
  init(a) {
    const cy = 160, x0 = 260, L = 200;
    a.line(40, cy, 250, cy, { color: C.mid, width: 8 }); a.text(80, cy - 16, "drive shaft (gearbox)", { size: 11 });
    const plate = a.line(0, 0, 0, 0, { color: C.ink, width: 10 });
    a.rect(x0 + 20, cy - 90, L, 180, { r: 10, fill: "#e2e8f0", color: C.mid });
    a.text(x0 + 120, cy - 100, "rotating cylinder barrel", { size: 11 });
    const pis = Array.from({ length: 7 }, () => ({ rod: a.line(0, 0, 0, 0, { color: C.ink, width: 3 }), body: a.rect(0, 0, 60, 16, { r: 4, fill: C.steel, color: C.ink, width: 1.5 }), fl: a.rect(0, 0, 0, 16, { fill: C.green, color: "none", opacity: 0.5 }) }));
    a.rect(x0 + L + 20, cy - 90, 40, 80, { fill: "#bbf7d0", color: C.green }); a.text(x0 + L + 70, cy - 50, "delivery (3000 psi)", { size: 11, anchor: "start", color: C.green });
    a.rect(x0 + L + 20, cy + 10, 40, 80, { fill: "#dcfce7", color: C.green, opacity: 0.6 }); a.text(x0 + L + 70, cy + 50, "suction (50 psi)", { size: 11, anchor: "start", color: C.green });
    const out = a.note("");
    let tilt = 15;
    a.slider("swashplate tilt (°)", 0, 18, 0.5, 15, (v) => { tilt = v; out.textContent = v < 0.5 ? "neutral plate: no stroke, no flow (ENG PUMP OFF)" : `stroke ∝ tan(tilt): flow ${((Math.tan(rad(v)) / Math.tan(rad(18))) * 100).toFixed(0)} % of maximum`; });
    a.loop((t) => {
      const w = t * 3, R = 70, th = rad(tilt);
      a.set(plate, { x1: x0 - 10 * Math.sin(th) * 0 - Math.tan(th) * (R + 15), y1: cy - (R + 15), x2: x0 + Math.tan(th) * (R + 15), y2: cy + (R + 15) });
      pis.forEach((p, k) => {
        const ph = w + (k * TAU) / 7, y = cy - R * Math.cos(ph), z = Math.sin(ph);
        const xs = x0 + Math.tan(th) * (cy - y) * -1;
        const front = z > 0;
        a.set(p.rod, { x1: xs, y1: y, x2: xs + 40, y2: y, opacity: front ? 1 : 0.3 });
        a.set(p.body, { x: xs + 40, y: y - 8, opacity: front ? 1 : 0.3 });
        a.set(p.fl, { x: xs + 100, y: y - 8, width: Math.max(0, x0 + L + 20 - (xs + 100)), opacity: front ? 0.5 : 0.15 });
      });
    });
  },
});

fig("accumulator", {
  title: "Hydraulic accumulator: nitrogen spring", w: 720, h: 300,
  caption: "A piston separates a nitrogen pre-charge (Green: 1885 psi at 20 °C, 1 litre) from the fluid. Below 1885 psi the accumulator is empty; above it the gas is compressed (Boyle, isothermal: V = V₀·p₀/p) and stores fluid that it gives back when users suddenly demand flow, damping pressure drops.",
  init(a) {
    a.rect(260, 30, 200, 240, { r: 30, fill: "#f8fafc", color: C.ink, width: 3 });
    const gas = a.rect(264, 34, 192, 0, { fill: "#e0e7ff", color: "none" }), fl = a.rect(264, 0, 192, 0, { fill: "#bbf7d0", color: "none" });
    const pis = a.rect(264, 0, 192, 10, { fill: C.mid, color: "none" });
    a.text(250, 60, "N₂", { size: 14, anchor: "end", weight: 700, color: C.purple }); a.text(250, 250, "fluid", { size: 14, anchor: "end", weight: 700, color: C.green });
    a.line(360, 270, 360, 300, { color: C.green, width: 8 });
    const out = [0, 1, 2].map((i) => a.text(490, 100 + i * 28, "", { size: 14, anchor: "start", weight: i === 2 ? 700 : 400 }));
    a.slider("system pressure (psi)", 0, 3200, 10, 3000, (p) => {
      const Vg = p <= 1885 ? 1 : 1885 / p, Vf = 1 - Vg, H = 232;
      a.set(gas, { height: H * Vg }); a.set(pis, { y: 34 + H * Vg - 5 }); a.set(fl, { y: 34 + H * Vg + 5, height: Math.max(0, H * Vf - 5) });
      a.setText(out[0], `pre-charge 1885 psi, V₀ = 1 l`); a.setText(out[1], `gas volume ${Vg.toFixed(3)} l`); a.setText(out[2], `fluid stored ${Vf.toFixed(3)} l${p <= 1885 ? " (empty)" : ""}`);
    });
  },
});

fig("ptu", {
  title: "Power transfer unit (Green ↔ Yellow)", w: 720, h: 260,
  caption: "Two hydraulic units on one shaft: one works as a motor driven by the healthy system, the other as a pump for the weak one. It runs automatically (PTU pushbutton AUTO) when the pressure difference exceeds 500 psi, in either direction. POWER is transferred, never fluid. Inhibited during engine start and when the Yellow electric pump runs for the cargo doors.",
  init(a) {
    a.rect(60, 70, 160, 100, { r: 12, fill: "#dcfce7", color: C.green, width: 2.5 }); a.text(140, 60, "GREEN unit", { size: 13, weight: 700, color: C.green });
    a.rect(500, 70, 160, 100, { r: 12, fill: "#fef9c3", color: C.yellow, width: 2.5 }); a.text(580, 60, "YELLOW unit", { size: 13, weight: 700, color: "#a16207" });
    a.rect(220, 112, 280, 16, { fill: C.metal, color: "none" });
    const marks = [0, 1, 2, 3, 4].map(() => a.line(0, 112, 0, 128, { color: C.ink, width: 3 }));
    const roleG = a.text(140, 125, "", { size: 13, weight: 700 }), roleY = a.text(580, 125, "", { size: 13, weight: 700 });
    const arrow = a.line(0, 0, 0, 0, { color: C.red, width: 4, arrow: true });
    const out = a.text(360, 220, "", { size: 15, weight: 700 });
    const st = { dp: 0, inh: false };
    let spin = 0;
    const upd = () => {
      const run = Math.abs(st.dp) > 500 && !st.inh;
      spin = run ? Math.sign(st.dp) : 0;
      a.setText(roleG, run ? (st.dp > 0 ? "pump" : "motor") : "idle"); a.setText(roleY, run ? (st.dp > 0 ? "motor" : "pump") : "idle");
      a.set(arrow, run ? { x1: st.dp > 0 ? 470 : 250, x2: st.dp > 0 ? 250 : 470, y1: 90, y2: 90, opacity: 1 } : { opacity: 0 });
      a.setText(out, st.inh ? "inhibited (engine start / cargo doors / PTU OFF)" : run ? `running: power ${st.dp > 0 ? "Yellow → Green" : "Green → Yellow"}` : "|Δp| ≤ 500 psi: not running");
    };
    a.slider("Δp = p_Yellow − p_Green (psi)", -1500, 1500, 10, 800, (v) => { st.dp = v; upd(); });
    a.buttons(["PTU AUTO", "inhibited"], (i) => { st.inh = i === 1; upd(); });
    a.loop((t, dt) => marks.forEach((m, k) => { const x = 230 + ((((t * 120 * spin + k * 56) % 280) + 280) % 280); a.set(m, { x1: x, x2: x }); }));
  },
});

fig("rat", {
  title: "Ram air turbine (RAT)", w: 720, h: 280,
  caption: "On loss of electrical power (or with the guarded RAT MAN ON pushbutton) the RAT drops out of the lower left fuselage into the airstream. Its two-blade turbine drives the BLUE hydraulic pump, which also powers the emergency generator (CSM/G).",
  init(a) {
    a.path("M20,80 Q360,40 700,80 L700,120 L20,120 z", { fill: "#e2e8f0", color: C.mid }); a.text(360, 70, "fuselage (lower left)", { size: 12 });
    const strut = a.g();
    a.within(strut, () => { a.line(0, 0, 0, 120, { color: C.ink, width: 6 }); a.rect(-14, 110, 28, 26, { r: 6, fill: C.blue, color: C.ink }); });
    const blades = [0, 1].map(() => a.line(0, 0, 0, 0, { color: C.ink, width: 6 }));
    a.text(560, 200, "→ Blue pump → CSM/G", { size: 13, color: C.blue, weight: 700 });
    const air = Parts.flowDots(a, [[700, 240], [20, 240]], { color: C.sky, gap: 30, speed: 160 });
    a.loop((t) => {
      const u = clamp(((t % 8) - 0.5) / 2, 0, 1), ang = 90 - 90 * u;
      strut.setAttribute("transform", `translate(320,118) rotate(${ang})`);
      const tip = [320 - 120 * Math.sin(rad(ang)) * 0 + 120 * Math.sin(rad(-ang)) * -1 * 0, 0];
      const hx = 320 - 123 * Math.sin(rad(ang)), hy = 118 + 123 * Math.cos(rad(ang));
      blades.forEach((b, k) => { const ph = (u > 0.95 ? t * 14 : 0) + k * Math.PI; a.set(b, { x1: hx, y1: hy - 48 * Math.cos(ph), x2: hx, y2: hy + 48 * Math.cos(ph), opacity: u > 0.1 ? 1 : 0 }); });
      air(t);
    });
  },
});

fig("reservoir", {
  title: "Pressurised reservoir and its warnings (Green)", w: 720, h: 320,
  caption: "Air at 50 psi (normally HP compressor stage 8 of ENGINE 1, through a check valve; the pneumatic manifold as backup) keeps the pump inlets primed and prevents cavitation. Green: 18 l maximum, 14 l normal; LOW LEVEL at 3 l from the capacitive sensor (the fluid is the dielectric); LO AIR PRESS below 22 psi.",
  init(a) {
    a.rect(240, 30, 200, 250, { r: 16, fill: "#f8fafc", color: C.ink, width: 3 });
    const air = a.rect(244, 34, 192, 0, { fill: "#e0e7ff", color: "none" }), fl = a.rect(244, 0, 192, 0, { fill: "#bbf7d0", color: "none" });
    const lv = (l) => 276 - (l / 18) * 242;
    [[14, "normal 14 l"], [3, "LOW LEVEL 3 l"], [18, "max 18 l"]].forEach(([l, s]) => { a.line(232, lv(l), 448, lv(l), { color: l === 3 ? C.red : C.mid, width: 1.2, dash: "5 4" }); a.text(456, lv(l), s, { size: 11, anchor: "start", color: l === 3 ? C.red : C.mid }); });
    a.rect(300, 200, 10, 70, { fill: C.purple, color: "none", opacity: 0.6 }); a.rect(316, 200, 10, 70, { fill: C.purple, color: "none", opacity: 0.6 }); a.text(313, 190, "capacitive sensor", { size: 10, color: C.purple });
    a.path("M120,20 L340,20 L340,34", { color: C.blue, width: 4 }); a.text(110, 20, "air, stage 8 ENG 1", { size: 11, anchor: "end", color: C.blue });
    a.poly([[200, 13], [200, 27], [212, 20]], { fill: C.blue, color: "none" }); a.text(206, 38, "check valve", { size: 9, color: C.mid });
    a.line(340, 280, 340, 312, { color: C.green, width: 8 }); a.text(352, 304, "to the EDP inlet", { size: 11, anchor: "start" });
    const warn = [a.text(600, 120, "", { size: 15, weight: 700 }), a.text(600, 150, "", { size: 15, weight: 700 })];
    const st = { l: 14, p: 50 };
    const upd = () => {
      a.set(fl, { y: lv(st.l), height: 276 - lv(st.l) }); a.set(air, { height: lv(st.l) - 34, opacity: 0.4 + 0.6 * (st.p / 60) });
      a.setText(warn[0], st.l <= 3 ? "LOW LEVEL (amber)" : `${st.l.toFixed(1)} l: level normal`); a.set(warn[0], { fill: st.l <= 3 ? C.amber : C.green });
      a.setText(warn[1], st.p < 22 ? "LO AIR PRESS (amber)" : `${st.p} psi air`); a.set(warn[1], { fill: st.p < 22 ? C.amber : C.green });
    };
    a.slider("fluid quantity (l)", 0, 18, 0.1, 14, (v) => { st.l = v; upd(); }, (v) => v.toFixed(1));
    a.slider("air pressure (psi)", 0, 60, 1, 50, (v) => { st.p = v; upd(); });
  },
});

fig("ecam_hyd", {
  title: "ECAM HYD page (simplified)", w: 720, h: 340,
  caption: "System label and pressure green when normal, amber when low. Pump symbols in line and green = delivering; amber LO below 1740 psi. Fire valve in line = open, across amber = closed. PTU white = available, green = supplying. Reservoir arrow at the box = normal level.",
  init(a) {
    a.rect(0, 0, 720, 340, { r: 10, fill: ECAM.bg, color: "none" });
    a.text(360, 22, "HYD", { size: 16, color: ECAM.white, weight: 700 });
    const g = a.g();
    const cases = {
      "normal flight": { G: [3000, "ok"], B: [3000, "ok"], Y: [3000, "ok"], ptu: "avail", fv: true, lowres: false },
      "Green EDP failed, PTU AUTO": { G: [2500, "LO"], B: [3000, "ok"], Y: [3000, "ok"], ptu: "toG", fv: true, lowres: false },
      "ENG 1 FIRE pb": { G: [2500, "LO"], B: [3000, "ok"], Y: [3000, "ok"], ptu: "toG", fv: false, lowres: false },
      "Green reservoir low": { G: [3000, "ok"], B: [3000, "ok"], Y: [3000, "ok"], ptu: "avail", fv: true, lowres: true },
    };
    const draw = (c) => {
      while (g.firstChild) g.removeChild(g.firstChild);
      a.within(g, () => {
        const G = ECAM.green, A = ECAM.amber, W = ECAM.white;
        [["G", 140, "GREEN"], ["B", 360, "BLUE"], ["Y", 580, "YELLOW"]].forEach(([k, x, n]) => {
          const [p, pump] = c[k], low = p < 2900 && k !== "G" ? true : false;
          a.text(x, 56, n, { size: 15, color: p >= 1450 ? G : A, weight: 700 }); a.text(x, 78, p, { size: 15, color: p >= 1450 ? G : A, weight: 700 });
          a.line(x, 88, x, 300, { color: pump === "LO" ? A : G, width: 2 });
          const pumpCol = pump === "LO" ? A : G;
          a.rect(x - 16, 180, 32, 32, { color: pumpCol, width: 2 });
          if (pump === "LO") a.text(x, 196, "LO", { size: 12, color: A, weight: 700 }); else a.line(x, 182, x, 210, { color: G, width: 2 });
          a.text(x, 228, k === "B" ? "ELEC" : k === "G" ? "1" : "2", { size: 11, color: W });
          if (k !== "B") { const open = k === "Y" || c.fv; a.circle(x, 250, 10, { color: open ? G : A, width: 2 }); if (open) a.line(x, 240, x, 260, { color: G, width: 2 }); else a.line(x - 10, 250, x + 10, 250, { color: A, width: 2 }); }
          a.rect(x - 20, 290, 40, 34, { color: W, width: 1.5 }); const lowr = k === "G" && c.lowres; a.line(x + 20, lowr ? 318 : 296, x + 30, lowr ? 318 : 296, { color: lowr ? A : G, width: 3 });
        });
        const col = c.ptu === "avail" ? W : G;
        a.text(360, 130, "PTU", { size: 13, color: W }); a.line(150, 140, 570, 140, { color: col, width: 2, dash: c.ptu === "avail" ? "4 4" : "" });
        if (c.ptu === "toG") a.poly([[200, 134], [200, 146], [186, 140]], { fill: G, color: "none" });
        a.text(470, 166, "RAT", { size: 12, color: W });
      });
    };
    a.buttons(Object.keys(cases), (i, k) => draw(cases[k]));
  },
});

fig("relief_valve", {
  title: "Relief valve: opens at 3500 psi, recloses at 3200 psi", w: 720, h: 260,
  caption: "A spring holds a poppet on its seat. If the system pressure reaches 3500 psi it lifts and returns fluid to the reservoir; it only reseats once the pressure has dropped to 3200 psi (hysteresis). Drag the pressure up past 3500 and back down.",
  init(a) {
    a.rect(60, 110, 300, 40, { fill: "#dcfce7", color: C.green }); a.text(70, 100, "HP manifold", { size: 12, anchor: "start" });
    a.rect(360, 60, 120, 140, { r: 8, fill: "#f8fafc", color: C.ink });
    const pop = a.poly([[0, 0], [20, -16], [20, 16]], { fill: C.metal, color: C.ink }); const spr = a.path("", { color: C.ink, width: 2 });
    a.path("M480,130 L600,130 L600,220", { color: C.green, width: 10, opacity: 0.5 }); a.text(610, 220, "to return / reservoir", { size: 12, anchor: "start" });
    const ret = Parts.flowDots(a, [[380, 130], [600, 130], [600, 220]], { color: C.green, gap: 18, speed: 60 });
    const out = a.text(200, 220, "", { size: 15, weight: 700 });
    let open = false, p = 3000;
    a.slider("system pressure (psi)", 2800, 3700, 10, 3000, (v) => {
      const rising = v > p; p = v;
      if (!open && p >= 3500) open = true; else if (open && p <= 3200) open = false;
      const x = open ? 400 : 375;
      pop.setAttribute("transform", `translate(${x},130)`);
      let d = `M${x + 20},130`; for (let k = 0; k < 8; k++) d += ` L${x + 20 + ((470 - x - 20) * (k + 0.5)) / 8},${k % 2 ? 145 : 115}`; d += " L470,130"; a.set(spr, { d });
      ret.show(open);
      a.setText(out, open ? `OPEN at ${p} psi (closes at 3200)` : `closed at ${p} psi (opens at 3500)`); a.set(out, { fill: open ? C.red : C.green });
    });
    a.loop((t) => open && ret(t));
  },
});

fig("priority_valve", {
  title: "Priority valve: flight controls first", w: 720, h: 260,
  caption: "When the Green pressure drops (pump failure, big demand, PTU not able to help) a spring-loaded spool in the priority valve progressively cuts the heavy, non-essential users (landing gear, doors, nose-wheel steering, slat/flap motors) so the primary flight controls keep what pressure is left.",
  init(a) {
    a.rect(140, 90, 360, 60, { r: 8, fill: "#f8fafc", color: C.ink });
    const spool = a.rect(0, 96, 120, 48, { r: 6, fill: C.steel, color: C.ink }); const spr = a.path("", { color: C.ink, width: 2 });
    a.path("M40,120 L140,120", { color: C.green, width: 10 }); a.text(40, 108, "Green supply", { size: 12, anchor: "start" });
    a.path("M320,150 L320,230", { color: C.green, width: 10 }); a.text(330, 236, "heavy users: gear, doors, NWS, slat/flap motors", { size: 12, anchor: "start" });
    a.path("M90,120 L90,40 L620,40", { color: C.green, width: 8 }); a.text(620, 30, "primary flight controls (always)", { size: 12, anchor: "end", weight: 700 });
    const heavy = Parts.flowDots(a, [[320, 150], [320, 230]], { color: C.green, gap: 18, speed: 50 });
    const pfc = Parts.flowDots(a, [[90, 120], [90, 40], [620, 40]], { color: C.green, gap: 22, speed: 60 });
    const out = a.text(600, 130, "", { size: 15, weight: 700 });
    let open = 1;
    a.slider("Green pressure (fraction of 3000 psi)", 0.2, 1, 0.01, 1, (v) => {
      open = clamp((v - 0.45) / 0.25, 0, 1);
      const x = 200 + open * 120 - 60; a.set(spool, { x });
      let d = `M${x + 120},120`; for (let k = 0; k < 8; k++) d += ` L${x + 120 + ((500 - x - 120) * (k + 0.5)) / 8},${k % 2 ? 136 : 104}`; d += " L500,120"; a.set(spr, { d });
      heavy.show(open > 0.05);
      a.setText(out, open > 0.95 ? "all users fed" : open > 0.05 ? "heavy users throttled" : "heavy users CUT"); a.set(out, { fill: open > 0.95 ? C.green : open > 0.05 ? C.amber : C.red });
    }, (v) => (v * 3000).toFixed(0) + " psi");
    a.loop((t) => { pfc(t); if (open > 0.05) heavy(t, 20 + 40 * open); });
  },
});

fig("leak_meas", {
  title: "Green leak-measurement valve: who is behind it", w: 720, h: 300,
  caption: "The leak-measurement valve is normally OPEN and feeds the Green primary flight-control users in three groups. For the internal-leak test (ground power + flowmeter) it is closed, and the sections are checked one by one: return flow with the users in neutral is pure internal leakage.",
  init(a) {
    a.path("M40,150 L250,150", { color: C.green, width: 10 }); a.text(40, 136, "Green HP manifold", { size: 12, anchor: "start" });
    const v = valveSym(a, 280, 150, 16, true);
    a.text(280, 120, "leak-measurement valve", { size: 12, weight: 700 });
    const groups = [["TAIL", "THS motor · rudder · yaw damper", 60], ["LH WING", "aileron servo · spoilers 1 and 5", 150], ["RH WING", "aileron servo · spoilers 1 and 5", 240]];
    const fl = groups.map(([n, u, y]) => { a.path(`M296,150 L360,150 L360,${y} L460,${y}`, { color: C.green, width: 6 }); Parts.box(a, 560, y, 200, 44, `${n}\n${u}`, { size: 11, fill: "#f0fdf4", color: C.green }); return Parts.flowDots(a, [[296, 150], [360, 150], [360, y], [460, y]], { color: C.green, gap: 20, speed: 50 }); });
    const out = a.note("");
    let open = true;
    a.buttons(["normal: OPEN", "leak test: CLOSED"], (i) => { open = i === 0; v(open, open ? C.green : C.red); fl.forEach((f) => f.show(open)); out.textContent = open ? "flight controls fed permanently through the valve" : "section isolated: measure return flow per section (internal leakage)"; });
    a.loop((t) => open && fl.forEach((f) => f(t)));
  },
});

fig("filter_clog", {
  title: "HP filter with clogging indicator", w: 720, h: 240,
  caption: "As the element collects contamination the pressure drop across it grows; at 87 psi Δp the differential indicator pops out (HP filter; the return filter's indicator is set at 29 psi). The pop-out button tells maintenance to change the element.",
  init(a) {
    a.path("M40,120 L260,120 M460,120 L680,120", { color: C.green, width: 10 });
    a.rect(260, 60, 200, 120, { r: 12, fill: "#f8fafc", color: C.ink });
    const el = a.rect(320, 70, 80, 100, { fill: "#fef9c3", color: C.brown });
    const dirt = Array.from({ length: 40 }, (_, i) => a.circle(322 + ((i * 17) % 76), 72 + ((i * 29) % 96), 2.5, { fill: C.brown, color: "none", opacity: 0 }));
    const btn = a.rect(340, 40, 40, 20, { r: 4, fill: C.red, color: "none" }); a.text(400, 30, "Δp indicator", { size: 11, anchor: "start" });
    const out = a.text(360, 215, "", { size: 15, weight: 700 });
    a.slider("contamination", 0, 1, 0.01, 0.3, (c) => {
      const dp = 10 + c * 100;
      dirt.forEach((d, i) => a.set(d, { opacity: i / 40 < c ? 0.8 : 0 }));
      const popped = dp >= 87;
      a.set(btn, { y: popped ? 18 : 48, height: popped ? 42 : 12 });
      a.setText(out, `Δp = ${dp.toFixed(0)} psi${popped ? " ≥ 87: indicator POPPED" : ""}`); a.set(out, { fill: popped ? C.red : C.green });
    }, (v) => (v * 100).toFixed(0) + " %");
  },
});

fig("pipe_id", {
  title: "Identifying hydraulic pipes", w: 720, h: 240,
  caption: "Hydraulic tape tells hydraulics from fuel or air (pneumatic ducts are much bigger); a band gives the system number (1 Green, 2 Blue, 3 Yellow); arrows show the flow direction, black dots mark a pressure line; return lines are usually larger. A part number lets you find the pipe in the manual.",
  init(a) {
    const pipe = (y, w, sys, press, lbl) => {
      a.rect(40, y - w / 2, 640, w, { r: w / 2, fill: "#d1d5db", color: C.mid });
      a.rect(240, y - w / 2 - 2, 120, w + 4, { fill: "#fde68a", color: "none" }); a.text(300, y, "HYDRAULIC", { size: 10, weight: 700 });
      a.rect(362, y - w / 2 - 2, 24, w + 4, { fill: sys === 1 ? C.green : sys === 2 ? C.blue : C.yellow, color: "none" }); a.text(374, y, sys, { size: 11, weight: 700, color: C.bg });
      for (let k = 0; k < 3; k++) a.poly([[420 + k * 30, y - 6], [420 + k * 30, y + 6], [434 + k * 30, y]], { fill: C.ink, color: "none" });
      if (press) for (let k = 0; k < 3; k++) a.circle(540 + k * 16, y, 4, { fill: C.ink, color: "none" });
      a.text(40, y - w / 2 - 12, lbl, { size: 12, anchor: "start", weight: 600 });
    };
    pipe(70, 18, 1, true, "Green pressure line (dots)"); pipe(160, 26, 3, false, "Yellow return line (larger, no dots)");
  },
});
