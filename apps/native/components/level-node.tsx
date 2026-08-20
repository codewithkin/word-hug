import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Land } from '@/components/motion';

/**
 * One node on the level map.
 *
 * Three states, and the difference between them is the whole map:
 *
 * · **solved** — teal, the accent colour the app already uses for a finished
 *   thing (the celebration tiles, the solved board). A tick, not the number:
 *   the number stops mattering the moment it is done.
 * · **next** — amber, raised highest, and the only node that is drawn larger.
 *   There is exactly one of these on the map and a player should be able to
 *   find it without reading anything.
 * · **locked** — the sunken empty-tile treatment, with the number still
 *   legible. Deliberately not a padlock icon: a number you can see and cannot
 *   reach yet reads as a queue, and a padlock reads as a purchase.
 *
 * ── Why locked nodes are still pressable ──────────────────────────────────
 * They are not. But they carry a real accessibility label saying why, rather
 * than `disabled`, because "Level 34, locked, solve level 33 first" is a
 * useful sentence and "dimmed button" is not.
 */

export type LevelNodeState = 'solved' | 'next' | 'locked';

export interface LevelNodeProps {
  n: number;
  state: LevelNodeState;
  /** Staggered entrance index within its row. */
  index?: number;
  onPress?: () => void;
}

export function LevelNode({ n, state, index = 0, onPress }: LevelNodeProps) {
  if (state === 'locked') {
    return (
      <View
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={`Level ${n}, locked. Finish level ${n - 1} first.`}
        className="h-[62px] w-[62px] items-center justify-center"
      >
        <Chunky
          offset={3}
          inset
          shadowVar="--color-wh-answer-tile-empty-shadow"
          className="h-[54px] w-[54px] items-center justify-center rounded-wh-card bg-wh-answer-tile-empty"
        >
          <Text className="font-wh-heavy text-wh-base text-wh-text-whisper">{n}</Text>
        </Chunky>
      </View>
    );
  }

  if (state === 'solved') {
    return (
      <View className="h-[62px] w-[62px] items-center justify-center">
        <ChunkyPressable
          offset={4}
          shadowVar="--color-wh-accent-shadow"
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Level ${n}, solved. Play it again.`}
          className="h-[54px] w-[54px] items-center justify-center rounded-wh-card bg-wh-accent"
        >
          <Text className="font-wh-bold text-wh-xl text-wh-on-accent">✓</Text>
        </ChunkyPressable>
      </View>
    );
  }

  // The one node the eye should land on. `Land` rather than `Appear` — it is
  // the only overshoot on the map and it marks the place the player is.
  return (
    <Land delay={index * 40} className="h-[62px] w-[62px] items-center justify-center">
      <ChunkyPressable
        offset={6}
        shadowVar="--color-wh-primary-shadow"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Level ${n}. Play.`}
        className="h-[62px] w-[62px] items-center justify-center rounded-wh-card bg-wh-primary"
      >
        <Text className="font-wh-heavy text-wh-h3 text-wh-on-primary">{n}</Text>
      </ChunkyPressable>
    </Land>
  );
}
