# Word Hug — Screen Specification

**For:** design
**Scope:** layout structure and functionality only. No colours, type, spacing values, illustration, motion styling, or copy tone — those are the designer's decisions.
**Version:** 0.1
**Supersedes:** the route table in `01-prd.md` §4

---

## How to read this document

Every screen is described the same way:

| Section | What it tells you |
|---|---|
| **Purpose** | The single job the screen does |
| **Entry / Exit** | How the user arrives and where they can go |
| **Zones** | Vertical regions, top to bottom, and what occupies each |
| **Elements** | Every interactive or informational element, and what it does |
| **States** | Every condition the screen can be in |
| **Rules** | Constraints that are not negotiable |

Where a zone is marked **flexible**, it absorbs extra vertical space on tall devices. Where it is marked **fixed**, it keeps its height and position regardless of device size.

---

## 1. Global constraints

These apply to every screen and are not repeated below.

| Constraint | Detail |
|---|---|
| Orientation | Portrait only. No landscape layouts exist. |
| Device | Phone only. No tablet or iPad layouts in v1. |
| Handedness | One-handed operation is a requirement, not a preference. Any action the user performs repeatedly must sit in the lower third of the screen. |
| Reach | The top bar is reachable but awkward. Nothing frequent goes there. Back, help, and close are acceptable; primary actions are not. |
| Keyboard | On screens with text input, the layout must not push essential content off-screen when the keyboard opens. See §5.1 Rule K. |
| Safe areas | All content respects system safe areas. The bottom action zone sits above the home indicator. |
| Text scaling | Every screen must survive the largest OS text size without clipping or overlap. Assume text can grow ~2× and plan for wrapping and scroll. |
| Reserved space | Any area that shows conditional messages must reserve its height permanently. Layout must never jump when a message appears. |

### 1.1 The standard screen skeleton

Most screens are a variation of this. Deviations are called out per screen.

```
┌─────────────────────────────┐
│  A  TOP BAR          fixed  │   back / title / help
├─────────────────────────────┤
│  B  CONTEXT STRIP    fixed  │   where am I, optional
├─────────────────────────────┤
│                             │
│  C  CONTENT       flexible  │   the screen's actual job
│                             │
├─────────────────────────────┤
│  D  FEEDBACK LINE    fixed  │   reserved, often empty
├─────────────────────────────┤
│  E  ACTION ZONE      fixed  │   primary action, thumb reach
└─────────────────────────────┘
```

**Zone D is reserved even when empty.** It is where "not quite — try another" and similar messages appear. If it collapses when empty, the whole screen shifts every time the user guesses, which is exactly the jarring feedback the product forbids.

---

## 2. Screen inventory

18 screens and 8 overlays.

| # | Screen | Route |
|---|---|---|
| 1 | Loading | `+loading` |
| 2 | Error | `+error` |
| 3 | Not Found | `+not-found` |
| 4–8 | Onboarding, 5 steps | `onboarding` |
| 9 | **Daily Puzzle** | `(game)/daily` |
| 10 | Archive | `(game)/archive` |
| 11 | Archive Puzzle | `(game)/archive/[date]` |
| 12 | Pack List | `(game)/packs` |
| 13 | Pack Detail | `(game)/packs/[packId]` |
| 14 | Pack Puzzle | `(game)/packs/[packId]/[puzzleIndex]` |
| 15 | Shop | `shop` |
| 16 | Settings | `settings` |
| 17 | How to Play | `how-to-play` |
| 18 | Stats | `stats` |

| Overlay | Appears over |
|---|---|
| A. Solve celebration | Any puzzle screen |
| B. Nudge picker | Any puzzle screen |
| C. Zero-coin prompt | Any puzzle screen |
| D. Welcome offer | After a solve, second visit only |
| E. Archive locked | Archive |
| F. Offline notice | Any screen |
| G. Restore result | Settings, Shop |
| H. Caught-up | Daily |

