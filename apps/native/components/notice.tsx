import { Pressable, Text, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { Appear } from '@/components/motion';

/**
 * The two places Word Hug says something to the player without asking for
 * anything back: the note under the board after a guess, and the banner that
 * appears when the store cannot be reached.
 *
 * Built from `designs/extracted/09-wrong-guess-{light,dark}.html`,
 * `09-near-miss-{light,dark}.html`, `09-caught-up-{light,dark}.html` and
 * `f-offline-notice-{light,dark}.html`, all eight read in full.
 *
 * ── Why these two live in one file ────────────────────────────────────────
 * They share a colour pair that exists nowhere else: #8A7458 in light and
 * #C6B7EC in dark, the app's "quiet voice" type colour. It is not `textMuted`
 * (which is #8C7A66 / #A79A8E) and not `pillText`. Two uses is exactly the
 * threshold where writing it twice starts being a liability, so it is written
 * once, here.
 *
 * ── What is NOT in this file, and must never be ───────────────────────────
 * A wrong guess in Word Hug produces a sentence on a soft pill. It does not
 * produce red, a shake, a buzz, a sound, a dropped attempt or a counter of any
 * kind. Rule 1 is not a styling preference — it is the reason the product
 * exists, and this component is where a future change would most naturally
 * violate it. `highlight` (#FF6B4A) is a warm coral for emphasis and is NOT an
 * error colour (D-002); there is no error colour, because there are no errors.
 *
 * The nudge arrives with a `Fade` rather than sliding or popping in: a fade has
 * no direction, so it cannot read as a push or a rejection. See
 * components/motion.tsx.
 */

/** The quiet voice: #8A7458 / #C6B7EC. Not `textMuted`, not `pillText`. */
const QUIET_VOICE = 'text-[#8A7458] dark:text-[#C6B7EC]';

export type GuessTone =
  /** Not the answer. Warm, unhurried, and completely without consequence. */
  | 'gentle'
  /** One letter off. The only place the interface gets to be encouraging. */
  | 'close';

export interface GuessNoteProps {
  children: string;
  tone?: GuessTone;
  /** 15px on the guess states, 14.5px on Caught up, which says more. */
  size?: number;
  delay?: number;
}

/**
 * The pill under the board that answers a guess.
 *
 * `gentle` is `surfaceQuiet` — the same recessive fill as the hint bar in
 * onboarding — with the quiet voice on it. `close` is the one moment the
 * palette warms towards teal: #E6F6F4 / #123F3C, a wash that appears nowhere
 * else in the export, with `accentShadow` on it in light and `accentText` in
 * dark. Neither is derivable from the other, and neither is a tint of `accent`.
 */
export function GuessNote({ children, tone = 'gentle', size = 15, delay = 0 }: GuessNoteProps) {
  return (
    <Appear delay={delay} rise={4} className="h-[44px] items-center px-[22px] pt-2">
      {tone === 'close' ? (
        <View className="rounded-wh-pill bg-[#E6F6F4] px-[18px] py-[10px] dark:bg-[#123F3C]">
          <Text
            className="font-wh-bold text-wh-accent-shadow dark:text-wh-accent-text"
            style={{ fontSize: size }}
          >
            {children}
          </Text>
        </View>
      ) : (
        <View className="rounded-wh-pill bg-wh-surface-quiet px-[18px] py-[10px]">
          <Text className={`font-wh-bold ${QUIET_VOICE}`} style={{ fontSize: size }}>
            {children}
          </Text>
        </View>
      )}
    </Appear>
  );
}

/**
 * ── Overlay F · Offline notice ────────────────────────────────────────────
 * The banner that drops in over the shop or the pack list when the store is
 * unreachable.
 *
 * It is a banner and not a dialog on purpose: being offline does not stop the
 * player doing anything except buying, so it must not stop them doing
 * anything. Everything underneath stays live and tappable, and the notice can
 * be dismissed and ignored. A modal here would take the app away from someone
 * over a thing they cannot fix.
 *
 * The "•••" glyph is the design's own — three dots in a rounded square, which
 * reads as a connection rather than as a warning. There is no exclamation mark
 * and no triangle anywhere in this component.
 */
export function OfflineBanner({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <Appear rise={-14} className="px-5">
      <Chunky
        offset={5}
        shadowVar="--color-wh-solve-panel-shadow"
        className="flex-row items-center gap-[14px] rounded-wh-xl bg-wh-solve-panel px-[18px] py-4"
      >
        <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-wh-surface-inset dark:bg-wh-answer-tile-active">
          <Text className={`font-wh-bold text-wh-xl ${QUIET_VOICE}`}>•••</Text>
        </View>

        <Text className="flex-1 font-wh-bold text-[15px] leading-[20px] text-wh-clue-text">
          You&apos;re offline — buying needs a connection
        </Text>

        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text className="font-wh-bold text-wh-xl text-wh-text-muted dark:text-wh-text-quiet">
            ×
          </Text>
        </Pressable>
      </Chunky>
    </Appear>
  );
}
