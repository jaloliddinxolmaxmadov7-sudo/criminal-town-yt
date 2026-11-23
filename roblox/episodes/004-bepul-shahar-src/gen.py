import json
S = []
_f = [1]
def c(who, face=None, do=None, **k):
    d = {"who": who}
    if face: d["face"] = face
    if do: d["do"] = do
    d.update(k); return d
def th(at, **k):
    d = {"at": at}; d.update(k); return d
def sh(at, place, cast=None, size="medium", angle=None, move=None, **k):
    _f[0] *= -1
    cam = {"size": size, "angle": angle if angle is not None else 18 * _f[0]}
    if move: cam["move"] = move
    d = {"place": place, "cam": cam}
    if at: d["at"] = at
    if cast is not None: d["cast"] = cast
    d.update(k); S.append(d)
def fx(t, at, on=None, **k):
    d = {"type": t, "at": at}
    if on: d["on"] = on
    d.update(k); return d
def lab(at, on, text, **k): return fx("label", at, on, text=text, **k)
def bub(at, on, text, **k): return fx("bubble", at, on, text=text, **k)

LOAF = {"kind": "loaf", "hold": "baker", "s": 1.3}
PHONE = lambda who: {"kind": "phone", "hold": who, "s": 1.4}

# ---- 1. rule
sh(None, "plaza", [], "xwide", move="pull", extras=3, crowd={"n": 6, "where": "around", "face": "happy", "do": "cheer"})
sh("hamma narsa", "plaza", [c("me", "cool", "swagger", then=[th("bepul", face="starstruck", do="flex")])], "medium", fx=[lab("bepul", "me", "BEPUL!")])
sh("Non ham", "plaza", [c("baker", "happy", "present", at="left", then=[th("taksi", face="grin", do="wave")]), c("driver", "happy", "wave", at="right")], "wide", props=[{"kind": "loaf", "hold": "baker", "s": 1.4}, {"kind": "car", "at": [5, -2]}])
sh("hatto bank", "townhall", [c("me", "wow", "cheer")], "medium", props=[{"kind": "sign", "at": [-3, 1.5], "text": ["BANK", "BEPUL"]}])
sh("Faqat bitta narsa", "plaza", [c("me", "sus", "think", then=[th("pullik", face="shocked", do="shock"), th("sukut", face="sly", do="no")])], "close", fx=[fx("question", "pullik", "me"), bub("sukut", "me", "SUKUT...")])

# ---- 2. first time
sh("Birinchi marta", "plaza", [c("me", "wow", "cheer")], "close")
sh("xursand", "plaza", [c("me", "happy", "jump", then=[th("ketdim", face="laugh", do="dance")])], "medium", fx=[fx("confetti", "xursand", "me")])
sh("Men Jinoyatchiman", "plaza", [c("me", "cool", "flex")], "close", fx=[fx("sparkle", "Jinoyatchiman", "me")], height="low")
sh("bepul narsani", "plaza", [c("me", "love", "cheer", then=[th("sevaman", face="inlove", do="hug")])], "medium", fx=[fx("hearts", "sevaman", "me")])

# ---- 3. bakery
sh("Ertalab", "bakery", [c("me", "happy", "idle", at="left", to="right", move="walk")], "wide", sky="morning", cam={"size": "wide", "angle": -15, "move": "follow"})
sh("Ikkita non", "bakeryIn", [c("me", "hungry", "hold", at="left"), c("baker", "happy", "present", at="counter")], "medium", props=[{"kind": "loaf", "hold": "baker", "s": 1.3}])
sh("pul to'lamadim", "bakeryIn", [c("me", "smug", "shrug", then=[th("to'lamadim", face="smirk", do="swagger")])], "medium", fx=[lab("to'lamadim", "me", "$0")])
sh("Novvoy jilmaydi", "bakeryIn", [c("baker", "grin", "talk")], "close")
sh("Faqat bitta qoida", "bakeryIn", [c("baker", "determined", "point", then=[th("qoida", face="shout", do="fist"), th("gapirmang", face="angry", do="no")])], "medium", fx=[bub("gapirmang", "baker", "GAPIRMANG!")])
sh("Men jim", "bakeryIn", [c("me", "meh", "idle", then=[th("turdim", face="sheepish", do="shrug")])], "close")
sh("uchinchi nonni", "bakeryIn", [c("me", "hungry", "eat")], "medium", props=[{"kind": "loaf", "hold": "me", "s": 1.3}], fx=[fx("puff", "oldim", "me")])

