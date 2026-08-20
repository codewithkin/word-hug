import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyPressable } from '@/components/chunky';
import { CoinPill } from '@/components/coin-pill';
import { GameActions, GameBoard } from '@/components/game-board';
import { Appear } from '@/components/motion';
import { GuessNote } from '@/components/notice';
import { PuzzleGround } from '@/components/puzzle-ground';
import { SolveCelebration } from '@/components/solve-celebration';
import { useToast } from '@/components/toast';
import { useLevel } from '@/hooks/use-level';
import { LEVEL_COUNT } from '@/lib/levels';

/**
 * ── /level/[n] ────────────────────────────────────────────────────────────
 * One level of the free run. Rebuilt in session 8 on `components/game-board`.
 *
 * ── Why it changed ────────────────────────────────────────────────────────
 * It was composed from `AnswerRow` and `LetterKeys`, which flex edge-to-edge,
 * and the owner reported the tiles as cramped next to the Daily board's. They
 * were: Daily centres fixed-width tiles inside 22px gutters. Rather than copy
 * Daily's numbers into a second file — the mistake that produced three
 * drifting keycap sizes — the layout moved into one component and this screen
 * became a caller of it.
 *
 * ── The header ────────────────────────────────────────────────────────────
 * Back and coins:
 * · **Back** — the owner asked for one. The board previously relied on the
 *   hardware gesture, which is not an affordance.
 * · **Coins** — you cannot decide whether to buy a hint without knowing what
 *   you have, and the hint button is right there.
 *
 * A hearts meter sat between them until session 8, when the whole energy
 * system was removed. Nothing on this screen can now stop you playing.
 */
export default function LevelScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ n?: string }>();
  const n = Number(params.n ?? '1');

  const game = useLevel(Number.isFinite(n) ? n : 1);
  const { toast, node: toastNode } = useToast();

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
    coins,
    clues,
    compounds,
    canSubmit,
    shakeTrigger,
    press,
    backspace,
    submit,
  } = game;

  if (!level || locked) {
    return (
      <View className="flex-1 items-center justify-center bg-wh-ground px-8">
        <PuzzleGround />
        <Text className="pb-5 text-center font-wh-bold text-wh-lg text-wh-clue-text">
          {level ? `Finish level ${n - 1} first.` : "That level isn't here yet."}
        </Text>
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={() => router.replace('/home')}
          accessibilityRole="button"
          accessibilityLabel="Select a level"
          className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
        >
          <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
            SELECT LEVEL
          </Text>
        </ChunkyPressable>
      </View>
    );
  }

  const hasNext = n < LEVEL_COUNT;

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* ── Header: back, coins ─────────────────────────────────────── */}
        <Appear
          rise={-6}
          className="h-[60px] flex-row items-center justify-between gap-2 px-[18px] pt-[6px]"
        >
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            onPress={() => router.replace('/home')}
            accessibilityRole="button"
            accessibilityLabel="Back to the levels"
            className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
          >
            {/* The design nudges this glyph up with a 4px bottom padding — a
                chevron sits low in its own line box and looks off-centre
                without it. */}
            <Text className="pb-1 font-wh-bold text-wh-h2 leading-none text-wh-text-faint dark:text-wh-text-secondary">
              ‹
            </Text>
          </ChunkyPressable>

          <View className="flex-1 flex-row items-center justify-end gap-[7px]">
            <CoinPill coins={coins} />
          </View>
        </Appear>

        {/* ── Which level ─────────────────────────────────────────────── */}
        <Appear delay={60} className="h-[42px] items-center justify-center">
          <View className="rounded-wh-pill bg-wh-chip-surface px-[18px] py-[7px]">
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-chip-text">
              {replay ? `Level ${n} · replay` : `Level ${n} of ${LEVEL_COUNT}`}
            </Text>
          </View>
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

        {/* ── The line under the board ────────────────────────────────────
            One at a time: a toast beats a guess note beats a standing hint.
            Stacking them would push the actions off a short screen. */}
        {toast ? (
          toastNode
        ) : note ? (
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
          onClose={() => router.replace('/home')}
          onArchive={() =>
            hasNext ? router.replace(`/level/${n + 1}`) : router.replace('/home')
          }
          onwardLabel={hasNext ? 'NEXT LEVEL' : 'BACK HOME'}
        />
      ) : null}
    </View>
  );
}
