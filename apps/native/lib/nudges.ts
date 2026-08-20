import type { Puzzle } from '@/lib/puzzles';

/**
 * ── The three nudges ──────────────────────────────────────────────────────
 * `app/nudge-picker.tsx` is the surface; this is what the rungs mean.
 *
 * The shape of the ladder is the product's argument that help is not failure:
 *
 *  1. **A category for the answer** — free, forever, no coin, no limit. It is
 *     the rung most players will use and it costs them nothing.
 *  2. **The first letter** — 1 coin.
 *  3. **The whole answer** — 2 coins.
 *
 * They open in order. Tier 3 is not a paywall on tier 2; it is a queue, which
 * is why the picker says "Later" rather than "Locked" on an unreached rung and
 * why there is no way to buy past it.
 *
 * Taking a nudge never ends the puzzle and never touches the streak. Running
 * out of coins is overlay C (`/zero-coin`), which is a screen about what is
 * still free rather than a wall.
 */

export type NudgeTier = 0 | 1 | 2 | 3;

export interface NudgeRung {
  tier: 1 | 2 | 3;
  label: string;
  /** Coins. Zero is free and stays free. */
  cost: number;
}

export const NUDGE_RUNGS: NudgeRung[] = [
  { tier: 1, label: 'A category for the answer', cost: 0 },
  { tier: 2, label: 'The first letter', cost: 1 },
  { tier: 3, label: 'The whole answer', cost: 2 },
];

/**
 * Human labels for the `category.*` keys in the bank.
 *
 * These are i18n keys by design (`systems/content-pipeline.md` §1) and there is
 * no i18n layer wired yet — `i18next` is installed and unused. Mapping them
 * here keeps the bank honest about what it stores while letting the nudge
 * actually say something. **When i18n lands this map is deleted**, not
 * translated: it is standing in for the resource bundle, not defining one.
 */
const CATEGORY_LABELS: Record<string, string> = {
  'category.animals': 'An animal',
  'category.body': 'Part of the body',
  'category.element': 'Something elemental',
  'category.food': 'Something you eat or drink',
  'category.home': 'Something around the house',
  'category.material': 'A material',
  'category.nature': 'Something in nature',
  'category.places': 'A place, or part of one',
  'category.play': 'Something you play with',
  'category.sky': 'Something in the sky',
  'category.things': 'An everyday object',
  'category.time': 'Something to do with time',
  'category.weather': 'Weather',
};

/**
 * What tier 1 reveals.
 *
 * Falls back to a flat, honest sentence rather than the raw key. A player
 * seeing `category.material` would read it as a bug, and it would be one — but
 * it must not be the kind that makes the free nudge feel broken.
 */
export function categoryLabel(puzzle: Puzzle): string {
  return CATEGORY_LABELS[puzzle.category] ?? 'A common everyday word';
}

/** What tier 2 reveals. */
export function firstLetter(puzzle: Puzzle): string {
  return puzzle.answer.charAt(0).toUpperCase();
}

/**
 * The line under the board once a nudge has been taken.
 *
 * Tier 3 does not print the answer as a sentence — it fills the tiles instead,
 * which is what the player paid for, and saying it twice would be gloating.
 */
export function nudgeNote(puzzle: Puzzle, tier: NudgeTier): string | null {
  if (tier === 1) return categoryLabel(puzzle);
  if (tier === 2) return `${categoryLabel(puzzle)} · starts with ${firstLetter(puzzle)}`;
  if (tier === 3) return categoryLabel(puzzle);
  return null;
}

/** The next rung a player can take, or null when all three are spent. */
export function nextRung(current: NudgeTier): NudgeRung | null {
  return NUDGE_RUNGS.find((r) => r.tier === current + 1) ?? null;
}
