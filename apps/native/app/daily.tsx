import { Link, router, type Href } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, Breathe, Land, STAGGER } from '@/components/motion';
import { GuessNote } from '@/components/notice';
import { PuzzleGround } from '@/components/puzzle-ground';
import { SolveCelebration } from '@/components/solve-celebration';
import { SolvedBoard, solvedRows } from '@/components/solved-board';
import { useDailyPuzzle } from '@/hooks/use-daily-puzzle';

/**
 * ── 09 Daily Puzzle · /daily ──────────────────────────────────────────────
 *
 * Session 7: this moved from `/` to `/daily`. The app now opens on the level
 * map (`app/home.tsx`) and the daily puzzle is a card at the top of it — the
 * owner's call when the product went level-based. Nothing about the screen
 * itself changed; it is still the ritual, still ungated by hearts (PRD rule 2)
 * and still what the morning notification points at.
 *
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
 *
 * ── STATE (session 6) ─────────────────────────────────────────────────────
 * The board is live. `hooks/use-daily-puzzle.ts` owns the loop and this file
 * renders it — see that file for the four phases and, more importantly, for
 * what the state machine deliberately cannot express (no attempts, no timer,
 * no score).
 *
 * Three of the four temporary alternate-state routes are now branches here
 * rather than places:
 *
 *   `/wrong-guess`   → phase `guessed`, tone `gentle`
 *   `/near-miss`     → phase `guessed`, tone `close`
 *   `/solved-today`  → phase `done`, `components/solved-board.tsx`
 *   `/caught-up`     → `puzzle === null`, still a route (see below)
 *
 * The routes survive only so the scaffolding link row can still open them for
 * a look in both themes. Nothing in the product navigates to one.
 *
 * ── Two departures from the static mock, both forced by real content ──────
 * 1. The mock draws five fixed 56px answer tiles because its answer is HOUSE.
 *    Real answers are 3–6 letters, and six at 56px overflows a 360dp screen,
 *    so tiles narrow to 46px past five. Five-letter answers — most of the bank
 *    — are pixel-identical to the design.
 * 2. The mock draws five fixed-width keycaps. A real key row is the answer's
 *    distinct letters plus decoys (six; see `keysFor`), so the caps flex to
 *    fill the row exactly as `LetterKeys` does on this screen's own
 *    alternate-state designs.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Roughly when each band of the screen arrives, in ms. */
const IN = {
  header: 0,
  chip: 60,
  clues: 120,
  tiles: 120 + 3 * STAGGER,
  keys: 120 + 3 * STAGGER + 80,
  actions: 120 + 3 * STAGGER + 140,
};

/**
 * TEMPORARY. The scaffolding link row, grouped so twenty-two entries stay
 * readable. `__DEV__`-gated as of session 6 so it cannot reach a store build,
 * and deleted outright once the probe reads all-OK in both themes.
 */
const LINK_GROUPS: { label: string; links: [string, Href][] }[] = [
  {
    label: 'Screens',
    links: [
      ['Probe', '/token-probe'],
      ['Onboarding', '/onboarding/welcome'],
      ['Archive', '/archive-puzzle'],
      ['Pack', '/pack-puzzle'],
      ['Settings', '/settings'],
      ['How', '/how-to-play'],
      ['Stats', '/stats'],
      ['Loading', '/loading'],
      ['Error', '/error'],
    ],
  },
  {
    label: 'Overlays',
    links: [
      ['Solve', '/celebration'],
      ['Nudge', '/nudge-picker'],
      ['Coins', '/zero-coin'],
      ['Locked', '/archive-locked'],
      ['Offline', '/offline-notice'],
    ],
  },
  {
    label: 'States',
    links: [
      ['Solved', '/solved-today'],
      ['Wrong', '/wrong-guess'],
      ['Near', '/near-miss'],
      ['Caught', '/caught-up'],
      ['Day one', '/archive-day-one'],
      ['No packs', '/nothing-owned'],
      ['No store', '/store-unreachable'],
      ['No stats', '/stats-empty'],
    ],
  },
];

