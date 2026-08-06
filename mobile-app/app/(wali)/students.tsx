import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function WaliStudentsScreen() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<Record<string, any>>({});
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
      const stats: Record<string, any> = {};
      for (const s of (studs as any[])) {
        const alphas = (attendance as any[]).filter(a =>
          a.records?.some((r: any) => r.studentId === s.uid && r.status === 'alpha')
        ).length;
        const mySubs = (submissions as any[]).filter(sub => sub.studentId === s.uid && sub.score != null);
        const avgGrade = mySubs.length
          ? Math.round(mySubs.reduce((sum: number, x: any) => sum + x.score, 0) / mySubs.length) : 0;
        const totalPoints = (violations as any[])
          .filter(v => v.studentId === s.uid && v.status === 'verified')
          .reduce((sum: number, v: any) => sum + (v.points ?? 0), 0);
        stats[s.uid] = { alphas, avgGrade, totalPoints };
      }
      setStudentStats(stats);
    }).finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <FlatList
      data={students}
      keyExtractor={i => i.uid}
      contentContainerStyle={{ padding: 16 }}
      style={{ backgroundColor: '#F8FAFC' }}
      ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#94A3B8', padding: 32 }}>Belum ada siswa</Text>}
      renderItem={({ item, index }) => {
        const st = studentStats[item.uid] ?? {};
        const hasAlert = st.alphas > 3 || st.totalPoints >= 80;
        return (
          <View style={[styles.card, hasAlert && styles.cardAlert]}>
            <View style={styles.num}>
              <Text style={styles.numText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.nis}>NIS: {item.nis}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{st.avgGrade ?? 0}</Text>
                  <Text style={styles.statLabel}>Avg Nilai</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statVal, st.alphas > 3 && styles.danger]}>{st.alphas ?? 0}</Text>
                  <Text style={styles.statLabel}>Alpha</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statVal, st.totalPoints >= 80 && styles.danger]}>{st.totalPoints ?? 0}</Text>
                  <Text style={styles.statLabel}>Poin</Text>
                </View>
              </View>
            </View>
            {hasAlert && <Badge label="⚠️" bg="#FEF2F2" color="#DC2626" />}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  cardAlert: { borderLeftWidth: 4, borderLeftColor: '#DC2626' },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  name: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  nis: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  statLabel: { fontSize: 9, color: '#94A3B8', textTransform: 'uppercase' },
  danger: { color: '#DC2626' },
});
