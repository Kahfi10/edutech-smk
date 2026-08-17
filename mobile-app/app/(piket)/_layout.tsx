import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { AnimatedTabBar } from '../../src/components/shared/AnimatedTabBar';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons name={focused ? name : `${name}-outline` as IoniconsName} size={22} color={focused ? Colors.black : Colors.gray7} />
);

export default function PiketLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard"  options={{ title: 'Beranda',   tabBarIcon: ({ focused }) => tabIcon('home', focused) }} />
      <Tabs.Screen name="qr-scan"    options={{ title: 'Scan',      tabBarIcon: ({ focused }) => tabIcon('qr-code', focused) }} />
      <Tabs.Screen name="daily-log"  options={{ title: 'Buku Piket',tabBarIcon: ({ focused }) => tabIcon('book', focused) }} />
      <Tabs.Screen name="broadcast"  options={{ title: 'Siaran',    tabBarIcon: ({ focused }) => tabIcon('megaphone', focused) }} />
    </Tabs>
  );
}
