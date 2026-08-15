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
 * --tamper runs a list of named corruptions, each aimed at ONE rule, and
 * requires every one of them to go red. A check written with a subtly broken
 * pattern passes forever because it matches nothing; a check written with an
 * over-broad pattern rejects legitimate values. Both are caught here.
 *
 * ── Note (session 2) ──────────────────────────────────────────────────────
 * The D-001 bezel rule used to match the colour *family* `rgba(58,42,24,…)`
 * at any alpha, and that turned out to be unsound in both directions:
 *
 *   · 0.07 is the puzzle screens' "PUZZLE 128 · TUESDAY" pill — app UI.
 *   · 0.28 is the device mockup's drop shadow AND the light theme's modal
 *     scrim (`position:absolute;inset:0` in b-nudge-picker-light and
 *     c-zero-coin-prompt-light). The same value, used two ways.
 *
 * So no value-only test can separate them, and tightening the alpha would
 * have banned a real backdrop token. The rule is now split by *use*:
 * `#20160C` is never anything but the bezel, so it is banned outright; the
 * rgba is banned only in keys that name a shadow, which is the one thing the
 * bezel's version of it is. D-001 itself is unchanged.
 * ──────────────────────────────────────────────────────────────────────────
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

const ORIGINAL = readFileSync(TOKENS_SRC, 'utf8');

/* ── Design corpus, loaded once ──────────────────────────────────────────── */

const designFiles = { light: [], dark: [] };
for (const f of readdirSync(EXTRACTED).filter((f) => f.endsWith('.html') && !f.startsWith('_'))) {
  designFiles[f.includes('-dark') ? 'dark' : 'light'].push(readFileSync(join(EXTRACTED, f), 'utf8'));
}

/* ── The check itself, as a pure function of the token source ───────────── */

/**
 * @param {string} src token source text
 * @returns {{failures: string[], warnings: string[], tokenCount: number}}
 */
