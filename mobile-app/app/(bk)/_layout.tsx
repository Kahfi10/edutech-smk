import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { AnimatedTabBar } from '../../src/components/shared/AnimatedTabBar';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons name={focused ? name : `${name}-outline` as IoniconsName} size={22} color={focused ? Colors.black : Colors.gray7} />
);

export default function BKLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard"            options={{ title: 'Beranda', tabBarIcon: ({ focused }) => tabIcon('home', focused) }} />
      <Tabs.Screen name="counseling/schedule"  options={{ title: 'Jadwal',  tabBarIcon: ({ focused }) => tabIcon('calendar', focused) }} />
      <Tabs.Screen name="counseling/cases"     options={{ title: 'Kasus',   tabBarIcon: ({ focused }) => tabIcon('folder', focused) }} />
      <Tabs.Screen name="chat/[studentId]"     options={{ title: 'Chat',    tabBarIcon: ({ focused }) => tabIcon('chatbubbles', focused) }} />
    </Tabs>
  );
}
