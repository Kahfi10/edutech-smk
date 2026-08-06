import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { registerForPushNotifications, setupNotificationListeners } from '../src/services/fcm.service';

export default function RootLayout() {
  useEffect(() => {
    // Request push notification permission & register token
    registerForPushNotifications();

    // Setup listener
    const cleanup = setupNotificationListeners(
      (n) => console.log('Notif diterima:', n.request.content.title),
    );
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="(wali)" />
        <Stack.Screen name="(bk)" />
        <Stack.Screen name="(piket)" />
        <Stack.Screen name="(shared)" />
      </Stack>
    </AuthProvider>
  );
}
