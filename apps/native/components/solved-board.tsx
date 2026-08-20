import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Land, STAGGER } from '@/components/motion';

/**
 * ── 09 Daily · Solved today, as a component ───────────────────────────────
 * Extracted from `app/solved-today.tsx` in session 6, unchanged in appearance.
 *
 * It is a component now because it has two callers: the Daily screen's `done`
 * phase — which is how anyone will actually meet it, on their second visit of
 * the day — and the `/solved-today` route, which stays only so the state can
 * still be walked from the scaffolding link row.
 *
 * The design rationale lives in `app/solved-today.tsx` and is worth reading
 * before changing anything here. The short version: no countdown, no share
 * sheet, no rating prompt, no offer. The only way onward costs nothing.
 */

const IN = {
  rows: 120,
  answer: 120 + 3 * STAGGER + 60,
  footer: 120 + 3 * STAGGER + 180,
};

export interface SolvedRow {
  before: string;
  hug: string;
  after: string;
}

/**
 * Turns the puzzle's clue/position pairs into the three completed compounds,
 * with the answer as the shared half.
 */
export function solvedRows(
  answer: string,
  compounds: { clue: string; before: boolean }[]
): SolvedRow[] {
  return compounds.map(({ clue, before }) => ({
    before: before ? clue : '',
    hug: answer,
    after: before ? '' : clue,
  }));
}

export interface SolvedBoardProps {
  rows: SolvedRow[];
  answer: string;
  streak: number;
  /** Session 8: the archive is retired; this goes to the level map. */
  onArchive?: () => void;
}

export function SolvedBoard({ rows, answer, streak, onArchive }: SolvedBoardProps) {
  return (
    <>
      <View className="flex-1 justify-center gap-[10px] px-[22px] pt-[6px]">
        {rows.map((row, i) => (
          <Appear key={`${row.before}-${row.after}-${i}`} index={i} delay={IN.rows}>
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="h-[62px] flex-row items-center justify-center gap-[2px] rounded-wh-lg bg-wh-clue-card"
            >
              {row.before ? (
                <Text className="font-wh-bold text-wh-h1 text-wh-clue-text">{row.before}</Text>
              ) : null}
              {/* `accentText`, not `accent`: in dark, #17A398 on the clue card
                  is too dark to read and the design brightens it to #2ED3C0. */}
              <Text className="font-wh-bold text-wh-h1 text-wh-accent-text">{row.hug}</Text>
              {row.after ? (
                <Text className="font-wh-bold text-wh-h1 text-wh-clue-text">{row.after}</Text>
              ) : null}
            </Chunky>
          </Appear>
        ))}
      </View>

      <View className="items-center gap-[10px] px-[22px] pt-[6px]">
        <Appear delay={IN.answer}>
          <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
            Today&apos;s hug word
          </Text>
        </Appear>

        <Land delay={IN.answer + 90}>
          <Chunky
            offset={5}
            shadowVar="--color-wh-accent-shadow"
            className="rounded-wh-lg bg-wh-accent px-[30px] py-[14px]"
          >
            <Text className="font-wh-bold text-wh-display-lg text-wh-on-accent">{answer}</Text>
          </Chunky>
        </Land>
      </View>

      {/* The band of air the keyboard occupies on the unsolved board, so the
          footer does not jump when the screen changes state. */}
      <View className="h-[62px]" />

      <Appear
        delay={IN.footer}
        rise={12}
        className="flex-row items-center gap-[10px] px-[22px] pb-[6px]"
      >
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={onArchive}
          accessibilityRole="button"
          accessibilityLabel="Back to the levels"
          className="h-[58px] flex-1 items-center justify-center rounded-[19px] bg-wh-primary"
        >
          <Text className="font-wh-bold text-wh-xl tracking-[0.05em] text-wh-on-primary">
            SELECT LEVEL
          </Text>
        </ChunkyPressable>

        {/* A fact, not a call to action. Zero hides it rather than showing
            "0", which would read as a scolding on a screen about a win. */}
        {streak > 0 ? (
          <Chunky
            offset={4}
            shadowVar="--color-wh-surface-shadow"
            className="h-[58px] flex-row items-center gap-2 rounded-[19px] bg-wh-surface px-4"
          >
            <View className="h-[9px] w-[9px] rounded-wh-pill bg-wh-highlight" />
            <Text className="font-wh-heavy text-wh-base text-wh-text-quiet dark:text-wh-pill-text">
              {streak}
            </Text>
          </Chunky>
        ) : null}
      </Appear>
    </>
  );
}
