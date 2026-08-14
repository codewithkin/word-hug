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
import { FONT_MAP } from '@/theme/fonts';

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
                {/* E — reached from the Archive, past the seventh day back. */}
                <Stack.Screen name="archive-locked" options={OVERLAY} />
                {/* F — a banner in the product; a route only so it can be
                    looked at before the Shop exists. See the file. */}
                <Stack.Screen name="offline-notice" options={OVERLAY} />

                {/* ── Screens ──────────────────────────────────────────── */}
                <Stack.Screen name="archive-puzzle" />
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
                <Stack.Screen name="archive-day-one" />
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
