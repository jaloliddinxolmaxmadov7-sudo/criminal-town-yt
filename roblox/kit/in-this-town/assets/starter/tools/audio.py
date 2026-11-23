"""The short's sound: the narration (takes whole, character lines pitched like the format's character voices), an original
score made in code that follows each paragraph's "mood", and sound effects on the actions, timed to the words.
Mix: fixed gain + look-ahead limiter to -14 LUFS, music ducked under the voice. Writes audio/voice.wav, music.wav, sfx.wav, mix.wav.

  python tools/audio.py

Moods (story.json, per paragraph): playful, light, sneaky, trouble, night, wonder, chaos, hush, love, flashback, ending.
Sound effects come from shots.json by themselves (each effect and action has its sound) plus any "sfx" a shot lists:
  "sfx": [{"at": "door", "s": "knock", "gain": -10}]   names: see SFX below.
"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import snd as S

SR = S.SR
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "audio")
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def has_rubberband():
    r = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True)
    return "rubberband" in r.stdout


# ---------------------------------------------------------------- 1 voice
def build_voice(TL, N):
    v = np.zeros((N, 2), np.float32)
    rb = None
    for tk in TL["takes"]:
        src = os.path.join(ROOT, "vo", tk["file"])
        semis = tk.get("pitch") or 0
        if semis:
            rb = has_rubberband() if rb is None else rb
            ratio = 2 ** (semis / 12)
            out = os.path.join(OUT, tk["pid"] + "_pitch.wav")
            af = f"rubberband=pitch={ratio:.4f}:transients=crisp" if rb else f"asetrate={int(44100 * ratio)},aresample=44100,atempo={1 / ratio:.5f}"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", af, "-ar", str(SR), "-ac", "2", out], check=True)
            src = out
        a = decode(src)[: int(tk["keep"] * SR)]
        fi = int(0.006 * SR); a[:fi] *= np.linspace(0, 1, fi)[:, None]
        fo = int(0.02 * SR); a[-fo:] *= np.linspace(1, 0, fo)[:, None]
        i = int(round(tk["start"] * SR)); j = min(N, i + len(a))
        v[i:j] += a[: j - i]
    return v


# ---------------------------------------------------------------- 2 music (moods)
BPM = 116; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = {"C": [60, 64, 67], "G": [55, 59, 62], "Am": [57, 60, 64], "F": [53, 57, 60], "Dm": [50, 53, 57], "Bb": [46, 50, 53], "E": [52, 56, 59], "A": [57, 61, 64], "Em": [52, 55, 59]}
MEL = [(0, 76, 1), (1, 79, 1), (2, 76, 1), (3, 72, 1), (4, 74, 1), (5, 79, 1), (6, 71, 1), (7, 74, 1), (8, 72, 1), (9, 76, 1), (10, 81, 1), (11, 79, 1),
       (12, 77, 1), (13, 76, 1), (14, 74, 2), (16, 79, 1), (17, 76, 1), (18, 79, 1), (19, 84, 1), (20, 83, 1), (21, 79, 1), (22, 74, 1), (23, 79, 1),
       (24, 81, 1), (25, 79, 1), (26, 76, 1), (27, 72, 1), (28, 74, 1.5), (29.5, 76, 0.5), (30, 74, 2)]


def section(buf, t0, t1, chords, *, arp=0.16, bassg=0.22, drums=0.0, clapg=0.0, shake=0.0, mel=None, melg=0.12, mel_from=0, transpose=0, padg=0.0, oct=12, glockg=0.0):
    nb = int(np.ceil((t1 - t0) / BAR))
    for b in range(nb):
        bs = t0 + b * BAR
        if bs >= t1 - 0.05:
            break
        ch = [n + transpose for n in CH[chords[b % len(chords)]]]
        if padg:
            S.put(buf, S.pad([c + oct - 12 for c in ch] + [ch[0] - 12], min(BAR, t1 - bs) + 0.3, 0.25, 0.4) * padg, bs)
        if arp:
            for k, p in enumerate([0, 1, 2, 1, 3, 2, 1, 2]):
                tk = bs + k * BEAT / 2
                if tk >= t1 - 0.03:
                    break
                S.put(buf, S.mallet((ch + [ch[0] + 12])[p] + oct, 0.5) * arp * (1.0 if k % 2 == 0 else 0.75), tk, pan=-0.25 + 0.5 * (k % 2))
        if bassg:
            for k, n in ((0, ch[0] - 24), (2, ch[2] - 24)):
                if bs + k * BEAT < t1 - 0.05:
                    S.put(buf, S.bass(n, 0.45) * bassg, bs + k * BEAT)
        if drums:
            for k in range(4):
                tk = bs + k * BEAT
                if tk >= t1 - 0.03:
                    break
                if k in (0, 2):
                    S.put(buf, S.kick() * drums, tk)
                if clapg and k in (1, 3):
                    S.put(buf, S.clap() * clapg, tk, pan=0.1)
        if shake:
            for k in range(8):
                if bs + k * BEAT / 2 < t1 - 0.03:
                    S.put(buf, S.shaker() * shake * (1.0 if k % 2 else 0.6), bs + k * BEAT / 2, pan=0.35)
        if glockg:
            for k in (1, 3):
                if bs + (k + 0.5) * BEAT < t1 - 0.05:
                    S.put(buf, S.glock(ch[(b + k) % 3] + 24, 0.6) * glockg, bs + (k + 0.5) * BEAT, pan=0.4)
    if mel:
        for beat, m, d in MEL:
            for rep in range(8):
                tr = t0 + (beat + mel_from * 4) * BEAT + rep * 32 * BEAT
                if t0 + mel_from * BAR <= tr < t1 - 0.1:
                    S.put(buf, S.whistle(m + transpose, min(d * BEAT, t1 - tr)) * melg, tr, pan=0.05)


def mood(buf, name, t0, t1, END):
    if t1 - t0 < 0.3:
        return
    if name == "playful":
        section(buf, t0, t1, ["C", "G", "Am", "F"], arp=0.16, drums=0.22, clapg=0.08, shake=0.05, mel=True, melg=0.10, mel_from=1)
    elif name == "light":
        section(buf, t0, t1, ["F", "C", "Dm", "Bb"], arp=0.13, drums=0.15, shake=0.04, mel=True, melg=0.08, mel_from=1)
    elif name == "love":
        section(buf, t0, t1, ["F", "C", "Dm", "Bb"], arp=0.12, bassg=0.18, drums=0.08, shake=0.03, mel=True, melg=0.09, mel_from=1, transpose=5, padg=0.14)
    elif name == "flashback":
        for beat, n, d in MEL[:16]:
            tk = t0 + 0.05 + beat * BEAT * 0.8
            if tk < t1 - 0.1:
                S.put(buf, S.glock(n + 12, 0.9) * 0.16, tk, pan=0.1)
    elif name == "sneaky":
        for b in range(int((t1 - t0) / BAR) + 1):
            bs = t0 + b * BAR
            notes = [45, 48, 52, 48, 45, 48, 52, 48] if b % 2 == 0 else [40, 44, 47, 44, 40, 44, 47, 44]
            for k, n in enumerate(notes):
                if bs + k * BEAT / 2 < t1 - 0.05:
                    S.put(buf, S.pluck(n + 12, 0.3, 0.4) * (0.26 if k % 2 == 0 else 0.18), bs + k * BEAT / 2, pan=-0.2)
            for k in (1, 3):
                if bs + (k + 0.5) * BEAT < t1 - 0.05:
                    S.put(buf, S.glock([76, 72, 79, 71][(b + k) % 4], 0.5) * 0.08, bs + (k + 0.5) * BEAT, pan=0.4)
            if bs < t1 - 0.05:
                S.put(buf, S.kick(0.25, 90, 45) * 0.12, bs)
    elif name == "trouble":
        for b in range(int((t1 - t0) / BAR) + 1):
            bs = t0 + b * BAR
            ch = ["Dm", "Bb", "C", "A"][b % 4]
            root = CH[ch][0] - 12
            third = root + 3 if ch == "Dm" else root + 4
            for k in range(8):
                tk = bs + k * BEAT / 2
                if tk >= t1 - 0.05:
                    break
                S.put(buf, S.pluck([root, root, third, root, root + 7, root, third, root][k], 0.25, 0.5) * 0.22, tk, pan=-0.15)
            if bs < t1 - 0.05:
                S.put(buf, S.pad([c - 12 for c in CH[ch]], min(BAR, t1 - bs) + 0.2, 0.3, 0.3, 700) * 0.18, bs)
                S.put(buf, S.kick() * 0.18, bs)
                if bs + 2 * BEAT < t1 - 0.05:
                    S.put(buf, S.kick() * 0.14, bs + 2 * BEAT)
                for k in (1, 3):
                    if bs + k * BEAT < t1 - 0.05:
                        S.put(buf, S.snare() * 0.07, bs + k * BEAT, pan=0.15)
        S.put(buf, S.brass([62, 65, 69, 74], 0.9) * 0.2, t0 + 0.02)
    elif name == "night":
        S.put(buf, S.pad([45, 52, 57, 60], t1 - t0 + 0.6, 0.6, 0.8, 600) * 0.32, t0)
        t = t0 + 0.3
        while t < t1 - 0.4:
            S.put(buf, S.kick(0.25, 70, 40) * 0.22, t); S.put(buf, S.kick(0.22, 70, 40) * 0.15, t + 0.26); t += 1.15
        for k, n in enumerate([81, 76, 84, 79, 72, 81, 76, 84]):
            tk = t0 + 0.8 + k * 1.3
            if tk < t1 - 0.3:
                S.put(buf, S.glock(n, 0.9) * 0.06, tk, pan=-0.4 + 0.12 * k)
    elif name == "wonder":
        for b in range(int((t1 - t0) / BAR) + 1):
            bs = t0 + b * BAR
            ch = ["Am", "F", "C", "G"][b % 4]
            if bs >= t1 - 0.6:
                break
            S.put(buf, S.pad(CH[ch] + [CH[ch][0] - 12], min(BAR, t1 - 0.5 - bs) + 0.4, 0.4, 0.5, 800) * (0.18 + 0.03 * b), bs)
            for k in range(4):
                if bs + k * BEAT < t1 - 0.6:
                    S.put(buf, S.mallet(([c + 12 for c in CH[ch]] + [CH[ch][0] + 24])[k], 0.9) * 0.12, bs + k * BEAT, pan=-0.2 + 0.13 * k)
        if t1 - t0 > 2.5:
            S.put(buf, S.rise(1.3, 300, 4000) * 0.12, t1 - 1.6)
    elif name == "chaos":
        for b in range(int((t1 - t0) / (BEAT / 2)) + 1):
            tk = t0 + 0.1 + b * BEAT / 2
            if tk >= t1 - 0.05:
                break
            S.put(buf, S.tom([45, 45, 50, 45, 52, 45, 50, 48][b % 8], 0.3) * 0.16, tk, pan=(-0.3 if b % 2 else 0.3))
            S.put(buf, S.bass(38 if (b // 8) % 2 == 0 else 41, 0.25) * 0.2, tk)
            if b % 4 == 0:
                S.put(buf, S.kick() * 0.2, tk)
            if b % 16 == 0:
                S.put(buf, S.brass([50, 53, 57, 62], 0.45) * 0.22, tk)
    elif name == "hush":
        S.put(buf, S.pad([69, 76], t1 - t0 + 0.3, 0.3, 0.3, 1500) * 0.10, t0)
    elif name == "ending":
        t_out = min(t1, END - 0.85)
        section(buf, t0, t_out, ["C", "G", "F", "C"], arp=0.15, drums=0.2, clapg=0.07, shake=0.05, mel=True, melg=0.09)
    else:
        mood(buf, "playful", t0, t1, END)


def build_music(TL, N, END):
    m = np.zeros((N, 2), np.float32)
    takes = TL["takes"]
    secs, cur, t0 = [], None, 0.0
    for tk in takes:
        md = tk.get("mood") or "playful"
        if md != cur:
            if cur is not None:
                secs.append((cur, t0, tk["first"] - 0.1))
            cur, t0 = md, (0.0 if cur is None else tk["first"] - 0.1)
    secs.append((cur or "playful", t0, END))
    for name, a, b in secs:
        mood(m, name, a, b, END)
    # the button: a final chord and a rimshot on the last frames
    t_out = END - 0.85
    for n in (48, 60, 64, 67, 72):
        S.put(m, S.mallet(n + 12, 1.0) * 0.12, t_out - 0.05)
    S.put(m, S.tom(52, 0.25) * 0.5, END - 0.78); S.put(m, S.tom(45, 0.3) * 0.55, END - 0.6); S.put(m, S.cymbal(1.0) * 0.35, END - 0.42)
    fade = np.clip((END - np.arange(N) / SR) / 0.25, 0, 1)
    return m * fade[:, None], secs


# ---------------------------------------------------------------- 3 effects
SFX = {
    "pop": lambda: S.pop(), "whoosh": lambda: S.whoosh(0.5, 400, 2500), "sparkle": lambda: S.sparkle(), "ding": lambda: S.ding(84, 1.0),
    "bell": lambda: S.bell(50, 4.5), "bikebell": lambda: S.bikebell(), "boing": lambda: S.boing(0.35), "womp": lambda: S.womp((55, 54, 53, 50), 0.2),
    "honk": lambda: S.honk((40, 44), 0.8), "beep": lambda: S.beep(93, 0.09), "kaching": lambda: S.kaching(), "scratch": lambda: S.scratch(1.0, 8),
    "squeak": lambda: S.squeak(1.0), "knock": lambda: S.knock(180, 0.3, 80) + 0.8 * S.knock(180, 0.3, 80), "slam": lambda: S.slam(), "click": lambda: S.click(),
    "clink": lambda: S.clink(92), "crowd": lambda: S.crowd(1.6, 1.0), "roar": lambda: S.roar(1.6), "crunch": lambda: S.crunch(), "chomp": lambda: S.chomp(),
    "tear": lambda: S.tear(0.9), "bark": lambda: S.bark(), "yip": lambda: S.yip(), "flap": lambda: S.flap(0.4), "fire": lambda: S.fire(1.4),
    "tick": lambda: S.tick(True), "crickets": lambda: S.crickets(1.8), "wind": lambda: S.wind(3.0), "swish": lambda: S.swish(0.4),
    "rise": lambda: S.rise(0.9, 300, 3500), "slidewhistle": lambda: S.slidewhistle(0.6, 84, 72), "slideup": lambda: S.slidewhistle(0.6, 72, 86),
    "heart": lambda: S.heart(), "question": lambda: S.question(), "hit": lambda: S.hit(40), "kick": lambda: S.kick(0.6, 80, 40), "clap": lambda: S.clap(),
    "splash": lambda: S.whoosh(0.4, 800, 6000) + 0.5 * S.pop(0.12),
}
# effect type -> [(sound, gain dB, offset s)]
FX_SFX = {
    "sparkle": [("sparkle", -9, -0.02), ("pop", -12, 0.0)], "twinkle": [("sparkle", -17, 0.0)], "puff": [("whoosh", -13, -0.03), ("pop", -14, 0.02)],
    "smoke": [("wind", -21, 0.0)], "hearts": [("heart", -11, 0.05)], "confetti": [("pop", -10, 0.0), ("pop", -13, 0.12), ("crowd", -15, 0.05)],
    "fire": [("fire", -14, 0.0)], "glow": [("sparkle", -13, -0.02)], "ring": [("ding", -13, 0.0)], "flash": [("hit", -10, 0.0)], "shake": [("hit", -8, 0.0)],
    "label": [("pop", -9, 0.0)], "bubble": [("pop", -10, 0.0)], "question": [("question", -10, 0.02)], "exclaim": [("pop", -9, 0.0), ("ding", -15, 0.03)],
    "grow": [("boing", -10, 0.0)], "shrink": [("slidewhistle", -11, 0.0)], "float": [("rise", -13, 0.0)], "spin": [("whoosh", -12, 0.0)],
    "vanish": [("pop", -9, 0.0), ("whoosh", -14, 0.02)], "appear": [("pop", -8, 0.0), ("sparkle", -13, 0.03)], "speed": [("whoosh", -12, 0.0)],
}
# action -> sound when a cast member starts it
DO_SFX = {"shock": [("pop", -13, 0.0)], "cheer": [("pop", -14, 0.0)], "jump": [("boing", -12, 0.05)], "fall": [("womp", -12, 0.0), ("knock", -12, 0.3)],
          "throw": [("whoosh", -12, 0.1)], "kick": [("knock", -10, 0.15)], "float": [("rise", -15, 0.0)], "clap": [("clap", -14, 0.0), ("clap", -14, 0.22), ("clap", -15, 0.44)],
          "angry": [("knock", -15, 0.0)], "cry": [("womp", -15, 0.0)], "scared": [("hit", -14, 0.0)], "facepalm": [("knock", -13, 0.15)]}


def build_sfx(TL, N, shots, find, W, END):
    x = np.zeros((N, 2), np.float32)
    events = []
    put = lambda name, t, g=-10.0, pan=0.0: events.append((t, name, g, pan))
    put("whoosh", 0.05, -14)
    for s in shots:
        wi = s["_wi"]

        def at(ph, nth=0):
            if ph in (None, "start"):
                return s["_start"]
            if isinstance(ph, (int, float)):
                return float(ph)
            j = find(ph, wi, nth or 0)
            return W[j][0] if j >= 0 else None
        if s.get("whoosh"):
            put("whoosh", s["_start"] - 0.12, -12)
        for f in s.get("fx", []):
            t = at(f.get("at"), f.get("nth"))
            if t is None:
                continue
            for name, g, off in FX_SFX.get(f.get("type"), []):
                put(name, t + off, g)
        for c in s.get("cast", []):
            if isinstance(c, str):
                continue
            moves = []
            if c.get("to") is not None:
                moves.append((at(c.get("go")) or s["_start"], at(c.get("stop"), c.get("stopNth")) or s["_end"] - 0.12, c.get("move", "walk")))
            for th in c.get("then", []):
                t = at(th.get("at"), th.get("nth"))
                if t is None:
                    continue
                for name, g, off in DO_SFX.get(th.get("do"), []):
                    put(name, t + off, g)
                if th.get("to") is not None:
                    moves.append((t, at(th.get("stop"), th.get("stopNth")) or s["_end"] - 0.12, th.get("move", "walk")))
            if c.get("do") in DO_SFX and s["_start"] > 0:
                for name, g, off in DO_SFX[c["do"]]:
                    put(name, s["_start"] + 0.12 + off, g - 2)
            for a, b, mv in moves:
                step = 0.17 if mv == "run" else 0.42
                k = 0
                while a + k * step < b and k < 40:
                    events.append((a + k * step, "_step", -20 if mv != "run" else -19, 0.0)); k += 1
        cr = s.get("crowd")
        if isinstance(cr, dict) and (cr.get("do") in ("cheer", "clap") or any(th.get("do") in ("cheer", "clap") for th in cr.get("then", []))):
            t = s["_start"] + 0.1
            for th in cr.get("then", []):
                if th.get("do") in ("cheer", "clap"):
                    t = at(th.get("at"), th.get("nth")) or t
            put("crowd", t, -13)
        for e in s.get("sfx", []):
            t = at(e.get("at"), e.get("nth"))
            if t is None or e.get("s") not in SFX:
                continue
            put(e["s"], t + e.get("offset", 0), e.get("gain", -10), e.get("pan", 0))
    # one sound at a time: of two within 0.1 s keep the louder
    events.sort()
    kept = []
    for ev in events:
        if kept and ev[1] != "_step" and kept[-1][1] != "_step" and ev[0] - kept[-1][0] < 0.1:
            if ev[2] > kept[-1][2]:
                kept[-1] = ev
            continue
        kept.append(ev)
    for t, name, g, pan in kept:
        if t < 0 or t > END:
            continue
        sig = S.steps([0.0], 240, 100) if name == "_step" else SFX[name]()
        S.put(x, sig * 10 ** (g / 20), t, pan=pan)
    return x, len(kept)


# ---------------------------------------------------------------- 4 mix
def lufs_file(path):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])


def lufs_arr(a):
    p = os.path.join(OUT, "_tmp.wav"); sf.write(p, a, SR, subtype="FLOAT"); r = lufs_file(p); os.remove(p); return r


def limiter(x, ceil_db=-1.5, look_ms=5.0, rel_ms=140.0):
    ceil = 10 ** (ceil_db / 20); B = 24
    pk = np.abs(x).max(1)
    env = np.maximum.reduceat(pk, np.arange(0, len(pk), B))
    g = np.minimum(1.0, ceil / np.maximum(env, 1e-9))
    L = int(look_ms / 0.5)
    hold = np.lib.stride_tricks.sliding_window_view(np.pad(g, (L, L), mode="edge"), 2 * L + 1).min(1)
    a = np.exp(-0.5 / rel_ms); out = hold.tolist(); prev = 1.0
    for i, h in enumerate(out):
        v = min(h, a * prev + (1 - a)); out[i] = v; prev = v
    wdw = np.hanning(2 * L + 1); wdw /= wdw.sum()
    smooth = np.convolve(np.pad(np.array(out), (L, L), mode="edge"), wdw, "valid")
    gain = np.interp(np.arange(len(pk)), (np.arange(len(smooth)) + 0.5) * B, smooth)
    return x * gain[:, None], gain


def mix(voice, music, sfx):
    Lv, _ = lufs_arr(voice); Lm, _ = lufs_arr(music); Ls, _ = lufs_arr(sfx) if np.abs(sfx).max() > 0 else (-70.0, 0)
    gm = 10 ** ((Lv - float(os.environ.get("MUSIC_UNDER", "13")) - Lm) / 20); gs = 10 ** ((Lv - 9.0 - Ls) / 20) if Ls > -69 else 0.0
    H = 480
    rms = np.sqrt(np.convolve((voice ** 2).mean(1), np.ones(H) / H, "same"))
    active = (20 * np.log10(rms + 1e-9) > -45).astype(np.float32)
    blk = 48; act_b = active[::blk]; out = np.empty(len(act_b), np.float32); prev = 0.0
    au, ad = np.exp(-blk / (0.08 * SR)), np.exp(-blk / (0.35 * SR))
    for i, v in enumerate(act_b):
        a = au if v > prev else ad
        prev = a * prev + (1 - a) * v; out[i] = prev
    sc = np.interp(np.arange(len(voice)), np.arange(len(out)) * blk, out).astype(np.float32)
    mixed = voice + music * gm * (10 ** (-4.0 * sc / 20))[:, None] + sfx * gs
    gain_db = -14.0 - lufs_arr(mixed)[0]
    for it in range(6):
        lim, curve = limiter(mixed * 10 ** (gain_db / 20))
        li, pk = lufs_arr(lim)
        if abs(li + 14.0) < 0.05:
            break
        gain_db += -14.0 - li
    print(f"mix: {li:.2f} LUFS, true peak {pk:.2f} dBFS (voice {Lv:.1f}, music {Lm:.1f}, effects {Ls:.1f} LUFS before levelling)")
    return lim


def main():
    os.makedirs(OUT, exist_ok=True)
    TL = json.load(open(os.path.join(ROOT, "timeline.json"), encoding="utf-8"))
    if TL.get("fake"):
        raise SystemExit("timeline.json has FAKE timing: make the voice first (tools/voice.py, tools/timeline.py)")
    shots = json.load(open(os.path.join(ROOT, "shots.json"), encoding="utf-8"))
    shots = shots.get("shots", shots) if isinstance(shots, dict) else shots
    END = TL["END"]; N = int(END * SR) + SR // 2
    W = TL["words"]; toks = [norm(w[2]) for w in W]

    def find(ph, frm=0, nth=0):
        p = [norm(x) for x in str(ph).split() if norm(x)]
        hit = 0
        for i in range(max(0, frm), len(toks) - len(p) + 1):
            if toks[i:i + len(p)] == p:
                if hit == nth:
                    return i
                hit += 1
        return -1
    cur = 0
    for i, s in enumerate(shots):
        at = s.get("at", 0 if i == 0 else None)
        if isinstance(at, (int, float)) or at is None:
            s["_wi"], s["_start"] = 0, float(at or 0)
        else:
            j = find(at, cur, s.get("nth", 0)); s["_wi"] = cur = max(0, j)
            s["_start"] = 0.0 if i == 0 else W[cur][0] - s.get("lead", 0.1) + s.get("shift", 0)
    for i, s in enumerate(shots):
        s["_end"] = shots[i + 1]["_start"] if i + 1 < len(shots) else END
    v = build_voice(TL, N); sf.write(os.path.join(OUT, "voice.wav"), v, SR, subtype="FLOAT")
    m, secs = build_music(TL, N, END)
    # the person's own song: put song.mp3 (or .wav/.m4a) in the project folder (or music/); it loops under the whole film
    song = next((q for q in [os.path.join(ROOT, d, "song" + e) for d in ("", "music") for e in (".mp3", ".wav", ".m4a")] if os.path.exists(q)), None)
    if song:
        a = decode(song)
        if a.ndim == 1: a = np.stack([a, a], 1)
        reps = int(np.ceil(N / max(1, len(a))))
        m = np.tile(a, (reps, 1))[:N].astype(np.float32)
        fade = int(SR * 1.5); m[-fade:] *= np.linspace(1, 0, fade)[:, None]
        secs = [("song " + os.path.basename(song), 0.0, END)]
    sf.write(os.path.join(OUT, "music.wav"), m, SR, subtype="FLOAT")
    x, n = build_sfx(TL, N, shots, find, W, END); sf.write(os.path.join(OUT, "sfx.wav"), x, SR, subtype="FLOAT")
    print("music:", ", ".join(f"{a:.1f}-{b:.1f} {name}" for name, a, b in secs))
    print(f"effects: {n} sounds")
    out = mix(v, m, x)
    sf.write(os.path.join(OUT, "mix.wav"), out[: int(END * SR)], SR, subtype="PCM_24")
    print("wrote audio/mix.wav", round(END, 2), "s. Next: render, then python tools/finish.py")


if __name__ == "__main__":
    main()
