import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyPressable } from '@/components/chunky';
import { CoinPill } from '@/components/coin-pill';
import { GameActions, GameBoard } from '@/components/game-board';
import { Appear } from '@/components/motion';
import { GuessNote } from '@/components/notice';
import { PuzzleEyebrow, PuzzleHeader } from '@/components/puzzle-board';
import { PuzzleGround } from '@/components/puzzle-ground';
import { SolveCelebration } from '@/components/solve-celebration';
import { packById } from '@/content/packs';
import { useLevel } from '@/hooks/use-level';
import { packLevelCount } from '@/lib/levels';
import { ownsPack } from '@/lib/storage';

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
 *
 * ── Session 8 ─────────────────────────────────────────────────────────────
 * Rebuilt on `components/game-board`, which the daily and free-run screens
 * already used. This screen was the last one still composing `AnswerRow` and
 * `LetterKeys` itself, and so the last one whose tiles were a different size
 * from everywhere else. The hearts meter and the out-of-hearts refill button
 * went at the same time, with the rest of the energy system.
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
    clues,
    compounds,
    coins,
    canSubmit,
    shakeTrigger,
    press,
    backspace,
    submit,
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

  const hasNext = n < total;

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <PuzzleHeader title={pack.name} onBack={() => router.replace(`/pack/${packId}`)} />

        <PuzzleEyebrow>{replay ? 'Replay' : `${n} of ${total}`}</PuzzleEyebrow>

        <Appear delay={70} className="flex-row justify-end px-[18px] pb-1">
          <CoinPill coins={coins} />
        </Appear>

        <GameBoard
          clues={clues}
          length={level.answer.length}
          typed={typed}
          keys={keys}
          used={used}
          coins={coins}
          canSubmit={canSubmit}
          shakeTrigger={shakeTrigger}
          onKey={press}
          onBackspace={backspace}
          onSubmit={submit}
          onHint={() =>
            router.push({ pathname: '/nudge-picker', params: { puzzleId: level.id } })
          }
        />

        {note ? (
          <GuessNote tone={note.tone}>{note.text}</GuessNote>
        ) : nudgeLine ? (
          <GuessNote tone="close">{nudgeLine}</GuessNote>
        ) : (
          <View className="h-[44px]" />
        )}

        <GameActions
          coins={coins}
          canSubmit={canSubmit}
          onHint={() =>
            router.push({ pathname: '/nudge-picker', params: { puzzleId: level.id } })
          }
          onSubmit={submit}
          onBackspace={backspace}
        />
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
