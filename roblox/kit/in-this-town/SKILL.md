---
name: in-this-town
description: Makes a complete "In This Town" story Short (9:16, about 2 minutes) from one rule, like "In this town, every lie makes your nose glow". Writes the 12-beat story, voices it, builds every shot as blocky 3D characters with flat 2D faces in a bright town, adds karaoke captions, music and sound effects, and renders it on this computer with HyperFrames. Use when someone wants an "In This Town" video or short, the viral town-rule story format, or to turn a town rule or idea into such a short.
---

# In This Town shorts

One rule in, one finished Short out: a narrated story of about 300 words (about 2 minutes), 60 to 75 shots, blocky
characters whose flat faces swap expressions, a bright toy-like town, big karaoke captions, an original score and a sound
on nearly every action. The film is code: a Three.js town rendered frame by frame by HyperFrames, so a 2-minute short
renders in a few minutes on a PC with a graphics card. No Blender, no AI video model.

Needs: Node.js 22+, FFmpeg, Python 3.10+ with `pip install numpy scipy soundfile pillow`, a graphics card, and a voice:
an ElevenLabs API key (best), the free local voice, or the person's own recording (`references/voice.md`).

## The run

Work in this order. Tell the person what each step is doing in one line; don't make them read code.

1. **The rule and the story.** Ask for their town's rule if they didn't give one (offer three ideas that the kit can
   show, `references/story.md`). Write the story in the 12 beats, about 300 words, one paragraph per beat or half-beat.
   Show the person the narration only, numbered by paragraph, plus the title, and wait for their OK. Change it until they
   approve. Their story, their rule: never copy another channel's script.
2. **The project.** `python "<this skill>/scripts/new_project.py" "<project folder>"`, then write `story.json` there
   (format in `references/story.md`). Every command below runs inside the project folder.
3. **The voice.** `python tools/voice.py` (or `--engine local` / `--engine files`). Check its table: every take
   "new", no "check the text" flags, about 140-180 words a minute. Then `python tools/timeline.py`.
   Before the voice exists you can draft with `python tools/timeline.py --fake` (never render the final with it).
4. **The shots.** Write `shots.json`: one shot every 1.5 to 2.5 seconds, each one a place, who is there, what they do
   on which word, and a camera size. Read `references/shots.md` and `references/world.md` first; they hold every name
   the engine knows. Look at `shots_table.txt` and the word times in `timeline.json` while you write.
   `examples/100-words/` holds a complete, tested story.json + shots.json (51 shots, 1:38): copy its patterns.
5. **Build and check.** `python tools/build.py` (stops on a phrase that isn't spoken; fix and rerun), then
   `node tools/audit.mjs`. The audit runs the real engine on every shot and reports faces out of frame, hidden behind a
   wall or a person, under the captions, people standing inside each other, a camera inside a building. Fix every
   ERROR and the warnings that matter (`references/checks.md`), rerun until clean. `node tools/probe.mjs <shot> <time>`
   explains a single moment when a message isn't obvious.
6. **Look.** `python tools/look.py` writes `qa/look.jpg`, the middle frame of every shot. Open it and look at every
   frame: is the sentence's action readable at a glance, the face visible and turned to us, the right place and light?
   Fix in shots.json, rerun steps 5-6. `python tools/look.py s12 s13` shows start, middle and end of chosen shots.
7. **Render.** `npx --yes hyperframes@0.9.56 render --quality looks --fps 30 --output renders/film.mp4`
   (a few minutes for 2 minutes of film; much longer without a graphics card).
8. **Sound.** `python tools/audio.py` (voice + mood music + automatic effects, mixed to -14 LUFS).
9. **Finish.** `python tools/finish.py renders/film.mp4 "<Title> v1.mp4"` muxes and checks the result (length, black
   or flashing frames, frozen stretches, loudness, silences). Then `python tools/look.py --video renders/film.mp4`
   and look at every shot once more in the real render.
10. **Hand over.** Say where the file is, how long it is, what you checked and anything you couldn't check (you can't
   hear the sound: say so). Offer the notes loop below. Never overwrite a delivered file: the next one is v2.

## Notes from the person

They will say things like "the mayor should be angrier", "I can't see her face", "too slow at the start".
Map each note to shots.json (the table at the end of `references/shots.md`), change only what the note touches,
then steps 5-9 again. If a note changes the story text, change story.json and run `tools/voice.py` (it remakes only the
changed paragraphs), then `tools/timeline.py`, and check that every shot's "at" phrase is still spoken.

## What makes it look like the format

- A new shot every 1.5-2.5 s; every example in the story gets its own shot; cut on the word the shot is about.
- The rule happens on screen: when the narration says it, the effect happens on that word (`fx` with `"at"`).
- Faces carry the comedy: a face change on the punch word (`then` with `face`), big reactions (`shock`, `cheer`).
- Mix sizes: wide to set a place, medium for actions, close for reactions; never two shots in a row with the same
  place, size and angle.
- The first frame is already the town (an `xwide` shot of the plaza), the last shot lands the button joke.
- Original characters and places only: no brand names, logos or other creators' characters, in the story or on signs.

## When the kit can't show something

The templates cover people, a dog, about 40 props, 25 effects and 22 places. If a beat needs something else, first
rewrite the beat so the kit can show it (suggest it to the person). Only if that fails, write a custom shot in
`assets/lib/custom.js` (`references/custom.md`).
