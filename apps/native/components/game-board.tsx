import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Breathe, Land, STAGGER, Shake } from '@/components/motion';

/**
 * ── The board, once ───────────────────────────────────────────────────────
 * Session 8. The Daily screen's layout, extracted so every puzzle screen is
 * literally the same thing.
 *
 * The owner's report was that the level screen's answer tiles "lack horizontal
 * padding like on the archive screen", and that the daily screen "is perfect —
 * copy the layout and buttons there". They were right about the cause: the
 * level screen composed `AnswerRow` and `LetterKeys`, which flex edge-to-edge
 * across a 20px-padded row, while Daily centres fixed-width tiles with 22px
 * gutters and a taller action bar. Two layouts, one of them liked.
 *
 * So this is Daily's, and it is now the only one. `AnswerRow`/`LetterKeys` in
 * `puzzle-board.tsx` remain for the pack and archive boards that were drawn
 * that way in the export, but no new screen should reach for them.
 *
 * ── What the caller supplies ──────────────────────────────────────────────
 * Only state and handlers. Every dimension, colour and animation timing lives
 * here, which is the property that stopped three copies drifting apart.
 *
 * ── Session 8b: the aid that stayed ───────────────────────────────────────
 * The owner could not solve the early levels, and asked for help to be on
 * everywhere rather than tuned per screen. Putting it here is what makes
 * "everywhere" true — daily, the free run and the packs all render this
 * component, so none of them can drift out of step.
 *
 * A second aid printed the category on every board. It was reverted in 8c: it
 * gave away the thing tier 1 of the hint ladder sells, and a currency with one
 * remaining sink is not much of a currency. The category is a paid rung again
 * — see `lib/nudges.ts`.
 *
 * · **Correct-position letters go teal after a wrong guess.** Feedback rather
 *   than a hint: it tells you about the guess you made, not about the answer
 *   you have not made. Teal is `--color-wh-accent`, the existing secondary —
 *   no new "success green" was added, because the palette has no pure green
 *   and one would have looked imported from another product.
 */

const IN = {
  clues: 120,
  tiles: 120 + 3 * STAGGER,
  keys: 120 + 3 * STAGGER + 80,
  actions: 120 + 3 * STAGGER + 140,
};

export { IN as GAME_BOARD_TIMINGS };

