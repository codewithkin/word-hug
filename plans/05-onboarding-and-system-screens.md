# Plan 05 — Onboarding and the system screens

**Session 3.** Eight screens: the five onboarding steps and the three system
screens, plus the motion layer moving off moti onto Reanimated at the owner's
request mid-session.

Every screen todo is two checkboxes. **Only the first is ever mine** — see the
verification contract in `progress/00-START-HERE.md`.

---

## 1. Tokens

- [x] `f8faa55` code-complete — 11 new palette entries, both themes, read off the eight
      design files rather than derived from the existing palette
- [x] `node packages/tokens/scripts/emit-theme-css.mjs` re-run, `--check` passes
- [x] parity test passes: **56 tokens × 2 themes against 48 light + 36 dark screens**
- [x] new parity rule + tamper case, **made to fail once** (14 of 14 rules fire)

The new group, and why each one exists rather than reusing something:

| Token | light / dark | Why not an existing token |
|---|---|---|
| `stepDotInactive` | `#EBD9BB` / `#3D2874` | The onboarding pips and the loading dots. Nothing else in the palette is this. |
| `pillText` | `#9C8A73` / `#B6A4E4` | Label inside a raised pill — Skip, Nudge. |
| `textQuiet` | `#9C8A73` / `#8F79D4` | Eyebrow labels and the secondary text link. |
| `linkRule` | `#E4CFA8` / `#4A3193` | The 2.5px rule under that link. |
| `textWhisper` | `#B0A08A` / `#7C68B8` | Helper lines and timestamps — below `textFaint`. |
| `keyCapDim` + shadow + text | `#EFE1C4` `#DFCEA8` `#BFAE92` / `#2B1A5E` `#1B0F41` `#7C68B8` | A used letter key. Present, not gone. |
| `surfaceQuiet` + shadow | `#FFF0CE` `#E9D6A8` / `#2B1A5E` `#1B0F41` | A recessive fill that is not a card. |
| `highlightWash` | `#FFECE6` / `#4A1F2E` | The tinted square behind the coral streak dot. |

**`pillText` and `textQuiet` are the same colour in light and two different
colours in dark.** That pair is the whole argument for this group existing: one
token for both would look perfect in light and be wrong in dark, which is
exactly the shape of the session-1 `onPrimary` bug.

### New parity rule (Pillar 6)

`design-parity.mjs` now fails when a dark value is byte-identical to its light
one, unless the key is in `SHARED_BY_DESIGN` — the amber, the teal, and the four
enamel ornaments, which really are shared on every screen in the export. Tamper
case `theme-value-copied` proves it fires.

---

## 2. Motion off moti (asked for mid-session)

- [x] `098dedc` code-complete — `components/motion.tsx` rewritten on Reanimated 4.5
- [x] `components/chunky.tsx`, `app/index.tsx`, `app/+not-found.tsx`,
      `app/token-probe.tsx` moved over
- [x] `moti` removed from `apps/native/package.json`
- [ ] **verified on device — OWNER RUNS.** Every animation in the app changed
      library. This is the single most likely thing in the session to be wrong.

Moti 0.30 advertises Reanimated 3 and this project is on 4.5, and none of it had
ever been run — so the app's motion rested on a version pairing nobody had seen
work. Reanimated is a hard dependency either way, being what moti calls.

The spec objects kept their shape: `MOTION.settle` still describes the same
spring. New in the file: `animate()`, which turns a spec into an animation so no
screen imports `withSpring` itself; `Land`, replacing the ad-hoc `MotiView`
entrances; and `Fade`, for the loading dots.

**`pnpm install` is needed before this builds** — moti is gone from the manifest
and the lockfile still has it.

---

## 3. Onboarding — 5 of 5

- [x] `77caf23` code-complete — `04-welcome` → `app/onboarding/welcome.tsx`
- [x] code-complete — `05-try-the-game` → `app/onboarding/try-the-game.tsx`
- [x] code-complete — `06-the-ritual` → `app/onboarding/ritual.tsx`
- [x] code-complete — `07-notification-priming` → `app/onboarding/notifications.tsx`
- [x] code-complete — `08-drop-in` → `app/onboarding/drop-in.tsx`
- [ ] verified on device, both themes — OWNER RUNS. Do not tick this yourself.

Shared: `components/onboarding-chrome.tsx` (step dots, Skip, help button,
title/body block, letter tile), `components/actions.tsx` (the amber button and
the quiet link), `components/wordmark.tsx`.

Step 5 has no Skip. That is the design, not an omission: START and Skip would go
to the same place.

---

## 4. System screens — 3 of 3

- [x] `39e6266` code-complete — `01-loading` → `app/loading.tsx`
- [x] code-complete — `02-error` → `components/error-view.tsx`, routed at
      `/error` **and** wired as the root layout's `ErrorBoundary`
- [x] `03-not-found` was already built (session 2)
- [x] splash background colours set in `app.json` from `splash-{light,dark}`
- [ ] verified on device, both themes — OWNER RUNS. Do not tick this yourself.

