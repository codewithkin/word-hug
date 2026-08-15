# START HERE

You are picking up **Word Hug**, a cozy word puzzle game for iOS and Android built with Expo.
This file is self-contained. Read it fully before touching anything.

> Read `progress/AGENT-PROCESS.md` first — that is *how* work is done here.
> This file is *what* to build next.
> **`progress/03-screen-status.md` is which screens exist.** Check it before
> promising anything about a screen — it is the only file that tracks that.

**Last updated: end of session 5.**

## Where the project actually is, in one table

| Group | Done | Total |
|---|---|---|
| **System screens** | **3** | **3** |
| **Onboarding** | **5** | **5** |
| **Main app** | **6** | **10** |
| **Overlays** | **5** | **8** |
| **Alternate states** | **9** | **9** |

**28 of 35.** Session 3 built thirteen screens; session 4 built four overlays
(B, C, E, F), all nine alternate states, and the splash artwork, and finished
`app.json`.
**None of it has ever been run.** The full screen-by-screen breakdown is
`progress/03-screen-status.md`.

Only four screens are missing: **10 (Archive), 12 (Pack List), 13 (Pack Detail)
and 15 (Shop)** — the archive index and the paid surface. Three of those four
already have their empty/failure state built.

---

## The one thing to do before anything else

**The owner has an unverified build sitting in front of them, and it is now
twenty-eight screens deep.** Nothing in this project has ever been seen on a device.

So: if the owner has run it and reported anything, **that is the entire priority.**
It outranks every item further down this file. Bug reports are the only real signal
about appearance this project ever gets, and they arrive rarely.

**Session 5 found the build itself was broken and fixed it.** If you are reading this
because the owner tried session 4's instructions and hit a wall, that is why —
`expo prebuild` crashed on `app.json`, and separately, EAS was going to ignore the
whole of `app.json` anyway. Both fixed. `02-dependencies.md` §7 has the full account;
the two-line version is that a config key Android and iOS both read only accepts an
object on one of them, and that `apps/native/android/` was committed to git when it
should never have been.

If they have not run it yet, the thing to hand them is:

```
pnpm install                      # REQUIRED — session 5 added expo-asset

cd apps/native
npx expo prebuild --clean         # must succeed; it did not before session 5
npx expo run:android              # or: eas build --profile development --platform all
```

**Run `prebuild --clean` itself — do not substitute `expo config --type prebuild`.**
That was session 4's recommended smoke test and it *passes* on a config that makes
prebuild crash. It only evaluates the plugin chain; the image and manifest writers,
which is where the crash was, run only under prebuild.

**Never commit `apps/native/android/` or `ios/`.** This project is CNG: `app.json` is
the source of truth and the native folders are build output. When they are committed,
EAS Build silently stops syncing `plugins`, `icon`, `scheme`, `orientation`,
`userInterfaceStyle`, `ios` and `android` — and builds successfully, with the wrong app.

**The owner is on Windows.** `npx expo run:ios` cannot work there. iOS goes
through EAS Build, which is why `apps/native/eas.json` exists with a
`development` profile.

**iOS has never been prebuilt.** Session 5 verified Android end to end; there is no
`ios/` folder and no Mac in reach, so the first `eas build -p ios` is still the first
time that config meets Xcode. `ios.icon` is the part to watch — it is the key that was
moved.

Then, in the app, walk the temporary link row at the bottom of the Daily screen.
It is now **three labelled groups** — Screens / Overlays / States, 22 entries — and
all of it must be walked in **both themes**. Every row on the probe must say OK.
The link row is scaffolding and comes out the moment it has done its job.

**`progress/05-known-issues.md` lists everything that is expected to be wrong**,
ranked, with where each fix goes. Read it before debugging anything — most of it
fails in a way that looks like something else. The two that still lead:

1. **`className` on a Reanimated `Animated.View`.** If uniwind does not style
   components it does not own, every raised surface loses its colour at once.
   Two-line fix in `chunky.tsx` / `motion.tsx`.
2. **`letterSpacing` in `em`** — React Native measures it in points. Every
   uppercase eyebrow in the app would lose its tracking and read as a font bug.

The old #2 (`ch` units) and #5 (the Babel plugin) were both resolved in session 4.
Session 5 added §10, the daily nudge — what to check on device now that it does
something, and the two judgement calls made without the owner.

---

## The rule that comes before everything else

**Every screen you build, you build from its design file.** Not from tokens, not from
the PRD, not from the screens spec. Open `designs/extracted/<screen>.html` for the screen
you are building, in **both** themes, every time.

Precedence, highest first:

