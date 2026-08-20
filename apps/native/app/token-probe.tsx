import { router } from 'expo-router';
import { palettes, type ThemeName } from '@word-hug/tokens';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable, useUniwind } from 'uniwind';

import { ChunkyPressable } from '@/components/chunky';
import { Appear, Land } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { GRADIENT_VARS, TOKEN_ROWS } from '@/theme/token-map.generated';
import { useAppTheme } from '@/contexts/app-theme-context';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE PROOF SCREEN. Its only job is to answer one question:
 *
 *   Are the design tokens actually plumbed into uniwind, or is the app
 *   rendering heroui's stock palette while the token file describes
 *   something else entirely?
 *
 * That failure is invisible by inspection. Every screen looks consistent,
 * nothing throws, the token file is correct, and the app is simply the wrong
 * colour everywhere. It ran undetected for three sessions in the project
 * this process came from. So it gets checked directly, on a device, before
 * anything is built on top of it.
 *
 * HOW TO READ IT
 *   · Each row's swatch is painted by a real className (`bg-wh-primary`).
 *     It is NOT painted from the token value in JS — that would prove only
 *     that the token file agrees with itself.
 *   · The hex beside it is what the TypeScript token says it should be.
 *   · The verdict compares the token to the value uniwind resolved at
 *     runtime from the CSS variable.
 *
 * Every row must say OK, in BOTH themes — use the toggle at the top. A row
 * that says MISSING means the variable never reached uniwind. A row that
 * says DIFFERS means it reached it with the wrong value. Either way, stop:
 * nothing built on top of this will be the right colour.
 *
 * If every row says OK but a swatch is visibly the wrong colour, that is the
 * most important bug in the project and it means the class is resolving to
 * something other than the variable. Report it.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Colours vary in notation (`#FFF` vs `#ffffff`, spaces inside `rgba()`). */
function normalise(v: unknown): string {
  return String(v ?? '').toLowerCase().replace(/\s+/g, '');
}

