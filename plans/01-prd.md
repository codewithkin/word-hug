# Word Hug — Product Requirements Document

**Version:** 0.2
**Date:** 2026-08-10
**Status:** Draft — all v1 product decisions resolved. One technical decision (lexicon) awaiting sign-off, see `02-lexicon-options.md`.
**Owner:** Lucky

---

## 1. Product summary

Word Hug is a warm, stress-relieving word puzzle game for mobile. Each puzzle presents three words; the player finds the one word that connects all three by forming a compound word or common phrase with each.

**Tagline:** "The cozy word game that wraps you in a hug."

**Audience:** Moms and anyone seeking a gentle mental break in short pockets of downtime.

**Positioning:** The anti-Wordle. No timer, no score, no leaderboard, no shame. Playable in 30 seconds or 30 minutes.

### 1.1 Product principles

These are binding. A feature that violates one needs an explicit exception recorded here.

1. **Never punish.** No timers, no penalties, no failure states. Wrong guesses get a gentle nudge.
2. **Never gate daily play.** The daily puzzle is always free, always available, forever.
3. **Never interrupt the solve.** No ads, no upsells, no modals during or immediately after solving.
4. **Calm over conversion.** Monetisation surfaces are small, quiet, and easy to ignore.
5. **Works offline.** The core loop must never require a network connection.
6. **Anonymous by default.** No accounts, no email, no cloud sync, no analytics.

### 1.2 Non-goals for v1

- Multiplayer, social sharing, friend leaderboards
- User accounts or cross-device sync
- User-generated puzzles
- Hug Club subscription (deferred to v2 — §5.4)
- Spanish, or any locale other than English (deferred to v2 — §7)
- Third-party analytics of any kind (§10)
- Android tablet / iPad optimised layouts (portrait phone only)

### 1.3 Repo scope

Both apps in the monorepo are in scope, with different jobs:

| App | Job |
|---|---|
| `apps/native` | The game. Expo, portrait phone, offline-capable. |
| `apps/web` | Marketing site **and compliance host** — `/privacy`, `/terms`, `/support`. Required by both stores. No game content, no backend. |

---

## 2. Core gameplay

### 2.1 The Missing Link mechanic

Three words are displayed. The player enters a single word that combines with each of them — before or after — to form a common **compound word**.

> Narrowed from the original spec's "compound word or phrase." Free phrases (`hunger strike`) make puzzles vaguer and multiply the chance a second answer fits, which is the expensive failure for a product promising no frustration. Spelling variants of a real compound still count and are merged (`airstrike` / `air strike`). See `02-lexicon-options.md` §7.

```
FIRE            →  fire + wood
WORK            →  wood + work
LAND            →  wood + land

Answer: WOOD
```

Each of the three source words carries a **position** relative to the answer (`before` or `after`), which the content pipeline records but the UI does not reveal.

### 2.2 Answer validation

| Rule | Behaviour |
|---|---|
| Case | Insensitive |
| Whitespace | Trimmed, internal whitespace collapsed |
| Accents/diacritics | Normalised (NFD, strip combining marks) |
| Plurals | Accepted if the puzzle declares them as accepted variants |
| Typos | **Not** auto-corrected. A one-character Levenshtein miss triggers a "so close" nudge, not a solve. |
| Alternate answers | Each puzzle may declare additional accepted answers |

**Input is a free-text field**, not a letter picker. Rationale: a letter picker would reveal the answer length, which changes the puzzle's difficulty and removes part of the satisfaction. Free text also keeps the screen calm — a keyboard and one input, nothing else.

**Requirement:** every puzzle in the bank has exactly one *canonical* answer and an explicit list of accepted variants. Validation never guesses, never auto-corrects, and never silently accepts a near-miss.

### 2.3 The solve moment

The single most important interaction in the product.

**Requirements:**

- Correct answer triggers a warm celebration: gentle animation, soft haptic (if enabled), a short affirming message drawn from a rotating pool
- Celebration must complete in under 2 seconds and be dismissible by tap
- The post-solve state shows: the solved puzzle, the streak (quietly), and one calm next action
- **No monetisation surface appears on the solve screen.** Upsells may appear one screen later at the earliest.

