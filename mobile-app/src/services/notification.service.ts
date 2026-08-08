/**
 * Notification Service — EduTech SMK
 * Wrapper untuk local notifications (FCM remote tidak support di Expo Go)
 */
import { Platform } from 'react-native';

export const sendLocalAlert = async (title: string, body: string) => {
  if (Platform.OS === 'web') return;
  try {
    const { sendLocalNotification } = await import('./fcm.service');
    await sendLocalNotification(title, body);
  } catch {
    console.log('[Notification]', title, body);
  }
};
