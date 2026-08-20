#!/usr/bin/env node
/**
 * Word Hug — daily-loop checks
 *
 *   node scripts/daily-loop-check.mjs
 *
 * Exercises the parts of the daily loop that are pure functions: the calendar
 * maths, the schedule, guess grading, and the shape of the bundled bank.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * `progress/00-START-HERE.md` is explicit that agents never run the app, so
 * every screen ships "code-complete, unverified". That is unavoidable for
 * appearance and avoidable for arithmetic — and the daily loop is nearly all
 * arithmetic. A schedule that is one day out, or a near-miss that fires on a
 * two-letter difference, is a bug the owner would have to find by playing for
 * a week. These are the bugs that can be caught without a device.
 *
 * It is NOT a substitute for `scripts/puzzle-check.mjs`, which is the only
 * thing that can answer the two questions a human cannot: is the answer
 * unique, and is the difficulty rating real.
 *
 * ── What kind of test this is ─────────────────────────────────────────────
 * Static, not behavioural. It reads the source and asserts on its shape rather
 * than importing and calling it, because the modules are TypeScript and this
 * project has no test runner or build step to lend one. That is a real
 * limitation and worth stating plainly: it can prove the bank is well-formed
 * and that a forbidden concept is absent, and it cannot prove that
 * `gradeGuess('HOUSE')` returns `correct`.
 *
 * The moment a runner is added — and the guess handler is the argument for
 * adding one — the `grading` group should become real assertions against the
 * real function, and these greps should be deleted rather than kept alongside.
 *
 * Zero dependencies.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NATIVE = join(ROOT, 'apps/native');

let failures = 0;
let checks = 0;

function ok(name, condition, detail = '') {
  checks++;
  if (condition) return;
  failures++;
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function group(name, fn) {
  console.log(`\n${name}`);
  fn();
}

/**
 * Source with comments stripped.
 *
 * Every check below is a grep, and the first draft of this file failed twice
 * on its own documentation: `lib/dates.ts` explains *why* it avoids
 * `toISOString`, and `use-daily-puzzle.ts` says in prose that it has no
 * attempt counter. Both read as violations to a naive search. Comments in this
 * project carry the reasoning, so they are long, and they must not be grepped.
 */
