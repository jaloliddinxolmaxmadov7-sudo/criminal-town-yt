from common import *
from monsters import MONSTERS, SCALE
TEXT = open('/home/claude/v9/text.txt').read().strip()
def SW(w, style="reaper"): return {"kind": "sword", "hold": w, "style": style}
def GL(at, on, col="#7fd3ff", size=1.8): return fx("glow", at, on, color=col, size=size, part="hand")
KIM = lambda base, **k: dict(base, shirt="#121218", sleeves="#121218", front="kimono", frontAcc="#f4f4f4", pants="#121218", **k)
# Hungry Ones: masked monsters (a new look: bone masks over the face)
H = {}
for i, m in enumerate(["m1", "m3", "m5", "m8", "m11", "m13", "m16", "m19", "m22", "m27"], 1):
    d = dict(MONSTERS[m]); d["extras"] = [e for e in d["extras"] if e not in ("head2", "jaw")] + ["mask"]
    d["stripe"] = ["#c62828", "#1565c0", "#6a1b9a", "#2e7d32", "#ef6c00"][i % 5]
    H["h%d" % i] = d
HS = {"h%d" % i: SCALE[m] for i, m in enumerate(["m1", "m3", "m5", "m8", "m11", "m13", "m16", "m19", "m22", "m27"], 1)}
def h(k, face="fSinister", do="zombie", **kw): return c(k, face, do, s=HS[k] + 0.12, **kw)

