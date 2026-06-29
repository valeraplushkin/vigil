import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FadeIn } from '@/components/motion';
import { colors, typography } from '@/constants/tokens';
import { springs } from '@/constants/motion';
import { AnswerState } from '@/types';

type TsAnswer = { state: AnswerState; timestamp: number };
type DayColumn = { date: string; answers: { state: AnswerState }[]; isToday: boolean };

// One attention visualization, three contexts:
//   timeline → report (one segment per answer, chronological)
//   dots     → home (morning / afternoon / evening dot grid)
//   bars     → history (animated stacked bars per weekday)
type Props =
  | { variant: 'timeline'; answers: TsAnswer[] }
  | { variant: 'dots'; answers: TsAnswer[] }
  | { variant: 'bars'; days: DayColumn[]; onDayPress: (date: string) => void };

export function AttentionViz(props: Props) {
  if (props.variant === 'timeline') return <Timeline answers={props.answers} />;
  if (props.variant === 'dots') return <Dots answers={props.answers} />;
  return <Bars days={props.days} onDayPress={props.onDayPress} />;
}

// ─── timeline (report) ─────────────────────────────────────────────────────

// One chronological segment that grows in from its left edge.
function TimelineSeg({ color, index }: { color: string; index: number }) {
  const sx = useSharedValue(0);
  useEffect(() => {
    sx.value = withDelay(index * 40, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: sx.value }] }));
  return (
    <Animated.View style={[tl.seg, { backgroundColor: color, flex: 1, transformOrigin: 'left' }, style]} />
  );
}

function Timeline({ answers }: { answers: TsAnswer[] }) {
  const segments = useMemo(() => {
    const sorted = [...answers].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map(a => ({
      color: a.state === 'focus' ? colors.tealDeep : a.state === 'drift' ? colors.sand : colors.textFaint,
    }));
  }, [answers]);

  if (segments.length === 0) {
    return <View style={[tl.bar, { backgroundColor: colors.glassBg }]} />;
  }
  return (
    <View style={tl.bar}>
      {segments.map((seg, i) => (
        <TimelineSeg key={i} color={seg.color} index={i} />
      ))}
    </View>
  );
}

const tl = StyleSheet.create({
  bar: { flexDirection: 'row', height: 15, borderRadius: 8, overflow: 'hidden', gap: 3 },
  seg: { height: '100%', minWidth: 4, borderRadius: 4 },
});

// ─── dots (home) ───────────────────────────────────────────────────────────

function dotColor(s: AnswerState): string {
  if (s === 'focus') return colors.teal;
  if (s === 'drift') return colors.sand;
  return colors.textMuted; // pause
}

function Dots({ answers }: { answers: TsAnswer[] }) {
  const inPeriod = (lo: number, hi: number) =>
    answers.filter(a => {
      const h = new Date(a.timestamp).getHours();
      return h >= lo && h < hi;
    });

  // Only real answers get a dot — no empty placeholders.
  const periods = [
    { label: 'Утро',  items: inPeriod(0, 12)  },
    { label: 'День',  items: inPeriod(12, 17) },
    { label: 'Вечер', items: inPeriod(17, 24) },
  ];

  return (
    <View style={dt.row}>
      {periods.map((p, idx) => (
        <FadeIn key={p.label} delay={idx * 60} distance={6} style={dt.periodWrap}>
          <View style={dt.period}>
            <Text style={dt.periodLabel}>{p.label}</Text>
            <View style={dt.grid}>
              {p.items.map((a, i) => (
                <View key={i} style={[dt.dot, { backgroundColor: dotColor(a.state) }]} />
              ))}
            </View>
          </View>
        </FadeIn>
      ))}
    </View>
  );
}

const dt = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  periodWrap: { flex: 1 },
  period: { alignItems: 'center', gap: 8 },
  periodLabel: { ...typography.caption, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, width: 34, minHeight: 7, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

// ─── bars (history) ──────────────────────────────────────────────────────────

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getDayOfWeekIdx(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  return (d.getDay() + 6) % 7;
}

// Each bar is its own component so the grow-in hook works inside .map().
// scaleY grows from the bottom; translateY pins the bottom edge in place.
function AnimatedStackedBar({
  barH, fp, dp, pp, isToday, index,
}: {
  barH: number; fp: number; dp: number; pp: number; isToday: boolean; index: number;
}) {
  const scaleY = useSharedValue(0);

  useEffect(() => {
    scaleY.value = withDelay(index * 50, withSpring(1, springs.soft));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (barH * (1 - scaleY.value)) / 2 },
      { scaleY: scaleY.value },
    ],
  }));

  return (
    <Animated.View style={[bar.bar, { height: barH }, animStyle]}>
      {pp > 0 && <View style={[bar.seg, { flex: pp, backgroundColor: colors.glassBorder }]} />}
      {dp > 0 && <View style={[bar.seg, { flex: dp, backgroundColor: colors.sand }]} />}
      {fp > 0 && <View style={[bar.seg, { flex: fp, backgroundColor: isToday ? colors.tealBright : colors.tealDeep }]} />}
    </Animated.View>
  );
}

function Bars({ days, onDayPress }: { days: DayColumn[]; onDayPress: (date: string) => void }) {
  const maxAnswers = Math.max(...days.map(d => d.answers.length), 1);
  const BAR_MAX_H = 140;

  return (
    <View>
      <View style={bar.container}>
        {days.map((day, index) => {
          const total = day.answers.length;
          const focus = day.answers.filter(a => a.state === 'focus').length;
          const drift = day.answers.filter(a => a.state === 'drift').length;
          const pause = day.answers.filter(a => a.state === 'pause').length;
          const barH = total > 0 ? Math.max((total / maxAnswers) * BAR_MAX_H, 8) : 0;
          const fp = total > 0 ? focus / total : 0;
          const dp = total > 0 ? drift / total : 0;
          const pp = total > 0 ? pause / total : 0;

          return (
            <Pressable
              key={day.date}
              style={bar.col}
              onPress={() => total > 0 && onDayPress(day.date)}
            >
              <View style={[bar.barWrap, { height: BAR_MAX_H }]}>
                {total > 0 ? (
                  <AnimatedStackedBar barH={barH} fp={fp} dp={dp} pp={pp} isToday={day.isToday} index={index} />
                ) : (
                  <View style={bar.emptyDot} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={bar.labels}>
        {days.map(day => (
          <Text key={day.date} style={[bar.label, day.isToday && bar.labelToday]}>
            {DAY_LABELS[getDayOfWeekIdx(day.date)]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 172 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barWrap: { justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: 26, overflow: 'hidden', flexDirection: 'column', borderRadius: 6 },
  seg: { width: '100%' },
  emptyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.glassBorderDim },
  labels: { flexDirection: 'row', marginTop: 9 },
  label: { ...typography.caption, flex: 1, textAlign: 'center', color: colors.textMuted },
  labelToday: { color: colors.text },
});
