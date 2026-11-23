// Loads the film's own engine in Node without WebGL (canvases draw nothing, fonts load instantly) and boots it.
// Used by tools/audit.mjs and tools/probe.mjs:  const T = await loadEngine();  T.frame(12.3);  T.cam ...
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LIB = path.join(ROOT, "assets", "lib");

const fontPx = (t) => { const m = /(\d+(?:\.\d+)?)px/.exec(t.font || ""); return m ? +m[1] : 10; };
function ctx2d() {
  const t = { font: "10px sans-serif" };
  return new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "measureText") return (s) => ({ width: String(s).length * fontPx(o) * 0.6 });
      if (k === "createRadialGradient" || k === "createLinearGradient" || k === "createPattern") return () => ({ addColorStop() {} });
      if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (k === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}
const canvas = () => ({ width: 300, height: 150, style: {}, getContext: () => ctx2d(), addEventListener() {} });

export async function loadEngine() {
  const sandbox = {
    console, Math, Date, JSON, Promise, Error, Map, Set, WeakMap, Array, Object, Number, String, Symbol, Proxy, Reflect,
    Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView,
    setTimeout, clearTimeout, performance,
    document: { createElement: (tag) => (tag === "canvas" ? canvas() : { style: {}, appendChild() {} }), createElementNS: () => canvas(), fonts: { add() {} }, getElementById: () => null },
    FontFace: class { constructor() {} load() { return Promise.resolve(this); } },
    navigator: { userAgent: "node" },
  };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const files = ["three.min.js", "cues.js", "story_data.js", "t_core.js", "t_people.js", "t_world.js", "t_doodle.js", "t_fx.js"];
  if (fs.existsSync(path.join(LIB, "custom.js"))) files.push("custom.js");
  files.push("t_auto.js");
  for (const f of files) {
    if (!fs.existsSync(path.join(LIB, f))) throw new Error(`missing assets/lib/${f} (run tools/timeline.py and tools/build.py first)`);
    vm.runInContext(fs.readFileSync(path.join(LIB, f), "utf8"), sandbox, { filename: f });
    if (f === "t_core.js") sandbox.TOWN.HEADLESS = true;
  }
  await sandbox.TOWN.boot(null);
  sandbox.TOWN.THREE = sandbox.THREE;
  return sandbox.TOWN;
}
