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

import { bandOf, onRampFailures, scoreOf } from './difficulty.mjs';
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
//
// Moved wholesale to `scripts/difficulty.mjs` in session 8. What used to live
// here was a word-frequency proxy that rated `time`, `line`, `back` and `book`
// as the easiest puzzles in the bank and put `book` at level 1, which the owner
// could not solve. See that file for what replaced it and why frequency was the
// wrong signal in the first place.

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
/**
 * How many levels at the head of a bank are strictly ordered, easiest first.
 *
 * ── Why the opening is exempt from the zigzag ─────────────────────────────
 * The sawtooth is right for the body of the run and wrong for the start of it.
 * `ZIGZAG[0] = 1` means slot 1 gets the *second*-easiest puzzle and the easiest
 * lands at level 2 — which, combined with a difficulty function that ranked
 * `book` first, is literally why the owner could not solve level 1.
 *
 * A new player has no idea what a Missing-Link puzzle is yet. They have not
 * earned a breather, because they have not done any work; a dip in level 3
 * reads as variety only once you have a baseline to dip from. So the first ten
 * are a strict staircase and the zigzag starts at level 11.
 */
const ON_RAMP = 10;

function ramp(rows) {
  // `raw` rather than the clamped score: two puzzles that both bottom out at 0
  // still have real distance between them, and at the head of the bank that
  // distance is the difference between level 1 and level 6.
  const sorted = [...rows].sort((a, b) => a.raw - b.raw || a.answer.localeCompare(b.answer));

  const BLOCK = 10;
  /** Positions within a block, easiest-first index → slot. A local zigzag. */
  const ZIGZAG = [1, 0, 3, 6, 2, 5, 9, 4, 7, 8];

  const out = sorted.slice(0, ON_RAMP);

  for (let start = ON_RAMP; start < sorted.length; start += BLOCK) {
    const chunk = sorted.slice(start, start + BLOCK);
    const placed = new Array(chunk.length);
    chunk.forEach((row, i) => {
      const slot = ZIGZAG[i] ?? i;
      placed[slot < chunk.length ? slot : i] = row;
    });
    out.push(...placed.filter(Boolean));
  }

  // The declusterer may swap across the on-ramp boundary, so the gate below
  // runs on the finished order rather than on `sorted`.
  return declusterGiveaways(out);
}

/**
 * Refuses to emit a bank whose opening levels are not actually easy.
 *
 * ── Why this throws instead of warning ────────────────────────────────────
 * Every other content problem in this pipeline degrades a level. This one
 * decides whether a first-time player ever reaches level 2, and it is the
 * failure that actually happened: the bank shipped, the check scripts were
 * green, and the opening puzzle was unsolvable. A warning would have scrolled
 * past exactly the same way.
 *
 * The gate is `onRampFailures` — same-side clues, three household compounds, a
 * picturable answer, no grammatical clue words, nothing opaque. It is a
 * content gate, not a score threshold, because a puzzle can total well and
 * still contain the one thing that stops a beginner dead.
 *
 * If this throws, the fix is in `levels.source.mjs`, not here: retune a clue so
 * all three sit on the same side of the answer, and prefer a compound someone
 * has actually seen. Session 8 did exactly that to eight rows.
 */
