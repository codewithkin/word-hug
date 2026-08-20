import '@/global.css';

import { useFonts } from 'expo-font';
import { Stack, router, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { AppThemeProvider } from '@/contexts/app-theme-context';
import { initNotifications, onNudgeTapped, refreshDailyNudges } from '@/lib/notifications';
import { initStorage } from '@/lib/storage';
import { FONT_MAP } from '@/theme/fonts';

/**
 * Storage is seeded at module scope, before any screen body runs, because
 * `app/index.tsx` reads the onboarding flag during its first render to decide
 * whether to redirect. An effect would be a frame too late and the Daily
 * screen would flash behind onboarding on a fresh install.
 *
 * `initStorage` is idempotent and cannot throw — it falls back to an in-memory
 * store if the native module is missing. See `lib/storage/index.ts`.
 */
initStorage();

/**
 * The importing of `global.css` on line 1 is what loads the entire styling
 * layer — Tailwind, uniwind, heroui's variables, and Word Hug's generated
 * palette on top of them. If it is ever removed, nothing throws: the app
 * simply renders every className as nothing.
 */

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or the module is unavailable in this environment. The
  // splash screen is not worth failing a launch over.
});

export const unstable_settings = {
  initialRouteName: 'index',
};

/**
 * Expo Router renders this instead of the tree when a screen throws.
 *
 * It is the real use of the 02 Error design — `/error` exists so the screen
 * can be opened deliberately, but this is how anyone will actually meet it.
 * `retry` re-mounts the failed subtree; if the failure is in the tree itself
 * rather than in data, going home is the escape hatch that always works.
 *
 * Wrapping the whole app means a crash lands on a screen that says "nothing
 * is lost" rather than on a red box — which matters most for the person least
 * able to do anything about it.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ErrorView
          error={error}
          onRetry={() => {
            void retry();
          }}
          onHome={() => router.replace('/')}
        />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Every overlay in the app is presented the same way: a transparent modal that
 * fades. Transparent, because each one is drawn over the screen it belongs to
 * and its scrim has to fall on the real thing rather than on a redrawn copy;
 * fading, because a sheet that slides in from the side reads as navigation,
 * and none of these are places you go.
 */
