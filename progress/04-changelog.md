# Changelog

Newest first. This is where the *reasoning* lives — git has the file list.

---

## Session 8c — the hint ladder sold again, live billing wired

Two reversals, one of them of this project's own decision from the previous
session, which is the honest thing that happens when someone finally plays the
game.

### D-010 — the category is a product, so it is sold

Session 8b printed the category on every board and retired tier 1, reasoning
that a free hint behind a `?` button reads as a charge nobody taps. The
diagnosis was right and the cure was worse: with the category free, coins had
one sink left, and **a currency with one remaining sink is not much of a
currency**. The owner reversed it within a day of playing.

The chip, its prop chain and `categoryChip()` are gone. Tier 1 is back, priced,
ladder now 1/2/3 against 3 install coins plus 1 daily coin — roughly one hint a
day. Teal position feedback stays free; it is feedback about the guess you made,
not a hint about the answer you have not. Tier integers were never touched —
they are storage keys, through both directions of this flip.

`daily-loop-check` guards both halves: no screen prints or passes the category,
tier 1 exists at cost 1, prices ascend 1/2/3 with no free entry. Verified by
re-injecting `cost: 0` and watching two checks go red.

### Live billing

The dashboard work landed on the owner's side — products created straight in
Play Console and imported into RevenueCat, entitlements extended across stores,
bundle attached to all five entitlements, default offering complete. Code side:
`extra.revenueCatKeys` replaces the single key, Android pointing at the live
Play app (`goog_…`, app id `app05dac30f80`), iOS an explicit empty slot until an
App Store app exists — configuring against the wrong platform's key would fail
in ways nobody needs to debug.

### Docs told the truth

`systems/monetization.md` still described the PRD's unbuilt design (`wh_*`
ids, `hug_club`, restorable coins). Rewritten to shipped reality — identifiers
as the dashboard actually spells them (spaces included), coins local-only,
restore brings packs but never coins. `release-playstore.md` records what is
done and the EAS lesson below.

### Also recorded here: why the first EAS production build died

`ERR_PNPM_OUTDATED_LOCKFILE`: a `package.json` edit landed without its
regenerated lockfile, and CI installs with `--frozen-lockfile`. The build also
ran from a dirty tree (the `*` on the SHA). Rule now written into the release
guide: **lockfile commits ride along with dependency edits; push; build clean.**

---

## Session 8b — recorded late

The session that ended twice on usage limits; its reasoning lives in
`05-known-issues.md` §17 and `02-dependencies.md` §8, so only the shape is
repeated here. Two bugs found by the owner playing: `EYE` offered one E because
`keysFor` used distinct letters (77 of 300 answers affected), and a dependency
audit that scanned JS imports deleted `shadcn` — imported only by CSS
`@import` — killing the Docker build. Both fixes carry hardened checks, and
both failures are the same species: **a check asking a slightly wrong question
passes forever.** The store listing copy went to
`systems/store-listing.md`; the PowerShell command rules went to
`AGENT-PROCESS.md` §5b after a whole command list failed on bash syntax.

---
## Session 8 — monetisation, difficulty, and two features removed

The longest session so far, and the one that removed the most. Three things the
project believed about itself turned out to be wrong, and the wrong ones were
load-bearing.

### Hearts are gone (D-006)

Built last session, deleted this one. The argument that settled it was not
"rule 1" — it was that **an energy meter exists to end the session**, and the
plan is ad-supported. Ad inventory is a function of time in the app, so hearts
were spending the revenue they existed to protect. Two mechanics wanting
opposite things from the same player.

Deleted rather than flagged off. `heartsLost` became `wrongGuesses`: same
signal, counted and never charged, because the difficulty model needs it. The
four loop checks that policed heart *exemptions* now assert the mechanic does
not exist.

`app/onboarding/welcome.tsx` got its line back — "No timer, no score, no way to
lose" — which was pulled in 7c when hearts made it false.

### Level 1 was unplayable, and the check said it was fine (D-007)

The owner could not solve level 1. It was `book`: `__CASE / NOTE__ / __MARK`,
three different sentence frames on the first puzzle anyone ever sees.

The difficulty model scored **word frequency**, which for the answer slot is
partly inverted — `time` and `line` are top-100 English nouns and the two
hardest puzzles in the bank. `book` is common, so it scored easiest.

Worse: `scripts/level-check.mjs` asserted "the opening five are difficulty 1–2"
and **passed**. A check that reads its verdict from the same model that produced
the ordering cannot catch a wrong model; it can only confirm the model agrees
with itself. It now asserts content properties — same-side clues, household
compounds, a picturable answer — and `build-levels.mjs` throws rather than warns.
Verified by re-injecting the original bug.

Eight source rows were retuned so their clues sit on one side of the answer,
taking on-ramp-eligible puzzles from 4 to 10. Level 1 is now `bird`: birdcage,
birdsong, birdbath.

### RevenueCat, wired (D-008)

Nine products, five entitlements, one offering. The dashboard uses `wordhug_*`
and the app said `wh_*`, so nothing would have resolved.

Caught before it cost money: the bundle entitlement had all six products
attached, so buying one £1.99 pack would have granted all five. The fix is the
bundle product attached to each of the five pack entitlements instead — done on
the owner's side.

Coins are deliberately local. RevenueCat's virtual currency can grant a balance
but cannot spend one without a backend, so it would have been a second source of
truth that could not do the job. Trialled and removed the same session.

Two screens were lying and now are not: `/restore-result` promised coins come
back (consumables do not), and onboarding promised the archive (retired in 7c).

### Help that is always on (D-009)

The free hint was free and hidden — behind a `?` next to a coin balance, which
reads as a charge. The category is now printed on every board, and
correct-position letters go teal after a wrong guess. Both live in
`components/game-board.tsx`, which is what makes "everywhere" true.

`app/daily.tsx` still held a near-verbatim copy of the board that was extracted
*from* it in session 8. It now uses `GameBoard`, because adding both aids to a
duplicate would have meant maintaining two boards forever.

### Housekeeping that was overdue

- **Line endings.** `plans/01-prd.md` reported 542 insertions and 542 deletions
  in a session that never opened it. `.gitattributes` now pins LF.
- **The scaffolding link row is gone**, not `__DEV__`-gated. A dev-only
  affordance you look past every time is still an affordance you look past.
- **Build size.** Nine unused Expo modules with native code were removed — they
  were autolinked into the APK whether or not any JS imported them. Plus
  `@gorhom/bottom-sheet`, i18next, and sixteen unused shadcn components.
  `shadcn` (the CLI) was a runtime dependency of `packages/ui`.
- **The web app is real.** `wordhug.gamesforstrangers.lol` — landing, privacy
  and terms, on brand, plus a Dockerfile. Settings pointed at `wordhug.app`, a
  domain nobody owns; a store reviewer would have found that, not us.

### What is still not true

- 73 of 300 puzzles fail `pnpm validate:bank` — genuine dual answers and
  invented compounds.
- `pnpm levels:corpus` has never been run. The difficulty model's familiarity
  lists are authored, not measured.
- Nothing has ever been run on a device by an agent, as always.

---

## Session 7b — the remaining screens, and a verification tool that lied

### Every screen now exists

Screens 10, 12, 13 and 15 and overlays D, G and H were the last gaps from
session 3. All seven are built:

| | Route | Note |
|---|---|---|
| 10 Archive | `/archive` | Seven-day window. **No "missed" state and there must never be one** — a day you did not play looks like a day you have not played yet, which is what makes missing one cost nothing. |
| 12 Pack List | `/packs` | Owned and unowned rows are the same size and shape. A list, not an advert. |
| 13 Pack Detail | `/pack/[id]` | Contents visible whether or not it is owned — you see what you would be buying. |
| 15 Shop | `/shop` | Keeps the line "There's nothing to buy today." |
| D Welcome offer | `/welcome-offer` | **No countdown**, no strikethrough, no second chance. Nothing triggers it; reachable from the shop only. |
| G Restore result | `/restore-result` | Both outcomes, one sheet. "Nothing found" is not an error. |
| H Caught up | `/all-caught-up` | The end of the levels. Not `/caught-up`, which is the 09 alternate state. |

