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
 *  1. ~~A category for the answer~~ — **retired in session 8b.** It was free
 *     and it is now simply printed on the board, always, for every puzzle in
 *     every bank. See below.
 *  2. **The first letter** — 1 coin.
 *  3. **The whole answer** — 2 coins.
 *
 * ── Why tier 1 went ───────────────────────────────────────────────────────
 * It cost nothing and almost nobody would have taken it. It sat behind a `?`
 * button, and a `?` button next to a coin balance reads as "this will charge
 * you" no matter what the sheet says when you open it. The owner played the
 * early levels and found them very hard without ever tapping it — which is the
 * whole story: a free hint nobody taps is not a free hint, it is a free hint
 * you have hidden.
 *
 * So the category moved onto the board itself (`components/game-board.tsx`)
 * and stopped being something to buy. The tier numbering is deliberately
 * **not** renumbered: `nudges` in MMKV stores these integers against puzzle
 * ids, and shifting them would silently re-interpret every hint a player has
 * already taken.
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
 * The short form, for the chip printed on the board.
 *
 * `categoryLabel` is a sentence — "It's one of the elements — earth, air, fire
 * or water" — which is right for a line of prose under the board and wrong for
 * a small uppercase tracked chip above it, where it would shout and wrap onto
 * three lines.
 *
 * Two maps rather than one derived from the other, because "It's a part of the
 * body" → "PART OF THE BODY" is not a transformation any rule gets right for
 * all fourteen.
 */
const CATEGORY_CHIPS: Record<string, string> = {
  'category.animals': 'An animal',
  'category.body': 'Part of the body',
  'category.element': 'An element',
  'category.food': 'Food or drink',
  'category.home': 'Around the house',
  'category.material': 'A material',
  'category.nature': 'Out in nature',
  'category.people': 'A person',
  'category.places': 'A place',
  'category.play': 'Something you play with',
  'category.sky': 'Up in the sky',
  'category.things': 'An everyday object',
  'category.time': 'To do with time',
  'category.weather': 'The weather',
};

export function categoryChip(puzzle: Puzzle): string {
  return CATEGORY_CHIPS[puzzle.category] ?? 'An everyday word';
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
 * The line under the board once a hint has been taken.
 *
 * Tier 3 does not print the answer as a sentence — it fills the tiles instead,
 * which is what the player paid for, and saying it twice would be gloating.
 *
 * Tier 1 now returns null: the category is on the board above, and repeating
 * it underneath would make the board look like it had given two hints when it
 * had given one. A tier-1 value can still be in storage from before session 8b,
 * so it is handled rather than assumed away.
 */
export function nudgeNote(puzzle: Puzzle, tier: NudgeTier): string | null {
  if (tier >= 2) return `The answer begins with ${firstLetter(puzzle)}`;
  return null;
}

/**
 * The next rung a player can take, or null when both are spent.
 *
 * `find` over the rungs rather than `current + 1`, because tier 1 no longer
 * exists as a rung: a player at tier 0 must be offered tier 2, and arithmetic
 * would offer them a rung that is not in the list.
 */
export function nextRung(current: NudgeTier): NudgeRung | null {
  return NUDGE_RUNGS.find((r) => r.tier > current) ?? null;
}
