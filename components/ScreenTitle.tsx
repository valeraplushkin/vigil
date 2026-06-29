import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { a11y, colors, typography } from '@/constants/tokens';

interface Props {
  children: React.ReactNode;
  // Spread a different scale token (e.g. typography.h2) or tweak lineHeight /
  // fontFamily for the few title variants. Defaults to h1 + textBright.
  style?: StyleProp<TextStyle>;
}

export function ScreenTitle({ children, style }: Props) {
  return (
    <Text {...a11y.heading} style={[styles.title, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.textBright,
  },
});