export default function TokenProbe() {
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const { toggleTheme } = useAppTheme();

  const resolved = useCSSVariable(TOKEN_ROWS.map((r) => r.cssVar));
  const gradient = useCSSVariable([
    ...GRADIENT_VARS.groundPuzzle.colors,
    ...GRADIENT_VARS.groundPuzzle.stops,
  ]);

  const palette = palettes[(theme === 'dark' ? 'dark' : 'light') as ThemeName];

  const rows = TOKEN_ROWS.map((row, i) => {
    const expected = palette[row.key];
    const actual = resolved[i];
    const verdict =
      actual === undefined ? 'MISSING' : normalise(actual) === normalise(expected) ? 'OK' : 'DIFFERS';
    return { ...row, expected, actual, verdict };
  });

  const failing = rows.filter((r) => r.verdict !== 'OK');

  return (
    <View className="flex-1 bg-wh-ground">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Appear className="px-5 gap-3">
          {/* Session 7: the probe had no way out. It is registered as a modal,
              which on iOS gets a swipe-down and on Android gets the hardware
              back — but a modal whose only exit is a system gesture is a trap
              on a device without one, and `scripts/nav-check.mjs` counts it as
              a dead end. One explicit control costs nothing. */}
          <View className="flex-row items-center justify-between">
            <Text className="font-wh-bold text-wh-h2 text-wh-text-primary">Token probe</Text>
            <ChunkyPressable
              offset={3}
              shadowVar="--color-wh-surface-shadow"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close the probe"
              className="h-[42px] w-[42px] items-center justify-center rounded-wh-card bg-wh-surface"
            >
              <Text className="font-wh-bold text-wh-xl text-wh-text-faint dark:text-wh-text-secondary">
                ×
              </Text>
            </ChunkyPressable>
          </View>

          {/* The verdict re-animates whenever the theme flips, which makes the
              switch feel like a re-test rather than a repaint. */}
          <Land
            key={`${theme}-${failing.length}`}
            rise={0}
            scaleFrom={0.97}
            className={
              failing.length === 0
                ? 'rounded-wh-card bg-wh-accent px-4 py-3'
                : 'rounded-wh-card bg-wh-highlight px-4 py-3'
            }
          >
            <Text className="font-wh-bold text-wh-md text-wh-on-accent">
              {failing.length === 0
                ? `All ${rows.length} tokens resolved correctly in "${theme}".`
                : `${failing.length} of ${rows.length} tokens are wrong in "${theme}".`}
            </Text>
          </Land>

          {/* A real ChunkyPressable, so the press animation gets exercised
              here too rather than only on the Daily screen. */}
          <ChunkyPressable
            offset={4}
            shadowVar="--color-wh-primary-shadow"
            onPress={toggleTheme}
            accessibilityRole="button"
            className="items-center justify-center rounded-wh-card bg-wh-primary px-4 py-3"
          >
            <Text className="font-wh-bold text-wh-xl text-wh-on-primary">
              Switch theme — now showing {theme}
            </Text>
          </ChunkyPressable>

          <Text className="font-wh-regular text-wh-sm text-wh-text-secondary">
            The swatch is painted by a className. The hex is what the token says. Both themes must
            be all-OK before any screen is trusted.
          </Text>
        </Appear>

        {/* ── The gradient, which is the value most likely to be flattened ── */}
        <Appear delay={80} className="mt-5 px-5 gap-2">
          <Text className="font-wh-heavy text-wh-xs tracking-wh-label text-wh-text-muted uppercase">
            Puzzle ground — must be a gradient, not a flat fill
          </Text>
          <View className="h-28 overflow-hidden rounded-wh-xl border-2 border-wh-border">
            <PuzzleGround />
          </View>
          <Text className="font-wh-regular text-wh-sm text-wh-text-secondary">
            {gradient.some((g) => g === undefined)
              ? 'MISSING — the gradient stops did not resolve. The Daily screen will be flat.'
              : `stops ${String(gradient[0])} → ${String(gradient[1])} → ${String(gradient[2])} at ` +
                `${String(gradient[3])} / ${String(gradient[4])} / ${String(gradient[5])}`}
          </Text>
          <Text className="font-wh-regular text-wh-sm text-wh-text-secondary">
            There should be a warm glow at the TOP that fades downwards. An even block of colour
            means the gradient was flattened.
          </Text>
        </Appear>

        {/* ── Type, which fails silently and looks like a design choice ── */}
        <Appear delay={140} className="mt-5 px-5 gap-2">
          <Text className="font-wh-heavy text-wh-xs tracking-wh-label text-wh-text-muted uppercase">
            Baloo 2 — all three lines must be rounded and chunky
          </Text>
          <Text className="font-wh-regular text-wh-h3 text-wh-text-primary">Regular 700 HUG IT</Text>
          <Text className="font-wh-bold text-wh-h3 text-wh-text-primary">Bold 800 HUG IT</Text>
          <Text className="font-wh-heavy text-wh-h3 text-wh-text-primary">Heavy 800 HUG IT</Text>
          <Text className="font-wh-regular text-wh-sm text-wh-text-secondary">
            If any line looks like a plain system font, that face did not load. &quot;Heavy&quot; is
            the 800 face on purpose — Baloo 2 has no 900.
          </Text>
        </Appear>

        {/* ── Every colour token ── */}
        <View className="mt-5 gap-2 px-5">
          <Text className="font-wh-heavy text-wh-xs tracking-wh-label text-wh-text-muted uppercase">
            {rows.length} colour tokens
          </Text>
          {rows.map((row, i) => (
            <Appear
              key={row.key}
              // Capped so 45 rows do not take three seconds to arrive.
              delay={Math.min(i, 12) * 24}
              rise={6}
              className="flex-row items-center gap-3"
            >
              <View className={`h-11 w-11 rounded-wh-sm border border-wh-border ${row.bg}`} />
              <View className="flex-1">
                <Text className="font-wh-bold text-wh-base text-wh-text-primary">{row.key}</Text>
                <Text className="font-wh-regular text-wh-sm text-wh-text-secondary">
                  {row.verdict === 'OK'
                    ? String(row.expected)
                    : `token ${String(row.expected)} · uniwind ${String(row.actual ?? '(nothing)')}`}
                </Text>
              </View>
              <Text
                className={
                  row.verdict === 'OK'
                    ? 'font-wh-heavy text-wh-sm text-wh-text-muted'
                    : 'font-wh-heavy text-wh-sm text-wh-highlight'
                }
              >
                {row.verdict}
              </Text>
            </Appear>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
