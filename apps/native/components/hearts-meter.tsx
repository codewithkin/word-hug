import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ChunkyPressable } from '@/components/chunky';
import { MAX_HEARTS, formatCountdown } from '@/lib/lives';

/**
 * A heart, drawn rather than a circle.
 *
 * The first version used the coral dot from the streak pill, and the owner
 * read it as exactly that — a red circle. A life meter has to look like lives.
 *
 * Drawn with `react-native-svg` (already a dependency, and what
 * `puzzle-ground` uses for the gradients) rather than an icon font, because a
 * glyph would not inherit the chunky palette and would need its own asset in
 * two themes. The path is a plain two-lobe heart with no gloss, which is the
 * same flat-and-solid treatment every other shape in the app gets (D-004).
 */
function Heart({ filled }: { filled: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M12 21s-7.5-4.7-9.6-9.2C.6 8.1 2.6 4.5 6.2 4.5c2 0 3.3 1.1 4 2.1.7-1 2-2.1 4-2.1 3.6 0 5.6 3.6 3.8 7.3C19.5 16.3 12 21 12 21z"
        // `highlight` (#FF6B4A) and the sunken empty-tile fill. The empty heart
        // is the same shape rather than a smaller dot, so the meter does not
        // appear to change size as it drains.
        fill={filled ? '#FF6B4A' : 'rgba(0,0,0,0.10)'}
      />
    </Svg>
  );
}

/**
 * The heart meter in the map header.
 *
 * Five pips rather than a number, because "3" and "3 of 5" both make the
 * player do arithmetic and five dots do not. Spent hearts stay visible as
 * hollow pips — a meter that shrinks reads as a different meter each time.
 *
 * The countdown only appears when a heart is actually missing. On a full meter
 * there is no clock on screen at all, which is the one concession left to the
 * product's original "nothing implies a clock" rule (see `lib/lives.ts`).
 */
export function HeartsMeter({
  hearts,
  nextInMs,
  onPress,
}: {
  hearts: number;
  nextInMs: number;
  onPress?: () => void;
}) {
  const countdown = hearts < MAX_HEARTS ? formatCountdown(nextInMs) : '';

  return (
    <ChunkyPressable
      offset={3}
      shadowVar="--color-wh-surface-shadow"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        hearts >= MAX_HEARTS
          ? 'Hearts full'
          : `${hearts} of ${MAX_HEARTS} hearts. Next in ${countdown}. Tap to refill.`
      }
      className="h-[42px] flex-row items-center gap-[6px] rounded-wh-pill bg-wh-surface px-[12px]"
    >
      <View className="flex-row items-center gap-[2px]">
        {Array.from({ length: MAX_HEARTS }, (_, i) => (
          <Heart key={i} filled={i < hearts} />
        ))}
      </View>

      {countdown ? (
        <Text className="font-wh-heavy text-wh-sm text-wh-text-quiet dark:text-wh-pill-text">
          {countdown}
        </Text>
      ) : null}
    </ChunkyPressable>
  );
}
