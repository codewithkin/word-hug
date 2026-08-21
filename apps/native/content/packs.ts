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
  /**
   * **Fallback only.** The real price comes from RevenueCat's `priceString`,
   * which is already localised and in the customer's own currency — see
   * `lib/purchases.ts`. This value is shown when offerings have not loaded
   * yet, so the shop can render offline instead of showing blank cards.
   */
  price: string;
  /** Store product identifier. Must match the RevenueCat dashboard exactly. */
  productId: string;
  /**
   * RevenueCat **entitlement** identifier — the thing that actually decides
   * whether this pack is unlocked.
   *
   * Products are what you buy; entitlements are what you then have. Ownership
   * is always read from `customerInfo.entitlements.active`, never from the
   * product, because the bundle grants five packs through one purchase and a
   * product-based check would miss four of them.
   *
   * ⚠️ These strings are the identifiers as they exist in the dashboard today,
   * **including the spaces and the inconsistent capitalisation**. They are
   * matched literally by the SDK. If they are ever tidied up to
   * `pack_kitchen`-style slugs — which they should be, before launch — this
   * map is the only place in the app that has to change, but it MUST change at
   * the same moment or every pack silently locks itself.
   */
  entitlementId: string;
  /** 960×540 promo art. Name and price are drawn over it, never baked in. */
  art: number;
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

/**
 * The five accents, taken from the delivered pack art.
 *
 * ── Why these changed in session 8 ────────────────────────────────────────
 * They were originally borrowed from existing UI tokens — coral for Kitchen,
 * teal for Outdoors, amber for Creatures — because there was no art and
 * recolouring from the palette was the honest way to fake a set.
 *
 * The art now exists (`assets/images/packs/`), and its README is explicit:
 * "Each pack's tint pair doubles as its card and detail-header colour in the
 * app." So the tints are the art's colours, not the token palette's. A card
 * whose header is teal sitting above a moss-green illustration is the kind of
 * mismatch that reads as a bug even when nobody can name it.
 *
 * Written as literals rather than promoted to tokens because they are pack
 * identity, not interface colour — nothing outside a pack may use them, and
 * putting them in the token file would invite exactly that.
 */
const TINTS = {
  /** paprika — pack-kitchen.png */
  kitchen: { fill: 'bg-[#C4432A]', on: 'text-white', shadowVar: '--color-wh-streak-dot-shadow' },
  /** moss — pack-outdoors.png */
  outdoors: { fill: 'bg-[#3F7D4E]', on: 'text-white', shadowVar: '--color-wh-accent-shadow' },
  /** plum — pack-creatures.png */
  creatures: { fill: 'bg-[#9B4A7E]', on: 'text-white', shadowVar: '--color-wh-badge-shadow' },
  /** slate — pack-workshop.png */
  workshop: { fill: 'bg-[#5E7288]', on: 'text-white', shadowVar: '--color-wh-surface-shadow' },
  /** indigo — pack-nightfall.png */
  nightfall: { fill: 'bg-[#4A3193]', on: 'text-white', shadowVar: '--color-wh-surface-shadow' },
} as const;

/**
 * The promo art, 960×540.
 *
 * `require` rather than a URI: these are bundled, and a static require is what
 * lets Metro fingerprint them into the binary. A dynamic path would resolve to
 * undefined at runtime with no build error.
 */
const ART = {
  kitchen: require('@/assets/images/packs/pack-kitchen.png'),
  outdoors: require('@/assets/images/packs/pack-outdoors.png'),
  creatures: require('@/assets/images/packs/pack-creatures.png'),
  workshop: require('@/assets/images/packs/pack-workshop.png'),
  nightfall: require('@/assets/images/packs/pack-nightfall.png'),
} as const;

/** The bundle's own art: all five fanned, on cream. */
export const BUNDLE_ART = require('@/assets/images/packs/pack-bundle.png');

export const PACKS: Pack[] = [
  {
    id: 'kitchen',
    name: 'Kitchen Table',
    blurb: 'Fifty about food, the kettle and the washing up.',
    price: '£1.99',
    productId: 'wordhug_pack_kitchen',
    entitlementId: 'Kitchen',
    tint: TINTS.kitchen,
    art: ART.kitchen,
  },
  {
    id: 'outdoors',
    name: 'Out of Doors',
    blurb: 'Weather, water and things that grow. Fifty to take outside.',
    price: '£1.99',
    productId: 'wordhug_pack_outdoors',
    entitlementId: 'Outdoor pack',
    tint: TINTS.outdoors,
    art: ART.outdoors,
  },
  {
    id: 'creatures',
    name: 'Creatures',
    blurb: 'Fifty with something living in them — animals, and the bodies they come in.',
    price: '£1.99',
    productId: 'wordhug_pack_creatures',
    entitlementId: 'Creatures pack',
    tint: TINTS.creatures,
    art: ART.creatures,
  },
  {
    id: 'workshop',
    name: 'The Workshop',
    blurb: 'Tools, materials and the shed. Fifty with their sleeves rolled up.',
    price: '£1.99',
    productId: 'wordhug_pack_workshop',
    entitlementId: 'Workshop pack',
    tint: TINTS.workshop,
    art: ART.workshop,
  },
  {
    id: 'nightfall',
    name: 'Nightfall',
    blurb: 'The indoor evening. Fifty quieter ones, and a little harder.',
    price: '£2.49',
    productId: 'wordhug_pack_nightfall',
    entitlementId: 'Nightfall pack',
    tint: TINTS.nightfall,
    art: ART.nightfall,
  },
];

/** All five, at a discount. The only bundle. */
export const BUNDLE = {
  id: 'pack-bundle',
  name: 'All five packs',
  price: '£7.99',
  productId: 'wordhug_pack_bundle',
  /**
   * The bundle has **no entitlement of its own**, deliberately.
   *
   * Buying it must grant the same five entitlements the individual packs
   * grant, which is done in the dashboard by attaching the bundle product to
   * each of the five pack entitlements. A separate "bundle" entitlement would
   * mean the app had two different ways to be told it owns Kitchen, and the
   * two would eventually disagree.
   */
  packageId: 'wordhug_packs_all',
};

export function packById(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id);
}
