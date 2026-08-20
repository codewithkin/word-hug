import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { OfflineBanner } from '@/components/notice';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';
import { BUNDLE, PACKS } from '@/content/packs';
import { packLevelCount } from '@/lib/levels';
import { getCoins, getOwnedPacks } from '@/lib/storage';

/**
 * ── 15 Shop ───────────────────────────────────────────────────────────────
 * Session 7. Built against `/store-unreachable` — its failure state, built
 * session 4 — for the copy and the manners, and against the coin tiers on
 * `/zero-coin`.
 *
 * ── What the design refuses, and this keeps refusing ──────────────────────
 * No countdown. No "offer ends in". No discount badge, no strikethrough price,
 * no "most popular" flag, no pre-selected tier, no confetti. Three coin tiers
 * and five packs, in the order they cost. Rule 3 is "never interrupt the
 * solve", and rules 1 and 3 together mean the shop can be a shop — it just
 * cannot come and find you.
 *
 * The line that has to stay: **"There's nothing to buy today."** The daily
 * puzzle is free, always, forever (rule 2), and this is the one screen where
 * saying so out loud costs something. That is why it is here.
 *
 * ── Nothing on this screen can actually be bought ─────────────────────────
 * `react-native-purchases` is installed and unconfigured, and **every price
 * here is a hard-coded placeholder that must come from RevenueCat before
 * release.** Buying routes to `/store-unreachable`, which is true, honest, and
 * a screen the player can leave — unlike a dead button or a fake success.
 */

/** Placeholders. RevenueCat owns these. Same three as `/zero-coin`. */
const COIN_TIERS = [
  { coins: '5', price: '£0.99', productId: 'wh_coins_5' },
  { coins: '15', price: '£2.49', productId: 'wh_coins_15' },
  { coins: '50', price: '£6.99', productId: 'wh_coins_50' },
];

