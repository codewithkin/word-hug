import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { CoinPill } from '@/components/coin-pill';
import { LevelNode, type LevelNodeState } from '@/components/level-node';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { BLOCK_SIZE, LEVEL_COUNT, levelBlocks } from '@/lib/levels';
import { puzzleChip, puzzleForDate } from '@/lib/puzzles';
import {
  claimFreeRunPrompt,
  effectiveToday,
  getCoins,
  getHighestLevel,
  getStreak,
  isSolved,
} from '@/lib/storage';

/**
 * ── Home · the level map ──────────────────────────────────────────────────
 * Session 7. **There is no design file for this screen** — the owner asked for
 * it after playing, and it is the first screen in the project built without
 * one. Everything here is assembled from parts that were drawn: `Chunky`, the
 * clue-card surface, the accent and primary fills, the pill shapes and the
 * existing type scale. Nothing invents a new colour.
 *
 * That makes it the screen most likely to be wrong, and the one where a
 * correction is most welcome. It is deliberately plain: a header, a daily
 * card, and a column of level nodes.
 *
 * ── What it is for ────────────────────────────────────────────────────────
 * Central command. A player opens the app here, sees where they are in the
 * run of 100, sees today's daily puzzle waiting, and taps one of the two.
 *
 * ── The daily card is at the top, not in a tab ────────────────────────────
 * The daily puzzle is the reason anyone comes back tomorrow — it is what the
 * morning notification points at and what the streak was built around. Burying
 * it behind navigation would make the notification land on a screen that does
 * not obviously contain the thing it promised. It sits above the map, and it
 * changes appearance once solved rather than disappearing.
 *
 * ── The map scrolls to where you are ──────────────────────────────────────
 * On mount it jumps to the block containing the next unsolved level. A map
 * that always opens at level 1 makes a player at 60 scroll every single time,
 * which is the fastest way to make a hundred levels feel like a chore.
 */

const ROW_HEIGHT = 74;

interface Block {
  block: number;
  levels: { level: number }[];
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Block>>(null);

  const blocks = useMemo(() => levelBlocks(), []);

  const [highest, setHighest] = useState(getHighestLevel);
  const [coins, setCoins] = useState(getCoins);
  const [streak, setStreak] = useState(() => getStreak().current);

  const [date] = useState(() => effectiveToday());
  const daily = useMemo(() => puzzleForDate(date), [date]);
  const [dailyDone, setDailyDone] = useState(() => (daily ? isSolved(daily.id) : false));

  const next = Math.min(highest + 1, LEVEL_COUNT);
  const finished = highest >= LEVEL_COUNT;

  const refresh = useCallback(() => {
    setHighest(getHighestLevel());
    setCoins(getCoins());
    setStreak(getStreak().current);
    if (daily) setDailyDone(isSolved(daily.id));
  }, [daily]);

  useFocusEffect(refresh);

  /**
   * The end of the free run, once.
   *
   * On focus rather than at the moment of the solve: the celebration is still
   * up then, and putting an offer over it would break rule 3. By the time the
   * map has focus the solve is finished and the player is between things,
   * which is the only place in the app an unasked-for offer belongs.
   */
  useFocusEffect(
    useCallback(() => {
      if (getHighestLevel() < LEVEL_COUNT) return;
      if (!claimFreeRunPrompt()) return;
      router.push('/free-run-complete');
    }, [])
  );