### 2.4 Wrong answers

- No shake, no red, no error sound, no counter of failed attempts
- A soft "not quite — try another" message, styled identically to neutral copy
- Attempts are never counted, displayed, or stored

### 2.5 Nudges (hints)

Three tiers, each costing 1 Nudge Coin, maximum 3 per puzzle:

1. **Category Nudge** — "The missing word is a type of weather."
2. **First Letter Nudge** — "The missing word starts with S."
3. **Solve Nudge** — reveals the answer.

**Requirements:**

- The nudge button is small, low-contrast, and never animated or badged
- Tiers unlock in order — a player cannot buy the Solve Nudge without buying the two before it
- A puzzle solved with a Solve Nudge still counts as solved for streak purposes, and the celebration is identical (no "you cheated" framing)
- Nudges purchased on a puzzle persist if the player leaves and returns to that puzzle

---

## 3. Content system

Detailed design lives in `systems/content-pipeline.md`. Requirements here.

### 3.1 Supply

| Bank | v1 launch minimum | Year-one target |
|---|---|---|
| Onboarding tutorial | 2 | 2 |
| Daily puzzles | 180 | 545 |
| Hug Pack puzzles (5 × 30) | 150 | 150 |
| Hug Club weekly exclusive | 0 (deferred, §5.4) | 52 |

### 3.1.1 Authoring

Puzzles are **AI-generated, machine-validated, and human spot-reviewed.** No puzzle reaches the bank without passing the automated quality gate (§3.3).

Process: generate in batches of ~100 → run the validator → keep survivors → Lucky reviews a random 10%. Expect 30–50% rejection on early batches. Budget ~1,500 candidates to land 750 shipped puzzles.

**The validator must be built before generation begins.** Without it, AI authoring produces plausible-looking puzzles with invented compounds and multiple valid answers, at volume.

### 3.2 Difficulty

Every puzzle carries a difficulty rating of 1–5, **derived from word frequency, not self-reported by the generator.** With no analytics (§10) there is no feedback loop to correct a mis-rated puzzle, so the rating must come from objective data.

The daily stream follows a deliberate weekly curve so that the ritual has rhythm and Monday is never brutal:

| Day | Target difficulty |
|---|---|
| Mon | 1–2 |
| Tue | 2 |
| Wed | 2–3 |
| Thu | 3 |
| Fri | 3–4 |
| Sat | 4 |
| Sun | 2–3 |

### 3.3 Quality gate

No puzzle enters the bank until it passes automated validation:

- All three source words form a real compound/phrase with the canonical answer, verified against a reference lexicon
- No second answer in the lexicon satisfies all three source words (uniqueness check)
- Source words are not themselves obscure (frequency floor)
- Difficulty is set and within the pack's declared range
- Category nudge text and first letter are populated

### 3.4 Delivery

Puzzles are **bundled with the app** and **updatable over the air**.

- The app ships with the full bank baked in — a fresh install with no network is fully playable
- On launch (throttled to once per 24h) the app checks for a content manifest update and merges new puzzles into local storage
- OTA content is additive and versioned; it never removes or rewrites a puzzle the player has already solved
- If the device is offline or the fetch fails, the app silently uses the bundled bank

### 3.5 Running dry

If the player reaches the end of the daily bank:

- The app shows a warm "you've caught up" state, never a blank or error screen
- It falls back to a curated evergreen loop of high-quality repeats, clearly labelled as replays
- This is a monitored condition — the bank must be topped up via OTA long before any user reaches it

---

## 4. Screens and routes

App lives in `apps/native`. Route paths below are relative to `apps/native/app/`.

### 4.1 Root special routes

| Route | Screen | Purpose |
|---|---|---|
| `+loading.tsx` | Loading | Font load, i18next init, MMKV hydrate, RevenueCat configure, first-launch check |
| `+error.tsx` | Error | Unhandled errors — warm message, retry |
| `+not-found.tsx` | Not Found | "This hug doesn't exist" + back to daily |

