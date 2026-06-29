import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionLabel } from '@/components/SectionLabel';
import { TimePickerSheet } from '@/components/TimePickerSheet';
import { Toggle } from '@/components/Toggle';
import { a11y, colors, layout, radii, typography } from '@/constants/tokens';
import { springs } from '@/constants/motion';
import { useApp } from '@/context/AppContext';
import { haptics } from '@/lib/haptics';
import { Frequency } from '@/types';

const FREQ_OPTS: { key: Frequency; label: string }[] = [
  { key: 'low',    label: 'Реже'   },
  { key: 'medium', label: 'Средне' },
  { key: 'high',   label: 'Чаще'   },
];

type ModeKey = 'passive' | 'active' | 'both';

const MODE_OPTS: { key: ModeKey; label: string; desc: string; passive: boolean; active: boolean }[] = [
  { key: 'passive', label: 'Осознанность',  desc: 'Наблюдай за вниманием без конкретной цели',  passive: true,  active: false },
  { key: 'active',  label: 'Фокус на цели', desc: 'Отслеживай прогресс по задаче дня',           passive: false, active: true  },
  { key: 'both',    label: 'Оба',           desc: 'Mindfulness и активная цель одновременно',   passive: true,  active: true  },
];

const SEG_PAD = 3;
const SEG_GAP = 3;

