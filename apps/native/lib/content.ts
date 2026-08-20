import { levelById, packLevelById, type Level } from '@/lib/levels';
import { puzzleById, type Puzzle } from '@/lib/puzzles';

/**
 * ── One lookup across every bank ──────────────────────────────────────────
 *
 * There are three banks now — the daily schedule, the 50 free levels, and the
 * 250 pack levels — and any of them can own the puzzle behind a given id.
 *
 * ── The bug this exists to kill ───────────────────────────────────────────
 * `app/nudge-picker.tsx` resolved its `puzzleId` param with `puzzleById()`,
 * which searches the DAILY bank alone. Opening it from level 1 passed
 * `L-001`, found nothing, and fell through to a fallback of "today's daily
 * puzzle" — so the sheet spent a coin against the daily puzzle's id and showed
 * the daily puzzle's hint.
 *
 * The owner saw it as "around the house, starts with H" on a level whose
 * answer contains no H, and as the whole-answer nudge never filling anything
 * in. Both were the same silent fallback.
 *
 * **A lookup that cannot find something must say so.** This returns undefined
 * rather than guessing, and every caller is expected to handle that.
 */
export function findPuzzleById(id: string): Puzzle | Level | undefined {
  return puzzleById(id) ?? levelById(id) ?? packLevelById(id);
}
