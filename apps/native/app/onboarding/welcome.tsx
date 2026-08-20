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
 * ── The line that had to change (session 7c) ──────────────────────────────
 * This said "No timer, no score, no way to lose" — eight words that were the
 * entire product strategy, and the second sentence a new player ever read.
 *
 * Sessions 7 and 7b made all three of them false. Hearts are a timer and a way
 * to be stopped; a wrong guess is now red and shakes. The owner chose both,
 * knowingly, and both are one constant away from being undone
 * (`HEARTS_ENABLED`, `WRONG_GUESS_FEEDBACK`).
 *
 * **A promise the app breaks four screens later is worse than no promise.** It
 * is also the kind of thing a store reviewer reads. So the copy now says what
 * is actually true — free daily puzzle, fifty free levels — and makes no claim
 * about what cannot happen. If hearts are ever switched off, the old line is
 * right here in this comment and worth putting back.
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
            body="A new one every day, free. Plus fifty levels to work through whenever you like."
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
