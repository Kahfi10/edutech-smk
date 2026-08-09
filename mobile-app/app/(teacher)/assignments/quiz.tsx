import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { addDocument, getCollection, subscribeCollection, where } from '../../../src/firebase/firestore.service';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../../src/constants/mockData';

interface Question {
  question: string;
  options:  string[];
  correct:  number;
}

const emptyQuestion = (): Question => ({
  question: '',
  options: ['', '', '', ''],
  correct: 0,
});

export default function CreateQuizScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle]       = useState('');
  const [duration, setDuration] = useState('30');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId]   = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);

  useEffect(() => {
    if (!profile || USE_MOCK) return;
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(setSubjects);
    getCollection('classes').then(setClasses);
    const unsub = subscribeCollection('quizzes', d => setRecentQuizzes((d as any[]).slice(0, 5)), where('createdBy', '==', profile.uid));
    return unsub;
  }, [profile]);

  const addQuestion = () => setQuestions(q => [...q, emptyQuestion()]);
  const removeQuestion = (i: number) => {
    if (questions.length === 1) return Alert.alert('Minimal 1 soal');
    setQuestions(q => q.filter((_, idx) => idx !== i));
  };
  const updateQuestion = (i: number, field: keyof Question, value: any) => {
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };
  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(q => q.map((item, idx) => idx === qi ? { ...item, options: item.options.map((o, j) => j === oi ? value : o) } : item));
  };

  const handleCreate = async () => {
    if (!title.trim())    return Alert.alert('Judul kuis wajib diisi');
    if (!USE_MOCK && !subjectId) return Alert.alert('Pilih mata pelajaran');
    if (!USE_MOCK && !classId)   return Alert.alert('Pilih kelas');

    for (const [i, q] of questions.entries()) {
      if (!q.question.trim())           return Alert.alert(`Soal ${i + 1} kosong`);
      if (q.options.some(o => !o.trim())) return Alert.alert(`Soal ${i + 1}: isi semua pilihan jawaban`);
    }

    const d = new Date(deadline);
    if (isNaN(d.getTime())) return Alert.alert('Format deadline: YYYY-MM-DD');

    setLoading(true);
    try {
      await addDocument('quizzes', {
        title: title.trim(),
        duration: parseInt(duration) || 30,
        subjectId: subjectId || 'subj_pemweb',
        classId: classId || 'class_xi_rpl_1',
        questions,
        deadline: Timestamp.fromDate(d),
        createdBy: profile!.uid,
      });
      Alert.alert('Berhasil', `Kuis "${title}" berhasil dibuat dengan ${questions.length} soal!`);
      setTitle(''); setQuestions([emptyQuestion()]); setDuration('30');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Buat Kuis</Text>

      {/* Info kuis */}
      <Text style={styles.sectionLabel}>Informasi Kuis</Text>
      <View style={styles.infoCard}>
        <TextInput style={styles.input} value={title} onChangeText={setTitle}
          placeholder="Judul kuis, contoh: Kuis 1 — HTML Dasar" placeholderTextColor={Colors.gray7} />

        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Durasi (menit)</Text>
            <TextInput style={styles.input} value={duration} onChangeText={setDuration}
              keyboardType="numeric" placeholder="30" placeholderTextColor={Colors.gray7} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Deadline (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={deadline} onChangeText={setDeadline}
              placeholder="2026-08-20" placeholderTextColor={Colors.gray7} />
          </View>
        </View>

        {!USE_MOCK && (
          <>
            <Text style={styles.inputLabel}>Mata Pelajaran</Text>
            <View style={styles.chips}>
              {subjects.map(s => (
                <TouchableOpacity key={s.id} style={[styles.chip, subjectId === s.id && styles.chipActive]} onPress={() => setSubjectId(s.id)}>
                  <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Kelas</Text>
            <View style={styles.chips}>
              {classes.map(c => (
                <TouchableOpacity key={c.id} style={[styles.chip, classId === c.id && styles.chipActive]} onPress={() => setClassId(c.id)}>
                  <Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Soal-soal */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Soal ({questions.length})</Text>
        <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
          <Ionicons name="add" size={16} color={Colors.black} />
          <Text style={styles.addQuestionBtnText}>Tambah Soal</Text>
        </TouchableOpacity>
      </View>

      {questions.map((q, qi) => (
        <View key={qi} style={styles.questionCard}>
          <View style={styles.questionCardHeader}>
            <Text style={styles.questionNum}>Soal {qi + 1}</Text>
            {questions.length > 1 && (
              <TouchableOpacity onPress={() => removeQuestion(qi)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={Colors.gray7} />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={[styles.input, { minHeight: 56, textAlignVertical: 'top' }]}
            value={q.question} onChangeText={v => updateQuestion(qi, 'question', v)}
            multiline placeholder="Tulis pertanyaan di sini..." placeholderTextColor={Colors.gray7}
          />

          <Text style={styles.inputLabel}>Pilihan Jawaban</Text>
          {q.options.map((opt, oi) => (
            <View key={oi} style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.radioBtn, q.correct === oi && styles.radioBtnActive]}
                onPress={() => updateQuestion(qi, 'correct', oi)}
              >
                {q.correct === oi && <View style={styles.radioBtnInner} />}
              </TouchableOpacity>
              <Text style={styles.optionLetter}>{String.fromCharCode(65 + oi)}</Text>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={opt}
                onChangeText={v => updateOption(qi, oi, v)}
                placeholder={`Pilihan ${String.fromCharCode(65 + oi)}`}
                placeholderTextColor={Colors.gray7}
              />
            </View>
          ))}
          <Text style={styles.correctHint}>
            Jawaban benar: {String.fromCharCode(65 + q.correct)} — Tap radio untuk ubah
          </Text>
        </View>
      ))}

      <Button title="Buat Kuis" onPress={handleCreate} loading={loading} fullWidth style={{ marginTop: Spacing.base }} />

      {/* Kuis yang sudah dibuat */}
      {recentQuizzes.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl }]}>Kuis Dibuat</Text>
          {recentQuizzes.map(rq => (
            <View key={rq.id} style={styles.recentCard}>
              <Text style={styles.recentTitle}>{rq.title}</Text>
              <Text style={styles.recentMeta}>{rq.questions?.length ?? 0} soal · {rq.duration ?? 30} menit</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.base },
  pageTitle: { ...Typography.title2, color: Colors.black, marginBottom: Spacing.xl },
  sectionLabel: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  addQuestionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gray11, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  addQuestionBtnText: { ...Typography.caption1, color: Colors.black, fontWeight: '600' },
  infoCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    marginBottom: Spacing.base, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
    gap: Spacing.sm,
  },
  inputLabel: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5, marginTop: 6 },
  input: {
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  rowInputs: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText:       { ...Typography.footnote, color: Colors.secondaryLabel },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  questionCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  questionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNum: { ...Typography.footnote, color: Colors.tertiaryLabel, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  radioBtn: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.gray8,
    alignItems: 'center', justifyContent: 'center',
  },
  radioBtnActive: { borderColor: Colors.black },
  radioBtnInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.black },
  optionLetter: { ...Typography.subheadline, color: Colors.gray5, fontWeight: '700', width: 18 },
  correctHint: { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 6 },
  recentCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  recentTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  recentMeta:  { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
});
