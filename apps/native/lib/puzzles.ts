import { DAILY_BANK } from '@/content/daily';
import { daysBetween, longDate as formatLongDate, weekdayName } from '@/lib/dates';

/**
 * ── The puzzle model and the daily schedule ───────────────────────────────
 * `systems/content-pipeline.md` §1 and §5.
 *
 * Nothing here touches storage beyond borrowing its date maths — the *clamped*
 * today comes from `effectiveToday()` and is passed in. Keeping the selection
 * pure means the archive can ask for any date with the same function, which is
 * the property §5 requires: "a date maps to exactly one puzzle, forever".
 */

export type PuzzleId = string;

export interface Word {
  /** Stored lowercase; the UI uppercases. */
  text: string;
  /** Where the CLUE sits relative to the answer. Never shown to the player. */
  position: 'before' | 'after';
}

export interface Puzzle {
  id: PuzzleId;
  /** Canonical, lowercase. */
  answer: string;
  /** Extra accepted forms. Never includes the canonical answer — that is implied. */
  accepted: string[];
  words: Word[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: string;
}

/**
 * Day zero of the schedule, and a Monday so that `dayIndex % 7` is the weekday
 * the difficulty curve is written against (PRD §3.2).
 *
 * **Fixed and identical for every user** (§5). It is deliberately not the
 * install date: two people opening the app on the same morning have to get the
 * same puzzle, or "did you get today's?" stops meaning anything.
 */
export const EPOCH = '2026-08-17';

export function dayIndexFor(date: string): number {
  return daysBetween(EPOCH, date);
}

/**
 * The puzzle for a date, or null.
 *
 * Null has two causes and they are not the same thing. Before `EPOCH` there is
 * no schedule; past the end of the bank the schedule has simply run out, which
 * is `/caught-up` and a content problem rather than an error. Both are handled
 * by the caller — neither throws.
 */
export function puzzleForDate(date: string): Puzzle | null {
  const index = dayIndexFor(date);
  if (index < 0 || index >= DAILY_BANK.length) return null;
  return DAILY_BANK[index] ?? null;
}

export function puzzleById(id: PuzzleId): Puzzle | undefined {
  return DAILY_BANK.find((p) => p.id === id);
}

/** How many days of content are left after `date`. Drives the archive and §6. */
export function daysRemainingAfter(date: string): number {
  return Math.max(0, DAILY_BANK.length - 1 - dayIndexFor(date));
}

// ── Answers ────────────────────────────────────────────────────────────────

/**
 * PRD §2.2 input rules: case-insensitive, whitespace collapsed, diacritics
 * normalised. Applied to both sides of every comparison so the rules cannot
 * drift apart.
 */
export function normalise(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export type GuessResult = 'correct' | 'near' | 'wrong';

/**
 * Levenshtein distance, capped — we only ever ask "is it exactly 1?".
 *
 * The cap is not an optimisation. It is what stops a wildly wrong guess with a
 * coincidentally small edit distance from being called "so close", which would
 * make the one warm thing the interface says meaningless.
 */
function editDistance(a: string, b: string, cap = 2): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost
      );
      current[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > cap) return cap + 1;
    previous = current;
  }

  return previous[b.length] ?? cap + 1;
}

/**
 * Grades a guess.
 *
 * `near` is the product's only warm signal, and PRD §2.2 defines it precisely:
 * a one-character miss is a "so close" nudge and **never** a solve. Nothing is
 * auto-corrected and nothing is silently accepted — the person types the word
 * themselves or they do not have it yet.
 *
 * The declared `accepted` variants are checked for exact equality only. A
 * plural is a real answer; a typo of a plural is still a typo.
 */
export function gradeGuess(puzzle: Puzzle, guess: string): GuessResult {
  const typed = normalise(guess);
  if (typed.length === 0) return 'wrong';

  const answer = normalise(puzzle.answer);
  if (typed === answer) return 'correct';
  if (puzzle.accepted.some((v) => normalise(v) === typed)) return 'correct';

  return editDistance(typed, answer) === 1 ? 'near' : 'wrong';
}

// ── The letter keys ────────────────────────────────────────────────────────

/** Decoys are drawn from here — common letters, so they are plausible. */
const DECOY_POOL = 'ETAORINSHLDCUMPFGY';

/** Total keys offered. Six is what the 09 alternate-state designs draw. */
export const KEY_COUNT = 6;

