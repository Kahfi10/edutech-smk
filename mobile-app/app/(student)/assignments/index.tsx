import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal,
  TextInput, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, addDocument, subscribeCollection, where } from '../../../src/firebase/firestore.service';
import { uploadFile } from '../../../src/firebase/storage.service';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Timestamp } from 'firebase/firestore';

export default function AssignmentsScreen() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!profile?.classId) return;
    const unsub = subscribeCollection(
      'assignments',
      (data) => {
        const now = new Date();
        setAssignments(data.sort((a: any, b: any) => a.deadline?.toDate?.() - b.deadline?.toDate?.()));
        setLoading(false);
      },
      where('classId', '==', profile.classId)
    );

    getCollection('submissions', where('studentId', '==', profile.uid)).then(subs => {
      const map: Record<string, any> = {};
      subs.forEach((s: any) => (map[s.assignmentId] = s));
      setSubmissions(map);
    });

    return unsub;
  }, [profile]);

  const openSubmit = (assignment: any) => {
    setSelected(assignment);
    setTextAnswer('');
    setSelectedFile(null);
    setModalVisible(true);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) setSelectedFile(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!textAnswer.trim() && !selectedFile) {
      return Alert.alert('Perhatian', 'Isi jawaban teks atau upload file.');
    }
    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (selectedFile) {
        const blob = await fetch(selectedFile.uri).then(r => r.blob());
        const path = `submissions/${profile!.uid}/${Date.now()}_${selectedFile.name}`;
        fileUrl = await uploadFile(path, blob, setUploadProgress);
      }

      await addDocument('submissions', {
        assignmentId: selected.id,
        studentId: profile!.uid,
        textAnswer: textAnswer.trim() || undefined,
        fileUrl,
        status: 'submitted',
        submittedAt: Timestamp.now(),
      });

      setSubmissions(s => ({ ...s, [selected.id]: { status: 'submitted' } }));
      setModalVisible(false);
      Alert.alert('Berhasil', 'Tugas berhasil dikumpulkan!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={assignments}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada tugas</Text>}
        renderItem={({ item }) => {
          const sub = submissions[item.id];
          const daysLeft = Math.ceil((item.deadline?.toDate?.().getTime() - Date.now()) / (1000 * 3600 * 24));
          const isLate = daysLeft < 0;
          return (
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.assignTitle} numberOfLines={2}>{item.title}</Text>
                {sub ? (
                  <Badge label={sub.score != null ? `${sub.score}` : 'Dikumpul'} bg={sub.score != null ? '#059669' : '#4F46E5'} />
                ) : (
                  <Badge label={isLate ? 'Terlambat' : `${daysLeft}h lagi`} bg={isLate ? '#DC2626' : daysLeft <= 2 ? '#D97706' : '#E2E8F0'} color={isLate || daysLeft <= 2 ? '#FFFFFF' : '#64748B'} />
                )}
              </View>
              {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
              <Text style={styles.deadline}>
                Deadline: {item.deadline?.toDate?.().toLocaleDateString('id-ID')} | Nilai maks: {item.maxScore}
              </Text>
              {sub?.feedback ? <Text style={styles.feedback}>Feedback: {sub.feedback}</Text> : null}
              {!sub && !isLate && (
                <TouchableOpacity onPress={() => openSubmit(item)} style={styles.submitBtn}>
                  <Text style={styles.submitBtnText}>Kumpulkan Tugas</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalDesc}>{selected?.description}</Text>

            <Text style={styles.label}>Jawaban Teks (opsional)</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={textAnswer} onChangeText={setTextAnswer}
              multiline placeholder="Tulis jawaban di sini..." placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
              <Text style={styles.fileBtnText}>
                {selectedFile ? selectedFile.name : 'Upload File (opsional)'}
              </Text>
            </TouchableOpacity>

            {submitting && uploadProgress > 0 && (
              <View style={styles.progBar}>
                <View style={[styles.progFill, { width: `${uploadProgress}%` }]} />
              </View>
            )}

            <View style={styles.btns}>
              <Button title="Batal" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Kumpulkan" onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  assignTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B' },
  desc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  deadline: { fontSize: 12, color: '#94A3B8', marginTop: 6 },
  feedback: { fontSize: 12, color: '#059669', marginTop: 4, fontStyle: 'italic' },
  submitBtn: { marginTop: 10, backgroundColor: '#EEF2FF', borderRadius: 8, padding: 10, alignItems: 'center' },
  submitBtnText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  modalDesc: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  fileBtn: {
    borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
    borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10,
  },
  fileBtnText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  progBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 6 },
  progFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 2 },
  btns: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
