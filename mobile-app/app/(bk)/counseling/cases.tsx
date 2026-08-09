import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, updateDocument } from '../../../src/firebase/firestore.service';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';

export default function BKCasesScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [violations, setViolations] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');

  const load = async () => {
    const [viols, users] = await Promise.all([
      getCollection('violations'),
      getCollection('users'),
    ]);
    const uMap: Record<string, any> = {};
    (users as any[]).forEach(u => (uMap[u.uid] = u));
    setUserMap(uMap);
    setViolations((viols as any[]).sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.()));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verify  = async (id: string) => { await updateDocument('violations', id, { verifiedBy: profile!.uid, status: 'verified' }); load(); };
  const reject_ = async (id: string) => { await updateDocument('violations', id, { status: 'rejected' }); load(); };

  const filtered = filter === 'all' ? violations : violations.filter(v => v.status === filter);
  const pendingCount = violations.filter(v => v.status === 'pending').length;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Manajemen Kasus</Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'verified'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Semua' : f === 'pending' ? 'Pending' : 'Verified'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Tidak ada kasus</Text>
          </View>
        }
        renderItem={({ item }) => {
          const student = userMap[item.studentId];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student?.name ?? item.studentId}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                  <Text style={styles.meta}>
                    {item.reportedByRole} · {item.date?.toDate?.().toLocaleDateString('id-ID')}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.pts}>+{item.points}</Text>
                  <Badge
                    label={item.status === 'verified' ? 'Verified' : item.status === 'rejected' ? 'Ditolak' : 'Pending'}
                    variant={item.status === 'verified' ? 'default' : 'outline'}
                  />
                </View>
              </View>
              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.verifyBtn} onPress={() => verify(item.id)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.gray3} />
                    <Text style={styles.verifyText}>Verifikasi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => reject_(item.id)}>
                    <Ionicons name="close-circle-outline" size={16} color={Colors.gray5} />
                    <Text style={styles.rejectText}>Tolak</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.gray1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  title: { ...Typography.title2, color: Colors.white },
  badge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { ...Typography.caption1, color: Colors.white, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row', backgroundColor: Colors.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator,
  },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.black },
  filterText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
  filterTextActive: { color: Colors.black, fontWeight: '700' },
  list: { padding: Spacing.base },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', gap: 10 },
  studentName: { ...Typography.headline, color: Colors.black },
  category: { ...Typography.caption1, color: Colors.gray5, fontWeight: '600', marginTop: 2 },
  desc: { ...Typography.footnote, color: Colors.secondaryLabel, marginTop: 2 },
  meta: { ...Typography.caption2, color: Colors.quaternaryLabel, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  pts: { fontSize: 20, fontWeight: '800', color: Colors.gray1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  verifyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  verifyText: { ...Typography.subheadline, color: Colors.gray3, fontWeight: '600' },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  rejectText: { ...Typography.subheadline, color: Colors.gray5, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
});
