import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuietLink } from '@/components/actions';
import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Illustration } from '@/components/illustration';
import { EmptyBody } from '@/components/empty-state';
import { Appear } from '@/components/motion';
import { PuzzleGround } from '@/components/puzzle-ground';
import { ScreenHeader } from '@/components/screen-header';
import { useAppTheme } from '@/contexts/app-theme-context';


export default function StoreUnreachable() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-wh-ground">
      <PuzzleGround />

      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* A close cross, not a back chevron — the Shop is presented modally
            and this is how the design draws its dismissal. */}
        <ScreenHeader title="SHOP" glyph="×" onBack={() => router.back()} />

        <EmptyBody
          ornament={<Illustration name="offline" />}
          title="Can't reach the store"
          body="Prices come straight from your app store, and it isn't answering. Everything you already own still works."
        />

        <Appear delay={240} rise={12} className="items-center gap-3 px-6 pb-[10px]">
          <ChunkyPressable
            offset={5}
            shadowVar="--color-wh-primary-shadow"
            accessibilityRole="button"
            onPress={() => router.replace('/home')}
            accessibilityLabel="Try again"
            className="h-[60px] w-full items-center justify-center rounded-wh-lg bg-wh-primary"
          >
            <Text className="font-wh-bold text-wh-xxl tracking-wh-wide text-wh-on-primary">
              TRY AGAIN
            </Text>
          </ChunkyPressable>

          <QuietLink onPress={() => router.back()} label="Restore purchases" />
        </Appear>
      </View>
    </View>
  );
}
