import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/motion';

/**
 * The bottom sheet shared by overlay B (nudge picker) and overlay C (zero-coin
 * prompt).
 *
 * Built from `designs/extracted/b-nudge-picker-{light,dark}.html` and
 * `c-zero-coin-prompt-{light,dark}.html`, all four read in full. Both draw the
 * identical container — a 28px-topped panel pinned to the bottom of a dimmed
 * board, with a grabber centred above the content — so the container is here
 * and only what is inside it lives in the screens.
 *
 * ── Why this is not @gorhom/bottom-sheet ──────────────────────────────────
 * That package is installed and will earn its place the day a sheet needs to
 * be dragged, snapped or dismissed by gesture. Neither of these does: both are
 * a fixed-height panel that appears and is dismissed by a button. Reaching for
 * the gesture library now would mean a scroll container, a backdrop component
 * and a provider in the tree, all in service of a shape that is a View. It can
 * be swapped in behind this component later without any screen changing.
 *
 * ── The scrim ─────────────────────────────────────────────────────────────
 * `backdrop` is rgba(58,42,24,0.28) in light and rgba(8,4,20,0.5) in dark —
 * two different colours, not one colour at two alphas. Tapping it closes the
 * sheet, which is not drawn anywhere but is what every sheet on both platforms
 * does; a sheet that can only be dismissed by its own button reads as a trap.
 *
 * ── The 44px bottom padding ───────────────────────────────────────────────
 * The design's 44px is the home indicator plus breathing room. It is replaced
 * here by the real safe-area inset with a floor, because 44px is right on the
 * phone the export was drawn at and wrong on every other one (D-001).
 */

/** The dimmed board behind a sheet or dialog. Tapping it dismisses. */
export function Scrim({ onPress, className }: { onPress?: () => void; className?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Close"
      className={className ?? 'absolute inset-0 bg-wh-backdrop'}
    />
  );
}

/** The 46x5 handle centred at the top of every sheet. */
export function Grabber() {
  return (
    // rgba(58,42,24,0.18) / rgba(255,243,222,0.28) — the grabber is the only
    // thing in the app that uses either value, so they are written here rather
    // than tokenised into a name that would sound more general than it is.
    <View className="mx-auto h-[5px] w-[46px] rounded-wh-hair bg-[rgba(58,42,24,0.18)] dark:bg-[rgba(255,243,222,0.28)]" />
  );
}

export interface SheetProps {
  children?: ReactNode;
  onDismiss?: () => void;
  /**
   * The `0 -6px 0 rgba(58,42,24,0.06)` lip above the sheet. B draws it in
   * light; C does not, and neither draws it in dark. Reproduced as a prop
   * rather than unified, because a one-screen difference in an export is as
   * likely to be intentional as it is to be a slip, and guessing which costs
   * more than carrying a boolean.
   */
  lift?: boolean;
}

export function Sheet({ children, onDismiss, lift = false }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <Scrim onPress={onDismiss} />

      <Appear
        rise={24}
        className="absolute bottom-0 left-0 right-0 gap-[14px] rounded-t-[28px] bg-wh-solve-panel px-[22px] pt-4"
        style={{
          paddingBottom: Math.max(insets.bottom, 20) + 24,
          ...(lift ? { boxShadow: '0 -6px 0 rgba(58,42,24,0.06)' } : null),
        }}
      >
        <Grabber />
        {children}
      </Appear>
    </View>
  );
}
