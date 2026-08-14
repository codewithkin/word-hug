import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { EmptyBody } from '@/components/empty-state';
import { useAppTheme } from '@/contexts/app-theme-context';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';

/**
 * ── 10 Archive · Day one ──────────────────────────────────────────────────
 * Built from `designs/extracted/10-archive-day-one-light.html` and
 * `10-archive-day-one-dark.html`, read in full, both themes.
 *
 * The archive on a brand-new install: one amber tile for today, and three
 * fading ghosts of the days that have not happened yet.
 *
 * The copy is doing something specific. "Your archive starts today" frames an
 * empty list as a beginning; "a missed morning is never lost" answers, before
 * it is asked, the anxiety that a daily game usually farms. A product built
 * around retention would use this screen to explain what you stand to lose.
 *
 * ── Recorded divergence ───────────────────────────────────────────────────
 * Screen 10 (the populated Archive) does not exist yet, so this is a route of
 * its own rather than the empty branch of that screen. When 10 is built, this
 * becomes its zero-state and the route goes.
 *
 * The ghost tiles are drawn at the design's exact widths (62/52/52/52) rather
 * than flexed. On a narrower phone than the 390px export they will crowd
 * rather than shrink; that is the design's own composition and worth seeing
 * before it is "fixed".
 * ──────────────────────────────────────────────────────────────────────────
 */

/**
 * The three days that have not happened yet, fading out.
 *
 * Light: #F3E3C4 → #F6EDDD → #F9F3E7, the first two sunken and the last flat.
 * Dark:  #251652 → #221345 → #1E1140, only the first sunken.
 * Read straight off the two files; see the note in components/empty-state.tsx
 * for why this ladder is not shared with the Stats one.
 */
const GHOSTS = [
  {
    bg: 'bg-[#F3E3C4] dark:bg-[#251652]',
    light: 'inset 0 3px 0 rgba(160,130,80,0.16)',
    dark: 'inset 0 3px 0 rgba(0,0,0,0.28)',
  },
  // Light gives the middle ghost a fainter lip; dark gives it none at all.
  { bg: 'bg-[#F6EDDD] dark:bg-[#221345]', light: 'inset 0 3px 0 rgba(160,130,80,0.1)', dark: null },
  { bg: 'bg-[#F9F3E7] dark:bg-[#1E1140]', light: null, dark: null },
];

function ArchiveGhosts() {
  // Shadow strings cannot go through `Chunky` (no CSS variable holds them) or
  // through a `dark:` class (they are not colours), so the theme is read here.
  const { isDark } = useAppTheme();

  return (
    <View className="flex-row items-end gap-[9px]">
      {/* Today. The only solid thing on the screen. */}
      <Chunky
        offset={5}
        shadowVar="--color-wh-primary-shadow"
        className="h-[72px] w-[62px] items-center justify-center rounded-[19px] bg-wh-primary"
      >
        <Text className="font-wh-bold text-wh-h2 text-wh-on-primary">10</Text>
      </Chunky>

      {GHOSTS.map((ghost, i) => {
        const sunken = isDark ? ghost.dark : ghost.light;
        return (
          <View
            key={i}
            className={`h-[60px] w-[52px] rounded-[17px] ${ghost.bg}`}
            style={sunken ? { boxShadow: sunken } : undefined}
          />
        );
      })}
    </View>
  );
}

export default function ArchiveDayOne() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="ARCHIVE" />

        <EmptyBody
          ornament={<ArchiveGhosts />}
          title="Your archive starts today"
          body="Each day you play, another one lands here. The last seven stay open, so a missed morning is never lost."
        />

        <Appear delay={240} rise={12} className="px-[22px] pb-[6px]">
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Play today"
            className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary"
          >
            <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
              PLAY TODAY
            </Text>
          </ChunkyPressable>
        </Appear>
      </View>
    </View>
  );
}
