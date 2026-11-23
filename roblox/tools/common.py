import json, sys
sys.path.insert(0, '/home/claude/town/in-this-town/assets/starter/tools')
T = json.load(open('/home/claude/town/in-this-town/assets/starter/tools/cast_templates.json'))
S = []
_flip = [1]
def c(who, face=None, do=None, **k):
    d = {"who": who}
    if face: d["face"] = face
    if do: d["do"] = do
    d.update(k); return d
def sh(at, place, cast=None, size="medium", angle=None, move=None, **k):
    _flip[0] *= -1
    cam = {"size": size, "angle": angle if angle is not None else 18 * _flip[0]}
    if move: cam["move"] = move
    d = {"place": place, "cam": cam}
    if at: d["at"] = at
    if cast is not None: d["cast"] = cast
    d.update(k); S.append(d)
def lab(at, on, text): return {"type": "label", "at": at, "on": on, "text": text}
def fx(t, at, on=None, **k):
    d = {"type": t, "at": at}
    if on: d["on"] = on
    d.update(k); return d
def save(text, title, rule, cast):
    story = {"title": title, "rule": rule, "cast": cast, "paragraphs": [{"text": text, "mood": "playful", "pause": 0.1}]}
    json.dump(story, open("story.json", "w"), indent=1)
    json.dump(S, open("shots.json", "w"), indent=1)
    print(len(S), "shots")
