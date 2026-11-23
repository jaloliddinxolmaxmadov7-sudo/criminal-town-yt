"""Look at shots: frames of chosen moments on one labelled sheet (qa/look.jpg). Open the sheet and look at it.

  python tools/look.py                       the middle of every shot (HyperFrames snapshots, no full render needed)
  python tools/look.py s05 s06               start, middle and end of those shots
  python tools/look.py --at 12.4,13.1        exact times
  python tools/look.py --video renders/film.mp4 [s05 ...]   the same frames taken from a finished render (fast for all shots)
  --out qa/name.jpg                          another sheet name

What to check on the sheet: every face visible and turned to the camera, nobody cut off at the edges, faces clear of the
caption band (the lower middle of the frame), the right place and light, the action of the sentence readable at a glance.
"""
import json, os, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HF = ["npx", "--yes", "hyperframes@0.9.56"]
FPS = 30


def fmt(t):
    return ("%.2f" % t).rstrip("0").rstrip(".")


def arg(args, name, default=None):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default


def main():
    args = sys.argv[1:]
    video = arg(args, "--video")
    at = arg(args, "--at")
    dst = arg(args, "--out", os.path.join("qa", "look.jpg"))
    shots = json.load(open(os.path.join(ROOT, "shots_times.json"), encoding="utf-8"))
    marks = []
    if at:
        for t in at.split(","):
            t = float(t); sid = next((s["id"] for s in shots if s["start"] <= t < s["end"]), "?")
            marks.append((sid, round(t, 2)))
    else:
        ids = [a for a in args if not a.startswith("-")]
        for s in shots:
            if ids and s["id"] not in ids:
                continue
            a, b = s["start"], s["end"]
            for k in ([0.5] if not ids else [0.12, 0.5, 0.88]):
                marks.append((s["id"], round(a + (b - a) * k, 2)))
    if not marks:
        raise SystemExit("no shots matched")
    out = os.path.join(ROOT, "qa", "look_frames")
    shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    files = {}
    if video:
        frames = sorted({int(t * FPS + 1e-6) for _, t in marks})
        sel = "+".join(f"eq(n\\,{n})" for n in frames)
        subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"select='{sel}',scale=270:480", "-vsync", "0", os.path.join(out, "f%04d.png")], check=True)
        for k, n in enumerate(frames):
            files[n] = os.path.join(out, "f%04d.png" % (k + 1))
        path_of = lambda t: files.get(int(t * FPS + 1e-6))
    else:
        times = ",".join(fmt(t) for _, t in marks)
        r = subprocess.run(HF + ["snapshot", "--at", times, "--no-end", "--keep", "--output", out, "--timeout", "120000"], cwd=ROOT,
                           capture_output=True, text=True, shell=(os.name == "nt"))
        if r.returncode:
            print(r.stdout[-3000:], r.stderr[-3000:]); raise SystemExit("snapshot failed")
        path_of = lambda t: os.path.join(out, f"at-{fmt(t)}s.png")
    cw, ch, cols = 270, 480, min(8, len(marks))
    rows = (len(marks) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cw, rows * (ch + 30)), (16, 16, 22))
    dr = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(os.path.join(ROOT, "assets", "fonts", "InterDisplay-Black.otf"), 20)
    except OSError:
        font = ImageFont.load_default()
    for i, (sid, t) in enumerate(marks):
        f = path_of(t)
        x, y = (i % cols) * cw, (i // cols) * (ch + 30)
        if f and os.path.exists(f):
            sheet.paste(Image.open(f).convert("RGB").resize((cw, ch)), (x, y + 30))
        dr.text((x + 6, y + 4), f"{sid}  {t:.2f}s", fill=(255, 225, 77), font=font)
    dst = os.path.join(ROOT, dst) if not os.path.isabs(dst) else dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    sheet.save(dst, quality=88)
    print("wrote", dst, f"({len(marks)} frames)")


if __name__ == "__main__":
    main()
