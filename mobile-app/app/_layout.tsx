import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperTheme } from '../src/constants/paperTheme';
import { registerForPushNotifications, setupNotificationListeners } from '../src/services/fcm.service';

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications();
    const cleanup = setupNotificationListeners(
      (n) => console.log('Notif:', n.request.content.title),
    );
    return cleanup;
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={PaperTheme}>
        <AuthProvider>
          <StatusBar style="dark" />
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
      </PaperProvider>
    </SafeAreaProvider>
  );
}
