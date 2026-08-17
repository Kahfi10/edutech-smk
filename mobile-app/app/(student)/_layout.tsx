import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { AnimatedTabBar } from '../../src/components/shared/AnimatedTabBar';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon = (name: IoniconsName, focused: boolean) => (
  <Ionicons
    name={focused ? name : `${name}-outline` as IoniconsName}
    size={22}
    color={focused ? Colors.black : Colors.gray7}
  />
);

export default function StudentLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* TAB UTAMA — tampil di tab bar */}
      <Tabs.Screen name="dashboard"  options={{ title: 'Beranda', tabBarIcon: ({ focused }) => tabIcon('home', focused) }} />
      <Tabs.Screen name="schedule"   options={{ title: 'Jadwal',  tabBarIcon: ({ focused }) => tabIcon('calendar', focused) }} />
      <Tabs.Screen name="assignments/index" options={{ title: 'Tugas', tabBarIcon: ({ focused }) => tabIcon('document-text', focused) }} />
      <Tabs.Screen name="quiz"       options={{ title: 'Kuis',    tabBarIcon: ({ focused }) => tabIcon('help-circle', focused) }} />
      <Tabs.Screen name="grades"     options={{ title: 'Nilai',   tabBarIcon: ({ focused }) => tabIcon('star', focused) }} />

      {/* SCREENS TAMBAHAN — disembunyikan dari tab bar, diakses via dashboard menu */}
      <Tabs.Screen name="chat"          options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="attendance"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="violations"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="bk-booking"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="qr-card"       options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="absensi-scan"  options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="materials/[subjectId]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
