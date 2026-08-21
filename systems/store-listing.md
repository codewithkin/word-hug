# Play Store listing copy

Paste-ready. Character counts verified against Play's limits.

Written to Play's [metadata policy](https://play.google.com/about/storelisting-promotional/metadata):
no "free", no "#1", no "best", no emoji, no ALL CAPS, no fake urgency, no
references to ratings or rankings. Those get a listing rejected and they are
the reflexive things to write.

---

## App name — 30 char limit

**Recommended (26):**

```
Word Hug: Cozy Word Puzzle
```

**Or, plain (8):**

```
Word Hug
```

The longer one is worth taking. Play searches the app name heavily, and "word
puzzle" is what someone actually types. "Cozy" is the differentiator and is
descriptive rather than promotional, so it is policy-safe.

---

## Short description — 80 char limit

**Recommended (76):**

```
Three clues, one word that hugs them all. A cozy puzzle with no way to lose.
```

**Alternative (75), if you want the mechanic to lead:**

```
Find the word that joins all three clues. Cozy, unhurried, no timer at all.
```

This is the line shown before anyone taps "read more", so it does most of the
work. It states the mechanic and the promise in one breath.

---

## Full description — 4000 char limit

Deliberately about 1,600. A wall of keywords reads as spam to a person and is
not rewarded by Play.

```
SNOW. Three clues: ball, flake, man.

Snowball. Snowflake. Snowman.

That is the whole game. Three words, and one word that hugs all three. Find it,
and the next one is waiting whenever you want it.

A NEW PUZZLE EVERY DAY
A fresh daily puzzle arrives each morning, and it never costs anything. Solve it
before the kettle boils, or three days later — nothing expires and nothing is
missed.

FIFTY LEVELS TO WORK THROUGH
The levels start gently and climb. Level one is birdcage, birdsong, birdbath.
By level fifty you will be somewhere quite different. Play them at whatever pace
suits you.

NO TIMER. NO SCORE. NO WAY TO LOSE.
There is no clock counting down, no lives to run out of, and no fail screen. A
wrong guess costs you nothing but the guess. Miss a day and your streak simply
starts again — that is all that happens.

HELP THAT IS ACTUALLY HELPFUL
Every puzzle tells you what kind of word you are looking for, for nothing. Get a
letter in the right place and the tile turns teal. If you are properly stuck,
hints will give you the first letter or the whole answer.

FIVE PACKS WHEN YOU WANT MORE
Kitchen Table, Out of Doors, Creatures, The Workshop and Nightfall — fifty
puzzles each, on their own themes, in their own colours. Optional, one-off
purchases. Nothing is a subscription.

MADE TO BE PUT DOWN
Word Hug does not want your whole evening. There are no daily quests, no
leaderboards, no notifications begging you to come back, and nothing that gets
worse while you are away. One gentle reminder a day, at a time you choose, and
only if you ask for it.

Plays entirely offline. No account, no sign-up, and nothing about you leaves
your phone.
```

---

## Assets you already have

| Slot | File | Status |
|---|---|---|
| App icon, 512×512 | `Word Hug Expo Assets-selection (1).png` | ✅ |
| Feature graphic, 1024×500 | `Cropped - Word Hug Expo Assets-selection.png` | ✅ |
| Screenshots, 1080×1920 | `01-three-words` … `05-five-packs` | ✅ 5 of 8 |

Five screenshots clears Play's promotion threshold (4 minimum, 3 at 16:9 or
9:16, at least 1080px). `systems/art-direction.md` §11.2 lists a sixth —
Stats — if you want it.

Suggested order, so the story reads left to right: **01 three-words → 02
that's-the-one → 03 every-day → 04 hints → 05 five-packs.**

---

## The rest of the form

- **App category:** Games → Word
- **Tags:** Word, Puzzle, Casual, Single player, Offline
- **Contains ads:** **No** — until ads actually ship, at which point this and
  the privacy policy change together
- **In-app purchases:** **Yes** — £0.99–£7.99
- **Privacy policy:** `https://wordhug.gamesforstrangers.lol/privacy`
- **Support email:** the address in `apps/web/src/lib/site.ts`
- **Target audience:** all ages. There is no chat, no user content and no
  social feature, but there *are* purchases — declare them
- **Data safety:** collects no data, shares no data. Purchases are payment
  processing by Google and RevenueCat, not collection

---

## What to change when ads ship

Three things, together, **before** submitting an ad-enabled build:

1. **Contains ads → Yes** on the store listing
2. **Data safety** — an ad SDK collects an advertising ID
3. The privacy policy at `apps/web/src/app/privacy/page.tsx`

And the full description's "no notifications begging you to come back" line
should be re-read honestly at that point. It is true today.
