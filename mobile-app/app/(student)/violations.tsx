import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, where, orderBy } from '../../src/firebase/firestore.service';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { USE_MOCK, MOCK_VIOLATIONS } from '../../src/constants/mockData';

export default function ViolationsScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [violations, setViolations] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const MAX = 100;

  useEffect(() => {
    if (!profile) return;
    if (USE_MOCK) {
      setViolations(MOCK_VIOLATIONS);
      setTotalPoints(MOCK_VIOLATIONS.filter((v: any) => v.status === 'verified').reduce((s, v: any) => s + v.points, 0));
      setLoading(false);
      return;
    }
    getCollection('violations', where('studentId', '==', profile.uid), orderBy('date', 'desc'))
      .then(data => {
        setViolations(data as any[]);
        const total = (data as any[]).filter(v => v.status === 'verified').reduce((s, v: any) => s + (v.points ?? 0), 0);
        setTotalPoints(total);
      }).finally(() => setLoading(false));
  }, [profile]);

  const pct = Math.min((totalPoints / MAX) * 100, 100);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={[styles.summary, { paddingTop: insets.top + 16 }]}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>Poin Pelanggaran</Text>
            <Text style={styles.summaryValue}>{totalPoints}</Text>
            <Text style={styles.summaryMax}>dari {MAX} poin</Text>
          </View>
          <View style={styles.circleContainer}>
            <Text style={styles.circleText}>{Math.round(pct)}%</Text>
          </View>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%` as any }]} />
        </View>
        {totalPoints >= 80 && (
          <View style={styles.warningRow}>
            <Ionicons name="alert-circle" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.warningText}>Poin hampir batas! Segera hubungi Guru BK.</Text>
          </View>
        )}
      </View>

      <FlatList
        data={violations}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Tidak ada pelanggaran</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.date}>{item.date?.toDate?.().toLocaleDateString('id-ID')}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.pts}>+{item.points}</Text>
              <View style={[styles.statusPill, { backgroundColor: item.status === 'verified' ? Colors.gray2 : Colors.gray10 }]}>
                <Text style={[styles.statusText, { color: item.status === 'verified' ? Colors.white : Colors.gray5 }]}>
                  {item.status === 'verified' ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summary: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  summaryLabel: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  summaryValue: { fontSize: 48, fontWeight: '800', color: Colors.white, letterSpacing: -1 },
  summaryMax: { ...Typography.caption1, color: 'rgba(255,255,255,0.4)' },
  circleContainer: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  circleText: { ...Typography.title3, color: Colors.white },
  bar: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 2 },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  warningText: { ...Typography.caption1, color: 'rgba(255,255,255,0.6)' },
  list: { backgroundColor: Colors.cardBackground },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.base, paddingVertical: 14,
    backgroundColor: Colors.cardBackground,
  },
  category: { ...Typography.subheadline, color: Colors.black, fontWeight: '600' },
  desc: { ...Typography.footnote, color: Colors.secondaryLabel, marginTop: 2 },
  date: { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  pts: { fontSize: 22, fontWeight: '800', color: Colors.gray1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { ...Typography.caption2, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
});
