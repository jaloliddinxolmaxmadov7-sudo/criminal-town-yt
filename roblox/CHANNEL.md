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
