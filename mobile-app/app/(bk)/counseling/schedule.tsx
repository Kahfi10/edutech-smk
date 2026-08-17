import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, updateDocument, where } from '../../../src/firebase/firestore.service';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';

export default function BKScheduleScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [counselings, users] = await Promise.all([
        // Filter by bkTeacherId — sesuai rules, efisien, dan tidak perlu baca semua docs
        getCollection('counseling', where('bkTeacherId', '==', profile.uid)),
        getCollection('users'),
      ]);
      const sMap: Record<string, any> = {};
      (users as any[]).forEach(u => (sMap[u.uid] = u));
      setStudentMap(sMap);
      const sorted = (counselings as any[])
        .sort((a, b) => (a.scheduledAt?.toDate?.() ?? 0) - (b.scheduledAt?.toDate?.() ?? 0));
      setBookings(sorted);
    } catch (e) {
      console.warn('[BKSchedule] load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    await updateDocument('counseling', id, { status });
    load();
  };

  const STATUS: Record<string, { bg: string; color: string; label: string }> = {
    booked:   { bg: Colors.gray11, color: Colors.gray3,  label: 'Booking'  },
    ongoing:  { bg: Colors.gray10, color: Colors.gray2,  label: 'Berjalan' },
    resolved: { bg: Colors.gray11, color: Colors.gray5,  label: 'Selesai'  },
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Jadwal Konseling</Text>
        <Text style={styles.sub}>{bookings.length} sesi</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada booking</Text>
          </View>
        }
        renderItem={({ item }) => {
          const student = studentMap[item.studentId];
          const cfg = STATUS[item.status] ?? STATUS.booked;
          return (
            <View style={styles.card}>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{student?.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student?.name ?? item.studentId}</Text>
                  <Text style={styles.typeText}>{item.type}</Text>
                  <Text style={styles.dateText}>
                    {item.scheduledAt?.toDate?.().toLocaleDateString('id-ID', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              {item.status === 'booked' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'ongoing')}>
                    <Ionicons name="play-circle-outline" size={16} color={Colors.gray3} />
                    <Text style={styles.actionText}>Mulai Sesi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.gray11 }]} onPress={() => updateStatus(item.id, 'resolved')}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.gray5} />
                    <Text style={[styles.actionText, { color: Colors.gray5 }]}>Selesai</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'ongoing' && (
                <TouchableOpacity style={[styles.actionBtn, { marginTop: 8 }]} onPress={() => updateStatus(item.id, 'resolved')}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.gray3} />
                  <Text style={styles.actionText}>Tandai Selesai</Text>
                </TouchableOpacity>
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
    backgroundColor: Colors.gray1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  title: { ...Typography.title2, color: Colors.white },
  sub: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  list: { padding: Spacing.base },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.headline, color: Colors.gray3 },
  studentName: { ...Typography.headline, color: Colors.black },
  typeText: { ...Typography.footnote, color: Colors.gray5, textTransform: 'capitalize', marginTop: 2, fontWeight: '600' },
  dateText: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  statusText: { ...Typography.caption1, fontWeight: '700' },
  notes: { ...Typography.footnote, color: Colors.secondaryLabel, marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  actionText: { ...Typography.subheadline, color: Colors.gray3, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
});
