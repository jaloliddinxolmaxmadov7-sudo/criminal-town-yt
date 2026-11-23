# Checking the short

Three checks, in this order. Run them after every change to shots.json.

## 1. tools/build.py: the words

| Message | Fix |
|---------|-----|
| `"X" is not spoken after word N (next words: ...)` | the phrase is misspelt, out of order (shots must follow the narration), or used twice: give `nth`, or pick a later word. It prints the words that follow. |
| `only 0.2 s long` | two shots' phrases are the same moment: drop one or anchor it on a later word |
| `short (0.5 s)` | a viewer can't read it: merge it into the next shot |
| `long (5.1 s)` | split it on a later word, or add `then` changes so something happens every 2 s |
| `same place, size and angle: the cut will jump` | change `size`, or `angle` by 20-40 degrees, or the place |
| `paragraph p07 has no cut` | give that paragraph a shot of its own |
| `"word" is spoken at 31.20 s, after this shot ends` | that change belongs in the next shot |

## 2. node tools/audit.mjs: the picture, without rendering

It runs the film's engine on every shot at several moments (start, middle, end, after each change) and reports:

| Message | Fix |
|---------|-----|
| `the film doesn't start: unknown face "x"` (or action, prop, effect, place, mark, cast member) | a name that isn't in `world.md` |
| `X's face is out of frame` | something moves the face out (a jump, a float, a walk): a wider `size`, `cam.on` that person, or a smaller `amount` |
| `X's face hidden by Y` | the solver found no clear angle: move people apart (`at`), another `angle`, or drop the blocker from the shot |
| `X and Y stand inside each other` | give them marks further apart (`left` / `right`, `farLeft` / `farRight`) |
| `camera inside a building` / `outside the room` | a smaller `size`, another `angle` or place; rooms are small, use `medium` or `close` there |
| `X's face is under the captions` | the caption band is the lower middle: a closer size, or `height: "high"` |
| `X has their back to the camera` | `look: "cam"`, or `cam.angle` toward their front; `cam.back: true` if it's meant |
| `X is very small for a medium shot` | something far off is in `cam.on`; frame fewer subjects |
| `camera found no clear angle` | same as hidden faces |
| `N other people stand right in front of the lens` | the camera looks past people close to it: another `angle`, move them (`at`), or `height: "high"` |

`--verbose` prints each shot's chosen camera (yaw, pitch, distance, lens). `node tools/probe.mjs s23 44.9` explains one
moment: where each face is on screen and exactly what stands between it and the camera.

## 3. tools/look.py: your eyes

Open `qa/look.jpg` and check every frame for what the audit can't judge:
- Does the frame show what the sentence says, at a glance? (the action, the right person, the effect on its word)
- Is the face expression right for the moment? Do two neighbouring shots look too alike?
- Anything odd: someone half inside a wall or furniture, a prop floating, an empty frame, a held prop hiding a face.
- After the render, `python tools/look.py --video renders/film.mp4` checks the real frames; `tools/finish.py` checks
  black or flashing frames, frozen stretches over 3 s, loudness (-14 LUFS), silences over 0.6 s and the length.

You can't hear the sound: tell the person the music and effects were measured, not listened to, and ask them to listen.
