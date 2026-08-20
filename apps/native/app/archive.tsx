import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';
import { addDays, daysBetween, effectiveToday, getSolves } from '@/lib/storage';
import { dayIndexFor, puzzleForDate } from '@/lib/puzzles';

/**
 * ── 10 Archive ────────────────────────────────────────────────────────────
 * Session 7. Built against `designs/extracted/10-archive-day-one-{light,dark}`
 * — the day-one state, which is the only 10 the export contains — plus the
 * archive tile shapes it draws as ghosts.
 *
 * **The last seven days, and nothing before them.** That window is a product
 * promise, not a technical limit: "the last seven stay open, so a missed
 * morning is never lost" is written on the day-one screen, in onboarding step
 * 3, and in the archive-locked dialog. Widening it would make those three
 * lines wrong; narrowing it would break a promise.
 *
 * ── The three tile states ─────────────────────────────────────────────────
 * · **today** — amber, the largest, always first
 * · **solved** — teal with a tick
 * · **open** — surface, the day number, still playable
 *
 * There is no "missed" state and there must never be one. A day you did not
 * play looks exactly like a day you have not played *yet*, because that is
 * what it is — the archive is the mechanism that makes missing a day cost
 * nothing, and marking the miss would undo the mechanism.
 *
 * Past the seventh day back is `/archive-locked` (overlay E), which is a
 * dialog about the window rather than a wall.
 */

/** The promise, in one number. Changing it makes three screens' copy false. */
const WINDOW_DAYS = 7;

interface Day {
  date: string;
  /** How many days back from today. 0 is today. */
  back: number;
  puzzleId: string | null;
  solved: boolean;
}

export default function Archive() {
  const insets = useSafeAreaInsets();
  const [today] = useState(() => effectiveToday());
  const [solves, setSolves] = useState(() => getSolves());

  useFocusEffect(
    useCallback(() => {
      setSolves(getSolves());
    }, [])
  );

  const days = useMemo<Day[]>(() => {
    const out: Day[] = [];
    for (let back = 0; back < WINDOW_DAYS; back++) {
      const date = addDays(today, -back);
      // Before EPOCH there is no schedule, so the window is short on the first
      // week rather than showing seven tiles with nothing behind five of them.
      if (dayIndexFor(date) < 0) break;
      const puzzle = puzzleForDate(date);
      out.push({
        date,
        back,
        puzzleId: puzzle?.id ?? null,
        solved: puzzle ? solves[puzzle.id] !== undefined : false,
      });
    }
    return out;
  }, [solves, today]);

  const playable = days.filter((d) => d.puzzleId !== null);
  const solvedCount = playable.filter((d) => d.solved).length;

  // Day one — nothing behind today yet. `/archive-day-one` is that whole
  // screen, already built, so this defers to it rather than half-drawing it.
  if (playable.length <= 1) {
    return <ArchiveRedirect />;
  }

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="ARCHIVE" />

        <Appear delay={60} className="h-[30px] items-center justify-center">
          <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
            {solvedCount} of the last {playable.length} solved
          </Text>
        </Appear>

        <ScrollView
          className="flex-1 px-[22px] pt-2"
          contentContainerClassName="gap-[10px] pb-4"
          showsVerticalScrollIndicator={false}
        >
          {playable.map((day, i) => (
            <Appear key={day.date} index={i} delay={120}>
              <DayRow day={day} />
            </Appear>
          ))}

          {/* The eighth day back, drawn as the edge of the window rather than
              omitted. A list that simply stops looks like a bug; a row that
              says why it stops is the feature. */}
          <Appear delay={120 + playable.length * 40}>
            <ChunkyPressable
              offset={3}
              inset
              shadowVar="--color-wh-answer-tile-empty-shadow"
              onPress={() => router.push('/archive-locked')}
              accessibilityRole="button"
              accessibilityLabel="Older puzzles. Why they close."
              className="flex-row items-center justify-center gap-2 rounded-wh-xl bg-wh-answer-tile-empty px-5 py-[18px]"
            >
              <Text className="font-wh-bold text-wh-base text-wh-text-whisper">
                Older puzzles close after {WINDOW_DAYS} days
              </Text>
            </ChunkyPressable>
          </Appear>
        </ScrollView>
      </View>
    </View>
  );
}

