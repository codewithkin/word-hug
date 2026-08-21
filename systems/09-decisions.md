# Decision log

Numbered, immutable, cited by number in code. When a decision is superseded,
add a new one and mark the old **SUPERSEDED BY D-0xx** — never edit or delete.

A comment saying `// D-004` is worth ten saying `// careful here`.

---

## D-001 — The device bezel is not a UI colour

**Session 1.**

`#20160C` appears on all 84 extracted screens and `rgba(58,42,24,0.28)` on most.
Both look like strong candidates for a token — `#20160C` is the single most
frequent background in the dark set.

Neither is app UI. They are the **device mockup** in the design export: a
414px-wide rounded frame with a drop shadow, wrapping the real 390×844 screen.

```html
<div style="width:414px;padding:12px;background:#20160C;border-radius:58px;
            box-shadow:0 24px 60px rgba(58,42,24,0.28)">
  <div data-screen-label="09 Daily Puzzle · light" style="width:390px;height:844px;...">
```

**Rule:** never tokenise a value that comes from outside the 390×844 frame.
Enforced by `packages/tokens/test/design-parity.mjs`.

---

## D-002 — Word Hug has no error colour

**Session 1.** Derived from PRD §1.1 principle 1 and §2.4.

A wrong guess produces no red, no shake, no sound, and no attempt counter. The
feedback line uses ordinary body text styling. There is therefore **no error,
danger, destructive, or invalid colour anywhere in the system** — not defined,
not imported, not available to be reached for under deadline pressure.

`#FF6B4A` (coral) exists and is *not* an error colour. It is warmth and emphasis.
It is named `highlight` specifically so nobody reaches for it as "the red one".

**Rule:** the parity test fails if any token key matches
`/error|danger|destructive|invalid/i`. This is deliberately a rule about names,
not values, so it survives a repalette.

---

## D-003 — Every font weight must be a loaded face

**Session 1.**

The designs use Baloo 2 and Nunito at weights 700, 800, and 900. Custom font
families **do not synthesise weights** on iOS or Android — asking for 900 when
only 700 is loaded renders 700 silently, with no warning and no crash.

The export bundles nine woff2 faces, which is the real weight inventory.

**Rule:** every weight used in code must correspond to a loaded face. Prefer
encoding the choice so it cannot be got wrong (a `weight` map, not raw numbers).
Verify on a device, not in a web preview — web *will* synthesise and hide the bug.

---

## D-004 — The elevation is a hard offset, not a blur

**Session 1.**

Cards and buttons use `0 5px 0 <solid colour>` — vertical offset, **zero blur**.
This is what makes the interface feel chunky and tactile rather than flat and
generic. It is the single most characterful property in the visual language.

A soft blurred shadow is the reflexive choice and would quietly change the whole
product's character while looking "fine" in isolation.

**Rule:** `elevation.blur` is 0 and the parity test asserts it. Pressed states
reduce the offset (5px → 2px) rather than adding blur.

---

## D-005 — Tokens are rank 3; the design files are rank 1

**Session 1.** Restating the process rule as a project decision because it was
nearly violated in the first hour of building tokens.

`packages/tokens` exists for values many screens share. It is **allowed to be
incomplete**. The designs are not.

The concrete case: `dark.onPrimary` was written as `#4A3000` by copying the light
value, on the reasonable assumption that identical amber buttons carry identical
text. They do not — dark uses `#3B2400`. The parity test caught it on its first
run, before any screen consumed the wrong value.

**Rule:** build every screen from `designs/extracted/<screen>.html`, both themes.
Never from this token file.

---

## D-006 — There is no failure state, and hearts are not coming back

**Session 8.** The hearts/energy system was built in session 7 at the owner's
request and removed entirely in session 8, also at the owner's request.

Deleted, not flagged off: `lib/lives.ts`, `components/hearts-meter.tsx`, the
balance, the regen timestamp, the 2-coin refill and every call site. A disabled
feature flag is a feature you still have to reason about every time you read
the file next to it.

The reasoning is commercial as much as philosophical, which is why it is
written down rather than left as taste. **An energy meter exists to end the
session.** The plan is ad-supported, and ad inventory is a function of time in
the app, so hearts were spending the revenue they were meant to protect. Rule 1
("never punish") came back as a side effect.

