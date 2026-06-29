import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Reanimated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { a11y, colors, radii, typography } from '@/constants/tokens';
import { ACTIVE_CHIPS, ChipDef, PASSIVE_CHIPS } from '@/constants/chips';
import { springs } from '@/constants/motion';
import { Badge } from '@/components/Badge';
import { CelebrationMoment } from '@/components/CelebrationMoment';
import { PrimaryButton } from '@/components/PrimaryButton';
import { haptics } from '@/lib/haptics';
import { DiamondMark } from '@/components/DiamondMark';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { FadeIn, Stagger } from '@/components/motion';
import { useApp } from '@/context/AppContext';
import { fetchLatestReadyQuestion, fetchQuestionById } from '@/lib/questions';
import { supabase } from '@/lib/supabase';
import { AnswerEntryPoint, AnswerState, Question } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Separate component so hooks don't run inside .map()
function ChipButton({
  chip,
  isSelected,
  onSelect,
}: {
  chip: ChipDef;
  isSelected: boolean;
  onSelect: (state: AnswerState) => void;
}) {
  const scale = useSharedValue(1);
  const sel = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    sel.value = withTiming(isSelected ? 1 : 0, { duration: 120 });
  }, [isSelected]);

  const handlePress = () => {
    haptics.selection();
    scale.value = withSequence(
      withSpring(1.07, springs.pop),
      withSpring(1.0,  springs.settle),
    );
    onSelect(chip.state);
  };

  // Scale (bump) + animated fill/border so selection eases in over 120ms.
  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(sel.value, [0, 1], [colors.glassBgSubtle, chip.bg]),
    borderColor: interpolateColor(sel.value, [0, 1], [colors.glassBorderDim, chip.borderColor]),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.textDim, chip.color]),
  }));

  return (
    <Reanimated.View style={[styles.chip, wrapStyle]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="radio"
        accessibilityLabel={chip.label}
        accessibilityState={{ selected: isSelected }}
        style={styles.chipPress}
      >
        <Reanimated.Text style={[styles.chipText, textStyle]}>{chip.label}</Reanimated.Text>
      </Pressable>
    </Reanimated.View>
  );
}

