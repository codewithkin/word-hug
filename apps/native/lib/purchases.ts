import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { BUNDLE, PACKS } from '@/content/packs';
import { getOwnedPacks, grantCoins, grantPack } from '@/lib/storage';

/**
 * ── RevenueCat ────────────────────────────────────────────────────────────
 * The only file that talks to `react-native-purchases`. Everything else in the
 * app asks storage what is owned and never asks the network.
 *
 * ── The one rule ──────────────────────────────────────────────────────────
 * **Entitlements write `packs.owned`. Nothing ever reads ownership from the
 * network at the point of use.**
 *
 * `systems/storage-persistence.md` §7. A pack screen that awaited
 * `getCustomerInfo()` before deciding whether to show a board would be blank
 * on a train, and a player who paid would be told they had not. So the network
 * result is folded into MMKV whenever it arrives, and the game reads MMKV
 * synchronously during render, exactly like every other piece of state.
 *
 * The direction matters: entitlements are allowed to *grant*, never to
 * *revoke*. RevenueCat returning an empty entitlement set because the device
 * is offline, or because an anonymous id was rotated, must not delete
 * somebody's packs. Revocation is a refund problem, and a refund is rare
 * enough to handle by hand.
 *
 * ── Why every call is behind a lazy import ────────────────────────────────
 * Same reason as `lib/notifications.ts`: this is a native module, it does not
 * exist on web or in a JS-only environment, and a store being unreachable must
 * never be why someone cannot play a free daily puzzle. Every function here
 * resolves to a benign value instead of throwing.
 */

type PurchasesModule = typeof import('react-native-purchases').default;

/**
 * How many coins each consumable grants.
 *
 * ── Why this is a local table and not RevenueCat's virtual currency ───────
 * A "WHCOINS" virtual currency existed here briefly. It was removed at the
 * owner's decision, and the reasoning is worth keeping because it is easy to
 * re-litigate.
 *
 * RevenueCat can hold a coin balance server-side, but it **cannot spend one
 * from the app** — deducting currency needs a secret key and a backend, and
 * this app has neither by design. So the balance would have been a grant
 * ledger only, mirrored into MMKV, with MMKV still authoritative for spending.
 * Two sources of truth for one number, where the second one could not do the
 * thing the number is for.
 *
 * It bought a server-side audit trail and a route to rewarded-ad grants, and
 * cost a network round trip and a high-water-mark reconciliation. Neither is
 * needed today.
 *
 * ── The accepted risk ─────────────────────────────────────────────────────
 * Coins are credited by the app after the store confirms the purchase. If the
 * process is killed in the gap between those two moments — a crash, a force
 * quit, a battery death — **the money is taken and the coins are not
 * granted**, and there is no server record to repair it from.
 *
 * That window is milliseconds and the failure is rare, but it is real, and it
 * is the specific thing the virtual currency was protecting against. If a
 * player ever reports it, the fix is to put the virtual currency back, not to
 * add a retry here.
 */
const COIN_GRANTS: Record<string, number> = {
  wordhug_coins_5: 5,
  wordhug_coins_15: 15,
  wordhug_coins_50: 50,
};

/**
 * The offering that holds everything for sale.
 *
 * One offering with nine packages rather than several, because Word Hug never
 * shows a chooser — the shop lists what exists and the pack pages each link to
 * one thing. Offerings are for A/B-testing which set of products a cohort
 * sees, and there is nothing to test yet.
 */
const OFFERING_ID = 'default';

let configured = false;

/**
 * The public SDK key, from `app.json` → `expo.extra.revenueCatKey`.
 *
 * Public keys are designed to ship inside the binary — they can start a
 * purchase and read a customer, and nothing else. The **secret** `sk_` key is
 * the dangerous one and appears nowhere in this repo. It is in `extra` rather
 * than hard-coded here so the test key can be swapped for the live one without
 * touching code.
 */
function apiKey(): string | null {
  const extra = Constants.expoConfig?.extra as { revenueCatKey?: string } | undefined;
  const key = extra?.revenueCatKey;
  return typeof key === 'string' && key.length > 0 ? key : null;
}

async function load(): Promise<PurchasesModule | null> {
  try {
    const mod = await import('react-native-purchases');
    return mod.default;
  } catch {
    return null;
  }
}

/**
 * Called once at startup, before anything asks about ownership.
 *
 * Idempotent — a fast refresh will call it twice, and configuring the SDK
 * twice logs a warning and rotates the anonymous id.
 */
