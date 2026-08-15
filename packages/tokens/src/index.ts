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

  /* ── The puzzle board ──────────────────────────────────────────────────
   * Added session 2, read off 09-daily-puzzle-{light,dark}. These are NOT
   * derivable from the base palette: in dark, the clue card is `surface`
   * but the answer tile is #4A3193 and the keycap is #3E2884, three
   * different purples. Reaching for `surface` for all three is the
   * plausible-and-wrong move. Shared by Daily, Archive and Pack puzzles.
   */

  /** The three clue rows (GREEN / BOAT / LIGHT). */
  clueCard: string;
  clueCardShadow: string;
  clueText: string;
  /** The dashed "?" box at the right of each clue row. */
  clueSlot: string;
  clueSlotBorder: string;
  clueSlotText: string;

  /** The answer tiles the player fills in. */
  answerTile: string;
  answerTileShadow: string;
  answerTileText: string;
  /** The tile holding the caret. Its border and caret are `primary`. */
  answerTileActive: string;
  answerTileActiveShadow: string;
  /** Tiles not yet reached. Sunken, with an inset top shadow. */
  answerTileEmpty: string;
  answerTileEmptyShadow: string;

  /** The letter keys. */
  keyCap: string;
  keyCapShadow: string;
  keyCapText: string;

  /** The "PUZZLE 128 · TUESDAY" pill. A translucent wash, not a solid. */
  chipSurface: string;
  chipText: string;

  /**
   * The small round ornaments in the header and hint button. Each is a solid
   * fill with an inset shadow that gives it a pressed, enamel-badge feel.
   * These four are identical in both themes; `badgeShadow` is not.
   */
  coinGlyph: string;
  coinDotShadow: string;
  streakDotShadow: string;
  hintGlyphShadow: string;
  badgeShadow: string;

  /**
   * The scrim behind a sheet or dialog (`position:absolute;inset:0` in the
   * overlay designs). In light this is `rgba(58,42,24,0.28)` — the same value
   * as the device mockup's drop shadow, used here as real UI. See the Note
   * (session 2) in the parity test for why that stopped being a failure.
   */
  backdrop: string;

  /* ── Onboarding and system chrome ──────────────────────────────────────
   * Added session 3, read off 04-welcome, 05-try-the-game, 06-the-ritual,
   * 07-notification-priming, 08-drop-in, 01-loading and 02-error, both
   * themes. Everything here appears on at least two screens; the handful of
   * colours that appear exactly once are written inline on their screen with
   * the design file named, rather than tokenised into something that sounds
   * general and is not.
   *
   * The reason this group has to exist at all: light pairs these differently
   * from dark. `pillText` and `textQuiet` are the SAME colour in light
   * (#9C8A73) and two different colours in dark (#B6A4E4 / #8F79D4). One
   * token for both would be correct in light and wrong in dark — the exact
   * shape of the session-1 `onPrimary` bug.
   */

  /** The unfilled progress pips in the onboarding header, and the loading dots. */
  stepDotInactive: string;
  /** Label inside a small raised pill — "Skip", "Nudge". */
  pillText: string;
  /**
   * Quiet standalone text: the eyebrow above a step, and the secondary text
   * link under a primary button ("Not now", "Back to today's puzzle").
   */
  textQuiet: string;
  /** The 2.5px rule under that text link. Not a border token — it is the link. */
  linkRule: string;
  /** The faintest readable text in the app: helper lines and timestamps. */
  textWhisper: string;

  /** A letter key the player has already used. Present, not gone. */
  keyCapDim: string;
  keyCapDimShadow: string;
  keyCapDimText: string;

  /**
   * A recessive fill that is not a card: the hint bar in onboarding step 2 and
   * the dropped tile on the error screen. Light warms it; dark deepens it.
   */
  surfaceQuiet: string;
  surfaceQuietShadow: string;

  /** The tinted square behind the coral streak dot. Coral at ~8% in both themes. */
  highlightWash: string;

  /* ── The solve celebration ─────────────────────────────────────────────
   * Added session 3, read off a-solve-celebration-{light,dark}.
   */

  /**
   * The wash the celebration sits on. NOT `backdrop`: that is a scrim that
   * dims what is behind it, and this is a near-opaque sheet of the screen's
   * own ground (0.93 / 0.94) that all but replaces it. The board stays
   * faintly visible underneath, which is the point — the answer is still
   * there, it is just no longer the thing you are looking at.
   */
  overlayWash: string;

  /** The panel holding the three compound words. Its own fill, not a card. */
  solvePanel: string;
  solvePanelShadow: string;

  /**
   * The teal when it is TYPE rather than a fill. Light can use `accent`
   * itself; dark cannot — #17A398 on #2A1B58 is too dark to read, so the
   * design brightens it to #2ED3C0. Using `accent` for both is the
   * plausible-and-wrong move here.
   */
  accentText: string;

  /* ── The puzzle board's submit button ──────────────────────────────────
   * Added session 3, read off 11-archive-puzzle-{light,dark}. The → button
   * before the word is long enough to check: flat, with no shadow at all,
   * which is the only place in the app where a control has no elevation.
   * That absence IS the disabled state — there is no greyed-out amber, no
   * reduced opacity, and nothing that reads as a refusal (rule 1).
   */
  submitIdle: string;
  submitIdleText: string;

  /* ── Lists, cards and figures ──────────────────────────────────────────
   * Added session 3, read off 16-settings, 17-how-to-play and 18-stats.
   *
   * The teal now has THREE tokens — `accent`, `accentText`, `accentMid` —
   * and all three are #17A398 in light. Dark splits them: a fill stays
   * #17A398, type on a panel goes to #2ED3C0, and a figure or a progress bar
   * lands between at #1FBFB0. Anyone reading only the light designs would
   * merge all three and be right about half the app.
   */

  /** The 1.5px line between rows inside a settings card. */
  rowDivider: string;
  /** The moving part of a toggle. */
  toggleKnob: string;
  /**
   * The inset shadow inside a toggle's track — the same in both themes,
   * because it is a shadow cast by the amber onto itself. See
   * SHARED_BY_DESIGN in the parity test.
   */
  toggleTrackShadow: string;
  /** The › and ↗ at the end of a tappable row. */
  disclosure: string;

  /** The uppercase eyebrow inside a card ("WORKED EXAMPLE", "YOUR PACKS"). */
  cardLabel: string;
  /** The even smaller, wider-tracked label under a big figure on Stats. */
  statLabel: string;

  /** The teal as a figure or a progress bar. Between `accent` and `accentText`. */
  accentMid: string;
  /** The coral as type. Dark brightens it; light does not need to. */
  highlightText: string;
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

  clueCard: '#FFFFFF',
  clueCardShadow: '#EBD6B0',
  clueText: '#3A2A18',
  clueSlot: '#FFF3DE',
  clueSlotBorder: '#E0C795',
  clueSlotText: '#C9AC79',

  answerTile: '#FFFFFF',
  answerTileShadow: '#E4CFA8',
  answerTileText: '#3A2A18',
  answerTileActive: '#FFF7E6',
  answerTileActiveShadow: '#E9A413',
  answerTileEmpty: '#F3E3C4',
  answerTileEmptyShadow: 'rgba(160,130,80,0.18)',

  keyCap: '#FFF0CE',
  keyCapShadow: '#E9D6A8',
  keyCapText: '#6E5B44',

  chipSurface: 'rgba(58,42,24,0.07)',
  chipText: '#7C6A55',

  coinGlyph: '#8A5A00',
  coinDotShadow: 'rgba(158,102,0,0.35)',
  streakDotShadow: 'rgba(160,45,25,0.35)',
  hintGlyphShadow: 'rgba(158,102,0,0.3)',
  badgeShadow: 'rgba(160,45,25,0.4)',

  backdrop: 'rgba(58,42,24,0.28)',

  stepDotInactive: '#EBD9BB',
  pillText: '#9C8A73',
  textQuiet: '#9C8A73',
  linkRule: '#E4CFA8',
  textWhisper: '#B0A08A',

  keyCapDim: '#EFE1C4',
  keyCapDimShadow: '#DFCEA8',
  keyCapDimText: '#BFAE92',

  surfaceQuiet: '#FFF0CE',
  surfaceQuietShadow: '#E9D6A8',

  highlightWash: '#FFECE6',

  overlayWash: 'rgba(255,244,226,0.93)',
  solvePanel: '#FFF9EF',
  solvePanelShadow: '#E0C795',
  accentText: '#17A398',

  submitIdle: '#F3E3C4',
  submitIdleText: '#CBB795',

  rowDivider: '#F5EBD9',
  toggleKnob: '#FFF9EF',
  toggleTrackShadow: 'rgba(158,102,0,0.28)',
  disclosure: '#C0AE95',

  cardLabel: '#B59A6C',
  statLabel: '#96836D',

  accentMid: '#17A398',
  highlightText: '#FF6B4A',
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

  // Three different purples where light uses white three times. `surface`
  // for all of them is the plausible-and-wrong simplification.
  clueCard: '#33206B',
  clueCardShadow: '#1C1040',
  clueText: '#FFF6E8',
  clueSlot: '#291958',
  clueSlotBorder: '#5B3FA6',
  clueSlotText: '#8F79D4',

  answerTile: '#4A3193',
  answerTileShadow: '#24144F',
  answerTileText: '#FFF6E8',
  answerTileActive: '#3A2478',
  // Dark keeps the neutral shadow under the active tile; light goes amber.
  answerTileActiveShadow: '#24144F',
  answerTileEmpty: '#251652',
  answerTileEmptyShadow: 'rgba(0,0,0,0.28)',

  keyCap: '#3E2884',
  keyCapShadow: '#21134B',
  keyCapText: '#E8DDFF',

  chipSurface: 'rgba(255,243,222,0.08)',
  chipText: '#B6A4E4',

  coinGlyph: '#8A5A00',
  coinDotShadow: 'rgba(158,102,0,0.35)',
  streakDotShadow: 'rgba(160,45,25,0.35)',
  hintGlyphShadow: 'rgba(158,102,0,0.3)',
  // The one ornament shadow that does change: deeper and cooler in dark.
  badgeShadow: 'rgba(120,30,15,0.5)',

  // Not a darker version of light's scrim — a different colour entirely.
  backdrop: 'rgba(8,4,20,0.5)',

  stepDotInactive: '#3D2874',
  // Light uses #9C8A73 for BOTH of these. Dark does not. Collapsing them into
  // one token is the plausible-and-wrong move this pair exists to prevent.
  pillText: '#B6A4E4',
  textQuiet: '#8F79D4',
  linkRule: '#4A3193',
  textWhisper: '#7C68B8',

  keyCapDim: '#2B1A5E',
  // Not `surfaceAltShadow` (#24144F) — the used-key shadow is deeper.
  keyCapDimShadow: '#1B0F41',
  keyCapDimText: '#7C68B8',

  surfaceQuiet: '#2B1A5E',
  surfaceQuietShadow: '#1B0F41',

  // Light washes the coral with white; dark washes it with the ground, which
  // lands somewhere closer to maroon. Neither is the other with an alpha.
  highlightWash: '#4A1F2E',

  overlayWash: 'rgba(26,15,56,0.94)',
  // Not `surfaceAlt` (#2B1A5E). One digit apart and read off a different screen.
  solvePanel: '#2A1B58',
  solvePanelShadow: '#160C33',
  // Brighter than `accent`, because here it is type on a dark panel.
  accentText: '#2ED3C0',

  submitIdle: '#2B1A5E',
  submitIdleText: '#5A458F',

  rowDivider: '#3D2874',
  // Not `surfaceInset`-by-accident: the knob really is the darkest fill in
  // the palette in dark, and the lightest in light.
  toggleKnob: '#1A0F38',
  toggleTrackShadow: 'rgba(158,102,0,0.28)',
  disclosure: '#6D5DA6',

  cardLabel: '#8F79D4',
  statLabel: '#A392D2',

  // The third teal. A fill stays #17A398, type goes #2ED3C0, a figure sits here.
  accentMid: '#1FBFB0',
  highlightText: '#FF7F5F',
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
 * The family names React Native must actually be given.
 *
 * `fontFamily: 'Baloo 2'` + `fontWeight: '800'` does NOT work for a custom
 * family on iOS or Android — the weight is ignored and one arbitrary face
 * renders. Every style must name its bundled face directly (D-003), which is
 * why these exist alongside `font`/`weight` rather than instead of them.
 *
 * ── The 900 problem, found session 2 ──────────────────────────────────────
 * The designs set `font-weight:900` on eyebrow labels, the chip text and the
 * coin/streak counts. **Baloo 2 has no 900 face.** Its weight axis stops at
 * 800, and @expo-google-fonts/baloo-2 ships 400/500/600/700/800 — no Black.
 * The browser that rendered the design export synthesised the extra weight;
 * a phone will not. So `heavy` resolves to the 800 face: the heaviest Baloo 2
 * that exists, and a visible-but-honest difference from the export on those
 * few labels. The alternative — leaving `fontWeight: '900'` in the styles —
 * silently drops to a system font, which is much worse and much harder to
 * spot. Flagged to the owner; see progress/04-changelog.md, session 2.
 * ──────────────────────────────────────────────────────────────────────────
 */
