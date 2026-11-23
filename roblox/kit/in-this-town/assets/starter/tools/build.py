"""Checks shots.json against the narration and writes the film's data + index.html.

  python tools/build.py

Reads story.json, shots.json and timeline.json (tools/timeline.py). Every shot starts 0.1 s before its "at" phrase, searched
forward from the previous shot's phrase, so shots must be in spoken order. Words used inside a shot ("then", "fx", "go"...)
are searched from the shot's own phrase. Stops on a phrase that isn't spoken; prints warnings for shots that are too short
or long and for cuts between two shots that look the same. Writes assets/lib/story_data.js, index.html and shots_table.txt.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEAD = 0.1
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())


def load(name):
    p = os.path.join(ROOT, name)
    if not os.path.exists(p):
        raise SystemExit(f"missing {name}")
    try:
        return json.load(open(p, encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise SystemExit(f"{name} is not valid JSON: {e}")


def main():
    story, shots, tl = load("story.json"), load("shots.json"), load("timeline.json")
    if isinstance(shots, dict):
        shots = shots.get("shots", [])
    W, END = tl["words"], tl["END"]
    toks = [norm(w[2]) for w in W]

    def find(phrase, frm=0, nth=0):
        p = [norm(x) for x in str(phrase).split() if norm(x)]
        if not p:
            return -1
        hit = 0
        for i in range(max(0, frm), len(toks) - len(p) + 1):
            if toks[i:i + len(p)] == p:
                if hit == nth:
                    return i
                hit += 1
        return -1

    errors, warns = [], []
    ids = set()
    cursor = 0
    for i, s in enumerate(shots):
        s.setdefault("id", "s%02d" % (i + 1))
        if s["id"] in ids:
            errors.append(f"{s['id']}: duplicate id")
        ids.add(s["id"])
        at = s.get("at", 0 if i == 0 else None)
        if at is None:
            errors.append(f"{s['id']}: needs an \"at\" phrase"); s["_wi"] = cursor; s["_start"] = 0; continue
        if isinstance(at, (int, float)):
            s["_wi"], s["_start"] = 0, float(at); continue
        idx = find(at, cursor, s.get("nth", 0))
        if idx < 0:
            near = " ".join(w[2] for w in W[cursor:cursor + 12])
            errors.append(f"{s['id']}: \"{at}\" is not spoken after word {cursor} (next words: {near} ...)")
            s["_wi"], s["_start"] = cursor, W[cursor][0] if cursor < len(W) else END
            continue
        s["_wi"] = cursor = idx
        s["_start"] = 0.0 if i == 0 else max(0.0, W[idx][0] - s.get("lead", LEAD) + s.get("shift", 0))
    for i, s in enumerate(shots):
        s["_end"] = shots[i + 1]["_start"] if i + 1 < len(shots) else END
        dur = s["_end"] - s["_start"]
        if dur < 0.25:
            errors.append(f"{s['id']}: only {dur:.2f} s long")
        elif dur < 0.6:
            warns.append(f"{s['id']}: short ({dur:.2f} s): a viewer can't read it")
        elif dur > 4.6:
            warns.append(f"{s['id']}: long ({dur:.2f} s): split it or add a 'then' change; the format cuts every 1.5-2.5 s")

        # words used inside the shot
        def chk(ph, nth, what):
            if ph in (None, "start", "end") or isinstance(ph, (int, float)):
                return
            j = find(ph, s["_wi"], nth or 0)
            if j < 0:
                errors.append(f"{s['id']}: {what} \"{ph}\" is not spoken after the shot's phrase")
            elif W[j][0] > s["_end"] + 0.05 and not (what.endswith("until") or what == "stop" or what == "drawTo"):
                warns.append(f"{s['id']}: {what} \"{ph}\" is spoken at {W[j][0]:.2f} s, after this shot ends ({s['_end']:.2f} s)")
        for c in s.get("cast", []):
            if isinstance(c, str):
                continue
            chk(c.get("go"), c.get("goNth"), "go"); chk(c.get("stop"), c.get("stopNth"), "stop")
            for th in c.get("then", []):
                chk(th.get("at"), th.get("nth"), "then"); chk(th.get("stop"), th.get("stopNth"), "stop")
        for th in (s.get("crowd") or {}).get("then", []) if isinstance(s.get("crowd"), dict) else []:
            chk(th.get("at"), th.get("nth"), "crowd then")
        for f in s.get("fx", []):
            chk(f.get("at"), f.get("nth"), "effect"); chk(f.get("until"), f.get("untilNth"), "effect until")
        for p in s.get("props", []):
            chk(p.get("appear"), p.get("appearNth"), "prop appear"); chk(p.get("vanish"), p.get("vanishNth"), "prop vanish")
        for x in s.get("sfx", []):
            chk(x.get("at"), x.get("nth"), "sound")
        chk(s.get("drawFrom"), s.get("drawFromNth"), "drawFrom"); chk(s.get("drawTo"), s.get("drawToNth"), "drawTo")

    # cuts between two shots that look alike (same place, size and angle)
    def look(s):
        c = s.get("cam", "medium")
        size = c.split()[0] if isinstance(c, str) else c.get("size", "medium")
        ang = 0 if isinstance(c, str) else c.get("angle", 0)
        on = "" if isinstance(c, str) else str(c.get("on", ""))
        return s.get("place", "plaza"), size, ang, on, s.get("tpl", "")
    for a, b in zip(shots, shots[1:]):
        la, lb = look(a), look(b)
        if la[0] == lb[0] and la[1] == lb[1] and abs(la[2] - lb[2]) < 15 and la[4] == lb[4] == "":
            warns.append(f"{a['id']} -> {b['id']}: same place, size and angle: the cut will jump; change the size or the angle by 20+ degrees")

    # every paragraph gets at least one cut near its start
    starts = sorted(s["_start"] for s in shots)
    for tk in tl["takes"]:
        if not any(abs(x - tk["first"]) < 1.2 or (tk["first"] <= x <= tk["last"]) for x in starts):
            warns.append(f"paragraph {tk['pid']} has no cut: give it a shot of its own")

    for e in errors:
        print("ERROR", e)
    for w in warns:
        print("warn ", w)
    if errors:
        raise SystemExit(f"{len(errors)} error(s): fix shots.json")

    clean = [{k: v for k, v in s.items() if not k.startswith("_")} for s in shots]
    lib = os.path.join(ROOT, "assets", "lib")
    with open(os.path.join(lib, "story_data.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Generated by tools/build.py from story.json and shots.json: do not edit by hand. */\n")
        fh.write("window.STORY = " + json.dumps(story, ensure_ascii=False) + ";\n")
        fh.write("window.SHOTDATA = " + json.dumps(clean, ensure_ascii=False) + ";\n")
    libs = ["three.min.js", "cues.js", "story_data.js", "t_core.js", "t_people.js", "t_world.js", "t_doodle.js", "t_fx.js"]
    if os.path.exists(os.path.join(lib, "custom.js")):
        libs.append("custom.js")
    libs.append("t_auto.js")
    scripts = "\n".join(f'    <script src="assets/lib/{x}"></script>' for x in libs)
    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
{scripts}
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #0d1020; }}
    </style>
  </head>
  <body>
    <!-- Generated by tools/build.py: do not edit by hand. The film is one Three.js scene (compositions/film.html), captions on top. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{END:.4f}" data-width="1080" data-height="1920">
      <div id="film" data-composition-id="film" data-composition-src="compositions/film.html" data-start="0" data-duration="{END:.4f}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 1"></div>
      <div id="caps" data-composition-id="caps" data-composition-src="compositions/captions.html" data-start="0" data-duration="{END:.4f}" data-track-index="2" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index: 2"></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)
    for name, body in {"hyperframes.json": {"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "paths": {"blocks": "compositions", "assets": "assets"}, "media": {"autoProxy": True}},
                       "meta.json": {"id": "in-this-town", "name": story.get("title", "In This Town")}}.items():
        p = os.path.join(ROOT, name)
        if not os.path.exists(p):
            json.dump(body, open(p, "w", encoding="utf-8"), indent=2)
    # the shot table
    rows = []
    for s in shots:
        c = s.get("cam", "medium")
        cam = c if isinstance(c, str) else " ".join(str(x) for x in [c.get("size", "medium"), c.get("on", ""), ("angle %s" % c["angle"]) if c.get("angle") else "", c.get("move", "")] if x)
        cast = ", ".join(x if isinstance(x, str) else x.get("who", "?") for x in s.get("cast", []))
        rows.append(f"{s['id']:>5} {s['_start']:7.2f} {s['_end'] - s['_start']:5.2f}s  {str(s.get('at', ''))[:28]:28}  {s.get('place', s.get('tpl', '')):11} {cam:22} {cast}")
    table = "\n".join(rows)
    open(os.path.join(ROOT, "shots_table.txt"), "w", encoding="utf-8").write(table + "\n")
    json.dump([{"id": s["id"], "start": round(s["_start"], 3), "end": round(s["_end"], 3), "at": s.get("at", 0)} for s in shots],
              open(os.path.join(ROOT, "shots_times.json"), "w", encoding="utf-8"), indent=1)
    print(table)
    print(f"\n{len(shots)} shots in {END:.2f} s (one every {END / max(1, len(shots)):.2f} s){'  FAKE timing' if tl.get('fake') else ''}; {len(warns)} warning(s)")


if __name__ == "__main__":
    main()