> Verify `+loading` and `+error` are supported conventions in the installed Expo Router 57 before relying on them.

### 4.2 Onboarding — `onboarding` (5 steps, 1 route)

| Step | Screen | Job | Exit action |
|---|---|---|---|
| 1 | Welcome | Establish warmth and tone | "Let's begin" |
| 2 | Try the Game | AHA moment — a real, solvable tutorial puzzle | Solve it |
| 3 | The Ritual | Sell the daily habit | "Sounds lovely" |
| 4 | Notification Priming | Custom screen before the native prompt (conditional) | Allow / Not now |
| 5 | Drop In | Brief confirmation | Lands on daily puzzle |

**Changes from the original 7-step spec, and why:**

- **Language selection removed.** English-only content at launch; offering a language choice that doesn't change the puzzles is worse than offering none. Language override stays in Settings and appears only when a second content bank exists.
- **Welcome Offer removed entirely from onboarding** and moved to the second visit (§5.6). Asking for $4.99 sixty seconds in converts badly and undercuts the positioning.
- **Personalization (theme multi-select) removed.** Its only purpose was personalising shop recommendations; with the offer gone and Hug Club deferred there is nothing meaningful to personalise at this point. Flagged as reversible if pack merchandising later needs it.

**Requirements:**

- Every step is skippable except Step 2 (the tutorial puzzle) and Step 5
- Progress is persisted per-step so a mid-onboarding kill doesn't restart from zero
- **No monetisation surface appears anywhere in onboarding**
- Total time to daily puzzle for a user who taps through: under 40 seconds

### 4.3 Game routes

| Route | Screen | Purpose |
|---|---|---|
| `(game)/daily` | Daily Puzzle | Today's puzzle. Home. Where 90% of time is spent. |
| `(game)/archive` | Archive | Calendar of past dailies. Last 7 days free; full archive for Hug Club. |
| `(game)/archive/[date]` | Archive Puzzle | Replay a past daily |

### 4.4 Hug Pack routes

| Route | Screen | Purpose |
|---|---|---|
| `(game)/packs` | Pack List | Grid of packs with lock state and progress |
| `(game)/packs/[packId]` | Pack Detail | Puzzle list within a pack |
| `(game)/packs/[packId]/[puzzleIndex]` | Pack Puzzle | A single pack puzzle |

### 4.5 Commerce, settings, info

| Route | Screen | Purpose |
|---|---|---|
| `shop` | Shop | Hug Bundle (hero), individual packs, Nudge Coins. Hug Club deferred (§5.4). Products from RevenueCat; purchase uses RevenueCat's native flow — no custom checkout. |
| `settings` | Settings | Sound, haptics, notification time, restore purchases, privacy policy, terms, support, app version |
| `how-to-play` | How to Play | Tutorial, reachable from "?" on any puzzle screen |
| `stats` | Stats | Streak, puzzles solved, calendar heatmap. **New — required by streaks (§6).** |

### 4.6 Required states not previously specified

Each of these needs a design, not just a route:

- **Solve celebration** (overlay on puzzle screens) — the most important moment in the product, previously unspecified
- **Second-visit welcome offer** — the relocated Hug Bundle discount (§5.6)
- **Zero-coin prompt** — shown when a player taps a nudge with a zero balance; a quiet sheet, not a hard paywall
- **Archive locked state** — shown when a player opens a daily older than 7 days. With Hug Club deferred there is nothing to sell here in v1, so this is an informational "coming soon" state, not a paywall.
- **Offline banner** — non-blocking, for failed content sync
- **Restore purchases result** — success and failure feedback in Settings
- **Caught-up state** — reached the end of the daily bank (§3.5)
- **Empty states** — pack list before any purchase; archive on day one; stats before any solve

---

## 5. Monetisation

Detailed design lives in `systems/monetization.md`. RevenueCat owns all purchases and entitlements. No backend server.

### 5.1 Products

