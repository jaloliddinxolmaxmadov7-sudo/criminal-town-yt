# The story

## The format

About 300 words, told by a first-person narrator, always in these 12 beats:

| # | Beat | What it does | Example ("every lie makes your nose glow") |
|---|------|--------------|---------------------------------------------|
| 1 | The rule | One sentence, starting "In this town," | In this town, every lie makes your nose glow. |
| 2 | How it works | 2-4 quick funny examples, one sentence each | Say you love Grandma's soup? Glow. Say your homework ate the dog? Glow. |
| 3 | Small vs big | The rule scales; a legend from the past | Small lies, a little shine. In nineteen eighty, the mayor lit up the whole town. |
| 4 | How the town lives with it | Habits, bans, inventions | So nobody plays poker. And the baker wears sunglasses. |
| 5 | "And me?" | The narrator, the exception or the extreme case | And me? I've never told a lie. My nose is the darkest in town. |
| 6 | My person | A friend, sibling, pet; a detail that pays off later | My best friend Rosa tells ten lies a day. You can read by her nose. |
| 7 | The problem | Something goes wrong | Then the power went out. The whole town, pitch black. |
| 8 | Three tries | Each one bigger, each one fails | The mayor tried candles. The fire chief tried a flashlight. The baker... |
| 9 | The last idea | The thing nobody tried, usually the narrator's | Then I had an idea. |
| 10 | The big moment | The rule at full power | I told the biggest lie of my life: "I love broccoli." |
| 11 | The twist | An unexpected consequence; the town reacts | My nose lit up the whole town. Now they call me every time the power goes out. |
| 12 | The button | A joke, often with "like and subscribe" | Like and subscribe, or I'll tell everyone you love broccoli. |

- 280-330 words: about 2 minutes at 150 words a minute (a short can be up to 3 minutes; under 2:00 is best).
- One paragraph per beat; long beats (2, 8) can be two paragraphs. 12-16 paragraphs in all. Each paragraph is one take.
- Short sentences. Concrete, visual examples: every sentence must be something we can show in 1-3 shots.
- Numbers as words ("nineteen eighty", "one hundred"), so the voice reads them right; `captionMerge` shows them as digits.
- No audio tags like [laughs]; plain punctuation. No "!" pile-ups: the voice reads them shouty.
- A character's own line ("Hi. What am I?") is its own paragraph with `"speaker"` and `"pitch"` (semitones; +4 to +7 for
  small creatures, -3 to -5 for giants). Keep those lines under ten words.
- Write the person's own story: an original rule, original characters, no brands, no famous characters, no real people.

## Rules the kit can show

The effects the engine has decide which rules look good. Good rules turn into one of these on screen:
something **glows** (a nose, a hand, a person), **floats** or **flies**, **grows** or **shrinks**, a **label** or
**speech bubble** appears over someone's head (a number, a word), things **appear** or **vanish** in a puff, **hearts**,
**sparkles**, **smoke**, **fire**, **music notes**, **Z's**, or people change size, place, face or pose.

Ideas that work: every lie makes your nose glow; you shrink a little every time you complain; whatever you say out loud
floats over your head for a day; you float when you're happy; everyone has a counter of words left for the day;
the last person to laugh freezes in place. Ideas that don't: a shadow with its own life (shadows can't be animated
apart from their owner), turning to stone (no material change on people).

Things the kit has no pieces for: water, weather (rain, snow), vehicles other than one car and a bike, animals other
than dogs, buildings other than the town's, crowds over 12, food other than cake, bread and apples. Rewrite the beat, or
build the piece in `assets/lib/custom.js` (slower, see `custom.md`).

## story.json

```json
{
  "title": "In This Town, Every Lie Makes Your Nose Glow",
  "rule": "In this town, every lie makes your nose glow.",
  "voice": "(optional) ElevenLabs voice id, else env ELEVENLABS_VOICE_ID",
  "cast": {
    "me": {"preset": "me"},
    "rosa": {"build": "kid", "shirt": "#ff6fae", "front": "dress", "pants": "#ff6fae", "skin": "#8d5a3b", "hair": "pony", "hairColor": "#1f130c", "faceStyle": {"blush": 1}},
    "mayor": {"preset": "mayor"},
    "biscuit": {"kind": "dog", "coat": "#e0b04a"}
  },
  "captionMerge": [["nineteen eighty", "1980"]],
  "paragraphs": [
    {"text": "In this town, every lie makes your nose glow.", "mood": "playful"},
    {"text": "Say you love Grandma's soup? Glow.", "mood": "playful"},
    {"text": "Hi. What am I?", "speaker": "potato", "pitch": 5, "mood": "hush", "pause": 0.4}
  ]
}
```

- `cast`: the roles used in shots.json. A role is a preset (`world.md` lists them) or your own character (all fields in
  `world.md`). Give the narrator ("me") and their person distinct colours; give each grown-up a clear job look (hat,
  apron, suit). Several roles can't share one preset.
- `paragraphs[].mood` picks the music under it: playful, light, sneaky, trouble, night, wonder, chaos, hush, love,
  flashback, ending. Same mood on neighbouring paragraphs makes one long section; the last paragraph is "ending".
- `pause`: seconds of silence before this paragraph (default 0.3). A beat change likes 0.5-0.8.
- `tail`: seconds of picture after the last word (default 1.2).