export interface GameBoardProps {
  clues: string[];
  /** How many letters the answer has. */
  length: number;
  /** What is in the tiles right now, uppercase. */
  typed: string;
  /**
   * One entry per letter occurrence in the answer, plus decoys — see
   * `keysFor`. **May contain the same letter twice**, which is the point:
   * `EYE` offers two Es.
   */
  keys: string[];
  /** The coin balance, shown on the hint button's badge. */
  coins: number;
  canSubmit: boolean;
  /** Increments to shake the board on a wrong guess. */
  shakeTrigger?: number;
  /**
   * Positions confirmed correct by the last wrong guess.
   *
   * A set of indices rather than a string, because the marks belong to slots
   * and not to letters — the same letter can be right in one slot and wrong in
   * another, and the player needs to be told which.
   */
  correctAt?: ReadonlySet<number>;
  onKey: (letter: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onHint: () => void;
}

export function GameBoard({
  clues,
  length,
  typed,
  keys,
  coins,
  canSubmit,
  shakeTrigger = 0,
  correctAt,
  onKey,
  onBackspace,
  onSubmit,
  onHint,
}: GameBoardProps) {
  // Five 56px tiles is the design. Six of them overflow 360dp, so past five
  // they narrow — every answer up to five letters renders exactly as drawn.
  const tileWidth = length > 5 ? 46 : 56;

  return (
    <>
      {/* ── The three clues ─────────────────────────────────────────────
          Each carries the dashed "?" slot, which is the Daily screen's own
          detail and the visual promise that one word fills all three. */}
      <View className="flex-1 justify-center gap-3 px-[22px] pt-[6px]">
        {clues.map((clue, i) => (
          <Appear key={clue} index={i} delay={IN.clues}>
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="h-[70px] flex-row items-center justify-between rounded-wh-xl bg-wh-clue-card pl-[22px] pr-4"
            >
              <Text className="font-wh-bold text-wh-display tracking-[0.01em] text-wh-clue-text">
                {clue}
              </Text>
              <View className="h-[46px] w-[46px] items-center justify-center rounded-wh-md border-[2.5px] border-dashed border-wh-clue-slot-border bg-wh-clue-slot">
                <Text className="font-wh-bold text-wh-xxl text-wh-clue-slot-text">?</Text>
              </View>
            </Chunky>
          </Appear>
        ))}
      </View>

      {/* The board shakes; the clues above do not. Moving the three words the
          player is reading would be moving the one thing that is not wrong. */}
      <Shake trigger={shakeTrigger}>
        {/* ── The answer tiles ─────────────────────────────────────────── */}
        <View className="h-[96px] flex-row items-center justify-center gap-[9px]">
          {Array.from({ length }, (_, i) => {
            const letter = typed[i];
            const isCaret = i === typed.length;
            const confirmed = correctAt?.has(i) ?? false;

            if (letter !== undefined) {
              return (
                <Chunky
                  key={i}
                  offset={4}
                  shadowVar={
                    confirmed ? '--color-wh-accent-shadow' : '--color-wh-answer-tile-shadow'
                  }
                  style={{ width: tileWidth }}
                  className={
                    confirmed
                      ? 'h-16 items-center justify-center rounded-wh-card bg-wh-accent'
                      : 'h-16 items-center justify-center rounded-wh-card bg-wh-answer-tile'
                  }
                >
                  {/* Keyed on letter AND position, so backspacing and retyping
                      the same letter in the same slot replays the landing. */}
                  <Land key={`${letter}-${i}`}>
                    <Text
                      className={
                        confirmed
                          ? 'font-wh-bold text-wh-display text-wh-on-accent'
                          : 'font-wh-bold text-wh-display text-wh-answer-tile-text'
                      }
                    >
                      {letter}
                    </Text>
                  </Land>
                </Chunky>
              );
            }

            if (isCaret) {
              return (
                <Chunky
                  key={i}
                  offset={4}
                  shadowVar="--color-wh-answer-tile-active-shadow"
                  style={{ width: tileWidth }}
                  className="h-16 items-center justify-center rounded-wh-card border-[3px] border-wh-primary bg-wh-answer-tile-active"
                >
                  {/* Not a blinking cursor: a still amber bar that breathes. */}
                  <Breathe>
                    <View className="h-[30px] w-[3px] rounded-[2px] bg-wh-primary" />
                  </Breathe>
                </Chunky>
              );
            }

            return (
              <Appear key={i} index={i} delay={IN.tiles} rise={4}>
                <Chunky
                  offset={3}
                  inset
                  shadowVar="--color-wh-answer-tile-empty-shadow"
                  style={{ width: tileWidth }}
                  className="h-16 rounded-wh-card bg-wh-answer-tile-empty"
                />
              </Appear>
            );
          })}
        </View>

        {/* ── Letter keys ──────────────────────────────────────────────── */}
        <View className="h-[74px] flex-row items-center justify-center gap-2 px-[22px]">
          {keys.map((key, i) => {
            /**
             * ── Dimming, per occurrence ──────────────────────────────────
             * `EYE` shows two Es. Typing one must dim exactly one of them, so
             * "spent" cannot be `used.has(letter)` — that would grey both and
             * tell the player the letter is gone.
             *
             * `rank` is which copy of this letter this key is (1st, 2nd, …).
             * The key dims once the typed word contains at least that many of
             * it. So the first E dims after one E is typed and the second only
             * after two, which is exactly what the player has done.
             */
            const rank = keys.slice(0, i + 1).filter((k) => k === key).length;
            const typedCount = [...typed].filter((c) => c === key).length;
            const spent = typedCount >= rank;

            return (
              // Index, not letter: `keys` can hold the same letter twice and a
              // duplicate React key silently drops one of the caps.
              <Appear key={`${key}-${i}`} index={i} delay={IN.keys} rise={6} className="flex-1">
                {/* A spent key dims and stays tappable — an answer with a
                    repeated letter needs it twice, and a dead key is a bug. */}
                <ChunkyPressable
                  offset={3}
                  shadowVar={spent ? '--color-wh-key-cap-dim-shadow' : '--color-wh-key-cap-shadow'}
                  onPress={() => onKey(key)}
                  accessibilityRole="button"
                  /* Says how many are left rather than "already used", which
                     on a repeated letter read as "this one is finished". */
                  accessibilityLabel={
                    spent ? `Letter ${key}, used` : `Letter ${key}`
                  }
                  className={
                    spent
                      ? 'h-14 items-center justify-center rounded-[15px] bg-wh-key-cap-dim'
                      : 'h-14 items-center justify-center rounded-[15px] bg-wh-key-cap'
                  }
                >
                  <Text
                    className={
                      spent
                        ? 'font-wh-bold text-wh-h2 text-wh-key-cap-dim-text'
                        : 'font-wh-bold text-wh-h2 text-wh-key-cap-text'
                    }
                  >
                    {key}
                  </Text>
                </ChunkyPressable>
              </Appear>
            );
          })}
        </View>
      </Shake>
    </>
  );
}

/**
 * The action bar: hint, HUG IT, backspace.
 *
 * Separate from the board above so a screen can put its notice line between
 * them, which is where the guess note and the out-of-hearts toast both go.
 */
export function GameActions({
  coins,
  canSubmit,
  onHint,
  onSubmit,
  onBackspace,
}: Pick<GameBoardProps, 'coins' | 'canSubmit' | 'onHint' | 'onSubmit' | 'onBackspace'>) {
  return (
    <Appear
      delay={IN.actions}
      rise={12}
      className="flex-row items-center gap-[10px] px-[22px] pb-[6px]"
    >
      {/* The hint button. A `?` rather than the lightbulb glyph the design
          drew, because session 8 renamed the whole feature to "hint" and one
          mark should mean help everywhere it appears. The badge is the coin
          balance — what you have to spend, on the button that spends it. */}
      <ChunkyPressable
        offset={4}
        shadowVar="--color-wh-surface-shadow"
        onPress={onHint}
        accessibilityRole="button"
        accessibilityLabel={`Hint. You have ${coins} coins.`}
        className="h-[58px] w-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
      >
        <Text className="font-wh-bold text-wh-h2 text-wh-primary">?</Text>
        <Chunky
          offset={2}
          shadowVar="--color-wh-badge-shadow"
          className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-wh-pill bg-wh-highlight px-1"
        >
          {/* 11px, not the 11.5px `micro` token — this badge is the one place
              the designs use it, so it uses its own value. */}
          <Text className="font-wh-heavy text-[11px] text-white">{coins}</Text>
        </Chunky>
      </ChunkyPressable>

      {/*
        HUG IT stays amber and pressable when the word is short. Greying it out
        is the reflexive choice and is wrong: a disabled primary button tells
        someone they have not done enough yet, and this product has no
        vocabulary for that (rule 1). Pressing it early simply does nothing.
      */}
      <ChunkyPressable
        offset={5}
        shadowVar="--color-wh-primary-shadow"
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
        accessibilityLabel={canSubmit ? 'Hug it' : 'Hug it, not enough letters yet'}
        className="h-[58px] flex-1 items-center justify-center rounded-[19px] bg-wh-primary"
      >
        <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
          HUG IT
        </Text>
      </ChunkyPressable>

      <ChunkyPressable
        offset={4}
        shadowVar="--color-wh-surface-shadow"
        onPress={onBackspace}
        accessibilityRole="button"
        accessibilityLabel="Delete letter"
        className="h-[58px] w-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
      >
        <Text className="font-wh-bold text-wh-xxl text-wh-text-faint dark:text-wh-text-secondary">
          ⌫
        </Text>
      </ChunkyPressable>
    </Appear>
  );
}
