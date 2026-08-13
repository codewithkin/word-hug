import { router } from 'expo-router';

import { SolveCelebration } from '@/components/solve-celebration';

/**
 * `/celebration` — overlay A, opened on purpose.
 *
 * Registered as a `transparentModal` in the root layout, so the Daily screen
 * stays mounted and visible underneath and the overlay's wash falls on the
 * real board rather than on a redrawn copy of it. That is also exactly how it
 * will work in the game: the celebration is pushed over whatever puzzle was
 * just solved.
 *
 * It is a route only so that it can be looked at before the game logic that
 * would trigger it exists. When a solve can actually happen, this stays — the
 * puzzle screens present it — and the temporary link on Daily goes.
 *
 * The content is the design's own placeholder solve: GREEN / BOAT / LIGHT
 * hugged by HOUSE.
 */
export default function CelebrationRoute() {
  return (
    <SolveCelebration
      onClose={() => router.back()}
      onArchive={() => router.back()}
    />
  );
}
