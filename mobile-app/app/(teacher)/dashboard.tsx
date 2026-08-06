import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { getCollection, subscribeCollection, where, orderBy } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { StatCard } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ materials: 0, assignments: 0, submissions: 0 });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const unsubA = subscribeCollection(
      'assignments',
      (data) => {
        const mine = data.filter((a: any) => a.createdBy === profile.uid);
        setRecentAssignments(mine.slice(0, 5));
        setStats(s => ({ ...s, assignments: mine.length }));
        setLoading(false);
      },
      where('createdBy', '==', profile.uid)
    );
    const unsubM = subscribeCollection(
      'materials',
      (data) => setStats(s => ({ ...s, materials: data.length })),
      where('uploadedBy', '==', profile.uid)
    );
    const unsubS = subscribeCollection(
      'submissions',
      (data) => setStats(s => ({ ...s, submissions: data.filter((s: any) => s.status === 'submitted').length })),
    );
    return () => { unsubA(); unsubM(); unsubS(); };
  }, [profile]);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => logoutUser() },
    ]);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetLabel}>Selamat Datang,</Text>
          <Text style={styles.greetName}>{profile?.name}</Text>
          <Text style={styles.greetRole}>Guru Mata Pelajaran</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Ringkasan</Text>
      <View style={styles.statsRow}>
        <StatCard label="Materi" value={stats.materials} color="#059669" />
        <StatCard label="Tugas" value={stats.assignments} color="#4F46E5" />
        <StatCard label="Perlu Dinilai" value={stats.submissions} color="#DC2626" />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Aksi Cepat</Text>
      <View style={styles.actionsGrid}>
        {[
          { label: '📤 Upload Materi', route: '/(teacher)/upload-material', color: '#059669' },
          { label: '📝 Buat Tugas', route: '/(teacher)/assignments/create', color: '#4F46E5' },
          { label: '✅ Input Absensi', route: '/(teacher)/attendance', color: '#D97706' },
          { label: '⭐ Nilai Tugas', route: '/(teacher)/assignments/grade', color: '#DC2626' },
        ].map(action => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionBtn, { borderLeftColor: action.color }]}
            onPress={() => router.push(action.route as any)}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Assignments */}
      <Text style={styles.sectionTitle}>Tugas Terbaru</Text>
      {recentAssignments.length === 0 ? (
        <Card><Text style={styles.emptyText}>Belum ada tugas. Buat tugas baru!</Text></Card>
      ) : (
        recentAssignments.map(a => (
          <Card key={a.id}>
            <Text style={styles.assignTitle}>{a.title}</Text>
            <Text style={styles.assignSub}>
              Deadline: {a.deadline?.toDate?.().toLocaleDateString('id-ID') ?? '-'}
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  greeting: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#059669', borderRadius: 14, padding: 16, marginBottom: 20,
  },
  greetLabel: { fontSize: 12, color: '#D1FAE5' },
  greetName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  greetRole: { fontSize: 12, color: '#D1FAE5', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginVertical: 12 },
  statsRow: { flexDirection: 'row', marginHorizontal: -4 },
  actionsGrid: { gap: 8 },
  actionBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  assignTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  assignSub: { fontSize: 12, color: '#64748B', marginTop: 4 },
});
