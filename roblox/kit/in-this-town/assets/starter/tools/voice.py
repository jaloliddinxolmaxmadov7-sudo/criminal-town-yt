"""The narration: one take per paragraph of story.json, each with its word times.

  python tools/voice.py                   ElevenLabs (env ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID, or "voice" in story.json)
  python tools/voice.py --engine local    a free voice made on this PC (Kokoro, through "npx hyperframes tts")
  python tools/voice.py --engine files    your own recordings: put vo/p01.wav (or .mp3), vo/p02.wav, ... in vo/ first
  --force          make every take again (otherwise only new or changed paragraphs are made)
  --only p03,p07   make just these takes again
  --voice NAME     Kokoro voice for --engine local (default am_michael)

Writes vo/pNN.mp3 (or .wav) and vo/pNN.json = {"file", "text", "words": [[start, end, word]], "keep"}.
"keep" is where the take's sound ends: the film plays every take whole, never cut inside.
Numbers in the text should be written as words ("nineteen eighty"), so the voice and the captions agree.
Next: python tools/timeline.py
"""
import argparse, base64, json, os, re, subprocess, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "vo")
API = "https://api.elevenlabs.io"
HF = ["npx", "--yes", "hyperframes@0.9.56"]
SHELL = os.name == "nt"


def decode(path, sr=16000):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def speech_end(path, last_word_start):
    """Where the sound of the take really ends (the voice's own decay, after its last word starts)."""
    import numpy as np
    a = decode(path); sr = 16000; hop = 160
    n = len(a) // hop
    if n == 0:
        return 0.0
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms)
    thr = max(-52.0, db.max() - 40.0)
    i0 = int(max(0.0, last_word_start) * sr / hop)
    loud = np.where(db[i0:] > thr)[0]
    end = (i0 + (loud[-1] + 1 if len(loud) else 0)) * hop / sr
    return round(min(len(a) / sr, end + 0.12), 3)


def words_from_alignment(al):
    out, word, start = [], "", 0.0
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    for i, ch in enumerate(chars):
        if ch.isspace():
            if word:
                out.append([round(start, 3), round(en[i - 1], 3), word]); word = ""
        else:
            if not word:
                start = st[i]
            word += ch
    if word:
        out.append([round(start, 3), round(en[-1], 3), word])
    return out


def eleven(text, prev, key, voice, model, fmt):
    body = {"text": text, "model_id": model}
    if prev:
        body["previous_text"] = prev
    req = urllib.request.Request(f"{API}/v1/text-to-speech/{voice}/with-timestamps?output_format={fmt}", data=json.dumps(body).encode(),
                                 method="POST", headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())


def make_eleven(i, paras, story):
    key = os.environ.get("ELEVENLABS_API_KEY")
    voice = os.environ.get("ELEVENLABS_VOICE_ID") or story.get("voice")
    if not key or not voice:
        raise SystemExit("ElevenLabs needs ELEVENLABS_API_KEY and a voice id (ELEVENLABS_VOICE_ID, or \"voice\" in story.json).\n"
                         "No ElevenLabs? Use --engine local (free voice on this PC) or --engine files (your own recordings).")
    models = [os.environ.get("ELEVENLABS_MODEL") or story.get("voice_model") or "eleven_v4", "eleven_v3", "eleven_multilingual_v2"]
    text, prev = paras[i]["text"], paras[i - 1]["text"] if i else None
    last = None
    for model in dict.fromkeys(models):
        for fmt in ("mp3_44100_192", "mp3_44100_128"):
            try:
                d = eleven(text, prev, key, voice, model, fmt)
                mp3 = os.path.join(VO, "p%02d.mp3" % (i + 1))
                open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
                return mp3, words_from_alignment(d["alignment"])
            except urllib.error.HTTPError as e:
                body = e.read()[:400].decode("utf-8", "replace")
                last = f"ElevenLabs {e.code}: {body}"
                if e.code in (401, 402, 429):
                    raise SystemExit(last + "\n(check the API key, the plan's credits or wait for the rate limit)")
                if "model" in body.lower() and e.code in (400, 404, 422):
                    break  # try the next model
                if e.code in (400, 403) and fmt == "mp3_44100_192":
                    continue  # the bitrate depends on the plan
                raise SystemExit(last)
    raise SystemExit(last or "ElevenLabs failed")


