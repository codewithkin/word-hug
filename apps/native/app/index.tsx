import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { hasOnboarded } from '@/lib/storage';

/**
 * ── / · the front door ────────────────────────────────────────────────────
 *
 * This route renders nothing. Its only job is to decide where a launch lands:
 * onboarding on a first run, the level map thereafter.
 *
 * ── Why it is its own file ────────────────────────────────────────────────
 * Session 6 put this gate at the top of the Daily screen, which was fine while
 * `/` and the daily puzzle were the same thing. Session 7 made the level map
 * the front door, and a gate living inside one of the two possible
 * destinations would have meant mounting the whole Daily board — its hook, its
 * storage reads, its entrance animations — purely to decide not to show it.
 *
 * ── Why the flag is read into state rather than called inline ─────────────
 * A conditional early return above hooks changes the hook count between
 * renders the moment the flag flips. Read once per mount, re-read on focus,
 * because `finishOnboarding` does `router.replace('/')` and this route may
 * still be mounted underneath rather than remounting.
 */
export default function Index() {
  const [onboarded, setOnboarded] = useState(() => hasOnboarded());

  useFocusEffect(
    useCallback(() => {
      setOnboarded(hasOnboarded());
    }, [])
  );

  return <Redirect href={onboarded ? '/home' : '/onboarding/welcome'} />;
}
