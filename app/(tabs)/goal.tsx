import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn as RFadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { GoalDoneBurst } from '@/components/GoalDoneBurst';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GradientBackground } from '@/components/GradientBackground';
import { ScreenTitle } from '@/components/ScreenTitle';
import { FadeIn, ScaleIn } from '@/components/motion';
import { colors, fonts, layout, radii, typography } from '@/constants/tokens';
import { useApp } from '@/context/AppContext';
import { Goal } from '@/types';

type View_ = 'edit' | 'summary';

function splitGoal(text: string): { essence: string; result: string } {
  const parts = text.split(' — ');
  return { essence: parts[0], result: parts.length > 1 ? parts.slice(1).join(' — ') : '' };
}

export default function GoalScreen() {
  const insets = useSafeAreaInsets();
  const { currentGoal, saveGoal, clearGoal, markGoalDone, goals } = useApp();

  const today = new Date().toISOString().split('T')[0];

  // Start on the day-summary when a goal already exists, otherwise the form.
  const [view, setView] = useState<View_>(currentGoal ? 'summary' : 'edit');

  const [essence, setEssence] = useState('');
  const [result,  setResult]  = useState('');
  const [description, setDescription] = useState('');
  const [resultOpen, setResultOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [essenceFocused, setEssenceFocused] = useState(false);
  const [resultFocused,  setResultFocused]  = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [justDone, setJustDone] = useState(false);

  useEffect(() => {
    if (currentGoal) {
      setEssence(currentGoal.essence ?? currentGoal.text);
      setDescription(currentGoal.description ?? '');
    }
  }, [currentGoal?.text]);

  // Today's goal picture for the summary
  const todayGoals = useMemo(() => goals.filter(g => g.date === today), [goals, today]);
  const doneGoals  = useMemo(() => todayGoals.filter(g => g.status === 'done'), [todayGoals]);
  const active     = currentGoal; // active goal for today (or null)

  // Recent goals (past days) as templates for the form — kept as objects so we
  // read their structured essence/result without re-parsing strings.
  const goalTemplates = useMemo(() => {
    const seen = new Set<string>();
    return goals
      .filter(g => g.date !== today)
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(g => (seen.has(g.text) ? false : (seen.add(g.text), true)))
      .slice(0, 5);
  }, [goals, today]);

  const canSave = essence.trim().length > 0;

  const handleSave = async () => {
    if (!essence.trim()) return;
    setSaving(true);
    await saveGoal(essence.trim(), description.trim());
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    setView('summary');           // show the day summary instead of leaving
  };

  const handleDone = async (id: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markGoalDone(id);
    setJustDone(true);
  };

  const handleClear = () => {
    Alert.alert(
      'Убрать цель?',
      'Цель будет убрана. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Убрать',
          style: 'destructive',
          onPress: async () => {
            await clearGoal();
            setEssence(''); setResult(''); setResultOpen(false);
            setDescription('');
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  const startNew = () => {
    setEssence(''); setResult(''); setResultOpen(false);
    setDescription('');
    setView('edit');
  };

  const handleTemplate = (g: Goal) => {
    const fallback = splitGoal(g.text);
    setEssence(g.essence ?? fallback.essence);
    setDescription(g.description ?? '');
    setResult(''); setResultOpen(false);
  };

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtnWrap}>
            <View style={styles.backBtnInner}>
              <Feather name="arrow-left" size={18} color={colors.text} />
            </View>
          </Pressable>

          {view === 'edit' && currentGoal && (
            <Pressable
              onPress={handleClear}
              style={({ pressed }) => [styles.clearHeaderBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.clearHeaderText}>Убрать цель</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {view === 'summary' ? (
            <Animated.View entering={RFadeIn.duration(220)} style={styles.viewCol}>
              <ScreenTitle style={styles.title}>Цель</ScreenTitle>
              <Text style={styles.subtitle}>
                {active ? 'Сегодня в работе' : 'Цель на сегодня закрыта'}
              </Text>

              {active && (
                <ScaleIn>
                  <GlassCard style={styles.activeCard}>
                    <View style={styles.activeTop}>
                      <View style={styles.goalIconRing}>
                        <Feather name="target" size={20} color={colors.teal} />
                      </View>
                      <Badge variant="teal" label="В работе" />
                    </View>
                    <Text style={styles.activeText}>{active.text}</Text>
                    {active.description ? (
                      <Text style={styles.activeDesc}>{active.description}</Text>
                    ) : null}
                    <PrimaryButton
                      variant="secondary"
                      icon="check"
                      label="Выполнено"
                      onPress={() => handleDone(active.id)}
                      style={styles.doneAction}
                    />
                  </GlassCard>
                </ScaleIn>
              )}

              {doneGoals.length > 0 && (
                <Animated.View style={styles.doneSection} layout={LinearTransition.springify()}>
                  <Text style={styles.doneLabel}>Реализовано сегодня</Text>
                  {doneGoals.map(g => (
                    <Animated.View
                      key={g.id}
                      entering={FadeInDown.duration(300)}
                      layout={LinearTransition.springify()}
                      style={styles.doneRow}
                    >
                      <View style={styles.doneCheck}>
                        <Feather name="check" size={13} color={colors.teal} />
                      </View>
                      <Text style={styles.doneText} numberOfLines={2}>{g.text}</Text>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}

              {!active && (
                <FadeIn delay={120}>
                  <PrimaryButton
                    variant="secondary"
                    icon="plus"
                    label="Поставить новую цель"
                    onPress={startNew}
                  />
                </FadeIn>
              )}

              <View style={styles.summaryActions}>
                <PrimaryButton label="На главную" onPress={() => router.replace('/(tabs)')} />
                {active && (
                  <PrimaryButton variant="ghost" label="Изменить цель" onPress={() => setView('edit')} />
                )}
              </View>

              {active && (
                <Pressable
                  onPress={handleClear}
                  hitSlop={8}
                  style={({ pressed }) => [styles.clearLink, pressed && { opacity: 0.6 }]}
                >
                  <Text style={styles.clearLinkText}>Убрать цель</Text>
                </Pressable>
              )}
            </Animated.View>
          ) : (
            <Animated.View entering={RFadeIn.duration(220)} style={styles.viewCol}>
              <ScreenTitle style={styles.title}>Цель</ScreenTitle>
              <Text style={styles.subtitle}>Что в фокусе сегодня?</Text>

              <GlassCard style={[styles.inputCard, essenceFocused && styles.inputCardFocused]}>
                <TextInput
                  value={essence}
                  onChangeText={setEssence}
                  onFocus={() => setEssenceFocused(true)}
                  onBlur={() => setEssenceFocused(false)}
                  placeholder="Опиши в одном предложении…"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                  textAlignVertical="top"
                />
              </GlassCard>

              <GlassCard style={[styles.inputCard, descriptionFocused && styles.inputCardFocused]}>
                <Text style={styles.inputLabel}>Подробное описание</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => setDescriptionFocused(true)}
                  onBlur={() => setDescriptionFocused(false)}
                  placeholder="Опиши задачу подробно: что именно делаешь, на чём сейчас, что считаешь сделанным"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  style={[styles.input, styles.inputLong]}
                  textAlignVertical="top"
                />
              </GlassCard>
              <Text style={styles.descriptionHint}>
                Чем подробнее опишешь — тем точнее будут вопросы
              </Text>

              {resultOpen ? (
                <GlassCard style={[styles.inputCard, resultFocused && styles.inputCardFocused]}>
                  <Text style={styles.inputLabel}>Желаемый результат к концу дня</Text>
                  <TextInput
                    value={result}
                    onChangeText={setResult}
                    onFocus={() => setResultFocused(true)}
                    onBlur={() => setResultFocused(false)}
                    placeholder="Что будет сделано?"
                    placeholderTextColor={colors.placeholder}
                    multiline
                    numberOfLines={2}
                    style={styles.input}
                    textAlignVertical="top"
                    autoFocus
                  />
                </GlassCard>
              ) : (
                <Pressable
                  onPress={() => setResultOpen(true)}
                  style={({ pressed }) => [styles.addResultBtn, pressed && { opacity: 0.7 }]}
                >
                  <Feather name="plus" size={13} color={colors.textMuted} />
                  <Text style={styles.addResultText}>Добавить результат к концу дня</Text>
                </Pressable>
              )}

              {goalTemplates.length > 0 && (
                <View style={styles.templatesSection}>
                  <Text style={styles.templatesLabel}>Недавние</Text>
                  <View style={styles.templatePills}>
                    {goalTemplates.map((g, i) => (
                      <FadeIn key={g.id} delay={i * 50}>
                        <AnimatedPressable onPress={() => handleTemplate(g)} scale={0.94}>
                          <View style={styles.templatePill}>
                            <Text style={styles.templatePillText} numberOfLines={1}>{g.text}</Text>
                          </View>
                        </AnimatedPressable>
                      </FadeIn>
                    ))}
                  </View>
                </View>
              )}

              {!canSave && (
                <View style={styles.tip}>
                  <Feather name="zap" size={14} color={colors.textFaint} />
                  <Text style={styles.tipText}>
                    Чем конкретнее результат, тем точнее будут вопросы.
                  </Text>
                </View>
              )}

              <PrimaryButton
                label="Сохранить цель"
                loadingLabel="Сохраняю…"
                loading={saving}
                disabled={!canSave}
                onPress={handleSave}
                style={styles.saveBtn}
              />
            </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtnWrap: {},
  backBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorderDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearHeaderBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  clearHeaderText: { ...typography.body, color: colors.textMuted },
  scroll: { paddingHorizontal: layout.screenPadding, gap: 14, paddingTop: 12 },
  viewCol: { gap: 14 },
  title: { fontFamily: fonts.serifBold, lineHeight: 36 },
  subtitle: { ...typography.body, color: colors.textDim, marginBottom: 4 },

  // ── Summary ──
  activeCard: { gap: 14, padding: 18 },
  activeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalIconRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: colors.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeText: { ...typography.h2, color: colors.textBright, lineHeight: 30 },
  activeDesc: { ...typography.bodySm, color: colors.textDim, lineHeight: 20 },
  doneAction: { marginTop: 2 },
  doneSection: { gap: 10, marginTop: 4 },
  doneLabel: {
    ...typography.overline,
    color: colors.textMuted,
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  doneCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  doneText: { ...typography.body, color: colors.textDim, flex: 1, textDecorationLine: 'line-through' },
  summaryActions: { gap: 10, marginTop: 8 },
  clearLink: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, marginTop: 2 },
  clearLinkText: { ...typography.body, color: colors.destructive },

  // ── Edit form ──
  inputCard: { gap: 6, padding: 16, borderRadius: radii.lg },
  inputCardFocused: { borderColor: colors.tealBorder, backgroundColor: colors.glassBg },
  inputLabel: { ...typography.h4, color: colors.textDim },
  input: {
    ...typography.bodyLg,
    color: colors.text,
    lineHeight: 22,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  inputLong: { ...typography.body, minHeight: 96 },
  descriptionHint: { ...typography.caption, color: colors.textMuted, paddingHorizontal: 4, marginTop: -8 },
  addResultBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 2, paddingHorizontal: 2 },
  addResultText: { ...typography.bodySm, color: colors.textMuted },
  templatesSection: { gap: 10 },
  templatesLabel: { ...typography.bodySm, color: colors.textMuted },
  templatePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  templatePill: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorderDim,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 260,
  },
  templatePillText: { ...typography.bodySm, color: colors.textDim },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  tipText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  saveBtn: { marginTop: 4 },
});
