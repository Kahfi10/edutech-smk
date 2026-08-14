import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons
    name={focused ? name : `${name}-outline` as IoniconsName}
    size={22}
    color={focused ? Colors.black : Colors.gray7}
  />
);

export default function TeacherLayout() {
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
      <Tabs.Screen name="dashboard"          options={{ title: 'Beranda', tabBarIcon: ({ focused }) => tabIcon('home', focused) }} />
      <Tabs.Screen name="upload-material"    options={{ title: 'Materi',  tabBarIcon: ({ focused }) => tabIcon('cloud-upload', focused) }} />
      <Tabs.Screen name="assignments/create" options={{ title: 'Tugas',   tabBarIcon: ({ focused }) => tabIcon('create', focused) }} />
      <Tabs.Screen name="assignments/quiz"   options={{ title: 'Kuis',    tabBarIcon: ({ focused }) => tabIcon('help-circle', focused) }} />
      <Tabs.Screen name="assignments/grade"  options={{ title: 'Nilai',   tabBarIcon: ({ focused }) => tabIcon('checkmark-circle', focused) }} />
      <Tabs.Screen name="attendance"         options={{ title: 'Absensi', tabBarIcon: ({ focused }) => tabIcon('list', focused) }} />
      <Tabs.Screen name="chat"               options={{ title: 'Chat',    tabBarIcon: ({ focused }) => tabIcon('chatbubble', focused) }} />
    </Tabs>
  );
}
