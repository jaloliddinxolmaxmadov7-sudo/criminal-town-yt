"""Reusable characters. Usage:
  python tools/cast.py              list templates
  python tools/cast.py criminal mom mayor cop    add these to story.json "cast" (keeps what is already there)
  python tools/cast.py criminal=mc               add the template under another role name
"Criminal" is the channel's hero (street kid: black hoodie, cap, chain, red sneakers). Same look every episode;
mom, mayor, cop, boss, granny are the recurring town folks. Add new templates to tools/cast_templates.json."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, "tools", "cast_templates.json"), encoding="utf-8"))
if len(sys.argv) < 2:
    print("templates:", ", ".join(T)); sys.exit()
sp = os.path.join(ROOT, "story.json")
s = json.load(open(sp, encoding="utf-8")) if os.path.exists(sp) else {"cast": {}}
s.setdefault("cast", {})
for a in sys.argv[1:]:
    name, _, role = a.partition("=")
    s["cast"][role or name] = T[name]
    print("added", role or name)
json.dump(s, open(sp, "w", encoding="utf-8"), indent=2)
