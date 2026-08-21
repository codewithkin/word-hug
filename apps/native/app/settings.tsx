import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky } from '@/components/chunky';
import { Appear, MOTION, animate } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { cancelDailyNudge, parseTime, scheduleDailyNudge } from '@/lib/notifications';
import {
  getHaptics,
  getReminder,
  getSound,
  setHaptics,
  setReminder,
  setSound,
} from '@/lib/storage';
import { ScreenHeader } from '@/components/screen-header';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

/**
 * ── 16 Settings ───────────────────────────────────────────────────────────
 * Built from `designs/extracted/16-settings-light.html` and
 * `16-settings-dark.html`, read in full, both themes.
 *
 * Four cards: Play, Reminder, Progress & purchases, About. Count what is NOT
 * here — no account, no sign-in, no "sync", no data-sharing toggle, no
 * personalised-ads switch, no notification categories to wade through. There
 * is nothing to opt out of because there is nothing collecting anything
 * (rule 5). The whole screen fits on one phone without scrolling, which is
 * itself the statement.
 *
 * The three toggles are all shown ON, as the design draws them.
 *
 * ── STATE ─────────────────────────────────────────────────────────────────
 * The toggles are local state and persist nothing — `react-native-mmkv` is
 * installed and unused, and this screen is one of the two reasons it exists
 * (the first-launch flag is the other). Sound, haptics and the reminder time
 * all need to survive a relaunch to mean anything, so wire them in the same
 * change that adds storage, not before.
 *
 * The rows that navigate go where they say; the three external links open in
 * the browser. Restore purchases has nothing to restore until RevenueCat is
 * wired, so it is deliberately inert rather than faking a result.
 * ──────────────────────────────────────────────────────────────────────────
 */

/**
 * The site. Privacy and terms live here, and both stores require them at a
 * public URL.
 *
 * Session 8b: was `https://wordhug.app`, a domain nobody owns. A store
 * reviewer following a settings link to a parked page is a rejection, and it
 * would have been found by them rather than by us.
 */
const WEB = 'https://wordhug.gamesforstrangers.lol';

/** The card every section sits in. */
function Card({ children }: { children: ReactNode }) {
  return (
    <Chunky
      offset={4}
      shadowVar="--color-wh-clue-card-shadow"
      className="rounded-wh-lg bg-wh-clue-card px-[18px] py-[2px]"
    >
      {children}
    </Chunky>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="pl-1 font-wh-heavy text-wh-micro uppercase tracking-wh-label text-wh-text-quiet">
      {children}
    </Text>
  );
}

/**
 * One row. `last` drops the divider, because a line under the final row of a
 * card reads as a card that got cut off.
 */
