import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, radii, typography } from '@/constants/tokens';

type Slot = 'start' | 'end';

interface Props {
  start: number; // hour 0-23
  end: number;   // hour 0-23
  onStartChange: (h: number) => void;
  onEndChange: (h: number) => void;
  open: boolean;
  onToggle: () => void;
}

function fmtHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function TimePickerSheet({ start, end, onStartChange, onEndChange, open, onToggle }: Props) {
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: open ? 1 : 0,
        useNativeDriver: false,
        tension: 60,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: open ? 1 : 0,
        duration: open ? 200 : 140,
        useNativeDriver: false,
      }),
    ]).start();
    if (!open) setActiveSlot(null);
  }, [open]);

  const panelMaxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

  const windowLabel = `${fmtHour(start)} – ${fmtHour(end)}`;

  const adjustStart = (delta: number) => {
    haptic();
    const h = start + delta;
    if (h >= 0 && h < end) onStartChange(h);
  };

  const adjustEnd = (delta: number) => {
    haptic();
    const h = end + delta;
    if (h > start && h <= 23) onEndChange(h);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [srowStyles.row, pressed && { opacity: 0.8 }]}
        onPress={() => { haptic(); onToggle(); }}
      >
        <View style={srowStyles.left}>
          <View style={srowStyles.icon}>
            <Feather name="clock" size={17} color={colors.text} />
          </View>
          <Text style={srowStyles.label}>Окно активности</Text>
        </View>
        <View style={srowStyles.right}>
          <Text style={styles.rowValue}>{windowLabel}</Text>
          <Animated.View
            style={{
              transform: [{
                rotate: heightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg'],
                }),
              }],
            }}
          >
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={[styles.panel, { maxHeight: panelMaxHeight, opacity: opacityAnim }]}>
        <View style={styles.panelInner}>
          <View style={styles.panelDivider} />

          <TimeSlot
            label="Начало"
            value={start}
            isActive={activeSlot === 'start'}
            onToggle={() => setActiveSlot(prev => prev === 'start' ? null : 'start')}
            onDecrement={() => adjustStart(-1)}
            onIncrement={() => adjustStart(+1)}
            canDecrement={start > 0}
            canIncrement={start + 1 < end}
          />

          <View style={styles.slotDivider} />

          <TimeSlot
            label="Конец"
            value={end}
            isActive={activeSlot === 'end'}
            onToggle={() => setActiveSlot(prev => prev === 'end' ? null : 'end')}
            onDecrement={() => adjustEnd(-1)}
            onIncrement={() => adjustEnd(+1)}
            canDecrement={end - 1 > start}
            canIncrement={end < 23}
          />

          <View style={styles.hint}>
            <Feather name="info" size={12} color={colors.textFaint} />
            <Text style={styles.hintText}>Vigil будет молчать за пределами этого окна</Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

function TimeSlot({
  label, value, isActive,
  onToggle, onDecrement, onIncrement,
  canDecrement, canIncrement,
}: {
  label: string;
  value: number;
  isActive: boolean;
  onToggle: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement: boolean;
  canIncrement: boolean;
}) {
  return (
    <View style={styles.timeBlock}>
      <Pressable
        style={[styles.timeRow, isActive && styles.timeRowActive]}
        onPress={onToggle}
      >
        <Text style={styles.timeLabel}>{label}</Text>
        <View style={styles.timeBadge}>
          <Text style={[styles.timeValue, isActive && styles.timeValueActive]}>
            {fmtHour(value)}
          </Text>
        </View>
      </Pressable>

      {isActive && (
        <View style={styles.stepper}>
          <Pressable
            style={[styles.stepBtn, !canDecrement && styles.stepBtnDisabled]}
            onPress={onDecrement}
            disabled={!canDecrement}
          >
            <Feather name="minus" size={16} color={canDecrement ? colors.teal : colors.textFaint} />
          </Pressable>
          <Text style={styles.stepValue}>{fmtHour(value)}</Text>
          <Pressable
            style={[styles.stepBtn, !canIncrement && styles.stepBtnDisabled]}
            onPress={onIncrement}
            disabled={!canIncrement}
          >
            <Feather name="plus" size={16} color={canIncrement ? colors.teal : colors.textFaint} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const srowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  icon: { opacity: 0.6 },
  label: { ...typography.body, color: colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});

const styles = StyleSheet.create({
  rowValue: {
    ...typography.bodySm,
    color: colors.textDim,
  },
  panel: {
    overflow: 'hidden',
  },
  panelInner: {
    paddingBottom: 12,
  },
  panelDivider: {
    height: 1,
    backgroundColor: colors.glassBorderDim,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  timeBlock: {
    paddingHorizontal: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginTop: 4,
  },
  timeRowActive: {
    backgroundColor: colors.tealBg,
  },
  timeLabel: {
    ...typography.body,
    color: colors.textDim,
  },
  timeBadge: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeValue: {
    ...typography.label,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  timeValueActive: {
    color: colors.teal,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealBg,
    borderWidth: 1,
    borderColor: colors.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: colors.glassBgDim,
    borderColor: colors.glassBorderDim,
  },
  stepValue: {
    ...typography.h2,
    color: colors.teal,
    letterSpacing: 1,
    minWidth: 70,
    textAlign: 'center',
  },
  slotDivider: {
    height: 1,
    backgroundColor: colors.glassBorderDim,
    marginHorizontal: 28,
    marginVertical: 2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 28,
    paddingTop: 10,
  },
  hintText: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
