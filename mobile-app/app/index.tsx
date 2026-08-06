import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { ROLES } from '../src/constants/roles';

export default function Index() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user || !profile) {
      router.replace('/(auth)/login');
      return;
    }

    switch (profile.role) {
      case ROLES.STUDENT:
        router.replace('/(student)/dashboard');
        break;
      case ROLES.TEACHER:
        router.replace('/(teacher)/dashboard');
        break;
      case ROLES.WALI:
        router.replace('/(wali)/dashboard');
        break;
      case ROLES.BK:
        router.replace('/(bk)/dashboard');
        break;
      case ROLES.PIKET:
        router.replace('/(piket)/dashboard');
        break;
      case ROLES.ADMIN:
        router.replace('/(auth)/login');
        break;
      default:
        router.replace('/(auth)/login');
    }
  }, [loading, user, profile]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4F46E5' }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}