The splash **image** is still the template's PNG. The design is the wordmark on
`#FFF4E2` / `#1A0F38`; the colours are now right and the artwork is not. That
needs an exported asset, which is the owner's to produce.

---

## 4b. Overlay A and the puzzle variants (added late in the session)

- [x] `d675a68` code-complete — `a-solve-celebration` → `components/solve-celebration.tsx`,
      presented at `/celebration` as a **transparent modal**
- [x] `41bb215` code-complete — `11-archive-puzzle` → `app/archive-puzzle.tsx`
- [x] code-complete — `14-pack-puzzle` → `app/pack-puzzle.tsx`
- [x] shared board extracted to `components/puzzle-board.tsx`
- [x] 6 more tokens: `overlayWash`, `solvePanel`, `solvePanelShadow`,
      `accentText`, `submitIdle`, `submitIdleText` — 62 × 2, parity green
- [ ] verified on device, both themes — OWNER RUNS. Do not tick this yourself.

Three decisions worth keeping:

**The celebration is an overlay, not a screen.** The design redraws the clue
cards underneath because a static mockup has nothing to sit on. A transparent
modal keeps the real board mounted, so `overlayWash` (0.93 / 0.94 of the ground)
fades the actual answer. `backdrop` is the wrong token — that is a dimming scrim
for sheets; this is a near-opaque sheet of the ground itself.

**`accentText` exists because dark cannot reuse `accent` for type.** #17A398 on
the #2A1B58 panel is unreadable; the design brightens it to #2ED3C0. Light uses
the teal unchanged. Another instance of the pair-differently rule.

**Daily was NOT refactored onto the shared board.** Its tiles are fixed-width and
centred where 11 and 14 flex, and its header is coins-and-streak. Folding it in
before any of the three has been seen running would be inventing a shape rather
than finding one.

---

## 4c. Settings, How to Play, Stats

- [x] `cb45719` code-complete — `16-settings` → `app/settings.tsx`
- [x] code-complete — `17-how-to-play` → `app/how-to-play.tsx`
- [x] code-complete — `18-stats` → `app/stats.tsx`
- [x] shared `components/screen-header.tsx`; the puzzle header's "?" now routes
      to How to Play
- [x] 8 more tokens — 70 × 2, parity green, `toggleTrackShadow` added to
      SHARED_BY_DESIGN with a reason
- [ ] verified on device, both themes — OWNER RUNS. Do not tick this yourself.

**Three teals now.** `accent`, `accentText` and `accentMid` are all #17A398 in
light; dark splits them into #17A398, #2ED3C0 and #1FBFB0. Anyone reading only
the light designs would merge all three and be right about half the app. Same
story for `highlight` / `highlightText` (#FF6B4A in light, #FF7F5F for type in
dark).

**What Settings does not have** is the point of it: no account, no sign-in, no
sync, no data toggles, no notification categories. Nothing to opt out of because
nothing is collecting anything (rule 5). It fits on one screen.

**How to Play's caveat card is the load-bearing one** — "the answer can sit
before or after a clue, and it won't always be the same side for all three" — and
it is why the compound rows put the shared word in a centre column with the clue
on the side it joins. That layout is the explanation; do not "tidy" it into a
left-aligned list.

---

## 5. Recorded divergences

| # | Design | What was done instead | Why |
|---|---|---|---|
| D5-1 | `05-try-the-game` empty answer tile is `#F6E9CE` / `#2E1D63` with an inset at 0.22 / 0.35 | Reused `answerTileEmpty` (`#F3E3C4` / `#251652`, 0.18 / 0.28) | Same role, same shape, two shades apart. Follows the session-2 precedent set by the same call on `03-not-found`. Two near-duplicate tokens for one role is how a palette stops being a palette. |
| D5-2 | `06-the-ritual` idle day chip text `#C0AE95`; `02-error` dropped tile text `#B4A183` | `#C0AE95` written inline on its screen; `#B4A183` reused `textWhisper` (`#B0A08A`) | Both pair with the SAME dark value (`#7C68B8`), so they are one role with three light values. The one that differs most keeps its own value inline. |
| D5-3 | The designs set `font-weight:900` on eyebrows, pill labels and the Skip label | `font-wh-heavy`, which is the 800 face | Baloo 2 has no 900 face (D-003, session 2). Unchanged and unavoidable. |
| D5-4 | `05-try-the-game` active answer tile uses `inset 0 0 0 3px #FFB020` | A 3px border | React Native has no inset box-shadow. A ring drawn as a border is the same pixels with none of the risk. |
| D5-5 | `01-loading` shows one amber dot and two inactive | The amber travels, 420ms per step, 260ms crossfade | A still frame of a loading screen is one moment of something that moves. Both colours are the design's; only which dot is amber changes. |
| D5-6 | Status bar, notch and home indicator are drawn on every screen | Safe-area insets | D-001. They are the device mockup's chrome, not UI. |
| D5-9 | `18-stats` heatmap cells come from a template loop (`{{ h.bg }}`) whose data is not in the export | Two states only, taken from the legend the design does draw: `answerTileEmpty` and `accentMid` | The data is not in the file. If the real design has intermediate shades this needs a third value — flagged in `progress/05-known-issues.md` §7. |
| D5-10 | `16-settings` never draws a toggle in its OFF state | Invented: track becomes `surfaceQuiet`, knob keeps its colour, 24px slide | The design has three toggles and all three are on. The only invention in the session; flagged for the owner to judge. |
| D5-11 | `18-stats` uses `grid-template-columns:repeat(7,1fr)` | Five explicit rows of seven flexed cells | React Native has no grid, and percentage widths cannot account for the gaps — seven 1/7 cells plus six 7px gaps overflow and reflow to six per row. |
| D5-8 | `11`/`14` empty answer tiles are `#F6E9CE` / `#2E1D63` | Reused `answerTileEmpty`, as D5-1 | Same call, same reason, third screen. |
| D5-7 | Colours that appear on exactly one screen (`07`'s "now", preview body and idle chip text; `05`'s hint bar text) | Written inline with the hex pairs and a comment | Light and dark pair them differently from every existing token. Naming them would imply they are shared. |

