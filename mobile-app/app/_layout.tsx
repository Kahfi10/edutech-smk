import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperTheme } from '../src/constants/paperTheme';
import { MockRoleSwitcher } from '../src/components/shared/MockRoleSwitcher';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

const ROLE_ROUTES: Record<string, string> = {
  STUDENT: '/(student)/dashboard',
  TEACHER: '/(teacher)/dashboard',
  WALI:    '/(wali)/dashboard',
  BK:      '/(bk)/dashboard',
  PIKET:   '/(piket)/dashboard',
  ADMIN:   '/(admin)',
};

// AuthGuard — selalu mounted, tangani redirect login/logout
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
      if (profile.role === 'ADMIN' && Platform.OS === 'web') {
        (window as any).location.href = 'https://edutech-smk-admin.web.app';
        return;
      }
      const route = ROLE_ROUTES[profile.role] ?? '/(auth)/login';
      router.replace(route as any);
    }
  }, [profile, loading, segments]);

  // Demo notifications on login (mobile only)
  useEffect(() => {
    if (!profile || Platform.OS === 'web') return;
    import('../src/services/fcm.service').then(({ triggerDemoNotifications }) => {
      setTimeout(() => triggerDemoNotifications(profile.role), 3000);
    });
  }, [profile?.uid]);

  return <>{children}</>;
}

export default function RootLayout() {
  // SEMUA hooks harus di atas — tidak boleh ada hook setelah conditional return
  const [fontsLoaded] = useFonts(Ionicons.font);

  // Register FCM (mobile only)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('../src/services/fcm.service').then(
      ({ registerForPushNotifications, setupNotificationListeners }) => {
        registerForPushNotifications();
        setupNotificationListeners();
      }
    );
  }, []);

  // Web: tunggu font load agar ikon tidak tampil sebagai □
  // Mobile: langsung render (font sudah bundled native)
  if (Platform.OS === 'web' && !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' }}>
        <ActivityIndicator size="large" color="#1D1D1F" />
      </View>
    );
  }

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
