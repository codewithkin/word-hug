import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { LevelNode } from '@/components/level-node';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';
import { packById } from '@/content/packs';
import { packLevelCount, packLevelKey } from '@/lib/levels';
import { buy, loadShop, purchasesAvailable, type Shop } from '@/lib/purchases';
import { getLevelResults, ownsPack } from '@/lib/storage';
import { useToast } from '@/components/toast';

/**
 * ── 13 Pack Detail ────────────────────────────────────────────────────────
 * Session 7. One pack: what is in it, how far through you are, and a way in.
 *
 * ── Owned and unowned are the same screen ─────────────────────────────────
 * Deliberately. An unowned pack shows the same ten nodes, the same names, the
 * same everything — locked, but visible. You can see exactly what you would be
 * buying before you buy it, which is the opposite of the usual pattern of
 * hiding the contents behind the price.
 *
 * The one difference is the footer: a buy button instead of a play button.
 *
 * ── Pack levels are the same levels ───────────────────────────────────────
 * A pack is a curated view over `content/levels.ts`, not a second bank — see
 * `content/packs.ts`. So solving a pack level advances the same progress the
 * main run uses, and a level you have already met in the run shows as solved
 * here. That is intentional: nobody should be asked to solve the same puzzle
 * twice because they bought it in two places.
 */
export default function PackDetail() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const pack = params.id ? packById(params.id) : undefined;

  const [owned, setOwned] = useState(() => (pack ? ownsPack(pack.id) : false));
  const [results, setResults] = useState(getLevelResults);
  const [shop, setShop] = useState<Shop | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast, show, node: toastNode } = useToast();

  useEffect(() => {
    let live = true;
    void loadShop().then((s) => live && setShop(s));
    return () => {
      live = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pack) setOwned(ownsPack(pack.id));
      setResults(getLevelResults());
    }, [pack])
  );

  const item = pack ? shop?.packs[pack.id] : undefined;
  /** RevenueCat's localised price, or the bundled fallback while offline. */
  const price = item?.price ?? pack?.price ?? '';

  /**
   * The purchase, and the three things that are not failures.
   *
   * A cancellation says nothing — someone who opened the store sheet and
   * backed out has made a choice. An unconfigured SDK goes to
   * `/store-unreachable`, which is the honest screen and one they can leave.
   * Only a real store error gets a toast.
   */
  async function unlock() {
    if (!pack) return;
    const packageId = item?.packageId ?? pack.productId;

    if (!purchasesAvailable()) {
      router.push('/store-unreachable');
      return;
    }
    if (busy) return;

    setBusy(true);
    const result = await buy(packageId);
    setBusy(false);

    if (result.status === 'purchased') {
      // Read back from storage rather than trusting the result: `buy` has
      // already folded the entitlements in, and MMKV is the thing the rest of
      // the app will consult a frame from now.
      setOwned(ownsPack(pack.id));
      return;
    }
    if (result.status === 'cancelled') return;
    if (result.status === 'unavailable') {
      router.push('/store-unreachable');
      return;
    }
    show({ message: result.message });
  }

  if (!pack) {
    return (
      <View className="flex-1 items-center justify-center bg-wh-ground px-8">
        <PuzzleGround />
        <Text className="pb-5 text-center font-wh-bold text-wh-lg text-wh-clue-text">
          That pack isn&apos;t here.
        </Text>
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={() => router.replace('/packs')}
          accessibilityRole="button"
          accessibilityLabel="All packs"
          className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
        >
          <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
            ALL PACKS
          </Text>
        </ChunkyPressable>
      </View>
    );
  }

  const total = packLevelCount(pack.id);
  const numbers = Array.from({ length: total }, (_, i) => i + 1);
  const done = numbers.filter((n) => results[packLevelKey(pack.id, n)] !== undefined).length;
  const nextUnsolved = numbers.find((n) => results[packLevelKey(pack.id, n)] === undefined);

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title={pack.name.toUpperCase()} />

        {/* The hero. Full-bleed inside the 22px gutter, 16:7 like the list
            card, so the two read as the same object at two sizes. The art
            keeps a clear 28px margin by design — nothing is drawn over it
            here, but the crop must not eat into that. */}
        <Appear delay={40} className="px-[22px] pb-3">
          <Chunky
            offset={4}
            shadowVar={pack.tint.shadowVar}
            className="overflow-hidden rounded-wh-xl"
          >
            <Image
              source={pack.art}
              resizeMode="cover"
              className="h-[150px] w-full"
              accessible={false}
            />
          </Chunky>
        </Appear>

        <Appear delay={60} className="items-center gap-2 px-[26px] pb-3">
          <Text className="text-center font-wh-regular text-[15px] leading-[21px] text-wh-chip-text">
            {pack.blurb}
          </Text>
          {owned ? (
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
              {done} of {total} solved
            </Text>
          ) : null}
        </Appear>

        {toast ? toastNode : null}

        <ScrollView
          className="flex-1 px-[22px]"
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
        >
          {/* The contents, visible whether or not it is owned. You can see
              what you would be buying. */}
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {numbers.map((n, i) => {
              const solved = results[packLevelKey(pack.id, n)] !== undefined;
              // Exactly one `next` node, the same rule the free map uses — the
              // eye should be able to find where you are without reading.
              const state = !owned ? 'locked' : solved ? 'solved' : n === done + 1 ? 'next' : 'locked';
              return (
                <LevelNode
                  key={n}
                  n={n}
                  index={i}
                  state={state}
                  onPress={
                    owned && state !== 'locked'
                      ? () => router.push(`/pack-level/${pack.id}/${n}`)
                      : undefined
                  }
                />
              );
            })}
          </View>

          {!owned ? (
            <Appear delay={200} className="items-center pt-5">
              <Text className="text-center font-wh-regular text-[14px] leading-[20px] text-wh-text-whisper">
                Today&apos;s puzzle is still yours to solve without this.
              </Text>
            </Appear>
          ) : null}
        </ScrollView>

        <Appear delay={260} rise={12} className="px-[22px] pb-[6px]">
          {owned ? (
            <ChunkyPressable
              offset={5}
              shadowVar={pack.tint.shadowVar}
              onPress={() => router.push(`/pack-level/${pack.id}/${nextUnsolved ?? 1}`)}
              accessibilityRole="button"
              accessibilityLabel={nextUnsolved ? 'Continue the pack' : 'Play it again'}
              className={`h-[58px] items-center justify-center rounded-[19px] ${pack.tint.fill}`}
            >
              <Text className={`font-wh-bold text-wh-xxl tracking-wh-wide ${pack.tint.on}`}>
                {nextUnsolved ? 'CONTINUE' : 'PLAY AGAIN'}
              </Text>
            </ChunkyPressable>
          ) : (
            <ChunkyPressable
              offset={5}
              shadowVar="--color-wh-primary-shadow"
              onPress={() => void unlock()}
              accessibilityRole="button"
              accessibilityLabel={`Buy ${pack.name} for ${price}`}
              className="h-[58px] flex-row items-center justify-center gap-3 rounded-[19px] bg-wh-primary"
            >
              <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
                {price}
              </Text>
              <Chunky
                offset={0}
                shadowVar="--color-wh-primary-shadow"
                className="h-[6px] w-[6px] rounded-wh-pill bg-wh-on-primary"
              />
              <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
                {busy ? 'ONE MOMENT' : 'UNLOCK'}
              </Text>
            </ChunkyPressable>
          )}
        </Appear>
      </View>
    </View>
  );
}
