import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { subscribeCollection, getCollection, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

const QUICK_ACTIONS = [
  { label: 'Upload Materi',  icon: 'cloud-upload-outline', route: '/(teacher)/upload-material'   },
  { label: 'Buat Tugas',     icon: 'create-outline',       route: '/(teacher)/assignments/create' },
  { label: 'Input Absensi',  icon: 'list-outline',          route: '/(teacher)/attendance'         },
  { label: 'Nilai Tugas',    icon: 'checkmark-circle-outline', route: '/(teacher)/assignments/grade'},
] as const;

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ materials: 0, assignments: 0, pending: 0 });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const unsubA = subscribeCollection('assignments', (data) => {
      const mine = data.filter((a: any) => a.createdBy === profile.uid);
      setRecentAssignments(mine.slice(0, 4));
      setStats(s => ({ ...s, assignments: mine.length }));
      setLoading(false);
    }, where('createdBy', '==', profile.uid));

    const unsubM = subscribeCollection('materials', (data) =>
      setStats(s => ({ ...s, materials: data.length })),
      where('uploadedBy', '==', profile.uid));

    const unsubS = subscribeCollection('submissions', (data) =>
      setStats(s => ({ ...s, pending: data.filter((x: any) => x.status === 'submitted').length })));

    return () => { unsubA(); unsubM(); unsubS(); };
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.role}>Guru Mata Pelajaran</Text>
          <Text style={styles.name}>{profile?.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Keluar', 'Yakin ingin keluar?', [
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
            { label: 'Materi',        value: stats.materials,  icon: 'book-outline'             },
            { label: 'Tugas',         value: stats.assignments, icon: 'document-text-outline'   },
            { label: 'Perlu Dinilai', value: stats.pending,    icon: 'checkmark-circle-outline' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={Colors.gray5} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon as any} size={22} color={Colors.black} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.gray7} style={{ marginTop: 'auto' }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent assignments */}
        {recentAssignments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tugas Dibuat</Text>
            <View style={styles.listCard}>
              {recentAssignments.map((a, i) => (
                <View key={a.id}>
                  <View style={styles.assignRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assignTitle} numberOfLines={1}>{a.title}</Text>
                      <Text style={styles.assignSub}>
                        Deadline: {a.deadline?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.gray8} />
                  </View>
                  {i < recentAssignments.length - 1 && <View style={styles.rowDivider} />}
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
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.xs,
  },
  statValue: { ...Typography.title2, color: Colors.black },
  statLabel: { ...Typography.caption2, color: Colors.tertiaryLabel, textAlign: 'center' },
  sectionTitle: {
    ...Typography.footnote,
    color: Colors.tertiaryLabel,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: 8 },
  actionCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.xs,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.gray11,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  listCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.xs,
  },
  assignRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 13, gap: 10,
  },
  assignTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  assignSub: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: Spacing.base,
  },
});
