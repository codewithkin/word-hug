import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { OfflineBanner } from '@/components/notice';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';
import { BUNDLE, PACKS } from '@/content/packs';
import { packLevelCount } from '@/lib/levels';
import { buy, loadShop, purchasesAvailable, type Shop } from '@/lib/purchases';
import { getCoins, getOwnedPacks } from '@/lib/storage';
import { useToast } from '@/components/toast';

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
 * ── Buying (session 8) ────────────────────────────────────────────────────
 * Wired to RevenueCat. Prices come from `priceString`, which is already in the
 * customer's own currency and formatted the way their store formats money —
 * the hard-coded strings below survive only as the offline fallback, so the
 * shop still renders on a train instead of showing blank cards.
 *
 * `/store-unreachable` is still here and still correct: it is what a player
 * sees when the SDK could not be configured at all, which is a real state and
 * one they can leave.
 *
 * A cancelled purchase says nothing. Someone who reached the store sheet and
 * changed their mind has done an ordinary thing, and an error toast for it
 * would be the shop telling them off.
 */

/** Fallback prices only — real ones come from RevenueCat. Same as `/zero-coin`. */
const COIN_TIERS = [
  { coins: '5', price: '£0.99', productId: 'wordhug_coins_5' },
  { coins: '15', price: '£2.49', productId: 'wordhug_coins_15' },
  { coins: '50', price: '£6.99', productId: 'wordhug_coins_50' },
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
  const [shop, setShop] = useState<Shop | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { toast, show, node: toastNode } = useToast();

  useFocusEffect(
    useCallback(() => {
      setCoins(getCoins());
      setOwned(getOwnedPacks());
    }, [])
  );

  // Offerings are fetched once per mount rather than on every focus: prices do
  // not change while someone is deciding, and a refetch on focus would make
  // the card prices flicker every time the pack page is dismissed.
  useEffect(() => {
    let live = true;
    void loadShop().then((s) => {
      if (!live) return;
      setShop(s);
      setOffline(Object.keys(s.packs).length === 0 && Object.keys(s.coins).length === 0);
    });
    return () => {
      live = false;
    };
  }, []);

  /** RevenueCat's price when we have it, the bundled string when we do not. */
  function priceOf(packageId: string | undefined, fallback: string) {
    if (!shop || !packageId) return fallback;
    const all = [...Object.values(shop.packs), ...Object.values(shop.coins), shop.bundle];
    return all.find((i) => i?.packageId === packageId)?.price ?? fallback;
  }

  async function purchase(packageId: string | undefined, label: string) {
    if (!purchasesAvailable() || !packageId) {
      router.push('/store-unreachable');
      return;
    }
    if (busy) return;

    setBusy(packageId);
    const result = await buy(packageId);
    setBusy(null);

    setCoins(getCoins());
    setOwned(getOwnedPacks());

    if (result.status === 'purchased') {
      show({ message: `${label} — thank you`, tone: 'done' });
      return;
    }
    // A cancellation is a decision, not a failure. Say nothing.
    if (result.status === 'cancelled') return;
    if (result.status === 'unavailable') {
      router.push('/store-unreachable');
      return;
    }
    show({ message: result.message });
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
                  onPress={() => void purchase(shop?.coins[tier.coins]?.packageId ?? tier.productId, `${tier.coins} coins`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${tier.coins} coins for ${priceOf(shop?.coins[tier.coins]?.packageId, tier.price)}`}
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
                    {priceOf(shop?.coins[tier.coins]?.packageId, tier.price)}
                  </Text>
                </ChunkyPressable>
              ))}
            </View>
          </Appear>

          {/* ── Packs ───────────────────────────────────────────────────── */}
          {/* Owned packs stay listed with a tick instead of a price — session
              8f, owner request. Hiding them made the shop look broken after a
              purchase ("where did Nightfall go?") and left no way back into a
              bought pack's levels from here. A row you own opens the same
              detail screen as one you don't; there it reads CONTINUE and the
              levels are playable. */}
          <Appear delay={140} className="gap-[10px]">
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
              Packs
            </Text>

            {PACKS.map((pack, i) => {
              const isOwned = owned.includes(pack.id);
              return (
                <Appear key={pack.id} index={i} delay={0}>
                  <ChunkyPressable
                    offset={4}
                    shadowVar="--color-wh-surface-shadow"
                    onPress={() =>
                      router.push({ pathname: '/pack/[id]', params: { id: pack.id } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      isOwned
                        ? `${pack.name}, purchased. Open your puzzles.`
                        : `${pack.name}, ${priceOf(shop?.packs[pack.id]?.packageId, pack.price)}. See what's in it.`
                    }
                    className="flex-row items-center gap-4 rounded-wh-xl bg-wh-surface px-5 py-4"
                  >
                    <View className="flex-1 gap-[2px]">
                      <Text className="font-wh-bold text-wh-lg text-wh-clue-text">
                        {pack.name}
                      </Text>
                      <Text className="font-wh-regular text-[13.5px] text-wh-text-muted dark:text-wh-text-quiet">
                        {isOwned
                          ? `Purchased — ${packLevelCount(pack.id)} puzzles`
                          : `${packLevelCount(pack.id)} puzzles`}
                      </Text>
                    </View>
                    {isOwned ? (
                      <Chunky
                        offset={3}
                        shadowVar="--color-wh-accent-shadow"
                        className="items-center justify-center rounded-wh-sm bg-wh-accent px-3 py-[6px]"
                      >
                        <Text className="font-wh-bold text-wh-base text-wh-on-accent">✓</Text>
                      </Chunky>
                    ) : (
                      <Chunky
                        offset={3}
                        shadowVar="--color-wh-primary-shadow"
                        className="rounded-wh-sm bg-wh-primary px-3 py-[5px]"
                      >
                        <Text className="font-wh-bold text-wh-base text-wh-on-primary">
                          {priceOf(shop?.packs[pack.id]?.packageId, pack.price)}
                        </Text>
                      </Chunky>
                    )}
                  </ChunkyPressable>
                </Appear>
              );
            })}

            {/* The bundle. Once, at the bottom, no badge. */}
            {unowned.length === PACKS.length ? (
              <ChunkyPressable
                offset={4}
                shadowVar="--color-wh-accent-shadow"
                onPress={() => void purchase(shop?.bundle?.packageId ?? BUNDLE.packageId, BUNDLE.name)}
                accessibilityRole="button"
                accessibilityLabel={`${BUNDLE.name} for ${priceOf(shop?.bundle?.packageId, BUNDLE.price)}`}
                className="flex-row items-center justify-between rounded-wh-xl bg-wh-accent px-5 py-4"
              >
                <Text className="font-wh-bold text-wh-lg text-wh-on-accent">
                  {BUNDLE.name}
                </Text>
                <Text className="font-wh-bold text-wh-lg text-wh-on-accent">
                  {priceOf(shop?.bundle?.packageId, BUNDLE.price)}
                </Text>
              </ChunkyPressable>
            ) : null}
          </Appear>

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

        {toast ? toastNode : null}
      </View>
    </View>
  );
}
