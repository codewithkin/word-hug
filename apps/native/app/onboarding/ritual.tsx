import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/actions';
import { Chunky } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { OnboardingHeader, SkipButton, StepCopy } from '@/components/onboarding-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';
import { localDate, weekdayName } from '@/lib/dates';

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
 * ── STATE (session 7) ─────────────────────────────────────────────────────
 * The week is real now. The owner reported it saying "Today is Thursday" at
 * 16:23 on a Wednesday — it was the design's own Thursday, written into the
 * file, and it would have said Thursday forever.
 *
 * The strip is built from the device's local calendar with the week starting
 * on Monday. Days before today are drawn as `played` even though nobody has
 * played them: this is the screen that explains what a week of the app looks
 * like, on the first day anyone opens it, so an accurate empty strip would
 * illustrate nothing. The real week lives on the Stats screen.
 * ──────────────────────────────────────────────────────────────────────────
 */

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * The week strip, Monday-first, with today in the right slot.
 *
 * `getDay()` is Sunday-based, so Sunday has to fold to the end rather than
 * sitting at the front. Getting this wrong puts "today" one column off, which
 * is exactly the class of bug that survives a code review and not a glance at
 * a real phone.
 */
function weekStrip(today: Date) {
  const mondayFirst = (today.getDay() + 6) % 7;
  return LABELS.map((label, i) => ({
    key: KEYS[i] ?? String(i),
    label,
    state: i < mondayFirst ? 'played' : i === mondayFirst ? 'today' : 'ahead',
  }));
}

export default function Ritual() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const WEEK = useMemo(() => weekStrip(today), [today]);

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

            <Text className="font-wh-bold text-wh-sm text-wh-text-whisper">
              Today is {weekdayName(localDate(today))}
            </Text>
          </Appear>

          <StepCopy
            delay={300}
            title={'One puzzle a day,\nabout a minute'}
            body="Miss a day and your streak just starts again — nothing else changes. The last seven stay open in the archive, so you can always catch up."
          />

          {/* ── The streak card ───────────────────────────────────────── */}
          <Appear delay={440} rise={10} className="w-full">
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="w-full flex-row items-center gap-[14px] rounded-wh-xl bg-wh-clue-card px-5 py-[18px]"
            >
              {/* The owner reported this reading as "no icon, just a circle",
                  and it was: a plain coral dot with an inset shadow. The
                  enamel-badge treatment is kept — it is the only upward inset
                  shadow in the app — but the dot now carries a mark so it
                  looks like a thing rather than a placeholder.

                  A spark, not a flame. A flame is the universal streak glyph
                  and it is exactly the wrong one here: this is the screen that
                  says "miss a day and nothing is taken from you", and a flame
                  is a picture of something that goes out. */}
              <View className="h-11 w-11 items-center justify-center rounded-wh-md bg-wh-highlight-wash">
                <Chunky
                  offset={-4}
                  inset
                  shadowVar="--color-wh-streak-dot-shadow"
                  className="h-7 w-7 items-center justify-center rounded-wh-pill bg-wh-highlight"
                >
                  <Text className="font-wh-heavy text-[13px] leading-[15px] text-white">✦</Text>
                </Chunky>
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
