import {
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';

/**
 * The faces Word Hug loads at startup.
 *
 * TWO faces, not three. The designs use `font-weight:900` on eyebrow labels,
 * the puzzle-number chip and the coin/streak counts, but Baloo 2 has no 900
 * face — its weight axis stops at 800 and the package ships 400–800. The
 * browser that produced the design export synthesised the extra weight; a
 * phone will not. `tokens.face.heavy` therefore points at the 800 face, and
 * those labels will read very slightly lighter than the export (D-003).
 *
 * The key of each entry IS the family name passed to `fontFamily`. It must
 * match `face` in @word-hug/tokens exactly, or text silently renders in the
 * system font — which looks like a design mistake, not a missing font.
 */
export const FONT_MAP = {
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
};
