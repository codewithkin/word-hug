#!/usr/bin/env node
/**
 * Word Hug — corpus frequency fetcher
 *
 *   node scripts/fetch-corpus.mjs          # fetch what is missing, keep the rest
 *   node scripts/fetch-corpus.mjs --all    # refetch everything from scratch
 *
 * Writes `scripts/corpus-cache.json`. **Commit it.**
 *
 * ── What this is for ──────────────────────────────────────────────────────
 * `scripts/difficulty.mjs` scores puzzles on how familiar their words and
 * compounds are. Three of its features are authored word lists — my judgement
 * about what counts as a household compound, written down. That is a much
 * better proxy than the word-frequency model it replaced, and it is still a
 * proxy.
 *
 * This script replaces the guess with a measurement. It asks Datamuse for the
 * corpus frequency of every answer, every clue word and every compound in the
 * bank, converts to Zipf, and caches the result. `frequencyFor()` prefers the
 * cache over the authored tiers the moment the file exists.
 *
 * ── Why a checked-in cache and not a live call ────────────────────────────
 * `build-levels.mjs` runs in `pnpm check` and must be deterministic and
 * offline. A build that reorders the bank because an API was slow is a build
 * that reorders the player's saved progress — level 7 is stored by number, so
 * changing which puzzle is level 7 rewrites history for anyone mid-run.
 *
 * So the network step is explicit, occasional and human-run, and its output is
 * a reviewable diff. Fetching is a content decision, not a build step.
 *
 * ── Why Datamuse ──────────────────────────────────────────────────────────
 * Already the project's lexicon (`validate-bank.mjs`, `puzzle-check.mjs`), no
 * key, and its `f:` metadata is occurrences per million words in Google Books
 * — which is exactly the quantity wanted here.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compoundsOf } from './difficulty.mjs';
import { LEVEL_SOURCE } from './levels.source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, 'corpus-cache.json');

const REFETCH_ALL = process.argv.includes('--all');

// ── Collect every word we care about ───────────────────────────────────────

function parseSource() {
  const rows = [];
  for (const raw of LEVEL_SOURCE.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('|')) continue;
    const [answer, clues] = line.split('|').map((p) => p.trim());
    const words = clues.split(',').map((chunk) => {
      const [text, pos] = chunk.trim().split(':');
      return { text, position: pos === 'b' ? 'before' : 'after' };
    });
    rows.push({ answer, words });
  }
  return rows;
}

const rows = parseSource();

const wanted = new Set();
for (const row of rows) {
  wanted.add(row.answer);
  for (const w of row.words) wanted.add(w.text);
  for (const c of compoundsOf(row)) wanted.add(c);
}

// ── Load what we already have ──────────────────────────────────────────────

/**
 * Kept as `{ zipf, fetchedAt, misses }` rather than a bare map so a rerun can
 * tell "we asked and it is genuinely absent from the corpus" from "we have not
 * asked yet". Without that distinction every rerun re-requests the ~200 coined
 * compounds that will never resolve, which is most of the runtime.
 */
const existing = (() => {
  if (REFETCH_ALL || !existsSync(CACHE)) return { zipf: {}, misses: [] };
  try {
    const parsed = JSON.parse(readFileSync(CACHE, 'utf8'));
    return { zipf: parsed.zipf ?? {}, misses: parsed.misses ?? [] };
  } catch {
    return { zipf: {}, misses: [] };
  }
})();

const known = new Set([...Object.keys(existing.zipf), ...existing.misses]);
const todo = [...wanted].filter((w) => !known.has(w)).sort();

console.log(`corpus: ${wanted.size} words in the bank, ${known.size} cached, ${todo.length} to fetch`);
if (todo.length === 0) {
  console.log('nothing to do');
  process.exit(0);
}

// ── Fetch ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One word → Zipf, or `null` when the corpus has never seen it.
 *
 * Datamuse returns `f:12.34` in `tags` — occurrences per million words. Zipf is
 * `log10(perBillion)`, so `log10(perMillion * 1000)`. A word absent from the
 * corpus is a real answer (`moonbeam` is rare; `houndfox` does not exist) and
 * is recorded as a miss rather than as zero, because zero would be a lie the
 * scorer would then act on.
 *
 * ── Retries ───────────────────────────────────────────────────────────────
 * Datamuse rate-limits an unkeyed client somewhere around 10 req/s, and it
 * signals it with a 503 rather than a 429. An earlier script in this project
 * read those as "word not found" and reported 72 perfectly good compounds as
 * failures. A transport error is never a verdict about the word: it retries
 * with backoff, and if it still cannot get an answer it throws rather than
 * writing a cache entry it does not believe.
 */
async function zipfFor(word, attempt = 0) {
  const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f&max=1`;

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  } catch (err) {
    if (attempt >= 4) throw new Error(`${word}: ${err.message}`);
    await sleep(500 * 2 ** attempt);
    return zipfFor(word, attempt + 1);
  }

  if (res.status === 503 || res.status === 429) {
    if (attempt >= 5) throw new Error(`${word}: rate-limited after ${attempt} retries`);
    await sleep(1000 * 2 ** attempt);
    return zipfFor(word, attempt + 1);
  }
  if (!res.ok) {
    if (attempt >= 4) throw new Error(`${word}: HTTP ${res.status}`);
    await sleep(500 * 2 ** attempt);
    return zipfFor(word, attempt + 1);
  }

  const json = await res.json();
  const hit = json[0];
  // `sp=` is a spelling pattern, so an exact match is the only match that
  // counts — Datamuse will happily return `wood` for `wooed`.
  if (!hit || hit.word !== word) return null;

  const tag = (hit.tags ?? []).find((t) => t.startsWith('f:'));
  if (!tag) return null;

  const perMillion = Number(tag.slice(2));
  if (!Number.isFinite(perMillion) || perMillion <= 0) return null;

  return Math.round(Math.log10(perMillion * 1000) * 100) / 100;
}

const zipf = { ...existing.zipf };
const misses = new Set(existing.misses);

let done = 0;
let failed = 0;

for (const word of todo) {
  try {
    const z = await zipfFor(word);
    if (z === null) misses.add(word);
    else zipf[word] = z;
  } catch (err) {
    failed++;
    console.warn(`  ! ${err.message}`);
  }

  done++;
  if (done % 25 === 0) console.log(`  ${done}/${todo.length}`);
  // ~8 req/s. Slower than the limit on purpose: the whole bank is one run of a
  // couple of minutes, and being throttled costs far more than being polite.
  await sleep(120);
}

// ── Write ──────────────────────────────────────────────────────────────────

writeFileSync(
  CACHE,
  `${JSON.stringify(
    {
      note: 'Generated by scripts/fetch-corpus.mjs. Zipf = log10(occurrences per billion). Commit this file.',
      fetchedAt: new Date().toISOString(),
      zipf: Object.fromEntries(Object.entries(zipf).sort(([a], [b]) => a.localeCompare(b))),
      misses: [...misses].sort(),
    },
    null,
    2
  )}\n`
);

console.log(
  `\n✓ ${Object.keys(zipf).length} words with a frequency, ${misses.size} not in the corpus` +
    (failed ? `, ${failed} could not be reached` : '')
);
console.log(`  wrote ${CACHE}`);
console.log('\nNext: pnpm levels:build && pnpm levels:check');
console.log('Expect the bank to reorder. Review the diff before committing —');
console.log('level numbers are stored in player progress, so the order is content.');

if (failed > 0) process.exitCode = 1;
