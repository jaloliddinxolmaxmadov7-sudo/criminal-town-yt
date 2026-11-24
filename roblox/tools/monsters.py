"""Monster designs (pack 6): every design has its own body plan, colours and parts.
Use: from monsters import MONSTERS, SCALE  -> cast keys m1..m30; give every monster shot a different one."""


def MON(build, skin, eye, extras, eyes=2, horn="#2a0b0b", wing="#2a1030", hat=None, glow=None, hair=None, tail=None, bone=None):
    d = {"build": build, "shirt": skin, "front": "none", "sleeves": skin, "pants": skin, "shoes": horn, "sole": horn, "noBelt": 1,
         "skin": skin, "hair": "bald", "extras": extras, "hornColor": horn, "wingColor": wing, "persona": "monster",
         "faceStyle": {"monster": 1, "eyeColor": eye, "eyes": eyes}}
    if hat: d["hat"] = hat; d["hatColor"] = horn
    if glow: d["glow"] = glow
    if hair: d["hairColor"] = hair
    if tail: d["tailColor"] = tail
    if bone: d["boneColor"] = bone
    return d


# build, skin, eyes colour, parts, eye count, horn/claw colour, wing colour, hat
_D = [
    ("brute",   "#5a1414", "#ffd400", ["jaw", "plates", "bigHorns", "veins"], 2, "#2a0b0b", None, None),
    ("stalker", "#1d1b2e", "#7cffb2", ["tentacles", "claws", "veins"], 3, "#d8cfa8", None, None),
    ("hulk",    "#3b4a1e", "#ff3b1f", ["arms4", "mane", "jaw"], 2, "#e8dcc0", None, None),
    ("imp",     "#c0392b", "#ffffff", ["wings", "tail", "claws"], 2, "#1d0a0a", "#5a0f0f", "horns"),
    ("tall",    "#222230", "#00e5ff", ["head2", "claws", "wings"], 1, "#dff4ff", "#3a3a52", None),
    ("brute",   "#d9d2bf", "#ff1744", ["spikes", "jaw", "tail", "claws"], 2, "#5a5348", None, None),
    ("stalker", "#2a1410", "#ff8c00", ["arms4", "veins", "bigHorns"], 2, "#ff6a00", None, None),
    ("hulk",    "#16324f", "#e0f7ff", ["plates", "mane", "tentacles"], 3, "#8a8070", None, None),
    ("tall",    "#5c2a6e", "#76ff03", ["jaw", "wings", "tail", "veins"], 2, "#111111", "#2b0f36", None),
    ("imp",     "#1f3d2b", "#d500f9", ["head2", "tail", "spikes"], 1, "#c9a227", None, "horns"),
    ("brute",   "#7a4a12", "#ffd400", ["arms4", "plates", "claws"], 2, "#3a2a1c", None, None),
    ("stalker", "#0f2a3a", "#00e5ff", ["wings", "tentacles", "claws"], 2, "#dff4ff", "#0a1a24", None),
    ("hulk",    "#8b1a4a", "#ffffff", ["jaw", "bigHorns", "spikes", "veins"], 2, "#f0e6d0", None, None),
    ("tall",    "#2f2f12", "#ff3b1f", ["mane", "arms4", "tail"], 3, "#111111", None, None),
    ("imp",     "#401010", "#ffd400", ["wings", "jaw", "claws"], 2, "#ff6a00", "#200808", "horns"),
    ("brute",   "#244a3a", "#ff8c00", ["head2", "plates", "tentacles"], 2, "#5a5348", None, None),
    ("stalker", "#6e6e6e", "#ff1744", ["bigHorns", "veins", "claws", "tail"], 1, "#1d0a0a", None, None),
    ("hulk",    "#3a0f2e", "#7cffb2", ["wings", "arms4", "jaw"], 2, "#d8cfa8", "#1c0717", None),
    ("tall",    "#4a6d8c", "#ffffff", ["spikes", "tentacles", "veins"], 3, "#dff4ff", None, None),
    ("imp",     "#5a3d2b", "#ff3b1f", ["mane", "tail", "claws", "jaw"], 2, "#111111", None, "horns"),
    ("brute",   "#101018", "#d500f9", ["wings", "bigHorns", "plates", "veins"], 2, "#c9a227", "#24102e", None),
    ("stalker", "#3b2a1a", "#ffd400", ["head2", "arms4", "claws"], 2, "#e8dcc0", None, None),
    ("hulk",    "#1b4d1b", "#ff1744", ["tentacles", "jaw", "mane"], 1, "#2a0b0b", None, None),
    ("tall",    "#6b1d1d", "#00e5ff", ["plates", "wings", "claws", "tail"], 2, "#8a8070", "#3a0c0c", None),
    ("imp",     "#2b2140", "#76ff03", ["arms4", "veins", "tail"], 3, "#f0e6d0", None, "horns"),
    ("brute",   "#c9b48a", "#ff8c00", ["mane", "spikes", "jaw"], 2, "#3a2a1c", None, None),
    ("stalker", "#12121c", "#ff3b1f", ["wings", "head2", "veins"], 2, "#ff6a00", "#30101a", None),
    ("hulk",    "#4f2a6e", "#ffffff", ["bigHorns", "arms4", "tentacles"], 2, "#111111", None, None),
    ("tall",    "#1f3d2b", "#ffd400", ["jaw", "mane", "claws", "veins"], 1, "#d8cfa8", None, None),
    ("imp",     "#0f2a3a", "#ff1744", ["wings", "plates", "tail"], 2, "#c9a227", "#081820", "horns"),
]
_SC = {"brute": 1.12, "stalker": 1.0, "hulk": 1.12, "imp": 1.25, "tall": 1.2}
MONSTERS, SCALE = {}, {}
for _i, (_b, _sk, _ey, _ex, _n, _ho, _wi, _hat) in enumerate(_D, 1):
    _k = "m%d" % _i
    MONSTERS[_k] = MON(_b, _sk, _ey, _ex, eyes=_n, horn=_ho, wing=_wi or "#2a1030", hat=_hat, glow=_ey, hair=_ho, tail=_sk)
    SCALE[_k] = _SC[_b] + 0.03 * (_i % 3)