function assertOnRamp(levels, set) {
  const problems = [];

  for (let i = 0; i < Math.min(ON_RAMP, levels.length); i++) {
    const failures = onRampFailures(levels[i]);
    if (failures.length > 0) {
      problems.push(`  level ${i + 1} (${levels[i].answer}) — ${failures.join('; ')}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `${set}: the first ${ON_RAMP} levels must be beginner-safe.\n` +
        problems.join('\n') +
        `\n\nFix the clues in scripts/levels.source.mjs — see assertOnRamp in build-levels.mjs.`
    );
  }

  // A staircase that steps backwards is not a staircase. Only the on-ramp is
  // held to this; the body of the run is meant to zigzag.
  for (let i = 1; i < Math.min(ON_RAMP, levels.length); i++) {
    if (levels[i].raw < levels[i - 1].raw) {
      throw new Error(
        `${set}: level ${i + 1} (${levels[i].answer}) is easier than level ${i} (${levels[i - 1].answer}).`
      );
    }
  }
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

  /** Every level within `window` of index i, excluding i itself. */
  const neighbours = (list, i) =>
    list.slice(Math.max(0, i - window), Math.min(list.length, i + window + 1)).filter((_, o) => {
      const abs = Math.max(0, i - window) + o;
      return abs !== i;
    });

  /** True when putting `row` at index i introduces no clash. */
  const fits = (list, i, row) => neighbours(list, i).every((n) => !clashes(n, row));

  /**
   * Two passes over the whole list, then give up.
   *
   * The first version tried to move only the LATER level of a clashing pair and
   * only to a slot of identical difficulty, and left three pairs unresolved in a
   * 50-level bank. Two changes fix it: try moving either member, and accept a
   * swap partner within one difficulty band rather than exactly equal — a level
   * moving from difficulty 3 to 4 inside a 50-level ramp is invisible, whereas
   * two levels that give each other away are not.
   *
   * Bounded at two passes because a swap can create a new clash elsewhere;
   * iterating to a fixed point is not guaranteed to terminate on a bank where
   * some pair genuinely cannot be separated.
   */
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < levels.length; i++) {
      for (let j = i + 1; j <= Math.min(i + window, levels.length - 1); j++) {
        if (!clashes(levels[i], levels[j])) continue;

        let moved = false;

        // Try relocating either member of the pair, nearest candidate first.
        for (const from of [j, i]) {
          for (const k of order(levels.length, from, window)) {
            if (Math.abs(levels[k].difficulty - levels[from].difficulty) > 1) continue;

            const trial = levels.slice();
            [trial[from], trial[k]] = [trial[k], trial[from]];

            if (fits(trial, from, trial[from]) && fits(trial, k, trial[k])) {
              levels[from] = trial[from];
              levels[k] = trial[k];
              moved = true;
              break;
            }
          }
          if (moved) break;
        }
      }
    }
  }

  return levels;
}

/** Candidate indices for a swap, nearest-outside-the-window first. */
function order(length, from, window) {
  const out = [];
  for (let d = window + 1; d < length; d++) {
    if (from + d < length) out.push(from + d);
    if (from - d >= 0) out.push(from - d);
  }
  return out;
}

// ── Parse and validate ─────────────────────────────────────────────────────

const rows = parse(LEVEL_SOURCE).map((r) => {
  const { score, raw, why } = scoreOf(r);
  // `difficulty` stays a 1–5 integer because that is what the level node and
  // the analyser render. `raw` and `why` are build-time only — `raw` orders the
  // bank, `why` is what `--explain` prints — and neither is emitted.
  return { ...r, difficulty: bandOf(score), score, raw, why };
});

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

// The free run is the only bank a player can reach without paying, so it is the
// only one whose opening is load-bearing. This throws rather than warns.
assertOnRamp(free, 'free run');

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

/**
 * Packs get the same ordering and a much softer gate.
 *
 * A pack is bought by someone who has already finished fifty free levels, so
 * its level 1 does not have to teach the game — it only has to not be the
 * hardest puzzle in the pack, which the strict on-ramp sort already guarantees.
 *
 * ── Why this is a count and not a list ────────────────────────────────────
 * The first version printed every failing opening level across all five packs
 * and produced 24 lines of warnings on a build that was fine. Output nobody
 * reads is worse than no output, because it hides the free-run gate that
 * genuinely matters three lines below it.
 *
 * It is also mostly measuring the wrong thing. `onRampFailures` demands that
 * all three compounds be on the household list, and that list was authored
 * against free-run vocabulary — `birdbath` is there and `sandcastle` is not,
 * which says more about what I wrote down than about Outdoors level 1. So the
 * count rides along on the summary line, where it reads as "this pack opens a
 * bit steep" rather than as an error.
 */
const packRoughness = new Map(
  packBanks.map((p) => [p.id, p.levels.slice(0, 5).filter((l) => onRampFailures(l).length > 0).length])
);

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

const band = (l) => `${Math.round(l.score)}`;

console.log(
  `✓ free run: ${free.length} levels  ${JSON.stringify(spread(free))}` +
    `  ·  level 1 "${free[0].answer}" (${band(free[0])}) → level ${free.length} "${free.at(-1).answer}" (${band(free.at(-1))})`
);
for (const p of packBanks) {
  const loose = p.levels.filter((l) => l.looseTheme).length;
  const rough = packRoughness.get(p.id) ?? 0;
  console.log(
    `  ${p.id.padEnd(10)} ${String(p.levels.length).padStart(3)} levels  ${JSON.stringify(spread(p.levels))}` +
      (loose ? `  (${loose} loose-theme)` : '') +
      (rough ? `  (${rough}/5 steep opening)` : '')
  );
}
