import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeCollection, getCollection, setDocument, updateDocument, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Timestamp } from 'firebase/firestore';

const EVENT_TYPES = [
  { key: 'terlambat', label: 'Terlambat',   color: '#D97706', bg: '#FFFBEB' },
  { key: 'izin_pulang', label: 'Izin Pulang', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'kejadian', label: 'Kejadian',     color: '#DC2626', bg: '#FEF2F2' },
] as const;

export default function DailyLogScreen() {
  const { profile } = useAuth();
  const [todayLog, setTodayLog] = useState<any>(null);
  const [logId, setLogId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [eventType, setEventType] = useState<string>('terlambat');
  const [studentNis, setStudentNis] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    const id = `${today}_${profile.uid}`;
    setLogId(id);

    const unsub = subscribeCollection(
      'piket_logs',
      (data) => {
        const found = data.find((l: any) => l.date === today && l.piketTeacherId === profile.uid);
        setTodayLog(found ?? null);
      }
    );

    getCollection('users', where('role', '==', 'STUDENT')).then(setStudents);

    return unsub;
  }, [profile]);

  const addEvent = async () => {
    if (!description.trim()) return Alert.alert('Perhatian', 'Deskripsi wajib diisi.');
    setSaving(true);
    try {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const studentId = students.find((s: any) => s.nis === studentNis.trim())?.uid ?? studentNis;

      const newEvent = { studentId, type: eventType, description: description.trim(), time: now };

      if (!todayLog) {
        await setDocument('piket_logs', logId, {
          date: today,
          piketTeacherId: profile!.uid,
          events: [newEvent],
          createdAt: Timestamp.now(),
        });
      } else {
        await updateDocument('piket_logs', logId, {
          events: [...(todayLog.events ?? []), newEvent],
        });
      }

      setModalVisible(false);
      setDescription(''); setStudentNis('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const events = todayLog?.events ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>Buku Piket Digital</Text>
          <Text style={styles.topDate}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Catat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada kejadian hari ini</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const et = EVENT_TYPES.find(e => e.key === item.type);
          return (
            <View style={styles.eventCard}>
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Badge label={et?.label ?? item.type} bg={et?.bg ?? '#F1F5F9'} color={et?.color ?? '#64748B'} style={{ marginBottom: 4 }} />
                <Text style={styles.eventDesc}>{item.description}</Text>
                {item.studentId && <Text style={styles.eventNis}>ID: {item.studentId}</Text>}
              </View>
            </View>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Catat Kejadian</Text>

            <Text style={styles.label}>Tipe Kejadian</Text>
            <View style={styles.typeRow}>
              {EVENT_TYPES.map(et => (
                <TouchableOpacity
                  key={et.key}
                  style={[styles.typeBtn, eventType === et.key && { backgroundColor: et.bg, borderColor: et.color }]}
                  onPress={() => setEventType(et.key)}
                >
                  <Text style={[styles.typeBtnText, eventType === et.key && { color: et.color }]}>{et.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>NIS Siswa (opsional)</Text>
            <TextInput style={styles.input} value={studentNis} onChangeText={setStudentNis}
              placeholder="Masukkan NIS siswa" keyboardType="numeric" placeholderTextColor="#94A3B8" />

            <Text style={styles.label}>Keterangan *</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={description} onChangeText={setDescription}
              multiline placeholder="Jelaskan kejadian..." placeholderTextColor="#94A3B8" />

            <View style={styles.btns}>
              <Button title="Batal" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Simpan" onPress={addEvent} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#7C3AED' },
  topTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  topDate: { fontSize: 11, color: '#DDD6FE', marginTop: 2 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  list: { padding: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
  eventCard: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  timeCol: { width: 48, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  timeText: { fontSize: 12, fontWeight: '800', color: '#7C3AED' },
  eventDesc: { fontSize: 13, color: '#1E293B' },
  eventNis: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  btns: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
