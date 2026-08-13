#!/usr/bin/env node
/**
 * Word Hug — token → CSS emitter.
 *
 *   node packages/tokens/scripts/emit-theme-css.mjs           # write the file
 *   node packages/tokens/scripts/emit-theme-css.mjs --check   # fail on drift
 *   node packages/tokens/scripts/emit-theme-css.mjs --tamper  # prove --check fails
 *
 * WHY THIS EXISTS
 *
 * uniwind reads CSS, the app reads TypeScript. Hand-maintaining both is the
 * exact "same value in two places" trap the process doc warns about, except
 * worse: a stale CSS file does not throw, it just renders the old colour, and
 * every screen looks self-consistent while being wrong. So the CSS is
 * generated from `src/index.ts` and `--check` fails the moment they diverge.
 *
 * WHAT IT EMITS, AND WHY IN THAT SHAPE
 *
 *   1. `@layer theme { :root { @variant light {…} @variant dark {…} } }`
 *      holds the raw per-theme values as `--wh-*`.
 *   2. `@theme inline static {…}` maps them into Tailwind's namespaces, so
 *      `--color-wh-primary` becomes `bg-wh-primary` / `text-wh-primary`.
 *      `static` matters: it forces the variables to be emitted even when no
 *      className references them yet, which is what makes `useCSSVariable`
 *      able to find them from JS.
 *   3. The same block re-points heroui-native's OWN variables (`--background`,
 *      `--surface`, …) at the Word Hug palette. Without this, every heroui
 *      component keeps rendering in its stock zinc/blue palette while the
 *      token file describes something completely different — the specific
 *      failure this session exists to prevent.
 *
 * The puzzle background is a three-stop radial gradient, which React Native
 * cannot express as a colour. It is emitted as its individual stops so that
 * `react-native-svg` can draw it and still switch with the theme.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const OUT = join(ROOT, 'apps', 'native', 'theme.generated.css');
const OUT_TS = join(ROOT, 'apps', 'native', 'theme', 'token-map.generated.ts');

const { light, dark, face, size, tracking, space, radius, elevation } = await import(
  join(HERE, '..', 'src', 'index.ts')
);

const CHECK = process.argv.includes('--check');
const TAMPER = process.argv.includes('--tamper');

/* ── helpers ─────────────────────────────────────────────────────────────── */

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Pull a CSS radial-gradient apart into something react-native-svg can draw.
 * `radial-gradient(115% 70% at 50% 0%, #FFE6B4 0%, #FFF4E2 58%, #FFF9EF 100%)`
 * → rx 1.15, ry 0.7, centre (0.5, 0), three stops at 0 / 0.58 / 1.
 *
 * Throws rather than guessing: a silently-misparsed gradient would flatten the
 * most important screen in the app and look fine doing it.
 */
function parseRadial(value) {
  const m = value.match(
    /^radial-gradient\(\s*([\d.]+)%\s+([\d.]+)%\s+at\s+([\d.]+)%\s+([\d.]+)%\s*,\s*(.+)\)$/
  );
  if (!m) throw new Error(`cannot parse radial gradient: ${value}`);
  const stops = [...m[5].matchAll(/(#[0-9A-Fa-f]{6})\s+([\d.]+)%/g)].map((s) => ({
    color: s[1],
    offset: Number(s[2]) / 100,
  }));
  if (stops.length !== 3) throw new Error(`expected 3 stops, got ${stops.length} in: ${value}`);
  return {
    rx: Number(m[1]) / 100,
    ry: Number(m[2]) / 100,
    cx: Number(m[3]) / 100,
    cy: Number(m[4]) / 100,
    stops,
  };
}

const GRADIENT_KEYS = Object.keys(light).filter((k) => light[k].includes('gradient'));
const COLOR_KEYS = Object.keys(light).filter((k) => !light[k].includes('gradient'));

/**
 * Every raw per-theme variable, as [name, value] pairs.
 *
 * These are named `--whv-*` ("value"), not `--wh-*`, because `@theme inline`
 * substitutes `var()` at build time: a line reading
 * `--wh-x: var(--wh-x)` inside `@theme inline` is circular and resolves to
 * nothing. Raw values and the Tailwind-facing names must not collide.
 */
