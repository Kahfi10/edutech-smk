import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { getCollection, updateDocument, subscribeCollection, where } from '../../src/firebase/firestore.service';
import { useToast } from '../../src/context/ToastContext';
import { hapticSuccess, hapticLight } from '../../src/services/haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';

const STATUS_FILTERS = ['Semua', 'pending', 'verified', 'rejected'];
const STATUS_LABEL: Record<string, string> = {
  Semua: 'Semua', pending: 'Pending', verified: 'Terverifikasi', rejected: 'Ditolak',
};

export default function AdminViolations() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [violations, setViolations] = useState<any[]>([]);
  const [userMap, setUserMap]       = useState<Record<string, any>>({});
  const [filter, setFilter]         = useState('Semua');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying]   = useState<string | null>(null);

  // Load users once (tidak perlu realtime)
  useEffect(() => {
    getCollection('users').then(users => {
      const uMap: Record<string, any> = {};
      (users as any[]).forEach(u => (uMap[u.uid] = u));
      setUserMap(uMap);
    });
  }, []);

  // Realtime listener untuk violations
  useEffect(() => {
    const unsub = subscribeCollection('violations', (data) => {
      const sorted = [...data].sort(
        (a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0)
      );
      setViolations(sorted);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); };

  const filtered = filter === 'Semua' ? violations : violations.filter(v => v.status === filter);

  const handleVerify = async (id: string) => {
    setVerifying(id);
    try {
      await updateDocument('violations', id, { status: 'verified' });
      // listener otomatis update — tidak perlu setViolations manual
      hapticSuccess();
      showToast('Pelanggaran diverifikasi', 'success');
    } catch {
      showToast('Gagal verifikasi', 'error');
    } finally {
      setVerifying(null);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const student = userMap[item.studentId];
    const isPending = item.status === 'pending';
    const dateStr = item.date?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '-';

    return (
      <Animated.View entering={FadeInDown.delay(index * 25).springify().damping(18)}>
        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.studentName}>{student?.name ?? 'Siswa tidak ditemukan'}</Text>
              <Text style={s.violationType}>{item.type ?? item.description ?? '-'}</Text>
            </View>
            <View style={[s.statusBadge, item.status === 'verified' && s.statusVerified]}>
              <Text style={[s.statusText, item.status === 'verified' && s.statusTextVerified]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
          </View>
          <View style={s.cardBottom}>
            <View style={s.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={Colors.gray6} />
              <Text style={s.metaText}>{dateStr}</Text>
            </View>
            <View style={s.metaRow}>
              <Ionicons name="warning-outline" size={13} color={Colors.gray6} />
              <Text style={s.metaText}>{item.points ?? 0} poin</Text>
            </View>
            {isPending && (
              <TouchableOpacity
                style={s.verifyBtn}
                onPress={() => { hapticLight(); handleVerify(item.id); }}
                disabled={verifying === item.id}
              >
                <Ionicons name="checkmark" size={14} color={Colors.white} />
                <Text style={s.verifyText}>
                  {verifying === item.id ? 'Memproses...' : 'Verifikasi'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Pelanggaran</Text>
        <Text style={s.subtitle}>{violations.filter(v => v.status === 'pending').length} menunggu verifikasi</Text>
      </View>

      {/* Filter — wrap grid */}
      <View style={s.filterSection}>
        <View style={s.filterRow}>
          {STATUS_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => { hapticLight(); setFilter(f); }}
            >
              <Text style={[s.filterChipText, filter === f && s.filterChipTextActive]}>
                {STATUS_LABEL[f] ?? f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 24, gap: Spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gray5} colors={[Colors.black]} />}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.gray8} />
              <Text style={s.emptyText}>Tidak ada pelanggaran</Text>
            </View>
          ) : null
        }
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  title:    { ...Typography.title3, color: Colors.white },
  subtitle: { ...Typography.caption1, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  filterSection: { backgroundColor: Colors.cardBackground, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator },
  filterChipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  filterChipText: { fontSize: 13, fontWeight: '500' as const, color: Colors.secondaryLabel },
  filterChipTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator, ...Shadow.xs,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  studentName: { ...Typography.subheadline, color: Colors.black, fontWeight: '600' },
  violationType: { ...Typography.footnote, color: Colors.secondaryLabel, marginTop: 2 },
  statusBadge: { backgroundColor: Colors.gray11, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusVerified: { backgroundColor: Colors.black },
  statusText: { ...Typography.caption2, color: Colors.gray4, fontWeight: '600' },
  statusTextVerified: { color: Colors.white },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption1, color: Colors.tertiaryLabel },
  verifyBtn: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.black, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  verifyText: { ...Typography.caption1, color: Colors.white, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyText: { ...Typography.subheadline, color: Colors.tertiaryLabel },
});
