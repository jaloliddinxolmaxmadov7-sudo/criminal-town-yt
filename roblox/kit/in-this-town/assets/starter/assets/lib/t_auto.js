/* "In This Town" engine, auto shots: turns window.SHOTDATA (written by tools/build.py from shots.json) into shots.
   A shot is data: a place, a light, who is there and what they do (changing on spoken words), props, effects and a camera size.
   The camera frames itself: it fits the subjects into the 9:16 frame with heads above the captions, keeps out of buildings and
   furniture, and turns to another angle when a wall, a prop or another person would hide a face (TOWN.AUTO.solve).
   TOWN.AUTO.audit(shot, time) reports what a viewer would see wrong at that moment; tools/audit.mjs runs it on every shot. */
(function () {
  const T = window.TOWN, E = T.ease, PO = T.PO;
  const A = (T.AUTO = {});
  const DEG = Math.PI / 180;
  const V = () => new THREE.Vector3();
  const W = () => T.WORLD;

  // ================================================================ places
  // at = stage centre [x, z] (room places: x relative to the room); yaw = the default camera direction in degrees
  // (0 looks north, 90 east, -90 west, 180 south); range = camera yaws allowed (keeps the camera off empty sides).
  const PLACES = (A.PLACES = {
    plaza: { at: [0, 6], yaw: 0, range: [-70, 70], desc: "town square; the school behind" },
    plazaEast: { at: [10, -2], yaw: 90, range: [50, 130], desc: "town square looking at the town hall and its clock tower" },
    plazaWest: { at: [-12, -3], yaw: -90, range: [-130, -50], desc: "town square looking at the bakery" },
    plazaSouth: { at: [0, 12], yaw: 180, range: [140, 220], desc: "town square looking down the main street, shops on both sides" },
    school: { at: [-4, -17], yaw: 0, range: [-45, 45], desc: "in front of the school's big blank wall" },
    townhall: { at: [23, -2], yaw: 90, range: [55, 125], desc: "steps of the town hall, clock tower above" },
    bakery: { at: [-24, -4], yaw: -90, range: [-125, -55], desc: "in front of the bakery (striped awning)" },
    street: { at: [0, 66], yaw: 180, range: [130, 230], desc: "the main street, houses on both sides" },
    home: { at: [-9, 52], yaw: -90, range: [-130, -50], desc: "front yard of the blue house with the yellow door" },
    neighbor: { at: [9, 52], yaw: 90, range: [50, 130], desc: "front yard of the house across the street" },
    paperShop: { at: [-6.5, 32], yaw: -90, range: [-130, -50], desc: "in front of the paper shop" },
    jewelShop: { at: [6.5, 32], yaw: 90, range: [50, 130], desc: "in front of the jewellery shop" },
    tower: { at: [44, -54], yaw: 40, range: [10, 70], desc: "under the water tower" },
    field: { at: [-70, 80], yaw: -90, range: [-180, 180], desc: "open grass outside town, hills far away" },
    kitchen: { room: "kitchen", at: [0, 4.5], yaw: -6, range: [-35, 25], table: [0, 3.42, 0], desc: "kitchen: table, fridge, counter" },
    bedroom: { room: "theo", at: [-1, 2.5], yaw: -6, range: [-35, 25], table: [-4.5, 3.42, -6.2], desc: "kid's bedroom: bed, desk, drawings on the wall" },
    bakeryIn: { room: "bakery", at: [2.5, 2.5], yaw: -4, range: [-35, 25], table: [2.5, 2.98, -1.5], desc: "inside the bakery: oven, bread shelves, counter" },
    shopIn: { room: "shop", at: [1, 1.5], yaw: -4, range: [-35, 25], table: [1, 2.98, -3.2], desc: "inside a shop: shelves, counter" },
    jewelIn: { room: "jewel", at: [0, 2.5], yaw: -4, range: [-35, 25], table: [3, 2.98, -1.2], desc: "inside the jewellery shop: glass cases, gold" },
    classroom: { room: "class", at: [-3, 2.5], yaw: -6, range: [-35, 25], table: [0, 2.42, -1], desc: "classroom: chalkboard, desks" },
    living: { room: "living", at: [-2, 1.5], yaw: -4, range: [-35, 25], table: [-2, 1.82, -1.8], desc: "living room: sofa, TV, rug" },
    office: { room: "office", at: [0, 1.5], yaw: 0, range: [-35, 30], table: [0, 3.72, -3.5], desc: "the mayor's office: big desk, books" },
  });
  const SPOTS = {
    plaza: { bench: [-18, 14.6, { seat: 1.45 }], bench2: [18, 14.6, { seat: 1.45 }] },
    home: { door: [-12.4, 52] }, neighbor: { door: [12.4, 52] },
    bakery: { door: [-29.6, -8.5] }, townhall: { door: [28.4, -2] }, paperShop: { door: [-9.8, 29] }, jewelShop: { door: [9.8, 35] },
    kitchen: { table: [0, -3.9], fridge: [-9.5, -5.2], counter: [7, -5.8] },
    bedroom: { bed: [7, -4.6, { lie: 2.55 }], desk: [-4.5, -3.4] },
    bakeryIn: { counter: [2.5, -4.2], oven: [-7, -4.4] },
    shopIn: { counter: [1, -5.8] },
    jewelIn: { counter: [0, -3.6] },
    office: { desk: [0, -6.6, { seat: 2.3 }] },
    classroom: { board: [-1, -7.4] },
    living: { sofa: [-2, -6.4, { seat: 2.0 }], tv: [9, -3.6] },
  };
  for (const [k, v] of Object.entries(SPOTS)) PLACES[k].spots = v;
  const MARKS = (A.MARKS = { center: [0, 0], left: [-2.6, 0], right: [2.6, 0], farLeft: [-5.4, 0], farRight: [5.4, 0], front: [0, 2.6], back: [0, -3.2],
    backLeft: [-3, -3.2], backRight: [3, -3.2], frontLeft: [-2.4, 2.4], frontRight: [2.4, 2.4], offLeft: [-14, 0], offRight: [14, 0] });
  const AUTO_MARKS = [[[0, 0]], [[-1.75, 0], [1.75, 0]], [[-3.3, 0.3], [0, -0.4], [3.3, 0.3]], [[-4.9, 0.5], [-1.65, 0], [1.65, 0], [4.9, 0.5]],
    [[-6, 0.8], [-3, 0], [0, -0.4], [3, 0], [6, 0.8]]];
  // place frame -> world: x to the right of the default view, z toward the default camera
  A.placeBasis = (pl) => {
    const y = pl.yaw * DEG, ox = pl.room ? W().rooms[pl.room].position.x : 0;
    return { ox: ox + pl.at[0], oz: pl.at[1], r: [Math.cos(y), Math.sin(y)], b: [-Math.sin(y), Math.cos(y)] };
  };
  A.toWorld = (pl, m) => {
    if (typeof m === "string" && pl.spots && pl.spots[m]) { const sp = pl.spots[m], ox = pl.room ? W().rooms[pl.room].position.x : 0; return [ox + sp[0], sp[1]]; }
    const B = A.placeBasis(pl), mm = typeof m === "string" ? MARKS[m] : m;
    if (!mm) throw new Error(`unknown mark "${m}" (marks: ${Object.keys(MARKS).join(", ")}${pl.spots ? "; spots here: " + Object.keys(pl.spots).join(", ") : ""})`);
    return [B.ox + B.r[0] * mm[0] + B.b[0] * mm[1], B.oz + B.r[1] * mm[0] + B.b[1] * mm[1]];
  };
  // world -> place frame (for spots in the line-up)
  A.toPlace = (pl, x, z) => { const B = A.placeBasis(pl), dx = x - B.ox, dz = z - B.oz; return [dx * B.r[0] + dz * B.r[1], dx * B.b[0] + dz * B.b[1]]; };
  A.spotOpts = (pl, m) => (typeof m === "string" && pl.spots && pl.spots[m] && pl.spots[m][2]) || {};

  // ================================================================ who is who
  A.ROLES = {};
  T.onBoot(() => {
    const cast = (window.STORY && window.STORY.cast) || {};
    for (const [role, sp] of Object.entries(cast)) {
      let a;
      if (sp.preset && Object.keys(sp).length > 1) { const base = T.SPECS[sp.preset]; if (!base) throw new Error(`cast ${role}: no preset "${sp.preset}"`); const o = Object.assign({}, base, sp); delete o.preset; a = new T.Actor(o); T.scene.add(a.root); T.reg(a.root); }
      else if (sp.preset) { a = T.CAST[sp.preset]; if (!a) throw new Error(`cast ${role}: no preset "${sp.preset}"`); }
      else if (sp.kind === "dog") { a = new T.Dog(sp); T.scene.add(a.root); T.reg(a.root); a.isDog = true; }
      else { a = new T.Actor(Object.assign({ build: "adult", seed: 40 + Object.keys(A.ROLES).length }, sp)); T.scene.add(a.root); T.reg(a.root); }
      a.role = role; A.ROLES[role] = a;
    }
    if (T.CAST.pickle) T.CAST.pickle.isDog = true;
  });
  A.actor = (name) => {
    const a = A.ROLES[name] || T.CAST[name] || (/^folk\d+$/.test(name) ? T.FOLK[+name.slice(4)] : null);
    if (!a) throw new Error(`unknown cast member "${name}"`);
    return a;
  };

  // ================================================================ actions ("do"): pose for set(), from ta = seconds since the action began
  const DO = (A.DO = {
    idle: () => ({}),
    talk: (ta, t) => ({ armR: [0.55 + 0.28 * Math.sin(t * 5.3), 0.32 + 0.14 * Math.sin(t * 3.1)], head: [0.04 * Math.sin(t * 4.2), 0.07 * Math.sin(t * 1.7), 0] }),
    wave: (ta, t) => PO.wave(t),
    waveL: (ta, t) => PO.wave(t, "L"),
    cheer: (ta, t) => Object.assign(PO.cheer(t), { jump: 0.7 * Math.abs(Math.sin(ta * 6.5)) * (ta < 1.5 ? 1 : 0.35) }),
    shock: (ta) => Object.assign(PO.shock(), { lean: [-0.14 * E.out(Math.min(1, ta / 0.2)), 0], jump: 0.4 * T.bump(ta, 0, 0.28) }),
    scared: (ta, t) => ({ armL: [0.95, 0.38], armR: [0.95, 0.38], lean: [-0.16, 0], bob: 0.035 * Math.sin(t * 44) }),
    point: () => PO.point("R"),
    pointL: () => PO.point("L"),
    pointUp: () => ({ armR: [2.95, 0.12] }),
    shrug: () => PO.shrug(),
    hips: () => PO.hips(),
    fist: (ta, t) => ({ armR: [2.85 + 0.12 * Math.sin(t * 9), 0.15] }),
    think: () => ({ armL: [-0.15, 0.42], armR: [1.05, -0.5], head: [-0.18, 0.22, 0.16] }),
    facepalm: () => ({ armR: [2.5, -0.4], head: [0.32, 0, 0] }),
    cry: (ta, t) => ({ head: [0.28, 0, 0], armL: [0.3, 0.1], armR: [0.3, 0.1], bob: 0.03 * Math.sin(t * 22) }),
    laugh: (ta, t) => ({ lean: [-0.1, 0], bob: 0.07 * Math.abs(Math.sin(t * 11)), armL: [0.45, 0.35], armR: [0.45, 0.35], head: [-0.16, 0, 0] }),
    jump: (ta) => ({ jump: 1.2 * Math.abs(Math.sin(ta * 4.4)), armL: [0.3, 2.4], armR: [0.3, 2.4] }),
    dance: (ta, t) => ({ armL: [0.4, 1.6 + 0.6 * Math.sin(t * 8)], armR: [0.4, 1.6 - 0.6 * Math.sin(t * 8)], twist: 0.3 * Math.sin(t * 8), bob: 0.12 * Math.abs(Math.sin(t * 8)) }),
    sit: () => Object.assign(PO.sit(), { _sit: true }),
    sleep: () => ({ _lie: true }),
    fall: (ta) => ({ _fall: E.out(Math.min(1, ta / 0.35)) }),
    hold: () => PO.hold(1.15, 0.12),
    carry: () => ({ armL: [2.9, 0.2], armR: [2.9, 0.2] }),
    present: () => PO.presentR(),
    draw: (ta, t) => PO.drawWall(t),
    drawDesk: (ta, t) => PO.drawDesk(t),
    rub: (ta, t) => PO.rub(t),
    sneak: () => ({ lean: [0.32, 0], squash: 0.92, armL: [0.5, 0.15, 0, 1.4], armR: [0.5, 0.15, 0, 1.4] }),
    nod: (ta, t) => ({ head: [0.22 * Math.abs(Math.sin(t * 7)), 0, 0] }),
    no: (ta, t) => ({ head: [0, 0.38 * Math.sin(t * 9), 0] }),
    angry: (ta, t) => ({ armL: [-0.1, 0.28], armR: [-0.1, 0.28], bob: 0.06 * Math.abs(Math.sin(t * 9)), lean: [0.08, 0] }),
    hug: () => ({ armL: [1.45, 0.55], armR: [1.45, 0.55] }),
    clap: (ta, t) => { const k = 0.3 + 0.22 * Math.sin(t * 14); return { armL: [1.5, k], armR: [1.5, k] }; },
    eat: (ta, t) => ({ armR: [2.3 + 0.2 * Math.sin(t * 9), -0.3] }),
    throw: (ta) => ({ armR: [ta < 0.15 ? 3.0 : T.lerp(3.0, 1.2, E.out(T.prog(ta, 0.15, 0.4))), 0.1] }),
    kick: (ta) => ({ legR: [T.bump(ta, 0, 0.45) * 1.2, 0], kneeR: 0.9 * (1 - T.bump(ta, 0, 0.45)) * (ta < 0.45 ? 1 : 0) }),
    float: (ta, t) => ({ _fly: 1.5 * E.io(Math.min(1, ta / 1.2)) + 0.15 * Math.sin(t * 3), armL: [0.15, 1.1], armR: [0.15, 1.1] }),
    bow: (ta) => ({ lean: [0.6 * T.bump(ta, 0, 0.9), 0] }),
    stretch: () => ({ armL: [0.1, 2.9], armR: [0.1, 2.9], head: [-0.2, 0, 0] }),
    look: () => ({}),
    crouch: () => ({ legL: [1.0, 0.1], legR: [1.0, 0.1], kneeL: 2.0, kneeR: 2.0, lean: [0.2, 0], armL: [0.6, 0.1, 0, 1.2], armR: [0.6, 0.1, 0, 1.2] }),
    kneel: () => ({ legL: [1.4, 0], kneeL: 1.5, legR: [0, 0], kneeR: 1.55 }),
    armscross: () => ({ armL: [0.75, -0.35, 0, 1.7], armR: [0.75, -0.35, 0, 1.7], lean: [-0.05, 0] }),
    // ---- extra moves (Criminal Town kit)
    flex: (ta, t) => ({ armL: [0.2, 1.5, 0, 2.0], armR: [0.2, 1.5, 0, 2.0], lean: [-0.08, 0], bob: 0.03 * Math.abs(Math.sin(t * 6)) }),
    swagger: (ta, t) => ({ armL: [-0.2, 0.3], armR: [-0.2, 0.3], twist: 0.18 * Math.sin(t * 4), bob: 0.05 * Math.abs(Math.sin(t * 4)), lean: [-0.06, 0] }),
    thumbsup: () => ({ armR: [0.9, 0.1, 0, 1.3], head: [0, 0.1, 0] }),
    salute: () => ({ armR: [2.6, -0.2], head: [-0.1, 0, 0] }),
    shiver: (ta, t) => ({ armL: [0.9, 0.5], armR: [0.9, 0.5], bob: 0.04 * Math.sin(t * 50), lean: [0.1, 0] }),
    spin: (ta) => ({ twist: 6.28 * E.io(Math.min(1, ta / 0.8)), jump: 0.5 * T.bump(ta, 0, 0.8) }),
    slowclap: (ta, t) => { const k = 0.35 + 0.2 * Math.abs(Math.sin(t * 3.2)); return { armL: [1.5, k], armR: [1.5, k], head: [0.05, 0, 0] }; },
    panic: (ta, t) => ({ armL: [2.7 + 0.4 * Math.sin(t * 18), 0.3], armR: [2.7 - 0.4 * Math.sin(t * 18), 0.3], bob: 0.08 * Math.abs(Math.sin(t * 16)), head: [0, 0.25 * Math.sin(t * 12), 0] }),
    mic: () => ({ armR: [2.2, -0.15], head: [-0.1, 0, 0] }),
    // ---- moves pack 2 (all keep moving every frame)
    propose: (ta, t) => ({ legL: [1.4, 0], kneeL: 1.5, legR: [0, 0], kneeR: 1.55, armR: [1.5, 0.05, 0, 0.3 + 0.08 * Math.sin(t * 5)], armL: [0.3, 0.1, 0, 1.2], head: [-0.15, 0, 0.05 * Math.sin(t * 3)] }),
    heartclutch: (ta, t) => ({ armL: [1.0, -0.5, 0, 1.9], armR: [1.0, -0.5, 0, 1.9], lean: [-0.12 + 0.05 * Math.sin(t * 3), 0], head: [-0.2, 0, 0.12 * Math.sin(t * 2)] }),
    hide: (ta, t) => ({ armL: [2.0, -0.35, 0, 2.1], armR: [2.0, -0.35, 0, 2.1], lean: [0.15, 0], twist: 0.15 * Math.sin(t * 6), bob: 0.04 * Math.abs(Math.sin(t * 6)) }),
    shy: (ta, t) => ({ armL: [-0.45, -0.1, 0, 0.5], armR: [-0.45, -0.1, 0, 0.5], twist: 0.3 * Math.sin(t * 2.2), head: [0.25, 0.2 * Math.sin(t * 2.2), 0.15], legR: [0.15 + 0.12 * Math.sin(t * 4), 0.1] }),
    begging: (ta, t) => ({ armL: [1.35, -0.35, 0, 1.0], armR: [1.35, -0.35, 0, 1.0], lean: [0.12, 0], bob: 0.05 * Math.abs(Math.sin(t * 8)), head: [-0.2, 0, 0] }),
    chomp: (ta, t) => ({ armL: [2.1 + 0.25 * Math.sin(t * 12), 0.0, 0, 2.0], armR: [2.1 + 0.25 * Math.sin(t * 12 + 3), 0.0, 0, 2.0], head: [0.1 * Math.sin(t * 12), 0, 0], bob: 0.03 * Math.abs(Math.sin(t * 12)) }),
    bellyrub: (ta, t) => ({ armL: [0.7, -0.4, 0, 1.4 + 0.2 * Math.sin(t * 5)], armR: [0.7, -0.4, 0, 1.4 + 0.2 * Math.sin(t * 5 + 2)], lean: [-0.15, 0], head: [-0.12, 0, 0] }),
    waddle: (ta, t) => ({ armL: [0.1, 0.55], armR: [0.1, 0.55], twist: 0.1 * Math.sin(t * 5), lean: [0, 0.12 * Math.sin(t * 5)], legL: [0.25 * Math.max(0, Math.sin(t * 5)), 0.15], legR: [0.25 * Math.max(0, -Math.sin(t * 5)), 0.15] }),
    victory: (ta, t) => ({ armL: [3.0, 0.4, 0, 0.2], armR: [3.0, 0.4, 0, 0.2], jump: 0.45 * Math.abs(Math.sin(t * 6)), head: [-0.2, 0, 0] }),
    flail: (ta, t) => ({ armL: [1.6 + 1.2 * Math.sin(t * 14), 0.6, 0, 0.6], armR: [1.6 + 1.2 * Math.sin(t * 14 + 2), 0.6, 0, 0.6], twist: 0.2 * Math.sin(t * 9), bob: 0.06 * Math.abs(Math.sin(t * 14)) }),
    giggle: (ta, t) => ({ armR: [2.2, -0.3, 0, 2.2], armL: [0.6, 0.1, 0, 1.6], bob: 0.05 * Math.abs(Math.sin(t * 14)), head: [0.1, 0.1 * Math.sin(t * 7), 0] }),
    phone: (ta, t) => ({ armR: [2.4, -0.15, 0, 2.3], head: [0, 0.2 * Math.sin(t * 1.5), 0.15], armL: [0.4 * Math.abs(Math.sin(t * 3)), 0.2, 0, 1.0] }),
    tiptoe: (ta, t) => ({ lean: [0.2, 0], armL: [0.6, 0.5, 0, 1.6], armR: [0.6, 0.5, 0, 1.6], legL: [0.3 * Math.max(0, Math.sin(t * 4)), 0], legR: [0.3 * Math.max(0, -Math.sin(t * 4)), 0], head: [0, 0.3 * Math.sin(t * 2), 0] }),
    jumpjacks: (ta, t) => { const k = Math.abs(Math.sin(t * 6)); return { armL: [0, 0.2 + 2.6 * k], armR: [0, 0.2 + 2.6 * k], legL: [0, 0.35 * k], legR: [0, 0.35 * k], jump: 0.25 * k }; },
    stomp: (ta, t) => ({ armL: [-0.1, 0.3], armR: [-0.1, 0.3], bob: 0.1 * Math.abs(Math.sin(t * 6)), jump: 0.15 * Math.abs(Math.sin(t * 6)) }),
    // moves pack 4
    slash: (ta) => { const ph = (ta % 0.75) / 0.75, k = ph < 0.35 ? E.out(ph / 0.35) : 1 - E.io((ph - 0.35) / 0.65); const sw = ph < 0.35 ? 0 : E.out(Math.min(1, (ph - 0.35) / 0.25));
      return { armR: [T.lerp(2.7, 0.5, sw) * (ph < 0.35 ? k : 1), T.lerp(0.45, 0.5, sw), 0, 0.25], armL: [T.lerp(2.6, 0.7, sw), 0.25, 0, 0.6], twist: T.lerp(0.45, -0.55, sw), lean: [0.1 + 0.15 * sw, 0], legL: [0.35, 0.12], legR: [-0.3, 0.12], kneeL: 0.35, kneeR: 0.25, head: [0.1 * sw, -0.2 * sw, 0] }; },
    guard: (ta, t) => ({ armR: [1.35, -0.35, 0, 1.1], armL: [1.25, 0.32, 0, 1.4], legL: [0.38, 0.16], legR: [-0.32, 0.16], kneeL: 0.42, kneeR: 0.32, lean: [0.14, 0], twist: -0.2 + 0.04 * Math.sin(t * 2.2), head: [0.05, 0.15 + 0.08 * Math.sin(t * 1.7), 0] }),
    shush: (ta, t) => ({ armR: [2.0, -0.5, 0, 2.7], armL: [0.2, 0.1], lean: [0.12, 0], head: [0.08, 0.12 * Math.sin(t * 2), 0.06] }),
    lookaround: (ta, t) => ({ head: [0.05, 0.75 * Math.sin(t * 2.6), 0.1 * Math.sin(t * 5.2)], twist: 0.18 * Math.sin(t * 2.6), armL: [0.3, 0.35, 0, 0.8], armR: [0.3, 0.35, 0, 0.8], bob: 0.03 * Math.abs(Math.sin(t * 5)) }),
    tapfoot: (ta, t) => ({ armL: [1.1, -0.65, 0, 2.3], armR: [1.1, -0.65, 0, 2.3], legR: [0.25, 0.1], kneeR: 0.2 + 0.25 * Math.abs(Math.sin(t * 9)), head: [0, 0, 0.18 + 0.04 * Math.sin(t * 3)], lean: [-0.05, 0.05] }),
    fingerguns: (ta, t) => { const r = Math.max(0, 1 - ((ta % 0.5) / 0.12)); return { armL: [1.55 + 0.35 * r, 0.12, 0, 0.25], armR: [1.55 + 0.35 * r, -0.12, 0, 0.25], lean: [-0.1 - 0.05 * r, 0], head: [-0.08, 0.15, 0.12], twist: 0.15 }; },
    dab: (ta) => { const k = E.out(Math.min(1, ta / 0.25)); return { armR: [2.4 * k, 1.0 * k, 0, 0.15], armL: [1.7 * k, -0.7 * k, 0, 2.7 * k], head: [0.45 * k, -0.45 * k, 0], lean: [0.1 * k, -0.08 * k] }; },
    tantrum: (ta, t) => ({ armL: [0.6 + 0.9 * Math.abs(Math.sin(t * 11)), 0.5], armR: [0.6 + 0.9 * Math.abs(Math.cos(t * 11)), 0.5], legL: [0.45 * Math.max(0, Math.sin(t * 9)), 0], legR: [0.45 * Math.max(0, -Math.sin(t * 9)), 0], head: [0.15, 0.35 * Math.sin(t * 13), 0], bob: 0.06 * Math.abs(Math.sin(t * 9)) }),
    headscratch: (ta, t) => ({ armR: [2.65, -0.35, 0, 2.5 + 0.2 * Math.sin(t * 14)], armL: [0.15, 0.1], head: [0.05, 0.1, 0.22], lean: [0, 0.05] }),
    airguitar: (ta, t) => ({ armL: [1.25, 0.55, 0, 0.5], armR: [0.85 + 0.35 * Math.sin(t * 16), -0.25, 0, 1.7], head: [0.25 * Math.abs(Math.sin(t * 6)), 0, 0.1], legL: [0.25, 0.12], legR: [-0.2, 0.12], kneeL: 0.3, lean: [-0.12, 0], bob: 0.05 * Math.abs(Math.sin(t * 6)) }),
    wipe: (ta, t) => ({ armR: [2.45, -0.25 + 0.45 * Math.sin(t * 5), 0, 2.4], armL: [0.2, 0.15], head: [-0.1, 0, 0.1], lean: [-0.05, 0] }),
    zombie: (ta, t) => ({ armL: [1.6, 0.08 + 0.05 * Math.sin(t * 2)], armR: [1.6, 0.08 + 0.05 * Math.cos(t * 2)], head: [0.15, 0.1 * Math.sin(t * 1.3), 0.3], lean: [0.1, 0.06 * Math.sin(t * 1.6)], legL: [0.2 * Math.max(0, Math.sin(t * 2)), 0], legR: [0.2 * Math.max(0, -Math.sin(t * 2)), 0] }),
    groove: (ta, t) => ({ armL: [0.9 + 0.8 * Math.abs(Math.sin(t * 7)), 0.3, 0, 1.6], armR: [0.9 + 0.8 * Math.abs(Math.cos(t * 7)), 0.3, 0, 1.6], twist: 0.35 * Math.sin(t * 7), lean: [0, 0.1 * Math.sin(t * 7)], bob: 0.09 * Math.abs(Math.sin(t * 7)), head: [0.12 * Math.abs(Math.sin(t * 7)), 0, 0.15 * Math.sin(t * 3.5)] }),
    pray: (ta, t) => ({ armL: [1.45, -0.42, 0, 1.9], armR: [1.45, -0.42, 0, 1.9], head: [0.28, 0, 0], bob: 0.02 * Math.sin(t * 3) }),
    typing: (ta, t) => ({ armL: [1.1, -0.1, 0, 1.3 + 0.12 * Math.sin(t * 22)], armR: [1.1, -0.1, 0, 1.3 + 0.12 * Math.cos(t * 19)], head: [0.25, 0.05 * Math.sin(t * 2), 0], lean: [0.12, 0] }),
    yawn: (ta) => { const k = T.bump(ta, 0, 1.2); return { armL: [2.8 * k, 0.4 * k, 0, 0.3], armR: [2.8 * k, 0.4 * k, 0, 0.3], lean: [-0.15 * k, 0], head: [-0.3 * k, 0, 0] }; },
    sneeze: (ta) => { const pre = Math.min(1, ta / 0.6), hit = ta > 0.6 ? T.bump(ta, 0.6, 0.95) : 0; return { lean: [-0.2 * pre * (1 - hit) + 0.4 * hit, 0], head: [-0.35 * pre * (1 - hit) + 0.45 * hit, 0, 0], armR: [1.9 * hit, -0.4, 0, 2.2], jump: 0.1 * hit }; },
    kneelcry: (ta, t) => ({ legL: [1.4, 0], legR: [-0.1, 0], kneeL: 1.5, kneeR: 1.6, armL: [2.0, -0.4, 0, 2.6], armR: [2.0, -0.4, 0, 2.6], head: [0.35, 0, 0], bob: -0.55 + 0.03 * Math.sin(t * 12) }),
  });
  const FACES = Object.keys(T.EXPR);
  A.FACES = FACES;

  // ================================================================ effects: names, and the sound each makes (tools/audio.py reads FX_SFX)
  A.FX_TYPES = ["sparkle", "twinkle", "puff", "smoke", "hearts", "confetti", "zzz", "notes", "fire", "glow", "ring", "flash", "dark", "shake",
    "label", "bubble", "question", "exclaim", "grow", "shrink", "float", "spin", "vanish", "appear", "speed"];

  // ================================================================ props
  const PROPS = (A.PROPS = {
    // kind: (group, o) -> builds the prop at the group's origin (x, z, ry, y, s are set on the group afterwards)
    cake: (g, o) => T.PROP.cake(g, 0, 0, 0, 1),
    bike: (g, o) => T.PROP.bike(g, 0, 0, 0, o.color || "#e63946"),
    loaf: (g, o) => T.PROP.loaf(g, 0, 0, 0, 1, 0, 0),
    car: (g, o) => T.PROP.car(g, 0, 0, 0, o.color || "#3fa7ff", 1),
    lockbox: (g) => T.PROP.lockbox(g, 0, 0, 1),
    pencil: (g, o) => T.PROP.pencil(g, 0, 1.3, 0, 1, o.color || "#ffcc33"),
    eraser: (g, o) => T.PROP.eraser(g, 0, 0.35, 0, 1, o.color || "#ff9fb2"),
    gold: (g) => T.PROP.gold(g, 0, 0.3, 0, 1),
    flashlight: (g) => T.PROP.flashlight(g),
    ladder: (g) => T.PROP.ladder(g, 0, 0, 12, 0, 0.12),
    wheelbarrow: (g) => T.PROP.wheelbarrow(g, 0, 0, 0),
    crayons: (g) => T.PROP.crayons(g, 0, 0, 0, 1),
    cage: (g, o) => T.PROP.cage(g, 0, 0, o.r || 3, o.h || 6),
    sword: (g) => T.PROP.sword(g),
    shield: (g) => T.PROP.shield(g),
    ball: (g, o) => T.PROP.ball(g, o.color || "#ff4d6d"),
    stick: (g) => T.PROP.stick(g),
    chalkboard: (g, o) => T.PROP.chalkboard(g, 0, 3, 0, o.text || ["HELLO"], 8, 4),
    table: (g, o) => T.PROP.table(g, 0, 0, 6, 4, 3.2, o.color || "#b07a4a"),
    chair: (g, o) => T.PROP.chair(g, 0, 0, 0, o.color || "#d35400", 1),
    bed: (g, o) => T.PROP.bed(g, 0, 0, 0, o.color || "#5b8def"),
    trash: (g) => T.PROP.trash(g, 0, 0),
    rug: (g, o) => T.PROP.rug(g, 0, 0, 3, o.color || "#ff8fa3"),
    fridge: (g) => T.PROP.fridge(g, 0, 0),
    bench: (g) => W().bench(g, 0, 0, 0),
    tree: (g) => W().tree(g, 0, 0, 1, 2),
    lamp: (g) => W().lamp(g, 0, 0),
    priceTag: (g, o) => T.PROP.priceTag(g, (o.text && o.text[0]) || "$1", 0, 1, 0, 2.2, 1.2, 0, o.color || "#ffffff"),
    sign: (g, o) => {
      const lines = o.text || ["SIGN"], w = o.w || 5, h = o.h || 2.4;
      const box = (gw, gh, gd, col, x, y, z) => { const m = T.mesh(T.rbox(gw, gh, gd, 0.06, 2), T.mat(col), x, y, z); g.add(m); return m; };
      box(0.3, 4.2, 0.3, "#7a5230", 0, 2.1, -0.1);
      box(w + 0.4, h + 0.4, 0.3, "#7a5230", 0, 4.2 + h / 2 - 0.4, -0.05);
      const s = T.sign(lines, w, h, { bg: o.bg || "#fff6e0", fg: o.fg || "#2a1a10", radius: 24 }); s.position.set(0, 4.2 + h / 2 - 0.4, 0.12); g.add(s);
    },
    billboard: (g, o) => { W().billboard(g, 0, 0, 0, o.w || 10, o.h || (o.w || 10) * 0.5625, o.legs || 3); },
    crate: (g, o) => { const m = T.mesh(T.rbox(2.2, 2.2, 2.2, 0.12, 2), T.mat(o.color || "#c08040", { map: T.texLib.planksTex(o.color || "#c08040", 256) }), 0, 1.1, 0); g.add(m); },
    gift: (g, o) => {
      g.add(T.mesh(T.rbox(2, 1.6, 2, 0.1, 2), T.mat(o.color || "#e63946"), 0, 0.8, 0));
      g.add(T.mesh(T.box(2.04, 1.64, 0.4), T.mat("#ffd23f"), 0, 0.8, 0)); g.add(T.mesh(T.box(0.4, 1.64, 2.04), T.mat("#ffd23f"), 0, 0.8, 0));
      for (const s of [-1, 1]) { const b = T.mesh(T.sph(0.38, 12, 8), T.mat("#ffd23f"), s * 0.35, 1.75, 0); b.scale.set(1, 0.6, 0.6); g.add(b); }
    },
    balloon: (g, o) => {
      const b = T.mesh(T.sph(0.9, 20, 14), T.mat(o.color || "#ff4d6d", { r: 0.3 }), 0, 5.2, 0); b.scale.y = 1.18; g.add(b);
      g.add(T.mesh(T.box(0.04, 4.2, 0.04), T.mat("#ffffff"), 0, 2.1, 0));
    },
    trophy: (g) => {
      const gold = T.mat("#f2c230", { r: 0.25, m: 0.8 });
      g.add(T.mesh(T.rbox(1.4, 0.4, 1.4, 0.08, 2), T.mat("#5a3a22"), 0, 0.2, 0)); g.add(T.mesh(T.cyl(0.18, 0.28, 0.8, 12), gold, 0, 0.8, 0));
      g.add(T.mesh(T.cyl(0.85, 0.35, 1.2, 20), gold, 0, 1.8, 0));
      for (const s of [-1, 1]) { const h = T.mesh(new THREE.TorusGeometry(0.35, 0.09, 8, 16), gold, s * 0.95, 1.9, 0); h.rotation.y = Math.PI / 2; g.add(h); }
    },
    book: (g, o) => { g.add(T.mesh(T.rbox(1.6, 0.4, 2.1, 0.05, 2), T.mat(o.color || "#2e86de"), 0, 0.2, 0)); g.add(T.mesh(T.box(1.5, 0.32, 2.0), T.mat("#fbfaf4"), 0.08, 0.2, 0)); },
    bag: (g, o) => {
      const b = T.mesh(T.sph(1.0, 18, 12), T.mat(o.color || "#c9a66b", { r: 0.9 }), 0, 1.0, 0); b.scale.set(1, 1.1, 1); g.add(b);
      g.add(T.mesh(T.cyl(0.35, 0.5, 0.5, 12), T.mat(o.color || "#c9a66b", { r: 0.9 }), 0, 2.15, 0));
      const s = T.sign([o.text ? o.text[0] : "$"], 1.0, 1.0, { fg: "#2a1a10" }); s.position.set(0, 1.0, 1.02); g.add(s);
    },
    coin: (g) => { const m = T.mesh(T.cyl(0.6, 0.6, 0.14, 24), T.mat("#f2c230", { r: 0.25, m: 0.85 }), 0, 0.6, 0); m.rotation.x = Math.PI / 2; g.add(m); },
    cup: (g, o) => { g.add(T.mesh(T.cyl(0.45, 0.36, 0.9, 16), T.mat(o.color || "#ffffff"), 0, 0.45, 0)); const h = T.mesh(new THREE.TorusGeometry(0.25, 0.07, 6, 12), T.mat(o.color || "#ffffff"), 0.48, 0.5, 0); g.add(h); },
    apple: (g, o) => { g.add(T.mesh(T.sph(0.5, 16, 12), T.mat(o.color || "#e63946", { r: 0.35 }), 0, 0.5, 0)); g.add(T.mesh(T.box(0.06, 0.3, 0.06), T.mat("#5a3a22"), 0, 1.05, 0)); },
    phone: (g) => { g.add(T.mesh(T.rbox(0.8, 1.5, 0.12, 0.1, 2), T.mat("#1d1d22", { r: 0.3 }), 0, 0, 0)); g.add(T.mesh(T.box(0.68, 1.3, 0.02), T.mat("#3a5a9a", { e: "#5a8ae0", ei: 0.6 }), 0, 0, 0.07)); },
    umbrella: (g, o) => {
      const c = T.mesh(new THREE.ConeGeometry(2.4, 1.0, 10, 1, true), T.mat(o.color || "#e63946", { side: THREE.DoubleSide }), 0, 4.6, 0); g.add(c);
      g.add(T.mesh(T.cyl(0.06, 0.06, 4.4, 8), T.mat("#2b2b30"), 0, 2.3, 0));
    },
    stage: (g, o) => {
      const wood = T.mat("#b07a4a", { map: T.texLib.planksTex("#b07a4a", 512, [2, 1]) });
      g.add(T.mesh(T.rbox(10, 1.1, 6, 0.1, 2), wood, 0, 0.55, 0));
      g.add(T.mesh(T.rbox(10.4, 0.2, 0.3, 0.05, 2), T.mat("#c9a227", { r: 0.3, m: 0.6 }), 0, 1.0, 3.05));
      const red = T.mat(o.color || "#b3122e", { r: 0.85 });
      for (let i = 0; i < 9; i++) g.add(T.mesh(T.rbox(1.2, 8.6, 0.5, 0.25, 2), red, -4.8 + i * 1.2, 5.4, -2.9 + (i % 2) * 0.18));
      for (const sx of [-5.4, 5.4]) g.add(T.mesh(T.rbox(0.6, 10, 0.6, 0.1, 2), T.mat("#3a2a1c"), sx, 5, -2.9));
      g.add(T.mesh(T.rbox(11.4, 0.8, 0.8, 0.1, 2), T.mat("#3a2a1c"), 0, 9.9, -2.9));
      for (let i = 0; i < 7; i++) g.add(T.mesh(T.sph(0.22, 10, 8), W().lampMat, -4.5 + i * 1.5, 9.4, -2.4, { cast: false }));
      if (o.text) { const sg = T.sign(o.text, 7, 1.4, { bg: "#ffe14d", fg: "#2a1a10", radius: 30 }); sg.position.set(0, 11.2, -2.6); g.add(sg); }
    },
    drawing: (g, o) => { const p = T.DOODLE.single(o.design || "smiley", o.w || 3, o.h || 3, (o.w || 3) * 0.5); g.add(p.root); g.userData.puppet = p; },
    paper: (g, o) => {
      const sh = new T.DOODLE.Sheet(o.design || "smiley", { w: o.w || 3, h: o.h || 3 }); sh.set(1, 0); sh.mesh.position.y = (o.h || 3) / 2; g.add(sh.mesh); g.userData.sheet = sh;
    },
  });
  A.PROP_KINDS = Object.keys(PROPS);

  // ================================================================ compile the shot list
  const words = () => (window.CUES && window.CUES.words) || [];
  const takeIndex = (pid) => +pid.replace(/\D/g, "") - 1;
  // the absolute time of a phrase, searched from word index `from` (throws if missing)
  function at(phrase, from, nth, sid, what) {
    if (typeof phrase === "number") return phrase;
    const i = T.find(String(phrase), from, nth || 0);
    if (i < 0) throw new Error(`shot ${sid}: ${what} "${phrase}" is not spoken after the shot's anchor`);
    return words()[i][0];
  }
  const SIZES = (A.SIZES = {
    xclose: { fw: 0.62, fh: 0.9, eye: 0.14, pitch: 3, fov: 42 },
    close: { fw: 0.86, fh: 0.84, eye: 0.3, pitch: 5, fov: 44 },
    medium: { fw: 0.86, fh: 0.6, eye: 0.42, pitch: 8, fov: 46 },
    full: { fw: 0.86, fh: 0.7, eye: 0.42, pitch: 10, fov: 46 },
    wide: { fw: 0.8, fh: 0.3, eye: 0.3, pitch: 16, fov: 48 },
    xwide: { fw: 0.6, fh: 0.14, eye: 0.22, pitch: 24, fov: 52 },
    insert: { fw: 0.7, fh: 0.55, eye: 0.1, pitch: 32, fov: 44 },
    top: { fw: 0.8, fh: 0.6, eye: 0.1, pitch: 72, fov: 46 },
  });
  const HEIGHT = { low: -7, eye: null, high: 24, top: 72 };
  const parseCam = (c) => {
    if (!c) return { size: "medium" };
    if (typeof c === "string") { const p = c.trim().split(/\s+/); return { size: p[0], on: p.slice(1) }; }
    return Object.assign({}, c, { on: typeof c.on === "string" ? [c.on] : c.on });
  };
  const parseCast = (e) => {
    if (typeof e !== "string") return e;
    const [who, face, d] = e.split(":"); const o = { who }; if (face) o.face = face; if (d) o.do = d; return o;
  };

  function compile(d, idx) {
    const pl = PLACES[d.place || "plaza"];
    if (!pl && d.tpl !== "custom") throw new Error(`shot ${d.id}: unknown place "${d.place}" (places: ${Object.keys(PLACES).join(", ")})`);
    const def = { idx, at: d.at === undefined ? (idx === 0 ? 0 : null) : d.at, nth: d.nth || 0, lead: d.lead, shift: d.shift, data: d, place: pl, sky: d.sky || (pl && pl.room ? "room" : "day") };
    if (d.tpl === "custom") {
      const cu = (T.CUSTOM || {})[d.code || d.id];
      if (!cu) throw new Error(`shot ${d.id}: custom code "${d.code || d.id}" missing (assets/lib/custom.js)`);
      def.build = cu.build; def.draw = cu.draw;
      return def;
    }
    def.build = (g, s) => build(g, s);
    def.draw = (c) => draw(c);
    return def;
  }
  A.compileAll = () => {
    const list = window.SHOTDATA || [];
    list.forEach((d, i) => T.shot(d.id || "s" + String(i + 1).padStart(2, "0"), compile(d, i)));
  };

  // ---------------------------------------------------------------- build: resolve words, marks, props (once, at boot)
  function build(g, s) {
    const d = s.data, pl = s.place, from = s.wi || 0;
    const w = (ph, nth, what) => (ph === undefined || ph === null || ph === "start" ? s.start : ph === "end" ? s.end : at(ph, from, nth, s.id, what));
    s.wordAt = w;
    // cast
    const ents = (d.cast || []).map(parseCast);
    // cast without an "at" mark take the free places of the default line-up (left to right, in list order)
    const slots = (AUTO_MARKS[Math.min(ents.length, AUTO_MARKS.length) - 1] || []).slice();
    while (slots.length < ents.length) slots.push([(slots.length - ents.length / 2) * 3, 0]);
    for (const e of ents) if (e.at !== undefined) {
      const m = typeof e.at === "string" ? (MARKS[e.at] || (pl.spots && pl.spots[e.at] ? A.toPlace(pl, ...A.toWorld(pl, e.at)) : null)) : e.at;
      if (!m) throw new Error(`shot ${s.id}: unknown mark "${e.at}"`);
      let bi = 0, bd = 1e9; slots.forEach((q, k) => { const dd = Math.hypot(q[0] - m[0], q[1] - m[1]); if (dd < bd) { bd = dd; bi = k; } });
      slots.splice(bi, 1);
    }
    let si = 0;
    s.cast = ents.map((e, i) => {
      const a = A.actor(e.who);
      const m0 = e.at !== undefined ? e.at : slots[si++];
      const p0 = A.toWorld(pl, m0);
      const cs = { e, a, who: e.who, isDog: !!a.isDog, pos0: p0, y: e.y || 0, s: e.s || 1, segs: [], states: [], spot: A.spotOpts(pl, m0) };
      // movement + changes: a list of states in time order
      let cur = p0;
      const st0 = { t: -1e9, face: e.face || (a.isDog ? "happy" : "smile"), do: e.do || "idle", look: e.look || "cam", y: e.y || 0, shades: e.shades };
      cs.states.push(st0);
      if (e.to !== undefined) {
        const p1 = A.toWorld(pl, e.to), t0 = w(e.go, e.goNth, "go"), t1 = e.stop ? w(e.stop, e.stopNth, "stop") : s.end - 0.12;
        cs.segs.push({ t0: Math.max(t0, s.start), t1, a: cur, b: p1, move: e.move || "walk" }); cur = p1;
      }
      for (const th of e.then || []) {
        const t = w(th.at, th.nth, "then");
        const prev = cs.states[cs.states.length - 1];
        const ns = Object.assign({}, prev, { t, face: th.face || prev.face, do: th.do || prev.do, look: th.look || prev.look, y: th.y ?? prev.y, shades: th.shades ?? prev.shades, t0: t });
        if (th.do && th.do !== prev.do) ns.t0 = t; else ns.t0 = prev.t0 ?? t;
        cs.states.push(ns);
        if (th.to !== undefined) {
          const p1 = A.toWorld(pl, th.to), t1 = th.stop ? w(th.stop, th.stopNth, "stop") : s.end - 0.12;
          cs.segs.push({ t0: t, t1, a: cur, b: p1, move: th.move || "walk" }); cur = p1;
        }
      }
      cs.states.forEach((x) => { if (x.t0 === undefined) x.t0 = x.t; if (FACES.indexOf(x.face) < 0) throw new Error(`shot ${s.id}: unknown face "${x.face}" (faces: ${FACES.join(", ")})`); if (!DO[x.do]) throw new Error(`shot ${s.id}: unknown action "${x.do}" (actions: ${Object.keys(DO).join(", ")})`); });
      return cs;
    });
    // crowd (townsfolk around the action) and extras (townsfolk strolling far behind)
    s.crowd = [];
    if (d.crowd) {
      const cr = typeof d.crowd === "number" ? { n: d.crowd } : d.crowd;
      const used = new Set(s.cast.map((cs) => cs.a));
      const pool = T.FOLK.slice(0, T.FOLK.length - 4).filter((a) => !used.has(a));
      const n = Math.min(cr.n || 6, pool.length), rr = T.rng(97 + s.idx * 13);
      const center = [0, 0];
      for (let i = 0; i < n; i++) {
        let m;
        if ((cr.where || "behind") === "behind") { const k = n === 1 ? 0.5 : i / (n - 1); m = [T.lerp(-7.5, 7.5, k) + (rr() - 0.5) * 0.8, -4.6 - (i % 2) * 2.6 - rr() * 0.6]; }
        else if (cr.where === "front") { const row = i % 2, k = n <= 2 ? 0.5 : Math.floor(i / 2) / Math.max(1, Math.ceil(n / 2) - 1); m = [T.lerp(-6.5, 6.5, k) + row * 1.3 + (rr() - 0.5) * 0.5, 5.2 + row * 2.4]; }
        else if (cr.where === "around") { const ang = Math.PI * (0.15 + 0.7 * (n === 1 ? 0.5 : i / (n - 1))); m = [Math.cos(ang) * -7, -Math.sin(ang) * 6 + 1.5]; }
        else if (cr.where === "sides") { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2); m = [side * (5 + k * 2.6), 0.6 - k * 1.8]; }
        else { m = [T.lerp(-8, 8, n === 1 ? 0.5 : i / (n - 1)), -5]; }
        const p = A.toWorld(pl, [m[0] + center[0], m[1] + center[1]]);
        const states = [{ t: -1e9, t0: s.start, face: cr.face || "smile", do: cr.do || "idle" }];
        for (const th of cr.then || []) states.push({ t: w(th.at, th.nth, "crowd then"), t0: w(th.at, th.nth, "crowd then"), face: th.face || states[states.length - 1].face, do: th.do || states[states.length - 1].do });
        for (const x of states) { if (!DO[x.do]) throw new Error(`shot ${s.id}: unknown crowd action "${x.do}"`); if (FACES.indexOf(x.face) < 0) throw new Error(`shot ${s.id}: unknown crowd face "${x.face}"`); }
        s.crowd.push({ a: pool[i], pos: p, ph: rr() * 6, states, look: cr.look || "center" });
      }
    }
    s.extras = [];
    const nx = Math.min(d.extras || 0, 4);
    for (let i = 0; i < nx; i++) {
      const a = T.FOLK[T.FOLK.length - 1 - i], rr = T.rng(311 + s.idx * 7 + i);
      const c0 = A.toWorld(pl, [(rr() - 0.5) * 16, -12 - rr() * 8]);
      s.extras.push({ a, c: c0, r: 3 + rr() * 4, v: (rr() > 0.5 ? 1 : -1) * (2.6 + rr() * 1.4), a0: rr() * 6.28 });
    }
    // props
    s.props = {};
    for (const [i, p] of (d.props || []).entries()) {
      const id = p.id || p.kind + i;
      if (!PROPS[p.kind]) throw new Error(`shot ${s.id}: unknown prop "${p.kind}" (props: ${Object.keys(PROPS).join(", ")})`);
      const holder = T.group(g);
      PROPS[p.kind](holder, p);
      T.shadowAll(holder);
      const wp = p.hold ? [0, 0] : A.toWorld(pl, p.at !== undefined ? p.at : [0, 1.5]);
      holder.position.set(wp[0], p.y || 0, wp[1]);
      holder.rotation.y = (pl.yaw ? -pl.yaw * DEG : 0) + (p.ry || 0) * DEG;
      holder.scale.setScalar(p.s || 1);
      s.props[id] = { g: holder, p, base: { x: wp[0], y: p.y || 0, z: wp[1], s: p.s || 1 }, appear: p.appear ? w(p.appear, p.appearNth, "prop appear") : null, vanish: p.vanish ? w(p.vanish, p.vanishNth, "prop vanish") : null };
    }
    // effects
    s.fx = (d.fx || []).map((f, i) => {
      if (A.FX_TYPES.indexOf(f.type) < 0) throw new Error(`shot ${s.id}: unknown effect "${f.type}" (effects: ${A.FX_TYPES.join(", ")})`);
      return Object.assign({}, f, { t0: w(f.at, f.nth, "effect"), t1: f.until ? w(f.until, f.untilNth, "effect until") : s.end + 1, seed: 7 + i * 31 + s.idx * 3 });
    });
    // labels and bubbles need textures
    for (const f of s.fx) {
      if (f.type === "label" && Array.isArray(f.count)) {
        f.texFor = labelTexFor(f);
        f.tex = f.texFor(String(f.count[0]));
        if (f.step) { const Wd = words(); f.stepTimes = Wd.filter((x) => x[0] >= f.t0 - 1e-6 && x[0] < f.t1).map((x) => x[0]); }
        f.tVis = s.end + 1;
      } else if (f.type === "label") f.tex = T.textTex([String(f.text || "!")], { w: 512, h: 200, bg: f.bg || "#ffffff", fg: f.fg || "#1d1a22", radius: 60, border: f.fg || "#1d1a22", borderW: 14 });
      if (f.type === "bubble" || f.type === "question" || f.type === "exclaim") f.tex = bubbleTex(f.type === "question" ? "?" : f.type === "exclaim" ? "!" : String(f.text || "..."));
      if (f.tex) { f.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: f.tex, transparent: true, depthWrite: false, fog: false })); f.sprite.visible = false; f.sprite.renderOrder = 5; g.add(f.sprite); }
    }
    // paper template (a drawing appearing on a sheet, a hand drawing it)
    if (d.tpl === "paper") {
      const tb = pl.table || [0, 3.42, 0], X = pl.room ? W().rooms[pl.room].position.x : 0;
      const sh = new T.DOODLE.Sheet(d.design || "smiley", { w: d.w || 4.4, h: d.w || 4.4, bg: d.bg });
      g.add(sh.mesh);
      const base = pl.room ? [X + tb[0], tb[1], tb[2]] : [A.toWorld(pl, [0, 0])[0], 0.05, A.toWorld(pl, [0, 0])[1]];
      sh.mesh.rotation.set(-Math.PI / 2, 0, 0); sh.mesh.position.set(base[0], base[1], base[2]);
      const by = d.by ? A.actor(d.by).spec : {};
      s.paper = { sh, base, hand: drawHand(g, (by && (by.sleeves || by.shirt)) || "#3cb371", (by && by.skin) || "#f3c49b", d.tool || "pencil", d.color || "#ffcc33", 1.45) };
    }
    s.drawFrom = w(d.drawFrom, d.drawFromNth, "drawFrom");
    s.drawTo = d.drawTo ? w(d.drawTo, d.drawToNth, "drawTo") : s.end - 0.1;
    s.cam0 = parseCam(d.cam || (d.tpl === "paper" ? "top" : undefined));
    if (!SIZES[s.cam0.size]) throw new Error(`shot ${s.id}: unknown camera size "${s.cam0.size}" (sizes: ${Object.keys(SIZES).join(", ")})`);
  }
  A.build = build;

  // label textures for counters, one per shown value (cached)
  function labelTexFor(f) {
    const cache = new Map();
    return (txt) => { if (!cache.has(txt)) cache.set(txt, T.textTex([txt], { w: 512, h: 200, bg: f.bg || "#ffffff", fg: f.fg || "#1d1a22", radius: 60, border: f.fg || "#1d1a22", borderW: 14 })); return cache.get(txt); };
  }
  const fmtNum = (n) => Math.round(n).toLocaleString("en-US");
  A.counterText = (f, t) => {
    const [a, b] = f.count;
    let k;
    if (f.stepTimes && f.stepTimes.length) { let n = 0; for (const x of f.stepTimes) if (t >= x) n++; k = n / f.stepTimes.length; return fmtNum(a + Math.sign(b - a) * Math.min(Math.abs(b - a), n * (f.per || 1))) + (f.suffix || ""); }
    k = E.out(T.prog(t, f.t0, f.t0 + (f.dur || 1.5)));
    return fmtNum(T.lerp(a, b, k)) + (f.suffix || "");
  };
  // speech bubble texture that fits its text
  function bubbleTex(txt) {
    const short = txt.length <= 2, W2 = short ? 512 : 768, c = T.canvas(W2, 512), g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.strokeStyle = "#1d1a22"; g.lineWidth = 18;
    g.beginPath(); g.roundRect(30, 40, W2 - 60, 330, 90); g.fill(); g.stroke();
    const tx = short ? 230 : 250;
    g.beginPath(); g.moveTo(tx - 40, 360); g.lineTo(tx, 470); g.lineTo(tx + 60, 360); g.closePath(); g.fill(); g.stroke();
    g.fillRect(tx - 35, 345, 90, 26);
    g.fillStyle = "#1d1a22"; g.textAlign = "center"; g.textBaseline = "middle";
    const lines = txt.length > 14 ? txt.split(/\s+/).reduce((acc, w) => { const l = acc[acc.length - 1]; if (l && (l + " " + w).length <= 14) acc[acc.length - 1] = l + " " + w; else acc.push(w); return acc; }, []) : [txt];
    let size = short ? 230 : 150;
    const fit = () => { g.font = `900 ${size}px ${T.FONT}`; return Math.max(...lines.map((l) => g.measureText(l).width)); };
    while ((fit() > W2 - 120 || size * 1.02 * lines.length > 300) && size > 30) size -= 6;
    const lh = size * 1.02, y0 = 205 - (lh * (lines.length - 1)) / 2;
    lines.forEach((l, i) => g.fillText(l, W2 / 2, y0 + i * lh));
    const t = T.tex(c); t.userData = { aspect: W2 / 512 }; return t;
  }
  A.bubbleTex = bubbleTex;

  // a hand holding a pencil / crayon / chalk, its tip at the group's origin (paper close-ups)
  function drawHand(parent, sleeve, skin, tool = "pencil", color = "#ffcc33", dir = 1.3) {
    const g = T.group(parent), ax = T.group(g); ax.rotation.set(1.15, 0, -0.3); g.rotation.y = dir;
    const M = T.mat;
    if (tool === "chalk") ax.add(T.mesh(T.cyl(0.24, 0.24, 1.4, 10), M("#f4f4f0", { r: 0.95 }), 0, 0.7, 0));
    else {
      const tip = T.mesh(new THREE.ConeGeometry(0.19, 0.46, 8), M(tool === "crayon" ? color : "#f2d7a6"), 0, 0.23, 0); tip.rotation.x = Math.PI; ax.add(tip);
      if (tool === "pencil") { const ld = T.mesh(new THREE.ConeGeometry(0.08, 0.18, 8), M("#2b2b30"), 0, 0.09, 0); ld.rotation.x = Math.PI; ax.add(ld); }
      ax.add(T.mesh(T.cyl(0.19, 0.19, 2.2, 8), M(color, { r: 0.5 }), 0, 0.46 + 1.1, 0));
    }
    ax.add(T.mesh(T.rbox(0.95, 1.0, 0.95, 0.28), M(skin, { r: 0.6 }), 0.08, 1.55, 0.14));
    ax.add(T.mesh(T.rbox(1.0, 6, 1.0, 0.22), M(sleeve, { r: 0.7 }), 0.12, 1.55 + 3.4, 0.2));
    T.shadowAll(g);
    return g;
  }
  A.drawHand = drawHand;

  // ---------------------------------------------------------------- staging: put everything where it is at time t
  const curState = (states, t) => { let s = states[0]; for (const x of states) if (t >= x.t) s = x; return s; };
  function posAt(cs, t) {
    let p = cs.pos0, mv = null, ph;
    for (const sg of cs.segs) {
      if (t < sg.t0) break;
      const k = T.prog(t, sg.t0, sg.t1), e = sg.move === "run" ? k : E.io(k) * 0.15 + k * 0.85;
      p = [sg.a[0] + (sg.b[0] - sg.a[0]) * e, sg.a[1] + (sg.b[1] - sg.a[1]) * e];
      if (k < 1) { const dist = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]); mv = sg; ph = dist * e * (sg.move === "run" ? 1.5 : 1.9); }
    }
    return { p, mv, ph };
  }
  // a speaking role's mouth opens on its words (character lines in story.json have "speaker")
  function speaking(role, t) {
    const S = window.STORY, Wd = words();
    if (!S || !S.paragraphs) return false;
    let lo = 0, hi = Wd.length - 1, i = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (Wd[m][0] <= t) { i = m; lo = m + 1; } else hi = m - 1; }
    if (i < 0) return false;
    const wd = Wd[i], par = S.paragraphs[takeIndex(wd[3])];
    if (!par || par.speaker !== role) return false;
    return t < wd[0] + (wd[1] - wd[0]) * 0.75;
  }
  // effect modifiers on a target (grow, shrink, float, spin, vanish, appear) -> {s, y, ry, hide}
  function mods(s, target, t) {
    const o = { s: 1, y: 0, ry: 0, hide: false };
    for (const f of s.fx) {
      if (f.on !== target || t < f.t0 - 0.001) continue;
      const k = T.prog(t, f.t0, f.t0 + (f.dur || 0.45));
      if (f.type === "grow") o.s *= T.lerp(1, f.amount || 2, E.back(k));
      else if (f.type === "shrink") o.s *= T.lerp(1, f.amount || 0.4, E.back(k));
      else if (f.type === "float") o.y += (f.amount || 3) * E.io(T.prog(t, f.t0, f.t0 + (f.dur || 1.2))) + 0.18 * Math.sin(t * 3);
      else if (f.type === "spin") o.ry += (f.amount || 2) * Math.PI * 2 * E.io(T.prog(t, f.t0, f.t0 + (f.dur || 0.8)));
      else if (f.type === "vanish") { o.s *= 1 - E.in(k); if (k >= 1) o.hide = true; }
      else if (f.type === "appear") { o.s *= E.pop(k); }
    }
    for (const f of s.fx) if (f.type === "appear" && f.on === target && t < f.t0) o.hide = true;
    return o;
  }
  function stage(c, t) {
    const s = c.shot, d = s.data, pl = s.place;
    // world + light
    if (pl.room) { T.show(W().rooms[pl.room]); }
    else {
      T.show(W().town);
      W().setTower(d.tower === "burned");
      const ck = d.clock || { day: [10, 10], morning: [7, 40], afternoon: [3, 25], dusk: [6, 50], night: [11, 55], dawn: [5, 45] }[s.sky] || [10, 10];
      W().setClock(ck[0], ck[1]);
    }
    if (Array.isArray(s.sky)) T.setSky(...s.sky); else T.setSky(s.sky);
    // cast
    const camPos = s.solved ? s.solved.pos : null;
    const center = s.cast.length ? s.cast.reduce((a, cs) => [a[0] + posAt(cs, t).p[0] / s.cast.length, a[1] + posAt(cs, t).p[1] / s.cast.length], [0, 0]) : [0, 0];
    for (const cs of s.cast) {
      const st = curState(cs.states, t), ta = t - st.t0;
      const { p, mv, ph } = posAt(cs, t);
      const m = mods(s, cs.who, t);
      let ry;
      if (mv) ry = Math.atan2(mv.b[0] - mv.a[0], mv.b[1] - mv.a[1]);
      else ry = faceDir(cs, st.look, p, camPos, center, s, t);
      const pose = DO[st.do](ta, t) || {};
      let face = st.face;
      if (speaking(cs.who, t)) face = "talk";
      const sc = cs.s * m.s;
      if (cs.isDog) {
        cs.a.set({ x: p[0], y: cs.y + m.y + (pose._fly || 0), z: p[1], ry: ry + m.ry, s: sc, walk: mv ? ph : undefined, run: mv && mv.move === "run", face, wag: 0.6, jump: pose.jump || 0, tongue: true }, t);
      } else {
        const P = Object.assign({ x: p[0], y: st.y + cs.y + m.y + (pose._fly || 0), z: p[1], ry: ry + m.ry, s: sc, face, shades: st.shades }, pose);
        if (mv) { P.walk = ph; P.run = mv.move === "run"; if (mv.move === "sneak") Object.assign(P, DO.sneak()); }
        if (pose._lie) { P.rx = -Math.PI / 2; P.y = (P.y || 0) + 0.7 * sc + (cs.spot.lie || 0); P.face = st.face === "smile" ? "sleepy" : st.face; P.still = true; }
        if (pose._fall) { P.rx = -1.45 * pose._fall; P.y = (P.y || 0) + 0.2 * pose._fall; }
        if (pose._sit) {
          let seat = cs.spot.seat;
          if (seat === undefined) for (const pr of Object.values(s.props)) if ((pr.p.kind === "chair" || pr.p.kind === "bench") && Math.hypot(pr.base.x - p[0], pr.base.z - p[1]) < 1.4) seat = (pr.p.kind === "chair" ? 2.15 : 1.45) * pr.base.s;
          if (seat === undefined) { P.kneeL = P.kneeR = 0.12; }
          P.y = (P.y || 0) + (seat !== undefined ? seat + 0.42 : 0.42) - cs.a.b.legH * sc;
        }
        cs.a.set(P, t);
      }
      cs.a.root.visible = !m.hide;
    }
    // crowd + extras
    for (const cr of s.crowd) {
      const st = curState(cr.states, t), ta = t - st.t0 + cr.ph * 0.1;
      const ry = cr.look === "cam" && camPos ? Math.atan2(camPos.x - cr.pos[0], camPos.z - cr.pos[1]) : Math.atan2(center[0] - cr.pos[0], center[1] - cr.pos[1]);
      cr.a.set(Object.assign({ x: cr.pos[0], z: cr.pos[1], ry, face: st.face }, DO[st.do](ta, t + cr.ph)), t + cr.ph);
    }
    for (const x of s.extras) {
      const a = x.a0 + (t * x.v) / x.r, px = x.c[0] + Math.cos(a) * x.r, pz = x.c[1] + Math.sin(a) * x.r, sg = Math.sign(x.v);
      x.a.set({ x: px, z: pz, ry: Math.atan2(-Math.sin(a) * sg, Math.cos(a) * sg), walk: t * Math.abs(x.v) * 1.9, face: "smile" }, t);
    }
    // props (held props follow a hand)
    T.scene.updateMatrixWorld(true);
    for (const [id, pr] of Object.entries(s.props)) {
      const m = mods(s, "prop:" + id, t);
      let vis = !m.hide;
      if (pr.appear !== null && t < pr.appear) vis = false;
      if (pr.vanish !== null && t >= pr.vanish) vis = false;
      pr.g.visible = vis;
      if (pr.p.hold) {
        const a = A.actor(pr.p.hold), hand = a.hand ? a.hand[pr.p.hand || "R"] : a.root;
        const hp = V(); hand.getWorldPosition(hp);
        const hc = s.cast.find((x) => x.a === a), act = hc ? curState(hc.states, t).do : "";
        if (a.hand && !pr.p.hand && (act === "hold" || act === "carry")) { const hl = V(); a.hand.L.getWorldPosition(hl); hp.add(hl).multiplyScalar(0.5); }
        pr.g.position.set(hp.x, hp.y + (pr.p.dy ?? -0.2) + m.y, hp.z);
        pr.g.rotation.y = a.root.rotation.y + (pr.p.ry || 0) * DEG;
        pr.g.rotation.x = pr.p.kind === "book" ? -1.15 : 0; // a held book shows its cover
        if (a.hand && pr.p.kind === "stick" && (act === "hold" || act === "carry")) pr.g.rotation.y = a.root.rotation.y + Math.PI / 2; // two hands: a staff across the body
        else if (a.hand && (pr.p.kind === "sword" || pr.p.kind === "stick") && !pr.p.upright) { // a blade follows the hand: it swings with the arm
          const q = new THREE.Quaternion(); hand.getWorldQuaternion(q);
          // the blade continues out of the fist along the forearm (-Y of the hand): down at the side, up in a guard, over the head in a swing
          pr.g.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pr.p.kind === "sword" ? Math.PI : Math.PI / 2));
          const dn = new THREE.Vector3(0, -1, 0).applyQuaternion(q).multiplyScalar(0.3 * (a.root.scale.x || 1));
          pr.g.position.set(hp.x + dn.x, hp.y + dn.y + m.y, hp.z + dn.z);
        }
      } else pr.g.position.set(pr.base.x, pr.base.y + m.y, pr.base.z);
      pr.g.scale.setScalar(pr.base.s * m.s);
      if (pr.g.userData.puppet) pr.g.userData.puppet.boil(t);
    }
    // paper close-up
    if (s.paper) {
      const k = E.io(T.prog(t, s.drawFrom + 0.05, s.drawTo));
      s.paper.sh.set(k, T.DOODLE.boil(t, 2, 12));
      const lx = s.paper.sh.tip(k), b = s.paper.base;
      s.paper.hand.position.set(b[0] + lx[0], b[1] + 0.03 + 0.04 * Math.abs(Math.sin(t * 30)), b[2] - lx[1]);
    }
  }
  function faceDir(cs, look, p, camPos, center, s, t) {
    const pl = s.place;
    const toward = (x, z) => Math.atan2(x - p[0], z - p[1]);
    const front = -pl.yaw * DEG; // facing the default camera
    if (look === "cam" || !look) {
      if (!camPos) return front;
      let ry = toward(camPos.x, camPos.z);
      if (s.cast.length > 1) { const dc = Math.hypot(center[0] - p[0], center[1] - p[1]); if (dc > 0.5) ry = angLerp(ry, toward(center[0], center[1]), 0.22); }
      return ry;
    }
    if (look === "center") return toward(center[0], center[1]);
    if (look === "away") return front + Math.PI;
    if (look === "left" || look === "right") { const B = A.placeBasis(pl), sg = look === "left" ? -1 : 1; return Math.atan2(B.r[0] * sg, B.r[1] * sg); }
    if (typeof look === "number") return front + look * DEG;
    const other = s.cast.find((x) => x.who === look);
    if (other) { const q = posAt(other, t).p, ry = toward(q[0], q[1]); return camPos ? angLerp(ry, toward(camPos.x, camPos.z), 0.35) : ry; }
    return front;
  }
  const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

  // ---------------------------------------------------------------- what the camera must see
  const _v = new THREE.Vector3();
  function actorCorners(a, size) {
    a.root.updateMatrixWorld(true);
    const out = [];
    if (a.isDog) {
      for (const x of [-0.9, 0.9]) for (const y of [0, 3.4]) for (const z of [-1.9, 2.5]) out.push(new THREE.Vector3(x, y, z).applyMatrix4(a.root.matrixWorld));
      return out;
    }
    const b = a.b, H = b.head, hat = a.hatG ? H * 0.7 : 0.25;
    const neck = b.legH + b.torH + 0.04, top = neck + H + hat;
    const y0 = size === "xclose" ? neck - 0.15 : size === "close" ? neck - 1.0 : size === "medium" ? b.legH * 0.5 : 0;
    const hw = size === "xclose" ? H * 0.62 : b.torW / 2 + b.armW + 0.12, hd = Math.max(b.torD, H) / 2;
    for (const x of [-hw, hw]) for (const y of [y0, top]) for (const z of [-hd, hd]) out.push(new THREE.Vector3(x, y, z).applyMatrix4(a.root.matrixWorld));
    return out;
  }
  function headOf(a) {
    if (a.isDog) { const p = V(); a.headG.getWorldPosition(p); return p; }
    const p = V(); a.head.getWorldPosition(p); return p;
  }
  A.headOf = headOf;
  function subjects(s) {
    const cam = s.cam0, on = cam.on && cam.on.length ? cam.on : null;
    const list = [];
    for (const cs of s.cast) if (!on || on.indexOf(cs.who) >= 0) list.push({ kind: "actor", who: cs.who, a: cs.a });
    for (const [id, pr] of Object.entries(s.props)) if ((on && on.indexOf("prop:" + id) >= 0) || (!on && pr.p.key)) list.push({ kind: "prop", who: "prop:" + id, g: pr.g });
    if (on && on.indexOf("crowd") >= 0) for (const cr of s.crowd) list.push({ kind: "actor", who: "crowd", a: cr.a, minor: true });
    if (s.paper) list.push({ kind: "point", who: "paper", pts: paperPts(s) });
    return list;
  }
  function paperPts(s) { const b = s.paper.base, w = (s.data.w || 4.4) / 2; return [[-w, 0, -w], [w, 0, -w], [-w, 0, w], [w, 0, w], [0, 1.2, 0]].map(([x, y, z]) => new THREE.Vector3(b[0] + x, b[1] + y, b[2] + z)); }
  function propCorners(g) {
    const b = new THREE.Box3().setFromObject(g); if (b.isEmpty()) { const p = V(); g.getWorldPosition(p); b.setFromCenterAndSize(p, new THREE.Vector3(1, 1, 1)); }
    const out = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) out.push(new THREE.Vector3(x, y, z)); return out;
  }

  // ---------------------------------------------------------------- the camera solver
  const tmp = { f: V(), r: V(), u: V() };
  function basis(yaw, pitch) {
    const y = yaw * DEG, p = pitch * DEG;
    const f = new THREE.Vector3(Math.sin(y) * Math.cos(p), -Math.sin(p), -Math.cos(y) * Math.cos(p));
    const r = new THREE.Vector3(Math.cos(y), 0, Math.sin(y));
    const u = new THREE.Vector3().crossVectors(r, f);
    return { f, r, u };
  }
  // fit the points into the frame for a direction; returns camera position, target and fov
  function fit(pts, eyes, sz, yaw, pitch, fov) {
    const { f, r, u } = basis(yaw, pitch);
    const B = new THREE.Box3().setFromPoints(pts), C0 = B.getCenter(V());
    const H = eyes.length ? eyes.reduce((a, e) => a.add(e), V()).multiplyScalar(1 / eyes.length) : C0.clone();
    const tv = Math.tan((fov / 2) * DEG), th = tv * (T.W / T.H);
    const rel = pts.map((p) => p.clone().sub(C0)), hr = H.clone().sub(C0);
    const ev = (d) => {
      const hz = hr.dot(f) + d, k = hr.dot(u) - sz.eye * hz * tv;
      let xmin = 1e9, xmax = -1e9, ymin = 1e9, ymax = -1e9, zmin = 1e9;
      for (const q of rel) {
        const z = q.dot(f) + d, x = q.dot(r), y = q.dot(u) - k;
        zmin = Math.min(zmin, z);
        const nx = x / (Math.max(z, 0.05) * th), ny = y / (Math.max(z, 0.05) * tv);
        xmin = Math.min(xmin, nx); xmax = Math.max(xmax, nx); ymin = Math.min(ymin, ny); ymax = Math.max(ymax, ny);
      }
      return { k, xmin, xmax, ymin, ymax, zmin };
    };
    const ok = (q) => q.zmin > 0.6 && (q.xmax - q.xmin) / 2 <= sz.fw && (q.ymax - q.ymin) / 2 <= sz.fh && q.ymax <= 0.95 && q.ymin >= -0.97 && q.xmax <= 0.95 && q.xmin >= -0.95;
    let lo = 0.8, hi = 600;
    if (!ok(ev(hi))) hi = 1200;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (ok(ev(m))) hi = m; else lo = m; }
    const d = hi, q = ev(d);
    // centre horizontally
    const zc = rel.reduce((a, p) => a + p.dot(f), 0) / rel.length + d;
    const m = ((q.xmin + q.xmax) / 2) * zc * th;
    const pos = C0.clone().addScaledVector(f, -d).addScaledVector(u, q.k).addScaledVector(r, m);
    const tgt = pos.clone().addScaledVector(f, d);
    if (pos.y < 0.8) { const dy = 0.8 - pos.y; pos.y += dy; tgt.y += dy; } // a low camera stays above the ground
    return { pos, tgt, fov, d, yaw, pitch, f, r, u };
  }
  // where may the camera not stand?
  function blockedAt(pos, s) {
    const pl = s.place;
    if (pos.y < 0.4) return "below the ground";
    if (pl.room) {
      const rm = W().rooms[pl.room], [w, d, h] = rm.userData.size, X = rm.position.x;
      if (pos.x < X - w / 2 + 0.7 || pos.x > X + w / 2 - 0.7 || pos.z < -d / 2 + 0.7 || pos.z > d / 2 + 22 || pos.y > h - 0.4) return "outside the room";
      for (const b of rm.userData.furniture) if (b.containsPoint(pos)) return "inside furniture";
      return null;
    }
    for (const b of W().blockers || []) if (b.containsPoint(pos)) return "inside a building or tree";
    return null;
  }
  // visible meshes a sight line can hit (no sky, sprites or see-through glass)
  function solidMeshes() {
    const out = [];
    const walk = (o) => {
      if (!o.visible) return;
      if (o === T.sky || o.isSprite || o.isPoints) return;
      if (o.isMesh) { const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!(m && m.transparent && m.opacity < 0.5) && !(m && m.isMeshBasicMaterial && m.depthWrite === false)) out.push(o); }
      for (const ch of o.children) walk(ch);
    };
    walk(T.scene);
    return out;
  }
  const ray = new THREE.Raycaster();
  const ownedBy = (o, root) => { for (let x = o; x; x = x.parent) if (x === root) return true; return false; };
  // which subjects' heads are hidden from pos? -> [{who, by}]
  // how much of each subject's face is hidden from pos: five sight lines (centre, left, right, top, bottom) -> [{who, by, frac}]
  function hidden(pos, subs, meshes, right) {
    const out = [];
    const rv = right || new THREE.Vector3(1, 0, 0);
    for (const sb of subs) {
      if (sb.kind !== "actor" || sb.minor) continue;
      const h = headOf(sb.a), hs = (sb.a.b ? sb.a.b.head : 1.2) * sb.a.root.scale.x;
      const pts = [h, h.clone().addScaledVector(rv, -0.32 * hs), h.clone().addScaledVector(rv, 0.32 * hs), h.clone().add(new THREE.Vector3(0, 0.3 * hs, 0)), h.clone().add(new THREE.Vector3(0, -0.3 * hs, 0))];
      let blocked = 0, by = null;
      for (const q of pts) {
        const dir = q.clone().sub(pos), dist = dir.length();
        ray.set(pos, dir.normalize()); ray.near = 0.05; ray.far = Math.max(0.1, dist - 0.75 * hs);
        const hits = ray.intersectObjects(meshes, false);
        for (const ht of hits) { if (ownedBy(ht.object, sb.a.root)) continue; blocked++; if (!by) by = nameOf(ht.object); break; }
      }
      if (blocked) out.push({ who: sb.who, by, frac: blocked / pts.length });
    }
    return out;
  }
  function nameOf(o) {
    for (let x = o; x; x = x.parent) {
      for (const a of Object.values(A.ROLES)) if (a.root === x) return a.role;
      for (const [k, a] of Object.entries(T.CAST)) if (a.root === x) return k;
      const fi = T.FOLK.findIndex((a) => a.root === x); if (fi >= 0) return "a townsperson";
      if (x === W().school) return "the school"; if (x === W().hall) return "the town hall"; if (x === W().bakery) return "the bakery";
      if (W().houses && W().houses.indexOf(x) >= 0) return "a house"; if (x === W().paperShop || x === W().jewelShop) return "a shop";
    }
    return "an object";
  }
  // how many non-subject people stand close to the lens, inside the frame, well in front of the subjects
  function clutter(sol, s, subs) {
    const tv = Math.tan((sol.fov / 2) * DEG), th = tv * (T.W / T.H);
    const own = new Set(subs.filter((sb) => sb.kind === "actor").map((sb) => sb.a));
    const c0 = subs.length ? subs.filter((sb) => sb.kind === "actor").map((sb) => headOf(sb.a)) : [];
    const dSub = c0.length ? c0.reduce((a, h) => a + h.clone().sub(sol.pos).dot(sol.f), 0) / c0.length : sol.d;
    let n = 0;
    const others = [...s.cast.map((cs) => cs.a), ...s.crowd.map((cr) => cr.a), ...s.extras.map((x) => x.a)];
    for (const a of others) {
      if (own.has(a) || !a.root.visible) continue;
      // the part of the frame this person's body covers, if they stand well in front of the subjects
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, near = false;
      for (const q of actorCorners(a, "full")) {
        const rel = q.sub(sol.pos), z = rel.dot(sol.f);
        if (z < 0.3) { near = true; continue; }
        if (z > 0.62 * dSub) continue;
        near = true;
        const x = rel.dot(sol.r) / (z * th), y = rel.dot(sol.u) / (z * tv);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      if (!near || x0 > x1) continue;
      const cw = Math.max(0, Math.min(1, x1) - Math.max(-1, x0)), ch = Math.max(0, Math.min(1, y1) - Math.max(-1, y0));
      const area = (cw * ch) / 4;
      if (area > 0.03) n += Math.min(1.5, area * 5);
    }
    return Math.round(n * 10) / 10;
  }
  A.clutter = clutter;
  // solve the camera for a shot (cached): fits the subjects over the shot, turns away from walls and hidden faces
  function solve(c) {
    const s = c.shot, cam = s.cam0, sz = SIZES[cam.size], pl = s.place;
    const samples = [0.03, 0.25, 0.5, 0.75, 0.97].map((k) => T.lerp(s.start + 0.05, s.end - 0.05, k));
    for (const cs of s.cast) for (const st of cs.states) if (st.t > s.start) for (const dt of [0.2, 0.36, 0.6]) if (st.t + dt < s.end) samples.push(st.t + dt);
    for (const f of s.fx) if (f.t0 > s.start) for (const dt of [0.3, 0.8, 1.6]) if (f.t0 + dt < s.end) samples.push(f.t0 + dt);
    samples.sort((x, y) => x - y);
    const pts = [], eyes = [];
    let subs = [];
    for (const t of samples) {
      stage(c, t);
      T.scene.updateMatrixWorld(true);
      subs = subjects(s);
      for (const sb of subs) {
        if (sb.kind === "actor") { pts.push(...actorCorners(sb.a, cam.size)); if (!sb.minor) eyes.push(headOf(sb.a)); }
        else if (sb.kind === "prop") pts.push(...propCorners(sb.g));
        else pts.push(...sb.pts);
      }
    }
    let szUse = sz;
    if (!pts.length) {
      // nobody to frame: show the place (a box 18 wide and 10 high around the stage), level and centred
      const big = cam.size === "xwide" ? 2.2 : 1;
      for (const mx of [-9 * big, 9 * big]) for (const my of [0, 10 * Math.sqrt(big)]) for (const mz of [-3, 3]) { const p = A.toWorld(pl, [mx, mz]); pts.push(new THREE.Vector3(p[0], my, p[1])); }
      szUse = Object.assign({}, sz, { fw: 0.95, fh: 0.75, eye: -0.05 });
    }
    // bubbles and labels above framed subjects stay in frame
    for (const f of s.fx) {
      if (["label", "bubble", "question", "exclaim"].indexOf(f.type) < 0) continue;
      if (f.on && subs.find((sb) => sb.who === f.on)) {
        stage(c, Math.min(s.end - 0.05, f.t0 + 0.3)); T.scene.updateMatrixWorld(true);
        const P = new THREE.Vector3(...targetPos(s, f.on, f.part || defaultPart(f.type), f.t0 + 0.3));
        const rv = basis((pl.yaw || 0) + (cam.angle || 0), 0).r;
        if (f.type === "label") {
          const hgt = 1.25 * (f.size || 1), wid = hgt * 2.56;
          for (const dx of [-wid / 2, wid / 2]) for (const dy of [0.15, 0.15 + hgt]) pts.push(P.clone().addScaledVector(rv, dx).add(new THREE.Vector3(0, dy, 0)));
        } else {
          const hgt = 2.2 * (f.size || 1), asp = (f.tex && f.tex.userData && f.tex.userData.aspect) || 1, sg = f.side === "left" ? -1 : 1;
          const cx = sg * (hgt * 0.55 + 0.5 + hgt * (asp - 1) * 0.5), cy = hgt * 0.35;
          for (const dx of [-hgt * asp / 2, hgt * asp / 2]) for (const dy of [-hgt / 2, hgt / 2]) pts.push(P.clone().addScaledVector(rv, cx + dx).add(new THREE.Vector3(0, cy + dy, 0)));
        }
      }
    }
    stage(c, (s.start + s.end) / 2); T.scene.updateMatrixWorld(true);
    const meshes = solidMeshes();
    let yaw0 = (pl.yaw || 0) + (cam.angle || 0);
    const lying = s.cast.some((cs) => (!cam.on || !cam.on.length || cam.on.indexOf(cs.who) >= 0) && cs.states.some((st) => st.do === "sleep"));
    if (lying && cam.angle === undefined) yaw0 += 20;
    const walker = s.cast.find((cs) => cs.segs.length && (!cam.on || !cam.on.length || cam.on.indexOf(cs.who) >= 0));
    if (walker && cam.angle === undefined) {
      const sg = walker.segs[0], wx = sg.b[0] - sg.a[0], wz = sg.b[1] - sg.a[1];
      if (Math.hypot(wx, wz) > 0.5) { let want = Math.atan2(-wx, wz) / DEG, dd = want - yaw0; while (dd > 180) dd -= 360; while (dd < -180) dd += 360; yaw0 += Math.max(-35, Math.min(35, dd)); }
      if (pl.range) yaw0 = Math.max(pl.range[0], Math.min(pl.range[1], yaw0));
    }
    let pitch0 = cam.height !== undefined && HEIGHT[cam.height] !== null && HEIGHT[cam.height] !== undefined ? HEIGHT[cam.height] : (!s.cast.length && !Object.keys(s.props).length && !s.paper ? (cam.size === "xwide" ? 22 : Math.min(sz.pitch, 12)) : sz.pitch);
    if (lying && cam.height !== "low" && cam.height !== "eye") pitch0 = Math.max(pitch0, 55);
    const fov0 = cam.fov || sz.fov;
    const inRange = (y) => !pl.range || cam.free || (y >= pl.range[0] - 0.01 && y <= pl.range[1] + 0.01);
    let best = null;
    const tries = [0, 12, -12, 24, -24, 36, -36, 50, -50, 65, -65];
    const pitches = [0, 10, 22, 35];
    for (const dp of pitches) {
      for (const dy of tries) {
        const yaw = yaw0 + dy;
        if (!inRange(yaw)) continue;
        let sol = fit(pts, eyes, szUse, yaw, pitch0 + dp, fov0);
        let why = blockedAt(sol.pos, s);
        if (why) {
          for (const k of [0.82, 0.68, 0.55, 0.45]) {
            const nf = Math.min(80, 2 * Math.atan(Math.tan((fov0 / 2) * DEG) / k) / DEG);
            const pos = sol.tgt.clone().addScaledVector(sol.f, -sol.d * k);
            if (!blockedAt(pos, s)) { sol = Object.assign({}, sol, { pos, d: sol.d * k, fov: nf }); why = null; break; }
          }
        }
        if (why) { if (!best) best = Object.assign(sol, { issues: ["camera " + why] , score: 99 }); continue; }
        const hid = hidden(sol.pos, subs, meshes, sol.r);
        const clut = clutter(sol, s, subs);
        const score = hid.reduce((a, h) => a + h.frac * 12, 0) + clut * 2.5 + Math.abs(dy) / 30 + dp / 20;
        if (!best || score < best.score) best = Object.assign(sol, { issues: hid.filter((h) => h.frac >= 0.4).map((h) => `${h.who}'s face hidden by ${h.by}`), score });
        if (!hid.length && score < 0.5) return best;   // a clear view near the asked-for angle: take it
      }
    }
    return best;
  }
  A.solve = solve;

  // camera pose for a move at progress u (0..1) of the shot; never farther out than the solved camera
  const moveOf = (s) => s.moveOverride || s.cam0.move || (s.cam0.size === "xclose" ? "still" : "push");
  function camPose(s, sol, u, T0) {
    const cam = s.cam0, e = E.io(u), dur = s.end - s.start, mv = moveOf(s);
    let pos = sol.pos.clone(), tgt = sol.tgt.clone(), fov = sol.fov;
    const amt = Math.min(0.2, 0.09 * dur) * (cam.speed || 1);
    if (mv === "push" || mv === "pull") { const k = mv === "push" ? 1 - amt * e : 1 - amt + amt * e; pos = tgt.clone().addScaledVector(sol.f, -sol.d * k); }
    else if (mv === "left" || mv === "right") { const off = (mv === "right" ? 1 : -1) * (e - 0.5) * amt * sol.d; pos.addScaledVector(sol.r, off); tgt.addScaledVector(sol.r, off); }
    else if (mv === "up" || mv === "down") { const off = (mv === "up" ? 1 : -1) * (e - 0.5) * amt * sol.d; pos.y += off; tgt.y += off * 0.6; }
    else if (mv === "orbit" || mv === "orbitL") {
      const ang = (mv === "orbit" ? 1 : -1) * (e - 0.5) * 14 * DEG * (cam.speed || 1);
      const off = pos.clone().sub(tgt), cs = Math.cos(ang), sn = Math.sin(ang);
      pos = tgt.clone().add(new THREE.Vector3(off.x * cs - off.z * sn, off.y, off.x * sn + off.z * cs));
    }
    else if (mv === "zoom") fov = sol.fov * (1 - 0.12 * e);
    else if (mv === "follow" && s.cast.length) {
      const who = s.cast.find((x) => !cam.on || !cam.on.length || cam.on.indexOf(x.who) >= 0) || s.cast[0];
      const pm = posAt(who, (s.start + s.end) / 2).p, pn = posAt(who, T0).p;
      pos.x += pn[0] - pm[0]; pos.z += pn[1] - pm[1]; tgt.x += pn[0] - pm[0]; tgt.z += pn[1] - pm[1];
    }
    else { const k = 1 - 0.02 * e; pos = tgt.clone().addScaledVector(sol.f, -sol.d * k); }
    return { pos, tgt, fov };
  }
  function moveCam(c, sol) {
    const s = c.shot, cam = s.cam0, mv = moveOf(s);
    const { pos, tgt, fov } = camPose(s, sol, c.dur > 0 ? c.t / c.dur : 0, c.T);
    if (!cam.locked) { const T0 = c.T, d = pos.distanceTo(tgt), hx = 0.012 * d * Math.sin(T0 * 1.3) + 0.006 * d * Math.sin(T0 * 3.1), hy = 0.008 * d * Math.sin(T0 * 1.7 + 1); pos.x += hx; pos.y += hy; tgt.x += hx * 0.4; } // handheld drift
    c.cam([pos.x, pos.y, pos.z], [tgt.x, tgt.y, tgt.z], fov);
    if (cam.shake || mv === "shake") c.shake(cam.shake || 0.12);
    for (const f of s.fx) if (f.type === "shake" && c.T >= f.t0 && c.T < f.t0 + (f.dur || 0.6)) c.shake((f.amount || 0.25) * (1 - T.prog(c.T, f.t0, f.t0 + (f.dur || 0.6))));
  }

  // ---------------------------------------------------------------- effects drawn each frame
  function targetPos(s, on, part, t) {
    if (Array.isArray(on)) { const p = A.toWorld(s.place, [on[0], on[2] ?? on[1]]); return [p[0], on.length > 2 ? on[1] : 3, p[1]]; }
    if (!on) { const p = A.toWorld(s.place, [0, 0]); return [p[0], 4, p[1]]; }
    if (on.startsWith("prop:")) { const pr = s.props[on.slice(5)]; const b = new THREE.Box3().setFromObject(pr.g), cc = b.getCenter(V()); return [cc.x, part === "above" ? b.max.y + 1 : cc.y, cc.z]; }
    const cs = s.cast.find((x) => x.who === on), a = cs ? cs.a : A.actor(on);
    const h = headOf(a), sc = a.root.scale.x;
    if (part === "hand" && a.hand) { const p = V(); a.hand.R.getWorldPosition(p); return [p.x, p.y, p.z]; }
    if (part === "feet") return [a.root.position.x, a.root.position.y + 0.3, a.root.position.z];
    if (part === "body") return [h.x, h.y - 2.0 * sc, h.z];
    if (part === "face") { const ry = a.root.rotation.y, k = (a.b ? a.b.head : 1.2) * 0.55 * sc; return [h.x + Math.sin(ry) * k, h.y - 0.05 * sc, h.z + Math.cos(ry) * k]; }
    if (part === "above") {
      const st = cs ? curState(cs.states, t).do : "", up = (st === "carry" && Object.values(s.props).some((pr) => pr.p.hold === on)) ? 2.6 : 0;
      return [h.x, h.y + (a.b ? a.b.head : 1.2) * sc * (a.hatG ? 1.9 : 1.4) + up, h.z];
    }
    return [h.x, h.y, h.z];
  }
  let lightSlot = 0;
  function drawFx(c) {
    const s = c.shot, t = c.T, FX = T.FX;
    lightSlot = 0;
    for (const f of s.fx) {
      if (t < f.t0 - 0.001) { if (f.sprite) f.sprite.visible = false; continue; }
      const on = t < f.t1;
      const P = targetPos(s, f.on, f.part || defaultPart(f.type), t);
      const col = f.color;
      switch (f.type) {
        case "sparkle": FX.burst(t, f.t0, P, { n: f.n || 26, speed: 4.5 * (f.size || 1), up: 2, life: 0.9, size: 0.8 * (f.size || 1), seed: f.seed, color: col || "#ffffff" }); FX.ring(t, f.t0, P, { r: 4 * (f.size || 1), life: 0.6, color: col || "#fff6c0" }); break;
        case "twinkle": if (on) FX.twinkle(t, P, { n: f.n || 12, r: 2 * (f.size || 1), h: 2.4 * (f.size || 1), size: 0.45 * (f.size || 1), seed: f.seed, op: T.prog(t, f.t0, f.t0 + 0.3), color: col || "#ffffff" }); break;
        case "puff": FX.burst(t, f.t0, P, { tex: "puff", n: f.n || 14, speed: 3 * (f.size || 1), up: 1.4, grav: 0.5, life: 0.8, size: 1.7 * (f.size || 1), grow: true, seed: f.seed, color: col || "#ffffff", op: 0.9 }); break;
        case "smoke": if (on) for (let k = 0; k < 4; k++) FX.burst(t, f.t0 + k * 0.5 + Math.floor(Math.max(0, t - f.t0) / 2) * 2, P, { tex: "puff", n: 5, speed: 0.8, up: 2.5, grav: 0, life: 2.0, size: 2.2 * (f.size || 1), grow: true, seed: f.seed + k, color: col || "#8a8a92", op: 0.55 }); break;
        case "hearts": if (on) for (let k = 0; k < 3; k++) FX.burst(t, f.t0 + k * 0.7 + Math.floor(Math.max(0, t - f.t0) / 2.1) * 2.1, P, { tex: "heart", n: 4, speed: 1.6, up: 2.6, grav: 0.4, life: 1.4, size: 0.9 * (f.size || 1), seed: f.seed + k }); break;
        case "confetti": for (let k = 0; k < 5; k++) FX.burst(t, f.t0, [P[0], P[1] + 3, P[2]], { tex: "crumb", n: 14, speed: 6, up: 5, grav: 7, life: 2.2, size: 0.28, spin: 8, seed: f.seed + k * 5, color: ["#ff4d6d", "#ffd23f", "#4cd17a", "#3fa7ff", "#a66bff"][k] }); break;
        case "zzz": if (on) for (let k = 0; k < 3; k++) { const ph = ((t - f.t0) * 0.6 + k / 3) % 1; FX.sprite("zzz", [P[0] + 0.5 + ph * 1.2, P[1] + 0.8 + ph * 2.2, P[2]], 0.6 + ph * 0.8, Math.sin(Math.PI * ph)); } break;
        case "notes": if (on) for (let k = 0; k < 4; k++) { const ph = ((t - f.t0) * 0.55 + k / 4) % 1; FX.sprite("note", [P[0] + Math.sin(ph * 6 + k) * 0.8, P[1] + 0.6 + ph * 2.6, P[2]], 0.7, Math.sin(Math.PI * ph)); } break;
        case "fire": if (on) for (let k = 0; k < 10; k++) { const ph = ((t * 1.7 + T.hash(f.seed, k)) % 1); FX.sprite("fire", [P[0] + (T.hash(k, 3) - 0.5) * 1.6 * (f.size || 1), P[1] + ph * 2.4 * (f.size || 1), P[2] + (T.hash(k, 5) - 0.5) * 0.8], (1.8 - ph) * (f.size || 1), 1 - ph); } break;
        case "glow": if (on) { const k = T.prog(t, f.t0, f.t0 + 0.25), pulse = 0.85 + 0.15 * Math.sin(t * 7); FX.sprite("glow", P, (f.size || 1.6) * pulse * E.out(k), 0.95 * k, 0, col || "#ffd23f"); if (lightSlot < 2) c.point(lightSlot++, P, col || "#ffd23f", 14 * k * (f.light ?? 1), 10); } break;
        case "ring": FX.ring(t, f.t0, P, { r: 5 * (f.size || 1), life: 0.7, color: col || "#fff6c0" }); break;
        case "flash": c.post({ flash: (f.amount || 0.5) * (1 - T.prog(t, f.t0, f.t0 + 0.3)) * (t < f.t0 + 0.3 ? 1 : 0) }); break;
        case "dark": c.post({ dark: (f.amount || 0.7) * E.io(T.prog(t, f.t0, f.t0 + (f.dur || 0.5))) }); break;
        case "speed": if (on) FX.trail(t, P, [Math.sin(-s.place.yaw * DEG), 0, Math.cos(-s.place.yaw * DEG)], { n: 6, seed: f.seed }); break;
        case "label": case "bubble": case "question": case "exclaim": {
          const vis = (f.tVis ? t < f.tVis : on) && t >= f.t0;
          f.sprite.visible = vis;
          if (vis && f.texFor) { const tx = f.texFor(A.counterText(f, t)); if (f.sprite.material.map !== tx) { f.sprite.material.map = tx; f.sprite.material.needsUpdate = true; } }
          if (vis) {
            const k = f.texFor ? 1 : E.pop(T.prog(t, f.t0, f.t0 + 0.35));
            const dist = T.cam.position.distanceTo(new THREE.Vector3(P[0], P[1], P[2])), fh = 2 * dist * Math.tan((T.cam.fov / 2) * DEG);
            if (f.type === "label") {
              const h = T.clamp(0.07 * fh, 1.0, 2.6) * (f.size || 1) * k;
              f.sprite.position.set(P[0], P[1] + 0.15 + h / 2, P[2]); f.sprite.scale.set(h * 2.56, h, 1);
            } else {
              // a bubble sits beside the head's upper corner, on the side with more room
              const h = T.clamp(0.11 * fh, 1.4, 3.4) * (f.size || 1) * k;
              const right = new THREE.Vector3().setFromMatrixColumn(T.cam.matrixWorld, 0);
              const ndc = new THREE.Vector3(P[0], P[1], P[2]).project(T.cam);
              const sideSign = f.side === "left" ? -1 : f.side === "right" ? 1 : ndc.x > 0.25 ? -1 : 1;
              const off = right.multiplyScalar(sideSign * (h * 0.55 + 0.5));
              const asp = (f.tex.userData && f.tex.userData.aspect) || 1, off2 = right.clone().normalize().multiplyScalar(sideSign * h * (asp - 1) * 0.5);
              f.sprite.position.set(P[0] + off.x + off2.x, P[1] + h * 0.35 + off.y, P[2] + off.z + off2.z); f.sprite.scale.set(h * asp, h, 1);
            }
          }
          break;
        }
        default: break; // modifiers (grow, shrink, float, spin, vanish, appear, shake) act in stage() and moveCam()
      }
    }
  }
  const defaultPart = (type) => (["label", "zzz", "notes"].indexOf(type) >= 0 ? "above" : ["bubble", "question", "exclaim"].indexOf(type) >= 0 ? "head" : type === "glow" ? "face" : type === "speed" ? "feet" : "head");
  // dark skies get a soft fill light from the camera (faces stay readable); a stage at dusk or night gets a warm spotlight
  function lights(c) {
    const s = c.shot, sky = Array.isArray(s.sky) ? s.sky[0] : s.sky;
    const dark = sky === "night" || sky === "roomNight" ? 1 : sky === "dusk" || sky === "dawn" ? 0.45 : 0;
    if (dark && lightSlot < 3) {
      const cp = T.cam.position, d = s.solved ? s.solved.d : 12;
      c.point(2, [cp.x, cp.y + 2.5, cp.z], sky === "dusk" ? "#ffd2b0" : "#c9d6ff", dark * 0.55 * Math.pow(Math.max(4, d), 1.6), Math.max(30, d * 3));
    }
    for (const pr of Object.values(s.props)) {
      if (pr.p.kind !== "stage" || !pr.g.visible || !dark) continue;
      const g = pr.g, ry = g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
      T.spot.color.set("#ffe2b0"); T.spot.intensity = 380 * dark; T.spot.distance = 70; T.spot.angle = 0.42; T.spot.penumbra = 0.6;
      T.spot.position.set(g.position.x + fx * 14, 16, g.position.z + fz * 14); T.spot.target.position.set(g.position.x, 3, g.position.z);
    }
  }

  // ---------------------------------------------------------------- the per-frame draw of an auto shot
  function draw(c) {
    const s = c.shot;
    if (!s.solved) {
      s.solved = solve(c);
      for (const u of [0, 0.5, 1]) { const p = camPose(s, s.solved, u, T.lerp(s.start, s.end, u)).pos; if (blockedAt(p, s)) { s.moveOverride = "still"; break; } }
      if (!s.moveOverride && moveOf(s) !== "still") {
        for (const u of [0.02, 0.98]) {
          const tt = T.lerp(s.start, s.end, u); stage(c, tt); T.scene.updateMatrixWorld(true);
          const p = camPose(s, s.solved, u, tt).pos;
          if (hidden(p, subjects(s), solidMeshes(), s.solved.r).some((h) => h.frac >= 0.4)) { s.moveOverride = "still"; break; }
        }
      }
    }
    stage(c, c.T);
    moveCam(c, s.solved);
    T.cam.updateMatrixWorld(true);
    drawFx(c);
    lights(c);
    const d = s.data;
    if (d.look === "flashback") c.post({ sepia: 0.85, grain: 0.05, vig: 0.42 });
    if (d.post) c.post(d.post);
    const fp = s.cast.length ? posAt(s.cast[0], c.T).p : A.toWorld(s.place, [0, 0]);
    c.focus(fp[0], fp[1], Math.min(60, Math.max(14, s.solved.d * 0.9)));
  }

  // ================================================================ audit: what would a viewer see wrong at time t?
  const CAP_TOP = 1 - (2 * 1090) / 1920, CAP_BOT = 1 - (2 * 1330) / 1920; // the caption band in NDC y
  A.audit = (s, t) => {
    const issues = [];
    T.frame(t);
    const cam = T.cam; cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    const why = s.place && !s.data.tpl ? blockedAt(cam.position, s) : null;
    if (why) issues.push({ level: "error", msg: `camera ${why}` });
    if (s.data.tpl === "custom" || !s.cast) return issues;
    const subs = subjects(s), meshes = solidMeshes();
    const proj = (p) => p.clone().project(cam);
    for (const sb of subs) {
      if (sb.kind !== "actor" || sb.minor) continue;
      if (!sb.a.root.visible) continue;
      const h = headOf(sb.a), hp = proj(h);
      const hs = (sb.a.b ? sb.a.b.head : 1.2) * sb.a.root.scale.x;
      const top = proj(h.clone().add(new THREE.Vector3(0, hs * 0.55, 0))), bot = proj(h.clone().add(new THREE.Vector3(0, -hs * 0.55, 0)));
      const behind = h.clone().sub(cam.position).dot(cam.getWorldDirection(V())) < 0;
      if (behind || hp.x < -0.97 || hp.x > 0.97 || top.y > 0.99 || bot.y < -0.99) { issues.push({ level: "error", msg: `${sb.who}'s face is out of frame` }); continue; }
      if (Math.abs(hp.x) > 0.86 || top.y > 0.94) issues.push({ level: "warn", msg: `${sb.who}'s face touches the frame edge` });
      if (hp.y < CAP_TOP && hp.y > CAP_BOT) issues.push({ level: "warn", msg: `${sb.who}'s face is under the captions` });
      const hh = (top.y - bot.y) / 2;
      if (s.cam0.size !== "xwide" && s.cam0.size !== "wide" && hh < 0.035) issues.push({ level: "warn", msg: `${sb.who} is very small for a ${s.cam0.size} shot` });
      // facing: is the face turned toward the camera?
      if (!sb.a.isDog && sb.a.head) {
        const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(sb.a.head.getWorldQuaternion(new THREE.Quaternion()));
        const toCam = cam.position.clone().sub(h).normalize();
        if (fw.dot(toCam) < 0.05 && ["xclose", "close", "medium", "full"].indexOf(s.cam0.size) >= 0 && !(s.data.cam && s.data.cam.back)) issues.push({ level: "warn", msg: `${sb.who} has their back to the camera` });
      }
      const camR = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
      const hid = hidden(cam.position, [sb], meshes, camR);
      if (hid.length && hid[0].frac >= 0.6) issues.push({ level: "error", msg: `${sb.who}'s face hidden by ${hid[0].by}` });
      else if (hid.length && hid[0].frac >= 0.4) issues.push({ level: "warn", msg: `${sb.who}'s face half hidden by ${hid[0].by}` });
    }
    return issues;
  };
  // two cast members standing inside each other (call after A.audit at the same time)
  A.overlaps = (s, t) => {
    const out = [], list = (s.cast || []).filter((cs) => cs.a.root.visible);
    const rad = (cs) => (cs.isDog ? 1.3 : cs.a.b.torW / 2 + cs.a.b.armW * 0.9) * cs.a.root.scale.x;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i].a.root.position, b = list[j].a.root.position;
      if (Math.abs(a.y - b.y) > 3) continue;
      const dd = Math.hypot(a.x - b.x, a.z - b.z), need = rad(list[i]) + rad(list[j]);
      if (dd < need * 0.92) out.push({ level: "error", msg: `${list[i].who} and ${list[j].who} stand inside each other (${dd.toFixed(1)} apart, need ${need.toFixed(1)})` });
    }
    return out;
  };
  A.foreground = (s) => {
    if (!s.solved || !s.cast) return [];
    const cam = T.cam, sol = { pos: cam.position.clone(), f: cam.getWorldDirection(V()), r: V().setFromMatrixColumn(cam.matrixWorld, 0), u: V().setFromMatrixColumn(cam.matrixWorld, 1), fov: cam.fov, d: s.solved.d };
    const n = clutter(sol, s, subjects(s));
    return n ? [{ level: "warn", msg: `${n} other ${n > 1 ? "people stand" : "person stands"} right in front of the lens (foreground clutter): another angle, move them, or a higher camera` }] : [];
  };
  A.solveIssues = (s) => (s.solved && s.solved.issues) || [];

  // compile the shots before the core resolves them
  if (window.SHOTDATA) A.compileAll();
})();
