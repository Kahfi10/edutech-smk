import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, updateDocument } from '../../../src/firebase/firestore.service';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';

export default function BKScheduleScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile) return;
    const [counselings, users] = await Promise.all([
      getCollection('counseling'),
      getCollection('users'),
    ]);
    const sMap: Record<string, any> = {};
    (users as any[]).forEach(u => (sMap[u.uid] = u));
    setStudentMap(sMap);
    const mine = (counselings as any[])
      .filter(c => c.bkTeacherId === profile.uid)
      .sort((a, b) => a.scheduledAt?.toDate?.() - b.scheduledAt?.toDate?.());
    setBookings(mine);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    await updateDocument('counseling', id, { status });
    loadData();
  };

  const STATUS_CONFIG: Record<string, { bg: string; c: string }> = {
    booked: { bg: '#EEF2FF', c: '#4F46E5' },
    ongoing: { bg: '#FFFBEB', c: '#D97706' },
    resolved: { bg: '#ECFDF5', c: '#059669' },
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada booking konseling</Text>}
        renderItem={({ item }) => {
          const student = studentMap[item.studentId];
          const sc = STATUS_CONFIG[item.status] ?? { bg: '#F1F5F9', c: '#64748B' };
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student?.name ?? item.studentId}</Text>
                  <Text style={styles.type}>{item.type}</Text>
                  <Text style={styles.date}>
                    {item.scheduledAt?.toDate?.().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                  {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
                </View>
                <Badge label={item.status} bg={sc.bg} color={sc.c} />
              </View>

              {item.status === 'booked' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFFBEB' }]} onPress={() => updateStatus(item.id, 'ongoing')}>
                    <Text style={[styles.actionText, { color: '#D97706' }]}>Mulai Sesi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECFDF5' }]} onPress={() => updateStatus(item.id, 'resolved')}>
                    <Text style={[styles.actionText, { color: '#059669' }]}>Selesai</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'ongoing' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECFDF5', marginTop: 8 }]} onPress={() => updateStatus(item.id, 'resolved')}>
                  <Text style={[styles.actionText, { color: '#059669' }]}>Tandai Selesai</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 10 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  type: { fontSize: 12, color: '#DC2626', fontWeight: '600', textTransform: 'capitalize', marginTop: 2 },
  date: { fontSize: 12, color: '#64748B', marginTop: 2 },
  notes: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
});
