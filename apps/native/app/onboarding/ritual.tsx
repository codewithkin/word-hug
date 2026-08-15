import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/actions';
import { Chunky } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { OnboardingHeader, SkipButton, StepCopy } from '@/components/onboarding-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 06 The Ritual · onboarding step 3 of 5 ────────────────────────────────
 * Built from `designs/extracted/06-the-ritual-light.html` and
 * `06-the-ritual-dark.html`, read in full, both themes.
 *
 * This is the screen where a normal puzzle game would introduce the streak as
 * a thing to protect. Read the copy again: "Miss a day and nothing is taken
 * from you." The week strip shows three days played, today waiting, and three
 * days that have not happened — and then the card underneath says the streak
 * is "the only number in the game", which is a boast about what is absent.
 *
 * If a future session is tempted to add a flame, a countdown to midnight, or
 * a "don't lose your streak!" line anywhere near this screen: that is rule 1,
 * and this screen is where it is stated out loud.
 *
 * STATE: none. The week is the design's Thursday, hard-coded. Wiring it to a
 * real calendar and a real solve history belongs with the storage layer.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** M T W T F S S, as the design draws it: three played, today, three ahead. */
const WEEK = [
  { key: 'mon', label: 'M', state: 'played' },
  { key: 'tue', label: 'T', state: 'played' },
  { key: 'wed', label: 'W', state: 'played' },
  { key: 'thu', label: 'T', state: 'today' },
  { key: 'fri', label: 'F', state: 'ahead' },
  { key: 'sat', label: 'S', state: 'ahead' },
  { key: 'sun', label: 'S', state: 'ahead' },
] as const;

export default function Ritual() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <OnboardingHeader step={2} right={<SkipButton />} />

        <View className="flex-1 items-center justify-center gap-8 px-7">
          {/* ── The week ──────────────────────────────────────────────────
              Teal for days already played, amber for today, plain surface
              for days that have not arrived. Nothing marks a missed day,
              because the design has no such state — there is nothing to
              mark. */}
          <Appear delay={80} className="items-center gap-[10px]">
            <View className="flex-row gap-[7px]">
              {WEEK.map(({ key, label, state }, i) =>
                state === 'played' ? (
                  <Appear key={key} index={i} delay={120} rise={6}>
                    <Chunky
                      offset={4}
                      shadowVar="--color-wh-accent-shadow"
                      className="h-[46px] w-10 items-center justify-center rounded-[13px] bg-wh-accent"
                    >
                      <Text className="font-wh-heavy text-wh-xs text-wh-on-accent">{label}</Text>
                    </Chunky>
                  </Appear>
                ) : state === 'today' ? (
                  <Appear key={key} index={i} delay={120} rise={6}>
                    <Chunky
                      offset={4}
                      shadowVar="--color-wh-primary-shadow"
                      className="h-[46px] w-10 items-center justify-center rounded-[13px] bg-wh-primary"
                    >
                      <Text className="font-wh-heavy text-wh-xs text-wh-on-primary">{label}</Text>
                    </Chunky>
                  </Appear>
                ) : (
                  <Appear key={key} index={i} delay={120} rise={6}>
                    <Chunky
                      offset={4}
                      shadowVar="--color-wh-surface-shadow"
                      className="h-[46px] w-10 items-center justify-center rounded-[13px] bg-wh-surface"
                    >
                      {/* #C0AE95 / #7C68B8. The dark value is `textWhisper`;
                          the light one is two shades warmer than it. One
                          screen, one pairing — written here rather than
                          given a name that implies it is shared. */}
                      <Text className="font-wh-heavy text-wh-xs text-[#C0AE95] dark:text-[#7C68B8]">
                        {label}
                      </Text>
                    </Chunky>
                  </Appear>
                )
              )}
            </View>

            <Text className="font-wh-bold text-wh-sm text-wh-text-whisper">Today is Thursday</Text>
          </Appear>

          <StepCopy
            delay={300}
            title={'One puzzle a day,\nabout a minute'}
            body="Miss a day and nothing is taken from you. The last seven stay open in the archive, so you can always catch up."
          />

          {/* ── The streak card ───────────────────────────────────────── */}
          <Appear delay={440} rise={10} className="w-full">
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="w-full flex-row items-center gap-[14px] rounded-wh-xl bg-wh-clue-card px-5 py-[18px]"
            >
              <View className="h-11 w-11 items-center justify-center rounded-wh-md bg-wh-highlight-wash">
                {/* The one ornament in the app with an UPWARD inset shadow —
                    `inset 0 -4px 0` — which is what gives it the pressed
                    enamel-badge look rather than a flat dot. */}
                <Chunky
                  offset={-4}
                  inset
                  shadowVar="--color-wh-streak-dot-shadow"
                  className="h-5 w-5 rounded-wh-pill bg-wh-highlight"
                />
              </View>
              <Text className="flex-1 font-wh-regular text-[14.5px] leading-[21px] text-wh-chip-text">
                Play on consecutive days and a small streak count appears. That&apos;s the only
                number in the game.
              </Text>
            </Chunky>
          </Appear>
        </View>

        <Appear delay={560} rise={12} className="px-6 pb-[10px]">
          <PrimaryButton
            label="CONTINUE"
            accessibilityLabel="Continue"
            onPress={() => router.push('/onboarding/notifications')}
          />
        </Appear>
      </View>
    </View>
  );
}
