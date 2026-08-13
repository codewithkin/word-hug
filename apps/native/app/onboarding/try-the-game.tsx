import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Breathe, STAGGER } from '@/components/motion';
import { HelpButton, OnboardingHeader } from '@/components/onboarding-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 05 Try the Game · onboarding step 2 of 5 ──────────────────────────────
 * Built from `designs/extracted/05-try-the-game-light.html` and
 * `05-try-the-game-dark.html`, read in full, both themes.
 *
 * The one screen in onboarding that is not about the game — it is the game.
 * SUN / MOON / DAY hugged by LIGHT, with the answer already visible at the
 * bottom of the screen in case the person does not want to think. That chip
 * is the most product-defining thing in the whole flow: a puzzle game giving
 * away its own tutorial answer, unprompted, before anyone has struggled.
 *
 * ── How this differs from the Daily board (09) ────────────────────────────
 * It is not the same component and should not be made into one yet. The
 * clue rows here carry no dashed "?" slot, the answer row is five flexed
 * tiles rather than five fixed ones, the keyboard is six keys plus backspace
 * rather than five keys, and there is no header, coin count or streak. The
 * shared parts are the palette and `Chunky`, which is where the sharing
 * belongs until screens 11 and 14 show which shape actually repeats.
 *
 * ── STATE: none, deliberately ─────────────────────────────────────────────
 * Everything below is the design's own content, hard-coded. The board shows
 * L-I-G typed with the caret on the fourth tile because that is the moment
 * the design captures. Real input is the same todo as the Daily screen's, and
 * this screen should be wired at the same time as that one, from the same
 * code — not before it and not separately.
 *
 * Pressing → therefore advances the flow rather than checking an answer. It
 * is the honest stand-in: the button's job in the real flow is "I am done
 * here", and that is exactly what it does.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['SUN', 'MOON', 'DAY'];
const ANSWER = 'LIGHT';
const TYPED = ['L', 'I', 'G'];
/** Keys the design draws as still-available. The other three are spent. */
const KEYS = [
  { letter: 'E', used: false },
  { letter: 'G', used: true },
  { letter: 'H', used: false },
  { letter: 'I', used: true },
  { letter: 'L', used: true },
  { letter: 'T', used: false },
];

const IN = {
  eyebrow: 60,
  clues: 120,
  board: 120 + 3 * STAGGER,
  keys: 120 + 3 * STAGGER + 80,
  hint: 120 + 3 * STAGGER + 160,
};

