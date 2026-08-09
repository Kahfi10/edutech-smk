import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, updateDocument, where } from '../../../src/firebase/firestore.service';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';

export default function GradeAssignmentScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [gradingSub, setGradingSub] = useState<any>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getCollection('assignments', where('createdBy', '==', profile.uid))
      .then(setAssignments).finally(() => setLoading(false));
    getCollection('users', where('role', '==', 'STUDENT')).then(data => {
      const map: Record<string, any> = {};
      (data as any[]).forEach((s: any) => (map[s.uid] = s));
      setStudents(map);
    });
  }, [profile]);

  const loadSubmissions = async (a: any) => {
    setSelected(a);
    const subs = await getCollection('submissions', where('assignmentId', '==', a.id));
    setSubmissions(subs as any[]);
  };

  const openGrading = (sub: any) => {
    setGradingSub(sub); setScore(sub.score?.toString() ?? ''); setFeedback(sub.feedback ?? ''); setModal(true);
  };

  const saveGrade = async () => {
    const s = parseInt(score);
    if (isNaN(s) || s < 0 || s > (selected?.maxScore ?? 100))
      return Alert.alert('Nilai tidak valid', `0 - ${selected?.maxScore ?? 100}`);
    setSaving(true);
    await updateDocument('submissions', gradingSub.id, {
      score: s, feedback: feedback.trim(), gradedBy: profile!.uid, status: 'graded',
    });
    setModal(false);
    loadSubmissions(selected);
    setSaving(false);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // Assignment picker
  if (!selected) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Nilai Tugas</Text>
          <Text style={styles.headerSub}>Pilih tugas untuk dinilai</Text>
        </View>
        <FlatList
          data={assignments}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color={Colors.gray8} />
              <Text style={styles.emptyTitle}>Belum ada tugas</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.assignRow} onPress={() => loadSubmissions(item)} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={styles.assignTitle}>{item.title}</Text>
                <Text style={styles.assignMeta}>
                  Deadline: {item.deadline?.toDate?.().toLocaleDateString('id-ID')} · Maks. {item.maxScore}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray8} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base }} />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => setSelected(null)} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{selected.title}</Text>
          <Text style={styles.headerSub}>{submissions.length} submission</Text>
        </View>
      </View>

      <FlatList
        data={submissions}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.subList, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada submission</Text>
          </View>
        }
        renderItem={({ item }) => {
          const student = students[item.studentId];
          return (
            <View style={styles.subCard}>
              <View style={styles.subAvatar}>
                <Text style={styles.subAvatarText}>{student?.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subName}>{student?.name ?? item.studentId}</Text>
                {item.textAnswer && <Text style={styles.subAnswer} numberOfLines={1}>{item.textAnswer}</Text>}
                {item.fileUrl && (
                  <View style={styles.fileRow}>
                    <Ionicons name="attach-outline" size={13} color={Colors.gray6} />
                    <Text style={styles.fileText}>File terlampir</Text>
                  </View>
                )}
              </View>
              <View style={styles.gradeRight}>
                {item.status === 'graded' ? (
                  <Text style={styles.scoreText}>{item.score}</Text>
                ) : (
                  <View style={styles.ungradedPill}>
                    <Text style={styles.ungradedText}>—</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.gradeBtn} onPress={() => openGrading(item)}>
                  <Text style={styles.gradeBtnText}>Nilai</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: Spacing.base + 48 }} />
        )}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>Beri Nilai</Text>
            <Text style={styles.sheetSub}>{students[gradingSub?.studentId]?.name}</Text>
            <Text style={styles.label}>Nilai (0 - {selected?.maxScore})</Text>
            <TextInput
              style={styles.scoreInput} value={score} onChangeText={setScore}
              keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.gray7}
            />
            <Text style={styles.label}>Feedback (opsional)</Text>
            <TextInput
              style={[styles.scoreInput, { height: 80, textAlignVertical: 'top' }]}
              value={feedback} onChangeText={setFeedback} multiline
              placeholder="Catatan untuk siswa..." placeholderTextColor={Colors.gray7}
            />
            <View style={styles.btns}>
              <Button title="Batal" onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Simpan" onPress={saveGrade} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.gray1, paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl,
    flexDirection: 'row', alignItems: 'flex-end', gap: 4,
  },
  headerTitle: { ...Typography.title3, color: Colors.white },
  headerSub: { ...Typography.caption1, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  assignRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 14,
    backgroundColor: Colors.cardBackground,
  },
  assignTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  assignMeta: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  subList: { backgroundColor: Colors.cardBackground },
  subCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
  },
  subAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.gray10, alignItems: 'center', justifyContent: 'center',
  },
  subAvatarText: { ...Typography.subheadline, color: Colors.gray4 },
  subName: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  subAnswer: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  fileText: { ...Typography.caption2, color: Colors.gray6 },
  gradeRight: { alignItems: 'flex-end', gap: 6 },
  scoreText: { fontSize: 20, fontWeight: '800', color: Colors.black },
  ungradedPill: { backgroundColor: Colors.gray11, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  ungradedText: { ...Typography.footnote, color: Colors.gray7 },
  gradeBtn: { backgroundColor: Colors.black, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  gradeBtnText: { ...Typography.caption1, color: Colors.white, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  sheetTitle: { ...Typography.title3, color: Colors.black },
  sheetSub: { ...Typography.footnote, color: Colors.tertiaryLabel, marginTop: 4, marginBottom: Spacing.base },
  label: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: Spacing.md },
  scoreInput: {
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  btns: { flexDirection: 'row', gap: 10, marginTop: Spacing.xl },
});