| Product | Type | Contents | Price (USD) |
|---|---|---|---|
| **The Hug Bundle** | Non-consumable | All 5 Hug Packs (150 puzzles) | $6.99 ($4.99 welcome offer) |
| **Hug Pack** ×5 | Non-consumable | 30 themed puzzles | $1.99 each |
| **Nudge Coins** | Consumable | 5 / 15 / 50 coins | $0.99 / $1.99 / $4.99 |
| ~~**Hug Club**~~ | Subscription | *Deferred past v1 — §5.4* | $1.49/mo, $9.99/yr |

Prices are defined as RevenueCat products with regional pricing. The welcome offer is a **discount tier**, not a hardcoded number.

**v1 revenue is one-time purchases only.** LTV per paying user is effectively capped around $7. Model the business on that before committing to paid acquisition.

### 5.2 Hug Pack themes

1. Cozy Kitchen — food, cooking, baking
2. Garden Stroll — nature, flowers, seasons
3. Fireside Read — books, stories, quotes
4. Cup of Comfort — self-care, relaxation
5. Around the World — travel, countries, landmarks

### 5.3 Free drip

- 3 Nudge Coins granted on install
- 1 Nudge Coin granted every Monday
- Last 7 days of the daily archive always free
- The daily puzzle is never gated

### 5.4 Hug Club is deferred

**Decided: Hug Club does not ship in v1.** Its primary value is full archive access, and on day one the archive is empty — the subscription would be worth almost nothing to a launch user, which is both bad value and bad for review sentiment.

It ships when either condition is met:

- 90+ days of accumulated real archive, or
- A back-dated seeded archive exists at launch, giving the subscription day-one value

The entitlement (`hug_club`) and the archive lock logic are still **built** in v1 so the subscription is a configuration change rather than a feature build. Only the product and the storefront entry are withheld.

### 5.5 Reinstall and restore

Purchased packs and the Bundle restore automatically via RevenueCat entitlements.

**Nudge Coins are restored in full**, ignoring prior spend, keyed on store transaction id so repeated restores cannot double-credit. This is deliberately generous: the exploit ceiling is a few dollars, and telling a paying customer their coins are gone is exactly the kind of punishment the product promises not to inflict.

Streak and solve history are **not** recoverable — there is no server. This is the strongest argument for optional cloud backup in v2.

### 5.6 The welcome offer

**Decided: the Hug Bundle discount is not shown during onboarding.** It appears on the user's **second visit** — the first app open on a later calendar day than install.

| Property | Value |
|---|---|
| Trigger | First app open on a calendar day after install day |
| Placement | After the daily puzzle is solved, one screen later — never on the solve screen |
| Window | 48 hours from first display |
| Frequency | Shown once. If dismissed, it does not reappear. |
| Dismissal | Full-size "Maybe later" button, equal weight to the accept button. No small ×. |

### 5.7 What we never do

- No ads, ever — not during play, not after a solve, not anywhere
- No gating the daily puzzle
- No aggressive hint pushing; the nudge button is small and calm
- No streak-loss guilt as a monetisation lever
- No dark patterns in the offer: dismissal is always as easy as acceptance

---

## 6. Streaks and stats

Detailed design lives in `systems/streaks-progress.md`.

Streaks are included, but implemented in a way that does not violate Principle 1 (never punish).

### 6.1 Rules

| Rule | Value |
|---|---|
| What counts | Solving the **daily** puzzle for that day |
| Do archive replays count | No — but they do not break a streak either |
| Do pack puzzles count | No |
| Grace | 1 "rest day" per 7 days, applied automatically and silently |
| Rollover | Device-local midnight, clamped by a high-water-mark guard |
| Solved-with-nudge | Counts fully |

### 6.2 Tone requirements

- A broken streak is stated once, quietly, in neutral colour, with a warm re-entry message. No red, no shattered animation, no modal.
- The streak count on the daily screen is small and secondary. Full stats live on the `stats` route, which the user chooses to visit.
- No notification may reference an expiring streak. Notification copy is invitational ("Today's puzzle is waiting"), never loss-framed.
- Milestones (7, 30, 100) are celebrated warmly; there is no public comparison of any kind.

### 6.3 Tracked stats