Packs are curated *views* over `content/levels.ts`, not a second bank — one
pipeline, one validator, and a pack cannot contain a level that does not exist
because the build would not typecheck.

### One board, three layouts

`AnswerTile`, `KeyCap` and `BackspaceKey` in `components/puzzle-board.tsx` are
now the only places a tile or a cap is drawn. There were three copies — Daily
at 56px/`h2`, the shared board at 54px/`h3`, onboarding step 2 with a third set
— which is why the owner saw the archive keys as smaller. The layouts still
differ, because the designs differ; the thing inside them does not.

### `scripts/nav-check.mjs`

Builds the navigation graph from source and asserts three things: no orphaned
routes, no broken links, and nothing more than two hops from home. It found
seven orphans and one trap on its first run — `/token-probe` was registered as
a modal with no explicit dismiss, which is a dead end on a device without a
back gesture.

It also found two bugs in itself, both of which reported live screens as
orphaned. Written down in the file, because a graph tool that under-reports
edges is worse than no graph tool.

### The verification tool that lied

**`npx tsc -p tsconfig.check.json --noEmit` returned exit 124 — a timeout —
and produced no output, which is indistinguishable from a pass.** Three
"clean" typechecks in a row were nothing of the kind, and a missing `Land`
import shipped through all three.

tsc reads several thousand files out of the pnpm symlink farm and on a mounted
filesystem it can stall completely; load average was 0.00 while it "ran".

`scripts/imports-check.mjs` is the response. It reads only the app's own 77
files, runs in well under a second, cannot hang, and catches exactly the class
of error that got through: a component used and never imported. **It is not a
typecheck and says so in its own output.** tsc is still the real check and
still has to be run somewhere it can finish.

---

## Session 7 — levels, hearts, and two rules deliberately broken

The owner played session 6's build and reported eleven things. All eleven were
real. Then, mid-session, they changed the architecture.

### The bugs, and what each one actually was

| Reported | Cause |
|---|---|
| Onboarding step 2's letters don't press | The screen was a picture of a board. No handlers, by design, since session 3. |
| The answer chip at the bottom is clipped | A 46px row holding ~50px of content — the chip's 3px offset shadow had nowhere to go. |
| Step 2's Nudge does nothing | Never wired. |
| Step 3 says Thursday on a Wednesday | The design's own Thursday, hard-coded. It would have said Thursday forever. |
| Step 3's streak icon is "just a circle" | It was: a coral dot with an inset shadow and no mark. |
| Step 4's "Other" does nothing | The design comment said so — "nowhere to go until there is a time picker". |
| The in-game nudge doesn't work | The picker was static content; nothing wrote a tier. |
| Nudge coins ≠ header coins | `nudge-picker.tsx` had `12` written into it. The header had the real balance. |
| Archive keys too small | 54px caps with `h3` type against Daily's 56px `h2`, on a row also carrying a fixed backspace. |
| Splash icon has a rounded corner eating the words | **Not ours.** Android 12+ masks the splash icon into a circle; a 720×505 wordmark cannot survive it. |

The splash one is worth keeping: the artwork is now padded into a 1024×1024
square with the wordmark scaled to fit inside the mask's safe circle, so the
OS can clip all it likes and there is nothing at the edges to lose.

### Two product rules broken on purpose

**Rule 1, "never punish", is no longer true, twice over, at the owner's
explicit instruction.**

1. A wrong guess is now red, shakes the board and buzzes. One switch:
   `WRONG_GUESS_FEEDBACK` in `lib/feedback.ts`.
2. Levels have hearts. A wrong guess costs one; at zero, guessing stops until
   regen or a refill. One switch: `HEARTS_ENABLED` in `lib/lives.ts`.

Both files carry the argument on each side and the exact line to change to
revert. Three exemptions are built into the heart rule and are load-bearing:
the daily puzzle is never gated (PRD rule 2), a replay never costs, and a near
miss never costs — charging for the one encouraging moment in the loop would
inverting its meaning.

**`app/onboarding/welcome.tsx` still says "No timer, no score, no way to lose."
That is now false and it is the second sentence a new player reads.** It needs
the owner's decision; it is at the top of `05-known-issues.md`.

### The architecture changed

Daily-only became level-based, with daily alongside it:

- **`content/levels.ts` — 100 levels**, generated by `scripts/build-levels.mjs`
  from `scripts/levels.source.mjs`. Difficulty is derived, never hand-written
  (PRD §3.2). Block means ramp 1.0 → 5.0.
- **`app/home.tsx`** — the level map, and the app's new front door. `/` is now
  a redirect; the daily puzzle moved to `/daily` and is a card at the top of
  the map.
- **`app/level/[n].tsx`** — one level, on the shared `puzzle-board`. That is
  the third caller of it, which is the generalisation `00-START-HERE` item 5
  was waiting for.
- **Streak counts either** — one level OR the daily keeps it alive
  (`advanceStreakToday`).

### The level analyser paid for itself immediately

`scripts/level-check.mjs` rejected the first ordering: block means of
2.80 → 3.20, which is a ramp on paper and a flat line in the hand. It also
found 13 pairs of levels giving each other away and two levels whose key row
was a bare anagram of the answer. All three are fixed in the generator rather
than the output — the ramp is 1.0 → 5.0, give-aways are down to 3, and
`keysFor` now guarantees at least one decoy.

**Still unchecked, and still the worst possible content bug: whether any level
has a second valid answer.** Only `scripts/puzzle-check.mjs` can say, and it
has never been run against any of the 142 puzzles now in the app.

---

## Session 6 — the game

**The owner ran the build. It opened straight onto the Daily screen, no onboarding,
and nothing on it responded to a tap.** Both were true, neither was a bug, and the
report was worth more than the four sessions of code it landed on.

### Nothing was broken; two layers had simply never been written

The buttons were dead because `app/index.tsx` had no `onPress` on any of them — the
file said so in its own header ("STATE: none... hard-coded on purpose"). Onboarding
did not show because nothing gated it; `app/onboarding/_layout.tsx` said so too. Four
sessions of screens had been built as a static gallery, deliberately, and session 6
is the one that turns the gallery into a product.

Worth recording because the failure mode was so convincing: an app where every
control is inert and the first-run flow never appears looks exactly like a broken
build, and it was a complete one.

### What landed

- **`lib/storage/`** — `keys.ts`, `schema.ts`, `index.ts`, implementing
  `systems/storage-persistence.md` §2–§5. Two MMKV instances, zod on every read, the
  clock-tamper high-water guard, and an in-memory fallback so a missing native module
  degrades to "forgets on relaunch" instead of a white screen.
- **`lib/dates.ts`** — the calendar maths, deliberately free of any React Native
  import so it is the one part of the loop testable in plain Node.
- **`content/daily.ts`** — 42 hand-written puzzles, six weeks, ordered to the PRD's
  weekly difficulty curve. **Unvalidated content** — see below.
- **`lib/puzzles.ts`** — the schedule (`EPOCH` = 2026-08-17, a Monday), guess grading,
  and the letter-key generator.
- **`hooks/use-daily-puzzle.ts`** — the loop, as four phases.
- **`components/solved-board.tsx`** — `app/solved-today.tsx`'s body, extracted so the
  Daily screen's `done` phase and the route render the same thing.
- **First-launch gating**, reminder persistence, and Settings toggles that now write.
- **`scripts/daily-loop-check.mjs`** — 229 checks, run with `pnpm check:loop`.

### Three of the four alternate-state routes are now branches

`/wrong-guess`, `/near-miss` and `/solved-today` are phases of `app/index.tsx`. The
routes still exist, because the scaffolding link row is still the owner's only way to
walk a state in both themes and the token probe has not been confirmed all-OK yet.
They are dead ends in the product and nothing navigates to them.

