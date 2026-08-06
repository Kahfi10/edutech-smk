import { Tabs } from 'expo-router';
import { Text } from 'react-native';
const Icon = ({ e, c }: { e: string; c: string }) => <Text style={{ fontSize: 20, opacity: c === '#94A3B8' ? 0.5 : 1 }}>{e}</Text>;
export default function BKLayout() {
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: '#DC2626' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '700' }, tabBarActiveTintColor: '#DC2626', tabBarInactiveTintColor: '#94A3B8' }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard BK', tabBarIcon: ({ color }) => <Icon e="🏠" c={color} /> }} />
      <Tabs.Screen name="counseling/schedule" options={{ title: 'Jadwal', tabBarIcon: ({ color }) => <Icon e="📅" c={color} /> }} />
      <Tabs.Screen name="counseling/cases" options={{ title: 'Kasus', tabBarIcon: ({ color }) => <Icon e="📋" c={color} /> }} />
      <Tabs.Screen name="chat/[studentId]" options={{ title: 'Chat Rahasia', tabBarIcon: ({ color }) => <Icon e="💬" c={color} /> }} />
    </Tabs>
  );
}
