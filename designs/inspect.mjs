#!/usr/bin/env node
/**
 * Word Hug — design bundle inspector.
 *
 * Answers "where is the actual design in these files?" by hashing every
 * manifest entry across all bundles: entries that appear in every file are
 * shared runtime/fonts, entries unique to one file are that page's screens.
 *
 *   node designs/inspect.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const sources = readdirSync(HERE)
  .filter((f) => /^\d\d-.*\.html$/.test(f))
  .sort();

const seen = new Map(); // hash -> { files:[], len, mime }

// Which raw <script type="__bundler/*"> blocks exist, and how big?
const first = readFileSync(join(HERE, sources[0]), 'utf8');
console.log(`=== raw script blocks in ${sources[0]} ===`);
for (const m of first.matchAll(/<script type="(__bundler\/[a-z_]+)">/g)) {
  const tag = `<script type="${m[1]}">`;
  const start = first.indexOf(tag) + tag.length;
  const end = first.indexOf('</script>', start);
  console.log(`  ${m[1].padEnd(24)} ${end - start} chars`);
}

for (const src of sources) {
  const html = readFileSync(join(HERE, src), 'utf8');
  const m = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  if (!m) continue;
  const manifest = JSON.parse(m[1]);

  for (const [, entry] of Object.entries(manifest)) {
    let text;
    try {
      const buf = Buffer.from(entry.data, 'base64');
      text = (entry.compressed ? gunzipSync(buf) : buf).toString('utf8');
    } catch {
      continue;
    }
    const h = createHash('sha1').update(text).digest('hex').slice(0, 10);
    if (!seen.has(h)) seen.set(h, { files: [], len: text.length, mime: entry.mime, text });
    seen.get(h).files.push(basename(src, '.html'));
  }
}

console.log(`\n=== ${seen.size} distinct entries across ${sources.length} bundles ===\n`);

const unique = [];
for (const [h, v] of seen) {
  const shared = v.files.length > 1;
  if (!shared && !v.mime.startsWith('font')) unique.push({ h, ...v });
  console.log(
    `${h}  ${v.mime.padEnd(22)} ${String(v.len).padStart(7)}  x${v.files.length}  ` +
      (shared ? 'SHARED' : `UNIQUE → ${v.files[0]}`)
  );
}

console.log(`\n=== ${unique.length} page-specific entries ===`);
for (const u of unique) {
  const hexes = [...u.text.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((x) => x[0].toUpperCase());
  const labels = [...u.text.matchAll(/data-screen-label=\\?["']([^"'\\]+)/g)].map((x) => x[1]);
  const classes = (u.text.match(/className:/g) || []).length;
  console.log(
    `\n${u.files[0]}  (${u.len} chars)\n` +
      `  unique hexes: ${new Set(hexes).size}   className refs: ${classes}   screen labels: ${labels.length}`
  );
  if (hexes.length) console.log(`  sample hexes: ${[...new Set(hexes)].slice(0, 12).join(' ')}`);
  if (labels.length) {
    for (const l of labels.slice(0, 30)) console.log(`    · ${l}`);
    if (labels.length > 30) console.log(`    … +${labels.length - 30} more`);
  }
}
