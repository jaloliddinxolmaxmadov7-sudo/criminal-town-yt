/* "In This Town" engine, drawings: a crayon renderer, ready-made doodles (D.DES), paper sheets drawn stroke by stroke, sticker puppets (drawings that came alive) and speech-bubble textures. */
(function () {
  const T = window.TOWN;
  const D = (T.DOODLE = {});
  const H = T.hash;

  // ---------------------------------------------------------------- crayon strokes
  const patCache = new Map();
  function crayonPat(g, color) {
    if (!patCache.has(color)) {
      const c = T.canvas(64, 64), q = c.getContext("2d"), img = q.createImageData(64, 64), col = new THREE.Color(color), r = T.rng(color.length * 31 + 7);
      for (let i = 0; i < 64 * 64; i++) { img.data[i * 4] = col.r * 255; img.data[i * 4 + 1] = col.g * 255; img.data[i * 4 + 2] = col.b * 255; img.data[i * 4 + 3] = 255 * (r() < 0.12 ? 0.35 : 0.78 + r() * 0.22); }
      q.putImageData(img, 0, 0);
      patCache.set(color, c);
    }
    return g.createPattern(patCache.get(color), "repeat");
  }
  const lenOf = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; };
  // a polyline cut to a fraction of its length
  function prefix(p, k) {
    if (k >= 1) return p;
    const L = lenOf(p) * k; let acc = 0; const out = [p[0]];
    for (let i = 1; i < p.length; i++) {
      const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (acc + s >= L) { const f = (L - acc) / s; out.push([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f]); return out; }
      acc += s; out.push(p[i]);
    }
    return out;
  }
  function strokeCrayon(g, p, o, seed) {
    if (p.length < 2) return;
    const passes = o.clean ? 1 : 2, jit = o.clean ? 0 : o.jit ?? 2.2;
    g.lineCap = "round"; g.lineJoin = "round";
    for (let pass = 0; pass < passes; pass++) {
      g.beginPath();
      for (let i = 0; i < p.length; i++) {
        const jx = (H(seed + i * 3, pass * 7 + 1) - 0.5) * 2 * jit, jy = (H(seed + i * 3 + 1, pass * 7 + 2) - 0.5) * 2 * jit;
        if (i === 0) g.moveTo(p[i][0] + jx, p[i][1] + jy); else g.lineTo(p[i][0] + jx, p[i][1] + jy);
      }
      g.lineWidth = (o.w || 10) * (pass ? 0.55 : 1);
      g.strokeStyle = o.clean ? o.c : crayonPat(g, o.c || "#1d1a22");
      g.globalAlpha = pass ? 0.7 : 1;
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  // ellipse / wobbly loop points
  D.ell = (cx, cy, rx, ry, n = 40, wob = 0.04, seed = 1, a0 = -Math.PI / 2, turns = 1.06) => {
    const p = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI * 2 * turns, w = 1 + (H(seed, i) - 0.5) * 2 * wob; p.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
    return p;
  };
  D.rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
  // hatch fill of a polygon: zigzag lines clipped to it
  function hatch(g, poly, o, seed, k = 1) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    g.save(); g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
    if (o.clean) { g.fillStyle = o.fill; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.restore(); return; }
    const gap = o.gap || 14, ang = o.ang ?? -0.6, ca = Math.cos(ang), sa = Math.sin(ang);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 20;
    const pts = [];
    let row = 0;
    for (let d = -R; d <= R; d += gap, row++) {
      const a = [cx + ca * -R - sa * d, cy + sa * -R + ca * d], b = [cx + ca * R - sa * d, cy + sa * R + ca * d];
      if (row % 2) pts.push(b, a); else pts.push(a, b);
    }
    const part = prefix(pts, k);
    strokeCrayon(g, part, { c: o.fill, w: gap * 1.25, jit: 3 }, seed);
    g.restore();
  }
  // chaotic scribble loops inside a polygon (for the scribble dog)
  function scribble(g, poly, o, seed, k = 1) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const r = T.rng(seed), n = o.n || 260, pts = [];
    let x = (x0 + x1) / 2, y = (y0 + y1) / 2, a = r() * 6.28;
    const inside = (px, py) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c; } return c; };
    for (let i = 0; i < n; i++) {
      a += (r() - 0.5) * 1.9;
      const step = o.step || 34;
      let nx = x + Math.cos(a) * step, ny = y + Math.sin(a) * step, tries = 0;
      while (!inside(nx, ny) && tries++ < 12) { a += 2.2 + r(); nx = x + Math.cos(a) * step; ny = y + Math.sin(a) * step; }
      if (!inside(nx, ny)) { nx = (x0 + x1) / 2 + (r() - 0.5) * (x1 - x0) * 0.5; ny = (y0 + y1) / 2 + (r() - 0.5) * (y1 - y0) * 0.5; }
      x = nx; y = ny; pts.push([x, y]);
    }
    strokeCrayon(g, prefix(pts, k), { c: o.c, w: o.w || 9, jit: 4 }, seed);
  }
  // draw a list of commands, the first `k` fraction of their total length
  D.draw = (g, cmds, k = 1, seed = 1, boil = 0) => {
    const L = cmds.map((c) => c.len || (c.p ? lenOf(c.p) : 400));
    const tot = L.reduce((a, b) => a + b, 0);
    let budget = k * tot;
    cmds.forEach((c, i) => {
      if (budget <= 0) return;
      const f = Math.min(1, budget / L[i]); budget -= L[i];
      const s = seed * 131 + i * 17 + boil * 977;
      g.save();
      if (c.alpha) g.globalAlpha = c.alpha;
      if (c.k === "line") strokeCrayon(g, prefix(c.p, f), c, s);
      else if (c.k === "fill") hatch(g, c.p, c, s, f);
      else if (c.k === "scrib") scribble(g, c.p, c, c.seed || s, f);
      else if (c.k === "dot") { if (f > 0.5) { g.fillStyle = c.clean ? c.c : crayonPat(g, c.c); g.beginPath(); g.arc(c.x + (H(s, 1) - 0.5) * (c.clean ? 0 : 3), c.y + (H(s, 2) - 0.5) * (c.clean ? 0 : 3), c.r, 0, 7); g.fill(); } }
      else if (c.k === "text") { if (f > 0.3) { g.font = `900 ${c.size}px ${T.FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = c.clean ? c.c : crayonPat(g, c.c); g.translate(c.x, c.y); g.rotate(c.rot || 0); g.fillText(c.t, 0, 0); } }
      g.restore();
    });
  };
  const L = (p, c, w = 12, o = {}) => Object.assign({ k: "line", p, c, w }, o);
  const F = (p, fill, o = {}) => Object.assign({ k: "fill", p, fill, len: o.len || 500 }, o);
  const Dt = (x, y, r, c, o = {}) => Object.assign({ k: "dot", x, y, r, c, len: 30 }, o);
  const ell = D.ell;

  // ---------------------------------------------------------------- designs (1000 x 1000 space unless noted)
  const DES = (D.DES = {});
  DES.cake = () => [
    L([[170, 800], [830, 800]], "#8a8f98", 14),
    L(D.rect(250, 580, 750, 800), "#c2185b", 12), F(D.rect(250, 580, 750, 800), "#f48fb1", { gap: 16 }),
    L(D.rect(330, 410, 670, 580), "#c2185b", 12), F(D.rect(330, 410, 670, 580), "#f8bbd0", { gap: 16 }),
    L([[250, 600], [300, 640], [350, 600], [400, 650], [450, 600], [500, 640], [550, 600], [600, 650], [650, 600], [700, 640], [750, 600]], "#ffffff", 16),
    L([[480, 410], [480, 290], [520, 290], [520, 410]], "#1e88e5", 12), F(D.rect(480, 290, 520, 410), "#64b5f6", { gap: 10 }),
    L(ell(500, 240, 26, 42, 20, 0.05, 3), "#ff9800", 10), F(ell(500, 240, 22, 38, 20, 0, 3), "#ffd54f", { gap: 9 }),
    Dt(380, 700, 18, "#e53935"), Dt(500, 720, 18, "#e53935"), Dt(620, 700, 18, "#e53935"), Dt(420, 500, 16, "#e53935"), Dt(580, 500, 16, "#e53935"),
  ];
  DES.bike = () => [
    L(ell(280, 650, 150, 150, 40, 0.03, 2), "#212121", 14), L(ell(720, 650, 150, 150, 40, 0.03, 5), "#212121", 14),
    L([[280, 650], [470, 650], [630, 440], [390, 440], [280, 650]], "#e53935", 14), L([[470, 650], [390, 440]], "#e53935", 14),
    L([[630, 440], [720, 650]], "#e53935", 14), L([[630, 440], [660, 360], [740, 350]], "#424242", 12),
    L([[360, 420], [430, 420]], "#424242", 16), L([[390, 440], [380, 420]], "#424242", 10),
    Dt(280, 650, 16, "#424242"), Dt(720, 650, 16, "#424242"),
  ];
  DES.bread = () => [
    L(ell(320, 520, 200, 110, 40, 0.02, 1), "#6d4c2f", 12, { clean: 1 }), F(ell(320, 520, 200, 110, 40, 0, 1), "#d8954a", { clean: 1, fill: "#d8954a" }),
    L([[230, 470], [270, 540]], "#f3d39a", 14, { clean: 1 }), L([[300, 450], [340, 540]], "#f3d39a", 14, { clean: 1 }), L([[370, 455], [410, 535]], "#f3d39a", 14, { clean: 1 }),
    L(ell(680, 560, 190, 120, 40, 0.02, 2), "#6d4c2f", 12, { clean: 1 }), F(ell(680, 560, 190, 120, 40, 0, 2), "#c47a32", { clean: 1, fill: "#c47a32" }),
    L([[600, 520], [640, 600]], "#f3d39a", 14, { clean: 1 }), L([[680, 500], [720, 600]], "#f3d39a", 14, { clean: 1 }), L([[760, 510], [790, 590]], "#f3d39a", 14, { clean: 1 }),
    L(ell(500, 720, 230, 90, 40, 0.02, 3), "#6d4c2f", 12, { clean: 1 }), F(ell(500, 720, 230, 90, 40, 0, 3), "#e0a55a", { clean: 1, fill: "#e0a55a" }),
  ];
  DES.spider = () => [
    F(ell(500, 520, 110, 95, 30, 0.05, 4), "#212121", { gap: 12 }), L(ell(500, 520, 110, 95, 30, 0.05, 4), "#212121", 12),
    L([[400, 470], [300, 400], [240, 470]], "#212121", 12), L([[395, 520], [280, 510], [220, 590]], "#212121", 12), L([[405, 570], [310, 620], [270, 700]], "#212121", 12),
  ];
  DES.carSmall = () => [
    L([[150, 620], [150, 520], [300, 500], [380, 400], [640, 400], [720, 500], [860, 520], [860, 620], [150, 620]], "#1e88e5", 14), F([[150, 620], [150, 520], [300, 500], [380, 400], [640, 400], [720, 500], [860, 520], [860, 620]], "#64b5f6", { gap: 16 }),
    L(ell(300, 640, 70, 70, 24, 0.04, 2), "#212121", 14), L(ell(710, 640, 70, 70, 24, 0.04, 3), "#212121", 14), F(ell(300, 640, 60, 60, 20, 0, 2), "#424242", { gap: 12 }), F(ell(710, 640, 60, 60, 20, 0, 3), "#424242", { gap: 12 }),
    L(D.rect(410, 430, 610, 500), "#ffffff", 10),
  ];
  DES.carBig = DES.carSmall;
  DES.bikeChalk = () => [
    L(ell(280, 650, 150, 150, 40, 0.04, 2), "#2563eb", 20), L(ell(720, 650, 150, 150, 40, 0.04, 5), "#2563eb", 20),
    L([[280, 650], [470, 650], [630, 440], [390, 440], [280, 650]], "#ec4899", 20), L([[470, 650], [390, 440]], "#ec4899", 20),
    L([[630, 440], [720, 650]], "#ec4899", 20), L([[630, 440], [660, 360], [740, 350]], "#16a34a", 18),
    L([[350, 420], [440, 420]], "#f59e0b", 24), L([[390, 440], [380, 420]], "#f59e0b", 14),
    Dt(280, 650, 20, "#2563eb"), Dt(720, 650, 20, "#2563eb"),
  ];
  DES.smiley = () => [L(ell(500, 500, 260, 260, 40, 0.05, 2), "#ffd23f", 22), Dt(410, 430, 30, "#ffd23f"), Dt(590, 430, 30, "#ffd23f"), L([[380, 580], [440, 650], [560, 650], [620, 580]], "#ffd23f", 22)];
  DES.potatoCat = () => [
    F(ell(500, 560, 300, 210, 40, 0.12, 9), "#b5835a", { gap: 18 }), L(ell(500, 560, 300, 210, 40, 0.12, 9), "#6d4c2f", 14),
    L([[300, 420], [330, 300], [400, 390]], "#6d4c2f", 14), L([[600, 390], [670, 300], [700, 420]], "#6d4c2f", 14),
    Dt(420, 520, 22, "#212121"), Dt(580, 520, 22, "#212121"), Dt(500, 580, 12, "#ff7f96"),
    L([[400, 600], [300, 590]], "#212121", 8), L([[400, 620], [310, 650]], "#212121", 8), L([[600, 600], [700, 590]], "#212121", 8), L([[600, 620], [690, 650]], "#212121", 8),
    L([[420, 760], [410, 860]], "#6d4c2f", 12), L([[580, 760], [590, 860]], "#6d4c2f", 12), L([[790, 560], [880, 470], [860, 400]], "#6d4c2f", 12),
  ];
  DES.creature1 = () => [
    F(ell(500, 480, 260, 220, 40, 0.15, 21), "#7cc84a", { gap: 18 }), L(ell(500, 480, 260, 220, 40, 0.15, 21), "#2e7d32", 14),
    L(ell(500, 430, 90, 90, 30, 0.03, 4), "#212121", 12), Dt(510, 440, 40, "#212121"), Dt(525, 420, 12, "#ffffff", { clean: 1 }),
    L([[400, 560], [460, 600], [560, 600], [610, 560]], "#212121", 10),
    ...[300, 380, 460, 540, 620, 700].map((x, i) => L([[x, 660], [x + (i % 2 ? 30 : -30), 800], [x + (i % 2 ? 60 : -50), 820]], "#2e7d32", 12)),
  ];
  DES.creature2 = () => [
    F([[140, 520], [220, 420], [800, 420], [880, 520], [800, 620], [220, 620]], "#ff9f43", { gap: 18 }), L([[140, 520], [220, 420], [800, 420], [880, 520], [800, 620], [220, 620], [140, 520]], "#c0571c", 14),
    Dt(240, 480, 20, "#212121"), Dt(300, 470, 20, "#212121"), L([[180, 560], [130, 600], [100, 580]], "#ff6f86", 16),
    ...[260, 340, 420, 500, 580, 660, 740].map((x, i) => L([[x, 620], [x + (i % 2 ? 15 : -15), 760]], "#c0571c", 12)),
    L([[880, 500], [960, 380], [930, 330]], "#c0571c", 12),
  ];
  DES.potatoDog = () => [
    F(ell(500, 520, 290, 190, 40, 0.13, 33), "#c9a26b", { gap: 18 }), L(ell(500, 520, 290, 190, 40, 0.13, 33), "#7a5230", 14),
    L([[330, 390], [270, 470], [290, 560], [340, 470]], "#7a5230", 14), F([[330, 390], [270, 470], [290, 560], [340, 470]], "#7a5230", { gap: 10 }),
    L([[660, 390], [720, 470], [700, 560], [650, 470]], "#7a5230", 14), F([[660, 390], [720, 470], [700, 560], [650, 470]], "#7a5230", { gap: 10 }),
    Dt(430, 480, 20, "#212121"), Dt(570, 480, 20, "#212121"), Dt(500, 545, 22, "#212121"),
    L([[450, 600], [500, 630], [550, 600]], "#212121", 10),
    L([[360, 690], [350, 860]], "#7a5230", 14), L([[450, 705], [455, 870]], "#7a5230", 14), L([[560, 705], [565, 870]], "#7a5230", 14), L([[650, 690], [665, 860]], "#7a5230", 14),
    L([[785, 520], [860, 450], [840, 400], [890, 380]], "#7a5230", 12),
  ];
  DES.dragon = () => [
    F([[180, 560], [320, 470], [560, 470], [700, 520], [820, 450], [900, 470], [860, 560], [700, 600], [560, 640], [320, 640]], "#4caf50", { gap: 18 }),
    L([[180, 560], [320, 470], [560, 470], [700, 520], [820, 450], [900, 470], [860, 560], [700, 600], [560, 640], [320, 640], [180, 560]], "#1b5e20", 14),
    Dt(840, 490, 14, "#212121"), L([[100, 520], [180, 560], [90, 610]], "#1b5e20", 12),
    L([[340, 640], [330, 740]], "#1b5e20", 12), L([[520, 640], [530, 740]], "#1b5e20", 12),
    L([[380, 470], [430, 330], [470, 470]], "#1b5e20", 10), L([[470, 470], [520, 340], [560, 470]], "#1b5e20", 10),
  ];
  DES.wing = () => [F([[100, 900], [500, 100], [900, 900], [700, 700], [500, 900], [300, 700]], "#66bb6a", { gap: 18 }), L([[100, 900], [500, 100], [900, 900], [700, 700], [500, 900], [300, 700], [100, 900]], "#1b5e20", 14)];
  DES.messy = () => {
    const r = T.rng(77), cs = [];
    const cols = ["#e53935", "#1e88e5", "#43a047", "#fdd835", "#8e24aa", "#fb8c00", "#212121"];
    for (let i = 0; i < 16; i++) { const pts = []; let x = 200 + r() * 600, y = 200 + r() * 600; for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 260; y += (r() - 0.5) * 260; pts.push([Math.max(80, Math.min(920, x)), Math.max(80, Math.min(920, y))]); } cs.push(L(pts, cols[i % cols.length], 14 + r() * 10)); }
    cs.push(Dt(380, 420, 30, "#212121"), Dt(560, 380, 18, "#212121"));
    return cs;
  };
  DES.lump = () => [
    F(ell(500, 560, 300, 230, 40, 0.18, 61), "#9c6bff", { gap: 18 }), L(ell(500, 560, 300, 230, 40, 0.18, 61), "#5b2fb8", 14),
    Dt(410, 480, 26, "#212121"), Dt(520, 450, 18, "#212121"), Dt(610, 500, 30, "#212121"),
    L([[400, 640], [470, 610], [540, 650], [610, 615]], "#212121", 10),
    L([[500, 330], [520, 230], [470, 170]], "#5b2fb8", 12), L([[330, 760], [300, 870]], "#5b2fb8", 14),
  ];
  DES.stickYou = () => [
    L(ell(500, 300, 170, 150, 30, 0.12, 51), "#212121", 14), Dt(440, 280, 18, "#212121"), Dt(560, 300, 10, "#212121"),
    L([[420, 360], [470, 390], [520, 370], [600, 380]], "#212121", 10),
    L([[500, 450], [490, 720]], "#212121", 14), L([[490, 520], [340, 470]], "#212121", 14), L([[490, 520], [660, 600]], "#212121", 14),
    L([[490, 720], [380, 880]], "#212121", 14), L([[490, 720], [600, 900]], "#212121", 14),
    { k: "text", t: "YOU", x: 760, y: 220, size: 120, c: "#e53935", rot: 0.12, len: 200 },
    L([[700, 280], [600, 330]], "#e53935", 10),
  ];
  // the lost-dog poster portrait (a clean drawing)
  DES.posterDog = () => [
    F(ell(500, 520, 230, 210, 40, 0, 1), "#c8874a", { clean: 1, fill: "#c8874a" }),
    F([[290, 360], [220, 520], [270, 640], [330, 520]], "#7e4a22", { clean: 1, fill: "#7e4a22" }), F([[710, 360], [780, 520], [730, 640], [670, 520]], "#7e4a22", { clean: 1, fill: "#7e4a22" }),
    F(ell(500, 620, 120, 80, 30, 0, 2), "#fbf3e6", { clean: 1, fill: "#fbf3e6" }),
    Dt(420, 480, 22, "#1d1a22", { clean: 1 }), Dt(580, 480, 22, "#1d1a22", { clean: 1 }), Dt(500, 580, 26, "#1d1a22", { clean: 1 }),
    F(ell(500, 680, 30, 36, 20, 0, 3), "#ff7f96", { clean: 1, fill: "#ff7f96" }),
  ];

  // render a design into a canvas (sticker: white border, transparent outside)
  D.render = (design, o = {}) => {
    const size = o.size || 512, c = T.canvas(size, size), g = c.getContext("2d");
    if (o.paper) { g.fillStyle = o.paper; g.fillRect(0, 0, size, size); }
    g.save(); g.scale(size / 1000, size / 1000);
    const cmds = typeof design === "function" ? design() : design;
    if (o.sticker) {
      // white sticker border: draw every stroke and fill fat and white first
      const fat = cmds.map((x) => Object.assign({}, x, { c: "#ffffff", fill: "#ffffff", w: (x.w || 12) + 46, clean: 1, gap: x.gap }));
      for (const x of fat) if (x.k === "fill") x.k = "fill";
      D.draw(g, fat.map((x) => (x.k === "fill" ? Object.assign({}, x, { k: "line", p: x.p.concat([x.p[0]]), w: 50 }) : x)), 1, o.seed || 1, 0);
      D.draw(g, fat.filter((x) => x.k === "fill"), 1, o.seed || 1, 0);
    }
    D.draw(g, cmds, o.k ?? 1, o.seed || 1, o.boil || 0);
    g.restore();
    return c;
  };
  // boil variants: the same drawing three times with different crayon jitter
  const varCache = new Map();
  D.variants = (name, o = {}) => {
    const key = name + JSON.stringify(o);
    if (!varCache.has(key)) varCache.set(key, [0, 1, 2].map((b) => T.tex(D.render(DES[name], Object.assign({}, o, { boil: b, sticker: o.sticker ?? true })))));
    return varCache.get(key);
  };
  D.boil = (t, n = 3, fps = 8) => Math.floor(t * fps + 1e-6) % n;

  // ---------------------------------------------------------------- paper sheets (drawn progressively on a desk)
  D.paperTex = () => {
    const c = T.canvas(512, 512), g = c.getContext("2d");
    g.fillStyle = "#fbfaf4"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(90,140,220,0.22)"; g.lineWidth = 2; for (let y = 60; y < 512; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    g.strokeStyle = "rgba(230,80,80,0.3)"; g.beginPath(); g.moveTo(60, 0); g.lineTo(60, 512); g.stroke();
    return c;
  };
  class Sheet {
    constructor(design, o = {}) {
      this.design = design; this.size = o.size || 1024;
      this.c = T.canvas(this.size, this.size); this.g = this.c.getContext("2d");
      this.tex = T.tex(this.c);
      if (o.bg === false) this.bg = null;
      else if (typeof o.bg === "string") { this.bg = T.canvas(64, 64); const q = this.bg.getContext("2d"); q.fillStyle = o.bg; q.fillRect(0, 0, 64, 64); }
      else this.bg = D.paperTex();
      this.mat = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.92, transparent: o.bg === false, alphaTest: o.bg === false ? 0.04 : 0, depthWrite: o.bg !== false });
      this.mesh = new THREE.Mesh(T.plane(o.w || 6, o.h || 6), this.mat);
      this.mesh.receiveShadow = true; this.mesh.castShadow = true;
      this._k = -1;
    }
    // k: drawn fraction; seed changes the crayon jitter (boil)
    set(k, boil = 0) {
      const key = Math.round(k * 400) + "|" + boil;
      if (key === this._k) return; this._k = key;
      const g = this.g; g.clearRect(0, 0, this.size, this.size); if (this.bg) g.drawImage(this.bg, 0, 0, this.size, this.size);
      g.save(); g.scale(this.size / 1000, this.size / 1000); D.draw(g, DES[this.design](), k, 3, boil); g.restore();
      this.tex.needsUpdate = true;
    }
    // the point (in sheet-local units) where the crayon is at fraction k: tracks the last drawn point
    tip(k) {
      const cmds = DES[this.design]();
      const Ls = cmds.map((c) => c.len || (c.p ? lenOf(c.p) : 400)); const tot = Ls.reduce((a, b) => a + b, 0);
      let b = k * tot, pt = [500, 500];
      for (let i = 0; i < cmds.length; i++) { const c = cmds[i]; if (b <= 0) break; const f = Math.min(1, b / Ls[i]); b -= Ls[i]; if (c.p) { const pp = prefix(c.p, f); pt = pp[pp.length - 1]; } else if (c.x !== undefined) pt = [c.x, c.y]; }
      const w = this.mesh.geometry.parameters.width, h = this.mesh.geometry.parameters.height;
      return [(pt[0] / 1000 - 0.5) * w, (0.5 - pt[1] / 1000) * h];
    }
  }
  D.Sheet = Sheet;

  // ---------------------------------------------------------------- paper puppets (drawings that came alive)
  // parts: [{name, design, w, h, x, y, z, pivot:[px,py]}]; the group stands on the ground, facing +z
  class Puppet {
    constructor(parts, o = {}) {
      this.root = new THREE.Group(); this.parts = {};
      for (const p of parts) {
        const vars = D.variants(p.design, { size: p.size || 512, sticker: true });
        const pv = T.group(this.root, p.x, p.y, p.z || 0);
        const m = new THREE.Mesh(T.plane(p.w, p.h), new THREE.MeshStandardMaterial({ map: vars[0], transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.95, emissive: new THREE.Color("#ffffff"), emissiveMap: vars[0], emissiveIntensity: 0.18 }));
        m.position.set(-(p.pivot ? p.pivot[0] : 0), -(p.pivot ? p.pivot[1] : 0), 0);
        m.castShadow = true;
        m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: vars[0], alphaTest: 0.35 });
        pv.add(m);
        this.parts[p.name] = { g: pv, m, vars };
      }
      this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.22, depthWrite: false }));
      this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.04; this.shadow.scale.set(o.shadow || 2, (o.shadow || 2) * 0.5, 1);
      this.root.add(this.shadow);
    }
    boil(t) { const b = D.boil(t); for (const k in this.parts) { const p = this.parts[k]; if (p.m.material.map !== p.vars[b]) { p.m.material.map = p.vars[b]; p.m.material.emissiveMap = p.vars[b]; p.m.customDepthMaterial.map = p.vars[b]; p.m.material.needsUpdate = true; } } }
  }
  D.Puppet = Puppet;
  // ready-made puppets
  D.potatoDog = () => {
    const pu = new Puppet([
      { name: "body", design: "potatoDog", w: 4.2, h: 4.2, x: 0, y: 2.1 },
    ], { shadow: 1.8 });
    return pu;
  };
  D.single = (design, w, h, shadow = 1.6) => new Puppet([{ name: "body", design, w, h, x: 0, y: h / 2 }], { shadow });
  // the question mark / speech bubble sprite
  D.bubbleTex = (txt, o = {}) => {
    const c = T.canvas(512, 512), g = c.getContext("2d");
    g.fillStyle = o.bg || "#ffffff"; g.strokeStyle = "#1d1a22"; g.lineWidth = 18;
    g.beginPath(); g.roundRect(40, 40, 432, 330, 90); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(200, 360); g.lineTo(240, 470); g.lineTo(300, 360); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = o.bg || "#ffffff"; g.fillRect(205, 345, 90, 26);
    g.fillStyle = o.fg || "#1d1a22"; g.font = `900 ${o.size || 230}px ${T.FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 256, 210);
    return T.tex(c);
  };

})();
