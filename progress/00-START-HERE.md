# START HERE

You are picking up **Word Hug**, a cozy word puzzle game for iOS and Android built with Expo.
This file is self-contained. Read it fully before touching anything.

> Read `progress/AGENT-PROCESS.md` first — that is *how* work is done here.
> This file is *what* to build next.
> **`progress/03-screen-status.md` is which screens exist.** Check it before
> promising anything about a screen — it is the only file that tracks that.

**Last updated: end of session 8b.**

---

## Where the project actually is

**Every screen exists. The game is playable end to end. Purchases work.**

The owner has now played it and bought something in RevenueCat's test store
successfully. That is the first time anything in this repo has been confirmed
working by a human, and it changes what "done" means for the remaining work.

| Group | Done | Total |
|---|---|---|
| System screens | 3 | 3 |
| Onboarding | 5 | 5 |
| Main app | 10 | 10 |
| Overlays | 8 | 8 |
| Alternate states | 9 | 9 |

The archive (screen 10) was **retired**, not built — see `05-known-issues.md`.

### What runs green

```
pnpm check          # imports, 246 loop checks, level banks, nav
pnpm levels:check   # bank structure, playability, curve, give-aways
```

Typecheck is clean. `pnpm validate:bank` is **not** green — see below.

---

## Where session 8 left it

Four things changed shape, and all four are written up as decisions in
`systems/09-decisions.md`. Read those before arguing with any of them.

- **D-006 — hearts are gone.** Deleted, not flagged off. An energy meter exists
  to end the session, and the plan is ad-supported.
- **D-007 — difficulty is solvability, not frequency.** The old model rated
  `book` easiest and put it at level 1, which the owner could not solve.
- **D-008 — entitlements write ownership; nothing reads it from the network.**
- **D-009 — free help is printed, not sold.** The category is on every board,
  and correct-position letters go teal after a wrong guess.

Session 8b also finished the web app at `wordhug.gamesforstrangers.lol` —
landing, privacy policy, terms, and a Dockerfile — because both stores require
a public privacy URL and `app/settings.tsx` was pointing at a domain nobody
owns.

---

## What to do next, in order

### 1. Run `pnpm levels:corpus` — needs network, ~3 minutes

The difficulty model's familiarity lists are **authored by an agent, not
measured**. `scripts/fetch-corpus.mjs` replaces them with real Datamuse Zipf
frequencies, cached to `scripts/corpus-cache.json`.

No agent has ever run it: the sandbox cannot reach `api.datamuse.com`.

**Expect the bank to reorder.** Review that diff properly — level numbers are
storage keys, so changing which puzzle is level 7 rewrites history for anyone
mid-run. Then `pnpm levels:build && pnpm levels:check`.

### 2. Fix the 73 failing puzzles

`pnpm validate:bank` → 227 pass, 73 fail. Three kinds:

| Kind | Count | Example |
|---|---|---|
| Genuine dual answers | ~20 | `ground` also solves as `hand` |
| Invented compounds | ~39 | `rollcoaster`, `musrat`, `houndfox` |
| Intersection failures | ~14 | one clue does not compound |

`node scripts/suggest-clues.mjs --failing` mines Datamuse for real compounds and
makes this mechanical rather than creative.

### 3. Ship a Play Store internal test

The app is ready for it. RevenueCat is on the **Test Store**; moving to real
Play billing needs a signed AAB uploaded to a track *before* the IAPs can be
created. See the walkthrough the owner has, or `systems/monetization.md`.

### 4. Ads

Decided but not started. Adding an ad SDK is a **material privacy change**:
`apps/web/src/app/privacy/page.tsx`, the Play Data Safety form and the App
Store nutrition labels all have to be updated *before* an ad-enabled build is
submitted. The privacy page has a comment saying so at the top.

---

## Things that are true and surprising

- **`categoryLabel` and `categoryChip` are different functions.** One is a
  sentence for the hint line, one is a short phrase for the board chip. Do not
  merge them; "It's a part of the body" → "PART OF THE BODY" is not a rule that
  works for all fourteen.
- **Nudge tier 1 no longer exists as a rung, but the integer 1 is still valid
  in storage.** Never renumber tiers (D-009).
- **`app/daily.tsx`, `app/level/[n].tsx` and `app/pack-level/[id]/[n].tsx` all
  render `components/game-board.tsx`.** Anything that should appear on "every
  board" goes in that component, not in three screens.
- **Coins are local; packs are RevenueCat's.** They are deliberately different
  systems (D-008).
- **`.gitattributes` pins LF.** If a diff shows a file you never opened, that
  is not it — that was fixed in 8b.
- **The key row has one cap per letter *occurrence*, not per distinct letter.**
  `EYE` shows two Es; `pepper` needs seven caps. `keys` can hold duplicates, so
  React keys are index-based and "spent" dimming counts occurrences.
- **`packages/ui` depends on `shadcn`, `tailwindcss` and `tw-animate-css`
  through CSS `@import`, not JS.** A dependency audit that only greps
  `from '…'` will call them unused and break the web build.
- **The scaffolding link row is gone.** There is no in-app route index any more.
  Use `npx expo-router sitemap` or the file tree.

---

## Execution limits — re-tested session 8

| Capability | Result |
|---|---|
| Node | ✅ v22.23.2 |
| `git` read | ✅ warns it cannot unlink `.git/index.lock` |
| `git` commit | ❌ no `user.email` / `user.name` |
| Create / edit files | ✅ |
| **Delete files** | ❌ `rm` silently fails on the mount — **tombstone the file with `export {}` and a comment, then give the owner a `git rm`** |
| `pnpm` | ❌ not on PATH |
| `tsc` | ✅ but **very slow** — a full project run can exceed 20 minutes. Scope it with a temporary `tsconfig` listing only changed files *plus* `expo-env.d.ts`, `uniwind-env.d.ts` and `uniwind-types.d.ts`, or every `className` reports as a type error |
| Network — npm registry | ❌ |
| Network — api.datamuse.com | ❌ |
| **Run the app** | ❌ never. The owner does this. |

> **The owner's shell is Windows PowerShell, not bash.** Every command you hand
> over must be PowerShell-valid: `Remove-Item -Force` not `rm -f`, `;` not
> `&&`, no `\` line continuations, and repo-root-relative paths on every
> argument. `git rm` on a tombstoned file needs `-f`. This cost a full round
> trip in session 8b — see `AGENT-PROCESS.md` §5b.

Re-test rather than trusting this table.

---

## The one habit that has caught the most bugs here

**Make every new check fail once, deliberately.**

It has now caught three real problems that would otherwise have shipped: a
props checker whose regex matched nothing, an on-ramp gate that agreed with the
model that produced it, and a virtual-currency guard that was tautological.
Every check added in session 8 was verified by breaking the thing it guards and
watching it go red.