Puzzles solved (total, by source), current streak, longest streak, rest days used, per-pack completion, calendar heatmap of solved days.

---

## 7. Localisation

Detailed design lives in `systems/i18n.md`.

- `react-i18next` + `i18next`, one JSON file per language
- Locale detected from device on first launch, overridable in Settings, applied without restart
- All user-facing strings go through `t()`. No literal strings in components.
- Pluralisation and interpolation supported; English is the fallback for missing keys
- **Puzzle content is not translatable by this system.** See `00-spec-critique.md` §2. The architecture ships in v1; additional locales ship only when native puzzle content exists for them.
- **v1 ships English only. Spanish is deferred to v2** (`99-backlog.md`). The Settings language control renders only locales for which both a translation file and a puzzle bank exist — so with one locale it is hidden entirely.

---

## 8. Technical architecture

### 8.1 Current repo state

Turborepo monorepo, pnpm workspaces:

```
apps/
  native/    Expo SDK 57, Expo Router 57, RN 0.86, React 19.2
             uniwind + heroui-native + tailwind-variants
  web/       marketing site + /privacy, /terms, /support (compliance)
packages/
  content/   puzzle bank + validator          [to create]
  env/       shared env schema (zod)
  config/    shared tsconfig / tooling
```

### 8.2 Dependencies to add

| Package | Purpose |
|---|---|
| `react-i18next`, `i18next` | Localisation |
| `expo-localization` | Device locale detection |
| `react-native-mmkv` | Local persistence |
| `react-native-purchases` | RevenueCat |
| `expo-notifications` | Local daily reminder |
| `expo-updates` | OTA content delivery |

Note: MMKV is a native module, so Expo Go will not work. Development uses a dev client (`expo run:ios` / `expo run:android`) — the repo's scripts already support this.

### 8.3 Local storage

Full schema in `systems/storage-persistence.md`. Summary:

| Data | Store |
|---|---|
| Selected language | MMKV |
| Onboarding completed + step progress | MMKV |
| Theme preferences | MMKV |
| Nudge Coin balance and ledger | MMKV |
| Solved puzzles, streak, stats | MMKV |
| Nudges purchased per puzzle | MMKV |
| Daily high-water mark (clock-tamper guard) | MMKV |
| Content bank version | MMKV |
| Notification permission + chosen time | Expo Notifications + MMKV |
| Purchase entitlements | RevenueCat (local cache) |

### 8.4 Architectural decisions

- **Frontend-only** — no server, no accounts, no cloud sync in v1
- **RevenueCat is the sole source of truth for entitlements** — the app never grants an entitlement locally
- **Content is bundled and OTA-updatable** — this supersedes the original spec's "no CDN needed"
- **Portrait only, phone only, offline-capable**
- **No analytics, no telemetry, no third-party SDKs beyond RevenueCat and Expo**

---

## 9. Privacy, compliance, and measurement

### 9.1 Data collection

The app collects and transmits **nothing about the user**. No accounts, no email, no device identifiers sent anywhere, no event tracking, no crash-linked user data.

What does leave the device:

| Signal | Destination | Purpose |
|---|---|---|
| Purchase transactions | RevenueCat + Apple/Google | Required for purchases to function |
| Anonymous install/session counts | Expo Insights | Knowing the app is being installed |
| Content manifest requests | Static file host | Fetching new puzzles |

Nothing else. All game progress lives on the device and is deleted when the app is uninstalled — which the privacy policy should state in exactly those words.

### 9.2 Store compliance

Hosted by `apps/web`. Required live before first submission:

| URL | Required by |
|---|---|
| `/privacy` | App Store, Play Store, GDPR |
| `/terms` | App Store (mandatory once a subscription ships) |
| `/support` | App Store support URL requirement |

Settings links to all three. These must be permanent URLs — review re-checks them.

**Before submission:** verify Expo Insights' current data collection against Apple's Privacy Nutrition Label categories and declare it accurately. "We collect nothing" must be true, not aspirational.

### 9.3 Consequences of having no analytics

This is a deliberate choice, and these are the costs to plan around:

