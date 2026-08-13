import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, QuietLink } from '@/components/actions';
import { Chunky } from '@/components/chunky';
import { Appear, Land } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 02 Error ──────────────────────────────────────────────────────────────
 * Built from `designs/extracted/02-error-light.html` and
 * `02-error-dark.html`, read in full, both themes.
 *
 * O-O-P-S with the S falling out of line, over "That didn't go to plan", over
 * "Nothing is lost — your solves and streak are safe on this phone."
 *
 * Read what this screen refuses to do. There is no red, no warning triangle,
 * no error code, no apology, and no blame. The first thing it says is what
 * the person is actually worried about — that their solves are gone — and the
 * answer is no. Then it offers the two things anyone would want: try it
 * again, or go back to the puzzle. D-002 says Word Hug has no error colour,
 * and this is the screen that would have needed one.
 *
 * It lives in `components/` rather than in a route because it is used twice:
 * as `/error`, and as the root layout's `ErrorBoundary`, which is the way
 * anyone will actually reach it.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** O-O-P-S. The S is a different tile — dimmer, and further out of line. */
const OOPS = [
  { letter: 'O', rotate: '-14deg', lift: -6 },
  { letter: 'O', rotate: '6deg', lift: 0 },
  { letter: 'P', rotate: '-4deg', lift: 4 },
];

export interface ErrorViewProps {
  /** What "try again" does. Reloading the route, or the boundary's retry. */
  onRetry?: () => void;
  /** How to get back to today's puzzle. */
  onHome?: () => void;
  /**
   * The underlying error, shown only in development. Never in the product:
   * a stack trace is punishment, and the person cannot act on it.
   */
  error?: Error;
}

export function ErrorView({ onRetry, onHome, error }: ErrorViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View
        className="flex-1 justify-between"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-1 items-center justify-center gap-[34px] px-[30px]">
          <View className="h-[100px] flex-row items-end gap-[7px]">
            {OOPS.map(({ letter, rotate, lift }, i) => (
              <Appear key={i} index={i} rise={10}>
                <Chunky
                  offset={4}
                  shadowVar="--color-wh-answer-tile-shadow"
                  className="h-16 w-14 items-center justify-center rounded-wh-card bg-wh-answer-tile"
                  style={{ transform: [{ rotate }, { translateY: lift }] }}
                >
                  <Text className="font-wh-bold text-wh-display text-wh-answer-tile-text">
                    {letter}
                  </Text>
                </Chunky>
              </Appear>
            ))}

            {/* The S arrives last and lands crooked and low. It is the whole
                joke of the screen, and it is the only thing on it that moves
                more than a few pixels. */}
            <Land delay={260} rise={-18} scaleFrom={1} rotateFrom={-6} rotateTo={20}>
              <Chunky
                offset={4}
                shadowVar="--color-wh-surface-quiet-shadow"
                className="h-16 w-14 items-center justify-center rounded-wh-card bg-wh-surface-quiet"
                style={{ transform: [{ translateY: 10 }] }}
              >
                <Text className="font-wh-bold text-wh-display text-wh-text-whisper">S</Text>
              </Chunky>
            </Land>
          </View>

          <Appear delay={420} className="items-center gap-3">
            <Text className="text-center font-wh-bold text-[36px] leading-[40px] text-wh-clue-text">
              That didn&apos;t go{'\n'}to plan
            </Text>
            <Text className="max-w-[28ch] text-center font-wh-regular text-wh-md leading-6 text-wh-chip-text">
              Nothing is lost — your solves and streak are safe on this phone. Try again, or head
              back to today&apos;s puzzle.
            </Text>

            {/* Development only. The owner runs this build; when it breaks,
                "That didn't go to plan" is the correct thing to show a player
                and a useless thing to show whoever has to fix it. */}
            {__DEV__ && error?.message ? (
              <Text className="max-w-[34ch] text-center font-wh-regular text-wh-sm text-wh-text-whisper">
                {error.message}
              </Text>
            ) : null}
          </Appear>
        </View>

        <Appear delay={540} rise={14} className="items-center gap-3 px-6 pb-[10px]">
          <View className="w-full">
            <PrimaryButton label="TRY AGAIN" accessibilityLabel="Try again" onPress={onRetry} />
          </View>
          <QuietLink label="Back to today's puzzle" onPress={onHome} />
        </Appear>
      </View>
    </View>
  );
}
