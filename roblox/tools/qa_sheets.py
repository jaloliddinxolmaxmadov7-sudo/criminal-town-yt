"""Final-video QA sheets: 2 frames per second, 9 x 5 tiles per sheet, each tile stamped with its time.
   python3 qa_sheets.py <video.mp4> <out_dir>"""
import sys, os, subprocess, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True); tmp = os.path.join(out, "frames"); os.makedirs(tmp, exist_ok=True)
for f in glob.glob(os.path.join(tmp, "*.jpg")): os.remove(f)
subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", "fps=2,scale=300:-1", os.path.join(tmp, "f_%04d.jpg")], check=True)
fs = sorted(glob.glob(os.path.join(tmp, "*.jpg"))); per = 45
for si in range(0, len(fs), per):
    sub = fs[si:si + per]; w, h = Image.open(sub[0]).size; cols = 9; rows = (len(sub) + cols - 1) // cols
    c = Image.new("RGB", (w * cols, h * rows), "black"); d = ImageDraw.Draw(c)
    for i, f in enumerate(sub):
        x, y = (i % cols) * w, (i // cols) * h; c.paste(Image.open(f), (x, y)); t = (si + i) / 2
        d.rectangle([x, y, x + 62, y + 20], fill="black"); d.text((x + 4, y + 4), f"{t:5.1f}s", fill="yellow")
    c.save(os.path.join(out, f"sheet{si // per}.jpg"), quality=88)
print(out, (len(fs) + per - 1) // per, "sheets")