**Screen 9 is the product.** Ninety percent of all time is spent there. Everything else exists to support it.

---

## 3. Navigation model

Flat, not deep. There is no tab bar and no drawer.

```
                    ┌──────────────┐
   first launch ──▶ │  ONBOARDING  │ ──▶ ┌───────────┐
                    └──────────────┘     │   DAILY   │ ◀── app launch
                                         │  (home)   │
                                         └─────┬─────┘
                                               │
             ┌──────────────┬──────────────────┼──────────────┐
             ▼              ▼                  ▼              ▼
        ┌─────────┐   ┌──────────┐      ┌──────────┐   ┌──────────┐
        │ ARCHIVE │   │  PACKS   │      │ SETTINGS │   │   HELP   │
        └────┬────┘   └────┬─────┘      └────┬─────┘   └──────────┘
             ▼             ▼                 ▼
        ┌─────────┐   ┌──────────┐      ┌──────────┐
        │ ARCHIVE │   │   PACK   │      │  STATS   │
        │ PUZZLE  │   │  DETAIL  │      └──────────┘
        └─────────┘   └────┬─────┘
                           ▼
                      ┌──────────┐        ┌──────────┐
                      │   PACK   │        │   SHOP   │ ◀── from packs,
                      │  PUZZLE  │        └──────────┘     archive lock,
                      └──────────┘                         zero-coin sheet
```

**Rules**

- Daily is home. Launching the app always lands there, never on the last screen viewed.
- Every screen except Daily has a back affordance returning to its parent.
- Maximum depth is three levels (Daily → Packs → Pack Detail → Pack Puzzle is the deepest path).
- Shop is reachable from several places but is never forced. There is no persistent shop button on Daily.
- Onboarding is entered once and cannot be returned to. How to Play covers the same ground afterwards.

---

## 4. The puzzle screen family

Screens 9, 11, and 14 share one layout. Build it once; the differences are in the top bar, the context strip, and what happens after a solve.

### 4.1 Shared layout

```
┌─────────────────────────────────────┐
│ A  [back]        [title]      [ ? ] │  fixed
├─────────────────────────────────────┤
│ B  context line                     │  fixed, single line
├─────────────────────────────────────┤
│                                     │
│                                     │
│ C          W O R D   O N E          │  flexible
│                                     │  three clues,
│            W O R D   T W O          │  stacked vertically,
│                                     │  equal weight,
│            W O R D  T H R E E       │  centred
│                                     │
│                                     │
├─────────────────────────────────────┤
│ D  ┌─────────────────────────────┐  │  fixed
│    │  input field         [ → ]  │  │
│    └─────────────────────────────┘  │
├─────────────────────────────────────┤
│ E  feedback line (reserved)         │  fixed, may be empty
├─────────────────────────────────────┤
│ F  [nudge]                  streak  │  fixed
└─────────────────────────────────────┘
```

### 4.2 Zones

| Zone | Height | Contents |
|---|---|---|
| **A** Top bar | Fixed | Left: back (absent on Daily). Centre: title. Right: help "?" — always present on every puzzle screen. |
| **B** Context strip | Fixed, one line | Tells the user which puzzle this is. Never wraps; truncate instead. |
| **C** Puzzle core | Flexible — absorbs all spare height | The three clue words, stacked vertically, centred horizontally. This is the visual anchor of the entire product. |
| **D** Input | Fixed | Single-line text field plus a submit affordance. Submit is also bound to the keyboard return key. |
| **E** Feedback | Fixed, always reserved | Wrong-answer nudges, "so close" messages, purchased hint text. Empty most of the time. |
| **F** Utility bar | Fixed | Nudge button (left), streak indicator (right). Both small and secondary. |

### 4.3 The three clue words

