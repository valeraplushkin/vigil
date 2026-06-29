import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { a11y, colors, radii, typography } from '@/constants/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;  // text shown while loading instead of a spinner
  icon?: FeatherName;     // trailing icon, hidden while disabled/loading
  style?: ViewStyle;
}

// The one button. Variants cover every CTA in the app; a disabled button
// always renders as the outline "ghost" treatment so the affordance stays
// visible (matches the question/goal disabled design).
export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  loadingLabel,
  icon,
  style,
}: Props) {
  const isInactive = disabled || loading;

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Disabled overrides the variant with the dimmed outline treatment.
  const containerVariant = disabled ? styles.disabled : styles[variant];
  const labelColor =
    disabled ? colors.textDisabled
    : variant === 'primary' ? colors.bgInk
    : variant === 'secondary' ? colors.teal
    : colors.textDim;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.btn,
        containerVariant,
        pressed && !isInactive && styles.pressed,
        style,
      ]}
    >
      {loading && !loadingLabel ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <>
          <Text {...a11y.ui} style={[styles.label, { color: labelColor }]}>
            {loading && loadingLabel ? loadingLabel : label}
          </Text>
          {icon && !isInactive && (
            <Animated.View entering={FadeIn.duration(180)}>
              <Feather name={icon} size={20} color={labelColor} />
            </Animated.View>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    minHeight: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  primary:   { backgroundColor: colors.tealBtn },
  secondary: { backgroundColor: colors.tealBg, borderWidth: 1, borderColor: colors.tealBorder },
  ghost:     { backgroundColor: colors.transparent, borderWidth: 1.5, borderColor: colors.glassBorder },
  disabled:  { backgroundColor: colors.transparent, borderWidth: 1.5, borderColor: colors.glassBorderDim },
  pressed:   { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label:     { ...typography.button },
});