sh(None, "plaza", [c("meR", "fDetermined", "guard")], "medium", sky="dusk", props=[SW("meR")])
sh("everyone becomes a Shinigami", "plaza", [c("bakerR", "fSmug", "guard", at="left"), c("copR", "fDetermined", "salute", at="center"), c("granR", "fGrin", "hips", at="right")], "wide", sky="dusk", props=[SW("bakerR", None), SW("copR", None)])
sh("on their sixteenth birthday", "home", [c("teenA", "fStars", "cheer")], "medium", fx=[fx("confetti", "sixteenth"), lab("sixteenth", "teenA", "16")])
sh("A death god", "plaza", [c("captR", "fSinister", "armscross")], "close", sky="dusk")
sh("You get a black robe", "plaza", [c("teenA", "fGrin", "spin")], "medium", fx=[fx("sparkle", "robe", "teenA")])
sh("a sword", "plaza", [c("teenB", "fStars", "guard")], "medium", props=[SW("teenB", None)], fx=[GL("sword", "teenB")])
sh("and one job", "plaza", [c("captR", "fDetermined", "point", look="cam")], "close")
sh("protect the souls of the town", "plazaEast", [c("copR", "fDetermined", "guard", at="left"), c("bakerR", "fDetermined", "guard", at="right")], "wide", sky="dusk", props=[SW("copR", None), SW("bakerR", None)], fx=[fx("twinkle", "souls", None)])
sh("The baker protects souls", "bakery", [c("bakerR", "fSmug", "slash")], "medium", props=[SW("bakerR", None)])
sh("The cop protects souls", "plazaSouth", [c("copR", "fFurious", "slash")], "medium", props=[SW("copR", None)])
sh("Even Grandma protects souls", "home", [c("granR", "fSinister", "guard")], "medium", props=[SW("granR", "reaper")])
sh("with a sword bigger than her", "home", [c("granR", "fGrin", "flex")], "full", props=[SW("granR", "reaper")], fx=[lab("bigger", "granR", "BIGGER THAN HER")])
sh("Because at night", "street", [], "xwide", sky="night")
sh("the Hungry Ones come", "street", [h("h1", at=[-5.5, 0]), h("h2", "fFurious", "stomp", at=[5.5, 0])], "wide", sky="night", fx=[fx("shake", "Hungry"), fx("smoke", "Hungry", None)])
sh("Giant masked spirits", "street", [h("h3", "fSinister", "stomp")], "full", sky="night", move="craneUp")
sh("that eat souls", "street", [h("h4", "fFurious", "chomp")], "close", sky="night", fx=[fx("twinkle", "souls", "h4")])
sh("The Shinigami stop them", "street", [c("captR", "fFurious", "slash", at="left"), h("h5", "fTerrified", "scared", at="right")], "full", sky="night", props=[SW("captR", None)], fx=[fx("flash", "stop"), fx("puff", "stop", "h5")])
sh("before anyone wakes up", "bedroom", [c("mom", "fSleepy", "sleep")], "medium", move="push", sky="night", fx=[fx("zzz", "wakes", "mom")])
sh("On my sixteenth birthday", "home", [c("me", "fStars", "cheer")], "medium", fx=[lab("sixteenth", "me", "16"), fx("confetti", "sixteenth")])
sh("I waited for my robe", "home", [c("me", "fGrin", "tapfoot")], "medium")
sh("Nothing", "home", [c("me", "fGasp", "idle")], "close", sfx=[{"s": "crickets", "at": "Nothing"}])
sh("No sword", "home", [c("me", "fSad", "shrug")], "medium")
sh("No powers", "home", [c("me", "fCry", "kneelcry")], "medium")
sh("I was the only person in town", "plaza", [c("me", "fSad", "idle", at="center")], "wide", crowd={"n": 8, "where": "around", "face": "fSmug", "do": "point"})
sh("who couldn't even see the Hungry Ones", "street", [c("me", "fGrin", "wave", at=[-4.5, 1]), h("h6", "fSinister", "zombie", at=[4.5, -1])], "wide", sky="night")
sh("Mom baked me a cake", "kitchen", [c("mom", "fGrin", "present")], "medium", props=[{"kind": "cake", "on": "table"}])
sh("Better luck next year", "kitchen", [c("me", "fSad", "idle")], "close", props=[{"kind": "cake", "on": "table"}], fx=[lab("Better", "me", "BETTER LUCK NEXT YEAR")])
sh("Then one night", "street", [], "xwide", sky="night", move="topDown")
sh("I woke up thirsty", "bedroom", [c("me", "fSleepy", "yawn")], "medium", sky="night")
sh("And something huge was standing in our kitchen", "kitchen", [h("h7", "fSinister", "zombie")], "full", sky="night", fx=[fx("smoke", "huge", "h7")])
sh("A white mask", "kitchen", [h("h7", "fSinister", "idle")], "close", sky="night")
sh("Long arms", "kitchen", [h("h7", "fFurious", "flail")], "medium", sky="night")
sh("Reaching for my mom", "kitchen", [h("h7", "fSinister", "point", at="left"), c("mom", "fTerrified", "scared", at="right")], "full", sky="night")
sh("And I could see it", "kitchen", [c("me", "fShock", "shock")], "close", sky="night", fx=[fx("exclaim", "see", "me")])
sh("For the first time, I could see it", "kitchen", [c("me", "fTerrified", "point")], "medium", sky="night")
sh("I grabbed a frying pan and hit it", "kitchen", [c("me", "fFurious", "slash", at="left"), h("h7", "fSmug", "idle", at="right")], "full", sky="night", props=[{"kind": "stick", "hold": "me"}], sfx=[{"s": "bonk", "at": "hit"}])
sh("It didn't even notice", "kitchen", [h("h7", "fSmug", "armscross")], "close", sky="night")
sh("Then a girl crashed through the window", "kitchen", [c("rika", "fFurious", "jump")], "full", sky="night", props=[SW("rika", None)], fx=[fx("flash", "crashed"), fx("puff", "crashed", "rika")], sfx=[{"s": "glass", "at": "crashed"}])
sh("A Shinigami from the next town", "kitchen", [c("rika", "fDetermined", "guard")], "medium", sky="night", props=[SW("rika", None)], fx=[GL("Shinigami", "rika")])
sh("Short", "kitchen", [c("rika", "fSmug", "hips")], "full", sky="night", fx=[lab("Short", "rika", "4 FEET")])
sh("Very angry", "kitchen", [c("rika", "fFurious", "angry")], "close", sky="night")
sh("She fought the monster", "kitchen", [c("rika", "fFurious", "slash", at="left"), h("h7", "fFurious", "stomp", at="right")], "full", sky="night", props=[SW("rika", None)], fx=[fx("flash", "fought")])
sh("and it threw her into the fridge", "kitchen", [c("rika", "fCry", "fall")], "medium", sky="night", fx=[fx("shake", "threw"), fx("puff", "fridge", "rika")])
sh("She looked at me", "kitchen", [c("rika", "fGasp", "kneel")], "close", sky="night")
sh("You can see it", "kitchen", [c("rika", "fShock", "point")], "close", sky="night")
sh("Then take my power", "kitchen", [c("rika", "fDetermined", "present")], "medium", move="push", sky="night", props=[SW("rika", None)], fx=[GL("power", "rika", size=2.4)])
sh("She pushed her glowing sword into my hands", "kitchen", [c("rika", "fDetermined", "present", at="left"), c("me", "fShock", "idle", at="right")], "medium", sky="night", props=[SW("me", None)], fx=[GL("glowing", "me", size=2.4), fx("sparkle", "hands", "me")])
sh("My hoodie turned black", "kitchen", [c("meR", "fShock", "spin")], "medium", sky="night", fx=[fx("flash", "black"), fx("smoke", "black", "meR")])
sh("And the sword grew", "kitchen", [c("meR", "fGasp", "guard")], "medium", sky="night", props=[SW("meR")], fx=[GL("grew", "meR", size=2.2)])
sh("And grew", "kitchen", [c("meR", "fStars", "guard")], "close", sky="night", props=[SW("meR")], fx=[GL("grew", "meR", size=2.8)])
sh("Until it was the size of a door", "kitchen", [c("meR", "fGrin", "hold")], "full", sky="night", props=[SW("meR")], fx=[lab("door", "meR", "DOOR SIZE")])
sh("I swung once", "kitchen", [c("meR", "fFurious", "slash", at="left"), h("h7", "fTerrified", "scared", at="right")], "full", sky="night", props=[SW("meR")], fx=[fx("flash", "swung"), fx("shake", "swung")])
sh("The Hungry One turned into light", "kitchen", [h("h7", "fTerrified", "float")], "full", sky="night", fx=[fx("sparkle", "light", "h7", size=2.6), fx("flash", "light"), fx("twinkle", "Hungry", "h7")])
sh("Mom's soul floated back", "kitchen", [c("mom", "fGrin", "float")], "medium", sky="night", fx=[fx("twinkle", "soul", "mom")])
sh("The next morning", "plaza", [], "xwide")
sh("the whole town came to see my sword", "plaza", [c("meR", "fSmug", "hold", at="center")], "wide", props=[SW("meR")], crowd={"n": 8, "where": "sides", "face": "fStars", "do": "clap"})
sh("The captain went pale", "plaza", [c("captR", "fTerrified", "shock")], "close", fx=[lab("pale", "captR", "!!!")])
sh("Only one person ever had a sword this big", "plaza", [c("captR", "fGasp", "point", at="left"), c("meR", "fSmug", "hold", at="right")], "medium", props=[SW("meR")])
sh("The first Shinigami of this town", "plaza", [c("captR", "fDetermined", "talk")], "close")
sh("He disappeared a hundred years ago", "townhall", [c("captR", "fSad", "think")], "medium", fx=[lab("hundred", "captR", "100 YEARS AGO")])
sh("He showed me an old photo", "townhall", [c("captR", "fGasp", "present", at="left"), c("meR", "fShock", "look", at="right")], "medium", props=[{"kind": "book", "hold": "captR"}])
sh("The first Shinigami had my face", "field", [c("old", "fSmug", "guard")], "medium", sky="dusk", props=[SW("old")], fx=[lab("face", "old", "1925")])
sh("Same cap", "field", [c("old", "fSmug", "hips")], "close", sky="dusk")
sh("Same chain", "plaza", [c("meR", "fShock", "shock")], "close")
sh("And the girl just smiled", "plaza", [c("rika", "fSmug", "hips")], "close")
sh("Took you long enough", "plaza", [c("rika", "fGrin", "point", look="cam")], "close")
sh("Grandpa", "plaza", [c("meR", "fCry", "facepalm", at="left"), c("rika", "fGrin", "laugh", at="right")], "medium", fx=[lab("Grandpa", "meR", "GRANDPA?!")])

