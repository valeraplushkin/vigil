import { Redirect } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { colors } from '@/constants/tokens';
import { useApp } from '@/context/AppContext';

export default function RootIndex() {
  const { isReady, onboardingDone } = useApp();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
