import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import {
  advanceStreak,
  effectiveToday,
  getCoins,
  getNudgeTier,
  getSolve,
  getStreak,
  isSolved,
  recordSolve,
} from '@/lib/storage';
import { isFirm, keyHaptic, solveHaptic, wrongGuessHaptic } from '@/lib/feedback';
import { nudgeNote, type NudgeTier } from '@/lib/nudges';
import {
  clueWords,
  compoundsFor,
  correctPositions,
  gradeGuess,
  keysFor,
  longDate,
  puzzleChip,
  puzzleForDate,
  type GuessResult,
  type Puzzle,
} from '@/lib/puzzles';

/**
 * ── The daily loop, in one hook ───────────────────────────────────────────
 * Everything the Daily screen needs and nothing it doesn't. The screen stays a
 * rendering of this state, which is what lets the four alternate-state routes
 * collapse into it — each is a value of `phase`, not a destination.
 *
 * ── The four phases ───────────────────────────────────────────────────────
 * `playing`  the board, untouched or mid-guess
 * `guessed`  a guess landed and was not right. `note` carries which tone the
 *            design calls for. The typed word stays exactly where it was — see
 *            app/wrong-guess.tsx for why that is load-bearing
 * `solved`   the celebration is up, over this board
 * `done`     solved earlier today, reopened. `/solved-today`
 *
 * A fifth case is not a phase because there is no puzzle at all: the bank has
 * run out, which is `/caught-up`. It is `puzzle === null`.
 *
 * ── Why coins and nudges re-read on focus ─────────────────────────────────
 * `/nudge-picker` is a route, so taking a nudge happens in a different screen
 * and writes to storage. Without the focus refresh the board would come back
 * showing the balance it had before the spend — which is exactly the bug the
 * owner reported in session 7, where the picker's coin pill and the header's
 * coin pill disagreed. **There is now one source of truth (storage) and both
 * pills read it.** Do not reintroduce a local coin count anywhere.
 *
 * ── What deliberately is NOT in here ──────────────────────────────────────
 * No attempt counter. No timer. No score. No "tries left". Nothing is deducted
 * for a wrong guess. The state machine has nowhere to put any of them, which
 * is on purpose.
 */

export type Phase = 'playing' | 'guessed' | 'solved' | 'done';

export interface DailyGame {
  puzzle: Puzzle | null;
  date: string;
  phase: Phase;
  typed: string;
  keys: string[];
  used: Set<string>;
  note: { tone: 'gentle' | 'close' | 'firm'; text: string } | null;
  /** The standing line from a nudge, shown when there is no guess note. */
  nudgeLine: string | null;
  nudgeTier: NudgeTier;
  clues: string[];
  compounds: { clue: string; before: boolean }[];
  chip: string;
  longDate: string;
  coins: number;
  streak: number;
  canSubmit: boolean;
  /** Increments on each firm wrong guess. Feeds `<Shake trigger>`. */
  shakeTrigger: number;
  /** Slots the last wrong guess got right. Empty until one is made. */
  correctAt: ReadonlySet<number>;
  press: (letter: string) => void;
  backspace: () => void;
  submit: () => void;
  closeCelebration: () => void;
  /** Re-reads coins and the nudge tier. Called on focus; safe to call anytime. */
  refresh: () => void;
}

const NOTES = {
  gentle: 'Not this one — try another',
  firm: 'Not this one — try another',
  close: 'So close — one letter off',
} as const;

