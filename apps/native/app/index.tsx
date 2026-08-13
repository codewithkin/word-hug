import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Breathe, Land, STAGGER } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── 09 Daily Puzzle ───────────────────────────────────────────────────────
 * Built from `designs/extracted/09-daily-puzzle-light.html` and
 * `09-daily-puzzle-dark.html`, read in full, both themes.
 *
 * This is the screen users spend ~90% of their time on. It is also the screen
 * with the most ways to be plausibly wrong, so a few notes on what is
 * deliberate:
 *
 * · The background is a three-stop radial gradient, not `#FFF9EF`. See
 *   components/puzzle-ground.tsx — that is the trap this project has already
 *   walked into once.
 * · Light uses white for the clue card, the answer tile AND the keycap. Dark
 *   uses three different purples (#33206B / #4A3193 / #3E2884). Reusing
 *   `surface` for all three would look right in light and wrong in dark.
 * · The status bar, the notch and the home indicator in the design file are
 *   the device mockup's chrome, not app UI (D-001). They are replaced here by
 *   the real safe-area insets rather than drawn.
 * · One row of five letter keys is what the design shows. It is a mock of the
 *   keyboard, not the keyboard. Real input is a later todo — see plans/04.
 *
 * MOTION: the screen assembles top-down over about half a second — header,
 * then chip, then the three clues in sequence, then the board, then the
 * actions. The order is the reading order, so it doubles as a very quiet
 * piece of onboarding: a first-time player's eye is walked through the screen
 * once, without a coach mark or a dismissible tooltip anywhere. See
 * components/motion.tsx for why nothing here bounces.
 *
 * STATE: none. Everything below is the design's own placeholder content,
 * hard-coded on purpose so this session's question stays "is it the right
 * colour and shape", not "does the game work". Wiring is plans/05.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['GREEN', 'BOAT', 'LIGHT'];
const ANSWER = ['H', 'O'];
const ANSWER_LENGTH = 5;
const KEYS = ['U', 'S', 'E', 'T', 'R'];

/** Roughly when each band of the screen arrives, in ms. */
const IN = {
  header: 0,
  chip: 60,
  clues: 120,
  tiles: 120 + 3 * STAGGER,
  keys: 120 + 3 * STAGGER + 80,
  actions: 120 + 3 * STAGGER + 140,
};

export default function DailyPuzzle() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* ── Header: menu, coins, streak ─────────────────────────────── */}
        <Appear
          delay={IN.header}
          rise={-6}
          className="h-[60px] flex-row items-center justify-between px-[18px] pt-[6px]"
        >
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            accessibilityRole="button"
            accessibilityLabel="Menu"
            className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
          >
            {/* The light theme outlines this in textFaint and the dark theme in
                textSecondary — a real difference in the designs, not an
                oversight. Same story on the backspace key below. */}
            <View className="h-5 w-5 rounded-[6px] border-[3px] border-wh-text-faint dark:border-wh-text-secondary" />
          </ChunkyPressable>

          <View className="flex-row items-center gap-[9px]">
            <Chunky
              offset={3}
              shadowVar="--color-wh-surface-shadow"
              className="h-[42px] flex-row items-center gap-2 rounded-wh-pill bg-wh-surface pl-[10px] pr-[14px]"
            >
              <Chunky
                offset={-3}
                inset
                shadowVar="--color-wh-coin-dot-shadow"
                className="h-6 w-6 items-center justify-center rounded-wh-pill bg-wh-primary"
              >
                <Text className="font-wh-bold text-wh-sm text-wh-coin-glyph">$</Text>
              </Chunky>
              <Text className="font-wh-heavy text-wh-md text-wh-text-primary">12</Text>
            </Chunky>

            <Chunky
              offset={3}
              shadowVar="--color-wh-surface-shadow"
              className="h-[42px] flex-row items-center gap-[6px] rounded-wh-pill bg-wh-surface pl-[10px] pr-[14px]"
            >
              <Chunky
                offset={-3}
                inset
                shadowVar="--color-wh-streak-dot-shadow"
                className="h-6 w-6 rounded-wh-pill bg-wh-highlight"
              />
              <Text className="font-wh-heavy text-wh-md text-wh-text-primary">4</Text>
            </Chunky>
          </View>
        </Appear>

        {/* ── Puzzle number chip ──────────────────────────────────────── */}
        <Appear delay={IN.chip} className="h-[42px] items-center justify-center">
          <View className="rounded-wh-pill bg-wh-chip-surface px-[18px] py-[7px]">
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-chip-text">
              Puzzle 128 · Tuesday
            </Text>
          </View>
        </Appear>

        {/* ── The three clues ─────────────────────────────────────────── */}
        <View className="flex-1 justify-center gap-3 px-[22px] pt-[6px]">
          {CLUES.map((clue, i) => (
            <Appear key={clue} index={i} delay={IN.clues}>
              <Chunky
                offset={4}
                shadowVar="--color-wh-clue-card-shadow"
                className="h-[70px] flex-row items-center justify-between rounded-wh-xl bg-wh-clue-card pl-[22px] pr-4"
              >
                <Text className="font-wh-bold text-wh-display tracking-[0.01em] text-wh-clue-text">
                  {clue}
                </Text>
                <View className="h-[46px] w-[46px] items-center justify-center rounded-wh-md border-[2.5px] border-dashed border-wh-clue-slot-border bg-wh-clue-slot">
                  <Text className="font-wh-bold text-wh-xxl text-wh-clue-slot-text">?</Text>
                </View>
              </Chunky>
            </Appear>
          ))}
        </View>

        {/* ── The answer tiles ────────────────────────────────────────── */}
        <View className="h-[96px] flex-row items-center justify-center gap-[9px]">
          {Array.from({ length: ANSWER_LENGTH }, (_, i) => {
            const letter = ANSWER[i];
            const isCaret = i === ANSWER.length;

            if (letter !== undefined) {
              return (
                <Chunky
                  key={i}
                  offset={4}
                  shadowVar="--color-wh-answer-tile-shadow"
                  className="h-16 w-14 items-center justify-center rounded-wh-card bg-wh-answer-tile"
                >
                  {/*
                    A letter lands rather than appears: it drops the last few
                    pixels and settles. This is the one moment in the loop
                    where the interface is allowed a little life, because it
                    is the only one that is unambiguously good news — the
                    player did something and it worked.

                    Note (session 3): the moti version wrapped this in
                    AnimatePresence so backspacing was a letter *leaving*
                    rather than a letter being deleted. Nothing unmounts a
                    letter yet — the board is static — so the exit is not
                    ported until there is something to exercise it. See the
                    note on `Land` in components/motion.tsx.
                  */}
                  <Land key={letter}>
                    <Text className="font-wh-bold text-wh-display text-wh-answer-tile-text">
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
                  className="h-16 w-14 items-center justify-center rounded-wh-card border-[3px] border-wh-primary bg-wh-answer-tile-active"
                >
                  {/* Not a blinking cursor: a still amber bar that breathes.
                      Nothing on this screen may imply a clock (rule 1). */}
                  <Breathe>
                    <View className="h-[30px] w-[3px] rounded-[2px] bg-wh-primary" />
                  </Breathe>
                </Chunky>
              );
            }

            return (
              <Appear key={i} index={i} delay={IN.tiles} rise={4}>
                <Chunky
                  offset={3}
                  inset
                  shadowVar="--color-wh-answer-tile-empty-shadow"
                  className="h-16 w-14 rounded-wh-card bg-wh-answer-tile-empty"
                />
              </Appear>
            );
          })}
        </View>

        {/* ── Letter keys ─────────────────────────────────────────────── */}
        <View className="h-[74px] flex-row items-center justify-center gap-2 px-[22px]">
          {KEYS.map((key, i) => (
            <Appear key={key} index={i} delay={IN.keys} rise={6}>
              <ChunkyPressable
                offset={3}
                shadowVar="--color-wh-key-cap-shadow"
                accessibilityRole="button"
                accessibilityLabel={`Letter ${key}`}
                className="h-14 w-[52px] items-center justify-center rounded-[15px] bg-wh-key-cap"
              >
                <Text className="font-wh-bold text-wh-h2 text-wh-key-cap-text">{key}</Text>
              </ChunkyPressable>
            </Appear>
          ))}
        </View>

        {/* ── Hint, HUG IT, backspace ─────────────────────────────────── */}
        <Appear
          delay={IN.actions}
          rise={12}
          className="flex-row items-center gap-[10px] px-[22px] pb-[6px]"
        >
          <ChunkyPressable
            offset={4}
            shadowVar="--color-wh-surface-shadow"
            accessibilityRole="button"
            accessibilityLabel="Hint"
            className="h-[58px] w-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
          >
            <Chunky
              offset={-3}
              inset
              shadowVar="--color-wh-hint-glyph-shadow"
              className="h-5 w-4 rounded-b-[4px] rounded-t-[8px] bg-wh-primary"
            />
            <Chunky
              offset={2}
              shadowVar="--color-wh-badge-shadow"
              className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-wh-pill bg-wh-highlight"
            >
              {/* 11px, not the 11.5px `micro` token — this badge is the one
                  place the designs use it, so it uses its own value. */}
              <Text className="font-wh-heavy text-[11px] text-white">3</Text>
            </Chunky>
          </ChunkyPressable>

          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            accessibilityRole="button"
            accessibilityLabel="Hug it"
            className="h-[58px] flex-1 items-center justify-center rounded-[19px] bg-wh-primary"
          >
            <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
              HUG IT
            </Text>
          </ChunkyPressable>

          <ChunkyPressable
            offset={4}
            shadowVar="--color-wh-surface-shadow"
            accessibilityRole="button"
            accessibilityLabel="Delete letter"
            className="h-[58px] w-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
          >
            <Text className="font-wh-bold text-wh-xxl text-wh-text-faint dark:text-wh-text-secondary">
              ⌫
            </Text>
          </ChunkyPressable>
        </Appear>

        {/*
          TEMPORARY — none of this is in the Daily design and all of it comes
          out before release. It exists because the owner runs every screen in
          one pass, and a screen with no route into it cannot be looked at.

          · token probe — the only thing in the build that can say whether any
            of the colours above are real.
          · onboarding — five screens that are not yet gated behind a
            first-launch flag, deliberately: gating them would put the app's
            most-used screen behind an unverified flow. Session 4 wires the
            flag once these have been seen.
          · solve — overlay A, over this very board, which is how it will be
            presented for real.
          · loading / error — states the app enters on its own, rarely and
            not on demand.
        */}
        <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2">
          <Link href="/token-probe" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Probe
          </Link>
          <Link href="/celebration" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Solve
          </Link>
          <Link
            href="/onboarding/welcome"
            className="font-wh-regular text-wh-sm text-wh-text-muted"
          >
            Onboarding
          </Link>
          <Link href="/archive-puzzle" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Archive
          </Link>
          <Link href="/pack-puzzle" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Pack
          </Link>
          <Link href="/settings" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Settings
          </Link>
          <Link href="/how-to-play" className="font-wh-regular text-wh-sm text-wh-text-muted">
            How
          </Link>
          <Link href="/stats" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Stats
          </Link>
          <Link href="/loading" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Loading
          </Link>
          <Link href="/error" className="font-wh-regular text-wh-sm text-wh-text-muted">
            Error
          </Link>
        </View>
      </View>
    </View>
  );
}
