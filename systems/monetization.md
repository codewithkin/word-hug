# System: Monetization

**Owner of:** RevenueCat configuration, product and entitlement identifiers, the Nudge Coin ledger, and restore behaviour.
**Status:** Draft

---

## 1. Principles

RevenueCat is the **sole source of truth for entitlements**. The app never grants an entitlement locally, never persists "user owns pack X" as its own boolean, and never trusts a local flag over `CustomerInfo`.

Nudge Coins are the exception and the complication: RevenueCat tracks the *purchase* of coins, but *spending* them is a local operation it knows nothing about. Coins therefore need a local ledger (§4).

---

## 2. Identifiers

Defined once, here. Any other file referencing these imports them from `apps/native/lib/purchases/ids.ts`.

### Entitlements

| Entitlement ID | Grants |
|---|---|
| `pack_cozy_kitchen` | Cozy Kitchen pack |
| `pack_garden_stroll` | Garden Stroll pack |
| `pack_fireside_read` | Fireside Read pack |
| `pack_cup_of_comfort` | Cup of Comfort pack |
| `pack_around_the_world` | Around the World pack |
| `hug_club` | Full archive, weekly exclusive, weekly coin grant, badge — **built in v1, product not sold until Club ships** |

The Hug Bundle does **not** get its own entitlement. It is a product that grants all five `pack_*` entitlements. This means pack unlock logic has one code path regardless of how the pack was bought.

### Products

| Product ID | Type | Grants |
|---|---|---|
| `wh_bundle` | Non-consumable | All 5 `pack_*` |
| `wh_pack_cozy_kitchen` … ×5 | Non-consumable | One `pack_*` |
| `wh_coins_5` / `_15` / `_50` | Consumable | Coins (see §4) |
| ~~`wh_club_monthly` / `wh_club_yearly`~~ | Auto-renewing sub | `hug_club` — **not created in v1** |

### v1 scope

**Hug Club is deferred** (PRD §5.4). The `hug_club` entitlement check, the archive lock, and all downstream logic **are built** in v1 — only the RevenueCat products and the storefront entry are withheld. Shipping the Club later is then a configuration change, not a feature build.

Practical consequence: in v1 `hasClub()` always returns `false`, and the archive lock state is an informational "coming soon" rather than a paywall. Do not delete the code path.

### Offerings

| Offering | Shown where |
|---|---|
| `default` | Shop screen |
| `welcome` | Second-visit offer — same `wh_bundle` product at a discounted price tier |

The welcome discount is configured as a **price tier / promotional offering in RevenueCat**, never a hardcoded number in the app. The app displays `package.storeProduct.priceString`, so regional pricing works for free.

### The welcome offer (relocated)

Moved out of onboarding. Trigger and rules:

| Property | Value |
|---|---|
| Trigger | First app open on a calendar day later than install day |
| Placement | One screen after a solve — **never on the solve screen itself** |
| Window | 48 hours from first display, then reverts to standard pricing |
| Frequency | Once. Dismissed means gone. |
| Dismissal | Full-size "Maybe later", equal visual weight to accept |

State lives in `wh.prefs`: `onboarding.offerShown`, `onboarding.offerExpiresAt`.

> With no analytics, the conversion rate of this offer is unmeasurable beyond aggregate store revenue. Design it right rather than planning to iterate.

---

## 3. Entitlement checks

```ts
// Single accessor. Nothing else reads CustomerInfo directly.
hasPack(packId): boolean          // entitlements.active[`pack_${packId}`] != null
hasClub(): boolean                // entitlements.active['hug_club'] != null
```

Rules:

- `Purchases.configure()` runs in `+loading`, before any screen mounts.
- `CustomerInfo` is cached by the RevenueCat SDK and readable offline. **A user who bought a pack and then goes offline must still be able to play it.** Never gate pack access on a live network check.
- Subscribe to the customer-info listener so an expiring `hug_club` downgrades archive access without an app restart.
- If `CustomerInfo` cannot be fetched on a cold, never-online install, default to **locked** for packs and **unlocked** for the free tier. A brand-new offline install has no purchases by definition.

---

## 4. Nudge Coin ledger

Coins are the only balance the app manages itself. Design it like an account, not a counter.

### Storage

`wh.progress` → `coins.balance`, `coins.ledger`, `coins.lastWeeklyGrant` (see `systems/storage-persistence.md` §3.2).

Every mutation appends a `LedgerEntry`. The balance is authoritative; the ledger is for auditing, support, and duplicate-grant detection.

### Grants

| Reason | Amount | Trigger | Idempotency key |
|---|---|---|---|
| `install_grant` | 3 | First launch | `'install'` |
| `weekly_grant` | 1 | First app open on or after Monday local | ISO week string |
| `club_grant` | 2 | Weekly, while `hug_club` is active | ISO week string + `'club'` |
| `purchase` | 5/15/50 | RevenueCat purchase completes | Store transaction id |
| `restore` | see §5 | Restore purchases | Store transaction id |