### The one place the designs and the PRD disagree, resolved towards the designs

PRD §2.2 says input is **free text**, "not a letter picker", and gives a real reason:
a picker reveals the answer length. Every 09 design — the daily board and all four of
its alternate states — draws a letter-key row and fixed answer tiles, which is a
picker. `00-START-HERE.md`'s precedence table puts `designs/` at rank 1 for
appearance and the PRD at rank 4, so the picker is what shipped, with decoy letters
in the key row so it is not simply an anagram.

**This is a product decision, not a code decision, and it is the owner's to reverse.**
Reversing it is not small: it changes the board, both guess states, the solved state,
screens 11 and 14, and it deletes `keysFor`.

### The bank is not validated content

`scripts/puzzle-check.mjs` was built in session 1 and proven on two controls, and it
has not been run against a single one of these 42 puzzles. The two things it checks
are exactly the two a human cannot: whether a **second** word also hugs all three
clues, and what the difficulty actually is. Every `difficulty` in `content/daily.ts`
is a placeholder chosen to fit the curve.

---

## Session 5 — the build was broken, and nobody could have known

**No screens built. The first build was not going to work, and now it does.**

Session 5 was the first session with a working npm registry and outbound network.
Every previous session's limits doc says the same three things — cannot install,
cannot run `pnpm`, typecheck takes 90+ seconds so use stubs — and **all three were
false here**. So the session spent itself running the tooling that four sessions had
only been able to reason about. That turned out to be the right call within about
ten minutes.

### `expo prebuild` crashed on the config session 4 called complete

```
TypeError: [android.dangerous]: withAndroidDangerousBaseMod: url.startsWith is not a function
```

Session 4 set the top-level `icon` to `{ light, dark, tinted }` — correct for iOS 18's
dark and tinted app icons, and the reason it was written that way. But **Android's icon
generator reads the same top-level key**: `getIcon()` is `config.android?.icon ||
config.icon`, and it hands whatever it finds to a function that calls `.startsWith()`
on it. An object has no `.startsWith`. Prebuild dies before writing a single file.

The fix is small — string at the top level, object under `ios.icon` — but the shape of
the bug is the thing worth keeping. **A config key that two platforms read and only one
of them accepts an object for.** It is invisible by inspection, it reads as obviously
correct, and it fails on the platform the owner was about to build first.

It also explains why `00-START-HERE.md`'s recommended smoke test did not catch it.
`npx expo config --type prebuild` **passes** on the broken config — it evaluates the
plugin chain and stops. The image writers, where this lives, only run under `prebuild`
itself. The advice has been corrected in `02-dependencies.md` §4: run the prebuild.

### The committed `android/` folder was quietly cancelling all of session 4

`apps/native/.gitignore` has listed `android/` and `ios/` for some time. But 36 files
under `apps/native/android/` were committed in `6a9d482` *before* that line existed,
and git keeps tracking what it already tracks. `expo-doctor` states the consequence
plainly: with native folders present, **EAS Build does not sync `scheme`, `orientation`,
`userInterfaceStyle`, `icon`, `ios`, `android` or `plugins` from `app.json`.**

Which is to say: the notification plugin, all nine icons, the splash, portrait lock and
`newArchEnabled` — session 4's entire output — would have been ignored, and EAS would
have built the original scaffold's Android project instead. `updates.ENABLED=false`, no
notification icon, Expo's placeholder launcher icon. **And the build would have
succeeded.** A green build producing the wrong app is a worse failure than a red one,
and it would have been blamed on the screens.

Untracked with `git rm -r --cached`. The project is CNG; the native folders are build
output and belong to `.gitignore`, which is what it always said.

### The notification dependency did not work, in the specific way native modules do not

ALLOW called `requestPermissionsAsync()` and nothing else. That is enough to make the
OS prompt appear, which is what makes it convincing — but **no Android channel was ever
created and nothing was ever scheduled**. On Android 8+ the OS silently drops any
notification posted to a channel that does not exist. Permission granted, prompt shown,
consent given, and no reminder would ever have arrived, with no error anywhere to
explain it.

`lib/notifications.ts` now owns all of it: the channel (created at startup, so it also
exists for anyone who installed before this), the permission request (which checks
`getPermissionsAsync` first and honours `canAskAgain`, so nobody is re-prompted into a
wall), and the actual `DAILY` schedule at the chosen time under a fixed identifier so
re-scheduling replaces rather than stacks. Every call sits behind a lazy import and
resolves to a benign value, keeping session 3's rule that **a refusal is not a failure
state and onboarding must never dead-end on one**.

Two things it deliberately does not do. A nudge arriving while the app is open is not
thrown over the screen — you are already playing, and rule 3 says do not interrupt the
solve; it goes to the tray instead. And the copy is a placeholder, because the design
has the notification naming the day's three clue words, which needs the puzzle bank and
cannot come from a string scheduled a day ahead. Both are flagged in
`05-known-issues.md` §10, both are one-line changes in one file.

The chosen time still is not persisted. The OS holds the schedule so the reminder
survives, but Settings cannot show or change it until the storage layer lands. That
boundary is now the only thing standing between step 4 and being genuinely finished.

### Smaller things

- **`expo-asset` was missing** — a required peer of `expo-audio`, and native. It had not
  bitten because nothing imports `expo-audio` yet, but finding it after the build is a
  second build, which is the one thing `02-dependencies.md` exists to prevent.
- **`android.edgeToEdgeEnabled` is gone from `app.json`** — Android 16 makes edge-to-edge
  mandatory and Expo now warns on the key. No behaviour change; every screen already
  works from safe-area insets (D-001).
- **A stray `app.json` at the repo root**, containing nothing but a duplicate EAS
  `projectId`. Deleted.
- **One real type error, fixed**: the temporary link row on Daily used `key={href}`, and
  `Href` widens to an object under typed routes.
- **`tsconfig.check.json` now includes `lib/`**, or the new module would have been
  outside the only check the project has.

### What was verified and is fine

Worth recording, because each of these was an open worry:

- **Autolinking under pnpm's `node-linker=isolated` works.** All 11 community native
  modules resolve, plus every Expo module. This was flagged as a real risk and is not one.
- **`POST_NOTIFICATIONS` is not supposed to be in the app manifest.** It ships in
  `expo-notifications`' own manifest and arrives via Gradle merge. `02-dependencies.md`
  §4 told the next agent to grep for it and panic; that grep is removed.
- **The typecheck is clean and takes 3 seconds**, against the real declarations — so the
  stub-based method in `00-START-HERE.md` can go. It was a workaround for a sandbox
  limitation that was never actually tested.
- **`expo-doctor` is at 19/21**, both remaining failures being the checks that need
  `api.expo.dev` and `reactnative.directory`, which the sandbox blocks.

### One gap in the record

**There is no session 4 entry in this file.** `00-START-HERE.md` cites "§7" of this
changelog for session 4's five recorded divergences and for the note that every price
in the app is hard-coded and must come from RevenueCat. That section does not exist —
it was never written, or was lost before it was committed. The divergences themselves
are recorded in the screen files, but if the owner has session 4's notes anywhere, this
is the file they belong in.

---

## Session 3 — thirteen screens, and moti out

**Thirteen screens built, 2 of 35 → 15 of 35.** All five onboarding steps,
Loading, Error, the solve celebration, the Archive and Pack boards, and
Settings, How to Play and Stats. The motion layer moved off moti onto
Reanimated mid-session at the owner's request. Nothing has been run; every screen is code-complete and
unverified, and that now includes the two from session 2, whose animations were
rewritten underneath them.

### Why the token group grew by eleven

The eight design files brought colours the palette had no name for, and the
reason they cannot be derived is worth writing down because it will recur.

