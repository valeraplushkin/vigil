import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, layout, radii } from '@/constants/tokens';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  dimmer?: boolean;
}

export function GlassCard({ children, style, radius = radii.xl, dimmer = false }: Props) {
  return (
    <View style={[
      styles.card,
      { borderRadius: radius },
      dimmer && styles.dimmer,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: layout.cardPadding,
  },
  dimmer: {
    backgroundColor: colors.glassBgDim,
    borderColor: colors.glassBorderDim,
  },
});
