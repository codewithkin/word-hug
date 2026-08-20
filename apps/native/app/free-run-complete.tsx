import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Sheet } from '@/components/sheet';
import { PACKS } from '@/content/packs';
import { LEVEL_COUNT } from '@/lib/levels';

/**
 * ── The end of the free run ───────────────────────────────────────────────
 * Shown once, when level 50 is solved. Session 7c, at the owner's request.
 *
 * This is the only place in Word Hug that offers to sell something without
 * being asked, so it is worth being exact about what it does.
 *
 * **It is not on a puzzle screen.** It fires after the solve celebration is
 * dismissed, on the way back to the map — rule 3 is "never interrupt the
 * solve", and the solve is over by then.
 *
 * **It shows once, ever.** `offer.freeRunShown` in storage. An offer that
 * comes back every time you open the map is not an offer, it is a nag.
 *
 * **There is no price in the copy.** The owner asked for "$1.99", and the
 * honest version of that is a button to the shop: the app prices in £, the
 * numbers in `content/packs.ts` are placeholders until RevenueCat is wired,
 * and a hard-coded price shown to the wrong region is a store-review problem.
 * The shop shows real prices the moment there are any.
 *
 * **"They're really fun" stays.** It is the owner's line, it is warm rather
 * than salesy, and it is the closest this product comes to a boast.
 *
 * ── What it must never grow ───────────────────────────────────────────────
 * A countdown. A discount badge. A "limited time". A second showing. Any of
 * those turns finishing the free run — which should feel like an achievement —
 * into the moment the game started selling.
 */
export default function FreeRunComplete() {
  return (
    <Sheet lift onDismiss={() => router.back()}>
      <Text className="font-wh-heavy text-wh-micro uppercase tracking-wh-label text-wh-text-quiet">
        That&apos;s all {LEVEL_COUNT}
      </Text>

      <Text className="font-wh-bold text-wh-h3 text-wh-clue-text">
        You&apos;ve played every free level
      </Text>

      <Text className="font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
        More are being written — there&apos;s no schedule and nothing to wait up for, they&apos;ll
        just be here one morning. In the meantime there are five packs, fifty puzzles each, and
        they&apos;re really fun.
      </Text>

      {/* The five, named, so "packs" means something before they tap. Each in
          its own tint — the same recolour the pack itself uses. */}
      <View className="flex-row flex-wrap gap-2">
        {PACKS.map((pack) => (
          <Chunky
            key={pack.id}
            offset={3}
            shadowVar={pack.tint.shadowVar}
            className={`rounded-wh-pill px-3 py-[6px] ${pack.tint.fill}`}
          >
            <Text className={`font-wh-heavy text-wh-xs ${pack.tint.on}`}>{pack.name}</Text>
          </Chunky>
        ))}
      </View>

      <ChunkyPressable
        offset={5}
        shadowVar="--color-wh-primary-shadow"
        onPress={() => {
          router.back();
          router.push('/shop');
        }}
        accessibilityRole="button"
        accessibilityLabel="Take a look at the packs"
        className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary"
      >
        <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
          TAKE A LOOK
        </Text>
      </ChunkyPressable>

      {/* Full width, same height as the button above it. Declining is a
          first-class action — the decision overlay C already makes. */}
      <ChunkyPressable
        offset={4}
        shadowVar="--color-wh-surface-shadow"
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Not now"
        className="h-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
      >
        <Text className="font-wh-bold text-wh-xl text-wh-text-muted dark:text-wh-pill-text">
          Not now
        </Text>
      </ChunkyPressable>

      <Text className="text-center font-wh-regular text-[13.5px] leading-[19px] text-wh-text-whisper">
        Today&apos;s puzzle still arrives every morning, free, the way it always has.
      </Text>
    </Sheet>
  );
}
