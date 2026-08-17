import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { subscribeCollection } from '../../src/firebase/firestore.service';
import { SkeletonDashboard } from '../../src/components/ui/Skeleton';
import { AnimatedNumber } from '../../src/components/ui/AnimatedNumber';
import { hapticWarning } from '../../src/services/haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function PiketDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [todayLog, setTodayLog] = useState<any>(null);
  const [stats, setStats] = useState({ terlambat: 0, izin_pulang: 0, kejadian: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }, []);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeCollection('piket_logs', (data) => {
      const log = data.find((l: any) => l.date === today && l.piketTeacherId === profile.uid);
      setTodayLog(log ?? null);
      if (log?.events) {
        const s = { terlambat: 0, izin_pulang: 0, kejadian: 0 };
        log.events.forEach((e: any) => { if (e.type in s) (s as any)[e.type]++; });
        setStats(s);
      } else {
        setStats({ terlambat: 0, izin_pulang: 0, kejadian: 0 });
      }
      setLoading(false);
    });
    return unsub;
  }, [profile]);

  if (loading) return <SkeletonDashboard rows={3} />;

  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const NAV = [
    { label: 'Scan QR / Input NISN', icon: 'qr-code-outline',  route: '/(piket)/qr-scan'   },
    { label: 'Buku Piket Digital',   icon: 'book-outline',      route: '/(piket)/daily-log' },
    { label: 'Siaran Pengumuman',    icon: 'megaphone-outline', route: '/(piket)/broadcast' },
  ] as const;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.role}>Guru Piket</Text>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <TouchableOpacity
          onPress={() => { hapticWarning(); logoutUser(); }}
          style={styles.logoutBtn} hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gray5} colors={[Colors.black]} />}
      >
        {/* Stats */}
        <Text style={styles.sectionTitle}>Rekap Hari Ini</Text>
        <View style={styles.statsRow}>
          {[
            { label: 'Terlambat',   value: stats.terlambat   },
            { label: 'Izin Pulang', value: stats.izin_pulang },
            { label: 'Kejadian',    value: stats.kejadian    },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <AnimatedNumber value={s.value} style={styles.statValue as any} />
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Nav */}
        <Text style={styles.sectionTitle}>Aksi</Text>
        <View style={styles.listCard}>
          {NAV.map((n, i) => (
            <View key={n.label}>
              <TouchableOpacity
                style={styles.navRow}
                onPress={() => router.push(n.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.navIcon}>
                  <Ionicons name={n.icon as any} size={20} color={Colors.gray3} />
                </View>
                <Text style={styles.navLabel}>{n.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray8} />
              </TouchableOpacity>
              {i < NAV.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* Today's log */}
        {todayLog?.events?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Log Kejadian</Text>
            <View style={styles.listCard}>
              {(todayLog.events as any[]).slice(0, 8).map((e: any, i: number) => (
                <View key={i}>
                  <View style={styles.eventRow}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeText}>{e.time}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventType}>
                        {e.type === 'terlambat' ? 'Terlambat'
                          : e.type === 'izin_pulang' ? 'Izin Pulang' : 'Kejadian'}
                      </Text>
                      <Text style={styles.eventDesc} numberOfLines={1}>{e.description}</Text>
                    </View>
                  </View>
                  {i < todayLog.events.length - 1 && (
                    <View style={[styles.rowDivider, { marginLeft: Spacing.base + 50 }]} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  role: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  name: { ...Typography.title2, color: Colors.white },
  date: { ...Typography.caption1, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.base, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 3,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  statValue: { ...Typography.title2, color: Colors.black },
  statLabel: { ...Typography.caption2, color: Colors.tertiaryLabel, textAlign: 'center' },
  listCard: {
    backgroundColor: Colors.cardBackground, marginHorizontal: Spacing.base,
    borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 13, gap: 12,
  },
  navIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: Colors.gray11, alignItems: 'center', justifyContent: 'center',
  },
  navLabel: { ...Typography.body, flex: 1 },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base },
  eventRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.base, paddingVertical: 12, gap: 10,
  },
  timeBox: {
    width: 42, paddingTop: 1,
  },
  timeText: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600' },
  eventType: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  eventDesc: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
});
