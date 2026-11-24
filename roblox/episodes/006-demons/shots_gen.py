exec(open('/home/claude/gen/common.py').read())
TEXT = open('/home/claude/v8/text.txt').read().strip()
SW = lambda who: {"kind": "sword", "hold": who}
GL = lambda at, who, col="#4fc3f7", **k: fx("glow", at, who, color=col, part="hand", **k)
N = dict(sky="night")
def MON(build, skin, eye, extras, eyes=2, horn="#2a0b0b", wing="#2a1030", hat=None):
    d = {"build": build, "shirt": skin, "front": "none", "sleeves": skin, "pants": skin, "shoes": horn, "sole": horn, "noBelt": 1, "skin": skin, "hair": "bald",
         "extras": extras, "hornColor": horn, "wingColor": wing, "faceStyle": {"monster": 1, "eyeColor": eye, "eyes": eyes}}
    if hat: d["hat"] = hat; d["hatColor"] = horn
    return d
_B = ["brute", "stalker", "hulk", "imp", "tall", "brute", "stalker", "hulk", "imp", "tall"]
_SK = ["#6b1d1d", "#2b2140", "#3b4a1e", "#c0392b", "#1b1b26", "#d9d2bf", "#2a1410", "#4a6d8c", "#5c2a6e", "#1f3d2b", "#7a4a12", "#3a0f2e", "#0f2a3a", "#6e6e6e", "#8b1a4a", "#2f2f12", "#401010", "#16324f", "#5a3d2b", "#244a3a"]
_EY = ["#ffd400", "#7cffb2", "#ff3b1f", "#00e5ff", "#ff1744", "#e0f7ff", "#ff8c00", "#d500f9", "#76ff03", "#ffffff"]
_HO = ["#1d0a0a", "#d8cfa8", "#8a8070", "#ff6a00", "#dff4ff", "#2a0b0b", "#f0e6d0", "#5a5348", "#c9a227", "#111111"]
_EX = [["bigHorns", "spikes", "claws", "tail"], ["claws", "wings"], ["spikes", "claws", "tail"], ["wings", "tail", "claws"], ["wings", "bigHorns", "claws"],
       ["spikes", "claws"], ["bigHorns", "tail", "claws"], ["wings", "spikes", "claws", "tail"], ["bigHorns", "wings"], ["spikes", "tail"]]
_SC = {"brute": 1.12, "stalker": 1.0, "hulk": 1.12, "imp": 1.25, "tall": 1.25}
MONSTERS, SCALE = {}, {}
for _i in range(1, 25):
    _b = _B[(_i * 3) % 10]; _k = "m%d" % _i
    MONSTERS[_k] = MON(_b, _SK[(_i * 7) % 20], _EY[(_i * 3) % 10], _EX[(_i * 7) % 10], eyes=[2, 2, 3, 1, 2][_i % 5], horn=_HO[(_i * 3 + 1) % 10], wing=_SK[(_i * 11) % 20], hat="horns" if _b == "imp" else None)
    SCALE[_k] = _SC[_b] + 0.03 * (_i % 3)
