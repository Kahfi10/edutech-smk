import { Tabs } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { borderTopColor: '#E2E8F0' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="upload-material"
        options={{ title: 'Upload Materi', tabBarLabel: 'Materi', tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} /> }}
      />
      <Tabs.Screen
        name="assignments/create"
        options={{ title: 'Buat Tugas', tabBarLabel: 'Tugas', tabBarIcon: ({ color }) => <TabIcon emoji="📝" color={color} /> }}
      />
      <Tabs.Screen
        name="assignments/grade"
        options={{ title: 'Nilai Tugas', tabBarLabel: 'Nilai', tabBarIcon: ({ color }) => <TabIcon emoji="⭐" color={color} /> }}
      />
      <Tabs.Screen
        name="attendance"
        options={{ title: 'Absensi', tabBarLabel: 'Absensi', tabBarIcon: ({ color }) => <TabIcon emoji="✅" color={color} /> }}
      />
    </Tabs>
  );
}

const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#94A3B8' ? 0.5 : 1 }}>{emoji}</Text>;
};
