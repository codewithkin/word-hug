import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { DailyAltHeader, DailyEyebrow } from '@/components/daily-chrome';
import { Appear, Land, STAGGER } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';

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
 * STATE: none. HOUSE against the design's own three clues, hard-coded. When
 * storage lands this becomes the Daily screen's solved branch rather than a
 * route (plans/05 §6.1).
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Each row is a compound word; `hug` is the half all three share. */
const SOLVED = [
  { before: 'GREEN', hug: 'HOUSE', after: '' },
  { before: '', hug: 'HOUSE', after: 'BOAT' },
  { before: 'LIGHT', hug: 'HOUSE', after: '' },
];

const ANSWER = 'HOUSE';

const IN = {
  eyebrow: 60,
  rows: 120,
  answer: 120 + 3 * STAGGER + 60,
  footer: 120 + 3 * STAGGER + 180,
};

export default function SolvedToday() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <DailyAltHeader onMenu={() => router.back()} />
        <DailyEyebrow>Monday 10 August</DailyEyebrow>

        {/* ── The three completed compounds ───────────────────────────── */}
        <View className="flex-1 justify-center gap-[10px] px-[22px] pt-[6px]">
          {SOLVED.map((row, i) => (
            <Appear key={`${row.before}${row.after}`} index={i} delay={IN.rows}>
              <Chunky
                offset={4}
                shadowVar="--color-wh-clue-card-shadow"
                className="h-[62px] flex-row items-center justify-center gap-[2px] rounded-wh-lg bg-wh-clue-card"
              >
                {row.before ? (
                  <Text className="font-wh-bold text-wh-h1 text-wh-clue-text">{row.before}</Text>
                ) : null}
                {/* `accentText`, not `accent`: in dark, #17A398 on the clue
                    card is too dark to read and the design brightens it to
                    #2ED3C0. Light uses the same value for both. */}
                <Text className="font-wh-bold text-wh-h1 text-wh-accent-text">{row.hug}</Text>
                {row.after ? (
                  <Text className="font-wh-bold text-wh-h1 text-wh-clue-text">{row.after}</Text>
                ) : null}
              </Chunky>
            </Appear>
          ))}
        </View>

        {/* ── The answer ──────────────────────────────────────────────── */}
        <View className="items-center gap-[10px] px-[22px] pt-[6px]">
          <Appear delay={IN.answer}>
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
              Today&apos;s hug word
            </Text>
          </Appear>

          {/* `Land` rather than `Appear`: this is the one thing on the screen
              that is unambiguously good news, and the only entrance in the app
              allowed to overshoot. */}
          <Land delay={IN.answer + 90}>
            <Chunky
              offset={5}
              shadowVar="--color-wh-accent-shadow"
              className="rounded-wh-lg bg-wh-accent px-[30px] py-[14px]"
            >
              <Text className="font-wh-bold text-wh-display-lg text-wh-on-accent">{ANSWER}</Text>
            </Chunky>
          </Land>
        </View>

        {/* The design leaves a 62px band of air here — the space the keyboard
            occupies on the unsolved board. Kept, so the footer does not jump
            when the screen changes state. */}
        <View className="h-[62px]" />

        <Appear
          delay={IN.footer}
          rise={12}
          className="flex-row items-center gap-[10px] px-[22px] pb-[6px]"
        >
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            onPress={() => router.push('/archive-puzzle')}
            accessibilityRole="button"
            accessibilityLabel="Play the archive"
            className="h-[58px] flex-1 items-center justify-center rounded-[19px] bg-wh-primary"
          >
            <Text className="font-wh-bold text-wh-xl tracking-[0.05em] text-wh-on-primary">
              PLAY THE ARCHIVE
            </Text>
          </ChunkyPressable>

          {/* A fact, not a call to action. No flame, no "keep it going". */}
          <Chunky
            offset={4}
            shadowVar="--color-wh-surface-shadow"
            className="h-[58px] flex-row items-center gap-2 rounded-[19px] bg-wh-surface px-4"
          >
            <View className="h-[9px] w-[9px] rounded-wh-pill bg-wh-highlight" />
            <Text className="font-wh-heavy text-wh-base text-wh-text-quiet dark:text-wh-pill-text">
              13
            </Text>
          </Chunky>
        </Appear>
      </View>
    </View>
  );
}
