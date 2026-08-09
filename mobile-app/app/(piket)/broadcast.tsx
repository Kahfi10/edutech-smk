import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { addDocument } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';

export default function BroadcastScreen() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentHistory, setSentHistory] = useState<any[]>([]);

  const ROLES = ['', 'STUDENT', 'TEACHER', 'WALI', 'BK'];
  const ROLE_LABELS: Record<string, string> = {
    '': 'Semua',
    STUDENT: 'Siswa',
    TEACHER: 'Guru Mapel',
    WALI: 'Wali Kelas',
    BK: 'Guru BK',
  };

  const handleBroadcast = async () => {
    if (!title.trim()) return Alert.alert('Perhatian', 'Judul pengumuman wajib diisi.');
    if (!body.trim()) return Alert.alert('Perhatian', 'Isi pengumuman wajib diisi.');

    Alert.alert(
      isUrgent ? 'Kirim Darurat?' : 'Konfirmasi Broadcast',
      `Kirim ke: ${ROLE_LABELS[targetRole] ?? 'Semua'}\n\n"${title}"`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim Sekarang',
          style: isUrgent ? 'destructive' : 'default',
          onPress: async () => {
            setSending(true);
            try {
              const data: any = {
                title: title.trim(),
                body: body.trim(),
                createdBy: profile!.uid,
                isUrgent,
                createdAt: Timestamp.now(),
              };
              if (targetRole) data.targetRole = targetRole;

              await addDocument('announcements', data);
              setSentHistory(h => [{ ...data, id: Date.now().toString() }, ...h]);
              Alert.alert('Berhasil', 'Pengumuman berhasil dikirim ke seluruh sekolah!');
              setTitle(''); setBody(''); setIsUrgent(false); setTargetRole('');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Broadcast Pengumuman</Text>
        <Text style={styles.headerSub}>Kirim pengumuman ke seluruh warga sekolah</Text>
      </View>

      {/* Urgent toggle */}
      <TouchableOpacity
        style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}
        onPress={() => setIsUrgent(!isUrgent)}
      >
        <View style={styles.urgentIconBox}>
          <Ionicons name={isUrgent ? 'alert-circle' : 'notifications-outline'} size={24} color={isUrgent ? Colors.gray1 : Colors.gray5} />
        </View>
        <View>
          <Text style={[styles.urgentLabel, isUrgent && styles.urgentLabelActive]}>
            {isUrgent ? 'MODE DARURAT AKTIF' : 'Pengumuman Biasa'}
          </Text>
          <Text style={styles.urgentSub}>
            {isUrgent ? 'Notifikasi prioritas tinggi ke semua pengguna' : 'Tap untuk aktifkan mode darurat'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Target */}
      <Text style={styles.label}>Kirim Ke</Text>
      <View style={styles.targetRow}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.targetChip, targetRole === r && styles.targetChipActive]}
            onPress={() => setTargetRole(r)}
          >
            <Text style={[styles.targetText, targetRole === r && styles.targetTextActive]}>
              {ROLE_LABELS[r]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Judul Pengumuman *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Contoh: Libur Nasional Hari Kemerdekaan"
        placeholderTextColor="#94A3B8"
      />

      {/* Body */}
      <Text style={styles.label}>Isi Pengumuman *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={5}
        placeholder="Tulis isi pengumuman di sini..."
        placeholderTextColor="#94A3B8"
      />

      <Button
        title={isUrgent ? 'Kirim Darurat Sekarang' : 'Kirim Pengumuman'}
        onPress={handleBroadcast}
        loading={sending}
        fullWidth
        variant={isUrgent ? 'danger' : 'primary'}
        style={{ marginTop: 8 }}
      />

      {/* History */}
      {sentHistory.length > 0 && (
        <>
          <Text style={[styles.label, { marginTop: 20 }]}>Terkirim Hari Ini</Text>
          {sentHistory.map(h => (
            <View key={h.id} style={[styles.histCard, h.isUrgent && styles.histUrgent]}>
              <Text style={styles.histTitle}>{h.title}</Text>
              <Text style={styles.histBody} numberOfLines={1}>{h.body}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  header: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#DDD6FE', marginTop: 2 },
  urgentToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 16,
  },
  urgentToggleActive: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  urgentIconBox: { alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
  urgentLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  urgentLabelActive: { color: '#DC2626' },
  urgentSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  targetChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  targetChipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  targetText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  targetTextActive: { color: '#7C3AED', fontWeight: '700' },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E293B', backgroundColor: '#FFFFFF',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  histCard: {
    backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, marginBottom: 6,
    borderLeftWidth: 3, borderLeftColor: '#7C3AED',
  },
  histUrgent: { borderLeftColor: '#DC2626' },
  histTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  histBody: { fontSize: 12, color: '#64748B', marginTop: 2 },
});
