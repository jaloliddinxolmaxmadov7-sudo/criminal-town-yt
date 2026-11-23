/* "In This Town" engine, core (window.TOWN). One WebGL renderer draws the whole film; every frame is a function of time alone.
   Shots are registered with TOWN.shot(id, {...}) (t_auto.js turns shots.json into shots); TOWN.frame(T) draws the film at T seconds.
   TOWN.HEADLESS = true (set before boot) runs everything except the WebGL drawing: tools/audit.mjs uses it in Node. */
(function () {
  const T = (window.TOWN = window.TOWN || {});
  T.W = 1080; T.H = 1920; T.FPS = 30;
  T.LEAD = 0.1; // a cut lands this long before its word

  // ---------------------------------------------------------------- math
  const clamp = (T.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)));
  const lerp = (T.lerp = (a, b, k) => a + (b - a) * k);
  T.prog = (t, a, b) => (b === a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));
  T.ease = {
    lin: (x) => x,
    io: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    io3: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    out: (x) => 1 - Math.pow(1 - x, 3),
    out4: (x) => 1 - Math.pow(1 - x, 4),
    in: (x) => x * x * x,
    in2: (x) => x * x,
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    back: (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2),
    spring: (x) => (x <= 0 ? 0 : 1 - Math.exp(-6 * x) * Math.cos(9 * x)),
    pop: (x) => (x <= 0 ? 0 : 1 - Math.exp(-7 * x) * Math.cos(11 * x)),
  };
  const E = T.ease;
  // keyed numbers [[t, v, ease?], ...]: the ease on a key shapes the move into that key
  T.keys = (t, ks, ease = E.io) => {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++)
      if (t < ks[i][0]) {
        const e = ks[i][2] || ease;
        const a = ks[i - 1][1], b = ks[i][1], k = e((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]));
        if (Array.isArray(a)) return a.map((v, j) => lerp(v, b[j], k));
        return lerp(a, b, k);
      }
    return ks[ks.length - 1][1];
  };
  T.step = (t, ks) => { let v = ks[0][1]; for (const k of ks) if (t >= k[0]) v = k[1]; return v; };
  T.bump = (t, a, b) => Math.sin(Math.PI * T.prog(t, a, b));
  T.hash = (a, b = 0) => {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 1013, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  T.rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // smooth wobble in -1..1 from a few sines (deterministic)
  T.wob = (t, f = 1, seed = 0) => 0.55 * Math.sin(t * f * 2.1 + seed * 1.7) + 0.3 * Math.sin(t * f * 3.7 + seed * 4.1) + 0.15 * Math.sin(t * f * 6.3 + seed * 2.3);
  T.frameOf = (t) => Math.floor(t * T.FPS + 1e-6);

  // ---------------------------------------------------------------- geometry + materials
  const geoCache = new Map(), matCache = new Map();
  T.rbox = (w, h, d, r = 0.12, seg = 4) => {
    const key = `rb${w},${h},${d},${r},${seg}`;
    if (geoCache.has(key)) return geoCache.get(key);
    r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
    const p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
    const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      c.set(clamp(v.x, -ix, ix), clamp(v.y, -iy, iy), clamp(v.z, -iz, iz));
      const dv = v.clone().sub(c);
      if (dv.lengthSq() > 1e-12) dv.normalize().multiplyScalar(r);
      p.setXYZ(i, c.x + dv.x, c.y + dv.y, c.z + dv.z);
    }
    g.computeVertexNormals();
    geoCache.set(key, g);
    return g;
  };
  T.geo = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
  T.box = (w, h, d) => T.geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
  T.cyl = (rt, rb, h, s = 16) => T.geo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
  T.sph = (r, ws = 20, hs = 14) => T.geo(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
  T.plane = (w, h) => T.geo(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h));
  // standard plastic material, cached by colour + options
  T.mat = (color, o = {}) => {
    const key = JSON.stringify([color, o.r, o.m, o.e, o.ei, o.t, o.op, o.side, o.flat, o.map && o.map.uuid, o.depthWrite]);
    if (matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshStandardMaterial({ color: o.map ? "#ffffff" : color, roughness: o.r ?? 0.72, metalness: o.m ?? 0, flatShading: !!o.flat }); // a map carries its own colour
    if (o.e) { m.emissive = new THREE.Color(o.e); m.emissiveIntensity = o.ei ?? 1; }
    if (o.map) m.map = o.map;
    if (o.t) { m.transparent = true; m.opacity = o.op ?? 1; }
    if (o.side) m.side = o.side;
    if (o.depthWrite === false) m.depthWrite = false;
    matCache.set(key, m);
    return m;
  };
  T.basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));
  T.mesh = (g, m, x = 0, y = 0, z = 0, o = {}) => {
    const me = new THREE.Mesh(g, m);
    me.position.set(x, y, z);
    me.castShadow = o.cast !== false;
    me.receiveShadow = o.recv !== false;
    return me;
  };
  T.group = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; };
  T.shadowAll = (o, cast = true, recv = true) => o.traverse((c) => { if (c.isMesh) { c.castShadow = cast; c.receiveShadow = recv; } });

  // ---------------------------------------------------------------- canvas textures + text
  T.canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  T.tex = (canvas, o = {}) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = o.aniso ?? 8;
    if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
    if (o.nearest) { t.magFilter = THREE.NearestFilter; }
    return t;
  };
  T.FONT = '"TownDisplay", "Inter Display", "Arial Black", sans-serif';
  // a sign / tag texture: lines of text, auto-fitted
  T.textCanvas = (lines, o = {}) => {
    const w = o.w || 1024, h = o.h || 256, c = T.canvas(w, h), g = c.getContext("2d");
    if (o.bg) { g.fillStyle = o.bg; if (o.radius) { g.beginPath(); g.roundRect(0, 0, w, h, o.radius); g.fill(); } else g.fillRect(0, 0, w, h); }
    if (o.border) { g.lineWidth = o.borderW || 16; g.strokeStyle = o.border; g.beginPath(); g.roundRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth, o.radius || 0); g.stroke(); }
    const ls = Array.isArray(lines) ? lines : [lines];
    const pad = o.pad ?? 0.1;
    let size = o.size || Math.floor(h / ls.length * 0.78);
    g.textAlign = "center"; g.textBaseline = "middle";
    const fit = () => { g.font = `900 ${size}px ${T.FONT}`; return Math.max(...ls.map((l) => g.measureText(l).width)); };
    while (fit() > w * (1 - 2 * pad) && size > 8) size -= 2;
    const lh = size * (o.lh || 1.05), y0 = h / 2 - (lh * (ls.length - 1)) / 2;
    ls.forEach((l, i) => {
      if (o.stroke) { g.lineJoin = "round"; g.lineWidth = o.strokeW || size * 0.16; g.strokeStyle = o.stroke; g.strokeText(l, w / 2, y0 + i * lh); }
      g.fillStyle = (o.colors && o.colors[i]) || o.fg || "#20242b";
      g.fillText(l, w / 2, y0 + i * lh);
    });
    return c;
  };
  T.textTex = (lines, o = {}) => T.tex(T.textCanvas(lines, o));
  // a flat sign mesh (front face textured)
  T.sign = (lines, w, h, o = {}) => {
    const cw = o.cw || (w >= h ? 1024 : Math.max(128, Math.round(1024 * w / h)));
    const ch = o.ch || (w >= h ? Math.max(128, Math.round(1024 * h / w)) : 1024);
    const tex = T.textTex(lines, Object.assign({}, o, { w: cw, h: ch }));
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: !o.bg, alphaTest: o.bg ? 0 : 0.05 });
    if (o.glow) { m.emissive = new THREE.Color("#ffffff"); m.emissiveMap = tex; m.emissiveIntensity = o.glow; }
    const me = new THREE.Mesh(T.plane(w, h), m);
    me.castShadow = false; me.receiveShadow = !!o.recv;
    return me;
  };

  // ---------------------------------------------------------------- renderer, scene, lights, sky, post
  T.boot = async function (canvas) {
    if (!T.HEADLESS) {
      const R = (T.R = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }));
      R.setPixelRatio(1);
      R.setSize(T.W, T.H, false);
      R.shadowMap.enabled = true;
      R.shadowMap.type = THREE.PCFSoftShadowMap;
      R.localClippingEnabled = true;
    }
    const scene = (T.scene = new THREE.Scene());
    const cam = (T.cam = new THREE.PerspectiveCamera(42, T.W / T.H, 0.1, 900));
    // sky dome with a vertical gradient
    const skyMat = (T.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h*1.6,0.0,1.0), 0.8)) : mix(mid, bot, clamp(-h*4.0,0.0,1.0)); gl_FragColor = vec4(c, 1.0); }",
    }));
    T.sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat);
    T.sky.renderOrder = -10; T.sky.frustumCulled = false;
    scene.add(T.sky);
    // stars + moon
    const sg = new THREE.BufferGeometry(), sp = [], rr = T.rng(77);
    for (let i = 0; i < 900; i++) { const a = rr() * Math.PI * 2, y = 0.12 + rr() * 0.88, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 560, y * 560, Math.sin(a) * r * 560); }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    T.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#ffffff", size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
    T.stars.frustumCulled = false; scene.add(T.stars);
    const mc = T.canvas(256, 256), mg = mc.getContext("2d");
    const grd = mg.createRadialGradient(128, 128, 40, 128, 128, 128); grd.addColorStop(0, "rgba(255,250,220,1)"); grd.addColorStop(0.42, "rgba(255,248,215,1)"); grd.addColorStop(0.5, "rgba(255,240,200,0.35)"); grd.addColorStop(1, "rgba(255,240,200,0)");
    mg.fillStyle = grd; mg.fillRect(0, 0, 256, 256);
    mg.fillStyle = "rgba(220,214,190,0.55)"; for (const [x, y, r] of [[105, 110, 14], [150, 95, 9], [140, 150, 18], [100, 155, 8]]) { mg.beginPath(); mg.arc(x, y, r, 0, 7); mg.fill(); }
    T.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.tex(mc), fog: false, depthWrite: false, transparent: true }));
    T.moon.scale.set(90, 90, 1); scene.add(T.moon);
    // clouds
    T.clouds = T.group(scene);
    const cr = T.rng(5);
    for (let i = 0; i < 14; i++) {
      const cg = T.group(T.clouds, (cr() - 0.5) * 700, 95 + cr() * 60, -150 - cr() * 320);
      const n = 3 + Math.floor(cr() * 3);
      for (let j = 0; j < n; j++) { const s = 10 + cr() * 14; const m = T.mesh(T.rbox(s * 1.6, s * 0.8, s, s * 0.3), T.mat("#ffffff", { r: 1, e: "#ffffff", ei: 0.25 }), (j - n / 2) * s * 0.9, cr() * 4, cr() * 6, { cast: false, recv: false }); cg.add(m); }
    }
    // lights
    T.hemi = new THREE.HemisphereLight("#cfe8ff", "#6a8a4a", 1.0); scene.add(T.hemi);
    const sun = (T.sun = new THREE.DirectionalLight("#fff1d6", 2.6));
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
    scene.add(sun); scene.add(sun.target);
    T.fill = new THREE.DirectionalLight("#bcd6ff", 0.5); T.fill.position.set(-30, 20, 40); scene.add(T.fill);
    T.spot = new THREE.SpotLight("#fff4d0", 0, 60, 0.32, 0.45, 1.2); T.spot.castShadow = true; T.spot.shadow.mapSize.set(1024, 1024); scene.add(T.spot); scene.add(T.spot.target);
    T.points = [0, 1, 2].map(() => { const p = new THREE.PointLight("#ffcc88", 0, 30, 1.6); scene.add(p); return p; });
    scene.fog = new THREE.Fog("#cfe9ff", 120, 520);
    // post: scene -> MSAA target -> tone map + grade -> screen
    T.rt = T.HEADLESS ? { texture: null } : new THREE.WebGLRenderTarget(T.W, T.H, { samples: 4, type: THREE.HalfFloatType });
    T.post = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { src: { value: T.rt.texture }, exposure: { value: 1 }, sepia: { value: 0 }, sat: { value: 1.08 }, vig: { value: 0.22 }, flash: { value: 0 }, dark: { value: 0 }, grain: { value: 0 }, seed: { value: 0 }, tint: { value: new THREE.Color(1, 1, 1) } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `uniform sampler2D src; uniform float exposure, sepia, sat, vig, flash, dark, grain, seed; uniform vec3 tint; varying vec2 vUv;
        vec3 fit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }
        vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
          const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
          c *= exposure/0.6; c = I*c; c = fit(c); c = O*c; return clamp(c,0.0,1.0); }
        vec3 oetf(vec3 c){ return mix(pow(c, vec3(0.41666))*1.055-0.055, c*12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
        void main(){ vec3 c = texture2D(src, vUv).rgb * tint; c = aces(c); c = oetf(c);
          float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, sat);
          vec3 sp = vec3(l*1.07+0.06, l*0.93+0.03, l*0.72); c = mix(c, sp, sepia);
          vec2 q = vUv - 0.5; q.x *= 0.62; c *= 1.0 - vig * smoothstep(0.18, 0.62, length(q)) ;
          c += (h(vUv*vec2(1080.0,1920.0)) - 0.5) * grain;
          c = mix(c, vec3(1.0), flash); c = mix(c, vec3(0.0), dark);
          gl_FragColor = vec4(c, 1.0); }`,
    });
    T.postScene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), T.post); quad.frustumCulled = false; T.postScene.add(quad);
    T.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // font for every sign and tag
    if (!T.HEADLESS) try {
      const ff = new FontFace("TownDisplay", "url(assets/fonts/InterDisplay-Black.otf)", { weight: "900" });
      await ff.load(); document.fonts.add(ff);
    } catch (e) { console.warn("font", e); }
    // pictures the town uses (the channel banner on the billboards); missing files just fall back to drawn art
    T.IMAGES = T.IMAGES || {};
    if (!T.HEADLESS) for (const [k, url] of Object.entries(T.PRELOAD || {})) {
      try { const im = new Image(); im.src = url; await im.decode(); T.IMAGES[k] = im; } catch (e) { console.warn("image", k, e); }
    }
    for (const fn of T._builders) fn(T);
    T._resolveShots();
    for (const s of T.SHOTS) {
      s.group = T.group(scene); s.group.visible = false;
      if (s.build) s.build(s.group, s);
    }
    T.booted = true;
  };
  T.PRELOAD = Object.assign({ banner: "assets/img/banner.jpg" }, T.PRELOAD || {});
  for (const f of ["angry", "blink", "content", "creepy", "cry", "dizzy", "happy", "laugh", "nerd", "nervous", "neutral", "oh", "sad", "scared", "shocked", "sleepy", "smile", "smirk", "sparkle", "sparkle_oh", "squeeze", "stare", "talk", "wink"]) T.PRELOAD["face_" + f] = "assets/img/faces/" + f + ".png";
  T._builders = [];
  T.onBoot = (fn) => T._builders.push(fn);

  // ---------------------------------------------------------------- skies (light presets)
  const SKY = (T.SKIES = {
    day: { top: "#3d8ff0", mid: "#a9dcff", bot: "#cfeaff", fog: "#cfe9ff", fogN: 140, fogF: 560, hemi: ["#d8eeff", "#6f9a4c", 1.05], sun: ["#fff0d2", 2.7], sunDir: [0.55, 0.9, 0.45], fill: 0.45, exp: 1.0, stars: 0, moon: 0, win: 0, lamps: 0, clouds: 1 },
    morning: { top: "#5aa2ef", mid: "#ffd9b0", bot: "#ffe6c8", fog: "#ffe1c2", fogN: 120, fogF: 520, hemi: ["#ffe8cf", "#7a9a52", 1.0], sun: ["#ffd6a0", 2.5], sunDir: [0.5, 0.7, 0.5], fill: 0.4, exp: 1.0, stars: 0, moon: 0, win: 0, lamps: 0, clouds: 1 },
    afternoon: { top: "#3f86e6", mid: "#bfe0ff", bot: "#e6f2ff", fog: "#d9ecff", fogN: 140, fogF: 560, hemi: ["#ffeedd", "#6f9a4c", 1.0], sun: ["#ffe2b0", 2.8], sunDir: [-0.5, 0.7, 0.6], fill: 0.4, exp: 1.0, stars: 0, moon: 0, win: 0, lamps: 0, clouds: 1 },
    dusk: { top: "#2b3a7a", mid: "#ff9a6a", bot: "#ffb48a", fog: "#e8957a", fogN: 90, fogF: 460, hemi: ["#ffb98f", "#4b4a5a", 0.85], sun: ["#ff9a5c", 2.2], sunDir: [-0.85, 0.22, 0.3], fill: 0.35, exp: 1.0, stars: 0.15, moon: 0, win: 0.6, lamps: 0.8, clouds: 1 },
    night: { top: "#070b22", mid: "#1a2a5c", bot: "#24345e", fog: "#1a2650", fogN: 60, fogF: 360, hemi: ["#6f8fe0", "#1c2238", 0.9], sun: ["#a8c2ff", 1.5], sunDir: [-0.4, 0.8, 0.35], fill: 0.32, exp: 1.22, stars: 1, moon: 1, win: 1, lamps: 1, clouds: 0 },
    dawn: { top: "#3a5fae", mid: "#ffb37a", bot: "#ffd0a0", fog: "#f3b48f", fogN: 100, fogF: 480, hemi: ["#ffd2b0", "#5e6a58", 0.95], sun: ["#ffb070", 2.4], sunDir: [0.85, 0.25, 0.35], fill: 0.4, exp: 1.02, stars: 0.05, moon: 0, win: 0.2, lamps: 0.3, clouds: 1 },
    room: { top: "#3d8ff0", mid: "#a9dcff", bot: "#cfeaff", fog: "#f5e6d0", fogN: 200, fogF: 900, hemi: ["#fff4e6", "#8a6e5a", 1.15], sun: ["#fff0d2", 2.2], sunDir: [-0.5, 0.75, 0.6], fill: 0.55, exp: 1.0, stars: 0, moon: 0, win: 0, lamps: 0, clouds: 0 },
    roomNight: { top: "#070b22", mid: "#1a2a5c", bot: "#24345e", fog: "#1a1a2a", fogN: 200, fogF: 900, hemi: ["#8f9fe0", "#2a2030", 0.82], sun: ["#a8c2ff", 1.0], sunDir: [-0.5, 0.75, 0.6], fill: 0.3, exp: 1.2, stars: 1, moon: 0, win: 1, lamps: 1, clouds: 0 },
  });
  const cA = new THREE.Color(), cB = new THREE.Color();
  const mixCol = (a, b, k, out) => out.copy(cA.set(a)).lerp(cB.set(b), k);
  T.skyState = {};
  // set the sky from a preset name, or mix two presets: T.setSky("dusk", "night", 0.4)
  T.setSky = (a, b = null, k = 0, over = {}) => {
    const A = SKY[a], B = SKY[b || a];
    const n = (key) => lerp(A[key], B[key], k);
    const s = (T.skyState = { win: n("win"), lamps: n("lamps"), name: k < 0.5 ? a : b || a });
    mixCol(A.top, B.top, k, T.skyMat.uniforms.top.value);
    mixCol(A.mid, B.mid, k, T.skyMat.uniforms.mid.value);
    mixCol(A.bot, B.bot, k, T.skyMat.uniforms.bot.value);
    mixCol(A.fog, B.fog, k, T.scene.fog.color);
    T.scene.fog.near = n("fogN"); T.scene.fog.far = n("fogF");
    mixCol(A.hemi[0], B.hemi[0], k, T.hemi.color); mixCol(A.hemi[1], B.hemi[1], k, T.hemi.groundColor);
    T.hemi.intensity = lerp(A.hemi[2], B.hemi[2], k) * (over.hemi ?? 1);
    mixCol(A.sun[0], B.sun[0], k, T.sun.color); T.sun.intensity = lerp(A.sun[1], B.sun[1], k) * (over.sun ?? 1);
    T.sunDir = [0, 1, 2].map((i) => lerp(A.sunDir[i], B.sunDir[i], k));
    T.fill.intensity = n("fill") * (over.fill ?? 1);
    T.post.uniforms.exposure.value = n("exp") * (over.exp ?? 1);
    T.stars.material.opacity = n("stars") * 0.95; T.stars.visible = n("stars") > 0.01;
    T.moon.material.opacity = n("moon"); T.moon.visible = n("moon") > 0.01;
    T.clouds.visible = n("clouds") > 0.5;
    for (const fn of T._skyHooks) fn(s);
  };
  T._skyHooks = [];
  T.onSky = (fn) => T._skyHooks.push(fn);

  // ---------------------------------------------------------------- shots
  T.SHOTS = [];
  T.shot = (id, def) => { def.id = id; T.SHOTS.push(def); return def; };
  const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
  T._words = () => (window.CUES && window.CUES.words) || [];
  // index of the first word of `phrase` at or after word index `from` (nth match), or -1
  T.find = (phrase, from = 0, nth = 0) => {
    const W = T._words(), toks = phrase.split(/\s+/).map(norm).filter(Boolean);
    let hit = 0;
    for (let i = Math.max(0, from); i <= W.length - toks.length; i++) {
      let ok = true;
      for (let j = 0; j < toks.length; j++) if (norm(W[i + j][2]) !== toks[j]) { ok = false; break; }
      if (ok) { if (hit === nth) return i; hit++; }
    }
    return -1;
  };
  T._resolveShots = () => {
    const W = T._words();
    let cursor = 0;
    T.END = (window.CUES && window.CUES.END) || 10;
    for (let i = 0; i < T.SHOTS.length; i++) {
      const s = T.SHOTS[i];
      if (typeof s.at === "number") { s.start = s.at; s.wi = 0; continue; }
      const idx = T.find(s.at, cursor, s.nth || 0);
      if (idx < 0) throw new Error(`shot ${s.id}: phrase "${s.at}" not found after word ${cursor} ("${W[cursor] ? W[cursor][2] : "end"}")`);
      s.wi = idx; cursor = idx;
      s.start = i === 0 ? 0 : Math.max(0, W[idx][0] - (s.lead ?? T.LEAD) + (s.shift || 0));
    }
    for (let i = 0; i < T.SHOTS.length; i++) {
      const s = T.SHOTS[i];
      s.end = i + 1 < T.SHOTS.length ? T.SHOTS[i + 1].start : T.END;
      if (s.end - s.start < 0.2) throw new Error(`shot ${s.id} is only ${(s.end - s.start).toFixed(2)} s long`);
    }
  };
  T.shotAt = (t) => { let cur = T.SHOTS[0]; for (const s of T.SHOTS) if (t >= s.start) cur = s; return cur; };

  // per-frame context handed to a shot's draw()
  function makeCtx(s, t) {
    const W = T._words();
    const c = {
      shot: s, T: t, t: t - s.start, dur: s.end - s.start, start: s.start, end: s.end,
      // absolute time of a phrase's first word, searched from this shot's anchor
      w: (phrase, nth = 0) => { const i = T.find(phrase, s.wi || 0, nth); if (i < 0) throw new Error(`shot ${s.id}: word "${phrase}" not found`); return W[i][0]; },
      we: (phrase, nth = 0) => { const i = T.find(phrase, s.wi || 0, nth); if (i < 0) throw new Error(`shot ${s.id}: word "${phrase}" not found`); return W[i + phrase.split(/\s+/).filter(Boolean).length - 1][1]; },
      // local time (seconds since the shot began) of a phrase
      lw: (phrase, nth = 0) => c.w(phrase, nth) - s.start,
      cam: (pos, tgt, fov = 42, roll = 0) => {
        T.cam.position.set(pos[0], pos[1], pos[2]);
        T.cam.up.set(Math.sin(roll), Math.cos(roll), 0);
        T.cam.lookAt(tgt[0], tgt[1], tgt[2]);
        if (T.cam.fov !== fov) { T.cam.fov = fov; T.cam.updateProjectionMatrix(); }
        c._tgt = tgt;
      },
      // camera keys: [[t, pos, target, fov?], ...] in local seconds
      camKeys: (ks, ease = E.io) => {
        const pos = T.keys(c.t, ks.map((k) => [k[0], k[1], k[4]])), tgt = T.keys(c.t, ks.map((k) => [k[0], k[2], k[4]]));
        const fov = T.keys(c.t, ks.map((k) => [k[0], k[3] ?? 42, k[4]]));
        c.cam(pos, tgt, fov);
      },
      shake: (amp, f = 22) => {
        if (amp <= 0) return;
        T.cam.position.x += amp * T.wob(c.T, f, 1); T.cam.position.y += amp * T.wob(c.T, f, 2);
        T.cam.rotation.z += amp * 0.02 * T.wob(c.T, f, 3);
      },
      focus: (x, z, r = 22) => { c._focus = [x, z, r]; },
      sky: (a, b, k, over) => T.setSky(a, b, k, over),
      post: (o) => Object.assign(c._post, o),
      _post: {},
      lights: [],
      point: (i, pos, color, intensity, dist = 30) => { const p = T.points[i]; p.position.set(pos[0], pos[1], pos[2]); p.color.set(color); p.intensity = intensity; p.distance = dist; },
    };
    return c;
  }

  // ---------------------------------------------------------------- frame
  T.pool = []; // shared objects (cast, props): hidden every frame unless a shot shows them
  T.reg = (o) => { T.pool.push(o); o.visible = false; return o; };
  T.show = (o, on = true) => { o.visible = on; return o; };
  T._frameHooks = [];
  T.onFrame = (fn) => T._frameHooks.push(fn);
  T.frame = (time) => {
    if (!T.booted) return;
    const s = T.shotAt(time);
    for (const o of T.pool) o.visible = false;
    for (const x of T.SHOTS) x.group.visible = x === s;
    for (const p of T.points) p.intensity = 0;
    T.spot.intensity = 0;
    const c = makeCtx(s, time);
    T.ctx = c;
    for (const fn of T._frameHooks) fn(c, "pre");
    T.setSky(s.sky || "day");
    T.post.uniforms.sepia.value = 0; T.post.uniforms.flash.value = 0; T.post.uniforms.dark.value = 0; T.post.uniforms.grain.value = 0.018; T.post.uniforms.vig.value = 0.24; T.post.uniforms.sat.value = 1.1; T.post.uniforms.tint.value.setRGB(1, 1, 1);
    s.draw(c);
    for (const fn of T._frameHooks) fn(c, "post");
    // post settings from the shot
    const P = c._post;
    for (const k of ["sepia", "flash", "dark", "grain", "vig", "sat"]) if (P[k] !== undefined) T.post.uniforms[k].value = P[k];
    if (P.exp !== undefined) T.post.uniforms.exposure.value *= P.exp;
    if (P.tint) T.post.uniforms.tint.value.set(P.tint);
    T.post.uniforms.seed.value = T.frameOf(time) % 97;
    // sun + shadow camera follow the action
    const f = c._focus || (c._tgt ? [c._tgt[0], c._tgt[2], 26] : [0, 0, 26]);
    const d = T.sunDir || [0.5, 0.9, 0.4], L = Math.hypot(d[0], d[1], d[2]);
    T.sun.target.position.set(f[0], 0, f[1]);
    T.sun.position.set(f[0] + (d[0] / L) * 90, (d[1] / L) * 90, f[1] + (d[2] / L) * 90);
    const sc = T.sun.shadow.camera; sc.left = sc.bottom = -f[2]; sc.right = sc.top = f[2]; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix();
    T.sky.position.copy(T.cam.position); T.stars.position.copy(T.cam.position);
    const md = new THREE.Vector3(-0.35, 0.42, -1).normalize().multiplyScalar(520);
    T.moon.position.copy(T.cam.position).add(md);
    T.clouds.position.set(T.cam.position.x * 0.9, 0, T.cam.position.z * 0.9);
    if (T.HEADLESS) { T.scene.updateMatrixWorld(true); T.cam.updateMatrixWorld(true); return; }
    T.R.setRenderTarget(T.rt);
    T.R.render(T.scene, T.cam);
    T.R.setRenderTarget(null);
    T.R.render(T.postScene, T.postCam);
  };
})();
