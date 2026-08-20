import { Redirect } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { PACKS as PACK_LIST } from '@/content/packs';
import { addDays, localDate } from '@/lib/dates';
import { packLevelCount, packLevelKey } from '@/lib/levels';
import { getLevelResults, getOwnedPacks, getSolves, getStreak } from '@/lib/storage';
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
/**
 * ── Real numbers, session 8 ───────────────────────────────────────────────
 * Every figure on this screen was hard-coded — streak 12, longest 21, solved
 * 148, a hand-drawn heatmap and two packs that do not exist ("Cozy Kitchen",
 * "Garden Path"). It looked plausible and was entirely fictional, which is
 * worse than an empty screen: a player who has solved four puzzles being told
 * they have solved 148 learns not to trust anything the app says.
 *
 * It all comes from storage now, and `/stats-empty` handles the case where
 * there is nothing yet.
 */
function useStats() {
  const streak = getStreak();
  const solves = getSolves();
  const levelResults = getLevelResults();
  const owned = getOwnedPacks();

  /** Free-run levels are keyed by bare number; pack levels by `pack:n`. */
  const keys = Object.keys(levelResults);
  const freeSolved = keys.filter((k) => /^\d+$/.test(k)).length;
  const dailySolved = Object.keys(solves).length;

  /**
   * The last 35 days, oldest first — did anything get solved that day?
   *
   * Built from `solvedAt` timestamps across both stores, because the streak
   * counts either (session 7). A day with a level solve and no daily is still
   * a day the player showed up.
   */
  const days: boolean[] = [];
  const solvedDates = new Set<string>();
  for (const s of Object.values(solves)) solvedDates.add(localDate(new Date(s.solvedAt)));
  for (const r of Object.values(levelResults)) solvedDates.add(localDate(new Date(r.solvedAt)));

  const today = localDate();
  for (let i = 34; i >= 0; i--) days.push(solvedDates.has(addDays(today, -i)));

  const packs = PACK_LIST.filter((p) => owned.includes(p.id)).map((p) => {
    const total = packLevelCount(p.id);
    const done = Array.from({ length: total }, (_, i) =>
      packLevelKey(p.id, i + 1)
    ).filter((k) => levelResults[k] !== undefined).length;
    return { name: p.name, done, total };
  });

  return {
    figures: [
      {
        value: String(streak.current),
        label: 'Streak',
        className: 'font-wh-bold text-[30px] leading-none text-wh-highlight-text',
      },
      {
        value: String(streak.longest),
        label: 'Longest',
        className: 'font-wh-bold text-[30px] leading-none text-wh-primary',
      },
      {
        value: String(freeSolved + dailySolved + (keys.length - freeSolved)),
        label: 'Solved',
        className: 'font-wh-bold text-[30px] leading-none text-wh-accent-text',
      },
    ],
    weeks: Array.from({ length: 5 }, (_, w) => days.slice(w * 7, w * 7 + 7)),
    packs,
    /** Nothing solved at all — `/stats-empty` is that whole screen. */
    empty: keys.length === 0 && dailySolved === 0,
  };
}

function CardLabel({ children }: { children: string }) {
  return (
    <Text className="font-wh-heavy text-wh-micro uppercase tracking-wh-label text-wh-card-label">
      {children}
    </Text>
  );
}

export default function Stats() {
  const insets = useSafeAreaInsets();
  const { figures: FIGURES, weeks: WEEKS, packs: PACKS, empty } = useStats();

  // Day one has its own screen, already built, with the copy that explains
  // why there is nothing here yet.
  if (empty) return <Redirect href="/stats-empty" />;

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
