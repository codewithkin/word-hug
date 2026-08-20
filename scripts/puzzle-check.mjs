#!/usr/bin/env node
/**
 * Word Hug — puzzle validator spike
 *
 * Checks a Missing Link puzzle against the Datamuse API.
 * Zero dependencies. Requires Node 18+ (global fetch).
 *
 *   node scripts/puzzle-check.mjs --answer thunder --clues fire:after,storm:after,strike:after
 *   node scripts/puzzle-check.mjs --answer wood   --clues fire:before,work:after,land:after
 *
 * `position` is the CLUE's position relative to the ANSWER:
 *   after  → compound is  answer + clue   (thunder + storm = thunderstorm)
 *   before → compound is  clue + answer   (fire + wood     = firewood)
 *
 * Three checks:
 *   A. EXISTENCE   every compound is a real, non-obscure word
 *   B. UNIQUENESS  no other answer satisfies all three clues
 *   C. DIFFICULTY  derived from the answer's corpus frequency, not guessed
 *
 * Responses are cached to .cache/datamuse/ so re-runs cost zero requests.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// ── Tunables ────────────────────────────────────────────────────────────────
// All of these are first guesses. The point of the spike is to find out
// whether they are right. Expect to move MIN_COMPOUND_F in particular.

/**
 * Occurrences per million. thunderstorm=0.82, thunderstrike=0.00.
 *
 * ── Moved from 0.05 to 0.02 ───────────────────────────────────────────────
 * The header of this file always said "expect to move MIN_COMPOUND_F in
 * particular", and the first full run of the 300-puzzle bank is the data that
 * justifies it: 82 rejections, and the top of that list was saltcellar 0.0487,
 * wingnut 0.0481, glowworm 0.0481, dishrag 0.0473, flypaper 0.0471,
 * thumbtack 0.0405, shoehorn 0.0404. Every one an ordinary English compound.
 *
 * Real-but-uncommon compounds live around 0.02–0.05; the genuine nonsense the
 * spike was built to catch sits at 0.0000. A floor of 0.02 separates those two
 * populations, where 0.05 was cutting through the middle of the first one.
 *
 * This also tightens the uniqueness search, because the same floor decides
 * which candidate answers count — a lower floor means MORE possible alternate
 * answers, not fewer. That is the correct direction to be wrong in.
 */
const MIN_COMPOUND_F = 0.02;
const MIN_ANSWER_F = 1.0; // the answer itself must be a common word
const MIN_CLUE_F = 1.0; // clue words must be common too — no obscure clues
const MAX_CANDIDATES = 1000; // Datamuse hard cap
const CACHE_DIR = '.cache/datamuse';

// Zipf → difficulty. Zipf = log10(occurrences per billion) = log10(f_per_million) + 3
const DIFFICULTY_BANDS = [
  { max: Infinity, min: 5.0, level: 1, label: 'everyday' },
  { max: 5.0, min: 4.5, level: 2, label: 'common' },
  { max: 4.5, min: 4.0, level: 3, label: 'familiar' },
  { max: 4.0, min: 3.5, level: 4, label: 'reachable' },
  { max: 3.5, min: 3.0, level: 5, label: 'hard' },
];

// ── Datamuse client ─────────────────────────────────────────────────────────

let requestCount = 0;
let cacheHits = 0;

