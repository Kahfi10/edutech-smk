import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { USE_MOCK } from '../src/constants/mockData';
import { Colors } from '../src/constants/theme';
import { ROLES } from '../src/constants/roles';

const ROLE_ROUTES: Record<string, string> = {
  STUDENT: '/(student)/dashboard',
  TEACHER: '/(teacher)/dashboard',
  WALI:    '/(wali)/dashboard',
  BK:      '/(bk)/dashboard',
  PIKET:   '/(piket)/dashboard',
  ADMIN:   '/(auth)/login',
};

export default function Index() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.replace('/(auth)/login');
      return;
    }

    const route = ROLE_ROUTES[profile.role] ?? '/(auth)/login';
    router.replace(route as any);
  }, [loading, profile]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
      <ActivityIndicator size="large" color={Colors.white} />
    </View>
  );
}
