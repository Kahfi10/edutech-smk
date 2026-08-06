import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function StudentAttendanceScreen() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hadir: 0, izin: 0, sakit: 0, alpha: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getCollection('attendance').then(allAttend => {
      const myRecords: any[] = [];
      allAttend.forEach((a: any) => {
        const r = a.records?.find((rec: any) => rec.studentId === profile.uid);
        if (r) myRecords.push({ ...r, date: a.date, subjectId: a.subjectId, period: a.period });
      });
      myRecords.sort((a, b) => b.date.localeCompare(a.date));
      setRecords(myRecords);

      const s = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      myRecords.forEach(r => { if (r.status in s) s[r.status as keyof typeof s]++; });
      setSummary(s);
    }).finally(() => setLoading(false));
  }, [profile]);

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    hadir: { bg: '#ECFDF5', color: '#059669' },
    izin: { bg: '#EEF2FF', color: '#4F46E5' },
    sakit: { bg: '#FFFBEB', color: '#D97706' },
    alpha: { bg: '#FEF2F2', color: '#DC2626' },
  };

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  const pct = total > 0 ? Math.round((summary.hadir / total) * 100) : 0;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Rekap Kehadiran</Text>
        <View style={styles.pctRow}>
          <Text style={[styles.pctValue, { color: pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#DC2626' }]}>
            {pct}%
          </Text>
          <Text style={styles.pctLabel}>Tingkat Kehadiran</Text>
        </View>
        <View style={styles.statsRow}>
          {Object.entries(summary).map(([key, val]) => {
            const c = STATUS_COLORS[key] ?? { bg: '#F1F5F9', color: '#64748B' };
            return (
              <View key={key} style={[styles.statBox, { backgroundColor: c.bg }]}>
                <Text style={[styles.statVal, { color: c.color }]}>{val}</Text>
                <Text style={[styles.statKey, { color: c.color }]}>{key}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <FlatList
        data={records}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada data absensi</Text>}
        renderItem={({ item }) => {
          const c = STATUS_COLORS[item.status] ?? { bg: '#F1F5F9', color: '#64748B' };
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.sub}>Jam ke-{item.period}</Text>
              </View>
              <Badge label={item.status.toUpperCase()} bg={c.bg} color={c.color} />
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  summaryCard: {
    backgroundColor: '#4F46E5', margin: 16, borderRadius: 14, padding: 16,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#C7D2FE', marginBottom: 8 },
  pctRow: { alignItems: 'center', marginBottom: 12 },
  pctValue: { fontSize: 48, fontWeight: '800', color: '#FFFFFF' },
  pctLabel: { fontSize: 12, color: '#C7D2FE' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statKey: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 12,
    borderRadius: 8, marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  date: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  divider: { height: 2 },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
});
