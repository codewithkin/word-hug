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

/* ───────────────────────────── TYPOGRAPHY ───────────────────────────── */

/**
 * Word Hug is a SINGLE-FAMILY interface. Baloo 2 appears on all 84 screens;
 * Nunito appears on none of them — it is the design export page's own chrome,
 * not app UI, and tokenising it was a session-1 error caught by re-reading.
 *
 * Custom families do NOT synthesise weights on iOS or Android. Every weight
 * below must be a bundled face or the wrong one renders silently (D-003).
 */
export const font = { display: 'Baloo 2' } as const;

/** The only three weights in the designs. Do not invent others (D-003). */
export const weight = { regular: '700', bold: '800', heavy: '900' } as const;

/**
 * Size ramp, from the designs. Half-pixel sizes are real and deliberate.
 * This is the common spine, not an exhaustive list — when a screen uses a
 * size that is not here, use the screen's value, not the nearest token.
 */
export const size = {
  micro: 11.5,
  xs: 12,
  sm: 13,
  smAlt: 13.5,
  base: 14,
  md: 16,
  lg: 17,
  xl: 20,
  xxl: 22,
  h3: 24,
  h2: 26,
  h1: 28,
  display: 32,
  displayLg: 34,
} as const;

export const tracking = { tight: '0em', label: '0.18em', wide: '0.06em' } as const;

/**
 * Reusable text presets — the size/weight/tracking combinations the designs
 * actually pair, rather than a grid of every possibility. Reach for these
 * before composing a one-off.
 */
export const text = {
  /** Screen titles and the puzzle answer. */
  display: { fontFamily: font.display, fontSize: size.displayLg, fontWeight: weight.bold },
  /** Section headings. */
  h1: { fontFamily: font.display, fontSize: size.h1, fontWeight: weight.bold },
  h2: { fontFamily: font.display, fontSize: size.h2, fontWeight: weight.bold },
  h3: { fontFamily: font.display, fontSize: size.h3, fontWeight: weight.bold },
  /** The three clue words on a puzzle screen. */
  clue: { fontFamily: font.display, fontSize: size.xxl, fontWeight: weight.bold },
  /** Buttons and list rows. */
  action: { fontFamily: font.display, fontSize: size.xl, fontWeight: weight.bold },
  body: { fontFamily: font.display, fontSize: size.md, fontWeight: weight.bold },
  bodySm: { fontFamily: font.display, fontSize: size.base, fontWeight: weight.bold },
  /** Uppercase eyebrow labels — always heavy, always widely tracked. */
  label: {
    fontFamily: font.display,
    fontSize: size.xs,
    fontWeight: weight.heavy,
    letterSpacing: tracking.label,
    textTransform: 'uppercase' as const,
  },
  caption: { fontFamily: font.display, fontSize: size.smAlt, fontWeight: weight.heavy },
} as const;

/* ────────────────────────── SPACING & GEOMETRY ───────────────────────── */

/**
 * Spacing is hand-tuned, not a 4pt or 8pt grid: the designs use every value
 * from 1 to 14, then 16, 19, 24 and 36. Do not round a design's 19px to 20 to
 * make it fit a scale — the scale is descriptive, not prescriptive.
 */
export const space = {
  hair: 1,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  section: 19,
  screen: 24,
  screenLg: 36,
} as const;

/**
 * Radii. 16 is the workhorse and 999 the pill.
 * NOTE: 46px is the device mockup's own corner and is NOT a UI value (D-001).
 */
export const radius = {
  hair: 3,
  sm: 10,
  md: 14,
  card: 16,
  lg: 20,
  xl: 22,
  pill: 999,
} as const;

/**
 * The signature elevation: a hard vertical offset with ZERO blur, which is
 * what makes the interface feel chunky and tactile. A soft blurred shadow is
 * the reflexive choice and would quietly change the product's character (D-004).
 *
 * There are five levels in the designs, not one. 4 and 3 are the workhorses;
 * session 1 tokenised only 5 and was wrong.
 */
export const elevation = {
  blur: 0,
  /** Rest offsets in px, by prominence. */
  sm: 2,
  md: 3,
  base: 4,
  lg: 5,
  xl: 6,
  /** Pressed state reduces the offset — it never adds blur. */
  pressed: 2,
} as const;

/** Build the shadow string for a level. Colour comes from the palette. */
export const shadow = (y: number, color: string) => `0 ${y}px 0 ${color}`;
