import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ChunkyPressable } from '@/components/chunky';
import { Sheet } from '@/components/sheet';
import { LEVEL_COUNT } from '@/lib/levels';
import { getHighestLevel } from '@/lib/storage';

/**
 * ── Overlay H · Caught up ─────────────────────────────────────────────────
 * Session 7. **Not the same thing as `/caught-up`**, which is the 09 alternate
 * state — the Daily screen when the day's puzzle is done. This is the overlay
 * for reaching the end of the *levels*.
 *
 * ── The hardest screen in the app to get right ────────────────────────────
 * A player who has finished 100 levels has done everything the product has.
 * Every instinct here is wrong:
 *
 * · A "come back tomorrow!" push notification prompt — no. Rule 1.
 * · A countdown to the next content drop — no. Nothing implies a clock.
 * · An upsell as the reward for finishing — no. Rule 3, and it would make the
 *   whole run feel like a funnel in retrospect.
 * · Endless procedurally generated levels to keep the number going up — no.
 *   The bank is curated and validated; an infinite tail of unvalidated
 *   puzzles would be the worst content bug in the app, at scale.
 *
 * What is left is the truth, said warmly: you finished, there is more coming,
 * and in the meantime the daily puzzle still arrives every morning. The packs
 * are mentioned once, last, in a sentence rather than a button — because
 * offering to sell someone something at the moment they run out is the exact
 * shape rule 3 exists to prevent.
 */
export default function AllCaughtUp() {
  const highest = getHighestLevel();

  return (
    <Sheet lift onDismiss={() => router.back()}>
      <Text className="font-wh-heavy text-wh-micro uppercase tracking-wh-label text-wh-text-quiet">
        That&apos;s all of them
      </Text>

      <Text className="font-wh-bold text-wh-h3 text-wh-clue-text">
        You&apos;ve finished all {LEVEL_COUNT}
      </Text>

      <Text className="font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
        {highest >= LEVEL_COUNT
          ? 'More are being written. There is no schedule and nothing to wait up for — they will just be here one morning.'
          : `You're on ${highest} of ${LEVEL_COUNT}. More are being written.`}
      </Text>

      <Text className="font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
        Today&apos;s puzzle still arrives every morning, free, the way it always has.
      </Text>

      <ChunkyPressable
        offset={5}
        shadowVar="--color-wh-primary-shadow"
        onPress={() => {
          router.back();
          router.push('/daily');
        }}
        accessibilityRole="button"
        accessibilityLabel="Play today's puzzle"
        className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary"
      >
        <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
          TODAY&apos;S PUZZLE
        </Text>
      </ChunkyPressable>

      {/* The packs, once, in a sentence, last. Not a button — offering to sell
          something at the moment someone runs out is the shape rule 3 exists
          to prevent. */}
      <Text className="text-center font-wh-regular text-[13.5px] leading-[19px] text-wh-text-whisper">
        There are fifty more in the packs, if you want them.
      </Text>
    </Sheet>
  );
}
