import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Breathe, Land, STAGGER } from '@/components/motion';
import { HelpButton, OnboardingHeader } from '@/components/onboarding-chrome';
import { PuzzleGround } from '@/components/puzzle-ground';
import { keyHaptic, solveHaptic } from '@/lib/feedback';

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
 * ── STATE (session 7) ─────────────────────────────────────────────────────
 * Live. The owner reported that none of the letters could be pressed, which
 * was true — the whole screen was a picture of a board.
 *
 * It is a self-contained six-key puzzle rather than a call into
 * `useDailyPuzzle`: this board has no hearts, no coins, no nudge tier, no
 * streak and no storage, and it must not be able to fail. Routing it through
 * the real loop would give a tutorial the ability to charge a player a heart.
 *
 * **It cannot be failed and it cannot be stuck.** A wrong guess says nothing
 * at all — no red, no shake, no buzz, even though the real board does all
 * three now — because this is the first puzzle anyone ever sees and the
 * screen already gives away the answer at the bottom. → is always live and
 * always continues, whatever is typed.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['SUN', 'MOON', 'DAY'];
const ANSWER = 'LIGHT';
/** The design's six caps: LIGHT's five distinct letters plus one decoy. */
const KEYS = ['E', 'G', 'H', 'I', 'L', 'T'];

const IN = {
  eyebrow: 60,
  clues: 120,
  board: 120 + 3 * STAGGER,
  keys: 120 + 3 * STAGGER + 80,
  hint: 120 + 3 * STAGGER + 160,
};

export default function TryTheGame() {
  const insets = useSafeAreaInsets();

  // Starts at L-I-G, which is the moment the design captures — the player
  // arrives two taps from a win rather than at an empty board.
  const [typed, setTyped] = useState('LIG');
  const solved = typed === ANSWER;

  function press(letter: string) {
    if (solved) return;
    if (typed.length >= ANSWER.length) return;
    const next = typed + letter;
    setTyped(next);
    if (next === ANSWER) solveHaptic();
    else keyHaptic();
  }

  function backspace() {
    if (solved) return;
    setTyped(typed.slice(0, -1));
  }

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
                const letter = typed[i];
                const isCaret = i === typed.length;

                if (letter !== undefined) {
                  return (
                    <Chunky
                      key={i}
                      offset={4}
                      shadowVar="--color-wh-answer-tile-shadow"
                      className="h-[62px] flex-1 items-center justify-center rounded-wh-card bg-wh-answer-tile"
                    >
                      <Land key={`${letter}-${i}`}>
                        <Text className="font-wh-bold text-wh-h1 text-wh-answer-tile-text">
                          {letter}
                        </Text>
                      </Land>
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
              accessibilityLabel={solved ? 'You got it. Continue.' : 'Continue'}
              className="h-[62px] w-[62px] items-center justify-center rounded-[19px] bg-wh-primary"
            >
              <Text className="font-wh-bold text-wh-h2 text-wh-on-primary">→</Text>
            </ChunkyPressable>
          </Appear>

          <Appear delay={IN.keys} rise={6} className="flex-row gap-[7px]">
            {KEYS.map((letter) => {
              // Dimmed once used, but still pressable — the real board does
              // the same, because an answer with a repeated letter needs the
              // key twice and a dead key reads as a bug.
              const spent = typed.includes(letter);
              return (
                <ChunkyPressable
                  key={letter}
                  offset={3}
                  shadowVar={spent ? '--color-wh-key-cap-dim-shadow' : '--color-wh-key-cap-shadow'}
                  onPress={() => press(letter)}
                  accessibilityRole="button"
                  accessibilityLabel={spent ? `Letter ${letter}, already used` : `Letter ${letter}`}
                  className={
                    spent
                      ? 'h-[56px] flex-1 items-center justify-center rounded-[15px] bg-wh-key-cap-dim'
                      : 'h-[56px] flex-1 items-center justify-center rounded-[15px] bg-wh-key-cap'
                  }
                >
                  <Text
                    className={
                      spent
                        ? 'font-wh-bold text-wh-h2 text-wh-key-cap-dim-text'
                        : 'font-wh-bold text-wh-h2 text-wh-key-cap-text'
                    }
                  >
                    {letter}
                  </Text>
                </ChunkyPressable>
              );
            })}

            <ChunkyPressable
              offset={3}
              shadowVar="--color-wh-surface-shadow"
              onPress={backspace}
              accessibilityRole="button"
              accessibilityLabel="Delete letter"
              className="h-[56px] w-[52px] items-center justify-center rounded-[15px] bg-wh-surface"
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
        {/* The owner reported the answer here as clipped. It was: the row was
            a fixed 46px tall with 2px of top padding, and the chip inside it
            is 9px of vertical padding around 17px type plus a 3px offset
            shadow — about 50px of content in a 44px hole, so the shadow and
            the descenders were cut off. It is min-height now and the shadow
            has room. */}
        <Appear delay={IN.hint} className="min-h-[52px] items-center px-[22px] pt-2">
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
          {/* Fills the board rather than opening the picker. There is no coin
              balance in a tutorial and nothing here may cost anything — the
              answer is already printed six pixels above this button. */}
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            onPress={() => {
              setTyped(ANSWER);
              solveHaptic();
            }}
            accessibilityRole="button"
            accessibilityLabel="Nudge. Fills in the answer."
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
