/**
 * Word Hug — design tokens.
 *
 * Derived from `designs/extracted/` in session 1 by reading the screens, not
 * by assumption. Regenerate the source with `node designs/extract.mjs` and
 * survey it with `node designs/census.mjs`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS FILE IS RANK 3. THE DESIGN FILES ARE RANK 1.
 *
 * Do not build a screen from these tokens. Open the screen's own file in
 * `designs/extracted/` and read it. Tokens are a convenience for values many
 * screens share, and they are allowed to be incomplete. The designs are not.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Two values that look like app colours and are NOT (D-001):
 *   #20160C                — the device mockup's bezel, on all 84 screens
 *   rgba(58,42,24,0.28)    — that bezel's drop shadow
 * They wrap the 390x844 frame in the export. They are photography, not UI.
 */

/** Fill that cannot be expressed as a single colour. Never flatten these. */
export type Gradient = string;

export interface Palette {
  /** The app's base ground, behind everything. */
  ground: string;
  /**
   * The puzzle screens' ground. A three-stop radial with a warm glow at the
   * top — NOT a flat colour. Shipping the last stop alone is plausible in
   * code, self-consistent, and wrong on the most-used screen in the app.
   */
  groundPuzzle: Gradient;
  /** Variant used where content sits left-aligned rather than centred. */
  groundPuzzleOffset: Gradient;

  /** Raised card / sheet surfaces, lightest first. */
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  surfaceInset: string;

  /** The chunky offset shadow under cards — a solid colour, not a blur. */
  surfaceShadow: string;
  surfaceAltShadow: string;

  /** Hairline / outline. High contrast in both themes by design. */
  border: string;

  /** Primary action. Amber is shared across both themes, unusually. */
  primary: string;
  primaryShadow: string;
  onPrimary: string;

  /** Secondary action. */
  accent: string;
  accentShadow: string;
  onAccent: string;

  /**
   * Warm coral. Used for emphasis and warmth.
   * NOT an error colour — Word Hug has no error state (D-002).
   */
  highlight: string;

  /** Text, strongest to faintest. */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
}

export const light: Palette = {
  ground: '#EFE6DA',
  groundPuzzle:
    'radial-gradient(115% 70% at 50% 0%, #FFE6B4 0%, #FFF4E2 58%, #FFF9EF 100%)',
  groundPuzzleOffset:
    'radial-gradient(90% 140% at 20% 0%, #FFE6B4 0%, #FFF4E2 60%, #FFF9EF 100%)',

  surface: '#FFFFFF',
  surfaceAlt: '#FFF9EF',
  surfaceSunken: '#FFF4E2',
  surfaceInset: '#FFF0CE',

  surfaceShadow: '#E4CFA8',
  surfaceAltShadow: '#EBD6B0',

  border: '#3A2A18',

  primary: '#FFB020',
  primaryShadow: '#D98A00',
  onPrimary: '#4A3000',

  accent: '#17A398',
  accentShadow: '#0E7A72',
  onAccent: '#EAFFFC',

  highlight: '#FF6B4A',

  textPrimary: '#3A2A18',
  textSecondary: '#6E5B44',
  textMuted: '#8C7A66',
  textFaint: '#A6866B',
};

export const dark: Palette = {
  ground: '#0C0718',
  groundPuzzle:
    'radial-gradient(115% 70% at 50% 0%, #2E1C60 0%, #211447 55%, #1A0F38 100%)',
  groundPuzzleOffset:
    'radial-gradient(115% 70% at 50% 0%, #2E1C60 0%, #211447 55%, #1A0F38 100%)',

  surface: '#33206B',
  surfaceAlt: '#2B1A5E',
  surfaceSunken: '#251652',
  surfaceInset: '#1A0F38',

  surfaceShadow: '#1C1040',
  surfaceAltShadow: '#24144F',

  border: '#FFF3DE',

  primary: '#FFB020',
  primaryShadow: '#C97F0B',
  // Darker than light's #4A3000. The amber is identical in both themes but the
  // text on it is not — assumed identical in session 1 and caught by the parity test.
  onPrimary: '#3B2400',

  accent: '#17A398',
  accentShadow: '#0B655F',
  onAccent: '#EAFFFC',

  highlight: '#FF6B4A',

  textPrimary: '#FFF3DE',
  textSecondary: '#B29CE8',
  textMuted: '#A79A8E',
  textFaint: '#6B5DA6',
};

export const palettes = { light, dark } as const;
export type ThemeName = keyof typeof palettes;

/**
 * Type families. Baloo 2 carries every heading and the puzzle words; Nunito
 * carries body copy. Custom families do NOT synthesise weights on either
 * platform — every weight used must be a loaded face or the wrong one renders
 * silently (D-003).
 */
export const font = {
  display: 'Baloo 2',
  body: 'Nunito',
} as const;

/** The only weights present in the designs. Do not invent others. */
export const weight = { regular: '700', bold: '800', heavy: '900' } as const;

/**
 * Size ramp. The designs use 41 distinct sizes including half-pixels
 * (16.5, 14.5, 13.5) — this is the common spine, not an exhaustive list.
 * When a screen uses a size that is not here, use the screen's value.
 */
export const size = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 26,
  display: 34,
} as const;

/** 16 is the workhorse; 999 is the pill. */
export const radius = { card: 16, pill: 999 } as const;

/**
 * The signature elevation: a hard offset with no blur, which is what gives
 * the interface its chunky, tactile feel. A soft blur here would quietly
 * change the whole product's character.
 */
export const elevation = { restY: 5, pressedY: 2, blur: 0 } as const;
