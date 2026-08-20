/**
 * ── Packs ─────────────────────────────────────────────────────────────────
 * Session 7. Five themed packs of ten levels each, drawn from the tail of the
 * level bank so nothing has to be authored twice.
 *
 * ── Each pack owns its levels (session 7c) ────────────────────────────────
 * Fifty each, in `content/pack-levels.ts`, sharing nothing with the free run.
 *
 * Session 7 had packs as curated *views* over the free bank — same pipeline,
 * same validator, and completely wrong as a product: every pack level was also
 * a free level, so buying a pack bought fifty puzzles the player had already
 * solved or soon would. The build now throws if an answer appears in two banks.
 *
 * They still go through one pipeline. `scripts/levels.source.mjs` holds all
 * 300 with a `set` column, and the builder emits two files.
 *
 * ── The themes are broad, and that was a decision ─────────────────────────
 * A Missing Link answer needs three real compounds, and tight themes run dry:
 * a probe found 26 strictly-food words, 19 creatures, 20 weather — against 50
 * each. So "Creatures" takes in bodies and people, "Nightfall" takes in the
 * indoor evening. Levels whose theme link is a stretch are marked in the
 * source and counted by `pnpm levels:build`.
 *
 * ── Every price here is a placeholder ─────────────────────────────────────
 * **They must come from RevenueCat before release.** A store price is
 * localised, tax-inclusive and region-specific; a hard-coded one is wrong for
 * most of the world and a review rejection in several countries.
 * `react-native-purchases` is installed and unconfigured. See
 * `progress/04-changelog.md` §7.
 */

export interface Pack {
  id: string;
  name: string;
  blurb: string;
  /** Placeholder. RevenueCat owns this before release. */
  price: string;
  /** RevenueCat product identifier, for when it is wired. */
  productId: string;
  /**
   * The pack's accent, drawn from tokens that already exist.
   *
   * Recolour, not redesign: the chunky shadows, the type scale, the shapes and
   * the ground are identical to the rest of the app. Only the node fill and
   * the header pill change, so a pack reads as the same game in a different
   * mood rather than as a different game. Written as whole class strings —
   * Tailwind only emits a class it can see as a literal.
   */
  tint: {
    /** Solved node and header pill fill. */
    fill: string;
    /** Text on that fill. */
    on: string;
    /** The CSS variable holding its offset shadow. */
    shadowVar: string;
  };
}

/** The five accents. Four are existing tokens; `nightfall` is the one new pair. */
const TINTS = {
  amber: { fill: 'bg-wh-primary', on: 'text-wh-on-primary', shadowVar: '--color-wh-primary-shadow' },
  teal: { fill: 'bg-wh-accent', on: 'text-wh-on-accent', shadowVar: '--color-wh-accent-shadow' },
  coral: { fill: 'bg-wh-highlight', on: 'text-white', shadowVar: '--color-wh-streak-dot-shadow' },
  // #6E5AB8 / #4A3193 — a purple that exists in dark as `answerTileActive` and
  // has no light counterpart, so the light value is written here. One pack,
  // one pairing; promote it to a token if a second use turns up.
  violet: { fill: 'bg-[#6E5AB8]', on: 'text-white', shadowVar: '--color-wh-surface-shadow' },
  slate: { fill: 'bg-[#3E5266]', on: 'text-white', shadowVar: '--color-wh-surface-shadow' },
} as const;

export const PACKS: Pack[] = [
  {
    id: 'kitchen',
    name: 'Kitchen Table',
    blurb: 'Fifty about food, the kettle and the washing up.',
    price: '£1.99',
    productId: 'wh_pack_kitchen',
    tint: TINTS.coral,
  },
  {
    id: 'outdoors',
    name: 'Out of Doors',
    blurb: 'Weather, water and things that grow. Fifty to take outside.',
    price: '£1.99',
    productId: 'wh_pack_outdoors',
    tint: TINTS.teal,
  },
  {
    id: 'creatures',
    name: 'Creatures',
    blurb: 'Fifty with something living in them — animals, and the bodies they come in.',
    price: '£1.99',
    productId: 'wh_pack_creatures',
    tint: TINTS.amber,
  },
  {
    id: 'workshop',
    name: 'The Workshop',
    blurb: 'Tools, materials and the shed. Fifty with their sleeves rolled up.',
    price: '£1.99',
    productId: 'wh_pack_workshop',
    tint: TINTS.violet,
  },
  {
    id: 'nightfall',
    name: 'Nightfall',
    blurb: 'The indoor evening. Fifty quieter ones, and a little harder.',
    price: '£2.49',
    productId: 'wh_pack_nightfall',
    tint: TINTS.slate,
  },
];

/** All five, at a discount. The only bundle. */
export const BUNDLE = {
  id: 'pack-bundle',
  name: 'All five packs',
  price: '£7.99',
  productId: 'wh_pack_bundle',
};

export function packById(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id);
}
