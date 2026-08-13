import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky } from '@/components/chunky';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';

/**
 * ── 17 How to Play ────────────────────────────────────────────────────────
 * Built from `designs/extracted/17-how-to-play-light.html` and
 * `17-how-to-play-dark.html`, read in full, both themes.
 *
 * One sentence, one worked example, one caveat, and what the nudges cost.
 * That is the entire rulebook, and it fits on one screen — which it has to,
 * because a puzzle whose rules need scrolling is a puzzle with a bad rule.
 *
 * The worked example repeats the same solve as onboarding step 2 and the
 * celebration: GREEN / BOAT / LIGHT hugged by HOUSE. That is deliberate
 * throughout the product — one example, taught once, recognised everywhere.
 *
 * The caveat card is the genuinely useful part and the easiest to skip when
 * rebuilding: "the answer can sit before or after a clue — and it won't
 * always be the same side for all three". That is the single thing a new
 * player gets wrong, and it is why the compound rows are laid out with the
 * shared word in a centre column and the clue on the side it actually joins.
 *
 * ── Note (session 3) ──────────────────────────────────────────────────────
 * Reachable from Settings and from the "?" in the puzzle header. Onboarding
 * step 2's "?" is not wired to it yet — the flow uses a fade between its own
 * steps and pushing a screen out of it needs a decision about whether the
 * player comes back to the same step. Left for the session that gates
 * onboarding.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CLUES = ['GREEN', 'BOAT', 'LIGHT'];
const ANSWER = 'HOUSE';
const COMPOUNDS = [
  { clue: 'GREEN', before: true },
  { clue: 'BOAT', before: false },
  { clue: 'LIGHT', before: true },
];
const NUDGES = [
  { n: '1', what: 'A category for the answer', cost: '1 coin' },
  { n: '2', what: 'The first letter', cost: '1 coin' },
  { n: '3', what: 'The whole answer', cost: '1 coin' },
];

function CardLabel({ children }: { children: string }) {
  return (
    <Text className="font-wh-heavy text-wh-micro uppercase tracking-wh-label text-wh-card-label">
      {children}
    </Text>
  );
}

export default function HowToPlay() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ScreenHeader title="HOW TO PLAY" />

        <ScrollView
          className="flex-1 px-[22px] pt-[10px]"
          contentContainerClassName="gap-[11px] pb-4"
          showsVerticalScrollIndicator={false}
        >
          <Appear delay={60}>
            <Text className="font-wh-bold text-wh-h3 leading-[29px] text-wh-clue-text">
              Find the one word that pairs with all three clues.
            </Text>
          </Appear>

          {/* ── The worked example ──────────────────────────────────────── */}
          <Appear delay={130}>
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="gap-3 rounded-wh-xl bg-wh-clue-card p-[14px]"
            >
              <CardLabel>Worked example</CardLabel>

              <View className="flex-row gap-[7px]">
                {CLUES.map((clue) => (
                  <View key={clue} className="rounded-[12px] bg-wh-clue-slot px-[13px] py-[9px]">
                    <Text className="font-wh-bold text-[18px] text-wh-key-cap-text">{clue}</Text>
                  </View>
                ))}
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="font-wh-heavy text-[15px] text-wh-text-quiet">Answer</Text>
                <Chunky
                  offset={3}
                  shadowVar="--color-wh-accent-shadow"
                  className="rounded-[12px] bg-wh-accent px-4 py-2"
                >
                  <Text className="font-wh-bold text-[19px] text-wh-on-accent">{ANSWER}</Text>
                </Chunky>
              </View>

              {/* The shared word in a centre column, the clue on the side it
                  joins. This alignment IS the explanation. */}
              <View className="gap-[6px] pt-[2px]">
                {COMPOUNDS.map(({ clue, before }) => (
                  <View key={clue} className="flex-row items-baseline">
                    <Text className="flex-1 text-right font-wh-bold text-wh-md text-wh-clue-text">
                      {before ? clue : ''}
                    </Text>
                    <Text className="font-wh-bold text-wh-md text-wh-accent-text">{ANSWER}</Text>
                    <Text className="flex-1 text-left font-wh-bold text-wh-md text-wh-clue-text">
                      {before ? '' : clue}
                    </Text>
                  </View>
                ))}
              </View>
            </Chunky>
          </Appear>

          {/* ── The one thing people get wrong ──────────────────────────── */}
          <Appear delay={200}>
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="flex-row items-start gap-[14px] rounded-wh-xl bg-wh-clue-card p-[14px]"
            >
              {/* #FFF0CE / #291958 — `surfaceQuiet` in light, `clueSlot` in
                  dark. Neither token is right in both, so it is literal. */}
              <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-[#FFF0CE] dark:bg-[#291958]">
                <Text className="font-wh-bold text-wh-xl text-wh-card-label">↔</Text>
              </View>
              <Text className="flex-1 font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
                The answer can sit before or after a clue — and it won&apos;t always be the same
                side for all three.
              </Text>
            </Chunky>
          </Appear>

          {/* ── What a nudge costs ─────────────────────────────────────────
              Three tiers, one coin each, unlocking in order — and the last
              one is the whole answer. A game protecting its difficulty would
              never sell the answer outright; this one does, for one coin,
              because being stuck is not a state worth preserving (rule 1).
              "Using one doesn't change anything about your solve" is the
              same promise as the archive's "doesn't affect your streak". */}
          <Appear delay={270}>
            <Chunky
              offset={4}
              shadowVar="--color-wh-clue-card-shadow"
              className="gap-3 rounded-wh-xl bg-wh-clue-card p-[14px]"
            >
              <CardLabel>Nudges</CardLabel>

              <View className="gap-[9px]">
                {NUDGES.map(({ n, what, cost }) => (
                  <View key={n} className="flex-row items-center gap-[10px]">
                    <View className="h-[26px] w-[26px] items-center justify-center rounded-[9px] bg-wh-primary">
                      <Text className="font-wh-heavy text-wh-sm text-wh-on-primary">{n}</Text>
                    </View>
                    <Text className="flex-1 font-wh-bold text-[15px] text-wh-clue-text">{what}</Text>
                    <Text className="font-wh-heavy text-wh-sm text-wh-text-quiet">{cost}</Text>
                  </View>
                ))}
              </View>

              {/* #8C7A66 / #9C8AD0 — this screen only. */}
              <Text className="font-wh-regular text-wh-base leading-[20px] text-[#8C7A66] dark:text-[#9C8AD0]">
                They unlock in that order, up to three per puzzle. Using one doesn&apos;t change
                anything about your solve.
              </Text>
            </Chunky>
          </Appear>
        </ScrollView>
      </View>
    </View>
  );
}
