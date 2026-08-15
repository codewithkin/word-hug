# Decision log

Numbered, immutable, cited by number in code. When a decision is superseded,
add a new one and mark the old **SUPERSEDED BY D-0xx** — never edit or delete.

A comment saying `// D-004` is worth ten saying `// careful here`.

---

## D-001 — The device bezel is not a UI colour

**Session 1.**

`#20160C` appears on all 84 extracted screens and `rgba(58,42,24,0.28)` on most.
Both look like strong candidates for a token — `#20160C` is the single most
frequent background in the dark set.

Neither is app UI. They are the **device mockup** in the design export: a
414px-wide rounded frame with a drop shadow, wrapping the real 390×844 screen.

```html
<div style="width:414px;padding:12px;background:#20160C;border-radius:58px;
            box-shadow:0 24px 60px rgba(58,42,24,0.28)">
  <div data-screen-label="09 Daily Puzzle · light" style="width:390px;height:844px;...">
```

**Rule:** never tokenise a value that comes from outside the 390×844 frame.
Enforced by `packages/tokens/test/design-parity.mjs`.

---

## D-002 — Word Hug has no error colour

**Session 1.** Derived from PRD §1.1 principle 1 and §2.4.

A wrong guess produces no red, no shake, no sound, and no attempt counter. The
feedback line uses ordinary body text styling. There is therefore **no error,
danger, destructive, or invalid colour anywhere in the system** — not defined,
not imported, not available to be reached for under deadline pressure.

`#FF6B4A` (coral) exists and is *not* an error colour. It is warmth and emphasis.
It is named `highlight` specifically so nobody reaches for it as "the red one".

**Rule:** the parity test fails if any token key matches
`/error|danger|destructive|invalid/i`. This is deliberately a rule about names,
not values, so it survives a repalette.

---

## D-003 — Every font weight must be a loaded face

**Session 1.**

The designs use Baloo 2 and Nunito at weights 700, 800, and 900. Custom font
families **do not synthesise weights** on iOS or Android — asking for 900 when
only 700 is loaded renders 700 silently, with no warning and no crash.

The export bundles nine woff2 faces, which is the real weight inventory.

**Rule:** every weight used in code must correspond to a loaded face. Prefer
encoding the choice so it cannot be got wrong (a `weight` map, not raw numbers).
Verify on a device, not in a web preview — web *will* synthesise and hide the bug.

---

## D-004 — The elevation is a hard offset, not a blur

**Session 1.**

Cards and buttons use `0 5px 0 <solid colour>` — vertical offset, **zero blur**.
This is what makes the interface feel chunky and tactile rather than flat and
generic. It is the single most characterful property in the visual language.

A soft blurred shadow is the reflexive choice and would quietly change the whole
product's character while looking "fine" in isolation.

**Rule:** `elevation.blur` is 0 and the parity test asserts it. Pressed states
reduce the offset (5px → 2px) rather than adding blur.

---

## D-005 — Tokens are rank 3; the design files are rank 1

**Session 1.** Restating the process rule as a project decision because it was
nearly violated in the first hour of building tokens.

`packages/tokens` exists for values many screens share. It is **allowed to be
incomplete**. The designs are not.

The concrete case: `dark.onPrimary` was written as `#4A3000` by copying the light
value, on the reasonable assumption that identical amber buttons carry identical
text. They do not — dark uses `#3B2400`. The parity test caught it on its first
run, before any screen consumed the wrong value.

**Rule:** build every screen from `designs/extracted/<screen>.html`, both themes.
Never from this token file.