`pillText` and `textQuiet` are **the same colour in light** (`#9C8A73`) and
**two different colours in dark** (`#B6A4E4` for a label inside a pill,
`#8F79D4` for standalone quiet text). Building from the light designs alone,
they look like one token. One token would have been perfect in light and wrong
in dark — the exact shape of the session-1 `onPrimary` bug, where the amber is
shared between themes and the text on it is not.

So the parity test gained a rule for that whole class: **a dark value identical
to its light one now fails**, unless the key is in `SHARED_BY_DESIGN` — the
amber, the teal and the four enamel ornaments, which really are shared on every
screen in the export. Tamper case `theme-value-copied` proves it fires; 14 of 14
rules now fail on demand.

Two near-duplicates were deliberately NOT tokenised, following the precedent set
on `03-not-found` in session 2: step 2's empty answer tile is two shades off the
Daily screen's, and the error screen's dropped tile is two shades off
`textWhisper`. Both pair with the *same* dark value, which is what says they are
one role with a wobbly light value rather than two roles. Colours that appear on
exactly one screen — the "now" timestamp, the notification preview body, the
idle time chip — are written inline with their hex pairs and a comment, because
naming them would imply they are shared when they are not.

### Why moti is gone

The owner asked for it, and the reasoning holds up: moti 0.30 advertises itself
as "powered by Reanimated 3" and this project is on 4.5. Nothing had ever been
run, so the app's entire motion layer rested on a version pairing nobody had
seen work — an unverified dependency on top of an unverified build. Reanimated
is a hard dependency either way, since it is what moti calls.

The specs kept their shape deliberately: `MOTION.settle` still describes a
spring with the same damping, stiffness and mass, so a correction is still one
constant in one file. What is new is `animate(spec, to, delay)`, so no screen
ever imports `withSpring` and quietly invents a bouncier spring than rule 1
allows.

Two things changed behaviour rather than implementation, and both are noted in
the code:

- **Entrances split opacity from movement.** A spring drives its value past the
  target before settling, and an opacity of 1.03 is a clamp on one platform and
  a warning on another. Opacity is a 220ms timing; the movement is still the
  spring. Nobody can see the difference; a flicker they would see.
- **The letter's exit animation was not ported.** moti's `AnimatePresence` made
  backspacing "a letter leaving" rather than "a letter deleted". Nothing in the
  app unmounts a letter yet — the board is static — so porting it would have
  meant shipping a path that cannot be exercised. It goes back in with the input
  layer, which is where it can actually be tested.

`moti` is out of `apps/native/package.json` and still in the lockfile, so
**`pnpm install` is required before this builds**.

### The onboarding flow, and what it refuses to do

Read as a sequence, the five steps are the product's manners:

1. **Welcome** states the rule and immediately promises what the game will never
   do — "no timer, no score, no way to lose" — before asking for anything.
2. **Try the game** is the game, with the answer already on screen: "Stuck? The
   answer is LIGHT". A puzzle game giving away its tutorial answer unprompted,
   before anyone has struggled.
3. **The ritual** is where a normal game would introduce the streak as a thing
   to protect. This one says "miss a day and nothing is taken from you" and
   calls the streak "the only number in the game".
4. **Notifications** shows the exact notification, lets the person pick the
   time, says it is the only thing that will ever be sent, and puts "Not now"
   in plain sight under the button.
5. **Drop in** has no Skip at all — START and Skip would go to the same place.

None of that is decoration, and a later session should treat those lines as
constraints rather than copy.

### The system screens

Loading is the wordmark and three dots: no progress bar, no percentage, because
a number that creeps is a clock. The design is a still frame of something that
moves, so the amber dot travels — 420ms a step, 260ms crossfade, both colours
exactly the design's.

Error is the more interesting one. It has no red, no warning triangle, no error
code and no apology; the first thing it says is the thing anyone would actually
be worried about — "your solves and streak are safe on this phone". D-002 says
Word Hug has no error colour, and this is the screen that would have needed one.
It is wired as the root layout's `ErrorBoundary`, not just a route, so a crash
lands there rather than on a red box. In `__DEV__` only, it also prints
`error.message` underneath: the calm copy is right for a player and useless for
whoever has to fix it.

The splash is half done. `app.json` now carries the design's background colours
(`#FFF4E2` / `#1A0F38`) and the two icon slots; the PNG itself is still the Expo
template's. That is an asset export, not a code change.

### Settings, How to Play, Stats — and the first commits this project has had

Screens 16, 17 and 18. **15 of 35.**

The teal broke into three. `accent`, `accentText` and `accentMid` are all
#17A398 in light; dark splits them into #17A398 for a fill, #2ED3C0 for type on
a panel, and #1FBFB0 for a figure or a progress bar. Same story with the coral:
one token in light, two in dark. Anyone building these from the light designs
alone would merge them and be right about half the app. That is now three
separate instances of the same trap in one session, which is why the parity rule
that catches it exists.

What is absent from these three screens is the design. Settings has no account,
no sign-in, no sync, no data toggles and no notification categories — there is
nothing to opt out of because nothing collects anything, and the whole screen
fits on one phone. Stats has no average solve time, no win rate, no percentile
and no guess distribution. How to Play is the complete rulebook on one screen;
a puzzle whose rules need scrolling has a bad rule.

**Two things on these screens are inventions and want a second opinion.** The
toggle's OFF state does not exist anywhere in the designs — all three toggles are
drawn ON — so the track becoming `surfaceQuiet` is a guess. And the Stats heatmap
is driven in the export by a template loop whose data is not in the extracted
HTML, so its two colours come from the legend the design *does* draw. If the real
design has intermediate shades, that grid is wrong.

### progress/05-known-issues.md

New file, and the most useful thing written this session. Thirteen screens were
built without any of them being run, and there are specific places where that is
most likely to have gone wrong — `className` on a Reanimated `Animated.View`,
`ch` units that React Native does not have, `letterSpacing` in `em` when React
Native measures points, `boxShadow` insets on the New Architecture. Each entry
says how it fails, why it might be fine, and which file the fix goes in. Most of
them fail in a way that looks like something else, which is exactly why they are
written down now rather than rediscovered at 2am.

### Commits, finally

Branch `session-3-screens`, eight commits, one per todo. This project had four
commits total before today and none of sessions 1–3's work was in any of them.

Getting them was its own small fight: `git` cannot unlink on this filesystem, so
every command leaves a `.lock` that blocks the next one. `GIT_INDEX_FILE` pointed
outside the mount solves it for the index, and `HEAD.lock` has to be moved aside
between commits. Written down in `plans/05` section 8 so the next agent does not
rediscover it.

`progress/` and `plans/` are gitignored, so none of this reasoning is in those
commits — the owner's session-1 decision, but worth knowing that this file lives
on disk and nowhere else.

### Late additions: the payoff moment, and two boards for the price of one

The session had room left, so three more screens: **overlay A**, and **11 and
14**. That is 12 of 35.

**A is the moment the product exists for**, and what it refuses to do is the
design. No score, no rank, no time, no attempt count, no exclamation mark. The
eyebrow is "That's the one" — four flat words. The streak gets one coral dot and
five words of 14.5px type, reported rather than defended, and a streak of zero
hides the line entirely rather than printing "0 day streak" at someone.

It is built as a **transparent modal**, not a screen. The design file redraws the
three clue cards underneath because a static mockup has nothing to sit on; the
real thing keeps the board mounted and washes over it with `overlayWash` (0.93 /
0.94 of the ground), so the answer stays faintly visible behind the celebration.
That is also exactly how the game will present it. `backdrop` would have been the
obvious token and is the wrong one — it is a dimming scrim for sheets, and this
is a near-opaque sheet of the ground itself.

11 and 14 are the same board twice, so `components/puzzle-board.tsx` now holds
it. **Daily was deliberately left out of that refactor.** Its tiles are
fixed-width and centred where these two flex, and its header is coins-and-streak
rather than back-and-help; folding it in before any of the three has been seen
running would be inventing a shape rather than finding one. Three real screens to
generalise from is worth waiting for.

