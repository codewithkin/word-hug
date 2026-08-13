import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Land } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 03 Not Found ──────────────────────────────────────────────────────────
 * Built from `designs/extracted/03-not-found-{light,dark}.html`, both themes.
 *
 * Worth noticing what this screen does NOT do, because it is the clearest
 * expression of the product's first rule in the whole design. A 404 in a
 * puzzle game is a natural place to say "oops", show an error colour, or
 * apologise. This one says "Might be an old link, or a day that hasn't
 * happened yet", puts no red anywhere, blames nobody, and offers the one
 * thing the person actually wanted. It is a dead end rendered as a shrug.
 *
 * ── Recorded divergence (session 2) ───────────────────────────────────────
 * The two blank tiles here use `inset 0 4px 0 rgba(160,130,80,0.16)` in light
 * and `rgba(0,0,0,0.3)` in dark. The Daily screen's empty answer tiles use
 * 0.18 and 0.28 of the same two colours, and their fills are identical to
 * these. Two values that close are design noise rather than intent, so this
 * screen reuses `answerTileEmpty` / `answerTileEmptyShadow` rather than
 * adding two near-duplicate tokens. Noted so it is not mistaken for an
 * oversight; see plans/04-tokens-and-first-screens.md.
 * ──────────────────────────────────────────────────────────────────────────
 */
export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View
        className="flex-1 justify-between"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-1 items-center justify-center gap-[34px] px-[30px]">
          {/* Three tiles with the middle one tilted — a puzzle with a piece
              that does not fit. It arrives last and lands slightly askew. */}
          <View className="flex-row items-center gap-2">
            <Appear index={0} rise={10}>
              <Chunky
                offset={4}
                inset
                shadowVar="--color-wh-answer-tile-empty-shadow"
                className="h-[74px] w-16 rounded-[19px] bg-wh-answer-tile-empty"
              />
            </Appear>

            <Land delay={160} rise={-14} scaleFrom={1} rotateFrom={6} rotateTo={-4}>
              <Chunky
                offset={5}
                shadowVar="--color-wh-answer-tile-shadow"
                className="h-[74px] w-16 items-center justify-center rounded-[19px] bg-wh-answer-tile"
              >
                <Text className="font-wh-bold text-[40px] text-wh-clue-slot-text dark:text-wh-text-secondary">
                  ?
                </Text>
              </Chunky>
            </Land>

            <Appear index={2} rise={10}>
              <Chunky
                offset={4}
                inset
                shadowVar="--color-wh-answer-tile-empty-shadow"
                className="h-[74px] w-16 rounded-[19px] bg-wh-answer-tile-empty"
              />
            </Appear>
          </View>

          <Appear delay={320} className="items-center gap-3">
            {/* 36px is this screen's own value — the ramp's nearest is 34, and
                rounding a design's type size to fit a scale is how a scale
                stops describing the design. */}
            <Text className="text-center font-wh-bold text-[36px] leading-[40px] text-wh-clue-text">
              There&apos;s no puzzle{'\n'}at this address
            </Text>
            <Text className="max-w-[28ch] text-center font-wh-regular text-wh-md leading-6 text-wh-chip-text">
              Might be an old link, or a day that hasn&apos;t happened yet.
            </Text>
          </Appear>
        </View>

        <Appear delay={440} rise={14} className="px-6 pb-[10px]">
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Go to today's puzzle"
            className="h-[62px] items-center justify-center rounded-wh-lg bg-wh-primary"
          >
            <Text className="font-wh-bold text-[23px] tracking-wh-wide text-wh-on-primary">
              TODAY&apos;S PUZZLE
            </Text>
          </ChunkyPressable>
        </Appear>
      </View>
    </View>
  );
}
