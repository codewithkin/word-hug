# Dependencies — everything needed, so one dev build is enough

**Purpose:** the owner asked for a single development build. Anything in §1 changes native
code and needs a rebuild; anything in §2 does not. §1 is therefore complete on purpose — it
includes things not needed for weeks, so they never force a second build.

**Status, end of session 5: everything in §1 is installed, configured, and — for the
first time — *verified by running the tooling*.** Session 5 had a working npm registry,
which no previous session did, so `pnpm install`, `expo prebuild`, `expo-doctor` and
`tsc` all actually ran. See §7 for what that turned up. The headline: **`prebuild`
crashed on session 4's `app.json`**, so the build being described as ready was not.

---

## 1. Native — REQUIRES the dev build

| Package | Why | When first used |
|---|---|---|
| `expo-dev-client` | Required for any custom dev build at all | Immediately |
| `react-native-mmkv` | All local storage — solves, streak, coins, settings | Immediately |
| `react-native-purchases` | RevenueCat. Sole source of truth for entitlements. | Shop, packs |
| `expo-notifications` | The daily reminder. Local only, no push server. | Onboarding step 4 |
| `expo-localization` | Device locale detection for i18next | Immediately |
| `expo-splash-screen` | There is a designed splash | Immediately |
| `expo-updates` | OTA puzzle-bank delivery | Post-launch, but native |
| `expo-audio` | Settings has a sound toggle, so there is sound | Solve celebration |
| `expo-system-ui` | Android nav-bar and root background colour per theme | Theming |
| `expo-image` | Image perf. Not needed today; costs nothing to include. | Later |
| `expo-store-review` | "Enjoying Word Hug?" prompt. Speculative but native. | Later |
| **`expo-build-properties`** | **Added session 4.** The only escape hatch for minSdk / compileSdk / iOS deployment target / Kotlin / Proguard. | If ever |
| **`expo-application`** | **Added session 4.** Version and build number, for Settings. | Later |
| `expo-insights` | Added by the owner alongside EAS. Autolinks; needs **no** plugin entry. | Build-time |
| **`expo-asset`** | **Added session 5.** A *required* peer of `expo-audio` and a native module in its own right. It was missing, and `expo-doctor` warns the app "may crash outside of Expo Go" without it. | With `expo-audio` |

**Already installed and native — no action, listed so you don't remove them:**
`expo-font`, `expo-haptics`, `expo-secure-store`, `expo-web-browser`, `expo-linking`,
`expo-constants`, `expo-network`, `expo-status-bar`, `react-native-gesture-handler`,
`react-native-reanimated`, `react-native-worklets`, `react-native-screens`,
`react-native-safe-area-context`, `react-native-svg`, `react-native-keyboard-controller`.

### Deliberately NOT included

| Package | Why not |
|---|---|
| `expo-blur` | **Zero blur in the designs.** Measured: 0 uses of `blur(` or `backdrop-filter`. |
| `expo-linear-gradient` | **Zero linear gradients.** All 74 are *radial*, which this cannot do. Use `react-native-svg`'s `<RadialGradient>` — already installed. |
| `@gorhom/bottom-sheet` for overlays B and C | Installed, but the two sheets are not dragged, snapped or gesture-dismissed. `components/sheet.tsx` is a `View`. Swap it in behind that component if a sheet ever needs a gesture. |
| `react-native-purchases-ui` | RevenueCat's hosted paywalls. **Screen 15 is designed**, so the paywall is ours. Adding this later IS a rebuild — decided against deliberately, session 4. |
| `@react-native-community/datetimepicker` | Onboarding step 4 collects a time with its own control. A native picker later would be a rebuild. Flagged, not taken. |
| `expo-tracking-transparency` | No analytics, no ad IDs, nothing to ask permission for (PRD §9). |
| Any analytics SDK | Deliberate product decision, not an oversight. |

---

## 2. JavaScript only — add any time, NO rebuild

| Package | Why |
|---|---|
| `i18next`, `react-i18next` | Localisation layer (`systems/i18n.md`) |
| `@expo-google-fonts/baloo-2` | The app's only font family. **There is no 900 face** — the axis stops at 800 (D-003). |
| ~~`moti`~~ | **REMOVED session 3.** `components/motion.tsx` uses Reanimated directly. |
| `zustand` | Small global state. Optional — React context may be enough. |
| `babel-plugin-react-compiler` | **Not declared in `apps/native`** and currently resolves as a pnpm peer of `babel-preset-expo`. If Metro ever errors naming it, `npx expo install babel-plugin-react-compiler`. See `05-known-issues.md` §5. |