export default function QuestionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { currentGoal, saveAnswer, getTodayAnswers } = useApp();

  // The question comes from Supabase: by id when opened from a push
  // notification, otherwise the latest server-generated one still open.
  const [question,       setQuestion]       = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [selected,       setSelected]       = useState<AnswerState | null>(null);
  const [customText,     setCustomText]     = useState('');
  const [accepted,       setAccepted]       = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [celebrationPct, setCelebrationPct] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingQuestion(true);
      try {
        let q: Question | null = null;
        if (params.id) {
          q = await fetchQuestionById(params.id);
        } else {
          const uid = (await supabase.auth.getSession()).data.session?.user.id;
          if (uid) q = await fetchLatestReadyQuestion(uid);
        }
        if (active) setQuestion(q);
      } catch (e) {
        console.log('[question] load failed', e);
        if (active) setQuestion(null);
      } finally {
        if (active) setLoadingQuestion(false);
      }
    })();
    return () => { active = false; };
  }, [params.id]);

  // Question fade-out on submit + accepted fade-in (Reanimated, single system)
  const fadeOut  = useSharedValue(1);
  const acceptIn = useSharedValue(0);
  const fadeStyle   = useAnimatedStyle(() => ({ opacity: fadeOut.value }));
  const acceptStyle = useAnimatedStyle(() => ({ opacity: acceptIn.value }));

  // Accepted screen: ring scales in
  const ringScale = useSharedValue(0.6);
  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  // Shared-element-style fly: the topbar DiamondMark travels to the ring centre,
  // growing 22→34 and rotating to 45° so it becomes the ring's diamond.
  const DIA = 34;
  const startX = 20 + 11;              // container padH (20) + diamond half (22/2)
  const startY = insets.top + 14 + 11; // container padTop + diamond half
  const flyTx = useSharedValue(startX - DIA / 2);
  const flyTy = useSharedValue(startY - DIA / 2);
  const flyScale = useSharedValue(22 / DIA);
  const flyRot = useSharedValue(0);
  const flyOpacity = useSharedValue(0);
  const [ringCenter, setRingCenter] = useState<{ x: number; y: number } | null>(null);
  const ringRef = useRef<Reanimated.View>(null);

  const flyStyle = useAnimatedStyle(() => ({
    opacity: flyOpacity.value,
    transform: [
      { translateX: flyTx.value },
      { translateY: flyTy.value },
      { scale: flyScale.value },
      { rotate: `${flyRot.value}deg` },
    ],
  }));

  const measureRing = () => {
    ringRef.current?.measureInWindow?.((x, y, w, h) => {
      setRingCenter({ x: x + w / 2, y: y + h / 2 });
    });
  };

  // Reveal the diamond at the topbar position the instant we accept, and
  // scale the (empty) ring in around where it will land. Fallback: if onLayout
  // never measures the ring, drop the diamond at an approximate centre so it
  // always lands instead of stranding in the topbar.
  useEffect(() => {
    if (accepted && celebrationPct === 0) {
      flyOpacity.value = 1;
      ringScale.value = withSpring(1, springs.soft);
      const t = setTimeout(() => {
        setRingCenter(prev => prev ?? { x: SCREEN_W / 2, y: SCREEN_H * 0.42 });
      }, 260);
      return () => clearTimeout(t);
    }
  }, [accepted, celebrationPct]);

  // Once the ring is measured, fly the diamond into its centre.
  useEffect(() => {
    if (accepted && celebrationPct === 0 && ringCenter) {
      const dur = 480;
      const ease = Easing.out(Easing.cubic);
      flyTx.value = withTiming(ringCenter.x - DIA / 2, { duration: dur, easing: ease });
      flyTy.value = withTiming(ringCenter.y - DIA / 2, { duration: dur, easing: ease });
      flyRot.value = withTiming(45, { duration: dur, easing: ease });
      flyScale.value = withDelay(120, withSpring(1, springs.soft));
    }
  }, [accepted, celebrationPct, ringCenter]);

  const isActive = question?.type === 'active';
  const chips = isActive ? ACTIVE_CHIPS : PASSIVE_CHIPS;

  const handleAnswer = async (state: AnswerState | null) => {
    if (saving || !question) return;
    setSaving(true);

    // Free-text-only answer (no chip) is treated as 'focus' so it counts toward
    // the day's focus stats on the home screen, like an explicit chip choice.
    const effectiveState: AnswerState = state ?? 'focus';

    const prev      = getTodayAnswers();
    const newFocus  = prev.filter(a => a.state === 'focus').length + (effectiveState === 'focus' ? 1 : 0);
    const newTotal  = prev.length + 1;
    const pct       = newFocus / newTotal;
    const celebrate = newTotal >= 3 && pct > 0.7;

    if (Platform.OS !== 'web') {
      celebrate
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // entry_point reflects HOW it was entered; state reflects the classification.
    // The server reads the answer (incl. free text) and generates the next question.
    const entryPoint: AnswerEntryPoint = params.id ? 'notification' : state ? 'chip' : 'text';
    await saveAnswer({
      questionId: question.id,
      state: effectiveState,
      freeText: customText.trim() || undefined,
      entryPoint,
      goalId: question.goalId,
    });

    fadeOut.value = withTiming(0, { duration: 250 }, finished => {
      if (finished) runOnJS(reveal)(celebrate, pct);
    });
    setSaving(false);
  };

  // Runs on the JS thread after the question fades out.
  const reveal = (celebrate: boolean, pct: number) => {
    if (celebrate) setCelebrationPct(pct);
    setAccepted(true);
    acceptIn.value = withTiming(1, { duration: 400 });
  };

  if (accepted) {
    const isCelebration = celebrationPct > 0;
    return (
      <GradientBackground>
        <Reanimated.View style={[styles.acceptedContainer, { paddingTop: insets.top + 24 }, acceptStyle]}>
          {isCelebration ? (
            <CelebrationMoment focusPct={celebrationPct} />
          ) : (
            <>
              <Reanimated.View ref={ringRef} onLayout={measureRing} style={[styles.acceptedRing, ringAnimStyle]} />
              <Text {...a11y.heading} style={styles.acceptedTitle}>Принято</Text>
              <Text {...a11y.body}    style={styles.acceptedBody}>
                Этого достаточно. Возвращайся к своему дню.
              </Text>
            </>
          )}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeAccepted, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.closeAcceptedText}>Закрыть</Text>
          </Pressable>
        </Reanimated.View>

        {/* Flying diamond overlay — lives at screen root so window coords map 1:1 */}
        {!isCelebration && (
          <Reanimated.View pointerEvents="none" style={[styles.flyDiamond, flyStyle]} />
        )}
      </GradientBackground>
    );
  }

  // Still fetching the question from Supabase.
  if (loadingQuestion) {
    return (
      <GradientBackground>
        <View style={[styles.stateContainer, { paddingTop: insets.top }]}>
          <Text {...a11y.body} style={styles.stateText}>Загружаю вопрос…</Text>
        </View>
      </GradientBackground>
    );
  }

  // No question to answer (in-app with nothing generated yet). The client can't
  // create questions — they come from the server — so we just wait.
  if (!question) {
    return (
      <GradientBackground>
        <View style={[styles.stateContainer, { paddingTop: insets.top }]}>
          <View style={styles.topBarFloating}>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <View style={styles.closeBtnInner}>
                <Feather name="x" size={18} color={colors.textDim} />
              </View>
            </Pressable>
          </View>
          <Feather name="clock" size={28} color={colors.textMuted} />
          <Text {...a11y.heading} style={styles.stateTitle}>Нового вопроса пока нет</Text>
          <Text {...a11y.body} style={styles.stateText}>
            Он придёт чуть позже — загляни, когда получишь напоминание.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeAccepted, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.closeAcceptedText}>Закрыть</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Reanimated.View style={[{ flex: 1 }, fadeStyle]}>
        <View style={[styles.container, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.topBar}>
            <DiamondMark size={22} />
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <View style={styles.closeBtnInner}>
                <Feather name="x" size={18} color={colors.textDim} />
              </View>
            </Pressable>
          </View>

          <View style={styles.context}>
            <Text {...a11y.fixed} style={styles.minutka}>Минутка</Text>
            {isActive && currentGoal && (
              <Badge
                variant="neutral"
                icon="target"
                iconColor={colors.teal}
                label={currentGoal.text}
                numberOfLines={1}
                style={styles.goalChip}
              />
            )}
          </View>

          <View style={styles.questionSection}>
            <FadeIn delay={80} distance={10}>
              <Text {...a11y.body} style={styles.question}>{question.text}</Text>
            </FadeIn>
          </View>

          <Stagger
            stagger={50}
            initialDelay={160}
            distance={8}
            style={styles.chips}
            childStyle={{ alignSelf: 'flex-start' }}
          >
            {chips.map(chip => (
              <ChipButton
                key={chip.state}
                chip={chip}
                isSelected={selected === chip.state}
                onSelect={setSelected}
              />
            ))}
          </Stagger>

          <GlassCard style={styles.textInputCard}>
            <TextInput
              value={customText}
              onChangeText={setCustomText}
              placeholder="Ответь подробнее — это прочитает ИИ и задаст следующий вопрос"
              placeholderTextColor={colors.placeholder}
              multiline
              style={styles.textInput}
              textAlignVertical="top"
            />
          </GlassCard>

          <View style={styles.actions}>
            <PrimaryButton
              label="Отправить"
              icon="arrow-right"
              loadingLabel="Сохраняю…"
              loading={saving}
              disabled={!selected && !customText.trim()}
              onPress={() => handleAnswer(selected)}
            />
            <Pressable onPress={() => router.back()} style={styles.laterBtn}>
              <Text style={styles.laterText}>Не сейчас</Text>
            </Pressable>
          </View>
        </View>
      </Reanimated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {},
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
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  minutka: {
    ...typography.bodySm,
    color: colors.textDim,
  },
  goalChip: { maxWidth: 160 },
  questionSection: {
    flex: 1,
    justifyContent: 'center',
  },
  question: {
    ...typography.h1,
    color: colors.textBright,
    lineHeight: 40,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    borderRadius: radii.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chipPress: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chipText: {
    ...typography.bodySm,
  },
  textInputCard: {
    padding: 14,
  },
  textInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 72,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  topBarFloating: {
    position: 'absolute',
    top: 0,
    right: 20,
    paddingTop: 14,
  },
  stateTitle: {
    ...typography.h2,
    color: colors.textBright,
    textAlign: 'center',
  },
  stateText: {
    ...typography.body,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: 8,
  },
  laterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  laterText: {
    ...typography.body,
    color: colors.textMuted,
  },
  acceptedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  acceptedRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.tealBg,
    borderWidth: 1,
    borderColor: colors.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyDiamond: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 34,
    height: 34,
    backgroundColor: colors.teal,
    borderRadius: 8,
  },
  acceptedTitle: {
    ...typography.h1,
    color: colors.textBright,
    textAlign: 'center',
  },
  acceptedBody: {
    ...typography.bodyLg,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 24,
  },
  closeAccepted: {
    marginTop: 4,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeAcceptedText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