- **Stacked vertically, one per line, centred.** Not a horizontal row — portrait width cannot give three words equal presence side by side, and a vertical stack reads as a list of equals.
- **All three carry identical weight.** No word is emphasised over another. The puzzle's difficulty comes from the connection, not from a highlighted hint.
- **Order is fixed** as authored. Do not sort or shuffle.
- **The words never reveal position.** The data knows whether a clue goes before or after the answer; the screen must not show it. No arrows, no ordering cues, no gaps indicating where the answer slots in.
- Long clue words must shrink to fit on one line rather than wrap.

### 4.4 Elements

| Element | Type | Function | Notes |
|---|---|---|---|
| Back | Button | Return to parent | Absent on Daily — it is home |
| Help "?" | Button | Opens How to Play | Present on all three puzzle screens |
| Clue words ×3 | Static text | The puzzle | Not interactive. Tapping does nothing. |
| Input field | Single-line text | Answer entry | Autocorrect off, autocapitalise off, spellcheck off. See Rule I. |
| Submit | Button | Check the answer | Disabled while the field is empty. Also fires on keyboard return. |
| Feedback line | Static text | Response to a wrong guess, or purchased nudge text | Reserved height, see Rule F |
| Nudge button | Button | Opens the nudge picker (Overlay B) | Small, low prominence, never badged or animated |
| Streak indicator | Static | Current streak count | Small, secondary, read-only. Tapping opens Stats. |

### 4.5 States

| State | Trigger | Behaviour |
|---|---|---|
| **Unsolved** | Default | As drawn above |
| **Wrong guess** | Submit, no match | Feedback line fills. Input retains the text and stays focused so the user can edit rather than retype. No shake, no colour change, no sound, no attempt counter. |
| **Near miss** | Submit, one character off | Feedback line shows a "so close" message. **Not** a solve. Input retains text. |
| **Nudge purchased** | Overlay B confirms | Feedback line shows the hint text and it persists. Multiple purchased nudges stack in this zone. |
| **Solved** | Correct answer | Overlay A fires. Input and submit become inert. |
| **Already solved** | Screen opened for a puzzle in solve history | Answer shown in place of the input field. Nudge button hidden. No re-solving. |

### 4.6 Rules

**Rule K — keyboard.** When the keyboard opens, zones D, E, and F must remain visible, and **at least all three clue words must remain visible**. Zone C compresses; it does not scroll away. A user cannot answer a puzzle they cannot see. If a device is too short to satisfy this, zone C scrolls internally while D/E/F stay pinned.

**Rule F — feedback.** Zone E occupies its full height at all times, whether or not it contains text. Nothing on the screen moves when a message appears or clears.

**Rule I — input.** Autocorrect, autocapitalise, and predictive text are all disabled. The OS suggesting the answer, or silently correcting a correct answer into a wrong one, breaks the game.

**Rule N — no penalty surface.** There is no attempt counter, no timer, no score, and no progress bar on this screen. Nothing on it may communicate that the user is doing badly.

**Rule M — no commerce.** No price, no offer, no shop entry point appears on any puzzle screen. The nudge button is the only element that can lead toward a purchase, and it leads to a picker, not a store.

---

## 5. Screens in detail

### 5.1 — Screen 9 · Daily Puzzle `(game)/daily`

**Purpose.** Today's puzzle. The home screen and the reason the app exists.

**Entry.** App launch (always). Back from any child screen.
**Exit.** Archive, Packs, Settings, Stats, How to Play.

**Deviations from the shared puzzle layout:**

| Zone | Difference |
|---|---|
| A | No back button. Left slot holds the entry point to Archive. Right slot holds help. |
| B | Shows the date, e.g. "Monday 10 August". |
| F | Streak indicator present here; it is the only screen that shows it by default. |

**Additional navigation.** Daily is the hub, so it must expose routes to Archive, Packs, Settings, and Stats without cluttering the puzzle. Recommended: a single overflow or menu affordance in the top bar rather than four separate buttons. The puzzle must remain the dominant element — navigation is secondary to it in every respect.

**States**

