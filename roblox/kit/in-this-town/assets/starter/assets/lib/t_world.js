/* "In This Town" engine, world: the town (plaza, school wall, clock tower, bakery, water tower, houses, street), rooms and props.
   Layout (x east, z south, 1 unit ~ 30 cm): plaza centre (0,0); school north (big blank wall at z -26); town hall + clock tower east;
   bakery west; main street south (x 0); our house at (-19, 52); water tower at (52, -64).
   Rooms sit far from the town (kitchen x 1000, bedroom 1100, bakery 1200, shop 1300, jewel 1400, class 1500, living 1600, office 1700),
   furnished at boot. W.blockers lists boxes the camera may not stand inside (buildings, trees, furniture). */
(function () {
  const T = window.TOWN;
  const M = (c, o) => T.mat(c, o);
  const W = (T.WORLD = {});

  // ---------------------------------------------------------------- textures
  function noiseTex(base, spots, n, size = 512, rep = [1, 1], seed = 1) {
    const c = T.canvas(size, size), g = c.getContext("2d"), r = T.rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, size, size);
    for (let i = 0; i < n; i++) { g.fillStyle = spots[i % spots.length]; g.globalAlpha = 0.18 + r() * 0.25; g.beginPath(); g.ellipse(r() * size, r() * size, 6 + r() * 26, 4 + r() * 16, r() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    return T.tex(c, { repeat: rep });
  }
  function tilesTex(base, grout, tw, th, size = 512, rep = [1, 1], seed = 2, vary = 0.08) {
    const c = T.canvas(size, size), g = c.getContext("2d"), r = T.rng(seed);
    for (let y = 0; y < size; y += th) for (let x = 0; x < size; x += tw) {
      const off = (Math.floor(y / th) % 2) * tw / 2;
      const k = 1 + (r() - 0.5) * vary * 2;
      const col = new THREE.Color(base).multiplyScalar(k);
      g.fillStyle = "#" + col.getHexString(); g.fillRect(x + off - tw, y, tw, th); g.fillRect(x + off, y, tw, th);
    }
    g.strokeStyle = grout; g.lineWidth = 3;
    for (let y = 0; y <= size; y += th) { g.beginPath(); g.moveTo(0, y); g.lineTo(size, y); g.stroke(); }
    for (let y = 0; y < size; y += th) { const off = (Math.floor(y / th) % 2) * tw / 2; for (let x = off; x <= size + tw; x += tw) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + th); g.stroke(); } }
    return T.tex(c, { repeat: rep });
  }
  function planksTex(base, size = 512, rep = [1, 1]) {
    const c = T.canvas(size, size), g = c.getContext("2d"), r = T.rng(4);
    const pw = size / 6;
    for (let i = 0; i < 6; i++) { const col = new THREE.Color(base).multiplyScalar(0.9 + r() * 0.2); g.fillStyle = "#" + col.getHexString(); g.fillRect(i * pw, 0, pw, size); }
    g.strokeStyle = "rgba(60,30,10,0.35)"; g.lineWidth = 4;
    for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(i * pw, 0); g.lineTo(i * pw, size); g.stroke(); }
    for (let i = 0; i < 6; i++) { const y = r() * size; g.beginPath(); g.moveTo(i * pw, y); g.lineTo((i + 1) * pw, y); g.stroke(); }
    return T.tex(c, { repeat: rep });
  }
  function stripesTex(a, b, n = 8, vertical = true) {
    const c = T.canvas(256, 256), g = c.getContext("2d");
    for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; if (vertical) g.fillRect(i * 256 / n, 0, 256 / n + 1, 256); else g.fillRect(0, i * 256 / n, 256, 256 / n + 1); }
    return T.tex(c);
  }
  T.texLib = { noiseTex, tilesTex, planksTex, stripesTex };

  // emissive window / lamp materials that follow the sky
  const winMat = (W.winMat = new THREE.MeshStandardMaterial({ color: "#9fd3ff", roughness: 0.15, metalness: 0.1, emissive: new THREE.Color("#ffc96b"), emissiveIntensity: 0 }));
  const lampMat = (W.lampMat = new THREE.MeshStandardMaterial({ color: "#fff6d8", roughness: 0.4, emissive: new THREE.Color("#ffd27a"), emissiveIntensity: 0 }));
  const roomWin = (W.roomWinMat = new THREE.MeshStandardMaterial({ color: "#bfe6ff", roughness: 0.2, emissive: new THREE.Color("#cfeaff"), emissiveIntensity: 0.8 }));
  T.onSky((s) => { const n = s.win > 0.5; roomWin.color.set(n ? "#1b2550" : "#bfe6ff"); roomWin.emissive.set(n ? "#2a3d7a" : "#d6eeff"); roomWin.emissiveIntensity = n ? 0.55 : 0.85; });
  T.onSky((s) => { winMat.emissiveIntensity = s.win * 1.6; winMat.color.set(s.win > 0.5 ? "#3a3a52" : "#9fd3ff"); lampMat.emissiveIntensity = 0.15 + s.lamps * 3.2; });

  // ---------------------------------------------------------------- building helpers
  const box = (parent, w, h, d, mat, x, y, z, r = 0.12) => { const m = T.mesh(r > 0 ? T.rbox(w, h, d, r, 2) : T.box(w, h, d), mat, x, y, z); parent.add(m); return m; };
  function windowAt(parent, x, y, z, w, h, face = "z", frame = "#ffffff", glass = winMat) {
    const g = T.group(parent, x, y, z);
    if (face === "x") g.rotation.y = Math.PI / 2; else if (face === "-x") g.rotation.y = -Math.PI / 2; else if (face === "-z") g.rotation.y = Math.PI;
    box(g, w + 0.4, h + 0.4, 0.25, M(frame), 0, 0, 0.05, 0.06);
    const gl = T.mesh(T.box(w, h, 0.1), glass, 0, 0, 0.2, { cast: false }); g.add(gl);
    box(g, 0.18, h, 0.12, M(frame), 0, 0, 0.27, 0); box(g, w, 0.18, 0.12, M(frame), 0, 0, 0.27, 0);
    box(g, w + 0.8, 0.24, 0.5, M(frame), 0, -h / 2 - 0.22, 0.2, 0.05);
    return g;
  }
  function doorAt(parent, x, y, z, w, h, color, face = "z") {
    const g = T.group(parent, x, y, z);
    if (face === "x") g.rotation.y = Math.PI / 2; else if (face === "-x") g.rotation.y = -Math.PI / 2; else if (face === "-z") g.rotation.y = Math.PI;
    box(g, w + 0.5, h + 0.3, 0.25, M("#ffffff"), 0, h / 2, 0.05, 0.06);
    box(g, w, h, 0.2, M(color, { r: 0.5 }), 0, h / 2, 0.15, 0.06);
    const k = T.mesh(T.sph(0.16, 10, 8), M("#f2c230", { r: 0.3, m: 0.7 }), w * 0.32, h * 0.48, 0.32); g.add(k);
    return g;
  }
  function roofPyramid(parent, w, d, h, color, x, y, z) {
    const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI / 4);
    const m = T.mesh(g, M(color, { r: 0.7, flat: true }), x, y + h / 2, z); m.scale.set(w * 1.02, h, d * 1.02); parent.add(m); return m;
  }
  function roofGable(parent, w, d, h, color, x, y, z, along = "x") {
    const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.6, 0); sh.lineTo(0, h); sh.lineTo(d / 2 + 0.6, 0); sh.lineTo(-d / 2 - 0.6, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: w + 1.0, bevelEnabled: false }); g.translate(0, 0, -(w + 1.0) / 2);
    const m = T.mesh(g, M(color, { r: 0.65, flat: true }), x, y, z); if (along === "x") m.rotation.y = Math.PI / 2; parent.add(m); return m;
  }
  W.house = (parent, x, z, o = {}) => {
    const g = T.group(parent, x, 0, z); g.rotation.y = o.ry || 0;
    const w = o.w || 12, d = o.d || 11, h = o.h || 8;
    box(g, w, h, d, M(o.wall || "#f4a6a0", { r: 0.85 }), 0, h / 2, 0, 0.2);
    box(g, w + 0.3, 0.8, d + 0.3, M(o.base || "#8c8c94"), 0, 0.4, 0, 0.1);
    if (o.gable) roofGable(g, w, d, 4.4, o.roof || "#6b3fa0", 0, h, 0); else roofPyramid(g, w + 1.4, d + 1.4, 4.6, o.roof || "#6b3fa0", 0, h, 0);
    doorAt(g, o.doorX ?? 0, 0.8, d / 2, 2.2, 3.6, o.door || "#c0392b");
    windowAt(g, -w * 0.3, h * 0.62, d / 2 + 0.02, 2.2, 2.2); windowAt(g, w * 0.3, h * 0.62, d / 2 + 0.02, 2.2, 2.2);
    if (o.chimney) box(g, 1.4, 4, 1.4, M("#a0522d"), w * 0.28, h + 3, -d * 0.2, 0.1);
    box(g, 4.2, 0.3, 2.6, M("#b9b2a6"), o.doorX ?? 0, 0.95, d / 2 + 1.4, 0.06);
    return g;
  };
  W.tree = (parent, x, z, s = 1, seed = 1) => {
    const g = T.group(parent, x, 0, z); g.scale.setScalar(s); const r = T.rng(seed);
    box(g, 0.9, 4.2, 0.9, M("#7a5230", { r: 0.9 }), 0, 2.1, 0, 0.12);
    const greens = ["#3f9e3a", "#4cb048", "#358f33"];
    box(g, 5.0, 3.0, 5.0, M(greens[seed % 3], { r: 0.85 }), 0, 5.2, 0, 0.7);
    box(g, 3.8, 2.4, 3.8, M(greens[(seed + 1) % 3], { r: 0.85 }), (r() - 0.5) * 0.6, 7.2, (r() - 0.5) * 0.6, 0.6);
    box(g, 2.2, 1.6, 2.2, M(greens[(seed + 2) % 3], { r: 0.85 }), 0, 8.7, 0, 0.45);
    g.rotation.y = r() * 3;
    return g;
  };
  W.lamp = (parent, x, z) => {
    const g = T.group(parent, x, 0, z);
    box(g, 0.32, 7.4, 0.32, M("#2c2f38", { r: 0.5, m: 0.3 }), 0, 3.7, 0, 0.08);
    box(g, 1.0, 0.25, 1.0, M("#2c2f38", { r: 0.5, m: 0.3 }), 0, 7.45, 0, 0.06);
    const bulb = T.mesh(T.rbox(0.8, 1.0, 0.8, 0.2), lampMat, 0, 6.85, 0, { cast: false }); g.add(bulb);
    box(g, 1.1, 0.2, 1.1, M("#2c2f38", { r: 0.5, m: 0.3 }), 0, 6.3, 0, 0.06);
    return g;
  };
  W.bench = (parent, x, z, ry = 0) => {
    const g = T.group(parent, x, 0, z); g.rotation.y = ry;
    box(g, 4, 0.3, 1.2, M("#a0662f"), 0, 1.3, 0, 0.08); box(g, 4, 1.1, 0.25, M("#a0662f"), 0, 2.1, -0.55, 0.08);
    for (const sx of [-1.6, 1.6]) box(g, 0.25, 1.3, 1.1, M("#2c2f38"), sx, 0.65, 0, 0.05);
    return g;
  };
  W.fence = (parent, x0, z0, x1, z1) => {
    const g = T.group(parent), n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.1));
    for (let i = 0; i <= n; i++) { const k = i / n; box(g, 0.3, 1.6, 0.18, M("#ffffff", { r: 0.8 }), x0 + (x1 - x0) * k, 0.8, z0 + (z1 - z0) * k, 0.05); }
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
    for (const y of [0.6, 1.25]) { const m = box(g, len, 0.16, 0.12, M("#ffffff", { r: 0.8 }), (x0 + x1) / 2, y, (z0 + z1) / 2, 0.03); m.rotation.y = -ang; }
    return g;
  };

  // ---------------------------------------------------------------- the town
  T.onBoot(() => {
    const town = (W.town = T.group(T.scene));
    T.reg(town);
    const grass = M("#6cc24a", { r: 0.95, map: noiseTex("#6cc24a", ["#5aae3c", "#7fd25a", "#62b844"], 600, 512, [60, 60], 3) });
    const ground = T.mesh(T.plane(1400, 1400), grass, 0, 0, 0, { cast: false }); ground.rotation.x = -Math.PI / 2; town.add(ground);
    const flat = (w, d, mat, x, z, y = 0.02) => { const m = T.mesh(T.plane(w, d), mat, x, y, z, { cast: false }); m.rotation.x = -Math.PI / 2; town.add(m); return m; };
    // plaza + roads + sidewalks
    flat(58, 46, M("#e7d3ad", { r: 0.9, map: tilesTex("#e7d3ad", "#c4ab80", 64, 64, 512, [7, 5.6], 2, 0.05) }), 0, 0, 0.03);
    const road = M("#4f535c", { r: 0.92, map: noiseTex("#4f535c", ["#454951", "#5a5e67"], 300, 256, [1, 20], 6) });
    flat(12, 260, road, 0, 150, 0.025);                 // main street south
    flat(160, 12, road, 0, 29, 0.026);                  // road along the plaza's south edge
    flat(12, 120, road, 64, -10, 0.025);                // road east of the town hall
    const side = M("#cfcac0", { r: 0.9, map: tilesTex("#cfcac0", "#aaa49a", 128, 128, 256, [1, 30], 4, 0.03) });
    flat(3, 230, side, -7.5, 150, 0.04); flat(3, 230, side, 7.5, 150, 0.04);
    // lane markings
    for (let z = 40; z < 280; z += 9) flat(0.4, 4, M("#f2e6b8", { r: 0.8 }), 0, z, 0.05);
    // ---- the school (north): the biggest wall in town faces the plaza
    const sch = (W.school = T.group(town, 0, 0, -36));
    const cream = M("#f1e2c6", { r: 0.9, map: noiseTex("#f1e2c6", ["#e6d4b2", "#f7ead2"], 400, 512, [2, 1], 8) });
    box(sch, 58, 20, 20, cream, 0, 10, 0, 0.25);
    box(sch, 58.6, 1.6, 20.6, M("#b5523b", { r: 0.8 }), 0, 0.8, 0, 0.1);
    box(sch, 59, 1.2, 21, M("#7a5a8a", { r: 0.7 }), 0, 20.4, 0, 0.1);
    for (const x of [-28.6, 28.6]) box(sch, 1.4, 20, 1.4, M("#e3cfa9"), x, 10, 10.1, 0.1);
    // entrance block on the right end
    const ent = T.group(sch, 23.5, 0, 10);
    box(ent, 9, 11, 3, M("#e3cfa9", { r: 0.85 }), 0, 5.5, 0.6, 0.15);
    doorAt(ent, -1.5, 0.3, 2.15, 2.6, 4.6, "#2e6fd6"); doorAt(ent, 1.5, 0.3, 2.15, 2.6, 4.6, "#2e6fd6");
    windowAt(ent, 0, 8.4, 2.12, 5.5, 2.2);
    // upper windows over the blank wall
    for (let i = 0; i < 7; i++) windowAt(sch, -24 + i * 6.6, 17.2, 10.05, 3.2, 2.0);
    const sign = T.sign(["SCHOOL"], 16, 3.2, { bg: "#c8323a", fg: "#ffffff", radius: 40, border: "#ffffff", borderW: 14, cw: 1024, ch: 205 });
    sign.position.set(-3, 23.6, 10.2); sch.add(sign);
    box(sch, 16.8, 3.9, 0.5, M("#8a2a2f"), -3, 23.6, 9.85, 0.1);
    for (const sx of [-9, 3]) box(sch, 0.4, 3, 0.4, M("#555"), sx, 21.4, 9.9, 0.05);
    // the wall drawing sits here (built by t_doodle): centre x -4, y 8.6, z -25.85 (world), 34 x 14.5
    W.WALL = { x: -4, y: 8.6, z: -25.86, w: 34, h: 14.5 };
    // ---- town hall + clock tower (east, facing the plaza / west)
    const th = (W.hall = T.group(town, 40, 0, -2));
    box(th, 20, 14, 28, M("#f4f1ea", { r: 0.85 }), 0, 7, 0, 0.2);
    box(th, 20.6, 1.2, 28.6, M("#9a8f86"), 0, 0.6, 0, 0.1);
    for (let i = -2; i <= 2; i++) box(th, 1.4, 12, 1.4, M("#ffffff", { r: 0.7 }), -10.5, 6.4, i * 4.6, 0.3);
    roofGable(th, 20, 28, 4, "#3d5a80", 0, 14, 0, "z");
    doorAt(th, -10.05, 0.2, 0, 3.4, 5.4, "#6b3a1f", "-x");
    for (const z of [-9, 9]) windowAt(th, -10.05, 8.8, z, 3, 3.6, "-x");
    const thSign = T.sign(["TOWN HALL"], 12, 1.8, { bg: "#23395b", fg: "#ffffff", radius: 30, cw: 1024, ch: 154 }); thSign.position.set(-10.35, 12.4, 0); thSign.rotation.y = -Math.PI / 2; th.add(thSign);
    const tw = T.group(th, 0, 0, 0);
    box(tw, 8, 26, 8, M("#ece6da", { r: 0.85 }), 0, 24, 0, 0.15);
    box(tw, 9, 1, 9, M("#9a8f86"), 0, 36.6, 0, 0.1);
    roofPyramid(tw, 9.5, 9.5, 7, "#3d5a80", 0, 37, 0);
    // clocks on the west and south faces
    W.clocks = [];
    const clockFace = (() => { const c = T.canvas(512, 512), g = c.getContext("2d"); g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill(); g.lineWidth = 22; g.strokeStyle = "#1e2433"; g.stroke(); g.fillStyle = "#1e2433"; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.save(); g.translate(256 + Math.sin(a) * 200, 256 - Math.cos(a) * 200); g.rotate(a); g.fillRect(-8, -26, 16, i % 3 ? 34 : 52); g.restore(); } g.beginPath(); g.arc(256, 256, 16, 0, 7); g.fill(); return T.tex(c); })();
    for (const [rx, ry, px, pz] of [[0, -Math.PI / 2, -4.06, 0], [0, 0, 0, 4.06]]) {
      const cg = T.group(tw, px, 30, pz); cg.rotation.y = ry;
      box(cg, 7.2, 7.2, 0.3, M("#c9a227", { r: 0.35, m: 0.6 }), 0, 0, -0.05, 0.4);
      const f = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshStandardMaterial({ map: clockFace, roughness: 0.5, emissive: new THREE.Color("#fff4d6"), emissiveMap: clockFace, emissiveIntensity: 0 }));
      f.position.z = 0.14; cg.add(f); W.clockFaceMat = f.material;
      const hr = T.group(cg, 0, 0, 0.24), mn = T.group(cg, 0, 0, 0.3);
      hr.add(T.mesh(T.box(0.34, 1.9, 0.08), M("#1e2433"), 0, 0.8, 0)); mn.add(T.mesh(T.box(0.22, 2.75, 0.08), M("#1e2433"), 0, 1.2, 0));
      W.clocks.push({ hr, mn });
    }
    T.onSky((s) => { if (W.clockFaceMat) W.clockFaceMat.emissiveIntensity = s.lamps * 0.9; });
    // ---- bakery (west, facing the plaza / east)
    const bk = (W.bakery = T.group(town, -40, 0, -4));
    box(bk, 18, 11, 16, M("#ffd7a8", { r: 0.85 }), 0, 5.5, 0, 0.2);
    roofGable(bk, 18, 16, 4.5, "#b8452e", 0, 11, 0, "z");
    const aw = T.mesh(T.box(16.5, 0.25, 3.4), new THREE.MeshStandardMaterial({ map: stripesTex("#e63946", "#ffffff", 12), roughness: 0.8 }), 9.9, 6.9, 0); aw.rotation.z = -0.32; aw.rotation.y = Math.PI / 2; bk.add(aw);
    doorAt(bk, 9.05, 0.2, -4.5, 2.6, 4.4, "#8a4b2a", "x");
    windowAt(bk, 9.05, 3.4, 2.5, 6, 3.6, "x");
    const bs = T.sign(["BAKERY"], 11, 2.2, { bg: "#ffffff", fg: "#b8452e", radius: 36, border: "#b8452e", borderW: 14, cw: 1024, ch: 205 }); bs.position.set(9.35, 9.1, 0); bs.rotation.y = Math.PI / 2; bk.add(bs);
    // ---- water tower (far north-east): clean or burned
    const wt = (W.water = T.group(town, 52, 0, -64));
    const leg = M("#7a6a5a", { r: 0.7 });
    for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { const l = box(wt, 0.9, 20, 0.9, leg, x * 0.9, 10, z * 0.9, 0.1); l.rotation.set(z * 0.012, 0, -x * 0.012); }
    for (const y of [6, 13]) { box(wt, 8, 0.4, 0.4, leg, 0, y, 3.6, 0.05); box(wt, 8, 0.4, 0.4, leg, 0, y, -3.6, 0.05); box(wt, 0.4, 0.4, 8, leg, 3.6, y, 0, 0.05); box(wt, 0.4, 0.4, 8, leg, -3.6, y, 0, 0.05); }
    const tankClean = M("#8fc9e8", { r: 0.55, m: 0.2 }), roofClean = M("#5a7f99", { r: 0.6 });
    const burnC = T.canvas(512, 256), bg2 = burnC.getContext("2d"), br = T.rng(41);
    bg2.fillStyle = "#1b1a1d"; bg2.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 140; i++) { bg2.fillStyle = ["#2b2626", "#3a302a", "#111012", "#4a3a2c"][i % 4]; bg2.globalAlpha = 0.5; bg2.beginPath(); bg2.ellipse(br() * 512, br() * 256, 8 + br() * 40, 20 + br() * 60, 0, 0, 7); bg2.fill(); }
    bg2.globalAlpha = 0.35; bg2.fillStyle = "#6a4a30"; for (let i = 0; i < 20; i++) bg2.fillRect(br() * 512, br() * 100, 4 + br() * 6, 80 + br() * 120);
    const burnTex = T.tex(burnC);
    W.tankMat = { clean: tankClean, burned: new THREE.MeshStandardMaterial({ color: "#ffffff", map: burnTex, roughness: 0.95 }) };
    W.tank = T.mesh(T.cyl(6.2, 6.2, 7.5, 32), tankClean, 0, 23.8, 0); wt.add(W.tank);
    W.tankRoof = T.mesh(new THREE.ConeGeometry(6.8, 3.2, 32), roofClean, 0, 29.2, 0); wt.add(W.tankRoof);
    W.tankRoofMat = { clean: roofClean, burned: M("#141315", { r: 0.95 }) };
    W.setTower = (burned) => { W.tank.material = burned ? W.tankMat.burned : W.tankMat.clean; W.tankRoof.material = burned ? W.tankRoofMat.burned : W.tankRoofMat.clean; };
    W.setTower(false);
    // ---- paper shop + jewellery shop on the street (west side, facing east)
    const shop = (x, z, wall, roof, label, signBg) => {
      const g = T.group(town, x, 0, z);
      box(g, 12, 9, 12, M(wall, { r: 0.85 }), 0, 4.5, 0, 0.2);
      roofGable(g, 12, 12, 3.6, roof, 0, 9, 0, "z");
      doorAt(g, 6.05, 0.2, -3, 2.4, 4.2, "#2c3e50", "x"); windowAt(g, 6.05, 3.2, 2.2, 4.4, 3.2, "x");
      const s = T.sign([label], 9, 1.8, { bg: signBg, fg: "#ffffff", radius: 30, cw: 1024, ch: 205 }); s.position.set(6.35, 7.6, 0); s.rotation.y = Math.PI / 2; g.add(s);
      return g;
    };
    W.paperShop = shop(-17, 32, "#bfe3f5", "#2f6fa0", "PAPER", "#2f6fa0");
    W.jewelShop = shop(17, 32, "#f5e6bf", "#a07a2f", "JEWELS", "#a07a2f"); W.jewelShop.rotation.y = Math.PI;
    // ---- houses down the main street
    const HC = [["#f4a6a0", "#6b3fa0", "#c0392b"], ["#a8d8ff", "#c0392b", "#2c3e50"], ["#fff1a8", "#2e7d32", "#8e44ad"], ["#c6f0c2", "#8e44ad", "#d35400"], ["#ffcfa8", "#34495e", "#16a085"], ["#e0c8ff", "#b03a2e", "#2471a3"]];
    W.houses = [];
    let hi = 0;
    for (const z of [52, 74, 96, 118]) for (const sx of [-1, 1]) {
      const c = HC[hi++ % HC.length];
      const isOurs = sx === -1 && z === 52;
      const h = W.house(town, sx * 19, z, { ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2, wall: isOurs ? "#9cc9ff" : c[0], roof: isOurs ? "#c0392b" : c[1], door: isOurs ? "#ffcc33" : c[2], chimney: (hi % 3) === 0, gable: hi % 2 === 0 });
      W.houses.push(h);
      if (isOurs) W.home = h;
      W.fence(town, sx * 11.5, z - 7, sx * 11.5, z - 2.2); W.fence(town, sx * 11.5, z + 2.2, sx * 11.5, z + 7);
    }
    // trees, lamps, benches
    const TR = [[-31, 25], [31, 25], [-31, -24], [26, -26], [-12, 40], [12, 64], [-12, 86], [12, 108], [-60, -30], [-62, 10], [70, 30], [-75, 40], [80, -40], [-30, -70], [10, -70], [-50, 60], [50, 80], [-36, 120], [36, 140]];
    TR.forEach(([x, z], i) => W.tree(town, x, z, 1 + (i % 3) * 0.15, i + 1));
    W.lamps = [];
    for (const [x, z] of [[-27, 20], [27, 20], [-27, -20], [27, -20], [-9, 40], [9, 60], [-9, 80], [9, 100], [-9, 120]]) W.lamps.push(W.lamp(town, x, z));
    W.bench(town, -18, 14, 0); W.bench(town, 18, 14, 0); W.bench(town, -22, -6, Math.PI / 2);
    // distant hills
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = 230 + (i % 3) * 30; const m = T.mesh(T.sph(1, 20, 10), M(["#5aa848", "#4f9a40", "#64b24f"][i % 3], { r: 1 }), Math.cos(a) * r, -6, Math.sin(a) * r, { cast: false }); m.scale.set(60 + (i % 4) * 14, 30 + (i % 5) * 7, 50); town.add(m); }
    T.shadowAll(town, true, true); ground.castShadow = false;
  });
  W.setClock = (h, m) => { for (const c of W.clocks || []) { c.hr.rotation.z = -((h % 12) + m / 60) * Math.PI / 6; c.mn.rotation.z = -m * Math.PI / 30; } };

  // ---------------------------------------------------------------- rooms (each far from the town, shown by the shots that use them)
  W.rooms = {};
  function room(name, at, o) {
    const g = T.group(T.scene, at, 0, 0); T.reg(g);
    const w = o.w || 24, d = o.d || 20, h = o.h || 14;
    const floor = T.mesh(T.plane(w, d + 30), new THREE.MeshStandardMaterial({ map: o.floorTex, color: o.floorTex ? "#ffffff" : o.floor || "#c89b6a", roughness: 0.8 }), 0, 0, 15, { cast: false }); floor.rotation.x = -Math.PI / 2; g.add(floor);
    if (o.floorTex) o.floorTex.repeat.set(o.floorTex.repeat.x, o.floorTex.repeat.y * (d + 30) / d);
    const wallM = new THREE.MeshStandardMaterial({ color: o.wall || "#f6e7c8", roughness: 0.9, map: o.wallTex || null });
    const back = T.mesh(T.box(w, h, 0.6), wallM, 0, h / 2, -d / 2, { cast: false }); g.add(back);
    const L = d + 24, zc = 12;
    if (o.left !== false) { const l = T.mesh(T.box(0.6, h, L), wallM, -w / 2, h / 2, zc, { cast: false }); g.add(l); }
    if (o.right !== false) { const r = T.mesh(T.box(0.6, h, L), wallM, w / 2, h / 2, zc, { cast: false }); g.add(r); box(g, 0.3, 0.6, L, M(o.trim || "#ffffff"), w / 2 - 0.4, 0.3, zc, 0.05); }
    box(g, w, 0.6, 0.3, M(o.trim || "#ffffff"), 0, 0.3, -d / 2 + 0.4, 0.05);
    if (o.left !== false) box(g, 0.3, 0.6, L, M(o.trim || "#ffffff"), -w / 2 + 0.4, 0.3, zc, 0.05);
    if (o.window) { const [wx, wy, ww, wh] = o.window; const wg = windowAt(g, wx, wy, -d / 2 + 0.3, ww, wh, "z", "#ffffff", W.roomWinMat); W.rooms[name + "Win"] = wg; }
    W.rooms[name] = g;
    g.userData.size = [w, d, h];
    g.userData.furniture = [];
    return g;
  }
  W.room = room;
  T.onBoot(() => {
    const lib = T.texLib;
    room("kitchen", 1000, { w: 26, d: 20, h: 14, wall: "#cfeee6", floorTex: lib.tilesTex("#f4f4f4", "#9fd3c7", 64, 64, 512, [4, 3], 3, 0), window: [6, 7.5, 6, 4] });
    room("theo", 1100, { w: 26, d: 22, h: 14, wall: "#fff0b8", floorTex: lib.planksTex("#c8935a", 512, [3, 3]), window: [-5, 7.6, 5, 4] });
    room("bakery", 1200, { w: 26, d: 20, h: 14, wall: "#ffe2c2", floorTex: lib.tilesTex("#d9b48a", "#a8835a", 64, 64, 512, [4, 3], 5, 0.06), trim: "#b8452e" });
    room("shop", 1300, { w: 24, d: 20, h: 14, wall: "#d6ecff", floorTex: lib.planksTex("#b07a4a", 512, [3, 3]) });
    room("jewel", 1400, { w: 24, d: 20, h: 14, wall: "#3a2a4a", floorTex: lib.tilesTex("#2a2030", "#4a3a5a", 128, 128, 512, [3, 3], 6, 0.05), trim: "#c9a227" });
    room("class", 1500, { w: 26, d: 20, h: 14, wall: "#e6f4d6", floorTex: lib.planksTex("#d0a070", 512, [3, 3]), window: [-7, 7.6, 5, 4] });
    room("living", 1600, { w: 26, d: 20, h: 14, wall: "#f3d9e6", floorTex: lib.planksTex("#b8875a", 512, [3, 3]), window: [7, 7.6, 6, 4] });
    room("office", 1700, { w: 26, d: 20, h: 14, wall: "#dfe7f2", floorTex: lib.tilesTex("#7a5a44", "#5e4434", 128, 128, 512, [3, 3], 7, 0.05), window: [-6, 7.8, 6, 4.4], trim: "#c9a227" });
    W.rooms.bedroom = W.rooms.theo;
  });

  // ---------------------------------------------------------------- props
  const P = (T.PROP = {});
  P.table = (parent, x, z, w = 8, d = 5, h = 3.2, color = "#b07a4a") => {
    const g = T.group(parent, x, 0, z);
    box(g, w, 0.4, d, M(color, { r: 0.7 }), 0, h, 0, 0.1);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) box(g, 0.4, h, 0.4, M(color, { r: 0.7 }), sx * (w / 2 - 0.5), h / 2, sz * (d / 2 - 0.5), 0.05);
    return g;
  };
  P.chair = (parent, x, z, ry = 0, color = "#d35400", s = 1) => {
    const g = T.group(parent, x, 0, z); g.rotation.y = ry; g.scale.setScalar(s);
    box(g, 2.2, 0.3, 2.2, M(color), 0, 2.0, 0, 0.08); box(g, 2.2, 2.4, 0.3, M(color), 0, 3.3, -0.95, 0.08);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) box(g, 0.25, 2.0, 0.25, M(color), sx * 0.9, 1.0, sz * 0.9, 0.04);
    return g;
  };
  P.bed = (parent, x, z, ry = 0, blanket = "#5b8def") => {
    const g = T.group(parent, x, 0, z); g.rotation.y = ry;
    box(g, 5.2, 1.2, 9, M("#9b6b43"), 0, 0.9, 0, 0.1); box(g, 5.2, 3.4, 0.5, M("#9b6b43"), 0, 1.7, -4.5, 0.1);
    box(g, 4.8, 0.9, 8.6, M("#ffffff", { r: 0.9 }), 0, 1.9, 0, 0.3);
    box(g, 3.6, 0.7, 1.6, M("#ffffff", { r: 0.95 }), 0, 2.6, -3.4, 0.3);
    const bl = box(g, 5.0, 0.5, 5.8, M(blanket, { r: 0.9 }), 0, 2.45, 1.4, 0.2); g.userData.blanket = bl;
    return g;
  };
  P.cake = (parent, x, y, z, s = 1) => {
    const g = T.group(parent, x, y, z); g.scale.setScalar(s);
    g.add(T.mesh(T.cyl(1.6, 1.6, 1.0, 32), M("#f7c6d9", { r: 0.6 }), 0, 0.5, 0));
    g.add(T.mesh(T.cyl(1.66, 1.66, 0.22, 32), M("#ffffff", { r: 0.5 }), 0, 1.02, 0));
    g.add(T.mesh(T.cyl(1.1, 1.1, 0.8, 32), M("#f7c6d9", { r: 0.6 }), 0, 1.5, 0));
    g.add(T.mesh(T.cyl(1.16, 1.16, 0.18, 32), M("#ffffff", { r: 0.5 }), 0, 1.92, 0));
    const r = T.rng(7);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(T.mesh(T.sph(0.13, 8, 6), M(["#e63946", "#3fa7ff", "#ffd23f", "#4cd17a"][i % 4]), Math.cos(a) * 1.45, 1.13, Math.sin(a) * 1.45)); }
    g.add(T.mesh(T.sph(0.3, 12, 10), M("#d61f3c", { r: 0.3 }), 0, 2.2, 0));
    g.add(T.mesh(T.cyl(0.07, 0.07, 0.6, 8), M("#ffffff"), 0.4, 2.3, 0.3));
    const flame = T.mesh(T.sph(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffcc44" }), 0.4, 2.7, 0.3, { cast: false }); flame.scale.y = 1.6; g.add(flame);
    T.shadowAll(g);
    return g;
  };
  P.bike = (parent, x, z, ry = 0, color = "#e63946") => {
    const g = T.group(parent, x, 0, z); g.rotation.y = ry;
    const tire = M("#1d1d22", { r: 0.8 }), frame = M(color, { r: 0.35, m: 0.3 }), chrome = M("#c9ced6", { r: 0.25, m: 0.8 });
    for (const sx of [-1.7, 1.7]) { const w = T.mesh(new THREE.TorusGeometry(1.15, 0.2, 10, 28), tire, sx, 1.35, 0); g.add(w); const hub = T.mesh(T.cyl(0.18, 0.18, 0.3, 10), chrome, sx, 1.35, 0); hub.rotation.x = Math.PI / 2; g.add(hub); for (let k = 0; k < 4; k++) { const sp = T.mesh(T.box(0.06, 2.2, 0.06), chrome, sx, 1.35, 0); sp.rotation.z = k * Math.PI / 4; g.add(sp); } }
    const bar = (x0, y0, x1, y1, m = frame, t = 0.18) => { const len = Math.hypot(x1 - x0, y1 - y0); const b = T.mesh(T.box(len, t, t), m, (x0 + x1) / 2, (y0 + y1) / 2, 0); b.rotation.z = Math.atan2(y1 - y0, x1 - x0); g.add(b); };
    bar(-1.7, 1.35, 0, 1.35); bar(0, 1.35, -0.4, 3.0); bar(-0.4, 3.0, 1.2, 3.0); bar(1.2, 3.0, 0, 1.35); bar(1.2, 3.0, 1.7, 1.35); bar(-1.7, 1.35, -0.4, 3.0);
    bar(1.2, 3.0, 1.45, 3.9, chrome, 0.14);
    const hb = T.mesh(T.box(0.14, 0.14, 1.8), chrome, 1.45, 3.9, 0); g.add(hb);
    const seat = T.mesh(T.rbox(1.0, 0.25, 0.6, 0.1), M("#2b2b30"), -0.45, 3.25, 0); g.add(seat);
    const bell = T.mesh(T.sph(0.16, 10, 8), M("#f2c230", { r: 0.3, m: 0.7 }), 1.45, 4.05, 0.55); g.add(bell);
    T.shadowAll(g);
    return g;
  };
  P.loaf = (parent, x, y, z, s = 1, ry = 0, kind = 0) => {
    const g = T.group(parent, x, y, z); g.scale.setScalar(s); g.rotation.y = ry;
    const crust = M(kind ? "#c47a32" : "#d8954a", { r: 0.75 });
    const b = T.mesh(T.sph(1, 20, 12), crust, 0, 0.45, 0); b.scale.set(1.5, 0.62, 0.8); g.add(b);
    for (let i = -1; i <= 1; i++) { const c = T.mesh(T.box(0.12, 0.08, 0.9), M("#f3d39a", { r: 0.8 }), i * 0.6, 1.05, 0); c.rotation.y = 0.5; g.add(c); }
    T.shadowAll(g); return g;
  };
  P.car = (parent, x, z, ry = 0, color = "#3fa7ff", s = 1) => {
    const g = T.group(parent, x, 0, z); g.rotation.y = ry; g.scale.setScalar(s);
    box(g, 7.6, 1.8, 3.6, M(color, { r: 0.3, m: 0.2 }), 0, 1.7, 0, 0.5);
    box(g, 4.2, 1.5, 3.2, M(color, { r: 0.3, m: 0.2 }), -0.4, 3.2, 0, 0.45);
    for (const sz of [-1, 1]) { box(g, 3.6, 1.05, 0.1, M("#bfe8ff", { r: 0.1, m: 0.2 }), -0.4, 3.25, sz * 1.62, 0.02); }
    box(g, 0.1, 1.0, 2.6, M("#bfe8ff", { r: 0.1 }), 1.75, 3.2, 0, 0.02);
    for (const [sx, sz] of [[2.3, 1.7], [-2.3, 1.7], [2.3, -1.7], [-2.3, -1.7]]) { const w = T.mesh(T.cyl(0.95, 0.95, 0.7, 20), M("#1d1d22", { r: 0.8 }), sx, 0.95, sz); w.rotation.x = Math.PI / 2; g.add(w); const h = T.mesh(T.cyl(0.45, 0.45, 0.72, 12), M("#d0d4da", { r: 0.3, m: 0.7 }), sx, 0.95, sz); h.rotation.x = Math.PI / 2; g.add(h); }
    for (const sz of [-1.2, 1.2]) box(g, 0.1, 0.5, 0.7, M("#fff6c8", { e: "#fff2b0", ei: 0.4 }), 3.82, 1.9, sz, 0.05);
    T.shadowAll(g); return g;
  };
  P.lockbox = (parent, x, z, s = 1) => {
    const g = T.group(parent, x, 0, z); g.scale.setScalar(s);
    const steel = M("#5b6b7d", { r: 0.35, m: 0.6 });
    box(g, 8, 5, 5, steel, 0, 2.5, 0, 0.3);
    const lid = T.group(g, 0, 5, -2.5); box(lid, 8.2, 1.0, 5.2, M("#6c7d90", { r: 0.35, m: 0.6 }), 0, 0.5, 2.5, 0.25); g.userData.lid = lid;
    for (const sx of [-3.4, 3.4]) box(g, 0.5, 5.2, 5.2, M("#3d4855", { r: 0.4, m: 0.6 }), sx, 2.6, 0, 0.1);
    const lk = T.group(g, 0, 3.4, 2.65); g.userData.lock = lk;
    box(lk, 1.6, 1.4, 0.6, M("#f2c230", { r: 0.3, m: 0.8 }), 0, 0, 0.2, 0.2);
    const sh = T.mesh(new THREE.TorusGeometry(0.55, 0.16, 8, 16, Math.PI), M("#c9ced6", { r: 0.25, m: 0.9 }), 0, 0.7, 0.2); g.userData.shackle = sh; lk.add(sh);
    const pencilTex = T.textTex(["PENCILS"], { w: 1024, h: 200, fg: "#ffffff", bg: "#2b3442", radius: 20 });
    const lab = new THREE.Mesh(T.plane(5, 1), new THREE.MeshStandardMaterial({ map: pencilTex, roughness: 0.7 })); lab.position.set(0, 1.2, 2.53); g.add(lab);
    T.shadowAll(g); return g;
  };
  P.pencil = (parent, x, y, z, s = 1, color = "#ffcc33") => {
    const g = T.group(parent, x, y, z); g.scale.setScalar(s);
    const body = T.mesh(T.cyl(0.18, 0.18, 2.6, 6), M(color, { r: 0.5 }), 0, 0, 0); g.add(body);
    const tip = T.mesh(new THREE.ConeGeometry(0.18, 0.6, 6), M("#f2d7a6"), 0, 1.6, 0); g.add(tip);
    const lead = T.mesh(new THREE.ConeGeometry(0.06, 0.2, 6), M("#2b2b30"), 0, 1.84, 0); g.add(lead);
    const er = T.mesh(T.cyl(0.19, 0.19, 0.36, 8), M("#ff8fa3"), 0, -1.48, 0); g.add(er);
    const band = T.mesh(T.cyl(0.2, 0.2, 0.18, 8), M("#c9ced6", { r: 0.3, m: 0.7 }), 0, -1.23, 0); g.add(band);
    T.shadowAll(g); return g;
  };
  P.eraser = (parent, x, y, z, s = 1, color = "#ff9fb2") => { const m = T.mesh(T.rbox(1.6, 0.7, 0.9, 0.18), M(color, { r: 0.85 }), x, y, z); m.scale.setScalar(s); parent.add(m); return m; };
  P.gold = (parent, x, y, z, s = 1) => {
    const g = new THREE.CylinderGeometry(0.62, 0.86, 0.6, 4, 1); g.rotateY(Math.PI / 4);
    const m = T.mesh(g, M("#f2c230", { r: 0.25, m: 0.85 }), x, y, z); m.scale.set(1.6 * s, s, 0.8 * s); parent.add(m); return m;
  };
  P.flashlight = (parent) => {
    const g = T.group(parent);
    const b = T.mesh(T.cyl(0.22, 0.22, 1.4, 12), M("#2b2b30", { r: 0.4, m: 0.4 }), 0, 0, 0); b.rotation.x = Math.PI / 2; g.add(b);
    const h = T.mesh(T.cyl(0.36, 0.24, 0.5, 14), M("#c9ced6", { r: 0.3, m: 0.7 }), 0, 0, 0.9); h.rotation.x = Math.PI / 2; g.add(h);
    const lens = T.mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: "#fffbe0" }), 0, 0, 1.16); g.add(lens);
    return g;
  };
  P.ladder = (parent, x, z, h = 12, ry = 0, lean = 0.12) => {
    const g = T.group(parent, x, 0, z); g.rotation.set(-lean, ry, 0);
    for (const sx of [-0.9, 0.9]) box(g, 0.24, h, 0.24, M("#c08040"), sx, h / 2, 0, 0.05);
    for (let y = 1; y < h; y += 1.2) box(g, 1.8, 0.18, 0.2, M("#c08040"), 0, y, 0, 0.04);
    return g;
  };
  P.wheelbarrow = (parent, x, z, ry = 0) => {
    const g = T.group(parent, x, 0, z); g.rotation.y = ry;
    box(g, 3.2, 1.4, 2.4, M("#2e86de", { r: 0.4, m: 0.3 }), 0, 1.9, 0, 0.3);
    const w = T.mesh(T.cyl(0.7, 0.7, 0.4, 16), M("#1d1d22"), 2.0, 0.7, 0); w.rotation.x = Math.PI / 2; g.add(w);
    for (const sz of [-0.8, 0.8]) { box(g, 3.8, 0.18, 0.18, M("#8a8f98"), -0.9, 1.4, sz, 0.04); box(g, 0.18, 1.2, 0.18, M("#8a8f98"), -1.0, 0.6, sz, 0.04); }
    return g;
  };
  P.poster = (parent, tex, x, y, z, w = 3, h = 4, ry = 0) => {
    const m = new THREE.Mesh(T.plane(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  P.easel = (parent, x, z, tex, ry = 0) => {
    const g = T.group(parent, x, 0, z); g.rotation.y = ry;
    for (const sx of [-1, 1]) { const l = box(g, 0.25, 7, 0.25, M("#9b6b43"), sx * 1.2, 3.4, 0, 0.05); l.rotation.z = -sx * 0.12; }
    const bl = box(g, 0.25, 6.6, 0.25, M("#9b6b43"), 0, 3.2, -1.2, 0.05); bl.rotation.x = -0.2;
    box(g, 3.6, 0.25, 0.6, M("#9b6b43"), 0, 2.6, 0.25, 0.05);
    const cv = new THREE.Mesh(T.plane(3.4, 3.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); cv.position.set(0, 4.6, 0.32); cv.rotation.x = -0.1; cv.castShadow = true; g.add(cv);
    box(g, 3.6, 3.6, 0.15, M("#ffffff"), 0, 4.6, 0.2, 0.02).rotation.x = -0.1;
    g.userData.canvas = cv;
    return g;
  };
  P.crayons = (parent, x, y, z, s = 1) => {
    const g = T.group(parent, x, y, z); g.scale.setScalar(s);
    box(g, 2.2, 1.2, 0.9, M("#2e86de"), 0, 0.6, 0, 0.08);
    ["#e63946", "#ffd23f", "#4cd17a", "#3fa7ff", "#a66bff", "#ff8a3d"].forEach((c, i) => { const cr = T.mesh(T.cyl(0.12, 0.12, 1.4, 8), M(c, { r: 0.5 }), -0.85 + i * 0.34, 1.3, 0); g.add(cr); const tp = T.mesh(new THREE.ConeGeometry(0.12, 0.3, 8), M(c), -0.85 + i * 0.34, 2.15, 0); g.add(tp); });
    return g;
  };
  P.cage = (parent, x, z, r = 5, h = 9) => {
    const g = T.group(parent, x, 0, z);
    const bars = M("#8a2a2a", { r: 0.4, m: 0.5 });
    g.userData.bars = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const b = T.mesh(T.cyl(0.16, 0.16, h, 8), bars, Math.cos(a) * r, h / 2, Math.sin(a) * r); g.add(b); g.userData.bars.push(b); }
    for (const y of [0.3, h - 0.1]) { const ring = T.mesh(new THREE.TorusGeometry(r, 0.22, 8, 40), bars, 0, y, 0); ring.rotation.x = Math.PI / 2; g.add(ring); g.userData.bars.push(ring); }
    T.shadowAll(g); return g;
  };
  P.sword = (parent) => {
    const g = T.group(parent);
    g.add(T.mesh(T.box(0.22, 3.4, 0.06), M("#e6ebf2", { r: 0.2, m: 0.85 }), 0, 2.1, 0));
    g.add(T.mesh(T.rbox(1.3, 0.22, 0.3, 0.06), M("#c9a227", { r: 0.3, m: 0.7 }), 0, 0.35, 0));
    g.add(T.mesh(T.cyl(0.13, 0.13, 0.8, 8), M("#5a3a22"), 0, -0.1, 0));
    T.shadowAll(g); return g;
  };
  P.shield = (parent) => {
    const g = T.group(parent);
    const c = T.canvas(256, 320), q = c.getContext("2d");
    q.fillStyle = "#2e5fbf"; q.fillRect(0, 0, 256, 320); q.fillStyle = "#f2c230"; q.fillRect(108, 20, 40, 280); q.fillRect(20, 120, 216, 40);
    g.add(T.mesh(T.rbox(2.2, 2.8, 0.25, 0.4), [M("#c9ced6", { r: 0.3, m: 0.7 }), M("#c9ced6", { r: 0.3, m: 0.7 }), M("#c9ced6", { r: 0.3, m: 0.7 }), M("#c9ced6", { r: 0.3, m: 0.7 }), new THREE.MeshStandardMaterial({ map: T.tex(c), roughness: 0.5 }), M("#c9ced6")], 0, 0, 0));
    T.shadowAll(g); return g;
  };
  P.ball = (parent, color = "#ff4d6d") => { const m = T.mesh(T.sph(0.9, 20, 14), M(color, { r: 0.5 })); parent.add(m); return m; };
  P.stick = (parent) => { const m = T.mesh(T.rbox(0.4, 0.4, 5, 0.15), M("#8a5a2b")); parent.add(m); return m; };
  P.chalkboard = (parent, x, y, z, lines, w = 12, h = 6) => {
    const g = T.group(parent, x, y, z);
    box(g, w + 0.8, h + 0.8, 0.3, M("#8a5a2b"), 0, 0, 0, 0.1);
    const tex = T.textTex(lines, { w: 1024, h: Math.round(1024 * h / w), bg: "#26453a", fg: "#f4f4ec" });
    const m = new THREE.Mesh(T.plane(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); m.position.z = 0.17; g.add(m);
    return g;
  };
  P.counter = (parent, x, z, w = 14, d = 3.4, h = 4, color = "#8a5a2b", top = "#e8e0d2") => {
    const g = T.group(parent, x, 0, z);
    box(g, w, h, d, M(color, { r: 0.7 }), 0, h / 2, 0, 0.12); box(g, w + 0.4, 0.35, d + 0.4, M(top, { r: 0.5 }), 0, h + 0.17, 0, 0.08);
    return g;
  };
  P.shelf = (parent, x, z, w = 12, h = 10, rows = 4, color = "#9b6b43") => {
    const g = T.group(parent, x, 0, z);
    for (let i = 0; i <= rows; i++) box(g, w, 0.3, 2.4, M(color), 0, 1 + i * (h - 1) / rows, 0, 0.05);
    for (const sx of [-1, 1]) box(g, 0.3, h + 0.4, 2.4, M(color), sx * w / 2, h / 2 + 0.2, 0, 0.05);
    box(g, w, h, 0.2, M(color), 0, h / 2 + 0.3, -1.1, 0.02);
    return g;
  };
  P.oven = (parent, x, z) => {
    const g = T.group(parent, x, 0, z);
    box(g, 7, 7, 4, M("#b4553f", { r: 0.95, map: T.texLib.tilesTex("#b4553f", "#d9c3a6", 64, 32, 256, [2, 2], 9, 0.1) }), 0, 3.5, 0, 0.3);
    const mouth = T.mesh(new THREE.CircleGeometry(1.8, 24, 0, Math.PI), M("#1a1414"), 0, 2.6, 2.02); g.add(mouth);
    box(g, 1.6, 3.5, 1.6, M("#9a4a38"), 0, 8.6, -0.8, 0.1);
    return g;
  };
  P.priceTag = (parent, text, x, y, z, w = 2.2, h = 1.2, ry = 0, color = "#ffffff") => {
    const tex = T.textTex([text], { w: 512, h: Math.round(512 * h / w), bg: color, fg: "#1d1a22", radius: 40, border: "#1d1a22", borderW: 14 });
    const m = new THREE.Mesh(T.plane(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
  };
  P.glassCase = (parent, x, y, z, w = 6, h = 3, d = 3) => {
    const g = T.group(parent, x, y, z);
    const gl = new THREE.MeshStandardMaterial({ color: "#d8f2ff", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false });
    const m = T.mesh(T.box(w, h, d), gl, 0, h / 2, 0, { cast: false }); g.add(m);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) box(g, 0.12, h, 0.12, M("#c9a227", { r: 0.3, m: 0.7 }), sx * w / 2, h / 2, sz * d / 2, 0);
    box(g, w + 0.2, 0.12, d + 0.2, M("#c9a227", { r: 0.3, m: 0.7 }), 0, h, 0, 0);
    return g;
  };
  P.cushion = (parent, x, y, z, color = "#7a1f3d") => { const m = T.mesh(T.rbox(2.2, 0.5, 1.6, 0.2), M(color, { r: 0.9 }), x, y, z); parent.add(m); return m; };
  P.paperRoll = (parent, x, y, z, ry = 0) => {
    const g = T.group(parent, x, y, z); g.rotation.y = ry;
    const r = T.mesh(T.cyl(1.0, 1.0, 5, 24), M("#fbfaf6", { r: 0.95 }), 0, 0, 0); r.rotation.z = Math.PI / 2; g.add(r);
    const sheet = T.mesh(T.plane(4.6, 4.5), M("#fbfaf6", { r: 0.95, side: THREE.DoubleSide }), 0, -0.5, 1.6); sheet.rotation.x = -Math.PI / 2 + 0.25; g.add(sheet);
    return g;
  };
  P.ruler = (parent, x, y, z, len = 4) => {
    const c = T.canvas(512, 64), g = c.getContext("2d"); g.fillStyle = "#f6d55c"; g.fillRect(0, 0, 512, 64); g.fillStyle = "#1d1a22"; for (let i = 0; i <= 32; i++) g.fillRect(i * 16, 0, 3, i % 4 ? 18 : 34);
    const m = new THREE.Mesh(T.box(len, 0.08, 0.5), [M("#f6d55c"), M("#f6d55c"), new THREE.MeshStandardMaterial({ map: T.tex(c), roughness: 0.6 }), M("#f6d55c"), M("#f6d55c"), M("#f6d55c")]);
    m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
  };
  P.trash = (parent, x, z) => { const g = T.group(parent, x, 0, z); box(g, 2.4, 3, 2.4, M("#8a96a3", { r: 0.4, m: 0.5 }), 0, 1.5, 0, 0.2); box(g, 2.7, 0.3, 2.7, M("#6c7783", { r: 0.4, m: 0.5 }), 0, 3.1, 0, 0.1); return g; };
  P.rug = (parent, x, z, r = 4, color = "#ff8fa3") => { const m = T.mesh(new THREE.CircleGeometry(r, 40), M(color, { r: 1 }), x, 0.03, z, { cast: false }); m.rotation.x = -Math.PI / 2; parent.add(m); return m; };
  P.fridge = (parent, x, z) => { const g = T.group(parent, x, 0, z); box(g, 3.6, 8.6, 3.2, M("#f4f6f8", { r: 0.4 }), 0, 4.3, 0, 0.3); box(g, 0.2, 2.2, 0.3, M("#c9ced6", { m: 0.7, r: 0.3 }), 1.4, 5.6, 1.7, 0.05); return g; };
  P.hangLamp = (parent, x, y, z) => { const g = T.group(parent, x, y, z); box(g, 0.1, 3, 0.1, M("#222"), 0, 1.5, 0, 0); const sh = T.mesh(new THREE.ConeGeometry(1.2, 1.0, 20, 1, true), M("#ff8a3d", { side: THREE.DoubleSide }), 0, 0, 0); g.add(sh); g.add(T.mesh(T.sph(0.35, 10, 8), W.lampMat, 0, -0.3, 0)); return g; };
  // ---------------------------------------------------------------- furniture for every room (built once, shown with its room)
  const furnish = (name, build) => {
    const room = W.rooms[name], X = room.position.x, g = T.group(room, -X, 0, 0);
    const before = g.children.length;
    build(g, X);
    T.shadowAll(g);
    // every piece's box keeps the camera out of it
    room.updateMatrixWorld(true);
    for (const ch of g.children.slice(before)) { const b = new THREE.Box3().setFromObject(ch); if (b.max.y - b.min.y > 0.6) room.userData.furniture.push(b); }
    return g;
  };
  T.onBoot(() => {
    const p = T.PROP, D = T.DOODLE;
    furnish("kitchen", (g, X) => {
      p.table(g, X, 0, 8, 5, 3.2, "#c98a4b"); p.chair(g, X - 2.2, 3.2, Math.PI, "#ff6f61"); p.chair(g, X + 2.2, -3.2, 0, "#ffb347");
      p.counter(g, X + 7, -8.2, 10, 3, 4, "#ffffff", "#9fb4c7"); p.fridge(g, X - 9.5, -7.6); p.hangLamp(g, X, 11, 0);
      p.rug(g, X, 1, 6.5, "#ffd6a5");
    });
    furnish("theo", (g, X) => {
      const bed = p.bed(g, X + 7, -5.5, 0, "#5b8def"); bed.userData.blanket.visible = true;
      p.table(g, X - 4.5, -6.5, 6, 3.6, 3.2, "#9b6b43"); p.chair(g, X - 4.5, -3.6, Math.PI, "#3cb371");
      p.rug(g, X + 1, 2, 5, "#ff8fa3");
      p.crayons(g, X - 3, 3.4, -7, 0.8);
      [["creature1", -8, 9], ["creature2", -3.2, 10.5], ["lump", 1.8, 9.2], ["potatoCat", 5.6, 10.2]].forEach(([n, x, y], i) => {
        const m = new THREE.Mesh(T.plane(3, 3), new THREE.MeshStandardMaterial({ map: T.tex(D.render(D.DES[n], { size: 512, paper: "#fbfaf4" })), roughness: 0.9 }));
        m.position.set(X + x, y, -9.65); m.rotation.z = (i % 2 ? 1 : -1) * 0.06; g.add(m);
      });
    });
    furnish("bakery", (g, X) => {
      p.oven(g, X - 7, -7.2); p.shelf(g, X + 6, -8.5, 11, 9.5, 4, "#9b6b43");
      for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) p.loaf(g, X + 6 - 3.9 + i * 2.6, 1.15 + r * 2.12, -8.3, 0.85, 0.1 * (i - 1.5), (r + i) % 2);
      p.counter(g, X + 2.5, -1.5, 12, 3.2, 2.6, "#8a5a2b", "#f3e3c3");
      for (let i = 0; i < 3; i++) p.loaf(g, X + 1.5 + i * 2.5, 2.98, -1.5, 0.75, 0.3, i % 2);
    });
    furnish("shop", (g, X) => {
      p.counter(g, X + 1, -3.2, 13, 3.4, 2.6, "#2f6fa0", "#e8eef4");
      p.shelf(g, X - 7.5, -8.8, 7, 9, 4, "#9b6b43"); p.shelf(g, X + 6.5, -8.8, 8, 9, 4, "#9b6b43");
      const cols = ["#ff6f61", "#ffd23f", "#4cd17a", "#3fa7ff", "#a66bff", "#ff8a3d"];
      for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) box(g, 1.6, 1.5, 1.4, M(cols[(r * 3 + i) % 6], { r: 0.6 }), X - 9.6 + i * 2.1, 1.95 + r * 2.0, -8.6, 0.12);
      for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { const m = T.mesh(T.cyl(0.55, 0.55, 1.3, 14), M(cols[(r + i * 2) % 6], { r: 0.4 }), X + 3.4 + i * 2.05, 1.8 + r * 2.0, -8.6); g.add(m); }
      box(g, 2.2, 1.5, 1.6, M("#3d4855", { r: 0.4, m: 0.5 }), X + 4.6, 3.75, -3.2, 0.15);
      p.chalkboard(g, X + 0.5, 10.4, -9.6, ["OPEN"], 6, 2.6);
    });
    furnish("jewel", (g, X) => {
      p.counter(g, X, -1.2, 12, 3.2, 2.6, "#2a1a30", "#c9a227");
      p.glassCase(g, X - 1.8, 2.95, -1.2, 4.6, 2.0, 2.4); p.cushion(g, X - 1.8, 3.2, -1.2);
      for (let i = 0; i < 3; i++) p.gold(g, X + 2.6 + (i % 2) * 0.1, 3.3 + i * 0.55, -1.2 + (i === 1 ? 0.2 : 0), 1);
      p.glassCase(g, X - 8, 0, -7.5, 5, 3.4, 3); p.glassCase(g, X + 7.5, 0, -7.5, 5, 3.4, 3);
      for (const sx of [-8, 7.5]) for (let i = 0; i < 3; i++) p.gold(g, X + sx - 1.4 + i * 1.4, 0.4, -7.5, 0.8);
    });
    furnish("class", (g, X) => {
      p.chalkboard(g, X - 1, 8.4, -9.6, ["CLASS"], 11, 4.6);
      p.table(g, X + 7.5, -6.2, 5, 3, 3.0, "#9b6b43");
      for (const [dx, dz, c] of [[-6, -1, "#ffb347"], [0, -1, "#8fd8ff"], [-6, 4.5, "#c6f0c2"], [0, 4.5, "#ffcfa8"]]) {
        p.table(g, X + dx, dz, 4, 3, 2.0, c); p.chair(g, X + dx, dz + 2.0, Math.PI, "#3cb371", 0.62);
      }
      p.crayons(g, X + 0.4, 2.4, -1.2, 0.6);
    });
    furnish("living", (g, X) => {
      const sofa = M("#5b6ee1", { r: 0.85 });
      box(g, 10, 1.6, 3.6, sofa, X - 2, 1.2, -6.6, 0.4); box(g, 10, 3.2, 1.0, sofa, X - 2, 2.4, -8.0, 0.4);
      for (const sx of [-1, 1]) box(g, 1.1, 2.4, 3.6, sofa, X - 2 + sx * 5.2, 1.6, -6.6, 0.4);
      for (const sx of [-2.6, 0.6]) box(g, 2.8, 0.8, 2.6, M("#7b8cf0", { r: 0.9 }), X - 2 + sx + 1, 2.3, -6.5, 0.35);
      p.table(g, X - 2, -1.8, 5, 2.6, 1.6, "#9b6b43"); p.rug(g, X - 2, -1.5, 6, "#ffd6a5");
      box(g, 3.4, 2.6, 2.4, M("#6b4a2f"), X + 9, 1.3, -6, 0.1);
      box(g, 4.6, 2.8, 0.4, M("#1d1d22", { r: 0.4 }), X + 9, 4.3, -6.2, 0.1);
      box(g, 4.2, 2.4, 0.1, M("#2a3550", { e: "#3a5a9a", ei: 0.5 }), X + 9, 4.3, -5.98, 0.02);
      W.lamp(g, X - 9.5, -7.5).scale.set(0.9, 0.9, 0.9);
      for (const [x, y, c] of [[-6.5, 8.8, "#ff8fa3"], [-1.5, 9.4, "#8fd8ff"], [3.2, 8.8, "#ffd23f"]]) { box(g, 2.6, 2.0, 0.2, M("#ffffff"), X + x, y, -9.62, 0.04); box(g, 2.1, 1.5, 0.12, M(c), X + x, y, -9.5, 0.02); }
    });
    furnish("office", (g, X) => {
      box(g, 9, 3.4, 4, M("#6b3a1f", { r: 0.6 }), X, 1.7, -3.5, 0.15); box(g, 9.6, 0.3, 4.6, M("#4a2a14", { r: 0.5 }), X, 3.55, -3.5, 0.08);
      p.chair(g, X, -7.0, 0, "#7a1f3d", 1.15);
      p.shelf(g, X - 8.5, -8.8, 6, 10, 4, "#6b3a1f");
      const cols = ["#c0392b", "#2e86de", "#27ae60", "#f39c12", "#8e44ad"];
      for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) box(g, 0.6, 1.5 + (i % 3) * 0.2, 1.6, M(cols[(r + i) % 5], { r: 0.7 }), X - 10.6 + i * 0.75, 2.0 + r * 2.35, -8.6, 0.05);
      const plate = T.sign(["MAYOR"], 3.6, 0.9, { bg: "#c9a227", fg: "#2a1a10", radius: 30, cw: 1024, ch: 256 }); plate.position.set(X, 4.15, -1.25); plate.rotation.x = -0.25; g.add(plate);
      box(g, 0.2, 9, 0.2, M("#c9a227", { r: 0.3, m: 0.7 }), X + 9, 4.5, -8, 0.05);
      box(g, 3.6, 2.4, 0.06, M("#2e86de", { r: 0.8 }), X + 10.8, 7.6, -8, 0.02);
    });
  });

  // ---------------------------------------------------------------- blockers: boxes the camera may not stand inside
  T.onBoot(() => {
    const out = (W.blockers = []);
    const add = (o, pad = 0.4) => { o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); b.expandByScalar(pad); out.push(b); return b; };
    for (const o of [W.school, W.hall, W.bakery, W.water, W.paperShop, W.jewelShop, ...W.houses]) add(o);
    // trees: trunk + crown
    W.town.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.parameters && o.geometry.parameters.width === 5.0 && o.geometry.parameters.depth === 5.0) add(o.parent, 0.3); });
  });
})();
