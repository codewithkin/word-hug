# Known issues — things that are expected to be wrong

**Written across sessions 3 and 4. Nothing here has been seen running.** These are
the specific places the build is most likely to break, ranked by how much they cost
if they are real, with what to look for and where the fix goes.

**Read this before debugging anything.** Most of it fails in a way that looks
like something else.

**Last updated: end of session 5.** Items 2 and 5 are RESOLVED and kept below with
their resolution, so nobody re-fixes them or wonders where they went.

**Session 5 note — the build itself was broken, and that is now fixed.** Session 5 had
network access for the first time and ran the tooling instead of reasoning about it:
`expo prebuild` crashed outright on session 4's `app.json`, and the committed
`android/` folder was voiding every config property EAS reads. Both are fixed;
`progress/02-dependencies.md` §7 has the detail. **Everything below is still unseen** —
none of it is about the build config, all of it is about what the screens do once they
render, and running the app is still the only way to find out.

Session 5 also established two things that make debugging cheaper:

- **`npx tsc -p tsconfig.check.json --noEmit` runs in about 3 seconds and is clean.**
  Not 90+ seconds — that estimate came from a sandbox with no real `node_modules`. The
  scratch-directory-and-stubs method described in `00-START-HERE.md` is obsolete; run
  the real typecheck. It now covers `lib/` too.
- **Autolinking is healthy under pnpm.** All 11 community native modules resolve. If a
  native module is missing at runtime, that is not the first thing to suspect.

---

## 1. `className` on a Reanimated `Animated.View` — CATASTROPHIC IF REAL

**What:** `ChunkyPressable`, `Appear`, `Land` and `Fade` all pass `className` to
`Animated.View` from `react-native-reanimated`. uniwind augments React Native's
own `ViewProps` type, so TypeScript is happy either way — that proves nothing
about runtime.

**How it fails:** every raised surface and every animated block in the app loses
its styling at once — no colours, no radii, no sizes, possibly no layout. It will
look catastrophic and be a two-line fix.

**Why it is probably fine:** session 2 passed `className` to moti's `MotiView`,
which is also not a component uniwind owns, and uniwind exposes a runtime API
(`useCSSVariable`), so it is not purely a compile-time transform.

**Fix:** `components/chunky.tsx` and `components/motion.tsx`, both in one place
by design. Wrap: keep `className` on a plain `View` and put the animated style on
an `Animated.View` around it — watching for `flex-1` cases, where the wrapper
needs the flex rather than the child.

**Session 4 note:** this now affects far more of the app. `Appear` is used by every
one of the thirteen new screens, and `sheet.tsx`, `empty-state.tsx`,
`daily-chrome.tsx` and `notice.tsx` all pass `className` to it. Still one fix, but
the blast radius if it is wrong is now the whole product.

---

## 2. ~~`ch` units in `max-w-[28ch]`~~ — RESOLVED (session 4)

React Native has no `ch` unit. Replaced with point values in all four places:
260 for 28ch, 270 for 29ch, 310 for 34ch, in `components/error-view.tsx`,
`components/onboarding-chrome.tsx` and `app/+not-found.tsx`. New code in
`components/empty-state.tsx` uses the same 260, so **one correction on device
moves all of them**. Measure one on a real screen and change all five.

---

## 3. `letterSpacing` in `em` — LIKELY BROKEN

**What:** `tracking.label` is `0.18em`, `tracking.wide` is `0.06em`, and screens
also use `tracking-[0.05em]`, `tracking-[0.1em]` and `tracking-[0.12em]`. **React
Native's `letterSpacing` is in points, not ems**, and has no notion of relative
units.

**How it fails:** every uppercase eyebrow in the app loses its tracking and looks
cramped — "PUZZLE 128 · TUESDAY", "YOUR FIRST ONE", "MONDAY 10 AUGUST",
"TODAY'S HUG WORD", "STATS", "ARCHIVE". It will read as "the font is wrong"
rather than as a spacing bug.

**Fix:** if uniwind does not convert, change `tracking` in
`packages/tokens/src/index.ts` to points (0.18em at 12px ≈ 2.2pt; at 11.5px ≈
2.1pt) and re-run the emitter. Note that em-to-point depends on font size, so a
single token cannot serve every size — this may need to become per-preset.

---

## 4. `boxShadow`, inset and negative offsets — THE SESSION-2 BET