---

## 3. Two things about this stack worth knowing before you build

**Radial gradients are not a React Native feature.** 74 instances across the designs,
drawn with `react-native-svg` as an absolutely-positioned background layer.
`expo-linear-gradient` cannot approximate them.

**Inset shadows are React Native 0.76+ on the New Architecture.** `newArchEnabled: true`
is now set explicitly in `app.json` rather than relying on the SDK default. If insets
render flat anyway, `components/chunky.tsx` is the single fix — plus the three shadows
listed in `05-known-issues.md` §9 that deliberately bypass it.

---

## 4. Commands to run

```bash
pnpm install                      # REQUIRED again — session 5 added expo-asset

cd apps/native
npx expo prebuild --clean         # must succeed. It did not before session 5 — see §7.1
npx expo run:android              # local Android build
```

**`pnpm install` is required again.** Session 5 added `expo-asset`; the lockfile moved.

`npx expo config --type prebuild` is still a useful five-second smoke test, but **it is
not sufficient** — it passed on the exact `app.json` that made `prebuild` crash. Run the
prebuild itself.

**The owner is on Windows, so `npx expo run:ios` cannot work.** iOS goes through EAS
Build; `apps/native/eas.json` has a `development` profile with `developmentClient: true`:

```bash
eas build --profile development --platform all
```

### Three greps that prove the config landed, after `prebuild --clean`

```bash
grep -A1 "updates.ENABLED" android/app/src/main/AndroidManifest.xml  # was false, now true
ls android/app/src/main/res/drawable-*/notification_icon.png         # written by the plugin
ls -l ios/wordhug/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

The icon should be well over 5,856 bytes — that number is the Expo template placeholder
the project shipped with until session 4.

**Session 5 correction — `grep POST_NOTIFICATIONS` on the app manifest is a false
alarm and was removed from this list.** It returns nothing, and that is correct.
`POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` are declared in
`expo-notifications`' *own* `android/src/main/AndroidManifest.xml` and reach the app
through the Gradle manifest merge at build time. They never appear in
`android/app/src/main/AndroidManifest.xml`, in any SDK version. Grepping the app
manifest for a library permission will always look like a failure and never be one.

---

## 5. If you ever do need a second build

Adding any package with native code requires one. The remaining candidates:

- `react-native-purchases-ui`, if the designed Shop turns out not to be enough
- `@react-native-community/datetimepicker`, if the notification time wants a native picker
- A different audio library, if `expo-audio` proves awkward for short solve sounds
- `expo-mail-composer`, if `Linking.openURL('mailto:…')` is not good enough for support
- A widget or watch target, out of scope for v1

Changing a value inside `expo-build-properties` is also a rebuild — the package being
installed does not avoid that, it only means you do not also have to add a dependency.

---

## 6. What session 4 found, and why this file needed a §6

Session 3 got the package list right and stopped there. Four things that would each
have cost a second native build were sitting in `app.json`, not in `package.json`:

1. **`expo-notifications` had no config plugin block.** The package was installed, but
   the plugin is what writes the Android notification icon and the `POST_NOTIFICATIONS`
   permission. The generated manifest had neither — the ALLOW button in onboarding step
   4 would have failed silently on Android 13+.
2. **Seven of nine icon assets were unreferenced.** The prebuilt iOS project was
   carrying the Expo template's placeholder icon.
3. **`expo-updates` was natively disabled** (`ENABLED=false`) because no `updates.url`
   was set. Turning OTA on later is a rebuild. Fixed by linking the EAS project.
4. **`newArchEnabled` was implicit.** The entire chunky elevation depends on it.

**The lesson for whoever reads this next:** "is the package installed" and "will this
package work in the build" are different questions. The second one lives in `app.json`,
and nothing in a dependency list will tell you the answer.

---

## 7. What session 5 found by actually running it

Session 5 was the first with a working npm registry and network. Everything below was
found by running a command, not by reading a file. **Three of these five would each have
failed the owner's first build**, and none was visible from `package.json` or `app.json`
by inspection.

### 7.1 `expo prebuild` crashed — `icon` as an object is iOS-only

```
TypeError: [android.dangerous]: withAndroidDangerousBaseMod: url.startsWith is not a function
  at generateIconAsync (…/prebuild-config/build/plugins/icons/withAndroidIcons.js:365)