function code(relative) {
  return readFileSync(join(NATIVE, relative), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

group('calendar', () => {
  const dates = code('lib/dates.ts');
  ok('daysBetween anchors at UTC noon', dates.includes(', 12)'),
    'a DST shift will round a day off without it');
  ok('localDate does not use toISOString', !dates.includes('toISOString'),
    'toISOString converts to UTC and returns yesterday west of Greenwich');
});

group('bank', () => {
  const raw = readFileSync(join(NATIVE, 'content/daily.ts'), 'utf8');

  const ids = [...raw.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  const answers = [...raw.matchAll(/answer: '([^']+)'/g)].map((m) => m[1]);
  const clueBlocks = [...raw.matchAll(/words: \[([^\]]+)\]/g)].map((m) => m[1]);

  ok('every puzzle has an id, an answer and three clues',
    ids.length === answers.length && ids.length === clueBlocks.length,
    `${ids.length} ids / ${answers.length} answers / ${clueBlocks.length} word lists`);

  ok('ids are unique', new Set(ids).size === ids.length,
    'a reused id corrupts every solve record under it');

  ok('ids are in ascending order', ids.every((id, i) => i === 0 || id > ids[i - 1]),
    'bundle order is the schedule and is append-only');

  ok('answers are lowercase', answers.every((a) => a === a.toLowerCase()),
    'the UI uppercases; storage does not');

  ok('answers are unique', new Set(answers).size === answers.length);

  for (const [i, block] of clueBlocks.entries()) {
    const words = [...block.matchAll(/text: '([^']+)'/g)].map((m) => m[1]);
    const positions = [...block.matchAll(/position: '(before|after)'/g)].map((m) => m[1]);
    ok(`${ids[i]} has exactly three clues`, words.length === 3, `${words.length}`);
    ok(`${ids[i]} has a position on each clue`, positions.length === 3);
    ok(`${ids[i]} clues are lowercase`, words.every((w) => w === w.toLowerCase()));
    ok(`${ids[i]} does not use its own answer as a clue`, !words.includes(answers[i]));
  }

  // The design's key row is six caps. An answer with more than six distinct
  // letters would need a wider row than the screen has.
  for (const [i, answer] of answers.entries()) {
    const distinct = new Set(answer).size;
    ok(`${ids[i]} (${answer}) fits the six-key row`, distinct <= 6, `${distinct} distinct letters`);
  }

  const mixed = clueBlocks.filter((b) => b.includes("'before'") && b.includes("'after'")).length;
  ok('most puzzles mix before and after', mixed >= clueBlocks.length / 2,
    `${mixed} of ${clueBlocks.length} — all-one-side puzzles are flatter and should be a minority`);
});

group('schedule', () => {
  const puzzles = code('lib/puzzles.ts');
  const epoch = /EPOCH = '([\d-]+)'/.exec(puzzles)?.[1];
  ok('EPOCH is set', Boolean(epoch));

  if (epoch) {
    const [y, m, d] = epoch.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
    ok('EPOCH is a Monday', weekday === 1,
      `it is a ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday]} — dayIndex % 7 must be the weekday the PRD curve is written against`);
  }
});

group('grading', () => {
  const puzzles = code('lib/puzzles.ts');
  ok('a near miss is exactly one edit', puzzles.includes("editDistance(typed, answer) === 1"),
    'PRD §2.2: a one-character miss is a nudge, never a solve');
  ok('the edit distance is capped', /editDistance\([^)]*cap = 2\)/.test(puzzles) || puzzles.includes('cap = 2'),
    'an uncapped distance calls wildly wrong guesses "so close"');
  ok('accepted variants are exact-match only', puzzles.includes('normalise(v) === typed'),
    'a typo of a plural is still a typo');
});

group('rule 1 — nothing that punishes', () => {
  const hook = code('hooks/use-daily-puzzle.ts');
  const index = code('app/daily.tsx');

  ok('the state machine has no attempt counter',
    !/attempts?\b/i.test(hook),
    'rule 1 is much harder to break if the state cannot express it');
  ok('the state machine has no timer or countdown',
    !/countdown|timeLeft|remainingTime/i.test(hook));
  ok('a wrong guess does not clear the tiles',
    !/setTyped\(''\)/.test(hook),
    'the typed word must survive a wrong guess — nothing is retyped');
  ok('a wrong guess spends nothing',
    !/spendCoins/.test(hook),
    'a guess is free, always');
  ok('the streak pill hides at zero',
    index.includes('streak > 0'),
    '"0 day streak" on someone\'s first morning is a scolding');
  ok('the scaffolding link row cannot ship',
    index.includes('if (!__DEV__) return null'),
    'the temporary route list must not reach a store build');

  const level = code('hooks/use-level.ts');
  const lives = code('lib/lives.ts');

  ok('the level hook routes every heart charge through shouldSpendHeart',
    level.includes('shouldSpendHeart(') && !/spendHeart\(\)/.test(level.replace(/if \(spendHeart\(\)\)/g, '')),
    'a second, ungated call site is how an exemption gets lost');
  ok('a near miss never costs a heart',
    lives.includes("options.result === 'wrong'"),
    'charging for the one encouraging moment in the loop would invert its meaning');
  ok('the daily puzzle is never gated by hearts',
    code('lib/lives.ts').includes("options.source === 'daily'"),
    'PRD rule 2: never gate daily play');
  ok('a replay never costs a heart',
    code('lib/lives.ts').includes('options.alreadySolved'),
    'a level you have beaten is not a test');
});

console.log(
  `\n${failures === 0 ? '✓' : '✗'} ${checks - failures}/${checks} checks passed\n`
);
process.exit(failures === 0 ? 0 : 1);