**What:** every raised surface uses `boxShadow: '0 4px 0 <colour>'` and every
sunken one uses `inset 0 3px 0` or `inset 0 -3px 0`. This needs React Native
0.76+ **on the New Architecture**.

**How it fails:** flat everything. The app looks like a paper prototype of
itself. Inset support is the more likely half to be missing.

**Session 4 note:** `newArchEnabled: true` is now set explicitly in `app.json`,
where before it was relying on the SDK default. That removes one way for this to
fail silently — but only after `prebuild --clean`.

**Fix:** `components/chunky.tsx` — one file, by design (D-004). The fallback is
an absolutely-positioned sibling `View` offset behind the content. Note that
session 4 added three shadows that do NOT go through `Chunky` (§9 below); those
need the same fallback applied by hand.

---

## 5. ~~Reanimated's Babel plugin~~ — RESOLVED (session 4), do not add babel.config.js

There is deliberately **no `babel.config.js`**, and adding one is not the fix if
animations are dead. Session 4 traced the resolution chain on the owner's machine:

```
expo/metro-config → @expo/metro-config → babel-preset-expo
                                          ├── babel-plugin-react-compiler  ✓
                                          └── @babel/core                  ✓
react-native-worklets/plugin  ✓   uniwind/metro  ✓   reanimated/metro-config  ✓
```

All resolve. `metro.config.js` already wraps the config with
`wrapWithReanimatedMetroConfig` inside `withUniwindConfig`, which is the correct
order. uniwind ships no Babel plugin at all (its exports are `.`, `/components`,
`/metro`, `/vite`, `/types`).

Worth knowing because it looked like a landmine: `app.json` sets
`experiments.reactCompiler: true`, and `babel-plugin-react-compiler` is declared
only in `apps/web`. Under pnpm's `node-linker=isolated` that would normally be
unreachable from `apps/native` — but pnpm linked it as a peer into both
`babel-preset-expo` instances, so it resolves. **If a future `pnpm install`
changes that, the symptom is a Metro error naming `babel-plugin-react-compiler`,
and the fix is `npx expo install babel-plugin-react-compiler` in `apps/native`.**

---

## 6. Toggle OFF is invented — 16 Settings

The design only ever draws the three toggles ON. The OFF state (track becomes
`surfaceQuiet`, knob keeps its colour, 24px slide) is the one genuine invention
in session 3. Look at it and say whether it is right; there is no design to
check it against.

---

## 7. The Stats heatmap data is not in the export — 18 Stats

The design drives the 35 squares from a template loop (`<sc-for list="{{ heatLight }}">`)
whose data is not in the extracted HTML. The two colours come from the legend the
design *does* draw: `answerTileEmpty` for not-played, the teal for solved. **If
the real design has intermediate shades, this is wrong and needs a third value.**