```

Session 4 set the top-level `icon` to `{ light, dark, tinted }` — the iOS 18 dark and
tinted icon form. **Android's icon generator reads the same top-level `icon` key**
(`getIcon()` is `config.android?.icon || config.icon`) and passes it straight to a
function that calls `.startsWith()` on it. An object has no `.startsWith`, so prebuild
dies before writing anything.

Fixed by putting the string back at the top level and moving the object under `ios.icon`,
where `withIosIcons.js` explicitly handles all three variants. Both platforms now get
what they expect and all nine icon assets are still referenced.

**This is the single most important thing in this file.** Nothing about it is visible
without running `prebuild`, it fails on Android only, and the config it fails on reads
as obviously correct.

### 7.2 `android.edgeToEdgeEnabled` no longer exists

```
» android: EDGE_TO_EDGE_PLUGIN: `edgeToEdgeEnabled` customization is no longer available
  - Android 16 makes edge-to-edge mandatory. Remove the entry from your app.json.
```

A warning, not a failure. Removed. Edge-to-edge is now unconditional, which is what the
designs assume anyway — every screen already uses safe-area insets (D-001).

### 7.3 The committed `android/` folder was silently voiding the whole of `app.json`

`apps/native/.gitignore` lists `android/` and `ios/`, but **36 files under
`apps/native/android/` were committed** in `6a9d482 "Updated deps"`, before that
gitignore line existed. Git keeps tracking what it already tracks, so they stayed.

`expo-doctor` names the consequence exactly:

> This project contains native project folders but also has native configuration
> properties in app.json… When the android/ios folders are present, EAS Build will not
> sync the following properties: **scheme, orientation, userInterfaceStyle, icon, ios,
> android, plugins.**

That is session 4's entire body of work — the notification plugin, the splash, the nine
icons, portrait lock, `newArchEnabled`. EAS would have built the **scaffold's** stale
Android project instead: `updates.ENABLED=false`, no notification icon, Expo's template
launcher icon. And it would have succeeded, which is worse than failing.

Fixed with `git rm -r --cached apps/native/android`. The folder still exists locally
(prebuild regenerates it), it is simply untracked now, as `.gitignore` always intended.
**Do not commit `android/` or `ios/` again.** This project is CNG: `app.json` is the
source of truth and the native folders are build output.

### 7.4 `expo-asset` was missing

A *required* peer of `expo-audio`, and a native module. Installed at `~57.0.10`.
`expo-doctor`'s wording: "Your app may crash outside of Expo Go without this dependency."
Since `expo-audio` is not imported anywhere yet this had not bitten, but it is native, so
finding it after the build would have cost a second one — which is the exact thing this
file exists to prevent.

### 7.5 A stray `app.json` at the repo root

Eight lines, containing only a duplicate of the EAS `projectId`. Almost certainly
`eas init` run from the wrong directory. Harmless while every command is run from
`apps/native`, and a trap the first time one is not. Deleted; `apps/native/app.json`
carries the same `projectId`.

### What was checked and is genuinely fine

- **`POST_NOTIFICATIONS` — see the correction in §4.** It comes from the library
  manifest via Gradle merge. The generated app manifest not containing it is correct.
- **Autolinking under pnpm's `node-linker=isolated`.** The stated risk in
  `05-known-issues.md` §5 was real but has not materialised: all 11 community modules
  resolve (`mmkv`, `purchases`, `gesture-handler`, `keyboard-controller`, `reanimated`,
  `safe-area-context`, `screens`, `svg`, `worklets`, `masked-view`) plus every Expo
  module. Verified with `expo-modules-autolinking react-native-config -p android`.
- **`expo-insights` needs no plugin entry.** It ships no `app.plugin.js` and autolinks.
- **Every declared `~57.0.x` range already resolves to the SDK's expected patch**, so
  `expo install --check`'s advice would be cosmetic. It could not be run anyway —
  it needs `api.expo.dev`, which the sandbox blocks.
- **`expo-doctor` is at 19/21.** The two failures are the two checks that need network
  (`api.expo.dev` for the config schema, `reactnative.directory` for package metadata).
  Both were failing for that reason before any change in this session.

### The method, for next time

`npx expo config --type prebuild` **passed while `npx expo prebuild` crashed.** The
first only evaluates plugins; the second runs the image and manifest writers, which is
where §7.1 lived. `00-START-HERE.md` recommended the first as the cheap early check —
it is, but it is not a substitute. **Run `prebuild --clean` itself.** It takes seconds
and it is the only thing that proves the config survives contact with both platforms.

---

## 8. Session 8b — the audit, and what was removed

The first dependency audit since the project started. Method: walk every source
file, collect what is actually imported, diff against what is declared.

### Removed from `apps/native` — native code, so this is real binary size

These nine are **autolinked and compiled into the APK whether or not a single
line of JavaScript imports them.** That is where app size actually comes from —
an unused pure-JS package costs a few KB of bundle; an unused Expo module costs
its whole native library.

| Package | Note |
|---|---|
| `expo-audio` | Sound is a *setting* in this app, not a feature. Nothing ever played a file. |
| `expo-image` | The largest of the nine — bundles SDWebImage on iOS and Glide on Android. The app uses React Native's own `Image`. |
| `expo-application` | Never imported. |
| `expo-secure-store` | There is nothing secret: no account, no token, no key. |
| `expo-store-review` | No review prompt exists, and one would need a decision first. |
| `expo-web-browser` | `settings.tsx` opens links with `Linking`. |
| `expo-localization` | i18n is not wired; see below. |
| `expo-network` | Referenced only in a *comment* in `offline-notice.tsx` describing a future design. |
| `expo-insights` | Analytics. PRD §10 says there is no analytics pipeline and never will be. |

### Removed from `apps/native` — JavaScript only

- `@gorhom/bottom-sheet` — referenced only in a comment in `components/sheet.tsx`
  explaining **why the app does not use it**. The app has its own `Sheet`.
- `i18next`, `react-i18next` — installed in session 2, never wired. The
  `category.*` keys in the bank are i18n keys with a hand-written map standing
  in for a resource bundle. Reinstall both when that map is deleted.
- `dotenv`, `@word-hug/env` — the native app reads no environment variables.
  The RevenueCat key lives in `app.json` → `expo.extra`.
- `tailwind-variants` — only importer was `components/container.tsx`, which was
  itself unused Expo-template boilerplate.

### Moved to `devDependencies`

- `expo-dev-client` — a large native module with no purpose in a release build.

### Kept despite showing as "unused by import"

Do not remove these on a second audit. Each is required implicitly:

| Package | Why it stays |
|---|---|
| `react-native-screens` | Peer requirement of expo-router / react-navigation |
| `react-native-worklets` | Required by Reanimated 4 |
| `react-native-web`, `react-dom`, `@expo/metro-runtime` | Expo's web target |
| `expo-status-bar`, `expo-system-ui`, `expo-linking`, `expo-asset` | Expo internals; also transitive |
| `expo-build-properties`, `expo-font`, `expo-router`, `expo-splash-screen`, `expo-notifications` | Config plugins in `app.json` — never imported, always needed |
| `expo-updates` | Unused in JS, but `eas.json` defines three channels and `app.json` has an `updates` block. Removing it changes EAS behaviour, and this project has already lost a day to a fingerprint mismatch. Leave it. |
| `tailwindcss` | uniwind's build step |

### Removed elsewhere

- `packages/ui`: **`shadcn` was a runtime `dependency`.** That is the CLI, used
  via `npx shadcn add`, and it was being installed into every environment.
  Also dropped `react-dom`, which the consuming app provides.
- `packages/ui`: fourteen unused shadcn components tombstoned. The package
  exports per file, so they were never *bundled* — but they were installed,
  typechecked and linted on every run. `apps/web` imports exactly three:
  `button`, `dropdown-menu`, `sonner`.
- `apps/web`: `sonner` and `dotenv`, both provided transitively.
- `apps/native`: `components/container.tsx` and `components/theme-toggle.tsx`,
  unused template boilerplate.

### Not a bundle problem, but a build-context one

`designs/` is 8.8 MB across 140 HTML files at the repo root. Metro never sees it
(nothing imports it) but Docker would have shipped it to the daemon on every
build. It is in `.dockerignore`, along with `plans/`, `progress/`, `systems/`,
`scripts/` and `apps/native`.