| Rank | Source | Authority |
|---|---|---|
| 1 | `designs/extracted/*` | What a screen looks like |
| 2 | `systems/*` | Why, and rules spanning screens |
| 3 | `packages/tokens` | Convenience for shared values. **May be incomplete.** |
| 4 | `plans/01-prd.md`, `plans/03-screens.md` | Behaviour and intent, never appearance |

**Five concrete traps, all of them found the hard way:**

1. The Daily background is `radial-gradient(115% 70% at 50% 0%, #FFE6B4 0%, #FFF4E2 58%,
   #FFF9EF 100%)` — a three-stop gradient with a warm glow at the top. Shipping it as
   `#FFF9EF` is plausible in code and wrong on the most-used screen in the product.
2. In dark, the clue card, the answer tile and the keycap are **three different purples**
   (`#33206B`, `#4A3193`, `#3E2884`) where light uses white for all three. Reusing
   `surface` for all of them looks perfect in light and wrong in dark.
3. `#20160C` is the most frequent dark background in the export and is the **device
   mockup's bezel**, not UI (D-001). So are the status bar, the notch and the home
   indicator drawn on every screen. Use safe-area insets instead of drawing them.
4. **Light and dark do not pair the same way.** `pillText` and `textQuiet` are one
   colour in light (`#9C8A73`) and two in dark (`#B6A4E4` / `#8F79D4`). Whenever two
   things match in the theme you are looking at, check the other one before naming
   them the same thing.
5. **A token that fits light may be the wrong token entirely.** Session 4 kept hitting
   pairs where the correct answer was `textMuted` in light and `textQuiet` in dark, or
   `clueSlotText` in light and `textSecondary` in dark. Always check both files before
   naming a colour, even when the light one is an obvious match.

Divergences from a design are allowed but never silent: they go in the plan file's
"Recorded divergences" table, and in the changelog. Session 4's five are in
`progress/04-changelog.md` §7.

---

## How verification works here — read this before ticking anything

**Decided by the owner, session 1. This applies to every agent from this point on.**

| Who | Does what |
|---|---|
| **You (agent)** | Code-level changes only. Write the code, typecheck it, run what logic tests you can. |
| **The owner** | Runs the app. Reports what is broken or wrong. |
| **You, next** | Fix what was reported. |

**You do not run the app. You never will.** Therefore:

- **Never claim a screen is visually correct.** You have not seen it.
- **The most you can honestly say is "code-complete, unverified".** Say exactly that.
- **Build as many screens as your context allows before handing over.** The owner runs
  them all in one pass, not screen by screen.
- Prefer the shared presets and components so a correction lands in one place rather
  than fifteen. This is why `Chunky`, `PuzzleGround`, `motion.tsx`, `actions.tsx`,
  `onboarding-chrome.tsx`, `sheet.tsx`, `notice.tsx`, `daily-chrome.tsx` and
  `empty-state.tsx` exist.

---

## What is already built

| Area | State |
|---|---|
| Design source | ✅ 8 raw bundles in `designs/`, **untracked — owner's decision** |
| Design extraction | ✅ `designs/extract.mjs`. 92 per-screen files. |
| Product docs | ✅ `plans/01-prd.md`, `03-screens.md`, `00-spec-critique.md`, `99-backlog.md` |
| Systems docs | ✅ 5 docs in `systems/` |
| Content validator | ✅ `scripts/puzzle-check.mjs` — proven on two controls |
| Decision log | ✅ `systems/09-decisions.md`, D-001…D-005 |
| Token package | ✅ `packages/tokens` — **70 tokens × 2 themes**, all read from designs |
| Parity test | ✅ **14 rules**, each provably able to fail (`--tamper`) |
| Tokens wired to UI | ✅ Generated CSS, imported, heroui re-pointed. UNVERIFIED. |
| Fonts | ✅ Baloo 2, two faces. There is no 900 — see below. |
| Motion | ✅ Reanimated 4.5 directly. moti removed session 3. UNVERIFIED. |
| **`app.json`** | ✅ **Fixed session 5, and prebuild now actually passes.** All 9 icon assets wired, notifications plugin, newArch, portrait, runtimeVersion, EAS updates. |
| **Splash artwork** | ✅ **Generated session 4** from the design at 5x, both themes. |
| **`eas.json`** | ✅ `apps/native/eas.json`, `development` profile. Needed for iOS — owner is on Windows. |
| **Android prebuild** | ✅ **Verified session 5.** Generates cleanly; manifest, splash, notification icon and `updates.ENABLED=true` all confirmed in the output. |
| **iOS prebuild** | ⚠️ **Never run.** No Mac in reach. First `eas build -p ios` is the first real test. |
| **Daily notification** | ✅ **Works as of session 5** — `lib/notifications.ts`. Channel, permission, real DAILY schedule. Unverified on device. |
| Screens | ✅ 28 of 35 — all **code-complete, unverified** |
| Puzzle bank | ❌ Zero puzzles written |
| Game logic | ❌ None. Every screen is static; content is hard-coded. |
| Storage | ❌ `react-native-mmkv` installed, unused. No first-launch flag, no solves, no streak. **Now the one thing blocking the notification time from being remembered.** |

