import { router } from 'expo-router';
import { View } from 'react-native';
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
 * ── 11 Archive Puzzle ─────────────────────────────────────────────────────
 * Built from `designs/extracted/11-archive-puzzle-light.html` and
 * `11-archive-puzzle-dark.html`, read in full, both themes.
 *
 * A puzzle from one of the last seven days. Identical to the Daily board
 * except for two things, and both of them are the product's manners:
 *
 * · **No streak, no coins in the header.** Just a back button, the date, and
 *   help. Nothing here is being counted.
 * · **"Replay · doesn't affect your streak"** in the footer. The single most
 *   reassuring line in the app: it says out loud that going back to catch up
 *   cannot cost you anything. A game that wanted engagement would have made
 *   the archive a way to *repair* a streak, which would turn missing a day
 *   into a debt. This one just lets you play an old puzzle.
 *
 * The board is captured at the start: nothing typed, the caret on the first
 * tile, and the submit arrow flat rather than amber. That flatness is the
 * "not yet" state — see `components/puzzle-board.tsx`.
 *
 * ── Note (session 3) ──────────────────────────────────────────────────────
 * A static route for now. When screen 10 (Archive) exists this becomes
 * `/archive/[date]` and takes the day from the URL; the puzzle content, the
 * keyboard and the caret all come from the game state that does not exist
 * yet. The content below is the design's own Saturday.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['CARD', 'SPRING', 'SURF'];
const ANSWER_LENGTH = 5;
const KEYS = [{ letter: 'A' }, { letter: 'B' }, { letter: 'D' }, { letter: 'O' }, { letter: 'R' }];

export default function ArchivePuzzle() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <PuzzleHeader title="Archive" />
        <PuzzleEyebrow>Saturday 8 August</PuzzleEyebrow>

        <ClueStack clues={CLUES} />

        <View className="gap-[11px] px-5">
          <AnswerRow length={ANSWER_LENGTH} typed="" />
          <LetterKeys keys={KEYS} />
        </View>

        {/* The design leaves 34px of air where the pack screen puts its nudge
            hint. Kept as a spacer rather than closed up, so the footer sits at
            the same height on both screens. */}
        <View className="h-[34px]" />

        <Appear
          delay={BOARD_TIMINGS.footer}
          className="h-[60px] flex-row items-center justify-between px-[22px]"
        >
          <NudgeButton onPress={() => router.push('/nudge-picker')} />
          <FooterNote>Replay · doesn&apos;t affect your streak</FooterNote>
        </Appear>
      </View>
    </View>
  );
}
