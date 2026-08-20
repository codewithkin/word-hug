import * as Haptics from 'expo-haptics';

import { getHaptics } from '@/lib/storage';

/**
 * ── Wrong-guess feedback ──────────────────────────────────────────────────
 *
 * **This file exists because the owner asked for something the product's own
 * rules forbid, and it is worth writing down properly rather than quietly.**
 *
 * Every other file in this repo defends rule 1: *never punish.* No red, no
 * shake, no buzz, no attempt counter. `components/notice.tsx` has a paragraph
 * on it. `app/wrong-guess.tsx` calls itself "the screen rule 1 lives or dies
 * on". `plans/01-prd.md` §2.2 and `progress/00-START-HERE.md` both state it.
 * The stated reasoning was that red, shake and vibration are the vocabulary of
 * *correction*, and a game for a tired parent with four minutes should not
 * have one.
 *
 * Session 7: the owner played it and asked for exactly those three things —
 * "should be red and trigger a vibration and have a shake animation to show
 * it's the wrong answer". They own the product and they have now used it,
 * which is worth more than four sessions of reasoning about it. So it is
 * built.
 *
 * ── How to undo it ────────────────────────────────────────────────────────
 * Set `WRONG_GUESS_FEEDBACK` to `'gentle'`. That is the whole reversal — the
 * note goes back to `surfaceQuiet`, the board stops shaking and nothing
 * vibrates. Nothing else in the app needs to change, which is the point of
 * routing all three through one constant.
 *
 * ── What was NOT added, and should not be ─────────────────────────────────
 * There is still no attempt counter, no "2 tries left", no lives, no timer,
 * no sound, and nothing is deducted for a wrong guess. The typed word still
 * stays in the tiles. Those are separate promises and the owner did not ask
 * for any of them to change.
 */

export type WrongGuessMode =
  /** The original: one warm sentence on a soft pill. Nothing else moves. */
  | 'gentle'
  /** Owner's request, session 7: red note, shake, haptic buzz. */
  | 'firm';

export const WRONG_GUESS_FEEDBACK: WrongGuessMode = 'firm';

/** True when a wrong guess should shake the board and buzz. */
export const isFirm = WRONG_GUESS_FEEDBACK === 'firm';

/**
 * Fires the wrong-guess haptic, if the person has not turned haptics off.
 *
 * Honouring the Settings toggle is not optional here. A vibration is the one
 * piece of feedback in the app that reaches someone who has their phone on
 * silent in a quiet room, and Settings promises it can be turned off.
 *
 * Never throws: a device with no haptic motor, or a simulator, must not be a
 * reason a guess fails to register.
 */
export function wrongGuessHaptic(): void {
  if (!isFirm) return;
  if (!getHaptics()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
    // No motor, or the OS refused. The guess still happened.
  });
}

/** The soft tick when a letter lands in a tile. Off by default is wrong here — */
export function keyHaptic(): void {
  if (!getHaptics()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** The solve. The one unambiguously good moment in the loop. */
export function solveHaptic(): void {
  if (!getHaptics()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
