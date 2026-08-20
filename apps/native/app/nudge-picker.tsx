import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { Sheet } from '@/components/sheet';
import { NUDGE_RUNGS, categoryLabel } from '@/lib/nudges';
import { puzzleById, puzzleForDate } from '@/lib/puzzles';
import { effectiveToday, getCoins, getNudgeTier, setNudgeTier, spendCoins } from '@/lib/storage';

/**
 * ── Overlay B · Nudge picker ──────────────────────────────────────────────
 * Built from `designs/extracted/b-nudge-picker-light.html` and
 * `b-nudge-picker-dark.html`, read in full, both themes.
 *
 * What the Nudge button on three screens opens. It is the only place in Word
 * Hug where the player is offered help, and the whole design of it is an
 * argument that help is not a failure:
 *
 * · **The first nudge is free** and says "Read it", not "Unlock". A category
 *   for the answer costs nothing, ever. The paid rung is the second one.
 * · **The third rung says "Later", not "Locked".** It is dimmed because the
 *   nudges open in order, not because it is being sold. There is no price on
 *   it and no way to buy past the queue.
 * · **Nothing here closes the puzzle.** Taking a nudge, or taking none, leaves
 *   the board exactly where it was. Running out is overlay C, which is a
 *   different screen and also does not stop you (rule 1).
 *
 * ── STATE (session 7) ─────────────────────────────────────────────────────
 * Live. The balance is `getCoins()` and the rung states come from
 * `getNudgeTier(puzzleId)`, so **the coin pill here and the one in the Daily
 * header now read the same number from the same place.** They disagreed before
 * because this file had `12` written into it and the header had the real
 * balance — the bug the owner reported.
 *
 * Taking a rung writes the tier to storage and closes the sheet. The board
 * picks it up on focus (`useDailyPuzzle`'s `refresh`), which is deliberate:
 * the nudge survives the app being killed, so a player who paid a coin and
 * then lost the process has not lost the coin.
 *
 * `puzzleId` arrives as a route param and falls back to today's daily, so the
 * sheet still works when opened from the scaffolding link row with no params.
 * ──────────────────────────────────────────────────────────────────────────
 */

/**
 * `textMuted` in light, `textQuiet` in dark. Light collapses the two into one
 * colour (#9C8A73 / #8C7A66 are near-identical there); dark keeps them apart.
 * Written out in full so Tailwind can see both classes as literals.
 */
const QUIET_TEXT = 'text-wh-text-muted dark:text-wh-text-quiet';

type RungState = 'free' | 'priced' | 'later' | 'taken';

interface Rung {
  n: string;
  label: string;
  trailing: string;
  state: RungState;
}

/**
 * The design's three rungs, with `state` derived from what has actually been
 * taken on this puzzle.
 *
 * `taken` is new and the design has no drawing for it, so it borrows the
 * `later` treatment — dimmed and not pressable — with a trailing "Taken"
 * instead of "Later". The alternative was leaving a spent rung looking
 * pressable, which would read as the coin not having been spent.
 */
function rungsFor(tier: 0 | 1 | 2 | 3, coins: number): Rung[] {
  return NUDGE_RUNGS.map(({ tier: n, label, cost }) => {
    const trailingWhenOpen = cost === 0 ? 'Read it' : `${cost} coin${cost === 1 ? '' : 's'}`;

    if (n <= tier) return { n: String(n), label, trailing: 'Taken', state: 'taken' as const };
    if (n > tier + 1) return { n: String(n), label, trailing: 'Later', state: 'later' as const };

    // The next rung. Priced rungs stay pressable at a zero balance — pressing
    // opens overlay C, which is a screen about what is still free. A rung that
    // went dead at zero coins would be a wall, and rule 1 forbids one.
    void coins;
    return {
      n: String(n),
      label,
      trailing: trailingWhenOpen,
      state: cost === 0 ? ('free' as const) : ('priced' as const),
    };
  });
}

