"""Finish look on the silent render (before finish.py): soft glow on bright parts, firmer contrast, a light vignette,
a hint of colour fringing, speed lines over the hook (first shot) and a short white flash into chosen shots.

  python tools/grade.py renders/film.mp4 renders/film_graded.mp4 [--flash s05,s12] [--no-lines]

Shot start times come from shots_times.json. Idea from the in-this-town-kit finish step.
"""
import json, math, os, subprocess, sys
import numpy as np, cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def grade(f, vig, glow=0.3, sat=0.98, contrast=1.08):
    small = cv2.resize(f, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA)
    lum = small.max(axis=2, keepdims=True)
    bright = small * np.clip((lum - 185.0) / 60.0, 0, 1)
    b = cv2.GaussianBlur(bright, (0, 0), 9) * 0.6 + cv2.GaussianBlur(bright, (0, 0), 26) * 0.6
    f = f + cv2.resize(b, (f.shape[1], f.shape[0]), interpolation=cv2.INTER_LINEAR) * glow
    g = f.mean(axis=2, keepdims=True); f = g + (f - g) * sat
    f = (f - 122.0) * contrast + 126.0
    f *= vig
    s = max(1, int(f.shape[1] * 0.0012))
    f[..., 2] = np.roll(f[..., 2], s, axis=1); f[..., 0] = np.roll(f[..., 0], -s, axis=1)
    return f


def speed_lines(W, H, seed, n=46):
    rng = np.random.default_rng(seed); img = np.zeros((H, W), np.uint8); cx, cy = W / 2, H * 0.42
    for _ in range(n):
        a = rng.uniform(0, 2 * math.pi); r0 = rng.uniform(0.36, 0.62) * H; r1 = H * 1.3; wd = rng.uniform(0.005, 0.016)
        p = np.array([(cx + math.cos(a - wd) * r1, cy + math.sin(a - wd) * r1), (cx + math.cos(a + wd) * r1, cy + math.sin(a + wd) * r1),
                      (cx + math.cos(a) * r0, cy + math.sin(a) * r0)], np.int32)
        cv2.fillPoly(img, [p], 255)
    return (img.astype(np.float32) / 255.0)[..., None]


def main():
    a = sys.argv[1:]
    if len(a) < 2: raise SystemExit(__doc__)
    src, dst = a[0], a[1]
    flash_ids = a[a.index("--flash") + 1].split(",") if "--flash" in a else []
    shots = json.load(open(os.path.join(ROOT, "shots_times.json")))
    hook_end = shots[1]["start"] if len(shots) > 1 else 0.8
    flashes = [s["start"] for s in shots if s["id"] in flash_ids]
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", src],
                                   capture_output=True, text=True, check=True).stdout)["streams"][0]
    W, H = pr["width"], pr["height"]; n_, d_ = pr["r_frame_rate"].split("/"); fps = float(n_) / float(d_)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 1.414
    vig = (1.0 - 0.18 * np.clip(r - 0.45, 0, 1) ** 1.5 * 2.2)[..., None].astype(np.float32)
    lines = [speed_lines(W, H, i) for i in range(3)]
    rd = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    wr = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", f"{fps}", "-i", "-",
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
    fs = W * H * 3; i = 0
    while True:
        buf = rd.stdout.read(fs)
        if len(buf) < fs: break
        t = i / fps
        f = grade(np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.float32), vig)
        if "--no-lines" not in a and t < hook_end:
            k = 1.0 - max(0.0, (t - hook_end * 0.55) / (hook_end * 0.45)); L = lines[(i // max(1, int(fps) // 15)) % 3] * 0.5 * k
            f = f * (1 - L) + 255.0 * L
        for ft in flashes:
            if 0 <= t - ft < 0.1: f = f + (255.0 - f) * 0.7 * (1 - (t - ft) / 0.1)
        wr.stdin.write(np.clip(f, 0, 255).astype(np.uint8).tobytes()); i += 1
    wr.stdin.close(); wr.wait(); rd.wait()
    print(f"wrote {dst} ({i} frames, {len(flashes)} flash(es))")


if __name__ == "__main__":
    main()
