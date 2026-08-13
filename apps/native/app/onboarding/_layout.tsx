import { Stack } from 'expo-router';

/**
 * The five onboarding steps.
 *
 * A fade rather than a slide, at the same 260ms as `MOTION.calm`. A push
 * animation implies depth and a back stack — "you are going somewhere and can
 * come back" — and onboarding is one thought delivered in five beats, not a
 * place. The fade also keeps the amber button, which is in the same position
 * on four of the five steps, visually still while the content behind it
 * changes.
 *
 * ── Note (session 3) ──────────────────────────────────────────────────────
 * Nothing gates this yet. The first-launch flag belongs with the storage
 * layer (react-native-mmkv is installed and unused), and putting the app's
 * most-used screen behind an unverified five-screen flow before anyone has
 * seen it run is the wrong order to do things in. Until then these are
 * reachable from the temporary link row on the Daily screen.
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 260,
      }}
    />
  );
}
