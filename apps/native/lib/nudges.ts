import type { Puzzle } from '@/lib/puzzles';

/**
 * ── The three hints ───────────────────────────────────────────────────────
 * Called "hints" everywhere the player can see, as of session 8. They were
 * "nudges" internally and "a category for the answer" on screen, and the owner
 * reported the wording as confusing — reasonably, since "category" describes
 * how the content is tagged rather than what the player gets.
 *
 * The internal names still say nudge in places; the player-facing strings do
 * not, and those are the ones in this file.
 *
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
  { tier: 1, label: 'What kind of word it is', cost: 0 },
  { tier: 2, label: 'The letter it starts with', cost: 1 },
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
  'category.animals': "It's an animal",
  'category.body': "It's a part of the body",
  'category.element': "It's one of the elements — earth, air, fire or water",
  'category.food': "It's something you eat or drink",
  'category.home': "It's something you'd find around the house",
  'category.material': "It's a material things are made of",
  'category.nature': "It's something out in nature",
  'category.people': "It's a person",
  'category.places': "It's a place, or part of one",
  'category.play': "It's something you play with",
  'category.sky': "It's something up in the sky",
  'category.things': "It's an everyday object",
  'category.time': "It's to do with time",
  'category.weather': "It's the weather",
};

/**
 * What tier 1 reveals.
 *
 * Falls back to a flat, honest sentence rather than the raw key. A player
 * seeing `category.material` would read it as a bug, and it would be one — but
 * it must not be the kind that makes the free nudge feel broken.
 */
export function categoryLabel(puzzle: Puzzle): string {
  return CATEGORY_LABELS[puzzle.category] ?? "It's an everyday word";
}

/**
 * What tier 2 reveals: the letter the ANSWER starts with.
 *
 * ── Say which word it belongs to ──────────────────────────────────────────
 * This used to render as "… · starts with H" appended to the category, and the
 * owner read the H as referring to the answer — which it does — but on a board
 * whose keys contained no H, because a separate bug was showing another
 * puzzle's hint entirely (see `lib/content.ts`).
 *
 * With that fixed the letter is always one of the keys on screen, because
 * `keysFor` seeds the row from the answer's own distinct letters. The wording
 * now says so out loud rather than leaving the player to infer it.
 */
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
  if (tier >= 2) {
    return `${categoryLabel(puzzle)}, and the answer begins with ${firstLetter(puzzle)}`;
  }
  return null;
}

/** The next rung a player can take, or null when all three are spent. */
export function nextRung(current: NudgeTier): NudgeRung | null {
  return NUDGE_RUNGS.find((r) => r.tier === current + 1) ?? null;
}