export async function configurePurchases(): Promise<boolean> {
  if (configured) return true;

  const key = apiKey();
  if (!key) return false;

  const Purchases = await load();
  if (!Purchases) return false;

  try {
    const { LOG_LEVEL } = await import('react-native-purchases');
    // Verbose only in development. In a store build this is noise in the
    // device log and a small privacy leak.
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);

    // The same key for both platforms today because the project is on the Test
    // Store. When real App Store and Play apps are added, RevenueCat issues a
    // key per app and this becomes a Platform.select.
    Purchases.configure({ apiKey: key });
    configured = true;

    // Fold whatever the SDK already knows into storage immediately, so the
    // first render of the shop is correct rather than correct-after-a-tick.
    await refreshEntitlements();

    return true;
  } catch {
    return false;
  }
}

// ── Entitlements → owned packs ─────────────────────────────────────────────

/**
 * Maps RevenueCat entitlement identifiers onto our pack ids.
 *
 * Built from `content/packs.ts` rather than written out again, so adding a
 * pack cannot leave a half-wired entitlement behind.
 */
const PACK_BY_ENTITLEMENT: Record<string, string> = Object.fromEntries(
  PACKS.map((p) => [p.entitlementId, p.id])
);

/**
 * Writes every active entitlement into `packs.owned`.
 *
 * Grants only. See the header: an empty response is far more likely to mean
 * "offline" than "refunded".
 *
 * Returns the pack ids that were newly granted, so a caller can say
 * "Kitchen Table unlocked" rather than just refreshing silently.
 */
export function syncEntitlements(active: readonly string[]): string[] {
  const owned = new Set(getOwnedPacks());
  const added: string[] = [];

  for (const entitlement of active) {
    const packId = PACK_BY_ENTITLEMENT[entitlement];
    if (!packId || owned.has(packId)) continue;
    grantPack(packId);
    added.push(packId);
  }

  return added;
}

/** Asks RevenueCat what is owned and folds the answer into storage. */
export async function refreshEntitlements(): Promise<string[]> {
  const Purchases = await load();
  if (!Purchases || !configured) return [];

  try {
    const info = await Purchases.getCustomerInfo();
    return syncEntitlements(Object.keys(info.entitlements.active));
  } catch {
    // Offline, or the store is down. Storage already holds the last known
    // truth and the player keeps playing.
    return [];
  }
}

/**
 * Keeps storage in step for the whole session.
 *
 * A purchase, a restore, a subscription change or a refund all arrive here.
 * Returns an unsubscribe, or null when the module is unavailable.
 */
export async function watchEntitlements(
  onGranted: (packIds: string[]) => void
): Promise<(() => void) | null> {
  const Purchases = await load();
  if (!Purchases || !configured) return null;

  try {
    const listener = (info: { entitlements: { active: Record<string, unknown> } }) => {
      const added = syncEntitlements(Object.keys(info.entitlements.active));
      if (added.length > 0) onGranted(added);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => Purchases.removeCustomerInfoUpdateListener(listener);
  } catch {
    return null;
  }
}

// ── What is for sale ───────────────────────────────────────────────────────

export interface ShopItem {
  /** RevenueCat package identifier, which is what `buy()` takes. */
  packageId: string;
  productId: string;
  /** Localised and currency-correct, straight from the store. */
  price: string;
}

export interface Shop {
  /** Keyed by our pack id. */
  packs: Record<string, ShopItem>;
  bundle: ShopItem | null;
  /** Keyed by coin count as a string: '5', '15', '50'. */
  coins: Record<string, ShopItem>;
}

const EMPTY_SHOP: Shop = { packs: {}, bundle: null, coins: {} };

/**
 * Everything purchasable, with real prices.
 *
 * ── Why prices come from here and not from `content/packs.ts` ─────────────
 * The strings in that file say "£1.99" to every person on earth. RevenueCat's
 * `priceString` is already converted, already localised, and already formatted
 * the way the customer's own store formats money. Showing a hard-coded pound
 * price to someone in Nairobi is both wrong and, on iOS, a review rejection.
 *
 * The hard-coded values survive as the offline fallback, which is why this
 * returns an empty shop rather than throwing: the screens fall back to the
 * static strings and still render.
 */
export async function loadShop(): Promise<Shop> {
  const Purchases = await load();
  if (!Purchases || !configured) return EMPTY_SHOP;

  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all[OFFERING_ID] ?? offerings.current;
    if (!offering) return EMPTY_SHOP;

    const shop: Shop = { packs: {}, bundle: null, coins: {} };

    for (const pkg of offering.availablePackages) {
      const item: ShopItem = {
        packageId: pkg.identifier,
        productId: pkg.product.identifier,
        price: pkg.product.priceString,
      };

      const pack = PACKS.find((p) => p.productId === pkg.product.identifier);
      if (pack) {
        shop.packs[pack.id] = item;
        continue;
      }

      if (pkg.product.identifier === BUNDLE.productId) {
        shop.bundle = item;
        continue;
      }

      // wordhug_coins_15 → '15'
      const coins = /^wordhug_coins_(\d+)$/.exec(pkg.product.identifier)?.[1];
      if (coins) shop.coins[coins] = item;
    }

    return shop;
  } catch {
    return EMPTY_SHOP;
  }
}

