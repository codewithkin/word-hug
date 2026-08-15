import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear, STAGGER } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { useAppTheme } from '@/contexts/app-theme-context';

/**
 * ── 12 Pack List · Nothing owned ──────────────────────────────────────────
 * Built from `designs/extracted/12-nothing-owned-light.html` and
 * `12-nothing-owned-dark.html`, read in full, both themes.
 *
 * The pack list before anything has been bought — five packs, each with its
 * artwork washed out and a price on the right.
 *
 * The line that makes this screen work is the subtitle: "Thirty puzzles each,
 * on a theme. Yours forever once you take one." It is a one-time purchase, not
 * a subscription, and the screen says so before anything is priced. There is
 * no trial, no timer on the bundle, no "3 left at this price", and the bundle
 * row at the bottom is a plain statement of a cheaper total rather than a
 * flashing badge.
 *
 * Nothing on this screen is required to play. The daily puzzle is free forever
 * (rule 2) and the archive's last seven days are open to everyone; packs are
 * extra puzzles for people who want more, which is why this screen can afford
 * to be this quiet.
 *
 * ── Recorded divergences ──────────────────────────────────────────────────
 * 1. **The pack names and blurbs are placeholders.** The design drives the
 *    five rows from a `<sc-for list="{{ lockedPacks }}">` template whose data
 *    is not in the export. "Cozy Kitchen" and "Garden Path" are real — they
 *    appear by name in `f-offline-notice-{light,dark}` — and the other three
 *    are invented to fill the list. They MUST be replaced from the content
 *    pipeline before this is shown to anyone.
 * 2. **The pack artwork is a placeholder too.** Each row draws an
 *    `<image-slot>` at 84x84 with a short label inside it; there are no pack
 *    images in `assets/` yet. The slot is drawn here as the design's own
 *    compact placeholder — a rounded square with the label — under the same
 *    45% wash the design uses to dim a locked pack.
 * 3. **The prices are hard-coded.** £2.99 and £9.99 are the design's. Like
 *    overlay C, these must come from RevenueCat: a hard-coded store price is
 *    wrong outside one country and a review rejection in several.
 * ──────────────────────────────────────────────────────────────────────────
 */

interface Pack {
  short: string;
  name: string;
  blurb: string;
  price: string;
}

/** See divergence 1 above. Only the first two names are from the design. */
const PACKS: Pack[] = [
  { short: 'CK', name: 'Cozy Kitchen', blurb: 'Thirty warm ones, from the pantry', price: '£2.99' },
  { short: 'GP', name: 'Garden Path', blurb: 'Slow mornings and green things', price: '£2.99' },
  { short: 'SS', name: 'Seaside', blurb: 'Salt, sand and long afternoons', price: '£2.99' },
  { short: 'NL', name: 'Night Light', blurb: 'Quiet ones for the end of the day', price: '£2.99' },
  { short: 'PB', name: 'Paper Boats', blurb: 'Small things that go a long way', price: '£2.99' },
];