function NudgeRung({ rung, onPress }: { rung: Rung; onPress?: () => void }) {
  const later = rung.state === 'later' || rung.state === 'taken';

  const body = (
    <View className="flex-row items-center gap-3 px-[14px] py-[13px]">
      {later ? (
        // #E4D3B2 / #3A2478 — the spent-numeral chip. The light value appears
        // only here in the whole export; the dark one is `answerTileActive`
        // doing a second job. Written inline rather than tokenised as a pair
        // that is really two unrelated colours.
        <View className="h-[30px] w-[30px] items-center justify-center rounded-wh-sm bg-[#E4D3B2] dark:bg-wh-answer-tile-active">
          <Text className={`font-wh-heavy text-wh-base ${QUIET_TEXT}`}>{rung.n}</Text>
        </View>
      ) : (
        <View className="h-[30px] w-[30px] items-center justify-center rounded-wh-sm bg-wh-primary">
          <Text className="font-wh-heavy text-wh-base text-wh-on-primary">{rung.n}</Text>
        </View>
      )}

      <Text
        className={
          later
            ? `flex-1 font-wh-bold text-[15.5px] ${QUIET_TEXT}`
            : 'flex-1 font-wh-bold text-[15.5px] text-wh-clue-text'
        }
      >
        {rung.label}
      </Text>

      <Text
        className={
          rung.state === 'free'
            ? 'font-wh-heavy text-[13.5px] text-wh-accent-text'
            : `font-wh-heavy text-[13.5px] ${QUIET_TEXT}`
        }
      >
        {rung.trailing}
      </Text>
    </View>
  );

  // The dimmed rung is not pressable and does not pretend to be: no shadow to
  // compress, no press state, and an accessibility label that says why rather
  // than just "disabled".
  if (later) {
    return (
      <View
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={
          rung.state === 'taken'
            ? `${rung.label}. Already taken.`
            : `${rung.label}. Opens after the earlier nudges.`
        }
        className="rounded-[18px] bg-wh-answer-tile-empty"
      >
        {body}
      </View>
    );
  }

  // A plain Pressable, not a ChunkyPressable: these rows are drawn flat, with
  // no offset shadow, so there is nothing for a press to compress into. Giving
  // them the chunky give would invent an elevation the design does not have.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${rung.label}. ${rung.trailing}.`}
      className="rounded-[18px] bg-wh-surface-inset dark:bg-wh-answer-tile-active"
    >
      {body}
    </Pressable>
  );
}

export default function NudgePicker() {
  const params = useLocalSearchParams<{ puzzleId?: string }>();

  // Falls back to today's daily so the sheet still works when the scaffolding
  // link row opens it with no params.
  const puzzle =
    (params.puzzleId ? puzzleById(params.puzzleId) : undefined) ?? puzzleForDate(effectiveToday());

  const [coins, setCoins] = useState(getCoins);
  const [tier, setTier] = useState<0 | 1 | 2 | 3>(() => (puzzle ? getNudgeTier(puzzle.id) : 0));

  const rungs = rungsFor(tier, coins);

  function take(rung: Rung) {
    if (!puzzle) return;

    const next = Number(rung.n) as 1 | 2 | 3;
    const cost = NUDGE_RUNGS.find((r) => r.tier === next)?.cost ?? 0;

    // A priced rung at a zero balance sends the player to overlay C rather
    // than failing quietly. `replace`, so backing out of that sheet does not
    // land them here again with the same empty wallet.
    if (cost > 0 && !spendCoins(cost)) {
      router.replace('/zero-coin');
      return;
    }

    setNudgeTier(puzzle.id, next);
    setTier(next);
    setCoins(getCoins());

    // The free rung stays open so the category can be re-read; a paid one has
    // done its job and the player wants to be back at the board.
    if (cost > 0) router.back();
  }

  return (
    <Sheet lift onDismiss={() => router.back()}>
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 font-wh-bold text-wh-h3 text-wh-clue-text">Need a nudge?</Text>

        <View className="flex-row items-center gap-2 rounded-wh-pill bg-wh-surface-inset py-2 pl-[10px] pr-[14px] dark:bg-wh-answer-tile-active">
          <Chunky
            offset={-3}
            inset
            shadowVar="--color-wh-coin-dot-shadow"
            className="h-[22px] w-[22px] rounded-wh-pill bg-wh-primary"
          />
          <Text className="font-wh-heavy text-[15px] text-wh-clue-text">{coins}</Text>
        </View>
      </View>

      {/* What the free rung bought, shown in place rather than as a toast.
          The sheet stays open after tier 1 precisely so this can be read. */}
      {tier >= 1 && puzzle ? (
        <View className="rounded-[18px] bg-wh-surface-inset px-[14px] py-3 dark:bg-wh-answer-tile-active">
          <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-accent-text">
            The category
          </Text>
          <Text className="pt-1 font-wh-bold text-[15.5px] text-wh-clue-text">
            {categoryLabel(puzzle)}
            {tier >= 2 ? ` · starts with ${puzzle.answer.charAt(0).toUpperCase()}` : ''}
          </Text>
        </View>
      ) : null}

      <View className="gap-[9px]">
        {rungs.map((rung) => (
          <NudgeRung key={rung.n} rung={rung} onPress={() => take(rung)} />
        ))}
      </View>

      {/* The sentence that makes the dimmed rung read as a queue rather than
          as a paywall. It is doing more work than its size suggests. */}
      <Text className={`font-wh-regular text-[13.5px] leading-[19px] ${QUIET_TEXT}`}>
        They open in order, up to three per puzzle.
      </Text>
    </Sheet>
  );
}
