import { Tabs } from 'expo-router';
import { Text } from 'react-native';
const Icon = ({ e, c }: { e: string; c: string }) => <Text style={{ fontSize: 20, opacity: c === '#94A3B8' ? 0.5 : 1 }}>{e}</Text>;
export default function WaliLayout() {
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: '#D97706' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '700' }, tabBarActiveTintColor: '#D97706', tabBarInactiveTintColor: '#94A3B8' }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Icon e="🏠" c={color} /> }} />
      <Tabs.Screen name="students" options={{ title: 'Siswa', tabBarIcon: ({ color }) => <Icon e="👥" c={color} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alert', tabBarIcon: ({ color }) => <Icon e="🚨" c={color} /> }} />
      <Tabs.Screen name="violations" options={{ title: 'Pelanggaran', tabBarIcon: ({ color }) => <Icon e="⚠️" c={color} /> }} />
    </Tabs>
  );
}