export default function TryTheGame() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Step 2 swaps Skip for a help button. Skip is still reachable — the
            hardware back gesture and step 1 both have it — but the design
            does not offer an exit from the one screen that shows the game. */}
        <OnboardingHeader step={1} right={<HelpButton />} />

        <Appear delay={IN.eyebrow} className="h-[30px] items-center justify-center">
          <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-text-quiet">
            Your first one
          </Text>
        </Appear>

        {/* ── The three clues ─────────────────────────────────────────────
            Full-width rows with nothing on the right: unlike the Daily
            board, there is no dashed slot here, because nothing about the
            first puzzle should look like a blank to be filled in. */}
        <View className="flex-1 items-center justify-center gap-3 px-6">
          {CLUES.map((clue, i) => (
            <Appear key={clue} index={i} delay={IN.clues} className="w-full">
              <Chunky
                offset={4}
                shadowVar="--color-wh-clue-card-shadow"
                className="h-[70px] w-full items-center justify-center rounded-wh-xl bg-wh-clue-card"
              >
                {/* 34px — `display-lg`, not `display` (32). The clue words on
                    this screen are the largest type in onboarding. */}
                <Text className="font-wh-bold text-wh-display-lg text-wh-clue-text">{clue}</Text>
              </Chunky>
            </Appear>
          ))}
        </View>

        {/* ── The board and the keyboard ──────────────────────────────── */}
        <View className="gap-[11px] px-5">
          <Appear delay={IN.board} rise={6} className="flex-row items-center gap-[9px]">
            <View className="flex-1 flex-row gap-[7px]">
              {Array.from({ length: ANSWER.length }, (_, i) => {
                const letter = TYPED[i];
                const isCaret = i === TYPED.length;

                if (letter !== undefined) {
                  return (
                    <Chunky
                      key={i}
                      offset={4}
                      shadowVar="--color-wh-answer-tile-shadow"
                      className="h-[62px] flex-1 items-center justify-center rounded-wh-card bg-wh-answer-tile"
                    >
                      <Text className="font-wh-bold text-wh-h1 text-wh-answer-tile-text">
                        {letter}
                      </Text>
                    </Chunky>
                  );
                }

                if (isCaret) {
                  return (
                    <Chunky
                      key={i}
                      offset={4}
                      shadowVar="--color-wh-answer-tile-active-shadow"
                      className="h-[62px] flex-1 items-center justify-center rounded-wh-card border-[3px] border-wh-primary bg-wh-answer-tile-active"
                    >
                      {/* The design draws this as `inset 0 0 0 3px #FFB020`,
                          which is a ring rather than a shadow — React Native
                          has no inset box-shadow, and a 3px border is the
                          same pixels with none of the risk. */}
                      <Breathe>
                        <View className="h-7 w-[3px] rounded-[2px] bg-wh-primary" />
                      </Breathe>
                    </Chunky>
                  );
                }

                return (
                  <Chunky
                    key={i}
                    offset={3}
                    inset
                    shadowVar="--color-wh-answer-tile-empty-shadow"
                    className="h-[62px] flex-1 rounded-wh-card bg-wh-answer-tile-empty"
                  />
                );
              })}
            </View>

            <ChunkyPressable
              offset={5}
              shadowVar="--color-wh-primary-shadow"
              onPress={() => router.push('/onboarding/ritual')}
              accessibilityRole="button"
              accessibilityLabel="Done"
              className="h-[62px] w-[62px] items-center justify-center rounded-[19px] bg-wh-primary"
            >
              <Text className="font-wh-bold text-wh-h2 text-wh-on-primary">→</Text>
            </ChunkyPressable>
          </Appear>

          <Appear delay={IN.keys} rise={6} className="flex-row gap-[7px]">
            {KEYS.map(({ letter, used }) =>
              used ? (
                <ChunkyPressable
                  key={letter}
                  offset={3}
                  shadowVar="--color-wh-key-cap-dim-shadow"
                  accessibilityRole="button"
                  accessibilityLabel={`Letter ${letter}, already used`}
                  className="h-[54px] flex-1 items-center justify-center rounded-[15px] bg-wh-key-cap-dim"
                >
                  <Text className="font-wh-bold text-wh-h3 text-wh-key-cap-dim-text">{letter}</Text>
                </ChunkyPressable>
              ) : (
                <ChunkyPressable
                  key={letter}
                  offset={3}
                  shadowVar="--color-wh-key-cap-shadow"
                  accessibilityRole="button"
                  accessibilityLabel={`Letter ${letter}`}
                  className="h-[54px] flex-1 items-center justify-center rounded-[15px] bg-wh-key-cap"
                >
                  <Text className="font-wh-bold text-wh-h3 text-wh-key-cap-text">{letter}</Text>
                </ChunkyPressable>
              )
            )}

            <ChunkyPressable
              offset={3}
              shadowVar="--color-wh-surface-shadow"
              accessibilityRole="button"
              accessibilityLabel="Delete letter"
              className="h-[54px] w-[54px] items-center justify-center rounded-[15px] bg-wh-surface"
            >
              <Text className="font-wh-bold text-wh-xl text-wh-text-faint dark:text-wh-text-secondary">
                ⌫
              </Text>
            </ChunkyPressable>
          </Appear>
        </View>

        {/* ── The answer, given away ──────────────────────────────────────
            Do not "improve" this into a hint the person has to earn. The
            whole point is that the first puzzle cannot be failed, and that a
            person who is not in the mood to think can still get to the end
            of onboarding in four seconds. */}
        <Appear delay={IN.hint} className="h-[46px] items-center px-[22px] pt-2">
          <View className="flex-row items-center gap-[10px] rounded-wh-pill bg-wh-surface-quiet px-4 py-[9px]">
            {/* #8A7458 / #B6A4E4 — this pairing appears on this screen only,
                so it is written here rather than tokenised into a name that
                would suggest it is shared. */}
            <Text className="font-wh-bold text-wh-base text-[#8A7458] dark:text-[#B6A4E4]">
              Stuck? The answer is
            </Text>
            <Chunky
              offset={3}
              shadowVar="--color-wh-primary-shadow"
              className="rounded-wh-sm bg-wh-primary px-3 py-[5px]"
            >
              <Text className="font-wh-bold text-wh-md text-wh-on-primary">{ANSWER}</Text>
            </Chunky>
          </View>
        </Appear>

        <Appear
          delay={IN.hint + 60}
          className="h-[60px] flex-row items-center justify-between px-[22px]"
        >
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            accessibilityRole="button"
            accessibilityLabel="Nudge"
            className="rounded-wh-pill bg-wh-surface px-[18px] py-[11px]"
          >
            <Text className="font-wh-heavy text-wh-base text-wh-pill-text">Nudge</Text>
          </ChunkyPressable>

          <Text className="font-wh-bold text-wh-sm text-wh-text-whisper">
            Tap it or type it — either counts
          </Text>
        </Appear>
      </View>
    </View>
  );
}