The nicest thing in either screen is a line of 13px type: **"Replay · doesn't
affect your streak"**. A game optimising for engagement would have made the
archive a way to repair a broken streak, which turns a missed day into a debt.
This one says going back cannot cost you anything. Same with the pack screen's
"Pack solve · no streak" — paid puzzles do not feed the streak, so the free daily
is never the lesser option.

Six more tokens (62 × 2 now). `accentText` is the one worth remembering: dark
cannot reuse `accent` for type, because #17A398 on the #2A1B58 panel is
unreadable and the design brightens it to #2ED3C0. The pair-differently rule,
for the third time this session.

### The typecheck, and the detour it took

`tsc -p tsconfig.check.json --noEmit` run in the repo **does not finish** inside
the time a command is allowed: 40 seconds of wall clock for 2.4 seconds of CPU,
because every module resolution crosses a filesystem bridge. Several routes
around it dead-ended — background processes are killed with their command, and a
local install is impossible because the npm registry returns 403.

What worked was moving the problem rather than the files: copy the source and the
`.d.ts` declarations *only* — react-native, expo-router, Reanimated, uniwind,
heroui, safe-area-context, svg, plus the tokens package's one source file — onto
fast local disk, and check there. **22 files, zero errors, five seconds.** The
one trap worth writing down: without a file containing
`/// <reference types="uniwind/types" />`, every `className` in the app becomes a
type error, which looks like a catastrophe and is nothing.

The method is in `00-START-HERE.md` so the next session repeats it instead of
rediscovering it. A clean typecheck is still not a running app: the two things
most likely to be wrong — the animation library swap, and whether uniwind styles
a component it does not own — are both invisible to the compiler by construction.

### Judgement calls made in the owner's absence

The owner said to take the recommended option and flag it. The full list with
reasoning is `plans/05-onboarding-and-system-screens.md` §6. The two that most
deserve a second opinion:

1. **Onboarding is not gated behind a first-launch flag.** The app still opens
   on Daily; onboarding is reached from a temporary link row. Gating an unrun
   five-screen flow in front of the app's most-used screen, in a build nobody
   has seen, is the wrong order to do things in — but it does mean onboarding
   will not appear on its own.
2. **Step 2's → button advances the flow instead of checking an answer**, since
   there is no input layer. The button's real job is "I am done here", which is
   what it does.

---

## Session 2 — the tokens reach the screen

**Status: code-complete, unverified. Nothing here has been seen running.**

The job was to plumb `packages/tokens` into uniwind and prove it, then build the
first screens. The plumbing is done and generated rather than hand-written; the
proof exists but only the owner can execute it.

### Three bugs the session found, in order of how quietly they would have shipped

**1. Baloo 2 has no 900 weight.** The designs set `font-weight:900` on eyebrow
labels, the puzzle-number chip and the coin/streak counts. `weight.heavy` was
`'900'`, and `progress/02-dependencies.md` says to load weights "700, 800, 900 —
all three must be loaded or the wrong face renders silently".

There is no 900 to load. Baloo 2's weight axis stops at 800 and
`@expo-google-fonts/baloo-2` ships 400/500/600/700/800 — no Black. The browser
that rendered the design export synthesised the extra weight; a phone will not.
Left alone, those labels would have quietly fallen back to the system font,
which reads as a design choice rather than as a missing asset.

`face.heavy` now points at the 800 face and the parity test fails if any face
named in the tokens is one the package does not ship. **This is the only visible
divergence from the design export in the whole slice**, and it is unavoidable.

Also fixed while there: the text presets set `fontFamily` **and** `fontWeight`.
For a custom family that makes Android pick its own face and ignore yours. The
presets now set family only, since the face carries the weight (D-003).

**2. The D-001 bezel rule was wrong in both directions.** It banned any token
matching `rgba(58,42,24,…)` at any alpha. But `0.07` is the puzzle screens'
"PUZZLE 128 · TUESDAY" pill — real UI — and `0.28` is *both* the mockup's drop
shadow *and* the light theme's modal scrim (`position:absolute;inset:0` in
`b-nudge-picker-light` and `c-zero-coin-prompt-light`). The same value, used two
ways, so no value-only test can separate them.

Split by use instead: `#20160C` is never anything but the bezel and is banned
outright; the rgba is banned only in keys that name a shadow, which is the one
thing the bezel's version of it is. A `backdrop` token now exists that the old
rule would have rejected. D-001 itself is unchanged.

**3. `@theme inline` cannot contain `--x: var(--x)`.** The first emitter wrote
the raw per-theme values and the Tailwind-facing names under the same names.
`inline` substitutes `var()` at build time, so those lines were circular and
resolved to nothing — silently. Raw values are now `--whv-*`, public names are
`--wh-*` / `--color-wh-*`.

### Why the CSS is generated

uniwind reads CSS and the app reads TypeScript. Maintaining both by hand is the
"same value in two places" trap, except worse than usual: a stale CSS file does
not throw, it renders last week's colour, and every screen stays perfectly
self-consistent while being wrong.

So `packages/tokens/scripts/emit-theme-css.mjs` is the only thing that writes
`apps/native/theme.generated.css` and `apps/native/theme/token-map.generated.ts`,
and `--check` fails the moment either drifts. `--tamper` proves `--check` can
fail, including against a missing file.

The generated CSS also re-points heroui-native's own variables (`--background`,
`--surface`, `--foreground`, 30 others) at the Word Hug palette. That import
**must** come after `heroui-native/styles` in `global.css` — both write into
`@layer theme` and the later one wins. Move it up one line and every heroui
component reverts to stock zinc-and-blue while still looking self-consistent.
That is the failure this session existed to prevent, so there is a comment
saying so in `global.css`.

### The parity test now has to earn it

It was one pass with a single tamper case. It is now a pure function plus 13
named corruptions, each aimed at one rule, each required to fire. Two of them
caught stale test code the first time they ran — the `themes-out-of-step` case
had hard-coded the last token key, so adding a token silently disarmed it. It
now drops whichever key happens to be last.

Tokens went 21 → 45. The additions are what a puzzle screen actually needs, and
they are not derivable from the base palette: in dark, the clue card, the answer
tile and the keycap are three different purples (`#33206B`, `#4A3193`,
`#3E2884`) where light uses white for all three. Reaching for `surface` would
have looked correct in light and wrong in dark.

### Motion

Added at the owner's request, mid-session, with Moti (installed by the owner —
the sandbox cannot reach the npm registry).

Everything routes through `components/motion.tsx`, because the product rules
constrain motion harder than they constrain colour. "Never punish" rules out the
entire reflexive vocabulary of puzzle games: no shake on a wrong guess, no
flash, no failure bounce, no countdown. The springs are heavily damped for the
same reason — a springy interface is a playful one and this is a calm one.

`ChunkyPressable` is worth one line of explanation: a surface moves down by
exactly the amount its shadow shrinks, so its bottom edge stays put and it reads
as a physical thing being pushed into its shadow rather than as a moving
rectangle.

Two risks flagged rather than resolved: **Moti 0.30 advertises Reanimated 3 and
this project is on Reanimated 4.5**, and the caret's slow breath may read as a
metronome, which rule 1 forbids. Delete `Breathe` if it does; nothing depends on
it.

### What was verified, and what was not — stated plainly

| Check | Result |
|---|---|
| `design-parity.mjs` | PASS — 45 tokens × 2 themes against 48 light + 36 dark screens |
| `design-parity.mjs --tamper` | PASS — all 13 rules made to fail on demand |
| `emit-theme-css.mjs --check` | PASS |
| `emit-theme-css.mjs --tamper` | PASS — rejects a hand edit, a deleted line, a missing file |
| `npx expo prebuild --platform ios` | PASS — config and dependency graph resolve |
| Scoped `tsc --noEmit` over app/, components/, theme/, contexts/ | PASS |
| **`expo export` (a real Metro bundle)** | **NOT COMPLETED** — see below |
| **Anything visual** | **NOT CHECKED. Nobody has run this.** |