| State | Trigger | Behaviour |
|---|---|---|
| Unsolved | Default | Standard puzzle layout |
| Solved today | Already solved | Answer displayed; zone F offers one calm next action (Archive or Packs). No "come back tomorrow" countdown. |
| Caught up | Daily bank exhausted | Overlay H, then a labelled replay puzzle |
| First launch after onboarding | Onboarding just completed | Identical to Unsolved. No extra welcome, no tour. The user has already been welcomed. |

---

### 5.2 — Screen 10 · Archive `(game)/archive`

**Purpose.** Browse and replay past daily puzzles.

**Entry.** Daily. **Exit.** Archive Puzzle, back to Daily.

**Layout.** Deviates from the standard skeleton — this is a browse screen.

```
┌─────────────────────────────────────┐
│ A  [back]      Archive              │  fixed
├─────────────────────────────────────┤
│ B  month selector                   │  fixed
├─────────────────────────────────────┤
│                                     │
│ C  scrollable list or calendar      │  flexible, scrolls
│    of dates, newest first           │
│                                     │
│    each row: date · solved mark ·   │
│              locked mark            │
│                                     │
└─────────────────────────────────────┘
```

**Elements**

| Element | Function |
|---|---|
| Month selector | Jump between months. Cannot navigate before launch date or after today. |
| Date row / cell | Opens that day's puzzle if accessible; opens Overlay E if locked |
| Solved marker | Indicates the puzzle was solved. Binary, not a score. |
| Locked marker | Indicates the puzzle is outside the free window |

**Access rules**

- Today and the previous 6 days are always accessible — 7 days total.
- Anything older is locked in v1. Hug Club, which would unlock it, is deferred.
- Dates before the app's launch date do not exist and are not rendered.
- Future dates do not exist and are not rendered.

**States**

| State | Behaviour |
|---|---|
| Default | List of dates with markers |
| Day one | Only today exists. Show a brief line explaining the archive fills up as days pass. Do not show six empty rows. |
| Locked tapped | Overlay E |

---

### 5.3 — Screen 11 · Archive Puzzle `(game)/archive/[date]`

**Purpose.** Replay one past daily puzzle.

**Entry.** Archive. **Exit.** Back to Archive.

Standard puzzle layout, with:

| Zone | Difference |
|---|---|
| A | Back returns to Archive, not Daily |
| B | Shows the puzzle's own date |
| F | **No streak indicator.** Archive solves do not affect the streak, so showing it here implies otherwise. |

**On solve.** Overlay A fires, but returns the user to Archive rather than offering a next puzzle.

---

### 5.4 — Screen 12 · Pack List `(game)/packs`

**Purpose.** Show the five Hug Packs, their lock state, and progress through the ones that are owned.

**Entry.** Daily. **Exit.** Pack Detail, Shop, back to Daily.

**Layout.** Vertical list of five cards, scrollable. A list, not a grid — five items in a grid wastes portrait width and shrinks each pack's presence.

**Each pack row contains**

| Element | Function |
|---|---|
| Pack name | Identifies the theme |
| Lock state | Owned or locked. Binary and immediately legible. |
| Progress | Solved count out of 30. Owned packs only. |
| Action | Owned → opens Pack Detail. Locked → opens Shop. |

**States**

| State | Behaviour |
|---|---|
| None owned | All five locked. This is the default state for most users and must not look broken or empty — it is a legitimate browse state. |
| Some owned | Mixed |
| All owned | No shop entry point remains on this screen |

---

### 5.5 — Screen 13 · Pack Detail `(game)/packs/[packId]`

**Purpose.** Choose a puzzle within an owned pack.

**Entry.** Pack List. **Exit.** Pack Puzzle, back to Pack List.

**Layout.** Top bar with back and pack name; a progress summary line; then a scrollable list of 30 puzzle entries.

**Each entry shows** its number and whether it is solved. Nothing else — no difficulty, no preview of the words, no time taken.

**Rules**

