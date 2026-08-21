# START HERE

You are picking up **Word Hug**, a cozy word puzzle game for iOS and Android built with Expo.
This file is self-contained. Read it fully before touching anything.

> Read `progress/AGENT-PROCESS.md` first — that is *how* work is done here.
> This file is *what* to build next.
> **`progress/03-screen-status.md` is which screens exist.** Check it before
> promising anything about a screen — it is the only file that tracks that.

**Last updated: end of session 8c.**

---

## Where the project actually is

**Every screen exists. The game is playable end to end. Live billing is wired.**

The owner has played it and bought things in RevenueCat's test store. The
dashboard now also holds the **live Play Store app** (`app05dac30f80`) with all
nine products imported from Play Console, and `app.json` points Android at its
`goog_` SDK key. What stands between here and real money is one build: upload
the AAB, then buy something with a licence tester (§ next steps).

| Group | Done | Total |
|---|---|---|
| System screens | 3 | 3 |
| Onboarding | 5 | 5 |
| Main app | 10 | 10 |
| Overlays | 8 | 8 |
| Alternate states | 9 | 9 |

The archive was **retired**, not built — see `05-known-issues.md`.

### What runs green

```
pnpm check          # imports, 247 loop checks, level banks, nav
pnpm levels:check   # bank structure, playability, curve, give-aways
```

Typecheck is clean (`npx tsc -p apps/native/tsconfig.check.json --noEmit`,
seconds). `pnpm validate:bank` is **not** green — see next steps.

---

## What changed in session 8c

All four are written up properly in `04-changelog.md` and `systems/09-decisions.md`.

- **D-010 — the category hint is sold again.** Session 8b printed it on every
  board; that removed most of what coins are for. The chip, prop chain and
  `categoryChip()` are deleted; tier 1 is back at a price, ladder 1/2/3.
  Teal position feedback stays free.
- **Android takes real money.** `extra.revenueCatKeys` replaces the single
  Test Store key: Android = live Play app, iOS = empty until an App Store app
  exists.
- **`systems/monetization.md` rewritten** to shipped reality — it still
  described unbuilt `wh_*` ids, `hug_club` and restorable coins before this.
- **EAS lesson recorded:** commit the lockfile with any `package.json` edit,
  push, build clean. The first production build died on
  `ERR_PNPM_OUTDATED_LOCKFILE` from a dirty tree.

---

## What to do next, in order

### 1. Build, submit, and take real money

```
cd apps/native
pnpm build:android                # production profile → AAB
eas submit --platform android --profile production   # → internal track, draft
```

Build from a **clean pushed tree** and check the EAS page reports your SHA
without an asterisk. Then: add yourself as a licence tester (Play Console →
Setup → Licence testing), promote the draft, and test the matrix in
`systems/release-playstore.md` §5 — one pack unlocks only its levels, bundle
unlocks all five, coins credit exactly, restore brings packs but never coins,
aeroplane mode revokes nothing.

### 2. Run `pnpm levels:corpus` — needs network, ~3 minutes

The difficulty model's familiarity lists are **authored by an agent, not
measured**. `scripts/fetch-corpus.mjs` replaces them with real Datamuse Zipf
frequencies, cached to `scripts/corpus-cache.json`. No agent has ever run it:
the sandbox could not reach `api.datamuse.com`.

**Expect the bank to reorder.** Review that diff properly — level numbers are
storage keys, so changing which puzzle is level 7 rewrites history for anyone
mid-run. Then `pnpm levels:build && pnpm levels:check`.

### 3. Fix the 73 failing puzzles

`pnpm validate:bank` → 227 pass, 73 fail. Three kinds:

| Kind | Count | Example |
|---|---|---|
| Genuine dual answers | ~20 | `ground` also solves as `hand` |
| Invented compounds | ~39 | `rollcoaster`, `musrat`, `houndfox` |
| Intersection failures | ~14 | one clue does not compound |

