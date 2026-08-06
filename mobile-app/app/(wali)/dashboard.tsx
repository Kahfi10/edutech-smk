import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { getCollection, subscribeCollection, where } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { StatCard, Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function WaliDashboard() {
  const { profile } = useAuth();
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [avgGrade, setAvgGrade] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.classId) { setLoading(false); return; }

    Promise.all([
      getCollection('classes').then(cls => cls.find((c: any) => c.id === profile.classId)),
      getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', profile.classId)),
    ]).then(async ([cls, studs]) => {
      setClassData(cls);
      setStudents(studs as any[]);

      // Hitung alerts
      let alerts = 0;
      const allAttend = await getCollection('attendance');
      const subs = await getCollection('submissions');

      for (const s of (studs as any[])) {
        // Alpha count
        const alphas = allAttend.filter((a: any) =>
          a.records?.some((r: any) => r.studentId === s.uid && r.status === 'alpha')
        ).length;
        if (alphas > 3) alerts++;

        // Grade drop check
        const mySubs = (subs as any[]).filter(sub => sub.studentId === s.uid && sub.score != null);
        if (mySubs.length >= 4) {
          const recent2 = mySubs.slice(-2).reduce((sum: number, x: any) => sum + x.score, 0) / 2;
          const prev2 = mySubs.slice(-4, -2).reduce((sum: number, x: any) => sum + x.score, 0) / 2;
          if (prev2 - recent2 > 20) alerts++;
        }
      }
      setAlertCount(alerts);

      // Avg grade
      const allSubs = (subs as any[]).filter(s =>
        (studs as any[]).some(st => st.uid === s.studentId) && s.score != null
      );
      setAvgGrade(allSubs.length
        ? Math.round(allSubs.reduce((sum: number, s: any) => sum + s.score, 0) / allSubs.length)
        : 0);
    }).finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Wali Kelas</Text>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.className}>{classData?.name ?? '-'}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Keluar', 'Yakin?', [{ text: 'Batal' }, { text: 'Keluar', onPress: logoutUser }])} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Siswa" value={students.length} color="#D97706" />
        <StatCard label="Avg Nilai" value={avgGrade} color={avgGrade >= 75 ? '#059669' : '#DC2626'} />
        <StatCard label="Alert" value={alertCount} color={alertCount > 0 ? '#DC2626' : '#059669'} />
      </View>

      {alertCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>🚨</Text>
          <Text style={styles.alertText}>{alertCount} siswa membutuhkan perhatian segera!</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Siswa Kelas ({students.length})</Text>
      {students.slice(0, 5).map(s => (
        <Card key={s.uid}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.studentName}>{s.name}</Text>
              <Text style={styles.studentNis}>NIS: {s.nis}</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </Card>
      ))}
      {students.length > 5 && <Text style={styles.seeAll}>+{students.length - 5} siswa lainnya</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#D97706', borderRadius: 14, padding: 16, marginBottom: 16,
  },
  greeting: { fontSize: 12, color: '#FEF3C7' },
  name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  className: { fontSize: 12, color: '#FEF3C7', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 12 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: '#DC2626',
    borderRadius: 8, padding: 12, marginBottom: 12,
  },
  alertIcon: { fontSize: 20 },
  alertText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginVertical: 10 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  studentNis: { fontSize: 12, color: '#64748B', marginTop: 2 },
  arrowIcon: { fontSize: 16, color: '#94A3B8' },
  seeAll: { textAlign: 'center', color: '#4F46E5', fontSize: 13, fontWeight: '600', padding: 8 },
});
