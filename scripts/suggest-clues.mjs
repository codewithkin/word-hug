#!/usr/bin/env node
/**
 * Word Hug — find real compounds for an answer word
 *
 *   node scripts/suggest-clues.mjs wolf
 *   node scripts/suggest-clues.mjs wolf --min 0.05      # stricter than the floor
 *   node scripts/suggest-clues.mjs --failing            # every puzzle in bank-report
 *
 * Asks Datamuse what actually forms a compound with a word, in both positions,
 * and prints them by frequency. It is the other half of `validate-bank.mjs`:
 * that one tells you a puzzle is broken, this one tells you what to replace it
 * with.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * The first full validation run rejected 73 puzzles, and 39 of those were the
 * same mistake: a clue word I was confident about that turns out not to form a
 * real compound — `houndfox`, `trademan`, `lightlamp`, `daynoon`, `rollcoaster`,
 * `musrat`. Writing a replacement by intuition is how those got in.
 *
 * So this does not ask me to think of a word. It asks the corpus which words
 * exist, and I pick three that are also on theme. Same discipline as deriving
 * difficulty from frequency instead of guessing it — PRD §3.2.
 *
 * ── Reads the cache first ─────────────────────────────────────────────────
 * `validate-bank` has already populated `.cache/datamuse/` for every answer in
 * the bank, so suggestions for a word already in the bank are free and work
 * offline. A brand-new word needs the network.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, '.cache/datamuse');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

/** Matches `MIN_COMPOUND_F` in puzzle-check.mjs. Raise it to be pickier. */
const MIN_F = Number(flag('min', '0.02'));
const TOP = Number(flag('top', '18'));

// ── Datamuse, cache-first ──────────────────────────────────────────────────

async function datamuse(params) {
  const url = `https://api.datamuse.com/words?${new URLSearchParams(params)}`;
  const key = createHash('sha256').update(url).digest('hex').slice(0, 32);
  const cachePath = join(CACHE_DIR, `${key}.json`);

  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Datamuse ${res.status}`);
  const data = await res.json();

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(data));
  return data;
}

const freqOf = (e) =>
  Number((e.tags ?? []).find((t) => t.startsWith('f:'))?.slice(2) ?? 0);

/**
 * Real compounds built on `answer`, in one position.
 *
 * `position: 'after'` means the clue follows the answer — answer+clue — so we
 * search for words *starting* with the answer and strip it off the front.
 */
async function compoundsFor(answer, position) {
  const pattern = position === 'after' ? `${answer}*` : `*${answer}`;
  const results = await datamuse({ sp: pattern, md: 'f', max: '1000' });

  const out = [];
  for (const entry of results) {
    const word = entry.word.toLowerCase();
    // Joined spellings only. "hunger strike" is a phrase, not a compound.
    if (/[\s-]/.test(word)) continue;

    const clue =
      position === 'after' ? word.slice(answer.length) : word.slice(0, -answer.length);

    // Two letters is a fragment, not a word; anything under the floor is the
    // kind of obscurity the validator will reject anyway.
    if (clue.length < 3) continue;
    const f = freqOf(entry);
    if (f < MIN_F) continue;

    out.push({ clue, compound: word, f, position });
  }

  return out.sort((a, b) => b.f - a.f);
}

async function suggest(answer) {
  const [after, before] = await Promise.all([
    compoundsFor(answer, 'after'),
    compoundsFor(answer, 'before'),
  ]);

  console.log(`\n${answer.toUpperCase()}`);
  console.log(`  ${answer} + clue           clue + ${answer}`);
  console.log(`  ${'─'.repeat(24)}  ${'─'.repeat(24)}`);

  for (let i = 0; i < Math.min(TOP, Math.max(after.length, before.length)); i++) {
    const a = after[i];
    const b = before[i];
    const left = a ? `${a.clue}:a`.padEnd(14) + a.f.toFixed(3) : '';
    const right = b ? `${b.clue}:b`.padEnd(14) + b.f.toFixed(3) : '';
    console.log(`  ${left.padEnd(26)}${right}`);
  }

  if (after.length + before.length === 0) {
    console.log(`  no compounds above f=${MIN_F} — this word may not work as an answer`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

if (argv.includes('--failing')) {
  const reportPath = join(ROOT, 'bank-report.json');
  if (!existsSync(reportPath)) {
    console.error('No bank-report.json. Run `pnpm validate:bank` first.');
    process.exit(1);
  }

  const failing = JSON.parse(readFileSync(reportPath, 'utf8')).results.filter(
    (r) => r.accepted === false
  );

  console.log(
    `Suggestions for ${failing.length} failing puzzles.\n` +
      `Pick three clues per answer that are on theme, then edit levels.source.mjs\n` +
      `and re-run \`pnpm validate:bank\`.`
  );

  for (const p of failing) await suggest(p.answer);
} else {
  const words = argv.filter((a) => !a.startsWith('--') && !/^[\d.]+$/.test(a));
  if (words.length === 0) {
    console.log('Usage: node scripts/suggest-clues.mjs <answer> [more answers…]');
    console.log('       node scripts/suggest-clues.mjs --failing');
    process.exit(1);
  }
  for (const w of words) await suggest(w);
}
