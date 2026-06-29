import { router } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, typography } from '@/constants/tokens';

const PRIVACY_UPDATED = '28 июня 2026';
const PRIVACY_URL = 'https://vigil.app/privacy';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionLabel } from '@/components/SectionLabel';

interface InfoBlockProps {
  icon: string;
  title: string;
  body: string;
}

function InfoBlock({ icon, title, body }: InfoBlockProps) {
  return (
    <GlassCard style={styles.block}>
      <View style={styles.blockHeader}>
        <Feather name={icon as any} size={16} color={colors.teal} />
        <Text style={styles.blockTitle}>{title}</Text>
      </View>
      <Text style={styles.blockBody}>{body}</Text>
    </GlassCard>
  );
}

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.textDim} />
          </Pressable>
          <ScreenTitle style={styles.title}>Что уходит в ИИ</ScreenTitle>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.intro}>
            <Text style={styles.introText}>
              Vigil использует ИИ только для генерации вопросов и зеркала дня. Мы передаём минимум данных — ровно столько, чтобы вопросы были уместными.
            </Text>
          </GlassCard>

          <SectionLabel>Что передаётся</SectionLabel>

          <InfoBlock
            icon="target"
            title="Цель дня"
            body="Если задана — текст цели передаётся, чтобы вопросы были про неё. Без цели — вопросы про здесь-и-сейчас."
          />
          <InfoBlock
            icon="bar-chart-2"
            title="Агрегат ответов"
            body="Не тексты твоих ответов, а только сводка: сколько раз «В фокусе», «Отвлёкся», «Пауза» за последние несколько часов."
          />
          <InfoBlock
            icon="sliders"
            title="Режим и контекст"
            body="Активный или пассивный режим, время суток. Контекст из профиля — только если ты его сам написал."
          />

          <SectionLabel>Что не передаётся</SectionLabel>

          <InfoBlock
            icon="x-circle"
            title="Тексты свободных ответов"
            body="Если ты написал что-то в поле «Свой ответ» — это остаётся только на устройстве, в ИИ не уходит."
          />
          <InfoBlock
            icon="x-circle"
            title="Личные данные"
            body="Имя, контакты, геолокация, переписки — ничего подобного Vigil не запрашивает и не собирает."
          />
          <InfoBlock
            icon="x-circle"
            title="История прошлых дней"
            body="ИИ получает только короткий скользящий контекст текущего дня. Старые ответы не передаются."
          />

          <GlassCard style={styles.footer} dimmer>
            <Feather name="lock" size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>
              Ключ к ИИ хранится на сервере и никогда не попадает на устройство. Все данные между приложением и сервером передаются по защищённому каналу.
            </Text>
          </GlassCard>

          <View style={styles.meta}>
            <Text style={styles.metaText}>Обновлено {PRIVACY_UPDATED}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Pressable
              onPress={() => Linking.openURL(PRIVACY_URL)}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel="Открыть полную версию политики"
            >
              <Text style={styles.metaLink}>Полная версия</Text>
            </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2 },
  scroll: { paddingHorizontal: 22, gap: 10, paddingTop: 8 },
  intro: { gap: 0 },
  introText: {
    ...typography.body,
    color: colors.textDim,
    lineHeight: 22,
  },
  block: { gap: 8 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockTitle: { ...typography.h4, color: colors.text },
  blockBody: {
    ...typography.bodySm,
    color: colors.textDim,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  footerText: {
    ...typography.caption,
    flex: 1,
    color: colors.textMuted,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
  },
  metaText: { ...typography.caption, color: colors.textFaint },
  metaDot:  { ...typography.caption, color: colors.textFaint },
  metaLink: { ...typography.caption, color: colors.teal },
});
