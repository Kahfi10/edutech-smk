import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperTheme } from '../src/constants/paperTheme';
import { MockRoleSwitcher } from '../src/components/shared/MockRoleSwitcher';

const ROLE_ROUTES: Record<string, string> = {
  STUDENT: '/(student)/dashboard',
  TEACHER: '/(teacher)/dashboard',
  WALI:    '/(wali)/dashboard',
  BK:      '/(bk)/dashboard',
  PIKET:   '/(piket)/dashboard',
  ADMIN:   '/(admin)',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!profile && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      // Admin di web → langsung redirect ke admin panel
      if (profile.role === 'ADMIN' && Platform.OS === 'web') {
        (window as any).location.href = 'https://edutech-smk-admin.web.app';
        return;
      }
      const route = ROLE_ROUTES[profile.role] ?? '/(auth)/login';
      router.replace(route as any);
    }
  }, [profile, loading, segments]);

  // Trigger demo notifications saat pertama kali login
  useEffect(() => {
    if (!profile || Platform.OS === 'web') return;
    import('../src/services/fcm.service').then(({ triggerDemoNotifications }) => {
      // Delay 3 detik setelah masuk dashboard baru trigger notif
      setTimeout(() => triggerDemoNotifications(profile.role), 3000);
    });
  }, [profile?.uid]); // hanya saat UID berubah (login baru)

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    // Register izin notifikasi dan setup listener
    import('../src/services/fcm.service').then(
      ({ registerForPushNotifications, setupNotificationListeners }) => {
        registerForPushNotifications();
        setupNotificationListeners();
      }
    );
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={PaperTheme}>
        <AuthProvider>
          <AuthGuard>
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
                <Stack.Screen name="(admin)" />
              </Stack>
              <MockRoleSwitcher />
            </View>
          </AuthGuard>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
