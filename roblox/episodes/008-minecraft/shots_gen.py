from common import *
TEXT = open('/home/claude/v10/text.txt').read().strip()
def PX(w, style="pixel"): return {"kind": "sword", "hold": w, "style": style}
def B(at, style="grass", w=3, h=2, d=1, **k): return dict({"kind": "blocks", "at": at, "style": style, "w": w, "h": h, "d": d}, **k)
def TNT(at=None, hold=None):
    d = {"kind": "tnt", "size": 1.0}
    if hold: d["hold"] = hold
    else: d["at"] = at
    return d
def z(k, face="fWail", do="zombie", **kw): return c(k, face, do, **kw)

sh(None, "plaza", [c("me", "fGrin2", "typing")], "medium", props=[{"kind": "laptop", "on": None, "at": [0, 1.6], "y": 2.2}] if False else [B([3.5, 0], "grass", 2, 2)])
sh("everyone plays Minecraft", "plaza", [c("mayor", "fLaugh", "typing", at="left"), c("kidX", "fStarstruck", "cheer", at="center"), c("baker", "fSmirk", "typing", at="right")], "wide", props=[B([-9, -3], "stone", 3, 2)])
sh("The mayor", "townhall", [c("mayor", "fLaugh2", "typing")], "medium")
sh("The cop", "plazaSouth", [c("cop", "fGrit", "phone")], "medium", props=[{"kind": "phone", "hold": "cop"}])
sh("Grandma has a diamond sword", "home", [c("granny", "fSmirk", "guard")], "medium", props=[PX("granny")], fx=[fx("sparkle", "diamond", "granny", part="hand")])
sh("But this town has one weird rule", "plaza", [c("me", "fConfused", "think")], "close")
sh("Whatever you build in Minecraft", "plaza", [c("me", "fGrin2", "typing")], "medium", props=[B([3.5, -0.5], "wood", 2, 2)])
sh("appears in real life the next morning", "plaza", [c("me", "fStarstruck", "shock")], "full", props=[B([4.5, -1], "wood", 3, 3)], fx=[fx("sparkle", "appears", None, on=None) if False else fx("flash", "appears"), fx("puff", "real", "me")])
sh("Build a house", "home", [c("me", "fGrin2", "typing")], "medium", props=[{"kind": "laptop", "at": [2.2, 0.5]}])
sh("you wake up next to a real block house", "street", [c("me", "fStarstruck", "yawn", at="left")], "wide", props=[{"kind": "blockHouse", "at": [5, -1]}], fx=[fx("puff", "block", None)])
sh("Build a pool", "neighbor", [c("kidX", "fLaugh", "typing")], "medium")
sh("boom, real pool", "neighbor", [c("kidX", "fStarstruck", "jump")], "full", props=[B([3, 0], "diamond", 3, 1, 2)], fx=[fx("flash", "boom"), fx("confetti", "pool")])
sh("So the whole town is made of blocks", "plaza", [], "xwide", move="topDown", props=[B([-12, -6], "stone", 4, 3), B([12, -6], "wood", 3, 4), B([-8, 10], "gold", 2, 2), B([9, 9], "grass", 4, 2)])
sh("The baker built a cake factory", "bakery", [c("baker", "fLove", "present")], "medium", props=[B([3, -1], "wood", 3, 3), {"kind": "cake", "at": [-2.5, 1]}])
sh("The cop built a jail out of obsidian", "plazaSouth", [c("cop", "fSmirk", "armscross")], "full", props=[B([4, -1], "obsidian", 3, 3)])
sh("My neighbor built a castle and moved in", "neighbor", [c("king", "fStarstruck", "wave")], "wide", props=[B([0, -4], "stone", 5, 4), B([-4, -4], "stone", 1, 6), B([4, -4], "stone", 1, 6)])
sh("But there's a second rule", "plaza", [c("me", "fWorried", "think")], "close")
sh("Whatever you destroy in the game", "plaza", [c("me", "fGrit", "typing")], "medium", props=[B([3.5, 0], "stone", 2, 2)])
sh("disappears in real life too", "plaza", [c("me", "fPanic", "shock")], "full", fx=[fx("puff", "disappears", None, size=2.2), fx("flash", "disappears")])
sh("So nobody uses TNT", "plaza", [c("cop", "fYell", "no")], "medium", props=[TNT([2.6, 0])])
sh("Ever", "plaza", [c("cop", "fGrit", "point", look="cam")], "close")
sh("TNT is illegal", "plazaSouth", [c("cop", "fYell", "talk")], "medium", props=[TNT([3, 0])], fx=[lab("illegal", "cop", "ILLEGAL")])
sh("Then my little brother got the tablet", "home", [c("bro", "fLaugh", "typing")], "medium", props=[{"kind": "laptop", "at": [1.6, 0.8]}])
sh("He's six", "home", [c("bro", "fGrin2", "wave")], "close", fx=[lab("six", "bro", "AGE 6")])
sh("At midnight", "street", [], "xwide", sky="night", move="craneDown")
sh("I found him holding a block of TNT", "townhall", [c("bro", "fLaugh2", "rub", at="left"), c("me", "fPanic", "shock", at="right")], "medium", sky="night", props=[TNT([-1.2, 1.2])])
sh("right next to the town hall", "townhall", [c("bro", "fSmirk", "rub")], "wide", sky="night", props=[TNT([1.4, 0.6])])
sh("Don't", "townhall", [c("me", "fYell", "begging")], "close", sky="night")
sh("Too late", "townhall", [c("bro", "fLaugh", "throw")], "medium", sky="night", props=[TNT([1.5, 0.5])])
sh("Click", "townhall", [], "wide", sky="night", fx=[fx("flash", "Click"), fx("shake", "Click"), fx("smoke", "Click", None, size=3)], sfx=[{"s": "boom", "at": "Click"}])
sh("The next morning, the town hall was gone", "townhall", [c("mayor", "fWail", "cry")], "wide", fx=[fx("smoke", "gone", None, size=3), lab("gone", "mayor", "TOWN HALL: GONE")])
sh("Just a giant hole", "field", [], "wide", move="topDown", props=[B([-6, 0], "dirt", 2, 1, 4), B([6, 0], "dirt", 2, 1, 4)])
sh("And the mayor was standing in it", "field", [c("mayorP", "fWail", "idle")], "full")
sh("in his pajamas", "field", [c("mayorP", "fShy", "shy")], "close")
sh("The whole town logged in to fix it", "plaza", [], "wide", crowd={"n": 10, "where": "around", "face": "fGrit", "do": "typing"})
sh("But my brother had built something else", "home", [c("bro", "fSmirk", "rub")], "close")
sh("A monster spawner", "school", [], "medium", props=[B([0, 0], "obsidian", 2, 2, 2)], fx=[fx("glow", "spawner", None, color="#9c27b0", size=2.4), fx("smoke", "spawner", None)])
sh("Under the school", "school", [], "xwide", move="craneDown", sky="dusk")
sh("That morning, zombies walked out of the school", "school", [z("z1", at=[-3, 0], to=[-3, 5], move="walk"), z("z2", "fGrit", at=[3, -1], to=[3, 4], move="walk")], "full")
sh("Real ones", "school", [z("z3", "fYell", "zombie")], "medium")
sh("Square ones", "school", [z("z4", "fWail", "zombie")], "close", fx=[lab("Square", "z4", "100% SQUARE")])
sh("The teachers screamed", "school", [c("teach", "fPanic", "panic")], "medium", fx=[fx("exclaim", "screamed", "teach")])
sh("The cop built a wall", "plaza", [c("cop", "fGrit", "typing", at="left")], "full", props=[B([3, 0], "stone", 3, 2)])
sh("The baker threw cakes", "plaza", [c("baker", "fYell", "throw", at="left"), z("z5", "fConfused", "zombie", at="right")], "full", fx=[fx("puff", "cakes", "z5")])
sh("Nothing worked", "plaza", [z("z6", "fLaugh2", "stomp")], "medium", sfx=[{"s": "crickets", "at": "Nothing"}])
sh("Then I remembered", "home", [c("me", "fConfused", "think")], "close", fx=[fx("exclaim", "remembered", "me")])
sh("In Minecraft, zombies burn in the sun", "plaza", [c("me", "fSmirk", "pointUp")], "medium")
sh("But it was cloudy", "plaza", [], "xwide", move="rise", sky="dusk", fx=[fx("smoke", "cloudy", None, size=4)])
sh("So I opened the game", "home", [c("me", "fGrit", "typing")], "medium", props=[{"kind": "laptop", "at": [2.2, 0.5]}])
sh("flew to the top of the sky", "field", [c("me", "fStarstruck", "float", y=6)], "full", move="craneUp")
sh("and broke every single cloud", "field", [c("me", "fGrit", "slash", y=6)], "medium", props=[PX("me", "pickaxe")], fx=[fx("puff", "cloud", "me", part="above", size=2)])
sh("Block by block", "field", [c("me", "fGrit", "slash", y=6)], "close", props=[PX("me", "pickaxe")], fx=[fx("puff", "Block", "me", part="above", size=1.6)])
sh("The sun came out", "plaza", [], "xwide", move="craneDown", fx=[fx("flash", "sun"), fx("sparkle", "sun", None, size=3)])
sh("And the zombies turned into popcorn", "plaza", [z("z1", "fPanic", "flail", at="left"), z("z3", "fWail", "flail", at="right")], "full", fx=[fx("puff", "popcorn", "z1", color="#fff6c0", size=1.8), fx("puff", "popcorn", "z3", color="#fff6c0", size=1.8), lab("popcorn", "z1", "POP!")])
sh("The whole town cheered", "plaza", [c("me", "fLaugh", "cheer", at="center")], "wide", crowd={"n": 10, "where": "around", "face": "fLaugh2", "do": "cheer"}, fx=[fx("confetti", "cheered")])
sh("The mayor gave me a medal", "plazaEast", [c("mayorP", "fLove", "present", at="left"), c("me", "fStarstruck", "salute", at="right")], "medium")
sh("made of real gold blocks", "plazaEast", [c("me", "fLaugh2", "flex")], "close", props=[B([2.5, 0.5], "gold", 1, 1)], fx=[fx("sparkle", "gold", "me")])
sh("My brother got banned from the game for a year", "home", [c("bro", "fWail", "tantrum")], "medium", fx=[lab("banned", "bro", "BANNED: 1 YEAR")])
sh("But last night", "street", [], "xwide", sky="night", move="topDown")
sh("I caught him on my laptop", "living", [c("bro", "fSmirk", "typing", at="left"), c("me", "fPanic", "shock", at="right")], "medium", sky="night", props=[{"kind": "laptop", "at": [-1, 1.4]}])
sh("Building something huge", "field", [], "wide", sky="night", props=[B([0, -3], "obsidian", 5, 3)], fx=[fx("glow", "huge", None, color="#7c4dff", size=3)])
sh("With wings", "field", [c("drag", "fEvil", "float", s=1.4)], "full", sky="night", fx=[fx("smoke", "wings", "drag")])
sh("What is that", "home", [c("me", "fPanic", "point")], "close", sky="night")
sh("He smiled", "home", [c("bro", "fSmirk", "idle")], "close", sky="night")
sh("A pet", "home", [c("bro", "fLaugh2", "wave", look="cam")], "close", sky="night", fx=[fx("hearts", "pet", "bro")])
sh("Tomorrow is going to be a long day", "home", [c("me", "fWorried", "facepalm")], "medium", sky="night")

