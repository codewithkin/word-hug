import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isFirm, keyHaptic, solveHaptic, wrongGuessHaptic } from '@/lib/feedback';
import { gradeLevelGuess, levelAt, type Level } from '@/lib/levels';
import { HEARTS_ENABLED, shouldSpendHeart } from '@/lib/lives';
import { nudgeNote, type NudgeTier } from '@/lib/nudges';
import { clueWords, compoundsFor, keysFor } from '@/lib/puzzles';
import {
  advanceStreakToday,
  getCoins,
  getHearts,
  getLevelResult,
  getNudgeTier,
  isLevelSolved,
  isLevelUnlocked,
  recordLevelSolve,
  spendHeart,
} from '@/lib/storage';

/**
 * ── One level, playing ────────────────────────────────────────────────────
 * The level equivalent of `use-daily-puzzle`. Deliberately a separate hook
 * rather than a shared one with a `mode` flag: the two loops differ in four
 * places that all matter — hearts, unlocking, what a solve advances, and what
 * happens after — and a flag would put four `if (mode === 'daily')` branches
 * in the middle of the busiest state machine in the app.
 *
 * They share everything that should be shared: `keysFor`, `clueWords`,
 * `compoundsFor`, the nudge ladder, the feedback module and the grading rules.
 *
 * ── Hearts ────────────────────────────────────────────────────────────────
 * A wrong guess costs one. A near miss does not, a replay does not, and the
 * daily puzzle does not — see `lib/lives.ts` for why each exemption exists.
 * At zero the board stops accepting guesses and `outOfHearts` goes true; the
 * screen offers a refill rather than sending the player away.
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
  hearts: number;
  nextHeartInMs: number;
  outOfHearts: boolean;
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

export function useLevel(n: number): LevelGame {
  const level = useMemo(() => levelAt(n), [n]);

  const [unlocked] = useState(() => isLevelUnlocked(n));
  const [replay] = useState(() => isLevelSolved(n));

  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<LevelPhase>(unlocked ? 'playing' : 'locked');
  const [result, setResult] = useState<'wrong' | 'near' | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const [coins, setCoins] = useState(getCoins);
  const [hearts, setHearts] = useState(() => getHearts().hearts);
  const [nextHeartInMs, setNextHeartInMs] = useState(() => getHearts().nextInMs);
  const [nudgeTier, setNudgeTierState] = useState<NudgeTier>(() =>
    level ? getNudgeTier(level.id) : 0
  );

  /** Hearts lost on this attempt. Stored on solve, for the analysis script. */
  const [heartsLost, setHeartsLost] = useState(0);

  const refresh = useCallback(() => {
    setCoins(getCoins());
    const h = getHearts();
    setHearts(h.hearts);
    setNextHeartInMs(h.nextInMs);
    if (!level) return;

    const tier = getNudgeTier(level.id);
    setNudgeTierState(tier);
    if (tier >= 3 && !isLevelSolved(n)) {
      setTyped(level.answer.toUpperCase());
      setPhase('playing');
      setResult(null);
    }
  }, [level, n]);

  useFocusEffect(refresh);

  /**
   * Ticks the countdown while the player is watching it.
   *
   * One second is the coarsest interval that still looks like a clock. It runs
   * only when hearts are actually missing, so a full meter costs nothing.
   */
  useEffect(() => {
    if (!HEARTS_ENABLED || hearts >= 5 || nextHeartInMs <= 0) return;
    const id = setInterval(() => {
      const h = getHearts();
      setHearts(h.hearts);
      setNextHeartInMs(h.nextInMs);
    }, 1000);
    return () => clearInterval(id);
  }, [hearts, nextHeartInMs]);

  const keys = useMemo(() => (level ? keysFor(level) : []), [level]);
  const clues = useMemo(() => (level ? clueWords(level) : []), [level]);
  const compounds = useMemo(() => (level ? compoundsFor(level) : []), [level]);
  const used = useMemo(() => new Set([...typed]), [typed]);

  const length = level?.answer.length ?? 0;
  const outOfHearts = HEARTS_ENABLED && !replay && hearts <= 0;

  const press = useCallback(
    (letter: string) => {
      if (phase === 'solved' || phase === 'locked') return;
      if (typed.length >= length) return;
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
    setTyped(typed.slice(0, -1));
    setPhase('playing');
    setResult(null);
  }, [phase, typed]);

  const submit = useCallback(() => {
    if (!level || phase === 'solved' || phase === 'locked') return;
    if (typed.length !== length) return;
    // An empty meter stops the guess before it is graded, so a player cannot
    // burn their last attempt on a board that was about to refuse it anyway.
    if (outOfHearts) return;

    const graded = gradeLevelGuess(level, typed);

    if (graded === 'correct') {
      recordLevelSolve(n, {
        solvedAt: Date.now(),
        heartsLost,
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

    if (shouldSpendHeart({ source: 'level', alreadySolved: replay, result: graded })) {
      if (spendHeart()) setHeartsLost((c) => c + 1);
      const h = getHearts();
      setHearts(h.hearts);
      setNextHeartInMs(h.nextInMs);
    }

    if (graded === 'wrong' && isFirm) {
      setShakeTrigger((c) => c + 1);
      wrongGuessHaptic();
    }
  }, [heartsLost, length, level, n, nudgeTier, outOfHearts, phase, replay, typed]);

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
    hearts,
    nextHeartInMs,
    outOfHearts,
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
