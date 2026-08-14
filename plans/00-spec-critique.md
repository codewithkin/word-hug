# Word Hug — Spec Critique

Status: living document. Last updated 2026-08-10.

A pressure-test of the product reference doc. Each item is rated:

- 🔴 **Blocker** — must be resolved before building
- 🟠 **Risk** — will hurt if ignored, but not blocking
- 🟡 **Gap** — spec is silent, needs a decision
- 🔵 **Note** — observation, no action required yet

---

## 1. The spec contradicts the repo

🔴 **The spec describes routes as `app/(game)/daily`. The actual repo is a Turborepo monorepo with `apps/native/` and `apps/web/`.**

Current reality (`apps/native`):

- Expo SDK 57, Expo Router 57, React Native 0.86, React 19.2
- Styling is **uniwind** (Tailwind for RN) + **heroui-native** + tailwind-variants
- Existing routes are Better-T-Stack boilerplate: `(drawer)/(tabs)/index`, `two`, `modal`
- There is an `apps/web` app and `packages/env`, `packages/config`

None of the spec's dependencies are installed yet: no `react-i18next`, no `react-native-mmkv`, no `react-native-purchases`, no `expo-notifications`, no `expo-updates`.

**Decisions taken:**

1. ✅ **`apps/web` stays** — it is the marketing site and, importantly, the **compliance host**. Apple and Google both require publicly reachable Privacy Policy and Terms of Service URLs for a paid app. The web app owns those pages. It does not host game content or a backend.
2. ⏳ Boilerplate drawer/tabs navigation in `apps/native` gets deleted — the 13-route structure replaces it.
3. ✅ **`packages/content`** holds the puzzle bank, shared and validated independently. See `systems/content-pipeline.md`.

**Compliance requirements now owned by `apps/web`:**

| Page | Required by | Notes |
|---|---|---|
| `/privacy` | App Store, Play Store, GDPR | Must be live before first submission |
| `/terms` | App Store (required for auto-renewing subscriptions) | Needed even though Hug Club is deferred — add before Club ships |
| `/support` | App Store requires a support URL | Can be an email link |
| `/` | Marketing | Store badges, screenshots, the pitch |

The native app links to these URLs from Settings. They must be stable, permanent URLs — App Store review will re-check them.

---

## 2. The Spanish problem is not solved by i18n

✅ **Resolved: Spanish is deferred to v2.** v1 ships English only, with the full i18n layer built and one locale in it. Details and v2 cost breakdown in `99-backlog.md`.

The analysis below is retained because it explains *why*, and because whoever picks up v2 needs it.

The spec treats localisation as a solved problem: "Adding a language: Drop in a new JSON file — no code changes." That is true for UI strings. It is **false for the game itself**.

The core mechanic is English compound-word formation:

```
FIRE / STORM / STRIKE  →  THUNDER
```

`thunderstorm` is one word in English. In Spanish it is *tormenta eléctrica* — two words, adjective after noun, no shared prefix. The mechanic does not survive translation. Neither does it survive machine translation of the answer word: translating THUNDER to TRUENO produces `truenofuego`, `truenotormenta`, `truenogolpe` — none of which are words.

**This means:**

- `es.json` can translate every button, every celebration message, every shop description
- It **cannot** translate a single puzzle
- A Spanish-speaking user who switches language gets a fully Spanish app that presents English word puzzles they cannot solve

**Three honest options:**

| Option | Cost | Result |
|---|---|---|
| **A. Ship English-only at launch**, keep i18n architecture in place | Lowest | Honest. Spanish added when content exists. |
| **B. Native Spanish puzzle set** — Spanish compounds and collocations (*sacacorchos*, *paraguas*, *cumpleaños*), authored by a Spanish speaker | High — a second full content pipeline | Correct, but doubles authoring forever |
| **C. Change the mechanic for Spanish** to something that does translate — e.g. semantic association ("what connects *sol*, *arena*, *ola*?" → *playa*) | Medium | Two games in one app, harder to keep tonally consistent |

**Decided: A now, B in v2.** Build the i18n layer properly from day one (it costs little), ship English puzzles, and treat Spanish content as a separate funded project. Do **not** ship a Spanish UI wrapped around English puzzles — it reads as broken.

**Consequence, applied:** the language step is removed from onboarding entirely, and the Settings language control is hidden while only one locale exists.

