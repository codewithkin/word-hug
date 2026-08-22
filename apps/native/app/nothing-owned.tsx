import { router } from 'expo-router';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { BUNDLE, PACKS } from '@/content/packs';
import { getCoins } from '@/lib/storage';

/**
 * ── 12 Pack List · Nothing owned ──────────────────────────────────────────
 * This was the session-4 empty-state mock until the live Play build caught it:
 * invented packs ("Cozy Kitchen", "Seaside"), invented prices (£2.99/£9.99),
 * a hard-coded coin balance, and every button routed to `/store-unreachable`.
 * `/packs` redirects here whenever nothing is owned, so every brand-new
 * player met fake products on the way to the real ones.
 *
 * It now renders the real catalogue — same rows as `/packs`, minus progress,
 * because nobody owns anything yet. Prices are the offline fallback strings;
 * the authoritative localised ones come from RevenueCat in `/shop`, which is
 * also where buying happens. Rows open the real pack pages; the bundle row
 * opens the shop rather than purchasing from here, keeping one buy path.
 *
 * The manner is unchanged from the design: quiet, no urgency, and the one
 * sentence that does the selling — yours forever once you take one. The daily
 * puzzle is free forever (rule 2); these are extra puzzles for people who
 * want more, which is why this screen can afford to be this calm.
 */
export default function NothingOwned() {
  const insets = useSafeAreaInsets();
  const coins = getCoins();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Back, title, coin balance — the pack list's own header, which is
            not the one on Settings/Stats: the right slot holds a real pill
            rather than the counterweight box. */}
        <Appear
          rise={-6}
          className="h-[60px] flex-row items-center justify-between px-[18px] pt-[6px]"
        >
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
          >
            <Text className="pb-1 font-wh-bold text-wh-h2 leading-none text-wh-text-faint dark:text-wh-text-secondary">
              ‹
            </Text>
          </ChunkyPressable>

          <Text className="font-wh-bold text-wh-h2 text-wh-clue-text">HUG PACKS</Text>

          <Chunky
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            className="h-[42px] flex-row items-center gap-2 rounded-wh-pill bg-wh-surface pl-[10px] pr-[14px]"
          >
            <Chunky
              offset={-3}
              inset
              shadowVar="--color-wh-coin-dot-shadow"
              className="h-6 w-6 rounded-wh-pill bg-wh-primary"
            />
            <Text className="font-wh-heavy text-wh-md text-wh-text-primary">{coins}</Text>
          </Chunky>
        </Appear>

        {/* "Yours forever once you take one" — the whole business model, said
            once, before any price appears. */}
        <Appear delay={60} className="h-[52px] items-center justify-center px-[30px]">
          <Text className="text-center font-wh-regular text-[14.5px] text-wh-text-quiet">
            Fifty puzzles each, on a theme. Yours forever once you take one.
          </Text>
        </Appear>

        <ScrollView
          className="flex-1 px-[22px] pt-[2px]"
          contentContainerClassName="gap-[10px]"
          showsVerticalScrollIndicator={false}
        >
          {PACKS.map((pack, i) => (
            <Appear key={pack.id} index={i} delay={120}>
              <ChunkyPressable
                offset={4}
                shadowVar="--color-wh-surface-shadow"
                onPress={() =>
                  router.push({ pathname: '/pack/[id]', params: { id: pack.id } })
                }
                accessibilityRole="button"
                accessibilityLabel={`${pack.name}. ${pack.price}.`}
                className="overflow-hidden rounded-wh-xl bg-wh-surface"
              >
                {/* Same art band as `/packs`; same Android borderRadius note
                    applies, so the pressable carries overflow-hidden. */}
                <Image
                  source={pack.art}
                  resizeMode="cover"
                  className="h-[104px] w-full"
                  accessible={false}
                />

                <View className="gap-1 px-5 py-[16px]">
                  <View className="flex-row items-center gap-3">
                    <Text className="flex-1 font-wh-bold text-wh-lg text-wh-clue-text">
                      {pack.name}
                    </Text>

                    <Chunky
                      offset={3}
                      shadowVar="--color-wh-primary-shadow"
                      className="rounded-wh-sm bg-wh-primary px-3 py-[5px]"
                    >
                      <Text className="font-wh-bold text-wh-base text-wh-on-primary">
                        {pack.price}
                      </Text>
                    </Chunky>
                  </View>

                  <Text className="font-wh-regular text-[14.5px] leading-[20px] text-wh-chip-text">
                    {pack.blurb}
                  </Text>
                </View>
              </ChunkyPressable>
            </Appear>
          ))}

          {/* The bundle, once and quietly, last. It routes to the shop, where
              RevenueCat holds the real price and the single buy path lives. */}
          <Appear delay={120 + PACKS.length * 40}>
            <ChunkyPressable
              offset={3}
              inset
              shadowVar="--color-wh-answer-tile-empty-shadow"
              onPress={() => router.push('/shop')}
              accessibilityRole="button"
              accessibilityLabel={`${BUNDLE.name}, ${BUNDLE.price}`}
              className="h-[58px] flex-row items-center justify-center gap-[10px] rounded-[19px] bg-wh-answer-tile-empty"
            >
              <Text className="font-wh-bold text-[19px] text-wh-text-secondary dark:text-[#C6B7EC]">
                {BUNDLE.name}
              </Text>
              <Text className="font-wh-heavy text-wh-base text-wh-card-label dark:text-wh-text-quiet">
                {BUNDLE.price}
              </Text>
            </ChunkyPressable>
          </Appear>
        </ScrollView>
      </View>
    </View>
  );
}