`LevelResult.heartsLost` became `wrongGuesses` — the same signal, counted and
never charged, because the difficulty model needs it.

Guarded by four checks in `scripts/daily-loop-check.mjs` under *rule 1*. They
assert the absence, because "just a small attempt cap" is exactly the kind of
thing that comes back in six months.

---

## D-007 — Difficulty is solvability, not word frequency

**Session 8.** The first difficulty model scored corpus frequency: common
answer plus common clues meant easy. It rated `book`, `time`, `line`, `side`
and `back` as the easiest puzzles in the bank and put `book` at level 1, which
the owner could not solve.

Frequency is not merely a weak signal for the answer slot. It is partly
**inverted**. `time` is one of the hundred commonest nouns in English and one
of the worst possible answers: abstract, in scores of compounds, and knowing
`___table`, `some___` and `life___` does not make you picture anything.

`scripts/difficulty.mjs` scores what actually makes a Missing-Link puzzle hard,
in rough order of weight: slot-position mixing, household-compound familiarity,
semantic opacity (a honeymoon is not a moon), answer concreteness, function-word
clues, hub-word promiscuity, then shape.

Two structural consequences:

- The score is **continuous**. The old 1–5 integer put 18 of the 50 free levels
  in a single tie broken **alphabetically**, which is the actual reason `ball`,
  `book` and `cake` opened the run.
- The first ten levels are a **strict staircase** with no zigzag, and
  `assertOnRamp` in `build-levels.mjs` throws rather than warns if any of them
  fails a content gate. Every other content problem degrades a level; this one
  decides whether a first-time player reaches level 2.

The authored word lists are a proxy and are honest about it. `pnpm levels:corpus`
replaces them with measured Datamuse frequencies, cached to a committed JSON so
the build stays offline and deterministic — a build that reorders the bank
because an API was slow rewrites saved progress, since level numbers are storage
keys.

---

## D-008 — Entitlements write ownership; nothing reads it from the network

**Session 8.** `lib/purchases.ts` is the only file that talks to
`react-native-purchases`. When RevenueCat answers, its entitlements are folded
into `packs.owned` in MMKV; the game reads MMKV synchronously during render,
exactly like every other piece of state.

A pack screen that awaited `getCustomerInfo()` before deciding whether to show
a board would be blank on a train, and would tell someone who paid that they
had not.

The direction matters: entitlements may **grant** and never **revoke**. An
empty entitlement set is far more likely to mean "offline" or "anonymous id
rotated" than "refunded", and deleting someone's packs on that evidence is
unforgivable. Refunds are rare enough to handle by hand.

Coins are the exception and are deliberately **local**. RevenueCat can hold a
balance but cannot spend one from the app — deducting virtual currency needs a
secret key and a backend, and this app has neither by design. A grant ledger
mirrored into MMKV would have been two sources of truth for one number, where
the second could not do the thing the number is for. The accepted risk is
written at `COIN_GRANTS`: if the process dies between the store confirming and
the app crediting, the money is taken and the coins are not granted.

---

## D-009 — Free help is printed, not sold

**Session 8b.** The hint ladder's first rung was "what kind of word it is",
free, forever. Almost nobody would have taken it: it sat behind a `?` button
next to a coin balance, and that reads as "this will charge you" no matter what
the sheet says when you open it. The owner played the early levels and found
them very hard without ever tapping it.

**A free hint nobody taps is not a free hint. It is a free hint you have
hidden.** The category is now printed on the board for every puzzle in every
bank, and the ladder no longer sells it.

Tier numbering was deliberately **not** renumbered. `nudges` in MMKV stores
these integers against puzzle ids, and shifting them would silently
re-interpret every hint a player has already taken. `NUDGE_RUNGS` starts at
tier 2 and `nextRung` finds the next tier above the current one rather than
adding one.

Correct-position letters also turn teal after a wrong guess. That is feedback
about the guess just made, not a hint about the answer — but it is strong, and
the owner chose it ungated against a recommendation to gate it behind two wrong
guesses. With six keys and a four-letter answer it makes most levels
brute-forceable in about three tries. Reversing it is one line in each hook.