export function useDailyPuzzle(): DailyGame {
  // Read once per mount, not per render: `effectiveToday` writes the
  // high-water mark, and a function with a side effect must not run on every
  // re-render of the busiest screen in the app.
  const [date] = useState(() => effectiveToday());
  const puzzle = useMemo(() => puzzleForDate(date), [date]);

  const alreadySolved = puzzle !== null && isSolved(puzzle.id);

  const [typed, setTyped] = useState(() =>
    alreadySolved && puzzle ? puzzle.answer.toUpperCase() : ''
  );
  const [phase, setPhase] = useState<Phase>(alreadySolved ? 'done' : 'playing');
  const [result, setResult] = useState<GuessResult | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  /**
   * Slots the last wrong guess got right.
   *
   * Held as state rather than derived, because it must describe the guess that
   * was *submitted*, not whatever is in the tiles now. Deriving it live would
   * turn the board into a letter-by-letter oracle: type a letter, see it go
   * teal, keep it. That is a different game, and a much worse one.
   */
  const [correctAt, setCorrectAt] = useState<Set<number>>(() => new Set());

  const [coins, setCoins] = useState(() => getCoins());
  const [streak, setStreak] = useState(() => getStreak().current);
  const [nudgeTier, setNudgeTierState] = useState<NudgeTier>(() =>
    puzzle ? getNudgeTier(puzzle.id) : 0
  );

  const refresh = useCallback(() => {
    setCoins(getCoins());
    if (!puzzle) return;

    const tier = getNudgeTier(puzzle.id);
    setNudgeTierState(tier);

    /**
     * Tier 3 is "the whole answer", so it fills the tiles rather than printing
     * the word in a sentence — that is the thing the player spent two coins
     * for. HUG IT still has to be pressed: the nudge hands over the answer, it
     * does not finish the puzzle on someone's behalf.
     */
    if (tier >= 3 && !isSolved(puzzle.id)) {
      setTyped(puzzle.answer.toUpperCase());
      setPhase('playing');
      setResult(null);
    }
  }, [puzzle]);

  useFocusEffect(refresh);

  const keys = useMemo(() => (puzzle ? keysFor(puzzle) : []), [puzzle]);
  const clues = useMemo(() => (puzzle ? clueWords(puzzle) : []), [puzzle]);
  const compounds = useMemo(() => (puzzle ? compoundsFor(puzzle) : []), [puzzle]);
  const used = useMemo(() => new Set([...typed]), [typed]);

  const length = puzzle?.answer.length ?? 0;

  /**
   * Typing after a guess clears the note — the board is never left holding a
   * sentence about a word that is no longer on it.
   *
   * The setters are called side by side rather than nested inside a `setTyped`
   * updater. An updater has to be a pure function of the previous state, and
   * React may call it twice.
   */
  const press = useCallback(
    (letter: string) => {
      if (phase === 'solved' || phase === 'done') return;
      if (typed.length >= length) return;
      // Typing into a slot invalidates what the last guess said about it, and
      // about nothing else — the marks on untouched slots still hold.
      setCorrectAt((prev) => {
        if (!prev.has(typed.length)) return prev;
        const next = new Set(prev);
        next.delete(typed.length);
        return next;
      });
      setTyped(typed + letter);
      setPhase('playing');
      setResult(null);
      keyHaptic();
    },
    [length, phase, typed]
  );

  const backspace = useCallback(() => {
    if (phase === 'solved' || phase === 'done') return;
    if (typed.length === 0) return;
    setCorrectAt((prev) => {
      if (!prev.has(typed.length - 1)) return prev;
      const next = new Set(prev);
      next.delete(typed.length - 1);
      return next;
    });
    setTyped(typed.slice(0, -1));
    setPhase('playing');
    setResult(null);
  }, [phase, typed]);

  const submit = useCallback(() => {
    if (!puzzle || phase === 'solved' || phase === 'done') return;
    if (typed.length !== length) return;

    const graded = gradeGuess(puzzle, typed);
    setResult(graded);

    if (graded !== 'correct') {
      // Nothing is deducted, nothing is counted, and the tiles keep the word.
      setPhase('guessed');
      // Feedback about the guess just made. Computed against the canonical
      // answer, so an accepted variant does not light up the wrong slots.
      setCorrectAt(correctPositions(puzzle.answer, typed));
      // A near miss stays warm even in firm mode: it is not a rejection, and
      // shaking the board over "one letter off" would say it was.
      if (graded === 'wrong' && isFirm) {
        setShakeTrigger((n) => n + 1);
        wrongGuessHaptic();
      }
      return;
    }

    recordSolve(puzzle.id, {
      solvedAt: Date.now(),
      source: 'daily',
      usedSolveNudge: nudgeTier >= 3,
    });
    setStreak(advanceStreak(date).current);
    setCoins(getCoins());
    setPhase('solved');
    solveHaptic();
  }, [date, length, nudgeTier, phase, puzzle, typed]);

  const closeCelebration = useCallback(() => setPhase('done'), []);

  const note =
    phase === 'guessed' && result !== null && result !== 'correct'
      ? result === 'near'
        ? { tone: 'close' as const, text: NOTES.close }
        : isFirm
          ? { tone: 'firm' as const, text: NOTES.firm }
          : { tone: 'gentle' as const, text: NOTES.gentle }
      : null;

  return {
    puzzle,
    date,
    phase,
    typed,
    keys,
    used,
    note,
    nudgeLine: puzzle ? nudgeNote(puzzle, nudgeTier) : null,
    nudgeTier,
    clues,
    compounds,
    chip: puzzleChip(date),
    longDate: longDate(date),
    coins,
    streak,
    canSubmit: typed.length === length && length > 0,
    shakeTrigger,
    correctAt,
    press,
    backspace,
    submit,
    closeCelebration,
    refresh,
  };
}

/** What `/solved-today` needs: when it was solved, for the "come back" line. */
export function solvedAtFor(puzzleId: string): number | null {
  return getSolve(puzzleId)?.solvedAt ?? null;
}