function ScaffoldingLinks() {
  if (!__DEV__) return null;

  return (
    <View className="gap-[3px] py-2">
      {LINK_GROUPS.map((group) => (
        <View
          key={group.label}
          className="flex-row flex-wrap items-center justify-center gap-x-[13px]"
        >
          <Text className="font-wh-heavy text-[9px] uppercase tracking-wh-label text-wh-text-whisper">
            {group.label}
          </Text>
          {group.links.map(([label, href]) => (
            <Link
              // The label, not the href: `Href` widens to an object under typed
              // routes and is not a valid React key.
              key={label}
              href={href}
              className="font-wh-regular text-wh-sm text-wh-text-muted"
            >
              {label}
            </Link>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function DailyPuzzle() {
  const insets = useSafeAreaInsets();
  const game = useDailyPuzzle();

  const {
    puzzle,
    phase,
    typed,
    keys,
    used,
    note,
    clues,
    compounds,
    chip,
    coins,
    streak,
    canSubmit,
    press,
    backspace,
    submit,
    closeCelebration,
  } = game;

  /**
   * The bank has run out. `/caught-up` is a whole screen about there being
   * nothing to do today and it being fine, so it stays a route and this
   * redirects rather than reimplementing it inline.
   */
  if (puzzle === null) {
    return (
      <View className="flex-1 bg-wh-ground">
        <PuzzleGround />
        <Appear className="flex-1 items-center justify-center px-8">
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            onPress={() => router.replace('/caught-up')}
            accessibilityRole="button"
            accessibilityLabel="See what is next"
            className="h-[58px] items-center justify-center rounded-[19px] bg-wh-primary px-8"
          >
            <Text className="font-wh-bold text-wh-xl tracking-wh-wide text-wh-on-primary">
              ALL CAUGHT UP
            </Text>
          </ChunkyPressable>
        </Appear>
      </View>
    );
  }

  const length = puzzle.answer.length;
  // Five 56px tiles is the design. Six of them overflow 360dp, so past five
  // they narrow — every answer in the bundled bank up to five letters renders
  // exactly as drawn.
  const tileWidth = length > 5 ? 46 : 56;
  const answered = phase === 'done';

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
            onPress={() => router.push('/settings')}
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
              <Text className="font-wh-heavy text-wh-md text-wh-text-primary">{coins}</Text>
            </Chunky>

            {/* Hidden at zero. "0 day streak" on someone's first morning is a
                scolding, and there is nothing here to scold. */}
            {streak > 0 ? (
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
                <Text className="font-wh-heavy text-wh-md text-wh-text-primary">{streak}</Text>
              </Chunky>
            ) : null}
          </View>
        </Appear>

        {/* ── Puzzle number chip ──────────────────────────────────────── */}
        <Appear delay={IN.chip} className="h-[42px] items-center justify-center">
          <View className="rounded-wh-pill bg-wh-chip-surface px-[18px] py-[7px]">
            <Text className="font-wh-heavy text-wh-xs uppercase tracking-wh-label text-wh-chip-text">
              {chip}
            </Text>
          </View>
        </Appear>

        {answered ? (
          <SolvedBoard
            rows={solvedRows(puzzle.answer.toUpperCase(), compounds)}
            answer={puzzle.answer.toUpperCase()}
            streak={streak}
            onArchive={() => router.push('/archive-puzzle')}
          />
        ) : (
          <>
            {/* ── The three clues ─────────────────────────────────────── */}
            <View className="flex-1 justify-center gap-3 px-[22px] pt-[6px]">
              {clues.map((clue, i) => (
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

            {/* ── The answer tiles ────────────────────────────────────── */}
            <View className="h-[96px] flex-row items-center justify-center gap-[9px]">
              {Array.from({ length }, (_, i) => {
                const letter = typed[i];
                const isCaret = i === typed.length;

                if (letter !== undefined) {
                  return (
                    <Chunky
                      key={i}
                      offset={4}
                      shadowVar="--color-wh-answer-tile-shadow"
                      style={{ width: tileWidth }}
                      className="h-16 items-center justify-center rounded-wh-card bg-wh-answer-tile"
                    >
                      {/*
                        A letter lands rather than appears: it drops the last
                        few pixels and settles. This is the one moment in the
                        loop where the interface is allowed a little life,
                        because it is the only one that is unambiguously good
                        news — the player did something and it worked.

                        Keyed on the letter AND the position, so backspacing to
                        retype the same letter in the same slot replays the
                        landing instead of silently reusing the node.
                      */}
                      <Land key={`${letter}-${i}`}>
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
                      style={{ width: tileWidth }}
                      className="h-16 items-center justify-center rounded-wh-card border-[3px] border-wh-primary bg-wh-answer-tile-active"
                    >
                      {/* Not a blinking cursor: a still amber bar that
                          breathes. Nothing here may imply a clock (rule 1). */}
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
                      style={{ width: tileWidth }}
                      className="h-16 rounded-wh-card bg-wh-answer-tile-empty"
                    />
                  </Appear>
                );
              })}
            </View>

            {/* ── Letter keys ─────────────────────────────────────────── */}
            <View className="h-[74px] flex-row items-center justify-center gap-2 px-[22px]">
              {keys.map((key, i) => {
                const spent = used.has(key);
                return (
                  <Appear key={key} index={i} delay={IN.keys} rise={6} className="flex-1">
                    {/* A spent key dims and stays tappable — an answer with a
                        repeated letter needs it pressed twice, and a key that
                        went dead would look like a bug. */}
                    <ChunkyPressable
                      offset={3}
                      shadowVar={
                        spent ? '--color-wh-key-cap-dim-shadow' : '--color-wh-key-cap-shadow'
                      }
                      onPress={() => press(key)}
                      accessibilityRole="button"
                      accessibilityLabel={spent ? `Letter ${key}, already used` : `Letter ${key}`}
                      className={
                        spent
                          ? 'h-14 items-center justify-center rounded-[15px] bg-wh-key-cap-dim'
                          : 'h-14 items-center justify-center rounded-[15px] bg-wh-key-cap'
                      }
                    >
                      <Text
                        className={
                          spent
                            ? 'font-wh-bold text-wh-h2 text-wh-key-cap-dim-text'
                            : 'font-wh-bold text-wh-h2 text-wh-key-cap-text'
                        }
                      >
                        {key}
                      </Text>
                    </ChunkyPressable>
                  </Appear>
                );
              })}
            </View>

            {/* ── The note after a guess ──────────────────────────────── */}
            {note ? (
              <GuessNote tone={note.tone} delay={0}>
                {note.text}
              </GuessNote>
            ) : (
              // Reserved, so the actions row does not jump up the screen the
              // first time a guess is answered.
              <View className="h-[44px]" />
            )}

            {/* ── Hint, HUG IT, backspace ─────────────────────────────── */}
            <Appear
              delay={IN.actions}
              rise={12}
              className="flex-row items-center gap-[10px] px-[22px] pb-[6px]"
            >
              <ChunkyPressable
                offset={4}
                shadowVar="--color-wh-surface-shadow"
                onPress={() => router.push('/nudge-picker')}
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
                  <Text className="font-wh-heavy text-[11px] text-white">{coins}</Text>
                </Chunky>
              </ChunkyPressable>

              {/*
                HUG IT stays amber and stays pressable when the word is short.
                The alternative — greying it out — is the reflexive choice and
                is wrong here: a disabled primary button is the interface
                telling someone they have not done enough yet, and this product
                does not have a vocabulary for that (rule 1). Pressing it early
                simply does nothing.
              */}
              <ChunkyPressable
                offset={5}
                shadowVar="--color-wh-primary-shadow"
                onPress={submit}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
                accessibilityLabel={
                  canSubmit ? 'Hug it' : 'Hug it, not enough letters yet'
                }
                className="h-[58px] flex-1 items-center justify-center rounded-[19px] bg-wh-primary"
              >
                <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
                  HUG IT
                </Text>
              </ChunkyPressable>

              <ChunkyPressable
                offset={4}
                shadowVar="--color-wh-surface-shadow"
                onPress={backspace}
                accessibilityRole="button"
                accessibilityLabel="Delete letter"
                className="h-[58px] w-[58px] items-center justify-center rounded-[19px] bg-wh-surface"
              >
                <Text className="font-wh-bold text-wh-xxl text-wh-text-faint dark:text-wh-text-secondary">
                  ⌫
                </Text>
              </ChunkyPressable>
            </Appear>
          </>
        )}

        <ScaffoldingLinks />
      </View>

      {/* ── Overlay A, over the real board ──────────────────────────────
          Not a route: the celebration belongs to the board underneath it and
          its wash has to fall on the real answer rather than on a redrawn
          copy. `/celebration` still exists for the link row. */}
      {phase === 'solved' ? (
        <SolveCelebration
          answer={puzzle.answer.toUpperCase()}
          compounds={compounds}
          streak={streak}
          onClose={closeCelebration}
          onArchive={() => {
            closeCelebration();
            router.push('/archive-puzzle');
          }}
        />
      ) : null}
    </View>
  );
}
