import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, QuietLink } from '@/components/actions';
import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { OnboardingHeader, SkipButton, StepCopy } from '@/components/onboarding-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';
import { parseTime, requestNotificationPermission, scheduleDailyNudge } from '@/lib/notifications';
import { getReminder, setReminder } from '@/lib/storage';

/**
 * ── 07 Notification Priming · onboarding step 4 of 5 ──────────────────────
 * Built from `designs/extracted/07-notification-priming-light.html` and
 * `07-notification-priming-dark.html`, read in full, both themes.
 *
 * The only screen in the app that asks for a permission, and it does the
 * three honest things first: it shows the exact notification that will
 * arrive, it lets the person choose when, and it says in the body copy that
 * this is the only thing that will ever be sent — "no streak warnings, no
 * offers". Then "Not now" sits under the button in plain sight.
 *
 * The mock notification is a real preview, not decoration: it uses the same
 * three clue words as step 2, so the person recognises what they just solved.
 *
 * ── Colours written inline on this screen ─────────────────────────────────
 * Three pairings appear here and nowhere else, so they are literal rather
 * than tokenised:
 *   "now"           #B0A08A / #8F79D4
 *   preview body    #6E5B44 / #C6B7EC
 *   idle chip text  #8C7A66 / #B6A4E4
 * Each is `light / dark`. Light and dark pair these differently from every
 * existing token, which is exactly why inventing a shared name for them would
 * be wrong.
 *
 * ── STATE ─────────────────────────────────────────────────────────────────
 * ALLOW asks the OS for permission and, if it is given, schedules the daily
 * reminder at the selected time through `lib/notifications`. It continues
 * either way — a refusal is not a failure state, and the flow must not
 * dead-end on one.
 *
 * The chosen time is still only local state. The OS holds the schedule itself,
 * so the reminder survives without us, but **Settings cannot show what was
 * chosen and cannot change it** until the storage layer lands
 * (react-native-mmkv, installed and still unused).
 * ──────────────────────────────────────────────────────────────────────────
 */

const TIMES = ['7:00', '9:00', '18:00'];

/** What "Other" cycles through. Deliberately short — this is not a clock. */
const OTHER_TIMES = ['6:00', '8:00', '10:00', '12:00', '20:00', '21:00'];

