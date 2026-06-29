import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AttentionViz } from '@/components/AttentionViz';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { GoalDoneBurst } from '@/components/GoalDoneBurst';
import { GradientBackground } from '@/components/GradientBackground';
import { MilestoneModal } from '@/components/MilestoneModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StreakBadge } from '@/components/StreakBadge';
import { FadeIn } from '@/components/motion';
import { a11y, colors, layout, radii, typography } from '@/constants/tokens';
import { useApp } from '@/context/AppContext';
import { AnswerState, Settings } from '@/types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Доброе утро';
  if (h < 17) return 'Добрый день';
  return 'Добрый вечер';
}

function formatDate(): string {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(new Date());
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Soft estimate of the day's rhythm from the notification window + frequency.
// Phrased with ≈ since there's no exact per-minute schedule.
function nextQuestionHint(s: Settings): string {
  if (!s.notificationsEnabled) return 'Уведомления выключены — спрашивай сам';
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < s.windowStart) return `Первый вопрос — после ${pad(s.windowStart)}:00`;
  if (h >= s.windowEnd) return 'На сегодня всё — вопросы вернутся утром';
  const perDay = s.frequency === 'low' ? 3 : s.frequency === 'high' ? 8 : 5;
  const interval = (s.windowEnd - s.windowStart) / perDay;
  const nextH = Math.min(h + interval, s.windowEnd);
  const deltaMin = Math.round((nextH - h) * 60);
  if (deltaMin <= 20) return 'Следующая минутка — совсем скоро';
  if (deltaMin < 60) return `Следующая минутка ≈ через ${deltaMin} мин`;
  return `Следующая минутка ≈ ${pad(Math.round(nextH))}:00`;
}