---

## How the styling layer works, in one page

```
packages/tokens/src/index.ts          ← the ONLY place values are written
        │  node packages/tokens/scripts/emit-theme-css.mjs
        ▼
apps/native/theme.generated.css       ← --whv-* raw values per theme
apps/native/theme/token-map.generated.ts   ← literal classNames for the probe
        │  @import in apps/native/global.css, AFTER heroui-native/styles
        ▼
   bg-wh-primary, text-wh-clue-text, rounded-wh-card, font-wh-bold …
```

- **Never edit the two generated files.** Edit the tokens and re-run the emitter.
- **The import order in `global.css` is load-bearing.** Both heroui and the generated
  file write into `@layer theme`, later wins, and that is what re-points heroui's
  `--background` / `--surface` / `--foreground` at the Word Hug palette.
- **`--whv-*` is raw, `--wh-*` / `--color-wh-*` is public.** They must not share a name.
- **Gradients are not colours.** All 74 gradients in the designs are radial; none are
  linear. Drawn by `components/puzzle-ground.tsx` with `react-native-svg`.
- **Type is families, not weights.** `font-wh-bold` sets a `fontFamily`. **Baloo 2 has
  no 900 face** — `face.heavy` is the 800 face (D-003).
- **The elevation is a hard offset with zero blur** (D-004), all through `chunky.tsx`.
- **Tailwind only emits a class it can see as a literal string.** Pass whole
  classNames as props; never build one by concatenation.

### A shadow is a string, not a colour

Session 4's one new gotcha, hit three times. `Chunky` carries an offset shadow by
resolving a CSS variable, and a `dark:` class only ever swaps a colour. So a shadow
that differs between themes and has **no token** — the replay tiles in `/caught-up`,
the archive ghosts, the locked-pack card — can go through neither. Those read
`useAppTheme().isDark` and pick the literal. If a fourth turns up, that is the moment
to add the pair to `packages/tokens` instead.

---

## How the motion layer works

`components/motion.tsx` is the only file that imports an animation library.

- `MOTION` holds the specs — `settle`, `press`, `release`, `land`, `calm`. **Screens
  never import `withSpring` themselves.**
- `Appear` is the house entrance. `Land` is the one entrance allowed to overshoot.
  `Fade` crossfades on a prop. `Breathe` is the caret, and the only loop in the app.
- Rule 1 constrains motion harder than colour: no shake, no flash, no failure
  bounce, no countdown, nothing that implies a clock.
- **Reanimated 4.5's worklets plugin resolves through `babel-preset-expo`.** Verified
  session 4 — there is deliberately no `babel.config.js`, and adding one is not the fix
  if animations are dead.

---

## Read this before you write a line

**Your sandbox is not the same as the last one. Test these; do not trust the table.**
Sessions 1–4 all ran under limits that session 5 did not have, and four sessions of
workarounds were built on top of them. Spend the first two minutes finding out which
world you are in — it changes what the session is worth.

| Capability | Sessions 1–4 | Session 5 |
|---|---|---|
| npm registry / `pnpm install` | ❌ 403 | ✅ works |
| `rm`, `git`, commit, push | ❌ | ✅ all work |
| `npx expo prebuild`, `expo-doctor` | ❌ never run | ✅ both run |
| `tsc` against real declarations | ❌ ~90s, killed | ✅ **3 seconds, clean** |
| Command timeout | ~45s | minutes |
| **Run the app** | ❌ | ❌ **still never** |

The last row does not change and is not a sandbox limit — it is the verification
contract above. **You do not run the app.** Everything else, try it.

- **`designs/*.html` are bundled pages.** Run `node designs/extract.mjs` and read
  `designs/extracted/`. Never edit the raw files.
- **`apps/native/_to_delete/` exists** because earlier sessions could not delete files.
  If `rm` works for you, it is safe to clear.

### Typechecking

```
cd apps/native && npx tsc -p tsconfig.check.json --noEmit
```

**Three seconds, and it was clean at the end of session 5** — including `lib/`, which
session 5 added to the include list. Against the real declarations, so unlike the old
stub method it does catch whether `className` is genuinely accepted by a component,
whether a style key exists on `ViewStyle`, and Reanimated's generics.