# ---- 4. taxi
sh("Taksiga", "street", [c("me", "happy", "jump", at="left"), c("driver", "grin", "wave", at="right")], "wide", props=[{"kind": "car", "at": [0, -2]}])
sh("Haydovchi ham", "street", [c("driver", "happy", "talk")], "close")
sh("Faqat gapirmang", "street", [c("driver", "angry", "point", then=[th("gapirmang", face="shout", do="fist")])], "close", fx=[bub("gapirmang", "driver", "SHSH!")])
sh("Yo'lda shahar", "street", [c("me", "happy", "idle", at="left", to="right", move="run", look="cam")], "full", cam={"size": "full", "angle": -20, "move": "follow"}, fx=[fx("speed", "Yo'lda", "me")])
sh("bir tiyin", "street", [c("me", "smug", "swagger")], "close", fx=[lab("tiyin", "me", "$0")])

# ---- 5. cop
sh("Shu payt", "street", [c("cop", "angry", "stomp", at="center", then=[th("to'sdi", face="rage", do="hips")]), c("me", "worried", "idle", at="farLeft")], "medium")
sh("Hujjatlaringizni", "street", [c("cop", "shout", "point")], "close")
sh("Bu qanaqasi", "street", [c("me", "confused", "shrug", then=[th("men", face="worried", do="scared")])], "close")
sh("Politsiyachi qo'lini", "street", [c("cop", "evil", "pointUp")], "medium")
sh("Bitta so'z", "street", [c("cop", "rage", "fist", then=[th("uchun", face="shout", do="stomp")])], "close")
sh("besh yuz", "street", [c("cop", "evil", "present")], "medium", props=[{"kind": "bag", "hold": "cop", "text": "$"}], fx=[lab("dollar", "cop", "$500")])
sh("Men dovdirab", "street", [c("me", "dizzy", "shock", then=[th("qoldim", face="dead", do="fall")])], "medium")
sh("Cho'ntagimni", "street", [c("me", "worried", "rub", then=[th("ko'rdim", face="sad", do="shrug")])], "medium")
sh("Hech narsa", "street", [c("me", "sad", "no")], "close", fx=[lab("yo'q", "me", "$0")])

# ---- 6. everything free
sh("Hamma narsa bepul bo'lgani", "plaza", [c("me", "smug", "swagger")], "wide", crowd={"n": 8, "where": "around", "face": "happy", "do": "cheer"})
sh("pulni ham", "plaza", [c("me", "sly", "think", then=[th("qo'ygan", face="sheepish", do="shrug")])], "close")
sh("Politsiyachi hisoblay", "street", [c("cop", "scheming", "think", then=[th("boshladi", face="evil", do="point")])], "medium", fx=[lab("hisoblay", "cop", "$$$")])
sh("Yana bitta", "street", [c("cop", "evil", "point")], "close", fx=[lab("ikki", "cop", "+$200")])

# ---- 7. town goes silent
sh("og'zimni", "street", [c("me", "sheepish", "no", then=[th("yumdim", face="worried", do="facepalm")])], "close")
sh("Ammo ichimda", "street", [c("me", "rage", "angry")], "close", fx=[fx("smoke", "qaynardi", "me", part="head")])
sh("Yugurib", "street", [c("me", "determined", "idle", at="right", to="left", move="run", look="cam")], "full", cam={"size": "full", "angle": 15, "move": "follow"}, fx=[fx("speed", "Yugurib", "me")])
sh("onamni topdim", "home", [c("mom", "happy", "wave", at="right"), c("me", "happy", "cheer", at="left")], "medium")
sh("Onam ham", "home", [c("mom", "awkward", "idle", then=[th("jim", face="meh", do="no")])], "close", fx=[bub("jim", "mom", "...")])
sh("Qo'shnilar", "neighbor", [c("folk0", "awkward", "idle", at="left"), c("folk1", "meh", "idle", at="right")], "medium", fx=[bub("jim", "folk0", "..."), bub("jim", "folk1", "...")])
sh("Butun shahar", "plaza", [], "xwide", crowd={"n": 12, "where": "around", "face": "meh", "do": "idle"}, fx=[fx("shake", "jim")])