const LEGEND = [
  { color: colors.teal, label: 'фокус' },
  { color: colors.textMuted, label: 'пауза' },
  { color: colors.sand, label: 'дрейф' },
] as const;

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { mode, currentGoal, getTodayAnswers, streak, pendingMilestone, markMilestoneSeen, settings, markGoalDone } = useApp();
  const [justDone, setJustDone] = useState(false);

  const completeGoalFromHero = () => {
    if (mode !== 'active' || !currentGoal) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markGoalDone(currentGoal.id);
    setJustDone(true);
  };

  const todayAnswers = getTodayAnswers();
  const focusCount = todayAnswers.filter(a => a.state === 'focus').length;
  const total = todayAnswers.length;

  const answersWithTs = useMemo(() =>
    todayAnswers
      .filter((a): a is typeof a & { state: AnswerState } => a.state !== null)
      .map(a => ({ state: a.state, timestamp: a.timestamp })),
    [todayAnswers]
  );

  const nextHint = nextQuestionHint(settings);

  // Pulse the goal-hero border once when the goal changed since we last left
  // this screen (set / edited / completed elsewhere).
  const heroPulse = useSharedValue(0);
  const lastGoalText = useRef<string | null>(currentGoal?.text ?? null);
  useFocusEffect(
    useCallback(() => {
      const cur = currentGoal?.text ?? null;
      if (cur !== lastGoalText.current) {
        lastGoalText.current = cur;
        if (cur) {
          heroPulse.value = withSequence(
            withTiming(1, { duration: 180 }),
            withTiming(0, { duration: 320 }),
          );
        }
      }
    }, [currentGoal?.text]),
  );
  const heroPulseStyle = useAnimatedStyle(() => ({ opacity: heroPulse.value }));

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text {...a11y.heading} style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.dateRow}>
              <Text {...a11y.ui} style={styles.date}>{capitalize(formatDate())}</Text>
              {streak.current > 0 && (
                <StreakBadge count={streak.current} />
              )}
            </View>
          </View>
          <View style={styles.headerBtns}>
            <Pressable
              onPress={() => router.push('/settings')}
              style={styles.headerBtn}
              accessibilityLabel="Настройки"
            >
              <Feather name="settings" size={18} color={colors.textDim} />
            </Pressable>
          </View>
        </View>

        <MilestoneModal
          milestone={pendingMilestone}
          onDismiss={() => pendingMilestone !== null && markMilestoneSeen(pendingMilestone)}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <FadeIn delay={0}>
          <Pressable
            onPress={() => router.push('/(tabs)/goal')}
            onLongPress={mode === 'active' && currentGoal ? completeGoalFromHero : undefined}
            delayLongPress={500}
            accessibilityLabel={mode === 'active' ? 'Цель дня' : 'Режим осознанности'}
            accessibilityHint={mode === 'active' && currentGoal ? 'Удерживайте, чтобы отметить цель выполненной' : undefined}
          >
            <GlassCard style={styles.goalHero}>
              <View style={styles.goalHeroTop}>
                <View style={styles.goalIconRing}>
                  <Feather name={mode === 'active' ? 'target' : 'wind'} size={22} color={colors.teal} />
                </View>
                {mode === 'active'
                  ? (currentGoal
                      ? <Badge variant="teal" label="В работе" />
                      : <Badge variant="neutral" label="Цель не задана" />)
                  : <Badge variant="neutral" label="Осознанность" />}
                <Feather name="chevron-right" size={18} color={colors.textFaint} style={styles.goalHeroChevron} />
              </View>
              <Text style={styles.goalHeroText} numberOfLines={3}>
                {mode === 'active'
                  ? (currentGoal ? currentGoal.text : 'Поставь цель на сегодня')
                  : 'Наблюдаю за вниманием в течение дня'}
              </Text>
            </GlassCard>
            <Reanimated.View pointerEvents="none" style={[styles.heroPulse, heroPulseStyle]} />
          </Pressable>
          </FadeIn>

          {total > 0 && (
            <FadeIn delay={70}>
            <GlassCard style={styles.attCard}>
              <View style={styles.attHeader}>
                <Text style={styles.attTitle}>Внимание сегодня</Text>
                <Pressable
                  onPress={() => router.push('/report')}
                  hitSlop={10}
                  accessibilityLabel="Открыть отчёт дня"
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <Feather name="sliders" size={15} color={colors.textDim} />
                </Pressable>
              </View>
              <AttentionViz variant="dots" answers={answersWithTs} />
              <View style={styles.legend}>
                {LEGEND.map(item => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.attFooter}>
                <View style={styles.attSummary}>
                  <Text style={styles.attSummaryTitle}>
                    {focusCount > total / 2 ? 'Держишься' : 'Следишь за собой'}
                  </Text>
                  <Text style={styles.attSummaryDesc}>
                    {focusCount} раз в фокусе, {todayAnswers.filter(a => a.state === 'drift').length} дрейфов
                  </Text>
                </View>
              </View>
            </GlassCard>
            </FadeIn>
          )}

          {total === 0 && (
            <FadeIn delay={70}>
            <EmptyState
              icon="zap"
              title="Первый вопрос дня ждёт"
              sub="Нажми молнию вверху или кнопку ниже — это займёт секунду."
              action="Спросить сейчас"
              onAction={() => router.push('/question')}
              pulse
            />
            </FadeIn>
          )}

          {total > 0 && (
            <FadeIn delay={140}>
            <View style={styles.ctaBlock}>
              <View style={styles.nextHint}>
                <Feather name="clock" size={13} color={colors.textMuted} />
                <Text {...a11y.fixed} style={styles.nextHintText}>{nextHint}</Text>
              </View>
              <PrimaryButton label="Спросить сейчас" icon="zap" onPress={() => router.push('/question')} />
            </View>
            </FadeIn>
          )}
        </ScrollView>
      </View>

      {justDone && <GoalDoneBurst onComplete={() => setJustDone(false)} />}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: { flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  greeting: { ...typography.h1, color: colors.textBright, lineHeight: 36 },
  date: { ...typography.caption, color: colors.textMuted },
  headerBtns: { flexDirection: 'row', gap: 9, marginTop: 4 },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorderDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: layout.screenPadding, gap: layout.cardGap },
  goalHero: { padding: 18, gap: 14 },
  heroPulse: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.teal,
  },
  goalHeroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalHeroChevron: { marginLeft: 'auto' },
  goalIconRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: colors.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalHeroText: { ...typography.h2, color: colors.textBright, lineHeight: 30 },
  attCard: { gap: 13, padding: 15 },
  attHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attTitle: { ...typography.bodySm, color: colors.text },
  legend: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  attFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorderDim,
  },
  attSummary: { gap: 1 },
  attSummaryTitle: { ...typography.bodySm, color: colors.textBright },
  attSummaryDesc: { ...typography.caption, color: colors.textMuted },
  ctaBlock: { gap: 10 },
  nextHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  nextHintText: { ...typography.caption, color: colors.textMuted },
});
