#!/usr/bin/env node
/**
 * Word Hug — design extractor (Pillar 1)
 *
 * The design exports are "bundled pages": the real markup is stored as
 * gzipped base64 inside a <script type="__bundler/manifest"> block and
 * inflated in the browser via DecompressionStream. Nothing readable is in
 * the HTML you see on disk, so an agent cannot read a hex value out of the
 * raw file. This script inflates them back into readable markup.
 *
 *   node designs/extract.mjs           # extract everything
 *   node designs/extract.mjs --report  # just describe what is inside
 *
 * Output: designs/extracted/<source>/... (gitignored)
 *
 * Never edit designs/*.html by hand — they are the source of truth.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'extracted');
const REPORT_ONLY = process.argv.includes('--report');

const EXT_BY_MIME = {
  'text/javascript': 'js',
  'application/javascript': 'js',
  'text/html': 'html',
  'text/css': 'css',
  'application/json': 'json',
  'image/svg+xml': 'svg',
};

function manifestOf(html) {
  const m = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Pull the contents of a <script type="__bundler/NAME"> block.
 *
 * Done by index rather than regex: the template is ~100KB of markup that
 * contains its own quotes, slashes and escaped script tags, and a lazy
 * regex trips over them.
 */
function blockOf(html, name) {
  const open = `<script type="__bundler/${name}">`;
  const start = html.indexOf(open);
  if (start === -1) return null;
  const from = start + open.length;
  const end = html.indexOf('</script>', from);
  return end === -1 ? null : html.slice(from, end);
}

/** Inflate one manifest entry to text. */
function inflate(entry) {
  const buf = Buffer.from(entry.data, 'base64');
  return (entry.compressed ? gunzipSync(buf) : buf).toString('utf8');
}

/**
 * The template block is markup embedded as an escaped JS string literal:
 * quotes arrive as \" and every forward slash as /. Unescape it back
 * into real HTML so the inline styles and hex values are readable.
 */
function unescapeTemplate(s) {
  try {
    return JSON.parse(`"${s.replace(/\n/g, '\\n')}"`);
  } catch {
    return s
      .replace(/\\u002F/gi, '/')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\');
  }
}

/** Slice out one screen by walking div depth from its opening tag. */
function sliceScreen(html, startIdx) {
  const open = html.lastIndexOf('<div', startIdx);
  let depth = 0;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = open;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index + 6);
  }
  return html.slice(open, open + 20000); // unbalanced; take a generous chunk
}

const slug = (s) =>
  s
    .replace(/·/g, '-')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const sources = readdirSync(HERE)
  .filter((f) => /^\d\d-.*\.html$/.test(f))
  .sort();

if (!sources.length) {
  console.error('No design files found in', HERE);
  process.exit(1);
}

let grandTotal = 0;

for (const src of sources) {
  const base = basename(src, '.html');
  const html = readFileSync(join(HERE, src), 'utf8');
  const manifest = manifestOf(html);

  if (!manifest) {
    console.log(`${src}: no manifest — skipped`);
    continue;
  }

  const entries = Object.entries(manifest);
  const destDir = join(OUT, base);
  if (!REPORT_ONLY) mkdirSync(destDir, { recursive: true });

  console.log(`\n${src}`);

  // THE DESIGN LIVES HERE. The manifest holds only the shared React runtime
  // and the woff2 faces — identical in all eight bundles. Every screen, every
  // hex, every size is in the uncompressed template block.
  const rawTemplate = blockOf(html, 'template');
  if (!rawTemplate) {
    console.log('  template: ABSENT');
  } else {
    const template = unescapeTemplate(rawTemplate);
    grandTotal += template.length;

    const hexes = new Set([...template.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => m[0].toUpperCase()));
    const matches = [...template.matchAll(/data-screen-label="([^"]+)"/g)];

    console.log(
      `  ${String(template.length).padStart(7)} chars  ` +
        `${hexes.size} unique hexes  ${matches.length} screens`
    );

    if (!REPORT_ONLY) writeFileSync(join(destDir, '_template.html'), template);

    // One file per screen per theme — the unit an agent actually builds from.
    for (const m of matches) {
      const label = m[1];
      const body = sliceScreen(template, m.index);
      const localHexes = new Set([...body.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((x) => x[0].toUpperCase()));
      console.log(`      · ${label.padEnd(34)} ${String(body.length).padStart(6)} chars  ${localHexes.size} hexes`);

      if (REPORT_ONLY) continue;
      const doc =
        `<!doctype html><meta charset="utf-8">\n` +
        `<!-- ${label} — extracted from ${src}. Generated; do not edit. -->\n` +
        `<body style="margin:0;display:flex;justify-content:center;padding:24px;` +
        `background:${label.includes('dark') ? '#20160C' : '#EFE6DA'}">\n${body}\n</body>\n`;
      writeFileSync(join(OUT, `${slug(label)}.html`), doc);
    }
  }

  entries.forEach(([key, entry], i) => {
    if (entry.mime.startsWith('font/')) return; // binary faces, nothing to read
    let text;
    try {
      text = inflate(entry);
    } catch (e) {
      console.log(`  [${i}] ${entry.mime}  INFLATE FAILED: ${e.message}`);
      return;
    }

    grandTotal += text.length;
    const ext = EXT_BY_MIME[entry.mime] ?? 'txt';
    const name = `${String(i).padStart(2, '0')}-${key.slice(0, 8)}.${ext}`;

    // What is actually in here? Useful for finding the screen markup.
    const screens = [...text.matchAll(/data-screen-label=["']([^"']+)["']/g)].map((m) => m[1]);
    const hexes = new Set([...text.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => m[0].toUpperCase()));

    console.log(
      `  [${i}] ${entry.mime.padEnd(16)} ${String(text.length).padStart(8)} chars` +
        `  hexes:${String(hexes.size).padStart(4)}  screens:${screens.length}`
    );
    if (screens.length) {
      for (const s of screens.slice(0, 40)) console.log(`         · ${s}`);
      if (screens.length > 40) console.log(`         … and ${screens.length - 40} more`);
    }

    if (!REPORT_ONLY) writeFileSync(join(destDir, name), text);
  });
}

console.log(
  `\n${REPORT_ONLY ? 'Reported' : 'Extracted'} ${sources.length} files, ` +
    `${(grandTotal / 1024 / 1024).toFixed(1)} MB of readable source.`
);
if (!REPORT_ONLY) console.log(`Written to designs/extracted/`);
