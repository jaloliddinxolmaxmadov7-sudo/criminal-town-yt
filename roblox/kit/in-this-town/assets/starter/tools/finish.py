"""Puts the sound on the rendered film and checks the finished short.

  python tools/finish.py renders/film.mp4 "out/In This Town - My Rule v1.mp4"

Muxes audio/mix.wav (tools/audio.py) onto the silent render (AAC 256k), then checks: length, black frames, one-frame
flashes, frozen stretches over 3 s, loudness (-14 LUFS) and true peak, silences over 0.6 s. Never overwrites an existing file.
"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    mix = os.path.join(ROOT, "audio", "mix.wav")
    if not os.path.exists(mix):
        raise SystemExit("missing audio/mix.wav: run python tools/audio.py")
    if os.path.exists(dst):
        raise SystemExit(f"{dst} exists already: give the new version its own name (v2, v3...)")
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
                    "-shortest", "-movflags", "+faststart", dst], check=True)
    print("wrote", dst)
    qa(dst)


def qa(path):
    END = json.load(open(os.path.join(ROOT, "timeline.json"), encoding="utf-8"))["END"]
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", path], capture_output=True, text=True).stdout)
    dur = float(pr["format"]["duration"])
    print(f"length {dur:.2f} s (story {END:.2f} s){'  <-- CHECK' if abs(dur - END) > 0.15 else ''}")
    Wd, Hd = 96, 170
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={Wd}:{Hd}", "-pix_fmt", "gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, Hd, Wd).astype(np.float32)
    fps = 30.0
    black = np.where(f.mean((1, 2)) < 6)[0]
    print("black frames:", [round(i / fps, 2) for i in black][:20] or "none")
    fl = []
    for i in range(1, len(f) - 1):
        a = np.abs(f[i] - f[i - 1]).mean(); b = np.abs(f[i] - f[i + 1]).mean(); c = np.abs(f[i + 1] - f[i - 1]).mean()
        if a > 25 and b > 25 and c < 8:
            fl.append(round(i / fps, 2))
    print("one-frame flashes:", fl or "none")
    d = np.abs(np.diff(f, axis=0)).mean((1, 2))
    still, run = [], 0
    for i, v in enumerate(d):
        run = run + 1 if v < 0.02 else 0
        if run == int(3 * fps):
            still.append(round((i - run + 1) / fps, 2))
    print("frozen stretches over 3 s:", still or "none")
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", e); TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)
    print("loudness:", I[-1] if I else "?", "LUFS (target -14), true peak", TP[-1] if TP else "?", "dBFS")
    s = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "silencedetect=n=-45dB:d=0.6", "-f", "null", "-"], capture_output=True, text=True).stderr
    sil = re.findall(r"silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)", s)
    print("silences over 0.6 s:", [(round(float(a), 2), round(float(b), 2)) for a, b in sil] or "none")


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--qa":
        qa(sys.argv[2])
    else:
        main()
