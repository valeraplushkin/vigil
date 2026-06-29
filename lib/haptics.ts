import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Centralized, web-safe haptics. Use `selection` for any "picked / toggled
// among options" interaction (chips, radio, segments) so feedback is uniform.
export const haptics = {
  selection: () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  },
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(style);
  },
  success: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
