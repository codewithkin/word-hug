# Dependencies — everything needed, so one dev build is enough

**Purpose:** the owner asked for a single development build. Anything in §1 changes native
code and needs a rebuild; anything in §2 does not. §1 is therefore complete on purpose — it
includes things not needed for weeks, so they never force a second build.

**Status, end of session 4: everything in §1 is installed AND configured.** Session 3
left this file accurate about *packages* and silent about *configuration*, which is
where the real second-build risk was hiding — see §6.

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
| `expo-insights` | Added by the owner alongside EAS. | Build-time |

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
cd apps/native

npx expo config --type prebuild   # evaluates every plugin; fails in seconds, not in a build
npx expo prebuild --clean         # app.json changed substantially in session 4
npx expo run:android              # local Android build
```

**`pnpm install` is no longer required** — session 4's additions are installed and
version-corrected.

**The owner is on Windows, so `npx expo run:ios` cannot work.** iOS goes through EAS
Build; `apps/native/eas.json` has a `development` profile with `developmentClient: true`:

```bash
eas build --profile development --platform all
```

### Three greps that prove the config landed, after `prebuild --clean`

```bash
grep POST_NOTIFICATIONS android/app/src/main/AndroidManifest.xml   # was absent
grep -A1 "updates.ENABLED" android/app/src/main/AndroidManifest.xml # was false
ls -l ios/wordhug/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

The icon should be well over 5,856 bytes — that number is the Expo template placeholder
the project shipped with until session 4.

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