me = T["criminal"]
meR = dict(me, shirt="#121218", sleeves="#121218", front="kimono", frontAcc="#f4f4f4", pants="#121218", extras=["chain"])
old = dict(meR, skin="#c9a27a", shirt="#3b3024", sleeves="#3b3024", pants="#3b3024")
rika = {"build": "small", "shirt": "#121218", "front": "kimono", "frontAcc": "#f4f4f4", "sleeves": "#121218", "pants": "#121218", "shoes": "#f4f4f4", "skin": "#f1c27d", "hair": "long", "hairColor": "#c62828", "persona": "tough", "faceStyle": {"brow": "#8e1b1b"}}
capt = {"build": "adult", "shirt": "#121218", "front": "kimono", "frontAcc": "#f4f4f4", "sleeves": "#121218", "pants": "#121218", "shoes": "#f4f4f4", "skin": "#e0ac69", "hair": "long", "hairColor": "#eeeeee", "extras": ["cape"], "capeColor": "#f4f4f4", "persona": "proud", "faceStyle": {"brow": "#eeeeee", "mustache": "#eeeeee"}}
gran = {"build": "small", "shirt": "#121218", "front": "kimono", "frontAcc": "#ff8fb1", "sleeves": "#121218", "pants": "#121218", "shoes": "#f4f4f4", "skin": "#c68642", "hair": "bun", "hairColor": "#dddddd", "persona": "bouncy", "faceStyle": {"glasses": "#444444", "brow": "#dddddd"}}
teen = lambda shirt, hair, hc, skin, p: {"build": "small", "shirt": shirt, "front": "kimono", "frontAcc": "#f4f4f4", "sleeves": shirt, "pants": "#121218", "shoes": "#ffffff", "skin": skin, "hair": hair, "hairColor": hc, "persona": p}
save(TEXT, "In This Town, Everyone Becomes A Shinigami At 16", "In this town, everyone becomes a Shinigami on their sixteenth birthday.",
     {"me": me, "meR": meR, "old": old, "mom": T["mom"], "rika": rika, "captR": capt, "granR": gran,
      "bakerR": KIM({"preset": "baker"}) if False else dict(T["baker"], shirt="#121218", sleeves="#121218", front="kimono", frontAcc="#f4f4f4", pants="#121218"),
      "copR": dict(T["cop"], shirt="#121218", sleeves="#121218", front="kimono", frontAcc="#f4f4f4", pants="#121218"),
      "teenA": teen("#121218", "spiky", "#1565c0", "#8d5524", "goofy"), "teenB": teen("#121218", "fringe", "#ffd54f", "#f1c27d", "proud"),
      **H})
