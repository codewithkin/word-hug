#!/usr/bin/env node
/**
 * Word Hug — level bank builder
 *
 *   node scripts/build-levels.mjs            # writes apps/native/content/levels.ts
 *   node scripts/build-levels.mjs --check    # fails if the emitted file is stale
 *
 * Reads `scripts/levels.source.mjs`, derives a difficulty for every puzzle,
 * orders the bank into the progression ramp, and emits the TypeScript module
 * the app imports.
 *
 * ── Why difficulty is derived and not written by hand ─────────────────────
 * PRD §3.2: "derived from word frequency, not self-reported by the generator."
 * With no analytics there is no feedback loop to correct a mis-rated level, so
 * a human's guess at "this one feels like a 3" is unfalsifiable and will drift.
 * The heuristic below is not as good as corpus frequency — `puzzle-check.mjs`
 * against Datamuse is the real thing — but it is objective, reproducible, and
 * it fails in the same direction every time.
 *
 * ── The ramp ──────────────────────────────────────────────────────────────
 * Blocks of ten that climb hard across the bank (block means run 1.0 → 5.0),
 * zig-zagged inside each block so the player gets a breather every second or
 * third level without the run ever actually getting easier. A final pass pulls
 * apart levels that give each other away. See `ramp()` for the reasoning and
 * for the first version of it that `scripts/level-check.mjs` rejected.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEVEL_SOURCE } from './levels.source.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'apps/native/content/levels.ts');

// ── Parse ──────────────────────────────────────────────────────────────────

function parse(source) {
  const rows = [];

  for (const [n, raw] of source.split('\n').entries()) {
    const line = raw.trim();
    if (!line) continue;

    const [answer, clues, category] = line.split('|').map((p) => p.trim());
    if (!answer || !clues || !category) {
      throw new Error(`levels.source line ${n + 1}: expected "answer | clues | category", got "${line}"`);
    }

    const words = clues.split(',').map((chunk) => {
      const [text, pos] = chunk.trim().split(':');
      if (!text || (pos !== 'b' && pos !== 'a')) {
        throw new Error(`levels.source line ${n + 1}: bad clue "${chunk.trim()}" — expected word:b or word:a`);
      }
      return { text: text.trim(), position: pos === 'b' ? 'before' : 'after' };
    });

    if (words.length !== 3) {
      throw new Error(`levels.source line ${n + 1}: ${answer} has ${words.length} clues, needs 3`);
    }

    rows.push({ answer, words, category: `category.${category}` });
  }

  return rows;
}

// ── Difficulty ─────────────────────────────────────────────────────────────

/**
 * The 200 or so commonest English nouns that show up in compounds. A puzzle
 * built entirely from these is easy; one built from words outside the list is
 * not. Crude, and honest about being crude.
 */
const COMMON = new Set(
  `the be to of and in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us man thing woman life child world school state family student group country problem hand part place case week company system program question number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education foot boy age policy process music market sense nation plan college interest death experience effect use class control care field development role effort rate heart drug show leader light voice wife police mind price report decision son view relationship town road arm difference value building action model season society tax director position player record paper space ground form event official matter center couple site project activity star table need court garden fire south sound water fish bird tree stone snow rain sun moon milk bread cake egg corn nut pea cow pig dog cat sheep box card key ball bell book brush tooth hair paint news letter pot pan net yard walk way bed bath room door camp farm wind screen shot gun rail mill mark trade`
    .split(/\s+/)
);

/**
 * Difficulty 1–5.
 *
 * Three signals, all objective:
 *  · how common the answer is
 *  · how common the clue words are — an obscure clue is an unfair puzzle
 *  · answer length, as a weak proxy for search space
 *
 * Deliberately NOT a signal: whether the compounds "feel" obvious. That is the
 * judgement the PRD says not to trust.
 */
function difficultyFor({ answer, words }) {
  let score = 0;

  if (!COMMON.has(answer)) score += 1.8;

  const obscureClues = words.filter((w) => !COMMON.has(w.text)).length;
  score += obscureClues * 0.9;

  if (answer.length >= 6) score += 0.8;
  else if (answer.length === 5) score += 0.3;
  else if (answer.length <= 3) score += 0.5; // short answers have more neighbours

  // A distinct-letter count above the six-key row means the player is working
  // with fewer decoys, which makes the row itself a hint.
  const distinct = new Set(answer).size;
  if (distinct <= 3) score += 0.3;

  // All three clues on the same side is a flatter puzzle, not a harder one.
  const sides = new Set(words.map((w) => w.position));
  if (sides.size === 1) score -= 0.4;

  return Math.min(5, Math.max(1, Math.round(1 + score)));
}

// ── The ramp ───────────────────────────────────────────────────────────────

/**
 * Orders the bank: a strong macro ramp with a local sawtooth, then a repair
 * pass that pulls apart levels which give each other away.
 *
 * ── Why not just sort by difficulty ───────────────────────────────────────
 * A monotonic climb over 100 levels reads as relentless — every level is
 * harder than the last one and none of them ever feels like a win. The bank is
 * cut into contiguous blocks of ten (so the trend is firmly upward, and the
 * analyser checks that it is) and then zig-zagged *within* each block, so the
 * player gets a breather every second or third puzzle without the run ever
 * getting easier overall.
 *
 * The first draft interleaved across blocks instead and produced block means
 * of 2.80 → 3.20 — statistically a ramp, and in the hand a flat line.
 * `scripts/level-check.mjs` is what caught it.
 */
