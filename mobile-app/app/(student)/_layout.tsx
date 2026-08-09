import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons
    name={focused ? name : `${name}-outline` as IoniconsName}
    size={24}
    color={focused ? Colors.black : Colors.gray7}
  />
);

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.gray7,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopColor: Colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard"  options={{ title: 'Beranda',  tabBarIcon: ({ focused }) => tabIcon('home', focused) }} />
      <Tabs.Screen name="schedule"   options={{ title: 'Jadwal',   tabBarIcon: ({ focused }) => tabIcon('calendar', focused) }} />
      <Tabs.Screen name="assignments/index" options={{ title: 'Tugas', tabBarIcon: ({ focused }) => tabIcon('document-text', focused) }} />
      <Tabs.Screen name="quiz"       options={{ title: 'Kuis',     tabBarIcon: ({ focused }) => tabIcon('help-circle', focused) }} />
      <Tabs.Screen name="grades"     options={{ title: 'Nilai',    tabBarIcon: ({ focused }) => tabIcon('star', focused) }} />
      <Tabs.Screen name="chat"       options={{ title: 'Chat',     tabBarIcon: ({ focused }) => tabIcon('chatbubble', focused) }} />
    </Tabs>
  );
}
