import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { Scrim } from '@/components/sheet';

/**
 * ── Overlay E · Archive locked ────────────────────────────────────────────
 * Built from `designs/extracted/e-archive-locked-light.html` and
 * `e-archive-locked-dark.html`, read in full, both themes.
 *
 * What a player meets when they reach past the last seven days in the archive.
 * The remarkable thing about it is the sentence "there's nothing to buy today"
 * — this is a dialog that appears at the exact moment a free-to-play game
 * would sell something, and it exists to say that nothing is for sale.
 *
 * A padlock, and then a copy deck that goes out of its way not to be a
 * paywall: the older days are "resting", not locked; they "come back in a
 * future update", not "unlock for £2.99"; and the one button says "Got it"
 * rather than offering a choice the player does not have. Nothing here is a
 * dark pattern with the price removed — it is a different shape entirely.
 *
 * ── Two things that are deliberately not the tokens ───────────────────────
 * This scrim is rgba(58,42,24,0.32) / rgba(8,4,20,0.55), a little heavier than
 * `backdrop` (0.28 / 0.5) — because a centred dialog has to lift off the grid
 * behind it, where a bottom sheet is anchored to an edge and does not. Both
 * values are written inline; promoting them to a `backdropStrong` token would
 * mean claiming a general rule from a single screen.
 * ──────────────────────────────────────────────────────────────────────────
 */

export default function ArchiveLocked() {
  return (
    <View className="flex-1">
      <Scrim
        onPress={() => router.back()}
        className="absolute inset-0 bg-[rgba(58,42,24,0.32)] dark:bg-[rgba(8,4,20,0.55)]"
      />

      <View className="flex-1 justify-center px-[26px]">
        <Appear rise={10}>
          <Chunky
            offset={6}
            shadowVar="--color-wh-solve-panel-shadow"
            className="items-center gap-4 rounded-[28px] bg-wh-solve-panel p-6"
          >
          {/* The padlock, drawn rather than iconised: a 20x14 shackle with no
              bottom edge sitting one pixel into a 30x22 body. @expo/vector-icons
              is available, but its padlock is a different padlock — this one is
              the same rounded, chunky object as the rest of the interface. */}
          <View className="h-[84px] w-[84px] items-center justify-center rounded-[24px] bg-wh-answer-tile-empty">
            <View className="-mb-px h-[14px] w-5 rounded-t-[10px] border-[3px] border-b-0 border-wh-text-muted dark:border-wh-text-quiet" />
            <View className="h-[22px] w-[30px] rounded-[6px] bg-wh-text-muted dark:bg-wh-text-quiet" />
          </View>

          <Text className="text-center font-wh-bold text-wh-h2 leading-[30px] text-wh-clue-text">
            The older days are resting
          </Text>

          <Text className="text-center font-wh-regular text-[15.5px] leading-[23px] text-wh-chip-text">
            The last seven are always open. Everything before that comes back in a future update —
            there&apos;s nothing to buy today.
          </Text>

          <ChunkyPressable
            offset={4}
            shadowVar="--color-wh-surface-shadow"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Got it"
            className="h-[58px] w-full items-center justify-center rounded-[19px] bg-wh-surface"
          >
            <Text className="font-wh-bold text-wh-xl text-wh-text-muted dark:text-wh-pill-text">
              Got it
            </Text>
          </ChunkyPressable>
          </Chunky>
        </Appear>
      </View>
    </View>
  );
}
