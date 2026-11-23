/* "In This Town" engine, people: a blocky rig with flat 2D faces that swap expressions, outfits, hats, the dog and the knight. */
(function () {
  const T = window.TOWN;
  const { clamp, lerp } = T;

  // ---------------------------------------------------------------- faces (one canvas per style + expression, cached)
  const faceCache = new Map();
  const EXPR = {
    smile: { eyes: "dot", brows: "flat", mouth: "smile" },
    happy: { eyes: "dot", brows: "up1", mouth: "open" },
    grin: { eyes: "dot", brows: "flat", mouth: "grin" },
    wow: { eyes: "big", brows: "raised", mouth: "O" },
    scared: { eyes: "small", brows: "worried", mouth: "wavy", sweat: 1 },
    sad: { eyes: "dot", brows: "worried", mouth: "frown" },
    angry: { eyes: "dot", brows: "angry", mouth: "grit" },
    smug: { eyes: "half", brows: "oneup", mouth: "side" },
    sleepy: { eyes: "closedDown", brows: "flat", mouth: "o" },
    meh: { eyes: "half", brows: "flat", mouth: "flat" },
    evil: { eyes: "half", brows: "angry", mouth: "evil" },
    shout: { eyes: "squeeze", brows: "angry", mouth: "O" },
    love: { eyes: "heart", brows: "up1", mouth: "open" },
    blink: { eyes: "line", brows: "flat", mouth: "smile" },
    talk: { eyes: "dot", brows: "up1", mouth: "talk" },
    tongue: { eyes: "dot", brows: "focus", mouth: "tongue" },
    sheepish: { eyes: "closedUp", brows: "worried", mouth: "smile", sweat: 1 },
    determined: { eyes: "dot", brows: "angry", mouth: "flatsmile" },
    laugh: { eyes: "squeeze", brows: "up1", mouth: "open" },
    proud: { eyes: "closedUp", brows: "up1", mouth: "grin" },
    worried: { eyes: "dot", brows: "worried", mouth: "flat", sweat: 1 },
    gasp: { eyes: "big", brows: "worried", mouth: "o" },
    cry: { eyes: "closedDown", brows: "worried", mouth: "O", tears: 1 },
    // ---- extra emotions (Criminal Town kit)
    cool: { eyes: "shades", brows: "none", mouth: "smirk" },
    sus: { eyes: "half", brows: "oneup", mouth: "flat" },
    starstruck: { eyes: "star", brows: "up1", mouth: "open" },
    dizzy: { eyes: "spiral", brows: "worried", mouth: "wavy" },
    dead: { eyes: "x", brows: "flat", mouth: "O" },
    rage: { eyes: "small", brows: "angry", mouth: "grit", rage: 1 },
    terrified: { eyes: "pupil", brows: "worried", mouth: "wavy", sweat: 1 },
    cryLaugh: { eyes: "squeeze", brows: "up1", mouth: "open", tears: 1 },
    sly: { eyes: "closedUp", brows: "angry", mouth: "cat" },
    cheeky: { eyes: "dot", brows: "oneup", mouth: "tongue" },
    shocked: { eyes: "pupil", brows: "raised", mouth: "O" },
    smirk: { eyes: "half", brows: "angry", mouth: "smirk" },
    flirty: { eyes: "wink", brows: "up1", mouth: "cat" },
    bored: { eyes: "half", brows: "flat", mouth: "o" },
    // ---- emotions pack 2
    inlove: { eyes: "heart", brows: "up1", mouth: "cat", blush: 1 },
    blushing: { eyes: "closedUp", brows: "worried", mouth: "wavy", blush: 1 },
    nervous: { eyes: "pupil", brows: "worried", mouth: "grit", sweat: 1 },
    heartbroken: { eyes: "closedDown", brows: "worried", mouth: "frown", tears: 1, crack: 1 },
    hungry: { eyes: "big", brows: "up1", mouth: "open", drool: 1 },
    disgust: { eyes: "squeeze", brows: "angry", mouth: "wavy", green: 1 },
    jealous: { eyes: "half", brows: "angry", mouth: "frown", green: 1 },
    furious: { eyes: "small", brows: "angry", mouth: "O", rage: 1, steam: 1 },
    confused: { eyes: "dot", brows: "oneup", mouth: "wavy", qmark: 1 },
    stuffed: { eyes: "closedUp", brows: "flat", mouth: "O", blush: 1 },
    giggle: { eyes: "closedUp", brows: "up1", mouth: "cat", blush: 1 },
    panicked: { eyes: "x", brows: "worried", mouth: "wavy", sweat: 1 },
    awkward: { eyes: "dot", brows: "worried", mouth: "grit", sweat: 1, blush: 1 },
    hopeful: { eyes: "big", brows: "worried", mouth: "smile" },
    // ---- emotions pack 3
    sobbing: { eyes: "squeeze", brows: "worried", mouth: "O", tears: 1, stream: 1 },
    mindblown: { eyes: "spiral", brows: "raised", mouth: "O", boom: 1 },
    scheming: { eyes: "half", brows: "angry", mouth: "smirk", vein: 0 },
    pouty: { eyes: "dot", brows: "worried", mouth: "frown", blush: 1 },
    screaming: { eyes: "x", brows: "raised", mouth: "O", sweat: 1, boom: 1 },
    dreamy: { eyes: "closedUp", brows: "up1", mouth: "cat", blush: 1, sparkle: 1 },
    grumpy: { eyes: "half", brows: "angry", mouth: "frown", vein: 1 },
    sweating: { eyes: "big", brows: "worried", mouth: "grit", sweat: 1, stream: 0 },
    winner: { eyes: "star", brows: "up1", mouth: "open", sparkle: 1 },
    sneaky: { eyes: "half", brows: "oneup", mouth: "cat" },
  };
  Object.assign(EXPR, {
    horrified: { eyes: "small", brows: "worried", mouth: "wavy", sweat: 1, pale: 1 }, greedy: { eyes: "big", brows: "raised", mouth: "grin", money: 1 },
    fired: { eyes: "dot", brows: "angry", mouth: "grit", fireEyes: 1 }, unamused: { eyes: "half", brows: "flat", mouth: "flat", dots: 1 },
    frozen: { eyes: "big", brows: "raised", mouth: "O", ice: 1 }, lovestruck: { eyes: "dot", brows: "up1", mouth: "smile", blush: 1, hearts: 1 },
    exhausted: { eyes: "half", brows: "worried", mouth: "o", bags: 1, sweat: 1 }, proudTear: { eyes: "dot", brows: "up1", mouth: "smile", tear1: 1 },
    possessed: { eyes: "half", brows: "angry", mouth: "evil", redEyes: 1 }, hypnotized: { eyes: "dot", brows: "flat", mouth: "o", blueEyes: 1 },
    annoyed: { eyes: "half", brows: "angry", mouth: "flat", angerMark: 1 }, embarrassed: { eyes: "dot", brows: "worried", mouth: "wavy", blush: 1, sweat: 1 },
    smug2: { eyes: "half", brows: "oneup", mouth: "side", sparkle: 1 }, devilish: { eyes: "half", brows: "angry", mouth: "evil", redEyes: 1, rage: 1 },
    relieved: { eyes: "closedDown", brows: "flat", mouth: "smile", sweat: 1 }, wideEyed: { eyes: "big", brows: "raised", mouth: "o", pale: 1 },
    cringe: { eyes: "squeeze", brows: "worried", mouth: "wavy", cringeLines: 1 }, sassy: { eyes: "half", brows: "oneup", mouth: "smile", sparkle: 1, blush: 1 },
    sick: { eyes: "half", brows: "worried", mouth: "wavy", sick: 1, sweat: 1 }, champion: { eyes: "dot", brows: "up1", mouth: "grin", crown: 1 },
    thinking: { eyes: "dot", brows: "oneup", mouth: "side", thought: 1 }, touched: { eyes: "big", brows: "worried", mouth: "smile", tear1: 1, blush: 1 },
    electrocuted: { eyes: "big", brows: "raised", mouth: "O", zap: 1 }, snoozing: { eyes: "closedDown", brows: "flat", mouth: "o", zzzMark: 1 },
    starving: { eyes: "big", brows: "worried", mouth: "O", drool: 1, bags: 1 }, evilLaugh: { eyes: "half", brows: "angry", mouth: "grin", redEyes: 1 },
    nervousLaugh: { eyes: "dot", brows: "worried", mouth: "grin", sweat: 1, blush: 1 }, heartEyes: { eyes: "dot", brows: "up1", mouth: "open", heartEyes: 1, blush: 1 },
    volcano: { eyes: "dot", brows: "angry", mouth: "grit", rage: 1, steam: 1, fireEyes: 1 }, petrified: { eyes: "small", brows: "worried", mouth: "wavy", pale: 1, ice: 1 },
    focused: { eyes: "dot", brows: "angry", mouth: "flat", focusLines: 1 }, demonGrin: { eyes: "half", brows: "angry", mouth: "evil", redEyes: 1, fangs: 1 }, sweatDrop: { eyes: "dot", brows: "flat", mouth: "flat", bigSweat: 1 },
  });
  T.EXPR = EXPR;
  const BLINKABLE = new Set(["smile", "happy", "grin", "wow", "talk", "determined", "worried", "sad", "angry", "tongue"]);
  function drawFace(st, ex) {
    const c = T.canvas(512, 512), g = c.getContext("2d"); g.scale(2, 2);
    const ink = st.ink || "#1d1a22";
    g.fillStyle = st.skin; g.fillRect(0, 0, 256, 256);
    if (st.redEars) { const a = st.redEars === true ? 1 : st.redEars; const gr = (x0, x1) => { const l = g.createLinearGradient(x0, 0, x1, 0); l.addColorStop(0, `rgba(255,20,20,${0.95 * a})`); l.addColorStop(1, "rgba(255,20,20,0)"); return l; };
      g.fillStyle = gr(0, 70); g.fillRect(0, 50, 70, 150); g.fillStyle = gr(256, 186); g.fillRect(186, 50, 70, 150); }
    if (st.freckles) { g.fillStyle = "rgba(150,80,40,0.55)"; for (const [x, y] of [[70, 150], [82, 158], [62, 160], [186, 150], [174, 158], [194, 160]]) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); } }
    if (st.blush || ex.mouth === "open" && st.blushHappy) { g.fillStyle = "rgba(255,110,120,0.35)"; for (const x of [62, 194]) { g.beginPath(); g.ellipse(x, 146, 20, 12, 0, 0, 7); g.fill(); } }
    let EX = [88, 168], EY = 110;
    if (ex.png) { EX = [82, 174]; EY = 100; }
    g.lineCap = "round"; g.lineJoin = "round";
    const dot = (x, y, rx, ry) => { g.fillStyle = ink; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x + rx * 0.35, y - ry * 0.4, rx * 0.38, 0, 7); g.fill(); };
    const png = ex.png && T.IMAGES && T.IMAGES["face_" + ex.png];
    if (png) {
      if (st.mustache) { const mx = 128, my = 168; g.fillStyle = st.mustache; g.beginPath(); g.moveTo(mx, my - 22); g.bezierCurveTo(mx - 18, my - 36, mx - 54, my - 28, mx - 58, my - 8); g.bezierCurveTo(mx - 42, my - 18, mx - 20, my - 14, mx, my - 15); g.bezierCurveTo(mx + 20, my - 14, mx + 42, my - 18, mx + 58, my - 8); g.bezierCurveTo(mx + 54, my - 28, mx + 18, my - 36, mx, my - 22); g.fill(); }
      const W0 = png.naturalWidth || 512, k = W0 / 1024; g.drawImage(png, 62 * k, 40 * k, 900 * k, 900 * k, 0, 0, 256, 256); // features sized to stay clear of caps, fringes and the jaw
    }
    const eye = ex.eyes;
    for (let i = 0; i < (png ? 0 : 2); i++) {
      const x = EX[i], s = i === 0 ? -1 : 1;
      g.strokeStyle = ink; g.lineWidth = 9;
      if (eye === "dot") dot(x, EY, 15, 22);
      else if (eye === "big") { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, EY, 27, 31, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); dot(x, EY + 4, 13, 16); }
      else if (eye === "small") { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, EY, 22, 26, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(x, EY + 2, 6, 0, 7); g.fill(); }
      else if (eye === "half") { dot(x, EY + 4, 15, 18); g.fillStyle = st.skin; g.fillRect(x - 22, EY - 26, 44, 24); g.lineWidth = 7; g.beginPath(); g.moveTo(x - 19, EY - 2); g.lineTo(x + 19, EY - 2); g.stroke(); }
      else if (eye === "closedUp") { g.beginPath(); g.arc(x, EY + 10, 17, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (eye === "closedDown") { g.beginPath(); g.arc(x, EY - 6, 17, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
      else if (eye === "line") { g.beginPath(); g.moveTo(x - 16, EY + 4); g.lineTo(x + 16, EY + 4); g.stroke(); }
      else if (eye === "squeeze") { g.beginPath(); g.moveTo(x - 16 * s, EY - 14); g.lineTo(x + 12 * s, EY); g.lineTo(x - 16 * s, EY + 14); g.stroke(); }
      else if (eye === "shades") { g.fillStyle = "#101014"; g.beginPath(); g.roundRect(x - 33, EY - 20, 66, 40, 10); g.fill(); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x - 24 + (i ? 4 : 0), EY - 14, 14, 6); if (i === 1) { g.fillStyle = "#101014"; g.fillRect(EX[0] + 30, EY - 12, EX[1] - EX[0] - 60, 7); } }
      else if (eye === "star") { g.fillStyle = "#ffd23f"; g.strokeStyle = "#e0a000"; g.lineWidth = 4; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 11 : 28; g.lineTo(x + Math.cos(a) * r, EY + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
      else if (eye === "spiral") { g.lineWidth = 6; g.beginPath(); for (let k = 0; k < 60; k++) { const a = k * 0.35, r = 2 + k * 0.42; g.lineTo(x + Math.cos(a) * r, EY + Math.sin(a) * r); } g.stroke(); }
      else if (eye === "x") { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 17, EY - 17); g.lineTo(x + 17, EY + 17); g.moveTo(x + 17, EY - 17); g.lineTo(x - 17, EY + 17); g.stroke(); }
      else if (eye === "pupil") { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, EY, 28, 33, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(x, EY, 5, 0, 7); g.fill(); }
      else if (eye === "wink") { if (i === 0) { g.beginPath(); g.moveTo(x - 16, EY + 4); g.lineTo(x + 16, EY + 4); g.stroke(); } else dot(x, EY, 15, 22); }
      else if (eye === "heart") { g.fillStyle = "#ff3b6b"; g.beginPath(); g.moveTo(x, EY + 22); g.bezierCurveTo(x - 34, EY, x - 22, EY - 26, x, EY - 10); g.bezierCurveTo(x + 22, EY - 26, x + 34, EY, x, EY + 22); g.fill(); }
      // brows
      g.strokeStyle = st.brow || ink; g.lineWidth = 9;
      const b = ex.brows, by = EY - 38;
      const L = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
      if (b === "flat") L(x - 16, by, x + 16, by);
      else if (b === "up1") { g.beginPath(); g.arc(x, by + 14, 18, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
      else if (b === "raised") L(x - 16, by - 12, x + 16, by - 12);
      else if (b === "worried") L(x - 16 * s, by - 2, x + 16 * s, by - 14);
      else if (b === "angry") L(x - 18 * s, by + 12, x + 16 * s, by - 6);
      else if (b === "focus") L(x - 16 * s, by + 6, x + 16 * s, by - 2);
      else if (b === "none") { /* hidden behind shades */ }
      else if (b === "oneup") L(x - 16, by - (i === 1 ? 12 : 0), x + 16, by - (i === 1 ? 16 : 0));
    }
    if (st.glasses && !png) { g.strokeStyle = st.glasses; g.lineWidth = 7; for (const x of EX) { g.beginPath(); g.arc(x, EY, 31, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(EX[0] + 31, EY - 4); g.lineTo(EX[1] - 31, EY - 4); g.stroke(); }
    // mouth
    const mx = 128, my = 172, m = st.noMouth || png ? "none" : ex.mouth;
    g.strokeStyle = ink; g.lineWidth = 9;
    const dark = "#5a1d24";
    if (m === "smile") { g.beginPath(); g.arc(mx, my - 26, 34, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
    else if (m === "flatsmile") { g.beginPath(); g.arc(mx, my - 50, 50, Math.PI * 0.36, Math.PI * 0.64); g.stroke(); }
    else if (m === "open") { g.fillStyle = dark; g.beginPath(); g.moveTo(mx - 38, my - 10); g.quadraticCurveTo(mx, my - 4, mx + 38, my - 10); g.quadraticCurveTo(mx + 30, my + 40, mx, my + 40); g.quadraticCurveTo(mx - 30, my + 40, mx - 38, my - 10); g.fill(); g.fillStyle = "#ff8a9a"; g.beginPath(); g.ellipse(mx, my + 30, 18, 10, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(mx - 26, my - 9, 52, 9); }
    else if (m === "grin") { g.fillStyle = "#fff"; g.beginPath(); g.roundRect(mx - 46, my - 14, 92, 34, 14); g.fill(); g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(mx - 44, my + 3); g.lineTo(mx + 44, my + 3); g.stroke(); }
    else if (m === "O") { g.fillStyle = dark; g.beginPath(); g.ellipse(mx, my + 6, 22, 30, 0, 0, 7); g.fill(); g.fillStyle = "#ff8a9a"; g.beginPath(); g.ellipse(mx, my + 24, 12, 8, 0, 0, 7); g.fill(); }
    else if (m === "o") { g.fillStyle = dark; g.beginPath(); g.ellipse(mx, my + 2, 11, 14, 0, 0, 7); g.fill(); }
    else if (m === "frown") { g.beginPath(); g.arc(mx, my + 30, 30, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
    else if (m === "wavy") { g.beginPath(); g.moveTo(mx - 36, my); for (let k = 1; k <= 6; k++) g.lineTo(mx - 36 + k * 12, my + (k % 2 ? -8 : 8)); g.stroke(); }
    else if (m === "flat") { g.beginPath(); g.moveTo(mx - 26, my + 2); g.lineTo(mx + 26, my + 2); g.stroke(); }
    else if (m === "side") { g.beginPath(); g.moveTo(mx - 26, my + 4); g.quadraticCurveTo(mx + 14, my + 8, mx + 32, my - 10); g.stroke(); }
    else if (m === "grit") { g.fillStyle = "#fff"; g.beginPath(); g.roundRect(mx - 34, my - 6, 68, 26, 8); g.fill(); g.lineWidth = 6; g.stroke(); for (const x of [-11, 11]) { g.beginPath(); g.moveTo(mx + x, my - 6); g.lineTo(mx + x, my + 20); g.stroke(); } }
    else if (m === "evil") { g.fillStyle = dark; g.beginPath(); g.moveTo(mx - 46, my - 14); g.quadraticCurveTo(mx, my + 4, mx + 46, my - 14); g.quadraticCurveTo(mx, my + 46, mx - 46, my - 14); g.fill(); g.fillStyle = "#fff"; for (let k = 0; k < 5; k++) { const x = mx - 34 + k * 17; g.beginPath(); g.moveTo(x - 7, my - 8 + Math.abs(k - 2) * -2); g.lineTo(x + 7, my - 8 + Math.abs(k - 2) * -2); g.lineTo(x, my + 6); g.fill(); } }
    else if (m === "talk") { g.fillStyle = dark; g.beginPath(); g.ellipse(mx, my + 4, 20, 15, 0, 0, 7); g.fill(); g.fillStyle = "#ff8a9a"; g.beginPath(); g.ellipse(mx, my + 12, 10, 6, 0, 0, 7); g.fill(); }
    else if (m === "cat") { g.beginPath(); g.arc(mx - 16, my - 6, 16, Math.PI * 0.1, Math.PI * 0.95); g.stroke(); g.beginPath(); g.arc(mx + 16, my - 6, 16, Math.PI * 0.05, Math.PI * 0.9); g.stroke(); }
    else if (m === "smirk") { g.beginPath(); g.moveTo(mx - 28, my + 2); g.quadraticCurveTo(mx + 6, my + 12, mx + 36, my - 14); g.stroke(); }
    else if (m === "tongue") { g.beginPath(); g.arc(mx - 6, my - 24, 30, Math.PI * 0.25, Math.PI * 0.78); g.stroke(); g.fillStyle = "#ff6f86"; g.beginPath(); g.ellipse(mx + 18, my + 10, 11, 15, -0.4, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); }
    if (st.mustache && !png) { g.fillStyle = st.mustache; g.beginPath(); g.moveTo(mx, my - 26); g.bezierCurveTo(mx - 20, my - 44, mx - 64, my - 34, mx - 70, my - 10); g.bezierCurveTo(mx - 50, my - 22, mx - 22, my - 16, mx, my - 18); g.bezierCurveTo(mx + 22, my - 16, mx + 50, my - 22, mx + 70, my - 10); g.bezierCurveTo(mx + 64, my - 34, mx + 20, my - 44, mx, my - 26); g.fill(); }
    if (ex.rage) { g.fillStyle = "rgba(255,40,40,0.38)"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#7a0d0d"; g.lineWidth = 6; for (const [x, y] of [[196, 40], [214, 52], [178, 52]]) { g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x, y - 8); g.lineTo(x + 8, y); g.stroke(); } }
    if (ex.stream) { g.fillStyle = "rgba(90,180,255,0.85)"; for (const x of EX) g.fillRect(x - 7, EY + 14, 14, 110); }
    if (ex.boom) { g.fillStyle = "#ffb020"; g.beginPath(); for (let k = 0; k < 16; k++) { const an = k * Math.PI / 8, rr = k % 2 ? 22 : 44; g.lineTo(128 + Math.cos(an) * rr * 2.2, 26 + Math.sin(an) * rr * 0.6); } g.closePath(); g.fill(); }
    if (ex.vein) { g.strokeStyle = "#d62828"; g.lineWidth = 7; g.beginPath(); for (const [a, b2, c2, d2] of [[196, 26, 214, 44], [214, 26, 196, 44], [205, 18, 205, 52]]) { g.moveTo(a, b2); g.lineTo(c2, d2); } g.stroke(); }
    if (ex.sparkle) { g.fillStyle = "#ffe14d"; for (const [x, y, r] of [[34, 30, 14], [222, 40, 11], [210, 200, 9]]) { g.beginPath(); for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4, rr = k % 2 ? r * 0.35 : r; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); } }
    if (ex.blush) { g.fillStyle = "rgba(255,90,120,0.55)"; for (const x of EX) { g.beginPath(); g.ellipse(x, EY + 42, 26, 13, 0, 0, 7); g.fill(); } }
    if (ex.green) { g.fillStyle = "rgba(90,200,70,0.38)"; g.fillRect(0, 0, 256, 128); }
    if (ex.drool) { g.fillStyle = "#8fd8ff"; g.strokeStyle = "#2f7fb8"; g.lineWidth = 3; g.beginPath(); g.moveTo(160, 182); g.quadraticCurveTo(170, 226, 160, 232); g.quadraticCurveTo(150, 226, 160, 182); g.fill(); g.stroke(); }
    if (ex.steam) { g.fillStyle = "rgba(255,255,255,0.9)"; for (const [x, y, r] of [[22, 120, 14], [14, 100, 9], [234, 120, 14], [242, 100, 9]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }
    if (ex.crack) { g.strokeStyle = "#c2183a"; g.lineWidth = 6; g.beginPath(); g.moveTo(218, 30); g.lineTo(208, 44); g.lineTo(222, 54); g.lineTo(210, 68); g.stroke(); }
    if (ex.qmark) { g.fillStyle = ink; g.font = "bold 60px sans-serif"; g.fillText("?", 205, 62); }
    if (ex.sweat) { g.fillStyle = "#8fd8ff"; g.strokeStyle = "#2f7fb8"; g.lineWidth = 4; g.beginPath(); g.moveTo(214, 58); g.quadraticCurveTo(232, 92, 214, 100); g.quadraticCurveTo(196, 92, 214, 58); g.fill(); g.stroke(); }
    if (ex.tears) { g.fillStyle = "#8fd8ff"; for (const x of EX) { g.fillRect(x - 6, EY + 6, 12, 60); } }
    // pack 4 overlays
    if (ex.pale) { const l = g.createLinearGradient(0, 0, 0, 200); l.addColorStop(0, "rgba(140,180,255,0.42)"); l.addColorStop(1, "rgba(140,180,255,0)"); g.fillStyle = l; g.fillRect(0, 0, 256, 200); }
    if (ex.money) { g.font = "900 54px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; for (const x of EX) { g.fillStyle = "#1e8e3e"; g.beginPath(); g.arc(x, EY, 30, 0, 7); g.fill(); g.fillStyle = "#ffe14d"; g.fillText("$", x, EY + 2); } g.textAlign = "start"; g.textBaseline = "alphabetic"; }
    if (ex.fireEyes) { for (const x of EX) { g.fillStyle = "#ff6d00"; g.beginPath(); g.moveTo(x - 20, EY - 40); g.quadraticCurveTo(x - 22, EY - 66, x - 6, EY - 80); g.quadraticCurveTo(x - 2, EY - 62, x + 6, EY - 74); g.quadraticCurveTo(x + 22, EY - 58, x + 20, EY - 40); g.closePath(); g.fill(); g.fillStyle = "#ffd23f"; g.beginPath(); g.ellipse(x, EY - 50, 7, 11, 0, 0, 7); g.fill(); } }
    if (ex.dots) { g.fillStyle = ink; for (const x of [196, 214, 232]) { g.beginPath(); g.arc(x, 34, 6, 0, 7); g.fill(); } }
    if (ex.ice) { g.fillStyle = "rgba(170,225,255,0.32)"; g.fillRect(0, 0, 256, 256); }
    if (ex.hearts) { g.fillStyle = "#ff3b6b"; for (const [x, y, r] of [[36, 40, 12], [220, 30, 15], [206, 64, 9]]) { g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 2, y - r * 0.2, x - r * 0.6, y - r * 1.6, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.6, x + r * 2, y - r * 0.2, x, y + r); g.fill(); } }
    if (ex.bags) { g.fillStyle = "rgba(80,40,90,0.45)"; for (const x of EX) { g.beginPath(); g.ellipse(x, EY + 30, 28, 9, 0, 0, 7); g.fill(); } }
    if (ex.tear1) { g.fillStyle = "#8fd8ff"; g.strokeStyle = "#2f7fb8"; g.lineWidth = 3; const x = EX[1] + 6, y = EY + 26; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y + 26, x, y + 32); g.quadraticCurveTo(x - 14, y + 26, x, y); g.fill(); g.stroke(); }
    if (ex.redEyes) { for (const x of EX) { const r = g.createRadialGradient(x, EY, 0, x, EY, 22); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,30,30,1)"); r.addColorStop(1, "rgba(255,30,30,0)"); g.fillStyle = r; g.beginPath(); g.arc(x, EY, 22, 0, 7); g.fill(); } }
    if (ex.blueEyes) { for (const x of EX) { const r = g.createRadialGradient(x, EY, 0, x, EY, 22); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(120,220,255,1)"); r.addColorStop(1, "rgba(120,220,255,0)"); g.fillStyle = r; g.beginPath(); g.arc(x, EY, 22, 0, 7); g.fill(); } }
    // pack 5 overlays
    if (ex.starsLow) { g.fillStyle = "#ffd23f"; g.strokeStyle = "#b8860b"; g.lineWidth = 2; for (const [x, y, r] of [[30, 150, 16], [226, 150, 16], [40, 96, 10], [216, 96, 10]]) { g.beginPath(); for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); g.stroke(); } }
    if (ex.cringeLines) { g.strokeStyle = ink; g.lineWidth = 5; for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const x = 128 + sx * (104 + k * 8); g.beginPath(); g.moveTo(x, 70 + k * 10); g.quadraticCurveTo(x + sx * 8, 100 + k * 10, x, 130 + k * 10); g.stroke(); } }
    if (ex.sick) { g.fillStyle = "rgba(110,190,60,0.45)"; g.fillRect(0, 0, 256, 256); }
    if (ex.crown) { g.fillStyle = "#ffd23f"; g.strokeStyle = "#b8860b"; g.lineWidth = 3; g.beginPath(); g.moveTo(88, 42); g.lineTo(88, 8); g.lineTo(108, 26); g.lineTo(128, 4); g.lineTo(148, 26); g.lineTo(168, 8); g.lineTo(168, 42); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#e53935"; g.beginPath(); g.arc(128, 30, 6, 0, 7); g.fill(); }
    if (ex.thought) { g.fillStyle = "#ffffff"; g.strokeStyle = ink; g.lineWidth = 3; for (const [x, y, r] of [[206, 128, 6], [222, 108, 9], [236, 82, 15]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); } }
    if (ex.zap) { g.fillStyle = "#ffe14d"; g.strokeStyle = "#b8860b"; g.lineWidth = 2; for (const [x, y, sx] of [[10, 70, 1], [246, 70, -1]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + sx * 18, y + 22); g.lineTo(x + sx * 6, y + 24); g.lineTo(x + sx * 20, y + 52); g.lineTo(x - sx * 4, y + 26); g.lineTo(x + sx * 8, y + 24); g.closePath(); g.fill(); g.stroke(); } g.fillStyle = "rgba(255,240,120,0.18)"; g.fillRect(0, 0, 256, 256); }
    if (ex.zzzMark) { g.fillStyle = ink; g.font = "900 34px sans-serif"; g.fillText("Z", 206, 112); g.font = "900 24px sans-serif"; g.fillText("z", 226, 88); g.font = "900 16px sans-serif"; g.fillText("z", 240, 70); }
    if (ex.heartEyes) { g.fillStyle = "#ff2d6b"; for (const x of EX) { const y = EY, r = 26; g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 2, y - r * 0.2, x - r * 0.6, y - r * 1.6, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.6, x + r * 2, y - r * 0.2, x, y + r); g.fill(); } }
    if (ex.focusLines) { g.strokeStyle = "rgba(30,30,40,0.55)"; g.lineWidth = 4; for (let k = 0; k < 7; k++) { const y = 30 + k * 30; g.beginPath(); g.moveTo(0, y); g.lineTo(26 + (k % 2) * 12, y + 4); g.stroke(); g.beginPath(); g.moveTo(256, y); g.lineTo(230 - (k % 2) * 12, y + 4); g.stroke(); } }
    if (ex.fangs) { g.fillStyle = "#ffffff"; g.strokeStyle = ink; g.lineWidth = 2; for (const x of [108, 148]) { g.beginPath(); g.moveTo(x - 9, 176); g.lineTo(x + 9, 176); g.lineTo(x, 202); g.closePath(); g.fill(); g.stroke(); } }
    if (ex.bigSweat) { g.fillStyle = "#9fe0ff"; g.strokeStyle = "#2f7fb8"; g.lineWidth = 4; g.beginPath(); g.moveTo(206, 20); g.quadraticCurveTo(250, 86, 214, 102); g.quadraticCurveTo(178, 86, 206, 20); g.fill(); g.stroke(); g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(204, 78, 5, 9, 0.3, 0, 7); g.fill(); }
    if (ex.angerMark) { g.strokeStyle = "#e02424"; g.lineWidth = 8; g.lineCap = "round"; const x = 222, y = 74; for (const [a, b2] of [[[-14, -4], [-4, -4]], [[4, -4], [14, -4]], [[-14, 6], [-4, 6]], [[4, 6], [14, 6]]]) { g.beginPath(); g.moveTo(x + a[0], y + a[1] - 8); g.lineTo(x + a[0] + 4, y + a[1]); g.lineTo(x + b2[0], y + b2[1]); g.stroke(); } }
    return c;
  }
  // bold face pack (assets/img/faces): emotion -> [face picture, extra overlays]; names not listed keep the drawn face
  const PNGMAP = {
    smile: ["smile"], happy: ["happy"], grin: ["laugh"], wow: ["oh"], scared: ["scared"], sad: ["sad"], angry: ["angry"], smug: ["smirk"],
    sleepy: ["sleepy"], meh: ["neutral"], evil: ["creepy"], shout: ["shocked"], love: ["content"], blink: ["blink"], talk: ["talk"],
    sheepish: ["nervous"], determined: ["stare"], laugh: ["laugh"], proud: ["content"], worried: ["nervous"], gasp: ["oh"], cry: ["cry"],
    sus: ["stare"], starstruck: ["sparkle"], dizzy: ["dizzy"], rage: ["angry", { rage: 1 }], terrified: ["scared"], cryLaugh: ["squeeze", { tears: 1 }],
    sly: ["smirk"], cheeky: ["wink"], shocked: ["shocked"], smirk: ["smirk"], flirty: ["wink"], bored: ["neutral"], blushing: ["content", { blush: 1 }],
    nervous: ["nervous"], heartbroken: ["sad", { tears: 1 }], hungry: ["sparkle_oh", { drool: 1 }], disgust: ["squeeze", { green: 1 }],
    jealous: ["stare", { green: 1 }], furious: ["angry", { rage: 1 }], confused: ["stare", { qmark: 1 }], stuffed: ["content", { blush: 1 }],
    giggle: ["happy"], panicked: ["scared", { sweat: 1 }], awkward: ["nervous", { blush: 1 }], hopeful: ["sparkle_oh"], sobbing: ["cry"],
    mindblown: ["dizzy"], scheming: ["creepy"], pouty: ["sad", { blush: 1 }], screaming: ["shocked"],
    dreamy: ["content"], grumpy: ["angry"], sweating: ["nervous"], winner: ["sparkle"], sneaky: ["smirk"], nerd: ["nerd"],
    // pack 4
    horrified: ["scared", { pale: 1 }], greedy: ["laugh", { money: 1 }], fired: ["angry", { fireEyes: 1 }], unamused: ["neutral", { dots: 1 }],
    frozen: ["shocked", { ice: 1 }], lovestruck: ["smile", { hearts: 1 }], exhausted: ["neutral", { bags: 1 }], proudTear: ["smile", { tear1: 1 }],
    possessed: ["stare", { redEyes: 1 }], hypnotized: ["neutral", { blueEyes: 1 }], annoyed: ["stare", { angerMark: 1 }], embarrassed: ["nervous", { blush: 1 }],
    smug2: ["smirk", { sparkle: 1 }], devilish: ["creepy", { redEyes: 1 }], relieved: ["smile", { sweat: 1 }], wideEyed: ["oh"],
    // pack 5
    cringe: ["squeeze", { cringeLines: 1 }], sassy: ["wink", { blush: 1 }], sick: ["sad", { sick: 1 }], champion: ["laugh", { starsLow: 1 }],
    thinking: ["stare", { thought: 1 }], touched: ["sparkle_oh", { tear1: 1 }], electrocuted: ["shocked", { zap: 1 }], snoozing: ["sleepy", { zzzMark: 1 }],
    starving: ["oh", { drool: 1 }], evilLaugh: ["laugh", { redEyes: 1 }], nervousLaugh: ["laugh", { sweat: 1 }], heartEyes: ["happy", { heartEyes: 1 }],
    volcano: ["angry", { rage: 1, steam: 1 }], petrified: ["scared", { ice: 1 }],
    focused: ["stare", { focusLines: 1 }], demonGrin: ["creepy", { fangs: 1 }], sweatDrop: ["neutral", { bigSweat: 1 }],
  };
  T.FACE_PNGS = ["angry", "blink", "content", "creepy", "cry", "dizzy", "happy", "laugh", "nerd", "nervous", "neutral", "oh", "sad", "scared", "shocked", "sleepy", "smile", "smirk", "sparkle", "sparkle_oh", "squeeze", "stare", "talk", "wink"];
  EXPR.nerd = EXPR.nerd || { eyes: "big", brows: "flat", mouth: "grin" };
  T.faceTex = (st, name) => {
    const key = JSON.stringify(st) + "|" + name;
    const pm = PNGMAP[name], usePng = pm && T.IMAGES && T.IMAGES["face_" + pm[0]];
    const ex = usePng ? Object.assign({ png: pm[0] }, pm[1] || {}) : (EXPR[name] || EXPR.smile);
    if (!faceCache.has(key)) faceCache.set(key, T.tex(drawFace(st, ex)));
    return faceCache.get(key);
  };

  // ---------------------------------------------------------------- shirt fronts
  // ---- outfits pack: extra shirt prints
  const NEWSHIRT = {
    jacket: (g, b, a) => { g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(122, 0, 12, 256); g.fillStyle = a || "#d9d9d9"; for (let y = 6; y < 256; y += 14) g.fillRect(124, y, 8, 6);
      g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(60, 0); g.lineTo(122, 0); g.lineTo(122, 70); g.closePath(); g.fill(); g.beginPath(); g.moveTo(196, 0); g.lineTo(134, 0); g.lineTo(134, 70); g.closePath(); g.fill();
      g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(40, 170, 56, 8); g.fillRect(160, 170, 56, 8); },
    jersey: (g, b, a) => { g.fillStyle = a || "#ffffff"; g.font = "bold 150px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("13", 128, 140); g.fillRect(0, 0, 256, 16); g.fillRect(0, 240, 256, 16); },
    skull: (g, b, a) => { const c = a || "#ffffff"; g.fillStyle = c; g.beginPath(); g.arc(128, 110, 58, 0, 7); g.fill(); g.fillRect(96, 140, 64, 46); g.fillStyle = b;
      g.beginPath(); g.arc(106, 110, 16, 0, 7); g.fill(); g.beginPath(); g.arc(150, 110, 16, 0, 7); g.fill(); g.beginPath(); g.moveTo(128, 128); g.lineTo(120, 146); g.lineTo(136, 146); g.closePath(); g.fill();
      for (const x of [108, 124, 140]) g.fillRect(x, 168, 6, 18); },
    flannel: (g, b, a) => { g.fillStyle = a || "rgba(0,0,0,0.35)"; for (let i = 0; i < 256; i += 48) { g.globalAlpha = 0.45; g.fillRect(i, 0, 18, 256); g.fillRect(0, i, 256, 18); } g.globalAlpha = 1;
      g.fillStyle = "rgba(255,255,255,0.25)"; for (let i = 24; i < 256; i += 48) { g.fillRect(i, 0, 3, 256); g.fillRect(0, i, 256, 3); } },
    tracksuit: (g, b, a) => { g.fillStyle = a || "#ffffff"; g.fillRect(20, 0, 14, 256); g.fillRect(40, 0, 14, 256); g.fillRect(202, 0, 14, 256); g.fillRect(222, 0, 14, 256);
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(124, 0, 8, 256); },
    heart: (g, b, a) => { g.fillStyle = a || "#ff3b6b"; g.beginPath(); g.moveTo(128, 196); g.bezierCurveTo(40, 130, 60, 50, 128, 92); g.bezierCurveTo(196, 50, 216, 130, 128, 196); g.fill(); },
    tux: (g, b, a) => { g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(76, 0); g.lineTo(180, 0); g.lineTo(128, 170); g.closePath(); g.fill();
      g.fillStyle = a || "#111111"; g.beginPath(); g.moveTo(100, 22); g.lineTo(128, 34); g.lineTo(156, 22); g.lineTo(156, 50); g.lineTo(128, 38); g.lineTo(100, 50); g.closePath(); g.fill();
      g.fillStyle = "#222"; for (const y of [80, 112, 144]) { g.beginPath(); g.arc(128, y, 6, 0, 7); g.fill(); } },
    pajama: (g, b, a) => { const r = T.rng(5); g.fillStyle = a || "#fff3a6"; for (let i = 0; i < 18; i++) { const x = r() * 256, y = r() * 256; g.beginPath();
      for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 5 : 12; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); } },
    military: (g, b, a) => { // army jacket: placket, two flap pockets, belt line, a gold rank badge, camo specks
      const r = T.rng(11); g.fillStyle = "rgba(0,0,0,0.16)"; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 18, 6 + r() * 10, r() * 3, 0, 7); g.fill(); }
      g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(124, 0, 8, 230); g.fillRect(0, 222, 256, 16);
      g.fillStyle = a || "#c9a63a"; g.fillRect(116, 222, 24, 16);
      g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 4; g.strokeRect(36, 70, 60, 56); g.strokeRect(160, 70, 60, 56);
      g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(36, 70, 60, 16); g.fillRect(160, 70, 60, 16);
      g.fillStyle = "#1a1a1a"; for (const y of [40, 100, 160]) { g.beginPath(); g.arc(128, y, 5, 0, 7); g.fill(); }
      g.fillStyle = a || "#c9a63a"; for (const x of [172, 188, 204]) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 6, 52); g.lineTo(x + 12, 40); g.lineTo(x + 6, 46); g.closePath(); g.fill(); } },
    guard: (g, b, a) => { // katana-guard uniform: high collar, white belt, a gold emblem
      g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.moveTo(80, 0); g.lineTo(128, 60); g.lineTo(176, 0); g.closePath(); g.fill();
      g.fillStyle = "#f2f2f2"; g.fillRect(0, 206, 256, 22); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(124, 0, 8, 206);
      g.fillStyle = a || "#e2b33c"; g.font = "900 60px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("\u5203", 190, 120);
      g.fillStyle = "#d4af37"; for (const y of [40, 90, 140, 180]) { g.beginPath(); g.arc(128, y, 6, 0, 7); g.fill(); } },
    logo: (g, b, a) => { g.fillStyle = "#e53935"; g.font = "900 54px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CRIMINAL", 128, 108); g.fillStyle = "#ffd23f"; g.fillText("TOWN", 128, 160); },
  };
  T.SHIRTS_EXTRA = Object.keys(NEWSHIRT);
  function shirtCanvas(kind, base, acc) {
    const c = T.canvas(256, 256), g = c.getContext("2d");
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    g.lineCap = "round";
    if (NEWSHIRT[kind]) { NEWSHIRT[kind](g, base, acc); return c; }
    if (kind === "hoodie") {
      g.fillStyle = "rgba(0,0,0,0.16)"; g.beginPath(); g.moveTo(52, 160); g.lineTo(204, 160); g.lineTo(220, 236); g.lineTo(36, 236); g.closePath(); g.fill();
      g.strokeStyle = acc || "#f5f5f5"; g.lineWidth = 9; for (const x of [104, 152]) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x - (x < 128 ? 6 : -6), 96); g.stroke(); g.fillStyle = acc || "#f5f5f5"; g.beginPath(); g.arc(x - (x < 128 ? 6 : -6), 100, 8, 0, 7); g.fill(); }
      g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.moveTo(70, 0); g.quadraticCurveTo(128, 50, 186, 0); g.fill();
    } else if (kind === "star") {
      g.fillStyle = acc || "#ffffff"; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 34 : 78; g.lineTo(128 + Math.cos(a) * r, 120 + Math.sin(a) * r); }
      g.closePath(); g.fill();
    } else if (kind === "suit") {
      g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(84, 0); g.lineTo(172, 0); g.lineTo(128, 120); g.closePath(); g.fill();
      g.fillStyle = acc || "#c0262c"; g.beginPath(); g.moveTo(118, 14); g.lineTo(138, 14); g.lineTo(146, 100); g.lineTo(128, 120); g.lineTo(110, 100); g.closePath(); g.fill();
      g.fillStyle = "#e8c14a"; for (const y of [150, 190]) { g.beginPath(); g.arc(128, y, 9, 0, 7); g.fill(); }
    } else if (kind === "coat") {
      g.fillStyle = "#c9d2db"; g.fillRect(0, 150, 256, 24); g.fillRect(0, 212, 256, 24);
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(124, 0, 8, 256);
      g.fillStyle = "#e8c14a"; g.beginPath(); g.moveTo(186, 40); g.lineTo(214, 52); g.lineTo(208, 90); g.lineTo(186, 104); g.lineTo(164, 90); g.lineTo(158, 52); g.closePath(); g.fill();
    } else if (kind === "smock") {
      const r = T.rng(11);
      for (let i = 0; i < 26; i++) { g.fillStyle = ["#ff4d6d", "#3fa7ff", "#ffd23f", "#4cd17a", "#a66bff"][i % 5]; g.beginPath(); g.ellipse(r() * 256, r() * 256, 6 + r() * 12, 5 + r() * 9, r() * 3, 0, 7); g.fill(); }
      g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(70, 170, 116, 70);
    } else if (kind === "apron") {
      g.fillStyle = "#f7f4ee"; g.beginPath(); g.moveTo(56, 40); g.lineTo(200, 40); g.lineTo(214, 256); g.lineTo(42, 256); g.closePath(); g.fill();
      g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(88, 170, 80, 50);
      g.fillStyle = "#e4dccd"; g.fillRect(56, 34, 144, 10);
    } else if (kind === "armor") {
      g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(40, 30); g.lineTo(216, 30); g.lineTo(196, 170); g.lineTo(128, 230); g.lineTo(60, 170); g.closePath(); g.fill();
      g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 6; g.stroke();
      g.fillStyle = acc || "#d6303a"; g.beginPath(); g.moveTo(128, 70); g.lineTo(150, 120); g.lineTo(128, 170); g.lineTo(106, 120); g.closePath(); g.fill();
    } else if (kind === "pajamas") {
      g.fillStyle = acc || "#ffffff"; for (let y = 10; y < 256; y += 46) for (let x = 14 + ((y / 46) % 2) * 22; x < 256; x += 44) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    } else if (kind === "stripes") {
      g.fillStyle = acc || "#ffffff"; for (let y = 18; y < 256; y += 48) g.fillRect(0, y, 256, 18);
    } else if (kind === "buttons") {
      g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(124, 0, 8, 256); g.fillStyle = acc || "#ffffff"; for (const y of [50, 110, 170, 230]) { g.beginPath(); g.arc(128, y, 9, 0, 7); g.fill(); }
    } else if (kind === "dress") {
      g.fillStyle = acc || "#ffffff"; g.beginPath(); g.moveTo(80, 0); g.quadraticCurveTo(128, 60, 176, 0); g.fill();
      g.fillStyle = "rgba(255,255,255,0.4)"; for (let x = 20; x < 256; x += 56) { g.beginPath(); g.arc(x, 200, 10, 0, 7); g.fill(); }
    }
    return c;
  }
  const shirtCache = new Map();
  const shirtTex = (kind, base, acc) => { const k = kind + base + acc; if (!shirtCache.has(k)) shirtCache.set(k, T.tex(shirtCanvas(kind, base, acc))); return shirtCache.get(k); };

  // ---------------------------------------------------------------- the rig
  const BUILDS = {
    adult: { legH: 2.0, legW: 0.92, legD: 0.95, torH: 2.0, torW: 1.95, torD: 1.0, armH: 2.0, armW: 0.85, head: 1.35 },
    tall: { legH: 2.35, legW: 0.88, legD: 0.92, torH: 2.1, torW: 1.85, torD: 0.95, armH: 2.1, armW: 0.8, head: 1.35 },
    round: { legH: 1.8, legW: 1.0, legD: 1.05, torH: 2.2, torW: 2.45, torD: 1.55, armH: 1.9, armW: 0.9, head: 1.4 },
    chonk: { legH: 1.6, legW: 1.35, legD: 1.4, torH: 2.4, torW: 4.1, torD: 3.0, armH: 1.85, armW: 1.15, head: 1.55 },
    skinny: { legH: 2.3, legW: 0.6, legD: 0.64, torH: 2.05, torW: 1.2, torD: 0.66, armH: 2.05, armW: 0.6, head: 1.35 },
    kid: { legH: 1.55, legW: 0.84, legD: 0.88, torH: 1.6, torW: 1.75, torD: 0.92, armH: 1.6, armW: 0.78, head: 1.45 },
    small: { legH: 1.05, legW: 0.72, legD: 0.78, torH: 1.2, torW: 1.45, torD: 0.85, armH: 1.15, armW: 0.66, head: 1.55 },
  };
  T.BUILDS = BUILDS;
  class Actor {
    constructor(spec) {
      this.spec = spec;
      const b = (this.b = Object.assign({}, BUILDS[spec.build || "adult"], spec.dims || {}));
      const root = (this.root = new THREE.Group());
      const body = (this.body = T.group(root, 0, b.legH, 0));
      const shirt = T.mat(spec.shirt || "#2f7de1", { r: 0.7 }), skin = T.mat(spec.skin || "#f6c79a", { r: 0.6 });
      const pants = T.mat(spec.pants || "#33384a", { r: 0.8 }), shoes = T.mat(spec.shoes || "#24262c", { r: 0.7 });
      const sleeve = T.mat(spec.sleeves || spec.shirt || "#2f7de1", { r: 0.7 });
      const metal = spec.metal ? { r: 0.42, m: 0.28 } : null;
      const shirtM = metal ? T.mat(spec.shirt, metal) : shirt;
      const front = spec.front ? new THREE.MeshStandardMaterial({ map: shirtTex(spec.front, spec.shirt || "#2f7de1", spec.frontAcc), roughness: metal ? 0.35 : 0.7, metalness: metal ? 0.6 : 0 }) : shirtM;
      this.torso = T.mesh(T.rbox(b.torW, b.torH, b.torD, 0.14), [shirtM, shirtM, shirtM, shirtM, front, shirtM], 0, b.torH / 2, 0);
      body.add(this.torso);
      if (!spec.noBelt && spec.build !== "small") body.add(T.mesh(T.rbox(b.torW * 1.01, 0.18, b.torD * 1.02, 0.05), T.mat(spec.belt || "#1a1a1f", { r: 0.6 }), 0, 0.1, 0));
      // head on a neck pivot
      this.neck = T.group(body, 0, b.torH + 0.04, 0);
      const H = b.head;
      this.faceStyle = Object.assign({ skin: spec.skin || "#f6c79a", brow: spec.hairColor || "#3b2416" }, spec.faceStyle || {});
      this.faceMat = new THREE.MeshStandardMaterial({ map: T.faceTex(this.faceStyle, "smile"), roughness: 0.6 });
      this.head = T.mesh(T.rbox(H, H, H, H * 0.24, 5), [skin, skin, skin, skin, this.faceMat, skin], 0, H / 2, 0);
      this.neck.add(this.head);
      this.headTop = T.group(this.neck, 0, H, 0);
      this._hair(spec, H);
      this._hat(spec, H);
      // arms: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand (close to the torso, Roblox-like)
      const sl = spec.shortSleeves ? b.armH * 0.35 : b.armH * 0.72;
      this.arm = {}; this.elbow = {};
      this.hand = {};
      const aD = b.armD || b.armW * 1.05, uH = b.armH / 2;
      for (const side of ["L", "R"]) {
        const sx = side === "L" ? 1 : -1;
        const sh = T.group(body, sx * (b.torW / 2 + b.armW / 2 - 0.05), b.torH - 0.12, 0);
        sh.userData.x0 = sh.position.x;
        const slM = metal ? T.mat(spec.sleeves || spec.shirt, metal) : sleeve, skM = spec.gloves ? T.mat(spec.gloves, metal || {}) : skin;
        sh.add(T.mesh(T.rbox(b.armW, uH + 0.14, aD, 0.12), sl >= uH * 0.6 ? slM : skM, 0, -uH / 2 + 0.1, 0));
        if (sl < uH * 0.6) sh.add(T.mesh(T.rbox(b.armW * 1.03, sl, aD * 1.03, 0.12), slM, 0, -sl / 2 + 0.12, 0));
        const el = T.group(sh, 0, -uH + 0.06, 0);
        const fs = Math.max(0, sl - uH);   // sleeve part on the forearm
        if (fs > 0.1) el.add(T.mesh(T.rbox(b.armW * 0.99, fs + 0.1, aD * 0.99, 0.12), slM, 0, -fs / 2 + 0.05, 0));
        const hl = uH - fs;
        el.add(T.mesh(T.rbox(b.armW * 0.96, hl + 0.1, aD * 0.96, 0.14), skM, 0, -fs - hl / 2 + 0.02, 0));
        // joint caps: the shoulder and the elbow stay closed whatever the pose (no gaps, no floating arms)
        const cap = T.mesh(T.rbox(b.armW * 0.98, b.armW * 0.92, aD * 0.98, 0.16), slM, sh.position.x - sx * 0.04, sh.position.y - 0.05, 0); body.add(cap);
        const ec = T.mesh(T.rbox(b.armW * 0.97, b.armW * 0.78, aD * 0.97, 0.2), fs > 0.1 || sl >= uH * 0.95 ? slM : skM, 0, el.position.y, 0); sh.add(ec);
        this.arm[side] = sh; this.elbow[side] = el;
        this.hand[side] = T.group(el, 0, -uH + 0.09, 0.05);
      }
      // legs: hip pivot -> thigh -> knee pivot -> shin + shoe
      this.leg = {}; this.knee = {};
      const tH = b.legH / 2;
      for (const side of ["L", "R"]) {
        const sx = side === "L" ? 1 : -1;
        const pM = metal ? T.mat(spec.pants, metal) : pants;
        const hp = T.group(body, sx * (b.legW / 2 + 0.02), 0.02, 0);
        hp.add(T.mesh(T.rbox(b.legW, tH + 0.12, b.legD, 0.12), pM, 0, -tH / 2 + 0.04, 0));
        const kn = T.group(hp, 0, -tH, 0);
        kn.add(T.mesh(T.rbox(b.legW * 0.98, tH - 0.2, b.legD * 0.98, 0.12), pM, 0, -(tH - 0.3) / 2, 0));
        kn.add(T.mesh(T.rbox(b.legW * 1.04, 0.36, b.legD * 1.12, 0.12), shoes, 0, -tH + 0.18, 0.05));
        kn.add(T.mesh(T.rbox(b.legW * 1.08, 0.1, b.legD * 1.16, 0.04), T.mat(spec.sole || "#f4f4f4", { r: 0.7 }), 0, -tH + 0.05, 0.05));
        hp.add(T.mesh(T.rbox(b.legW * 0.97, b.legW * 0.7, b.legD * 0.97, 0.18), pM, 0, kn.position.y, 0)); // knee cap
        this.leg[side] = hp; this.knee[side] = kn;
      }
      this._extras(spec);
      if (this.faceStyle.glasses) {   // real frames in front of the face (a drawn pair would cut through the picture eyes)
        const gs = T.group(this.neck, 0, H * 0.615, H / 2 + 0.035), fr = T.mat(this.faceStyle.glasses, { r: 0.35, m: 0.3 });
        const lens = new THREE.MeshStandardMaterial({ color: "#cfe8ff", transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2, depthWrite: false });
        for (const sx of [-1, 1]) { const ring = T.mesh(new THREE.TorusGeometry(H * 0.15, 0.035, 6, 20), fr, sx * H * 0.18, 0, 0.01); gs.add(ring); gs.add(T.mesh(new THREE.CircleGeometry(H * 0.14, 20), lens, sx * H * 0.18, 0, 0.005));
          gs.add(T.mesh(T.rbox(0.035, 0.035, H * 0.5, 0.01), fr, sx * H * 0.49, 0.02, -H * 0.24)); }
        gs.add(T.mesh(T.rbox(H * 0.08, 0.035, 0.035, 0.01), fr, 0, 0.03, 0.01)); this.glasses3d = gs;
      }
      T.shadowAll(root);
      // contact shadow: a soft dark oval on the ground under the feet, so nobody hovers (blocky-shorts rule)
      if (!T._blobTex) {
        const c = T.canvas(128, 128), g = c.getContext("2d");
        const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.5, "rgba(0,0,0,0.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128); T._blobTex = new THREE.CanvasTexture(c);
      }
      this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: T._blobTex, color: "#0e1508", transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      this.blob.rotation.x = -Math.PI / 2; this.blob.renderOrder = 2;
      this.blob.scale.set(Math.max(b.torW * 1.25, b.legW * 2.6), b.legD * 2.8, 1); this.blob.position.y = 0.03;
      root.add(this.blob); this._blobS = [this.blob.scale.x, this.blob.scale.y];
      this.seed = spec.seed || 1;
      this.expr = "smile";
    }
    _hair(spec, H) {
      const hc = T.mat(spec.hairColor || "#3b2416", { r: 0.85 });
      const st = spec.hair || "short", top = this.neck;
      if (st === "bald") return;
      const add = (g, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = T.mesh(g, hc, x, y, z); m.rotation.set(rx, ry, rz); top.add(m); return m; };
      add(T.rbox(H + 0.14, H * 0.34, H + 0.14, 0.14), 0, H * 0.94, -0.02);
      add(T.rbox(H + 0.1, H * 0.62, 0.24, 0.1), 0, H * 0.62, -H / 2 - 0.06);
      if (st === "messy" || st === "spiky") {
        const r = T.rng(spec.seed || 3);
        for (let i = 0; i < 7; i++) { const s = 0.32 + r() * 0.18; add(T.rbox(s, s * 1.3, s, 0.08), (r() - 0.5) * H * 0.9, H * 1.08 + r() * 0.1, (r() - 0.6) * H * 0.8, (r() - 0.5) * 0.9, r() * 3, (r() - 0.5) * 0.9); }
        add(T.rbox(H * 0.5, 0.26, 0.3, 0.08), H * 0.18, H * 0.86, H / 2 + 0.03, 0.2, 0, -0.25);
      }
      if (st === "fringe") add(T.rbox(H + 0.12, 0.34, 0.26, 0.1), 0, H * 0.84, H / 2 + 0.02, 0.15);
      if (st === "long" || st === "pony" || st === "bun") {
        add(T.rbox(H + 0.12, 0.3, 0.26, 0.1), -H * 0.18, H * 0.86, H / 2 + 0.02, 0.15, 0, 0.12);
        add(T.rbox(0.24, H * 0.8, H * 0.7, 0.08), H / 2 + 0.07, H * 0.55, -0.12);
        add(T.rbox(0.24, H * 0.8, H * 0.7, 0.08), -H / 2 - 0.07, H * 0.55, -0.12);
      }
      if (st === "long") add(T.rbox(H + 0.12, H * 1.25, 0.3, 0.12), 0, H * 0.3, -H / 2 - 0.1);
      if (st === "pony") { const p = add(T.rbox(0.42, H * 0.95, 0.42, 0.18), 0, H * 0.45, -H / 2 - 0.36, 0.35); p.userData.pony = 1; }
      if (st === "bun") add(T.sph(H * 0.3), 0, H * 1.18, -H * 0.18);
      if (st === "curly") { const r = T.rng(9); for (let i = 0; i < 12; i++) add(T.sph(0.3 + r() * 0.12, 10, 8), (r() - 0.5) * H * 1.05, H * (0.85 + r() * 0.3), (r() - 0.55) * H, 0, 0, 0); }
    }
    _hat(spec, H) {
      const top = this.neck, kind = spec.hat;
      if (!kind) return;
      const g = T.group(top, 0, H * 0.98, 0);
      this.hatG = g;
      const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = T.mesh(geo, mat, x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
      if (kind === "top") {
        const k = T.mat("#1b1c22", { r: 0.5 });
        add(T.cyl(H * 0.72, H * 0.72, 0.1, 24), k, 0, 0.05, 0);
        add(T.cyl(H * 0.44, H * 0.46, H * 0.95, 24), k, 0, H * 0.52, 0);
        add(T.cyl(H * 0.465, H * 0.465, 0.2, 24), T.mat("#e2b33c", { r: 0.4, m: 0.4 }), 0, 0.2, 0);
      } else if (kind === "helmet") {
        const red = T.mat("#d82a2a", { r: 0.35 });
        const dome = add(new THREE.SphereGeometry(H * 0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), red, 0, -0.08, 0);
        dome.scale.set(1, 0.85, 1.05);
        const br = add(T.cyl(H * 0.86, H * 0.86, 0.08, 28), red, 0, -0.06, -0.12); br.scale.set(1, 1, 1.2);
        add(T.rbox(0.46, 0.5, 0.08, 0.04), T.mat("#f0c23a", { r: 0.35, m: 0.5 }), 0, 0.28, H * 0.6, -0.25);
      } else if (kind === "beret") {
        const m = T.mat(spec.hatColor || "#7a2fbf", { r: 0.8 });
        const b = add(T.sph(H * 0.62, 20, 10), m, 0.12, 0.02, 0, 0, 0, -0.22); b.scale.set(1.08, 0.32, 1.04);
        add(T.cyl(0.05, 0.08, 0.2, 8), m, 0.1, 0.24, 0);
      } else if (kind === "chef") {
        const w = T.mat("#ffffff", { r: 0.9 });
        add(T.cyl(H * 0.5, H * 0.5, H * 0.5, 20), w, 0, H * 0.18, 0);
        const p = add(T.sph(H * 0.62, 20, 12), w, 0, H * 0.62, 0); p.scale.set(1, 0.7, 1);
      } else if (kind === "cap") {
        const m = T.mat(spec.hatColor || "#e23b3b", { r: 0.6 });
        const d = add(new THREE.SphereGeometry(H * 0.6, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, -0.12, 0); d.scale.set(1.05, 0.7, 1.05);
        add(T.rbox(H * 0.9, 0.08, H * 0.6, 0.03), m, 0, -0.08, H * 0.6, -0.08);
      } else if (kind === "knight") {
        const s = T.mat("#d3d9e2", { r: 0.4, m: 0.28 });
        add(T.rbox(H + 0.24, H * 0.42, H + 0.24, 0.2), s, 0, -0.08, -0.02);
        add(T.rbox(0.18, H * 0.95, H + 0.2, 0.06), s, H / 2 + 0.11, -H * 0.42, -0.02);
        add(T.rbox(0.18, H * 0.95, H + 0.2, 0.06), s, -H / 2 - 0.11, -H * 0.42, -0.02);
        add(T.rbox(H + 0.2, H * 0.95, 0.18, 0.06), s, 0, -H * 0.42, -H / 2 - 0.1);
        add(T.rbox(0.16, H * 0.5, 0.16, 0.05), s, 0, -H * 0.2, H / 2 + 0.1);
        const plume = add(T.rbox(0.3, 1.3, 0.5, 0.14), T.mat("#d62839", { r: 0.8 }), 0, 0.7, -0.35, -0.45);
        this.plume = plume;
      } else if (kind === "hoodUp") {   // a hood: closed crown, sides and back; the front stays open so the face reads
        const m = T.mat(spec.hatColor || "#0d0d10", { r: 0.85, side: THREE.DoubleSide });
        const R = H * 0.76;
        const crown = add(new THREE.SphereGeometry(R, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.3), m, 0, -H * 0.3, -0.05); crown.scale.set(1.02, 1.05, 1.06);
        const sides = add(new THREE.SphereGeometry(R, 24, 10, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, Math.PI * 0.3, Math.PI * 0.32), m, 0, -H * 0.3, -0.05); sides.scale.set(1.02, 1.05, 1.06);
        add(T.rbox(H * 1.15, H * 0.7, 0.16, 0.06), m, 0, -H * 0.85, -H * 0.55);
      } else if (kind === "horns") {    // demon horns, bent outward
        const m = T.mat(spec.hatColor || "#1a0a0a", { r: 0.35, m: 0.2 });
        for (const sx of [-1, 1]) { const h = add(new THREE.ConeGeometry(0.24, H * 0.85, 12), m, sx * H * 0.36, H * 0.22, 0.05, 0, 0, -sx * 0.5); h.scale.set(1, 1, 0.85); }
      } else if (kind === "officer") {   // peaked army/officer cap: flat top, band, glossy visor, gold badge
        const m = T.mat(spec.hatColor || "#15171a", { r: 0.55 });
        add(T.cyl(H * 0.5, H * 0.56, H * 0.3, 24), m, 0, H * 0.06, 0);
        const top = add(T.cyl(H * 0.7, H * 0.58, H * 0.16, 28), m, 0, H * 0.27, -0.04); top.scale.set(1, 1, 1.06);
        add(T.cyl(H * 0.565, H * 0.565, H * 0.1, 24), T.mat(spec.hatAcc || "#2a2c30", { r: 0.4 }), 0, H * 0.0, 0);
        add(T.rbox(H * 0.86, 0.06, H * 0.42, 0.03), T.mat("#0b0b0c", { r: 0.15, m: 0.3 }), 0, -0.06, H * 0.6, -0.22);
        add(T.cyl(0.13, 0.13, 0.05, 6), T.mat("#e2b33c", { r: 0.3, m: 0.6 }), 0, H * 0.16, H * 0.56, Math.PI / 2);
      } else if (kind === "beanie") {
        const m = T.mat(spec.hatColor || "#2f6fe0", { r: 0.95 });
        const d = add(new THREE.SphereGeometry(H * 0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, -0.18, 0); d.scale.set(1.04, 0.95, 1.04);
        add(T.cyl(H * 0.64, H * 0.64, 0.34, 24), T.mat(spec.hatAcc || "#ffffff", { r: 0.95 }), 0, -0.08, 0);
        add(T.sph(0.26, 12, 8), T.mat(spec.hatAcc || "#ffffff", { r: 0.95 }), 0, H * 0.52, 0);
      } else if (kind === "cowboy") {
        const m = T.mat(spec.hatColor || "#8a5a2b", { r: 0.8 });
        const br = add(T.cyl(H * 1.0, H * 1.0, 0.1, 28), m, 0, 0.02, 0); br.scale.set(1, 1, 0.85);
        add(T.cyl(H * 0.42, H * 0.5, H * 0.62, 20), m, 0, H * 0.32, 0);
        add(T.cyl(H * 0.505, H * 0.505, 0.14, 20), T.mat("#2a1a10"), 0, 0.12, 0);
      } else if (kind === "party") {
        add(new THREE.ConeGeometry(H * 0.36, H * 0.95, 20), T.mat(spec.hatColor || "#ff4fa3", { r: 0.6 }), 0.1, H * 0.42, 0, 0, 0, -0.15);
        add(T.sph(0.2, 10, 8), T.mat("#ffd23f"), 0.25, H * 0.92, 0);
      } else if (kind === "headphones") {
        const m = T.mat(spec.hatColor || "#e53935", { r: 0.4 });
        const band = add(new THREE.TorusGeometry(H * 0.62, 0.09, 8, 24, Math.PI), m, 0, -H * 0.1, 0); band.rotation.set(0, Math.PI / 2, 0);
        for (const sx of [-1, 1]) add(T.rbox(0.26, H * 0.44, H * 0.4, 0.08), m, sx * (H * 0.55), -H * 0.42, 0);
      } else if (kind === "bandana") {
        const m = T.mat(spec.hatColor || "#e53935", { r: 0.8 });
        const d = add(new THREE.SphereGeometry(H * 0.6, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, -0.14, 0); d.scale.set(1.04, 0.5, 1.04);
        add(T.rbox(0.3, 0.5, 0.12, 0.05), m, 0.25, -0.3, -H * 0.58, 0.3); add(T.rbox(0.3, 0.5, 0.12, 0.05), m, -0.15, -0.35, -H * 0.58, -0.3);
      } else if (kind === "capBack") {
        const m = T.mat(spec.hatColor || "#e23b3b", { r: 0.6 });
        const d = add(new THREE.SphereGeometry(H * 0.6, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, -0.12, 0); d.scale.set(1.05, 0.7, 1.05);
        add(T.rbox(H * 0.9, 0.08, H * 0.6, 0.03), m, 0, -0.08, -H * 0.6, 0.08);
      } else if (kind === "halo") {
        const h = add(new THREE.TorusGeometry(H * 0.42, 0.08, 8, 28), T.mat("#ffe680", { r: 0.2 }), 0, H * 0.5, 0); h.rotation.x = Math.PI / 2;
        h.material.emissive = new THREE.Color("#ffd23f"); h.material.emissiveIntensity = 0.8;
      } else if (kind === "crown") {
        const gold = T.mat("#f2c230", { r: 0.3, m: 0.7 });
        add(T.cyl(H * 0.5, H * 0.5, 0.36, 6, 1), gold, 0, 0.18, 0);
      }
    }
    _extras(spec) {
      const ex = spec.extras || [];
      const b = this.b;
      for (const e of ex) {
        if (e === "sash") { const m = T.mesh(T.rbox(0.42, b.torH * 1.45, 0.08, 0.03), T.mat("#c8202a", { r: 0.5 }), 0, b.torH / 2, b.torD / 2 + 0.05); m.rotation.z = 0.62; this.body.add(m); const m2 = T.mesh(T.rbox(0.18, b.torH * 1.45, 0.09, 0.03), T.mat("#f0c23a", { r: 0.4, m: 0.4 }), 0, b.torH / 2, b.torD / 2 + 0.06); m2.rotation.z = 0.62; this.body.add(m2); }
        if (e === "shades") {   // 3D sunglasses with a blue mirror tint; p.shades === false hides them for a shot
          const H = b.head, gs = T.group(this.neck, 0, H * 0.6, H / 2 + 0.05), fr = T.mat("#0c0c0e", { r: 0.3, m: 0.4 }), le = T.mat(spec.lens || "#1d6fe0", { r: 0.08, m: 0.75 });
          for (const sx of [-1, 1]) { gs.add(T.mesh(T.rbox(H * 0.36, H * 0.2, 0.05, 0.04), le, sx * H * 0.21, 0, 0.02)); gs.add(T.mesh(T.rbox(H * 0.4, 0.05, 0.06, 0.02), fr, sx * H * 0.21, H * 0.11, 0.02));
            gs.add(T.mesh(T.rbox(0.04, 0.05, H * 0.5, 0.02), fr, sx * H * 0.5, H * 0.08, -H * 0.24)); }
          gs.add(T.mesh(T.rbox(H * 0.1, 0.05, 0.06, 0.02), fr, 0, H * 0.05, 0.03)); this.shades = gs;
        }
        if (e === "bowtie") { const m = T.mesh(T.rbox(0.7, 0.32, 0.12, 0.06), T.mat("#d02a3a", { r: 0.5 }), 0, b.torH - 0.12, b.torD / 2 + 0.06); this.body.add(m); }
        if (e === "hood") { const m = T.mesh(T.rbox(b.torW * 0.78, 0.7, 0.42, 0.18), T.mat(spec.shirt, { r: 0.7 }), 0, b.torH - 0.08, -b.torD / 2 - 0.14); m.rotation.x = -0.25; this.body.add(m); }
        if (e === "cape") { const m = T.mesh(T.rbox(b.torW * 1.05, b.torH + b.legH * 0.7, 0.1, 0.04), T.mat("#c42032", { r: 0.8 }), 0, b.torH - (b.torH + b.legH * 0.7) / 2, -b.torD / 2 - 0.12); m.rotation.x = 0.06; this.body.add(m); this.cape = m; }
        if (e === "belt") { const m = T.mesh(T.rbox(b.torW + 0.06, 0.24, b.torD + 0.06, 0.06), T.mat("#3a2a1c", { r: 0.6 }), 0, 0.14, 0); this.body.add(m); }
        if (e === "chain") {
          // a chain that hangs from the neck and lies on the chest (a U, not a ring standing in front)
          const gold = T.mat("#f2c230", { r: 0.25, m: 0.75 }), r = Math.min(0.5, b.torW * 0.26);
          const m = T.mesh(new THREE.TorusGeometry(r, 0.055, 6, 24, Math.PI), gold, 0, b.torH - 0.04, b.torD / 2 + 0.035); m.rotation.z = Math.PI; m.scale.set(1, 1.25, 0.25); this.body.add(m);
          const pend = T.mesh(T.rbox(0.26, 0.3, 0.08, 0.05), gold, 0, b.torH - 0.04 - r * 1.25 - 0.12, b.torD / 2 + 0.06); this.body.add(pend);
        }
      }
    }
    face(name) {
      if (name && name !== this.expr) { this.faceMat.map = T.faceTex(this.faceStyle, name); this.faceMat.needsUpdate = true; this.expr = name; }
      return this;
    }
    // p: {x,y,z, ry, s, walk, run, armL, armR, legL, legR, head:[nod, turn, tilt], lean:[fwd, side], face, bob, jump, blink:false}
    set(p, time) {
      const r = this.root, b = this.b;
      r.visible = true;
      r.position.set(p.x || 0, (p.y || 0) + (p.jump || 0), p.z || 0);
      r.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      const s = p.s ?? 1;
      r.scale.set(s, s * (p.squash ?? 1), s);
      let aL = [0, 0.06], aR = [0, 0.06], lL = [0, 0], lR = [0, 0], bob = 0, lean = p.lean || [0, 0];
      let eL = null, eR = null, kL = 0, kR = 0, twist = p.twist || 0;
      const tm = (time ?? 0), sd = this.seed;
      if (p.walk !== undefined && p.walk !== null) {
        const ph = p.walk, A = p.run ? 1.15 : p.amp ?? 0.62, A2 = p.run ? 1.25 : (p.amp ?? 0.62) * 0.95;
        lL = [A * Math.sin(ph), 0]; lR = [-A * Math.sin(ph), 0];
        aL = [-A2 * Math.sin(ph), 0.08]; aR = [A2 * Math.sin(ph), 0.08];
        const K = p.run ? 1.7 : 0.95;
        kL = K * Math.max(0, Math.cos(ph)) + (p.run ? 0.25 : 0.08); kR = K * Math.max(0, -Math.cos(ph)) + (p.run ? 0.25 : 0.08);
        eL = p.run ? 1.35 : 0.3 + 0.35 * Math.max(0, -Math.sin(ph)); eR = p.run ? 1.35 : 0.3 + 0.35 * Math.max(0, Math.sin(ph));
        bob = Math.abs(Math.cos(ph)) * (p.run ? 0.34 : 0.16);
        twist += (p.run ? 0.16 : 0.09) * Math.sin(ph);
        if (p.run) lean = [lean[0] + 0.26, lean[1]];
      } else if (!p.still) {
        bob = 0; twist += 0.07 * Math.sin(tm * 1.1 + sd) + 0.03 * Math.sin(tm * 2.7 + sd * 3); // weight shift
        // a livelier idle: arms sway, weight shifts
        aL = [0.07 * Math.sin(tm * 1.7 + sd), 0.07 + 0.02 * Math.sin(tm * 2.1 + sd)]; aR = [0.07 * Math.sin(tm * 1.7 + sd + 2), 0.07 + 0.02 * Math.sin(tm * 2.3 + sd)];
        if (!p.lean) lean = [0.015 * Math.sin(tm * 1.3 + sd), 0.02 * Math.sin(tm * 0.9 + sd * 2)];
      }
      if (p.armL) aL = p.armL; if (p.armR) aR = p.armR;
      if (p.legL) { lL = p.legL; kL = 0; } if (p.legR) { lR = p.legR; kR = 0; }
      // elbows: explicit (p.elbL / 4th value of the arm), else a natural bend that follows how far the arm is raised
      const autoE = (a) => { const r = Math.abs(a[0]); return r > 2.2 ? 0.28 : 0.14 + 0.5 * Math.min(1, r / 1.3); };
      if (p.armL || eL === null) eL = p.elbL ?? aL[3] ?? autoE(aL);
      if (p.armR || eR === null) eR = p.elbR ?? aR[3] ?? autoE(aR);
      if (p.kneeL !== undefined) kL = p.kneeL; if (p.kneeR !== undefined) kR = p.kneeR;
      this.arm.L.rotation.set(-aL[0], 0, aL[1]); this.arm.R.rotation.set(-aR[0], 0, -aR[1]);
      // an arm raised sideways also moves out from the shoulder, so its top never cuts into the torso
      this.arm.L.position.x = this.arm.L.userData.x0 + 0.1 * b.armW * Math.abs(Math.sin(aL[1] || 0));
      this.arm.R.position.x = this.arm.R.userData.x0 - 0.1 * b.armW * Math.abs(Math.sin(aR[1] || 0));
      if (aL[2]) this.arm.L.rotation.y = aL[2]; if (aR[2]) this.arm.R.rotation.y = -aR[2];
      this.elbow.L.rotation.x = -eL; this.elbow.R.rotation.x = -eR;
      this.leg.L.rotation.set(-lL[0], 0, lL[1] || 0); this.leg.R.rotation.set(-lR[0], 0, -(lR[1] || 0));
      this.knee.L.rotation.x = kL; this.knee.R.rotation.x = kR;
      // keep the feet on the ground: a positive bob becomes a knee dip, never a float
      const dip = Math.max(0, p.bob || 0) * 3.2;
      if (dip && !p._sit) { kL += dip; kR += dip; lL = [lL[0] + dip / 2, lL[1]]; lR = [lR[0] + dip / 2, lR[1]]; this.leg.L.rotation.x = -lL[0]; this.leg.R.rotation.x = -lR[0]; this.knee.L.rotation.x = kL; this.knee.R.rotation.x = kR; }
      if (p._sit || p.still) this.body.position.y = b.legH + bob + Math.min(0, p.bob || 0);
      else {
        const tH = b.legH / 2, ext = (l, k) => tH * Math.cos(l) * Math.cos(this.leg.L.rotation.z || 0) + tH * Math.cos(k - l);
        const flight = p.run ? Math.abs(Math.cos(p.walk || 0)) * 0.12 : 0;
        this.body.position.y = Math.max(ext(lL[0], kL), ext(lR[0], kR)) + flight;
      }
      this.body.rotation.set(lean[0], twist, -lean[1]);
      if (this.blob) {   // the contact shadow stays on the ground: shrinks and fades as he jumps, softer when sitting
        const up = Math.max(0, (p.jump || 0) + (this.body.position.y - b.legH) * 0.5), k = 1 / (1 + up * 0.25);
        this.blob.position.y = 0.03 - (p.jump || 0) / Math.max(0.01, s);
        this.blob.scale.set(this._blobS[0] * k, this._blobS[1] * k, 1);
        this.blob.material.opacity = (p._sit ? 0.28 : 0.5) * Math.max(0.15, 1 - up * 0.18);
        this.blob.visible = !(p.rx || p.rz) && !p.noBlob;
      }
      const h = p.head || (p.still ? [0, 0, 0] : [0.05 * Math.sin(tm * 1.9 + sd), 0.16 * Math.sin(tm * 0.85 + sd * 2), 0.06 * Math.sin(tm * 1.3 + sd)]);
      this.neck.rotation.set(h[0], h[1] || 0, h[2] || 0);
      if (this.shades) this.shades.visible = p.shades !== false;
      // breathing: the chest rises a little; a cape trails and flutters, more when moving
      if (!p.still) { const br = Math.sin(tm * 2.4 + sd * 1.7); this.body.scale.set(1 + 0.008 * br, 1 + 0.012 * br, 1 + 0.018 * br); } else this.body.scale.set(1, 1, 1);
      if (this.cape) { const mv = p.walk !== undefined && p.walk !== null; this.cape.rotation.x = 0.06 + (mv ? (p.run ? 0.55 : 0.28) : 0.03) + (mv ? 0.12 : 0.05) * Math.abs(Math.sin(tm * (mv ? 9 : 2.2) + sd)); }
      if (this.plume) this.plume.rotation.x = -0.45 + 0.08 * Math.sin((time ?? 0) * 7);
      let ex = p.face || "smile";
      // automatic blinks: about every 3.3 s, 0.12 s long
      if (p.blink !== false && BLINKABLE.has(ex) && time !== undefined) {
        const ph = (time + this.seed * 1.37) % 3.3;
        if (ph < 0.12) ex = "blink";
      }
      this.face(ex);
      return this;
    }
  }
  T.Actor = Actor;

  // ---------------------------------------------------------------- pose helpers (return arm/leg values for set())
  const PO = (T.PO = {});
  PO.wave = (t, side = "R", f = 9) => ({ ["arm" + side]: [0.25, 2.55 + 0.32 * Math.sin(t * f)] });
  PO.cheer = (t, f = 7) => ({ armL: [0.3, 2.7 + 0.18 * Math.sin(t * f)], armR: [0.3, 2.7 + 0.18 * Math.sin(t * f + 1)] });
  PO.shock = () => ({ armL: [0.5, 2.3], armR: [0.5, 2.3] });
  PO.point = (side = "R", up = 0) => ({ ["arm" + side]: [1.5 + up, 0.12] });
  PO.hold = (h = 1.15, spread = 0.12) => ({ armL: [h, spread], armR: [h, spread] });
  PO.shrug = () => ({ armL: [0.7, 0.75], armR: [0.7, 0.75], head: [0, 0, 0.18] });
  PO.drawWall = (t, side = "R", h = 2.1, f = 11) => ({ ["arm" + side]: [h + 0.16 * Math.sin(t * f), 0.18 + 0.18 * Math.cos(t * f * 0.9)] });
  PO.drawDesk = (t, side = "R", f = 13) => ({ ["arm" + side]: [1.05 + 0.08 * Math.sin(t * f), 0.12 + 0.1 * Math.cos(t * f * 1.2)] });
  PO.rub = (t, side = "R", h = 2.0, f = 16) => ({ ["arm" + side]: [h + 0.06 * Math.sin(t * f * 0.5), 0.1 + 0.32 * Math.sin(t * f)] });
  PO.hips = () => ({ armL: [-0.15, 0.42], armR: [-0.15, 0.42] });
  PO.sit = (k = 1) => ({ legL: [1.5 * k, 0.05], legR: [1.5 * k, 0.05], kneeL: 1.5 * k, kneeR: 1.5 * k, armL: [0.55, 0.1, 0, 0.9], armR: [0.55, 0.1, 0, 0.9] });
  PO.fist = (side = "R") => ({ ["arm" + side]: [2.9, 0.15] });
  PO.presentL = () => ({ armL: [0.9, 0.9] });
  PO.presentR = () => ({ armR: [0.9, 0.9] });
  PO.both = (a, b) => Object.assign({}, a, b);

  // ---------------------------------------------------------------- the cast (shared actors, shown per shot)
  T.CAST = {};
  const SPECS = (T.SPECS = {
    me: { build: "kid", shirt: "#3cb371", front: "hoodie", frontAcc: "#f4f4f4", pants: "#2f4f8f", shoes: "#f2f2f2", skin: "#f3c49b", hair: "messy", hairColor: "#5a3420", extras: ["hood"], faceStyle: { freckles: 1 }, seed: 2 },
    theo: { build: "small", shirt: "#ffc93c", front: "star", frontAcc: "#ff7a3c", pants: "#3d6fd6", shoes: "#d83a3a", skin: "#f6cfa5", hair: "fringe", hairColor: "#8a5528", faceStyle: { blush: 1 }, seed: 5 },
    theoPj: { build: "small", shirt: "#8fb8ff", front: "pajamas", frontAcc: "#ffffff", pants: "#8fb8ff", shoes: "#8fb8ff", skin: "#f6cfa5", hair: "fringe", hairColor: "#8a5528", faceStyle: { blush: 1 }, seed: 5 },
    mayor: { build: "round", shirt: "#2b2f45", front: "suit", frontAcc: "#c0262c", sleeves: "#2b2f45", pants: "#2b2f45", skin: "#f0bf96", hair: "short", hairColor: "#8d8d8d", hat: "top", extras: ["sash"], faceStyle: { mustache: "#6b6b6b", brow: "#6b6b6b" }, seed: 7 },
    chief: { build: "adult", shirt: "#f3c432", front: "coat", sleeves: "#f3c432", pants: "#2c2c34", skin: "#c98a5e", hair: "short", hairColor: "#2a1a10", hat: "helmet", faceStyle: { mustache: "#2a1a10" }, seed: 9 },
    teacher: { build: "tall", shirt: "#f0e6d6", front: "smock", sleeves: "#2e9e8f", pants: "#3a3a48", skin: "#f5d0b0", hair: "bun", hairColor: "#d9822b", hat: "beret", hatColor: "#7a2fbf", faceStyle: { glasses: "#1d1a22", lashes: 1, blush: 1 }, seed: 11 },
    baker: { build: "round", shirt: "#f7f4ee", front: "apron", sleeves: "#f7f4ee", pants: "#5a6170", skin: "#e8b48c", hair: "short", hairColor: "#3b2416", hat: "chef", faceStyle: { mustache: "#3b2416", blush: 1 }, seed: 13 },
    girl: { build: "kid", shirt: "#ff6fae", front: "dress", frontAcc: "#ffffff", pants: "#ff6fae", shoes: "#ffffff", skin: "#8d5a3b", hair: "pony", hairColor: "#1f130c", faceStyle: { blush: 1, ink: "#1d1a22" }, seed: 15 },
    girlPj: { build: "kid", shirt: "#c9a8ff", front: "pajamas", frontAcc: "#ffffff", pants: "#c9a8ff", shoes: "#c9a8ff", skin: "#8d5a3b", hair: "pony", hairColor: "#1f130c", faceStyle: { blush: 1 }, seed: 15 },
    boy: { build: "kid", shirt: "#ff8a3d", front: "stripes", frontAcc: "#ffffff", pants: "#2f3a56", skin: "#f1c27d", hair: "short", hairColor: "#e0b04a", hat: "cap", hatColor: "#2f6fe0", seed: 17 },
    knight: { build: "tall", shirt: "#c9d0da", front: "armor", frontAcc: "#d62839", sleeves: "#c9d0da", pants: "#b8c0cc", shoes: "#8a929e", gloves: "#a9b1bd", metal: 1, skin: "#f3c9a6", hair: "bald", hat: "knight", extras: ["cape", "belt"], faceStyle: { brow: "#7a4a22" }, seed: 19 },
    shop: { build: "adult", shirt: "#6a4bc4", front: "buttons", pants: "#3a3a48", skin: "#f0c8a0", hair: "curly", hairColor: "#c0c0c0", faceStyle: { glasses: "#7a5230" }, extras: ["bowtie"], seed: 21 },
    jeweler: { build: "tall", shirt: "#1f1f28", front: "suit", frontAcc: "#e2b33c", sleeves: "#1f1f28", pants: "#1f1f28", skin: "#d9a37c", hair: "short", hairColor: "#111", extras: ["chain"], faceStyle: { mustache: "#111" }, seed: 23 },
  });
  // townsfolk for crowds: varied outfits, all our own designs
  const FOLK = [
    { shirt: "#e84a5f", front: "buttons", pants: "#2e3a59", skin: "#f1c27d", hair: "short", hairColor: "#2a1a10" },
    { shirt: "#4aa3e8", front: "stripes", pants: "#3a3a48", skin: "#8d5a3b", hair: "curly", hairColor: "#141414" },
    { shirt: "#9b59b6", front: "dress", pants: "#9b59b6", skin: "#f5d0b0", hair: "long", hairColor: "#e0b04a", faceStyle: { blush: 1 } },
    { shirt: "#27ae60", front: "hoodie", pants: "#34495e", skin: "#c98a5e", hair: "spiky", hairColor: "#1a1a1a", extras: ["hood"] },
    { shirt: "#f39c12", front: "buttons", pants: "#5d4037", skin: "#e8b48c", hair: "bald", hairColor: "#555", faceStyle: { mustache: "#5a3a22" }, build: "round" },
    { shirt: "#1abc9c", front: "star", pants: "#2c3e50", skin: "#f6cfa5", hair: "pony", hairColor: "#8a2b1a", build: "kid" },
    { shirt: "#e67e22", front: "stripes", frontAcc: "#ffe9c8", pants: "#3d3d3d", skin: "#a0673f", hair: "bun", hairColor: "#2a1a10", faceStyle: { glasses: "#222" } },
    { shirt: "#3498db", front: "coat", pants: "#2d3436", skin: "#f1c27d", hair: "short", hairColor: "#7a4a22", hat: "cap", hatColor: "#e74c3c" },
    { shirt: "#d35400", front: "hoodie", pants: "#283747", skin: "#f3c49b", hair: "messy", hairColor: "#c96a2b", build: "kid", extras: ["hood"] },
    { shirt: "#8e44ad", front: "suit", frontAcc: "#2e86de", pants: "#1c2833", skin: "#6b4226", hair: "short", hairColor: "#111" },
    { shirt: "#ff8fab", front: "dress", frontAcc: "#ffffff", pants: "#ff8fab", skin: "#f1c27d", hair: "bun", hairColor: "#7a4a22", faceStyle: { blush: 1 } },
    { shirt: "#16a085", front: "buttons", pants: "#34495e", skin: "#8d5a3b", hair: "short", hairColor: "#141414", hat: "cap", hatColor: "#f1c40f" },
    { shirt: "#c0392b", front: "stripes", frontAcc: "#ffffff", pants: "#2c3e50", skin: "#f5d0b0", hair: "curly", hairColor: "#e0b04a", build: "kid" },
    { shirt: "#2c3e50", front: "coat", pants: "#2d3436", skin: "#c98a5e", hair: "bald", hairColor: "#555", faceStyle: { mustache: "#ddd", brow: "#ddd" }, build: "round" },
    { shirt: "#f1c40f", front: "star", frontAcc: "#e67e22", pants: "#2980b9", skin: "#f6cfa5", hair: "long", hairColor: "#2a1a10", build: "kid", faceStyle: { blush: 1 } },
    { shirt: "#7f8c8d", front: "hoodie", pants: "#2c3e50", skin: "#a0673f", hair: "messy", hairColor: "#1a1a1a", extras: ["hood"] },
  ];
  T.onBoot(() => {
    for (const [k, sp] of Object.entries(SPECS)) { const a = new Actor(sp); a.id = k; T.scene.add(a.root); T.reg(a.root); T.CAST[k] = a; }
    T.FOLK = FOLK.map((sp, i) => { const a = new Actor(Object.assign({ build: "adult", seed: 30 + i }, sp)); a.id = "folk" + i; T.scene.add(a.root); T.reg(a.root); return a; });
  });
  // pose a crowd of townsfolk from a list of {x,z,ry,face,...}
  T.crowd = (list, time) => list.forEach((p, i) => T.FOLK[(p.i ?? i) % T.FOLK.length].set(p, time));

  // ---------------------------------------------------------------- dogs
  class Dog {
    constructor(o = {}) {
      const coat = T.mat(o.coat || "#c8874a", { r: 0.75 }), dark = T.mat(o.ears || "#7e4a22", { r: 0.8 }), white = T.mat(o.patch || "#fbf3e6", { r: 0.8 });
      const root = (this.root = new THREE.Group());
      const body = (this.body = T.group(root, 0, 1.55, 0));
      body.add(T.mesh(T.rbox(1.35, 1.2, 2.5, 0.3), coat, 0, 0, 0));
      body.add(T.mesh(T.rbox(0.95, 0.9, 0.2, 0.08), white, 0, -0.05, 1.2));
      this.headG = T.group(body, 0, 0.75, 1.2);
      this.faceStyle = { skin: o.coat || "#c8874a", brow: "#4a2a14", noMouth: 1 };
      this.faceMat = new THREE.MeshStandardMaterial({ map: T.faceTex(this.faceStyle, "smile"), roughness: 0.7 });
      this.headG.add(T.mesh(T.rbox(1.25, 1.15, 1.15, 0.28), [coat, coat, coat, coat, this.faceMat, coat], 0, 0.15, 0.25));
      this.headG.add(T.mesh(T.rbox(0.7, 0.5, 0.55, 0.16), white, 0, -0.18, 0.98));
      this.headG.add(T.mesh(T.rbox(0.32, 0.22, 0.14, 0.08), T.mat("#1d1a22", { r: 0.3 }), 0, 0.02, 1.27));
      this.tongue = T.mesh(T.rbox(0.26, 0.08, 0.34, 0.04), T.mat("#ff7f96", { r: 0.5 }), 0, -0.43, 1.1); this.headG.add(this.tongue);
      this.ear = {};
      for (const s of [-1, 1]) { const e = T.group(this.headG, s * 0.66, 0.6, 0.15); e.add(T.mesh(T.rbox(0.18, 0.85, 0.55, 0.08), dark, 0, -0.4, 0)); this.ear[s] = e; }
      this.legs = [];
      for (const [x, z] of [[0.42, 0.85], [-0.42, 0.85], [0.42, -0.85], [-0.42, -0.85]]) { const l = T.group(body, x, -0.45, z); l.add(T.mesh(T.rbox(0.4, 1.15, 0.42, 0.1), coat, 0, -0.5, 0)); l.add(T.mesh(T.rbox(0.44, 0.22, 0.5, 0.08), white, 0, -1.02, 0.04)); this.legs.push(l); }
      this.tail = T.group(body, 0, 0.35, -1.2);
      this.tail.add(T.mesh(T.rbox(0.24, 0.24, 1.0, 0.1), coat, 0, 0, -0.45));
      T.shadowAll(root);
    }
    set(p, time = 0) {
      const r = this.root; r.visible = true;
      r.position.set(p.x || 0, p.y || 0, p.z || 0); r.rotation.y = p.ry || 0;
      const s = p.s ?? 1; r.scale.set(s, s, s);
      const ph = p.walk;
      const moving = ph !== undefined && ph !== null;
      this.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * (p.run ? 0.9 : 0.55) : 0; });
      this.body.position.y = 1.55 + (moving ? Math.abs(Math.cos(ph)) * 0.12 : 0.02 * Math.sin(time * 3)) + (p.jump || 0);
      this.body.rotation.x = p.pitch || 0;
      const wag = p.wag ?? 0.5;
      this.tail.rotation.set(-0.7, Math.sin(time * 18) * wag, 0);
      for (const s2 of [-1, 1]) this.ear[s2].rotation.z = s2 * (0.12 + 0.1 * Math.sin(time * 6 + s2));
      this.headG.rotation.set(p.nod || 0, p.turn || 0, p.tilt || 0);
      this.tongue.visible = p.tongue !== false;
      const f = p.face || "happy";
      if (f !== this._f) { this.faceMat.map = T.faceTex(this.faceStyle, f); this.faceMat.needsUpdate = true; this._f = f; }
      return this;
    }
  }
  T.Dog = Dog;
  T.onBoot(() => { T.CAST.pickle = new Dog(); T.scene.add(T.CAST.pickle.root); T.reg(T.CAST.pickle.root); });
})();