function check(src) {
  const failures = [];
  const warnings = [];

  // Parse the token source textually rather than importing it: this file must
  // stay runnable under plain node with no TypeScript toolchain available.
  function paletteOf(name) {
    const start = src.indexOf(`export const ${name}: Palette = {`);
    const body = src.slice(start, src.indexOf('};', start));
    const out = {};
    for (const m of body.matchAll(/^\s{2}(\w+):\s*\n?\s*'([^']+)'/gm)) out[m[1]] = m[2];
    return out;
  }

  const themes = {
    light: { tokens: paletteOf('light'), files: designFiles.light },
    dark: { tokens: paletteOf('dark'), files: designFiles.dark },
  };

  // ── 1. Every token value must actually appear in that theme's designs ────
  for (const [theme, { tokens, files }] of Object.entries(themes)) {
    const haystack = files.join('\n').toUpperCase();
    for (const [key, value] of Object.entries(tokens)) {
      // Gradients: match on the stops, since whitespace varies between screens.
      const needles = value.includes('gradient')
        ? [...value.matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toUpperCase())
        : [value.toUpperCase()];

      const missing = needles.filter((n) => !haystack.includes(n));
      if (missing.length)
        failures.push(`${theme}.${key} = ${value} — not found in designs (${missing.join(', ')})`);
    }
  }

  // ── 2. Rules that survive a redesign, not just today's values ────────────

  // The device mockup bezel is not a UI colour (D-001). Split by use — see
  // the Note (session 2) at the top of this file.
  const BEZEL_FILL = /#20160C/i;
  const BEZEL_SHADOW = /RGBA\(\s*58\s*,\s*42\s*,\s*24\s*,\s*0?\.28\s*\)/i;
  for (const [theme, { tokens }] of Object.entries(themes)) {
    for (const [key, value] of Object.entries(tokens)) {
      if (BEZEL_FILL.test(value))
        failures.push(`${theme}.${key} uses the device bezel colour — see D-001`);
      if (/shadow/i.test(key) && BEZEL_SHADOW.test(value))
        failures.push(`${theme}.${key} uses the device bezel's drop shadow as a shadow — see D-001`);
    }
  }

  // Word Hug has no error state, so no error red may ever be defined (D-002).
  for (const [theme, { tokens }] of Object.entries(themes)) {
    for (const key of Object.keys(tokens)) {
      if (/error|danger|destructive|invalid/i.test(key))
        failures.push(`${theme}.${key} — no error colour may exist (D-002)`);
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
    if (new Set(ramp).size !== ramp.length)
      failures.push(`${theme}: text ramp has duplicates — ${ramp.join(', ')}`);
  }

  // ── A dark value that is identical to its light one is probably a copy ───
  //
  // This is the shape of the session-1 `onPrimary` bug, generalised. The amber
  // is genuinely the same in both themes, so it is easy to assume the text on
  // it is too — it is not (#4A3000 vs #3B2400), and nothing on a phone would
  // have complained. The tokens added in session 3 make this much more likely
  // to recur: `pillText` and `textQuiet` are one colour in light and two in
  // dark, so whichever is written second is a tempting copy-paste.
  //
  // The eight below are shared on purpose — the amber, the teal, and the small
  // enamel ornaments are identical in both themes across every screen in the
  // export. Everything else that matches is a question worth answering.
  const SHARED_BY_DESIGN = new Set([
    'primary',
    'accent',
    'onAccent',
    'highlight',
    'coinGlyph',
    'coinDotShadow',
    'streakDotShadow',
    'hintGlyphShadow',
    // The inset shadow inside a toggle track: the amber casting onto itself,
    // so it cannot differ between themes any more than the amber does (16).
    'toggleTrackShadow',
  ]);
  for (const [key, lightValue] of Object.entries(themes.light.tokens)) {
    if (SHARED_BY_DESIGN.has(key)) continue;
    const darkValue = themes.dark.tokens[key];
    if (darkValue && darkValue.toUpperCase() === lightValue.toUpperCase())
      failures.push(
        `dark.${key} = ${darkValue} is identical to light.${key} — copied from the other theme? ` +
          `If it is genuinely shared, add it to SHARED_BY_DESIGN with a reason.`
      );
  }

  // The signature elevation is a hard offset. A blur would change the feel.
  if (!/blur:\s*0\b/.test(src))
    failures.push('elevation.blur must be 0 — the offset shadow is hard, not soft');

  // Both themes must define exactly the same keys.
  const lk = Object.keys(themes.light.tokens).sort().join(',');
  const dk = Object.keys(themes.dark.tokens).sort().join(',');
  if (lk !== dk) failures.push('light and dark define different token keys');

  // ── 2b. Geometry and type tokens must also exist in the designs ──────────
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
    if (!allDesign.includes(`border-radius:${px}px`))
      failures.push(`radius.${key} = ${px}px — no screen uses it`);
  }
  for (const [key, y] of Object.entries(numericGroup('elevation'))) {
    if (key === 'blur') continue;
    if (!allDesign.includes(`box-shadow:0 ${y}px 0`))
      failures.push(`elevation.${key} = ${y} — no screen uses a 0 ${y}px 0 shadow`);
  }
  for (const [key, px] of Object.entries(numericGroup('space'))) {
    if (!allDesign.includes(`gap:${px}px`) && !allDesign.includes(`padding:${px}px`))
      warnings.push(`space.${key} = ${px}px — appears as neither a gap nor a padding`);
  }

  // Single-family interface. Nunito is the export page's chrome, not app UI.
  if (!/font\s*=\s*\{\s*display:\s*'Baloo 2'/.test(src)) failures.push('font.display must be Baloo 2');
  // Match it as a *value* only — the source comments mention Nunito precisely
  // to explain that it is not an app font, and those must not trip the check.
  if (/:\s*'Nunito'/.test(src))
    failures.push("Nunito used as a font value — it is the design export's chrome, not app UI");
  if (!allDesign.includes('Baloo 2')) failures.push('Baloo 2 not found in designs — extraction may be stale');

  // Every face named in `face` must be one the font package actually ships.
  // This is the check that caught it: the designs use font-weight:900, the
  // tokens declared a `heavy` weight, and Baloo 2 has no 900 face at all —
  // its axis stops at 800. Nothing would have complained on a phone; the
  // labels would just have rendered in some other font (D-003).
  const FONT_PKG = join(ROOT, 'apps', 'native', 'node_modules', '@expo-google-fonts', 'baloo-2', 'index.js');
  if (existsSync(FONT_PKG)) {
    const shipped = new Set(
      [...readFileSync(FONT_PKG, 'utf8').matchAll(/export const (Baloo2_\w+)/g)].map((m) => m[1])
    );
    const faceBlock = src.slice(src.indexOf('export const face = {'), src.indexOf('} as const', src.indexOf('export const face = {')));
    for (const m of faceBlock.matchAll(/(\w+):\s*'([^']+)'/g)) {
      if (!shipped.has(m[2]))
        failures.push(`face.${m[1]} = ${m[2]} — @expo-google-fonts/baloo-2 does not ship that face`);
    }
  } else {
    warnings.push('@expo-google-fonts/baloo-2 not installed — could not verify the font faces exist');
  }

  // ── 3. Sanity: the check must be looking at something ────────────────────
  const tokenCount = Object.keys(themes.light.tokens).length;
  if (tokenCount < 10) failures.push(`only parsed ${tokenCount} tokens — the parser is probably broken`);
  if (!themes.light.files.length || !themes.dark.files.length)
    failures.push('no design files loaded for one theme');

  return { failures, warnings, tokenCount };
}

/* ── Tamper mode: every rule must be shown to fire ───────────────────────── */

/**
 * Each case corrupts the source in one specific way and names the rule it is
 * meant to trip. `expect` must appear in at least one failure message —
 * "something failed" is not enough, because the wrong rule firing would hide
 * a rule that never fires at all.
 */
