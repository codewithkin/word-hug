import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/actions';
import { Appear } from '@/components/motion';
import { LetterTile, ONBOARDING_EXIT, OnboardingHeader, StepCopy } from '@/components/onboarding-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 08 Drop In · onboarding step 5 of 5 ───────────────────────────────────
 * Built from `designs/extracted/08-drop-in-light.html` and
 * `08-drop-in-dark.html`, read in full, both themes.
 *
 * LIGHT spelled out in teal — the word the person just solved on step 2 —
 * over "That's the whole game". Four screens of onboarding and the last one
 * says there is nothing more to learn.
 *
 * Two details from the design worth keeping:
 *
 * · The header has NO Skip. It is the only step without one, because START
 *   and Skip would go to the same place; an empty right-hand slot is the
 *   design saying there is nothing left to escape from.
 * · The tiles are teal (`accent`), not amber. Amber is the colour of the
 *   thing you press; teal is the colour of a thing that is done. The week
 *   strip on step 3 uses it the same way.
 * ──────────────────────────────────────────────────────────────────────────
 */

const SOLVED = [
  { letter: 'L', rotate: '-4deg' },
  { letter: 'I', rotate: '3deg' },
  { letter: 'G', rotate: '-2deg' },
  { letter: 'H', rotate: '4deg' },
  { letter: 'T', rotate: '-3deg' },
];

export default function DropIn() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <OnboardingHeader step={4} />

        <View className="flex-1 items-center justify-center gap-[30px] px-[30px]">
          <View className="flex-row gap-2">
            {SOLVED.map(({ letter, rotate }, i) => (
              <Appear key={letter} index={i} delay={80} rise={10}>
                <LetterTile
                  letter={letter}
                  rotate={rotate}
                  width={54}
                  height={64}
                  radius={17}
                  fontSize={32}
                  shadowVar="--color-wh-accent-shadow"
                  className="items-center justify-center bg-wh-accent"
                  textClassName="font-wh-bold text-wh-on-accent"
                />
              </Appear>
            ))}
          </View>

          <StepCopy
            delay={420}
            titleSize={36}
            title="That's the whole game"
            body="Today's puzzle is waiting. Tomorrow's arrives in the morning."
          />
        </View>

        <Appear delay={560} rise={12} className="px-6 pb-[10px]">
          {/* `replace`, not `push`: once the flow is over there is nothing
              behind it worth going back to, and a back gesture from the Daily
              screen should leave the app, not re-enter onboarding. */}
          <PrimaryButton
            label="START"
            accessibilityLabel="Start playing"
            onPress={() => router.replace(ONBOARDING_EXIT)}
          />
        </Appear>
      </View>
    </View>
  );
}
