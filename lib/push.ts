import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// как показывать уведомление, когда приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken(): Promise<string | null> {
  
  // 2. спросить разрешение
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[push] разрешение не выдано');
    return null;
  }

  // 3. канал уведомлений для Android (обязательно)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // 4. получить Expo push token
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    console.log('[push] projectId не найден');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;
  console.log('[push] expo token:', token);

  // 5. записать токен в push_token (привязать к текущему юзеру)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('[push] нет сессии — токен не сохранён');
    return token;
  }

  const { error } = await supabase
    .from('push_token')
    .upsert(
      { user_id: session.user.id, expo_token: token, platform: Platform.OS },
      { onConflict: 'expo_token' }
    );
  if (error) console.log('[push] ошибка записи токена:', error.message);
  else console.log('[push] токен сохранён в БД');

  return token;
}