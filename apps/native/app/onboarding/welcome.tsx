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
 * The first screen of the product, and it does something unusual for a puzzle
 * game: it explains the rule and then immediately promises what it will never
 * do. "No timer, no score, no way to lose" is the entire product strategy in
 * eight words, and it is on screen before anything is asked of anyone.
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
            body="A new one every day. No timer, no score, no way to lose."
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
