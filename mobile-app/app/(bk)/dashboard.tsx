import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { subscribeCollection, getCollection } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function BKDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ booked: 0, ongoing: 0, resolved: 0 });
  const [pendingViolations, setPendingViolations] = useState(0);
  const [trendData, setTrendData] = useState<{ type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeCollection('counseling', (data) => {
      const mine = data.filter((c: any) => c.bkTeacherId === profile.uid);
      setStats({
        booked:   mine.filter((c: any) => c.status === 'booked').length,
        ongoing:  mine.filter((c: any) => c.status === 'ongoing').length,
        resolved: mine.filter((c: any) => c.status === 'resolved').length,
      });
      const trend: Record<string, number> = {};
      mine.forEach((c: any) => { trend[c.type] = (trend[c.type] ?? 0) + 1; });
      setTrendData(Object.entries(trend).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count));
      setLoading(false);
    });

    getCollection('violations').then(v =>
      setPendingViolations((v as any[]).filter(x => x.status === 'pending').length)
    );
    return unsub;
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  const maxCount = Math.max(...trendData.map(t => t.count), 1);

  const NAV = [
    { label: 'Jadwal Konseling',    icon: 'calendar-outline',    route: '/(bk)/counseling/schedule' },
    { label: 'Manajemen Kasus',     icon: 'folder-outline',      route: '/(bk)/counseling/cases'    },
    { label: 'Chat Konfidensial',   icon: 'chatbubbles-outline',  route: '/(bk)/chat/all'            },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.role}>Guru Bimbingan Konseling</Text>
          <Text style={styles.name}>{profile?.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Keluar', 'Yakin?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Keluar', style: 'destructive', onPress: logoutUser },
          ])}
          style={styles.logoutBtn} hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Booking',  value: stats.booked   },
            { label: 'Berjalan', value: stats.ongoing  },
            { label: 'Selesai',  value: stats.resolved },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Violation alert */}
        {pendingViolations > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push('/(bk)/counseling/cases' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={18} color={Colors.gray1} />
            <Text style={styles.alertText}>{pendingViolations} pelanggaran menunggu verifikasi</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray5} />
          </TouchableOpacity>
        )}

        {/* Nav list */}
        <Text style={styles.sectionTitle}>Layanan BK</Text>
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

        {/* Trend */}
        {trendData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tren Jenis Kasus</Text>
            <View style={[styles.listCard, { padding: Spacing.base }]}>
              {trendData.map(t => (
                <View key={t.type} style={styles.trendRow}>
                  <Text style={styles.trendType}>{t.type}</Text>
                  <View style={styles.trendBarWrap}>
                    <View style={[styles.trendBar, { width: `${(t.count / maxCount) * 100}%` as any }]} />
                  </View>
                  <Text style={styles.trendCount}>{t.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.gray1,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  role: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  name: { ...Typography.title2, color: Colors.white },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.base, marginTop: Spacing.xl, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 3,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  statValue: { ...Typography.title2, color: Colors.black },
  statLabel: { ...Typography.caption2, color: Colors.tertiaryLabel },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.base, marginTop: Spacing.base,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.gray9, ...Shadow.xs,
  },
  alertText: { ...Typography.subheadline, color: Colors.gray1, flex: 1, fontWeight: '500' },
  sectionTitle: {
    ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
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
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  trendType: { ...Typography.footnote, color: Colors.secondaryLabel, width: 80, textTransform: 'capitalize' },
  trendBarWrap: { flex: 1, height: 6, backgroundColor: Colors.gray11, borderRadius: 3, overflow: 'hidden' },
  trendBar: { height: '100%', backgroundColor: Colors.gray3, borderRadius: 3 },
  trendCount: { ...Typography.caption1, color: Colors.tertiaryLabel, width: 20, textAlign: 'right', fontWeight: '600' },
});
