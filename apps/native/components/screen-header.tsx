import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ChunkyPressable } from '@/components/chunky';
import { Appear } from '@/components/motion';

/**
 * The header on Settings (16), How to Play (17) and Stats (18): a back button,
 * a shouted title, and nothing on the right.
 *
 * Built from those three design files, both themes. The empty 46px box on the
 * right is in all of them and is kept — it is what centres the title. Dropping
 * it and centring with `justify-center` would put the title in the middle of
 * the *remaining* space, which is 23px off, which is exactly the kind of
 * wrongness nobody can name but everybody sees.
 *
 * The titles really are capitalised in the content — "SETTINGS", "HOW TO PLAY"
 * — rather than uppercased by a transform, so they are written that way here
 * too. `textTransform` on a custom font family is one more thing that can go
 * wrong on Android for no benefit.
 */
export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <Appear rise={-6} className="h-[60px] flex-row items-center justify-between px-[18px] pt-[6px]">
      <ChunkyPressable
        offset={3}
        shadowVar="--color-wh-surface-shadow"
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="h-[46px] w-[46px] items-center justify-center rounded-wh-card bg-wh-surface"
      >
        <Text className="pb-1 font-wh-bold text-wh-h2 leading-none text-wh-text-faint dark:text-wh-text-secondary">
          ‹
        </Text>
      </ChunkyPressable>

      <Text className="font-wh-bold text-wh-h2 text-wh-clue-text">{title}</Text>

      {/* Not decoration — the counterweight that keeps the title centred. */}
      <View className="h-[46px] w-[46px]" />
    </Appear>
  );
}