const OVERLAY = {
  presentation: 'transparentModal',
  animation: 'fade',
  animationDuration: 260,
} as const;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);

  /**
   * The Android notification channel has to exist before anything is posted to
   * it, and a channel created only inside onboarding would be missing for
   * everyone who installed before this ran. Creating it at startup is cheap,
   * idempotent, and asks for no permission — the OS prompt is still onboarding
   * step 4's alone.
   */
  useEffect(() => {
    void initNotifications();
  }, []);

  /**
   * Refill the reminder window, and send a tap to the puzzle it named.
   *
   * The refresh has to happen on every launch: reminders are scheduled as a
   * rolling fortnight of dated notifications rather than one repeating
   * trigger, so without this they would quietly stop for everyone two weeks
   * after onboarding. It is a no-op when the player never asked for them.
   *
   * Separate from the channel effect above because that one must run before
   * any permission is requested, whereas this one needs permission to already
   * exist. Both are cheap and idempotent.
   */
  useEffect(() => {
    void refreshDailyNudges();

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void onNudgeTapped(() => router.push('/daily')).then((off) => {
      // The listener resolves asynchronously, so the screen can unmount before
      // it is ready. Without this the subscription would leak on a fast remount.
      if (cancelled) off?.();
      else unsubscribe = off;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    // Hide on error too. A missing font is a visual bug worth seeing, not a
    // reason to leave the user staring at a splash screen forever.
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Baloo 2 does not synthesise weights, so rendering before the faces are
  // ready shows the system font and then reflows (D-003).
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                {/* ── Session 7: the level architecture ─────────────────
                    `/` is a redirect, `/home` is the map and the app's real
                    front door, and the daily puzzle is one card on it. */}
                <Stack.Screen name="home" options={{ animation: 'fade' }} />
                <Stack.Screen name="level/[n]" />
                <Stack.Screen name="daily" />
                {/* Onboarding fades between its own steps; entering and
                    leaving the flow as a whole is a fade too, so the amber
                    button never appears to slide in from the side. */}
                <Stack.Screen
                  name="onboarding"
                  options={{ animation: 'fade', animationDuration: 260 }}
                />

                {/* ── Overlays ─────────────────────────────────────────── */}
                {/* A — the celebration sits ON the puzzle it belongs to, so
                    the wash falls on the real answer rather than a copy. */}
                <Stack.Screen name="celebration" options={OVERLAY} />
                {/* B — what the Nudge button on three screens opens. */}
                <Stack.Screen name="nudge-picker" options={OVERLAY} />
                {/* C — reached from B, and only when the balance is zero. */}
                <Stack.Screen name="zero-coin" options={OVERLAY} />
                {/* F — a banner in the product; the Shop mounts it directly.
                    The route exists only so it can be looked at. */}
                <Stack.Screen name="offline-notice" options={OVERLAY} />
                {/* D — the welcome offer. Nothing triggers it yet; see the
                    file for what it must never grow. */}
                <Stack.Screen name="welcome-offer" options={OVERLAY} />
                {/* G — what Restore says. Both outcomes, one sheet. */}
                <Stack.Screen name="restore-result" options={OVERLAY} />
                {/* H — the end of the levels. NOT `/caught-up`, which is the
                    09 alternate state for the day's puzzle being done. */}
                <Stack.Screen name="all-caught-up" options={OVERLAY} />
                {/* The end of the free run. Fires once, from the map, after
                    the celebration is gone. See the file for what it must
                    never grow into. */}
                <Stack.Screen name="free-run-complete" options={OVERLAY} />

                {/* ── Screens ──────────────────────────────────────────── */}
                {/*
                  Session 8: the archive is gone — `/archive`, `/archive-puzzle`,
                  `/archive-day-one` and overlay E. It existed to let a player
                  catch up on missed daily puzzles, which was the whole point
                  when the product WAS the daily puzzle. With 50 free levels
                  and 250 in packs there is always something to play, and a
                  second list of old dailies was a screen nobody needed.
                */}
                <Stack.Screen name="packs" />
                <Stack.Screen name="pack/[id]" />
                <Stack.Screen name="pack-level/[id]/[n]" />
                <Stack.Screen name="shop" />

                <Stack.Screen name="settings" />
                <Stack.Screen name="how-to-play" />
                <Stack.Screen name="stats" />
                <Stack.Screen name="pack-puzzle" />

                {/*
                  ── Alternate states ───────────────────────────────────────
                  TEMPORARY ROUTES. Every one of these is a *state* of a screen
                  and not a destination: `wrong-guess` is the Daily screen after
                  a guess, `stats-empty` is the Stats screen on day one. They
                  are routes purely so they can be opened and looked at before
                  the game state that produces them exists.

                  Each becomes a branch of its parent screen when the storage
                  and guess layers land (plans/05 §6), and these registrations
                  go with the link row on Daily. Nothing in the product should
                  ever navigate to one of them.
                */}
                <Stack.Screen name="solved-today" options={{ animation: 'fade' }} />
                <Stack.Screen name="wrong-guess" options={{ animation: 'fade' }} />
                <Stack.Screen name="near-miss" options={{ animation: 'fade' }} />
                <Stack.Screen name="caught-up" options={{ animation: 'fade' }} />
                <Stack.Screen name="nothing-owned" />
                <Stack.Screen name="store-unreachable" />
                <Stack.Screen name="stats-empty" />

                <Stack.Screen name="loading" options={{ animation: 'fade' }} />
                <Stack.Screen name="error" options={{ animation: 'fade' }} />
                <Stack.Screen name="token-probe" options={{ presentation: 'modal' }} />
              </Stack>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
