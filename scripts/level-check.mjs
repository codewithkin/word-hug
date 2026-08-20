#!/usr/bin/env node
/**
 * Word Hug — level bank analysis
 *
 *   node scripts/level-check.mjs           # report + pass/fail
 *   node scripts/level-check.mjs --verbose # every level, with its score
 *
 * Answers three questions about the 100 levels, none of which need a device:
 *
 *   1. **Are they well-formed?** ids, numbering, duplicates, clue counts,
 *      lowercase discipline, and whether each one fits the six-key row.
 *   2. **Are they playable?** Can the answer actually be typed from the keys
 *      the app will generate — and is the key row not simply an anagram of
 *      the answer with no decoys to think past.
 *   3. **Are they in the right place?** Does difficulty trend upward across
 *      the bank, does any single step jump too far, and does a level give
 *      away one of its neighbours.
 *
 * ── What it cannot tell you ───────────────────────────────────────────────
 * Whether a SECOND word also hugs all three clues. That needs a lexicon, and
 * `scripts/puzzle-check.mjs` is the thing that has one. A level with two valid
 * answers passes every check here and is the single worst bug the content can
 * have, because to a player it looks like the game rejecting a correct word.
 *
 * Exit code is non-zero on an ERROR and zero on a WARN — warnings are judgement
 * calls about feel, errors are things that are broken.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BANK = join(ROOT, 'apps/native/content/levels.ts');

const VERBOSE = process.argv.includes('--verbose');

let errors = 0;
let warnings = 0;

function error(msg) {
  errors++;
  console.error(`  ERROR  ${msg}`);
}

function warn(msg) {
  warnings++;
  console.warn(`  warn   ${msg}`);
}

function section(name) {
  console.log(`\n${name}`);
}

// ── Read the bank ──────────────────────────────────────────────────────────

const source = readFileSync(BANK, 'utf8');

const levels = [...source.matchAll(/\{ id: '([^']+)', level: (\d+), answer: '([^']+)'[\s\S]*?difficulty: (\d)[\s\S]*?words: \[([^\]]+)\] \}/g)].map(
  (m) => ({
    id: m[1],
    level: Number(m[2]),
    answer: m[3],
    difficulty: Number(m[4]),
    words: [...m[5].matchAll(/\{ text: '([^']+)', position: '(before|after)' \}/g)].map((w) => ({
      text: w[1],
      position: w[2],
    })),
  })
);

if (levels.length === 0) {
  console.error('Could not parse any levels from content/levels.ts. Did the emitter format change?');
  process.exit(1);
}

console.log(`Word Hug — ${levels.length} levels\n${'─'.repeat(46)}`);

// ── 1. Well-formed ─────────────────────────────────────────────────────────

section('structure');

const ids = new Set();
const answers = new Set();

for (const l of levels) {
  if (ids.has(l.id)) error(`duplicate id ${l.id}`);
  ids.add(l.id);

  if (answers.has(l.answer)) error(`duplicate answer "${l.answer}" (level ${l.level})`);
  answers.add(l.answer);

  if (l.answer !== l.answer.toLowerCase()) error(`level ${l.level}: answer "${l.answer}" is not lowercase`);
  if (l.words.length !== 3) error(`level ${l.level}: ${l.words.length} clues, needs 3`);

  for (const w of l.words) {
    if (w.text !== w.text.toLowerCase()) error(`level ${l.level}: clue "${w.text}" is not lowercase`);
    if (w.text === l.answer) error(`level ${l.level}: clue "${w.text}" is its own answer`);
  }
}

levels.forEach((l, i) => {
  if (l.level !== i + 1) error(`level numbering breaks at index ${i}: got ${l.level}, expected ${i + 1}`);
});

if (errors === 0) console.log('  ok');

// ── 2. Playability ─────────────────────────────────────────────────────────

section('playability');

/**
 * Mirrors `keysFor` in `apps/native/lib/puzzles.ts`.
 *
 * Duplicated rather than imported because that module is TypeScript and this
 * script has no build step. **If the app's generator changes, change this
 * too** — a drift here means the checker validates a key row the player never
 * sees. The `keys are solvable` check below would still pass, silently.
 */
const DECOY_POOL = 'etaorinshldcumpfgy';
const KEY_COUNT = 6;

function seedFrom(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function keysFor(id, answer) {
  const needed = [...new Set(answer.replace(/[^a-z]/g, ''))];
  const decoys = [...DECOY_POOL].filter((c) => !needed.includes(c));

  let seed = seedFrom(id);
  const next = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };

  const keys = [...needed];
  while (keys.length < Math.max(KEY_COUNT, needed.length + 1) && decoys.length > 0) {
    const [picked] = decoys.splice(Math.floor(next() * decoys.length), 1);
    if (picked) keys.push(picked);
  }
  return keys;
}

let unsolvable = 0;
let anagrams = 0;

