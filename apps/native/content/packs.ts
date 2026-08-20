/**
 * ── Packs ─────────────────────────────────────────────────────────────────
 * Session 7. Five themed packs of ten levels each, drawn from the tail of the
 * level bank so nothing has to be authored twice.
 *
 * ── Why packs point at levels rather than owning puzzles ──────────────────
 * A pack that carried its own puzzles would be a second content pipeline, a
 * second validator, and a second place for a duplicate answer to hide. These
 * are curated *views* over `content/levels.ts` — every puzzle in a pack has
 * already been through `scripts/level-check.mjs`, and a pack cannot contain a
 * level that does not exist because the build would not typecheck.
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
  /** Level numbers, in play order. All must exist in `content/levels.ts`. */
  levels: number[];
  /** Placeholder. RevenueCat owns this before release. */
  price: string;
  /** RevenueCat product identifier, for when it is wired. */
  productId: string;
}

export const PACKS: Pack[] = [
  {
    id: 'pack-kitchen',
    name: 'Kitchen Table',
    blurb: 'Ten warm ones about food, the kettle and the washing up.',
    levels: [21, 24, 28, 33, 37, 42, 46, 51, 58, 63],
    price: '£1.99',
    productId: 'wh_pack_kitchen',
  },
  {
    id: 'pack-outdoors',
    name: 'Out of Doors',
    blurb: 'Weather, water and things that grow. Ten to take outside.',
    levels: [22, 26, 31, 35, 39, 44, 48, 54, 60, 66],
    price: '£1.99',
    productId: 'wh_pack_outdoors',
  },
  {
    id: 'pack-creatures',
    name: 'Creatures',
    blurb: 'Ten with something living in them, mostly small.',
    levels: [23, 27, 32, 36, 41, 47, 52, 57, 62, 68],
    price: '£1.99',
    productId: 'wh_pack_creatures',
  },
  {
    id: 'pack-workshop',
    name: 'The Workshop',
    blurb: 'Tools, materials and the shed. Ten with their sleeves rolled up.',
    levels: [25, 29, 34, 38, 43, 49, 55, 61, 67, 72],
    price: '£1.99',
    productId: 'wh_pack_workshop',
  },
  {
    id: 'pack-nightfall',
    name: 'Nightfall',
    blurb: 'The last ten of the evening. Quieter, and a little harder.',
    levels: [76, 79, 82, 85, 88, 91, 94, 96, 98, 100],
    price: '£2.49',
    productId: 'wh_pack_nightfall',
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
