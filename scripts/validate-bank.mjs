#!/usr/bin/env node
/**
 * Word Hug — validate every puzzle in both banks against Datamuse
 *
 *   node scripts/validate-bank.mjs                 # all 300
 *   node scripts/validate-bank.mjs --set free      # one set
 *   node scripts/validate-bank.mjs --from 120      # resume after an interruption
 *   node scripts/validate-bank.mjs --limit 20      # a taste, to check it works
 *
 * **This is the check nothing else can do.** `level-check.mjs` proves the bank
 * is well-formed and playable; only this one answers the two questions a human
 * cannot:
 *
 *   · is there a SECOND word that hugs all three clues?
 *   · is the difficulty rating real, or just my wordlist heuristic?
 *
 * A level with two valid answers is the worst bug the content can have. To a
 * player it looks like the game rejecting a correct word — and since session 7
 * it also costs them a heart.
 *
 * ── Why this is a separate script and not part of `pnpm check` ────────────
 * It needs the network and it is slow: ~4 Datamuse calls per puzzle, 300
 * puzzles, rate-limited. Responses cache to `.cache/datamuse/`, so the first
 * run is the expensive one and re-runs are nearly free. It is deliberately not
 * in the fast suite — a check that takes ten minutes gets skipped, and a
 * skipped check is worse than an honest gap.
 *
 * ── Output ────────────────────────────────────────────────────────────────
 * A line per puzzle as it goes, then a summary, and `bank-report.json` with
 * the full result for every one — including the derived difficulty, so the
 * numbers in `levels.source.mjs` can be corrected from real frequency data
 * rather than from my guess at which words are common.
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECKER = join(ROOT, 'scripts/puzzle-check.mjs');

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const onlySet = arg('set');
const from = Number(arg('from', '0'));
const limit = Number(arg('limit', '0'));

// ── Read the source, which is the only place `set` is recorded ─────────────

const source = readFileSync(join(ROOT, 'scripts/levels.source.mjs'), 'utf8');

const puzzles = source
  .split('\n')
  .map((l) => l.trim())
  // `*` and `/` skip the file's own JSDoc header, which documents the column
  // format and therefore contains pipes. The first run validated a "puzzle"
  // whose answer was `*` and whose set was `answer`.
  .filter(
    (l) =>
      l &&
      !l.startsWith('#') &&
      !l.startsWith('*') &&
      !l.startsWith('/') &&
      !l.startsWith('export') &&
      l.includes('|')
  )
  .map((line) => {
    const [answer, clues, , set] = line.split('|').map((p) => p.trim());
    return {
      answer,
      set,
      clues: clues.split(',').map((c) => {
        const [word, pos] = c.trim().split(':');
        return { word, position: pos === 'b' ? 'before' : 'after' };
      }),
    };
  })
  .filter((p) => p.answer && p.set && p.clues.length === 3)
  .filter((p) => !onlySet || p.set === onlySet);

const work = puzzles.slice(from, limit ? from + limit : undefined);

console.log(
  `Validating ${work.length} puzzle${work.length === 1 ? '' : 's'}` +
    (onlySet ? ` from "${onlySet}"` : '') +
    `\nCached responses in .cache/datamuse — re-runs are nearly free.\n${'─'.repeat(60)}`
);

// ── Run the existing checker, one puzzle at a time ─────────────────────────

/**
 * Shells out to `puzzle-check.mjs` rather than importing it.
 *
 * That script is a spike with top-level `await` and a `process.exit` at the
 * end — importing it would run its CLI. Spawning keeps it exactly as it is,
 * which matters because it is the piece of this pipeline that has actually
 * been proven against known-good and known-bad controls.
 */
function check(puzzle) {
  return new Promise((resolve) => {
    const clues = puzzle.clues.map((c) => `${c.word}:${c.position}`).join(',');
    const child = spawn(
      process.execPath,
      [CHECKER, '--answer', puzzle.answer, '--clues', clues],
      { cwd: ROOT }
    );

    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ accepted: code === 0, output: out }));
    child.on('error', (e) => resolve({ accepted: false, output: String(e) }));
  });
}

/**
 * A failed lookup is not a failed puzzle.
 *
 * The first run of this reported `snow` as a content failure when the real
 * cause was a blocked network — the checker exits non-zero either way. Three
 * hundred lines of false rejections would be worse than no report at all, so
 * infrastructure errors are counted separately and the run aborts once it is
 * clear the network is gone rather than grinding through 300 of them.
 */
