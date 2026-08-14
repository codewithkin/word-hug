import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { Sheet } from '@/components/sheet';

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
 * The three rungs are hard-coded to the design's own state — one free, one
 * priced, one not yet reached — because there is no coin balance or hint state
 * to drive them from yet. When the storage layer lands (plans/05 §6.1) the
 * `state` on each rung comes from there and this file stops holding content.
 * ──────────────────────────────────────────────────────────────────────────
 */

/**
 * `textMuted` in light, `textQuiet` in dark. Light collapses the two into one
 * colour (#9C8A73 / #8C7A66 are near-identical there); dark keeps them apart.
 * Written out in full so Tailwind can see both classes as literals.
 */
const QUIET_TEXT = 'text-wh-text-muted dark:text-wh-text-quiet';

type RungState = 'free' | 'priced' | 'later';

interface Rung {
  n: string;
  label: string;
  trailing: string;
  state: RungState;
}

const RUNGS: Rung[] = [
  { n: '1', label: 'A category for the answer', trailing: 'Read it', state: 'free' },
  { n: '2', label: 'The first letter', trailing: '1 coin', state: 'priced' },
  { n: '3', label: 'The whole answer', trailing: 'Later', state: 'later' },
];

function NudgeRung({ rung, onPress }: { rung: Rung; onPress?: () => void }) {
  const later = rung.state === 'later';

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
        accessibilityLabel={`${rung.label}. Opens after the earlier nudges.`}
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
          <Text className="font-wh-heavy text-[15px] text-wh-clue-text">12</Text>
        </View>
      </View>

      <View className="gap-[9px]">
        {RUNGS.map((rung) => (
          <NudgeRung key={rung.n} rung={rung} onPress={() => router.back()} />
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
