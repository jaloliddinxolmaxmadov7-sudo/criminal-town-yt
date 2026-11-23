# The voice

The format uses an energetic narrator; character lines are the same voice pitched up or down.
`tools/voice.py` makes one take per story.json paragraph with its word times, and remakes only paragraphs whose text
changed. The film never cuts inside a take.

## ElevenLabs (best, tested)

Set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` (or put `"voice": "<voice id>"` in story.json), then
`python tools/voice.py`. It asks for `eleven_v4` and falls back to `eleven_v3`, then `eleven_multilingual_v2`
(`ELEVENLABS_MODEL` picks another). Each paragraph goes out with the previous one as context, so the takes flow.
A 300-word story is about 1,700 characters of the plan's quota. Never print the API key.

Check the table it prints: each take's speed in words a minute (140-180 is normal; a much faster or slower take
can be remade with `--only p07`) and any "check the text" flag (the timed words don't match the written ones:
usually a number written as digits, or a symbol).

## Free, on this computer

`python tools/voice.py --engine local [--voice am_michael]` uses Kokoro through `npx hyperframes tts` (needs Python
3.10+ with `pip install kokoro-onnx soundfile`; the model downloads on first use). Voices: `am_michael`, `am_adam`,
`bm_george` (male), `af_heart`, `af_nova`, `af_sky`, `bf_emma`, `bf_isabella` (female). Word times come from
`npx hyperframes transcribe`; if that isn't available they are spread over the speech by syllables (good enough for
cuts, a little loose for the karaoke captions). Less lively than ElevenLabs.

## Your own voice

Record one file per paragraph, in order, as `vo/p01.wav`, `vo/p02.wav`, ... (or .mp3), each starting and ending
with a little silence, then `python tools/voice.py --engine files`. Word times as for the local voice.

## Character lines

A paragraph with `"speaker": "<role>"` and `"pitch": <semitones>` is pitched in `tools/audio.py` (its length stays the
same, so the word times hold), shows its captions in yellow, and that role's mouth moves on its words.