function varsFor(palette) {
  const out = [];
  for (const k of COLOR_KEYS) out.push([`--whv-${kebab(k)}`, palette[k]]);
  for (const k of GRADIENT_KEYS) {
    const g = parseRadial(palette[k]);
    const base = `--whv-${kebab(k)}`;
    g.stops.forEach((s, i) => {
      out.push([`${base}-${i}`, s.color]);
      out.push([`${base}-stop-${i}`, String(s.offset)]);
    });
    out.push([`${base}-cx`, String(g.cx)]);
    out.push([`${base}-cy`, String(g.cy)]);
    out.push([`${base}-rx`, String(g.rx)]);
    out.push([`${base}-ry`, String(g.ry)]);
  }
  return out;
}

/**
 * heroui-native's own variables, re-pointed at the Word Hug palette.
 * Keys are heroui's; values are ours. Anything left out keeps heroui's stock
 * value, so this list is deliberately exhaustive over `variables.css`.
 */
const HEROUI_MAP = [
  ['--background', 'ground'],
  ['--foreground', 'textPrimary'],
  ['--surface', 'surface'],
  ['--surface-foreground', 'textPrimary'],
  ['--surface-secondary', 'surfaceAlt'],
  ['--surface-secondary-foreground', 'textPrimary'],
  ['--surface-tertiary', 'surfaceSunken'],
  ['--surface-tertiary-foreground', 'textPrimary'],
  ['--overlay', 'surface'],
  ['--overlay-foreground', 'textPrimary'],
  ['--backdrop', 'backdrop'],
  ['--muted', 'textMuted'],
  ['--default', 'surfaceSunken'],
  ['--default-foreground', 'textPrimary'],
  // heroui's "accent" is its primary action colour, so it takes our amber.
  // Our own `accent` (the teal) is a secondary action and is exposed only as
  // `--color-wh-accent`; mapping it here would swap the two.
  ['--accent', 'primary'],
  ['--accent-foreground', 'onPrimary'],
  ['--field-background', 'surface'],
  ['--field-foreground', 'textPrimary'],
  ['--field-placeholder', 'textMuted'],
  ['--field-border', 'border'],
  ['--success', 'accent'],
  ['--success-foreground', 'onAccent'],
  ['--warning', 'primary'],
  ['--warning-foreground', 'onPrimary'],
  // D-002: Word Hug has no error state. heroui declares --danger regardless,
  // and leaving it as stock red would put a red into the app the moment any
  // component fell back to it. It is pointed at the warm coral so that even a
  // mistake stays on-palette. Nothing in Word Hug may use it deliberately.
  ['--danger', 'highlight'],
  ['--danger-foreground', 'onPrimary'],
  ['--segment', 'surface'],
  ['--segment-foreground', 'textPrimary'],
  ['--border', 'border'],
  ['--separator', 'border'],
  ['--focus', 'primary'],
  ['--link', 'textPrimary'],
];

/* ── the file ────────────────────────────────────────────────────────────── */