**Note for v2:** Datamuse's `rel_bga`/`rel_bgb` bigram relations — the backbone of the English uniqueness check — are **English-only**. A Spanish bank needs a different validation approach, not just a different word list. Validate the mechanic on 20 hand-written Spanish puzzles before committing to a bank.

---

## 3. Content supply is the real product risk

✅ **Decided: puzzles are AI-authored (by Claude), then machine-validated, then spot-reviewed by Lucky.**

This is workable and removes the biggest schedule risk in the project — but it changes the shape of the risk rather than eliminating it. Honest assessment:

**What AI authoring does well here:** volume, structural consistency, hitting a difficulty target, staying on a theme, generating hundreds of candidates cheaply.

**What it does badly, and why the validator is non-negotiable:**

- **Confident invention.** An LLM will produce `thunderstrike` and assert it is a word. The original spec's own example has this bug. Only a lexicon check catches it.
- **Multiple valid answers.** The generator does not reliably notice that a second word also fits all three clues. Only an exhaustive uniqueness search catches it.
- **Difficulty is self-reported and unreliable.** An LLM's "difficulty 2" is a guess. Word frequency is a better proxy and should override the self-rating.
- **Repetition at scale.** Across 750 puzzles the same answers and structures recur far more than a human author would allow. Needs a global duplicate check.

**Therefore the pipeline is generate → validate → sample-review, never generate → ship.** The validator described in `systems/content-pipeline.md` §4 is now the single most important piece of tooling in the project. **It should be built before any puzzles are generated.**

**Suggested production run:** generate in batches of ~100, validate, keep the survivors, review a random 10% by hand. Expect a rejection rate of 30–50% on early batches until the prompt is tuned. Budget for generating roughly 1,500 candidates to land 750 good puzzles.

🟠 Remaining risk: the spec asks for a lot of content and never said how much.

Rough demand:

| Need | Count |
|---|---|
| Onboarding tutorial | 1–2 |
| Daily puzzles, year one | 365 |
| Daily puzzles, buffer before running dry | +180 |
| 5 Hug Packs × 30 | 150 |
| Hug Club weekly exclusive, year one | 52 |
| **Total for a comfortable year one** | **~750** |

Good Missing Link puzzles are hard to write. The failure modes are specific:

- **Multiple valid answers.** FIRE / HOUSE / BOAT accepts both *light* and *work*ish stretches. Every puzzle needs a uniqueness check.
- **Obscure compounds.** *Thunderstrike* is arguably not a word. This one is in the spec's own example.
- **Regional variance.** *Carpark* vs *parking lot*, *torch* vs *flashlight*.
- **Difficulty drift.** No difficulty rating is specified anywhere, so the daily stream will feel random.

🟡 **Gap: no difficulty model.** The spec has no notion of puzzle difficulty. For a daily-ritual product this matters — Monday should not be brutal. Resolved: 1–5 rating on every puzzle, derived from word frequency rather than the generator's self-rating, with a curated weekly curve (PRD §3.2).

✅ **Answer input decided: free text, forgiving.** Case-insensitive, whitespace and accent normalised, declared plural variants accepted, no auto-correct. A one-character miss gets a "so close" nudge rather than a solve. Full rules in PRD §2.2.

---

## 4. Daily puzzle mechanics are underspecified

Decided: **bundled content + OTA updates.** That resolves the supply question but leaves mechanics open.

✅ **Timezone decided: device-local midnight.** Warmer, and consistent with the morning-coffee ritual. Accepted cost: a user crossing timezones may see a date boundary shift; the high-water guard caps the damage at one extra puzzle.

🟡 **Clock tampering.** With no backend, a user can set their device clock forward and burn through the entire bundled daily bank in an afternoon. For a non-competitive game this is mostly harmless — but it interacts badly with the "7 days free archive" paywall and with streaks. Minimum viable defence: store a high-water mark of the furthest date ever seen, and never let the daily advance more than one day per real-elapsed-day.

🟡 **Running dry.** OTA updates solve this only if the user is online. Define the behaviour when a user is offline and past the end of the bundled bank. (Recommendation: graceful fallback into a curated evergreen loop with a gentle "you've caught up!" message, never a blank screen.)

