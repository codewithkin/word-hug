# What Word Hug is

Rarely changes. If this file and a plan file disagree, this file is probably right and the
plan is stale.

---

## The product

A warm, stress-relieving word puzzle game for iOS and Android. Three words are shown; the
player finds the single word that pairs with all three to form compound words.

```
FIRE  →  fire + wood
WORK  →  wood + work
LAND  →  wood + land

Answer: WOOD
```

**Tagline:** "The cozy word game that wraps you in a hug."

**Audience:** Moms, and anyone wanting a gentle mental break in a short pocket of downtime.

**Positioning:** the anti-Wordle. No timer, no score, no leaderboard, no shame.

---

## The five rules

1. **Never punish.** No timers, no penalties, no failure states. A wrong guess gets a gentle
   nudge — no red, no shake, no sound, no attempt counter.
2. **Never gate daily play.** The daily puzzle is free, always, forever.
3. **Never interrupt the solve.** No ads, no upsells, no prices on any puzzle screen, in
   onboarding, or on the solve celebration.
4. **Works offline.** The core loop never requires a network connection.
5. **Anonymous by default.** No accounts, no analytics, no telemetry beyond install counts.

---

## Shape of v1

| | |
|---|---|
| Platform | Expo (React Native), portrait phone only, iOS + Android |
| Styling | uniwind + heroui-native + tailwind-variants |
| Purchases | RevenueCat — one-time packs and a bundle. No subscription in v1. |
| Storage | MMKV, local only. No backend, no server, no sync. |
| Language | **English only.** Spanish deferred to v2 — the mechanic does not translate. |
| Screens | 18 screens + 8 overlays. See `plans/03-screens.md`. |
| Content | ~750 machine-generated, machine-validated puzzles. Bank is currently empty. |

**Deliberately not in v1:** Hug Club subscription, Spanish, analytics, cloud sync,
leaderboards, social sharing, tablet layouts.

---

## Why the mechanic is expensive, and why that is accepted

The puzzles cannot be translated — `thunderstorm` is one English word; the Spanish
equivalent is two words with no shared element. And they cannot be trusted from an AI
without checking: `thunderstrike` **is** in the dictionary, marked "now rare", so an
existence check accepts it. Only word frequency rejects it (0.000000 vs `thunderstorm`'s
0.821 per million).

That is why `scripts/puzzle-check.mjs` exists and why no puzzle ships without passing it.
The spec's own flagship example — `FIRE / STORM / STRIKE → THUNDER` — fails validation on
two of its three compounds.

---

## Where the reasoning lives

| Question | File |
|---|---|
| What are we building, precisely? | `plans/01-prd.md` |
| What does each screen do? | `plans/03-screens.md` |
| What is wrong with the original spec? | `plans/00-spec-critique.md` |
| Why was X cut? | `plans/99-backlog.md` |
| How does the content pipeline work? | `systems/content-pipeline.md` |
| Why is the code like this? | `systems/09-decisions.md` |
| What happened last session? | `progress/04-changelog.md` |

---

## The test

> **A tired parent has four minutes before someone needs them again.
> Does what you just built make that four minutes better, or does it ask something of them?**

If it asks something — a decision, a purchase, a streak to protect, a countdown — it is
wrong, however good it looks.