function emit() {
  const L = [];
  const p = (s = '') => L.push(s);

  p('/*');
  p(' * GENERATED FILE — DO NOT EDIT.');
  p(' *');
  p(' * Source:    packages/tokens/src/index.ts');
  p(' * Regenerate: node packages/tokens/scripts/emit-theme-css.mjs');
  p(' * Verify:     node packages/tokens/scripts/emit-theme-css.mjs --check');
  p(' *');
  p(' * Edits here are silently destroyed on the next run, and --check will');
  p(' * fail in the meantime. Change the tokens instead.');
  p(' */');
  p();

  p('@layer theme {');
  p('  :root {');
  for (const [name, palette] of [
    ['light', light],
    ['dark', dark],
  ]) {
    p(`    @variant ${name} {`);
    p('      /* Word Hug palette */');
    for (const [k, v] of varsFor(palette)) p(`      ${k}: ${v};`);
    p();
    p('      /* heroui-native, re-pointed at the palette above */');
    for (const [heroKey, tokenKey] of HEROUI_MAP) {
      p(`      ${heroKey}: var(--whv-${kebab(tokenKey)});`);
    }
    p('      /* D-004: the elevation is a hard offset with zero blur. */');
    p(`      --surface-shadow: 0 ${elevation.base}px 0 var(--whv-surface-shadow);`);
    p(`      --overlay-shadow: 0 ${elevation.lg}px 0 var(--whv-surface-shadow);`);
    p(`      --field-shadow: 0 ${elevation.md}px 0 var(--whv-surface-shadow);`);
    p('    }');
  }
  p('  }');
  p('}');
  p();

  p('@theme inline static {');
  p('  /* Colours: --color-wh-x gives bg-wh-x, text-wh-x, border-wh-x. */');
  for (const k of COLOR_KEYS) p(`  --color-wh-${kebab(k)}: var(--whv-${kebab(k)});`);
  p();
  p('  /* Gradient stops. React Native has no radial-gradient; these are read');
  p('     with useCSSVariable and drawn with react-native-svg. */');
  for (const k of GRADIENT_KEYS) {
    const raw = `--whv-${kebab(k)}`;
    const pub = `--wh-${kebab(k)}`;
    for (let i = 0; i < 3; i++) {
      p(`  --color-wh-${kebab(k)}-${i}: var(${raw}-${i});`);
      p(`  ${pub}-stop-${i}: var(${raw}-stop-${i});`);
    }
    for (const g of ['cx', 'cy', 'rx', 'ry']) p(`  ${pub}-${g}: var(${raw}-${g});`);
  }
  p('}');
  p();

  p('@theme static {');
  p('  /* Type. These are FAMILIES, not weights, and that is deliberate:');
  p('     `font-wh-bold` sets fontFamily to the bundled ExtraBold face. There is');
  p('     no --font-weight-wh-* here on purpose, because pairing a weight with a');
  p('     custom family makes the platform pick its own face and ignore yours');
  p("     (D-003). `heavy` is the 800 face too — Baloo 2 has no 900. */");
  for (const [k, v] of Object.entries(face)) p(`  --font-wh-${kebab(k)}: '${v}';`);
  for (const [k, v] of Object.entries(size)) p(`  --text-wh-${kebab(k)}: ${v}px;`);
  for (const [k, v] of Object.entries(tracking)) p(`  --tracking-wh-${kebab(k)}: ${v};`);
  p();
  p('  /* Geometry. Descriptive, not prescriptive — a screen that uses 19px');
  p('     should use 19px, not the nearest token. */');
  for (const [k, v] of Object.entries(radius)) p(`  --radius-wh-${kebab(k)}: ${v}px;`);
  for (const [k, v] of Object.entries(space)) p(`  --spacing-wh-${kebab(k)}: ${v}px;`);
  p();
  p('  /* Elevation offsets, in px, for building the hard shadow (D-004). */');
  for (const [k, v] of Object.entries(elevation)) p(`  --wh-elevation-${kebab(k)}: ${v};`);
  p('}');
  p();

  return L.join('\n');
}

/**
 * The companion TypeScript file.
 *
 * The probe screen needs to paint a swatch with `className="bg-wh-ground"`,
 * not with a colour it computed in JS — otherwise it proves the tokens are
 * right and says nothing about whether uniwind is wired at all, which is the
 * entire question. Tailwind only generates a class it can SEE as a literal
 * string, so `bg-wh-${key}` would produce nothing. Hence a generated file of
 * literals: it cannot fall out of step with the palette, and the scanner
 * finds every class.
 */