sh(None, "plaza", [c("m1", "possessed", "zombie", s=SCALE["m1"], at="center")], "medium", move="push", sky="dusk", fx=[])
sh("the sun goes down", "plaza", [], "xwide", sky="dusk")
sh("the demons come out", "street", [c("m2", "possessed", "zombie", s=SCALE["m2"], at=[-5.5, 0]), c("m3", "rage", "stomp", s=SCALE["m3"], at=[5.5, 0])], "full", sky="night", fx=[fx("shake", "demons")])
sh("Every night", "street", [c("m4", "demonGrin", "rub", s=SCALE["m4"])], "close", sky="night", fx=[])
sh("Right at seven", "townhall", [c("cop", "nervous", "look", at="left")], "wide", sky="dusk", clock=[7, 0], fx=[lab("seven", "cop", "7:00 PM")], sfx=[{"s": "bell", "at": "seven"}])
sh("So everyone is home by six fifty nine", "street", [], "wide", sky="dusk", crowd={"n": 10, "where": "around", "face": "panicked", "do": "panic"})
sh("The baker closes early", "street", [c("baker", "terrified", "panic")], "medium", sky="dusk", sfx=[{"s": "slam", "at": "closes"}])
sh("The cop closes early", "plazaSouth", [c("cop", "terrified", "hide")], "close", sky="dusk")
sh("Even the mayor hides under his desk", "townhall", [c("mayor", "petrified", "hide")], "medium", sky="dusk")
sh("The only ones outside at night", "street", [c("g1", "determined", "idle", at="left"), c("g2", "cool", "armscross", at="right")], "wide", sky="night", props=[SW("g1"), SW("g2")])
sh("are the Katana Guards", "street", [c("gcap", "cool", "guard")], "medium", sky="night", props=[SW("gcap")], fx=[lab("Katana", "gcap", "KATANA GUARDS"), GL("Guards", "gcap")])
sh("Long coats", "street", [c("g1", "determined", "swagger")], "medium", sky="night", props=[SW("g1")])
sh("Glowing swords", "street", [c("g2", "focused", "guard")], "close", sky="night", props=[SW("g2")], fx=[GL("Glowing", "g2", size=2.4)])
sh("They never sleep", "street", [c("g1", "fired", "armscross")], "close", sky="night", props=[SW("g1")], fx=[lab("never", "g1", "0 HOURS SLEEP")])
sh("In other towns, kids want to be firefighters", "street", [c("kidA", "happy", "cheer")], "medium", fx=[fx("fire", "firefighters", "kidA", part="above")])
sh("Every kid wants a katana", "plaza", [c("kidA", "starstruck", "cheer", at="left"), c("kidB", "starstruck", "cheer", at="right")], "medium", props=[{"kind": "stick", "hold": "kidA"}])
sh("Me too", "plaza", [c("me", "lovestruck", "heartclutch")], "close", fx=[fx("hearts", "too", "me")])
sh("But I failed the guard test", "field", [c("gcap", "grumpy", "armscross", at="left"), c("me", "embarrassed", "slash", at="right")], "medium", props=[SW("me")], fx=[lab("guard", "gcap", "GUARD TEST")])
sh("Three times", "field", [c("me", "sobbing", "kneelcry")], "close", fx=[lab("Three", "me", "FAIL x3")])
sh("I tripped over my own sword", "field", [c("me", "sweatDrop", "kneel")], "medium", props=[{"kind": "sword", "at": [2.2, 1.2]}], fx=[fx("puff", "tripped", "me")])
sh("Then one night", "home", [c("me", "worried", "think", at="door")], "medium", sky="dusk")
sh("my little sister didn't come home", "home", [c("mom", "sobbing", "cry", at="left"), c("me", "sick", "lookaround", at="right")], "medium", sky="dusk", props=[{"kind": "drawing", "at": [2, -1], "design": "smiley"}])
sh("Six fifty eight", "home", [c("me", "sweating", "look")], "close", sky="dusk", clock=[6, 58], fx=[lab("Six", "me", "6:58")])
sh("Then seven", "townhall", [c("cop", "terrified", "panic", at="left")], "wide", sky="night", clock=[7, 0], fx=[lab("seven", "cop", "7:00"), fx("flash", "seven")], sfx=[{"s": "bell", "at": "seven"}])
sh("The streets went dark", "street", [c("me", "petrified", "shiver")], "medium", sky="night", fx=[fx("dark", "dark", dur=0.4)])
sh("I grabbed a stick", "home", [c("me", "fired", "guard")], "close", sky="night", props=[{"kind": "stick", "hold": "me"}])
sh("and ran outside", "plazaEast", [c("me", "determined", at=[-6, 2], to=[4, 2], move="run")], "medium", sky="night", move="follow", props=[{"kind": "stick", "hold": "me"}], fx=[fx("speed", "ran", "me")])
sh("The demons were everywhere", "townhall", [c("m5", "possessed", "zombie", s=SCALE["m5"], at=[-5.5, 0]), c("m6", "evilLaugh", "swagger", s=SCALE["m6"], at=[0, 2.5]), c("m7", "demonGrin", "zombie", s=SCALE["m7"], at=[5.5, 0])], "full", sky="night")
sh("Red eyes", "plazaEast", [c("m8", "possessed", "zombie", s=SCALE["m8"])], "close", sky="night", fx=[])
sh("Long claws", "plazaEast", [c("m9", "rage", "angry", s=SCALE["m9"])], "close", sky="night", fx=[fx("glow", "claws", "m9", color="#ff1744", part="hand")])
sh("And in the middle of the square was my sister", "plazaEast", [c("m10", "evil", "rub", s=SCALE["m10"], at=[-5.5, 0]), c("sis", "sad", "crouch", at=[0, 0]), c("m11", "evil", "rub", s=SCALE["m11"], at=[5.5, 0])], "full", sky="night")
sh("Surrounded", "plazaEast", [c("sis", "petrified", "crouch")], "close", sky="night")
sh("I screamed", "plazaEast", [c("me", "volcano", "stomp")], "close", sky="night", props=[{"kind": "stick", "hold": "me"}])
sh("Get away from her", "plazaEast", [c("me", "fired", "point")], "medium", sky="night", props=[{"kind": "stick", "hold": "me"}], fx=[fx("shake", "away")])
sh("The demons turned to me", "plazaEast", [c("m12", "starving", "look", s=SCALE["m12"])], "close", sky="night", fx=[])
sh("All of them", "plazaEast", [c("m13", "evil", "stomp", s=SCALE["m13"], at=[-6, 0]), c("m15", "evil", "stomp", s=SCALE["m15"], at=[6, 0])], "full", sky="night")
sh("My knees were shaking", "plazaEast", [c("me", "petrified", "shiver")], "medium", sky="night")
sh("Then I saw it", "plazaEast", [c("me", "shocked", "look")], "close", sky="night")
sh("A katana, lying on the ground", "plazaEast", [c("me", "starstruck", "crouch", at="right")], "medium", sky="night", props=[{"kind": "sword", "at": [-1.5, 1]}], fx=[fx("glow", "Glowing", "me", color="#4fc3f7", part="feet", size=2.6)])
sh("I picked it up", "plazaEast", [c("me", "focused", "guard")], "medium", sky="night", props=[SW("me")], fx=[GL("picked", "me")])
sh("I swung once", "plazaEast", [c("me", "fired", "slash")], "medium", sky="night", props=[SW("me")], fx=[GL("swung", "me")], sfx=[{"s": "swish", "at": "swung"}])
sh("And I missed everything", "plazaEast", [c("me", "sweatDrop", "spin")], "medium", sky="night", props=[SW("me")], fx=[fx("question", "missed", "me")])
sh("The demons laughed", "plazaEast", [c("m16", "evilLaugh", "laugh", s=SCALE["m16"], at=[-5.5, 0]), c("m17", "evilLaugh", "laugh", s=SCALE["m17"], at=[5.5, 0])], "full", sky="night")
sh("But my sister wasn't scared", "plazaEast", [c("sis", "smile", "idle")], "close", sky="night")
sh("She smiled", "plazaEast", [c("sis", "smirk", "idle")], "close", sky="night")
sh("And her eyes turned red", "plazaEast", [c("sisD", "possessed", "idle")], "close", sky="night", fx=[fx("flash", "red")])
sh("My sister was a demon", "plazaEast", [c("sisD", "embarrassed", "shy", at="left"), c("me", "screaming", "flail", at="right")], "medium", sky="night", fx=[fx("ring", "sister", "me"), fx("question", "demon", "me")])
sh("Big brother, I was going to tell you", "plazaEast", [c("sisD", "embarrassed", "shrug")], "close", sky="night", fx=[fx("hearts", "brother", "sisD")])
sh("Then the Katana Guards arrived", "plazaEast", [c("g1", "fired", at=[-4.2, -8], to=[-4.2, 0], move="run"), c("gcap", "cool", at=[0, -9], to=[0, -0.5], move="run"), c("g2", "fired", at=[4.2, -8], to=[4.2, 0], move="run")], "medium", angle=0, sky="night", props=[SW("g1"), SW("gcap"), SW("g2")])
sh("Their captain raised his sword", "plazaEast", [c("gcap", "focused", "guard")], "medium", sky="night", props=[SW("gcap")], fx=[GL("raised", "gcap", size=2.4)])
sh("I jumped in front of her", "plazaEast", [c("me", "determined", "jump", at=[-1.8, 0]), c("sisD", "scared", "crouch", at=[2.6, 0.5])], "medium", sky="night")
sh("She's my sister", "plazaEast", [c("me", "volcano", "fist")], "close", sky="night")
sh("She never hurt anyone", "plazaEast", [c("me", "sobbing", "pray")], "close", sky="night")
sh("The captain stared at me", "plazaEast", [c("gcap", "annoyed", "guard")], "close", sky="night", props=[SW("gcap")])
sh("for a long time", "plazaEast", [c("me", "sweating", "wipe", at="left"), c("gcap", "sus", "idle", at="right")], "medium", sky="night", sfx=[{"s": "crickets", "at": "long"}])
sh("Then he lowered his sword", "plazaEast", [c("gcap", "content" if False else "relieved", "nod")], "medium", sky="night", props=[SW("gcap")])
sh("Anyone who stands in front of a demon", "plazaEast", [c("gcap", "proud", "talk", shades=False)], "close", sky="night")
sh("to protect her", "plazaEast", [c("sisD", "dreamy", "shy")], "close", sky="night")
sh("has the heart of a guard", "plazaEast", [c("gcap", "proudTear", "salute", shades=False)], "close", sky="night")
sh("That night, I finally got my katana", "plazaEast", [c("meG", "winner", "cheer")], "medium", sky="night", props=[SW("meG")], fx=[GL("katana", "meG", size=2.4), fx("confetti", "katana")])
sh("And my sister", "plazaEast", [c("sisD", "happy", "wave")], "close", sky="night")
sh("She's the first demon on the team", "plazaEast", [c("g1", "cool", "hips", at=[-4.4, 0]), c("sisD", "winner", "hips", at=[0, 0]), c("gcap", "cool", "thumbsup", at=[4.4, 0])], "medium", sky="night", props=[SW("g1"), SW("gcap")], fx=[lab("first", "sisD", "DEMON GUARD")])
sh("She fights demons with us", "plazaEast", [c("sisD", "fired", "kick", at=[-3.2, 0]), c("m18", "horrified", "scared", s=SCALE["m18"], at=[3.4, 0.5])], "medium", sky="night", props=[SW("sisD")], fx=[fx("puff", "fights", "m18"), GL("fights", "sisD", "#ff1744")])
sh("And she's way better than me", "plazaEast", [c("meG", "unamused", "armscross")], "close", sky="night")
sh("Like and subscribe", "home", [c("meG", "cool", "point", look="cam")], "close", sky="dusk", props=[SW("meG")])
sh("or the demons will visit you at seven", "home", [c("m19", "demonGrin", "point", s=SCALE["m19"], look="cam")], "close", sky="night", fx=[lab("seven", "m19", "7:00 PM")])
DEM = lambda skin, shirt, build="adult": {"build": build, "shirt": shirt, "front": "skull", "frontAcc": "#ff1744", "sleeves": shirt, "pants": "#120b0b", "shoes": "#120b0b", "skin": skin, "hair": "spiky", "hairColor": "#0b0b0b", "hat": "horns", "hatColor": "#b71c1c", "faceStyle": {"brow": "#000000"}}
G = lambda hair, hc, skin: {"build": "adult", "shirt": "#14161c", "front": "guard", "frontAcc": "#e2b33c", "sleeves": "#14161c", "pants": "#1d2029", "shoes": "#111111", "skin": skin, "hair": hair, "hairColor": hc, "extras": ["cape"]}
gcap = dict(T["captain"], shirt="#14161c", sleeves="#14161c", front="guard", frontAcc="#e2b33c", pants="#1d2029", extras=["shades", "cape"])
gcap.pop("note", None)
sis = {"build": "small", "shirt": "#ec407a", "front": "heart", "frontAcc": "#ffffff", "pants": "#4a148c", "shoes": "#ffffff", "skin": "#c68642", "hair": "pony", "hairColor": "#0d0d0d", "faceStyle": {"blush": 1}}
meG = dict(T["criminal"], front="guard", frontAcc="#e53935", extras=["chain", "cape"])
save(TEXT, "In This Town, Demons Come Out At Seven", "In this town, when the sun goes down, the demons come out.",
     {"me": T["criminal"], "meG": meG, "mom": T["mom"], "mayor": T["mayor"], "cop": T["cop"], "baker": {"preset": "baker"},
      "sis": sis, "sisD": dict(sis, hat="horns", hatColor="#b71c1c"),
      **MONSTERS,
      "g1": G("long", "#0d0d0d", "#f1c27d"), "g2": G("spiky", "#b71c1c", "#e0ac69"), "gcap": gcap,
      "kidA": {"build": "small", "shirt": "#1976d2", "front": "jersey", "pants": "#263238", "shoes": "#ffffff", "skin": "#f1c27d", "hair": "messy", "hairColor": "#5d4037"},
      "kidB": {"build": "small", "shirt": "#fbc02d", "front": "buttons", "pants": "#3e2723", "shoes": "#3e2723", "skin": "#8d5524", "hair": "curly", "hairColor": "#111111"}})
