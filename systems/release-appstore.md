# Releasing to the App Store

Written session 8c, as the sibling of `release-playstore.md` — read that one
first if the Play flow is unfamiliar, because this reuses its shape. Unlike the
Play guide, **nothing here has been executed yet**: no Apple account exists,
no build has been made. Menu names drift; re-check them against App Store
Connect as you go, and correct this file in the same commit as the fix.

> **Three things catch everyone on Apple.**
>
> 1. The **Paid Applications Agreement** (plus banking and tax forms) gates
>    *everything* — until it is signed and active you cannot create in-app
>    products, cannot test them in sandbox, cannot sell anything. Do it on day
>    one; banking verification can take days.
> 2. A product without its metadata sits in **"Missing Metadata"** forever and
>    silently blocks submission. Every one of the nine needs a screenshot,
>    localised name/description, and review notes before it is even "Ready to
>    Submit".
> 3. Apple reviews the *app* with humans, not just the binary. First review is
>    commonly 24–48h; rejections cost another round trip. Everything in §6
>    exists to survive that first pass.

---

## 0. Where things stand

| | Status |
|---|---|
| App code | Complete, playing, purchases working on Android |
| RevenueCat | Play Store app live (`app05dac30f80`); **no Apple app yet** |
| `app.json` | `com.codewithkin.wordhug`, `ios.supportsTablet: true` (decision pending, §1.3) |
| Apple Developer Program | **Not joined** |
| `eas.json` | `production` profile is platform-neutral — reused as-is |
| Privacy / Terms | https://wordhug.gamesforstrangers.lol — already live, reusable |

---

## 1. Before anything else

### 1.1 Join the Apple Developer Program

$99/year, individual or organisation. Identity verification can take a day or
two. Everything else queues behind this.

### 1.2 Sign the money paperwork

App Store Connect → **Agreements, Tax, and Banking**:

- Accept the Paid Applications Agreement
- Add a bank account
- Complete the tax forms

A new account sees these marked incomplete. **Nothing in §§3–6 works until
they clear.** This is the Apple twin of Play's service-account delay (which
took up to 24 hours there); here it is agreements, and it can take longer.

### 1.3 Decide iPad before the first build

`app.json` currently says `"supportsTablet": true`. That means Apple will
require **iPad screenshots**, and someone has to actually look at the game on
an iPad — the layouts were drawn at 390×844.

- Shipping iPhone-only first: set `"supportsTablet": false` **before** the
  first build. One line, reversible later (a later flip ships in the next
  binary).
- Shipping iPad too: leave it true, budget an evening for layout QA, and add
  the iPad screenshot size in §6.2.

No pressure either way; the recommendation is iPhone-only first, because
unverified-on-device screens shipping "code-complete" should not multiply by
another form factor on their first outing.

---

## 2. Credentials — mostly automatic

EAS manages certificates, provisioning profiles and device registration during
`eas build`; the first iOS build walks you through signing in to Apple. Inspect
later with `npx eas credentials`.

`expo-notifications` is configured in `app.json`, so the first build also
registers an **APNs auth key** with Apple — accept the prompt and let EAS store
it. RevenueCat does **not** need this key; its push campaigns are unrelated to
our notification scheduling.

What you *do* need to mint by hand, for RevenueCat in §4:

- An **App Store Connect API key** — Users and Access → Integrations →
  App Store Connect API. Generate with access sufficient to manage the app;
  download the `.p8` once (Apple lets you download it exactly once).
- An **In-App Purchase key** — same Integrations page, "In-App Purchase".
  One such key serves every app in the account; download once.

Both go into RevenueCat's dashboard, never into this repo.

---

## 3. Create the nine products in App Store Connect

The Play lesson applied unchanged: **create products in the store console
first, import into RevenueCat second.** Typing ids twice is where drift came
from on other projects; importing eliminated it on Play, so repeat the order.

App Store Connect → your app → **Monetisation → In-App Purchases → Create**.
Identifiers must match `apps/native/content/packs.ts` and the existing
RevenueCat catalog **exactly**:

| Product ID | Apple type | Fallback price |
|---|---|---|
| `wordhug_pack_kitchen` | Non-Consumable | £1.99 |
| `wordhug_pack_outdoors` | Non-Consumable | £1.99 |
| `wordhug_pack_creatures` | Non-Consumable | £1.99 |
| `wordhug_pack_workshop` | Non-Consumable | £1.99 |
| `wordhug_pack_nightfall` | Non-Consumable | £2.49 |
| `wordhug_pack_bundle` | Non-Consumable | £7.99 |
| `wordhug_coins_5` | **Consumable** | £0.99 |
| `wordhug_coins_15` | **Consumable** | £2.49 |
| `wordhug_coins_50` | **Consumable** | £6.99 |

Type matters more than price — wrong types surface as odd restore behaviour,
and prices differ per store anyway (the shop shows RevenueCat's localised
`priceString`; the column above is only the offline fallback in `packs.ts`).

Each product additionally needs, or it lands in Missing Metadata:

- Localised display name and description
- One screenshot (any clear capture of the thing being bought — the pack art
  under `assets/images/packs/` works for packs; a board with the hint sheet
  open works for coins)
