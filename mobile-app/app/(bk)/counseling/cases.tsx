import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, updateDocument } from '../../../src/firebase/firestore.service';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';

export default function BKCasesScreen() {
  const { profile } = useAuth();
  const [violations, setViolations] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [viols, users] = await Promise.all([
      getCollection('violations'),
      getCollection('users'),
    ]);
    const sMap: Record<string, any> = {};
    (users as any[]).forEach(u => (sMap[u.uid] = u));
    setStudentMap(sMap);
    setViolations((viols as any[]).sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.()));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const verify = async (id: string) => {
    await updateDocument('violations', id, { verifiedBy: profile!.uid, status: 'verified' });
    Alert.alert('Berhasil', 'Pelanggaran terverifikasi.');
    loadData();
  };

  const reject = async (id: string) => {
    await updateDocument('violations', id, { status: 'rejected' });
    loadData();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.tabTitle}>Semua Pelanggaran</Text>
        <View style={styles.legend}>
          <Badge label={`Pending: ${violations.filter(v => v.status === 'pending').length}`} bg="#FFFBEB" color="#D97706" />
        </View>
      </View>

      <FlatList
        data={violations}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Tidak ada data pelanggaran</Text>}
        renderItem={({ item }) => {
          const student = studentMap[item.studentId];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student?.name ?? item.studentId}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                  <Text style={styles.meta}>
                    Dilaporkan oleh {item.reportedByRole} | {item.date?.toDate?.().toLocaleDateString('id-ID')}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.points}>+{item.points}</Text>
                  <Badge
                    label={item.status}
                    bg={item.status === 'verified' ? '#FEF2F2' : item.status === 'pending' ? '#FFFBEB' : '#F1F5F9'}
                    color={item.status === 'verified' ? '#DC2626' : item.status === 'pending' ? '#D97706' : '#94A3B8'}
                  />
                </View>
              </View>
              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.verifyBtn} onPress={() => verify(item.id)}>
                    <Text style={styles.verifyText}>Verifikasi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(item.id)}>
                    <Text style={styles.rejectText}>Tolak</Text>
                  </TouchableOpacity>
                </View>
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  legend: {},
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 8 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  category: { fontSize: 12, color: '#4F46E5', fontWeight: '600', marginTop: 2 },
  desc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  meta: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 4 },
  points: { fontSize: 18, fontWeight: '800', color: '#DC2626' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  verifyBtn: { flex: 1, backgroundColor: '#ECFDF5', borderRadius: 8, padding: 8, alignItems: 'center' },
  verifyText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  rejectBtn: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8, alignItems: 'center' },
  rejectText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
});
