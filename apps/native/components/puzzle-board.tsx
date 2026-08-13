import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Breathe, STAGGER } from '@/components/motion';

/**
 * The board shared by the Archive Puzzle (11) and the Pack Puzzle (14).
 *
 * Built from `designs/extracted/11-archive-puzzle-{light,dark}.html` and
 * `14-pack-puzzle-{light,dark}.html`, all four read in full. Those two screens
 * are the same board with a different header and a different footer, so the
 * board is here and the differences stay in the screens.
 *
 * ── Why the Daily screen (09) does NOT use this ───────────────────────────
 * It is close, and it is not the same. Daily's answer tiles are fixed-width
 * (56px) and centred with the row's own gaps; these are flexed across the
 * full width, so a five-letter answer and a three-letter answer fill the same
 * space. Daily also has a coin/streak header instead of a back button, and no
 * submit arrow at all. Folding all of that into one component before any of
 * it has been seen running would be inventing a shape rather than finding one.
 * If 11 and 14 look right on device, THAT is the moment to pull Daily in —
 * with three real screens to generalise from instead of two and a guess.
 *
 * ── The submit button ─────────────────────────────────────────────────────
 * When the answer is too short it is flat: `submitIdle`, no shadow, no amber.
 * That is the only control in the app with no elevation, and the absence is
 * the whole message. There is no greyed-out amber and no dimmed opacity,
 * because both of those read as "you did something wrong" (rule 1); this just
 * reads as "not yet".
 */

const IN = {
  header: 0,
  eyebrow: 60,
  clues: 120,
  board: 120 + 3 * STAGGER,
  keys: 120 + 3 * STAGGER + 80,
  footer: 120 + 3 * STAGGER + 160,
};

export { IN as BOARD_TIMINGS };

