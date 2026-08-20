import { type ReactNode, useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * ── The motion layer ──────────────────────────────────────────────────────
 *
 * Every animation in Word Hug goes through this file, for two reasons.
 *
 * FIRST, the product rules constrain motion more than they constrain colour.
 * "Never punish" and "never interrupt the solve" mean the interface may never
 * animate in a way that reads as urgency, correction or pressure. That rules
 * out the entire reflexive vocabulary of puzzle games: no flash, no
 * bounce-with-overshoot on failure, no countdown, no attention-grabbing pulse.
 * What is left is warmth — things settle into place, they breathe, they give
 * under a finger. Concentrating the timings here makes that a property of the
 * app rather than of whoever wrote the screen.
 *
 * ── The exception, added session 7 at the owner's instruction ──────────────
 * `Shake` exists. It is the one piece of correction vocabulary in the file,
 * and every previous session's notes said it never would be. It is used by
 * exactly one caller and gated by `WRONG_GUESS_FEEDBACK` in
 * `lib/feedback.ts` — see that file for the argument on both sides and for the
 * single constant that removes it again.
 *
 * SECOND, it is the only place that touches an animation library, so swapping
 * one is a single-file change. That has now happened once.
 *
 * ── Note (session 3): moti removed, Reanimated used directly ──────────────
 * Session 2 built this on moti. Moti 0.30 advertises "powered by Reanimated
 * 3" while this project is on Reanimated 4.5, and none of it had ever been
 * run — so the app's entire motion layer rested on a version pairing nobody
 * had seen work. Reanimated is a hard dependency either way (it is what moti
 * calls), so the dependency is now used directly: one less package, one less
 * version claim to be wrong about, and no behaviour that depends on a
 * compatibility shim.
 *
 * The shapes below are deliberately the same as the moti ones they replace —
 * `MOTION.settle` still describes a spring with the same damping, stiffness
 * and mass — so the visual result should be unchanged and any correction is
 * still a change to one constant here.
 *
 * ── The timings ───────────────────────────────────────────────────────────
 * `damping` is high and `stiffness` low on purpose. A springy interface is a
 * playful one; Word Hug is a calm one. Nothing here overshoots much.
 */
export type MotionSpec =
  | { type: 'spring'; damping: number; stiffness: number; mass?: number }
  | { type: 'timing'; duration: number };

export const MOTION = {
  /** Things arriving on screen. Slow enough to notice, short enough to ignore. */
  settle: { type: 'spring', damping: 18, stiffness: 120, mass: 0.9 },
  /** Finger-down feedback. Must feel immediate or the button feels broken. */
  press: { type: 'timing', duration: 90 },
  /** Finger-up. Slightly slower than the press — a release, not a snap-back. */
  release: { type: 'spring', damping: 20, stiffness: 260 },
  /** A letter landing in a tile. The one place a little life is welcome. */
  land: { type: 'spring', damping: 13, stiffness: 220 },
  /** Long, soft crossfades — theme changes, whole-screen swaps. */
  calm: { type: 'timing', duration: 260 },
  /** One leg of the wrong-guess shake. Short — the whole thing is ~330ms. */
  jolt: { type: 'timing', duration: 55 },
} as const satisfies Record<string, MotionSpec>;

/** The stagger between siblings, in ms. Three cards at 70ms reads as one gesture. */
export const STAGGER = 70;

/**
 * Turn one of the specs above into a Reanimated animation.
 *
 * This exists so screens never import `withSpring` themselves. A screen that
 * reaches for the primitives can quietly invent a bouncier spring than the
 * product allows, and nobody would notice until it shipped.
 */
export function animate(spec: MotionSpec, to: number, delay = 0) {
  'worklet';
  const step =
    spec.type === 'spring'
      ? withSpring(to, {
          damping: spec.damping,
          stiffness: spec.stiffness,
          mass: spec.mass ?? 1,
        })
      : withTiming(to, { duration: spec.duration });

  return delay > 0 ? withDelay(delay, step) : step;
}

export interface AppearProps extends ViewProps {
  children?: ReactNode;
  /** Index in a list, for staggering. */
  index?: number;
  /** Extra delay on top of the stagger, in ms. */
  delay?: number;
  /** How far the element rises as it fades in. Negative drops it in from above. */
  rise?: number;
}

/**
 * The house entrance: fade up a few pixels and settle.
 *
 * Deliberately small. A large translate reads as "look at this"; four to ten
 * pixels reads as "this was always here, you just arrived".
 *
 * Opacity is a timing and the movement is a spring, which is the one thing
 * that differs from the moti version: a spring drives its value slightly past
 * the target before settling, and an opacity of 1.03 is a clamp on one
 * platform and a warning on another. The eye cannot see the difference on a
 * 220ms fade; it can see a flicker.
 */
export function Appear({ children, index = 0, delay = 0, rise = 8, style, ...props }: AppearProps) {
  const shown = useSharedValue(0);
  const offset = useSharedValue(rise);
  const wait = delay + index * STAGGER;

  useEffect(() => {
    shown.value = withDelay(wait, withTiming(1, { duration: 220 }));
    offset.value = animate(MOTION.settle, 0, wait);
    // Entrances run once, on mount. Re-running them when a prop changes would
    // make a re-render look like a navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrance = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View style={[entrance, style]} {...props}>
      {children}
    </Animated.View>
  );
}

export interface LandProps extends ViewProps {
  children?: ReactNode;
  delay?: number;
  /** Where it comes from vertically. Negative drops it in from above. */
  rise?: number;
  /** Where it starts, as a fraction of full size. */
  scaleFrom?: number;
  /** Tilt in degrees at the start and at rest. The designs tilt tiles slightly. */
  rotateFrom?: number;
  rotateTo?: number;
}

/**
 * A thing arriving with a little weight behind it — a letter dropping into a
 * tile, a tile landing askew.
 *
 * This is the one entrance in the app allowed to overshoot, because it is the
 * only one that is unambiguously good news: the player did something and it
 * worked. Everything else settles.
 *
 * ── Note (session 3) ──────────────────────────────────────────────────────
 * The moti version wrapped this in `AnimatePresence` so that backspacing was
 * a letter *leaving* rather than a letter being deleted. Nothing in the app
 * currently unmounts a letter — the board is static until the input layer
 * lands (plans/05) — so rather than port an exit path that cannot be
 * exercised, the exit is deliberately not here. When input arrives, the
 * letter should animate out and unmount on completion; Reanimated's
 * `exiting` layout animations are the other option, and are worth a device
 * check before being trusted, since they behave differently on the two
 * platforms.
 */
export function Land({
  children,
  delay = 0,
  rise = -10,
  scaleFrom = 0.86,
  rotateFrom,
  rotateTo = 0,
  style,
  ...props
}: LandProps) {
  const shown = useSharedValue(0);
  const progress = useSharedValue(0);
  const from = rotateFrom ?? rotateTo;

  useEffect(() => {
    shown.value = withDelay(delay, withTiming(1, { duration: 180 }));
    progress.value = animate(MOTION.land, 1, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrance = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [rise, 0]) },
      { scale: interpolate(progress.value, [0, 1], [scaleFrom, 1]) },
      { rotate: `${interpolate(progress.value, [0, 1], [from, rotateTo])}deg` },
    ],
  }));

  return (
    <Animated.View style={[entrance, style]} {...props}>
      {children}
    </Animated.View>
  );
}