- Puzzles are **not** sequentially locked. All 30 are playable immediately on purchase. Gating them behind each other would be a progression mechanic, which the product does not have.
- Order is fixed as authored.
- This screen is unreachable for packs the user does not own. There is no preview mode.

---

### 5.6 — Screen 14 · Pack Puzzle `(game)/packs/[packId]/[puzzleIndex]`

Standard puzzle layout, with:

| Zone | Difference |
|---|---|
| A | Back returns to Pack Detail |
| B | Shows pack name and position, e.g. "Cozy Kitchen · 7 of 30" |
| F | **No streak indicator.** Pack solves do not affect the streak. |

**On solve.** Overlay A fires and offers the next unsolved puzzle in the pack as the primary action, since the user is in a session rather than a daily ritual. When the pack is complete, it offers a return to Pack List instead.

---

### 5.7 — Screen 15 · Shop `shop`

**Purpose.** Sell the Hug Bundle, individual packs, and Nudge Coins.

**Entry.** Pack List, Overlay C, Overlay E, Settings. **Never** from a puzzle screen.
**Exit.** Back to wherever the user came from.

**Layout.** Scrollable, ordered by priority:

```
┌─────────────────────────────────────┐
│ A  [close]        Shop              │
├─────────────────────────────────────┤
│                                     │
│  1  HUG BUNDLE — hero               │  largest element
│     what it contains · price        │
│     [ buy ]                         │
│                                     │
│  2  Individual packs                │  compact list of 5
│     name · price · owned state      │
│                                     │
│  3  Nudge Coins                     │  three tiers
│     5 / 15 / 50 · price each        │
│                                     │
│  4  Restore purchases               │  quiet text link
│                                     │
└─────────────────────────────────────┘
```

**Rules**

- All prices come from the store and are displayed as returned. Never format or hardcode a price.
- Owned items show as owned and are not purchasable again.
- Individual packs are a price anchor for the Bundle. They get a compact row each, not a card.
- Hug Club does not appear in v1.
- Dismissal is always available and always obvious.

**States**

| State | Behaviour |
|---|---|
| Loading | Products are fetched from the store. Show a quiet loading state, never a broken layout with missing prices. |
| Unavailable | Store unreachable. Explain plainly and offer retry. Do not show placeholder prices. |
| All owned | Bundle section replaced with an owned confirmation. Coins remain purchasable. |

---

### 5.8 — Screen 16 · Settings `settings`

**Purpose.** Preferences, purchase recovery, and legal links.

**Entry.** Daily. **Exit.** Stats, Shop, external links, back.

**Grouped list, in this order:**

| Group | Items |
|---|---|
| Play | Sound (toggle), Haptics (toggle) |
| Reminder | Daily reminder (toggle), Reminder time (time picker, enabled only when the toggle is on) |
| Progress | Stats (navigates to Screen 18) |
| Purchases | Restore purchases (action), Shop (navigates) |
| About | How to Play, Privacy Policy, Terms of Service, Support, App version |

**Rules**

- **Language does not appear** while only one locale exists. It appears automatically when a second content bank ships.
- Privacy, Terms, and Support open external URLs. All three are required for store submission.
- Restore is an explicit action with visible feedback (Overlay G). It never runs silently.
- App version is displayed as static text for support purposes.

---

### 5.9 — Screen 17 · How to Play `how-to-play`

**Purpose.** Explain the mechanic to someone who is confused mid-puzzle.

**Entry.** The "?" on any puzzle screen; Settings. **Exit.** Back to the exact screen the user came from.

**Content, in order:** the rule in one sentence; one fully worked example showing all three pairings; a note that the answer can go before or after; an explanation of what nudges are and that they cost coins.

**Rules**

- Reachable from every puzzle screen and returns precisely where it came from. A user who opens help mid-puzzle must not lose their typed input.
- Read-only. No puzzle is playable here — that is what onboarding step 2 was for.
- Scrollable. Must work at the largest text size.

---

### 5.10 — Screen 18 · Stats `stats`

**Purpose.** Let a user who *chooses* to look see their history.

