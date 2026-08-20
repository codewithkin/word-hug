import { LEVELS } from '@/content/levels';
import { PACK_LEVELS } from '@/content/pack-levels';
import { normalise, type GuessResult, type Word } from '@/lib/puzzles';

/**
 * ── The level bank ────────────────────────────────────────────────────────
 * Session 7. The product's main surface is now a linear run of levels; the
 * daily puzzle is a separate list that sits alongside it.
 *
 * A `Level` is a `Puzzle` with a permanent 1-based number. The number is the
 * whole contract: it is what the map draws, what progress is keyed on, and
 * what a player says out loud. **The bank is append-only** — inserting a level
 * renumbers everything after it and rewrites the history of anyone playing.
 */

export interface Level {
  id: string;
  /** 1-based, permanent, and the key everything else uses. */
  level: number;
  answer: string;
  accepted: string[];
  words: Word[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: string;
}

export const LEVEL_COUNT = LEVELS.length;

/** Levels per row band on the map. Also the "chapter" size for the header. */
export const BLOCK_SIZE = 10;

export function levelAt(n: number): Level | null {
  if (n < 1 || n > LEVELS.length) return null;
  return LEVELS[n - 1] ?? null;
}

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function allLevels(): Level[] {
  return LEVELS;
}

/**
 * Levels grouped into blocks of ten, for the map.
 *
 * Returned as a flat list of `{ block, levels }` rather than a nested map so
 * the screen can render a `FlatList` over it without flattening again — the
 * map is the screen most likely to grow to a thousand rows.
 */
export function levelBlocks(): { block: number; levels: Level[] }[] {
  const out: { block: number; levels: Level[] }[] = [];
  for (let i = 0; i < LEVELS.length; i += BLOCK_SIZE) {
    out.push({ block: Math.floor(i / BLOCK_SIZE) + 1, levels: LEVELS.slice(i, i + BLOCK_SIZE) });
  }
  return out;
}

/** Grades a guess against a level. Same rules as the daily — PRD §2.2. */
export function gradeLevelGuess(level: Level, guess: string): GuessResult {
  const typed = normalise(guess);
  if (typed.length === 0) return 'wrong';

  const answer = normalise(level.answer);
  if (typed === answer) return 'correct';
  if (level.accepted.some((v) => normalise(v) === typed)) return 'correct';

  // Kept in step with `gradeGuess` by construction: both call the same
  // `normalise`, and the near-miss rule is one edit, never a solve.
  let distance = 0;
  if (Math.abs(typed.length - answer.length) <= 1) {
    distance = editDistanceOne(typed, answer) ? 1 : 2;
  } else {
    distance = 2;
  }
  return distance === 1 ? 'near' : 'wrong';
}

/** True when `a` and `b` are exactly one insert, delete or substitution apart. */
function editDistanceOne(a: string, b: string): boolean {
  if (a === b) return false;

  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (long.length - short.length > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (short.length === long.length) i++;
    j++;
  }

  return edits + (long.length - j) === 1;
}

// ── Pack banks ─────────────────────────────────────────────────────────────

/**
 * Levels belonging to a pack.
 *
 * **A pack's levels are its own.** They share nothing with the free run — no
 * answer appears in two banks, and `scripts/build-levels.mjs` throws if that
 * ever stops being true. Session 7 got this wrong: packs were curated *views*
 * over the free bank, so buying one bought fifty puzzles the player had
 * already solved.
 *
 * Numbering restarts at 1 inside each pack. "Level 12 of Creatures" and
 * "level 12" are different puzzles, which is why progress is keyed on the
 * pack id as well as the number — see `packLevelKey`.
 */
export function packLevels(packId: string): Level[] {
  return PACK_LEVELS[packId] ?? [];
}

export function packLevelAt(packId: string, n: number): Level | null {
  const bank = packLevels(packId);
  if (n < 1 || n > bank.length) return null;
  return bank[n - 1] ?? null;
}

export function packLevelCount(packId: string): number {
  return packLevels(packId).length;
}

/**
 * The progress key for one pack level.
 *
 * Namespaced, because pack numbering restarts at 1 and a bare number would
 * collide with the free run's level 1 — and with every other pack's.
 */
export function packLevelKey(packId: string, n: number): string {
  return `${packId}:${n}`;
}

/** A pack level by its generated id, across every pack. */
export function packLevelById(id: string): Level | undefined {
  for (const bank of Object.values(PACK_LEVELS)) {
    const hit = bank.find((l) => l.id === id);
    if (hit) return hit;
  }
  return undefined;
}
