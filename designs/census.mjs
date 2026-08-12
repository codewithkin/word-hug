#!/usr/bin/env node
/**
 * Word Hug — design value census.
 *
 * ⚠️ READ THIS BEFORE USING THE OUTPUT ⚠️
 *
 * A frequency count is for spotting what is COMMON. It is not a substitute for
 * opening the screen you are building. This project's own Daily Puzzle
 * background is a three-stop radial gradient — a census that only counts flat
 * hex values will not show it, and you will ship the wrong background on the
 * most-used screen in the app.
 *
 * Use this to find candidates for tokens. Then open the file.
 *
 *   node designs/census.mjs            # colours by CSS role, per theme
 *   node designs/census.mjs --geom     # radii, sizes, weights, gradients
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'extracted');
const GEOM = process.argv.includes('--geom');

const files = readdirSync(DIR).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
const themes = { light: [], dark: [] };
for (const f of files) (f.includes('-dark') ? themes.dark : themes.light).push(f);

/** count[role][value] = { n, screens:Set } */
function tally(fileList) {
  const count = {};
  const add = (role, val, screen) => {
    count[role] ??= {};
    count[role][val] ??= { n: 0, screens: new Set() };
    count[role][val].n++;
    count[role][val].screens.add(screen);
  };

  for (const f of fileList) {
    const text = readFileSync(join(DIR, f), 'utf8');
    const screen = f.replace(/-(light|dark)\.html$/, '');

    if (GEOM) {
      for (const m of text.matchAll(/border-radius:\s*([^;"]+)/g)) add('radius', m[1].trim(), screen);
      for (const m of text.matchAll(/font-size:\s*([^;"]+)/g)) add('font-size', m[1].trim(), screen);
      for (const m of text.matchAll(/font-weight:\s*([^;"]+)/g)) add('font-weight', m[1].trim(), screen);
      for (const m of text.matchAll(/font-family:\s*'([^']+)'/g)) add('font-family', m[1].trim(), screen);
      for (const m of text.matchAll(/(?:^|[;"])gap:\s*([^;"]+)/g)) add('gap', m[1].trim(), screen);
      // Gradients are the thing a colour census misses. Surface them loudly.
      for (const m of text.matchAll(/((?:radial|linear)-gradient\([^)]*\)[^;"]*)/g))
        add('GRADIENT', m[1].trim().slice(0, 110), screen);
    } else {
      // Colour by the property it sits on — a hex used as a shadow is not a surface.
      for (const m of text.matchAll(/(background|color|border|box-shadow|stroke|fill)(-color)?:\s*([^;"]+)/g)) {
        const role = m[1];
        const val = m[3].trim();
        if (val.includes('gradient')) { add('background(gradient)', val.slice(0, 90), screen); continue; }
        for (const hex of val.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)) add(role, hex[0].toUpperCase(), screen);
        for (const rgba of val.matchAll(/rgba?\([^)]+\)/g)) add(role, rgba[0].replace(/\s+/g, ''), screen);
      }
    }
  }
  return count;
}

for (const [theme, list] of Object.entries(themes)) {
  console.log(`\n${'='.repeat(64)}\n${theme.toUpperCase()}  (${list.length} screens)\n${'='.repeat(64)}`);
  const count = tally(list);
  for (const role of Object.keys(count).sort()) {
    const vals = Object.entries(count[role]).sort((a, b) => b[1].n - a[1].n);
    console.log(`\n${role}  —  ${vals.length} distinct`);
    for (const [val, { n, screens }] of vals.slice(0, GEOM ? 16 : 26)) {
      console.log(`  ${String(n).padStart(4)}x  ${screens.size.toString().padStart(2)} scr  ${val}`);
    }
    if (vals.length > (GEOM ? 16 : 26)) console.log(`  … ${vals.length - (GEOM ? 16 : 26)} more`);
  }
}