async function datamuse(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://api.datamuse.com/words?${qs}`;

  const key = createHash('sha256').update(url).digest('hex').slice(0, 32);
  const cachePath = join(CACHE_DIR, `${key}.json`);

  if (existsSync(cachePath)) {
    cacheHits++;
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Datamuse ${res.status} for ${url}`);
  const data = await res.json();

  requestCount++;
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(data));

  // Be polite. The limit is 100k/day but there is no reason to hammer.
  await new Promise((r) => setTimeout(r, 120));
  return data;
}

/** Frequency in occurrences per million words, or 0 if unknown. */
function freqOf(entry) {
  const tag = (entry?.tags ?? []).find((t) => t.startsWith('f:'));
  return tag ? parseFloat(tag.slice(2)) : 0;
}

/**
 * English writes many compounds two or three ways — airstrike / air strike,
 * icecream / ice cream — and Google Books counts each spelling separately.
 * Collapsing them to one key lets us sum the frequencies.
 */
function normalizeForm(s) {
  return s.toLowerCase().replace(/[\s-]+/g, '');
}

/** Strip a clue off the front or back of a word, leaving the stem. */
function stripClue(wordForm, clue, position) {
  const flat = wordForm.toLowerCase();
  const stem =
    position === 'after'
      ? flat.slice(0, flat.length - clue.length)
      : flat.slice(clue.length);
  return stem.replace(/^[\s-]+|[\s-]+$/g, '');
}

/**
 * Did Datamuse actually fail to find the word we asked for?
 *
 * ── The bug this replaces ─────────────────────────────────────────────────
 * The first version returned true whenever a `spellcor:` tag was present, and
 * rejected roughly ninety real compounds across the bank:
 *
 *   forklift  tags: ["query", "spellcor:for life", "f:0.177494"]
 *   turnkey   tags: ["query", "spellcor:turkey",   "f:0.287030"]
 *   riverbed  tags: ["query", "spellcor:diverted", "f:0.260079"]
 *
 * `spellcor:` is Datamuse *offering* a correction — "did you mean turkey?" —
 * not saying the query was wrong. The `query` tag is the one that matters: it
 * means the returned word IS the word we asked for, and there it sits with its
 * own frequency.
 *
 * So: a word is missing only when the result does not carry `query` and the
 * returned spelling differs from what we asked for. `lookup` already rejects a
 * differing spelling, which makes this the belt to that braces.
 */
function wasSpellCorrected(entry, term) {
  const tags = entry?.tags ?? [];
  if (tags.includes('query')) return false;
  if (term && normalizeForm(entry?.word ?? '') === normalizeForm(term)) return false;
  return tags.some((t) => t.startsWith('spellcor:'));
}

function zipf(fPerMillion) {
  return fPerMillion > 0 ? Math.log10(fPerMillion) + 3 : 0;
}

function difficultyFor(fPerMillion) {
  const z = zipf(fPerMillion);
  const band = DIFFICULTY_BANDS.find((b) => z >= b.min && z < b.max);
  return band ? { ...band, zipf: z } : { level: null, label: 'too obscure', zipf: z };
}

/** Look up one exact term, with frequency metadata. */
async function lookup(term) {
  const results = await datamuse({ sp: term, qe: 'sp', md: 'f', max: '1' });
  const hit = results[0];
  if (!hit || normalizeForm(hit.word) !== normalizeForm(term)) {
    return { term, found: false, f: 0, spellCorrected: false };
  }
  return {
    term,
    found: true,
    f: freqOf(hit),
    spellCorrected: wasSpellCorrected(hit, term),
  };
}

/**
 * Look up a compound across all three spellings and sum their frequencies.
 *
 * The joined form is what makes it a compound. "hunger strike" is a phrase,
 * not a compound, because "hungerstrike" is not a word — so a spaced form
 * only counts when the joined form is also real.
 */
async function lookupCompound(answer, clue, position) {
  const joined = compoundOf(answer, clue, position);
  const spaced = position === 'after' ? `${answer} ${clue}` : `${clue} ${answer}`;
  const hyphenated = position === 'after' ? `${answer}-${clue}` : `${clue}-${answer}`;

  const [j, s, h] = await Promise.all([lookup(joined), lookup(spaced), lookup(hyphenated)]);

  const joinedIsReal = j.found && !j.spellCorrected;
  const variants = [j, s, h].filter((v) => v.found && !v.spellCorrected);

  return {
    compound: joined,
    joinedIsReal,
    f: joinedIsReal ? variants.reduce((sum, v) => sum + v.f, 0) : j.f,
    fJoinedOnly: j.f,
    spellCorrected: j.found && j.spellCorrected,
    found: j.found,
    variantsUsed: joinedIsReal ? variants.map((v) => v.term) : [],
  };
}

// ── The three checks ────────────────────────────────────────────────────────

function compoundOf(answer, clue, position) {
  return position === 'after' ? `${answer}${clue}` : `${clue}${answer}`;
}

/**
 * A. Does every compound actually exist and clear the obscurity floor?
 */
async function checkExistence(answer, clues) {
  const rows = [];
  for (const { word, position } of clues) {
    const r = await lookupCompound(answer, word, position);
    const passes = r.joinedIsReal && r.f >= MIN_COMPOUND_F;
    rows.push({ ...r, passes });
  }
  return rows;
}

/**
 * B. Enumerate every word that forms a valid compound with a clue, then
 *    intersect across all three. Should leave exactly the intended answer.
 */
async function candidatesForClue(clue, position) {
  // position 'after'  → compound is X + clue → find words ending in clue → sp=*clue
  // position 'before' → compound is clue + X → find words starting with clue → sp=clue*
  const pattern = position === 'after' ? `*${clue}` : `${clue}*`;
  const results = await datamuse({ sp: pattern, md: 'f', max: String(MAX_CANDIDATES) });

  // Group every spelling of the same compound under one stem, so that
  // "airstrike" and "air strike" are counted once, with their frequencies summed.
  const grouped = new Map();
  for (const entry of results) {
    const wordForm = entry.word.toLowerCase();
    const stem = stripClue(wordForm, clue, position);
    if (stem.length < 3) continue; // the clue word itself, or a fragment

    const key = normalizeForm(stem);
    const isJoined = !/[\s-]/.test(wordForm);

    const g = grouped.get(key) ?? { stem: key, f: 0, joinedSeen: false, forms: [] };
    g.f += freqOf(entry);
    g.joinedSeen ||= isJoined;
    g.forms.push(wordForm);
    grouped.set(key, g);
  }

  // A stem only qualifies if the joined spelling is real (that is what makes it
  // a compound rather than a phrase) and the summed frequency clears the floor.
  const out = new Map();
  for (const [key, g] of grouped) {
    if (!g.joinedSeen) continue;
    if (g.f < MIN_COMPOUND_F) continue;
    out.set(key, g);
  }
  return out;
}

/**
 * Is `stem` just an inflected form of `answer`, rather than a different word?
 *
 * The first full run reported `berries` as an alternate answer for `berry`,
 * `sticks` for `stick`, `nails` for `nail` and `marks` for `mark`. Those are
 * the same word wearing a plural, and a player typing them would be typing the
 * answer. Counting them as collisions would have had us rewrite four perfectly
 * good puzzles.
 */
function isInflectionOf(stem, answer) {
  if (stem === answer) return true;

  const [short, long] = stem.length <= answer.length ? [stem, answer] : [answer, stem];
  if (!long.startsWith(short.slice(0, Math.max(2, short.length - 1)))) return false;

  const suffixes = ['s', 'es', 'ed', 'ing', 'd', 'r', 'er'];
  for (const suffix of suffixes) {
    if (long === short + suffix) return true;
    // berry → berries, city → cities
    if (short.endsWith('y') && long === `${short.slice(0, -1)}ies`) return true;
  }
  return false;
}

/**
 * Bare affixes that Datamuse's `sp=*clue` search leaves behind.
 *
 * Searching for words ending in `site` turns up `er` and `ers` as stems of
 * `siter`/`siters`-shaped fragments. They are not words and cannot be typed as
 * an answer, so they are not alternate answers.
 */
const AFFIXES = new Set([
  'ing', 'ed', 'er', 'ers', 'es', 's', 'ly', 'ness', 'ment', 'tion', 'ion',
  'able', 'ible', 'ful', 'less', 'ish', 'est', 'ward', 'wards',
]);

async function checkUniqueness(answer, clues) {
  const sets = [];
  for (const { word, position } of clues) {
    sets.push({ clue: word, position, map: await candidatesForClue(word, position) });
  }

  let intersection = [...sets[0].map.keys()];
  for (const s of sets.slice(1)) {
    intersection = intersection.filter((k) => s.map.has(k));
  }

  const target = normalizeForm(answer);

  /**
   * A real alternate answer is a different word a player could actually type.
   * Inflections of the intended answer and bare affixes are neither.
   */
  const collisions = intersection.filter(
    (w) =>
      w !== target &&
      w.length >= 3 &&
      !AFFIXES.has(w) &&
      !isInflectionOf(w, target)
  );

  return {
    setSizes: sets.map((s) => ({ clue: s.clue, count: s.map.size })),
    intersection: intersection.sort(),
    collisions,
    foundIntended: intersection.includes(target),
  };
}

// ── Reporting ───────────────────────────────────────────────────────────────

const ok = (s) => `  PASS  ${s}`;
const bad = (s) => `  FAIL  ${s}`;
const warn = (s) => `  WARN  ${s}`;

function fmt(n, places = 4) {
  return Number(n).toFixed(places);
}

async function validate(answer, clues) {
  answer = answer.toLowerCase();
  const failures = [];
  const warnings = [];

  console.log(`\n${'═'.repeat(68)}`);
  console.log(`  ${clues.map((c) => c.word.toUpperCase()).join('  /  ')}`);
  console.log(`  answer: ${answer.toUpperCase()}`);
  console.log('═'.repeat(68));

  // ── A. Existence ──────────────────────────────────────────────────────────
  console.log('\nA. COMPOUND EXISTENCE');
  const existence = await checkExistence(answer, clues);
  for (const r of existence) {
    const detail = `${r.compound.padEnd(20)} f=${fmt(r.f)}`;
    const merged =
      r.variantsUsed.length > 1 ? `  [merged: ${r.variantsUsed.join(' + ')}]` : '';
    if (!r.found) {
      console.log(bad(`${detail}  not in vocabulary`));
      failures.push(`"${r.compound}" is not a word`);
    } else if (r.spellCorrected) {
      console.log(bad(`${detail}  spell-corrected — not really a word`));
      failures.push(`"${r.compound}" only resolves via spell-correction`);
    } else if (r.f < MIN_COMPOUND_F) {
      console.log(bad(`${detail}  below floor ${MIN_COMPOUND_F}${merged}`));
      failures.push(`"${r.compound}" is too obscure (f=${fmt(r.f)})`);
    } else {
      console.log(ok(detail + merged));
    }
  }

  // ── B. Clue and answer commonness ─────────────────────────────────────────
  console.log('\nB. WORD FREQUENCY');
  const answerLookup = await lookup(answer);
  const answerDiff = difficultyFor(answerLookup.f);
  const answerLine = `${answer.padEnd(20)} f=${fmt(answerLookup.f)}  zipf=${fmt(answerDiff.zipf, 2)}`;
  if (answerLookup.f < MIN_ANSWER_F) {
    console.log(bad(`${answerLine}  answer too obscure`));
    failures.push(`answer "${answer}" is too obscure (f=${fmt(answerLookup.f)})`);
  } else {
    console.log(ok(answerLine));
  }

  for (const { word } of clues) {
    const r = await lookup(word);
    const line = `${word.padEnd(20)} f=${fmt(r.f)}`;
    if (r.f < MIN_CLUE_F) {
      console.log(warn(`${line}  clue is uncommon`));
      warnings.push(`clue "${word}" is uncommon (f=${fmt(r.f)})`);
    } else {
      console.log(ok(line));
    }
  }

  // ── C. Uniqueness ─────────────────────────────────────────────────────────
  console.log('\nC. UNIQUENESS');
  const uniq = await checkUniqueness(answer, clues);
  for (const s of uniq.setSizes) {
    console.log(`        ${String(s.count).padStart(4)} candidates pair with "${s.clue}"`);
  }
  console.log(`        intersection: ${uniq.intersection.length ? uniq.intersection.join(', ') : '(empty)'}`);

  if (!uniq.foundIntended) {
    console.log(bad(`"${answer}" did not survive the intersection`));
    failures.push(`the intended answer "${answer}" was not found by the search`);
  } else if (uniq.collisions.length) {
    console.log(bad(`${uniq.collisions.length} other valid answer(s): ${uniq.collisions.join(', ')}`));
    failures.push(`multiple valid answers: ${[answer, ...uniq.collisions].join(', ')}`);
  } else {
    console.log(ok('exactly one valid answer'));
  }

  // ── D. Difficulty ─────────────────────────────────────────────────────────
  console.log('\nD. DERIVED DIFFICULTY');
  if (answerDiff.level === null) {
    console.log(bad(`zipf ${fmt(answerDiff.zipf, 2)} — below the floor, reject`));
  } else {
    console.log(ok(`${answerDiff.level}/5 (${answerDiff.label}), zipf ${fmt(answerDiff.zipf, 2)}`));
  }

  // ── Verdict ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(68)}`);
  if (failures.length === 0) {
    console.log(`  VERDICT: ACCEPT${warnings.length ? `  (${warnings.length} warning(s))` : ''}`);
  } else {
    console.log(`  VERDICT: REJECT`);
    for (const f of failures) console.log(`    · ${f}`);
  }
  for (const w of warnings) console.log(`    ~ ${w}`);
  console.log(`  ${requestCount} API request(s), ${cacheHits} cache hit(s)`);
  console.log('─'.repeat(68));

  return { accepted: failures.length === 0, failures, warnings, difficulty: answerDiff.level };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.answer || !args.clues) {
  console.log(`
Word Hug puzzle validator (spike)

  node scripts/puzzle-check.mjs --answer <word> --clues <word>:<before|after>,...

Examples:

  # The spec's own example. Expected to FAIL on "thunderfire" and "thunderstrike".
  node scripts/puzzle-check.mjs --answer thunder --clues fire:after,storm:after,strike:after

  # A puzzle that should pass.
  node scripts/puzzle-check.mjs --answer wood --clues fire:before,work:after,land:after

"position" is the CLUE's position relative to the ANSWER:
  after   thunder + storm  = thunderstorm   →  storm:after
  before  fire    + wood   = firewood       →  fire:before
`);
  process.exit(1);
}

const clues = args.clues.split(',').map((pair) => {
  const [word, position = 'after'] = pair.split(':');
  if (!['before', 'after'].includes(position)) {
    console.error(`Bad position "${position}" for clue "${word}" — use before or after.`);
    process.exit(1);
  }
  return { word: word.toLowerCase().trim(), position };
});

if (clues.length !== 3) {
  console.error(`A Missing Link puzzle needs exactly 3 clues, got ${clues.length}.`);
  process.exit(1);
}

const result = await validate(args.answer, clues);
process.exit(result.accepted ? 0 : 1);
