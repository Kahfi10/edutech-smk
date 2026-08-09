import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons name={focused ? name : `${name}-outline` as IoniconsName} size={24} color={focused ? Colors.black : Colors.gray7} />
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
      <Tabs.Screen name="materials/[subjectId]" options={{ title: 'Materi',   tabBarIcon: ({ focused }) => tabIcon('book', focused) }} />
      <Tabs.Screen name="assignments/index"     options={{ title: 'Tugas',    tabBarIcon: ({ focused }) => tabIcon('document-text', focused) }} />
      <Tabs.Screen name="grades"     options={{ title: 'Nilai',    tabBarIcon: ({ focused }) => tabIcon('star', focused) }} />
      <Tabs.Screen name="attendance" options={{ title: 'Absensi',  tabBarIcon: ({ focused }) => tabIcon('calendar', focused) }} />
    </Tabs>
  );
}

import { StyleSheet } from 'react-native';