function DayRow({ day }: { day: Day }) {
  const label =
    day.back === 0 ? 'Today' : day.back === 1 ? 'Yesterday' : `${day.back} days ago`;
  const number = Number(day.date.slice(-2));

  const open = !day.solved;

  return (
    <ChunkyPressable
      offset={day.back === 0 ? 5 : 4}
      shadowVar={
        day.back === 0
          ? '--color-wh-primary-shadow'
          : day.solved
            ? '--color-wh-accent-shadow'
            : '--color-wh-clue-card-shadow'
      }
      onPress={() =>
        router.push({ pathname: '/archive-puzzle', params: { date: day.date } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${day.solved ? 'Solved. Play it again.' : 'Not solved yet.'}`}
      className={
        day.back === 0
          ? 'flex-row items-center gap-4 rounded-wh-xl bg-wh-primary px-5 py-4'
          : day.solved
            ? 'flex-row items-center gap-4 rounded-wh-xl bg-wh-accent px-5 py-4'
            : 'flex-row items-center gap-4 rounded-wh-xl bg-wh-clue-card px-5 py-4'
      }
    >
      <View
        className={
          day.back === 0 || day.solved
            ? 'h-11 w-11 items-center justify-center rounded-wh-md bg-white/20'
            : 'h-11 w-11 items-center justify-center rounded-wh-md bg-wh-surface-quiet'
        }
      >
        <Text
          className={
            day.back === 0
              ? 'font-wh-bold text-wh-lg text-wh-on-primary'
              : day.solved
                ? 'font-wh-bold text-wh-lg text-wh-on-accent'
                : 'font-wh-bold text-wh-lg text-wh-clue-text'
          }
        >
          {day.solved ? '✓' : number}
        </Text>
      </View>

      <View className="flex-1">
        <Text
          className={
            day.back === 0
              ? 'font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-on-primary'
              : day.solved
                ? 'font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-on-accent'
                : 'font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet'
          }
        >
          {label}
        </Text>
        <Text
          className={
            day.back === 0
              ? 'font-wh-bold text-wh-lg text-wh-on-primary'
              : day.solved
                ? 'font-wh-bold text-wh-lg text-wh-on-accent'
                : 'font-wh-bold text-wh-lg text-wh-clue-text'
          }
        >
          {/* Never "missed". A day you did not play reads the same as a day
              you have not played yet, because that is what it is. */}
          {day.back === 0 ? "Today's puzzle" : day.solved ? 'Solved' : 'Still open'}
        </Text>
      </View>

      {open ? (
        <Text
          className={
            day.back === 0
              ? 'font-wh-bold text-wh-h3 text-wh-on-primary'
              : 'font-wh-bold text-wh-h3 text-wh-primary'
          }
        >
          →
        </Text>
      ) : null}
    </ChunkyPressable>
  );
}

/**
 * Day one has its own whole screen and it is already built. Redirecting rather
 * than reimplementing keeps one copy of the sentence that explains the window.
 */
function ArchiveRedirect() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground" style={{ paddingTop: insets.top }}>
      <PuzzleGround />
      <Appear className="flex-1 items-center justify-center px-8">
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={() => router.replace('/archive-day-one')}
          accessibilityRole="button"
          accessibilityLabel="Your archive starts today"
          className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
        >
          <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
            YOUR ARCHIVE STARTS TODAY
          </Text>
        </ChunkyPressable>
      </Appear>
    </View>
  );
}

/** Kept honest by the archive: `daysBetween` is what defines "seven days ago". */
void daysBetween;
