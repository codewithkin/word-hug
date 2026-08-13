/*
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source:    packages/tokens/src/index.ts
 * Regenerate: node packages/tokens/scripts/emit-theme-css.mjs
 *
 * Every className below is written out in full and on purpose: Tailwind
 * only emits classes it can see as literal strings in the source.
 */

import type { Palette } from '@word-hug/tokens';

export interface TokenRow {
  /** Key on the Palette interface, for looking up the expected value. */
  key: keyof Palette;
  /** The CSS variable uniwind should resolve at runtime. */
  cssVar: string;
  /** A real className, so the swatch is painted through the styling layer. */
  bg: string;
}

export const TOKEN_ROWS: TokenRow[] = [
  { key: 'ground', cssVar: '--color-wh-ground', bg: 'bg-wh-ground' },
  { key: 'surface', cssVar: '--color-wh-surface', bg: 'bg-wh-surface' },
  { key: 'surfaceAlt', cssVar: '--color-wh-surface-alt', bg: 'bg-wh-surface-alt' },
  { key: 'surfaceSunken', cssVar: '--color-wh-surface-sunken', bg: 'bg-wh-surface-sunken' },
  { key: 'surfaceInset', cssVar: '--color-wh-surface-inset', bg: 'bg-wh-surface-inset' },
  { key: 'surfaceShadow', cssVar: '--color-wh-surface-shadow', bg: 'bg-wh-surface-shadow' },
  { key: 'surfaceAltShadow', cssVar: '--color-wh-surface-alt-shadow', bg: 'bg-wh-surface-alt-shadow' },
  { key: 'border', cssVar: '--color-wh-border', bg: 'bg-wh-border' },
  { key: 'primary', cssVar: '--color-wh-primary', bg: 'bg-wh-primary' },
  { key: 'primaryShadow', cssVar: '--color-wh-primary-shadow', bg: 'bg-wh-primary-shadow' },
  { key: 'onPrimary', cssVar: '--color-wh-on-primary', bg: 'bg-wh-on-primary' },
  { key: 'accent', cssVar: '--color-wh-accent', bg: 'bg-wh-accent' },
  { key: 'accentShadow', cssVar: '--color-wh-accent-shadow', bg: 'bg-wh-accent-shadow' },
  { key: 'onAccent', cssVar: '--color-wh-on-accent', bg: 'bg-wh-on-accent' },
  { key: 'highlight', cssVar: '--color-wh-highlight', bg: 'bg-wh-highlight' },
  { key: 'textPrimary', cssVar: '--color-wh-text-primary', bg: 'bg-wh-text-primary' },
  { key: 'textSecondary', cssVar: '--color-wh-text-secondary', bg: 'bg-wh-text-secondary' },
  { key: 'textMuted', cssVar: '--color-wh-text-muted', bg: 'bg-wh-text-muted' },
  { key: 'textFaint', cssVar: '--color-wh-text-faint', bg: 'bg-wh-text-faint' },
  { key: 'clueCard', cssVar: '--color-wh-clue-card', bg: 'bg-wh-clue-card' },
  { key: 'clueCardShadow', cssVar: '--color-wh-clue-card-shadow', bg: 'bg-wh-clue-card-shadow' },
  { key: 'clueText', cssVar: '--color-wh-clue-text', bg: 'bg-wh-clue-text' },
  { key: 'clueSlot', cssVar: '--color-wh-clue-slot', bg: 'bg-wh-clue-slot' },
  { key: 'clueSlotBorder', cssVar: '--color-wh-clue-slot-border', bg: 'bg-wh-clue-slot-border' },
  { key: 'clueSlotText', cssVar: '--color-wh-clue-slot-text', bg: 'bg-wh-clue-slot-text' },
  { key: 'answerTile', cssVar: '--color-wh-answer-tile', bg: 'bg-wh-answer-tile' },
  { key: 'answerTileShadow', cssVar: '--color-wh-answer-tile-shadow', bg: 'bg-wh-answer-tile-shadow' },
  { key: 'answerTileText', cssVar: '--color-wh-answer-tile-text', bg: 'bg-wh-answer-tile-text' },
  { key: 'answerTileActive', cssVar: '--color-wh-answer-tile-active', bg: 'bg-wh-answer-tile-active' },
  { key: 'answerTileActiveShadow', cssVar: '--color-wh-answer-tile-active-shadow', bg: 'bg-wh-answer-tile-active-shadow' },
  { key: 'answerTileEmpty', cssVar: '--color-wh-answer-tile-empty', bg: 'bg-wh-answer-tile-empty' },
  { key: 'answerTileEmptyShadow', cssVar: '--color-wh-answer-tile-empty-shadow', bg: 'bg-wh-answer-tile-empty-shadow' },
  { key: 'keyCap', cssVar: '--color-wh-key-cap', bg: 'bg-wh-key-cap' },
  { key: 'keyCapShadow', cssVar: '--color-wh-key-cap-shadow', bg: 'bg-wh-key-cap-shadow' },
  { key: 'keyCapText', cssVar: '--color-wh-key-cap-text', bg: 'bg-wh-key-cap-text' },
  { key: 'chipSurface', cssVar: '--color-wh-chip-surface', bg: 'bg-wh-chip-surface' },
  { key: 'chipText', cssVar: '--color-wh-chip-text', bg: 'bg-wh-chip-text' },
  { key: 'coinGlyph', cssVar: '--color-wh-coin-glyph', bg: 'bg-wh-coin-glyph' },
  { key: 'coinDotShadow', cssVar: '--color-wh-coin-dot-shadow', bg: 'bg-wh-coin-dot-shadow' },
  { key: 'streakDotShadow', cssVar: '--color-wh-streak-dot-shadow', bg: 'bg-wh-streak-dot-shadow' },
  { key: 'hintGlyphShadow', cssVar: '--color-wh-hint-glyph-shadow', bg: 'bg-wh-hint-glyph-shadow' },
  { key: 'badgeShadow', cssVar: '--color-wh-badge-shadow', bg: 'bg-wh-badge-shadow' },
  { key: 'backdrop', cssVar: '--color-wh-backdrop', bg: 'bg-wh-backdrop' },
  { key: 'stepDotInactive', cssVar: '--color-wh-step-dot-inactive', bg: 'bg-wh-step-dot-inactive' },
  { key: 'pillText', cssVar: '--color-wh-pill-text', bg: 'bg-wh-pill-text' },
  { key: 'textQuiet', cssVar: '--color-wh-text-quiet', bg: 'bg-wh-text-quiet' },
  { key: 'linkRule', cssVar: '--color-wh-link-rule', bg: 'bg-wh-link-rule' },
  { key: 'textWhisper', cssVar: '--color-wh-text-whisper', bg: 'bg-wh-text-whisper' },
  { key: 'keyCapDim', cssVar: '--color-wh-key-cap-dim', bg: 'bg-wh-key-cap-dim' },
  { key: 'keyCapDimShadow', cssVar: '--color-wh-key-cap-dim-shadow', bg: 'bg-wh-key-cap-dim-shadow' },
  { key: 'keyCapDimText', cssVar: '--color-wh-key-cap-dim-text', bg: 'bg-wh-key-cap-dim-text' },
  { key: 'surfaceQuiet', cssVar: '--color-wh-surface-quiet', bg: 'bg-wh-surface-quiet' },
  { key: 'surfaceQuietShadow', cssVar: '--color-wh-surface-quiet-shadow', bg: 'bg-wh-surface-quiet-shadow' },
  { key: 'highlightWash', cssVar: '--color-wh-highlight-wash', bg: 'bg-wh-highlight-wash' },
  { key: 'overlayWash', cssVar: '--color-wh-overlay-wash', bg: 'bg-wh-overlay-wash' },
  { key: 'solvePanel', cssVar: '--color-wh-solve-panel', bg: 'bg-wh-solve-panel' },
  { key: 'solvePanelShadow', cssVar: '--color-wh-solve-panel-shadow', bg: 'bg-wh-solve-panel-shadow' },
  { key: 'accentText', cssVar: '--color-wh-accent-text', bg: 'bg-wh-accent-text' },
  { key: 'submitIdle', cssVar: '--color-wh-submit-idle', bg: 'bg-wh-submit-idle' },
  { key: 'submitIdleText', cssVar: '--color-wh-submit-idle-text', bg: 'bg-wh-submit-idle-text' },
  { key: 'rowDivider', cssVar: '--color-wh-row-divider', bg: 'bg-wh-row-divider' },
  { key: 'toggleKnob', cssVar: '--color-wh-toggle-knob', bg: 'bg-wh-toggle-knob' },
  { key: 'toggleTrackShadow', cssVar: '--color-wh-toggle-track-shadow', bg: 'bg-wh-toggle-track-shadow' },
  { key: 'disclosure', cssVar: '--color-wh-disclosure', bg: 'bg-wh-disclosure' },
  { key: 'cardLabel', cssVar: '--color-wh-card-label', bg: 'bg-wh-card-label' },
  { key: 'statLabel', cssVar: '--color-wh-stat-label', bg: 'bg-wh-stat-label' },
  { key: 'accentMid', cssVar: '--color-wh-accent-mid', bg: 'bg-wh-accent-mid' },
  { key: 'highlightText', cssVar: '--color-wh-highlight-text', bg: 'bg-wh-highlight-text' },
];

/** The gradient the Daily screen is built on, expanded for react-native-svg. */
export const GRADIENT_VARS = {
  groundPuzzle: {
    colors: ['--color-wh-ground-puzzle-0', '--color-wh-ground-puzzle-1', '--color-wh-ground-puzzle-2'],
    stops: ['--wh-ground-puzzle-stop-0', '--wh-ground-puzzle-stop-1', '--wh-ground-puzzle-stop-2'],
    geometry: ['--wh-ground-puzzle-cx', '--wh-ground-puzzle-cy', '--wh-ground-puzzle-rx', '--wh-ground-puzzle-ry'],
  },
  groundPuzzleOffset: {
    colors: ['--color-wh-ground-puzzle-offset-0', '--color-wh-ground-puzzle-offset-1', '--color-wh-ground-puzzle-offset-2'],
    stops: ['--wh-ground-puzzle-offset-stop-0', '--wh-ground-puzzle-offset-stop-1', '--wh-ground-puzzle-offset-stop-2'],
    geometry: ['--wh-ground-puzzle-offset-cx', '--wh-ground-puzzle-offset-cy', '--wh-ground-puzzle-offset-rx', '--wh-ground-puzzle-offset-ry'],
  },
} as const;
