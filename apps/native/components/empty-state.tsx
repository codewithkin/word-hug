import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Appear } from '@/components/motion';

/**
 * The shape three screens share when there is nothing to show yet: an
 * ornament, a heading, a sentence, and one thing to do about it.
 *
 * Built from `designs/extracted/10-archive-day-one-{light,dark}.html`,
 * `18-stats-empty-{light,dark}.html` and
 * `15-store-unreachable-{light,dark}.html`, all six read in full.
 *
 * ── What makes these three the same screen ────────────────────────────────
 * All three are moments where a lesser product would apologise or upsell.
 * None of them do. "Your archive starts today" and "Nothing to show yet" both
 * describe a beginning rather than an absence, and each is followed by a
 * button that leads back to the puzzle. Even the store failure — the one that
 * genuinely IS a fault — closes with "Everything you already own still works"
 * rather than with an error code.
 *
 * The ornament in each case is the screen's own content, drawn empty: three
 * fading archive tiles, eight fading heatmap squares, three shop cards with a
 * question mark. Not a shrug, not a broken-cloud icon, not an illustration of
 * a person looking sad. The screen shows you the thing you came for, waiting.
 *
 * ── The ladders ───────────────────────────────────────────────────────────
 * Each ornament fades along its own sequence of tints, and they are NOT the
 * same sequence: Archive day one runs #F3E3C4 → #F6EDDD → #F9F3E7 in light and
 * #251652 → #221345 → #1E1140 in dark, while Stats empty runs #F3E3C4 →
 * #F6EDDD → #F9F3E7 → #FCF8F0 against #2B1A5E → #271755 → #23144C → #1F1244.
 * The light ladders overlap and the dark ones do not. Each is written on its
 * own screen rather than shared here, because "these two ladders happen to
 * share three values in one theme" is a coincidence, not a rule.
 */

export interface EmptyBodyProps {
  /** The screen's own content, drawn empty. */
  ornament: ReactNode;
  title: string;
  body: string;
  /** 34px on Archive and Shop, 32px on Stats. */
  inset?: number;
}

export function EmptyBody({ ornament, title, body, inset = 34 }: EmptyBodyProps) {
  return (
    <View
      className="flex-1 items-center justify-center gap-7"
      style={{ paddingHorizontal: inset }}
    >
      {/* `w-full` so an ornament that spans the column (the Stats heatmap)
          can, while `items-center` keeps a narrow one (the archive tiles)
          centred. Without the width, a `w-full` child of an `items-center`
          parent measures zero. */}
      <Appear rise={10} className="w-full items-center">
        {ornament}
      </Appear>

      <Appear delay={120} className="items-center gap-3">
        <Text className="text-center font-wh-bold text-wh-display leading-[37px] text-wh-clue-text">
          {title}
        </Text>

        {/*
          The design caps this at `max-w-28ch`. React Native has no `ch` unit —
          it is dropped silently at best and resolves to NaN at worst — so the
          cap is a point value here. 28 characters of Baloo 2 at 16px measures
          around 250–260pt; 260 is used everywhere this cap appears so a single
          correction on device moves all of them. See progress/05-known-issues §2.
        */}
        <Text className="max-w-[260px] text-center font-wh-regular text-wh-md leading-6 text-wh-chip-text">
          {body}
        </Text>
      </Appear>
    </View>
  );
}
