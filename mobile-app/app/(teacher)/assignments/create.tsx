import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../src/context/AuthContext';
import { addDocument, getCollection, where } from '../../../src/firebase/firestore.service';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Timestamp } from 'firebase/firestore';

export default function CreateAssignmentScreen() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 3600 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(setSubjects);
    getCollection('classes').then(setClasses);
    getCollection('assignments', where('createdBy', '==', profile.uid)).then(data =>
      setRecentAssignments(data.slice(0, 5))
    );
  }, [profile]);

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Perhatian', 'Judul tugas wajib diisi.');
    if (!subjectId) return Alert.alert('Perhatian', 'Pilih mata pelajaran.');
    if (!classId) return Alert.alert('Perhatian', 'Pilih kelas.');
    const score = parseInt(maxScore);
    if (isNaN(score) || score < 1) return Alert.alert('Perhatian', 'Nilai maks tidak valid.');

    setLoading(true);
    try {
      await addDocument('assignments', {
        title: title.trim(),
        description: description.trim(),
        subjectId,
        classId,
        deadline: Timestamp.fromDate(deadline),
        maxScore: score,
        createdBy: profile!.uid,
      });
      Alert.alert('Berhasil', 'Tugas berhasil dibuat!');
      setTitle(''); setDescription(''); setMaxScore('100');
      getCollection('assignments', where('createdBy', '==', profile!.uid)).then(data =>
        setRecentAssignments(data.slice(0, 5))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Buat Tugas Baru">
        <Text style={styles.label}>Judul Tugas *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle}
          placeholder="Contoh: Tugas 1 - Membuat CV" placeholderTextColor="#94A3B8" />

        <Text style={styles.label}>Deskripsi / Instruksi</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description}
          onChangeText={setDescription} placeholder="Instruksi pengerjaan tugas..."
          multiline numberOfLines={4} placeholderTextColor="#94A3B8" />

        <Text style={styles.label}>Mata Pelajaran *</Text>
        <View style={styles.row}>
          {subjects.map(s => (
            <TouchableOpacity key={s.id}
              style={[styles.chip, subjectId === s.id && styles.chipActive]}
              onPress={() => setSubjectId(s.id)}>
              <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Kelas *</Text>
        <View style={styles.row}>
          {classes.map(c => (
            <TouchableOpacity key={c.id}
              style={[styles.chip, classId === c.id && styles.chipActive]}
              onPress={() => setClassId(c.id)}>
              <Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Nilai Maksimum</Text>
        <TextInput style={styles.input} value={maxScore} onChangeText={setMaxScore}
          keyboardType="numeric" placeholderTextColor="#94A3B8" />

        <Text style={styles.label}>Deadline</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnText}>
            📅 {deadline.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            minimumDate={new Date()}
            onChange={(e, d) => { setShowDatePicker(false); if (d) setDeadline(d); }}
          />
        )}

        <Button title="Buat Tugas" onPress={handleCreate} loading={loading} fullWidth style={{ marginTop: 12 }} />
      </Card>

      <Text style={styles.sectionTitle}>Tugas yang Sudah Dibuat</Text>
      {recentAssignments.map(a => (
        <Card key={a.id}>
          <Text style={styles.assignTitle}>{a.title}</Text>
          <Text style={styles.assignSub}>
            Deadline: {a.deadline?.toDate?.().toLocaleDateString('id-ID') ?? '-'}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  chipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#4F46E5', fontWeight: '700' },
  dateBtn: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    padding: 12, backgroundColor: '#F8FAFC',
  },
  dateBtnText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginVertical: 12 },
  assignTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  assignSub: { fontSize: 12, color: '#64748B', marginTop: 3 },
});
