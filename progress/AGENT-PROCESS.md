# Agent process — Word Hug

The full portable template lives with the owner. This is the project-specific short form:
everything below is either a rule from that template that bit us already, or a decision
made here. **Read `00-START-HERE.md` after this.**

---

## The six pillars, as they apply here

### 1. The design files outrank the prose

Precedence, highest first:

| Rank | Source | Authority |
|---|---|---|
| 1 | `designs/extracted/*` | What a screen looks like |
| 2 | `systems/*` | Why, and rules spanning screens |
| 3 | `packages/tokens` | Convenience for shared values. **May be incomplete.** |
| 4 | `plans/*` | Behaviour and intent, never appearance |

Open the design file for the screen you are building, in **both themes**, every time.

`designs/*.html` are bundled pages — the readable markup is not in the file you open. Run
`node designs/extract.mjs` and read `designs/extracted/`. Never edit the raw exports.

### 2. The plan file is the unit of work

One todo, one commit. Checkbox carries the short SHA. If the plan is wrong, change the
plan first in its own `docs(plan):` commit with a `**Note (session N):**` block. Never
diverge silently.

**Here, every screen todo is two checkboxes** — see the verification contract in
`00-START-HERE.md`. You may only ever tick the first.

**Build as many screens as your context allows before handing over.** The owner runs them
all in one pass. Do not stop early to get a slice run.

### 3. `systems/` holds the why

`systems/09-decisions.md` is numbered and immutable. Cite decisions in code by number:
`// the bezel is not a UI colour (D-001)`. Add new ones; never edit old ones.

### 4. `progress/` is the memory

`00-START-HERE.md` is **rewritten** every session, not appended, and must be self-contained.
`04-changelog.md` is newest-first and is where *reasoning* lives — git already has the file
list. Write the entry you would want to find.

`03-screen-status.md` is the screen-by-screen ledger, and it is the file the owner
actually asks about. **Update it in the same commit that builds a screen**, not at the
end of the session. Talk about progress in screens, not in features: "onboarding is 0 of
5" is an answer, "the motion layer is done" is not.

### 5. Know your execution limits — established by trying, session 1

| Capability | Result |
|---|---|
| Node | ✅ v22.22.3 |
| `git` read | ✅ works, warns it cannot unlink `.git/index.lock` |
| `git` commit | ❌ no `user.email` / `user.name` |
| Create files | ✅ |
| **Delete files** | ❌ `rm` → `Operation not permitted` |
| **Move / rename** | ✅ `mv` works — relocate instead of deleting |
| `pnpm` | ❌ not on PATH — you can edit `package.json`, you cannot install |
| `tsc` | ✅ `node_modules/.bin/tsc` |
| **Run the app** | ❌ never. The owner does this. |

Re-test these at the start of each session rather than trusting the table.

### 5b. **The owner runs Windows PowerShell. Write commands for PowerShell.**

Established the hard way in session 8b: a whole command list was handed over in
bash and most of it failed on syntax before it reached git. This is the single
most wasteful mistake an agent has made in this project, because it costs the
owner a round trip every time and nothing about it is visible from inside the
sandbox — which is Linux.

The four that actually bit:

| Wrong (bash) | Right (PowerShell) | What happens otherwise |
|---|---|---|
| `rm -f path` | `Remove-Item -Force path` | `-f` is ambiguous between `-Filter` and `-Force`; PowerShell refuses rather than guessing |
| `a && b` | `a; b` — or two lines | `&&` is not a statement separator in Windows PowerShell 5.1 |
| trailing `\` to continue a line | backtick `` ` `` — or just one long line | `\` is read as a path argument and git reports it as outside the repository |
| `cd dir && cmd` | `cd dir` then `cmd`, then `cd ..` | same `&&` problem, and `cd -` does not exist |

Two more rules that follow from it:

- **Always give paths from the repository root.** A list of bare filenames with
  a comment saying "run this from `apps/native/`" gets pasted whole and fails.
  Prefix every path.
- **`git rm` fails on a file you have edited.** Agents cannot delete files here
  (see the table below), so the convention is to tombstone: overwrite the file
  with a comment and hand over a `git rm`. But a tombstone is a *modification*,
  and plain `git rm` refuses with "the following files have local
  modifications". **Always hand over `git rm -f`.**

Multi-line commit messages do work in PowerShell — an unterminated quote opens
a continuation prompt and the message lands correctly.

### 6. Every value in two places gets a test spanning the gap

`packages/tokens/test/design-parity.mjs` compares TypeScript tokens against design HTML.
Run it after any token change:

```
node packages/tokens/test/design-parity.mjs
node packages/tokens/test/design-parity.mjs --tamper   # must exit 1
```

**Make every new check fail once, deliberately.** A check with a subtly broken pattern
passes forever because it matches nothing.

---

## Anti-patterns that already appeared in this project

| Anti-pattern | What happened here |
|---|---|
| **Writing bash for a Windows owner** | Session 8b. `rm -f`, `&&`, `\` continuations and bare relative paths — most of a command list failed on syntax. See §5b. The sandbox is Linux and gives no hint that the owner's shell is not. |
| **`git rm` on a tombstoned file** | Same session. Agents cannot delete here, so files are tombstoned instead — which makes them modified, which makes plain `git rm` refuse. Hand over `git rm -f`. |
| **Building from tokens instead of designs** | `dark.onPrimary` was copied from light. The amber is identical in both themes; the text on it is not (`#3B2400` vs `#4A3000`). Caught only by the parity test. |
| **Simplifying a fill** | The Daily background is a three-stop radial gradient with a warm glow, not flat `#FFF9EF`. Plausible in code, wrong on screen. |
| **Trusting a census over the file** | `#20160C` is the most frequent dark background and is the device mockup bezel, not UI (D-001). |
| **A test that cannot fail** | Prevented, not suffered: `--tamper` exists because of this. |
| **Config for the wrong major version** | **Still live.** Tokens are not yet wired into uniwind. Until something is rendered, the whole styling layer could be inert and look self-consistent. |

---

## Definition of done for a session

- [ ] Every screen built was read from its design file, both themes
- [ ] Every divergence has a `Note (session N)` in its plan file
- [ ] New tokens exist in both palettes and the parity test covers them
- [ ] New user-facing strings go through the localisation layer, not inline
- [ ] Typecheck clean, or the exact remaining errors named with reasons
- [ ] Any new check has been made to fail once
- [ ] Screen todos are **"code-complete, unverified"** — device ticks are the owner's
- [ ] `04-changelog.md` has a new top entry with the reasoning
- [ ] `00-START-HERE.md` rewritten and self-contained
- [ ] Judgement calls made in the owner's absence are in one visible list