`node scripts/suggest-clues.mjs --failing` mines Datamuse for real compounds and
makes this mechanical rather than creative.

### 4. Ads

Decided but not started. Adding an ad SDK is a **material privacy change**:
`apps/web/src/app/privacy/page.tsx`, the Play Data Safety form and the App
Store nutrition labels all have to be updated *before* an ad-enabled build is
submitted. The privacy page has a comment saying so at the top.

---

## Things that are true and surprising

- **The category is sold, not shown (D-010).** Nothing anywhere renders what
  `NUDGE_RUNGS` sells. `nudgeNote` composes the cumulative hint line;
  `app/nudge-picker.tsx` repeats it on reopen. Do not "simplify" one into
  the other.
- **Tier integers are storage keys.** `nudges` in MMKV stores them against
  puzzle ids; they survived going free and coming back without renumbering,
  on purpose.
- **`app/daily.tsx`, `app/level/[n].tsx` and `app/pack-level/[id]/[n].tsx`
  all render `components/game-board.tsx`.** Anything that should appear on
  "every board" goes in that component, not in three screens.
- **Coins are local; packs are RevenueCat's.** Deliberately different systems
  (D-008). Entitlements grant, never revoke.
- **`.gitattributes` pins LF.** If a diff shows a file you never opened, that
  is not it — that was fixed in 8b.
- **The key row has one cap per letter *occurrence*, not per distinct letter.**
  `EYE` shows two Es; `pepper` needs seven caps. `keys` can hold duplicates, so
  React keys are index-based and "spent" dimming counts occurrences. The check
  for this lives in `level-check.mjs`; reverting `keysFor` produces 66 errors.
- **`packages/ui` depends on `shadcn`, `tailwindcss` and `tw-animate-css`
  through CSS `@import`, not JS.** A dependency audit that only greps
  `from '…'` will call them unused and break the web build. That audit already
  happened once.
- **A `package.json` edit and its lockfile regeneration are one commit.** CI
  installs with `--frozen-lockfile`; local does not. This asymmetry is why the
  failure only appears on the build server.
- **There is no in-app route index.** Use `npx expo-router sitemap` or the
  file tree.

---

## Execution limits — two environments observed

### The owner's Windows device (session 8c)

Everything works: node, pnpm, git (commit and all), npx, tsc. The shell is
**Windows PowerShell**, and so are any commands you hand the owner — see the
rules below, which were learned in the Linux sandbox but apply doubly here.
**Still true everywhere: never run the app. The owner does that.**

### The hosted sandbox (sessions 1–8b), re-tested each time you land there

| Capability | Result |
|---|---|
| Node | ✅ v22 |
| `git` read | ✅ warns it cannot unlink `.git/index.lock` |
| `git` commit | ❌ no `user.email` / `user.name` |
| Create / edit files | ✅ |
| **Delete files** | ❌ `rm` silently fails — tombstone the file with `export {}` and a comment, then hand over `git rm -f` |
| `pnpm` | ❌ not on PATH |
| `tsc` | ✅ `node_modules/.bin/tsc` — scope it with `tsconfig.check.json`, never a full-project run |
| Network — npm registry, api.datamuse.com | ❌ |
| **Run the app** | ❌ never |

Re-test rather than trusting either table.

### The PowerShell rules (they cost a full round trip once)

Every command handed to the owner must be PowerShell-valid: `Remove-Item -Force`
not `rm -f`, `;` not `&&`, no `\` line continuations, repo-root-relative paths on
every argument, and `git rm -f` (a tombstoned file counts as modified). See
`AGENT-PROCESS.md` §5b.

---

## The one habit that has caught the most bugs here

**Make every new check fail once, deliberately.**

Four real catches across three sessions: a props checker whose regex matched
nothing, an on-ramp gate that agreed with the model that produced it, a
virtual-currency guard that was tautological, and session 8c's pricing checks
verified by re-injecting `cost: 0`. Every check added here was verified by
breaking the thing it guards and watching it go red.
