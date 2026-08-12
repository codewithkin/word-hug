#!/usr/bin/env node
/**
 * Word Hug — design/token parity test  (Pillar 6)
 *
 * The tokens live in TypeScript. The designs live in HTML. Neither can import
 * the other, so without this check both sides will happily agree with each
 * other while disagreeing with reality, and nothing will ever complain.
 *
 *   node packages/tokens/test/design-parity.mjs
 *   node packages/tokens/test/design-parity.mjs --tamper   # prove it can fail
 *
 * --tamper corrupts one token in memory and expects the run to go red. A check
 * written with a subtly broken pattern passes forever because it matches
 * nothing; run this after any edit to the matching logic.
 *
 * Requires designs/extracted/ — run `node designs/extract.mjs` first.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const EXTRACTED = join(ROOT, 'designs', 'extracted');
const TOKENS_SRC = join(ROOT, 'packages', 'tokens', 'src', 'index.ts');
const TAMPER = process.argv.includes('--tamper');

if (!existsSync(EXTRACTED)) {
  console.error('designs/extracted/ missing. Run: node designs/extract.mjs');
  process.exit(2);
}

// Parse the token source textually rather than importing it: this file must
// run under plain node with no TypeScript toolchain available.
let src = readFileSync(TOKENS_SRC, 'utf8');
if (TAMPER) src = src.replace('#EFE6DA', '#EFE6DB'); // one digit, deliberately wrong

function paletteOf(name) {
  const start = src.indexOf(`export const ${name}: Palette = {`);
  const body = src.slice(start, src.indexOf('};', start));
  const out = {};
  for (const m of body.matchAll(/^\s{2}(\w+):\s*\n?\s*'([^']+)'/gm)) out[m[1]] = m[2];
  return out;
}

const themes = {
  light: { tokens: paletteOf('light'), files: [] },
  dark: { tokens: paletteOf('dark'), files: [] },
};

for (const f of readdirSync(EXTRACTED).filter((f) => f.endsWith('.html') && !f.startsWith('_'))) {
  (f.includes('-dark') ? themes.dark : themes.light).files.push(readFileSync(join(EXTRACTED, f), 'utf8'));
}

const failures = [];
const warnings = [];

// ── 1. Every token value must actually appear in that theme's designs ───────
for (const [theme, { tokens, files }] of Object.entries(themes)) {
  const haystack = files.join('\n').toUpperCase();
  for (const [key, value] of Object.entries(tokens)) {
    // Gradients: match on the stops, since whitespace varies between screens.
    const needles = value.includes('gradient')
      ? [...value.matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toUpperCase())
      : [value.toUpperCase()];

    const missing = needles.filter((n) => !haystack.includes(n));
    if (missing.length) failures.push(`${theme}.${key} = ${value} — not found in designs (${missing.join(', ')})`);
  }
}

// ── 2. Rules that survive a redesign, not just today's values ──────────────

// The device mockup bezel is not a UI colour (D-001).
for (const [theme, { tokens }] of Object.entries(themes)) {
  for (const [key, value] of Object.entries(tokens)) {
    if (/#20160C|RGBA\(58,42,24/i.test(value)) failures.push(`${theme}.${key} uses the device bezel colour — see D-001`);
  }
}

// Word Hug has no error state, so no error red may ever be defined (D-002).
for (const [theme, { tokens }] of Object.entries(themes)) {
  for (const [key, value] of Object.entries(tokens)) {
    if (/error|danger|destructive|invalid/i.test(key)) failures.push(`${theme}.${key} — no error colour may exist (D-002)`);
  }
}

// Pure black and pure white as *grounds* would break the warm palette.
for (const [theme, { tokens }] of Object.entries(themes)) {
  for (const k of ['ground', 'textPrimary']) {
    if (['#000000', '#FFFFFF'].includes((tokens[k] || '').toUpperCase()))
      failures.push(`${theme}.${k} is pure black/white — the palette is warm, never neutral`);
  }
}

// Text ramps must stay distinguishable, or hierarchy silently collapses.
for (const [theme, { tokens }] of Object.entries(themes)) {
  const ramp = ['textPrimary', 'textSecondary', 'textMuted', 'textFaint'].map((k) => tokens[k]);
  if (new Set(ramp).size !== ramp.length) failures.push(`${theme}: text ramp has duplicates — ${ramp.join(', ')}`);
}

// The signature elevation is a hard offset. A blur would change the product's feel.
if (!/blur:\s*0\b/.test(src)) failures.push('elevation.blur must be 0 — the offset shadow is hard, not soft');

// Both themes must define exactly the same keys.
const lk = Object.keys(themes.light.tokens).sort().join(',');
const dk = Object.keys(themes.dark.tokens).sort().join(',');
if (lk !== dk) failures.push('light and dark define different token keys');

// ── 2b. Geometry and type tokens must also exist in the designs ────────────
const allDesign = [...themes.light.files, ...themes.dark.files].join('\n');

/** Pull a numeric token group out of the source, e.g. `size` or `radius`. */
function numericGroup(name) {
  const start = src.indexOf(`export const ${name} = {`);
  if (start === -1) return {};
  const body = src.slice(start, src.indexOf('} as const', start));
  const out = {};
  for (const m of body.matchAll(/(\w+):\s*([\d.]+)\s*,/g)) out[m[1]] = m[2];
  return out;
}

