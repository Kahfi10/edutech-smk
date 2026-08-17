import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../../src/context/AuthContext';
import { addDocument, getCollection, where } from '../../../src/firebase/firestore.service';
import { Button } from '../../../src/components/ui/Button';
import { useToast } from '../../../src/context/ToastContext';
import { hapticSuccess, hapticError, hapticLight } from '../../../src/services/haptics';
import { Colors, Spacing, Radius, Shadow } from '../../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../../src/constants/mockData';

export default function CreateAssignmentScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore]       = useState('100');
  const [subjectId, setSubjectId]     = useState('');
  const [classId, setClassId]         = useState('');
  const [deadlineStr, setDeadlineStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [subjects, setSubjects]     = useState<any[]>([]);
  const [classes, setClasses]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [recent, setRecent]         = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (USE_MOCK || !profile) return;
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(d => {
      const subs = d as any[];
      setSubjects(subs);
      if (subs.length > 0 && !subjectId) setSubjectId(subs[0].id);
    });
    getCollection('classes').then(d => {
      const cls = d as any[];
      setClasses(cls);
      if (cls.length > 0 && !classId) setClassId(cls[0].id);
    });
    getCollection('assignments', where('createdBy', '==', profile.uid))
      .then(d => setRecent((d as any[])
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        .slice(0, 5)
      ));
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 800); };

  const handleCreate = async () => {
    // Validasi
    if (!title.trim()) {
      hapticError();
      showToast('Judul tugas wajib diisi', 'warning');
      return;
    }
    if (!USE_MOCK && !subjectId) {
      hapticError();
      showToast('Pilih mata pelajaran terlebih dahulu', 'warning');
      return;
    }
    if (!USE_MOCK && !classId) {
      hapticError();
      showToast('Pilih kelas terlebih dahulu', 'warning');
      return;
    }
    const score = parseInt(maxScore);
    if (isNaN(score) || score < 1 || score > 100) {
      hapticError();
      showToast('Nilai maksimum harus antara 1–100', 'warning');
      return;
    }
    // Parse deadline — pastikan format YYYY-MM-DD + timezone lokal
    const parts = deadlineStr.split('-');
    if (parts.length !== 3) {
      hapticError();
      showToast('Format tanggal: YYYY-MM-DD (contoh: 2026-09-01)', 'warning');
      return;
    }
    const dateObj = new Date(
      parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 0
    );
    if (isNaN(dateObj.getTime())) {
      hapticError();
      showToast('Tanggal tidak valid', 'warning');
      return;
    }

    if (USE_MOCK) {
      hapticSuccess();
      showToast(`Tugas "${title}" berhasil dibuat (Mock Mode)`, 'success');
      setTitle(''); setDescription('');
      return;
    }

    setLoading(true);
    try {
      await addDocument('assignments', {
        title:       title.trim(),
        description: description.trim(),
        subjectId,
        classId,
        deadline:    Timestamp.fromDate(dateObj),
        maxScore:    score,
        createdBy:   profile!.uid,
      });

      // FCM demo notification
      try {
        const { notifyNewAssignment } = await import('../../../src/services/fcm.service');
        const subjectName = subjects.find(s => s.id === subjectId)?.name ?? 'Mata Pelajaran';
        await notifyNewAssignment(title.trim(), subjectName);
      } catch { /* FCM opsional */ }

      hapticSuccess();
      showToast('Tugas berhasil dibuat! Siswa akan mendapat notifikasi.', 'success');
      setTitle('');
      setDescription('');
      setMaxScore('100');

      // Refresh daftar tugas terbaru
      getCollection('assignments', where('createdBy', '==', profile!.uid))
        .then(d => setRecent((d as any[])
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
          .slice(0, 5)
        ));
    } catch (err: any) {
      hapticError();
      showToast(err.message ?? 'Gagal membuat tugas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gray5} colors={[Colors.black]} />}
      >
        <Text style={styles.pageTitle}>Buat Tugas Baru</Text>

        {/* Judul */}
        <Text style={styles.label}>JUDUL TUGAS</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Contoh: Tugas 1 — Membuat CV"
          placeholderTextColor={Colors.gray7}
          returnKeyType="next"
        />

        {/* Instruksi */}
        <Text style={styles.label}>INSTRUKSI / DESKRIPSI</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Deskripsikan instruksi pengerjaan tugas..."
          multiline
          numberOfLines={4}
          placeholderTextColor={Colors.gray7}
          textAlignVertical="top"
        />

        {/* Mata Pelajaran */}
        {!USE_MOCK && subjects.length > 0 && (
          <Animated.View entering={FadeInDown.delay(50).springify().damping(18)}>
            <Text style={styles.label}>MATA PELAJARAN</Text>
            <View style={styles.chipRow}>
              {subjects.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, subjectId === s.id && styles.chipActive]}
                  onPress={() => { hapticLight(); setSubjectId(s.id); }}
                >
                  <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Kelas */}
        {!USE_MOCK && classes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
            <Text style={styles.label}>KELAS</Text>
            <View style={styles.chipRow}>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, classId === c.id && styles.chipActive]}
                  onPress={() => { hapticLight(); setClassId(c.id); }}
                >
                  <Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Nilai Maksimum */}
        <Text style={styles.label}>NILAI MAKSIMUM</Text>
        <TextInput
          style={[styles.input, { width: 110 }]}
          value={maxScore}
          onChangeText={setMaxScore}
          keyboardType="numeric"
          placeholderTextColor={Colors.gray7}
          returnKeyType="done"
        />

        {/* Deadline */}
        <Text style={styles.label}>DEADLINE</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.gray6} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={deadlineStr}
            onChangeText={setDeadlineStr}
            placeholder="YYYY-MM-DD (contoh: 2026-09-01)"
            placeholderTextColor={Colors.gray7}
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <Text style={styles.hint}>Format: YYYY-MM-DD · Contoh: 2026-09-01</Text>

        {/* Tombol Buat */}
        <Button
          title="Buat Tugas"
          onPress={handleCreate}
          loading={loading}
          fullWidth
          style={styles.submitBtn}
        />

        {/* Tugas terbaru */}
        {recent.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>TUGAS TERBARU</Text>
            {recent.map((a, i) => (
              <Animated.View
                key={a.id}
                entering={FadeInDown.delay(i * 40).springify().damping(18)}
                style={styles.recentCard}
              >
                <Text style={styles.recentTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.recentSub}>
                  Deadline: {a.deadline?.toDate?.().toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  }) ?? '-'}
                </Text>
                {a.classId && (
                  <Text style={styles.recentSub}>{a.classId} · Maks. {a.maxScore}</Text>
                )}
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingHorizontal: Spacing.base },

  pageTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.black, marginBottom: Spacing.xl,
  },

  // Label — NO negative letterSpacing (fix web rendering bug)
  label: {
    fontSize: 11, fontWeight: '600', color: Colors.tertiaryLabel,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.base, marginBottom: 6,
  },

  // Input — explicit fontSize, no Typography spread
  input: {
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    ...Shadow.xs,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  hint: {
    fontSize: 11, color: Colors.quaternaryLabel, marginTop: 4,
  },

  // Chips — NO letterSpacing
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive:     { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText:       { fontSize: 14, fontWeight: '500', color: Colors.secondaryLabel },
  chipTextActive: { fontSize: 14, fontWeight: '600', color: Colors.white },

  dateRow:   { flexDirection: 'row', alignItems: 'center' },
  submitBtn: { marginTop: Spacing.xl },

  sectionTitle: {
    fontSize: 11, fontWeight: '600', color: Colors.tertiaryLabel,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xxl, marginBottom: Spacing.sm,
  },
  recentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.xs,
    gap: 2,
  },
  recentTitle: { fontSize: 15, fontWeight: '500', color: Colors.black },
  recentSub:   { fontSize: 12, color: Colors.tertiaryLabel },
});
