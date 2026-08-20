import { router } from 'expo-router';
import { Text } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';

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
 */
export function CoinPill({ coins }: { coins: number }) {
  return (
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
  );
}