export interface FadeProps extends ViewProps {
  children?: ReactNode;
  /** Visible or not. Changing it crossfades rather than cuts. */
  show: boolean;
  /** Opacity when hidden. Not always zero — some things recede rather than go. */
  hidden?: number;
}

/**
 * A crossfade driven by a prop.
 *
 * `Appear` and `Land` are entrances and run once; this is for something that
 * comes and goes while the screen stays put — the travelling dot on the
 * loading screen, and later the nudge that answers a wrong guess. A fade is
 * the only transition rule 1 really leaves available: it has no direction, so
 * it cannot read as a push, a rejection or a countdown.
 */
export function Fade({ children, show, hidden = 0, style, ...props }: FadeProps) {
  const opacity = useSharedValue(show ? 1 : hidden);

  useEffect(() => {
    opacity.value = animate(MOTION.calm, show ? 1 : hidden);
  }, [show, hidden, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[fade, style]} {...props}>
      {children}
    </Animated.View>
  );
}

/**
 * A slow opacity breath.
 *
 * Used only on the answer caret. This is the one repeating animation in the
 * app and it was a judgement call: a blinking cursor is a timer's cousin, and
 * rule 1 says never imply a clock. It is here at ~1.1s per direction with a
 * shallow floor, which reads as breathing rather than blinking — closer to a
 * sleeping animal than to a countdown. If it feels like a metronome on
 * device, delete it; nothing depends on it.
 */
export interface ShakeProps extends ViewProps {
  children?: ReactNode;
  /**
   * Change this to any new value to fire one shake. A counter, not a boolean —
   * two wrong guesses in a row must shake twice, and a boolean that is already
   * true cannot say "again".
   */
  trigger: number;
  /** Peak horizontal travel, px. */
  distance?: number;
}

/**
 * A short horizontal shake.
 *
 * ── Read this before using it anywhere else ───────────────────────────────
 * Added session 7 because the owner asked for it directly, and it contradicts
 * a rule every other file in this project defends: Word Hug has no vocabulary
 * for correction. A shake is the most recognisable piece of that vocabulary
 * there is.
 *
 * It is deliberately restrained even so — four decreasing legs over ~330ms,
 * six pixels at the peak, no rotation and no scale. That is a nudge of the
 * head, not a buzzer. If it turns out to feel like a scolding on device, the
 * fix is `WRONG_GUESS_FEEDBACK` in `lib/feedback.ts`, not a smaller number
 * here.
 *
 * **Do not add a second caller without asking the owner.** One deliberate
 * exception is a decision; two is a change of product.
 */
export function Shake({ children, trigger, distance = 6, style, ...props }: ShakeProps) {
  const shift = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    shift.value = withSequence(
      withTiming(-distance, { duration: MOTION.jolt.duration }),
      withTiming(distance, { duration: MOTION.jolt.duration }),
      withTiming(-distance * 0.6, { duration: MOTION.jolt.duration }),
      withTiming(distance * 0.6, { duration: MOTION.jolt.duration }),
      withTiming(-distance * 0.25, { duration: MOTION.jolt.duration }),
      withSpring(0, { damping: 20, stiffness: 300 })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const jolt = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));

  return (
    <Animated.View style={[jolt, style]} {...props}>
      {children}
    </Animated.View>
  );
}

export function Breathe({ children, style, ...props }: ViewProps & { children?: ReactNode }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.55, { duration: 1100 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breath = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[breath, style]} {...props}>
      {children}
    </Animated.View>
  );
}
