# The world: every name the engine knows

## Places

Outside (one town; the camera's default view in brackets):

| place | what's there | spots |
|-------|--------------|-------|
| `plaza` | the town square; the long cream school with its red SCHOOL sign behind (looking north) | `bench`, `bench2` (sit) |
| `plazaEast` | the square looking at the white town hall and its clock tower | |
| `plazaWest` | the square looking at the bakery (striped awning) | |
| `plazaSouth` | the square looking down the main street, shops on both sides | |
| `school` | right in front of the school's big blank wall | |
| `townhall` | the town hall steps, columns, TOWN HALL sign, clock tower above | `door` |
| `bakery` | in front of the bakery (red-white awning, BAKERY sign) | `door` |
| `street` | the main street, coloured houses on both sides, lamp posts | |
| `home` | front yard of the blue house with the yellow door (the narrator's home) | `door` |
| `neighbor` | front yard of the house across the street | `door` |
| `paperShop` | in front of the blue PAPER shop | `door` |
| `jewelShop` | in front of the gold JEWELS shop | `door` |
| `tower` | under the water tower | |
| `field` | open grass outside town, hills far away (good for big things) | |

Inside (rooms are open toward the camera):

| place | what's there | spots |
|-------|--------------|-------|
| `kitchen` | table in the middle, fridge, counter, hanging lamp, window | `table` (stand behind it), `fridge`, `counter` |
| `bedroom` | a kid's room: bed, desk, rug, crayon drawings on the wall | `bed` (`sleep` there), `desk` |
| `bakeryIn` | brick oven, shelves of bread, a counter with loaves | `counter` (the baker's side), `oven` |
| `shopIn` | a general shop: shelves of boxes and jars, counter, OPEN board | `counter` |
| `jewelIn` | a dark fancy shop: glass cases, gold bars | `counter` |
| `classroom` | chalkboard (CLASS), four kids' desks, teacher's desk | `board` |
| `living` | sofa, coffee table, TV, rug, pictures | `sofa` (sit), `tv` |
| `office` | the mayor's office: big desk with a MAYOR plate, bookshelf, flag | `desk` (sit behind it) |

The town hall clock follows the light (`clock` sets it). Windows glow at dusk and night.

## Cast presets (`"preset"` in story.json, or the name directly in a shot)

| preset | looks like |
|--------|------------|
| `me` | kid, green hoodie, messy brown hair, freckles (a good narrator) |
| `theo` / `theoPj` | small kid, yellow star shirt, fringe; / in blue pyjamas |
| `girl` / `girlPj` | kid, pink dress, dark skin, ponytail; / in lilac pyjamas |
| `boy` | kid, orange striped shirt, blue cap |
| `mayor` | round, dark suit, red sash, top hat, grey moustache |
| `chief` | fire chief: yellow coat, red helmet, moustache |
| `teacher` | tall, paint smock, purple beret, glasses, orange bun |
| `baker` | round, white apron, chef's hat, moustache |
| `knight` | tall, silver armour, red cape and plume |
| `shop` | shopkeeper: purple shirt, bow tie, curly grey hair, glasses |
| `jeweler` | tall, black suit, gold chain, moustache |
| `pickle` | a brown and white dog |

## Your own characters (story.json `cast`)

```json
"rosa": {"build": "kid", "shirt": "#ff6fae", "front": "dress", "frontAcc": "#ffffff", "pants": "#ff6fae", "shoes": "#ffffff",
         "skin": "#8d5a3b", "hair": "pony", "hairColor": "#1f130c", "hat": null, "faceStyle": {"blush": 1}}
```
- `build`: `adult`, `tall`, `round`, `kid`, `small`. `dims` overrides sizes: `{"legH": 2.4, "head": 1.6}`.
- Colours: `shirt`, `sleeves`, `pants`, `shoes`, `skin`, `hairColor`, `gloves`, `hatColor`.
- `front` (the shirt's print): `hoodie`, `star`, `suit`, `coat`, `smock`, `apron`, `armor`, `pajamas`, `stripes`,
  `buttons`, `dress`; `frontAcc` its second colour. `shortSleeves: true`.
- `hair`: `short`, `messy`, `spiky`, `fringe`, `long`, `pony`, `bun`, `curly`, `bald`.
- `hat`: `top`, `helmet`, `beret`, `chef`, `cap`, `knight`, `crown`.
- `extras`: any of `sash`, `bowtie`, `hood`, `cape`, `belt`, `chain`.
- `faceStyle`: `freckles`, `blush`, `glasses: "#colour"`, `mustache: "#colour"`, `brow: "#colour"`.
- A dog: `{"kind": "dog", "coat": "#e0b04a", "ears": "#7e4a22", "patch": "#fbf3e6"}`.

## Faces (37)

Extra emotions (Criminal Town kit): `cool` (shades), `sus`, `starstruck`, `dizzy`, `dead`, `rage` (red face), `terrified`, `cryLaugh`, `sly`, `cheeky`, `shocked`, `smirk`, `flirty` (wink), `bored`.
Extra moves (`do`): `flex`, `swagger`, `thumbsup`, `salute`, `shiver`, `spin`, `slowclap`, `panic`, `mic`, `stomp`.
Rig: arms and legs have elbows and knees. Walking, running and sitting bend them by themselves; an arm pose can take a 4th value for the elbow bend (`armR: [raise, spread, twist, elbow]`), and `kneeL` / `kneeR` bend a knee. More moves: `crouch`, `kneel`, `armscross`.
Own song: put `song.mp3` in the project folder; tools/audio.py loops it under the voice instead of the built-in music.
Recurring cast: `python tools/cast.py criminal mom mayor cop boss granny dog` adds ready characters to story.json (templates in tools/cast_templates.json).


`smile`, `happy`, `grin`, `laugh`, `proud`, `love`, `wow`, `gasp`, `scared`, `worried`, `sad`, `cry`, `angry`, `shout`,
`evil`, `smug`, `meh`, `sleepy`, `blink`, `talk`, `tongue`, `sheepish`, `determined`.
Someone whose line is being spoken (story.json `speaker`) moves their mouth by themselves.

## Actions (`do`)

| action | looks like |
|--------|------------|
| `idle` | standing, breathing |
| `talk` | one hand gesturing |
| `wave`, `waveL` | waving with the right / left hand |
| `cheer` | both arms up, jumping |
| `shock` | arms up, jumps back |
| `scared` | arms in front, leaning back, shaking |
| `point`, `pointL`, `pointUp` | pointing forward (turn them with `look`) / up |
| `shrug`, `hips`, `fist`, `think`, `facepalm` | as named (facepalm covers the face) |
| `cry`, `laugh`, `angry` | crying with the head down, laughing bounce, angry stomp |
| `jump`, `dance`, `bow`, `stretch` | as named |
| `sit` | sits (on a spot with a seat, a `chair` or `bench` prop at their mark, or the floor) |
| `sleep` | lies on their back (on the `bed` spot in the bedroom) |
| `fall` | falls over backwards |
| `hold`, `carry`, `present` | both hands forward / both up over the head / one hand offering |
| `draw`, `drawDesk`, `rub` | drawing on a wall / on a desk, rubbing (erasing) |
| `sneak` | crouching (with `move: "sneak"` they creep) |
| `nod`, `no` | head yes / no |
| `hug`, `clap`, `eat`, `throw`, `kick` | as named |
| `float` | rises a little and hovers, arms out |
| `look` | still, for a `look` change |

## Props (`kind`)

`cake`, `loaf`, `apple`, `cup`, `bike`, `car`, `ball`, `stick`, `sword`, `shield`, `pencil`, `eraser`, `crayons`,
`book`, `phone`, `umbrella`, `gift`, `balloon`, `trophy`, `bag` (money bag; `text` on it), `coin`, `gold`, `crate`,
`lockbox`, `cage`, `ladder`, `wheelbarrow`, `flashlight`, `trash`, `rug`, `table`, `chair`, `bed`, `fridge`, `bench`,
`tree`, `lamp`, `stage` (a platform with a red curtain and lights, `text` on a banner; stand on it with `"y": 1.1`),
`sign` (`text`: lines on a board on a post), `chalkboard` (`text`), `priceTag` (`text`),
`drawing` (a crayon doodle standing up; `design`), `paper` (a sheet with a doodle; `design`).
Doodle designs: `cake`, `bike`, `bikeChalk`, `bread`, `spider`, `carSmall`, `carBig`, `smiley`, `potatoCat`,
`creature1`, `creature2`, `potatoDog`, `dragon`, `wing`, `messy`, `lump`, `stickYou`, `posterDog`.

## Effects (`fx.type`) and their sounds

| effect | looks like | sound |
|--------|-----------|-------|
| `sparkle` | a burst of stars + ring | sparkle, pop |
| `twinkle` | stars shimmering around (lasting) | soft sparkle |
| `puff` | a white puff (a sneeze, a pop) | whoosh, pop |
| `smoke` | grey smoke rising (lasting) | wind |
| `hearts` | hearts floating up (lasting) | heart |
| `confetti` | coloured confetti falling | pops, small crowd |
| `zzz`, `notes` | Z's / music notes rising (lasting) | none |
| `fire` | flames (lasting) | fire |
| `glow` | a coloured glow + light on a part (lasting) | soft sparkle |
| `ring` | an expanding ring | ding |
| `flash` | the screen flashes white | hit |
| `dark` | the screen goes dark (`dur`) | none |
| `shake` | the camera shakes | hit |
| `label` | a white tag with `text` over a head, or a counter (`count`) (lasting) | pop |
| `bubble`, `question`, `exclaim` | a speech bubble with `text` / ? / ! (lasting) | pop, question |
| `grow`, `shrink` | target grows / shrinks (`amount` = factor) | boing / slide whistle |
| `float` | target rises (`amount` = height) | rise |
| `spin` | target spins (`amount` = turns) | whoosh |
| `vanish`, `appear` | target shrinks away / pops in | pop, whoosh / pop, sparkle |
| `speed` | speed lines behind a runner | whoosh |

Extra sounds (`sfx[].s`): `pop`, `whoosh`, `sparkle`, `ding`, `bell`, `bikebell`, `boing`, `womp`, `honk`, `beep`,
`kaching`, `scratch`, `squeak`, `knock`, `slam`, `click`, `clink`, `crowd`, `roar`, `crunch`, `chomp`, `tear`, `bark`,
`yip`, `flap`, `fire`, `tick`, `crickets`, `wind`, `swish`, `rise`, `slidewhistle`, `slideup`, `heart`, `question`,
`hit`, `kick`, `clap`, `splash`. Actions make their own: `jump` boing, `fall` womp, `clap` claps, `throw` whoosh,
walking and running footsteps, a cheering `crowd`.
