import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { MAX_HEARTS, formatCountdown } from '@/lib/lives';

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
      <View className="flex-row items-center gap-[3px]">
        {Array.from({ length: MAX_HEARTS }, (_, i) =>
          i < hearts ? (
            <Chunky
              key={i}
              offset={-2}
              inset
              shadowVar="--color-wh-streak-dot-shadow"
              className="h-[14px] w-[14px] rounded-wh-pill bg-wh-highlight"
            />
          ) : (
            <View
              key={i}
              className="h-[14px] w-[14px] rounded-wh-pill bg-wh-answer-tile-empty"
            />
          )
        )}
      </View>

      {countdown ? (
        <Text className="font-wh-heavy text-wh-sm text-wh-text-quiet dark:text-wh-pill-text">
          {countdown}
        </Text>
      ) : null}
    </ChunkyPressable>
  );
}