def transcribe_words(path, text):
    if os.environ.get("SKIP_TRANSCRIBE"):
        return spread_words(path, text)  # no transcriber available (e.g. cloud sandbox)
    """Word times for a take made elsewhere: HyperFrames' transcriber, else spread over the speech by syllables."""
    try:
        r = subprocess.run(HF + ["transcribe", path, "--json"], cwd=ROOT, capture_output=True, text=True, timeout=900, shell=SHELL)
        data = json.loads(r.stdout[r.stdout.find("{"):]) if "{" in r.stdout else None
        found = []

        def walk(o):
            if isinstance(o, dict):
                w = o.get("word") or o.get("text")
                if isinstance(w, str) and isinstance(o.get("start"), (int, float)) and isinstance(o.get("end"), (int, float)) and " " not in w.strip():
                    found.append([float(o["start"]), float(o["end"]), w.strip()])
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(data)
        mine = text.split()
        if found and abs(len(found) - len(mine)) <= max(2, len(mine) // 10):
            if found[0][0] > 1000:  # milliseconds
                found = [[a / 1000, b / 1000, w] for a, b, w in found]
            if len(found) == len(mine):
                return [[a, b, w] for (a, b, _), w in zip(found, mine)]   # keep the script's spelling
            print(f"  note: the transcript has {len(found)} words, the text {len(mine)}: timing words by syllables inside the speech")
    except Exception as e:  # transcriber missing or unexpected output
        print(f"  note: transcription unavailable ({str(e)[:80]}): timing words by syllables inside the speech")
    return spread_words(path, text)


def spread_words(path, text):
    import numpy as np
    a = decode(path); sr = 16000; hop = 160
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms); loud = np.where(db > max(-50, db.max() - 35))[0]
    t0, t1 = loud[0] * hop / sr, (loud[-1] + 1) * hop / sr
    ws = text.split()
    wt = [max(1, len(re.findall(r"[aeiouy]+", w.lower()))) + (0.8 if re.search(r"[.!?,;:]$", w) else 0) for w in ws]
    tot, t, out = sum(wt), t0, []
    for w, k in zip(ws, wt):
        d = (t1 - t0) * k / tot
        out.append([round(t, 3), round(t + d * 0.85, 3), w]); t += d
    return out


def make_local(i, paras, voice):
    wav = os.path.join(VO, "p%02d.wav" % (i + 1))
    txt = os.path.join(VO, "p%02d.txt" % (i + 1))
    open(txt, "w", encoding="utf-8").write(paras[i]["text"])
    r = subprocess.run(HF + ["tts", txt, "-o", wav, "-v", voice], cwd=ROOT, capture_output=True, text=True, shell=SHELL)
    if r.returncode or not os.path.exists(wav):
        raise SystemExit("the local voice failed:\n" + (r.stdout + r.stderr)[-1500:] +
                         "\nIt needs Python 3.10+ with: pip install kokoro-onnx soundfile")
    return wav, transcribe_words(wav, paras[i]["text"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", default="eleven", choices=["eleven", "local", "files"])
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--voice", default="am_michael")
    a = ap.parse_args()
    story = json.load(open(os.path.join(ROOT, "story.json"), encoding="utf-8"))
    paras = story["paragraphs"]
    os.makedirs(VO, exist_ok=True)
    only = {x.strip() for x in a.only.split(",") if x.strip()}
    made, chars = 0, 0
    for i, p in enumerate(paras):
        pid = "p%02d" % (i + 1)
        meta = os.path.join(VO, pid + ".json")
        old = json.load(open(meta, encoding="utf-8")) if os.path.exists(meta) else None
        redo = a.force or pid in only or not old or old.get("text") != p["text"]
        if only and pid not in only:
            redo = False if old else redo
        if redo:
            if a.engine == "eleven":
                f, words = make_eleven(i, paras, story); chars += len(p["text"])
            elif a.engine == "local":
                f, words = make_local(i, paras, a.voice)
            else:
                f = next((os.path.join(VO, pid + ext) for ext in (".wav", ".mp3", ".m4a") if os.path.exists(os.path.join(VO, pid + ext))), None)
                if not f:
                    raise SystemExit(f"missing your recording vo/{pid}.wav (one file per paragraph, in order)")
                words = transcribe_words(f, p["text"])
            if not words:
                raise SystemExit(f"{pid}: no words came back")
            keep = speech_end(f, words[-1][0])
            json.dump({"file": os.path.basename(f), "text": p["text"], "words": words, "keep": keep}, open(meta, "w", encoding="utf-8"), indent=1)
            made += 1
        m = json.load(open(meta, encoding="utf-8"))
        w = m["words"]
        n = len(p["text"].split())
        flag = "" if len(w) == n else f"   <-- {len(w)} timed words for {n} written: check the text"
        span = max(0.1, w[-1][1] - w[0][0])
        print(f"{pid} {'new ' if redo else 'kept'} {m['keep']:6.2f}s  {round(len(w) / span * 60):3d} wpm  {p['text'][:56]}{flag}")
    print(f"{made} take(s) made" + (f", {chars} characters sent to ElevenLabs" if chars else "") + ". Next: python tools/timeline.py")


if __name__ == "__main__":
    main()