**Session 4 note:** `/stats-empty` has the same problem and solved it differently —
its eight ghost squares run a **four-step** tint ladder read directly off the
export (#F3E3C4 → #F6EDDD → #F9F3E7 → #FCF8F0 in light). That is evidence the real
heatmap has intermediate shades too. Compare the two on device.

---

## 8. Session 4's own suspicions

- **`Sheet`'s bottom padding is computed, not the design's.** The design uses a flat
  44px; `components/sheet.tsx` uses `max(insets.bottom, 20) + 24`. On the phone the
  export was drawn at these land close; on a device with no home indicator the sheet
  may sit lower than intended.
- **`EmptyBody` gives its ornament slot `w-full items-center`.** The Stats heatmap
  needs the width; the archive tiles need the centring. If the heatmap renders zero
  width or the tiles render left-aligned, that line is why.
- **`/stats-empty`'s grid is two explicit rows of four**, not a wrapping row — a
  wrapping row with 9px gaps and percentage widths overflows and silently reflows to
  three per row. If it ever shows 3+3+2, something reintroduced the wrap.
- **`/archive-day-one`'s ghost tiles are fixed-width** (62/52/52/52), as drawn. On a
  phone narrower than the 390px export they will crowd rather than shrink.
- **The nudge rungs and coin tiers are flat `Pressable`s, not `ChunkyPressable`s** —
  the design gives them no elevation, so there is no press feedback at all. If that
  feels dead on device, it is faithful, not broken; say so and it can change.
- **Three overlays are `transparentModal`.** If a wash covers a black screen instead
  of the board underneath, `react-native-screens` is the place to look.

---

## 9. Three shadows that do not go through `Chunky`

`Chunky` resolves its shadow colour from a CSS variable, and a `dark:` class only
swaps colours — so a per-theme shadow **string** with no token can use neither.
These three read `useAppTheme().isDark` and pick the literal:

| Where | Light | Dark |
|---|---|---|
| `/caught-up` replay tiles | `inset 0 3px 0 rgba(160,130,80,0.22)` | `inset 0 3px 0 rgba(0,0,0,0.35)` |
| `/archive-day-one` ghosts | `inset 0 3px 0 rgba(160,130,80,0.16)` / `0.1` | `inset 0 3px 0 rgba(0,0,0,0.28)` / none |
| `/nothing-owned` pack card | `0 4px 0 #EBDCC2` | `0 4px 0 #170E36` |

If §4 turns out to be real, these three need the sibling-View fallback applied by
hand — `chunky.tsx` will not cover them. If a fourth one turns up, that is the
moment to add the pairs to `packages/tokens` instead.

---

## 10. The daily nudge — what to actually check (session 5)

`lib/notifications.ts` is new and is the only file that talks to
`expo-notifications`. Before session 5, ALLOW called `requestPermissionsAsync()` and
nothing else — **no Android channel was ever created, and nothing was ever
scheduled**, so on Android 8+ the permission could be granted and still no reminder
would ever arrive. That is the classic silent failure: the OS drops a notification
posted to a channel that does not exist, with no error anywhere.

What to check on device, in order:

1. **The prompt appears at all** when ALLOW is tapped on Android 13+. If it does not,
   the runtime permission did not merge — check the built APK's merged manifest, not
   `android/app/src/main/AndroidManifest.xml` (§4 of `02-dependencies.md`).
2. **Android Settings → Apps → Word Hug → Notifications** should list a single channel
   called **"Daily nudge"**. If it is absent, `initNotifications()` did not run or
   threw — everything in that file swallows its errors by design, so add a `console.log`
   rather than expecting a red screen.
3. **A reminder actually arrives.** The fastest test is to temporarily call
   `scheduleDailyNudge()` with the next minute, or swap the trigger for a
   `TIME_INTERVAL` one; the DAILY trigger cannot be waited out.
4. **Only ever one.** Re-running onboarding must not stack reminders — they share the
   fixed identifier `word-hug-daily-nudge` so a re-schedule replaces.

**Two judgement calls made without the owner**, both reversible in that one file:

- **A nudge arriving while the app is in the foreground is not shown as a banner**
  (`shouldShowBanner: false`, `shouldShowList: true`). A reminder to come and play,
  thrown over the board you are already playing on, is noise — rule 3. It is still in
  the tray. If it should interrupt, that is a one-line change.
- **The notification copy is a placeholder** — `"Today's three words are up."` The
  design shows it naming the day's three clue words, which needs the puzzle bank and
  cannot come from a string scheduled a day in advance. Flagged in the file.

**What is still missing, and why it is not a bug:** the chosen time is not persisted.
The OS holds the schedule, so the reminder itself survives — but Settings cannot show
or change it until `react-native-mmkv` is wired. That is the storage layer, still task 3.

---

## 11. Things that are NOT bugs — do not "fix" them

- **The Daily background is a three-stop radial gradient**, not `#FFF9EF`.
- **Three different purples on the dark board** (`#33206B`, `#4A3193`, `#3E2884`)
  where light uses white three times. Correct.
- **Three different teals** (`accent`, `accentText`, `accentMid`), all identical
  in light. Correct.
- **The submit arrow with no shadow at all** is the "not yet" state, not a missing
  elevation.
- **The alternate states' header has no streak pill** and has a help button, where
  the Daily screen has a streak pill and no help button. A real difference in the
  export, reproduced deliberately.
- **`/caught-up`'s empty tiles are lighter than every other board's.** Consistent
  across both themes, so read as deliberate.
- **A wrong guess changes nothing but one sentence.** The word stays typed, the
  arrow stays amber, no tile changes colour. That is rule 1, not an unfinished
  screen.
- **The empty 46px box on the right of the Settings/Stats/How-to-Play header** is
  what centres the title.
- **No status bar, notch or home indicator** is drawn anywhere (D-001).
