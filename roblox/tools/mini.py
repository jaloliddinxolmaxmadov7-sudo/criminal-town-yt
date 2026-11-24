"""Make a short preview project from shots A..B of a built project.
usage: python3 mini.py <src project> <dst dir> <first shot no> <last shot no>"""
import json, os, sys, shutil, subprocess
src, dst, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
if os.path.exists(dst): shutil.rmtree(dst)
shutil.copytree(src, dst, ignore=shutil.ignore_patterns("renders", "out", "qa", "old", "*.mp4"))
os.chdir(dst)
S = json.load(open("shots.json")); TT = json.load(open("shots_times.json")); TL = json.load(open("timeline.json"))
t0, t1 = TT[a - 1]["start"], TT[b - 1]["end"]
sub = S[a - 1:b]; sub[0].pop("at", None)
json.dump(sub, open("shots.json", "w"), indent=1)
TL["words"] = [[w[0] - t0, w[1] - t0] + w[2:] for w in TL["words"] if t0 - 0.01 <= w[0] < t1 + 0.4]
TL["END"] = round(t1 - t0, 3)
json.dump(TL, open("timeline.json", "w"), indent=1)
open("assets/lib/cues.js", "w").write("window.CUES = " + json.dumps(TL, separators=(",", ":")) + ";\n")
open("mini_t0.txt", "w").write("%.3f %.3f" % (t0, t1))
print(subprocess.run(["python3", "tools/build.py"], capture_output=True, text=True).stdout.strip().splitlines()[-1], t0, t1)
