import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { GRADIENT_VARS } from '@/theme/token-map.generated';

/**
 * The puzzle screens' background.
 *
 * ── Read this before "simplifying" it ─────────────────────────────────────
 * This is NOT a flat colour. It is
 *
 *   radial-gradient(115% 70% at 50% 0%, #FFE6B4 0%, #FFF4E2 58%, #FFF9EF 100%)
 *
 * — a three-stop radial with a warm glow at the top of the screen. Shipping
 * the last stop alone (`#FFF9EF`) is entirely plausible in code, produces an
 * app that looks completely self-consistent, and is wrong on the screen where
 * users spend 90% of their time. The whole product reads as "cozy" largely
 * because of this one gradient.
 *
 * React Native has no radial gradient, and `expo-linear-gradient` cannot
 * approximate one, so it is drawn with react-native-svg as an absolutely
 * positioned layer underneath the content. All 74 gradients in the designs
 * are radial; not one is linear.
 *
 * Every value is read from a CSS variable rather than from the token module,
 * so the gradient switches with the theme through the same styling layer as
 * everything else — and so a broken styling layer shows up here too instead
 * of being papered over by a direct import.
 */
export function PuzzleGround({
  variant = 'groundPuzzle',
}: {
  /** `groundPuzzleOffset` is the left-aligned variant used by some screens. */
  variant?: keyof typeof GRADIENT_VARS;
}) {
  const spec = GRADIENT_VARS[variant];
  const values = useCSSVariable([...spec.colors, ...spec.stops, ...spec.geometry]);

  const [c0, c1, c2, s0, s1, s2, cx, cy, rx, ry] = values;

  // Before the styling layer has resolved, paint nothing rather than a guess:
  // a wrong flat colour here is exactly the failure this file exists to stop.
  if (c0 === undefined || c1 === undefined || c2 === undefined) return null;

  const pct = (v: string | number | undefined, fallback: string) =>
    v === undefined ? fallback : `${Number(v) * 100}%`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient
          id="puzzle-ground"
          cx={pct(cx, '50%')}
          cy={pct(cy, '0%')}
          rx={pct(rx, '115%')}
          ry={pct(ry, '70%')}
          gradientUnits="objectBoundingBox"
        >
          <Stop offset={pct(s0, '0%')} stopColor={String(c0)} />
          <Stop offset={pct(s1, '58%')} stopColor={String(c1)} />
          <Stop offset={pct(s2, '100%')} stopColor={String(c2)} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#puzzle-ground)" />
    </Svg>
  );
}