function ramp(rows) {
  const sorted = [...rows].sort(
    (a, b) => a.difficulty - b.difficulty || a.answer.localeCompare(b.answer)
  );

  const BLOCK = 10;
  /** Positions within a block, easiest-first index → slot. A local zigzag. */
  const ZIGZAG = [1, 0, 3, 6, 2, 5, 9, 4, 7, 8];

  const out = [];
  for (let start = 0; start < sorted.length; start += BLOCK) {
    const chunk = sorted.slice(start, start + BLOCK);
    const placed = new Array(chunk.length);
    chunk.forEach((row, i) => {
      const slot = ZIGZAG[i] ?? i;
      placed[slot < chunk.length ? slot : i] = row;
    });
    out.push(...placed.filter(Boolean));
  }

  return declusterGiveaways(out);
}

/**
 * Pulls apart levels where one's answer is the other's clue.
 *
 * Meeting GUN with the clue "shot" and then SHOT one level later is a level
 * the player solves without reading it — which is a level that did not happen.
 * The pass walks the list and, on a collision inside the window, swaps the
 * later level with the nearest candidate further on that does not collide.
 *
 * Greedy and bounded: it makes things strictly better or leaves them alone,
 * and it never runs longer than the bank. Some collisions survive when there
 * is nothing to swap with, which is why the analyser reports them as warnings
 * rather than the builder treating them as failures.
 */
function declusterGiveaways(levels, window = 5) {
  const clashes = (a, b) =>
    a && b && (b.words.some((w) => w.text === a.answer) || a.words.some((w) => w.text === b.answer));

  for (let i = 0; i < levels.length; i++) {
    for (let j = i + 1; j <= Math.min(i + window, levels.length - 1); j++) {
      if (!clashes(levels[i], levels[j])) continue;

      // Find something further along, of the same difficulty so the ramp is
      // untouched, that collides with nothing in either neighbourhood.
      for (let k = j + window; k < levels.length; k++) {
        if (levels[k].difficulty !== levels[j].difficulty) continue;

        const near = (index) =>
          levels.slice(Math.max(0, index - window), index + window + 1).filter((_, o) => o !== window);

        const candidateOk = near(j).every((n) => !clashes(n, levels[k]));
        const displacedOk = near(k).every((n) => !clashes(n, levels[j]));

        if (candidateOk && displacedOk) {
          [levels[j], levels[k]] = [levels[k], levels[j]];
          break;
        }
      }
    }
  }

  return levels;
}

// ── Emit ───────────────────────────────────────────────────────────────────

function pad(n, width) {
  return String(n).padStart(width, '0');
}

function emit(levels) {
  const body = levels
    .map((l, i) => {
      const n = i + 1;
      const words = l.words
        .map((w) => `{ text: '${w.text}', position: '${w.position}' }`)
        .join(', ');
      return (
        `  { id: 'L-${pad(n, 3)}', level: ${n}, answer: '${l.answer}', accepted: [],\n` +
        `    difficulty: ${l.difficulty}, category: '${l.category}',\n` +
        `    words: [${words}] },`
      );
    })
    .join('\n');

  return `import type { Level } from '@/lib/levels';

/**
 * ── THE LEVEL BANK — GENERATED, DO NOT EDIT ───────────────────────────────
 *
 * Written by \`node scripts/build-levels.mjs\` from \`scripts/levels.source.mjs\`.
 * Edit the source and re-run; edits here are lost on the next build.
 *
 * ${levels.length} levels. \`level\` is 1-based and permanent: it is the number
 * on the map, the key progress is stored under, and the thing a player says out
 * loud ("I'm on 34"). **Append only.** Inserting a level in the middle
 * renumbers every level after it and rewrites the history of everyone playing.
 *
 * Difficulty is derived, never hand-written — PRD §3.2. See the builder for
 * the heuristic and its limits, and run \`scripts/puzzle-check.mjs\` for the
 * two things no heuristic can decide: uniqueness and real corpus frequency.
 */
export const LEVELS: Level[] = [
${body}
];
`;
}

// ── Main ───────────────────────────────────────────────────────────────────

const rows = parse(LEVEL_SOURCE).map((r) => ({ ...r, difficulty: difficultyFor(r) }));

const seen = new Set();
for (const r of rows) {
  if (seen.has(r.answer)) throw new Error(`levels.source: duplicate answer "${r.answer}"`);
  seen.add(r.answer);
}

const ordered = ramp(rows);
const output = emit(ordered);

if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8');
  if (current !== output) {
    console.error('✗ apps/native/content/levels.ts is stale — run: node scripts/build-levels.mjs');
    process.exit(1);
  }
  console.log(`✓ levels.ts is up to date (${ordered.length} levels)`);
  process.exit(0);
}

writeFileSync(OUT, output);

const spread = ordered.reduce((acc, l) => {
  acc[l.difficulty] = (acc[l.difficulty] ?? 0) + 1;
  return acc;
}, {});

console.log(`✓ wrote ${ordered.length} levels to apps/native/content/levels.ts`);
console.log(`  difficulty spread: ${JSON.stringify(spread)}`);
console.log(`  first five: ${ordered.slice(0, 5).map((l) => l.answer).join(', ')}`);
console.log(`  last five:  ${ordered.slice(-5).map((l) => l.answer).join(', ')}`);
