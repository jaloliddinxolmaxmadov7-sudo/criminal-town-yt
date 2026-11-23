# Custom shots (only when the templates can't show a beat)

Write `assets/lib/custom.js`; `tools/build.py` loads it automatically. In shots.json: `{"at": "...", "tpl": "custom", "code": "giant"}`.

```js
(function () {
  const T = window.TOWN, A = T.AUTO, E = T.ease;
  T.CUSTOM = T.CUSTOM || {};
  T.CUSTOM.giant = {
    // once at load: build meshes into the shot's group g (hidden unless the shot plays)
    build(g, s) {
      s.box = T.mesh(T.rbox(4, 4, 4, 0.4), T.mat("#ff6f61"), 0, 2, 0); g.add(s.box);
    },
    // every frame: c.T = film time, c.t = time in the shot, c.dur, c.w("word") = when a word is spoken
    draw(c) {
      T.show(T.WORLD.town); T.setSky("day");
      const s = c.shot, me = A.actor("me");
      me.set({ x: 2, z: 4, ry: 0, face: c.T > c.w("giant") ? "wow" : "smile" }, c.T);
      s.box.scale.setScalar(1 + E.out(T.prog(c.T, c.w("giant"), c.w("giant") + 0.5)));
      c.cam([6, 6, 18], [1, 3, 0], 46);          // camera position, target, lens
      c.focus(1, 2, 16);                           // where the sun's shadows are sharp
    },
  };
})();
```

- Building blocks: `T.mesh`, `T.rbox` (rounded box), `T.mat(colour)`, `T.group`, `T.sign(lines, w, h, opts)`,
  `T.PROP.*` (every prop builder), `T.DOODLE` (crayon drawings), `T.FX.burst/twinkle/ring/sprite` (effects),
  `T.CAST` / `A.actor(name)` (people: `.set({x, y, z, ry, s, face, walk, armL, armR, head, jump, ...}, c.T)`),
  `T.WORLD` (town, rooms, setClock), `T.PO` (poses), `T.ease`, `T.prog`, `T.keys`, `c.camKeys([[t, pos, target, fov], ...])`.
- Everything must be a function of time: no random numbers without `T.rng(seed)`, no state carried between frames.
- `node tools/audit.mjs` only checks that a custom shot doesn't crash; check it with `tools/look.py`.
