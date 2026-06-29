import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AttentionViz } from '@/components/AttentionViz';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { HistorySkeleton } from '@/components/HistorySkeleton';
import { MirrorCard } from '@/components/MirrorCard';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionLabel } from '@/components/SectionLabel';
import { FadeIn, ScaleIn } from '@/components/motion';
import { colors, fonts, layout, radii, typography } from '@/constants/tokens';
import { springs } from '@/constants/motion';
import { useApp } from '@/context/AppContext';
import { AnswerState } from '@/types';

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50;

function getWeekDays(offset: number): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i - offset * 7);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDayFull(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
}

function weekLabel(offset: number, weekDays: string[]): string {
  if (offset === 0) return 'Эта неделя';
  if (offset === 1) return 'Прошлая';
  const d0 = new Date(weekDays[0] + 'T12:00:00');
  const d6 = new Date(weekDays[6] + 'T12:00:00');
  const day = (d: Date) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric' }).format(d);
  const mon = (d: Date) => new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d).replace('.', '');
  return d0.getMonth() === d6.getMonth()
    ? `${day(d0)}–${day(d6)} ${mon(d6)}`
    : `${day(d0)} ${mon(d0)} – ${day(d6)} ${mon(d6)}`;
}

function getMirrorWeek(focusPct: number, driftPct: number, total: number, isPast: boolean): string {
  if (total === 0) return isPast ? 'На прошлой неделе нет ответов.' : 'На этой неделе ещё нет ответов.';
  if (focusPct >= 0.6) return 'Во второй половине дня ты чаще был в фокусе — хороший паттерн.';
  if (driftPct >= 0.4) return 'Эта неделя была насыщенной. Замечать, когда уносит — уже навык.';
  return 'Неделя была разной. Каждый день, когда останавливаешься — это уже осознанность.';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { getAnswersByDate, goals, answers, isReady } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const [weekOffset, setWeekOffset] = useState(0);
  const isPast = weekOffset > 0;

  // How far back the user can page — bounded by their earliest recorded day.
  const maxOffset = useMemo(() => {
    const dates = [...answers.map(a => a.date), ...goals.map(g => g.date)];
    if (dates.length === 0) return 0;
    const earliest = dates.reduce((m, d) => (d < m ? d : m), today);
    const days = Math.round(
      (new Date(today + 'T12:00:00').getTime() - new Date(earliest + 'T12:00:00').getTime()) / 86_400_000,
    );
    return Math.max(0, Math.floor(days / 7));
  }, [answers, goals, today]);

  const canOlder = weekOffset < maxOffset;
  const canNewer = weekOffset > 0;

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const monthDays = useMemo(() => getLastNDays(30), []);

  const chartDays = useMemo(() =>
    weekDays.map(date => ({
      date,
      answers: getAnswersByDate(date)
        .filter((a): a is typeof a & { state: AnswerState } => a.state !== null),
      isToday: date === today,
    })),
    [weekDays, getAnswersByDate, today],
  );

  const weekAnswers = useMemo(() =>
    weekDays.flatMap(d => getAnswersByDate(d)),
    [weekDays, getAnswersByDate],
  );

  const daysWithAnswers = weekDays.filter(d => getAnswersByDate(d).length > 0).length;
  const totalWeek = weekAnswers.length;
  const focusWeek = weekAnswers.filter(a => a.state === 'focus').length;
  const driftWeek = weekAnswers.filter(a => a.state === 'drift').length;
  const fp = totalWeek > 0 ? focusWeek / totalWeek : 0;
  const dp = totalWeek > 0 ? driftWeek / totalWeek : 0;

  const weekMirror = getMirrorWeek(fp, dp, totalWeek, isPast);

  const hasAnyData = monthDays.some(d => getAnswersByDate(d).length > 0);
  const visibleDates = useMemo(
    () => [...monthDays].reverse().filter(d => getAnswersByDate(d).length > 0),
    [monthDays, getAnswersByDate],
  );

  const loading = !isReady;   // real readiness, not an artificial delay

  // ── Week navigation (chevrons + horizontal swipe, directional slide) ──
  const tx = useSharedValue(0);
  const op = useSharedValue(1);
  const weekStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: op.value,
  }));

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const commitWeek = (newOffset: number, exitSign: number) => {
    setWeekOffset(newOffset);
    tx.value = -exitSign * SCREEN_W;
    op.value = 0;
    tx.value = withSpring(0, springs.default);
    op.value = withTiming(1, { duration: 240 });
  };

  // exitSign: -1 = slide out left (→ newer week), +1 = slide out right (→ older)
  const slide = (exitSign: number, newOffset: number) => {
    haptic();
    op.value = withTiming(0, { duration: 160 });
    tx.value = withTiming(exitSign * SCREEN_W, { duration: 160 }, finished => {
      if (finished) runOnJS(commitWeek)(newOffset, exitSign);
    });
  };

  const goOlder = () => { if (weekOffset < maxOffset) slide(+1, weekOffset + 1); };
  const goNewer = () => { if (weekOffset > 0) slide(-1, weekOffset - 1); };

  const weekPan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-14, 14])
    .onUpdate(e => {
      'worklet';
      let dx = e.translationX;
      if ((dx < 0 && weekOffset <= 0) || (dx > 0 && weekOffset >= maxOffset)) dx *= 0.25;
      tx.value = dx;
    })
    .onEnd(e => {
      'worklet';
      const dx = e.translationX;
      if (dx <= -SWIPE_THRESHOLD && weekOffset > 0) {
        runOnJS(slide)(-1, weekOffset - 1);
      } else if (dx >= SWIPE_THRESHOLD && weekOffset < maxOffset) {
        runOnJS(slide)(+1, weekOffset + 1);
      } else {
        tx.value = withSpring(0, springs.default);
      }
    });

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <ScreenTitle>История</ScreenTitle>
          <View style={[styles.weekNav, isPast && styles.weekNavPast]}>
            <Pressable
              onPress={goOlder}
              disabled={!canOlder}
              hitSlop={8}
              accessibilityLabel="Неделей раньше"
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Feather name="chevron-left" size={16} color={canOlder ? colors.teal : colors.textFaint} />
            </Pressable>
            <Text style={[styles.weekNavLabel, isPast && styles.weekNavLabelPast]} numberOfLines={1}>
              {weekLabel(weekOffset, weekDays)}
            </Text>
            <Pressable
              onPress={goNewer}
              disabled={!canNewer}
              hitSlop={8}
              accessibilityLabel="Неделей позже"
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Feather name="chevron-right" size={16} color={canNewer ? colors.teal : colors.textFaint} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <HistorySkeleton />
          ) : hasAnyData ? (
            <>
              <GestureDetector gesture={weekPan}>
              <Reanimated.View style={[styles.weekSection, weekStyle]}>
              <ScaleIn delay={0}>
              <GlassCard style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartIconRing}>
                    <Feather name="wind" size={17} color={colors.teal} />
                  </View>
                  <Text style={styles.chartTitle}>Внимание за неделю</Text>
                </View>
                <AttentionViz
                  variant="bars"
                  days={chartDays}
                  onDayPress={date => router.push({ pathname: '/report', params: { date } })}
                />
              </GlassCard>
              </ScaleIn>

              <FadeIn delay={80}>
              <View style={styles.twoCol}>
                <GlassCard style={styles.halfCard}>
                  <Text style={styles.halfLabel}>{isPast ? 'На прошлой неделе' : 'На этой неделе'}</Text>
                  <View style={styles.dotRow}>
                    {weekDays.map(date => (
                      <View
                        key={date}
                        style={[
                          styles.dot,
                          getAnswersByDate(date).length > 0 ? styles.dotFilled : styles.dotEmpty,
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.halfStat}>
                    <Text style={styles.halfStatNum}>{daysWithAnswers}</Text>
                    {' '}дней с минутками
                  </Text>
                </GlassCard>

                <GlassCard style={styles.halfCard}>
                  <Text style={styles.halfLabel}>Где было внимание</Text>
                  {totalWeek === 0 ? (
                    <Text style={styles.pctEmpty}>Ответь на первый вопрос — и здесь появится картина.</Text>
                  ) : (
                    <View style={styles.pctList}>
                      <View style={styles.pctItem}>
                        <View style={[styles.pctDot, { backgroundColor: colors.tealDeep }]} />
                        <Text style={styles.pctName}>В фокусе</Text>
                        <Text style={styles.pctVal}>{Math.round(fp * 100)}%</Text>
                      </View>
                      <View style={styles.pctItem}>
                        <View style={[styles.pctDot, { backgroundColor: colors.sand }]} />
                        <Text style={styles.pctName}>Дрейф</Text>
                        <Text style={styles.pctVal}>{Math.round(dp * 100)}%</Text>
                      </View>
                      <View style={styles.pctItem}>
                        <View style={[styles.pctDot, { backgroundColor: colors.textFaint }]} />
                        <Text style={styles.pctName}>Пауза</Text>
                        <Text style={styles.pctVal}>{Math.round((1 - fp - dp) * 100)}%</Text>
                      </View>
                    </View>
                  )}
                </GlassCard>
              </View>
              </FadeIn>

              {totalWeek > 0 && (
                <FadeIn delay={360}>
                <MirrorCard label="Зеркало недели" text={weekMirror} />
                </FadeIn>
              )}
              </Reanimated.View>
              </GestureDetector>

              <FadeIn delay={220}>
              <SectionLabel>Хроника</SectionLabel>
              </FadeIn>

              {visibleDates.map((date, rowIdx) => {
                const answers = getAnswersByDate(date);
                const isToday = date === today;
                const goal = goals.find(g => g.date === date && g.status === 'active');
                const fc = answers.filter(a => a.state === 'focus').length;
                const dc = answers.filter(a => a.state === 'drift').length;
                const pc = answers.filter(a => a.state === 'pause').length;
                const total = answers.length;

                return (
                  <FadeIn key={date} delay={240 + rowIdx * 45}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/report', params: { date } })}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <GlassCard style={styles.dayRow}>
                      <View style={styles.dayRowLeft}>
                        <Text style={styles.dayRowDate}>
                          {isToday ? 'Сегодня' : formatDayFull(date)}
                        </Text>
                        {goal && (
                          <Text style={styles.dayRowGoal} numberOfLines={1}>{goal.text}</Text>
                        )}
                        <View style={styles.miniBar}>
                          {fc > 0 && <View style={[styles.miniSeg, { flex: fc / total, backgroundColor: colors.tealDeep }]} />}
                          {pc > 0 && <View style={[styles.miniSeg, { flex: pc / total, backgroundColor: colors.textFaint }]} />}
                          {dc > 0 && <View style={[styles.miniSeg, { flex: dc / total, backgroundColor: colors.sand }]} />}
                        </View>
                      </View>
                      <View style={styles.dayRowRight}>
                        <Text style={styles.dayRowCount}>{answers.length}</Text>
                        <Feather name="chevron-right" size={16} color={colors.textFaint} />
                      </View>
                    </GlassCard>
                  </Pressable>
                  </FadeIn>
                );
              })}
            </>
          ) : (
            <GlassCard style={styles.emptyState} dimmer>
              <Feather name="clock" size={32} color={colors.tealBg} />
              <Text style={styles.emptyText}>История пуста</Text>
              <Text style={styles.emptySubtext}>
                После первого ответа здесь появится твоя картина дня.{'\n'}Нажми «Спросить сейчас» на вкладке «Сегодня».
              </Text>
            </GlassCard>
          )}
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
    paddingBottom: 14,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weekNavPast: {
    backgroundColor: colors.tealBg,
    borderColor: colors.tealBorder,
  },
  weekNavLabel: { ...typography.bodySm, color: colors.text, minWidth: 78, textAlign: 'center' },
  weekNavLabelPast: { color: colors.teal },
  scroll: { paddingHorizontal: layout.screenPadding, gap: layout.cardGap, paddingTop: 0 },
  weekSection: { gap: layout.cardGap },
  chartCard: { gap: 18, padding: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  chartIconRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.tealBgStrong,
    borderWidth: 1,
    borderColor: colors.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: { ...typography.label, color: colors.textBright },
  twoCol: { flexDirection: 'row', gap: layout.cardGap },
  halfCard: { flex: 1, padding: 15, gap: 0 },
  halfLabel: { ...typography.caption, color: colors.textDim, marginBottom: 13 },
  dotRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotFilled: { backgroundColor: colors.teal },
  dotEmpty: { backgroundColor: colors.glassBorderDim },
  halfStat: { ...typography.bodySm, color: colors.textDim },
  halfStatNum: { ...typography.h2, fontFamily: fonts.sansMedium, color: colors.textBright },
  pctList: { gap: 9 },
  pctItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pctDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
  pctName: { ...typography.caption, color: colors.text, flex: 1 },
  pctVal: { ...typography.caption, color: colors.textDim },
  pctEmpty: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 19,
  },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 0, padding: 14 },
  dayRowLeft: { flex: 1, gap: 3 },
  dayRowDate: { ...typography.h4, color: colors.text },
  dayRowGoal: { ...typography.caption, color: colors.textMuted, lineHeight: 16 },
  miniBar: { flexDirection: 'row', height: 5, borderRadius: radii.full, overflow: 'hidden', marginTop: 6 },
  miniSeg: { height: '100%' },
  dayRowRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  dayRowCount: { ...typography.h2, color: colors.textMuted },
  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 48, marginTop: 20 },
  emptyText: { ...typography.h3, fontFamily: fonts.serif, color: colors.textDim, textAlign: 'center' },
  emptySubtext: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
