import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/context/AppContext';
import { ensureSession } from '@/lib/auth';
import { registerPushToken } from '@/lib/push';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';


SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();


function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="question"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="report"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    ensureSession()
      .then(({ user }) => {
        if (user) {
          console.log('[auth] user.id:', user.id, '| is_anonymous:', user.is_anonymous);
        } else {
          console.log('[auth] no session');
        }
      })
      .catch(e => console.log('[auth] ensureSession failed:', e));
  }, []);

  useEffect(() => {
    registerPushToken().catch(e => console.log('[push] registerPushToken failed:', e));
  }, []);
  
  const router = useRouter();

  useEffect(() => {
    // Тап по уведомлению когда приложение открыто / в фоне
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const questionId = response.notification.request.content.data?.question_id as string | undefined;
      if (questionId) {
        router.push(`/question?id=${questionId}`);
      }
    });

    // Killed state: приложение открылось через тап по уведомлению
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (!response) return;
        const questionId = response.notification.request.content.data?.question_id as string | undefined;
        if (questionId) {
          // Небольшая задержка — роутер должен инициализироваться
          setTimeout(() => router.push(`/question?id=${questionId}`), 300);
        }
      })
      .catch(e => console.log('[notifications] getLastResponse failed:', e));

    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </AppProvider>
  );
}