**Entry.** Settings; the streak indicator on Daily. **Exit.** Back.

**Content, in order:**

| Element | Notes |
|---|---|
| Current streak | Number of days |
| Longest streak | Number of days |
| Total puzzles solved | All sources combined |
| Calendar heatmap | Solved days, by date |
| Per-pack progress | Owned packs only |

**Rules**

- **Not reachable from a puzzle screen.** Progress data must never intrude on the act of playing.
- No comparison to other users, no percentiles, no ranking, ever.
- Nudge-free solve count is tracked internally but **not displayed** — showing it would imply that using hints is worse.
- Empty state before the first solve must read as a beginning, not as a record of failure.

---

### 5.11 — Screens 4–8 · Onboarding `onboarding`

Five steps, one route. Reduced from the original seven — language selection and theme personalisation were both cut.

**Shared frame across all five steps:**

```
┌─────────────────────────────────────┐
│  step indicator            [skip]   │  fixed, skip absent on 2 and 5
├─────────────────────────────────────┤
│                                     │
│  content                            │  flexible, varies per step
│                                     │
├─────────────────────────────────────┤
│  [ primary action ]                 │  fixed, thumb reach
│  [ secondary ]                      │  optional
└─────────────────────────────────────┘
```

| # | Screen | Content | Primary action | Skippable |
|---|---|---|---|---|
| 4 | Welcome | Establishes what the app is | Continue | Yes |
| 5 | **Try the Game** | A real, playable tutorial puzzle using the standard puzzle layout | Solve it | **No** |
| 6 | The Ritual | Frames the daily puzzle as a habit | Continue | Yes |
| 7 | Notification Priming | Explains why a reminder helps, before the OS prompt appears | Allow / Not now | Yes |
| 8 | Drop In | Brief confirmation | Start | **No** |

**Rules**

- **Step 5 uses the real puzzle screen layout**, not a mockup. The user is learning the interface they will use every day. It has no back button and no skip.
- Step 5 must be solvable by essentially everyone. If the user struggles, reveal the answer after a short while and let them tap it. Nobody fails onboarding.
- **Step 7 is a custom screen that precedes the OS permission dialog.** Tapping "Allow" here triggers the native prompt. Tapping "Not now" does not, and the OS prompt is never shown. This preserves the one chance the OS gives to ask.
- Step 7 is skipped entirely if permission has already been granted or permanently denied.
- **No prices, offers, or shop entry points appear anywhere in onboarding.** The welcome offer was deliberately moved to the second visit.
- Progress persists per step. Killing the app mid-flow resumes at the same step.
- Target: under 40 seconds from launch to the daily puzzle for a user who taps straight through.

---

### 5.12 — Screens 1–3 · Loading, Error, Not Found

| Screen | Purpose | Content | Action |
|---|---|---|---|
| **Loading** `+loading` | Cover font loading, storage hydration, and store configuration | Minimal holding state | None |
| **Error** `+error` | Catch unhandled errors | Plain explanation, no technical detail | Retry, and a route back to Daily |
| **Not Found** `+not-found` | Unknown route | Brief explanation | Back to Daily |

**Rules**

- Loading must be tolerable at several seconds on a cold start and must not flash on a warm one. Prefer holding the previous frame briefly over showing a spinner for 80ms.
- Error and Not Found always offer a way back to Daily. A dead end is never acceptable.
- No error codes, stack traces, or diagnostic text is shown to the user.

---

## 6. Overlays

### A · Solve celebration

**The most important moment in the product.**

Appears over any puzzle screen on a correct answer. Confirms the answer, celebrates briefly, and offers exactly one clear next action.

| Property | Value |
|---|---|
| Type | Full-screen or near-full-screen overlay |
| Duration | Completes within about two seconds; dismissible by tap at any point |
| Contains | The solved answer; a short affirming message; the three pairings revealed in full; one primary action |
| Next action | Daily → Archive or Packs. Archive → back to Archive. Pack → next unsolved puzzle in that pack. |
| Streak | Shown quietly on Daily only, as information, not as a reward to protect |

