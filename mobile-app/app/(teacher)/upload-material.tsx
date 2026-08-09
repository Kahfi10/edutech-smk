import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  Alert, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/context/AuthContext';
import { uploadFile } from '../../src/firebase/storage.service';
import { addDocument, getCollection, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function UploadMaterialScreen() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'pdf' | 'video'>('pdf');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    // Load subjects & classes
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(setSubjects);
    getCollection('classes').then(setClasses);
    getCollection('materials', where('uploadedBy', '==', profile.uid)).then(data =>
      setRecentMaterials(data.slice(0, 5))
    );
  }, [profile]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'pdf' ? 'application/pdf' : 'video/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal memilih file.');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) return Alert.alert('Perhatian', 'Judul materi wajib diisi.');
    if (!subjectId) return Alert.alert('Perhatian', 'Pilih mata pelajaran.');
    if (!classId) return Alert.alert('Perhatian', 'Pilih kelas.');
    if (!selectedFile) return Alert.alert('Perhatian', 'Pilih file terlebih dahulu.');

    setLoading(true);
    try {
      const fileBlob = await fetch(selectedFile.uri).then(r => r.blob());
      const path = `materials/${profile!.uid}/${Date.now()}_${selectedFile.name}`;
      const fileUrl = await uploadFile(path, fileBlob, setUploadProgress);

      await addDocument('materials', {
        title: title.trim(),
        description: description.trim(),
        type,
        fileUrl,
        subjectId,
        classId,
        uploadedBy: profile!.uid,
      });

      Alert.alert('Berhasil', 'Materi berhasil diupload!');
      setTitle(''); setDescription(''); setSelectedFile(null); setUploadProgress(0);
      getCollection('materials', where('uploadedBy', '==', profile!.uid)).then(data =>
        setRecentMaterials(data.slice(0, 5))
      );
    } catch (err: any) {
      Alert.alert('Error', 'Gagal upload: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Upload Materi Baru">
        {/* Tipe Materi */}
        <Text style={styles.label}>Tipe Materi</Text>
        <View style={styles.typeRow}>
          {(['pdf', 'video'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                {t === 'pdf' ? 'PDF' : 'Video'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Judul */}
        <Text style={styles.label}>Judul Materi *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Contoh: Pengenalan HTML"
          placeholderTextColor="#94A3B8"
        />

        {/* Deskripsi */}
        <Text style={styles.label}>Deskripsi</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Deskripsi singkat materi..."
          multiline
          numberOfLines={3}
          placeholderTextColor="#94A3B8"
        />

        {/* Mata Pelajaran */}
        <Text style={styles.label}>Mata Pelajaran *</Text>
        <View style={styles.pickerRow}>
          {subjects.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chipBtn, subjectId === s.id && styles.chipBtnActive]}
              onPress={() => setSubjectId(s.id)}
            >
              <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
          {subjects.length === 0 && <Text style={styles.emptyText}>Belum ada mata pelajaran</Text>}
        </View>

        {/* Kelas */}
        <Text style={styles.label}>Kelas *</Text>
        <View style={styles.pickerRow}>
          {classes.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chipBtn, classId === c.id && styles.chipBtnActive]}
              onPress={() => setClassId(c.id)}
            >
              <Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* File Picker */}
        <TouchableOpacity style={styles.filePickerBtn} onPress={pickFile}>
          <Text style={styles.filePickerText}>
            {selectedFile ? selectedFile.name : `Pilih File ${type.toUpperCase()}`}
          </Text>
        </TouchableOpacity>

        {/* Progress */}
        {loading && uploadProgress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        )}

        <Button
          title="Upload Materi"
          onPress={handleUpload}
          loading={loading}
          fullWidth
          variant="secondary"
          style={{ marginTop: 8 }}
        />
      </Card>

      {/* Recent */}
      <Text style={styles.sectionTitle}>Materi Terbaru</Text>
      {recentMaterials.map(m => (
        <Card key={m.id}>
          <View style={styles.materialRow}>
            <Ionicons name={m.type === 'pdf' ? 'document-text-outline' : 'play-circle-outline'} size={28} color="#64748B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.materialTitle}>{m.title}</Text>
              <Text style={styles.materialSub}>{m.type.toUpperCase()}</Text>
            </View>
          </View>
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
  textArea: { height: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5,
    borderColor: '#E2E8F0', alignItems: 'center',
  },
  typeBtnActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  typeText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  typeTextActive: { color: '#059669' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipBtnActive: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  chipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#059669', fontWeight: '700' },
  filePickerBtn: {
    borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 12, backgroundColor: '#F8FAFC',
  },
  filePickerText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: '#059669', borderRadius: 3 },
  emptyText: { fontSize: 13, color: '#94A3B8' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginVertical: 12 },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  materialIcon: { fontSize: 28 },
  materialTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  materialSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
