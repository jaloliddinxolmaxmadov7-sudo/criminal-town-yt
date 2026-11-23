/* "In This Town" engine, effects: sparkles, puffs, crumbs, hearts, rings, all computed from time (a pool of sprites). */
(function () {
  const T = window.TOWN;
  const FX = (T.FX = {});
  const tx = {};
  function mk(name, draw, size = 128) { const c = T.canvas(size, size), g = c.getContext("2d"); draw(g, size); tx[name] = T.tex(c); }
  T.onBoot(() => {
    mk("star", (g, s) => { g.translate(s / 2, s / 2); g.fillStyle = "#fff8c8"; g.shadowColor = "#ffe066"; g.shadowBlur = 18; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 12 : 56; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); });
    mk("glow", (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.5)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); });
    mk("puff", (g, s) => { g.fillStyle = "#ffffff"; for (const [x, y, r] of [[64, 70, 34], [40, 74, 24], [88, 76, 26], [62, 50, 24]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } });
    mk("heart", (g) => { g.fillStyle = "#ff3b6b"; g.strokeStyle = "#ffffff"; g.lineWidth = 8; g.beginPath(); g.moveTo(64, 110); g.bezierCurveTo(-10, 60, 20, 4, 64, 34); g.bezierCurveTo(108, 4, 138, 60, 64, 110); g.fill(); g.stroke(); });
    mk("crumb", (g) => { g.fillStyle = "#ff9fb2"; g.fillRect(34, 34, 60, 60); });
    mk("ink", (g) => { g.fillStyle = "#141418"; g.beginPath(); g.moveTo(20, 30); g.lineTo(108, 14); g.lineTo(96, 100); g.lineTo(30, 112); g.closePath(); g.fill(); });
    mk("note", (g) => { g.fillStyle = "#ffffff"; g.strokeStyle = "#1d1a22"; g.lineWidth = 6; g.beginPath(); g.ellipse(46, 92, 22, 16, -0.4, 0, 7); g.fill(); g.stroke(); g.fillRect(62, 20, 10, 74); g.strokeRect(62, 20, 10, 74); });
    mk("dust", (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(230,215,190,0.9)"); r.addColorStop(1, "rgba(230,215,190,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); });
    mk("fire", (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(255,250,200,1)"); r.addColorStop(0.3, "rgba(255,190,60,0.95)"); r.addColorStop(0.7, "rgba(255,90,20,0.6)"); r.addColorStop(1, "rgba(255,60,0,0)"); g.fillStyle = r; g.fillRect(0, 0, s, s); });
    mk("zzz", (g) => { g.fillStyle = "#ffffff"; g.strokeStyle = "#1d1a22"; g.lineWidth = 8; g.font = `900 100px ${T.FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.strokeText("Z", 64, 64); g.fillText("Z", 64, 64); });
    FX.tex = tx;
    FX.pool = [];
    for (let i = 0; i < 420; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx.star, transparent: true, depthWrite: false, fog: false })); s.visible = false; T.scene.add(s); FX.pool.push(s); }
    FX.rings = [];
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: "#fff6c0", transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false })); m.visible = false; T.scene.add(m); FX.rings.push(m); }
  });
  let used = 0, ringsUsed = 0;
  T.onFrame((c, phase) => { if (phase === "pre") { used = 0; ringsUsed = 0; for (const s of FX.pool) s.visible = false; for (const r of FX.rings) r.visible = false; } });
  const blendFor = { star: THREE.AdditiveBlending, glow: THREE.AdditiveBlending, fire: THREE.AdditiveBlending };
  FX.sprite = (name, pos, size, opacity = 1, rot = 0, color = "#ffffff") => {
    if (used >= FX.pool.length) return null;
    const s = FX.pool[used++];
    s.visible = true; s.position.set(pos[0], pos[1], pos[2]); s.scale.set(size, size, 1);
    const m = s.material; if (m.map !== tx[name]) { m.map = tx[name]; m.blending = blendFor[name] || THREE.NormalBlending; m.needsUpdate = true; }
    m.opacity = opacity; m.rotation = rot; m.color.set(color);
    return s;
  };
  // a burst from `at` starting at absolute time t0: n particles fly out, rise/fall, fade
  FX.burst = (T0, t0, at, o = {}) => {
    const n = o.n || 24, life = o.life || 1.0, sp = o.speed || 6, g = o.grav ?? 4, up = o.up ?? 3, seed = o.seed || 1, size = o.size || 1.2;
    for (let i = 0; i < n; i++) {
      const dl = (T.hash(seed, i) * (o.spreadT || 0.15));
      const tau = T0 - t0 - dl;
      if (tau < 0 || tau > life) continue;
      const a = T.hash(seed, i + 100) * Math.PI * 2, el = (T.hash(seed, i + 200) - 0.3) * (o.flat ? 0.2 : 1.4);
      const v = sp * (0.45 + T.hash(seed, i + 300) * 0.75);
      const dir = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
      const x = at[0] + dir[0] * v * tau * (o.sx ?? 1), y = at[1] + dir[1] * v * tau + up * tau - 0.5 * g * tau * tau, z = at[2] + dir[2] * v * tau * (o.sz ?? 1);
      const k = tau / life;
      const sz = size * (o.grow ? 0.4 + k * 1.2 : 1 - k * 0.6) * (0.6 + T.hash(seed, i + 400) * 0.8);
      FX.sprite(o.tex || "star", [x, y, z], sz, (o.op ?? 1) * (1 - Math.pow(k, 2)), o.spin ? tau * o.spin * (i % 2 ? 1 : -1) : 0, o.color || "#ffffff");
    }
  };
  // magic shimmer around a point: twinkling stars that stay
  FX.twinkle = (T0, at, o = {}) => {
    const n = o.n || 16, R = o.r || 3, seed = o.seed || 3;
    for (let i = 0; i < n; i++) {
      const a = T.hash(seed, i) * 6.28, rr = R * Math.sqrt(T.hash(seed, i + 50)), y = (T.hash(seed, i + 90) - 0.5) * (o.h || R);
      const tw = 0.5 + 0.5 * Math.sin(T0 * (5 + T.hash(seed, i + 7) * 6) + i);
      FX.sprite(o.tex || "star", [at[0] + Math.cos(a) * rr, at[1] + y, at[2] + Math.sin(a) * rr], (o.size || 0.8) * (0.4 + tw), (o.op ?? 1) * tw, 0, o.color || "#ffffff");
    }
  };
  // an expanding ring facing the camera or lying flat
  FX.ring = (T0, t0, at, o = {}) => {
    const tau = T0 - t0, life = o.life || 0.8;
    if (tau < 0 || tau > life || ringsUsed >= FX.rings.length) return;
    const m = FX.rings[ringsUsed++], k = tau / life;
    m.visible = true; m.position.set(at[0], at[1], at[2]);
    const r = (o.r || 6) * T.ease.out(k); m.scale.set(r, r, r);
    if (o.flat) m.rotation.set(-Math.PI / 2, 0, 0); else m.quaternion.copy(T.cam.quaternion);
    m.material.opacity = (1 - k) * (o.op ?? 0.9); m.material.color.set(o.color || "#fff6c0");
  };
  // speed lines streaming past (for running)
  FX.trail = (T0, at, dir, o = {}) => {
    for (let i = 0; i < (o.n || 6); i++) {
      const ph = ((T0 * 3 + T.hash(o.seed || 9, i)) % 1);
      FX.sprite("puff", [at[0] - dir[0] * ph * 4 + (T.hash(i, 3) - 0.5) * 1.5, at[1] + 0.3 + T.hash(i, 5) * 0.6, at[2] - dir[2] * ph * 4 + (T.hash(i, 7) - 0.5) * 1.5], 1.2 * (1 - ph) + 0.3, 0.55 * (1 - ph));
    }
  };
})();
