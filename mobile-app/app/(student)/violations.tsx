import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where, orderBy } from '../../src/firebase/firestore.service';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function ViolationsScreen() {
  const { profile } = useAuth();
  const [violations, setViolations] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const MAX_POINTS = 100;

  useEffect(() => {
    if (!profile) return;
    getCollection(
      'violations',
      where('studentId', '==', profile.uid),
      orderBy('date', 'desc')
    ).then(data => {
      setViolations(data);
      const total = data
        .filter((v: any) => v.status === 'verified')
        .reduce((s: number, v: any) => s + (v.points ?? 0), 0);
      setTotalPoints(total);
    }).finally(() => setLoading(false));
  }, [profile]);

  const pct = Math.min((totalPoints / MAX_POINTS) * 100, 100);
  const barColor = pct >= 80 ? '#DC2626' : pct >= 50 ? '#D97706' : '#059669';

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Points summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Poin Pelanggaran Aktif</Text>
        <Text style={[styles.points, { color: barColor }]}>{totalPoints}</Text>
        <Text style={styles.maxLabel}>dari {MAX_POINTS} poin maksimum</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
        {totalPoints >= 80 && (
          <Text style={styles.warning}>⚠️ Poin hampir mencapai batas! Segera hubungi Guru BK.</Text>
        )}
      </View>

      <FlatList
        data={violations}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Tidak ada catatan pelanggaran 🎉</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.date}>{item.date?.toDate?.().toLocaleDateString('id-ID')}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.pointsValue}>+{item.points}</Text>
              <Badge
                label={item.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                bg={item.status === 'verified' ? '#FEF2F2' : '#FFFBEB'}
                color={item.status === 'verified' ? '#DC2626' : '#D97706'}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  summaryCard: { backgroundColor: '#1E293B', margin: 16, borderRadius: 14, padding: 20, alignItems: 'center' },
  summaryTitle: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
  points: { fontSize: 56, fontWeight: '800' },
  maxLabel: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  bar: { width: '100%', height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  warning: { fontSize: 12, color: '#FCA5A5', marginTop: 8, textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10,
    padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  category: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  desc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  date: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  pointsValue: { fontSize: 22, fontWeight: '800', color: '#DC2626' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
});