The Metro bundle is the gap that matters, and it is worth being precise about
what it means. `expo export` exceeded the sandbox's per-command ceiling on three
attempts (~3 minutes each) and was killed before emitting a line. So
**`global.css` has never actually been compiled.** A syntax error in the
generated CSS, or a `@variant` form uniwind rejects, would surface on the
owner's first `expo start` and not before. The token probe is built to tell the
difference between that and a subtler failure: if the variables never reached
uniwind, every row says MISSING.

`tsc` against the full project also never finished in the sandbox; the scoped
run above covers every file this session wrote, via
`apps/native/tsconfig.check.json`. It was made to fail once, deliberately, to
confirm it was looking at anything.

### Judgement calls made without the owner

1. **Tightened, then re-scoped, the D-001 parity rule** rather than avoiding a
   legitimate `chipSurface` / `backdrop` token. Reasoning above.
2. **`face.heavy` → the 800 face.** The alternative is text that silently drops
   to the system font.
3. **Not Found reuses the Daily screen's inset-shadow tokens** (0.18/0.28)
   instead of its own (0.16/0.30). Identical fills, two-hundredths of alpha
   apart, on a subtle inset — design noise, and two near-duplicate tokens cost
   more than they buy. Recorded in `plans/04` §5.
4. **Rebuilt `+not-found.tsx` from its design** rather than leaving stock heroui
   boilerplate, since the owner asked for motion on "every screen so far".
5. **The caret breathes.** A blinking cursor is a timer's cousin and rule 1
   forbids implying a clock. ~1.1s per direction with a shallow floor reads as
   breathing. It is the app's only looping animation and it is disposable.
6. **`--danger` points at the warm coral.** D-002 says Word Hug has no error
   state, but heroui declares `--danger` regardless; leaving it stock would put
   a red in the app the moment any component fell back to it. Pointing it at the
   coral means even a mistake stays on-palette. Nothing may use it deliberately.
7. **Boilerplate was relocated, not deleted** — `rm` is still refused in the
   repo. `scripts/session-2-cleanup.sh` finishes the job.
8. **`expo prebuild` generated `apps/native/ios/`.** It could not be removed
   afterwards for the same reason. Harmless, and consistent with the tracked
   `android/`.

### Screens: 2 of 35

Added `progress/03-screen-status.md` after the owner pointed out — fairly — that these
notes talk in features when the only question that matters is which screens exist.

Built: **Daily Puzzle** and **Not Found**. Both code-complete, unverified.
**Onboarding is 0 of 5 and has never been started.** Overlays are 0 of 8, including the
solve celebration. Two sessions have gone into foundations; the next one should be
screens and nothing else.

### Note for the owner

`expo prebuild` reported: *"Using react-native@0.86.2 instead of recommended
react-native@0.86.0"*. Worth resolving with `npx expo install --fix` before the
dev build, per `progress/02-dependencies.md` §4.

---

## Session 1 — part 2: tokens and the parity test

**Built `packages/tokens` from the designs, and the Pillar 6 check that spans
TypeScript and HTML. The check earned its keep on its first run.**

### The parity test caught a real bug immediately

`dark.onPrimary` was written as `#4A3000` — copied from light, on the entirely
reasonable assumption that identical amber buttons (`#FFB020` is the same hex in
both themes) carry identical text.

They do not. Measured across the dark screens: **`#3B2400`, 43 uses.** Light uses
`#4A3000`, 46 uses.

Nobody would have noticed this by eye. It would have shipped as a slightly-wrong
text colour on every primary button in dark mode, and both the token file and
every component consuming it would have agreed with each other. This is exactly
the class of bug Pillar 6 exists for, and it appeared within minutes of the check
existing. Recorded as **D-005**.

### The census trap, avoided

`#20160C` is the most frequent background in the dark set — all 36 screens — and
an obvious token candidate. It is the **device mockup bezel**, not UI: a 414px
frame wrapping the real 390×844 screen in the export. `rgba(58,42,24,0.28)` is
its drop shadow.

A colour census alone would have made this a core token. Recorded as **D-001**,
and the parity test now fails if either value is ever tokenised.

This is why `designs/census.mjs` carries a warning at the top of the file rather
than being treated as a source of truth.

### What was built

- **`packages/tokens`** — `light` and `dark` palettes, type ramp, radii, elevation.
  21 tokens per theme, every value read out of the designs.
- **`packages/tokens/test/design-parity.mjs`** — checks every token value actually
  appears in that theme's screens, plus rules that survive a repalette: no bezel
  colours, no error colour by name (D-002), no pure black/white grounds, text ramp
  must stay distinguishable, elevation blur must be 0 (D-004), both themes must
  define the same keys, and a sanity check that the parser found something.
- **`designs/census.mjs`** — value survey by CSS role, per theme, with gradients
  surfaced separately because a flat-hex census cannot see them.
- **`systems/09-decisions.md`** — D-001 to D-005, cited by number in the token source.

### Verified — by running, and by making it fail

- ✅ `node packages/tokens/test/design-parity.mjs` → **PASS**, 21 tokens × 2 themes
  against 48 light + 36 dark screens.
- ✅ `--tamper` (corrupts `#EFE6DA` → `#EFE6DB` in memory) → **exits 1**. The check
  has been made to fail deliberately and does. It is not a check that matches nothing.
- ⚠️ Typecheck not run cleanly — invoking `tsc` with explicit file paths conflicts
  with the workspace `tsconfig.json` (TS5112). A `tsconfig.json` was added to the
  package; a proper `tsc -p packages/tokens` run still needs doing.
- ❌ **Nothing has been rendered.** The token layer is not wired into any styling
  system, so the most expensive anti-pattern in the process — a config that agrees
  with itself and disagrees with the screen — is still fully live. **The next
  session's first job is to render one component and confirm the colour on screen
  is the token's colour.**

### Not built, and why

**Onboarding was requested "if you still have context".** It was not started.
Beginning a screen with a third of a session left would have meant a half-built
file for the next agent to reverse-engineer, and the process is explicit that a
stub with a TODO is worse than an absence. The foundational work asked for —
tokens, the parity check, the decision log — is complete and verified instead.

### Owner answers — now settled, do not reopen

Asked at the end of session 1 and answered:

1. **`designs/` stays untracked.** Deliberate. Do not add it to git. The raw exports live
   on the owner's machine only; `extract.mjs` regenerates everything readable from them.
2. **The owner runs the app. Agents make code-level changes only.** The owner reports what
   is broken and the next session fixes it. **This is now the standing arrangement for
   every agent** and is written up in `00-START-HERE.md` § "How verification works here"
   and in `AGENT-PROCESS.md`.

   The consequence that matters: **no agent may ever tick a "verified" box.** Screen todos
   are split into `code-complete` (yours) and `verified on device` (the owner's). The most
   honest thing an agent can say is "code-complete, unverified", and it should say exactly
   that every time.

   Practical implication for planning: **do not batch ten screens before a hand-off.** Build
   a slice, hand it over, get it run. A wrong assumption repeated across ten screens costs
   ten times as much to undo, and appearance feedback is the only real signal this project
   will ever get.
3. **Interruptions: take the recommended option, keep moving, list everything at the end.**

### Design system completed — and two more session-1 errors found

Extending tokens beyond colour to type, spacing, radii and elevation meant re-reading the
designs, which caught two things that had been written from assumption:

**1. The app is a single-family interface.** `font.body` was tokenised as **Nunito**. Nunito
appears in **zero of the 84 screens** — it is the design export page's own chrome (the
captions under each device frame), not app UI. Every screen uses **Baloo 2**, 295+ times.
The parity test now fails if Nunito is ever used as a font value again.

**2. Elevation has five levels, not one.** `elevation.restY` was tokenised as 5px. Measured:
`0 4px 0` appears 131 times and `0 3px 0` 109 times, against only 46 for 5px. The workhorse
values had been missed entirely. Now `sm/md/base/lg/xl` = 2/3/4/5/6, all verified present.

