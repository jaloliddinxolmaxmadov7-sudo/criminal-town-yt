# CRIMINAL TOWN: house rules for every episode

Channel: CRIMINAL TOWN (YouTube Shorts, English). Three shorts a day from the three topics the owner sends at 23:00 Tashkent time.

- Hero: `criminal` (tools/cast.py) is in every video and is the narrator ("me"). Recurring folks: `mom`, `mayor`, `cop`, `boss`, `granny`, `dog`. Add at least one NEW character per episode, and save good ones into tools/cast_templates.json.
- Pace (measured on the reference short): about 190-200 words a minute, almost no pauses (`"pause": 0.1`), a cut every 1.3-1.6 s, 55-65 shots for 90 s.
- Movement: nobody stands still. Every shot has a `do`, most have a `then` change on the punch word; use walk/run moves, `panic`, `stomp`, `spin`, `flex`, `swagger`, `crouch`.
- Emotions: change the face on the punch word; use the big ones (rage, terrified, shocked, starstruck, cryLaugh, dead, dizzy, cool, sly).
- Voice: ElevenLabs, model eleven_v4, an energetic male voice (tried: Jeffery S, voice id xsYWBkbz4Rx81JLaT6yH). Character lines pitched.
- Music: the owner's `song.mp3` in the project folder plays under every video.
- Render on the PC with the graphics card: `npx --yes hyperframes@0.9.56 render --quality looks --fps 60 --output renders/film.mp4`.
- Upload: Buffer, channel CRIMINAL TOWN (YouTube), as a Short.

## Pacing numbers (from the owner's Roblox Story Kit playbook and her reference short)
- Voice 240-270 words a minute after speed-up; cut pauses to about 0.1 s (ffmpeg silenceremove + atempo 1.3 on the ElevenLabs take).
- A cut every 1.0-1.3 s (50-60 cuts a minute); first word at 0.0 s; 3-4 cuts in the first 3 seconds.
- Hook first: an ordinary action + an impossible result, then "in this town, ...".
- The camera is never still; a reaction close-up after every surprise; a sound on every hit.
- The owner's song plays quietly: `MUSIC_UNDER=19 python tools/audio.py` (she asked for the music low under the voice).
- Voice arrives as ONE mp3 from the ElevenLabs connector (folder "persanak mp3"); the song is in "orqa fon mp3".

## Update 2026-11-24 (applies to the next videos)
- **Billboards:** the owner's channel banner (assets/img/banner.jpg) is on every town billboard.
- **Faces:** 24 bold PNG faces (assets/img/faces) drive most emotions; key close-ups show readable faces. Swap the face on the punch word.
- **Rig:** elbows and knees, feet always on the ground, soft contact shadow under every character, raised arms move out from the shoulder (no clipping into the torso).
- **Detail:** gold chain is a real U-shaped chain with a pendant, shoes have soles, belts on adults.
- **New recurring character `captain`:** army officer: olive camo jacket with pockets and rank badge, black pants, brown boots, classic yellow skin, black peaked officer cap with gold badge, blue mirror sunglasses. Use `"shades": false` on his cast entry (or in a `then`) for big-emotion close-ups so the eyes read.
- **Shot rules (roblox skill + blocky-shorts):** at least 25% close shots; 5-8 locations per video; rule visible in frame 1; final shot at least 3 s; extras off the lens line; push-in 8-11% of the lens distance per second; under 6% still frames.
- **Story shape (in-this-town-kit):** line 1 states the rule; 2-3 quick jokes about living with it; then "I ..." and the twist; the last line runs back into the first so the short loops.
- **Finish:** after the render and before finish.py run `python tools/grade.py renders/film.mp4 renders/film_g.mp4 --flash <twist shot ids>`: soft glow, firmer contrast, light vignette, speed lines over the hook, a white flash into the twist shots. Then `finish.py renders/film_g.mp4 ...`.
