import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Breathe, Land, STAGGER } from '@/components/motion';

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
 * ── Key size (session 7) ──────────────────────────────────────────────────
 * The owner reported the archive keys reading as too small next to the Daily
 * board's. They were: Daily draws 56px caps and this drew 54px ones with a
 * smaller type size, on a row that also carries a fixed-width backspace — so
 * with six letters each cap came out around 40px wide against Daily's 52. The
 * caps are now 56px tall with `h2` type, matching the board they sit next to.
 *
 * ── The submit button ─────────────────────────────────────────────────────
 * When the answer is too short it is flat: `submitIdle`, no shadow, no amber.
 * That is the only control in the app with no elevation, and the absence is
 * the whole message. There is no greyed-out amber and no dimmed opacity,
 * because both of those read as "you did something wrong" (rule 1); this just
 * reads as "not yet".
 */

/**
 * ── The two primitives every board shares (session 7) ─────────────────────
 *
 * The owner reported that the answer keys did not match between screens, and
 * they did not: the Daily screen drew its own 56px caps with `h2` type, this
 * file drew 54px caps with `h3`, and onboarding step 2 drew a third set. Three
 * copies of the same control drift the moment one of them is corrected.
 *
 * `AnswerTile` and `KeyCap` are now the only places a tile or a cap is drawn.
 * Every screen composes them; nothing re-implements them. The layouts still
 * differ — Daily centres fixed-width tiles, the archive and pack boards flex
 * them across the full width, and that difference is in the designs — but the
 * thing inside the layout is one component.
 *
 * **If a correction is needed, it goes here and lands everywhere at once.**
 */

export interface AnswerTileProps {
  /** The letter, or undefined for an empty slot. */
  letter?: string;
  /** Draws the breathing caret. */
  caret?: boolean;
  /** Fixed px width (Daily), or flex across the row (archive, pack, level). */
  width?: number;
  /** 64 on Daily, 62 on the shared board. */
  height?: number;
}

export function AnswerTile({ letter, caret, width, height = 62 }: AnswerTileProps) {
  const sizing = width === undefined ? undefined : { width };
  const flex = width === undefined ? 'flex-1 ' : '';

  if (letter !== undefined) {
    return (
      <Chunky
        offset={4}
        shadowVar="--color-wh-answer-tile-shadow"
        style={{ height, ...sizing }}
        className={`${flex}items-center justify-center rounded-wh-card bg-wh-answer-tile`}
      >
        {/* A letter lands rather than appears. Keyed by the caller so
            backspacing and retyping the same letter replays the drop. */}
        <Land key={letter}>
          <Text className="font-wh-bold text-wh-h1 text-wh-answer-tile-text">{letter}</Text>
        </Land>
      </Chunky>
    );
  }

  if (caret) {
    return (
      <Chunky
        offset={4}
        shadowVar="--color-wh-answer-tile-active-shadow"
        style={{ height, ...sizing }}
        className={`${flex}items-center justify-center rounded-wh-card border-[3px] border-wh-primary bg-wh-answer-tile-active`}
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
      offset={3}
      inset
      shadowVar="--color-wh-answer-tile-empty-shadow"
      style={{ height, ...sizing }}
      className={`${flex}rounded-wh-card bg-wh-answer-tile-empty`}
    />
  );
}

export interface KeyCapProps {
  letter: string;
  /** Dimmed, but never disabled — a repeated letter needs the key twice. */
  used?: boolean;
  width?: number;
  onPress?: () => void;
}

export function KeyCap({ letter, used, width, onPress }: KeyCapProps) {
  const sizing = width === undefined ? undefined : { width };
  const flex = width === undefined ? 'flex-1 ' : '';

  return (
    <ChunkyPressable
      offset={3}
      shadowVar={used ? '--color-wh-key-cap-dim-shadow' : '--color-wh-key-cap-shadow'}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={used ? `Letter ${letter}, already used` : `Letter ${letter}`}
      style={sizing}
      className={
        used
          ? `${flex}h-[56px] items-center justify-center rounded-[15px] bg-wh-key-cap-dim`
          : `${flex}h-[56px] items-center justify-center rounded-[15px] bg-wh-key-cap`
      }
    >
      <Text
        className={
          used
            ? 'font-wh-bold text-wh-h2 text-wh-key-cap-dim-text'
            : 'font-wh-bold text-wh-h2 text-wh-key-cap-text'
        }
      >
        {letter}
      </Text>
    </ChunkyPressable>
  );
}

/** The backspace key. Same height as a cap, its own fixed width. */
export function BackspaceKey({ onPress }: { onPress?: () => void }) {
  return (
    <ChunkyPressable
      offset={3}
      shadowVar="--color-wh-surface-shadow"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Delete letter"
      className="h-[56px] w-[52px] items-center justify-center rounded-[15px] bg-wh-surface"
    >
      <Text className="font-wh-bold text-wh-xl text-wh-text-faint dark:text-wh-text-secondary">
        ⌫
      </Text>
    </ChunkyPressable>
  );
}

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
        {Array.from({ length }, (_, i) => (
          <AnswerTile
            key={i}
            letter={letters[i]}
            caret={i === letters.length}
          />
        ))}
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
    <Appear delay={IN.keys} rise={6} className="flex-row gap-[6px]">
      {keys.map(({ letter, used }) => (
        <KeyCap key={letter} letter={letter} used={used} onPress={() => onKey?.(letter)} />
      ))}

      <BackspaceKey onPress={onBackspace} />
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
