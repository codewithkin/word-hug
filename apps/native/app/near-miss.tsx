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
 * ── 09 Daily · Near miss ──────────────────────────────────────────────────
 * Built from `designs/extracted/09-near-miss-light.html` and
 * `09-near-miss-dark.html`, read in full, both themes.
 *
 * One letter off. Structurally identical to the wrong-guess state — same
 * board, same untouched tiles, same amber arrow — and different in exactly one
 * respect: the pill turns teal and the sentence becomes "So close — one letter
 * off".
 *
 * That single difference is the product's whole theory of feedback. Word Hug
 * has no vocabulary for *worse* — no red, no severity ladder, nothing that
 * escalates — so its only lever is to become *warmer* when the player is
 * close. `gentle` and `close` are the two tones, and there is no third.
 *
 * The teal wash (#E6F6F4 in light, #123F3C in dark) appears nowhere else in
 * the export and is not a tint of `accent`; see components/notice.tsx.
 *
 * ── Why "one letter off" is a safe thing to say ───────────────────────────
 * It is information the player could work out by trying, given away for free,
 * with no coin and no nudge spent. It is the opposite of a hint economy: the
 * game volunteers help at the moment it would be most tempting to sell it.
 *
 * STATE: none. HORSE is the design's own near miss. Like the wrong-guess
 * state, this file disappears when the guess handler exists — the tone becomes
 * a value the Daily screen computes, not a route.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['GREEN', 'BOAT', 'LIGHT'];
const TYPED = 'HORSE';

/** U alone is unspent here — the mirror of the wrong-guess state's H. */
const KEYS = [
  { letter: 'E', used: true },
  { letter: 'H', used: true },
  { letter: 'O', used: true },
  { letter: 'R', used: true },
  { letter: 'S', used: true },
  { letter: 'U' },
];

export default function NearMiss() {
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

        <GuessNote tone="close" delay={BOARD_TIMINGS.footer}>
          So close — one letter off
        </GuessNote>

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
