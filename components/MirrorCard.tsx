import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { a11y, colors, fonts, typography } from '@/constants/tokens';

interface Props {
  label: string;  // "Зеркало дня" / "Зеркало недели"
  text: string;
}

// The reflective summary card shared by the report (day) and history (week)
// screens — identical sand sparkle + serif body, defined once.
export function MirrorCard({ label, text }: Props) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.sparkleIcon}>
          <Feather name="star" size={18} color={colors.bg} />
        </View>
        <View style={styles.textWrap}>
          <Text {...a11y.fixed} style={styles.label}>{label}</Text>
          <Text {...a11y.body}  style={styles.text}>{text}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  label: { ...typography.caption, color: colors.textDim, marginBottom: 6 },
  text:  { ...typography.bodyLg, fontFamily: fonts.serif, color: colors.text, lineHeight: 23 },
});