- **Review notes**: one line each is enough, e.g. *"Unlocks the Kitchen Table
  level pack (50 puzzles)."*

Prices are chosen per territory from Apple's tiers; pick the ones matching the
table's intent rather than converting literally.

---

## 4. Point RevenueCat at the App Store

Dashboard → **Apps → + New → App Store**:

- Bundle ID: `com.codewithkin.wordhug` (exact)
- Upload the In-App Purchase `.p8` from §2
- Upload the App Store Connect API `.p8` from §2 — this is what powers
  **App Store Server Notifications V2**: in ASC (App → App Information →
  Server Notifications or equivalent), point production and sandbox at the
  environment URLs RevenueCat displays. Refunds and renewals reach the project
  through this; the app itself still ignores revocations by design (D-008),
  so this is bookkeeping, not gameplay.

Then **Product catalog**: add each of the nine again with the Apple app as
their store, alongside the existing Test Store and Play entries.

**Entitlements stay untouched.** The five entitlements each gain their Apple
product; `wordhug_pack_bundle` is attached to all five exactly as on Play —
inverted (bundle having its own entitlement) would grant every pack for
£1.99, the mistake the Play setup avoided. The `default` offering's packages
each gain their Apple counterpart package; no code changes — the shop maps
products, and `buy()` takes whatever package identifier the offering carries.

Finally, swap the SDK key slot that has been waiting empty since 8c:

```jsonc
// apps/native/app.json → expo.extra.revenueCatKeys
{ "android": "goog_…", "ios": "appl_<Apple public SDK key>" }
```

Public keys ship inside binaries by design; the secret keys from §2 stay out
of the repo (a check asserts `sk_…` never appears in app source).

---

## 5. TestFlight and sandbox

```powershell
cd apps\native
pnpm build:android        # sanity-check Android first, it is the known-good path
pnpm build:ios            # eas build --platform ios --profile production
```

The production profile produces an installable-for-review `.ipa`; upload with
`eas submit --platform ios --profile production`. Same rules that killed the
first Play build apply verbatim: **commit the lockfile with any
`package.json` edit, push, build clean, and confirm the EAS page reports your
SHA without an asterisk.**

- **Internal testers** (up to 100 team members) get builds through TestFlight
  after ~15 minutes of processing, no beta review needed. Enough for a solo
  owner.
- Sandbox accounts: ASC → **Users and Access → Sandbox → Testers**. Create one
  per scenario you want isolated. On-device, iOS prompts for the sandbox login
  at the first purchase attempt — TestFlight builds always hit sandbox.
- Licence-tester ≠ sandbox tester: Apple's equivalent of Play's free-buying
  testers *is* the sandbox; purchases there are free and behave like real ones.

Test the identical matrix from `release-playstore.md` §5 — one pack unlocks
only its levels, bundle unlocks all five, coins credit exactly 5/15/50,
restore brings packs and never coins, aeroplane mode revokes nothing.

---

## 6. Every question Apple asks, answered

This is the part Play never had: App Store Connect interviews you across
several forms before submission. Here are Word Hug's answers, form by form.

### 6.1 App Information

| Question | Answer |
|---|---|
| Name (≤30 chars) | `Word Hug: Cozy Word Puzzle` (26) — same as Play, searches matter |
| Subtitle (≤30 chars) | `Three clues, one word` (21) |
| Primary language | English (U.S.) or (U.K.) — match the store copy |
| Primary category | Games → **Puzzle** (secondary: **Word**) |
| Content rights | Does the app contain third-party content? **No** — all art/type is ours |
| Bundle ID | `com.codewithkin.wordhug` (register it if ASC offers to) |
| SKU (internal only) | `word-hug` |

### 6.2 Version metadata (the listing)

| Field | Answer |
|---|---|
| Description (≤4000) | Adapted from `systems/store-listing.md` — the copy exists, trim to Apple's tone rules (no "free", no "#1", no emoji, no urgency — the Play copy already avoids all of them) |
| Keywords (≤100, comma-sep) | `cozy,word,puzzle,daily,brain,relax,anagram,hint,crossword,chill` — Apple concatenates these; do not repeat words already in name/subtitle |
| Promotional text (≤170) | Optional; **editable any time without a new review** — the one Apple field better than Play's |
| Screenshots | 6.9" iPhone (1290×2796) required — the ordered set in `art-direction.md` §11 fits; add 13" iPad **only if** §1.3 kept tablets on |
| App icon | `apps/native/assets/images/icon.png` — must be 1024×1024, **no alpha channel**; flatten if needed |
| Support URL | `https://wordhug.gamesforstrangers.lol` (or its support page) |
| Marketing URL | Optional — skip |
| Copyright | `© 2026 codewithkin` |

### 6.3 App Privacy ("the nutrition label")

First question decides everything: **"Do you or your third-party partners
collect data from this app?" → No.**

That yields the cleanest possible label — "No Data Collected" — and it is true
today: no analytics, no account, storage stays on-device, and Apple treats
store payment handling (Google/Apple/RevenueCat) as payment processing rather
than collection, the same position the Play Data Safety form takes. There is
no ATT/tracking prompt to answer because nothing is collected to track.

