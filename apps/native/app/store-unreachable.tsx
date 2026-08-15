import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuietLink } from '@/components/actions';
import { Chunky, ChunkyPressable } from '@/components/chunky';
import { EmptyBody } from '@/components/empty-state';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';
import { useAppTheme } from '@/contexts/app-theme-context';

/**
 * ── 15 Shop · Store unreachable ───────────────────────────────────────────
 * Built from `designs/extracted/15-store-unreachable-light.html` and
 * `15-store-unreachable-dark.html`, read in full, both themes.
 *
 * The only genuine failure state in the whole product, and it is still not
 * allowed to look like one.
 *
 * "Prices come straight from your app store, and it isn't answering" says
 * whose fault it is without blaming anyone, and — crucially — "Everything you
 * already own still works" answers the question a paying customer would
 * actually be panicking about. No error code, no red, no warning triangle. The
 * ornament is three shop cards with a question mark on the middle one, tilted
 * five degrees: the shelf is still there, the price tag is just missing.
 *
 * `Restore purchases` sits under TRY AGAIN rather than being buried in
 * Settings, because someone who has just been told the store is unreachable is
 * exactly the person who needs it.
 *
 * ── Recorded divergence ───────────────────────────────────────────────────
 * Screen 15 (the populated Shop) does not exist, so this is a route of its own
 * rather than that screen's failure branch. When 15 is built this becomes its
 * state — and the retry needs to actually re-query RevenueCat, which is the
 * one piece of behaviour on this screen that cannot be faked.
 * ──────────────────────────────────────────────────────────────────────────
 */

function ShelfGhost() {
  // The sunken lip is a shadow string, not a colour, so it cannot ride a
  // `dark:` class or go through `Chunky`. Same pattern as the archive ghosts.
  const { isDark } = useAppTheme();
  const sunken = isDark ? 'inset 0 4px 0 rgba(0,0,0,0.3)' : 'inset 0 4px 0 rgba(160,130,80,0.16)';

  const blank = (
    <View
      className="h-[70px] w-[60px] rounded-[18px] bg-wh-answer-tile-empty"
      style={{ boxShadow: sunken }}
    />
  );

  return (
    <View className="flex-row items-center gap-2">
      {blank}

      {/* `answerTile` rather than `surface`: white over #E4CFA8 in light and
          #4A3193 over #24144F in dark, which is the answer-tile pair in both
          themes. `surface` would be right in light and a shade off in dark. */}
      <Chunky
        offset={5}
        shadowVar="--color-wh-answer-tile-shadow"
        className="h-[70px] w-[60px] items-center justify-center rounded-[18px] bg-wh-answer-tile"
        style={{ transform: [{ rotate: '-5deg' }] }}
      >
        <Text className="font-wh-bold text-wh-display-lg text-wh-clue-slot-text dark:text-wh-text-secondary">
          ?
        </Text>
      </Chunky>

      {blank}
    </View>
  );
}

export default function StoreUnreachable() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* A close cross, not a back chevron — the Shop is presented modally
            and this is how the design draws its dismissal. */}
        <ScreenHeader title="SHOP" glyph="×" onBack={() => router.back()} />

        <EmptyBody
          ornament={<ShelfGhost />}
          title="Can't reach the store"
          body="Prices come straight from your app store, and it isn't answering. Everything you already own still works."
        />

        <Appear delay={240} rise={12} className="items-center gap-3 px-6 pb-[10px]">
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            accessibilityRole="button"
            accessibilityLabel="Try again"
            className="h-[60px] w-full items-center justify-center rounded-wh-lg bg-wh-primary"
          >
            <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
              TRY AGAIN
            </Text>
          </ChunkyPressable>

          <QuietLink label="Restore purchases" />
        </Appear>
      </View>
    </View>
  );
}
