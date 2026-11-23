import json
S = json.load(open("shots.json")); n = 0
for a, b in zip(S, S[1:]):
    ca, cb = a.get("cam", {}), b.get("cam", {})
    if isinstance(ca, dict) and isinstance(cb, dict) and a.get("place") == b.get("place") and ca.get("size") == cb.get("size") and abs((ca.get("angle") or 0) - (cb.get("angle") or 0)) < 20:
        cb["angle"] = -(ca.get("angle") or 15) if abs(ca.get("angle") or 0) >= 12 else 25; n += 1
json.dump(S, open("shots.json", "w"), indent=1); print("angle fixes", n)
