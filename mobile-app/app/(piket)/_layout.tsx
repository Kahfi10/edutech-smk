import { Tabs } from 'expo-router';
import { Text } from 'react-native';
const Icon = ({ e, c }: { e: string; c: string }) => <Text style={{ fontSize: 20, opacity: c === '#94A3B8' ? 0.5 : 1 }}>{e}</Text>;
export default function PiketLayout() {
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: '#7C3AED' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: '700' }, tabBarActiveTintColor: '#7C3AED', tabBarInactiveTintColor: '#94A3B8' }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard Piket', tabBarIcon: ({ color }) => <Icon e="🏠" c={color} /> }} />
      <Tabs.Screen name="qr-scan" options={{ title: 'Scan QR', tabBarIcon: ({ color }) => <Icon e="📱" c={color} /> }} />
      <Tabs.Screen name="daily-log" options={{ title: 'Buku Piket', tabBarIcon: ({ color }) => <Icon e="📔" c={color} /> }} />
      <Tabs.Screen name="broadcast" options={{ title: 'Broadcast', tabBarIcon: ({ color }) => <Icon e="📢" c={color} /> }} />
    </Tabs>
  );
}
