import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal,
  TextInput, Alert,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, addDocument, updateDocument, where, orderBy } from '../../src/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Timestamp } from 'firebase/firestore';

const CATEGORIES = ['Terlambat', 'Bolos', 'Atribut', 'HP di Kelas', 'Perkelahian', 'Lainnya'];

export default function WaliViolationsScreen() {
  const { profile } = useAuth();
  const [violations, setViolations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.classId) { setLoading(false); return; }
    Promise.all([
      getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', profile.classId)),
      getCollection('violations'),
    ]).then(([studs, viols]) => {
      setStudents(studs as any[]);
      const map: Record<string, any> = {};
      (studs as any[]).forEach(s => (map[s.uid] = s));
      setStudentMap(map);
      const classViolations = (viols as any[]).filter(v => map[v.studentId]);
      setViolations(classViolations.sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.()));
    }).finally(() => setLoading(false));
  }, [profile]);

  const handleAdd = async () => {
    if (!selectedStudentId) return Alert.alert('Perhatian', 'Pilih siswa.');
    const p = parseInt(points);
    if (isNaN(p) || p < 1) return Alert.alert('Perhatian', 'Poin tidak valid.');
    if (!description.trim()) return Alert.alert('Perhatian', 'Deskripsi wajib diisi.');

    setSaving(true);
    try {
      await addDocument('violations', {
        studentId: selectedStudentId,
        points: p,
        category,
        description: description.trim(),
        reportedBy: profile!.uid,
        reportedByRole: 'WALI',
        status: 'pending',
        date: Timestamp.now(),
      });
      Alert.alert('Berhasil', 'Pelanggaran berhasil dicatat.');
      setModalVisible(false);
      setDescription(''); setPoints('5');
      getCollection('violations').then(viols => {
        const classV = (viols as any[]).filter(v => studentMap[v.studentId]);
        setViolations(classV.sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.()));
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Catatan Pelanggaran Kelas</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={violations}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada catatan pelanggaran</Text>}
        renderItem={({ item }) => {
          const s = studentMap[item.studentId];
          return (
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{s?.name ?? item.studentId}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                  <Text style={styles.date}>{item.date?.toDate?.().toLocaleDateString('id-ID')}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.points}>+{item.points}</Text>
                  <Badge
                    label={item.status === 'verified' ? 'Verified' : 'Pending'}
                    bg={item.status === 'verified' ? '#FEF2F2' : '#FFFBEB'}
                    color={item.status === 'verified' ? '#DC2626' : '#D97706'}
                  />
                </View>
              </View>
            </Card>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Catat Pelanggaran</Text>

            <Text style={styles.label}>Siswa</Text>
            <FlatList
              horizontal data={students} keyExtractor={i => i.uid}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.chip, selectedStudentId === item.uid && styles.chipActive]}
                  onPress={() => setSelectedStudentId(item.uid)}>
                  <Text style={[styles.chipText, selectedStudentId === item.uid && styles.chipTextActive]}>
                    {item.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Deskripsi *</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription}
              placeholder="Detail pelanggaran..." placeholderTextColor="#94A3B8" multiline />

            <Text style={styles.label}>Poin</Text>
            <TextInput style={[styles.input, { width: 80 }]} value={points} onChangeText={setPoints} keyboardType="numeric" />

            <View style={styles.btns}>
              <Button title="Batal" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Simpan" onPress={handleAdd} loading={saving} variant="danger" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  addBtn: { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  list: { padding: 16 },
  row: { flexDirection: 'row', gap: 10 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  category: { fontSize: 12, color: '#4F46E5', fontWeight: '600', marginTop: 2 },
  desc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  date: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  points: { fontSize: 20, fontWeight: '800', color: '#DC2626' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 6,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  chipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#DC2626', fontWeight: '700' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btns: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
