import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/actions';
import { Appear } from '@/components/motion';
import { OnboardingHeader, SkipButton, StepCopy } from '@/components/onboarding-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';
import { Wordmark } from '@/components/wordmark';

/**
 * ── 04 Welcome · onboarding step 1 of 5 ───────────────────────────────────
 * Built from `designs/extracted/04-welcome-light.html` and
 * `04-welcome-dark.html`, read in full, both themes.
 *
 * The first screen of the product: the rule, and what it costs.
 *
 * ── The line that left and came back (sessions 7c and 8) ──────────────────
 * This said "No timer, no score, no way to lose" — eight words that were the
 * entire product strategy, and the second sentence a new player ever read.
 *
 * Session 7 added hearts, which made it false: a meter that empties is a timer
 * and a way to be stopped. The copy was pulled rather than left to lie, because
 * a promise the app breaks four screens later is worse than no promise, and
 * because it is the kind of thing a store reviewer reads.
 *
 * Session 8 removed hearts, so **the line is back** — and it is true again.
 * Nothing in this app can now stop you playing: no meter, no cooldown, no
 * attempt cap, no fail screen.
 *
 * One caveat kept it honest before it was restored: a wrong guess does go red
 * and shake (`WRONG_GUESS_FEEDBACK`). That is feedback and not a loss — the
 * board is ready again in the same frame, and nothing is taken. "No way to
 * lose" survives it. If a fail state is ever added back, this line comes out
 * again, first.
 *
 * The screen is the wordmark, that sentence, and one button. There is no
 * account, no "choose your difficulty", no carousel of features — a tired
 * parent with four minutes should be able to get past this screen without
 * making a single decision.
 *
 * MOTION: the mark assembles letter by letter, WORD then HUG, and the copy
 * and button arrive under it. That is the only thing on this screen that
 * moves, and it moves once.
 * ──────────────────────────────────────────────────────────────────────────
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <OnboardingHeader step={0} right={<SkipButton />} />

        <View className="flex-1 items-center justify-center gap-[34px] px-[30px]">
          <Wordmark animate gap={12} delay={80} />

          <StepCopy
            delay={420}
            title={'Three words.\nOne word that hugs\nall three.'}
            body="A new one every day, free, plus fifty levels to work through. No timer, no score, no way to lose."
          />
        </View>

        <Appear delay={560} rise={12} className="px-6 pb-[10px]">
          <PrimaryButton
            label="CONTINUE"
            accessibilityLabel="Continue"
            onPress={() => router.push('/onboarding/try-the-game')}
          />
        </Appear>
      </View>
    </View>
  );
}
