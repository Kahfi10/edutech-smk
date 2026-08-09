import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons name={focused ? name : `${name}-outline` as IoniconsName} size={24} color={focused ? Colors.black : Colors.gray7} />
);

export default function BKLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.gray7,
        tabBarStyle: { backgroundColor: Colors.cardBackground, borderTopColor: Colors.separator, borderTopWidth: StyleSheet.hairlineWidth },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard"            options={{ title: 'Beranda', tabBarIcon: ({ focused }) => tabIcon('home', focused) }} />
      <Tabs.Screen name="counseling/schedule"  options={{ title: 'Jadwal',  tabBarIcon: ({ focused }) => tabIcon('calendar', focused) }} />
      <Tabs.Screen name="counseling/cases"     options={{ title: 'Kasus',   tabBarIcon: ({ focused }) => tabIcon('folder', focused) }} />
      <Tabs.Screen name="chat/[studentId]"     options={{ title: 'Chat',    tabBarIcon: ({ focused }) => tabIcon('chatbubbles', focused) }} />
    </Tabs>
  );
}