zomb = lambda shirt, pants, skin="#6f8f5b": {"build": "adult", "shirt": shirt, "front": "none", "sleeves": skin, "shortSleeves": 1, "pants": pants, "shoes": "#3b3b3b", "skin": skin, "hair": "messy", "hairColor": "#2f3b2a", "persona": "monster"}
bro = {"build": "small", "shirt": "#43a047", "front": "hoodie", "frontAcc": "#ffeb3b", "sleeves": "#43a047", "pants": "#1e88e5", "shoes": "#ffeb3b", "skin": "#c68642", "hair": "messy", "hairColor": "#1b1b1b", "persona": "goofy", "faceStyle": {"blush": 1}}
king = {"build": "adult", "shirt": "#6a1b9a", "front": "buttons", "frontAcc": "#f2c230", "sleeves": "#6a1b9a", "pants": "#311b92", "shoes": "#f2c230", "skin": "#e0ac69", "hair": "curly", "hairColor": "#4e342e", "hat": "crown", "extras": ["cape"], "persona": "proud"}
teach = {"build": "adult", "shirt": "#00897b", "front": "buttons", "pants": "#37474f", "shoes": "#212121", "skin": "#f1c27d", "hair": "bun", "hairColor": "#6d4c41", "persona": "nervous", "faceStyle": {"glasses": "#333333"}}
drag = {"build": "imp", "shirt": "#1a1030", "front": "none", "sleeves": "#1a1030", "pants": "#1a1030", "shoes": "#0b0b0b", "sole": "#0b0b0b", "noBelt": 1, "skin": "#1a1030", "hair": "bald", "extras": ["wings", "tail", "spikes", "jaw"], "hornColor": "#d500f9", "wingColor": "#2a1050", "persona": "monster", "faceStyle": {"monster": 1, "eyeColor": "#d500f9", "eyes": 2}}
mayorP = dict(T["mayor"], front="pajamas", frontAcc="#ffffff", shirt="#4fc3f7", sleeves="#4fc3f7", pants="#4fc3f7")
mayorP["hat"] = "none"; mayorP["hair"] = "bald"
save(TEXT, "In This Town, Everything You Build In Minecraft Becomes Real", "In this town, everyone plays Minecraft.",
     {"me": T["criminal"], "bro": bro, "king": king, "teach": teach, "drag": drag, "mayor": T["mayor"], "mayorP": mayorP, "cop": T["cop"], "baker": T["baker"], "granny": T["granny"],
      "kidX": {"build": "small", "shirt": "#ff7043", "front": "star", "pants": "#263238", "shoes": "#ffffff", "skin": "#8d5524", "hair": "spiky", "hairColor": "#111111", "persona": "bouncy"},
      "z1": zomb("#3f51b5", "#283593"), "z2": zomb("#8d6e63", "#4e342e", "#7a9a63"), "z3": zomb("#c62828", "#37474f", "#5f7f4f"), "z4": zomb("#455a64", "#263238", "#86a86d"),
      "z5": zomb("#fbc02d", "#5d4037", "#6b8f5a"), "z6": zomb("#7b1fa2", "#212121", "#7d9e68")})
