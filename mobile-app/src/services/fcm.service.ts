import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { USE_MOCK } from '../constants/mockData';

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
  if (USE_MOCK || Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    const pushToken = token.data;
    const user = auth.currentUser;
    if (user) await updateDoc(doc(db, 'users', user.uid), { fcmToken: pushToken });
    return pushToken;
  } catch {
    return null;
  }
};

export const sendLocalNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
};

export const setupNotificationListeners = (
  onNotification?: (n: Notifications.Notification) => void,
  onResponse?: (r: Notifications.NotificationResponse) => void,
) => {
  const sub1 = Notifications.addNotificationReceivedListener(n => onNotification?.(n));
  const sub2 = Notifications.addNotificationResponseReceivedListener(r => onResponse?.(r));

  return () => {
    sub1.remove();
    sub2.remove();
  };
};
