import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { logoutUser } from '../../src/firebase/auth.service';
import { getCollection, subscribeCollection, where } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { StatCard, Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function BKDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ booked: 0, ongoing: 0, resolved: 0 });
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [pendingViolations, setPendingViolations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeCollection(
      'counseling',
      (data) => {
        const mine = data.filter((c: any) => c.bkTeacherId === profile.uid);
        setStats({
          booked: mine.filter((c: any) => c.status === 'booked').length,
          ongoing: mine.filter((c: any) => c.status === 'ongoing').length,
          resolved: mine.filter((c: any) => c.status === 'resolved').length,
        });
        setRecentCases(mine.slice(0, 5));

        // Tren per type
        const trend: Record<string, number> = {};
        mine.forEach((c: any) => { trend[c.type] = (trend[c.type] ?? 0) + 1; });
        setTrendData(trend);
        setLoading(false);
      }
    );

    getCollection('violations', where('status', '==', 'pending')).then(v =>
      setPendingViolations(v.length)
    );

    return unsub;
  }, [profile]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Guru BK</Text>
          <Text style={styles.name}>{profile?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Keluar', 'Yakin?', [{ text: 'Batal' }, { text: 'Keluar', onPress: logoutUser }])} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Booking Baru" value={stats.booked} color="#4F46E5" />
        <StatCard label="Berjalan" value={stats.ongoing} color="#D97706" />
        <StatCard label="Selesai" value={stats.resolved} color="#059669" />
      </View>

      {pendingViolations > 0 && (
        <TouchableOpacity onPress={() => router.push('/(bk)/counseling/cases')} style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ {pendingViolations} pelanggaran perlu diverifikasi</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Tren Kasus</Text>
      <Card>
        {Object.entries(trendData).map(([type, count]) => (
          <View key={type} style={styles.trendRow}>
            <Text style={styles.trendType}>{type}</Text>
            <View style={styles.trendBar}>
              <View style={[styles.trendFill, { width: `${Math.min((count / Math.max(...Object.values(trendData))) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.trendCount}>{count}</Text>
          </View>
        ))}
        {Object.keys(trendData).length === 0 && <Text style={styles.empty}>Belum ada kasus</Text>}
      </Card>

      <Text style={styles.sectionTitle}>Sesi Terbaru</Text>
      {recentCases.map(c => (
        <Card key={c.id}>
          <View style={styles.caseRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.caseType}>{c.type}</Text>
              <Text style={styles.caseDate}>{c.scheduledAt?.toDate?.().toLocaleDateString('id-ID')}</Text>
            </View>
            <Badge
              label={c.status}
              bg={c.status === 'resolved' ? '#ECFDF5' : c.status === 'ongoing' ? '#FFFBEB' : '#EEF2FF'}
              color={c.status === 'resolved' ? '#059669' : c.status === 'ongoing' ? '#D97706' : '#4F46E5'}
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#DC2626', borderRadius: 14, padding: 16, marginBottom: 16 },
  greeting: { fontSize: 12, color: '#FCA5A5' },
  name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 12 },
  alertBanner: { backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: '#DC2626', borderRadius: 8, padding: 12, marginBottom: 12 },
  alertText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginVertical: 10 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  trendType: { width: 90, fontSize: 12, color: '#64748B', textTransform: 'capitalize' },
  trendBar: { flex: 1, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  trendFill: { height: '100%', backgroundColor: '#DC2626', borderRadius: 4 },
  trendCount: { fontSize: 13, fontWeight: '700', color: '#1E293B', width: 24, textAlign: 'right' },
  caseRow: { flexDirection: 'row', alignItems: 'center' },
  caseType: { fontSize: 14, fontWeight: '700', color: '#1E293B', textTransform: 'capitalize' },
  caseDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 8 },
});
