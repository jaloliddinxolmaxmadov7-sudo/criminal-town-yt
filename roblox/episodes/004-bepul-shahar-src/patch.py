import json
S=json.load(open("shots.json",encoding="utf-8"))
fix={"Yozuv uchun":20,"kunlik videongiz":-20}
for s in S:
    if s.get("at") in fix: s["cam"]["angle"]=fix[s["at"]]
json.dump(S,open("shots.json","w",encoding="utf-8"),indent=1,ensure_ascii=False)