🔵 The spec says "no backend, no CDN," then the OTA decision reintroduces a content endpoint. That's fine — but the doc should stop claiming "no content delivery network needed."

---

## 5. Streaks were not in the spec and cut against the tone

Decided: **full streaks + stats, implemented quietly** — no red, no modals, silent weekly rest day, stats on their own screen, no loss-framed notifications. Specified in `systems/streaks-progress.md`.

🟠 The tension is real and worth restating: the spec's stated design principles are *"No timers, no penalties, no score pressure"* and *"Not competitive. Not punishing."* A streak counter is a penalty mechanic — its entire motivational force comes from the fear of losing it. Duolingo's streak is effective precisely because it is stressful.

Full streaks are still buildable without betraying the brand, but the framing has to be deliberate:

- Break the streak **quietly**. No red, no shattered-glass animation, no "You lost your 47-day streak!" modal.
- Consider **grace days** (miss one, keep the streak) or a free weekly "rest day."
- Never send a notification whose emotional content is *guilt*. "Your streak ends in 2 hours" is off-brand. "Today's puzzle is waiting" is on-brand.
- Put stats in a place the user chooses to visit (archive/profile), not on the puzzle screen where they'd add pressure to a moment meant to be calm.

🟡 **Gap: streaks need a home.** The spec has 13 routes and none of them is a profile or stats screen. Full stats implies a 14th route, or stats live inside the archive screen.

🟡 **Gap: what counts as a streak day?** Daily puzzle only, or does any puzzle count (pack puzzles, archive replays)? If archive replays count, a paying Hug Club user can trivially repair a broken streak — which may be fine, or may be a bug.

---

## 6. Monetisation holes

🔴 **Nudge Coins are a consumable with no ledger.** The spec's "What's Stored Locally" table does not include the coin balance. RevenueCat tracks *purchases*, not *spend* — spending 3 coins is a local operation. This needs:

- A local balance in MMKV
- Rules for what happens on reinstall (balance is gone — RevenueCat can restore the *purchase* of 50 coins but has no idea you spent 12 of them)
- A rule preventing negative balances and double-spend on rapid taps

✅ **Decided: coins are restored in full on reinstall**, ignoring prior spend, keyed on store transaction id so a repeated restore cannot double-credit.

🟠 **The Hug Bundle cannibalises everything.** 5 packs at $1.99 = $9.95. The bundle is $6.99, and $4.99 as a welcome offer. Nobody rational buys a single pack. That's a fine strategy, but it means individual packs exist only as a price anchor — so don't invest in merchandising them.

✅ **Decided: the welcome offer moves out of onboarding to the user's second visit**, held open for 48 hours. Asking for money 60 seconds in converts badly and reads as grabby against the "digital hug" positioning.

✅ **Decided: Hug Club does not launch in v1.** Its only real driver is full archive access, and at launch the archive is nearly empty — the subscription would be worth almost nothing on day one. It ships once there are 90+ days of accumulated archive, or alongside a back-dated seeded archive.

**Consequence:** v1 revenue is the Bundle, individual packs, and Nudge Coins only. LTV per paying user is effectively capped around $7. Model the business on that before spending on acquisition.

🟡 **Gap: pricing is USD-only.** RevenueCat handles regional pricing, but the spec's welcome-offer maths ($6.99 → $4.99) needs a defined discount *tier*, not a hardcoded price.

---

## 7. Missing screens and states

🟡 The 19-screen count omits several things the app cannot ship without:

- **Solved state / celebration.** The spec mentions "celebration on Step 2" but never defines the post-solve screen. What does the player see and do after solving today's puzzle? This is the most emotionally important moment in the product and it isn't specified.
- **Nudge Coin purchase prompt** when the balance is zero and the user taps a hint.
- **Paywall / upsell interstitial** when a free user taps an archive puzzle older than 7 days.
- **Offline state** for the OTA content fetch.
- **Restore-purchases result** (success/failure feedback).
- **Stats/profile** (see §5).

🟡 **No empty states specified** for the pack list before any purchase, or the archive on day one.

---

## 8. Smaller items

🟡 **Notification content is undefined.** Expo Notifications, local only — but what does it say, when does it fire, and can the user set the time? "One puzzle every morning with your coffee" implies a user-chosen morning time, which is not in Settings.

