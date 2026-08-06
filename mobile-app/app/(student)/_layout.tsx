import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 20, opacity: color === '#94A3B8' ? 0.5 : 1 }}>{emoji}</Text>
);

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { borderTopColor: '#E2E8F0' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Beranda', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="materials/[subjectId]" options={{ title: 'Materi', tabBarLabel: 'Materi', tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} /> }} />
      <Tabs.Screen name="assignments/index" options={{ title: 'Tugas', tabBarLabel: 'Tugas', tabBarIcon: ({ color }) => <TabIcon emoji="📝" color={color} /> }} />
      <Tabs.Screen name="grades" options={{ title: 'Nilai', tabBarLabel: 'Nilai', tabBarIcon: ({ color }) => <TabIcon emoji="⭐" color={color} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Absensi', tabBarLabel: 'Absensi', tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }} />
    </Tabs>
  );
}
