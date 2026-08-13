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
                {/* The celebration sits ON the puzzle it belongs to: a
                    transparent modal keeps the board mounted underneath, so
                    the overlay's wash falls on the real answer rather than on
                    a redrawn copy of it. */}
                <Stack.Screen
                  name="celebration"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'fade',
                    animationDuration: 260,
                  }}
                />
                <Stack.Screen name="archive-puzzle" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="how-to-play" />
                <Stack.Screen name="stats" />
                <Stack.Screen name="pack-puzzle" />
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
