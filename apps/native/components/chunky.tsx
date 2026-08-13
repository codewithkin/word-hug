import { useState, type ReactNode } from 'react';
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { MOTION, animate } from '@/components/motion';

/**
 * The Word Hug elevation: a hard vertical offset with ZERO blur (D-004).
 *
 * This is the single most character-defining detail in the interface — it is
 * what makes everything feel chunky and pressable rather than floating. A
 * soft blurred shadow is the reflexive React Native choice and would quietly
 * turn the product into a different product.
 *
 * ── Why this is a component and not a className ───────────────────────────
 * Two reasons, and the second is the important one.
 *
 * 1. The shadow colour is per-surface, not global: a clue card, an answer
 *    tile and a keycap each have their own, and they differ between themes.
 * 2. `boxShadow` is React Native 0.76+ and New Architecture only. If it turns
 *    out not to render on the owner's build, the fix is to stack an offset
 *    sibling View behind the content — and because every chunky surface in
 *    the app goes through this one file, that fix lands in one place instead
 *    of forty. This is the riskiest rendering assumption in the session;
 *    it is deliberately concentrated here so it is cheap to be wrong about.
 */
export interface ChunkyProps extends ViewProps {
  /** Vertical offset in px. The designs use 2–6; 3 and 4 are the workhorses. */
  offset: number;
  /** CSS variable holding the shadow colour, e.g. `--color-wh-clue-card-shadow`. */
  shadowVar: string;
  /** Inset shadows read as "sunken" — used by empty answer tiles and pressed states. */
  inset?: boolean;
  children?: ReactNode;
}

function shadow(offset: number, inset: boolean, color: unknown) {
  // `0 4px 0` — the third value is the blur radius and it stays at zero.
  return `${inset ? 'inset ' : ''}0 ${offset}px 0 ${String(color ?? 'transparent')}`;
}

/**
 * ── Note (session 3) ──────────────────────────────────────────────────────
 * This used to be a `MotiView` even though it never animated anything; it is
 * a plain `View` now that moti has gone. Only `ChunkyPressable` below moves,
 * and it is the only thing here that needs to be an animated component.
 */
export function Chunky({ offset, shadowVar, inset = false, style, ...props }: ChunkyProps) {
  const color = useCSSVariable(shadowVar);

  return <View style={[{ boxShadow: shadow(offset, inset, color) }, style]} {...props} />;
}

export interface ChunkyPressableProps extends Omit<PressableProps, 'style' | 'children'> {
  offset: number;
  shadowVar: string;
  className?: string;
  children?: ReactNode;
  /** Offset while held. The designs compress to 2px; see `elevation.pressed`. */
  pressedOffset?: number;
}

/**
 * A chunky surface that gives under a finger.
 *
 * The whole illusion is that the surface is a physical thing sitting on a
 * shadow: pressing it pushes it DOWN into that shadow, so the element moves
 * down by exactly the amount the shadow shrinks and its bottom edge stays
 * put. Get the two numbers out of step and it reads as a glitch rather than
 * as a press.
 *
 * There is deliberately no scale, no opacity dip and no haptic-style
 * overshoot on release — the press is the feedback. A wrong guess in Word Hug
 * gets a gentle nudge and nothing else (rule 1), so the button must not have
 * a vocabulary for rejection built into it.
 *
 * The movement is a shared value driven straight from the press handlers, so
 * it never crosses back through React state. The shadow string does, because
 * it is a string rather than a number and cannot be animated on the UI thread
 * anyway; it changes at the moment of the press, which is when the finger is
 * already there.
 *
 * `className` is passed to an `Animated.View`. If uniwind turns out not to
 * apply classes to components it does not own, every chunky surface in the
 * app loses its styling at once and visibly — which is the good failure mode,
 * and it is fixed here rather than in forty screens.
 */
export function ChunkyPressable({
  offset,
  shadowVar,
  pressedOffset = 2,
  className,
  children,
  ...props
}: ChunkyPressableProps) {
  const color = useCSSVariable(shadowVar);
  const [pressed, setPressed] = useState(false);
  const drop = Math.max(0, offset - pressedOffset);
  const sink = useSharedValue(0);

  const give = useAnimatedStyle(() => ({ transform: [{ translateY: sink.value }] }));

  return (
    <Pressable
      onPressIn={() => {
        setPressed(true);
        sink.value = animate(MOTION.press, drop);
      }}
      onPressOut={() => {
        setPressed(false);
        sink.value = animate(MOTION.release, 0);
      }}
      {...props}
    >
      <Animated.View
        className={className}
        style={[give, { boxShadow: shadow(pressed ? pressedOffset : offset, false, color) }]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