export default function NotificationPriming() {
  const insets = useSafeAreaInsets();
  // Seeded from storage so re-entering the step shows what was chosen last
  // time rather than snapping back to the default.
  const [selected, setSelected] = useState(() => {
    const { time } = getReminder();
    return (
      [...TIMES, ...OTHER_TIMES].find((t) => t.padStart(5, '0') === time) ?? '9:00'
    );
  });

  /** Steps to the next "other" time, entering the list at its start. */
  function cycleOther() {
    const at = OTHER_TIMES.indexOf(selected);
    setSelected(OTHER_TIMES[(at + 1) % OTHER_TIMES.length] ?? OTHER_TIMES[0] ?? '8:00');
  }

  async function allow() {
    // Every call below is defensive by construction (see `lib/notifications`):
    // a refused permission, or no notifications module at all, is fine — the
    // daily nudge is a nicety and the game works without it. Nothing here is
    // allowed to be the reason someone cannot get past onboarding.
    const outcome = await requestNotificationPermission();
    const granted = outcome === 'granted';

    if (granted) {
      const at = parseTime(selected);
      if (at) await scheduleDailyNudge(at.hour, at.minute);
    }

    // Remembered either way. The OS owns the schedule; storage owns what the
    // person chose, so Settings can show "09:00" and offer to turn it on
    // rather than showing nothing and looking like it forgot.
    setReminder(granted, selected);

    router.push('/onboarding/drop-in');
  }

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <OnboardingHeader step={3} right={<SkipButton />} />

        <View className="flex-1 items-center justify-center gap-[30px] px-[26px]">
          {/* ── The notification, as it will actually look ─────────────── */}
          <Appear delay={80} rise={-8} className="w-full">
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="w-full flex-row items-start gap-[14px] rounded-wh-xl bg-wh-clue-card p-4"
            >
              <Chunky
                offset={3}
                shadowVar="--color-wh-primary-shadow"
                className="h-11 w-11 items-center justify-center rounded-[13px] bg-wh-primary"
              >
                <Text className="font-wh-bold text-wh-xxl text-wh-on-primary">H</Text>
              </Chunky>

              <View className="flex-1 gap-[3px]">
                <View className="flex-row items-baseline justify-between">
                  <Text className="font-wh-heavy text-wh-base text-wh-clue-text">Word Hug</Text>
                  <Text className="font-wh-bold text-wh-xs text-[#B0A08A] dark:text-[#8F79D4]">
                    now
                  </Text>
                </View>
                <Text className="font-wh-regular text-[14.5px] leading-[20px] text-[#6E5B44] dark:text-[#C6B7EC]">
                  Today&apos;s three words are up. SUN, MOON, DAY — what hugs them?
                </Text>
              </View>
            </Chunky>
          </Appear>

          <StepCopy
            delay={260}
            title={'One nudge a day,\nat a time you pick'}
            body="That's the only thing we ever send. No streak warnings, no offers."
          />

          {/* ── When ──────────────────────────────────────────────────────
              Three sensible times and a way out of them. "Other" has nowhere
              to go until there is a time picker; it selects like the rest so
              the row is never in a state with nothing chosen. */}
          <Appear delay={400} rise={10} className="flex-row gap-[9px]">
            {TIMES.map((time) =>
              time === selected ? (
                <ChunkyPressable
                  key={time}
                  offset={4}
                  shadowVar="--color-wh-primary-shadow"
                  onPress={() => setSelected(time)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: true }}
                  accessibilityLabel={`Remind me at ${time}, selected`}
                  className="rounded-wh-card bg-wh-primary px-5 py-[14px]"
                >
                  <Text className="font-wh-bold text-[19px] text-wh-on-primary">{time}</Text>
                </ChunkyPressable>
              ) : (
                <ChunkyPressable
                  key={time}
                  offset={4}
                  shadowVar="--color-wh-surface-shadow"
                  onPress={() => setSelected(time)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: false }}
                  accessibilityLabel={`Remind me at ${time}`}
                  className="rounded-wh-card bg-wh-surface px-5 py-[14px]"
                >
                  <Text className="font-wh-bold text-[19px] text-[#8C7A66] dark:text-[#B6A4E4]">
                    {time}
                  </Text>
                </ChunkyPressable>
              )
            )}

            {/* ── "Other" ──────────────────────────────────────────────
                The owner reported this doing nothing, which it did — the
                design's comment even said so ("Other has nowhere to go until
                there is a time picker").

                It cycles through the remaining sensible hours rather than
                opening a platform picker. `@react-native-community/datetimepicker`
                is not installed, and adding a native module to make one
                onboarding control work would mean a new dev build for the
                owner mid-session. Tapping steps 06:00 → 08:00 → 10:00 → 12:00
                → 20:00 → 21:00 and wraps, which covers the times a person
                actually asks for and needs no dependency.

                If a real clock face is wanted later, this is the one call
                site to change. */}
            <ChunkyPressable
              offset={4}
              shadowVar={
                OTHER_TIMES.includes(selected)
                  ? '--color-wh-primary-shadow'
                  : '--color-wh-surface-shadow'
              }
              onPress={cycleOther}
              accessibilityRole="button"
              accessibilityLabel={
                OTHER_TIMES.includes(selected)
                  ? `Reminder at ${selected}. Tap for another time.`
                  : 'Choose another time'
              }
              className={
                OTHER_TIMES.includes(selected)
                  ? 'justify-center rounded-wh-card bg-wh-primary px-[18px] py-[14px]'
                  : 'justify-center rounded-wh-card bg-wh-surface px-[18px] py-[14px]'
              }
            >
              <Text
                className={
                  OTHER_TIMES.includes(selected)
                    ? 'font-wh-bold text-[19px] text-wh-on-primary'
                    : 'font-wh-heavy text-wh-base text-[#8C7A66] dark:text-[#B6A4E4]'
                }
              >
                {OTHER_TIMES.includes(selected) ? selected : 'Other'}
              </Text>
            </ChunkyPressable>
          </Appear>
        </View>

        <Appear delay={540} rise={12} className="items-center gap-3 px-6 pb-[10px]">
          <View className="w-full">
            <PrimaryButton label="ALLOW" accessibilityLabel="Allow notifications" onPress={allow} />
          </View>
          <QuietLink label="Not now" onPress={() => router.push('/onboarding/drop-in')} />
        </Appear>
      </View>
    </View>
  );
}