export function PuzzleHeader({
  title,
  onBack,
  onHelp,
}: {
  title: string;
  onBack?: () => void;
  onHelp?: () => void;
}) {
  return (
    <Appear
      delay={IN.header}
      rise={-6}
      className="h-[60px] flex-row items-center justify-between px-[18px] pt-[6px]"
    >
      <ChunkyPressable
        offset={3}
        shadowVar="--color-wh-surface-shadow"
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
      >
        {/* The design nudges this glyph up with a 4px bottom padding — a
            chevron sits low in its own line box and looks off-centre without
            it. Kept, because it is the kind of correction that reads as a bug
            when it is missing and as nothing at all when it is there. */}
        <Text className="pb-1 font-wh-bold text-wh-h2 leading-none text-wh-text-faint dark:text-wh-text-secondary">
          ‹
        </Text>
      </ChunkyPressable>

      <Text className="font-wh-bold text-wh-xxl text-wh-clue-text">{title}</Text>

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

/** "SATURDAY 8 AUGUST" / "7 OF 30" — what this puzzle is, in one line. */
export function PuzzleEyebrow({ children }: { children: string }) {
  return (
    <Appear delay={IN.eyebrow} className="h-[30px] items-center justify-center">
      <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
        {children}
      </Text>
    </Appear>
  );
}

/**
 * The three clue words. Full-width rows with no dashed slot — that belongs to
 * the Daily screen's layout, not to this one.
 */
export function ClueStack({ clues }: { clues: string[] }) {
  return (
    <View className="flex-1 justify-center gap-3 px-[22px] pt-[6px]">
      {clues.map((clue, i) => (
        <Appear key={clue} index={i} delay={IN.clues}>
          <Chunky
            offset={4}
            shadowVar="--color-wh-clue-card-shadow"
            className="h-[70px] items-center justify-center rounded-wh-xl bg-wh-clue-card"
          >
            <Text className="font-wh-bold text-wh-display-lg text-wh-clue-text">{clue}</Text>
          </Chunky>
        </Appear>
      ))}
    </View>
  );
}

export interface AnswerRowProps {
  /** How many letters the answer has. */
  length: number;
  /** What has been typed so far. */
  typed: string;
  onSubmit?: () => void;
  /** The arrow is amber only once the answer is long enough to be checked. */
  canSubmit?: boolean;
}

export function AnswerRow({ length, typed, onSubmit, canSubmit }: AnswerRowProps) {
  const letters = [...typed];
  const ready = canSubmit ?? letters.length === length;

  return (
    <Appear delay={IN.board} rise={6} className="flex-row items-center gap-[9px]">
      <View className="flex-1 flex-row gap-[7px]">
        {Array.from({ length }, (_, i) => {
          const letter = letters[i];

          if (letter !== undefined) {
            return (
              <Chunky
                key={i}
                offset={4}
                shadowVar="--color-wh-answer-tile-shadow"
                className="h-[62px] flex-1 items-center justify-center rounded-wh-card bg-wh-answer-tile"
              >
                <Text className="font-wh-bold text-wh-h1 text-wh-answer-tile-text">{letter}</Text>
              </Chunky>
            );
          }

          if (i === letters.length) {
            return (
              <Chunky
                key={i}
                offset={4}
                shadowVar="--color-wh-answer-tile-active-shadow"
                className="h-[62px] flex-1 items-center justify-center rounded-wh-card border-[3px] border-wh-primary bg-wh-answer-tile-active"
              >
                {/* Not a blink — a breath. Nothing may imply a clock (rule 1). */}
                <Breathe>
                  <View className="h-7 w-[3px] rounded-[2px] bg-wh-primary" />
                </Breathe>
              </Chunky>
            );
          }

          return (
            <Chunky
              key={i}
              offset={3}
              inset
              shadowVar="--color-wh-answer-tile-empty-shadow"
              className="h-[62px] flex-1 rounded-wh-card bg-wh-answer-tile-empty"
            />
          );
        })}
      </View>

      {ready ? (
        <ChunkyPressable
          offset={5}
          shadowVar="--color-wh-primary-shadow"
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel="Check answer"
          className="h-[62px] w-[62px] items-center justify-center rounded-[19px] bg-wh-primary"
        >
          <Text className="font-wh-bold text-wh-h2 text-wh-on-primary">→</Text>
        </ChunkyPressable>
      ) : (
        <View
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Check answer, not enough letters yet"
          className="h-[62px] w-[62px] items-center justify-center rounded-[19px] bg-wh-submit-idle"
        >
          <Text className="font-wh-bold text-wh-h2 text-wh-submit-idle-text">→</Text>
        </View>
      )}
    </Appear>
  );
}

export interface LetterKeysProps {
  /** The letters offered. `used` dims a key without removing it. */
  keys: { letter: string; used?: boolean }[];
  onKey?: (letter: string) => void;
  onBackspace?: () => void;
}

export function LetterKeys({ keys, onKey, onBackspace }: LetterKeysProps) {
  return (
    <Appear delay={IN.keys} rise={6} className="flex-row gap-[7px]">
      {keys.map(({ letter, used }) =>
        used ? (
          <ChunkyPressable
            key={letter}
            offset={3}
            shadowVar="--color-wh-key-cap-dim-shadow"
            onPress={() => onKey?.(letter)}
            accessibilityRole="button"
            accessibilityLabel={`Letter ${letter}, already used`}
            className="h-[54px] flex-1 items-center justify-center rounded-[15px] bg-wh-key-cap-dim"
          >
            <Text className="font-wh-bold text-wh-h3 text-wh-key-cap-dim-text">{letter}</Text>
          </ChunkyPressable>
        ) : (
          <ChunkyPressable
            key={letter}
            offset={3}
            shadowVar="--color-wh-key-cap-shadow"
            onPress={() => onKey?.(letter)}
            accessibilityRole="button"
            accessibilityLabel={`Letter ${letter}`}
            className="h-[54px] flex-1 items-center justify-center rounded-[15px] bg-wh-key-cap"
          >
            <Text className="font-wh-bold text-wh-h3 text-wh-key-cap-text">{letter}</Text>
          </ChunkyPressable>
        )
      )}

      <ChunkyPressable
        offset={3}
        shadowVar="--color-wh-surface-shadow"
        onPress={onBackspace}
        accessibilityRole="button"
        accessibilityLabel="Delete letter"
        className="h-[54px] w-[54px] items-center justify-center rounded-[15px] bg-wh-surface"
      >
        <Text className="font-wh-bold text-wh-xl text-wh-text-faint dark:text-wh-text-secondary">
          ⌫
        </Text>
      </ChunkyPressable>
    </Appear>
  );
}

/**
 * The "Nudge" pill in the footer. On the pack screen it carries three pips
 * showing how many nudges are left; on the archive screen it has none.
 *
 * Note what the pips are not: a life counter that empties and then blocks
 * you. Running out of nudges never stops the puzzle — see overlay C, which is
 * the screen for that moment and is not built yet.
 */
export function NudgeButton({
  remaining,
  total,
  onPress,
}: {
  remaining?: number;
  total?: number;
  onPress?: () => void;
}) {
  const pips = total ?? 0;

  return (
    <ChunkyPressable
      offset={3}
      shadowVar="--color-wh-surface-shadow"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        pips ? `Nudge, ${remaining ?? 0} of ${pips} left` : 'Nudge'
      }
      className="flex-row items-center gap-[9px] rounded-wh-pill bg-wh-surface px-[18px] py-[11px]"
    >
      <Text className="font-wh-heavy text-wh-base text-wh-pill-text">Nudge</Text>
      {pips ? (
        <View className="flex-row gap-1">
          {Array.from({ length: pips }, (_, i) =>
            i < (remaining ?? 0) ? (
              <View key={i} className="h-[7px] w-[7px] rounded-wh-pill bg-wh-primary" />
            ) : (
              // #E4CFA8 / #4A3193 — the same pair as `linkRule`, used here as a
              // spent pip. Written inline rather than borrowing that token's
              // name; promote it if a third use turns up.
              <View
                key={i}
                className="h-[7px] w-[7px] rounded-wh-pill bg-[#E4CFA8] dark:bg-[#4A3193]"
              />
            )
          )}
        </View>
      ) : null}
    </ChunkyPressable>
  );
}

/** The quiet line opposite the Nudge pill: what this solve does and doesn't do. */
export function FooterNote({ children }: { children: string }) {
  return <Text className="font-wh-bold text-wh-sm text-wh-text-whisper">{children}</Text>;
}
