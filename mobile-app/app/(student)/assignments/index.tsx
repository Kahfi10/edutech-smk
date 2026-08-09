import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, addDocument, subscribeCollection, where } from '../../../src/firebase/firestore.service';
import { uploadFile } from '../../../src/firebase/storage.service';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { BottomSheet } from '../../../src/components/shared/BottomSheet';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../../src/constants/mockData';

export default function AssignmentsScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.classId) return;
    const unsub = subscribeCollection('assignments', (data) => {
      const sorted = (data as any[]).sort((a, b) => a.deadline?.toDate?.() - b.deadline?.toDate?.());
      setAssignments(sorted);
      setLoading(false);
    }, where('classId', '==', profile.classId));

    if (!USE_MOCK) {
      getCollection('submissions', where('studentId', '==', profile.uid)).then(subs => {
        const map: Record<string, any> = {};
        (subs as any[]).forEach((s: any) => (map[s.assignmentId] = s));
        setSubmissions(map);
      });
    }
    return unsub;
  }, [profile]);

  const openSubmit = (a: any) => { setSelected(a); setTextAnswer(''); setSelectedFile(null); setModal(true); };

  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) setSelectedFile(r.assets[0]);
  };

  const handleSubmit = async () => {
    if (!textAnswer.trim() && !selectedFile) return Alert.alert('Isi jawaban atau upload file');
    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (selectedFile && !USE_MOCK) {
        const blob = await fetch(selectedFile.uri).then(r => r.blob());
        fileUrl = await uploadFile(`submissions/${profile!.uid}/${Date.now()}`, blob);
      }
      if (!USE_MOCK) {
        await addDocument('submissions', {
          assignmentId: selected.id, studentId: profile!.uid,
          textAnswer: textAnswer.trim() || undefined, fileUrl,
          status: 'submitted', submittedAt: Timestamp.now(),
        });
      }
      setSubmissions(s => ({ ...s, [selected.id]: { status: 'submitted' } }));
      setModal(false);
      Alert.alert('Berhasil', 'Tugas berhasil dikumpulkan!');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Tugas</Text>
        <Text style={styles.headerSub}>{assignments.length} tugas aktif</Text>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.gray8} />
            <Text style={styles.emptyTitle}>Belum ada tugas</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sub = submissions[item.id];
          const daysLeft = Math.ceil((item.deadline?.toDate?.().getTime() - Date.now()) / (1000 * 3600 * 24));
          const isLate = daysLeft < 0;
          return (
            <View style={[styles.card, sub && styles.cardDone]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignTitle} numberOfLines={2}>{item.title}</Text>
                  {item.description ? <Text style={styles.assignDesc} numberOfLines={2}>{item.description}</Text> : null}
                </View>
                {sub ? (
                  <Badge label={sub.score != null ? `${sub.score}` : 'Dikumpul'} variant="default" />
                ) : (
                  <View style={[styles.deadlinePill, { backgroundColor: isLate ? Colors.gray2 : daysLeft <= 2 ? Colors.gray4 : Colors.gray11 }]}>
                    <Text style={[styles.deadlineText, { color: isLate || daysLeft <= 2 ? Colors.white : Colors.gray4 }]}>
                      {isLate ? 'Terlambat' : daysLeft === 0 ? 'Hari ini' : `${daysLeft}h`}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.deadline}>
                Deadline: {item.deadline?.toDate?.().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}Maks. {item.maxScore}
              </Text>
              {sub?.feedback ? <Text style={styles.feedback}>"{sub.feedback}"</Text> : null}
              {!sub && !isLate && (
                <TouchableOpacity style={styles.submitBtn} onPress={() => openSubmit(item)} activeOpacity={0.8}>
                  <Ionicons name="cloud-upload-outline" size={16} color={Colors.gray3} />
                  <Text style={styles.submitBtnText}>Kumpulkan</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <BottomSheet visible={modal} onClose={() => setModal(false)}>
        <Text style={styles.sheetTitle} numberOfLines={2}>{selected?.title}</Text>
        <Text style={styles.sheetDesc}>{selected?.description}</Text>

        <Text style={styles.label}>Jawaban Teks</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={textAnswer} onChangeText={setTextAnswer}
          multiline placeholder="Tulis jawaban di sini..." placeholderTextColor={Colors.gray7}
          returnKeyType="done"
        />

        <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
          <Ionicons name="attach-outline" size={20} color={Colors.gray5} />
          <Text style={styles.fileBtnText} numberOfLines={1}>
            {selectedFile ? selectedFile.name : 'Lampirkan File (opsional)'}
          </Text>
        </TouchableOpacity>

        <View style={styles.btns}>
          <Button title="Batal" onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
          <Button title="Kumpulkan" onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.title2, color: Colors.white },
  headerSub: { ...Typography.footnote, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  list: { padding: Spacing.base },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  cardDone: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 6 },
  assignTitle: { ...Typography.headline, color: Colors.black, flex: 1 },
  assignDesc: { ...Typography.footnote, color: Colors.secondaryLabel, marginTop: 3 },
  deadlinePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, minWidth: 48, alignItems: 'center' },
  deadlineText: { ...Typography.caption1, fontWeight: '700' },
  deadline: { ...Typography.caption1, color: Colors.tertiaryLabel },
  feedback: { ...Typography.footnote, color: Colors.secondaryLabel, fontStyle: 'italic', marginTop: 4 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  submitBtnText: { ...Typography.subheadline, color: Colors.gray3, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  sheetTitle: { ...Typography.title3, color: Colors.black, marginBottom: 4 },
  sheetDesc: { ...Typography.footnote, color: Colors.secondaryLabel, marginBottom: Spacing.base },
  label: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
    backgroundColor: Colors.gray11, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.separator, borderStyle: 'dashed',
  },
  fileBtnText: { ...Typography.subheadline, color: Colors.gray5, flex: 1 },
  btns: { flexDirection: 'row', gap: 10, marginTop: Spacing.xl },
});
