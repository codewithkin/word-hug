import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/motion';
import {
  AnswerRow,
  BOARD_TIMINGS,
  ClueStack,
  FooterNote,
  LetterKeys,
  NudgeButton,
  PuzzleEyebrow,
  PuzzleHeader,
} from '@/components/puzzle-board';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 14 Pack Puzzle ────────────────────────────────────────────────────────
 * Built from `designs/extracted/14-pack-puzzle-light.html` and
 * `14-pack-puzzle-dark.html`, read in full, both themes.
 *
 * A puzzle from a bought pack. The same board as the archive with the pack's
 * name in the header, its position in the eyebrow ("7 OF 30"), and two
 * additions:
 *
 * · **A nudge, already spent.** The pill in the footer shows one of three
 *   pips used, and the bar above the footer shows what that nudge bought:
 *   "Something you'd find on a table". A clue, not a partial answer.
 * · **"Pack solve · no streak"**. Paid puzzles do not feed the streak. That
 *   is the rule that keeps the streak from being something you can buy, and
 *   it means the free daily is never the lesser option (rule 2).
 *
 * There is no price, no coin balance and no upsell anywhere on this screen,
 * even though it is the paid surface — rule 3 says never interrupt the solve,
 * and that applies hardest on the screens someone has already paid for.
 *
 * ── Note (session 3) ──────────────────────────────────────────────────────
 * A static route for now, and the nudge bar is shown because the design shows
 * it; in the game it appears only after a nudge is spent. When screens 12 and
 * 13 exist this becomes `/packs/[pack]/[n]`.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['BUTTER', 'CAKE', 'TEA'];
const ANSWER_LENGTH = 3;
const TYPED = 'CU';
const KEYS = [
  { letter: 'C', used: true },
  { letter: 'E' },
  { letter: 'P' },
  { letter: 'U', used: true },
  { letter: 'S' },
];

export default function PackPuzzle() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <PuzzleHeader title="Cozy Kitchen" />
        <PuzzleEyebrow>7 of 30</PuzzleEyebrow>

        <ClueStack clues={CLUES} />

        <View className="gap-[11px] px-5">
          {/* Two of three letters typed, so the arrow is amber: the answer is
              long enough to be worth checking even though it may be wrong. */}
          <AnswerRow length={ANSWER_LENGTH} typed={TYPED} canSubmit />
          <LetterKeys keys={KEYS} />
        </View>

        {/* ── What the nudge said ──────────────────────────────────────────
            The label is 0.1em-tracked, not the 0.18em of every other eyebrow
            in the app — it sits inline with the sentence here rather than
            over it. Both colours on this bar appear only on this screen. */}
        <Appear delay={BOARD_TIMINGS.footer - 60} className="h-[44px] items-center px-[22px] pt-2">
          <View className="flex-row items-center gap-[10px] rounded-wh-pill bg-wh-surface-quiet px-4 py-[9px]">
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-[0.1em] text-[#B59A6C] dark:text-[#8F79D4]">
              Nudge
            </Text>
            <Text className="font-wh-bold text-[14.5px] text-[#7C6A55] dark:text-[#C6B7EC]">
              Something you&apos;d find on a table
            </Text>
          </View>
        </Appear>

        <Appear
          delay={BOARD_TIMINGS.footer}
          className="h-[60px] flex-row items-center justify-between px-[22px]"
        >
          <NudgeButton remaining={1} total={3} />
          <FooterNote>Pack solve · no streak</FooterNote>
        </Appear>
      </View>
    </View>
  );
}