for (const [key, px] of Object.entries(numericGroup('size'))) {
  if (!allDesign.includes(`font-size:${px}px`)) failures.push(`size.${key} = ${px}px — no screen uses it`);
}
for (const [key, px] of Object.entries(numericGroup('radius'))) {
  if (!allDesign.includes(`border-radius:${px}px`)) failures.push(`radius.${key} = ${px}px — no screen uses it`);
}
for (const [key, y] of Object.entries(numericGroup('elevation'))) {
  if (key === 'blur') continue;
  if (!allDesign.includes(`box-shadow:0 ${y}px 0`)) failures.push(`elevation.${key} = ${y} — no screen uses a 0 ${y}px 0 shadow`);
}
for (const [key, px] of Object.entries(numericGroup('space'))) {
  if (!allDesign.includes(`gap:${px}px`) && !allDesign.includes(`padding:${px}px`))
    warnings.push(`space.${key} = ${px}px — appears as neither a gap nor a padding`);
}

// Single-family interface. Nunito is the export page's chrome, not app UI.
if (!/font\s*=\s*\{\s*display:\s*'Baloo 2'/.test(src)) failures.push('font.display must be Baloo 2');
// Match it as a *value* only — the source comments mention Nunito precisely to
// explain that it is not an app font, and those must not trip the check.
if (/:\s*'Nunito'/.test(src)) failures.push('Nunito used as a font value — it is the design export\'s chrome, not app UI');
if (!allDesign.includes('Baloo 2')) failures.push('Baloo 2 not found in designs — extraction may be stale');

// ── 3. Sanity: the check must be looking at something ──────────────────────
const tokenCount = Object.keys(themes.light.tokens).length;
if (tokenCount < 10) failures.push(`only parsed ${tokenCount} tokens — the parser is probably broken`);
if (!themes.light.files.length || !themes.dark.files.length) failures.push('no design files loaded for one theme');

// ── Report ────────────────────────────────────────────────────────────────
console.log(
  `Checked ${tokenCount} tokens x 2 themes against ` +
    `${themes.light.files.length} light + ${themes.dark.files.length} dark screens.`
);
for (const w of warnings) console.log(`  WARN  ${w}`);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  · ${f}`);
  if (TAMPER) console.error('\n(--tamper was set, so failing here is the correct result.)');
  process.exit(1);
}

if (TAMPER) {
  console.error('\nFAIL — --tamper was set but everything still passed.');
  console.error('The check is not actually looking at the values. Fix it before trusting it.');
  process.exit(1);
}

console.log('PASS — every token value is present in the designs, and all rules hold.');
