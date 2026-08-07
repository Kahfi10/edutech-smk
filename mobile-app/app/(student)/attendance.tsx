import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { USE_MOCK, MOCK_ATTENDANCE_SUMMARY } from '../../src/constants/mockData';

export default function StudentAttendanceScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hadir: 0, izin: 0, sakit: 0, alpha: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setSummary(MOCK_ATTENDANCE_SUMMARY);
      setRecords([
        { date: '2026-08-06', subjectId: 'Pemrograman Web', period: 1, status: 'hadir' },
        { date: '2026-08-06', subjectId: 'Basis Data',      period: 3, status: 'hadir' },
        { date: '2026-08-05', subjectId: 'Pemrograman Web', period: 1, status: 'izin'  },
        { date: '2026-08-04', subjectId: 'Basis Data',      period: 3, status: 'hadir' },
        { date: '2026-08-03', subjectId: 'Pemrograman Web', period: 1, status: 'sakit' },
      ]);
      setLoading(false);
      return;
    }
    if (!profile) return;
    getCollection('attendance').then(allAttend => {
      const my: any[] = [];
      (allAttend as any[]).forEach(a => {
        const r = a.records?.find((rec: any) => rec.studentId === profile.uid);
        if (r) my.push({ ...r, date: a.date, subjectId: a.subjectId, period: a.period });
      });
      my.sort((a, b) => b.date.localeCompare(a.date));
      setRecords(my);
      const s = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      my.forEach(r => { if (r.status in s) (s as any)[r.status]++; });
      setSummary(s);
    }).finally(() => setLoading(false));
  }, [profile]);

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  const pct   = total > 0 ? Math.round((summary.hadir / total) * 100) : 0;

  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    hadir: { label: 'Hadir',  bg: Colors.gray11, text: Colors.gray2     },
    izin:  { label: 'Izin',   bg: Colors.gray10, text: Colors.gray3     },
    sakit: { label: 'Sakit',  bg: Colors.gray9,  text: Colors.gray3     },
    alpha: { label: 'Alpha',  bg: Colors.gray2,  text: Colors.white     },
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Summary card */}
      <View style={[styles.summaryCard, { paddingTop: insets.top + 16 }]}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryTitle}>Kehadiran</Text>
            <Text style={styles.summaryPct}>{pct}<Text style={styles.summaryPctSuffix}>%</Text></Text>
          </View>
          <View style={styles.summaryStats}>
            {(Object.entries(summary) as [string, number][]).map(([key, val]) => (
              <View key={key} style={styles.summaryStat}>
                <Text style={styles.summaryStatVal}>{val}</Text>
                <Text style={styles.summaryStatKey}>{key}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
      </View>

      {/* Records */}
      <FlatList
        data={records}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={44} color={Colors.gray8} />
            <Text style={styles.emptyText}>Belum ada data absensi</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.hadir;
          return (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowDate}>{item.date}</Text>
                <Text style={styles.rowSub}>Jam ke-{item.period}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  summaryCard: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  summaryTitle: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  summaryPct: { fontSize: 52, fontWeight: '800', color: Colors.white, letterSpacing: -1 },
  summaryPctSuffix: { fontSize: 24, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  summaryStats: { flexDirection: 'row', gap: 16 },
  summaryStat: { alignItems: 'center' },
  summaryStatVal: { ...Typography.title3, color: Colors.white },
  summaryStatKey: { ...Typography.caption2, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', marginTop: 2 },
  progressBar: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 2 },

  list: { backgroundColor: Colors.cardBackground },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    backgroundColor: Colors.cardBackground,
  },
  rowLeft: {},
  rowDate: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  rowSub: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { ...Typography.caption1, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
});