If your sandbox cannot reach the registry and has no `node_modules`, the session-4
scratch-directory-and-stubs method is in the git history of this file. It was a
workaround for a limit that turned out not to be universal — check first.

---

## Your task, in order

1. **Whatever the owner reported.** See the top of this file. Always first.
2. **If the probe is all-OK in both themes:** delete `app/token-probe.tsx` and the
   temporary link row at the bottom of the Daily screen.
3. **The storage layer.** `react-native-mmkv` is installed and unused. It unlocks the
   first-launch flag that gates onboarding, solves and the streak — and it is now the
   *only* thing between onboarding step 4 and being finished. As of session 5 the
   reminder is really scheduled with the OS, so it survives without us; what is still
   missing is that nothing remembers **which** time was chosen, so Settings cannot show
   it or change it. `lib/notifications.ts` already exposes `scheduleDailyNudge` and
   `cancelDailyNudge` for that screen to call.
4. **Real game state** — input, the guess, the gentle nudge. **All nine alternate
   states now exist to build against**, which is the point of having done them first:
   `/wrong-guess` and `/near-miss` are the two branches the guess handler produces,
   and `/solved-today` and `/caught-up` are the two the day handler produces. Fold
   them into their parent screens and delete the routes.
5. **Fold the Daily board into `components/puzzle-board.tsx`** — but only once 11 and
   14 have been seen running.
6. **Generate the puzzle bank.** The validator is proven; the bank is empty.
7. **Screens 10, 12, 13, 15 and overlays D, G, H** — the archive index and the paid
   surface, with RevenueCat. The empty states are already built, so what is left is
   the populated versions. **Every price in the app is currently hard-coded and must
   come from RevenueCat** — see `04-changelog.md` §7.

---

## What Word Hug is, in five rules

1. **Never punish.** No timers, no penalties, no failure states. A wrong guess gets a gentle
   nudge — no red, no shake, no sound, no attempt counter.
2. **Never gate daily play.** The daily puzzle is free, always, forever.
3. **Never interrupt the solve.** No ads, no upsells, no prices on any puzzle screen, in
   onboarding, or in the solve celebration.
4. **Works offline.** The core loop never requires a network connection.
5. **Anonymous by default.** No accounts, no analytics, no telemetry beyond install counts.

Sessions 3 and 4 put several of these in writing inside the product — "no timer, no
score, no way to lose", "miss a day and nothing is taken from you", "Today's puzzle is
still yours to solve without them", "there's nothing to buy today", "Replays don't
change your streak". If a later change makes one of those lines untrue, **the line is
not the thing that was wrong.**

---

## Where things are

| Path | What | Tracked |
|---|---|---|
| `designs/*.html` | Raw design exports, source of truth | No — deliberate |
| `designs/extracted/` | Readable per-screen files | Gitignored |
| `plans/`, `systems/`, `progress/` | Docs and memory | Gitignored |
| `progress/03-screen-status.md` | **Which screens exist.** Update it when one does. | Gitignored |
| `progress/05-known-issues.md` | **What is expected to be wrong.** Read before debugging. | Gitignored |
| `packages/tokens/src/index.ts` | Every design value | Tracked |
| `apps/native/theme.generated.css` | Generated. Do not edit. | Tracked |
| `apps/native/components/` | The shared spine — `chunky`, `motion`, `puzzle-ground`, `puzzle-board`, `actions`, `onboarding-chrome`, `screen-header`, `wordmark`, `error-view`, `sheet`, `notice`, `daily-chrome`, `empty-state` | Tracked |
| `apps/native/lib/notifications.ts` | **The only file that talks to `expo-notifications`.** Channel, permission, daily schedule. | Tracked |
| `apps/native/android/`, `ios/` | **Build output. Never commit these** — it makes EAS ignore `app.json`. | No — enforced |
| `apps/native/app/onboarding/` | The five steps | Tracked |
| `apps/native/app.json`, `eas.json` | Build config. Complete. | Tracked |
| `apps/native/_to_delete/` | **Things an agent could not delete. Safe to remove.** | No |
| `scripts/puzzle-check.mjs` | Content validator | Tracked |
| `apps/web` | Marketing site + privacy/terms/support | Tracked |

**Settled — do not reopen:**

- `designs/` stays **untracked**. Owner's decision, session 1.
- The owner runs the app; agents make code-level changes only.
- On a judgement call, take the recommended option, keep moving, and collect every one
  into a single visible list at the end of the session.

---

## The test

> **A tired parent has four minutes before someone needs them again.
> Does what you just built make that four minutes better, or does it ask something of them?**

If it asks something — a decision, a purchase, a streak to protect, a countdown — it is wrong,
however good it looks.
