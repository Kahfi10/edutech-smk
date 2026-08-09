import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/context/AuthContext';
import { uploadFile } from '../../src/firebase/storage.service';
import { addDocument, getCollection, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { USE_MOCK } from '../../src/constants/mockData';

export default function UploadMaterialScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [desc, setDesc]   = useState('');
  const [type, setType]   = useState<'pdf' | 'video'>('pdf');
  const [file, setFile]   = useState<any>(null);
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId]     = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses]   = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [recent, setRecent]     = useState<any[]>([]);

  const loadData = () => {
    if (!profile || USE_MOCK) return;
    getCollection('subjects', where('teacherId', '==', profile.uid)).then(setSubjects);
    getCollection('classes').then(setClasses);
    getCollection('materials', where('uploadedBy', '==', profile.uid))
      .then(d => setRecent((d as any[]).slice(0, 6)));
  };

  useEffect(() => { loadData(); }, [profile]);

  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: type === 'pdf' ? 'application/pdf' : 'video/*',
      copyToCacheDirectory: true,
    });
    if (!r.canceled && r.assets?.[0]) setFile(r.assets[0]);
  };

  const handleUpload = async () => {
    if (!title.trim()) return Alert.alert('Judul materi wajib diisi');
    if (!USE_MOCK && !subjectId) return Alert.alert('Pilih mata pelajaran');
    if (!USE_MOCK && !classId)   return Alert.alert('Pilih kelas');
    if (!file) return Alert.alert('Pilih file terlebih dahulu');
    setLoading(true);
    try {
      let fileUrl = 'https://example.com/demo-file';
      if (!USE_MOCK) {
        const blob = await fetch(file.uri).then(r => r.blob());
        fileUrl = await uploadFile(`materials/${profile!.uid}/${Date.now()}_${file.name}`, blob, setProgress);
        await addDocument('materials', {
          title: title.trim(), description: desc.trim(), type, fileUrl,
          subjectId, classId, uploadedBy: profile!.uid,
        });
      }
      Alert.alert('Berhasil', USE_MOCK ? 'Upload disimulasikan (Mock Mode)' : 'Materi berhasil diupload!');
      setTitle(''); setDesc(''); setFile(null); setProgress(0);
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Upload Materi</Text>

      {/* Tipe */}
      <Text style={styles.label}>Tipe File</Text>
      <View style={styles.typeRow}>
        {(['pdf', 'video'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, type === t && styles.typeBtnActive]}
            onPress={() => setType(t)}
          >
            <Ionicons
              name={t === 'pdf' ? 'document-text-outline' : 'play-circle-outline'}
              size={20}
              color={type === t ? Colors.white : Colors.gray5}
            />
            <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Judul Materi</Text>
      <TextInput
        style={styles.input} value={title} onChangeText={setTitle}
        placeholder="Contoh: Pengenalan HTML & CSS" placeholderTextColor={Colors.gray7}
      />

      {/* Desc */}
      <Text style={styles.label}>Deskripsi</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        value={desc} onChangeText={setDesc}
        placeholder="Deskripsi singkat materi..." multiline placeholderTextColor={Colors.gray7}
      />

      {/* Mapel & Kelas — skip di mock */}
      {!USE_MOCK && subjects.length > 0 && (
        <>
          <Text style={styles.label}>Mata Pelajaran</Text>
          <View style={styles.chipRow}>
            {subjects.map(s => (
              <TouchableOpacity key={s.id} style={[styles.chip, subjectId === s.id && styles.chipActive]} onPress={() => setSubjectId(s.id)}>
                <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Kelas</Text>
          <View style={styles.chipRow}>
            {classes.map(c => (
              <TouchableOpacity key={c.id} style={[styles.chip, classId === c.id && styles.chipActive]} onPress={() => setClassId(c.id)}>
                <Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* File picker */}
      <Text style={styles.label}>File</Text>
      <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
        <Ionicons name="attach-outline" size={24} color={file ? Colors.black : Colors.gray6} />
        <Text style={[styles.filePickerText, file && { color: Colors.black }]} numberOfLines={1}>
          {file ? file.name : `Pilih file ${type.toUpperCase()}`}
        </Text>
        {file && <Ionicons name="checkmark-circle" size={20} color={Colors.gray3} />}
      </TouchableOpacity>

      {/* Progress */}
      {loading && progress > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
      )}

      <Button
        title="Upload Materi"
        onPress={handleUpload}
        loading={loading}
        fullWidth
        style={{ marginTop: Spacing.xl }}
      />

      {/* Recent */}
      {recent.length > 0 && (
        <>
          <Text style={[styles.label, { marginTop: Spacing.xxl }]}>Materi Terbaru</Text>
          {recent.map(m => (
            <View key={m.id} style={styles.recentCard}>
              <Ionicons
                name={m.type === 'pdf' ? 'document-text-outline' : 'play-circle-outline'}
                size={24} color={Colors.gray5}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle} numberOfLines={1}>{m.title}</Text>
                <Text style={styles.recentType}>{m.type?.toUpperCase()}</Text>
              </View>
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
  label: { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: Spacing.base, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.gray11, borderWidth: 1.5, borderColor: Colors.separator,
  },
  typeBtnActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  typeBtnText: { ...Typography.subheadline, color: Colors.gray5, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.white },
  input: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.black,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.gray11, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { ...Typography.footnote, color: Colors.secondaryLabel },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.base,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.separator, borderStyle: 'dashed',
    ...Shadow.xs,
  },
  filePickerText: { ...Typography.body, color: Colors.gray6, flex: 1 },
  progressBar: { height: 4, backgroundColor: Colors.gray10, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.black, borderRadius: 2 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, marginBottom: 8,
  },
  recentTitle: { ...Typography.subheadline, color: Colors.black, fontWeight: '500' },
  recentType: { ...Typography.caption2, color: Colors.tertiaryLabel, marginTop: 2, fontWeight: '600' },
});