  const jumpToCurrent = useCallback(() => {
    const index = Math.floor((next - 1) / BLOCK_SIZE);
    // `animated: false` on the first paint: an animated scroll from level 1 to
    // level 60 is three seconds of blur before the player can do anything.
    listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.35 });
  }, [next]);

  function stateFor(n: number): LevelNodeState {
    if (n <= highest) return 'solved';
    if (n === highest + 1) return 'next';
    return 'locked';
  }

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Appear
          rise={-6}
          className="h-[60px] flex-row items-center justify-between gap-2 px-[18px] pt-[6px]"
        >
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Menu"
            className="h-[46px] w-[46px] items-center justify-center gap-1 rounded-wh-card bg-wh-surface"
          >
            <View className="h-[2px] w-4 rounded-[1px] bg-wh-text-faint dark:bg-wh-text-muted" />
            <View className="h-[2px] w-4 rounded-[1px] bg-wh-text-faint dark:bg-wh-text-muted" />
            <View className="h-[2px] w-4 rounded-[1px] bg-wh-text-faint dark:bg-wh-text-muted" />
          </ChunkyPressable>

          <View className="flex-1 flex-row items-center justify-end gap-[7px]">
            <CoinPill coins={coins} />
          </View>
        </Appear>

        {/* ── Progress line ───────────────────────────────────────────── */}
        <Appear delay={60} className="h-[34px] flex-row items-center justify-center gap-3">
          {finished ? (
            <ChunkyPressable
              offset={3}
              shadowVar="--color-wh-accent-shadow"
              onPress={() => router.push('/all-caught-up')}
              accessibilityRole="button"
              accessibilityLabel={`All ${LEVEL_COUNT} solved. See what's next.`}
              className="rounded-wh-pill bg-wh-accent px-[14px] py-[5px]"
            >
              <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-on-accent">
                All {LEVEL_COUNT} solved
              </Text>
            </ChunkyPressable>
          ) : (
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
              {highest} of {LEVEL_COUNT} solved
            </Text>
          )}
          {/* A fact, not a call to action. Hidden at zero — "0 day streak" on
              someone's first morning is a scolding. */}
          {streak > 0 ? (
            <View className="flex-row items-center gap-[6px]">
              <View className="h-[9px] w-[9px] rounded-wh-pill bg-wh-highlight" />
              <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
                {streak} day streak
              </Text>
            </View>
          ) : null}
        </Appear>

        {/* ── Today's puzzle ──────────────────────────────────────────── */}
        {daily ? (
          <Appear delay={120} rise={8} className="px-[18px] pb-3">
            <ChunkyPressable
              offset={5}
              shadowVar={
                dailyDone ? '--color-wh-accent-shadow' : '--color-wh-clue-card-shadow'
              }
              onPress={() => router.push('/daily')}
              accessibilityRole="button"
              accessibilityLabel={
                dailyDone ? "Today's puzzle, already solved. Open it." : "Play today's puzzle"
              }
              className={
                dailyDone
                  ? 'flex-row items-center gap-4 rounded-wh-xl bg-wh-accent px-5 py-4'
                  : 'flex-row items-center gap-4 rounded-wh-xl bg-wh-clue-card px-5 py-4'
              }
            >
              <View
                className={
                  dailyDone
                    ? 'h-11 w-11 items-center justify-center rounded-wh-md bg-wh-on-accent/20'
                    : 'h-11 w-11 items-center justify-center rounded-wh-md bg-wh-highlight-wash'
                }
              >
                <Text
                  className={
                    dailyDone
                      ? 'font-wh-bold text-wh-xl text-wh-on-accent'
                      : 'font-wh-bold text-wh-xl text-wh-highlight'
                  }
                >
                  {dailyDone ? '✓' : '★'}
                </Text>
              </View>

              <View className="flex-1">
                <Text
                  className={
                    dailyDone
                      ? 'font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-on-accent'
                      : 'font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet'
                  }
                >
                  {puzzleChip(date)}
                </Text>
                <Text
                  className={
                    dailyDone
                      ? 'font-wh-bold text-wh-lg text-wh-on-accent'
                      : 'font-wh-bold text-wh-lg text-wh-clue-text'
                  }
                >
                  {dailyDone ? 'Solved today' : "Today's puzzle"}
                </Text>
              </View>

              {!dailyDone ? (
                <Text className="font-wh-bold text-wh-h3 text-wh-primary">→</Text>
              ) : null}
            </ChunkyPressable>
          </Appear>
        ) : null}

        {/* ── The four places that are not the map ────────────────────
            Home is central command, so every other surface in the app is one
            tap from here. Four small tiles rather than a tab bar: a tab bar
            would put the shop permanently on screen next to the puzzle, and
            rule 3 is that the solve is never interrupted. */}
        <Appear delay={160} className="flex-row gap-2 px-[18px] pb-3">
          {(
            [
              ['Packs', '/packs', 'Two hundred and fifty more puzzles, by theme'],
              ['Stats', '/stats', 'What you have solved'],
              ['Shop', '/shop', 'Coins and packs'],
              ['Settings', '/settings', 'Sound, reminders and the rest'],
            ] as const
          ).map(([label, href, hint]) => (
            <ChunkyPressable
              key={label}
              offset={3}
              shadowVar="--color-wh-surface-shadow"
              onPress={() => router.push(href)}
              accessibilityRole="button"
              accessibilityLabel={`${label}. ${hint}.`}
              className="h-[46px] flex-1 items-center justify-center rounded-wh-card bg-wh-surface"
            >
              <Text className="font-wh-heavy text-[12px] text-wh-pill-text">{label}</Text>
            </ChunkyPressable>
          ))}
        </Appear>

        {/* ── The map ─────────────────────────────────────────────────── */}
        <FlatList
          ref={listRef}
          data={blocks}
          keyExtractor={(b) => String(b.block)}
          onLayout={jumpToCurrent}
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT * 2 + 34,
            offset: (ROW_HEIGHT * 2 + 34) * index,
            index,
          })}
          // A hundred nodes is nothing, but the bank is meant to grow and a map
          // that re-renders every node on every scroll would be the first thing
          // to feel slow.
          initialNumToRender={4}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 18 }}
          renderItem={({ item }) => (
            <View className="pb-4">
              <Text className="pb-2 font-wh-heavy text-[10px] uppercase tracking-wh-label text-wh-text-whisper">
                {(item.block - 1) * BLOCK_SIZE + 1}–
                {Math.min(item.block * BLOCK_SIZE, LEVEL_COUNT)}
              </Text>
              <View className="flex-row flex-wrap justify-between gap-y-2">
                {item.levels.map((l, i) => (
                  <LevelNode
                    key={l.level}
                    n={l.level}
                    index={i}
                    state={stateFor(l.level)}
                    onPress={() => router.push(`/level/${l.level}`)}
                  />
                ))}
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}