function isNetworkFailure(output) {
  return /fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|getaddrinfo|socket hang up/i.test(output);
}

/**
 * Rate limiting is not the network being down — it is the network working and
 * asking us to slow down.
 *
 * Datamuse is a free service with no published limit, and firing four requests
 * per puzzle across 300 puzzles as fast as Node can manage will hit whatever
 * the limit is. The first run reported that as "unreachable", which is the
 * same class of mistake as calling a timeout a pass: the tool blamed the
 * content for an infrastructure problem it could have solved itself.
 */
function isThrottled(output) {
  return /Datamuse (429|50\d)|ETIMEDOUT|rate limit/i.test(output);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One puzzle, with backoff.
 *
 * Cached puzzles never reach the network at all, so this costs nothing on a
 * re-run — which is what makes fixing a handful of failures and re-running the
 * whole bank cheap.
 */
async function checkWithRetry(puzzle, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const result = await check(puzzle);
    if (result.accepted || !isThrottled(result.output)) return result;

    const wait = 1000 * 2 ** attempt;
    process.stdout.write(`    throttled, waiting ${wait / 1000}s…\n`);
    await sleep(wait);
  }
  return check(puzzle);
}

const results = [];
let passed = 0;
let failed = 0;
let unreachable = 0;

for (const [i, puzzle] of work.entries()) {
  const { accepted, output } = await checkWithRetry(puzzle);
  const n = String(from + i + 1).padStart(3);

  // A small gap between puzzles. Cheap insurance against the limit, and it
  // costs nothing on cached runs because those never hit the network.
  if (i > 0) await sleep(120);

  if (!accepted && isNetworkFailure(output)) {
    unreachable++;
    results.push({ ...puzzle, accepted: null, reason: 'datamuse unreachable' });
    console.log(`  ? ${n}  ${puzzle.set.padEnd(10)} ${puzzle.answer.padEnd(9)}  datamuse unreachable`);

    // Three in a row means the network is down, not that three puzzles are bad.
    if (unreachable >= 5 && passed + failed === 0) {
      console.error(
        `\n✗ Datamuse is unreachable — nothing was validated.\n` +
          `  Check the connection and re-run. Cached puzzles still pass offline,\n` +
          `  so a partial cache will give a partial answer, not a wrong one.\n`
      );
      process.exit(2);
    }
    continue;
  }

  // The checker prints its own reasoning; pull the headline out of it.
  const reason =
    output
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^(FAIL|REJECT|✗|✘)/i.test(l))
      .join('; ') || (accepted ? '' : 'rejected — see the checker output');

  const difficulty = /difficulty[^\d]*(\d)/i.exec(output)?.[1] ?? null;

  results.push({ ...puzzle, accepted, difficulty, reason: reason.slice(0, 300) });

  if (accepted) passed++;
  else failed++;

  const mark = accepted ? '✓' : '✗';
  const line = `  ${mark} ${n}  ${puzzle.set.padEnd(10)} ${puzzle.answer.padEnd(9)}`;
  console.log(accepted ? line : `${line}  ${reason}`);
}

// ── Report ─────────────────────────────────────────────────────────────────

const reportPath = join(ROOT, 'bank-report.json');
writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

console.log(`${'─'.repeat(60)}`);
console.log(
  `${failed === 0 ? '✓' : '✗'} ${passed} passed, ${failed} failed` +
    (unreachable ? `, ${unreachable} unchecked (datamuse unreachable)` : '')
);
if (unreachable) {
  console.log('  The unchecked ones are not passes. Re-run when the network is back.');
}
console.log(`  full report: ${reportPath}`);

if (failed > 0) {
  const bySet = results
    .filter((r) => !r.accepted)
    .reduce((acc, r) => ((acc[r.set] = (acc[r.set] ?? 0) + 1), acc), {});
  console.log(`  failures by set: ${JSON.stringify(bySet)}`);
  console.log(
    '\n  Each failure is one line in scripts/levels.source.mjs. Fix or replace it,\n' +
      '  then re-run — the cache means only the changed puzzles cost anything.\n'
  );
}

process.exit(failed === 0 ? 0 : 1);
