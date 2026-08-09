import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Badge } from '../../src/components/ui/Badge';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';

export default function WaliStudentsScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.classId) { setLoading(false); return; }
    Promise.all([
      getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', profile.classId)),
      getCollection('attendance'),
      getCollection('submissions'),
      getCollection('violations'),
    ]).then(([studs, attendance, submissions, violations]) => {
      setStudents(studs as any[]);
      const map: Record<string, any> = {};
      for (const s of studs as any[]) {
        const alphas = (attendance as any[]).filter(a =>
          a.records?.some((r: any) => r.studentId === s.uid && r.status === 'alpha')
        ).length;
        const mySubs = (submissions as any[]).filter(x => x.studentId === s.uid && x.score != null);
        const avgGrade = mySubs.length
          ? Math.round(mySubs.reduce((n: number, x: any) => n + x.score, 0) / mySubs.length) : 0;
        const totalPts = (violations as any[]).filter(v => v.studentId === s.uid && v.status === 'verified')
          .reduce((n: number, v: any) => n + (v.points ?? 0), 0);
        map[s.uid] = { alphas, avgGrade, totalPts };
      }
      setStats(map);
    }).finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Daftar Siswa</Text>
        <Text style={styles.headerSub}>{students.length} siswa di kelas</Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={i => i.uid}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada siswa</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const st = stats[item.uid] ?? {};
          const hasAlert = st.alphas > 3 || st.totalPts >= 80;
          return (
            <View style={[styles.card, hasAlert && styles.cardAlert]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.nis}>NIS {item.nis ?? '-'}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{st.avgGrade ?? 0}</Text>
                    <Text style={styles.statKey}>Nilai</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, st.alphas > 3 && styles.danger]}>{st.alphas ?? 0}</Text>
                    <Text style={styles.statKey}>Alpha</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, st.totalPts >= 80 && styles.danger]}>{st.totalPts ?? 0}</Text>
                    <Text style={styles.statKey}>Poin</Text>
                  </View>
                </View>
              </View>
              {hasAlert && (
                <Ionicons name="alert-circle" size={20} color={Colors.gray3} />
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base + 52 }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.gray2,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerSub: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  list: { backgroundColor: Colors.cardBackground },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
  },
  cardAlert: { borderLeftWidth: 3, borderLeftColor: Colors.gray3 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.headline, color: Colors.gray3 },
  name: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  nis: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  stat: { alignItems: 'center' },
  statVal: { ...Typography.callout, fontWeight: '700', color: Colors.black },
  statKey: { ...Typography.caption2, color: Colors.tertiaryLabel, textTransform: 'uppercase' },
  danger: { color: Colors.gray1 },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
});