const TAMPER_CASES = [
  {
    name: 'value-not-in-designs',
    expect: /not found in designs/,
    mutate: (s) => s.replace("ground: '#EFE6DA'", "ground: '#EFE6DB'"),
  },
  {
    name: 'bezel-fill',
    expect: /uses the device bezel colour/,
    mutate: (s) => s.replace("ground: '#0C0718'", "ground: '#20160C'"),
  },
  {
    name: 'bezel-shadow',
    expect: /bezel's drop shadow as a shadow/,
    mutate: (s) => s.replace("surfaceShadow: '#E4CFA8'", "surfaceShadow: 'rgba(58,42,24,0.28)'"),
  },
  {
    name: 'error-colour',
    expect: /no error colour may exist/,
    mutate: (s) => s.replace("  highlight: '#FF6B4A'", "  danger: '#FF6B4A'"),
  },
  {
    name: 'text-ramp-collapse',
    expect: /text ramp has duplicates/,
    mutate: (s) => s.replace("textMuted: '#8C7A66'", "textMuted: '#6E5B44'"),
  },
  {
    // The session-1 bug, generalised and frozen: dark copied from light.
    name: 'theme-value-copied',
    expect: /copied from the other theme/,
    mutate: (s) =>
      s.replace("  textQuiet: '#8F79D4',", "  textQuiet: '#9C8A73',"),
  },
  {
    name: 'soft-shadow',
    expect: /elevation\.blur must be 0/,
    mutate: (s) => s.replace('blur: 0,', 'blur: 8,'),
  },
  {
    // Drops whichever key happens to be last in `light`, so this case does not
    // go stale every time a token is added.
    name: 'themes-out-of-step',
    expect: /different token keys/,
    mutate: (s) => {
      const start = s.indexOf('export const light: Palette = {');
      const end = s.indexOf('};', start);
      const body = s.slice(start, end);
      const last = [...body.matchAll(/^ {2}\w+:\s*\n?\s*'[^']+',\n/gm)].pop();
      if (!last) return s;
      return s.slice(0, start) + body.slice(0, last.index) + body.slice(last.index + last[0].length) + s.slice(end);
    },
  },
  {
    name: 'invented-size',
    expect: /size\.\w+ = [\d.]+px — no screen uses it/,
    mutate: (s) => s.replace('  micro: 11.5,', '  micro: 11.5,\n  invented: 37,'),
  },
  {
    name: 'invented-radius',
    expect: /radius\.\w+ = [\d.]+px — no screen uses it/,
    mutate: (s) => s.replace('  hair: 3,\n  sm: 10,', '  hair: 3,\n  invented: 37,\n  sm: 10,'),
  },
  {
    name: 'wrong-font',
    expect: /font\.display must be Baloo 2/,
    mutate: (s) => s.replace("font = { display: 'Baloo 2' }", "font = { display: 'Comic Sans' }"),
  },
  {
    // The session-2 bug, frozen: a face the font package does not ship.
    name: 'missing-font-face',
    expect: /does not ship that face/,
    mutate: (s) => s.replace("heavy: 'Baloo2_800ExtraBold',", "heavy: 'Baloo2_900Black',"),
  },
  {
    name: 'nunito-as-value',
    expect: /Nunito used as a font value/,
    mutate: (s) => s.replace("display: 'Baloo 2' }", "display: 'Baloo 2', body: 'Nunito' }"),
  },
  {
    // The realistic way this parser dies: someone reformats the file and the
    // two-space anchor stops matching. It must not then report a silent pass.
    name: 'broken-parser',
    expect: /the parser is probably broken/,
    mutate: (s) => {
      const start = s.indexOf('export const light: Palette = {');
      const end = s.indexOf('};', start);
      const reindented = s.slice(start, end).replace(/^ {2}(\w+):/gm, '    $1:');
      return s.slice(0, start) + reindented + s.slice(end);
    },
  },
];

if (TAMPER) {
  let broken = 0;
  for (const c of TAMPER_CASES) {
    const mutated = c.mutate(ORIGINAL);
    if (mutated === ORIGINAL) {
      console.error(`  · ${c.name}: MUTATION DID NOT APPLY — the tamper case itself is stale`);
      broken++;
      continue;
    }
    const { failures } = check(mutated);
    const hit = failures.some((f) => c.expect.test(f));
    if (hit) {
      console.log(`  ok   ${c.name} — rule fired`);
    } else {
      console.error(`  · ${c.name}: expected ${c.expect} but got: ${failures.join(' | ') || '(no failures)'}`);
      broken++;
    }
  }
  if (broken) {
    console.error(`\nFAIL — ${broken} of ${TAMPER_CASES.length} rules did not fire when they should have.`);
    console.error('Those rules are not actually looking at anything. Fix them before trusting this file.');
    process.exit(1);
  }
  console.log(`\nPASS — all ${TAMPER_CASES.length} rules were made to fail on demand.`);
  process.exit(0);
}

/* ── Normal run ──────────────────────────────────────────────────────────── */

const { failures, warnings, tokenCount } = check(ORIGINAL);

console.log(
  `Checked ${tokenCount} tokens x 2 themes against ` +
    `${designFiles.light.length} light + ${designFiles.dark.length} dark screens.`
);
for (const w of warnings) console.log(`  WARN  ${w}`);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('PASS — every token value is present in the designs, and all rules hold.');
