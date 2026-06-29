import React, { useEffect } from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { a11y, colors, fonts, typography } from '@/constants/tokens';

interface Props {
  icon?: React.ComponentProps<typeof Feather>['name'];
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
  pulse?: boolean;
  style?: ViewStyle;
}

export function EmptyState({ icon = 'sun', title, sub, action, onAction, pulse, style }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!pulse) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GlassCard style={[styles.card, style]} dimmer>
      <Animated.View style={pulse ? pulseStyle : undefined}>
        <Feather name={icon} size={26} color={colors.tealBorder} />
      </Animated.View>
      <Text {...a11y.body} style={styles.title}>{title}</Text>
      {sub ? <Text {...a11y.body} style={styles.sub}>{sub}</Text> : null}
      {action && onAction ? (
        <PrimaryButton label={action} onPress={onAction} variant="secondary" style={styles.btn} />
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  title: {
    ...typography.bodyLg,
    fontFamily: fonts.serif,
    color: colors.textDim,
    textAlign: 'center',
  },
  sub: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    marginTop: 4,
    alignSelf: 'stretch',
  },
});
