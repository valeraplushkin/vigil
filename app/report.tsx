import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

import { springs } from '@/constants/motion';

import { AttentionViz } from '@/components/AttentionViz';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ScreenTitle } from '@/components/ScreenTitle';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { MirrorCard } from '@/components/MirrorCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ReportSkeleton } from '@/components/ReportSkeleton';
import { FadeIn, ScaleIn } from '@/components/motion';
import { a11y, colors, layout, typography } from '@/constants/tokens';
import { useApp } from '@/context/AppContext';
import { AnswerState } from '@/types';

function getMirrorText(fp: number, dp: number, pp: number, count: number): string {
  if (count === 0) return 'День ещё не начался. Любой момент хорош для первого вопроса.';
  if (count === 1) return 'Первая остановка сделана. Одна минутка — это уже выбор быть здесь.';
  if (fp >= 0.6) return 'Ты держался цели большую часть дня и пару раз вовремя заметил, что отвлёкся.';
  if (dp >= 0.5) return 'Сегодня внимание много блуждало. Замечать дрейф — это уже и есть осознанность.';
  if (pp >= 0.4) return 'Ты делал паузы. Это тоже выбор — остановиться и подышать.';
  return 'День был разным. Были моменты фокуса и ухода. Именно из таких дней и состоит жизнь.';
}

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 60;

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

function formatHeader(dateStr: string): { sub: string; title: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const sub = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  return { sub: sub.charAt(0).toUpperCase() + sub.slice(1), title: 'Как прошёл день' };
}

function getBestPeriod(answers: { state: AnswerState; timestamp: number }[]): string | null {
  if (answers.length === 0) return null;
  const morning   = answers.filter(a => new Date(a.timestamp).getHours() < 12);
  const afternoon = answers.filter(a => { const h = new Date(a.timestamp).getHours(); return h >= 12 && h < 17; });
  const evening   = answers.filter(a => new Date(a.timestamp).getHours() >= 17);
  const getFocus  = (arr: typeof answers) => arr.filter(a => a.state === 'focus').length / Math.max(arr.length, 1);
  const best = [
    { label: 'Утром',       pct: getFocus(morning),   count: morning.length },
    { label: 'После обеда', pct: getFocus(afternoon), count: afternoon.length },
    { label: 'Вечером',     pct: getFocus(evening),   count: evening.length },
  ].filter(p => p.count > 0).sort((a, b) => b.pct - a.pct)[0];
  return best ? best.label : null;
}

