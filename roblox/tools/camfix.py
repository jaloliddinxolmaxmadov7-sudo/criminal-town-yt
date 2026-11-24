"""Give every shot a lively camera move (pack 6): big crane / sweep / whip moves, never the same move twice in a row.
Shots that already ask for a move keep it. The engine softens a move that would cross a wall."""
import json
S = json.load(open("shots.json"))
BY = {
    "xwide": ["craneDown", "sweep", "topDown", "sweepL", "rise"],
    "wide": ["craneDown", "sweepL", "dolly", "sweep", "topDown"],
    "full": ["sweep", "whip", "dolly", "lowSlide", "sweepL", "craneDown", "whipL"],
    "medium": ["push", "whip", "dutch", "sweepL", "dolly", "orbit", "whipL", "vertigo"],
    "close": ["snapzoom", "push", "dutch", "whipL", "zoom", "orbitL", "whip"],
    "xclose": ["snapzoom", "push", "zoom"],
    "top": ["rise", "orbit"],
}
last, k, n = None, 0, 0
for s in S:
    cam = s.get("cam")
    if not isinstance(cam, dict): continue
    if cam.get("move"): last = cam["move"]; continue
    opts = BY.get(cam.get("size", "medium"), BY["medium"])
    many = len(s.get("cast", [])) > 1 or s.get("crowd")
    if s.get("place") in ("living", "kitchen", "bedroom", "classroom", "office", "bakeryIn", "shopIn", "jewelIn"):
        opts = [o for o in opts if o in ("push", "dutch", "orbit", "orbitL", "zoom", "snapzoom", "whip", "whipL", "vertigo")] or ["push"]
    if many: opts = [o for o in opts if not o.startswith("whip") and o not in ("dolly", "vertigo", "snapzoom")] or ["push"]
    m = opts[k % len(opts)]
    if m == last: k += 1; m = opts[k % len(opts)]
    cam["move"] = m; last = m; k += 1; n += 1
    if m in ("dutch",): cam["side"] = 1 if k % 2 else -1
json.dump(S, open("shots.json", "w"), indent=1); print("camera moves", n)
