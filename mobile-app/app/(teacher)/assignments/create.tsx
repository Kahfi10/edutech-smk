import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { addDocument, getCollection, where } from '../../../src/firebase/firestore.service';
import { Button } from '../../../src/components/ui/Button';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../../src/constants/mockData';

export default function CreateAssignmentScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore]     = useState('100');
  const [subjectId, setSubjectId]   = useState('');
  const [classId, setClassId]       = useState('');
  // deadline: string format YYYY-MM-DD
  const [deadlineStr, setDeadlineStr] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [subjects, setSubjects]     = useState<any[]>([]);
  const [classes, setClasses]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [recent, setRecent]         = useState<any[]>([]);

  useEffect(() => {
    if (USE_MOCK || !profile) return;
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(setSubjects);
    getCollection('classes').then(setClasses);
    getCollection('assignments', where('createdBy', '==', profile.uid))
      .then(d => setRecent((d as any[]).slice(0, 5)));
  }, [profile]);

  const handleCreate = async () => {
    if (!title.trim())   return Alert.alert('Perhatian', 'Judul wajib diisi.');
    if (!USE_MOCK) {
      if (!subjectId)    return Alert.alert('Perhatian', 'Pilih mata pelajaran.');
      if (!classId)      return Alert.alert('Perhatian', 'Pilih kelas.');
    }
    const score = parseInt(maxScore);
    if (isNaN(score) || score < 1) return Alert.alert('Perhatian', 'Nilai maksimum tidak valid.');
    const dateObj = new Date(deadlineStr);
    if (isNaN(dateObj.getTime())) return Alert.alert('Perhatian', 'Format tanggal: YYYY-MM-DD');

    if (USE_MOCK) {
      Alert.alert('Mock Mode', `Tugas "${title}" berhasil dibuat! (tidak disimpan ke Firebase)`);
      setTitle(''); setDescription(''); return;
    }

    setLoading(true);
    try {
      await addDocument('assignments', {
        title: title.trim(), description: description.trim(),
        subjectId, classId,
        deadline: Timestamp.fromDate(dateObj),
        maxScore: score, createdBy: profile!.uid,
      });
      Alert.alert('Berhasil', 'Tugas berhasil dibuat!');
      setTitle(''); setDescription(''); setMaxScore('100');
      getCollection('assignments', where('createdBy', '==', profile!.uid))
        .then(d => setRecent((d as any[]).slice(0, 5)));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Buat Tugas Baru</Text>

      {/* Title */}
      <Text style={styles.label}>Judul Tugas</Text>
      <TextInput
        style={styles.input} value={title} onChangeText={setTitle}
        placeholder="Contoh: Tugas 1 — Membuat CV"
        placeholderTextColor={Colors.gray7}
      />

      {/* Description */}
      <Text style={styles.label}>Instruksi</Text>
      <TextInput
        style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription}
        placeholder="Deskripsikan instruksi pengerjaan tugas..."
        multiline numberOfLines={4} placeholderTextColor={Colors.gray7}
        textAlignVertical="top"
      />

      {/* Mata pelajaran — skip saat mock */}
      {!USE_MOCK && subjects.length > 0 && (
        <>
          <Text style={styles.label}>Mata Pelajaran</Text>
          <View style={styles.chipRow}>
            {subjects.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, subjectId === s.id && styles.chipActive]}
                onPress={() => setSubjectId(s.id)}
              >
                <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Kelas — skip saat mock */}
      {!USE_MOCK && classes.length > 0 && (
        <>
          <Text style={styles.label}>Kelas</Text>
          <View style={styles.chipRow}>
            {classes.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, classId === c.id && styles.chipActive]}
                onPress={() => setClassId(c.id)}
              >
                <Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Max score */}
      <Text style={styles.label}>Nilai Maksimum</Text>
      <TextInput
        style={[styles.input, { width: 100 }]} value={maxScore}
        onChangeText={setMaxScore} keyboardType="numeric"
        placeholderTextColor={Colors.gray7}
      />

      {/* Deadline */}
      <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={18} color={Colors.gray6} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          value={deadlineStr} onChangeText={setDeadlineStr}
          placeholder="2026-08-31" placeholderTextColor={Colors.gray7}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <Button
        title="Buat Tugas"
        onPress={handleCreate}
        loading={loading}
        fullWidth
        style={styles.submitBtn}
      />

      {/* Recent */}
      {recent.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Tugas Dibuat</Text>
          {recent.map(a => (
            <View key={a.id} style={styles.recentCard}>
              <Text style={styles.recentTitle} numberOfLines={1}>{a.title}</Text>
              <Text style={styles.recentSub}>
                Deadline: {a.deadline?.toDate?.().toLocaleDateString('id-ID') ?? '-'}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingHorizontal: Spacing.base },
  pageTitle: { ...Typography.title2, color: Colors.black, marginBottom: Spacing.xl },
  label:     { ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '600',
               textTransform: 'uppercase', letterSpacing: 0.4, marginTop: Spacing.base, marginBottom: 6 },
  input: {
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    ...Typography.body,
    color: Colors.black,
    ...Shadow.xs,
  },
  textArea:  { height: 100, textAlignVertical: 'top' },
  chipRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive:     { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText:       { ...Typography.subheadline, color: Colors.secondaryLabel },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  dateRow:   { flexDirection: 'row', alignItems: 'center' },
  submitBtn: { marginTop: Spacing.xl },
  sectionTitle: {
    ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.4,
    marginTop: Spacing.xxl, marginBottom: Spacing.sm,
  },
  recentCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    ...Shadow.xs,
  },
  recentTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  recentSub:   { ...Typography.caption1,    color: Colors.tertiaryLabel, marginTop: 2 },
});
