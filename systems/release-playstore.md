# Releasing to Google Play

Written session 8b, after purchases were confirmed working against RevenueCat's
Test Store. Two builds are described: an **internal test** with real Play
billing, and the **production** release.

> **The one thing that catches everyone.** Google Play will not let you create
> in-app products until a signed AAB with the right `applicationId` has been
> uploaded to *some* track. RevenueCat then reads those products from Play. So
> the order is: **upload a build first, create the products second, wire
> RevenueCat third, upload a second build to test it.** You cannot do it in one
> pass, and the first upload is deliberately a throwaway.

---

## 0. Where things stand

| | Status |
|---|---|
| App code | Complete, playing, purchases working |
| RevenueCat | **Play Store app live** (`app05dac30f80`) — 9 products imported from Play Console, bundle attached to all five entitlements, default offering complete. Android SDK key swapped to `goog_…` in session 8c |
| `eas.json` | `development`, `preview`, `production` profiles all present |
| `app.json` | `com.codewithkin.wordhug`, version `1.0.0`, `runtimeVersion: "1"` |
| Privacy policy | https://wordhug.gamesforstrangers.lol/privacy |
| Terms | https://wordhug.gamesforstrangers.lol/terms |

> **Session 8c note:** the first EAS production build errored because
> `pnpm-lock.yaml` had not been committed after restoring `shadcn`
> (`ERR_PNPM_OUTDATED_LOCKFILE`; CI installs with `--frozen-lockfile`). It also
> built from a dirty tree — the `*` on the commit SHA means uncommitted changes
> rode along. Rule for every build: **commit the lockfile with any
> `package.json` edit, push, then build from a clean tree**, and check the
> build page reports your pushed SHA without an asterisk.

`appVersionSource: "remote"` and `autoIncrement: true` on the production
profile mean **EAS owns the Android `versionCode`**. Do not set it by hand in
`app.json`; you will fight the server and lose.

---

## 1. Before the first upload

### 1.1 Deploy the website

Both stores check that the privacy URL resolves. A 404 is a rejection, and it is
the cheapest possible one to avoid.

```bash
docker build -f apps/web/Dockerfile -t word-hug-web .
docker run -p 3001:3001 word-hug-web
```

Then point `wordhug.gamesforstrangers.lol` at it and confirm `/privacy` and
`/terms` load over HTTPS.

### 1.2 Google Play Console — create the app

Play Console → **Create app**.

- App name: `Word Hug`
- Default language, app or game: **Game**, free
- Declarations: it is not primarily for children, but it *is* suitable for all
  ages — the Target Audience section is where that gets said properly

### 1.3 The service account, and why it takes a day

EAS needs permission to upload on your behalf.

1. Play Console → **Setup → API access** → link a Google Cloud project
2. Create a service account, grant it **Release manager**
3. Download the JSON key, save it as `apps/native/play-service-account.json`
4. It is already in `.gitignore` — **check it stays there before committing**

Permissions take up to 24 hours to propagate. Start this first; everything else
can happen while it settles.

---

## 2. The throwaway build, to unlock in-app products

```bash
cd apps/native
pnpm build:android              # eas build --platform android --profile production
```

Production profile produces an **AAB**, which is what Play wants. Preview and
development produce APKs, which are for sideloading and cannot create products.

Upload it:

```bash
eas submit --platform android --profile production
```

Or drag the AAB into Play Console → **Testing → Internal testing → Create new
release**. Either is fine; this build exists only to make the next step
possible.

---

## 3. Create the nine in-app products

Play Console → **Monetise → In-app products**. Identifiers must match the
RevenueCat dashboard and `apps/native/content/packs.ts` **exactly** — a typo
here surfaces as an empty shop with no error.

| Product ID | Type | Price |
|---|---|---|
| `wordhug_pack_kitchen` | Managed product | £1.99 |
| `wordhug_pack_outdoors` | Managed product | £1.99 |
| `wordhug_pack_creatures` | Managed product | £1.99 |
| `wordhug_pack_workshop` | Managed product | £1.99 |
| `wordhug_pack_nightfall` | Managed product | £2.49 |
| `wordhug_pack_bundle` | Managed product | £7.99 |
| `wordhug_coins_5` | Managed product | £0.99 |
| `wordhug_coins_15` | Managed product | £2.49 |
| `wordhug_coins_50` | Managed product | £6.99 |

