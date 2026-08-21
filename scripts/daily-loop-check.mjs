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
  /**
   * The scaffolding link row is **gone**, not gated.
   *
   * It was a grid of links to all 36 routes, `__DEV__`-gated so it could not
   * reach a store build. The owner asked for it removed outright — it sat
   * under the board on the screen they open to play, and a dev-only affordance
   * you have to look past every time is still an affordance you look past.
   *
   * Asserted as an absence so it cannot be reintroduced by a revert.
   */
  ok('the scaffolding link row is gone',
    !/ScaffoldingLinks|LINK_GROUPS/.test(index),
    'removed in session 8b — route testing belongs in a dev menu, not the board');

  /**
   * ── There is no failure state ───────────────────────────────────────────
   * These four checks used to police the hearts system: that a near miss did
   * not charge one, that the daily was exempt, that a replay was free, and
   * that every charge went through a single gate.
   *
   * Session 8 removed hearts, so the guarantees they protected are now
   * structural rather than conditional — you cannot mis-apply an exemption to
   * a mechanic that does not exist. What replaced them is the stronger claim:
   * **nothing anywhere can refuse a guess.**
   *
   * They are kept as checks rather than deleted because the reason hearts went
   * is commercial, not just philosophical — an energy meter ends sessions, and
   * the plan is ad-supported, so hearts spend the revenue they were meant to
   * protect. That argument is exactly the kind that gets quietly reversed six
   * months later by someone adding "just a small" attempt cap. This is the
   * tripwire.
   */
  const level = code('hooks/use-level.ts');
  const levelScreen = code('app/level/[n].tsx');
  const packScreen = code('app/pack-level/[id]/[n].tsx');
  const storage = code('lib/storage/index.ts');

  ok('the level hook has no way to refuse a guess',
    !/outOfHearts|spendHeart|getHearts/.test(level),
    'a meter that empties is a timer, and the app promises there is none');
  ok('no screen renders a hearts meter',
    !/HeartsMeter/.test(levelScreen + packScreen + code('app/home.tsx')),
    'the energy system was removed, not hidden behind a flag');
  ok('storage has no heart balance to spend',
    !/hearts/i.test(storage),
    'leaving the accessors behind is how a removed feature comes back');
  ok('a wrong guess is counted but never charged',
    level.includes('setWrongGuesses') && !/spend/i.test(level),
    'the difficulty model needs the signal; the player must not pay for it');
});

group('help that is always on', () => {
  /**
   * ── Session 8b ──────────────────────────────────────────────────────────
   * The owner could not solve the early levels. Two aids went in, both in the
   * shared board so no screen can miss them, and both are the kind of thing a
   * later refactor quietly drops.
   */
  const board = code('components/game-board.tsx');
  const nudges = code('lib/nudges.ts');

  ok('the board prints the category',
    board.includes('{category}'),
    'a free hint behind a ? button next to a coin balance is not a free hint');
  ok('the category is no longer sold as a rung',
    !/tier: 1,/.test(nudges),
    'it is on the board now; offering it too would be charging for scenery');
  ok('tier numbering was not shifted',
    nudges.includes('tier: 2,') && nudges.includes('tier: 3,'),
    'nudges are stored by integer against puzzle ids — renumbering re-reads history');
  ok('every puzzle screen passes the category through',
    ['app/daily.tsx', 'app/level/[n].tsx', 'app/pack-level/[id]/[n].tsx']
      .every((f) => code(f).includes('category={category}')),
    'daily, the free run and the packs must all show it');
  ok('every puzzle screen passes position feedback through',
    ['app/daily.tsx', 'app/level/[n].tsx', 'app/pack-level/[id]/[n].tsx']
      .every((f) => code(f).includes('correctAt={correctAt}')),
    'same three screens, same reason');
  ok('feedback describes the submitted guess, not the tiles',
    code('hooks/use-level.ts').includes('setCorrectAt(correctPositions('),
    'deriving it live would turn the board into a letter-by-letter oracle');
  ok('the daily coin is granted before it is announced',
    /grantCoins\(DAILY_COIN_GRANT\);\s*\n\s*progress\.set/.test(code('lib/storage/index.ts')),
    'if the toast owned the grant, a fast dismiss would cost the player a coin');
});

group('purchases', () => {
  /**
   * ── Entitlements write ownership; nothing reads it from the network ─────
   * `systems/storage-persistence.md` §7. The failure this guards is subtle and
   * expensive: a screen that awaits `getCustomerInfo()` before deciding
   * whether to render a board is blank on a train, and tells someone who paid
   * that they did not.
   */
  const purchases = code('lib/purchases.ts');
  const packScreen = code('app/pack/[id].tsx');
  const packLevel = code('app/pack-level/[id]/[n].tsx');

  ok('only lib/purchases.ts imports the RevenueCat SDK',
    !/react-native-purchases/.test(packScreen + packLevel + code('app/shop.tsx') + code('hooks/use-level.ts')),
    'a second import is a second place ownership can be decided');
  ok('the pack board reads ownership from storage, synchronously',
    packLevel.includes('ownsPack(') && !/await .*[Cc]ustomerInfo/.test(packLevel),
    'a board that waits on the network is a board that is blank offline');
  ok('entitlements grant packs and never revoke them',
    purchases.includes('grantPack(') && !/revokePack|removePack|clearPacks/.test(purchases),
    'an empty response usually means offline, not refunded');
  ok('coins are credited from the product actually purchased',
    /COIN_GRANTS\[pkg\.product\.identifier\]/.test(purchases),
    'keying off the requested package would let a mismatched id mint coins');
  ok('no virtual-currency balance is read back',
    !/getVirtualCurrencies|invalidateVirtualCurrenciesCache/.test(purchases),
    'coins are local; a second source of truth for one number is how they drift');
  ok('the secret RevenueCat key is nowhere in the app',
    !/sk_[A-Za-z0-9]/.test(purchases + code('app/_layout.tsx')),
    'the sk_ key can move money and must never ship in a binary');
});

console.log(
  `\n${failures === 0 ? '✓' : '✗'} ${checks - failures}/${checks} checks passed\n`
);
process.exit(failures === 0 ? 0 : 1);
