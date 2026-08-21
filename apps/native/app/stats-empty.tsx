import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyPressable } from '@/components/chunky';
import { Illustration } from '@/components/illustration';
import { EmptyBody } from '@/components/empty-state';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';

/**
 * ── 18 Stats · Empty ──────────────────────────────────────────────────────
 * Built from `designs/extracted/18-stats-empty-light.html` and
 * `18-stats-empty-dark.html`, read in full, both themes.
 *
 * **This is the Stats screen every new player actually sees.** The populated
 * one (`/stats`) is built and shows the design's own invented figures; nobody
 * will meet it until they have played for a while. So this file matters more
 * than its size suggests, and it was the conspicuous gap in session 3.
 *
 * Eight squares of the heatmap, fading out, and one sentence: "Solve today's
 * puzzle and this fills in — one square at a time."
 *
 * ── What it refuses to do ─────────────────────────────────────────────────
 * There are no zeroes. A stats screen with "0 solved · 0 day streak · 0% win
 * rate" is the standard shape and it is quietly discouraging — it shows a
 * new player a scoreboard on which they are losing. This screen shows them the
 * grid they are about to fill instead, and does not compute a percentage of
 * anything. Nothing here can be failed at.
 *
 * ── The tint ladder ───────────────────────────────────────────────────────
 * Four steps, and the two themes map index-for-index:
 *   #F3E3C4 / #2B1A5E → #F6EDDD / #271755 → #F9F3E7 / #23144C → #FCF8F0 / #1F1244
 * The arrangement is the design's own — deliberately uneven, so the grid reads
 * as scattered rather than as a gradient. Do not sort it.
 * ──────────────────────────────────────────────────────────────────────────
 */

const TINTS = [
  'bg-[#F3E3C4] dark:bg-[#2B1A5E]',
  'bg-[#F6EDDD] dark:bg-[#271755]',
  'bg-[#F9F3E7] dark:bg-[#23144C]',
  'bg-[#FCF8F0] dark:bg-[#1F1244]',
];

/** Index into TINTS, in the design's own order. Not a gradient — a scatter. */
const GRID = [0, 0, 1, 2, 1, 2, 2, 3];


export default function StatsEmpty() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="STATS" />

        <EmptyBody
          inset={32}
          ornament={<Illustration name="update" />}
          title="Nothing to show yet"
          body="Solve today's puzzle and this fills in — one square at a time."
        />

        <Appear delay={240} rise={12} className="px-[22px] pb-[6px]">
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Today's puzzle"
            className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary"
          >
            <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
              TODAY&apos;S PUZZLE
            </Text>
          </ChunkyPressable>
        </Appear>
      </View>
    </View>
  );
}
