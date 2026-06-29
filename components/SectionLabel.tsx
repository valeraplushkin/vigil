import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { a11y, colors, typography } from '@/constants/tokens';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

// Single source of truth for the uppercase section headers used across
// profile / settings / history / privacy. Pass `style` only for spacing
// overrides (e.g. marginTop) — never to restyle the type.
export function SectionLabel({ children, style }: Props) {
  return (
    <Text {...a11y.fixed} style={[styles.label, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.overline,
    color: colors.textMuted,
    marginTop: 4,
  },
});
