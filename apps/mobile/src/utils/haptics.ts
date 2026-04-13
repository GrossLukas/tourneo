import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// ============================================
// TOURNEO - Haptic Feedback Utility
// Premium tactile feedback for key actions
// ============================================

export const haptic = {
  /** Light tap - tab switches, toggles, chip selection */
  light: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /** Medium tap - button presses, card selections */
  medium: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /** Heavy tap - important actions, confirmations */
  heavy: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /** Success - registration confirmed, check-in, payment success */
  success: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /** Warning - waitlist, expiring soon */
  warning: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /** Error - failed action, validation error */
  error: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  /** Selection change - picker, segment control */
  selection: () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  },
};