function PackRow({ pack, index }: { pack: Pack; index: number }) {
  // #F8F1E3 / #241950 over #EBDCC2 / #170E36 — the locked-pack card. None of
  // the four is a token: this row is a shade warmer than `surface` in light
  // and a shade cooler in dark, and it appears only on this screen. `Chunky`
  // cannot carry it because there is no CSS variable holding either shadow
  // colour, so the theme is read directly. Promote all four to tokens if the
  // populated Pack List (12) turns out to use the same card.
  const { isDark } = useAppTheme();

  return (
    <Appear index={index} delay={120}>
      <View
        className="flex-row items-center gap-[13px] rounded-wh-xl bg-[#F8F1E3] p-[11px] dark:bg-[#241950]"
        style={{ boxShadow: isDark ? '0 4px 0 #170E36' : '0 4px 0 #EBDCC2' }}
      >
        <View className="h-[84px] w-[84px]">
          <View className="h-full w-full items-center justify-center rounded-wh-card bg-wh-answer-tile-empty">
            <Text className="font-wh-bold text-wh-xxl text-wh-clue-slot-text">{pack.short}</Text>
          </View>
          {/* The wash that says "locked" without a padlock on it. */}
          <View className="absolute inset-0 rounded-wh-card bg-[rgba(248,241,227,0.45)] dark:bg-[rgba(36,25,80,0.5)]" />
        </View>

        <View className="flex-1 gap-[6px] pr-1">
          <Text className="font-wh-bold text-wh-xxl text-wh-text-secondary dark:text-[#C6B7EC]">
            {pack.name}
          </Text>
          <Text className="font-wh-regular text-[13.5px] text-[#A8977F] dark:text-wh-text-quiet">
            {pack.blurb}
          </Text>
        </View>

        <ChunkyPressable
          offset={3}
          shadowVar="--color-wh-primary-shadow"
          accessibilityRole="button"
          accessibilityLabel={`Buy ${pack.name} for ${pack.price}`}
          className="rounded-wh-pill bg-wh-primary px-4 py-[10px]"
        >
          <Text className="font-wh-heavy text-[14.5px] text-wh-on-primary">{pack.price}</Text>
        </ChunkyPressable>
      </View>
    </Appear>
  );
}

export default function NothingOwned() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Back, title, coin balance — the pack list's own header, which is
            not the one on Settings/Stats: the right slot holds a real pill
            rather than the counterweight box. */}
        <Appear
          rise={-6}
          className="h-[60px] flex-row items-center justify-between px-[18px] pt-[6px]"
        >
          <ChunkyPressable
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
          >
            <Text className="pb-1 font-wh-bold text-wh-h2 leading-none text-wh-text-faint dark:text-wh-text-secondary">
              ‹
            </Text>
          </ChunkyPressable>

          <Text className="font-wh-bold text-wh-h2 text-wh-clue-text">HUG PACKS</Text>

          <Chunky
            offset={3}
            shadowVar="--color-wh-surface-shadow"
            className="h-[42px] flex-row items-center gap-2 rounded-wh-pill bg-wh-surface pl-[10px] pr-[14px]"
          >
            <Chunky
              offset={-3}
              inset
              shadowVar="--color-wh-coin-dot-shadow"
              className="h-6 w-6 rounded-wh-pill bg-wh-primary"
            />
            <Text className="font-wh-heavy text-wh-md text-wh-text-primary">3</Text>
          </Chunky>
        </Appear>

        {/* "Yours forever once you take one" — the whole business model, said
            once, before any price appears. */}
        <Appear delay={60} className="h-[52px] items-center justify-center px-[30px]">
          <Text className="text-center font-wh-regular text-[14.5px] text-wh-text-quiet">
            Thirty puzzles each, on a theme. Yours forever once you take one.
          </Text>
        </Appear>

        <View className="flex-1 gap-[11px] px-5 pt-[2px]">
          {PACKS.map((pack, i) => (
            <PackRow key={pack.short} pack={pack} index={i} />
          ))}
        </View>

        <Appear delay={120 + PACKS.length * STAGGER} rise={10} className="px-5 pb-[6px] pt-3">
          <ChunkyPressable
            offset={4}
            shadowVar="--color-wh-surface-quiet-shadow"
            accessibilityRole="button"
            accessibilityLabel="All five in the bundle, £9.99"
            className="h-[58px] flex-row items-center justify-center gap-[10px] rounded-[19px] bg-wh-surface-quiet"
          >
            <Text className="font-wh-bold text-[19px] text-wh-text-secondary dark:text-[#C6B7EC]">
              All five in the bundle
            </Text>
            <Text className="font-wh-heavy text-wh-base text-wh-card-label dark:text-wh-text-quiet">
              £9.99
            </Text>
          </ChunkyPressable>
        </Appear>
      </View>
    </View>
  );
}
