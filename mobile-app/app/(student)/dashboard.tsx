import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { subscribeCollection, getCollection, where, orderBy } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { StatCard, Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [violationPoints, setViolationPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const unsubAnn = subscribeCollection(
      'announcements',
      (data) => setAnnouncements(data.slice(0, 3)),
      orderBy('createdAt', 'desc')
    );

    const unsubAssign = subscribeCollection(
      'assignments',
      (data) => {
        const now = new Date();
        const upcoming = data
          .filter((a: any) => a.classId === profile.classId && a.deadline?.toDate?.() > now)
          .sort((a: any, b: any) => a.deadline?.toDate?.() - b.deadline?.toDate?.())
          .slice(0, 5);
        setUpcomingAssignments(upcoming);
        setLoading(false);
      },
      where('classId', '==', profile.classId ?? '')
    );

    getCollection('violations', where('studentId', '==', profile.uid)).then(v => {
      const total = v.filter((x: any) => x.status === 'verified')
        .reduce((sum: number, x: any) => sum + (x.points ?? 0), 0);
      setViolationPoints(total);
    });

    return () => { unsubAnn(); unsubAssign(); };
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Halo,</Text>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.nisText}>NIS: {profile?.nis ?? '-'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Tugas" value={upcomingAssignments.length} color="#4F46E5" />
        <StatCard label="Poin Pelanggar." value={violationPoints} color={violationPoints > 50 ? '#DC2626' : '#D97706'} />
      </View>

      {/* Quick Menu */}
      <Text style={styles.sectionTitle}>Menu</Text>
      <View style={styles.menuGrid}>
        {[
          { label: '📚 Materi', route: '/(student)/materials/all', color: '#EEF2FF' },
          { label: '📝 Tugas', route: '/(student)/assignments', color: '#ECFDF5' },
          { label: '⭐ Nilai', route: '/(student)/grades', color: '#FFFBEB' },
          { label: '📋 Absensi', route: '/(student)/attendance', color: '#FEF2F2' },
          { label: '⚠️ Pelanggaran', route: '/(student)/violations', color: '#FDF4FF' },
          { label: '💬 Konseling BK', route: '/(student)/bk-booking', color: '#F0FDF4' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, { backgroundColor: item.color }]}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming Assignments */}
      <Text style={styles.sectionTitle}>Tugas Mendatang</Text>
      {upcomingAssignments.length === 0 ? (
        <Card><Text style={styles.empty}>Tidak ada tugas mendatang 🎉</Text></Card>
      ) : (
        upcomingAssignments.map(a => {
          const daysLeft = Math.ceil(
            (a.deadline?.toDate?.().getTime() - Date.now()) / (1000 * 3600 * 24)
          );
          return (
            <Card key={a.id}>
              <View style={styles.assignRow}>
                <Text style={styles.assignTitle} numberOfLines={2}>{a.title}</Text>
                <Badge
                  label={`${daysLeft}h`}
                  bg={daysLeft <= 1 ? '#DC2626' : daysLeft <= 3 ? '#D97706' : '#059669'}
                />
              </View>
              <Text style={styles.assignSub}>
                Deadline: {a.deadline?.toDate?.().toLocaleDateString('id-ID')}
              </Text>
            </Card>
          );
        })
      )}

      {/* Announcements */}
      <Text style={styles.sectionTitle}>Pengumuman Terbaru</Text>
      {announcements.map(a => (
        <Card key={a.id} style={a.isUrgent ? styles.urgentCard : undefined}>
          {a.isUrgent && <Badge label="🚨 URGENT" bg="#DC2626" style={{ marginBottom: 6 }} />}
          <Text style={styles.annTitle}>{a.title}</Text>
          <Text style={styles.annBody} numberOfLines={2}>{a.body}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#4F46E5', borderRadius: 14, padding: 16, marginBottom: 16,
  },
  headerLeft: {},
  greeting: { fontSize: 12, color: '#C7D2FE' },
  name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  nisText: { fontSize: 11, color: '#C7D2FE', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginVertical: 10 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuItem: {
    width: '47%', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  menuLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  assignRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  assignTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B', marginRight: 8 },
  assignSub: { fontSize: 12, color: '#64748B', marginTop: 4 },
  urgentCard: { borderLeftWidth: 4, borderLeftColor: '#DC2626' },
  annTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  annBody: { fontSize: 13, color: '#64748B', marginTop: 3 },
  empty: { textAlign: 'center', color: '#94A3B8', fontSize: 14 },
});