/**
 * A small deterministic hash. The key row must be identical every time a
 * puzzle is opened — a set of letters that reshuffles on remount would read as
 * the board resetting itself.
 */
function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * The letters offered for a puzzle: **one key per letter occurrence** in the
 * answer, plus decoys up to `KEY_COUNT`, in a stable per-puzzle order.
 *
 * ── One key per occurrence, not per distinct letter (session 8b) ──────────
 * This used to be `new Set(answer)`. Level 3 is `EYE`, which offered a single
 * `E`, and the owner reported it as unsolvable — reasonably. The board *did*
 * accept a second tap on the same key, and the code even said so, but a key
 * that **dims after one use** is the interface stating that it is spent. The
 * comment defending the old behaviour called a dead key "a bug"; a key that
 * looks dead is the same bug wearing a coat.
 *
 * 77 of the 300 answers have a repeated letter, so this was not an edge case.
 * `pepper` is the worst: three Ps and two Es.
 *
 * ── What this costs ───────────────────────────────────────────────────────
 * Wider key rows. `pepper` needs six letter keys plus a decoy, so seven — the
 * caps are `flex-1` and simply get narrower. Nothing in the bank needs more
 * than seven.
 *
 * ── Why decoys at all ─────────────────────────────────────────────────────
 * Without them the key row *is* the answer, unordered — an anagram, which is a
 * different and much easier puzzle. Two or three decoys keep the clues doing
 * the work while still ruling out the free-text problem the design solved by
 * showing keys in the first place.
 */
export function keysFor(puzzle: Puzzle): string[] {
  // Every character, repeats included — that is the whole change.
  const needed = [...normalise(puzzle.answer).replace(/[^a-z]/g, '')];
  const decoys = [...DECOY_POOL.toLowerCase()].filter((c) => !needed.includes(c));

  let seed = seedFrom(puzzle.id);
  const next = () => {
    // xorshift32 — tiny, deterministic, and good enough to look unordered.
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };

  // `needed.length + 1` is the floor, not `needed.length`: an answer that
  // exactly fills the row makes the key set BE the answer, unordered. That is
  // an anagram — a different and much easier puzzle.
  // `scripts/level-check.mjs` fails the bank if this regresses.
  const keys = [...needed];
  while (keys.length < Math.max(KEY_COUNT, needed.length + 1) && decoys.length > 0) {
    const [picked] = decoys.splice(Math.floor(next() * decoys.length), 1);
    if (picked) keys.push(picked);
  }

  // Fisher–Yates, so the answer's letters are not all at the front.
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const a = keys[i];
    const b = keys[j];
    if (a !== undefined && b !== undefined) {
      keys[i] = b;
      keys[j] = a;
    }
  }

  return keys.map((c) => c.toUpperCase());
}

// ── Display ────────────────────────────────────────────────────────────────

export function clueWords(puzzle: Puzzle): string[] {
  return puzzle.words.map((w) => w.text.toUpperCase());
}

/**
 * Which typed positions hold the right letter.
 *
 * Session 8b. Feedback on a wrong guess, not a hint: it describes the guess
 * the player just made rather than the answer they have not. Correct-position
 * only — no Wordle-style "right letter, wrong place" — because the keyboard is
 * already only six letters, and adding presence information on top of that
 * would make most levels solvable by elimination without reading the clues.
 *
 * Compared against the canonical answer rather than an accepted variant: a
 * variant is a different string, and marking positions against one the player
 * is not typing would light up the wrong slots.
 */
export function correctPositions(answer: string, typed: string): Set<number> {
  const target = answer.toUpperCase();
  const guess = typed.toUpperCase();
  const out = new Set<number>();
  for (let i = 0; i < guess.length && i < target.length; i++) {
    if (guess[i] === target[i]) out.add(i);
  }
  return out;
}

/** What the solve celebration spells out: which side each clue joins on. */
export function compoundsFor(puzzle: Puzzle): { clue: string; before: boolean }[] {
  return puzzle.words.map((w) => ({ clue: w.text.toUpperCase(), before: w.position === 'before' }));
}

/** "Tuesday 19 August" — the eyebrow under the header. */
export function longDate(date: string): string {
  return formatLongDate(date);
}

/** "PUZZLE 128 · TUESDAY" — the chip on the Daily screen. */
export function puzzleChip(date: string): string {
  return `Puzzle ${dayIndexFor(date) + 1} · ${weekdayName(date)}`;
}
