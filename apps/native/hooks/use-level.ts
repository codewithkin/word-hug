import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { isFirm, keyHaptic, solveHaptic, wrongGuessHaptic } from '@/lib/feedback';
import {
  gradeLevelGuess,
  levelAt,
  packLevelAt,
  packLevelCount,
  packLevelKey,
  type Level,
} from '@/lib/levels';
import { nudgeNote, type NudgeTier } from '@/lib/nudges';
import { clueWords, compoundsFor, correctPositions, keysFor } from '@/lib/puzzles';
import {
  advanceStreakToday,
  getCoins,
  getLevelResult,
  getLevelResults,
  getNudgeTier,
  isLevelSolved,
  isLevelUnlocked,
  recordLevelSolve,
} from '@/lib/storage';

/** Solved-ness by raw key, which is how pack levels are stored. */
function isLevelSolvedKey(key: string): boolean {
  return getLevelResults()[key] !== undefined;
}

/**
 * ── One level, playing ────────────────────────────────────────────────────
 * The level equivalent of `use-daily-puzzle`. Deliberately a separate hook
 * rather than a shared one with a `mode` flag: the two loops differ in four
 * places that all matter — unlocking, what a solve advances, what happens
 * after, and how progress is keyed — and a flag would put four
 * `if (mode === 'daily')` branches in the middle of the busiest state machine
 * in the app.
 *
 * They share everything that should be shared: `keysFor`, `clueWords`,
 * `compoundsFor`, the nudge ladder, the feedback module and the grading rules.
 *
 * ── There is no failure state ─────────────────────────────────────────────
 * Session 8 removed hearts. **Nothing in this hook can refuse a guess** — no
 * meter, no cooldown, no attempt cap. A wrong guess costs a shake, a buzz and
 * a line of text, and then the board is immediately ready again.
 *
 * That is rule 1 ("never punish") restored, but the reason it came back is
 * commercial rather than principled: an energy meter's whole job is to end the
 * session, and every minute it ends is a minute of ad inventory that does not
 * exist. Hearts and ads want opposite things from the same player. `wrongGuesses`
 * still counts, because the difficulty model needs the signal, but it is a
 * measurement and never a cost.
 */

export type LevelPhase = 'playing' | 'guessed' | 'solved' | 'locked';

export interface LevelGame {
  level: Level | null;
  phase: LevelPhase;
  /** True when this level is above the frontier. The screen shows a lock. */
  locked: boolean;
  /** True when it was already solved before this visit — a replay. */
  replay: boolean;
  typed: string;
  keys: string[];
  used: Set<string>;
  note: { tone: 'gentle' | 'close' | 'firm'; text: string } | null;
  nudgeLine: string | null;
  nudgeTier: NudgeTier;
  clues: string[];
  compounds: { clue: string; before: boolean }[];
  coins: number;
  /** Slots the last wrong guess got right. Empty until one is made. */
  correctAt: ReadonlySet<number>;
  canSubmit: boolean;
  shakeTrigger: number;
  press: (letter: string) => void;
  backspace: () => void;
  submit: () => void;
  refresh: () => void;
}

const NOTES = {
  gentle: 'Not this one — try another',
  firm: 'Not this one — try another',
  close: 'So close — one letter off',
} as const;

/**
 * @param n      1-based level number, within its own bank.
 * @param packId When given, plays that pack's bank instead of the free run.
 *
 * Pack numbering restarts at 1, so progress is keyed on `packId:n` — a bare
 * number would collide with the free run's level 1 and with every other pack.
 * Pack levels unlock linearly within the pack, independently of the free run:
 * buying Creatures should not require finishing fifty free levels first.
 */
