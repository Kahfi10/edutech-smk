import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { AnimatedTabBar } from '../../src/components/shared/AnimatedTabBar';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons name={focused ? name : `${name}-outline` as IoniconsName} size={22} color={focused ? Colors.black : Colors.gray7} />
);

export default function AdminLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard"     options={{ title: 'Dashboard',   tabBarIcon: ({ focused }) => tabIcon('grid', focused) }} />
      <Tabs.Screen name="users"         options={{ title: 'Pengguna',    tabBarIcon: ({ focused }) => tabIcon('people', focused) }} />
      <Tabs.Screen name="violations"    options={{ title: 'Pelanggaran', tabBarIcon: ({ focused }) => tabIcon('warning', focused) }} />
      <Tabs.Screen name="attendance"    options={{ title: 'Absensi',     tabBarIcon: ({ focused }) => tabIcon('calendar', focused) }} />
      <Tabs.Screen name="announcements" options={{ title: 'Pengumuman',  tabBarIcon: ({ focused }) => tabIcon('megaphone', focused) }} />
      {/* index.tsx tetap ada tapi hidden — hanya dipakai di web (redirect) */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
