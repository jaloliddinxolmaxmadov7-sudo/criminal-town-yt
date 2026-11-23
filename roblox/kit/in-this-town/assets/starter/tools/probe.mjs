// One moment of one shot, in detail: the camera, where each cast member's face is on screen, and what stands between
// the camera and each face.   node tools/probe.mjs s23 44.9     (time optional: the middle of the shot)
import { loadEngine } from "./engine_node.mjs";

const [sid, tArg] = process.argv.slice(2);
if (!sid) { console.log("usage: node tools/probe.mjs <shot id> [time in seconds]"); process.exit(1); }
const T = await loadEngine(), A = T.AUTO, THREE = T.THREE;
const s = T.SHOTS.find((x) => x.id === sid);
if (!s) { console.log(`no shot ${sid}`); process.exit(1); }
const t = tArg !== undefined ? +tArg : (s.start + s.end) / 2;
T.frame(t);
const cam = T.cam, f = (v) => v.toArray().map((x) => x.toFixed(2)).join(", ");
console.log(`${sid} ${s.start.toFixed(2)}-${s.end.toFixed(2)} s, at ${t.toFixed(2)} s`);
if (s.solved) console.log(`camera at (${f(cam.position)}), yaw ${Math.round(s.solved.yaw)}, pitch ${Math.round(s.solved.pitch)}, distance ${s.solved.d.toFixed(1)}, lens ${Math.round(cam.fov)}${s.moveOverride ? ", move " + s.moveOverride : ""}`);
const meshes = [];
const walk = (o) => { if (!o.visible || o === T.sky || o.isSprite || o.isPoints) return; if (o.isMesh) meshes.push(o); o.children.forEach(walk); };
walk(T.scene);
const ray = new THREE.Raycaster();
for (const cs of s.cast || []) {
  const h = A.headOf(cs.a), p = h.clone().project(cam);
  console.log(`\n${cs.who}: face at screen (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) [-1..1, captions at y -0.14..-0.39], stands at (${cs.a.root.position.x.toFixed(1)}, ${cs.a.root.position.z.toFixed(1)})`);
  const dir = h.clone().sub(cam.position), L = dir.length();
  ray.set(cam.position, dir.normalize()); ray.far = L;
  const hits = ray.intersectObjects(meshes, false).filter((x) => { for (let o = x.object; o; o = o.parent) if (o === cs.a.root) return false; return true; });
  if (!hits.length) console.log("  clear line of sight");
  for (const ht of hits.slice(0, 3)) {
    let o = ht.object, who = "";
    for (let x = o; x; x = x.parent) { const r = Object.values(A.ROLES).find((a) => a.root === x) || Object.entries(T.CAST).find(([k, a]) => a.root === x); if (r) { who = r.role || r[0]; break; } if (T.FOLK.find((a) => a.root === x)) { who = "townsperson"; break; } }
    const gp = o.geometry && o.geometry.parameters ? Object.entries(o.geometry.parameters).filter(([k]) => /width|height|depth|radius/.test(k)).map(([k, v]) => `${k} ${(+v).toFixed(2)}`).join(" ") : "";
    console.log(`  blocked ${ht.distance.toFixed(2)} from the camera by ${who || "a mesh"} (${gp}) at (${f(ht.point)})`);
  }
}
for (const is of [...A.audit(s, t), ...A.overlaps(s, t)]) console.log(`${is.level}: ${is.msg}`);
process.exit(0);