Play calls non-consumables and consumables both "managed products" — the
difference is whether your app consumes them, and RevenueCat handles that.
Activate every one; a product left inactive does not appear in an offering.

---

## 4. Point RevenueCat at Play

RevenueCat dashboard → your project → **Apps → + New** → Google Play.

- Package name: `com.codewithkin.wordhug`
- Upload the **same service account JSON** from §1.3
- Wait for the green tick; RevenueCat validates the credential immediately

Then, in **Product catalog**, add each of the nine products again with the Play
app as their store. The Test Store entries stay — they are how you keep
simulating without spending money.

**Re-check the entitlements.** Each of the five pack entitlements should have
**two** products attached: its own pack, and `wordhug_pack_bundle`. That is what
makes one bundle purchase unlock all five, and getting it inverted grants every
pack for £1.99.

Finally, swap the SDK key in `apps/native/app.json` → `expo.extra.revenueCatKey`
from the `test_` key to the **Google Play public key** RevenueCat issues for the
new app.

> **Done, session 8c** — including by you, on the dashboard side: products
> created straight in Play Console and imported into RevenueCat (safer than
> typing ids twice), entitlements extended to cover both stores' products, and
> the bundle attached to all five entitlements. The code side is done too:
> keys now live under `extra.revenueCatKeys` per platform
> (`android` = `goog_…`, `ios` empty until an App Store app exists). What
> remains is §5: build, submit, add a licence tester, buy something.

---

## 5. The real internal test build

```bash
cd apps/native
pnpm build:android
eas submit --platform android --profile production
```

`eas.json` submits to the **internal** track as a **draft**. Promote it in the
console when you are ready for testers to see it.

Add yourself as a licence tester: Play Console → **Setup → Licence testing**.
Licence testers buy for free and the purchase behaves exactly like a real one,
which is the only way to test the live billing path without spending money.

### What to actually test

- Buy one pack → its levels unlock, and **only** its levels
- Buy the bundle on a fresh install → all five unlock
- Buy coins → the balance goes up by the right amount
- Reinstall → **Restore purchases** brings the packs back and **not** the coins
- Aeroplane mode → the shop still renders with fallback prices, the game still
  plays, and nothing is revoked

---

## 6. Before production

Play will not let you publish until these are done. None is optional.

### Data safety

Answer it honestly against the privacy policy:

- **Collects no data**, **shares no data** — true today
- Purchase data is handled by Google and RevenueCat, which Play treats as
  payment processing rather than collection

> **⚠️ Ads change this answer.** An ad SDK collects an advertising ID. Before
> submitting any ad-enabled build you must update the Data safety form, the
> privacy policy at `apps/web/src/app/privacy/page.tsx`, and — if the app is
> ever marked as appealing to children — deal with Families Policy. Do it
> before, not after.

### Content rating

Fill in the IARC questionnaire. Word Hug has no violence, no chat, no
user-generated content and no gambling, so it will come out as suitable for
everyone. **Declare the in-app purchases** — that question is asked separately
and getting it wrong is a policy strike.

### Store listing

`systems/art-direction.md` §11 specifies every asset:

- Feature graphic, 1024×500
- At least two phone screenshots — the brief lists six, in order, with captions
- App icon, 512×512
- Short description (80 chars) and full description (4000)

### The other required links

- Privacy policy: `https://wordhug.gamesforstrangers.lol/privacy`
- Support email: the address in `apps/web/src/lib/site.ts`

---

## 7. Production

```bash
cd apps/native
pnpm build:android
eas submit --platform android --profile production
```

Then in Play Console, promote the internal release to **Production**. First
review takes a few days; later ones are usually hours.

### After it is live

- `runtimeVersion: "1"` is static and deliberate — it is what fixed the EAS
  fingerprint failures in session 5. **Bump it by hand** only when you ship
  native changes that an OTA update cannot carry.
- OTA updates go to the `production` channel and can only change JavaScript.
  Adding or removing a native module needs a store build.
- `autoIncrement` handles `versionCode`. Bump `expo.version` in `app.json`
  yourself when the user-visible version should change.

---

## 8. iOS, when you get there

Has its own guide now, same shape as this one and with the App Store Connect
questionnaire answered question-by-question: `systems/release-appstore.md`.
Two differences worth knowing before you open it:

- The **Paid Applications Agreement** (banking + tax) gates product creation
  and sandbox testing — start it on day one
- Products can be created **before** the first upload, unlike Play — but each
  needs a screenshot and a review note or it sits in "Missing Metadata"
