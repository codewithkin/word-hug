import { Image, useColorScheme } from 'react-native';

/**
 * The delivered empty-state illustrations.
 *
 * Seven subjects, each with a light and a dark file, 480×480 with alpha —
 * `assets/images/illustrations/` and its README.
 *
 * ── Why this picks the file rather than tinting one ───────────────────────
 * The pair is drawn, not generated: light files use white tiles on the cream
 * shadow, dark files use grape tiles on the deep-grape shadow. Geometry is
 * identical between them, which is the point — a theme switch changes the
 * colours and moves nothing. Trying to recolour a single asset at runtime
 * would flatten exactly the shadow pairing that makes them look like the rest
 * of the app.
 *
 * ── Why `useColorScheme` and not a uniwind class ──────────────────────────
 * `dark:` variants can swap a style, not a `source`. This is the one place in
 * the app that has to branch on the theme in JavaScript, and it is contained
 * here so nothing else has to.
 *
 * The ghost components these replace (`HeatmapGhost`, `ShelfGhost`) drew the
 * screen's own content in muted tokens — a good instinct with no art
 * available, and no longer the best available option.
 */

const ART = {
  'caught-up': {
    light: require('@/assets/images/illustrations/empty-caught-up.png'),
    dark: require('@/assets/images/illustrations/empty-caught-up-dark.png'),
  },
  'no-packs': {
    light: require('@/assets/images/illustrations/empty-no-packs.png'),
    dark: require('@/assets/images/illustrations/empty-no-packs-dark.png'),
  },
  offline: {
    light: require('@/assets/images/illustrations/empty-offline.png'),
    dark: require('@/assets/images/illustrations/empty-offline-dark.png'),
  },
  error: {
    light: require('@/assets/images/illustrations/empty-error.png'),
    dark: require('@/assets/images/illustrations/empty-error-dark.png'),
  },
  'not-found': {
    light: require('@/assets/images/illustrations/empty-not-found.png'),
    dark: require('@/assets/images/illustrations/empty-not-found-dark.png'),
  },
  update: {
    light: require('@/assets/images/illustrations/empty-update.png'),
    dark: require('@/assets/images/illustrations/empty-update-dark.png'),
  },
  solved: {
    light: require('@/assets/images/illustrations/empty-solved.png'),
    dark: require('@/assets/images/illustrations/empty-solved-dark.png'),
  },
} as const;

export type IllustrationName = keyof typeof ART;

export interface IllustrationProps {
  name: IllustrationName;
  /** Rendered square. 240 is the design size; the files are 2× that. */
  size?: number;
}

export function Illustration({ name, size = 240 }: IllustrationProps) {
  const scheme = useColorScheme();
  const source = ART[name][scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{ width: size, height: size }}
      // Decorative. Every screen that uses one already states its message in
      // a heading and a body directly underneath, so announcing the picture
      // would make a screen reader say the same thing twice.
      accessible={false}
    />
  );
}