export const face = {
  regular: 'Baloo2_700Bold',
  bold: 'Baloo2_800ExtraBold',
  heavy: 'Baloo2_800ExtraBold',
} as const;

/** The distinct faces that must be loaded at startup. Two, not three. */
export const facesToLoad = ['Baloo2_700Bold', 'Baloo2_800ExtraBold'] as const;

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
 *
 * `fontFamily` names the bundled face and there is deliberately NO
 * `fontWeight`: setting both on a custom family makes Android pick a face by
 * itself and quietly ignore the one you asked for (D-003).
 */
export const text = {
  /** Screen titles and the puzzle answer. */
  display: { fontFamily: face.bold, fontSize: size.displayLg },
  /** Section headings. */
  h1: { fontFamily: face.bold, fontSize: size.h1 },
  h2: { fontFamily: face.bold, fontSize: size.h2 },
  h3: { fontFamily: face.bold, fontSize: size.h3 },
  /** The three clue words on a puzzle screen. */
  clue: { fontFamily: face.bold, fontSize: size.xxl },
  /** Buttons and list rows. */
  action: { fontFamily: face.bold, fontSize: size.xl },
  body: { fontFamily: face.bold, fontSize: size.md },
  bodySm: { fontFamily: face.bold, fontSize: size.base },
  /** Uppercase eyebrow labels — always heavy, always widely tracked. */
  label: {
    fontFamily: face.heavy,
    fontSize: size.xs,
    letterSpacing: tracking.label,
    textTransform: 'uppercase' as const,
  },
  caption: { fontFamily: face.heavy, fontSize: size.smAlt },
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
