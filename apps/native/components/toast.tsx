import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';

/**
 * ── The inline notice ─────────────────────────────────────────────────────
 * Session 8. What the app says when an action could not happen.
 *
 * The owner reported tapping a priced hint with no coins and getting nothing —
 * the code returned early and the screen sat there. Silence is the worst
 * possible answer: the player cannot tell whether they missed the button, the
 * app froze, or something is broken.
 *
 * ── Why inline and not a system toast ─────────────────────────────────────
 * `ToastAndroid` is Android-only and looks like the OS rather than like Word
 * Hug. This is the same chunky surface as everything else, sits in the board's
 * own flow, and can carry an action — "Out of coins · Get some" — which a
 * system toast cannot.
 *
 * ── Why it is not a modal ─────────────────────────────────────────────────
 * Running out of coins does not stop you playing; it stops you buying a hint.
 * Rule 3 says never interrupt the solve, so this appears under the board,
 * leaves everything above it live, and fades itself out.
 */

export type ToastTone =
  /** Something is unavailable. Amber, because it is an obstacle, not a fault. */
  | 'blocked'
  /** Something worked. Teal, the app's colour for a finished thing. */
  | 'done';

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  /** Optional trailing action, e.g. "Get some" → the shop. */
  actionLabel?: string;
  onAction?: () => void;
}

export function Toast({ message, tone = 'blocked', actionLabel, onAction }: ToastProps) {
  const done = tone === 'done';

  return (
    <Appear rise={6} className="items-center px-[22px] pt-2">
      <Chunky
        offset={3}
        shadowVar={done ? '--color-wh-accent-shadow' : '--color-wh-primary-shadow'}
        className={
          done
            ? 'flex-row items-center gap-3 rounded-wh-pill bg-wh-accent px-[16px] py-[9px]'
            : 'flex-row items-center gap-3 rounded-wh-pill bg-wh-primary px-[16px] py-[9px]'
        }
      >
        <Text
          className={
            done
              ? 'font-wh-bold text-wh-base text-wh-on-accent'
              : 'font-wh-bold text-wh-base text-wh-on-primary'
          }
        >
          {message}
        </Text>

        {actionLabel ? (
          <ChunkyPressable
            offset={2}
            shadowVar="--color-wh-surface-shadow"
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            className="rounded-wh-pill bg-wh-surface px-3 py-[3px]"
          >
            <Text className="font-wh-heavy text-wh-sm text-wh-pill-text">{actionLabel}</Text>
          </ChunkyPressable>
        ) : null}
      </Chunky>
    </Appear>
  );
}

/**
 * A toast that clears itself.
 *
 * `show(message)` from anywhere in a screen; the component renders null until
 * there is something to say. Four seconds is long enough to read a short
 * sentence twice and short enough not to sit under the board while someone is
 * thinking.
 */
export function useToast(ms = 4000) {
  const [toast, setToast] = useState<ToastProps | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(id);
  }, [toast, ms]);

  return {
    toast,
    show: (next: ToastProps) => setToast(next),
    clear: () => setToast(null),
    /** Render this where the notice belongs in the layout. */
    node: toast ? <Toast {...toast} /> : null,
  };
}
