# shots.json

A list of shots in spoken order. Each shot starts 0.1 s before its `"at"` phrase (searched forward from the previous
shot's phrase) and lasts until the next shot starts. Everything else in a shot is data; the engine poses the people,
frames the camera by itself (fits the subjects, keeps heads above the captions, steps around walls and people) and
draws the effects. Names you can use (places, faces, actions, props, effects) are in `world.md`.

## A shot

```json
{
  "id": "s07",
  "at": "Say you love Grandma's soup",
  "place": "kitchen",
  "sky": "room",
  "cast": [
    {"who": "me", "face": "smile", "do": "talk", "then": [{"at": "soup", "face": "sheepish"}]},
    {"who": "grandma", "at": "right", "face": "happy", "do": "hold"}
  ],
  "props": [{"id": "bowl", "kind": "cup", "hold": "grandma"}],
  "fx": [{"type": "glow", "at": "Glow", "on": "me", "part": "face", "color": "#ffe14d"}],
  "cam": {"size": "medium", "angle": -15, "move": "push"}
}
```

| Field | What it does |
|-------|--------------|
| `id` | Optional name (`s01`, `s02`... by default). |
| `at` | The phrase the cut lands on (1-4 words, spelled as spoken). The first shot needs none. `nth`: use the 2nd, 3rd... match (0-based). `shift`: move the cut later (+) or earlier (-) in seconds. |
| `place` | Where (`world.md`, Places). Default `plaza`. |
| `sky` | `day`, `morning`, `afternoon`, `dusk`, `night`, `dawn`; indoors `room` or `roomNight`. Default `day` outside, `room` inside. |
| `cast` | Who is in the shot and what they do (below). Up to 5 reads well; the camera frames all of them unless `cam.on` says otherwise. |
| `crowd` | Townsfolk around the action: `{"n": 8, "where": "behind", "face": "wow", "do": "cheer", "then": [...]}`. `where`: `behind`, `around`, `sides`, `line`, `front` (an audience between the camera and the cast, facing them). Max 12; townsfolk already in `cast` are left out. |
| `extras` | 1-4 townsfolk strolling far behind (life in wide town shots). |
| `props` | Objects (below). |
| `fx` | Effects on words (below). |
| `cam` | The camera (below). A string works too: `"close me"`, `"wide"`. |
| `sfx` | Extra sounds on words: `[{"at": "door", "s": "knock", "gain": -10}]` (names in `world.md`). Effects and actions already make their own sounds. |
| `whoosh` | `true` puts a whoosh on the cut. Only for real reveals (two or three in a film). |
| `look` | `"flashback"` = old sepia film look for a legend or memory. |
| `clock` | `[h, m]` on the town hall clock (e.g. `[11, 59]` for "a minute to midnight"). |
| `tower` | `"burned"` shows the water tower burned black. |
| `tpl` | `"paper"`: a hand drawing a doodle on paper, seen from above (below). `"custom"`: your own code (`custom.md`). |

## Cast entries

```json
{"who": "rosa", "at": "left", "face": "grin", "do": "wave", "look": "cam",
 "then": [{"at": "lie", "face": "sheepish", "do": "shrug"}, {"at": "ran", "to": "offRight", "move": "run"}]}
```

- `who`: a role from story.json `cast`, a preset (`world.md`) or `folk0`-`folk15` (townsfolk).
- `at`: where they stand: a mark (`center`, `left`, `right`, `farLeft`, `farRight`, `front`, `back`, `backLeft`,
  `backRight`, `frontLeft`, `frontRight`, `offLeft`, `offRight`), a place's spot (`counter`, `bed`, `sofa`... see
  Places) or `[x, z]` in metres-ish units: x to the right, z toward the camera, around the place's centre.
  Without `at`, people line up left to right in list order, 3.4 apart.
- `face`: the expression (23 kinds). `do`: the action (40 kinds). Both change on words with `then`.
- `look`: where they face: `cam` (default, turned a little toward the others), `center`, a role (`"rosa"`), `away`,
  `left`, `right`, or degrees.
- `to` + `move`: walk (`walk`, `run`, `sneak`) from `at` to another mark during the shot; `go` / `stop` are the words
  it starts and ends on (default: shot start to shot end). Inside `then`, `"to"` starts a move on that word.
- `y`: stand higher (on a roof: 9; floating in the air). `s`: size (2 = giant, 0.5 = tiny).
- `then`: changes on words: `{"at": "word", "face": ..., "do": ..., "look": ..., "to": ..., "move": ..., "y": ...}`.
  Each change lasts until the next one. A shot with one change on its punch word reads twice as funny.

## Props

```json
{"id": "sign1", "kind": "sign", "at": [0, 1], "text": ["NO LIES", "ALLOWED"], "key": true}
{"kind": "loaf", "hold": "baker", "dy": 0.2}
{"kind": "gift", "at": "front", "appear": "present", "s": 1.5}
```

- `kind`: see `world.md`. `at` like cast (default a little in front of centre). `y` height, `ry` turn in degrees,
  `s` size, `color`, `text` (sign, chalkboard, priceTag, bag), `design` (drawing, paper).
- `hold`: a role holds it in the right hand (`"hand": "L"` for the left); `dy` moves it up/down in the hand.
  Give the holder `"do": "hold"` (both hands) or `"present"` (one hand forward).
- `appear` / `vanish`: words where it pops in / out (use with `fx` `appear` / `vanish` on `"prop:<id>"` for a puff).
- `key: true`: the camera keeps it in frame. `cam.on: "prop:<id>"` frames only the prop (an insert shot).

