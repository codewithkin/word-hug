# System: Streaks & Progress

**Owner of:** streak rules, rest days, stats derivation, and the tone constraints on all progress UI.
**Status:** Draft

---

## 1. The tension, stated plainly

The product's stated principles are *"no penalties, no score pressure, not punishing."* A streak counter is a penalty mechanic. Its motivational force comes entirely from the fear of losing it — that is why Duolingo's streak works, and why it is stressful.

The decision is to ship full streaks and stats. This document exists to make that compatible with the brand rather than quietly corrosive to it. The mechanism is standard; the **framing, colour, placement, and copy are not.**

The rule that governs everything below: **the streak may reward, but it may never accuse.**

---

## 2. Streak rules

| Rule | Value | Rationale |
|---|---|---|
| What increments a streak | Solving the **daily** puzzle for that calendar day | One clear ritual |
| Archive replays | Do not increment, do not break | Replaying yesterday shouldn't retroactively rewrite history |
| Pack puzzles | Do not increment, do not break | Packs are a different mode |
| Hug Club weekly | Does not increment | Same reason |
| Solved with a Solve Nudge | **Counts fully** | Hints are a feature, not a confession |
| Rollover boundary | Device-local midnight (decided) | The ritual is "your morning" |
| Rest days | 1 per rolling 7 days, applied automatically and silently | Removes the cliff without removing the habit |
| Maximum backfill | None | Missing a day is fine; buying your way out is not |

### Rest days

If the player misses exactly one day and has a rest day available, the streak continues. The rest day is consumed silently — the player is not notified they used one, and is not warned they are running low. Both would reintroduce anxiety.

Rest days refresh on a rolling 7-day window anchored at `streak.weekAnchor`.

### Algorithm

```
onDailySolved(date):
  last = streak.lastDailyDate
  gap  = last ? daysBetween(last, date) : null

  if gap == 0:  return                       // already solved today
  if gap == 1:  streak.current += 1
  elif gap == 2 and restDayAvailable():
       consumeRestDay(); streak.current += 1
  else:         streak.current = 1           // fresh start, not a "loss"

  streak.lastDailyDate = date
  streak.longest = max(streak.longest, streak.current)
```

Note there is no "break the streak" event, only a reset on the next solve. **The app never proactively detects and announces a broken streak.** A user who returns after three weeks is greeted with a puzzle, not a tally of what they missed.

---

## 3. Tone constraints

These are requirements, testable at review.

| Constraint | Rule |
|---|---|
| Colour | A reset streak uses the same neutral colour as all body text. No red, no orange, no warning iconography. |
| Animation | No shatter, no crack, no fade-to-grey. |
| Modals | A streak change never triggers a modal, sheet, or interstitial. |
| Placement | The streak on the daily screen is small, secondary, and below the puzzle. Full stats live on `stats`, which the user chooses to visit. |
| Notifications | No notification may reference a streak, an expiry, or a risk of loss. Copy is invitational only. |
| Copy | Re-entry copy is forward-looking: *"Today's a lovely day to begin again."* Never *"You lost your 47-day streak."* |
| Comparison | No social comparison, percentile, or ranking of any kind, ever. |
| Milestones | 7, 30, 100, 365 get a warm celebration. Non-milestone days get nothing extra. |

**If a design review cannot tell whether a streak treatment is on-brand, the test is:** would this make a tired parent at 11pm feel worse about themselves? If plausibly yes, it's wrong.

---

## 4. Stats

### Stored

Only what cannot be derived: `streak.current`, `streak.longest`, `streak.lastDailyDate`, `streak.restDaysUsedThisWeek`, `streak.weekAnchor`, and the `solves` map (see `systems/storage-persistence.md` §3.2).

### Derived at read time

| Stat | Derivation |
|---|---|
| Total solved | `Object.keys(solves).length` |
| Solved by source | Group `solves` by `source` |
| Pack completion | Solved ids in pack ÷ pack size |
| Calendar heatmap | `solves` filtered to `source: 'daily' \| 'archive'`, keyed by date |
| Days played | Distinct dates in `solves` |
| Nudge-free solves | `solves` where `usedSolveNudge === false` |

Deriving rather than storing means a schema change never invalidates history, and there is no counter to drift out of sync.

### The `stats` route

New screen, not in the original 13 routes. Contents: current streak, longest streak, total solved, a calendar heatmap, per-pack progress. Reached from Settings and from a small link on the daily screen.

**"Nudge-free solves" is deliberately not displayed** — showing it would imply using nudges is worse, which contradicts the paid-hint model and the no-shame principle. It is tracked locally and never leaves the device; with no analytics, nobody ever sees it. Keep it anyway — it costs nothing and would matter if telemetry is ever added.

---

## 5. Clock tampering

Streaks use the same high-water-mark guard as the daily puzzle (`systems/storage-persistence.md` §5). Since only one daily puzzle can be solved per real day, and the guard clamps forward jumps to one day, a user cannot manufacture a streak by advancing the clock.

Backward clock movement is ignored — `lastDailyDate` never moves backwards.

This is a soft guard, not a security control. It is proportionate: there is nothing to win.

---

## 6. Interaction with notifications

The daily reminder is the only notification in the product.

- Local only, via `expo-notifications`. No push server.
- Fires at `prefs.reminderTime` (user-chosen, default 08:00) — **the current spec has no UI for choosing this and needs one.**
- Cancelled and rescheduled whenever the time changes or the daily is solved early
- Never fires on a day the user has already solved the daily
- Copy pool is invitational and rotates; no streak references (§3)
- Never contains a price, an offer, or a shop link (`systems/monetization.md` §6)
- At most one per day, no re-engagement escalation ladder, no "we miss you" after a lapse

> Notification opt-in rate and effect on retention are unmeasurable without analytics. Set the defaults thoughtfully and leave them alone.

---

## 7. Testing requirements

- Solving on consecutive days increments correctly across a month boundary and a DST boundary
- Missing one day with a rest day available continues the streak, and consumes exactly one rest day
- Missing one day with no rest day available resets to 1 on the next solve
- Missing many days resets to 1, silently, with no announcement on launch
- Archive and pack solves neither increment nor break
- Advancing the device clock by 30 days does not produce a 30-day streak
- Rest days refresh correctly on the rolling window
- No streak UI anywhere uses a warning colour (visual review + snapshot test)
- Notification content contains no streak reference (string audit over the copy pool)

---

## 8. Open questions

- Is one rest day per 7 days the right generosity, or should it be one per calendar week?
- Should the daily screen show the streak at all, or reserve it entirely for `stats`? (Reserving it entirely is more on-brand and worse for retention.)
- Do milestone celebrations offer anything tangible (a free coin?), or stay purely emotional?
- If a second content locale ships, are streaks global or per-locale? (Also flagged in `systems/i18n.md` §6.)
