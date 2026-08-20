import { useState, type ReactNode } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
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
  /**
   * Inset shadows read as "sunken" — the same prop `Chunky` has.
   *
   * Added session 7b. It was missing, and three screens tried to pass it
   * anyway: a sunken surface that is *also* pressable is a real shape in the
   * app (the archive's window edge, the pack list's bundle row, the shop's
   * new-player line). Without it those three had to choose between the wrong
   * elevation and a non-pressable `Chunky`, and all three chose to pass a prop
   * that did not exist.
   *
   * A pressed inset surface compresses the same way a raised one does — it
   * just starts below the surface rather than above it.
   */
  inset?: boolean;
  /**
   * Forwarded to the inner `Animated.View`, alongside the press transform.
   *
   * `PressableProps['style']` is omitted above because Pressable's own style
   * prop can be a function of the press state and this component owns that
   * behaviour. This is a plain style for the surface, which is what a caller
   * needing a fixed width actually wants — `KeyCap` passes one.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Does this surface want to fill the space its parent gives it?
 *
 * ── The bug this exists to kill ───────────────────────────────────────────
 * `ChunkyPressable` renders a `Pressable` wrapping an `Animated.View`, and
 * `className` goes on the **inner** view. So a caller writing `flex-1` — the
 * obvious thing, and what the three shop coin tiles did — puts `flex: 1` on a
 * child whose parent has already shrink-wrapped to its content. The row's flex
 * child is the `Pressable`, and nothing ever told it to grow. Result: three
 * tiles huddled at the left of a wide row, which is exactly what the owner
 * reported.
 *
 * Fixing it at the three call sites would have fixed three of them. This is a
 * two-view component pretending to be one view, and every future caller would
 * hit the same trap, so the component absorbs it: if the class list asks to
 * grow, the outer `Pressable` grows too.
 *
 * Passing `flex: 1` down to the inner view as well is harmless and wanted — a
 * `Pressable` is a column flex container, so the child stretches to its width
 * and fills its height, which is what a tile in a row should do.
 *
 * A string scan rather than a new prop, deliberately: a `grow` prop would be a
 * second way to say a thing the class list already says, and the two would
 * drift.
 *
 * Only the three classes that mean "take the free space along the parent's
 * main axis". `w-full` and `self-stretch` are deliberately **not** here: a
 * `Pressable` lays its child out in a column, so those already resolve
 * correctly on the inner view, and promoting them to `flex: 1` on the outer
 * one would stretch surfaces that only asked to be wide.
 */
const GROW_CLASSES = /(?:^|\s)(?:flex-1|grow|flex-grow)(?:\s|$)/;

function growsToFill(className?: string): boolean {
  return className !== undefined && GROW_CLASSES.test(className);
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
  inset = false,
  className,
  children,
  style,
  ...props
}: ChunkyPressableProps) {
  const color = useCSSVariable(shadowVar);
  const [pressed, setPressed] = useState(false);
  const drop = Math.max(0, offset - pressedOffset);
  const sink = useSharedValue(0);
  const grow = growsToFill(className);

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
      style={grow ? { flex: 1 } : undefined}
      {...props}
    >
      <Animated.View
        className={className}
        style={[
          give,
          { boxShadow: shadow(pressed ? pressedOffset : offset, inset, color) },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
