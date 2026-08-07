import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons name={focused ? name : `${name}-outline` as IoniconsName} size={24} color={focused ? Colors.black : Colors.gray7} />
);

export default function WaliLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.gray7,
        tabBarStyle: { backgroundColor: Colors.cardBackground, borderTopColor: Colors.separator, borderTopWidth: StyleSheet.hairlineWidth },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard"  options={{ title: 'Beranda',     tabBarIcon: ({ focused }) => tabIcon('home', focused) }} />
      <Tabs.Screen name="students"   options={{ title: 'Siswa',       tabBarIcon: ({ focused }) => tabIcon('people', focused) }} />
      <Tabs.Screen name="alerts"     options={{ title: 'Alert',       tabBarIcon: ({ focused }) => tabIcon('alert-circle', focused) }} />
      <Tabs.Screen name="violations" options={{ title: 'Pelanggaran', tabBarIcon: ({ focused }) => tabIcon('warning', focused) }} />
    </Tabs>
  );
}
