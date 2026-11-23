"""Split shots longer than MAXD seconds into two: the second half cuts to a new size and the mirrored angle (a punch-in)."""
import json, re, copy, sys
MAXD = float(sys.argv[1]) if len(sys.argv) > 1 else 1.5
S = json.load(open("shots.json")); TT = json.load(open("shots_times.json")); W = json.load(open("timeline.json"))["words"]
n = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())
NEXT = {"close": "medium", "medium": "close", "wide": "medium", "full": "close", "xwide": "wide", "xclose": "medium", "top": "medium"}
def words_in(a, b): return [(i, w) for i, w in enumerate(W) if a <= w[0] < b]
out = []; nsplit = 0
for s, t in zip(S, TT):
    d = t["end"] - t["start"]
    moving = any(c.get("move") or c.get("to") for c in s.get("cast", []))
    has_then = any(c.get("then") for c in s.get("cast", [])) or (isinstance(s.get("crowd"), dict) and s["crowd"].get("then"))
    if d <= MAXD or moving or has_then:
        out.append(s); continue
    mid = t["start"] + d / 2
    cands = [(i, w) for i, w in words_in(t["start"] + 0.55, t["end"] - 0.55)]
    if not cands: out.append(s); continue
    i, w = min(cands, key=lambda iw: abs(iw[1][0] - mid))
    # the split phrase: this word + the next one or two, to make "at" unambiguous going forward
    phrase = " ".join(x[2] for x in W[i:i + 3] if x[0] < t["end"])
    a = copy.deepcopy(s); b = copy.deepcopy(s)
    b["at"] = re.sub(r'[^\w\s\'-]', '', phrase).strip()
    b["cam"] = dict(s["cam"]); b["cam"]["size"] = NEXT.get(s["cam"].get("size", "medium"), "close")
    b["cam"]["angle"] = -(s["cam"].get("angle") or 15)
    b["cam"].pop("move", None)
    # effects, sounds: keep each in the half that contains its word
    def half(items):
        A, B = [], []
        for f in items or []:
            at = f.get("at")
            if at is None: A.append(f); continue
            k = next((j for j, x in enumerate(W) if t["start"] - 0.05 <= x[0] < t["end"] and n(x[2]) == n(str(at).split()[0])), None)
            (B if k is not None and k >= i else A).append(f)
        return A, B
    for key in ("fx", "sfx"):
        if key in s:
            A, B = half(s[key]); a[key] = A; b[key] = B
            if not A: a.pop(key)
            if not B: b.pop(key)
    out += [a, b]; nsplit += 1
json.dump(out, open("shots.json", "w"), indent=1)
print(f"split {nsplit} shots -> {len(out)} shots")
