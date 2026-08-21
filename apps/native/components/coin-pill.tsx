import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence } from 'react-native-reanimated';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { MOTION, animate } from '@/components/motion';

/**
 * The coin balance, everywhere it appears.
 *
 * ── Now a button ──────────────────────────────────────────────────────────
 * Session 8, at the owner's request: tapping it opens the shop at the coins
 * section. It was a flat `Chunky` on the home screen and the daily board, and
 * a balance you can see but cannot act on is a dead end — the player has to
 * work out for themselves that coins live in a shop they have not found yet.
 *
 * `?coins=1` scrolls the shop to the coin tiers rather than dropping the
 * player at the top of a page about packs.
 *
 * ── One component, three screens ──────────────────────────────────────────
 * Home, the daily board and the level board all drew their own version. When
 * the glyph or the shadow needs correcting it should happen once.
 *
 * ── `pulse` ───────────────────────────────────────────────────────────────
 * Session 8b, for the daily gift coin. The balance changing by one is very
 * easy to miss, and the toast that accompanies it is deliberately quiet, so
 * the pill itself takes a small bow.
 *
 * A scale bump and back, once, on a changing key — not a loop. Nothing in this
 * app pulses continuously to get attention; that is the vocabulary of a badge
 * demanding to be tapped, and this is a gift being handed over.
 */
export function CoinPill({ coins, pulse }: { coins: number; pulse?: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Guarded on a truthy key so the pill does not bounce on first mount —
    // every screen that shows it would otherwise animate on open.
    if (!pulse) return;
    scale.value = withSequence(animate(MOTION.press, 1.18), animate(MOTION.release, 1));
  }, [pulse, scale]);

  const bump = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={bump}>
    <ChunkyPressable
      offset={3}
      shadowVar="--color-wh-surface-shadow"
      onPress={() => router.push({ pathname: '/shop', params: { coins: '1' } })}
      accessibilityRole="button"
      accessibilityLabel={`${coins} coins. Tap to get more.`}
      className="h-[42px] flex-row items-center gap-2 rounded-wh-pill bg-wh-surface pl-[10px] pr-[14px]"
    >
      <Chunky
        offset={-3}
        inset
        shadowVar="--color-wh-coin-dot-shadow"
        className="h-6 w-6 items-center justify-center rounded-wh-pill bg-wh-primary"
      >
        <Text className="font-wh-bold text-wh-sm text-wh-coin-glyph">$</Text>
      </Chunky>
      <Text className="font-wh-heavy text-wh-md text-wh-text-primary">{coins}</Text>
    </ChunkyPressable>
    </Animated.View>
  );
}
