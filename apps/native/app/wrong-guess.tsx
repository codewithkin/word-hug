import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyAltHeader, DailyEyebrow, StreakNote } from '@/components/daily-chrome';
import { Appear } from '@/components/motion';
import { GuessNote } from '@/components/notice';
import {
  AnswerRow,
  BOARD_TIMINGS,
  ClueStack,
  LetterKeys,
  NudgeButton,
} from '@/components/puzzle-board';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 09 Daily · Wrong guess ────────────────────────────────────────────────
 * Built from `designs/extracted/09-wrong-guess-light.html` and
 * `09-wrong-guess-dark.html`, read in full, both themes.
 *
 * **This is the screen rule 1 lives or dies on**, so it is worth saying
 * precisely what the design does and does not do when a player gets it wrong.
 *
 * What changes: one sentence appears on a soft pill under the keys — "Not this
 * one — try another". That is all.
 *
 * What does not change, and must never: the typed word stays in the tiles
 * exactly as it was, so nothing has to be retyped. The submit arrow stays
 * amber. No tile turns any colour. Nothing shakes, flashes, buzzes or plays a
 * sound. There is no attempt counter, no "2 tries left", no lives, no timer,
 * and nothing is deducted. The streak line in the footer is unchanged. The
 * player has lost nothing at all, and the screen is careful to look like it.
 *
 * The comparison worth holding in mind: nearly every word game on either store
 * answers a wrong guess with red and a shake. Both of those are in the
 * vocabulary of *correction*, and this product does not have one. See
 * components/motion.tsx for why the note fades rather than slides.
 *
 * STATE: none. MOUSE against a five-letter answer is the design's own guess,
 * hard-coded, as is the used-key state. The real version is one branch of the
 * guess handler in plans/05 §6 — and when it exists, THIS FILE GOES: it becomes
 * a `note` prop on the Daily screen, not a route.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['GREEN', 'BOAT', 'LIGHT'];
const TYPED = 'MOUSE';

/** H is the only key not yet spent. Dimmed keys stay tappable — see LetterKeys. */
const KEYS = [
  { letter: 'E', used: true },
  { letter: 'H' },
  { letter: 'M', used: true },
  { letter: 'O', used: true },
  { letter: 'S', used: true },
  { letter: 'U', used: true },
];

export default function WrongGuess() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <DailyAltHeader onMenu={() => router.back()} />
        <DailyEyebrow>Monday 10 August</DailyEyebrow>

        <ClueStack clues={CLUES} />

        <View className="gap-[11px] px-5">
          <AnswerRow length={5} typed={TYPED} />
          <LetterKeys keys={KEYS} />
        </View>

        <GuessNote delay={BOARD_TIMINGS.footer}>Not this one — try another</GuessNote>

        <Appear
          delay={BOARD_TIMINGS.footer}
          className="h-[60px] flex-row items-center justify-between px-[22px]"
        >
          <NudgeButton onPress={() => router.push('/nudge-picker')} />
          <StreakNote>12 day streak</StreakNote>
        </Appear>
      </View>
    </View>
  );
}
