import { Pressable, Text } from 'react-native';

import { ChunkyPressable } from '@/components/chunky';

/**
 * The two buttons that end a screen.
 *
 * Every full-width screen in the export finishes the same way: one amber
 * button, and — where there is a way out — one quiet underlined line of text
 * beneath it. CONTINUE / ALLOW / START / TRY AGAIN are the same object with a
 * different word in it, so they are the same component.
 *
 * Built from `04-welcome`, `06-the-ritual`, `07-notification-priming`,
 * `08-drop-in` and `02-error`, all in both themes.
 *
 * The pairing is the product's manners in miniature: the amber button is
 * always the thing that costs the person nothing, and the way to decline is
 * always present, never hidden, and never styled to look broken.
 */

export interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  /** Overrides the accessibility label when the visible text is shouty. */
  accessibilityLabel?: string;
}

export function PrimaryButton({ label, onPress, accessibilityLabel }: PrimaryButtonProps) {
  return (
    <ChunkyPressable
      offset={5}
      shadowVar="--color-wh-primary-shadow"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      className="h-[62px] items-center justify-center rounded-wh-lg bg-wh-primary"
    >
      {/* 23px is the designs' own size and is not on the ramp — the nearest
          token is 22, and rounding a design to fit a scale is how a scale
          stops describing the design. */}
      <Text className="font-wh-bold text-[23px] tracking-wh-wide text-wh-on-primary">{label}</Text>
    </ChunkyPressable>
  );
}

export interface QuietLinkProps {
  label: string;
  onPress?: () => void;
}

/**
 * "Not now" / "Back to today's puzzle".
 *
 * The 2.5px rule under it is drawn as a bottom border on the text, exactly as
 * the design does, rather than as a separate underlined View — an underline
 * that does not track the text's width looks like a mistake at every font
 * scale but the one it was measured at.
 */
export function QuietLink({ label, onPress }: QuietLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // The tap target is the text plus a comfortable margin. The design shows
      // the rule tight under the words; the finger does not have to be.
      hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      className="self-center"
    >
      <Text className="border-b-[2.5px] border-wh-link-rule pb-[2px] font-wh-heavy text-[15px] text-wh-text-quiet">
        {label}
      </Text>
    </Pressable>
  );
}
