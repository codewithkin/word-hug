import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Sheet } from '@/components/sheet';
import { BUNDLE } from '@/content/packs';

/**
 * ── Overlay D · Welcome offer ─────────────────────────────────────────────
 * Session 7. No design file — assembled from the sheet and overlay C's
 * manners.
 *
 * **This is the overlay most likely to turn Word Hug into a different
 * product, so it is worth being explicit about what it does not do.**
 *
 * It has no countdown. `systems/monetization.md` describes a 48-hour window,
 * and a window is fine — a *timer on screen* is not, because rule 1 forbids
 * anything that implies a clock and this is the exact place a growth team
 * would put one. The window is enforced in storage; the player is told "for
 * your first couple of days" and nothing ticks.
 *
 * It has no strikethrough price, no "50% OFF" flash, no confetti, no
 * pre-selected tier and no second chance. **Dismissed means gone forever** —
 * `offer.dismissed` in `systems/storage-persistence.md` §3.1 — because an
 * offer that comes back after you said no is not an offer.
 *
 * ── Not shown to anyone yet ───────────────────────────────────────────────
 * Nothing triggers this. It is reachable from the shop and from the
 * scaffolding row so it can be looked at. **Before it is triggered
 * automatically it needs the owner's decision on when**, and the honest
 * options are narrow: not during onboarding, not on a puzzle screen, and not
 * on the first session. `systems/monetization.md` says second visit; that is
 * the one to argue about.
 */
export default function WelcomeOffer() {
  return (
    <Sheet lift onDismiss={() => router.back()}>
      <Text className="font-wh-heavy text-wh-micro uppercase tracking-wh-label text-wh-text-quiet">
        While you&apos;re new
      </Text>

      <Text className="font-wh-bold text-wh-h3 text-wh-clue-text">
        All five packs, at a lower price
      </Text>

      <Text className="font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
        Fifty extra puzzles across five themes. This price is here for your first couple of
        days, and then it isn&apos;t — but nothing about the game changes either way.
      </Text>

      <ChunkyPressable
        offset={5}
        shadowVar="--color-wh-primary-shadow"
        // Not a real purchase. RevenueCat is unconfigured and the price is a
        // placeholder — see `content/packs.ts`.
        onPress={() => router.replace('/store-unreachable')}
        accessibilityRole="button"
        accessibilityLabel={`${BUNDLE.name} for ${BUNDLE.price}`}
        className="h-[58px] flex-row items-center justify-center gap-3 rounded-[19px] bg-wh-primary"
      >
        <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
          {BUNDLE.price}
        </Text>
        <View className="h-[6px] w-[6px] rounded-wh-pill bg-wh-on-primary" />
        <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
          GET ALL FIVE
        </Text>
      </ChunkyPressable>

      {/* A full-width button of the same height, not a grey link in a corner.
          Declining is a first-class action — the same decision overlay C
          makes with "Not now". */}
      <ChunkyPressable
        offset={4}
        shadowVar="--color-wh-surface-shadow"
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="No thanks"
        className="h-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
      >
        <Text className="font-wh-bold text-wh-xl text-wh-text-muted dark:text-wh-pill-text">
          No thanks
        </Text>
      </ChunkyPressable>

      <Chunky offset={0} shadowVar="--color-wh-surface-shadow" className="items-center">
        <Text className="text-center font-wh-regular text-[13.5px] leading-[19px] text-wh-text-whisper">
          The daily puzzle and the first levels stay free whatever you pick.
        </Text>
      </Chunky>
    </Sheet>
  );
}
