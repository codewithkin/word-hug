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
    if (!line || line.startsWith('#')) continue;

    const [answer, clues, category, set] = line.split('|').map((p) => p.trim());
    if (!answer || !clues || !category || !set) {
      throw new Error(
        `levels.source line ${n + 1}: expected "answer | clues | category | set", got "${line}"`
      );
    }

    /**
     * ── The guard ─────────────────────────────────────────────────────────
     * Writing 250 puzzles by hand, I twice left a note to myself in the clue
     * column — `pond? no`, `dup`, `drop` — and both times the line looked
     * plausible enough to survive a visual scan and a `grep -c`. The counts
     * came out right and the content was broken.
     *
     * The first version of this guard blocklisted those words and immediately
     * rejected `rain | bow:a, coat:a, drop:a`, because "raindrop" is a real
     * compound and `drop` is a real clue. Blocklists are the wrong shape here.
     *
     * So it checks the FORM instead: every clue is exactly `word:b` or
     * `word:a`, lowercase letters only. A note to self cannot satisfy that,
     * and a real clue always does.
     */
    for (const chunk of clues.split(',')) {
      if (!/^\s*[a-z]+:[ba]\s*$/.test(chunk)) {
        throw new Error(
          `levels.source line ${n + 1}: "${answer}" has a malformed clue — "${chunk.trim()}"`
        );
      }
    }

    const words = clues.split(',').map((chunk) => {
      const [text, pos] = chunk.trim().split(':');
      if (!text || (pos !== 'b' && pos !== 'a')) {
        throw new Error(
          `levels.source line ${n + 1}: bad clue "${chunk.trim()}" — expected word:b or word:a`
        );
      }
      return { text: text.trim(), position: pos === 'b' ? 'before' : 'after' };
    });

    if (words.length !== 3) {
      throw new Error(`levels.source line ${n + 1}: ${answer} has ${words.length} clues, needs 3`);
    }

    if (words.some((w) => w.text === answer)) {
      throw new Error(`levels.source line ${n + 1}: ${answer} uses itself as a clue`);
    }

    const seen = new Set(words.map((w) => w.text));
    if (seen.size !== 3) {
      throw new Error(`levels.source line ${n + 1}: ${answer} repeats a clue word`);
    }

    rows.push({
      answer,
      words,
      category: `category.${category.replace(/^~/, '')}`,
      // A leading ~ means the theme link is a stretch. Kept as data so the
      // analyser can report how many of a pack's fifty are loose.
      looseTheme: category.startsWith('~'),
      set,
    });
  }

  return rows;
}

// ── Difficulty ─────────────────────────────────────────────────────────────

/**
 * The commonest English nouns that show up in compounds. A puzzle built
 * entirely from these is easy; one built from words outside the list is not.
 * Crude, and honest about being crude.
 *
 * ── Recalibrated for the 300-level bank ───────────────────────────────────
 * The first version was written against 100 levels and had roughly 200 words
 * in it. Against 300 it rated 32 of the 50 kitchen levels as difficulty 5 —
 * not because they are hard, but because `tea`, `spoon` and `cheese` were not
 * on the list and every absence costs +1.8.
 *
 * That is the honest weakness of a wordlist proxy: it measures "is this word
 * in my list" and reports it as "is this word common". The real fix is corpus
 * frequency from `scripts/puzzle-check.mjs`, which is the whole reason that
 * script exists. Until it has been run, this list is the calibration, and it
 * has to actually contain the everyday vocabulary the bank uses.
 */
