import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Konfigurasi handler notifikasi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  const pushToken = token.data;

  // Simpan token ke Firestore
  const user = auth.currentUser;
  if (user) {
    await updateDoc(doc(db, 'users', user.uid), { fcmToken: pushToken });
  }

  return pushToken;
};

export const sendLocalNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
};

export const setupNotificationListeners = (
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void
) => {
  const notifListener = Notifications.addNotificationReceivedListener(n => {
    onNotification?.(n);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(r => {
    onResponse?.(r);
  });

  return () => {
    Notifications.removeNotificationSubscription(notifListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};
