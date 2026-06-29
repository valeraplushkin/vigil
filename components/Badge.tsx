import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { a11y, colors, radii, typography } from '@/constants/tokens';

type BadgeVariant = 'teal' | 'sand' | 'neutral';
type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface Props {
  label: string | number;
  variant?: BadgeVariant;
  icon?: FeatherName;
  iconColor?: string;       // overrides the variant's default icon color
  numberOfLines?: number;   // for long content (e.g. a goal chip)
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
  teal:    { bg: colors.tealBgStrong, border: colors.tealBorder,    text: colors.tealBright },
  sand:    { bg: colors.sandBg,       border: colors.sandBorder,    text: colors.sand       },
  neutral: { bg: colors.glassBg,      border: colors.glassBorderDim, text: colors.textDim   },
};

// Small pill label used across the app: report chips, "держался", the goal
// chip on the question screen, the streak badge, etc. One place for the pill.
export function Badge({ label, variant = 'neutral', icon, iconColor, numberOfLines, style }: Props) {
  const v = VARIANTS[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      {icon && <Feather name={icon} size={12} color={iconColor ?? v.text} />}
      <Text {...a11y.ui} numberOfLines={numberOfLines} style={[styles.label, { color: v.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    ...typography.caption,
  },
});