## Effects

```json
{"type": "glow", "at": "lie", "on": "me", "part": "face", "color": "#ffe14d", "until": "And"}
{"type": "label", "at": "ninety", "on": "rosa", "text": "99"}
{"type": "float", "at": "laughed", "on": "baker", "amount": 4, "dur": 1.5}
```

- `type`: `sparkle`, `twinkle`, `puff`, `smoke`, `hearts`, `confetti`, `zzz`, `notes`, `fire`, `glow`, `ring`,
  `flash`, `dark`, `shake`, `label` (a tag with `text` over a head), `bubble` (speech bubble with `text`), `question`,
  `exclaim`, `grow`, `shrink`, `float`, `spin`, `vanish`, `appear`, `speed`.
- `at`: the word it happens on (default: the shot's start). `until`: the word it stops on (lasting effects: glow,
  twinkle, smoke, hearts, zzz, notes, fire, label, bubble).
- `on`: a role, `"prop:<id>"`, or `[x, y, z]`. `part`: `head`, `face`, `above`, `hand`, `body`, `feet`.
- `size`, `color`, `n` (particles), `amount` (grow/shrink factor, float height, spin turns, flash/shake strength),
  `dur` (seconds the change takes).
- Counters: a `label` with `"count": [100, 97]` shows a number that runs from 100 to 97: smoothly over `dur` seconds, or
  with `"step": true` one step on each spoken word from `at` to `until` (`per`: how much per word). Big numbers get
  commas (11,000); `suffix` adds text after the number. To keep a counter on someone through several shots, give each
  shot its own label, starting where the last one ended.
- `grow`, `shrink`, `float`, `spin`, `vanish`, `appear` change the target itself and stay changed for the rest of the shot.
  The next shot starts fresh, so repeat the state there (`"s": 0.5`, `"y": 4`) if it should continue.

## The camera

```json
"cam": {"size": "close", "on": ["rosa"], "angle": 20, "height": "low", "move": "push"}
```

- `size`: `xwide` (the town from above; no cast = an establishing shot), `wide` (people small, place big), `full`
  (whole bodies), `medium` (waist up), `close` (head and shoulders), `xclose` (face), `insert` (a prop), `top` (from above).
- `on`: who to frame (default everyone in `cast` and `key` props). `"crowd"` adds the crowd.
- `angle`: degrees around the subjects from the place's default view (+ = the camera moves right). Each place limits
  the angle so the camera never sees empty space; the solver turns further by itself if a wall or person blocks a face.
- `height`: `low` (looking up: heroic, funny giants), `eye`, `high` (looking down), `top`.
- `move`: `push` (slow push in, default), `pull`, `left`, `right`, `up`, `down`, `orbit`, `orbitL`, `zoom`, `follow`
  (pans along with a walker), `still`, `shake`. `speed`: 0.5-2. `fov`: lens angle in degrees.
- `back: true` allows a close shot of someone's back (otherwise the audit warns).
- `free: true` lets `angle` leave the place's usual range (a reverse shot: from the stage toward the audience).
- Two or three people: without `at` they line up 3.4 apart; with marks, `left`/`right` suit two, `farLeft`/`center`/`farRight` three.
- An audience in front of someone (`crowd` `where: "front"`) sits between the camera and them: the solver looks over
  their heads; for a close-up of the performer give `cam.on` only the performer.

## Paper shots

```json
{"at": "Draw a cake", "tpl": "paper", "place": "kitchen", "design": "cake", "tool": "crayon", "color": "#f06292", "by": "me"}
```
A sheet on the place's table, seen from above, with a hand drawing `design` from `drawFrom` to `drawTo` (words; default
the whole shot). `tool`: `pencil`, `crayon`, `chalk`. `by`: whose sleeve and skin. Designs in `world.md`.

## Pacing (what the 17-million-view shorts do)

- 60-75 shots for 2 minutes: a cut every 1.5-2.5 s. `build.py` warns about shots over 4.6 s: split them or add a
  `then` change.
- Every example sentence gets its own shot, often two (the setup, then the punch word in a close-up).
- Cut on the word that matters (`at` = the noun or verb the picture shows), not on "and" or "the".
- Alternate sizes (wide - medium - close) and places; turn `angle` 20-40 degrees between two shots in one place.
- The rule's effect lands exactly on its word (`fx.at`), with a face change on the same or next word.
- Night beats: `sky: "night"` outside, `roomNight` inside. Legends: `look: "flashback"`.
- The last shot: the narrator close, a cheeky face (`grin`, `evil`, `smug`), the button line, `do: "point"` or `wave`.

## Turning notes into changes

| The note | Change |
|----------|--------|
| "I can't see his face" / "someone blocks her" | another `angle`, move people apart (`at`), a closer `size`, or `cam.on` only that person |
| "too far / too small" | a bigger `size` (wide -> full -> medium -> close) |
| "angrier / happier / scared-er" | `face` (angry, shout, evil / happy, laugh, love / scared, gasp, worried) and `do` (angry, fist / cheer, jump / scared, shock) |
| "make him bigger / taller" | `"s": 1.3` on the cast entry (every shot he's in) or a custom character's `dims` |
| "the joke doesn't land" | a `then` face change on the punch word, a close-up on it, an effect on that word |
| "too slow here" | split the shot in two (a new `at` on a later word) or use a closer size and a `push` |
| "wrong place / it should be night" | `place`, `sky` |
| "the sound is too much" | remove that shot's `sfx` or effect; effects make their own sounds |