- **Puzzle difficulty cannot be corrected by data.** A user who finds Thursday brutal will not report it — they will quietly stop. Mitigation: difficulty is derived from word frequency (§3.2), not guessed, and a human samples every batch.
- **Onboarding and offer conversion are invisible.** Installs (Expo Insights) and purchases (store consoles) give a crude top and bottom of funnel. Everything between is dark. A/B testing onboarding is off the table — it has to be right the first time.

**The replacement feedback loop is direct user contact.** Recruit 10–20 real users before launch and talk to them. A "tell us what you think" mail link ships in Settings. This is not optional colour — with no telemetry it is the *entire* mechanism by which the product learns anything.

---

## 10. Accessibility

Requirements, not aspirations:

- Dynamic Type supported up to the OS maximum without clipping on every screen
- VoiceOver / TalkBack labels on the three source words, the input, the nudge button, and the solve celebration
- All text meets WCAG AA contrast against its background
- No information conveyed by colour alone
- Haptics and sound independently toggleable
- No animation required to understand any state; respect Reduce Motion

---

## 11. Acceptance criteria for v1

- [ ] A brand-new user reaches a solved tutorial puzzle in under 40 seconds
- [ ] No price, offer, or purchase surface appears anywhere in onboarding
- [ ] The welcome offer appears on the second visit, once, with an equal-weight dismiss button
- [ ] Every puzzle in the shipped bank passed the content validator
- [ ] `/privacy`, `/terms`, and `/support` are live and linked from Settings
- [ ] The daily puzzle is playable end to end in airplane mode on a fresh install
- [ ] No monetisation surface appears on the puzzle or solve screens
- [ ] A wrong answer never produces red, shake, sound, or a counter
- [ ] Nudge tiers unlock in order and cannot exceed 3 per puzzle
- [ ] Coin balance cannot go negative under rapid repeated taps
- [ ] Reinstalling and restoring purchases re-unlocks all owned packs
- [ ] Setting the device clock forward does not advance the daily by more than one day
- [ ] A broken streak produces no red, no modal, and no notification
- [ ] Every string on every screen resolves through `t()` with no missing-key fallbacks visible
- [ ] Every screen renders correctly at the largest Dynamic Type setting
- [ ] Content OTA failure is silent and the bundled bank is used
- [ ] Every screen listed in §4, including the states in §4.6, exists and is reachable

---

## 12. Decisions and open items

### Resolved

| # | Decision | Resolution |
|---|---|---|
| 2 | Keep `apps/web`? | Yes — marketing site and compliance host |
| 3 | Who authors the puzzles? | AI-generated → machine-validated → human spot-reviewed |
| 4 | Daily rollover | Device-local midnight, high-water-mark guarded |
| 5 | Coins on reinstall | Restored in full |
| 6 | Welcome offer timing | Second visit, 48h window, out of onboarding |
| 7 | Hug Club in v1 | Deferred; entitlement built, product withheld |
| 8 | Answer input | Free text, forgiving |
| 9 | Analytics | None beyond Expo Insights installs |
| 10 | Streaks | Full, implemented quietly |

| 1 | Spanish at launch? | No — deferred to v2 (`99-backlog.md`). v1 is English only. |

### Still open

| # | Decision | Recommendation | Severity |
|---|---|---|---|
| 13 | Who recruits the 10–20 launch users for direct feedback, and when? | Lucky, scheduled now | 🟠 It is the only feedback loop |
| 15 | Tune `MIN_COMPOUND_F` (currently 0.05) against known-good and known-bad puzzles | Needs a ~20-puzzle calibration set before bulk generation | 🟡 Not blocking, but sets the reject rate |

### Resolved during the validator spike

| # | Decision | Resolution |
|---|---|---|
| 11 | Lexicon + frequency corpus | **Datamuse only.** WordNet and wordfreq proved unnecessary. No key, no downloads, no licence question. |
| 12 | Python in the monorepo? | Not needed — the validator is zero-dependency Node |
| 14 | Compounds vs phrases | Compounds only; spelling variants merged. §2.1. |