> **⚠️ Ads change this answer.** An ad SDK collects the advertising ID. Before
> any ad-enabled build: this label, the privacy page, and the Play Data Safety
> form all change together, before submission. The warning lives at
> `apps/web/src/app/privacy/page.tsx` too.

Privacy policy URL: `https://wordhug.gamesforstrangers.lol/privacy` — required,
already live.

### 6.4 Age Rating questionnaire

Answer **None/No to every content row** — violence (all flavours), sexual
content, nudity, profanity, mature themes, horror, medical, drugs/alcohol,
discrimination, gambling, contests, unrestricted web access, user-generated
content. Word Hug is a word game with no chat, no UGC, no links-out beyond the
privacy/terms pages.

Result: **4+**. Two traps: do *not* tick simulated-gambling for the coin shop
(coins buy hints, nothing wagered), and note that in-app purchases are **not**
part of this questionnaire — they are declared by the products themselves and
surface in review.

### 6.5 Pricing and Availability

| Question | Answer |
|---|---|
| Price | Free (tier 0) — revenue is inside the IAPs |
| Availability | All territories, or prune later |
| Pre-orders | No |
| App distribution method | Public / standard App Store |

### 6.6 Export compliance (asked once per build)

*"Does your app use encryption?"* → Yes → *"exempt from export documentation
requirements?"* → Yes (HTTPS via standard OS libraries only; no proprietary
crypto).

Verified against the dependency surface in session 8c: every network call is
standard TLS; nothing in `apps/native` imports or implements a cipher; MMKV is
created without an `encryptionKey`, so its bundled-but-unused AES never runs —
and even if enabled later, AES is a standard algorithm and the answer holds.
The `false` below is therefore truthful, not hopeful.

To stop Apple asking on every subsequent build, add to `app.json`:

```jsonc
"expo": {
  "ios": {
    "infoPlist": { "ITSAppUsesNonExemptEncryption": false }
  }
}
```

### 6.7 Other yes/no flags scattered through the flow

| Flag | Answer |
|---|---|
| Contains ads? | **No** (true today; revisit with the ads work) |
| Chat / forums / user-generated content? | No |
| Financial products or features? | No |
| Alternative marketplace / EU DMA distribution? | Standard App Store only |
| Built for kids / primarily for children? | No (suitable for everyone, not targeted) |
| Requires government/military credentials? | No |

### 6.8 App Review information

Contact: the owner's name, phone, email.

Demo account: **none needed** — say so plainly, "This app has no login."
Reviewers distrust apps that force accounts and reward ones that say why they
don't have one.

Notes (paste-ready):

> Word Hug is a cozy word game: three clues share one three-to-seven letter
> answer. No account, fully offline-capable, nothing collected.
>
> The whole game is playable free. Coins buy optional hints (three tiers:
> category, first letter, full answer). Coin packs are consumables; five
> themed level packs and an all-packs bundle are one-time non-consumables.
> Please feel free to exercise any purchase — sandbox purchases are expected.
>
> After a wrong guess, letters sitting in their correct positions turn teal.
> This is deliberate feedback about the guess just made, not a bug and not a
> hint reveal.

### 6.9 Version release options

| Option | Recommendation |
|---|---|
| Release type | **Manually release** after approval, or automatic — owner's call; manual lets you hold a build behind marketing |
| Phased release (7-day rollout) | Available and worth using for updates; first releases rarely need it |

Submit. First review commonly 24–48h; expect the occasional rejection round
with a specific guideline number — fix the named thing, reply in Resolution
Centre, resubmit.

---

## 7. After it is live

- `runtimeVersion: "1"` is static on purpose — bump it by hand only for native
  changes OTA cannot carry (same rule as Android).
- EAS owns the build number (`appVersionSource: "remote"` + auto-increment),
  exactly as it owns Android's `versionCode`. Never hand-set it; bump
  `expo.version` yourself when the user-visible version should move.
- OTA updates ride the `production` channel; JavaScript-only changes only.
- Promotional text can be rewritten at any time without a review — use it.

---

## 8. Lessons carried from the Play run

All learned the hard way over sessions 8b–8b-and-a-half; restated because they
transfer one-to-one:

1. **Products in the store console first, RevenueCat second.** Importing beat
   typing ids twice on Play; same order here (§3).
2. **Entitlement attachment pattern:** each pack entitlement holds its own
   product + the bundle; the bundle holds no entitlement of its own. Getting
   it inverted sells every pack for £1.99.
3. **Identifiers match exactly, spaces and capitalisation included.**
   `content/packs.ts` is the mirror; change dashboard and code in the same
   breath or packs silently lock.
4. **Lockfile and dependency edits are one commit; build from a clean pushed
   tree; check the SHA has no asterisk.** The first Play build died of exactly
   this (`ERR_PNPM_OUTDATED_LOCKFILE`).
5. **Privacy URLs resolve before submission.** The site is deployed and
   battle-tested from the Play process — nothing to redo.
6. **Platform-owned version numbers stay platform-owned.** Do not fight the
   server; you will lose.
