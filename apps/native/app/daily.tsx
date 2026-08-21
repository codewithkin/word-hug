import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { CoinPill } from '@/components/coin-pill';
import { GameActions, GameBoard } from '@/components/game-board';
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

export default function DailyPuzzle() {
  const insets = useSafeAreaInsets();
  const game = useDailyPuzzle();

  const {
    puzzle,
    phase,
    typed,
    keys,
    note,
    clues,
    compounds,
    chip,
    coins,
    streak,
    canSubmit,
    shakeTrigger,
    correctAt,
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
          {/* Back, not a menu. Session 8: the daily puzzle is reached from
              the level map now, so the top-left affordance has somewhere
              obvious to go and the owner asked for it. Settings moved to the
              map's own header. */}
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            onPress={() => router.replace('/home')}
            accessibilityRole="button"
            accessibilityLabel="Back to the levels"
            className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
          >
            <Text className="pb-1 font-wh-bold text-wh-h2 leading-none text-wh-text-faint dark:text-wh-text-secondary">
              ‹
            </Text>
          </ChunkyPressable>

          <View className="flex-row items-center gap-[9px]">
            <CoinPill coins={coins} />

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
            onArchive={() => router.replace('/home')}
          />
        ) : (
          <>
            <GameBoard
              clues={clues}
              length={length}
              typed={typed}
              keys={keys}
                  coins={coins}
              canSubmit={canSubmit}
              shakeTrigger={shakeTrigger}
              correctAt={correctAt}
              onKey={press}
              onBackspace={backspace}
              onSubmit={submit}
              onHint={() =>
                router.push({ pathname: '/nudge-picker', params: { puzzleId: puzzle.id } })
              }
            />

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

            <GameActions
              coins={coins}
              canSubmit={canSubmit}
              onHint={() =>
                router.push({ pathname: '/nudge-picker', params: { puzzleId: puzzle.id } })
              }
              onSubmit={submit}
              onBackspace={backspace}
            />
          </>
        )}
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
            router.push('/home');
          }}
        />
      ) : null}
    </View>
  );
}