function Row({
  label,
  right,
  onPress,
  last,
  compact,
}: {
  label: string;
  right: ReactNode;
  onPress?: () => void;
  last?: boolean;
  /** The About card's rows are 42px; everything else is 46px. */
  compact?: boolean;
}) {
  const body = (
    <View
      className={
        last
          ? 'flex-row items-center justify-between'
          : 'flex-row items-center justify-between border-b-[1.5px] border-wh-row-divider'
      }
      style={{ height: compact ? 42 : 46 }}
    >
      <Text className="font-wh-bold text-[16.5px] text-wh-clue-text">{label}</Text>
      {right}
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/**
 * The toggle.
 *
 * Amber when on, `surfaceQuiet` when off, with the knob sliding 24px. The
 * inset shadow on the track is the same in both themes — it is the amber
 * casting onto itself, not a colour that belongs to a theme.
 *
 * The design only ever draws these ON, so the OFF appearance is the one
 * genuine invention on this screen: the track becomes the same recessive fill
 * used everywhere else for "present but not active", and the knob keeps its
 * colour. Flag it on device.
 */
function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  const x = useSharedValue(value ? 24 : 0);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Pressable
      onPress={() => {
        x.value = animate(MOTION.release, value ? 0 : 24);
        onChange();
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <Chunky
        offset={-3}
        inset
        shadowVar="--color-wh-toggle-track-shadow"
        className={
          value
            ? 'h-8 w-14 justify-center rounded-wh-pill bg-wh-primary px-1'
            : 'h-8 w-14 justify-center rounded-wh-pill bg-wh-surface-quiet px-1'
        }
      >
        <Animated.View style={knob} className="h-6 w-6 rounded-wh-pill bg-wh-toggle-knob" />
      </Chunky>
    </Pressable>
  );
}

function Chevron() {
  return (
    <Text className="pb-[3px] font-wh-bold text-wh-xl leading-none text-wh-disclosure">›</Text>
  );
}

function External() {
  return <Text className="font-wh-heavy text-[15px] text-wh-disclosure">↗</Text>;
}

export default function Settings() {
  const insets = useSafeAreaInsets();

  // Seeded from storage, written on every change. Session 6: these three were
  // local state that persisted nothing, which is why the design's "all on"
  // default survived a relaunch and looked correct while being a lie.
  const [sound, setSoundState] = useState(getSound);
  const [haptics, setHapticsState] = useState(getHaptics);
  const [reminder, setReminderState] = useState(() => getReminder().enabled);
  const [reminderTime] = useState(() => getReminder().time);

  // Written side by side rather than from inside the state updater: an
  // updater must be a pure function of the previous state, and React may call
  // it twice. A doubled MMKV write is harmless; a doubled `cancelDailyNudge`
  // below would not be, so all three follow the same shape.
  const toggleSound = () => {
    const next = !sound;
    setSoundState(next);
    setSound(next);
  };

  const toggleHaptics = () => {
    const next = !haptics;
    setHapticsState(next);
    setHaptics(next);
  };

  /**
   * The toggle owns the OS schedule as well as the flag. Turning it off has to
   * actually cancel the notification — a switch that says "off" while the
   * reminder still arrives tomorrow morning is the single most annoying bug
   * this screen could have.
   */
  const toggleReminder = () => {
    const next = !reminder;
    setReminderState(next);
    setReminder(next, reminderTime);

    if (next) {
      const at = parseTime(reminderTime);
      if (at) void scheduleDailyNudge(at.hour, at.minute);
    } else {
      void cancelDailyNudge();
    }
  };

  const open = (path: string) => {
    Linking.openURL(`${WEB}${path}`).catch(() => {
      // No browser, or the URL was refused. Nothing here is worth an alert.
    });
  };

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="SETTINGS" />

        <ScrollView
          className="flex-1 px-5 pt-[6px]"
          contentContainerClassName="gap-3 pb-4"
          showsVerticalScrollIndicator={false}
        >
          <Appear delay={80} className="gap-[6px]">
            <SectionLabel>Play</SectionLabel>
            <Card>
              <Row
                label="Sound"
                right={
                  <Toggle value={sound} onChange={toggleSound} label="Sound" />
                }
              />
              <Row
                label="Haptics"
                last
                right={
                  <Toggle value={haptics} onChange={toggleHaptics} label="Haptics" />
                }
              />
            </Card>
          </Appear>

          <Appear delay={150} className="gap-[6px]">
            <SectionLabel>Reminder</SectionLabel>
            <Card>
              <Row
                label="Daily reminder"
                right={
                  <Toggle value={reminder} onChange={toggleReminder} label="Daily reminder" />
                }
              />
              <Row
                label="Time"
                last
                right={
                  <View className="rounded-wh-md bg-wh-surface-quiet px-4 py-2">
                    {/* #6E5B44 / #C6B7EC — this screen only. */}
                    <Text className="font-wh-bold text-[18px] text-[#6E5B44] dark:text-[#C6B7EC]">
                      {reminderTime}
                    </Text>
                  </View>
                }
              />
            </Card>
          </Appear>

          <Appear delay={220} className="gap-[6px]">
            <SectionLabel>Progress &amp; purchases</SectionLabel>
            <Card>
              <Row label="Stats" onPress={() => router.push('/stats')} right={<Chevron />} />
              <Row
                label="Restore purchases"
                right={
                  <Text className="font-wh-heavy text-wh-sm-alt text-wh-text-quiet">
                    Tap to check
                  </Text>
                }
              />
              <Row label="Shop" last right={<Chevron />} />
            </Card>
          </Appear>

          <Appear delay={290} className="gap-[6px]">
            <SectionLabel>About</SectionLabel>
            <Card>
              <Row
                label="How to Play"
                compact
                onPress={() => router.push('/how-to-play')}
                right={<Chevron />}
              />
              <Row
                label="Privacy Policy"
                compact
                onPress={() => open('/privacy')}
                right={<External />}
              />
              <Row
                label="Terms of Service"
                compact
                onPress={() => open('/terms')}
                right={<External />}
              />
              <Row label="Support" compact last onPress={() => open('/support')} right={<External />} />
            </Card>
            <Text className="pt-1 text-center font-wh-bold text-wh-sm text-wh-text-whisper">
              Word Hug 1.0.0
            </Text>
          </Appear>
        </ScrollView>
      </View>
    </View>
  );
}
