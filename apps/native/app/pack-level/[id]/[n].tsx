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
import { packById } from '@/content/packs';
import { useLevel } from '@/hooks/use-level';
import { packLevelCount } from '@/lib/levels';
import { HEART_REFILL_COST, HEARTS_ENABLED, MAX_HEARTS } from '@/lib/lives';
import { ownsPack, refillHearts } from '@/lib/storage';

/**
 * ── /pack-level/[id]/[n] ──────────────────────────────────────────────────
 * One level inside a pack. Session 7c.
 *
 * Structurally the free-run level screen, with three differences:
 *
 * · **It is gated on ownership**, not only on progress. An unowned pack sends
 *   the player to the pack page rather than the board — you cannot stumble
 *   into paid content by typing a URL.
 * · **Numbering is the pack's own.** "3 of 50" means three of Creatures, and
 *   progress is stored under `creatures:3` so it cannot collide with the free
 *   run's level 3.
 * · **The header carries the pack's tint.** Same shapes, same shadows, same
 *   type — one accent changes, so it reads as the same game in a different
 *   mood. See `content/packs.ts`.
 */
export default function PackLevelScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; n?: string }>();

  const packId = params.id ?? '';
  const n = Number(params.n ?? '1');
  const pack = packById(packId);

  const game = useLevel(Number.isFinite(n) ? n : 1, packId);

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

  const total = packLevelCount(packId);

  // Ownership first: a URL must not be a way past the paywall.
  if (!pack || !ownsPack(packId) || !level) {
    return (
      <View className="flex-1 items-center justify-center bg-wh-ground px-8">
        <PuzzleGround />
        <Text className="pb-5 text-center font-wh-bold text-wh-lg text-wh-clue-text">
          {pack ? `You don't have ${pack.name} yet.` : "That pack isn't here."}
        </Text>
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={() => router.replace(pack ? `/pack/${packId}` : '/packs')}
          accessibilityRole="button"
          accessibilityLabel={pack ? `See ${pack.name}` : 'All packs'}
          className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
        >
          <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
            {pack ? 'SEE THE PACK' : 'ALL PACKS'}
          </Text>
        </ChunkyPressable>
      </View>
    );
  }

  if (locked) {
    return (
      <View className="flex-1 items-center justify-center bg-wh-ground px-8">
        <PuzzleGround />
        <Text className="pb-5 text-center font-wh-bold text-wh-lg text-wh-clue-text">
          Finish {n - 1} of {pack.name} first.
        </Text>
        <ChunkyPressable
          offset={5}
          shadowVar={pack.tint.shadowVar}
          onPress={() => router.replace(`/pack/${packId}`)}
          accessibilityRole="button"
          accessibilityLabel={`Back to ${pack.name}`}
          className={`h-[58px] items-center justify-center rounded-[19px] px-8 ${pack.tint.fill}`}
        >
          <Text className={`font-wh-bold text-wh-xl tracking-wh-wide ${pack.tint.on}`}>
            BACK TO THE PACK
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

  const hasNext = n < total;

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <PuzzleHeader title={pack.name} onBack={() => router.replace(`/pack/${packId}`)} />

        <PuzzleEyebrow>{replay ? 'Replay' : `${n} of ${total}`}</PuzzleEyebrow>

        {HEARTS_ENABLED && !replay ? (
          <Appear delay={80} className="items-center pb-1">
            <HeartsMeter hearts={hearts} nextInMs={nextHeartInMs} onPress={onRefill} />
          </Appear>
        ) : null}

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
          <Text className="font-wh-bold text-wh-sm text-wh-text-whisper">{pack.name}</Text>
        </Appear>
      </View>

      {phase === 'solved' ? (
        <SolveCelebration
          answer={level.answer.toUpperCase()}
          compounds={compounds}
          streak={0}
          onClose={() => router.replace(`/pack/${packId}`)}
          onArchive={() =>
            hasNext
              ? router.replace(`/pack-level/${packId}/${n + 1}`)
              : router.replace(`/pack/${packId}`)
          }
        />
      ) : null}
    </View>
  );
}
