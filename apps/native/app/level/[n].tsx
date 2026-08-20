import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyPressable } from '@/components/chunky';
import { HeartsMeter } from '@/components/hearts-meter';
import { Appear, Shake } from '@/components/motion';
import { GuessNote } from '@/components/notice';
import {
  AnswerRow,
  BOARD_TIMINGS,
  ClueStack,
  LetterKeys,
  NudgeButton,
  PuzzleEyebrow,
  PuzzleHeader,
} from '@/components/puzzle-board';
import { PuzzleGround } from '@/components/puzzle-ground';
import { SolveCelebration } from '@/components/solve-celebration';
import { useLevel } from '@/hooks/use-level';
import { LEVEL_COUNT } from '@/lib/levels';
import { HEART_REFILL_COST, HEARTS_ENABLED, MAX_HEARTS } from '@/lib/lives';
import { refillHearts } from '@/lib/storage';

/**
 * ── /level/[n] ────────────────────────────────────────────────────────────
 * One level. Session 7.
 *
 * Built from `components/puzzle-board.tsx` rather than from a design file,
 * because there is no design file for levels — the archive and pack screens
 * (11 and 14) are the same board and this is a third caller of it. That is the
 * generalisation `progress/00-START-HERE.md` item 5 was waiting for, and it
 * arrived from a direction nobody planned.
 *
 * ── What differs from the daily board ─────────────────────────────────────
 * · A heart meter in the header, and guesses stop at zero.
 * · No streak line in the footer. The streak is on the map now, and a level
 *   is not the ritual.
 * · The solve pushes forward to the next level instead of closing to a
 *   resting state. That is the level loop: the reward for finishing is the
 *   next one, immediately, with no screen in between.
 */
export default function LevelScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ n?: string }>();
  const n = Number(params.n ?? '1');

  const game = useLevel(Number.isFinite(n) ? n : 1);

  const {
    level,
    phase,
    locked,
    replay,
    typed,
    keys,
    used,
    note,
    nudgeLine,
    hearts,
    nextHeartInMs,
    outOfHearts,
    clues,
    compounds,
    canSubmit,
    shakeTrigger,
    press,
    backspace,
    submit,
    refresh,
  } = game;

  if (!level) {
    return (
      <View className="flex-1 items-center justify-center bg-wh-ground px-8">
        <PuzzleGround />
        <Text className="pb-5 text-center font-wh-bold text-wh-lg text-wh-clue-text">
          That level isn&apos;t here yet.
        </Text>
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={() => router.replace('/home')}
          accessibilityRole="button"
          accessibilityLabel="Back to the map"
          className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
        >
          <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
            BACK TO THE MAP
          </Text>
        </ChunkyPressable>
      </View>
    );
  }

  /**
   * A locked level is reachable only by typing a URL or by a stale map, so
   * this is a guard rather than a screen. It says which level to finish
   * instead of just refusing.
   */
  if (locked) {
    return (
      <View className="flex-1 items-center justify-center bg-wh-ground px-8">
        <PuzzleGround />
        <Text className="pb-2 text-center font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
          Level {n}
        </Text>
        <Text className="pb-5 text-center font-wh-bold text-wh-lg text-wh-clue-text">
          Finish level {n - 1} first.
        </Text>
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={() => router.replace('/home')}
          accessibilityRole="button"
          accessibilityLabel="Back to the map"
          className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
        >
          <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
            BACK TO THE MAP
          </Text>
        </ChunkyPressable>
      </View>
    );
  }

  function onRefill() {
    if (refillHearts()) {
      refresh();
      return;
    }
    router.push('/zero-coin');
  }

  const hasNext = n < LEVEL_COUNT;

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <PuzzleHeader title={`Level ${n}`} onBack={() => router.replace('/home')} />

        <View className="h-[30px] flex-row items-center justify-center gap-3">
          <PuzzleEyebrow>{replay ? 'Replay' : `${n} of ${LEVEL_COUNT}`}</PuzzleEyebrow>
        </View>

        {HEARTS_ENABLED && !replay ? (
          <Appear delay={80} className="items-center pb-1">
            <HeartsMeter hearts={hearts} nextInMs={nextHeartInMs} onPress={onRefill} />
          </Appear>
        ) : null}

        {/* The board shakes, not the clues. Shaking the whole screen would
            move the three words the player is reading, which is the one thing
            on screen that is not wrong. */}
        <ClueStack clues={clues} />

        <Shake trigger={shakeTrigger}>
          <View className="gap-[11px] px-5">
            <AnswerRow
              length={level.answer.length}
              typed={typed}
              canSubmit={canSubmit && !outOfHearts}
              onSubmit={submit}
            />
            <LetterKeys
              keys={keys.map((letter) => ({ letter, used: used.has(letter) }))}
              onKey={press}
              onBackspace={backspace}
            />
          </View>
        </Shake>

        {/* ── The line under the board ────────────────────────────────────
            Priority: an empty meter beats a guess note beats a nudge line.
            Only one of the three is ever useful at a time and stacking them
            would push the footer off a short screen. */}
        {outOfHearts ? (
          <Appear rise={4} className="h-[44px] items-center px-[22px] pt-2">
            <ChunkyPressable
              offset={4}
              shadowVar="--color-wh-primary-shadow"
              onPress={onRefill}
              accessibilityRole="button"
              accessibilityLabel={`Out of hearts. Refill all ${MAX_HEARTS} for ${HEART_REFILL_COST} coins.`}
              className="flex-row items-center gap-2 rounded-wh-pill bg-wh-primary px-[18px] py-[9px]"
            >
              <Text className="font-wh-bold text-wh-base text-wh-on-primary">
                Out of hearts — refill for {HEART_REFILL_COST}
              </Text>
            </ChunkyPressable>
          </Appear>
        ) : note ? (
          <GuessNote tone={note.tone}>{note.text}</GuessNote>
        ) : nudgeLine ? (
          <GuessNote tone="close">{nudgeLine}</GuessNote>
        ) : (
          <View className="h-[44px]" />
        )}

        <Appear
          delay={BOARD_TIMINGS.footer}
          className="h-[60px] flex-row items-center justify-between px-[22px]"
        >
          <NudgeButton
            onPress={() =>
              router.push({ pathname: '/nudge-picker', params: { puzzleId: level.id } })
            }
          />
          {replay ? (
            <Text className="font-wh-bold text-wh-sm text-wh-text-whisper">
              Replay · nothing at stake
            </Text>
          ) : null}
        </Appear>
      </View>

      {phase === 'solved' ? (
        <SolveCelebration
          answer={level.answer.toUpperCase()}
          compounds={compounds}
          streak={0}
          onClose={() => router.replace('/home')}
          onArchive={() =>
            hasNext ? router.replace(`/level/${n + 1}`) : router.replace('/home')
          }
        />
      ) : null}
    </View>
  );
}