for (const l of levels) {
  const keys = keysFor(l.id, l.answer);
  const missing = [...new Set(l.answer)].filter((c) => !keys.includes(c));

  if (missing.length > 0) {
    error(`level ${l.level} (${l.answer}) cannot be typed — keys are missing ${missing.join(', ')}`);
    unsolvable++;
  }

  const decoyCount = keys.length - new Set(l.answer).size;
  if (decoyCount === 0) {
    warn(`level ${l.level} (${l.answer}): no decoy letters — the key row is an anagram of the answer`);
    anagrams++;
  }

  if (l.answer.length < 3) warn(`level ${l.level}: answer "${l.answer}" is very short`);
  if (l.answer.length > 6) warn(`level ${l.level}: answer "${l.answer}" is ${l.answer.length} letters — the tile row narrows past 6`);
}

if (unsolvable === 0 && anagrams === 0) console.log('  every level is typable, and none is a bare anagram');

// ── 3. Placement ───────────────────────────────────────────────────────────

section('difficulty curve');

const spread = levels.reduce((acc, l) => {
  acc[l.difficulty] = (acc[l.difficulty] ?? 0) + 1;
  return acc;
}, {});
console.log(`  spread: ${JSON.stringify(spread)}`);

/** Mean difficulty of each block of ten. Should trend up across the bank. */
const BLOCK = 10;
const blockMeans = [];
for (let i = 0; i < levels.length; i += BLOCK) {
  const chunk = levels.slice(i, i + BLOCK);
  blockMeans.push(chunk.reduce((s, l) => s + l.difficulty, 0) / chunk.length);
}
console.log(`  block means: ${blockMeans.map((m) => m.toFixed(2)).join(' → ')}`);

const firstBlock = blockMeans[0] ?? 0;
const lastBlock = blockMeans[blockMeans.length - 1] ?? 0;
if (lastBlock <= firstBlock) {
  error(`the bank does not get harder: block 1 averages ${firstBlock.toFixed(2)}, the last averages ${lastBlock.toFixed(2)}`);
} else {
  console.log(`  overall ramp: ${firstBlock.toFixed(2)} → ${lastBlock.toFixed(2)} ✓`);
}

// A wall is a single step that jumps two difficulty bands at once. It is the
// most common reason a player stops playing a level game.
for (let i = 1; i < levels.length; i++) {
  const jump = levels[i].difficulty - levels[i - 1].difficulty;
  if (jump >= 3) {
    warn(`level ${levels[i].level} jumps ${jump} bands from level ${levels[i - 1].level} — that is a wall`);
  }
}

// The first five levels are the ones that decide whether anyone plays a sixth.
const opening = levels.slice(0, 5);
const tooHard = opening.filter((l) => l.difficulty > 2);
if (tooHard.length > 0) {
  warn(`the opening five should all be difficulty 1–2; ${tooHard.map((l) => `${l.level} (${l.difficulty})`).join(', ')} ${tooHard.length === 1 ? 'is' : 'are'} harder`);
} else {
  console.log('  the opening five are all difficulty 1–2 ✓');
}

section('give-aways');

/**
 * A level whose answer is a clue in a nearby level, or vice versa.
 *
 * Playing GUN with the clue "shot" and then meeting SHOT two levels later is
 * not unfair, but it is a level the player solves without reading it — which
 * is a level that did not happen. Five apart is close enough to still be in
 * working memory.
 */
const WINDOW = 5;
let giveaways = 0;

for (let i = 0; i < levels.length; i++) {
  for (let j = i + 1; j <= Math.min(i + WINDOW, levels.length - 1); j++) {
    const a = levels[i];
    const b = levels[j];
    if (b.words.some((w) => w.text === a.answer) || a.words.some((w) => w.text === b.answer)) {
      warn(`levels ${a.level} (${a.answer}) and ${b.level} (${b.answer}) give each other away — ${j - i} apart`);
      giveaways++;
    }
  }
}

if (giveaways === 0) console.log(`  no level gives away another within ${WINDOW} places`);

// ── Verbose listing ────────────────────────────────────────────────────────

if (VERBOSE) {
  section('every level');
  for (const l of levels) {
    const keys = keysFor(l.id, l.answer).join('').toUpperCase();
    const clues = l.words.map((w) => `${w.text}:${w.position[0]}`).join(' ');
    console.log(
      `  ${String(l.level).padStart(3)}  d${l.difficulty}  ${l.answer.padEnd(8)} ${clues.padEnd(34)} keys ${keys}`
    );
  }
}

// ── Verdict ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(46)}`);
console.log(`${errors === 0 ? '✓' : '✗'} ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`);
if (errors === 0 && warnings > 0) {
  console.log('  Warnings are judgement calls about feel, not breakage.');
}
console.log(
  '\n  Still unchecked: whether any level has a SECOND valid answer.\n' +
    '  Only scripts/puzzle-check.mjs can answer that, and it needs the network.\n'
);

process.exit(errors === 0 ? 0 : 1);
