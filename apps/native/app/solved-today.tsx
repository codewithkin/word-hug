import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyAltHeader, DailyEyebrow } from '@/components/daily-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';
import { SolvedBoard } from '@/components/solved-board';

/**
 * ── 09 Daily · Solved today ───────────────────────────────────────────────
 * Built from `designs/extracted/09-solved-today-light.html` and
 * `09-solved-today-dark.html`, read in full, both themes.
 *
 * The resting state of the Daily screen once today is done. It is what a
 * player sees on their *second* visit of the day, so it is a screen the app
 * shows a lot, and the design's decision is to make it a place to stop.
 *
 * The three clue rows now show the compound words completed, with the shared
 * half in teal — GREEN·HOUSE, HOUSE·BOAT, LIGHT·HOUSE — and the answer sits
 * below on an accent slab. There is no keyboard, no submit arrow and no board
 * to interact with. The puzzle is over and the screen says so.
 *
 * ── What the design conspicuously does not put here ───────────────────────
 * No countdown to the next puzzle. No "come back in 14h 22m". No share sheet
 * pushed at the player, no rating prompt, no ad, and no offer. The only way
 * onward is PLAY THE ARCHIVE, which leads to more of the thing they came for
 * and costs nothing. Rule 1 forbids anything implying a clock, and a
 * next-puzzle timer is the single most obvious thing to put on this screen —
 * which is exactly why its absence is worth a paragraph.
 *
 * The streak pill in the footer shows a number and no verb. It is not a
 * "protect your streak" call to action; it is a fact, sitting quietly.
 *
 * ── The distinction between this and overlay A ────────────────────────────
 * The solve celebration (overlay A) is the *moment* of solving — it washes
 * over the board once and is dismissed. This is the *state* afterwards, which
 * persists all day. They draw the same content and are not the same screen.
 *
 * ── STATE (session 6) ─────────────────────────────────────────────────────
 * The body of this screen is `components/solved-board.tsx` now, and the Daily
 * screen renders the same component for its `done` phase — which is how anyone
 * will actually meet it. This route survives only so the state can still be
 * opened from the scaffolding link row, and it keeps the design's own
 * placeholder solve so it looks the same as it did when it was walked.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Each row is a compound word; `hug` is the half all three share. */
const SOLVED = [
  { before: 'GREEN', hug: 'HOUSE', after: '' },
  { before: '', hug: 'HOUSE', after: 'BOAT' },
  { before: 'LIGHT', hug: 'HOUSE', after: '' },
];

export default function SolvedToday() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <DailyAltHeader onMenu={() => router.back()} />
        <DailyEyebrow>Monday 10 August</DailyEyebrow>

        <SolvedBoard
          rows={SOLVED}
          answer="HOUSE"
          streak={13}
          onArchive={() => router.push('/archive-puzzle')}
        />
      </View>
    </View>
  );
}
