import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { EclipseMark } from '@/components/EclipseMark';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionLabel } from '@/components/SectionLabel';
import { FadeIn } from '@/components/motion';
import { springs } from '@/constants/motion';
import { a11y, colors, layout, radii, typography } from '@/constants/tokens';
import { useApp } from '@/context/AppContext';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { haptics } from '@/lib/haptics';

const TONES = [
  { key: 'gentle',  label: 'Мягкий',     desc: 'Тёплые, деликатные вопросы'       },
  { key: 'direct',  label: 'Прямой',      desc: 'Чёткие, конкретные вопросы'        },
  { key: 'curious', label: 'Любопытный',  desc: 'Открытые, исследовательские вопросы' },
] as const;

// Separate component so hooks don't run inside .map()
function ToneItem({
  t,
  isActive,
  onPress,
}: {
  t: typeof TONES[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    haptics.selection();
    scale.value = withSequence(
      withSpring(1.025, springs.pop),
      withSpring(1.0,   springs.settle),
    );
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[styles.toneItem, isActive && styles.toneItemActive]}
      >
        <View style={styles.toneText}>
          <Text {...a11y.ui}   style={[styles.toneName, isActive && styles.toneNameActive]}>
            {t.label}
          </Text>
          <Text {...a11y.body} style={styles.toneDesc}>{t.desc}</Text>
        </View>
        {isActive && <Feather name="check" size={16} color={colors.teal} />}
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, answers, streak } = useApp();

  const totalAnswers = answers.length;
  const activeDays   = new Set(answers.map(a => a.date)).size;
  const contextEmpty = profile.aiContext.trim().length === 0;

  // Count-up animation: staggered 0 / 100 / 200ms
  const [counts, setCounts] = useState([0, 0, 0]);
  useEffect(() => {
    const targets = [totalAnswers, activeDays, streak.longest];
    const handles: ReturnType<typeof setTimeout>[] = [];

    targets.forEach((target, i) => {
      const h = setTimeout(() => {
        if (target === 0) return;
        const dur   = 500;
        const start = Date.now();
        let raf: ReturnType<typeof requestAnimationFrame>;
        const tick = () => {
          const t     = Math.min((Date.now() - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setCounts(prev => {
            const next = [...prev];
            next[i] = Math.round(eased * target);
            return next;
          });
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }, i * 110);
      handles.push(h);
    });

    return () => handles.forEach(clearTimeout);
  }, [totalAnswers, activeDays, streak.longest]);

  // EclipseMark breathing — respects reduce-motion (shared gate)
  const reduceMotion = useReduceMotion();
  const breathScale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      breathScale.value = 1;
      return;
    }
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,   { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduceMotion]);
  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <ScreenTitle>Профиль</ScreenTitle>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.gearBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="settings" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FadeIn delay={0}>
          <View style={styles.avatarSection}>
            <Animated.View style={breathStyle}>
              <EclipseMark size={64} />
            </Animated.View>
            <View style={styles.statsRow}>
              <Pressable
                style={styles.stat}
                onPress={() => router.push('/(tabs)/history')}
              >
                <Text {...a11y.ui}    style={styles.statNum}>{counts[0]}</Text>
                <Text {...a11y.fixed} style={styles.statLabel}>ответов</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable
                style={styles.stat}
                onPress={() => router.push('/(tabs)/history')}
              >
                <Text {...a11y.ui}    style={styles.statNum}>{counts[1]}</Text>
                <Text {...a11y.fixed} style={styles.statLabel}>дней</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable
                style={styles.stat}
                onPress={() => router.push('/(tabs)/history')}
              >
                {streak.longest > 0 ? (
                  <View style={styles.statStreakRow}>
                    <Feather name="award" size={16} color={colors.sand} />
                    <Text {...a11y.ui} style={styles.statStreakNum}>{counts[2]}</Text>
                  </View>
                ) : (
                  <Text {...a11y.ui} style={styles.statStreakNum}>—</Text>
                )}
                <Text {...a11y.fixed} style={styles.statLabel}>рекорд</Text>
              </Pressable>
            </View>
          </View>
          </FadeIn>

          <FadeIn delay={70}>
          <SectionLabel>Контекст для ИИ</SectionLabel>
          </FadeIn>
          <FadeIn delay={70}>
          <GlassCard style={[styles.contextCard, contextEmpty && styles.contextCardNudge]}>
            <Text {...a11y.body} style={styles.contextHint}>
              Расскажи немного о себе — ИИ учтёт это при генерации вопросов. Что важно в твоей жизни, чем занимаешься, что хочешь замечать?
            </Text>
            <TextInput
              value={profile.aiContext}
              onChangeText={text => updateProfile({ aiContext: text })}
              placeholder="Например: я дизайнер, работаю над запуском продукта, хочу меньше отвлекаться на соцсети и замечать, когда теряю фокус."
              placeholderTextColor={colors.placeholder}
              multiline
              style={styles.contextInput}
              textAlignVertical="top"
            />
            {contextEmpty ? (
              <View style={styles.contextNudge}>
                <Feather name="zap" size={13} color={colors.teal} />
                <Text style={styles.contextNudgeText}>
                  Пара слов о себе — и вопросы станут точнее.
                </Text>
              </View>
            ) : (
              <Text style={styles.contextFooter}>
                Только ты решаешь, что писать. Можно оставить пустым.
              </Text>
            )}
          </GlassCard>
          </FadeIn>

          <FadeIn delay={150}>
          <SectionLabel>Тон вопросов</SectionLabel>
          </FadeIn>
          <FadeIn delay={150}>
          <GlassCard style={styles.toneCard}>
            {TONES.map(t => (
              <ToneItem
                key={t.key}
                t={t}
                isActive={profile.tone === t.key}
                onPress={() => updateProfile({ tone: t.key })}
              />
            ))}
          </GlassCard>
          </FadeIn>

          <FadeIn delay={230}>
          <SectionLabel>Приватность</SectionLabel>
          </FadeIn>
          <FadeIn delay={230}>
          <GlassCard style={styles.privacyCard}>
            <Pressable
              style={({ pressed }) => [styles.privacyRow, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/privacy')}
            >
              <View style={styles.privacyLeft}>
                <Feather name="shield" size={14} color={colors.teal} />
                <Text style={styles.privacyTitle}>Что уходит в ИИ</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.textFaint} />
            </Pressable>
          </GlassCard>
          </FadeIn>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 4,
  },
  gearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll:  { paddingHorizontal: layout.screenPadding, gap: layout.cardGap, paddingTop: 8 },
  avatarSection: { alignItems: 'center', gap: 22, paddingVertical: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stat:     { alignItems: 'center', gap: 3 },
  statNum:       { ...typography.numLg, color: colors.text },
  statStreakNum: { ...typography.numLg, color: colors.sand },
  statStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel:     { ...typography.bodySm, color: colors.textMuted },
  statDivider:   { width: 1, height: 28, backgroundColor: colors.glassBorderDim },
  contextCard: { gap: 12 },
  contextCardNudge: { borderColor: colors.tealBorder },
  contextHint: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  contextInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    lineHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorderDim,
    paddingBottom: 10,
    paddingTop: 4,
  },
  contextFooter: {
    ...typography.caption,
    color: colors.textMuted,
  },
  contextNudge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  contextNudgeText: { ...typography.caption, color: colors.teal, flex: 1 },
  toneCard:      { gap: 2, padding: 8 },
  toneItem:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14 },
  toneItemActive:{ backgroundColor: colors.tealBg },
  toneText: { flex: 1, gap: 2 },
  toneName:       { ...typography.label, color: colors.textDim },
  toneNameActive: { color: colors.teal },
  toneDesc: { ...typography.caption, color: colors.textMuted },
  privacyCard: { gap: 0 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  privacyLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyTitle: { ...typography.label, color: colors.text },
});
