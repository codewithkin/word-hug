import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';

/**
 * The header the four alternate states of the Daily screen share: a menu
 * button, a coin pill, and a help button.
 *
 * Built from `designs/extracted/09-solved-today-{light,dark}.html`,
 * `09-wrong-guess-{light,dark}.html`, `09-near-miss-{light,dark}.html` and
 * `09-caught-up-{light,dark}.html`, all eight read in full.
 *
 * ── This is NOT the header on the Daily screen itself ─────────────────────
 * Screen 09 draws a menu button on the left and a *pair* of pills on the right
 * — coins and streak — with no help button. All four alternate states draw
 * menu, coins, help, evenly spread, and no streak at all. That is a real
 * difference in the export and it is reproduced rather than reconciled: on a
 * screen where a guess has just been made, the streak is the one number nobody
 * needs to be looking at.
 *
 * When these four become states of `app/index.tsx` rather than routes of their
 * own, this is the header that state uses, and the two-pill version stays on
 * the untouched board.
 */
export function DailyAltHeader({
  coins = '12',
  onMenu,
  onHelp,
}: {
  coins?: string;
  onMenu?: () => void;
  onHelp?: () => void;
}) {
  return (
    <Appear rise={-6} className="h-[60px] flex-row items-center justify-between px-[18px] pt-[6px]">
      <ChunkyPressable
        offset={3}
        shadowVar="--color-wh-surface-shadow"
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel="Menu"
        className="h-[46px] w-[46px] items-center justify-center gap-1 rounded-wh-card bg-wh-surface"
      >
        {/* Three 16x2 bars. `textFaint` in light, `textMuted` in dark — the
            same swap the back chevron makes elsewhere, and a real one: dark's
            `textFaint` (#6B5DA6) would disappear into the surface. */}
        <View className="h-[2px] w-4 rounded-[1px] bg-wh-text-faint dark:bg-wh-text-muted" />
        <View className="h-[2px] w-4 rounded-[1px] bg-wh-text-faint dark:bg-wh-text-muted" />
        <View className="h-[2px] w-4 rounded-[1px] bg-wh-text-faint dark:bg-wh-text-muted" />
      </ChunkyPressable>

      <Chunky
        offset={3}
        shadowVar="--color-wh-surface-shadow"
        className="h-[42px] flex-row items-center gap-2 rounded-wh-pill bg-wh-surface pl-[10px] pr-[14px]"
      >
        <Chunky
          offset={-3}
          inset
          shadowVar="--color-wh-coin-dot-shadow"
          className="h-6 w-6 rounded-wh-pill bg-wh-primary"
        />
        <Text className="font-wh-heavy text-wh-md text-wh-text-primary">{coins}</Text>
      </Chunky>

      <ChunkyPressable
        offset={3}
        shadowVar="--color-wh-surface-shadow"
        onPress={onHelp ?? (() => router.push('/how-to-play'))}
        accessibilityRole="button"
        accessibilityLabel="How to play"
        className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
      >
        <Text className="font-wh-bold text-wh-xl text-wh-text-faint dark:text-wh-text-secondary">
          ?
        </Text>
      </ChunkyPressable>
    </Appear>
  );
}

/** The date line under the header. 12px, heavy, widely tracked, uppercase. */
export function DailyEyebrow({ children }: { children: string }) {
  return (
    <Appear delay={60} className="h-[30px] items-center justify-center">
      <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
        {children}
      </Text>
    </Appear>
  );
}

/**
 * The footer line opposite the Nudge pill on the guess states: a coral dot and
 * a streak count.
 *
 * Note what it does not say. It is "12 day streak", not "12 day streak — don't
 * break it". There is no flame, no warning colour and no countdown to
 * midnight. The dot is `highlight`, which is a warm coral for emphasis and is
 * explicitly not an error or urgency colour (D-002).
 */
export function StreakNote({ children }: { children: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-[9px] w-[9px] rounded-wh-pill bg-wh-highlight" />
      <Text className="font-wh-heavy text-wh-sm text-wh-text-quiet dark:text-wh-pill-text">
        {children}
      </Text>
    </View>
  );
}
