import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, Alert, TouchableOpacity, Modal,
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { getCollection, updateDocument, where } from '../../../src/firebase/firestore.service';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';

export default function GradeAssignmentScreen() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getCollection('assignments', where('createdBy', '==', profile.uid))
      .then(setAssignments).finally(() => setLoading(false));
    getCollection('users', where('role', '==', 'STUDENT')).then(data => {
      const map: Record<string, any> = {};
      data.forEach((s: any) => (map[s.uid] = s));
      setStudents(map);
    });
  }, [profile]);

  const loadSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    const subs = await getCollection('submissions', where('assignmentId', '==', assignment.id));
    setSubmissions(subs);
  };

  const openGrading = (sub: any) => {
    setGradingSubmission(sub);
    setScore(sub.score?.toString() ?? '');
    setFeedback(sub.feedback ?? '');
    setModalVisible(true);
  };

  const saveGrade = async () => {
    const s = parseInt(score);
    if (isNaN(s) || s < 0 || s > (selectedAssignment?.maxScore ?? 100)) {
      return Alert.alert('Error', `Nilai harus antara 0-${selectedAssignment?.maxScore ?? 100}`);
    }
    setSaving(true);
    await updateDocument('submissions', gradingSubmission.id, {
      score: s, feedback: feedback.trim(), gradedBy: profile!.uid, status: 'graded',
    });
    setModalVisible(false);
    loadSubmissions(selectedAssignment);
    setSaving(false);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!selectedAssignment) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Pilih Tugas untuk Dinilai</Text>
        <FlatList
          data={assignments}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada tugas</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => loadSubmissions(item)}>
              <Card>
                <Text style={styles.assignTitle}>{item.title}</Text>
                <Text style={styles.assignSub}>
                  Nilai maks: {item.maxScore} | Deadline: {item.deadline?.toDate?.().toLocaleDateString('id-ID') ?? '-'}
                </Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedAssignment(null)} style={styles.backBtn}>
        <Text style={styles.backText}>← Kembali</Text>
      </TouchableOpacity>
      <Text style={styles.header}>{selectedAssignment.title}</Text>
      <Text style={styles.subHeader}>{submissions.length} submission diterima</Text>
      <FlatList
        data={submissions}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada submission</Text>}
        renderItem={({ item }) => {
          const student = students[item.studentId];
          return (
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student?.name ?? item.studentId}</Text>
                  {item.textAnswer && (
                    <Text style={styles.answerPreview} numberOfLines={2}>{item.textAnswer}</Text>
                  )}
                  {item.fileUrl && <Text style={styles.fileLink}>📎 File terlampir</Text>}
                </View>
                <View style={styles.gradeArea}>
                  {item.status === 'graded' ? (
                    <Badge label={`${item.score}`} bg="#059669" />
                  ) : (
                    <Badge label="Belum dinilai" bg="#F59E0B" />
                  )}
                  <TouchableOpacity onPress={() => openGrading(item)} style={styles.gradeBtn}>
                    <Text style={styles.gradeBtnText}>Nilai</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Beri Nilai</Text>
            <Text style={styles.label}>Nilai (maks {selectedAssignment?.maxScore})</Text>
            <TextInput style={styles.input} value={score} onChangeText={setScore}
              keyboardType="numeric" placeholderTextColor="#94A3B8" />
            <Text style={styles.label}>Feedback (opsional)</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={feedback} onChangeText={setFeedback} multiline
              placeholder="Catatan untuk siswa..." placeholderTextColor="#94A3B8" />
            <View style={styles.modalBtns}>
              <Button title="Batal" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Simpan" onPress={saveGrade} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { fontSize: 18, fontWeight: '800', color: '#1E293B', padding: 16, paddingBottom: 4 },
  subHeader: { fontSize: 13, color: '#64748B', paddingHorizontal: 16, marginBottom: 4 },
  backBtn: { padding: 16, paddingBottom: 4 },
  backText: { color: '#4F46E5', fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  answerPreview: { fontSize: 12, color: '#64748B', marginTop: 3 },
  fileLink: { fontSize: 12, color: '#4F46E5', marginTop: 3 },
  gradeArea: { alignItems: 'flex-end', gap: 6 },
  gradeBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  gradeBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