# ---- 8. paper
sh("Mer menga", "townhall", [c("mayor", "smug", "present", at="right"), c("me", "worried", "idle", at="left")], "medium", props=[{"kind": "paper", "hold": "mayor", "design": "messy", "s": 1.2}])
sh("Unga yozilgan", "townhall", [c("me", "confused", "hold", then=[th("edi", face="shocked", do="shock")])], "close", fx=[fx("question", "yozilgan", "me")])
sh("Sizning qarzingiz", "townhall", [c("me", "shocked", "shock")], "close", fx=[lab("yetti", "me", "DEBT", count=[0, 7000], dur=1.2, suffix=" $")])
sh("kecha kechqurun", "living", [c("me", "sheepish", "talk", at="sofa", then=[th("kechqurun", face="laugh", do="laugh")])], "medium", sky="roomNight", props=[PHONE("me")])
sh("telefon suhbatingiz", "living", [c("me", "shocked", "scared")], "close", sky="roomNight", fx=[fx("exclaim", "suhbatingiz", "me")])
sh("Men telefonimni", "plaza", [c("me", "sly", "hold")], "close", props=[PHONE("me")])
sh("Chunki shaharda", "plaza", [c("me", "smug", "talk", then=[th("faqat", face="determined", do="point")])], "medium", crowd={"n": 6, "where": "around", "face": "meh", "do": "idle"})
sh("shu narsa", "plaza", [c("me", "sly", "pointUp")], "close", height="low")
sh("telefon orqali", "plaza", [c("me", "talk", "talk", then=[th("gapirish", face="shout", do="mic")])], "close", props=[PHONE("me")], fx=[bub("gapirish", "me", "$$$")])

# ---- 9. typing
sh("Men boshimni", "plaza", [c("me", "meh", "no", then=[th("chayqadim", face="determined", do="nod")])], "close")
sh("Yozishni boshladim", "street", [c("me", "determined", "talk", at="center")], "medium", fx=[bub("Yozishni", "me", "TIK-TIK")])
sh("Politsiyachiga yozdim", "street", [c("me", "smug", "hold", at="left"), c("cop", "sus", "armscross", at="right")], "medium", props=[PHONE("me")], fx=[bub("Jarimani", "me", "O'CHIRING!")])
sh("U javob", "street", [c("cop", "smirk", "hold", then=[th("yozdi", face="evil", do="point")])], "close", angle=-32, props=[PHONE("cop")])
sh("Yozuv uchun", "street", [c("cop", "rage", "stomp")], "close", fx=[lab("pul", "cop", "PUL!")])

# ---- 10. mayor reveal
sh("Shunda men", "townhall", [c("me", "determined", "idle", at="farLeft", to="left", move="run"), c("mayor", "smug", "hips", at="right")], "wide")
sh("qo'lim bilan", "townhall", [c("me", "worried", "wave")], "close")
sh("hammasini tushuntirdim", "townhall", [c("me", "shout", "talk", at="left"), c("mayor", "bored", "idle", at="right")], "medium")
sh("Mer kuldi", "townhall", [c("mayor", "laugh", "laugh")], "close", fx=[fx("sparkle", "kuldi", "mayor")])
sh("Va birinchi", "townhall", [c("mayor", "grin", "talk")], "medium")
sh("Bu hammasi hazil", "townhall", [c("mayor", "cryLaugh", "laugh")], "close", angle=30, fx=[bub("hazil", "mayor", "HAZIL!")])
sh("kunlik videongiz", "townhall", [c("mayor", "smug", "point", look="cam")], "close")
sh("materiallar", "plaza", [c("me", "shocked", "shock")], "wide", crowd={"n": 8, "where": "around", "face": "grin", "do": "clap"}, fx=[fx("confetti", "yig'ayotgan", "me")])

# ---- 11. banner / twist
sh("katta banner", "plaza", [c("me", "wow", "idle", at="center")], "full", height="low", props=[{"kind": "billboard", "at": [0, -10], "w": 10, "h": 5, "legs": 3}], cam={"size": "full", "angle": 12, "height": "low", "move": "pull"})
sh("CRIMINAL TOWN", "plaza", [], "wide", props=[{"kind": "billboard", "at": [0, -2], "w": 10, "h": 5, "legs": 3, "key": True}], fx=[fx("sparkle", "CRIMINAL", [0, 6, -2]), fx("ring", "TOWN", [0, 4, -2])])
sh("Va tushundim", "plaza", [c("me", "mindblown", "shock")], "close")
sh("shahar meni", "plaza", [c("me", "dizzy", "spin")], "wide", crowd={"n": 10, "where": "around", "face": "laugh", "do": "point"})
sh("qilib olgan", "plaza", [c("me", "dead", "facepalm")], "medium")

# ---- 12. button
sh("Faqat bitta narsa pullik edi", "plaza", [c("me", "sly", "point")], "close", nth=0)
sh("bu videoni", "plaza", [c("me", "smug", "point", look="cam", then=[th("ko'rganingiz", face="evil", do="pointUp")])], "medium", fx=[fx("exclaim", "ko'rganingiz", "me")])
sh("Lekin obuna", "plaza", [c("me", "happy", "wave", then=[th("bo'lsangiz", face="grin", do="point", look="cam")])], "close", fx=[fx("hearts", "bepul", "me")])

json.dump(S, open("shots.json", "w"), indent=1, ensure_ascii=False)
print(len(S), "shots")