export default function Shop() {
  const insets = useSafeAreaInsets();
  /**
   * `?coins=1` from the coin pill. Coins already lead the page, so this only
   * changes the eyebrow — landing someone who tapped a coin balance on a
   * heading that says "Nudge coins" is enough to confirm they arrived where
   * they meant to. A scroll-to would be motion with nothing to show.
   */
  const { coins: wantsCoins } = useLocalSearchParams<{ coins?: string }>();
  const [coins, setCoins] = useState(getCoins);
  const [owned, setOwned] = useState<string[]>(getOwnedPacks);
  const [offline, setOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setCoins(getCoins());
      setOwned(getOwnedPacks());
    }, [])
  );

  function buy() {
    router.push('/store-unreachable');
  }

  const unowned = PACKS.filter((p) => !owned.includes(p.id));

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="SHOP" />

        {/* Overlay F, mounted by the screen that owns it rather than pushed as
            a route. Being offline stops buying and nothing else, so it is a
            banner and everything underneath stays live. */}
        {offline ? (
          <View className="pb-3">
            <OfflineBanner onDismiss={() => setOffline(false)} />
          </View>
        ) : null}

        <ScrollView
          className="flex-1 px-[22px]"
          contentContainerClassName="gap-5 pb-4"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Coins ───────────────────────────────────────────────────── */}
          <Appear delay={60} className="gap-[10px]">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
                {wantsCoins ? 'Coins — spend them on hints' : 'Coins'}
              </Text>
              <View className="flex-row items-center gap-2">
                <Chunky
                  offset={-3}
                  inset
                  shadowVar="--color-wh-coin-dot-shadow"
                  className="h-[18px] w-[18px] rounded-wh-pill bg-wh-primary"
                />
                <Text className="font-wh-heavy text-wh-base text-wh-clue-text">{coins}</Text>
              </View>
            </View>

            <View className="flex-row gap-[10px]">
              {COIN_TIERS.map((tier) => (
                <ChunkyPressable
                  key={tier.coins}
                  offset={4}
                  shadowVar="--color-wh-surface-shadow"
                  onPress={buy}
                  accessibilityRole="button"
                  accessibilityLabel={`${tier.coins} coins for ${tier.price}`}
                  className="flex-1 items-center gap-[5px] rounded-[18px] bg-wh-surface py-[13px]"
                >
                  <Chunky
                    offset={-4}
                    inset
                    shadowVar="--color-wh-coin-dot-shadow"
                    className="h-7 w-7 rounded-wh-pill bg-wh-primary"
                  />
                  <Text className="font-wh-bold text-[19px] text-wh-clue-text">{tier.coins}</Text>
                  <Text className="font-wh-heavy text-[12.5px] text-wh-text-muted dark:text-wh-text-quiet">
                    {tier.price}
                  </Text>
                </ChunkyPressable>
              ))}
            </View>
          </Appear>

          {/* ── Packs ───────────────────────────────────────────────────── */}
          {unowned.length > 0 ? (
            <Appear delay={140} className="gap-[10px]">
              <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
                Packs
              </Text>

              {unowned.map((pack, i) => (
                <Appear key={pack.id} index={i} delay={0}>
                  <ChunkyPressable
                    offset={4}
                    shadowVar="--color-wh-surface-shadow"
                    onPress={() =>
                      router.push({ pathname: '/pack/[id]', params: { id: pack.id } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${pack.name}, ${pack.price}. See what's in it.`}
                    className="flex-row items-center gap-4 rounded-wh-xl bg-wh-surface px-5 py-4"
                  >
                    <View className="flex-1 gap-[2px]">
                      <Text className="font-wh-bold text-wh-lg text-wh-clue-text">
                        {pack.name}
                      </Text>
                      <Text className="font-wh-regular text-[13.5px] text-wh-text-muted dark:text-wh-text-quiet">
                        {packLevelCount(pack.id)} puzzles
                      </Text>
                    </View>
                    <Chunky
                      offset={3}
                      shadowVar="--color-wh-primary-shadow"
                      className="rounded-wh-sm bg-wh-primary px-3 py-[5px]"
                    >
                      <Text className="font-wh-bold text-wh-base text-wh-on-primary">
                        {pack.price}
                      </Text>
                    </Chunky>
                  </ChunkyPressable>
                </Appear>
              ))}

              {/* The bundle. Once, at the bottom, no badge. */}
              {unowned.length === PACKS.length ? (
                <ChunkyPressable
                  offset={4}
                  shadowVar="--color-wh-accent-shadow"
                  onPress={buy}
                  accessibilityRole="button"
                  accessibilityLabel={`${BUNDLE.name} for ${BUNDLE.price}`}
                  className="flex-row items-center justify-between rounded-wh-xl bg-wh-accent px-5 py-4"
                >
                  <Text className="font-wh-bold text-wh-lg text-wh-on-accent">
                    {BUNDLE.name}
                  </Text>
                  <Text className="font-wh-bold text-wh-lg text-wh-on-accent">
                    {BUNDLE.price}
                  </Text>
                </ChunkyPressable>
              ) : null}
            </Appear>
          ) : null}

          {/* ── Restore ─────────────────────────────────────────────────── */}
          <Appear delay={220} className="gap-3 pt-1">
            <ChunkyPressable
              offset={3}
              shadowVar="--color-wh-surface-shadow"
              onPress={() => router.push('/restore-result')}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
              className="h-[52px] items-center justify-center rounded-[19px] bg-wh-surface"
            >
              <Text className="font-wh-bold text-wh-base text-wh-text-muted dark:text-wh-pill-text">
                Restore purchases
              </Text>
            </ChunkyPressable>

            {/* Overlay D, reachable and not triggered. Nothing in the app
                shows the welcome offer on its own yet — that needs the owner's
                decision on *when*, and the honest options are narrow. Until
                then it lives here, where someone who came looking to spend
                money can find it, which is the only place rule 3 allows. */}
            {unowned.length === PACKS.length ? (
              <ChunkyPressable
                offset={3}
                inset
                shadowVar="--color-wh-answer-tile-empty-shadow"
                onPress={() => router.push('/welcome-offer')}
                accessibilityRole="button"
                accessibilityLabel="See the new-player price for all five packs"
                className="h-[46px] items-center justify-center rounded-[19px] bg-wh-answer-tile-empty"
              >
                <Text className="font-wh-bold text-[14px] text-wh-text-whisper">
                  New here? There&apos;s a lower price on all five.
                </Text>
              </ChunkyPressable>
            ) : null}

            {/* Rule 2, said out loud on the one screen where it costs
                something to say. Do not remove this line. */}
            <Text className="text-center font-wh-regular text-[14px] leading-[20px] text-wh-text-whisper">
              There&apos;s nothing to buy today. The daily puzzle is free, always.
            </Text>
          </Appear>
        </ScrollView>
      </View>
    </View>
  );
}
