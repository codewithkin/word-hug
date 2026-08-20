import { HEART_REFILL_COST, HEART_REGEN_MINUTES, MAX_HEARTS } from "@/lib/storage/keys";

/**
 * ── Hearts ────────────────────────────────────────────────────────────────
 *
 * **Read this before changing any number below.**
 *
 * Word Hug was designed around one rule, stated in `plans/01-prd.md`,
 * `progress/00-START-HERE.md`, `components/motion.tsx`, `components/notice.tsx`
 * and `app/wrong-guess.tsx`: *never punish.* No timers, no penalties, no
 * failure states, nothing that implies a clock. Onboarding still tells the
 * player, in the second sentence they ever read, "No timer, no score, no way
 * to lose."
 *
 * A heart system is all three of those things. Session 7 added it because the
 * owner chose it explicitly, over a no-lives option, to create ad inventory
 * and session pressure. That is a legitimate call for a business to make and
 * it is theirs to make. It is written down here rather than absorbed quietly,
 * because the next person to read this repo will otherwise find a dozen files
 * defending a rule the app no longer follows.
 *
 * ── The one line of onboarding that is now false ──────────────────────────
 * `app/onboarding/welcome.tsx` says "No timer, no score, no way to lose."
 * With hearts there is a timer and there is a way to be stopped. **That copy
 * needs the owner's decision** — it is a promise made before the player can
 * see the mechanic, which is the kind of thing app stores and reviewers
 * notice. It is listed in `progress/05-known-issues.md`.
 *
 * ── What hearts do and do not touch ───────────────────────────────────────
 * They apply to LEVELS only. The daily puzzle is deliberately exempt: it is
 * the ritual the product is built on, PRD rule 2 is "never gate daily play",
 * and gating it behind an energy meter would make the morning notification an
 * invitation to a wall. Replaying a solved level is also exempt — a level you
 * have beaten is not a test.
 *
 * ── Turning it off ────────────────────────────────────────────────────────
 * Set `HEARTS_ENABLED` to false. The board stops spending, the map stops
 * drawing the meter, and nothing else needs to change.
 */

export const HEARTS_ENABLED = true;

export { HEART_REFILL_COST, HEART_REGEN_MINUTES, MAX_HEARTS };

/**
 * Whether a wrong guess on this board should cost a heart.
 *
 * Three exemptions, all of them load-bearing rather than convenience:
 *  · the daily puzzle — PRD rule 2, never gate daily play
 *  · a replay of a solved level — already beaten, nothing to test
 *  · a near miss — one letter off is the product's only warm signal, and
 *    charging for it would turn the single encouraging moment in the loop
 *    into the most expensive one
 */
export function shouldSpendHeart(options: {
  source: 'daily' | 'level';
  alreadySolved: boolean;
  result: 'wrong' | 'near';
}): boolean {
  if (!HEARTS_ENABLED) return false;
  if (options.source === 'daily') return false;
  if (options.alreadySolved) return false;
  return options.result === 'wrong';
}

/** "12:34" — the countdown to the next heart. */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '';
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
