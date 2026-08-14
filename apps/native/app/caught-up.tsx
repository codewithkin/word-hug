import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky } from '@/components/chunky';
import { DailyAltHeader, DailyEyebrow } from '@/components/daily-chrome';
import { useAppTheme } from '@/contexts/app-theme-context';
import { Appear, Breathe } from '@/components/motion';
import { GuessNote } from '@/components/notice';
import {
  BOARD_TIMINGS,
  ClueStack,
  FooterNote,
  LetterKeys,
  NudgeButton,
} from '@/components/puzzle-board';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 09 Daily · Caught up ──────────────────────────────────────────────────
 * Built from `designs/extracted/09-caught-up-light.html` and
 * `09-caught-up-dark.html`, read in full, both themes.
 *
 * What a player sees when there is genuinely nothing new: today is solved and
 * so is every day in the archive. Instead of a wall, an old puzzle worth
 * playing again — "You've caught up — here's one worth a second go".
 *
 * Two lines carry the whole state. The eyebrow says "Replay · first seen
 * 2 May" rather than a date, so the player is never briefly confused about
 * which puzzle this is. The footer says "Replays don't change your streak",
 * which is the reassurance the screen exists to give: replaying cannot inflate
 * a number, and therefore cannot be a chore. A game optimising for time-in-app
 * would have made the replay *count*.
 *
 * ── Why the answer row is written here and not taken from puzzle-board ────
 * The unfilled tiles on this screen are #F6E9CE over rgba(160,130,80,0.22) in
 * light and #2E1D63 over rgba(0,0,0,0.35) in dark — warmer and one step
 * lighter than `answerTileEmpty` (#F3E3C4 / #251652), which is what every
 * other board uses. It is a small difference and a consistent one across both
 * themes, so it reads as deliberate: a replay board is a shade softer than a
 * board that counts.
 *
 * Rather than thread a variant through `AnswerRow` for one screen — which
 * would put a branch in the component two real screens depend on, to serve a
 * difference nobody has seen on a device yet — the row is reproduced here. If
 * it turns out on device to be an artefact of the export rather than a
 * decision, deleting these thirty lines and calling `AnswerRow` is the fix.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['TOOTH', 'HAIR', 'PAINT'];
const ANSWER_LENGTH = 5;

/** Nothing spent yet — this board has just opened. */
const KEYS = [
  { letter: 'B' },
  { letter: 'E' },
  { letter: 'H' },
  { letter: 'R' },
  { letter: 'S' },
  { letter: 'U' },
];

function ReplayAnswerRow({ length }: { length: number }) {
  // The inset shadow has to be read from the theme rather than written as a
  // `dark:` class, because it is a `boxShadow` string and not a colour: there
  // is no CSS variable for it to go through, so `Chunky` cannot carry it.
  const { isDark } = useAppTheme();
  const sunken = isDark ? 'inset 0 3px 0 rgba(0,0,0,0.35)' : 'inset 0 3px 0 rgba(160,130,80,0.22)';

  return (
    <Appear delay={BOARD_TIMINGS.board} rise={6} className="flex-row items-center gap-[9px]">
      <View className="flex-1 flex-row gap-[7px]">
        {Array.from({ length }, (_, i) =>
          i === 0 ? (
            <Chunky
              key={i}
              offset={4}
              shadowVar="--color-wh-answer-tile-active-shadow"
              className="h-[62px] flex-1 items-center justify-center rounded-wh-card border-[3px] border-wh-primary bg-wh-answer-tile-active"
            >
              {/* A breath, not a blink. Nothing may imply a clock (rule 1). */}
              <Breathe>
                <View className="h-7 w-[3px] rounded-[2px] bg-wh-primary" />
              </Breathe>
            </Chunky>
          ) : (
            // The replay board's softer empty tile. See the note above.
            <View
              key={i}
              className="h-[62px] flex-1 rounded-wh-card bg-[#F6E9CE] dark:bg-[#2E1D63]"
              style={{ boxShadow: sunken }}
            />
          )
        )}
      </View>

      {/* Flat, with no shadow: the "not yet" state. Nothing has been typed, so
          there is nothing to check — and the absence of elevation is the whole
          message. No greyed amber, no dimmed opacity. */}
      <View
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel="Check answer, not enough letters yet"
        className="h-[62px] w-[62px] items-center justify-center rounded-[19px] bg-wh-submit-idle"
      >
        <Text className="font-wh-bold text-wh-h2 text-wh-submit-idle-text">→</Text>
      </View>
    </Appear>
  );
}

export default function CaughtUp() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <DailyAltHeader onMenu={() => router.back()} />
        <DailyEyebrow>Replay · first seen 2 May</DailyEyebrow>

        <ClueStack clues={CLUES} />

        <View className="gap-[11px] px-5">
          <ReplayAnswerRow length={ANSWER_LENGTH} />
          <LetterKeys keys={KEYS} />
        </View>

        {/* 14.5px rather than 15 — this note says more than the guess notes do
            and the design gives it a touch less size to fit on one line. */}
        <GuessNote size={14.5} delay={BOARD_TIMINGS.footer}>
          You&apos;ve caught up — here&apos;s one worth a second go
        </GuessNote>

        <Appear
          delay={BOARD_TIMINGS.footer}
          className="h-[60px] flex-row items-center justify-between px-[22px]"
        >
          <NudgeButton onPress={() => router.push('/nudge-picker')} />
          <FooterNote>Replays don&apos;t change your streak</FooterNote>
        </Appear>
      </View>
    </View>
  );
}