🟡 **Settings lacks a terms-of-service link and a support link.** Both stores require them. Resolved by `apps/web` hosting `/privacy`, `/terms`, and `/support` (§1). A "delete my data" affordance is trivially satisfiable — there is no server and no account, so the honest answer is "uninstalling deletes everything," which should be stated plainly in the privacy policy.

🟡 **Accessibility is absent from the spec.** A word game is text-heavy and the target audience skews older-than-teen. Dynamic Type support, VoiceOver labels for the puzzle words, and a minimum contrast pass should be requirements, not afterthoughts.

✅ **Decided: no analytics beyond Expo Insights (installs) and the store consoles.** No third-party SDK, no server, no event tracking. User understanding comes from talking to users directly.

This is a legitimate and increasingly defensible choice — it makes the privacy policy short and true, removes a whole class of consent and GDPR work, and is a real differentiator for a product positioned on warmth. Two consequences to plan around rather than discover:

- **Puzzle difficulty can never be corrected by data.** Nobody will report "Thursday's puzzle was too hard" — they will just quietly stop. The only defence is that the difficulty rating is derived from word frequency (objective) rather than guessed, and that a human samples each batch. This raises the stakes on the content validator considerably.
- **Onboarding and offer conversion are invisible.** You will see installs from Expo Insights and purchases from App Store Connect / Play Console, so you get a crude top-of-funnel and bottom-of-funnel number. Everything between is dark. Accept that A/B testing the onboarding is off the table and design it right the first time.

**Cheap mitigations that don't violate the stance:** a "was this puzzle too hard?" tap on the solve screen that writes to local storage only and is never transmitted is *not* useful (you'd never see it). Better: a plainly-labelled "tell us what you think" mail link in Settings, and recruiting 10–20 real users for direct conversation before launch. Put that recruiting on the schedule now — it is the entire feedback loop.

**Verify before submission:** confirm Expo Insights' current data collection against Apple's Privacy Nutrition Label requirements. Even install-level telemetry must be declared accurately.

🔵 **`app/+loading.tsx` and `app/+error.tsx`** — verify these are real Expo Router 57 conventions before designing around them. `+not-found.tsx` is standard; the other two need confirmation against the installed SDK.

🔵 **"19 screens" vs "13 routes"** is fine (onboarding is 7 screens in 1 route), but the count will drift as §7 items are added. Don't put screen counts in a spec.

---

## Decision log

| # | Decision | Resolution | Status |
|---|---|---|---|
| 1 | Spanish at launch? | No — deferred to v2. English only in v1. | ✅ Decided |
| 2 | Keep `apps/web`? | Yes — marketing site + privacy/terms/support hosting for store compliance | ✅ Decided |
| 3 | Who authors ~750 puzzles? | AI-generated, machine-validated, human spot-reviewed | ✅ Decided |
| 4 | Daily rollover | Device-local midnight, with high-water-mark guard | ✅ Decided |
| 5 | Coins restored on reinstall? | Yes, in full, keyed on transaction id | ✅ Decided |
| 6 | Welcome offer timing | Second visit, 48-hour window — removed from onboarding | ✅ Decided |
| 7 | Hug Club in v1? | No — ships once the archive has value | ✅ Decided |
| 8 | Answer input | Free text, forgiving normalisation, no auto-correct | ✅ Decided |
| 9 | Analytics | None beyond Expo Insights installs; direct user conversations instead | ✅ Decided |
| 10 | Streaks | Full streaks + stats, quiet implementation | ✅ Decided |

### New decisions raised by the above

| # | Decision | Recommendation | Status |
|---|---|---|---|
| 11 | Which lexicon + frequency corpus for the validator? | WordNet (existence) + Datamuse (uniqueness) + wordfreq (difficulty). Full analysis in `02-lexicon-options.md`. | 🟠 Awaiting sign-off |
| 12 | Onboarding theme-preference step | Cut — nothing left to personalise once the offer moved out and Club was deferred | ✅ Decided |
| 13 | Who recruits the 10–20 launch users for direct feedback, and when? | Lucky — put it on the schedule now, it is the entire feedback loop | 🟠 **Open** |
| 14 | Is Python acceptable in the monorepo for the lexicon step? | Recommend yes — emits JSON for the TS validator. Pure-TS path exists but costs more. | 🟡 Open |
