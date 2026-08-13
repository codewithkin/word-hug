import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fade } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { Wordmark } from '@/components/wordmark';

/**
 * ── 01 Loading ────────────────────────────────────────────────────────────
 * Built from `designs/extracted/01-loading-light.html` and
 * `01-loading-dark.html`, read in full, both themes.
 *
 * The wordmark, centred, with three dots underneath. That is the entire
 * screen. No progress bar, no percentage, no "Loading…" — a number that
 * creeps is a clock, and rule 1 says the interface may never imply one.
 *
 * ── The dots ──────────────────────────────────────────────────────────────
 * The design is a still frame: the first dot is amber and the other two are
 * `stepDotInactive`. A still frame of a loading screen is by definition one
 * moment of something that moves, so the amber travels — every 420ms, with a
 * 260ms crossfade, which reads as an unhurried heartbeat rather than a
 * spinner. Both dot colours are exactly the design's; only which one is which
 * changes, and each dot is the inactive colour with the amber crossfaded over
 * it so the change is never a hard swap.
 *
 * The wordmark does NOT assemble here, unlike on the Welcome screen. This
 * screen may be on-screen for 200ms; something that takes 600ms to arrive
 * would mostly be seen mid-flight.
 *
 * ── Note (session 3) ──────────────────────────────────────────────────────
 * Nothing routes here yet. It is the screen the app should show while the
 * puzzle bank and saved state load, and both of those arrive with the storage
 * layer. Until then it is reachable from the temporary link row on Daily.
 * ──────────────────────────────────────────────────────────────────────────
 */

const DOTS = 3;
const STEP_MS = 420;

export default function Loading() {
  const insets = useSafeAreaInsets();
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLit((d) => (d + 1) % DOTS), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="flex-1 items-center justify-center px-[30px]">
          <Wordmark gap={14} />
        </View>

        <View className="h-[120px] items-start px-[60px]">
          <View className="w-full flex-row items-center justify-center gap-2">
            {Array.from({ length: DOTS }, (_, i) => (
              <View
                key={i}
                className="h-[11px] w-[11px] overflow-hidden rounded-wh-pill bg-wh-step-dot-inactive"
              >
                <Fade show={i === lit} style={StyleSheet.absoluteFill}>
                  <View className="h-full w-full rounded-wh-pill bg-wh-primary" />
                </Fade>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
