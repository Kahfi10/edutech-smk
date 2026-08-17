import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  FlatList, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { getCollection, subscribeCollection, orderBy } from '../../src/firebase/firestore.service';
import { SkeletonDashboard } from '../../src/components/ui/Skeleton';
import { AnimatedNumber } from '../../src/components/ui/AnimatedNumber';
import { hapticWarning } from '../../src/services/haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Siswa', TEACHER: 'Guru Mapel', WALI: 'Wali Kelas',
  BK: 'Guru BK', PIKET: 'Guru Piket', ADMIN: 'Admin',
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    users: 0, materials: 0, assignments: 0, pendingViolations: 0,
    quizzes: 0, announcements: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Realtime stats — subscribe ke collections utama
  useEffect(() => {
    const unsubs = [
      subscribeCollection('users',         (d) => {
        setStats(s => ({ ...s, users: d.length }));
        const sorted = [...d].sort((a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
        );
        setRecentUsers(sorted.slice(0, 6));
        setLoading(false);
        setRefreshing(false);
      }),
      subscribeCollection('materials',     (d) => setStats(s => ({ ...s, materials: d.length }))),
      subscribeCollection('assignments',   (d) => setStats(s => ({ ...s, assignments: d.length }))),
      subscribeCollection('violations',    (d) => setStats(s => ({ ...s, pendingViolations: d.filter((v: any) => v.status === 'pending').length }))),
      subscribeCollection('quizzes',       (d) => setStats(s => ({ ...s, quizzes: d.length }))),
      subscribeCollection('announcements', (d) => setStats(s => ({ ...s, announcements: d.length }))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }, []);

  if (loading) return <SkeletonDashboard rows={4} />;

  const STATS_1 = [
    { label: 'Pengguna',    value: stats.users,             icon: 'people-outline' },
    { label: 'Materi',      value: stats.materials,         icon: 'book-outline' },
    { label: 'Tugas',       value: stats.assignments,       icon: 'document-text-outline' },
  ];
  const STATS_2 = [
    { label: 'Kuis',        value: stats.quizzes,           icon: 'help-circle-outline' },
    { label: 'Pelanggaran', value: stats.pendingViolations, icon: 'warning-outline' },
    { label: 'Pengumuman',  value: stats.announcements,     icon: 'megaphone-outline' },
  ];

  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={s.role}>Administrator</Text>
          <Text style={s.name}>{profile?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => { hapticWarning(); logoutUser(); }} style={s.logoutBtn} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gray5} colors={[Colors.black]} />}
      >
        {/* Stats Row 1 */}
        <View style={s.statsRow}>
          {STATS_1.map(st => (
            <View key={st.label} style={s.statCard}>
              <Ionicons name={st.icon as any} size={18} color={Colors.gray5} />
              <AnimatedNumber value={st.value} style={s.statValue as any} />
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Stats Row 2 */}
        <View style={[s.statsRow, { marginTop: Spacing.sm }]}>
          {STATS_2.map(st => (
            <View key={st.label} style={s.statCard}>
              <Ionicons name={st.icon as any} size={18} color={Colors.gray5} />
              <AnimatedNumber value={st.value} style={s.statValue as any} />
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent users */}
        <Text style={s.sectionTitle}>Pengguna Terbaru</Text>
        <View style={s.card}>
          {recentUsers.map((u, i) => (
            <View key={u.uid ?? i}>
              <View style={s.userRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{u.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.userName}>{u.name}</Text>
                  <Text style={s.userEmail} numberOfLines={1}>{u.email}</Text>
                </View>
                <View style={s.rolePill}>
                  <Text style={s.rolePillText}>{ROLE_LABEL[u.role] ?? u.role}</Text>
                </View>
              </View>
              {i < recentUsers.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end',
  },
  role:      { ...Typography.caption1, color: 'rgba(255,255,255,0.5)' },
  name:      { ...Typography.title3, color: Colors.white, marginTop: 2 },
  logoutBtn: { padding: 4 },
  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginHorizontal: Spacing.base, marginTop: Spacing.base,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 3,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  statValue: { ...Typography.title2, color: Colors.black, fontWeight: '700' },
  statLabel: { ...Typography.caption2, color: Colors.secondaryLabel, textAlign: 'center' },
  sectionTitle: {
    ...Typography.footnote, color: Colors.secondaryLabel, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginHorizontal: Spacing.base, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.base, backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.base,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { ...Typography.subheadline, color: Colors.gray3, fontWeight: '600' },
  userName:    { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  userEmail:   { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 1 },
  rolePill: {
    backgroundColor: Colors.gray11, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  rolePillText: { ...Typography.caption2, color: Colors.gray4, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 64 },
});
