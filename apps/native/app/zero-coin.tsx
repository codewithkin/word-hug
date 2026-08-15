import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Sheet } from '@/components/sheet';

/**
 * ── Overlay C · Zero-coin prompt ──────────────────────────────────────────
 * Built from `designs/extracted/c-zero-coin-prompt-light.html` and
 * `c-zero-coin-prompt-dark.html`, read in full, both themes.
 *
 * The moment a free game is most tempted to become a different kind of game,
 * and the design refuses on every count:
 *
 * · The second line — "Today's puzzle is still yours to solve without them" —
 *   is the whole product in one sentence. Running out of coins costs the
 *   player nothing. The board is untouched behind this sheet.
 * · There is **no timer**, no "offer ends", no discount badge, no pre-selected
 *   tier and no "best value" flag. Three prices, plainly, in the order they
 *   cost (rules 1 and 3).
 * · "Not now" is a full-width button of the same height as the tiers, not a
 *   greyed link in a corner. Declining is a first-class action.
 *
 * This sheet is only ever reached from the nudge picker (overlay B), and only
 * when the balance is zero. It never opens by itself.
 *
 * ── The prices ────────────────────────────────────────────────────────────
 * £0.99 / £2.49 / £6.99 are the design's own placeholders and are hard-coded
 * here. They MUST come from RevenueCat before this ships: a store price is
 * localised, tax-inclusive and region-specific, and a hard-coded one is wrong
 * for most of the world and a store-review rejection in several countries.
 * `react-native-purchases` is installed for exactly this; see
 * progress/02-dependencies.md §1.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** `textMuted` in light, `textQuiet` in dark. See the note in nudge-picker. */
const QUIET_TEXT = 'text-wh-text-muted dark:text-wh-text-quiet';

const TIERS = [
  { coins: '5', price: '£0.99' },
  { coins: '15', price: '£2.49' },
  { coins: '50', price: '£6.99' },
];

export default function ZeroCoinPrompt() {
  return (
    <Sheet onDismiss={() => router.back()}>
      <Text className="font-wh-bold text-wh-h3 text-wh-clue-text">You&apos;re out of coins</Text>

      <Text className="font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
        Nudges cost one each. Today&apos;s puzzle is still yours to solve without them.
      </Text>

      <View className="flex-row gap-[10px]">
        {TIERS.map((tier) => (
          // Flat, like the nudge rungs — the design gives the tiers no
          // elevation, so they get no chunky give either.
          <Pressable
            key={tier.coins}
            accessibilityRole="button"
            accessibilityLabel={`${tier.coins} coins for ${tier.price}`}
            className="flex-1 items-center gap-[5px] rounded-[18px] bg-wh-surface-inset py-[13px] dark:bg-wh-answer-tile-active"
          >
            <Chunky
              offset={-4}
              inset
              shadowVar="--color-wh-coin-dot-shadow"
              className="h-7 w-7 rounded-wh-pill bg-wh-primary"
            />
            <Text className="font-wh-bold text-[19px] text-wh-clue-text">{tier.coins}</Text>
            <Text className={`font-wh-heavy text-[12.5px] ${QUIET_TEXT}`}>{tier.price}</Text>
          </Pressable>
        ))}
      </View>

      <ChunkyPressable
        offset={4}
        shadowVar="--color-wh-surface-shadow"
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Not now"
        className="h-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
      >
        <Text className="font-wh-bold text-wh-xl text-wh-text-muted dark:text-wh-pill-text">
          Not now
        </Text>
      </ChunkyPressable>
    </Sheet>
  );
}