---

## 6. Judgement calls made in the owner's absence

1. **Onboarding is not gated behind a first-launch flag.** `react-native-mmkv`
   is installed and unused; putting the app's most-used screen behind an
   unverified five-screen flow before anyone has seen it run is the wrong order.
   The flow is reachable from a temporary link row on the Daily screen, next to
   the token probe link, and all of it comes out together.
2. **The temporary link row grew** to Probe / Onboarding / Loading / Error. A
   screen with no route into it cannot be looked at, and the owner runs
   everything in one pass.
3. **Step 5's → button advances the flow** rather than checking an answer. There
   is no input layer yet; the button's real job is "I am done here".
4. **ALLOW asks the OS for notification permission** (lazily imported, wrapped
   in try/catch) and continues either way. A refusal is not a failure state.
   The chosen time is local state and is not persisted — that needs storage.
5. **The error screen shows `error.message` in `__DEV__` only.** "That didn't go
   to plan" is right for a player and useless for whoever has to fix it.
6. **The `AnimatePresence` exit on a letter was not ported.** Nothing unmounts a
   letter yet, and an exit path that cannot be exercised is an untested one.
7. **`expo-splash-screen` gained a plugin block in `app.json`**, which is a
   native config change and therefore needs the prebuild the owner is doing
   anyway.

---

## 7. Verification actually run this session

| Check | Result |
|---|---|
| `emit-theme-css.mjs --check` | PASS |
| `emit-theme-css.mjs --tamper` | PASS |
| `design-parity.mjs` | PASS — 56 tokens × 2 themes, 48 light + 36 dark screens |
| `design-parity.mjs --tamper` | PASS — **14 of 14** rules fired |
| `tsc --noEmit`, 22 files | **PASS — zero errors** |

The typecheck could not be run in the repo: `tsc` there is I/O-bound and does not
finish inside a command's time budget. It was run instead against a copy of the
source with the real `.d.ts` declarations on local disk — react-native,
expo-router, Reanimated, uniwind, heroui, safe-area-context, svg. The method is
written down in `progress/00-START-HERE.md` so the next session can repeat it in
five seconds rather than rediscovering it.

Two caveats on that run, stated plainly: `@expo-google-fonts/baloo-2` was stubbed
(it affects `theme/fonts.ts` only, which session 2 wrote and did not change), and
the config mirrors `expo/tsconfig.base` rather than extending it. Neither touches
any of this session's screens.

**A clean typecheck is not a running app.** Nothing here has been seen — and
`progress/05-known-issues.md` is the list of the specific ways it is most likely
to be wrong, written while the code was fresh.

---

## 8. Commits

Branch **`session-3-screens`**, eight commits, one per todo:

| SHA | Todo |
|---|---|
| `f8faa55` | tokens: 45 → 70, plus the identical-across-themes parity rule |
| `098dedc` | motion off moti onto Reanimated 4.5 |
| `77caf23` | onboarding, all five steps |
| `39e6266` | loading, error, splash colours |
| `d675a68` | overlay A, the solve celebration |
| `41bb215` | archive and pack boards on a shared component |
| `cb45719` | settings, how to play, stats |
| `ac1ec74` | routes and the temporary link row |

**`progress/` and `plans/` are gitignored**, so none of these docs are in those
commits. That is the owner's session-1 decision, not an oversight — but it does
mean this file, `03-screen-status.md`, `05-known-issues.md` and the changelog
exist only on disk. Back them up separately from git.

Two things about committing here, for the next agent:

- `git` cannot unlink on this filesystem, so every command leaves a `.lock`
  behind that blocks the next one. Work around it with
  `export GIT_INDEX_FILE=/tmp/wh.index` (keeps the index lock off the mount)
  and move `.git/HEAD.lock` aside between commits. The leftovers are in
  `.trash-session-3/locks/`.
- The working tree still carries sessions 1–2's uncommitted work. It was left
  alone: mixing it into these commits would have made the session-3 diff
  unreadable, which is the whole point of committing at all.