Before applying any grant, check the ledger for an entry with the same idempotency key. This is what prevents double-granting when a user opens the app twice on a Monday, or taps Restore repeatedly.

### Spending

```
spendCoin(puzzleId, tier):
  if nudges[puzzleId] >= tier: return ALREADY_OWNED    // idempotent, free
  if tier != nudges[puzzleId] + 1: return OUT_OF_ORDER // tiers unlock in sequence
  if balance < 1: return INSUFFICIENT
  balance -= 1
  nudges[puzzleId] = tier
  ledger.push({ delta: -1, reason: 'nudge', ref: puzzleId })
```

Requirements:

- The whole operation is synchronous and guarded by an in-flight flag so rapid double-taps cannot double-spend.
- Balance can never go below zero — enforced by the check, and asserted in tests.
- Re-opening a puzzle shows previously purchased nudges for free. A player never pays twice for the same hint.
- Max 3 nudges per puzzle, enforced by the tier sequence.

### Zero-balance flow

Tapping a nudge with a zero balance opens a **quiet bottom sheet**, not a full-screen paywall: the three coin packs, current price, and a plain "Not now." It must not appear during or after a solve, and it must not be the first thing a new user sees.

---

## 5. Restore purchases

`Purchases.restorePurchases()` from Settings and from a quiet link on the Shop screen.

| Item | Restored |
|---|---|
| Packs, Bundle | Yes — automatic via entitlements |
| Hug Club | Yes, if the subscription is still active (post-v1) |
| Coins | **Yes, in full** — decided |

Coin restore procedure:

1. Read non-subscription transactions from `CustomerInfo`.
2. For each coin transaction not already in the ledger (keyed by transaction id), grant the full amount with `reason: 'restore'`.
3. Prior spend is ignored — the user gets back everything they ever bought.

This is exploitable by reinstalling, but the ceiling is a few dollars per user and the alternative — telling a paying customer their coins are gone — is precisely the kind of punishment the product promises not to inflict.

Restore always produces visible feedback: what was restored, or a warm "nothing to restore on this account" — never silence.

---

## 6. Where money is allowed to appear

Binding placement rules derived from PRD §1.1 Principle 3 and 4.

| Surface | Allowed? |
|---|---|
| Puzzle screen | Only the small nudge button. No prices, no badges, no packs. |
| Solve celebration | **Never.** No offers, no "unlock more," nothing. |
| Screen after a solve | Permitted, quiet, dismissible |
| Archive, on tapping a locked date | Permitted — contextual paywall for `hug_club` |
| Pack list | Permitted — this is a store surface |
| Shop | Obviously |
| Onboarding | **Never.** No prices, no offers, no shop entry anywhere in the flow. |
| Second visit, one screen after a solve | Permitted — the welcome offer, once, dismissible with a full-size button |
| Notifications | **Never.** No notification may contain a price or an offer. |
| Streak break | **Never.** Loss is not a sales moment. |

---

## 7. Business-model risks

Recorded here because they shape build priority, not just pricing.

- **Packs are anchors, not products.** 5 × $1.99 = $9.95 against a $6.99 bundle. Essentially nobody buys a single pack. Don't invest engineering effort in merchandising individual packs.
- **v1 has no recurring revenue at all.** With Hug Club deferred, every product is a one-time purchase. LTV per paying user is capped at roughly **$7** — Bundle plus occasional coins. Model the business on that number before committing a dollar to paid acquisition.
- **Coins are the only repeatable revenue in v1**, and the product principles forbid pushing hints. Accept that ARPU will be low by design. The growth story is retention and word of mouth, not monetisation depth.
- **Revenue is essentially unmeasurable in-app.** No analytics means the only signal is App Store Connect / Play Console revenue against Expo Insights installs — a single crude conversion ratio, with no visibility into where in the funnel anything happens.
- **The deferred Club is a bet that the archive accrues value.** If retention is poor, the archive never becomes worth $1.49/mo and there is no second revenue stream to add later. Watch this.

---

## 8. Testing requirements

- Sandbox purchase of each product grants the correct entitlements
- Buying the Bundle unlocks all five packs through the same code path as buying them individually
- Offline launch after a prior purchase still unlocks owned packs
- Expiring `hug_club` re-locks the archive without an app restart
- Weekly coin grant fires exactly once per ISO week across multiple app opens
- Rapid triple-tap on a nudge spends exactly one coin
- Restore twice in a row grants coins once
- Balance never goes negative under any sequence of operations
- No price or offer renders at any point during onboarding
- The welcome offer appears on the second visit only, once, and never on a solve screen

---

## 9. Open questions

- Should the club's 2 coins/week accumulate indefinitely, or cap? (Post-v1.)
- Family Sharing on iOS for the Bundle — enable or not?
- Does the 48-hour welcome-offer window need a visible countdown? A timer would be the most on-brand-violating element in the app; recommend stating the deadline as plain text, or omitting it entirely.
