import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Sheet } from '@/components/sheet';
import { PACKS } from '@/content/packs';
import { getOwnedPacks } from '@/lib/storage';

/**
 * ── Overlay G · Restore result ────────────────────────────────────────────
 * Session 7. No design file — assembled from the sheet, the tokens and the
 * manners of overlays B and C.
 *
 * Two outcomes and one screen, because "we found nothing" is not an error and
 * must not look like one. A person who taps Restore having never bought
 * anything has done nothing wrong; a person who reinstalled and got their
 * packs back deserves a plain sentence, not a celebration.
 *
 * ── The line that has to stay ─────────────────────────────────────────────
 * "Your coins came back too." Reinstalling restores the full purchased coin
 * balance, ignoring prior spend — that is the decision in
 * `systems/storage-persistence.md` §7 and it is unusually generous, so the
 * screen says it rather than leaving the player to notice.
 *
 * ── Not wired to RevenueCat ───────────────────────────────────────────────
 * `react-native-purchases` is installed and unconfigured, so this reports what
 * is in local storage. When entitlements are real, `getOwnedPacks()` becomes a
 * RevenueCat call and this screen does not otherwise change.
 */
export default function RestoreResult() {
  const owned = getOwnedPacks();
  const names = PACKS.filter((p) => owned.includes(p.id)).map((p) => p.name);
  const found = names.length > 0;

  return (
    <Sheet onDismiss={() => router.back()}>
      <Text className="font-wh-bold text-wh-h3 text-wh-clue-text">
        {found ? 'Everything is back' : 'Nothing to restore'}
      </Text>

      <Text className="font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
        {found
          ? 'Your packs are unlocked again. Your coins came back too — the full amount you bought, whatever you had spent.'
          : "We couldn't find any previous purchases on this account. Nothing is lost — the daily puzzle and the first levels are free either way."}
      </Text>

      {found ? (
        <View className="gap-[9px]">
          {names.map((name) => (
            <View
              key={name}
              className="flex-row items-center gap-3 rounded-[18px] bg-wh-surface-inset px-[14px] py-[13px] dark:bg-wh-answer-tile-active"
            >
              <Chunky
                offset={3}
                shadowVar="--color-wh-accent-shadow"
                className="h-[30px] w-[30px] items-center justify-center rounded-wh-sm bg-wh-accent"
              >
                <Text className="font-wh-bold text-wh-base text-wh-on-accent">✓</Text>
              </Chunky>
              <Text className="flex-1 font-wh-bold text-[15.5px] text-wh-clue-text">{name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <ChunkyPressable
        offset={4}
        shadowVar={found ? '--color-wh-primary-shadow' : '--color-wh-surface-shadow'}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={found ? 'Done' : 'Close'}
        className={
          found
            ? 'h-[58px] items-center justify-center rounded-[19px] bg-wh-primary'
            : 'h-[58px] items-center justify-center rounded-[19px] bg-wh-surface'
        }
      >
        <Text
          className={
            found
              ? 'font-wh-bold text-wh-xl text-wh-on-primary'
              : 'font-wh-bold text-wh-xl text-wh-text-muted dark:text-wh-pill-text'
          }
        >
          {found ? 'Done' : 'Close'}
        </Text>
      </ChunkyPressable>
    </Sheet>
  );
}