**Rules**

- **No monetisation of any kind.** No prices, no offers, no shop links, no coin balance.
- Identical whether or not the user bought a Solve Nudge. There is no "you used a hint" framing.
- Dismissible by tap. Never traps the user in an animation.
- Revealing the three completed pairings is required — this is the moment the puzzle makes sense, and seeing it teaches the mechanic better than any tutorial.

### B · Nudge picker

Bottom sheet, opened from the nudge button.

| Element | Function |
|---|---|
| Three tiers listed in order | Category → First Letter → Solve |
| Cost per tier | 1 coin each |
| Current balance | Displayed once |
| Purchased tiers | Shown as already owned, free to re-read |
| Locked tiers | The next tier is available; later tiers are visibly not yet reachable |
| Dismiss | Always available |

**Rules**

- Tiers unlock strictly in order. Solve cannot be bought before the two preceding tiers.
- Maximum three per puzzle.
- Purchasing writes the hint into zone E of the puzzle screen, where it persists.
- Zero balance routes to Overlay C rather than showing a disabled state.

### C · Zero-coin prompt

Bottom sheet, shown when a nudge is tapped with no coins.

Contains the three coin tiers with prices, and a plainly-labelled dismissal. **A quiet sheet, not a paywall.** Never appears during or immediately after a solve.

### D · Welcome offer

The Hug Bundle discount, relocated out of onboarding.

| Property | Value |
|---|---|
| Trigger | First app open on a calendar day later than install day |
| Placement | One screen after a solve — **never on the solve screen** |
| Frequency | Once. Dismissed means gone permanently. |
| Window | 48 hours |
| Dismissal | Full-size action with equal visual weight to accept. No small × in a corner. |

**Rule.** If a countdown is shown at all, it is plain text. No ticking timer — it would be the single most off-brand element in the app.

### E · Archive locked

Shown when a locked archive date is tapped. In v1 this is informational: the full archive is coming, and there is nothing to buy yet, because Hug Club is deferred. It must not look like a broken purchase flow.

### F · Offline notice

Non-blocking, dismissible. Only appears when something the user tried to do requires a network — a purchase, a restore. **Never appears for a failed background content sync**, which must be entirely silent.

### G · Restore result

Shown after Restore Purchases completes. States what was restored, or plainly says there was nothing to restore. Never silent, never a bare spinner that vanishes.

### H · Caught-up

Shown when the daily bank is exhausted. Warm acknowledgement, then a labelled replay. Never a blank screen or an error.

---

## 7. Cross-screen behaviour

| Behaviour | Rule |
|---|---|
| App launch | Always lands on Daily, never on the last screen viewed |
| Back | Every screen except Daily has a back affordance to its parent |
| Help | Reachable from every puzzle screen; returns to the exact prior state with input preserved |
| Keyboard dismissal | Tapping outside the input dismisses the keyboard without submitting |
| Interruption | Leaving a puzzle mid-attempt and returning preserves typed input and purchased nudges |
| Solve persistence | A solved puzzle is permanently solved. Reopening shows the answer, not a fresh input. |
| Commerce placement | No price, offer, or shop entry point on any puzzle screen, in onboarding, in the solve celebration, or in any notification |

---

## 8. Open items for design

| # | Question |
|---|---|
| 1 | Daily's top bar must reach Archive, Packs, Settings, and Stats without competing with the puzzle. Single menu affordance, or something else? |
| 2 | Archive: calendar grid or vertical list? A grid is more scannable; a list handles large text sizes better. |
| 3 | Where exactly does the streak indicator sit on Daily so that it reads as information rather than as something to protect? |
| 4 | Does the solve celebration cover the screen entirely, or sit over a visible puzzle? |
| 5 | How does zone C compress on short devices when the keyboard is open, while keeping all three clue words visible? |