// Segmented control with a sliding pill behind the active option (iOS-style)
function FrequencySelector({
  value,
  onChange,
}: {
  value: Frequency;
  onChange: (f: Frequency) => void;
}) {
  const [rowW, setRowW] = useState(0);
  const activeIndex = Math.max(0, FREQ_OPTS.findIndex(o => o.key === value));
  const count = FREQ_OPTS.length;
  const segW = rowW > 0 ? (rowW - SEG_PAD * 2 - SEG_GAP * (count - 1)) / count : 0;

  const tx = useSharedValue(0);
  useEffect(() => {
    tx.value = withSpring(SEG_PAD + activeIndex * (segW + SEG_GAP), springs.snappy);
  }, [activeIndex, segW]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    width: segW,
  }));

  return (
    <View style={styles.segRow} onLayout={e => setRowW(e.nativeEvent.layout.width)}>
      {segW > 0 && <Animated.View style={[styles.segPill, pillStyle]} />}
      {FREQ_OPTS.map(opt => {
        const active = opt.key === value;
        return (
          <Pressable key={opt.key} style={styles.seg} onPress={() => onChange(opt.key)}>
            <Text {...a11y.ui} style={[styles.segText, active && styles.segTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingRow({
  icon,
  label,
  right,
  onPress,
  style,
  labelStyle,
}: {
  icon?: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: object;
  labelStyle?: object;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={[srowStyles.row, style]}
    >
      <View style={srowStyles.left}>
        {icon && <View style={srowStyles.icon}>{icon}</View>}
        <Text {...a11y.ui} style={[srowStyles.label, labelStyle]}>{label}</Text>
      </View>
      {right && <View style={srowStyles.right}>{right}</View>}
    </Wrapper>
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
  left:  { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  icon:  { opacity: 0.6 },
  label: { ...typography.body, color: colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});

const DIV = <View style={{ height: 1, backgroundColor: colors.glassBg, marginHorizontal: 0 }} />;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, deleteAllData } = useApp();
  const [windowOpen, setWindowOpen] = useState(false);

  // Derive current mode selection from settings
  const currentModeKey: ModeKey =
    settings.modePassive && settings.modeActive ? 'both' :
    settings.modeActive ? 'active' : 'passive';

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleModeSelect = async (opt: typeof MODE_OPTS[number]) => {
    haptics.selection();
    await updateSettings({ modePassive: opt.passive, modeActive: opt.active });
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Удалить все данные',
      'Это нельзя отменить. Все ответы, цели и настройки будут удалены навсегда.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await deleteAllData();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <View style={styles.backBtnInner}>
              <Feather name="arrow-left" size={19} color={colors.text} />
            </View>
          </Pressable>
          <ScreenTitle>Настройки</ScreenTitle>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Уведомления ── */}
          <SectionLabel style={styles.sectionLabel}>Уведомления</SectionLabel>
          <GlassCard style={styles.card}>
            <View style={styles.freqPad}>
              <Text style={styles.fieldLabel}>Частота</Text>
              <FrequencySelector
                value={settings.frequency}
                onChange={key => { haptics.selection(); updateSettings({ frequency: key }); }}
              />
            </View>

            {DIV}

            <TimePickerSheet
              start={settings.windowStart}
              end={settings.windowEnd}
              onStartChange={h => updateSettings({ windowStart: h })}
              onEndChange={h => updateSettings({ windowEnd: h })}
              open={windowOpen}
              onToggle={() => setWindowOpen(v => !v)}
            />

            {DIV}

            <SettingRow
              icon={<Feather name="bell" size={17} color={colors.text} />}
              label="Уведомления"
              right={
                <Toggle
                  value={settings.notificationsEnabled}
                  onValueChange={v => { haptic(); updateSettings({ notificationsEnabled: v }); }}
                />
              }
            />
          </GlassCard>

          <View style={styles.cap}>
            <Feather name="shuffle" size={14} color={colors.teal} style={{ marginTop: 1 }} />
            <Text {...a11y.fixed} style={styles.capText}>
              Точное время немного плавает, чтобы вопросы не стали фоном
            </Text>
          </View>

          {/* ── Режимы ── */}
          <SectionLabel style={styles.sectionLabel}>Режим работы</SectionLabel>
          <GlassCard style={styles.modeCard}>
            {MODE_OPTS.map((opt, i) => {
              const isActive = currentModeKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleModeSelect(opt)}
                  style={({ pressed }) => [
                    styles.modeRow,
                    isActive && styles.modeRowActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.modeText}>
                    <Text style={[styles.modeName, isActive && styles.modeNameActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.modeDesc}>{opt.desc}</Text>
                  </View>
                  {isActive
                    ? <Feather name="check" size={16} color={colors.teal} />
                    : <View style={styles.modeUnchecked} />
                  }
                </Pressable>
              );
            })}
          </GlassCard>

          <View style={styles.cap}>
            <Feather name="info" size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text {...a11y.fixed} style={styles.capText}>
              «Фокус на цели» активируется автоматически при постановке цели дня
            </Text>
          </View>

          {/* ── Приватность ── */}
          <SectionLabel style={styles.sectionLabel}>Приватность</SectionLabel>
          <GlassCard style={styles.card}>
            <SettingRow
              icon={<Feather name="shield" size={17} color={colors.text} />}
              label="Что уходит в ИИ"
              right={<Feather name="chevron-right" size={17} color={colors.textMuted} />}
              onPress={() => router.push('/privacy')}
            />

            <View style={styles.privacyBlurb}>
              <Text style={styles.privacyBlurbText}>
                Твои ответы приватны. Текст вопросов и ответов обрабатывается ИИ, чтобы подбирать следующие вопросы.
              </Text>
            </View>

            {DIV}

            <SettingRow
              icon={<Feather name="download" size={17} color={colors.textMuted} />}
              label="Скачать мои данные"
              labelStyle={{ color: colors.textMuted }}
              right={<Badge variant="neutral" label="Скоро" />}
            />

            {DIV}

            <SettingRow
              icon={<Feather name="trash-2" size={17} color={colors.destructive} />}
              label="Удалить все мои данные"
              labelStyle={{ color: colors.destructive }}
              right={<Feather name="chevron-right" size={17} color={colors.destructiveBorder} />}
              onPress={handleDeleteAll}
            />
          </GlassCard>

          {/* ── О приложении ── */}
          <SectionLabel style={styles.sectionLabel}>О приложении</SectionLabel>
          <GlassCard style={styles.card}>
            <SettingRow
              icon={<Feather name="info" size={17} color={colors.text} />}
              label="О приложении"
              right={<Feather name="chevron-right" size={17} color={colors.textMuted} />}
              onPress={() => Alert.alert('Vigil', 'Версия 1.0\nМинутки осознанности в течение дня.')}
            />

            {DIV}

            <SettingRow
              icon={<Feather name="message-circle" size={17} color={colors.text} />}
              label="Обратная связь"
              right={<Feather name="chevron-right" size={17} color={colors.textMuted} />}
              onPress={() => Alert.alert('Обратная связь', 'Напишите нам: hello@vigil.app')}
            />
          </GlassCard>

          <View style={styles.versionRow}>
            <View style={styles.versionMark} />
            <Text {...a11y.fixed} style={styles.versionText}>Vigil · версия 1.0</Text>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {},
  backBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: layout.screenPadding, gap: layout.cardGap, paddingTop: 8 },
  sectionLabel: {
    marginTop: 12,
    marginLeft: 4,
  },
  card:     { gap: 0, padding: 0 },
  freqPad:  { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 10 },
  fieldLabel: { ...typography.bodySm, color: colors.textDim },
  segRow: {
    flexDirection: 'row',
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: colors.glassBorderDim,
    borderRadius: radii.md,
    padding: SEG_PAD,
    gap: SEG_GAP,
    position: 'relative',
  },
  segPill: {
    position: 'absolute',
    top: SEG_PAD,
    bottom: SEG_PAD,
    left: 0,
    borderRadius: 9,
    backgroundColor: colors.tealBtn,
  },
  seg: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText:       { ...typography.bodySm, color: colors.textDim },
  segTextActive: { ...typography.labelSm, color: colors.bgDeep },
  // Mode radio group — same visual language as profile tone selector
  modeCard: { gap: 2, padding: 8 },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 0,
  },
  modeRowActive:    { backgroundColor: colors.tealBg },
  modeText:         { flex: 1, gap: 2 },
  modeName:         { ...typography.label, color: colors.textDim },
  modeNameActive:   { color: colors.teal },
  modeDesc:         { ...typography.caption, color: colors.textMuted },
  modeUnchecked: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  capText: {
    ...typography.caption,
    flex: 1,
    color: colors.textMuted,
  },
  privacyBlurb: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 0 },
  privacyBlurbText: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 12,
    marginBottom: 4,
    opacity: 0.6,
  },
  versionMark: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.tealBgStrong,
    borderWidth: 1,
    borderColor: colors.glassBorderDim,
  },
  versionText: {
    ...typography.caption,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
});
