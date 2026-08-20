import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';
import { BUNDLE, PACKS } from '@/content/packs';
import { packLevelCount, packLevelKey } from '@/lib/levels';
import { getLevelResults, getOwnedPacks } from '@/lib/storage';

/**
 * ── 12 Pack List ──────────────────────────────────────────────────────────
 * Session 7. Built against `designs/extracted/12-pack-list-{light,dark}` where
 * it exists and against `/nothing-owned` — the empty state, built session 4 —
 * for the copy and manners.
 *
 * **This is the paid surface, and rule 3 governs it: never interrupt the
 * solve.** That is why this is a screen you go to and not a banner that finds
 * you. Nothing on any puzzle screen links here mid-puzzle; the routes in are
 * the home screen and the shop.
 *
 * ── An owned pack and an unowned one are the same row ─────────────────────
 * Same size, same shape, same position. The only differences are the trailing
 * element — a progress count instead of a price — and the fill. A design that
 * made unowned packs bigger or brighter would be an advert; this is a list.
 *
 * ── Every price is a placeholder ──────────────────────────────────────────
 * `content/packs.ts` holds them and says so in capitals. RevenueCat owns them
 * before release.
 */
export default function PackList() {
  const insets = useSafeAreaInsets();
  const [owned, setOwned] = useState<string[]>(getOwnedPacks);
  const [results, setResults] = useState(getLevelResults);

  useFocusEffect(
    useCallback(() => {
      setOwned(getOwnedPacks());
      setResults(getLevelResults());
    }, [])
  );

  // Nothing owned has its own whole screen, already built. It carries the
  // sentence explaining that the daily puzzle is still free, which is the
  // whole point of that moment.
  if (owned.length === 0) {
    return <NothingOwnedRedirect insets={insets.top} />;
  }

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="PACKS" />

        <ScrollView
          className="flex-1 px-[22px] pt-2"
          contentContainerClassName="gap-[10px] pb-4"
          showsVerticalScrollIndicator={false}
        >
          {PACKS.map((pack, i) => {
            const has = owned.includes(pack.id);
            const total = packLevelCount(pack.id);
            const done = Array.from({ length: total }, (_, i) =>
              packLevelKey(pack.id, i + 1)
            ).filter((k) => results[k] !== undefined).length;

            return (
              <Appear key={pack.id} index={i} delay={80}>
                <ChunkyPressable
                  offset={4}
                  shadowVar={has ? pack.tint.shadowVar : '--color-wh-surface-shadow'}
                  onPress={() =>
                    router.push({ pathname: '/pack/[id]', params: { id: pack.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    has
                      ? `${pack.name}. ${done} of ${total} solved.`
                      : `${pack.name}. ${pack.price}.`
                  }
                  className={
                    has
                      ? 'gap-1 rounded-wh-xl bg-wh-clue-card px-5 py-[18px]'
                      : 'gap-1 rounded-wh-xl bg-wh-surface px-5 py-[18px]'
                  }
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="flex-1 font-wh-bold text-wh-lg text-wh-clue-text">
                      {pack.name}
                    </Text>

                    {/* Owned: a progress count in the pack's own accent, so
                        the list reads as five different things rather than
                        five rows. Unowned: the price. Same size either way. */}
                    {has ? (
                      <View className={`rounded-wh-pill px-[10px] py-[3px] ${pack.tint.fill}`}>
                        <Text className={`font-wh-heavy text-wh-sm ${pack.tint.on}`}>
                          {done}/{total}
                        </Text>
                      </View>
                    ) : (
                      <Chunky
                        offset={3}
                        shadowVar="--color-wh-primary-shadow"
                        className="rounded-wh-sm bg-wh-primary px-3 py-[5px]"
                      >
                        <Text className="font-wh-bold text-wh-base text-wh-on-primary">
                          {pack.price}
                        </Text>
                      </Chunky>
                    )}
                  </View>

                  <Text className="font-wh-regular text-[14.5px] leading-[20px] text-wh-chip-text">
                    {pack.blurb}
                  </Text>
                </ChunkyPressable>
              </Appear>
            );
          })}

          {/* The bundle, once and quietly, at the bottom. Not pinned, not
              badged "best value", not pre-selected. */}
          {owned.length < PACKS.length ? (
            <Appear delay={80 + PACKS.length * 40}>
              <ChunkyPressable
                offset={3}
                inset
                shadowVar="--color-wh-answer-tile-empty-shadow"
                onPress={() => router.push('/shop')}
                accessibilityRole="button"
                accessibilityLabel={`${BUNDLE.name}, ${BUNDLE.price}`}
                className="flex-row items-center justify-center gap-2 rounded-wh-xl bg-wh-answer-tile-empty px-5 py-[18px]"
              >
                <Text className="font-wh-bold text-wh-base text-wh-text-quiet dark:text-wh-pill-text">
                  {BUNDLE.name} · {BUNDLE.price}
                </Text>
              </ChunkyPressable>
            </Appear>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

function NothingOwnedRedirect({ insets }: { insets: number }) {
  return (
    <View className="flex-1 bg-wh-ground" style={{ paddingTop: insets }}>
      <PuzzleGround />
      <Appear className="flex-1 items-center justify-center px-8">
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={() => router.replace('/nothing-owned')}
          accessibilityRole="button"
          accessibilityLabel="See the packs"
          className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
        >
          <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
            SEE THE PACKS
          </Text>
        </ChunkyPressable>
      </Appear>
    </View>
  );
}
