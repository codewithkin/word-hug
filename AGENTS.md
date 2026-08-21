# AGENTS.md

Word Hug — a cozy word-puzzle game. `apps/native` (Expo SDK 57) is the product;
`apps/web` (Next.js 16) is only the landing/privacy site the stores require.
pnpm + Turborepo; packages: `ui` (shared shadcn), `tokens`, `env`, `config`.

## Verify before claiming done

- `pnpm check` — the gate. Runs five custom node scripts: imports-check,
  daily-loop-check, level-bank staleness, level-check, nav-check.
- `npx tsc -p tsconfig.check.json --noEmit` from `apps/native` — seconds, and
  it covers `lib/`. A full-project tsc run is slow to the point of uselessness;
  never use it as the feedback loop.
- **There is no test runner.** The scripts in `scripts/` are the tests. They
  assert on source shape, not behaviour, because modules are TS with no build
  step — read their headers for what each can and cannot prove.
- Every new check must be made to **fail once deliberately** before you trust
  it. Four real bugs were caught this way; every false-green here came from a
  check asking a slightly wrong question.

## Generated files — never hand-edit

- `apps/native/content/levels.ts` / `pack-levels.ts`: emitted from
  `scripts/levels.source.mjs` by `pnpm levels:build`. Edit the source, rebuild,
  commit both together (`--check` fails on staleness).
- `apps/native/theme.generated.css` and `theme/token-map.generated.ts`: emitted
  by `packages/tokens` (`pnpm tokens:css`; `pnpm tokens:test` guards parity).
- `apps/web/AGENTS.md` contains a Next.js agent-rules block that `next dev`
  rewrites automatically. Keep it committed; do not hand-tune it.

## Design precedence (D-005)

`designs/extracted/*.html` > `systems/*` > `packages/tokens` > `plans/*`.
The raw `designs/*.html` are bundled exports — run `node designs/extract.mjs`
and read `designs/extracted/`, both themes, every time. Tokens may be
incomplete; designs are not.

## Conventions that differ from defaults

- `systems/09-decisions.md` is numbered and immutable — cite decisions in code
  as `// D-0xx`, add new ones, never edit old ones.
- `progress/00-START-HERE.md` is rewritten self-contained each session;
  `04-changelog.md` gets a newest-first entry carrying the *reasoning*;
  `03-screen-status.md` updates in the same commit as screen changes.
- Entitlement/product ids in `content/packs.ts` must match the RevenueCat
  dashboard **exactly, spaces included**. `systems/*` docs own their domains.
- `.gitattributes` pins LF repo-wide; ending flips show up as whole-file diffs.
- `.npmrc`'s `virtual-store-dir-max-length=60` is load-bearing: EAS fingerprints
  hash those paths, so "normalising" it breaks `runtimeVersion.policy`.

## Operational gotchas

- Never run the app or a device emulator — the owner verifies on device.
  Screens ship "code-complete, unverified"; say so, don't imply otherwise.
- A `package.json` edit and its regenerated `pnpm-lock.yaml` are one commit:
  CI installs `--frozen-lockfile`, so the first sign of drift is an EAS failure,
  not a local one. Build EAS from a clean pushed tree (no `*` SHA).
- The owner's shell is Windows PowerShell: hand over `Remove-Item -Force`,
  `;` separators, no `\` continuations, repo-root-relative paths, `git rm -f`
  for tombstoned files. Details: `progress/AGENT-PROCESS.md` §5b.
- In hosted sandboxes, deletion and `git commit` fail and pnpm is absent —
  re-test on arrival; the tables in `progress/00-START-HERE.md` record what
  each environment could do last time.