const COMMON = new Set(
  `the be to of and in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us man thing woman life child world school state family student group country problem hand part place case week company system program question number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education foot boy age policy process music market sense nation plan college interest death experience effect use class control care field development role effort rate heart drug show leader light voice wife police mind price report decision son view relationship town road arm difference value building action model season society tax director position player record paper space ground form event official matter center couple site project activity star table need court garden fire south sound water fish bird tree stone snow rain sun moon milk bread cake egg corn nut pea cow pig dog cat sheep box card key ball bell book brush tooth hair paint news letter pot pan net yard walk way bed bath room door camp farm wind screen shot gun rail mill mark trade
    tea salt honey sugar cheese meat bean spoon fork knife dish bowl fruit pie cook bake
    plate roll apple grape straw bar sauce pepper ginger cob pod seed dough jelly ice lime
    lunch break sweet wheat pop cloth wash soap butter nut pea berry corn bread egg
    storm cloud frost thunder sky shore tide wave river lake brook spring summer winter
    harvest sand mud rock hill grass leaf root branch pine weed flower garden path trail
    bridge gate cave north day week earth track port coast bank stream tree log smoke steam
    horse dog cat pig cow sheep fly bug worm bee fox frog duck crab mouse rat skin bone
    blood heart brain finger thumb nail knee neck ear nose face arm leg tail horn nest
    hound feather wolf goose crow lady child mother father king body mind lip
    stick saw screw hammer bolt pin chain wheel gear motor cart brick glass iron steel
    metal rubber craft shop store tool lock beam post sign frame wire pipe tank lift
    switch plug band press stamp battle ship site
    dark dream sleep pillow lamp shade window floor wall stair hall clock hour mid after
    noon morning shadow peace rest song story home town ring glow torch read page print
    write note pen ink step stool guest short soft set under up court chair`
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

// ── Parse and validate ─────────────────────────────────────────────────────

const rows = parse(LEVEL_SOURCE).map((r) => ({ ...r, difficulty: difficultyFor(r) }));

/**
 * Across ALL sets, not per-set.
 *
 * An answer appearing in both the free run and a pack is exactly the bug this
 * rewrite exists to fix: session 7's packs pointed at levels 21–100 of the free
 * bank, so buying a pack bought fifty puzzles the player had already solved.
 */
const seen = new Map();
for (const r of rows) {
  if (seen.has(r.answer)) {
    throw new Error(
      `levels.source: "${r.answer}" appears in both ${seen.get(r.answer)} and ${r.set}`
    );
  }
  seen.set(r.answer, r.set);
}

// ── Emit ───────────────────────────────────────────────────────────────────

const PACK_ORDER = ['kitchen', 'outdoors', 'creatures', 'workshop', 'nightfall'];

function pad(n, width) {
  return String(n).padStart(width, '0');
}

function entry(prefix, l, n) {
  const words = l.words
    .map((w) => `{ text: '${w.text}', position: '${w.position}' }`)
    .join(', ');
  return (
    `  { id: '${prefix}-${pad(n, 3)}', level: ${n}, answer: '${l.answer}', accepted: [],\n` +
    `    difficulty: ${l.difficulty}, category: '${l.category}',\n` +
    `    words: [${words}] },`
  );
}

const BANNER = (what, count, extra = '') => `/**
 * ── ${what.toUpperCase()} — GENERATED, DO NOT EDIT ──────────────────────────
 *
 * Written by \`node scripts/build-levels.mjs\` from \`scripts/levels.source.mjs\`.
 * Edit the source and re-run; edits here are lost on the next build.
 *
 * ${count} levels. \`level\` is 1-based within its own bank and permanent: it is
 * the number on the map, the key progress is stored under, and the thing a
 * player says out loud. **Append only.** Inserting a level renumbers every one
 * after it and rewrites the history of everyone playing.
 *
 * Difficulty is derived, never hand-written — PRD §3.2. Run
 * \`scripts/puzzle-check.mjs\` for the two things no heuristic can decide:
 * uniqueness and real corpus frequency.${extra}
 */`;

// ── Free run ───────────────────────────────────────────────────────────────

const free = ramp(rows.filter((r) => r.set === 'free'));

const freeOut = `import type { Level } from '@/lib/levels';

${BANNER('the free run', free.length)}
export const LEVELS: Level[] = [
${free.map((l, i) => entry('L', l, i + 1)).join('\n')}
];
`;

// ── Packs ──────────────────────────────────────────────────────────────────

const packBanks = PACK_ORDER.map((id) => ({
  id,
  levels: ramp(rows.filter((r) => r.set === id)),
}));

const packOut = `import type { Level } from '@/lib/levels';

${BANNER(
  'the pack levels',
  packBanks.reduce((n, p) => n + p.levels.length, 0),
  `\n *\n * **These share nothing with the free run.** Every answer appears in exactly\n` +
    ` * one bank. That was the session-7 bug — packs pointed at levels 21–100 of\n` +
    ` * the free bank, so buying one bought puzzles you had already played.`
)}
export const PACK_LEVELS: Record<string, Level[]> = {
${packBanks
  .map(
    (p) =>
      `  '${p.id}': [\n${p.levels.map((l, i) => entry(p.id.slice(0, 2).toUpperCase(), l, i + 1)).join('\n')}\n  ],`
  )
  .join('\n')}
};
`;

// ── Main ───────────────────────────────────────────────────────────────────

const PACK_OUT = join(ROOT, 'apps/native/content/pack-levels.ts');

if (process.argv.includes('--check')) {
  const stale =
    readFileSync(OUT, 'utf8') !== freeOut || readFileSync(PACK_OUT, 'utf8') !== packOut;
  if (stale) {
    console.error('✗ generated level banks are stale — run: node scripts/build-levels.mjs');
    process.exit(1);
  }
  console.log(`✓ level banks are up to date (${free.length} free, ${packBanks.reduce((n, p) => n + p.levels.length, 0)} pack)`);
  process.exit(0);
}

writeFileSync(OUT, freeOut);
writeFileSync(PACK_OUT, packOut);

const spread = (list) =>
  list.reduce((acc, l) => ((acc[l.difficulty] = (acc[l.difficulty] ?? 0) + 1), acc), {});

console.log(`✓ free run: ${free.length} levels  ${JSON.stringify(spread(free))}`);
for (const p of packBanks) {
  const loose = p.levels.filter((l) => l.looseTheme).length;
  console.log(
    `  ${p.id.padEnd(10)} ${String(p.levels.length).padStart(3)} levels  ${JSON.stringify(spread(p.levels))}` +
      (loose ? `  (${loose} loose-theme)` : '')
  );
}