**Spacing and radii are hand-tuned, not a grid.** The designs use every spacing value from
1 to 14, then 16, 19, 24, 36; radii include 3, 10, 13, 14, 15, 16, 18, 19, 20, 22, 999. The
token scale is therefore **descriptive, not prescriptive** — a note in the source warns
against rounding a design's 19px to 20 to make it fit.

**Added:** `text.*` presets (display, h1–h3, clue, action, body, label, caption) built from
the size/weight pairings the designs actually use, so a correction lands in one place.

**Parity test extended** to cover the new tokens: every `size` must appear as a `font-size`,
every `radius` as a `border-radius`, every `elevation` as a `0 Npx 0` shadow. Colour-only
checking would have missed both errors above. Re-verified: passes, and `--tamper` still fails.

One refinement worth noting: the Nunito rule initially matched the source *comment*
explaining that Nunito is not an app font, and failed the build. Tightened to match
`: 'Nunito'` as a value. A rule that fires on prose rather than code is a false positive
generator, and would have been quietly deleted by a future agent.

### Scaffold completed

`progress/01-project.md` (what the product is, rarely changes) and
`progress/AGENT-PROCESS.md` (the six pillars as they apply here, plus the anti-patterns
this project has actually hit) were written after the answers came in. The `progress/`
folder is now complete: START-HERE, project, changelog, process.

---

## Session 1

**Scaffolding only. Cracked the design export format, built the extractor, established
execution limits. No product code written.**

### The design source turned out to be the whole story

The eight files in `designs/` looked like ordinary HTML exports. They are not. Each is a
"bundled page": ~600 KB, only ~384 lines, and nothing readable in the markup you see. An
agent opening `01-daily-and-archive.html` directly would find no hex values, no layout,
and no screens.

Working out where the design actually lived took most of the session:

1. `data-screen-label` appeared 8 times but with no readable values → content is packed.
2. Found `atob`, `base64`, `DecompressionStream`, `gzip` → payload is gzipped base64.
3. Inflated the manifest — **and it was a dead end.** All 13 entries are the shared React
   runtime and nine woff2 faces, byte-identical across all eight bundles. Zero screens.
4. The design is in `<script type="__bundler/template">` — **uncompressed all along**, 100 KB
   per file, sitting in the raw HTML next to the manifest. It is markup embedded as an
   escaped JS string literal (`\"` for quotes, `/` for every slash).

**Why this matters beyond this session:** Pillar 1 of the process says the design files
outrank the prose. That is only true if an agent can read them. Without `extract.mjs`,
every future session would have silently fallen back to building from the PRD and the
screens spec — prose, rank 4 — while believing it was following the designs. The whole
precedence ladder was inoperable until this was solved.

### What was built

- **`designs/extract.mjs`** — pulls the template block by index (not regex; the markup
  contains its own escaped `</script>`), unescapes the string literal, splits it per screen
  by walking div depth from each `data-screen-label`, and writes one standalone file per
  screen per theme. Also inflates the manifest's JS entries; skips the woff2 faces.
- **`designs/inspect.mjs`** — hashes every manifest entry across all eight bundles to
  separate shared assets from page-specific ones. This is what proved the manifest was a
  dead end, and it is worth keeping for when the designs are re-exported.
- **`.gitignore`** — added `progress/` and `designs/extracted/`.

**Result: 84 files — 42 screens × 2 themes.** Screen labels match `plans/03-screens.md`
numbering exactly (09 Daily Puzzle, 10 Archive, … plus overlays A–H), which is a good sign
the designs and the spec were made from the same understanding.

### The trap already found in the designs

The Daily Puzzle background is
`radial-gradient(115% 70% at 50% 0%, #FFE6B4 0%, #FFF4E2 58%, #FFF9EF 100%)`.

Three stops with a warm glow at the top. Shipping it as flat `#FFF9EF` would be entirely
plausible in code, would look self-consistent, and would be wrong on the most-used screen in
the app. This is the "simplifying a fill" anti-pattern, present on screen one. It is now
quoted at the top of `START-HERE.md`.

There are 84 unique hex values in the Daily/Archive bundle alone. Do not assume a
background/surface pair will cover it.

### Execution limits (Pillar 5) — established by trying, not assuming

| Capability | Result |
|---|---|
| Node | ✅ v22.22.3 |
| `git` read | ✅ works, but warns it cannot unlink `.git/index.lock` |
| `git` commit | ❌ no `user.email` / `user.name` configured |
| Create files | ✅ |
| **Delete files** | ❌ `rm` → `Operation not permitted` |
| **Move/rename** | ✅ `mv` works — use it instead of deleting |
| `pnpm` | ❌ not on PATH — cannot install anything |
| `tsc` | ✅ present at `node_modules/.bin/tsc` |

The delete restriction is the awkward one: **a stray `designs/_probe2` from the capability
probe could not be removed.** The owner should delete it. Future sessions should relocate
files rather than delete them, and collect real deletions into a script.

### Divergences from the process template

- **`designs/raw/` was not created.** The template prescribes `designs/raw/` + `designs/extracted/`.
  Moving the eight existing files into a `raw/` subfolder is possible (`mv` works) but would
  break the relative links in `designs/index.html`, which the owner uses to browse the designs
  in a browser. Left flat; `extract.mjs` reads `designs/*.html` directly. Reversible.
- **No `CENSUS.md`.** The template warns a colour census is dangerous as a substitute for
  looking, and cites a real case where it missed a background used on five screens. Given
  the gradient found above, a census felt like an actively bad idea this early. Skipped
  deliberately.
- **No `plans/NN-*.md` todo files yet.** Writing them requires the kickoff answers below.

### What is verified and what is not

- ✅ **Verified by running:** extraction produces 84 files; `09-daily-puzzle-light.html`
  contains real readable markup with real hex values; the gradient above was read out of it.
- ✅ **Verified:** the capability table — every row was tested, not assumed.
- ❌ **Not verified:** nothing has been rendered. No component exists. The token layer is not
  built, so it cannot be wired, so it cannot be proven wired.
- ❌ **Not verified:** no test exists, therefore no test has been made to fail.
- ✅ **Verified by measuring:** the div-depth slicer produces balanced markup. Checked
  `a-solve-celebration`, `b-nudge-picker`, `16-settings`, `12-pack-list`, `04-welcome` —
  all have equal `<div` and `</div>` counts, across overlay, list, form and onboarding
  layouts. The slicer is not truncating.
- ✅ **Verified:** the onboarding designs contain **no language selection step** — a search
  for "language"/"español" across the onboarding bundle returns nothing. Designs and
  `plans/01-prd.md` agree that v1 is English-only. **No exception needs registering.**
  (This closes what was open question 6.)

### Open questions for the owner

Blocking, in rough priority order:

1. **Commit `designs/` or not?** The raw exports are currently untracked — ~5 MB across eight
   files. The process says raw designs are the source of truth and should be tracked. Against:
   they are large and regenerate from the design tool. **Recommend tracking them.** If the
   exports are lost, every appearance decision in the project loses its authority.
2. **Who runs "done"?** Is there a device or simulator, and who runs it? This decides which
   "Done when" clauses can ever be honestly ticked. If nobody can run the app, no screen todo
   can be truthfully completed, and the plans should be written to say so.
3. **First slice.** Recommend: tokens → Daily Puzzle → solve celebration. That is the 90%
   screen plus the moment the product is actually for. Confirm or redirect.
4. **How do you want to be interrupted?** Ask the moment a design/spec conflict appears, or
   take the recommended option and present everything at the end?
5. **`apps/web` now or later?** It hosts privacy/terms/support, which are required before
   store submission but not before building the app.
6. **Spanish.** `plans/99-backlog.md` defers it to v2, but `03-onboarding.html` should be
   checked for a language step — if the designs include one, the design and the spec disagree
   and that needs registering as an exception.

### Next

