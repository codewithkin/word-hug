import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';

/**
 * ── 18 Stats ──────────────────────────────────────────────────────────────
 * Built from `designs/extracted/18-stats-light.html` and
 * `18-stats-dark.html`, read in full, both themes.
 *
 * Three figures, five weeks of squares, and pack progress. What is absent is
 * again the design: no average solve time, no win rate, no percentile, no
 * "you're in the top 12% of players", no guess distribution. Nothing here can
 * be failed and nothing compares you to anyone. Streak, longest streak,
 * solved — and the streak is coral because it is warm, not because it is
 * urgent (D-002: the coral is not an error colour).
 *
 * ── The heatmap ───────────────────────────────────────────────────────────
 * Seven columns, five rows, 35 days. The design file drives these from a
 * template loop whose data is not in the export, so the two states come from
 * the legend it *does* draw: `answerTileEmpty` for a day not played and the
 * teal for a day solved. That is a recorded divergence — if the real design
 * has intermediate shades, this will need a third value.
 *
 * The legend swatch for "solved" is `accent` (#17A398) in BOTH themes, while
 * the squares themselves and the progress bars use `accentMid`, which dark
 * brightens to #1FBFB0. That looks like a mistake in the export and is
 * reproduced faithfully; it is two pixels of legend.
 *
 * ── STATE ─────────────────────────────────────────────────────────────────
 * None. Every figure is the design's own. There is an `18-stats-empty` design
 * for the before-anything-happened case which is NOT built — that is the
 * screen a new player actually sees, so it matters more than this one, and it
 * should be built in the same change that gives these numbers a source.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** The design's own figures. */
const FIGURES = [
  { value: '12', label: 'Streak', className: 'font-wh-bold text-[30px] leading-none text-wh-highlight-text' },
  { value: '21', label: 'Longest', className: 'font-wh-bold text-[30px] leading-none text-wh-primary' },
  { value: '148', label: 'Solved', className: 'font-wh-bold text-[30px] leading-none text-wh-accent-text' },
];

/**
 * 35 days, most recent last. `true` = solved. The pattern is the design's
 * shape — a mostly-solid stretch with a few gaps — rather than invented data
 * that would imply a perfect record.
 */
const HEAT = [
  true, true, false, true, true, true, true,
  true, true, true, false, true, true, true,
  false, true, true, true, true, false, true,
  true, true, true, true, true, true, false,
  true, true, true, true, true, true, true,
];

/** Five rows of seven, oldest first. */
const WEEKS = Array.from({ length: 5 }, (_, w) => HEAT.slice(w * 7, w * 7 + 7));

const PACKS = [
  { name: 'Cozy Kitchen', done: 12, total: 30 },
  { name: 'Garden Path', done: 3, total: 30 },
];

function CardLabel({ children }: { children: string }) {
  return (
    <Text className="font-wh-heavy text-wh-micro uppercase tracking-wh-label text-wh-card-label">
      {children}
    </Text>
  );
}

export default function Stats() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="STATS" />

        <ScrollView
          className="flex-1 px-5 pt-3"
          contentContainerClassName="gap-[14px] pb-4"
          showsVerticalScrollIndicator={false}
        >
          {/* ── The three figures ──────────────────────────────────────── */}
          <Appear delay={60} className="flex-row gap-[10px]">
            {FIGURES.map(({ value, label, className }) => (
              <Chunky
                key={label}
                offset={4}
                shadowVar="--color-wh-clue-card-shadow"
                className="flex-1 items-center gap-1 rounded-wh-lg bg-wh-clue-card py-4"
              >
                <Text className={className}>{value}</Text>
                {/* 10.5px at 0.12em — smaller and tighter than every other
                    eyebrow in the app, because it sits under a number rather
                    than over a section. */}
                <Text className="font-wh-heavy text-[10.5px] uppercase tracking-[0.12em] text-wh-stat-label">
                  {label}
                </Text>
              </Chunky>
            ))}
          </Appear>

          {/* ── Five weeks ─────────────────────────────────────────────── */}
          <Appear delay={140}>
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="gap-3 rounded-wh-xl bg-wh-clue-card p-[18px]"
            >
              <CardLabel>Last five weeks</CardLabel>

              {/* The design uses `grid-template-columns:repeat(7,1fr)`.
                  React Native has no grid, and a wrapping row with percentage
                  widths cannot account for the gaps — seven cells at 1/7 each
                  plus six 7px gaps overflows and reflows to six per row. Five
                  explicit rows of seven flexed cells is the same picture and
                  cannot drift. */}
              <View className="gap-[7px]">
                {WEEKS.map((week, w) => (
                  <View key={w} className="flex-row gap-[7px]">
                    {week.map((solved, d) => (
                      <View
                        key={d}
                        className={
                          solved
                            ? 'h-8 flex-1 rounded-wh-sm bg-wh-accent-mid'
                            : 'h-8 flex-1 rounded-wh-sm bg-wh-answer-tile-empty'
                        }
                      />
                    ))}
                  </View>
                ))}
              </View>

              <View className="flex-row items-center gap-2 pt-[2px]">
                <View className="h-[14px] w-[14px] rounded-[5px] bg-wh-answer-tile-empty" />
                <Text className="font-wh-bold text-[12.5px] text-wh-text-whisper">not played</Text>
                <View className="ml-2 h-[14px] w-[14px] rounded-[5px] bg-wh-accent" />
                <Text className="font-wh-bold text-[12.5px] text-wh-text-whisper">solved</Text>
              </View>
            </Chunky>
          </Appear>

          {/* ── Packs ──────────────────────────────────────────────────── */}
          <Appear delay={220}>
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="gap-[14px] rounded-wh-xl bg-wh-clue-card p-[18px]"
            >
              <CardLabel>Your packs</CardLabel>

              <View className="gap-3">
                {PACKS.map(({ name, done, total }) => (
                  <View key={name} className="gap-[7px]">
                    <View className="flex-row items-baseline justify-between">
                      <Text className="font-wh-bold text-wh-md text-wh-clue-text">{name}</Text>
                      <Text className="font-wh-heavy text-wh-sm-alt text-wh-accent-mid">
                        {done} / {total}
                      </Text>
                    </View>
                    <View className="h-3 overflow-hidden rounded-wh-pill bg-wh-answer-tile-empty">
                      <View
                        className="h-full rounded-wh-pill bg-wh-accent-mid"
                        style={{ width: `${Math.round((done / total) * 100)}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Chunky>
          </Appear>
        </ScrollView>
      </View>
    </View>
  );
}
