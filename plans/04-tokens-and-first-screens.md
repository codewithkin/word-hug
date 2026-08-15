# 04 — Wire the tokens, then the first screens

**Opened:** session 2. **Status:** code-complete, unverified.

The rule from `progress/00-START-HERE.md` applies to every screen todo here:
**two checkboxes, and only the first is the agent's.** "Code-complete" means the
code was written from the design file in both themes and typechecks. It does not
mean it looks right, because nobody has seen it.

---

## 1. Token layer

- [x] **1.1 — Emit CSS from the tokens instead of hand-writing it.**
      `packages/tokens/scripts/emit-theme-css.mjs` reads `src/index.ts` and
      writes `apps/native/theme.generated.css` plus
      `apps/native/theme/token-map.generated.ts`.
      *Done when:* `--check` fails on any hand edit and `--tamper` proves
      `--check` can fail. ✅ both.

- [x] **1.2 — Point heroui-native's variables at the Word Hug palette.**
      The generated CSS overrides `--background`, `--surface`, `--foreground`,
      `--accent`, `--danger` and 25 others inside `@variant light` / `@variant
      dark`.
      *Done when:* the override block is emitted for both themes and imported
      after `heroui-native/styles` in `global.css`. ✅
      *Not done when:* a heroui component renders in stock zinc — that is
      todo 1.5's job to detect, and it cannot be claimed here.

- [x] **1.3 — Extend the palette to cover a puzzle screen.**
      21 tokens → 45. The additions are the clue card, the answer tile, the
      keycap, the chip, the ornament shadows and the modal backdrop.
      *Done when:* the parity test passes with every new value found in the
      designs, and both themes define identical keys. ✅

- [x] **1.4 — Make every parity rule provably able to fail.**
      The test was one function with one tamper case; it is now 13 named cases,
      each aimed at one rule and each required to fire.
      *Done when:* `--tamper` reports 13/13. ✅

- [ ] **1.5 — verified on device — OWNER RUNS. Do not tick this yourself.**
      Open the token probe, in **both** themes. Every row must say OK, the
      puzzle-ground panel must show a warm glow at the top rather than a flat
      block, and all three type samples must look like Baloo 2.

---

## 2. Navigation

- [x] **2.1 — Remove the Better-T-Stack drawer/tabs boilerplate.**
      Relocated to `apps/native/.trash-session-2/` (the sandbox cannot delete)
      and excluded from typechecking. `scripts/session-2-cleanup.sh` finishes it.
      *Done when:* `apps/native/app/` contains only real routes. ✅

- [ ] **2.2 — Replace the temporary "Open token probe" link on Daily** once
      1.5 is signed off. It is scaffolding, and it violates the Daily screen's
      own design.

---

## 3. Screens

- [x] **3.1 — Daily Puzzle, code-complete** — built from
      `designs/extracted/09-daily-puzzle-{light,dark}.html`.
- [ ] **3.1b — verified on device — OWNER RUNS.**
      Specifically worth staring at: the background gradient, the hard
      shadows under every surface, and the three different dark purples.

- [x] **3.2 — Not Found, code-complete** — built from
      `designs/extracted/03-not-found-{light,dark}.html`. It was still
      stock heroui boilerplate.
- [ ] **3.2b — verified on device — OWNER RUNS.**

- [x] **3.3 — Token probe, code-complete.** Not a product screen; delete it
      when the palette is trusted.
- [ ] **3.3b — verified on device — OWNER RUNS.** This is todo 1.5.

- [ ] **3.4 — Solve celebration** (`a-solve-celebration-{light,dark}`).
      Not started. It is the moment the product exists for and it should not be
      built on a palette that has not been confirmed on a screen.

- [ ] **3.5 — Onboarding** (`03-onboarding/`, `04-welcome`, `05-try-the-game`,
      `06-the-ritual`, `07-notification-priming`). Owner asked for it in
      session 1; still the right next thing after 3.4.

---

## 4. Motion

- [x] **4.1 — One motion module, not per-screen animation.**
      `components/motion.tsx` holds every timing. `MOTION.settle` is a heavily
      damped spring on purpose: a springy interface is a playful one and Word
      Hug is a calm one.
      *Done when:* no screen defines its own spring config. ✅

- [x] **4.2 — Presses compress the chunky shadow.**
      `ChunkyPressable` moves a surface down by exactly the amount its shadow
      shrinks, so the bottom edge stays put and the surface reads as a physical
      thing being pushed into its shadow.

- [ ] **4.3 — verified on device — OWNER RUNS.** Two specific risks:
      Moti 0.30 advertises Reanimated **3** and this project is on Reanimated
      **4.5**; and the caret's slow breath may read as a metronome, which rule 1
      forbids. Delete `Breathe` if it does — nothing depends on it.

---

## 5. Recorded divergences

Every place the code knowingly differs from a design file. Nothing here is an
oversight; anything not listed here that differs **is**.

| Where | Divergence | Why |
|---|---|---|
| All screens | Status bar, notch and home indicator are not drawn | They are the device mockup's chrome, not app UI (D-001). Replaced with real safe-area insets. |
| All screens | `font-weight:900` renders as the 800 face | Baloo 2 has no 900 face; its axis stops at 800. The browser synthesised it, a phone will not. See `face` in the tokens. |
| Not Found | Blank tiles use the Daily screen's inset shadow (0.18/0.28) rather than their own (0.16/0.30) | Same fill colours, two-hundredths of alpha apart, on a subtle inset. Design noise rather than intent; two near-duplicate tokens would cost more than they buy. |
| Daily | Only five letter keys | That is what the design shows. It is a mock of the keyboard, not the keyboard. |
| Daily | Content is hard-coded | This slice asks "is it the right colour and shape", not "does the game work". |

---

## 6. Next, in order

1. Owner runs the build and reports on 1.5, 3.1b, 3.2b, 4.3.
2. Fix whatever comes back. That is the only real signal about appearance the
   project ever gets, so it outranks everything below.
3. Solve celebration (3.4), then onboarding (3.5).
4. Real puzzle state and input — the keyboard, the guess, the gentle nudge.
5. Generate the puzzle bank; the validator is proven and the bank is empty.