Answer the questions above, then: read the design sample, build `packages/tokens` from what
is actually in the files, wire it, prove it is wired, and write the parity test before any
screen work begins.

---

# Session 4

**Scope:** finish `app.json`, build overlays B/C/E/F, build all nine alternate
states, generate the splash artwork. **15 → 28 of 35 screens.**

Everything below is **code-complete and unverified**. Nothing in this project has
been seen running yet, including the thirteen screens from session 3.

## 1. app.json — the icons were almost entirely unwired

Nine icon assets sit in `assets/images/`. Before this session `app.json` referenced
**two** of them, both splash. The prebuilt iOS project was carrying the Expo
template's placeholder icon (5.8 KB, against the real `icon.png` at 54 KB), and
`android/app/src/main/AndroidManifest.xml` had **no `POST_NOTIFICATIONS`
permission** — so the ALLOW button in onboarding step 4 would have failed silently
on Android 13+.

Added: the `icon` object (light/dark/tinted), `android.adaptiveIcon`
(foreground + monochrome + `#FFF4E2`), `web.favicon`, and the `expo-notifications`
config plugin (`notification-icon.png`, `#FFB020`). All nine assets are now
referenced.

Also added, all of which are baked at prebuild and would each have cost a second
native build: `version`, `newArchEnabled: true` (known-issue #4 — the whole chunky
elevation rests on `boxShadow`, which is New Architecture only), `orientation:
"portrait"` (was `"default"`), `ios.supportsTablet`, `android.edgeToEdgeEnabled`,
`runtimeVersion: { policy: "fingerprint" }`, and a display `name` of "Word Hug"
rather than "word-hug", which is what shows under the icon.

`expo-build-properties` and `expo-application` added to `package.json`.

**Note the path trap:** `assets/images/app.json.example` writes `./assets/icon.png`,
but the files live at `./assets/images/`. Copying that file verbatim fails prebuild.

## 2. Overlays B, C, E, F

| | Overlay | File |
|---|---|---|
| B | Nudge picker | `app/nudge-picker.tsx` |
| C | Zero-coin prompt | `app/zero-coin.tsx` |
| E | Archive locked | `app/archive-locked.tsx` |
| F | Offline notice | `components/notice.tsx` + `app/offline-notice.tsx` |

New shared component `components/sheet.tsx` — the bottom sheet B and C both draw,
including the grabber and the scrim. **Not `@gorhom/bottom-sheet`**: neither sheet
is dragged, snapped or gesture-dismissed, so the package would add a provider and
a scroll container in service of a shape that is a `View`. It can be swapped in
behind this component later without a screen changing.

`sheet.tsx` takes a `lift` prop for the `0 -6px 0 rgba(58,42,24,0.06)` lip. B draws
it in light; C does not, and neither does in dark. Carried as a boolean rather than
unified, because a one-screen difference in an export is as likely to be a decision
as a slip.

E's scrim is `rgba(58,42,24,0.32)` / `rgba(8,4,20,0.55)` — heavier than the
`backdrop` token (0.28 / 0.5). Written inline; a centred dialog has to lift off the
grid behind it where an anchored sheet does not, and one screen is not a rule.

## 3. All nine alternate states

`/solved-today`, `/wrong-guess`, `/near-miss`, `/caught-up`, `/archive-day-one`,
`/nothing-owned`, `/store-unreachable`, `/stats-empty`, plus the splash artwork.

New shared components:

- `components/daily-chrome.tsx` — the header the four Daily states share. **It is
  not the Daily screen's header**: 09 draws menu + coins + streak with no help
  button; all four alternate states draw menu + coins + help and no streak. A real
  difference in the export, reproduced rather than reconciled.
- `components/notice.tsx` — `GuessNote` and `OfflineBanner`. They live together
  because they share a colour pair (#8A7458 / #C6B7EC) that exists nowhere else.
- `components/empty-state.tsx` — the ornament/heading/sentence block shared by
  Archive day one, Stats empty and Store unreachable.
- `components/screen-header.tsx` gained an optional `glyph` prop so Store
  unreachable can draw a close cross instead of a back chevron. Default unchanged,
  so Settings/How to Play/Stats are untouched.

**On rule 1**, since `/wrong-guess` is where it lives or dies: the typed word stays
in the tiles, the submit arrow stays amber, no tile changes colour, and nothing
shakes, flashes, buzzes or is deducted. One sentence appears on a soft pill. Near
miss is the same board with a warmer pill. Those are the only two tones, and there
is deliberately no third.

## 4. Splash artwork

`assets/images/splash-icon.png` and `splash-icon-dark.png` regenerated from
`splash-{light,dark}.html` at 5x (720x505, transparent) with the real Baloo 2
ExtraBold face, via `scripts/`-style one-off Python. The per-tile rotations
(-5, 3, -2, 5 / 4, -3, 5) and the zero-blur offset shadows are the design's.
`app.json` already pointed at both filenames, so nothing needed rewiring.

## 5. Known issue #2 fixed

`max-w-[28ch]` / `[29ch]` / `[34ch]` replaced with point values (260 / 270 / 310) in
`components/error-view.tsx`, `components/onboarding-chrome.tsx` and
`app/+not-found.tsx`. React Native has no `ch` unit — dropped at best, `NaN` at
worst. New code uses the same 260 so one correction on device moves all of them.

## 6. Typechecking

The method in `00-START-HERE.md` no longer works: the device bridge times out
walking `apps/native/node_modules` — even a `find` over it exceeds the command
limit, so the copy-the-d.ts-files approach cannot get started, and `tsc -p
tsconfig.check.json` run in place does not finish either.

What was done instead: the new sources plus the components they import were
checked against a hand-written ambient stub set modelling the surface they touch
(React, react-native, expo-router, Reanimated, uniwind, safe-area-context), under
`strict` with `noUnusedLocals`. **Zero errors across all fourteen new and modified
files.**

That catches wrong prop names, missing exports, typo'd imports and malformed JSX.
It does NOT catch anything depending on the real declarations — whether `className`
is genuinely accepted by a given component, whether a style key exists on RN's
`ViewStyle`, or Reanimated's generics. `npx tsc -p tsconfig.check.json` on the
owner's machine is still the real check.

## 7. Recorded divergences

1. **`/nothing-owned` pack content is invented.** The design drives five rows from
   an `<sc-for list="{{ lockedPacks }}">` whose data is not in the export. "Cozy
   Kitchen" and "Garden Path" are real (they appear in `f-offline-notice`); the
   other three names, all five blurbs and the pack artwork are placeholders.
2. **All prices are hard-coded** — £2.99, £9.99 in `/nothing-owned`, £0.99/£2.49/
   £6.99 in `/zero-coin`. They must come from RevenueCat before release: a
   hard-coded store price is wrong outside one country and a review rejection in
   several.
3. **`/offline-notice`'s backdrop is not the design's.** The design draws the
   banner over the Shop (15), which does not exist. Two of that card's colours
   correspond to no token pair, and inventing them in a throwaway backdrop is how
   a wrong value gets copied into the real screen later.
4. **`/caught-up` reproduces the answer row locally** rather than calling
   `AnswerRow`. Its unfilled tiles are #F6E9CE / #2E1D63 where every other board
   uses `answerTileEmpty` (#F3E3C4 / #251652) — consistent across both themes, so
   read as deliberate. If it turns out to be an export artefact, deleting thirty
   lines and calling `AnswerRow` is the fix.
5. **Three shadow strings are read from `useAppTheme()`** rather than a `dark:`
   class — the replay tiles, the archive ghosts and the locked-pack card. A
   `boxShadow` is a string, not a colour, so it can go through neither `Chunky`
   (which needs a CSS variable) nor a Tailwind variant.

## 8. Cleanup

`apps/native/.tmp-font/` was created to copy the Baloo 2 face out for the splash
render (the bridge refuses to stage hardlinked files). It has been moved to
`apps/native/_to_delete/` — the bridge cannot delete, only move. **Safe to remove.**
