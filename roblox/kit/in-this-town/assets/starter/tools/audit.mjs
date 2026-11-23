// Checks every shot without rendering: runs the film's own engine in Node (no WebGL), poses each shot at several moments
// and reports what a viewer would see wrong: a face out of frame or under the captions, a face hidden behind a wall, a
// prop or another person, people standing inside each other, a camera inside a building, a back to the camera up close.
//   node tools/audit.mjs            (after tools/build.py)
//   node tools/audit.mjs --verbose  (also prints each shot's camera)
// Writes qa/audit.json. Exit code 1 when there are errors. To dig into one moment: node tools/probe.mjs s12 34.5
import fs from "node:fs";
import path from "node:path";
import { loadEngine, ROOT } from "./engine_node.mjs";

const verbose = process.argv.includes("--verbose");
const t0 = Date.now();
let T;
try { T = await loadEngine(); }
catch (e) {
  console.log("ERROR the film doesn't start:", e.message);
  if (verbose) console.log(e.stack);
  process.exit(1);
}
const A = T.AUTO;
const out = [];
let nErr = 0, nWarn = 0;
for (const s of T.SHOTS) {
  const times = new Set([s.start + 0.12, (s.start + s.end) / 2, s.end - 0.12]);
  for (const f of s.fx || []) if (f.t0 > s.start && f.t0 < s.end - 0.2) times.add(Math.min(s.end - 0.05, f.t0 + 0.25));
  for (const cs of s.cast || []) for (const st of cs.states) if (st.t > s.start && st.t < s.end - 0.2) times.add(Math.min(s.end - 0.05, st.t + 0.25));
  const seen = new Map();
  let crashed = null;
  for (const t of [...times].sort((a, b) => a - b)) {
    if (t <= s.start || t >= s.end) continue;
    try {
      for (const is of [...A.audit(s, t), ...A.overlaps(s, t), ...A.foreground(s)]) { const k = is.level + "|" + is.msg.replace(/\(.*\)/, ""); if (!seen.has(k)) seen.set(k, Object.assign({ t: +t.toFixed(2) }, is)); }
    } catch (e) { crashed = e.message; break; }
  }
  const list = [...seen.values()];
  if (crashed) list.unshift({ level: "error", msg: "the shot crashes: " + crashed, t: +s.start.toFixed(2) });
  for (const msg of A.solveIssues(s)) if (!list.find((x) => x.msg === msg)) list.push({ level: "warn", msg: "camera found no clear angle: " + msg, t: +((s.start + s.end) / 2).toFixed(2) });
  const sol = s.solved;
  out.push({ id: s.id, start: +s.start.toFixed(2), end: +s.end.toFixed(2), issues: list, cam: sol ? { yaw: Math.round(sol.yaw), pitch: Math.round(sol.pitch), d: +sol.d.toFixed(1), fov: Math.round(sol.fov) } : null });
  for (const is of list) {
    if (is.level === "error") nErr++; else nWarn++;
    console.log(`${s.id.padStart(5)} ${String(is.t).padStart(7)}s  ${is.level === "error" ? "ERROR" : "warn "} ${is.msg}`);
  }
  if (verbose && sol) console.log(`${s.id.padStart(5)} camera yaw ${Math.round(sol.yaw)} pitch ${Math.round(sol.pitch)} distance ${sol.d.toFixed(1)} fov ${Math.round(sol.fov)}`);
}
fs.mkdirSync(path.join(ROOT, "qa"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "qa", "audit.json"), JSON.stringify(out, null, 1));
console.log(`\n${T.SHOTS.length} shots checked in ${((Date.now() - t0) / 1000).toFixed(1)} s: ${nErr} error(s), ${nWarn} warning(s). Details in qa/audit.json`);
process.exit(nErr ? 1 : 0);
