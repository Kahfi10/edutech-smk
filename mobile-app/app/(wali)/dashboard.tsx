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
import { getCollection, subscribeCollection, where } from '../../src/firebase/firestore.service';
import { SkeletonDashboard } from '../../src/components/ui/Skeleton';
import { AnimatedNumber } from '../../src/components/ui/AnimatedNumber';
import { hapticWarning } from '../../src/services/haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function WaliDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [avgGrade, setAvgGrade] = useState(0);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(() => {
    if (!profile?.classId) { setLoading(false); return; }
    Promise.all([
      getCollection('classes'),
      getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', profile.classId)),
      getCollection('attendance'),
      getCollection('submissions'),
      getCollection('violations'),
    ]).then(([cls, studs, attend, subs, viols]) => {
      const myClass = (cls as any[]).find(c => c.id === profile.classId);
      setClassName(myClass?.name ?? '');
      setStudents(studs as any[]);
      let alerts = 0;
      for (const s of studs as any[]) {
        const alphas = (attend as any[]).filter(a =>
          a.records?.some((r: any) => r.studentId === s.uid && r.status === 'alpha')
        ).length;
        if (alphas > 3) alerts++;
        const mySubs = (subs as any[]).filter(x => x.studentId === s.uid && x.score != null);
        if (mySubs.length >= 4) {
          const recent = mySubs.slice(-2).reduce((n: number, x: any) => n + x.score, 0) / 2;
          const prev   = mySubs.slice(-4, -2).reduce((n: number, x: any) => n + x.score, 0) / 2;
          if (prev - recent > 20) alerts++;
        }
        const pts = (viols as any[])
          .filter(v => v.studentId === s.uid && v.status === 'verified')
          .reduce((n: number, v: any) => n + (v.points ?? 0), 0);
        if (pts >= 80) alerts++;
      }
      setAlertCount(alerts);
      const allSubs = (subs as any[]).filter(s =>
        (studs as any[]).some((st: any) => st.uid === s.studentId) && s.score != null
      );
      setAvgGrade(allSubs.length
        ? Math.round(allSubs.reduce((n: number, s: any) => n + s.score, 0) / allSubs.length)
        : 0);
    }).finally(() => setLoading(false));
  }, [profile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    setTimeout(() => setRefreshing(false), 1200);
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <SkeletonDashboard rows={3} />;

  const NAV = [
    { label: 'Daftar Siswa', icon: 'people-outline',       route: '/(wali)/students'   },
    { label: 'Alert Sistem', icon: 'alert-circle-outline', route: '/(wali)/alerts'     },
    { label: 'Pelanggaran',  icon: 'warning-outline',      route: '/(wali)/violations' },
  ] as const;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.role}>Wali Kelas {className}</Text>
          <Text style={styles.name}>{profile?.name}</Text>
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
        {/* Stats strip */}
        <View style={styles.statsRow}>
          {[
            { label: 'Siswa',      value: students.length,  warn: false        },
            { label: 'Rata-rata',  value: avgGrade,         warn: false        },
            { label: 'Alert',      value: alertCount,       warn: alertCount > 0 },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <AnimatedNumber
                value={s.value}
                style={[styles.statValue, s.warn && styles.warnText] as any}
              />
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Alert banner */}
        {alertCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push('/(wali)/alerts')}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={18} color={Colors.gray1} />
            <Text style={styles.alertText}>{alertCount} siswa membutuhkan perhatian</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray5} />
          </TouchableOpacity>
        )}

        {/* Nav cards */}
        <Text style={styles.sectionTitle}>Kelola Kelas</Text>
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

        {/* Preview students */}
        {students.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Siswa Kelas</Text>
            <View style={styles.listCard}>
              {students.slice(0, 5).map((s, i) => (
                <View key={s.uid}>
                  <View style={styles.studentRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{s.name?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      <Text style={styles.studentNis}>NIS {s.nis ?? '-'}</Text>
                    </View>
                  </View>
                  {i < Math.min(students.length, 5) - 1 && (
                    <View style={[styles.rowDivider, { marginLeft: Spacing.base + 42 }]} />
                  )}
                </View>
              ))}
              {students.length > 5 && (
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => router.push('/(wali)/students' as any)}
                >
                  <Text style={styles.moreBtnText}>Lihat semua {students.length} siswa</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.gray5} />
                </TouchableOpacity>
              )}
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
    backgroundColor: Colors.gray2,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  role: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  name: { ...Typography.title2, color: Colors.white },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.xs,
  },
  statValue: { ...Typography.title2, color: Colors.black },
  statLabel: { ...Typography.caption2, color: Colors.tertiaryLabel },
  warnText: { color: Colors.gray1 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.base, marginTop: Spacing.base,
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.gray9,
    ...Shadow.xs,
  },
  alertText: { ...Typography.subheadline, color: Colors.gray1, flex: 1, fontWeight: '500' },
  sectionTitle: {
    ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  listCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: Spacing.base, borderRadius: Radius.lg, overflow: 'hidden',
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
  studentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 10, gap: 12,
  },
  avatarCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.subheadline, color: Colors.gray3, fontWeight: '600' },
  studentName: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  studentNis: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 1 },
  moreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  moreBtnText: { ...Typography.footnote, color: Colors.gray5, fontWeight: '500' },
});
