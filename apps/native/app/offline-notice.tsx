import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/notice';
import { PuzzleGround } from '@/components/puzzle-ground';

/**
 * ── Overlay F · Offline notice ────────────────────────────────────────────
 * Built from `designs/extracted/f-offline-notice-light.html` and
 * `f-offline-notice-dark.html`, read in full, both themes.
 *
 * The banner itself is `components/notice.tsx` — a component rather than a
 * screen, because that is what it will be: the Shop (15) and the Pack List
 * (12) mount it at the top of their own content when `expo-network` reports no
 * connection. It is not a route in the product, and it never navigates.
 *
 * ── Recorded divergence ───────────────────────────────────────────────────
 * The design draws this banner over the Shop screen — a HUG BUNDLE card and a
 * short owned-packs list. **Screen 15 is not built**, so this route puts the
 * banner on the plain puzzle ground instead of on a hand-copied approximation
 * of a screen that does not exist yet. Two of the Shop card's colours
 * (#FFF9EF/#1A0F38 with #E0C795/#0C0718 under it) do not correspond to any
 * single token pair, and inventing them here — in a throwaway backdrop, on a
 * screen nobody has agreed the shape of — is how a wrong value gets copied
 * into the real screen later.
 *
 * So: the banner is exact and the thing behind it is not the design's. When
 * the Shop is built, this route goes and the Shop mounts the banner itself.
 * ──────────────────────────────────────────────────────────────────────────
 */

export default function OfflineNoticeRoute() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {/* The design pins the banner 100px from the top of the frame, which
            is ~46px below the status bar on the phone it was drawn at. */}
        <View className="h-[46px]" />
        <OfflineBanner onDismiss={() => router.back()} />
      </View>
    </View>
  );
}
