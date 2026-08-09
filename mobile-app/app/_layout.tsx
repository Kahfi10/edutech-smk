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
};

// AuthGuard selalu mounted — menangani redirect login/logout dari mana saja
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!profile && !inAuthGroup) {
      // Sudah logout / belum login → redirect ke login
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      // Sudah login tapi masih di auth screen → redirect ke dashboard
      const route = ROLE_ROUTES[profile.role] ?? '/(auth)/login';
      router.replace(route as any);
    }
  }, [profile, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const isExpoGo = typeof (global as any).__expo_module_core__ === 'undefined';
    if (isExpoGo) return;
    import('../src/services/fcm.service').then(({ registerForPushNotifications, setupNotificationListeners }) => {
      registerForPushNotifications();
      setupNotificationListeners((n) => console.log('Notif:', n.request.content.title));
    });
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
              </Stack>
              <MockRoleSwitcher />
            </View>
          </AuthGuard>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