export default function ReportScreen() {
  const insets  = useSafeAreaInsets();
  const params  = useLocalSearchParams<{ date?: string }>();
  const { getAnswersByDate, goals, notes, saveNote, isReady } = useApp();

  const today   = new Date().toISOString().split('T')[0];
  const date    = params.date ?? today;
  const isToday = date === today;

  const answers    = getAnswersByDate(date);
  const [note,     setNote]     = useState(() => notes[date] ?? '');
  const [displayPct, setDisplayPct] = useState(0);
  const loading = !isReady;   // real readiness, not an artificial delay

  // Flush pending note save on unmount
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef   = useRef(note);
  noteRef.current = note;

  // On date change (swipe / chevrons): cleanup flushes the previous day's
  // note, then the body loads the new day's note into the field.
  useEffect(() => {
    setNote(notes[date] ?? '');
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveNote(date, noteRef.current);
    };
  }, [date]);

  const handleNoteChange = (text: string) => {
    setNote(text);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(date, text), 600);
  };

  const focusCount = answers.filter(a => a.state === 'focus').length;
  const driftCount = answers.filter(a => a.state === 'drift').length;
  const pauseCount = answers.filter(a => a.state === 'pause').length;
  const total      = answers.length;

  const fp = total > 0 ? focusCount / total : 0;
  const dp = total > 0 ? driftCount / total : 0;
  const pp = total > 0 ? pauseCount / total : 0;

  const mirror = useMemo(() => getMirrorText(fp, dp, pp, total), [fp, dp, pp, total]);

  useEffect(() => {
    if (loading) return;
    if (total === 0) { setDisplayPct(0); return; }
    const target = Math.round(fp * 100);
    const dur    = 700;
    const startTime = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;
    const tick = () => {
      const t     = Math.min((Date.now() - startTime) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fp, total, loading]);

  const goal = goals.find(g => g.date === date && g.status === 'active');

  const answersWithTs = useMemo(
    () => answers
      .filter((a): a is typeof a & { state: AnswerState } => a.state !== null)
      .map(a => ({ state: a.state, timestamp: a.timestamp })),
    [answers],
  );

  const bestPeriod = useMemo(() => getBestPeriod(answersWithTs), [answersWithTs]);
  const hasBoth    = !!goal && !!bestPeriod;

  const { sub, title } = isToday
    ? { sub: 'Сегодня', title: 'Как прошёл день' }
    : formatHeader(date);

  const minHour = answers.length > 0
    ? new Date(Math.min(...answers.map(a => a.timestamp))).getHours() : 9;
  const maxHour = answers.length > 0
    ? new Date(Math.max(...answers.map(a => a.timestamp))).getHours() : 19;
  const singleAnswer = minHour === maxHour;
  const midHour = Math.round((minHour + maxHour) / 2);
  const showMid = maxHour - minHour >= 2;   // middle label only when distinct

  // ── Day↔day navigation (swipe + chevrons) ──────────────────────────
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, +1);
  const canNext  = nextDate <= today;        // no navigating into the future
  const canPrev  = true;                      // any past day is allowed

  const tx = useSharedValue(0);
  const op = useSharedValue(1);
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: op.value,
  }));

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Swap the date and slide the new content in from the opposite edge.
  const commitDate = (newDate: string, exitSign: number) => {
    router.setParams({ date: newDate });
    tx.value = -exitSign * SCREEN_W;
    op.value = 0;
    tx.value = withSpring(0, springs.default);
    op.value = withTiming(1, { duration: 240 });
  };

  // exitSign: -1 = slide out left (→ next day), +1 = slide out right (→ prev day)
  const exit = (exitSign: number, newDate: string) => {
    haptic();
    op.value = withTiming(0, { duration: 160 });
    tx.value = withTiming(exitSign * SCREEN_W, { duration: 160 }, finished => {
      if (finished) runOnJS(commitDate)(newDate, exitSign);
    });
  };

  const goNext = () => { if (canNext) exit(-1, nextDate); };
  const goPrev = () => { if (canPrev) exit(+1, prevDate); };

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-14, 14])
    .onUpdate(e => {
      'worklet';
      let dx = e.translationX;
      if ((dx < 0 && !canNext) || (dx > 0 && !canPrev)) dx *= 0.25; // resistance at edge
      tx.value = dx;
    })
    .onEnd(e => {
      'worklet';
      const dx = e.translationX;
      if (dx <= -SWIPE_THRESHOLD && canNext) {
        runOnJS(exit)(-1, nextDate);
      } else if (dx >= SWIPE_THRESHOLD && canPrev) {
        runOnJS(exit)(+1, prevDate);
      } else {
        tx.value = withSpring(0, springs.default);
      }
    });

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.dayNav}>
              <Pressable
                onPress={goPrev}
                hitSlop={10}
                accessibilityLabel="Предыдущий день"
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Feather name="chevron-left" size={18} color={colors.textDim} />
              </Pressable>
              <Text {...a11y.fixed} style={styles.dateSub}>{sub}</Text>
              <Pressable
                onPress={goNext}
                disabled={!canNext}
                hitSlop={10}
                accessibilityLabel="Следующий день"
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Feather name="chevron-right" size={18} color={canNext ? colors.textDim : colors.textFaint} />
              </Pressable>
            </View>
            <ScreenTitle style={styles.title}>{title}</ScreenTitle>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.closeBtnInner}>
              <Feather name="x" size={18} color={colors.text} />
            </View>
          </Pressable>
        </View>

        <GestureDetector gesture={pan}>
        <Reanimated.View style={[{ flex: 1 }, contentStyle]}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ReportSkeleton />
          ) : total === 0 ? (
            <>
              <EmptyState
                icon="sun"
                title="За этот день нет ответов."
                sub="Когда ответишь на вопрос, здесь появится твоя картина дня."
              />
              <View style={styles.swipeHint}>
                <Feather name="chevron-left" size={13} color={colors.textFaint} />
                <Text {...a11y.fixed} style={styles.swipeHintText}>листай дни</Text>
                <Feather name="chevron-right" size={13} color={colors.textFaint} />
              </View>
            </>
          ) : (
            <>
              <ScaleIn delay={0}>
              <GlassCard style={styles.mainCard}>
                <View style={styles.mainCardHeader}>
                  <Text style={styles.mainCardTitle}>Внимание за день</Text>
                  <View style={styles.mainCardChips}>
                    {goal && <Badge variant="teal" label="Цель" />}
                    <Badge variant="neutral" label={`${total} ответов`} />
                  </View>
                </View>

                <View style={styles.mainCardStats}>
                  <View>
                    <Text {...a11y.ui}    style={styles.bigPct}>{displayPct}%</Text>
                    <Text {...a11y.fixed} style={styles.bigPctSub}>в фокусе</Text>
                  </View>
                  <View style={styles.breakdownList}>
                    {driftCount > 0 && (
                      <View style={styles.breakdownItem}>
                        <View style={[styles.breakdownDot, { backgroundColor: colors.sand }]} />
                        <Text style={styles.breakdownText}>{Math.round(dp * 100)}% дрейф</Text>
                      </View>
                    )}
                    {pauseCount > 0 && (
                      <View style={styles.breakdownItem}>
                        <View style={[styles.breakdownDot, { backgroundColor: colors.textFaint }]} />
                        <Text style={styles.breakdownText}>{Math.round(pp * 100)}% пауза</Text>
                      </View>
                    )}
                  </View>
                </View>

                <AttentionViz variant="timeline" answers={answersWithTs} />
                <View style={styles.timelineLabels}>
                  <Text style={styles.timelineLabel}>{String(minHour).padStart(2, '0')}:00</Text>
                  {!singleAnswer && showMid && (
                    <Text style={styles.timelineLabel}>{String(midHour).padStart(2, '0')}:00</Text>
                  )}
                  {!singleAnswer && (
                    <Text style={styles.timelineLabel}>{String(maxHour).padStart(2, '0')}:00</Text>
                  )}
                </View>
              </GlassCard>
              </ScaleIn>

              <FadeIn delay={200}>
              <View style={hasBoth ? styles.twoCol : undefined}>
                {goal && (
                  <GlassCard style={[styles.halfCard, hasBoth && { flex: 1 }]}>
                    <View style={styles.halfHeader}>
                      <Feather name="target" size={16} color={colors.teal} />
                      <Text style={styles.halfLabel}>Цель дня</Text>
                    </View>
                    <Text style={styles.halfTitle} numberOfLines={2}>{goal.text}</Text>
                    {fp >= 0.5 && (
                      <Badge variant="teal" icon="check" label="держался" style={styles.heldChip} />
                    )}
                  </GlassCard>
                )}
                {bestPeriod && (
                  <GlassCard style={[styles.halfCard, hasBoth && { flex: 1 }]}>
                    <View style={styles.halfHeader}>
                      <Feather name="sun" size={16} color={colors.teal} />
                      <Text style={styles.halfLabel}>Ясный момент</Text>
                    </View>
                    <Text style={styles.halfTitle}>{bestPeriod}</Text>
                    <Text style={styles.halfSub}>дольше всего в фокусе</Text>
                  </GlassCard>
                )}
              </View>
              </FadeIn>

              <FadeIn delay={400}>
              <MirrorCard label="Зеркало дня" text={mirror} />
              </FadeIn>
            </>
          )}

          {!loading && (
            <>
              <FadeIn delay={total > 0 ? 520 : 80}>
              <GlassCard style={styles.noteCard}>
                <View style={styles.noteRow}>
                  <TextInput
                    value={note}
                    onChangeText={handleNoteChange}
                    placeholder="Добавить заметку…"
                    placeholderTextColor={colors.placeholder}
                    multiline
                    style={styles.noteInput}
                    textAlignVertical="top"
                  />
                  <Feather name="edit-2" size={16} color={colors.textFaint} />
                </View>
              </GlassCard>
              </FadeIn>

              <FadeIn delay={total > 0 ? 600 : 120}>
              <PrimaryButton variant="ghost" label="Готово" onPress={() => router.back()} style={styles.doneBtn} />
              </FadeIn>
            </>
          )}
        </ScrollView>
        </Reanimated.View>
        </GestureDetector>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 14,
  },
  swipeHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  swipeHintText: { ...typography.caption, color: colors.textFaint },
  dayNav:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  dateSub:  { ...typography.bodySm, color: colors.textMuted },
  title:    { lineHeight: 32 },
  closeBtn: { marginTop: 4 },
  closeBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll:        { paddingHorizontal: layout.screenPadding, gap: layout.cardGap },
  mainCard:      { gap: 16, padding: 17 },
  mainCardHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mainCardTitle: { ...typography.label, color: colors.textBright },
  mainCardChips: { flexDirection: 'row', gap: 7 },
  mainCardStats:   { flexDirection: 'row', alignItems: 'flex-end', gap: 18, marginBottom: 4 },
  bigPct:    { ...typography.numXl, color: colors.tealBright },
  bigPctSub: { ...typography.caption, color: colors.textDim, marginTop: 4 },
  breakdownList: { gap: 7, paddingBottom: 3 },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  breakdownDot:  { width: 8, height: 8, borderRadius: 2 },
  breakdownText: { ...typography.caption, color: colors.textDim },
  timelineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  timelineLabel:  { ...typography.caption, color: colors.textMuted },
  twoCol:   { flexDirection: 'row', gap: layout.cardGap },
  halfCard: { padding: 14, gap: 0 },
  halfHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 },
  halfLabel:  { ...typography.caption, color: colors.textDim },
  halfTitle:  { ...typography.bodySm, color: colors.text, marginBottom: 10 },
  halfSub:    { ...typography.caption, color: colors.textDim },
  heldChip: { alignSelf: 'flex-start' },
  noteCard: { padding: 15, gap: 0 },
  noteRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  noteInput: {
    ...typography.bodySm,
    flex: 1,
    color: colors.textDim,
    minHeight: 40,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  doneBtn: { marginTop: 2, marginBottom: 8 },
});
