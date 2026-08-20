import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Land } from '@/components/motion';

/**
 * ── A Solve celebration ───────────────────────────────────────────────────
 * Built from `designs/extracted/a-solve-celebration-light.html` and
 * `a-solve-celebration-dark.html`, read in full, both themes.
 *
 * **This is the moment the product exists for.** Everything else is the walk
 * up to it. It is worth being precise about what it does and does not do.
 *
 * It does: name the answer in teal, spell out all three compounds so the
 * person sees *why* it worked, mention the streak once, in small text, with
 * no flame and no warning, and offer more puzzles if they want more.
 *
 * It does not: score, rank, grade, compare to anyone, count attempts, show a
 * time, congratulate in exclamation marks, or ask for anything. The eyebrow
 * is "That's the one" — four flat words, no punctuation. A tired parent gets
 * to feel clever for a second and then close it. That is the whole design.
 *
 * ── The wash, and why this is an overlay and not a screen ─────────────────
 * The design file redraws the three clue cards underneath, because a static
 * mockup has nothing to sit on. This does not: it is a transparent overlay
 * over the real board, and `overlayWash` (0.93 / 0.94 of the ground) is what
 * fades it. The answer stays faintly visible behind the celebration, which is
 * the point. Redrawing the cards here would double them the moment this is
 * shown over a live board.
 *
 * NOT `backdrop` — that token is the dimming scrim for sheets and dialogs.
 * This is nearly opaque and made of the ground, not of shadow.
 *
 * ── MOTION ────────────────────────────────────────────────────────────────
 * The wash fades, then the answer lands letter by letter, then the compounds,
 * the streak and the button arrive under it. The letters are the one place in
 * the app allowed to overshoot (see `Land` in components/motion.tsx) and this
 * is the moment they exist for.
 * ──────────────────────────────────────────────────────────────────────────
 */

export interface SolveCelebrationProps {
  /** The answer, one letter per tile. */
  answer?: string;
  /**
   * The three clue words, in order. Each pairs with the answer to make a
   * compound; `before` says which side the answer sits on.
   */
  compounds?: { clue: string; before: boolean }[];
  /** Days in a row. Omitted or 0 hides the line entirely — see below. */
  streak?: number;
  onClose?: () => void;
  onArchive?: () => void;
  /**
   * What the onward button says.
   *
   * Session 8: it was hard-coded to "PLAY THE ARCHIVE". The archive has been
   * retired — the level map is where you go next — so the caller names its own
   * destination: "NEXT LEVEL" from a level, "BACK HOME" from the last one or
   * from the daily puzzle.
   */
  onwardLabel?: string;
}

const DEFAULT_COMPOUNDS = [
  { clue: 'GREEN', before: true },
  { clue: 'BOAT', before: false },
  { clue: 'LIGHT', before: true },
];

export function SolveCelebration({
  answer = 'HOUSE',
  compounds = DEFAULT_COMPOUNDS,
  streak = 13,
  onClose,
  onArchive,
  onwardLabel = 'BACK HOME',
}: SolveCelebrationProps) {
  const insets = useSafeAreaInsets();
  const letters = [...answer];

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* "Tap anywhere to close" is the design's own instruction, so the wash
          itself is the dismiss target. There is deliberately no X: closing
          this should be the easiest thing on the screen, not a small button
          in a corner. */}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={StyleSheet.absoluteFill}
        className="bg-wh-overlay-wash"
      />

      <View
        pointerEvents="box-none"
        className="flex-1 items-center justify-center gap-[26px] px-[26px]"
        style={{ paddingTop: insets.top + 26, paddingBottom: insets.bottom + 24 }}
      >
        <Appear delay={120}>
          {/* #8C7A66 / #8F79D4 — this pairing is used three times on this
              overlay and nowhere else yet. If overlays B–H turn out to reuse
              it, promote it to a token then, not now. */}
          <Text className="font-wh-heavy text-wh-micro uppercase tracking-wh-label text-[#8C7A66] dark:text-[#8F79D4]">
            That&apos;s the one
          </Text>
        </Appear>

        {/* ── The answer ─────────────────────────────────────────────────
            Teal, not amber: amber is the colour of a thing to press, and
            there is nothing to press here. The word is finished. */}
        <View className="flex-row gap-2">
          {letters.map((letter, i) => (
            <Land key={`${letter}-${i}`} delay={200 + i * 70} rise={-14}>
              <Chunky
                offset={5}
                shadowVar="--color-wh-accent-shadow"
                className="h-16 w-[54px] items-center justify-center rounded-wh-card bg-wh-accent"
              >
                <Text className="font-wh-bold text-[30px] text-wh-on-accent">{letter}</Text>
              </Chunky>
            </Land>
          ))}
        </View>

        {/* ── Why it worked ──────────────────────────────────────────────
            GREEN·HOUSE, HOUSE·BOAT, LIGHT·HOUSE — the answer stays in the
            middle column so it lines up down the panel, and each clue sits
            on the side it actually joins. That alignment is the explanation:
            you can see the shared word without reading a word of prose. */}
        <Appear delay={200 + letters.length * 70 + 80} rise={10} className="w-full">
          <Chunky
            offset={6}
            shadowVar="--color-wh-solve-panel-shadow"
            className="w-full gap-[10px] rounded-[26px] bg-wh-solve-panel p-5"
          >
            {compounds.map(({ clue, before }, i) => (
              <View key={`${clue}-${i}`} className="flex-row items-baseline">
                <Text className="flex-1 text-right font-wh-bold text-wh-lg text-wh-clue-text">
                  {before ? clue : ''}
                </Text>
                <Text className="font-wh-bold text-wh-lg text-wh-accent-text">{answer}</Text>
                <Text className="flex-1 text-left font-wh-bold text-wh-lg text-wh-clue-text">
                  {before ? '' : clue}
                </Text>
              </View>
            ))}
          </Chunky>
        </Appear>

        {/* ── The streak ─────────────────────────────────────────────────
            One coral dot and five words at 14.5px. No flame, no "keep it
            up", no note about what happens if you miss tomorrow. It is
            reported, not defended (rule 1). Zero hides it rather than
            showing "0 day streak", which would read as a scolding. */}
        {streak > 0 ? (
          <Appear delay={200 + letters.length * 70 + 200} className="flex-row items-center gap-[9px]">
            <View className="h-[9px] w-[9px] rounded-wh-pill bg-wh-highlight" />
            <Text className="font-wh-heavy text-[14.5px] text-[#8C7A66] dark:text-[#8F79D4]">
              {streak} day streak
            </Text>
          </Appear>
        ) : null}

        <Appear delay={200 + letters.length * 70 + 280} rise={12} className="w-full">
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            onPress={onArchive}
            accessibilityRole="button"
            accessibilityLabel={onwardLabel.toLowerCase()}
            className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary"
          >
            {/* 0.05em, not `tracking-wh-wide` (0.06em). The button on this
                overlay is a hair tighter than the one in onboarding. */}
            <Text className="font-wh-bold text-[21px] tracking-[0.05em] text-wh-on-primary">
              {onwardLabel}
            </Text>
          </ChunkyPressable>
        </Appear>

        <Appear delay={200 + letters.length * 70 + 360}>
          <Text className="font-wh-bold text-wh-sm-alt text-[#8C7A66] dark:text-[#8F79D4]">
            Tap anywhere to close
          </Text>
        </Appear>
      </View>
    </View>
  );
}
