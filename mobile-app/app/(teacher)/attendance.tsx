import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, addDocument, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Timestamp } from 'firebase/firestore';

const STATUS_OPTIONS = [
  { key: 'hadir', label: 'Hadir', color: '#059669', bg: '#ECFDF5' },
  { key: 'izin', label: 'Izin', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'sakit', label: 'Sakit', color: '#D97706', bg: '#FFFBEB' },
  { key: 'alpha', label: 'Alpha', color: '#DC2626', bg: '#FEF2F2' },
] as const;

type AttendStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [period, setPeriod] = useState(1);
  const [records, setRecords] = useState<Record<string, AttendStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(setSubjects);
    getCollection('classes').then(setClasses);
  }, [profile]);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    getCollection('users', where('role', '==', 'STUDENT'), where('classId', '==', selectedClass))
      .then(data => {
        setStudents(data);
        const init: Record<string, AttendStatus> = {};
        data.forEach((s: any) => (init[s.uid] = 'hadir'));
        setRecords(init);
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const toggleStatus = (studentId: string) => {
    const order: AttendStatus[] = ['hadir', 'izin', 'sakit', 'alpha'];
    const curr = records[studentId] ?? 'hadir';
    const next = order[(order.indexOf(curr) + 1) % order.length];
    setRecords(r => ({ ...r, [studentId]: next }));
  };

  const saveAttendance = async () => {
    if (!selectedSubject) return Alert.alert('Perhatian', 'Pilih mata pelajaran.');
    if (!selectedClass) return Alert.alert('Perhatian', 'Pilih kelas.');
    if (students.length === 0) return Alert.alert('Perhatian', 'Tidak ada siswa di kelas ini.');

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDocument('attendance', {
        date: today,
        subjectId: selectedSubject,
        classId: selectedClass,
        period,
        inputBy: profile!.uid,
        records: students.map(s => ({ studentId: s.uid, status: records[s.uid] ?? 'hadir' })),
      });
      Alert.alert('Berhasil', 'Absensi berhasil disimpan!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyle = (status: AttendStatus) => {
    const opt = STATUS_OPTIONS.find(o => o.key === status);
    return opt ? { color: opt.color, bg: opt.bg } : { color: '#64748B', bg: '#F1F5F9' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.dateText}>📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      <View style={styles.filters}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Mata Pelajaran</Text>
          <FlatList
            horizontal data={subjects} keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, selectedSubject === item.id && styles.chipActive]}
                onPress={() => setSelectedSubject(item.id)}>
                <Text style={[styles.chipText, selectedSubject === item.id && styles.chipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <View style={styles.filters}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Kelas</Text>
          <FlatList
            horizontal data={classes} keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, selectedClass === item.id && styles.chipActive]}
                onPress={() => setSelectedClass(item.id)}>
                <Text style={[styles.chipText, selectedClass === item.id && styles.chipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <View style={styles.periodRow}>
        <Text style={styles.label}>Jam ke-</Text>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>Tap nama siswa untuk ubah status</Text>

      {loading ? <LoadingSpinner /> : (
        <FlatList
          data={students}
          keyExtractor={i => i.uid}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>Pilih kelas terlebih dahulu</Text>}
          renderItem={({ item, index }) => {
            const status = records[item.uid] ?? 'hadir';
            const st = getStatusStyle(status);
            return (
              <TouchableOpacity onPress={() => toggleStatus(item.uid)}>
                <View style={styles.studentRow}>
                  <View style={styles.numBadge}>
                    <Text style={styles.numText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{status.toUpperCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {students.length > 0 && (
        <View style={styles.saveBar}>
          <Button title={`Simpan Absensi (${students.length} siswa)`} onPress={saveAttendance} loading={saving} fullWidth variant="secondary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { backgroundColor: '#059669', padding: 12 },
  dateText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  filters: { paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 6,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  chipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#059669', fontWeight: '700' },
  periodRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 6, marginBottom: 4 },
  periodBtn: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  periodBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  periodText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  periodTextActive: { color: '#FFFFFF' },
  hint: { fontSize: 11, color: '#94A3B8', paddingHorizontal: 16, marginBottom: 8 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  numBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  studentName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 24 },
  saveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
});
