import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '@/constants/tokens';
import { EclipseMark } from '@/components/EclipseMark';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StepDots } from '@/components/StepDots';

export default function A1Welcome() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.skipRow}>
          <Pressable onPress={() => router.push('/onboarding/start')}>
            <Text style={styles.skip}>Пропустить</Text>
          </Pressable>
        </View>

        <FadeSlideIn delay={0} style={styles.hero}>
          <EclipseMark size={96} />
          <Text style={styles.brand}>Vigil</Text>
        </FadeSlideIn>

        <View style={styles.bottom}>
          <FadeSlideIn delay={140} style={styles.content}>
            <Text style={styles.title}>Возвращайся в момент —{'\n'}осознанно.</Text>
            <Text style={styles.subtitle}>
              Vigil мягко вытаскивает тебя из автопилота короткими вопросами в течение дня.
            </Text>
          </FadeSlideIn>

          <FadeSlideIn delay={280} style={styles.footer}>
            <StepDots total={4} active={0} />
            <PrimaryButton label="Дальше" onPress={() => router.push('/onboarding/modes')} />
          </FadeSlideIn>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22 },
  skipRow: { alignItems: 'flex-end', marginBottom: 8 },
  skip: { ...typography.body, color: colors.textMuted },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  brand: {
    ...typography.display,
    color: colors.text,
  },
  bottom: { gap: 32 },
  content: { gap: 12 },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.textDim,
    lineHeight: 22,
  },
  footer: { gap: 20 },
});