// ── Buying ─────────────────────────────────────────────────────────────────

export type PurchaseOutcome =
  | { status: 'purchased'; granted: string[]; coins: number }
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

/**
 * Buys one package by its identifier.
 *
 * A cancellation is **not** an error and must never be presented as one — a
 * person who changed their mind at the store sheet has done a normal thing,
 * and rule 1 covers the shop too. The SDK signals it with `userCancelled` on
 * the thrown error rather than with a return value, which is easy to miss and
 * is the reason this wrapper exists at all.
 */
export async function buy(packageId: string): Promise<PurchaseOutcome> {
  const Purchases = await load();
  if (!Purchases || !configured) return { status: 'unavailable' };

  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all[OFFERING_ID] ?? offerings.current;
    const pkg = offering?.availablePackages.find((p) => p.identifier === packageId);
    if (!pkg) return { status: 'unavailable' };

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const granted = syncEntitlements(Object.keys(customerInfo.entitlements.active));

    // Consumables carry no entitlement, so the coin credit happens here and
    // only here. Keyed on the product actually purchased rather than on what
    // the caller asked for, so a mismatched package cannot mint coins.
    const coins = COIN_GRANTS[pkg.product.identifier];
    if (coins) grantCoins(coins);

    return { status: 'purchased', granted, coins: coins ?? 0 };
  } catch (err) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e.userCancelled) return { status: 'cancelled' };
    return { status: 'error', message: e.message ?? 'That did not go through.' };
  }
}

/**
 * Restores previous purchases.
 *
 * **Packs come back. Coins do not.** Coins are consumables — the stores do not
 * return them in a restore, by design, because they are meant to be used up.
 * The restore screen says so rather than implying a full recovery.
 */
export async function restore(): Promise<PurchaseOutcome> {
  const Purchases = await load();
  if (!Purchases || !configured) return { status: 'unavailable' };

  try {
    const info = await Purchases.restorePurchases();
    const granted = syncEntitlements(Object.keys(info.entitlements.active));
    // No coins here, deliberately. Consumables are not restorable purchases —
    // `/restore-result` says so in as many words.
    return { status: 'purchased', granted, coins: 0 };
  } catch (err) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e.userCancelled) return { status: 'cancelled' };
    return { status: 'error', message: e.message ?? 'Could not reach the store.' };
  }
}

/**
 * RevenueCat's own remotely-configured paywall.
 *
 * Offered alongside the hand-built shop rather than instead of it. The shop
 * screen is designed — it says "There's nothing to buy today. The daily puzzle
 * is free, always", which is the product's whole posture and not something a
 * dashboard template will reproduce. This exists so a paywall can be
 * configured, A/B tested and changed without a release when that is worth
 * doing.
 *
 * Returns true when something was bought or restored.
 */
export async function presentPaywall(): Promise<boolean> {
  if (!configured) return false;

  try {
    // `PAYWALL_RESULT` is re-exported by the **UI** package, not by
    // `react-native-purchases`. Importing it from the core package compiles in
    // a lot of editors and resolves to undefined at runtime, which would make
    // every comparison below false and every successful purchase look like a
    // dismissal.
    const ui = await import('react-native-purchases-ui');
    const { PAYWALL_RESULT } = ui;

    const result = await ui.default.presentPaywall();
    const bought =
      result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;

    if (bought) await refreshEntitlements();
    return bought;
  } catch {
    return false;
  }
}

/** True when the store is wired up. Screens use it to hide dead affordances. */
export function purchasesAvailable(): boolean {
  return configured && Platform.OS !== 'web';
}
