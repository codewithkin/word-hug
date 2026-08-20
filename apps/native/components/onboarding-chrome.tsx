import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { completeOnboarding } from '@/lib/storage';

/**
 * The header every onboarding step wears: five progress pips on the left, and
 * a way out on the right.
 *
 * Built from `designs/extracted/04-welcome`, `05-try-the-game`,
 * `06-the-ritual`, `07-notification-priming` and `08-drop-in`, all in both
 * themes. The row is 58px tall with 20px of horizontal padding on every one
 * of them.
 *
 * ── What the right-hand slot does, step by step ───────────────────────────
 * 4 Welcome            Skip pill
 * 5 Try the game       a round "?" help button — NOT Skip
 * 6 The ritual         Skip pill
 * 7 Notifications      Skip pill
 * 8 Drop in            nothing at all
 *
 * Step 8 dropping the escape hatch is deliberate and worth preserving: by
 * then the only button left says START, and skipping to the app and pressing
 * START go to exactly the same place. An empty slot is the design saying
 * there is nothing left to escape from.
 */

export const ONBOARDING_STEPS = 5;

/**
 * Where "Skip" and the final "START" both land.
 *
 * Session 7: the level map, not `/`. `/` is a redirect that re-reads the
 * onboarding flag, so replacing to it would work but would flash an extra
 * navigation on the way out of the flow.
 */
export const ONBOARDING_EXIT = '/home';

/**
 * Marks the flow done and leaves. Both exits call it — **skipping counts.**
 *
 * A person who skips has been shown the rule and the notification ask and has
 * declined both. Putting the same five screens in front of them tomorrow would
 * be overriding a decision they already made, which is the wrong side of rule
 * 1 even though rule 1 is written about puzzles.
 */
export function finishOnboarding() {
  completeOnboarding();
  router.replace(ONBOARDING_EXIT);
}

export function StepDots({ step }: { step: number }) {
  return (
    <View className="flex-row items-center gap-[6px]">
      {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
        <View
          key={i}
          className={
            i === step
              ? 'h-2 w-6 rounded-wh-pill bg-wh-primary'
              : 'h-2 w-3 rounded-wh-pill bg-wh-step-dot-inactive'
          }
        />
      ))}
    </View>
  );
}

export function SkipButton({ onPress }: { onPress?: () => void }) {
  return (
    <ChunkyPressable
      offset={3}
      shadowVar="--color-wh-surface-shadow"
      onPress={onPress ?? finishOnboarding}
      accessibilityRole="button"
      accessibilityLabel="Skip onboarding"
      className="rounded-wh-pill bg-wh-surface px-4 py-[9px]"
    >
      <Text className="font-wh-heavy text-wh-base text-wh-pill-text">Skip</Text>
    </ChunkyPressable>
  );
}

/** The round "?" on step 2. Opens How to Play once that screen exists. */
export function HelpButton({ onPress }: { onPress?: () => void }) {
  return (
    <ChunkyPressable
      offset={3}
      shadowVar="--color-wh-surface-shadow"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="How to play"
      className="h-[42px] w-[42px] items-center justify-center rounded-wh-md bg-wh-surface"
    >
      {/* textFaint in light, textSecondary in dark. The same real difference
          the Daily screen's menu icon has — not an oversight. */}
      <Text className="font-wh-bold text-wh-xl text-wh-text-faint dark:text-wh-text-secondary">
        ?
      </Text>
    </ChunkyPressable>
  );
}

export interface OnboardingHeaderProps {
  /** Zero-based, so step 4 Welcome is 0. */
  step: number;
  /** What sits on the right. Omit for step 8, which has nothing there. */
  right?: ReactNode;
}

export function OnboardingHeader({ step, right }: OnboardingHeaderProps) {
  return (
    <Appear rise={-6} className="h-[58px] flex-row items-center justify-between px-5">
      <StepDots step={step} />
      {right ?? null}
    </Appear>
  );
}

/**
 * The centred title-and-body block that carries every step's actual message.
 *
 * The line breaks in the titles are in the design and are kept: "Three words.
 * / One word that hugs / all three." is a three-beat sentence and reflowing it
 * to the device width turns it into a paragraph.
 */
export function StepCopy({
  title,
  body,
  delay = 0,
  titleSize = 34,
}: {
  title: string;
  body: string;
  delay?: number;
  /** 34px on steps 1, 3 and 4; 36px on step 5 and the error screen. */
  titleSize?: number;
}) {
  return (
    <Appear delay={delay} className="items-center gap-3">
      <Text
        className="text-center font-wh-bold text-wh-clue-text"
        style={{ fontSize: titleSize, lineHeight: titleSize * 1.12 }}
      >
        {title}
      </Text>
      <Text className="max-w-[270px] text-center font-wh-regular text-wh-md leading-6 text-wh-chip-text">
        {body}
      </Text>
    </Appear>
  );
}

/**
 * A tile with a letter in it, tilted. Steps 1 and 5 and the error screen all
 * draw a row of these; only the size, the colour and the angle change.
 */
export function LetterTile({
  letter,
  rotate,
  width,
  height,
  radius,
  fontSize,
  offset = 5,
  shadowVar,
  className,
  textClassName,
}: {
  letter: string;
  rotate: string;
  width: number;
  height: number;
  radius: number;
  fontSize: number;
  offset?: number;
  shadowVar: string;
  /**
   * The complete className for the tile, written out at the call site rather
   * than assembled here. Tailwind only emits a class it can see as a literal
   * string in the source, so a class built by concatenation may exist in the
   * JSX and not in the stylesheet.
   */
  className: string;
  textClassName: string;
}) {
  return (
    <Chunky
      offset={offset}
      shadowVar={shadowVar}
      className={className}
      style={{ width, height, borderRadius: radius, transform: [{ rotate }] }}
    >
      <Text className={textClassName} style={{ fontSize }}>
        {letter}
      </Text>
    </Chunky>
  );
}