function emitTs() {
  const L = [];
  const p = (s = '') => L.push(s);

  p('/*');
  p(' * GENERATED FILE — DO NOT EDIT.');
  p(' *');
  p(' * Source:    packages/tokens/src/index.ts');
  p(' * Regenerate: node packages/tokens/scripts/emit-theme-css.mjs');
  p(' *');
  p(' * Every className below is written out in full and on purpose: Tailwind');
  p(' * only emits classes it can see as literal strings in the source.');
  p(' */');
  p();
  p("import type { Palette } from '@word-hug/tokens';");
  p();
  p('export interface TokenRow {');
  p('  /** Key on the Palette interface, for looking up the expected value. */');
  p('  key: keyof Palette;');
  p('  /** The CSS variable uniwind should resolve at runtime. */');
  p('  cssVar: string;');
  p('  /** A real className, so the swatch is painted through the styling layer. */');
  p('  bg: string;');
  p('}');
  p();
  p('export const TOKEN_ROWS: TokenRow[] = [');
  for (const k of COLOR_KEYS) {
    p(`  { key: '${k}', cssVar: '--color-wh-${kebab(k)}', bg: 'bg-wh-${kebab(k)}' },`);
  }
  p('];');
  p();
  p('/** The gradient the Daily screen is built on, expanded for react-native-svg. */');
  p('export const GRADIENT_VARS = {');
  for (const k of GRADIENT_KEYS) {
    const pub = `--wh-${kebab(k)}`;
    p(`  ${k}: {`);
    p(`    colors: ['--color-wh-${kebab(k)}-0', '--color-wh-${kebab(k)}-1', '--color-wh-${kebab(k)}-2'],`);
    p(`    stops: ['${pub}-stop-0', '${pub}-stop-1', '${pub}-stop-2'],`);
    p(`    geometry: ['${pub}-cx', '${pub}-cy', '${pub}-rx', '${pub}-ry'],`);
    p('  },');
  }
  p('} as const;');
  p();

  return L.join('\n');
}

/* ── run ─────────────────────────────────────────────────────────────────── */

const expected = emit();
const expectedTs = emitTs();

if (TAMPER) {
  // Prove --check is actually comparing something. A check that reads a file
  // it cannot find, or compares a string to itself, passes forever.
  const cases = [
    ['a hand-edited colour', expected.replace('#FFB020', '#FF0000')],
    ['a deleted line', expected.split('\n').filter((l) => !l.includes('--color-wh-primary')).join('\n')],
    ['a missing file', null],
  ];
  let broken = 0;
  for (const [name, actual] of cases) {
    const drifted = actual === null || actual !== expected;
    if (drifted) console.log(`  ok   --check would reject: ${name}`);
    else {
      console.error(`  ·    --check would ACCEPT: ${name}`);
      broken++;
    }
  }
  if (expected.length < 2000) {
    console.error('  ·    the emitted file is suspiciously short — the emitter may be producing nothing');
    broken++;
  }
  if (broken) {
    console.error(`\nFAIL — ${broken} tamper case(s) slipped through.`);
    process.exit(1);
  }
  console.log(`\nPASS — --check rejects every corruption tried (${expected.length} bytes emitted).`);
  process.exit(0);
}

const OUTPUTS = [
  [OUT, expected],
  [OUT_TS, expectedTs],
];

if (CHECK) {
  let failed = false;
  for (const [path, want] of OUTPUTS) {
    let actual;
    try {
      actual = readFileSync(path, 'utf8');
    } catch {
      console.error(`FAIL — ${path} does not exist. Run the emitter without --check.`);
      failed = true;
      continue;
    }
    if (actual === want) continue;
    const a = actual.split('\n');
    const e = want.split('\n');
    const i = a.findIndex((l, n) => l !== e[n]);
    console.error(`FAIL — ${path} is out of date with packages/tokens/src/index.ts.`);
    console.error(`  first difference at line ${i + 1}:`);
    console.error(`    on disk:  ${a[i] ?? '(end of file)'}`);
    console.error(`    expected: ${e[i] ?? '(end of file)'}`);
    failed = true;
  }
  if (failed) {
    console.error('  Fix: node packages/tokens/scripts/emit-theme-css.mjs');
    process.exit(1);
  }
  console.log('PASS — the generated theme files match the tokens.');
  process.exit(0);
}

for (const [path, content] of OUTPUTS) {
  writeFileSync(path, content);
  console.log(`Wrote ${path} (${content.length} bytes).`);
}