export function useLevel(n: number, packId?: string): LevelGame {
  const level = useMemo(() => (packId ? packLevelAt(packId, n) : levelAt(n)), [n, packId]);
  const key = packId ? packLevelKey(packId, n) : String(n);

  const [unlocked] = useState(() =>
    packId ? n === 1 || isLevelSolvedKey(packLevelKey(packId, n - 1)) : isLevelUnlocked(n)
  );
  const [replay] = useState(() => (packId ? isLevelSolvedKey(key) : isLevelSolved(n)));

  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<LevelPhase>(unlocked ? 'playing' : 'locked');
  const [result, setResult] = useState<'wrong' | 'near' | null>(null);
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

  const [coins, setCoins] = useState(getCoins);
  const [nudgeTier, setNudgeTierState] = useState<NudgeTier>(() =>
    level ? getNudgeTier(level.id) : 0
  );

  /**
   * Wrong guesses on this attempt. Stored on solve and shown to nobody — it is
   * the difficulty model's only field evidence that a level is mis-rated.
   */
  const [wrongGuesses, setWrongGuesses] = useState(0);

  const refresh = useCallback(() => {
    setCoins(getCoins());
    if (!level) return;

    const tier = getNudgeTier(level.id);
    setNudgeTierState(tier);
    const solved = packId ? isLevelSolvedKey(key) : isLevelSolved(n);
    if (tier >= 3 && !solved) {
      setTyped(level.answer.toUpperCase());
      setPhase('playing');
      setResult(null);
    }
  }, [key, level, n, packId]);

  useFocusEffect(refresh);

  const keys = useMemo(() => (level ? keysFor(level) : []), [level]);
  const clues = useMemo(() => (level ? clueWords(level) : []), [level]);
  const compounds = useMemo(() => (level ? compoundsFor(level) : []), [level]);
  const used = useMemo(() => new Set([...typed]), [typed]);

  const length = level?.answer.length ?? 0;

  const press = useCallback(
    (letter: string) => {
      if (phase === 'solved' || phase === 'locked') return;
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
    if (phase === 'solved' || phase === 'locked') return;
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
    if (!level || phase === 'solved' || phase === 'locked') return;
    if (typed.length !== length) return;

    const graded = gradeLevelGuess(level, typed);

    if (graded === 'correct') {
      recordLevelSolve(key, {
        solvedAt: Date.now(),
        wrongGuesses,
        nudgeTier,
      });
      // A level solve keeps the streak alive, exactly like the daily does.
      advanceStreakToday();
      setCoins(getCoins());
      setPhase('solved');
      solveHaptic();
      return;
    }

    setResult(graded);
    setPhase('guessed');
    // Feedback about the guess just made. Computed against the canonical
    // answer, so an accepted variant does not light up the wrong slots.
    setCorrectAt(correctPositions(level.answer, typed));
    // Counted, never charged. A near miss is not a wrong answer and does not
    // count — it is the player being right about the shape and wrong about one
    // letter, which the difficulty model reads very differently.
    if (graded === 'wrong') setWrongGuesses((c) => c + 1);

    if (graded === 'wrong' && isFirm) {
      setShakeTrigger((c) => c + 1);
      wrongGuessHaptic();
    }
  }, [key, length, level, nudgeTier, phase, typed, wrongGuesses]);

  const note =
    phase === 'guessed' && result !== null
      ? result === 'near'
        ? { tone: 'close' as const, text: NOTES.close }
        : isFirm
          ? { tone: 'firm' as const, text: NOTES.firm }
          : { tone: 'gentle' as const, text: NOTES.gentle }
      : null;

  return {
    level,
    phase,
    locked: !unlocked,
    replay,
    typed,
    keys,
    used,
    note,
    nudgeLine: level ? nudgeNote(level, nudgeTier) : null,
    nudgeTier,
    clues,
    compounds,
    coins,
    correctAt,
    canSubmit: typed.length === length && length > 0,
    shakeTrigger,
    press,
    backspace,
    submit,
    refresh,
  };
}

/** What the map needs per level, without mounting the whole hook. */
export function levelSummary(n: number) {
  return {
    unlocked: isLevelUnlocked(n),
    solved: isLevelSolved(n),
    result: getLevelResult(n),
  };
}

/** Kept honest: the pack screens read their length from here. */
void packLevelCount;
