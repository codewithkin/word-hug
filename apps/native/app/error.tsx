import { router } from 'expo-router';

import { ErrorView } from '@/components/error-view';

/**
 * `/error` — the error screen as a route.
 *
 * The screen itself is `components/error-view.tsx`, because the way anyone
 * will actually see it is the root layout's `ErrorBoundary`, not a
 * navigation. This route exists so it can be opened on purpose and looked at.
 *
 * "Try again" here has nothing to retry, so it does the same thing the button
 * means: it takes the person back to a working screen.
 */
export default function ErrorRoute() {
  return (
    <ErrorView
      onRetry={() => router.replace('/')}
      onHome={() => router.replace('/')}
    />
  );
}
