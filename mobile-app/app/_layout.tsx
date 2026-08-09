import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperTheme } from '../src/constants/paperTheme';
import { MockRoleSwitcher } from '../src/components/shared/MockRoleSwitcher';
import { USE_MOCK } from '../src/constants/mockData';

export default function RootLayout() {
  useEffect(() => {
    // expo-notifications remote push tidak didukung di Expo Go SDK 53+
    // Skip registrasi FCM di Expo Go, hanya aktif di production build
    if (Platform.OS === 'web') return;

    // Cek apakah berjalan di Expo Go (bukan development build)
    const isExpoGo = typeof (global as any).__expo_module_core__ === 'undefined';
    if (isExpoGo) return; // Skip FCM di Expo Go

    import('../src/services/fcm.service').then(({ registerForPushNotifications, setupNotificationListeners }) => {
      registerForPushNotifications();
      setupNotificationListeners((n) => console.log('Notif:', n.request.content.title));
    });
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={PaperTheme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(student)" />
              <Stack.Screen name="(teacher)" />
              <Stack.Screen name="(wali)" />
              <Stack.Screen name="(bk)" />
              <Stack.Screen name="(piket)" />
            </Stack>
            <MockRoleSwitcher />
          </View>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
